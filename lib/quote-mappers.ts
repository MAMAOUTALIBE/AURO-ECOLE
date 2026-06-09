export type QuoteStatus = "BROUILLON" | "ENVOYE" | "ACCEPTE" | "REFUSE" | "EXPIRE";

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  BROUILLON: "Brouillon",
  ENVOYE: "Envoyé",
  ACCEPTE: "Accepté",
  REFUSE: "Refusé",
  EXPIRE: "Expiré"
};

export { euros, invoiceDate as quoteDate, previewTotals, VAT_RATES } from "@/lib/invoice-mappers";
