"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, ArrowRight, CheckCircle2, PlayCircle, Workflow, Zap } from "lucide-react";
import { Badge, Card, EmptyState, KpiCard, SectionHeader, Skeleton } from "@/components/crm/ui";
import { ACTION_LABELS, TRIGGER_LABELS } from "@/components/crm/WorkflowsManager";

type Rule = {
  id: string;
  name: string;
  trigger: string;
  action: string;
  active: boolean;
  runCount: number;
  lastRunAt?: string | null;
};

function fmt(iso?: string | null) {
  return iso ? new Date(iso).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "Jamais";
}

export function AutomationsOverview() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/automations")
      .then((r) => r.json())
      .then((p) => {
        if (Array.isArray(p?.data)) setRules(p.data as Rule[]);
        else setError(p?.error?.message ?? "Chargement impossible.");
      })
      .catch(() => setError("Chargement impossible."))
      .finally(() => setLoading(false));
  }, []);

  const active = rules.filter((r) => r.active);
  const totalRuns = rules.reduce((sum, r) => sum + (r.runCount ?? 0), 0);
  const lastRun = rules
    .map((r) => r.lastRunAt)
    .filter(Boolean)
    .sort()
    .at(-1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Workflow} label="Règles configurées" value={loading ? "—" : rules.length} accent="brand" loading={loading} />
        <KpiCard icon={CheckCircle2} label="Règles actives" value={loading ? "—" : active.length} accent="emerald" loading={loading} subLabel={loading ? undefined : `${rules.length - active.length} en pause`} />
        <KpiCard icon={PlayCircle} label="Exécutions totales" value={loading ? "—" : totalRuns} accent="indigo" loading={loading} />
        <KpiCard icon={Activity} label="Dernière exécution" value={loading ? "—" : fmt(lastRun)} accent="sky" loading={loading} />
      </div>

      <Card className="p-5">
        <SectionHeader
          title="Automatisations actives"
          subtitle="Règles déclenchées automatiquement par les événements du CRM."
          icon={Zap}
          action={
            <Link
              href="/admin/workflows"
              className="focus-ring inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-semibold text-loden-ink transition hover:bg-loden-50"
            >
              Gérer les règles
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          }
        />
        <div className="mt-4">
          {loading ? (
            <div className="space-y-2">{[0, 1].map((i) => <Skeleton key={i} className="h-14 w-full rounded-2xl" />)}</div>
          ) : error ? (
            <p className="rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700">{error}</p>
          ) : active.length === 0 ? (
            <EmptyState
              icon={Workflow}
              title="Aucune règle active"
              description="Activez ou créez une règle dans Workflows pour automatiser vos relances et notifications."
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {active.map((rule) => (
                <li key={rule.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate font-medium text-loden-ink">{rule.name}</span>
                    <Badge variant="info">{TRIGGER_LABELS[rule.trigger] ?? rule.trigger}</Badge>
                    <ArrowRight className="h-3.5 w-3.5 text-loden-muted" aria-hidden="true" />
                    <Badge variant="brand">{ACTION_LABELS[rule.action] ?? rule.action}</Badge>
                  </div>
                  <span className="shrink-0 text-xs text-loden-muted">
                    {rule.runCount} exécution(s) · dernière : {fmt(rule.lastRunAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </div>
  );
}
