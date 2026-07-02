import type { ApiConfig } from "../../config/env";

// Client léger de l'API Reporting Matomo (server-to-server). Le token_auth est envoyé en
// POST (jamais exposé au navigateur). Tout appel est borné par un timeout et échoue en
// douceur (retourne null) : une panne Matomo ne casse jamais le tableau de bord CRM.

export type NamedValue = { name: string; value: number };
export type TrafficSummary = {
  configured: boolean;
  visitorsToday: number | null;
  visits: number | null;
  uniqueVisitors: number | null;
  pageviews: number | null;
  avgTimeSeconds: number | null;
  bounceRate: number | null;
  sources: NamedValue[];
  devices: NamedValue[];
  topPages: NamedValue[];
  trend: Array<{ label: string; visits: number }>;
};

export function matomoConfigured(config: ApiConfig): boolean {
  return Boolean(config.MATOMO_URL && config.MATOMO_SITE_ID && config.MATOMO_API_TOKEN);
}

async function matomoApi(config: ApiConfig, method: string, params: Record<string, string | number>): Promise<unknown> {
  const base = (config.MATOMO_URL ?? "").replace(/\/+$/, "");
  const url = new URL(`${base}/index.php`);
  url.searchParams.set("module", "API");
  url.searchParams.set("method", method);
  url.searchParams.set("idSite", String(config.MATOMO_SITE_ID));
  url.searchParams.set("format", "JSON");
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token_auth: String(config.MATOMO_API_TOKEN) }).toString(),
      signal: controller.signal
    });
    if (!response.ok) return null;
    const json = (await response.json()) as unknown;
    // Matomo signale ses erreurs par { result: "error", message } avec un HTTP 200.
    if (json && typeof json === "object" && (json as { result?: string }).result === "error") return null;
    return json;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function toNumber(value: unknown): number | null {
  const n = typeof value === "string" ? Number(value) : typeof value === "number" ? value : NaN;
  return Number.isFinite(n) ? n : null;
}

/** Convertit une réponse Matomo tabulaire [{label, nb_visits}] en NamedValue triés. */
function toNamedValues(raw: unknown, limit = 8): NamedValue[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      const r = row as Record<string, unknown>;
      const value = toNumber(r.nb_visits) ?? toNumber(r.nb_hits) ?? toNumber(r.nb_actions) ?? 0;
      return { name: String(r.label ?? "—"), value };
    })
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

/** Agrège les indicateurs de trafic sur `days` jours. Résilient : chaque bloc peut être null. */
export async function getMatomoTraffic(config: ApiConfig, days: number): Promise<TrafficSummary> {
  if (!matomoConfigured(config)) {
    return {
      configured: false,
      visitorsToday: null,
      visits: null,
      uniqueVisitors: null,
      pageviews: null,
      avgTimeSeconds: null,
      bounceRate: null,
      sources: [],
      devices: [],
      topPages: [],
      trend: []
    };
  }

  const range = `last${days}`;
  const [summary, today, actions, referrers, devices, pages, trendRaw] = await Promise.all([
    matomoApi(config, "VisitsSummary.get", { period: "range", date: range }),
    matomoApi(config, "VisitsSummary.get", { period: "day", date: "today" }),
    matomoApi(config, "Actions.get", { period: "range", date: range }),
    matomoApi(config, "Referrers.getReferrerType", { period: "range", date: range, filter_limit: 8 }),
    matomoApi(config, "DevicesDetection.getType", { period: "range", date: range, filter_limit: 6 }),
    matomoApi(config, "Actions.getPageUrls", { period: "range", date: range, filter_limit: 8, flat: 1 }),
    matomoApi(config, "VisitsSummary.get", { period: "day", date: range })
  ]);

  const s = (summary ?? {}) as Record<string, unknown>;
  const t = (today ?? {}) as Record<string, unknown>;
  const a = (actions ?? {}) as Record<string, unknown>;

  const trend: Array<{ label: string; visits: number }> = [];
  if (trendRaw && typeof trendRaw === "object" && !Array.isArray(trendRaw)) {
    for (const [date, row] of Object.entries(trendRaw as Record<string, unknown>)) {
      const visits = row && typeof row === "object" ? toNumber((row as Record<string, unknown>).nb_visits) ?? 0 : 0;
      trend.push({ label: date.slice(5), visits }); // "MM-DD"
    }
  }

  return {
    configured: true,
    visitorsToday: toNumber(t.nb_uniq_visitors) ?? toNumber(t.nb_visits),
    visits: toNumber(s.nb_visits),
    uniqueVisitors: toNumber(s.nb_uniq_visitors),
    pageviews: toNumber(a.nb_pageviews),
    avgTimeSeconds: toNumber(s.avg_time_on_site),
    bounceRate: toNumber((s.bounce_rate as string | undefined)?.toString().replace("%", "")),
    sources: toNamedValues(referrers),
    devices: toNamedValues(devices, 6),
    topPages: toNamedValues(pages, 8),
    trend
  };
}
