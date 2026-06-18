"use client";

import { useEffect, useMemo, useState } from "react";
import { PiggyBank } from "lucide-react";
import { Badge, Card, EmptyState, SectionHeader, Skeleton, type BadgeVariant } from "@/components/crm/ui";

type CpfRequest = {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  status: string;
  requestedAmountCents?: number | null;
  createdAt: string;
};

const STATUSES: { key: string; label: string; variant: BadgeVariant }[] = [
  { key: "NOUVELLE_DEMANDE", label: "Nouvelle", variant: "info" },
  { key: "EN_COURS", label: "En cours", variant: "brand" },
  { key: "DOCUMENTS_MANQUANTS", label: "Docs manquants", variant: "warning" },
  { key: "VALIDEE", label: "Validée", variant: "success" },
  { key: "REFUSEE", label: "Refusée", variant: "danger" }
];

const euros = (cents?: number | null) =>
  cents && cents > 0
    ? new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(cents / 100)
    : "—";

export function CpfManager() {
  const [requests, setRequests] = useState<CpfRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/cpf/requests")
      .then((r) => r.json())
      .then((p) => {
        if (Array.isArray(p?.data)) setRequests(p.data as CpfRequest[]);
        else setError(p?.error?.message ?? "Chargement des dossiers CPF impossible.");
      })
      .catch(() => setError("Chargement des dossiers CPF impossible."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const changeStatus = async (req: CpfRequest, status: string) => {
    setBusy(req.id);
    setError(null);
    const previous = req.status;
    setRequests((cur) => cur.map((r) => (r.id === req.id ? { ...r, status } : r)));
    try {
      const response = await fetch(`/api/cpf/requests/${req.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error();
    } catch {
      setRequests((cur) => cur.map((r) => (r.id === req.id ? { ...r, status: previous } : r)));
      setError("Mise à jour du dossier impossible.");
    } finally {
      setBusy(null);
    }
  };

  const meta = (key: string) => STATUSES.find((s) => s.key === key);
  const pending = useMemo(() => requests.filter((r) => r.status !== "VALIDEE" && r.status !== "REFUSEE").length, [requests]);

  return (
    <Card className="p-5">
      <SectionHeader
        title="Dossiers CPF"
        subtitle={loading ? undefined : `${requests.length} dossier(s) · ${pending} en cours de traitement`}
        icon={PiggyBank}
      />
      {error ? <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700">{error}</p> : null}
      <div className="mt-4">
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <EmptyState icon={PiggyBank} title="Aucun dossier CPF" description="Les demandes de financement CPF apparaîtront ici dès réception." compact />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-loden-muted">
                <tr className="border-b border-slate-200">
                  <th className="py-3 pr-4 font-semibold">Demandeur</th>
                  <th className="py-3 pr-4 font-semibold">Montant</th>
                  <th className="py-3 pr-4 font-semibold">Reçu le</th>
                  <th className="py-3 pr-4 font-semibold">Statut</th>
                  <th className="py-3 font-semibold">Faire avancer</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 pr-4">
                      <p className="font-semibold text-loden-ink">{req.fullName}</p>
                      <p className="text-xs text-loden-muted">{req.email}</p>
                    </td>
                    <td className="py-3 pr-4 font-medium text-loden-ink">{euros(req.requestedAmountCents)}</td>
                    <td className="py-3 pr-4 text-loden-muted">
                      {new Date(req.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant={meta(req.status)?.variant ?? "neutral"}>{meta(req.status)?.label ?? req.status}</Badge>
                    </td>
                    <td className="py-3">
                      <select
                        aria-label="Changer le statut du dossier"
                        disabled={busy === req.id}
                        className="focus-ring cursor-pointer rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-loden-ink outline-none disabled:opacity-60"
                        value={req.status}
                        onChange={(e) => changeStatus(req, e.target.value)}
                      >
                        {STATUSES.map((s) => (
                          <option key={s.key} value={s.key}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
}
