"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  Activity,
  BarChart3,
  Eye,
  Info,
  MessageSquare,
  MousePointerClick,
  Timer,
  TrendingUp,
  UserPlus,
  Users
} from "lucide-react";
import { Card, KpiCard, SectionHeader, Skeleton } from "@/components/crm/ui";

const AreaTrendChart = dynamic(() => import("./dashboard/charts").then((m) => m.AreaTrendChart), {
  ssr: false,
  loading: () => <Skeleton className="h-[240px] w-full" />
});
const DonutChart = dynamic(() => import("./dashboard/charts").then((m) => m.DonutChart), {
  ssr: false,
  loading: () => <Skeleton className="mx-auto h-[200px] w-[200px] rounded-full" />
});

type NamedValue = { name: string; value: number };
type AnalyticsData = {
  range: { days: number };
  attribution: {
    totalLeads: number;
    inscrits: number;
    bySource: NamedValue[];
    byChannel: NamedValue[];
    byUtmSource: NamedValue[];
    byUtmCampaign: NamedValue[];
    byFormation: NamedValue[];
    topLandingPages: NamedValue[];
    leadsTrend: Array<{ label: string; leads: number }>;
  };
  funnel: {
    leads: number;
    rdv: number;
    inscrits: number;
    leadToRdvRate: number | null;
    rdvToInscritRate: number | null;
  };
  traffic: {
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
  matomoConfigured: boolean;
};

const RANGES = [
  { days: 7, label: "7 jours" },
  { days: 30, label: "30 jours" },
  { days: 90, label: "90 jours" }
];

const DONUT_COLORS = ["#08AEB8", "#6366f1", "#f59e0b", "#10b981", "#f43f5e", "#38bdf8", "#a855f7", "#94a3b8"];

function fmt(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("fr-FR").format(value);
}

function fmtDuration(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}min ${s.toString().padStart(2, "0")}s`;
}

function toDonut(items: NamedValue[]) {
  return items.slice(0, 8).map((item, index) => ({ ...item, color: DONUT_COLORS[index % DONUT_COLORS.length] }));
}

/** Petite liste classée avec barre de proportion (sources, canaux, pages…). */
function BarList({ items, emptyLabel }: { items: NamedValue[]; emptyLabel: string }) {
  if (!items.length) return <p className="py-6 text-center text-sm text-loden-muted">{emptyLabel}</p>;
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item.name}>
          <div className="mb-1 flex items-center justify-between gap-3 text-sm">
            <span className="truncate text-loden-ink">{item.name}</span>
            <span className="shrink-0 font-semibold text-loden-ink">{fmt(item.value)}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-loden-500" style={{ width: `${Math.max(4, (item.value / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function TrafficAnalytics() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (rangeDays: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/analytics?days=${rangeDays}`, { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as { data?: AnalyticsData; error?: { message?: string } } | null;
      if (!response.ok) throw new Error(payload?.error?.message ?? "Chargement impossible.");
      setData(payload?.data ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chargement impossible.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(days);
  }, [days, load]);

  const traffic = data?.traffic;
  const attribution = data?.attribution;
  const funnel = data?.funnel;
  const matomoOn = Boolean(data?.matomoConfigured && traffic?.configured);

  const conversionRate = useMemo(() => {
    if (!funnel || funnel.leads === 0) return null;
    return Math.round((funnel.inscrits / funnel.leads) * 100);
  }, [funnel]);

  const trafficTrend = useMemo(
    () => (traffic?.trend ?? []).map((point) => ({ label: point.label, visites: point.visits })),
    [traffic]
  );
  const leadsTrend = useMemo(
    () => (attribution?.leadsTrend ?? []).map((point) => ({ label: point.label, prospects: point.leads })),
    [attribution]
  );

  return (
    <div className="space-y-6">
      {/* Sélecteur de période */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-loden-muted">Période :</span>
        {RANGES.map((range) => (
          <button
            key={range.days}
            type="button"
            onClick={() => setDays(range.days)}
            className={`focus-ring rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
              days === range.days ? "bg-loden-700 text-white" : "bg-white text-loden-muted ring-1 ring-slate-200 hover:text-loden-ink"
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>

      {error ? (
        <Card className="border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-700">{error}</p>
        </Card>
      ) : null}

      {!matomoOn && !loading ? (
        <Card className="flex items-start gap-3 border-amber-200 bg-amber-50 p-4">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
          <div className="text-sm text-amber-900">
            <p className="font-semibold">Mesure d&apos;audience Matomo non connectée</p>
            <p className="mt-1 text-amber-800">
              Les indicateurs de trafic (visiteurs, sources, pages) apparaîtront ici une fois Matomo configuré
              (variables <code className="rounded bg-amber-100 px-1">MATOMO_URL</code>,{" "}
              <code className="rounded bg-amber-100 px-1">MATOMO_SITE_ID</code>,{" "}
              <code className="rounded bg-amber-100 px-1">MATOMO_API_TOKEN</code>). En attendant, les statistiques de
              prospection et de conversion ci-dessous sont pleinement opérationnelles.
            </p>
          </div>
        </Card>
      ) : null}

      {/* Cartes KPI */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Users} accent="brand" loading={loading} label="Visiteurs aujourd'hui" value={fmt(traffic?.visitorsToday)} />
        <KpiCard
          icon={Users}
          accent="sky"
          loading={loading}
          label={`Visiteurs (${days} j)`}
          value={fmt(traffic?.uniqueVisitors)}
          subLabel={traffic?.visits != null ? `${fmt(traffic.visits)} visites` : undefined}
        />
        <KpiCard icon={Eye} accent="indigo" loading={loading} label="Pages vues" value={fmt(traffic?.pageviews)} />
        <KpiCard icon={Timer} accent="amber" loading={loading} label="Temps moyen" value={fmtDuration(traffic?.avgTimeSeconds ?? null)} />
        <KpiCard icon={UserPlus} accent="emerald" loading={loading} label="Prospects générés" value={fmt(attribution?.totalLeads)} />
        <KpiCard icon={MessageSquare} accent="sky" loading={loading} label="RDV pris" value={fmt(funnel?.rdv)} />
        <KpiCard icon={Activity} accent="brand" loading={loading} label="Inscrits" value={fmt(funnel?.inscrits)} />
        <KpiCard
          icon={TrendingUp}
          accent="rose"
          loading={loading}
          label="Taux de conversion"
          value={conversionRate != null ? `${conversionRate}%` : "—"}
          subLabel="Inscrits / prospects"
        />
      </div>

      {/* Graphiques d'évolution */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4 md:p-5">
          <SectionHeader title="Évolution du trafic" subtitle="Visites par jour" icon={TrendingUp} />
          <div className="mt-4">
            {loading ? (
              <Skeleton className="h-[240px] w-full" />
            ) : matomoOn && trafficTrend.length ? (
              <AreaTrendChart data={trafficTrend} series={[{ key: "visites", name: "Visites", color: "#08AEB8" }]} />
            ) : (
              <p className="py-16 text-center text-sm text-loden-muted">Données de trafic disponibles après connexion de Matomo.</p>
            )}
          </div>
        </Card>

        <Card className="p-4 md:p-5">
          <SectionHeader title="Prospects générés" subtitle="Nouveaux prospects par jour" icon={UserPlus} />
          <div className="mt-4">
            {loading ? (
              <Skeleton className="h-[240px] w-full" />
            ) : (
              <AreaTrendChart data={leadsTrend} series={[{ key: "prospects", name: "Prospects", color: "#6366f1" }]} />
            )}
          </div>
        </Card>
      </div>

      {/* Sources & canaux */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4 md:p-5">
          <SectionHeader title="Sources de trafic" subtitle="D'où viennent les visiteurs" icon={BarChart3} />
          <div className="mt-4">
            {loading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : matomoOn && traffic?.sources.length ? (
              <DonutChart
                data={toDonut(traffic.sources)}
                total={traffic.sources.reduce((sum, s) => sum + s.value, 0)}
                centerLabel="visites"
              />
            ) : (
              <BarList items={attribution?.bySource ?? []} emptyLabel="Aucun prospect sur la période." />
            )}
          </div>
        </Card>

        <Card className="p-4 md:p-5">
          <SectionHeader title="Conversions par canal" subtitle="Prospects générés par canal" icon={MousePointerClick} />
          <div className="mt-4">
            {loading ? <Skeleton className="h-[200px] w-full" /> : <BarList items={attribution?.byChannel ?? []} emptyLabel="Aucun prospect sur la période." />}
          </div>
        </Card>
      </div>

      {/* Pages, formations, appareils */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-4 md:p-5">
          <SectionHeader title="Pages les plus visitées" icon={Eye} />
          <div className="mt-4">
            {loading ? (
              <Skeleton className="h-[180px] w-full" />
            ) : matomoOn ? (
              <BarList items={traffic?.topPages ?? []} emptyLabel="Données disponibles après connexion de Matomo." />
            ) : (
              <BarList items={attribution?.topLandingPages ?? []} emptyLabel="Aucune page d'entrée enregistrée." />
            )}
          </div>
        </Card>

        <Card className="p-4 md:p-5">
          <SectionHeader title="Prospects par formation" icon={UserPlus} />
          <div className="mt-4">
            {loading ? <Skeleton className="h-[180px] w-full" /> : <BarList items={attribution?.byFormation ?? []} emptyLabel="Aucun prospect sur la période." />}
          </div>
        </Card>

        <Card className="p-4 md:p-5">
          <SectionHeader title="Appareils" icon={Activity} />
          <div className="mt-4">
            {loading ? (
              <Skeleton className="h-[180px] w-full" />
            ) : matomoOn ? (
              <BarList items={traffic?.devices ?? []} emptyLabel="Données disponibles après connexion de Matomo." />
            ) : (
              <p className="py-10 text-center text-sm text-loden-muted">Type d&apos;appareil disponible après connexion de Matomo.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
