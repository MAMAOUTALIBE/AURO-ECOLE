"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Download, Loader2, Megaphone, TicketCheck } from "lucide-react";
import { Badge, Card, EmptyState } from "@/components/crm/ui";

type Lead = {
  id: string;
  fullName: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  phone?: string | null;
  status: string;
  source?: string | null;
  interest?: string | null;
  notes?: string | null;
  createdAt: string;
  consentEmail?: boolean;
  consentWhatsapp?: boolean;
};

type LeadsResponse = {
  data?: Lead[];
  error?: { message?: string };
};

const OFFER_SOURCE = "QR_CODE_OFFRE_50";
const OFFER_CODE = "LODENE50";

const statusLabels: Record<string, string> = {
  PROSPECT: "Nouveau",
  CONTACTE: "Contacté",
  RELANCE: "Contacté",
  DEVIS_ENVOYE: "Contacté",
  INSCRIT: "Inscrit",
  PERDU: "Perdu"
};

function hasOfferMarker(lead: Lead) {
  return lead.source === OFFER_SOURCE || lead.notes?.includes(`Code promo: ${OFFER_CODE}`);
}

function voucherUsed(lead: Lead) {
  return lead.notes?.includes("Statut bon: UTILISE") ?? false;
}

function displayStatus(lead: Lead) {
  if (voucherUsed(lead)) return "Bon utilisé";
  return statusLabels[lead.status] ?? lead.status;
}

function statusVariant(lead: Lead) {
  if (voucherUsed(lead)) return "success";
  if (lead.status === "PROSPECT") return "brand";
  if (lead.status === "PERDU") return "danger";
  if (lead.status === "INSCRIT") return "success";
  return "warning";
}

function markVoucherUsedNotes(notes?: string | null) {
  const base = notes?.trim();
  if (!base) return "Statut bon: UTILISE";
  if (base.includes("Statut bon:")) return base.replace(/Statut bon: .*/g, "Statut bon: UTILISE");
  return `${base}\nStatut bon: UTILISE`;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date inconnue";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(date);
}

function escapeCsv(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function leadName(lead: Lead) {
  if (lead.firstName || lead.lastName) return `${lead.firstName ?? ""} ${lead.lastName ?? ""}`.trim();
  return lead.fullName;
}

export function OfferQr50Manager() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/leads")
      .then((response) => response.json())
      .then((payload: LeadsResponse) => {
        if (Array.isArray(payload?.data)) setLeads(payload.data.filter(hasOfferMarker));
        else setError(payload?.error?.message ?? "Impossible de charger les prospects de l'offre.");
      })
      .catch(() => setError("Le service LODENE est momentanément indisponible."))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const used = leads.filter(voucherUsed).length;
    const newCount = leads.filter((lead) => lead.status === "PROSPECT" && !voucherUsed(lead)).length;
    const contacted = leads.filter((lead) => ["CONTACTE", "RELANCE", "DEVIS_ENVOYE"].includes(lead.status)).length;
    return { total: leads.length, newCount, contacted, used };
  }, [leads]);

  const exportCsv = () => {
    const headers = ["Nom", "Prénom", "Téléphone", "Email", "Formation souhaitée", "Date d'inscription", "Code promo", "Statut"];
    const rows = leads.map((lead) => [
      lead.lastName ?? lead.fullName,
      lead.firstName ?? "",
      lead.phone ?? "",
      lead.email,
      lead.interest ?? "",
      formatDate(lead.createdAt),
      OFFER_CODE,
      displayStatus(lead)
    ]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => escapeCsv(String(cell))).join(";")).join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `prospects-offre-qr-50-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const markUsed = async (lead: Lead) => {
    setBusyId(lead.id);
    setError(null);
    try {
      const response = await fetch(`/api/leads/${lead.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "INSCRIT",
          notes: markVoucherUsedNotes(lead.notes)
        })
      });
      const payload = (await response.json().catch(() => null)) as { data?: Lead; error?: { message?: string } } | null;
      if (!response.ok || !payload?.data) throw new Error(payload?.error?.message ?? "Mise à jour impossible.");
      setLeads((current) => current.map((item) => (item.id === lead.id ? payload.data! : item)));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Mise à jour impossible.");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <Card className="flex items-center gap-3 p-5 text-sm font-semibold text-loden-muted">
        <Loader2 className="h-5 w-5 animate-spin text-loden-700" aria-hidden="true" />
        Chargement des prospects de l&apos;offre...
      </Card>
    );
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-loden-muted">Total</p>
          <p className="mt-2 text-3xl font-black text-loden-ink">{stats.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-loden-muted">Nouveaux</p>
          <p className="mt-2 text-3xl font-black text-loden-ink">{stats.newCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-loden-muted">Contactés</p>
          <p className="mt-2 text-3xl font-black text-loden-ink">{stats.contacted}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-loden-muted">Bons utilisés</p>
          <p className="mt-2 text-3xl font-black text-loden-ink">{stats.used}</p>
        </Card>
      </div>

      {error ? <p className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p> : null}

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
          <div>
            <h2 className="text-base font-black text-loden-ink">Prospects QR code -50 €</h2>
            <p className="mt-1 text-sm text-loden-muted">Source {OFFER_SOURCE} · code promo {OFFER_CODE}</p>
          </div>
          <button
            type="button"
            onClick={exportCsv}
            disabled={leads.length === 0}
            className="focus-ring inline-flex items-center gap-2 rounded-xl bg-loden-700 px-4 py-2 text-sm font-black text-white shadow-soft transition hover:bg-loden-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Exporter CSV
          </button>
        </div>

        {leads.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="Aucun prospect pour cette offre"
            description="Les inscriptions depuis /offre-50?code=LODENE50 apparaîtront ici automatiquement."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-loden-fog text-xs font-black uppercase tracking-[0.12em] text-loden-muted">
                <tr>
                  <th className="px-4 py-3">Prospect</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Formation</th>
                  <th className="px-4 py-3">Inscription</th>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {leads.map((lead) => (
                  <tr key={lead.id} className="align-top">
                    <td className="px-4 py-4">
                      <p className="font-black text-loden-ink">{leadName(lead)}</p>
                      <p className="mt-1 text-xs text-loden-muted">{lead.source ?? OFFER_SOURCE}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-loden-ink">{lead.phone || "Téléphone absent"}</p>
                      <p className="mt-1 text-xs text-loden-muted">{lead.email}</p>
                    </td>
                    <td className="px-4 py-4 font-semibold text-loden-ink">{lead.interest ?? "Non précisé"}</td>
                    <td className="px-4 py-4 text-loden-muted">{formatDate(lead.createdAt)}</td>
                    <td className="px-4 py-4">
                      <Badge variant="brand">{OFFER_CODE}</Badge>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={statusVariant(lead)} dot>
                        {displayStatus(lead)}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => markUsed(lead)}
                        disabled={busyId === lead.id || voucherUsed(lead)}
                        className="focus-ring inline-flex items-center gap-2 rounded-xl border border-loden-200 bg-white px-3 py-2 text-xs font-black text-loden-800 shadow-soft transition hover:bg-loden-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {voucherUsed(lead) ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : <TicketCheck className="h-4 w-4" aria-hidden="true" />}
                        {voucherUsed(lead) ? "Bon utilisé" : "Marquer bon utilisé"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
