"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Workflow, Zap } from "lucide-react";
import { Badge, Card, EmptyState, SectionHeader, Skeleton } from "@/components/crm/ui";

export const TRIGGER_LABELS: Record<string, string> = {
  LEAD_CREATED: "Nouveau lead",
  STUDENT_CREATED: "Nouvel élève"
};
export const ACTION_LABELS: Record<string, string> = {
  SEND_WELCOME_EMAIL: "Email de bienvenue",
  NOTIFY_TEAM: "Notifier l'équipe",
  LOG: "Journaliser seulement"
};

type Rule = {
  id: string;
  name: string;
  trigger: string;
  action: string;
  active: boolean;
  runCount: number;
  lastRunAt?: string | null;
};

const EMPTY = { name: "", trigger: "LEAD_CREATED", action: "SEND_WELCOME_EMAIL" };

function fmt(iso?: string | null) {
  return iso ? new Date(iso).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "Jamais";
}

export function WorkflowsManager() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);

  const load = () => {
    setLoading(true);
    fetch("/api/automations")
      .then((r) => r.json())
      .then((p) => {
        if (Array.isArray(p?.data)) setRules(p.data as Rule[]);
        else setError(p?.error?.message ?? "Chargement des automatisations impossible.");
      })
      .catch(() => setError("Chargement impossible."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const create = async () => {
    if (form.name.trim().length < 2) {
      setError("Donne un nom à la règle.");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const response = await fetch("/api/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name.trim(), trigger: form.trigger, action: form.action })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error?.message ?? "Création impossible.");
      setForm(EMPTY);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Création impossible.");
    } finally {
      setCreating(false);
    }
  };

  const toggle = async (rule: Rule) => {
    setBusy(rule.id);
    setRules((cur) => cur.map((r) => (r.id === rule.id ? { ...r, active: !r.active } : r)));
    try {
      const response = await fetch(`/api/automations/${rule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !rule.active })
      });
      if (!response.ok) throw new Error();
    } catch {
      setRules((cur) => cur.map((r) => (r.id === rule.id ? { ...r, active: rule.active } : r)));
      setError("Mise à jour impossible.");
    } finally {
      setBusy(null);
    }
  };

  const remove = async (rule: Rule) => {
    if (!window.confirm(`Supprimer la règle « ${rule.name} » ?`)) return;
    try {
      const response = await fetch(`/api/automations/${rule.id}`, { method: "DELETE" });
      if (!response.ok && response.status !== 204) throw new Error();
      setRules((cur) => cur.filter((r) => r.id !== rule.id));
    } catch {
      setError("Suppression impossible.");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <SectionHeader title="Nouvelle automatisation" subtitle="Quand un événement se produit, exécuter une action." icon={Plus} />
        <div className="mt-4 grid items-end gap-3 sm:grid-cols-[1fr_auto_auto_auto] sm:gap-2">
          <input className="field-input" placeholder="Nom de la règle (ex. Accueil nouveaux prospects)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} aria-label="Nom" />
          <div className="flex items-center gap-2">
            <select className="field-input" value={form.trigger} onChange={(e) => setForm({ ...form, trigger: e.target.value })} aria-label="Déclencheur">
              {Object.entries(TRIGGER_LABELS).map(([k, v]) => <option key={k} value={k}>Quand : {v}</option>)}
            </select>
            <Zap className="h-4 w-4 shrink-0 text-loden-500" aria-hidden="true" />
            <select className="field-input" value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })} aria-label="Action">
              {Object.entries(ACTION_LABELS).map(([k, v]) => <option key={k} value={k}>Alors : {v}</option>)}
            </select>
          </div>
          <button
            type="button"
            onClick={create}
            disabled={creating}
            className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl bg-loden-700 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-loden-800 disabled:opacity-70"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {creating ? "Ajout…" : "Créer la règle"}
          </button>
        </div>
        {error ? <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700">{error}</p> : null}
      </Card>

      <div>
        <SectionHeader title="Règles d'automatisation" subtitle={loading ? undefined : `${rules.length} règle(s)`} icon={Workflow} />
        <div className="mt-4">
          {loading ? (
            <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}</div>
          ) : rules.length === 0 ? (
            <Card className="p-6"><EmptyState icon={Workflow} title="Aucune automatisation" description="Crée une première règle ci-dessus (ex. nouveau lead → email de bienvenue)." /></Card>
          ) : (
            <div className="grid gap-3">
              {rules.map((rule) => (
                <Card key={rule.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-loden-ink">{rule.name}</p>
                      <Badge variant={rule.active ? "success" : "neutral"} dot>{rule.active ? "Active" : "Inactive"}</Badge>
                    </div>
                    <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-loden-muted">
                      <Badge variant="info">{TRIGGER_LABELS[rule.trigger] ?? rule.trigger}</Badge>
                      <Zap className="h-3 w-3" aria-hidden="true" />
                      <Badge variant="brand">{ACTION_LABELS[rule.action] ?? rule.action}</Badge>
                      <span className="ml-1">· {rule.runCount} exécution(s) · dernière : {fmt(rule.lastRunAt)}</span>
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      disabled={busy === rule.id}
                      onClick={() => toggle(rule)}
                      className="focus-ring rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-loden-ink transition hover:bg-loden-50 disabled:opacity-60"
                    >
                      {rule.active ? "Désactiver" : "Activer"}
                    </button>
                    <button type="button" onClick={() => remove(rule)} aria-label="Supprimer" className="focus-ring inline-flex items-center rounded-lg border border-rose-200 px-2 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50">
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
