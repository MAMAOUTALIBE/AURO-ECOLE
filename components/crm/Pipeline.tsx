"use client";

import { useEffect, useState } from "react";
import { KanbanSquare, Plus, X } from "lucide-react";
import { ACTIVE_AGENCY_KEY } from "@/components/AgencySwitcher";

type Lead = {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  status: string;
  source?: string | null;
  interest?: string | null;
  estimatedValueCents?: number | null;
  temperature?: string | null;
};

const TEMP_STYLES: Record<string, string> = {
  chaud: "bg-red-50 text-red-700",
  tiede: "bg-amber-50 text-amber-700",
  froid: "bg-sky-50 text-sky-700"
};
const TEMP_LABELS: Record<string, string> = { chaud: "🔥 Chaud", tiede: "🌤 Tiède", froid: "❄️ Froid" };

const STAGES: { key: string; label: string }[] = [
  { key: "PROSPECT", label: "Prospect" },
  { key: "CONTACTE", label: "Contacté" },
  { key: "RELANCE", label: "Relance" },
  { key: "DEVIS_ENVOYE", label: "Devis envoyé" },
  { key: "INSCRIT", label: "Inscrit" },
  { key: "PERDU", label: "Perdu" }
];

function euros(cents?: number | null) {
  if (!cents) return null;
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(cents / 100);
}

export function Pipeline() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", interest: "" });

  useEffect(() => {
    const agency = window.localStorage.getItem(ACTIVE_AGENCY_KEY);
    const query = agency && agency !== "all" ? `?agencyId=${encodeURIComponent(agency)}` : "";

    fetch(`/api/leads${query}`)
      .then((response) => response.json())
      .then((payload) => {
        if (Array.isArray(payload?.data)) setLeads(payload.data as Lead[]);
        else setError(payload?.error?.message ?? "Impossible de charger le pipeline.");
      })
      .catch(() => setError("Le service LODENE est momentanément indisponible."))
      .finally(() => setLoading(false));
  }, []);

  const moveLead = async (lead: Lead, status: string) => {
    if (status === lead.status) return;
    setBusyId(lead.id);
    try {
      const response = await fetch(`/api/leads/${lead.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error();
      setLeads((current) => current.map((item) => (item.id === lead.id ? { ...item, status } : item)));
    } catch {
      setError("Le changement d'étape a échoué.");
    } finally {
      setBusyId(null);
    }
  };

  const createLead = async () => {
    if (!form.fullName.trim() || !form.email.trim()) {
      setError("Nom et email sont requis.");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
          ...(form.interest.trim() ? { interest: form.interest.trim() } : {})
        })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error?.message ?? "Création impossible.");
      setLeads((current) => [payload.data as Lead, ...current]);
      setForm({ fullName: "", email: "", phone: "", interest: "" });
      setShowForm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Création impossible.");
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <p className="text-sm text-loden-muted">Chargement du pipeline…</p>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-loden-muted">{leads.length} prospect(s)</p>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="focus-ring inline-flex items-center gap-1.5 rounded-xl bg-loden-700 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-loden-800"
        >
          {showForm ? <X className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
          {showForm ? "Fermer" : "Nouveau prospect"}
        </button>
      </div>
      {showForm ? (
        <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <input className="field-input" placeholder="Nom complet *" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} aria-label="Nom complet" />
            <input className="field-input" type="email" placeholder="Email *" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} aria-label="Email" />
            <input className="field-input" placeholder="Téléphone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} aria-label="Téléphone" />
            <input className="field-input" placeholder="Intérêt (ex. Permis B)" value={form.interest} onChange={(e) => setForm({ ...form, interest: e.target.value })} aria-label="Intérêt" />
          </div>
          <button
            type="button"
            onClick={createLead}
            disabled={creating}
            className="focus-ring mt-3 inline-flex items-center gap-2 rounded-xl bg-loden-700 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-loden-800 disabled:opacity-70"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {creating ? "Création…" : "Créer le prospect"}
          </button>
        </div>
      ) : null}
      {error ? <p className="mb-4 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700">{error}</p> : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {STAGES.map((stage) => {
          const stageLeads = leads.filter((lead) => lead.status === stage.key);
          return (
            <div key={stage.key} className="min-w-0 rounded-3xl border border-slate-200 bg-loden-pearl/60 p-3">
              <div className="flex items-center justify-between px-1 pb-2">
                <p className="text-sm font-semibold text-loden-ink">{stage.label}</p>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-loden-muted shadow-soft">
                  {stageLeads.length}
                </span>
              </div>
              <div className="grid gap-2">
                {stageLeads.map((lead) => {
                  const value = euros(lead.estimatedValueCents);
                  return (
                    <div key={lead.id} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-soft">
                      <p className="truncate text-sm font-semibold text-loden-ink">{lead.fullName}</p>
                      <p className="truncate text-xs text-loden-muted">{lead.email}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {lead.temperature && TEMP_LABELS[lead.temperature] ? (
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${TEMP_STYLES[lead.temperature]}`}>{TEMP_LABELS[lead.temperature]}</span>
                        ) : null}
                        {lead.source === "inscription" ? <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700">📝 Inscription</span> : null}
                        {lead.interest ? <span className="rounded-full bg-loden-50 px-2 py-0.5 text-[11px] font-semibold text-loden-700">{lead.interest}</span> : null}
                        {value ? <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">{value}</span> : null}
                      </div>
                      <select
                        aria-label={`Étape de ${lead.fullName}`}
                        className="focus-ring mt-2 w-full cursor-pointer rounded-lg border border-slate-200 bg-loden-fog px-2 py-1 text-xs font-semibold text-loden-ink outline-none disabled:opacity-60"
                        value={lead.status}
                        disabled={busyId === lead.id}
                        onChange={(event) => moveLead(lead, event.target.value)}
                      >
                        {STAGES.map((option) => (
                          <option key={option.key} value={option.key}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                  );
                })}
                {stageLeads.length === 0 ? <p className="px-1 py-3 text-center text-xs text-loden-muted">—</p> : null}
              </div>
            </div>
          );
        })}
      </div>
      {leads.length === 0 && !error ? (
        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-white p-4 text-sm text-loden-muted shadow-soft">
          <KanbanSquare className="h-4 w-4 text-loden-700" aria-hidden="true" />
          Aucun prospect pour cette sélection. Les demandes de contact créent automatiquement un prospect.
        </div>
      ) : null}
    </div>
  );
}
