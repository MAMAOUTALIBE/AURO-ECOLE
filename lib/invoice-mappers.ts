// Frontière cents→euros + libellés FR pour les factures. Ne jamais rendre les centimes bruts.

export type InvoiceStatus = "BROUILLON" | "EMISE" | "PAYEE" | "ANNULEE";

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  BROUILLON: "Brouillon",
  EMISE: "Émise",
  PAYEE: "Payée",
  ANNULEE: "Annulée"
};

export const VAT_RATES = [0, 5.5, 10, 20] as const;

export function euros(cents: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(cents / 100);
}

export function invoiceDate(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

// Calcul d'aperçu côté client (l'autorité reste le serveur).
export function previewTotals(lines: { quantity: number; unitAmountCents: number; vatRate: number }[]) {
  let subtotalCents = 0;
  let vatCents = 0;
  for (const line of lines) {
    const ht = line.quantity * line.unitAmountCents;
    subtotalCents += ht;
    vatCents += Math.round((ht * line.vatRate) / 100);
  }
  return { subtotalCents, vatCents, totalCents: subtotalCents + vatCents };
}
