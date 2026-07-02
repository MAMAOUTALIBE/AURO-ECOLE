"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BellRing, CalendarClock, Check, Clock, Sparkles, Target, Zap } from "lucide-react";
import { ACTIVE_AGENCY_KEY } from "@/components/AgencySwitcher";
import { Badge, Card, EmptyState, KpiCard, SectionHeader, Skeleton, type BadgeVariant } from "@/components/crm/ui";

type Lead = {
  id: string;
  fullName: string;
  email: string;
  status: string;
  interest?: string | null;
  temperature?: string | null;
  estimatedValueCents?: number | null;
  nextFollowUpAt?: string | null;
};

type Suggestion = {
  leadId: string;
  fullName: string;
  reason: string;
  temperature?: string | null;
  interest?: string | null;
  daysInactive: number;
};

const TEMP_VARIANT: Record<string, BadgeVariant> = { chaud: "danger", tiede: "warning", froid: "info" };
const TEMP_LABEL: Record<string, string> = { chaud: "🔥 Chaud", tiede: "🌤 Tiède", froid: "❄️ Froid" };
const DAY = 86_400_000;

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}
function euros(cents?: number | null) {
  if (!cents) return null;
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(cents / 100);
}

export function RelancesManager() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [tab, setTab] = useState<"due" | "upcoming" | "all">("due");

  const load = () => {
    setLoading(true);
    const agency = window.localStorage.getItem(ACTIVE_AGENCY_KEY);
    const q = agency && agency !== "all" ? `?agencyId=${encodeURIComponent(agency)}` : "";
    Promise.all([
      fetch(`/api/leads${q}`).then((r) => r.json()).catch(() => null),
      fetch(`/api/admin/cockpit${q}`).then((r) => r.json()).catch(() => null)
    ])
      .then(([leadsRes, cockpitRes]) => {
        if (Array.isArray(leadsRes?.data)) setLeads(leadsRes.data as Lead[]);
        else setError(leadsRes?.error?.message ?? "Chargement des relances impossible.");
        if (Array.isArray(cockpitRes?.data?.relanceSuggestions)) setSuggestions(cockpitRes.data.relanceSuggestions as Suggestion[]);
      })
      .catch(() => setError("Le service LODENE est momentanément indisponible."))
      .finally(() => setLoading(false));
  };

  // Planifie une relance immédiate sur un lead détecté (passe en RELANCE + échéance aujourd'hui).
  const createRelance = async (leadId: string) => {
    setBusy(leadId);
    setError(null);
    try {
      const response = await fetch(`/api/leads/${leadId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "RELANCE", nextFollowUpAt: new Date().toISOString() })
      });
      if (!response.ok) throw new Error();
      load();
    } catch {
      setError("Création de la relance impossible.");
    } finally {
      setBusy(null);
    }
  };

  useEffect(load, []);

  // À relancer = un suivi est planifié, OU le lead est à l'étape RELANCE.
  const toFollow = useMemo(
    () => leads.filter((l) => l.nextFollowUpAt || l.status === "RELANCE"),
    [leads]
  );
  const isDue = (l: Lead) => !!l.nextFollowUpAt && new Date(l.nextFollowUpAt).getTime() <= Date.now();
  const due = toFollow.filter(isDue);
  const upcoming = toFollow.filter((l) => !isDue(l));
  const visible = tab === "due" ? due : tab === "upcoming" ? upcoming : toFollow;
  const sorted = [...visible].sort((a, b) => (a.nextFollowUpAt ?? "").localeCompare(b.nextFollowUpAt ?? ""));

  const patch = async (lead: Lead, body: { status?: string; nextFollowUpAt?: string }) => {
    setBusy(lead.id);
    setError(null);
    try {
      const response = await fetch(`/api/leads/${lead.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: body.status ?? lead.status, ...(body.nextFollowUpAt ? { nextFollowUpAt: body.nextFollowUpAt } : {}) })
      });
      if (!response.ok) throw new Error();
      load();
    } catch {
      setError("Mise à jour de la relance impossible.");
    } finally {
      setBusy(null);
    }
  };

  const snooze = (lead: Lead) => patch(lead, { nextFollowUpAt: new Date(Date.now() + 7 * DAY).toISOString() });
  const done = (lead: Lead) => patch(lead, { status: "CONTACTE", nextFollowUpAt: new Date(Date.now() + 30 * DAY).toISOString() });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard icon={BellRing} label="Relances en retard" value={loading ? "" : due.length} loading={loading} accent="rose" />
        <KpiCard icon={CalendarClock} label="Relances à venir" value={loading ? "" : upcoming.length} loading={loading} accent="amber" />
        <KpiCard icon={Target} label="Total à suivre" value={loading ? "" : toFollow.length} loading={loading} accent="brand" />
      </div>

      <div className="inline-flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-soft">
        {([
          { key: "due", label: `En retard (${due.length})` },
          { key: "upcoming", label: `À venir (${upcoming.length})` },
          { key: "all", label: `Toutes (${toFollow.length})` }
        ] as const).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`focus-ring rounded-lg px-3 py-1.5 text-sm font-semibold transition ${tab === t.key ? "bg-loden-700 text-white shadow-soft" : "text-loden-muted hover:text-loden-ink"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error ? <p className="rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700">{error}</p> : null}

      {!loading && suggestions.length > 0 ? (
        <Card className="p-5">
          <SectionHeader
            title={`Suggestions de relance détectées (${suggestions.length})`}
            subtitle="Repérées automatiquement : prospects chauds sans suivi, devis sans réponse, échéances dépassées."
            icon={Zap}
          />
          <ul className="mt-4 space-y-2">
            {suggestions.map((s) => (
              <li key={s.leadId} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200/70 bg-amber-50/40 p-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-loden-ink">{s.fullName}</p>
                    {s.temperature && TEMP_LABEL[s.temperature] ? <Badge variant={TEMP_VARIANT[s.temperature] ?? "neutral"}>{TEMP_LABEL[s.temperature]}</Badge> : null}
                  </div>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-loden-muted">
                    <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-500" aria-hidden="true" />
                    <span className="font-medium text-amber-700">{s.reason}</span>
                    {s.interest ? <span>· {s.interest}</span> : null}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={busy === s.leadId}
                  onClick={() => createRelance(s.leadId)}
                  className="focus-ring inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-loden-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-loden-800 disabled:opacity-60"
                >
                  <BellRing className="h-3.5 w-3.5" aria-hidden="true" /> Créer la relance
                </button>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card className="p-5">
        <SectionHeader title="File de relances" subtitle="Prospects à recontacter, classés par échéance. Source : pipeline commercial." icon={BellRing} action={<Link href="/admin/pipeline" className="text-xs font-semibold text-loden-700 hover:underline">Pipeline</Link>} />
        <div className="mt-4">
          {loading ? (
            <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>
          ) : sorted.length === 0 ? (
            <EmptyState icon={Check} title="Aucune relance" description={tab === "due" ? "Aucune relance en retard 🎉" : "Aucun prospect à relancer pour cette vue."} compact />
          ) : (
            <ul className="space-y-2">
              {sorted.map((lead) => {
                const overdue = isDue(lead);
                return (
                  <li key={lead.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/70 p-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-loden-ink">{lead.fullName}</p>
                        {lead.temperature && TEMP_LABEL[lead.temperature] ? <Badge variant={TEMP_VARIANT[lead.temperature] ?? "neutral"}>{TEMP_LABEL[lead.temperature]}</Badge> : null}
                        {euros(lead.estimatedValueCents) ? <Badge variant="success">{euros(lead.estimatedValueCents)}</Badge> : null}
                      </div>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-loden-muted">
                        <Clock className={`h-3.5 w-3.5 ${overdue ? "text-rose-500" : ""}`} aria-hidden="true" />
                        {lead.nextFollowUpAt ? (
                          <span className={overdue ? "font-semibold text-rose-600" : ""}>
                            {overdue ? "En retard depuis le " : "À relancer le "}{fmt(lead.nextFollowUpAt)}
                          </span>
                        ) : (
                          <span>Étape relance — pas de date</span>
                        )}
                        {lead.interest ? <span>· {lead.interest}</span> : null}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button type="button" disabled={busy === lead.id} onClick={() => snooze(lead)} className="focus-ring rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-loden-ink transition hover:bg-loden-50 disabled:opacity-60">
                        Reporter +7j
                      </button>
                      <button type="button" disabled={busy === lead.id} onClick={() => done(lead)} className="focus-ring inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60">
                        <Check className="h-3.5 w-3.5" aria-hidden="true" /> Relance faite
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Card>
    </div>
  );
}
