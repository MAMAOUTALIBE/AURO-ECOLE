import type { InvoiceLineItem } from "./types";

/**
 * Calcul des totaux d'une facture — fonction PURE partagée par le repo mémoire
 * et le repo Prisma (garantit l'égalité au centime près). TVA arrondie par ligne.
 * Autorité serveur : tout total envoyé par le client est ignoré.
 */
export function computeInvoiceTotals(lines: InvoiceLineItem[]): {
  subtotalCents: number;
  vatCents: number;
  totalCents: number;
} {
  let subtotalCents = 0;
  let vatCents = 0;
  for (const line of lines) {
    const ht = line.quantity * line.unitAmountCents;
    subtotalCents += ht;
    vatCents += Math.round((ht * line.vatRate) / 100);
  }
  return { subtotalCents, vatCents, totalCents: subtotalCents + vatCents };
}

/** Prochain numéro séquentiel <PREFIX>-AAAA-NNNNNN dérivé des numéros existants de l'année. */
export function nextSequentialNumber(existingNumbers: (string | null | undefined)[], year: number, docPrefix: string): string {
  const prefix = `${docPrefix}-${year}-`;
  const maxN = existingNumbers.reduce<number>((max, number) => {
    if (!number || !number.startsWith(prefix)) return max;
    const n = Number.parseInt(number.slice(prefix.length), 10);
    return Number.isFinite(n) && n > max ? n : max;
  }, 0);
  return `${prefix}${String(maxN + 1).padStart(6, "0")}`;
}

/** Prochain numéro de facture FAC-AAAA-NNNNNN. */
export function nextInvoiceNumber(existingNumbers: (string | null | undefined)[], year: number): string {
  return nextSequentialNumber(existingNumbers, year, "FAC");
}
