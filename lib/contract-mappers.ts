export type ContractStatus = "BROUILLON" | "ACTIF" | "RESILIE" | "TERMINE";

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  BROUILLON: "Brouillon",
  ACTIF: "Actif",
  RESILIE: "Résilié",
  TERMINE: "Terminé"
};

export { euros, invoiceDate as contractDate } from "@/lib/invoice-mappers";
