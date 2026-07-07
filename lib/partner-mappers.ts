// Conversion des DTO API partenaires (cents, enums backend) vers les formes d'affichage
// front (euros, libellés FR). Toujours mapper les payloads API par ces fonctions avant rendu.

export type PartnerStatus = "ACTIF" | "SUSPENDU";
export type PartnerType = "PRESCRIPTEUR";
export type CommissionType = "FLAT" | "PERCENT";
export type CommissionStatus = "ESTIMEE" | "VALIDEE" | "PAYEE" | "ANNULEE";

export const partnerStatusLabels: Record<PartnerStatus, string> = {
  ACTIF: "Actif",
  SUSPENDU: "Suspendu"
};

export const commissionTypeLabels: Record<CommissionType, string> = {
  FLAT: "Montant fixe",
  PERCENT: "Pourcentage"
};

export const commissionStatusLabels: Record<CommissionStatus, string> = {
  ESTIMEE: "Estimée",
  VALIDEE: "Validée",
  PAYEE: "Payée",
  ANNULEE: "Annulée"
};

const euros = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

export function formatEuros(cents: number): string {
  return euros.format((cents ?? 0) / 100);
}

// Barème lisible : FLAT = montant fixe (cents) « / inscription », PERCENT = points de base « % ».
export function describeCommission(type: CommissionType, value: number): string {
  if (type === "PERCENT") {
    return `${(value / 100).toLocaleString("fr-FR")} % du prix formation`;
  }
  return `${formatEuros(value)} / inscription`;
}

type ApiUser = { id: string; email: string; firstName: string; lastName: string };

export type ApiPartner = {
  id: string;
  userId?: string | null;
  companyName: string;
  type: PartnerType;
  status: PartnerStatus;
  contactName?: string | null;
  email: string;
  phone?: string | null;
  commissionType: CommissionType;
  commissionValue: number;
  notes?: string | null;
  agencyId?: string | null;
  createdAt: string;
  user?: ApiUser | null;
};

export type ApiPartnerCommission = {
  id: string;
  partnerId: string;
  leadId?: string | null;
  studentId?: string | null;
  amount: number;
  status: CommissionStatus;
  note?: string | null;
  createdAt: string;
};

export type Partner = {
  id: string;
  companyName: string;
  contactName?: string | null;
  email: string;
  phone?: string | null;
  status: PartnerStatus;
  statusLabel: string;
  type: PartnerType;
  commissionType: CommissionType;
  commissionValue: number;
  commissionLabel: string;
  notes?: string | null;
  agencyId?: string | null;
  hasAccount: boolean;
  createdAt: string;
  user?: ApiUser | null;
};

export type PartnerCommission = {
  id: string;
  partnerId: string;
  leadId?: string | null;
  studentId?: string | null;
  amount: number; // euros
  amountLabel: string;
  status: CommissionStatus;
  statusLabel: string;
  note?: string | null;
  createdAt: string;
};

export function mapApiPartner(partner: ApiPartner): Partner {
  return {
    id: partner.id,
    companyName: partner.companyName,
    contactName: partner.contactName ?? undefined,
    email: partner.email,
    phone: partner.phone ?? undefined,
    status: partner.status,
    statusLabel: partnerStatusLabels[partner.status] ?? partner.status,
    type: partner.type,
    commissionType: partner.commissionType,
    commissionValue: partner.commissionValue,
    commissionLabel: describeCommission(partner.commissionType, partner.commissionValue),
    notes: partner.notes ?? undefined,
    agencyId: partner.agencyId ?? undefined,
    hasAccount: Boolean(partner.userId),
    createdAt: partner.createdAt,
    user: partner.user ?? null
  };
}

export function mapApiCommission(commission: ApiPartnerCommission): PartnerCommission {
  return {
    id: commission.id,
    partnerId: commission.partnerId,
    leadId: commission.leadId ?? undefined,
    studentId: commission.studentId ?? undefined,
    amount: commission.amount / 100,
    amountLabel: formatEuros(commission.amount),
    status: commission.status,
    statusLabel: commissionStatusLabels[commission.status] ?? commission.status,
    note: commission.note ?? undefined,
    createdAt: commission.createdAt
  };
}
