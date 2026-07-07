import type { LeadRecord, StudentRecord } from "../../domain/types";
import type { LodenRepository } from "../../repositories/loden-repository";

// Propage l'attribution partenaire lors de la conversion d'un lead apporté en inscription :
//  - rattache l'élève créé au partenaire (alimente « mes apprenants » du portail) ;
//  - génère une commission ESTIMEE selon le barème (FLAT = montant fixe en cents,
//    PERCENT = points de base appliqués au prix de la formation).
// Best-effort et idempotent-friendly : n'interrompt jamais la conversion (échecs avalés).
export async function attributePartnerOnConversion(
  repository: LodenRepository,
  lead: LeadRecord | null | undefined,
  student: StudentRecord
): Promise<void> {
  const partnerId = lead?.partnerId;
  if (!partnerId) return;

  await repository.updateStudent(student.id, { partnerId }).catch(() => undefined);

  const partner = await repository.findPartnerById(partnerId).catch(() => null);
  if (!partner || partner.status !== "ACTIF") return;

  // Évite les doublons si la conversion est rejouée : une commission par lead apporté.
  const existing = await repository.listPartnerCommissions({ partnerId }).catch(() => []);
  if (existing.some((commission) => commission.leadId === lead?.id)) return;

  let amount = 0;
  if (partner.commissionType === "FLAT") {
    amount = partner.commissionValue;
  } else {
    const formation = student.formationId
      ? await repository.findFormationById(student.formationId).catch(() => null)
      : null;
    const priceCents = formation?.priceCents ?? 0;
    amount = Math.round((priceCents * partner.commissionValue) / 10_000);
  }
  if (amount <= 0) return;

  await repository
    .createCommission({ partnerId, leadId: lead?.id ?? null, studentId: student.id, amount, status: "ESTIMEE" })
    .catch(() => undefined);
}
