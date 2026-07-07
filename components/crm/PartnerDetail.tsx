"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BadgeEuro, Building2, Mail, Phone, Users } from "lucide-react";
import { Badge, Card, EmptyState, Skeleton, type BadgeVariant } from "@/components/crm/ui";
import {
  formatEuros,
  mapApiCommission,
  mapApiPartner,
  type ApiPartner,
  type ApiPartnerCommission,
  type CommissionStatus,
  type Partner,
  type PartnerCommission
} from "@/lib/partner-mappers";

type ApiLead = { id: string; fullName: string; status: string; interest?: string | null; createdAt: string };

type Detail = { partner: Partner; commissions: PartnerCommission[]; leads: ApiLead[] };

type ViewState = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; detail: Detail };

const LEAD_STATUS_LABELS: Record<string, string> = {
  PROSPECT: "Nouveau",
  CONTACTE: "Contacté",
  RELANCE: "Relancé",
  DEVIS_ENVOYE: "Devis envoyé",
  INSCRIT: "Inscrit",
  PERDU: "Perdu"
};

const COMMISSION_VARIANT: Record<CommissionStatus, BadgeVariant> = {
  ESTIMEE: "info",
  VALIDEE: "brand",
  PAYEE: "success",
  ANNULEE: "neutral"
};

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function PartnerDetail({ partnerId }: { partnerId: string }) {
  const [state, setState] = useState<ViewState>({ status: "loading" });
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    try {
      const response = await fetch(`/api/partners/${partnerId}`);
      const payload = await response.json();
      if (!response.ok) {
        setState({ status: "error", message: payload?.error?.message ?? "Partenaire introuvable." });
        return;
      }
      const raw = payload.data as ApiPartner & { commissions?: ApiPartnerCommission[]; leads?: ApiLead[] };
      setState({
        status: "ready",
        detail: {
          partner: mapApiPartner(raw),
          commissions: (raw.commissions ?? []).map(mapApiCommission),
          leads: raw.leads ?? []
        }
      });
    } catch {
      setState({ status: "error", message: "Le service LODENE est momentanément indisponible." });
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerId]);

  async function setCommissionStatus(commissionId: string, status: CommissionStatus) {
    setBusy(commissionId);
    try {
      const response = await fetch(`/api/partners/${partnerId}/commissions/${commissionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (response.ok) await load();
    } finally {
      setBusy(null);
    }
  }

  if (state.status === "loading") {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (state.status === "error") {
    return <EmptyState icon={Building2} title="Fiche indisponible" description={state.message} />;
  }

  const { partner, commissions, leads } = state.detail;
  const totals = commissions.reduce(
    (acc, commission) => {
      if (commission.status === "ESTIMEE") acc.estimated += commission.amount;
      if (commission.status === "VALIDEE") acc.validated += commission.amount;
      if (commission.status === "PAYEE") acc.paid += commission.amount;
      return acc;
    },
    { estimated: 0, validated: 0, paid: 0 }
  );
  const cents = (euros: number) => Math.round(euros * 100);

  return (
    <div className="space-y-5">
      <Link href="/admin/partenaires" className="inline-flex items-center gap-1.5 text-sm font-semibold text-loden-700 hover:text-loden-800">
        <ArrowLeft className="h-4 w-4" /> Tous les partenaires
      </Link>

      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-loden-500" />
              <h2 className="text-lg font-bold text-loden-ink">{partner.companyName}</h2>
              <Badge variant={partner.status === "ACTIF" ? "success" : "warning"} dot>
                {partner.statusLabel}
              </Badge>
            </div>
            {partner.contactName ? <p className="mt-1 text-sm text-loden-muted">{partner.contactName}</p> : null}
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-loden-ink">
              <a href={`mailto:${partner.email}`} className="flex items-center gap-1.5 hover:text-loden-700">
                <Mail className="h-3.5 w-3.5 text-slate-400" /> {partner.email}
              </a>
              {partner.phone ? (
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-slate-400" /> {partner.phone}
                </span>
              ) : null}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-loden-muted">Barème</p>
            <p className="text-sm font-semibold text-loden-ink">{partner.commissionLabel}</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="px-4 py-3.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-loden-muted">Estimé</p>
          <p className="text-lg font-bold text-loden-ink">{formatEuros(cents(totals.estimated))}</p>
        </Card>
        <Card className="px-4 py-3.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-loden-muted">Validé</p>
          <p className="text-lg font-bold text-loden-ink">{formatEuros(cents(totals.validated))}</p>
        </Card>
        <Card className="px-4 py-3.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-loden-muted">Payé</p>
          <p className="text-lg font-bold text-loden-ink">{formatEuros(cents(totals.paid))}</p>
        </Card>
      </div>

      {/* Commissions */}
      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
          <BadgeEuro className="h-5 w-5 text-loden-700" />
          <h3 className="font-semibold text-loden-ink">Commissions</h3>
        </div>
        {commissions.length === 0 ? (
          <EmptyState icon={BadgeEuro} title="Aucune commission" description="Les commissions se créent automatiquement à l'inscription d'un candidat apporté." compact />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-loden-muted">
                  <th className="px-5 py-3 font-semibold">Montant</th>
                  <th className="px-5 py-3 font-semibold">Statut</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {commissions.map((commission) => (
                  <tr key={commission.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-5 py-3 font-semibold text-loden-ink">{commission.amountLabel}</td>
                    <td className="px-5 py-3">
                      <Badge variant={COMMISSION_VARIANT[commission.status]}>{commission.statusLabel}</Badge>
                    </td>
                    <td className="px-5 py-3 text-loden-muted">{fmtDate(commission.createdAt)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {commission.status === "ESTIMEE" ? (
                          <CommissionButton disabled={busy === commission.id} onClick={() => setCommissionStatus(commission.id, "VALIDEE")}>
                            Valider
                          </CommissionButton>
                        ) : null}
                        {commission.status === "VALIDEE" ? (
                          <CommissionButton disabled={busy === commission.id} onClick={() => setCommissionStatus(commission.id, "PAYEE")}>
                            Marquer payée
                          </CommissionButton>
                        ) : null}
                        {commission.status !== "ANNULEE" && commission.status !== "PAYEE" ? (
                          <CommissionButton disabled={busy === commission.id} onClick={() => setCommissionStatus(commission.id, "ANNULEE")} variant="ghost">
                            Annuler
                          </CommissionButton>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Prospects apportés */}
      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
          <Users className="h-5 w-5 text-loden-700" />
          <h3 className="font-semibold text-loden-ink">Prospects apportés ({leads.length})</h3>
        </div>
        {leads.length === 0 ? (
          <EmptyState icon={Users} title="Aucun prospect" description="Ce partenaire n'a pas encore recommandé de candidat." compact />
        ) : (
          <ul className="divide-y divide-slate-100">
            {leads.map((lead) => (
              <li key={lead.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-loden-ink">{lead.fullName}</p>
                  <p className="truncate text-xs text-loden-muted">
                    {lead.interest ? `${lead.interest} · ` : ""}
                    {fmtDate(lead.createdAt)}
                  </p>
                </div>
                <Badge variant={lead.status === "INSCRIT" ? "success" : lead.status === "PERDU" ? "danger" : "info"}>
                  {LEAD_STATUS_LABELS[lead.status] ?? lead.status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function CommissionButton({
  children,
  onClick,
  disabled,
  variant = "solid"
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: "solid" | "ghost";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        variant === "ghost"
          ? "focus-ring rounded-lg px-2.5 py-1 text-xs font-semibold text-loden-muted transition hover:bg-slate-50 disabled:opacity-40"
          : "focus-ring rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-loden-ink transition hover:bg-slate-50 disabled:opacity-40"
      }
    >
      {children}
    </button>
  );
}
