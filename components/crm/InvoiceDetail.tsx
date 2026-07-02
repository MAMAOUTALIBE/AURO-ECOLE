"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Ban, Check, Printer, Send, Trash2 } from "lucide-react";
import { Badge, Skeleton, type BadgeVariant } from "@/components/crm/ui";
import { euros, invoiceDate, INVOICE_STATUS_LABELS, type InvoiceStatus } from "@/lib/invoice-mappers";

type Line = { label: string; quantity: number; unitAmountCents: number; vatRate: number };
type Snapshot = Record<string, string>;
type Invoice = {
  id: string;
  number: string | null;
  status: InvoiceStatus;
  clientUserId: string;
  lines: Line[];
  subtotalCents: number;
  vatCents: number;
  totalCents: number;
  issuerSnapshot?: Snapshot | null;
  clientSnapshot?: { name: string; email: string; address: string } | null;
  issuedAt?: string | null;
  dueDate?: string | null;
  paidAt?: string | null;
  notes?: string | null;
};
type Company = Record<string, string>;

const STATUS_VARIANT: Record<InvoiceStatus, BadgeVariant> = {
  BROUILLON: "neutral",
  EMISE: "info",
  PAYEE: "success",
  ANNULEE: "danger"
};

/** Regroupe les taux de TVA pour le récap par taux. */
function vatBreakdown(lines: Line[]) {
  const map = new Map<number, number>();
  for (const l of lines) {
    const ht = l.quantity * l.unitAmountCents;
    map.set(l.vatRate, (map.get(l.vatRate) ?? 0) + Math.round((ht * l.vatRate) / 100));
  }
  return [...map.entries()].filter(([rate]) => rate > 0);
}

export function InvoiceDetail({ id }: { id: string }) {
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [clientName, setClientName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    Promise.all([
      fetch(`/api/invoices/${id}`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch("/api/content/company").then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch("/api/students").then((r) => (r.ok ? r.json() : null)).catch(() => null)
    ])
      .then(([invoicePayload, companyPayload, studentPayload]) => {
        if (invoicePayload?.data) setInvoice(invoicePayload.data as Invoice);
        else setError(invoicePayload?.error?.message ?? "Facture introuvable.");
        if (companyPayload?.data) setCompany(companyPayload.data as Company);
        const inv = invoicePayload?.data as Invoice | undefined;
        if (inv && !inv.clientSnapshot && Array.isArray(studentPayload?.data)) {
          const s = studentPayload.data.find((x: { userId: string }) => x.userId === inv.clientUserId);
          if (s?.user) setClientName(`${s.user.firstName} ${s.user.lastName}`);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const act = async (run: () => Promise<Response>, confirmMsg?: string) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setBusy(true);
    setError(null);
    try {
      const response = await run();
      if (!response.ok && response.status !== 204) {
        const p = await response.json().catch(() => null);
        throw new Error(p?.error?.message ?? "Action impossible.");
      }
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action impossible.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const issue = async () => {
    const ok = await act(() => fetch(`/api/invoices/${id}/issue`, { method: "POST" }), "Émettre la facture ? Cela attribue un numéro définitif et fige le document (irréversible).");
    if (ok) load();
  };
  const setStatus = async (status: "PAYEE" | "ANNULEE", confirmMsg?: string) => {
    const ok = await act(() => fetch(`/api/invoices/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }), confirmMsg);
    if (ok) load();
  };
  const remove = async () => {
    const ok = await act(() => fetch(`/api/invoices/${id}`, { method: "DELETE" }), "Supprimer ce brouillon ?");
    if (ok) router.push("/admin/factures");
  };

  if (loading) return <Skeleton className="h-[60vh] w-full rounded-2xl" />;
  if (!invoice) return <p className="rounded-xl bg-rose-50 p-4 text-sm font-medium text-rose-700">{error ?? "Facture introuvable."}</p>;

  const issuer = invoice.issuerSnapshot ?? company ?? {};
  const client = invoice.clientSnapshot ?? { name: clientName || "Client", email: "", address: "" };
  const isDraft = invoice.status === "BROUILLON";
  const breakdown = vatBreakdown(invoice.lines);
  const issuerLine = (value?: string) => (value && value.trim() ? value : null);

  return (
    <div>
      {/* Barre d'action (non imprimée) */}
      <div className="print-hidden mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/factures" className="focus-ring inline-flex items-center gap-2 text-sm font-semibold text-loden-700 hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Factures
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={STATUS_VARIANT[invoice.status]}>{INVOICE_STATUS_LABELS[invoice.status]}</Badge>
          {isDraft ? (
            <>
              <button type="button" disabled={busy} onClick={issue} className="focus-ring inline-flex items-center gap-1.5 rounded-lg bg-loden-700 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-loden-800 disabled:opacity-60">
                <Send className="h-4 w-4" aria-hidden="true" /> Émettre
              </button>
              <button type="button" disabled={busy} onClick={remove} className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60">
                <Trash2 className="h-4 w-4" aria-hidden="true" /> Supprimer
              </button>
            </>
          ) : null}
          {invoice.status === "EMISE" ? (
            <button type="button" disabled={busy} onClick={() => setStatus("PAYEE")} className="focus-ring inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60">
              <Check className="h-4 w-4" aria-hidden="true" /> Marquer payée
            </button>
          ) : null}
          {invoice.status === "EMISE" || invoice.status === "PAYEE" ? (
            <button type="button" disabled={busy} onClick={() => setStatus("ANNULEE", "Annuler cette facture ? Le numéro est conservé.")} className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-loden-ink transition hover:bg-slate-50 disabled:opacity-60">
              <Ban className="h-4 w-4" aria-hidden="true" /> Annuler
            </button>
          ) : null}
          <button type="button" onClick={() => window.print()} className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-loden-ink transition hover:bg-loden-50">
            <Printer className="h-4 w-4" aria-hidden="true" /> Imprimer / PDF
          </button>
        </div>
      </div>

      {error ? <p className="print-hidden mb-4 rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700">{error}</p> : null}

      {/* Document imprimable */}
      <div className="invoice-print relative mx-auto max-w-[210mm] rounded-2xl border border-slate-200 bg-white p-5 shadow-soft sm:p-10">
        {isDraft || invoice.status === "ANNULEE" ? (
          <span className={`pointer-events-none absolute inset-0 flex items-center justify-center text-7xl font-black opacity-[0.07] ${invoice.status === "ANNULEE" ? "text-rose-600" : "text-slate-500"}`} aria-hidden="true">
            {invoice.status === "ANNULEE" ? "ANNULÉE" : "BROUILLON"}
          </span>
        ) : null}

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-2xl font-black tracking-tight text-loden-700">LODENE</p>
            <div className="mt-2 text-xs leading-5 text-loden-muted">
              {issuerLine(issuer.legalName) ? <p className="font-semibold text-loden-ink">{issuer.legalName}</p> : null}
              {issuerLine(issuer.legalForm) || issuerLine(issuer.capital) ? <p>{[issuer.legalForm, issuer.capital && `capital ${issuer.capital}`].filter(Boolean).join(" · ")}</p> : null}
              {issuerLine(issuer.address) ? <p>{issuer.address}</p> : null}
              {issuerLine(issuer.postalCode) || issuerLine(issuer.city) ? <p>{[issuer.postalCode, issuer.city].filter(Boolean).join(" ")}</p> : null}
              {issuerLine(issuer.siret) ? <p>SIRET : {issuer.siret}</p> : null}
              {issuerLine(issuer.approvalNumber) ? <p>Agrément : {issuer.approvalNumber}</p> : null}
              {issuerLine(issuer.phone) || issuerLine(issuer.email) ? <p>{[issuer.phone, issuer.email].filter(Boolean).join(" · ")}</p> : null}
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-loden-ink">{invoice.number ? `Facture N° ${invoice.number}` : "BROUILLON — non numérotée"}</p>
            <p className="mt-1 text-xs text-loden-muted">Date d&apos;émission : {invoiceDate(invoice.issuedAt)}</p>
            {invoice.dueDate ? <p className="text-xs text-loden-muted">Échéance : {invoiceDate(invoice.dueDate)}</p> : null}
          </div>
        </div>

        <div className="mt-8 rounded-xl bg-slate-50 p-4 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-loden-muted">Facturé à</p>
          <p className="mt-1 font-semibold text-loden-ink">{client.name || "—"}</p>
          {client.email ? <p className="text-xs text-loden-muted">{client.email}</p> : null}
          {client.address ? <p className="text-xs text-loden-muted">{client.address}</p> : null}
        </div>

        <div className="mt-8 grid gap-3 sm:hidden print:hidden">
          {invoice.lines.map((line, i) => (
            <article key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
              <p className="font-semibold text-loden-ink">{line.label}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-loden-muted">
                <p>Qté : <span className="font-semibold text-loden-ink">{line.quantity}</span></p>
                <p>TVA : <span className="font-semibold text-loden-ink">{line.vatRate}%</span></p>
                <p>PU HT : <span className="font-semibold text-loden-ink">{euros(line.unitAmountCents)}</span></p>
                <p>Total HT : <span className="font-semibold text-loden-ink">{euros(line.quantity * line.unitAmountCents)}</span></p>
              </div>
            </article>
          ))}
        </div>

        <table className="mt-8 hidden w-full text-left text-sm sm:table print:table">
          <thead className="border-b-2 border-slate-200 text-xs uppercase tracking-wide text-loden-muted">
            <tr>
              <th className="py-2 pr-4 font-semibold">Désignation</th>
              <th className="py-2 pr-4 text-right font-semibold">Qté</th>
              <th className="py-2 pr-4 text-right font-semibold">PU HT</th>
              <th className="py-2 pr-4 text-right font-semibold">TVA</th>
              <th className="py-2 text-right font-semibold">Total HT</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lines.map((line, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="py-2 pr-4 text-loden-ink">{line.label}</td>
                <td className="py-2 pr-4 text-right text-loden-muted">{line.quantity}</td>
                <td className="py-2 pr-4 text-right text-loden-muted">{euros(line.unitAmountCents)}</td>
                <td className="py-2 pr-4 text-right text-loden-muted">{line.vatRate}%</td>
                <td className="py-2 text-right font-medium text-loden-ink">{euros(line.quantity * line.unitAmountCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 flex justify-end">
          <div className="w-full max-w-xs space-y-1 text-sm">
            <div className="flex justify-between text-loden-muted"><span>Total HT</span><span>{euros(invoice.subtotalCents)}</span></div>
            {breakdown.length > 0 ? breakdown.map(([rate, cents]) => (
              <div key={rate} className="flex justify-between text-loden-muted"><span>TVA {rate}%</span><span>{euros(cents)}</span></div>
            )) : <div className="flex justify-between text-loden-muted"><span>TVA</span><span>{euros(invoice.vatCents)}</span></div>}
            <div className="flex justify-between border-t border-slate-200 pt-1 text-base font-bold text-loden-ink"><span>Total TTC</span><span>{euros(invoice.totalCents)}</span></div>
          </div>
        </div>

        {invoice.paidAt ? <p className="mt-6 text-sm font-semibold text-emerald-700">Payée le {invoiceDate(invoice.paidAt)}</p> : null}
        {invoice.notes ? <p className="mt-6 whitespace-pre-line text-xs text-loden-muted">{invoice.notes}</p> : null}

        <p className="mt-8 border-t border-slate-100 pt-4 text-[10px] leading-4 text-loden-muted">
          Document généré par un outil de gestion. Ce logiciel n&apos;est pas un système de caisse ni un logiciel comptable
          certifié (NF525). Les mentions légales, le régime et les taux de TVA relèvent de la responsabilité de l&apos;auto-école.
        </p>
      </div>
    </div>
  );
}
