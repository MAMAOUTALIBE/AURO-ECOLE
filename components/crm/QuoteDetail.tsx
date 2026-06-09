"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Ban, Check, Printer, Send, Trash2, X } from "lucide-react";
import { Badge, Skeleton, type BadgeVariant } from "@/components/crm/ui";
import { euros, quoteDate, QUOTE_STATUS_LABELS, type QuoteStatus } from "@/lib/quote-mappers";

type Line = { label: string; quantity: number; unitAmountCents: number; vatRate: number };
type Snapshot = Record<string, string>;
type Quote = {
  id: string;
  number: string | null;
  status: QuoteStatus;
  clientUserId: string;
  lines: Line[];
  subtotalCents: number;
  vatCents: number;
  totalCents: number;
  issuerSnapshot?: Snapshot | null;
  clientSnapshot?: { name: string; email: string; address: string } | null;
  sentAt?: string | null;
  validUntil?: string | null;
  decidedAt?: string | null;
  notes?: string | null;
};
type Company = Record<string, string>;

const STATUS_VARIANT: Record<QuoteStatus, BadgeVariant> = {
  BROUILLON: "neutral",
  ENVOYE: "info",
  ACCEPTE: "success",
  REFUSE: "danger",
  EXPIRE: "warning"
};

function vatBreakdown(lines: Line[]) {
  const map = new Map<number, number>();
  for (const l of lines) {
    const ht = l.quantity * l.unitAmountCents;
    map.set(l.vatRate, (map.get(l.vatRate) ?? 0) + Math.round((ht * l.vatRate) / 100));
  }
  return [...map.entries()].filter(([rate]) => rate > 0);
}

export function QuoteDetail({ id }: { id: string }) {
  const router = useRouter();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [clientName, setClientName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    Promise.all([
      fetch(`/api/quotes/${id}`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch("/api/content/company").then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch("/api/students").then((r) => (r.ok ? r.json() : null)).catch(() => null)
    ])
      .then(([quotePayload, companyPayload, studentPayload]) => {
        if (quotePayload?.data) setQuote(quotePayload.data as Quote);
        else setError(quotePayload?.error?.message ?? "Devis introuvable.");
        if (companyPayload?.data) setCompany(companyPayload.data as Company);
        const qt = quotePayload?.data as Quote | undefined;
        if (qt && !qt.clientSnapshot && Array.isArray(studentPayload?.data)) {
          const s = studentPayload.data.find((x: { userId: string }) => x.userId === qt.clientUserId);
          if (s?.user) setClientName(`${s.user.firstName} ${s.user.lastName}`);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const act = async (run: () => Promise<Response>, confirmMsg?: string) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return false;
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

  const send = async () => {
    if (await act(() => fetch(`/api/quotes/${id}/send`, { method: "POST" }), "Envoyer le devis ? Cela attribue un numéro définitif et fige le document.")) load();
  };
  const setStatus = async (status: "ACCEPTE" | "REFUSE" | "EXPIRE") => {
    if (await act(() => fetch(`/api/quotes/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }))) load();
  };
  const remove = async () => {
    if (await act(() => fetch(`/api/quotes/${id}`, { method: "DELETE" }), "Supprimer ce brouillon ?")) router.push("/admin/devis");
  };

  if (loading) return <Skeleton className="h-[60vh] w-full rounded-2xl" />;
  if (!quote) return <p className="rounded-xl bg-rose-50 p-4 text-sm font-medium text-rose-700">{error ?? "Devis introuvable."}</p>;

  const issuer = quote.issuerSnapshot ?? company ?? {};
  const client = quote.clientSnapshot ?? { name: clientName || "Client", email: "", address: "" };
  const isDraft = quote.status === "BROUILLON";
  const breakdown = vatBreakdown(quote.lines);
  const line = (v?: string) => (v && v.trim() ? v : null);
  const watermark = isDraft ? "BROUILLON" : quote.status === "REFUSE" ? "REFUSÉ" : quote.status === "EXPIRE" ? "EXPIRÉ" : null;

  return (
    <div>
      <div className="print-hidden mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/devis" className="focus-ring inline-flex items-center gap-2 text-sm font-semibold text-loden-700 hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Devis
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={STATUS_VARIANT[quote.status]}>{QUOTE_STATUS_LABELS[quote.status]}</Badge>
          {isDraft ? (
            <>
              <button type="button" disabled={busy} onClick={send} className="focus-ring inline-flex items-center gap-1.5 rounded-lg bg-loden-700 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-loden-800 disabled:opacity-60">
                <Send className="h-4 w-4" aria-hidden="true" /> Envoyer
              </button>
              <button type="button" disabled={busy} onClick={remove} className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60">
                <Trash2 className="h-4 w-4" aria-hidden="true" /> Supprimer
              </button>
            </>
          ) : null}
          {quote.status === "ENVOYE" ? (
            <>
              <button type="button" disabled={busy} onClick={() => setStatus("ACCEPTE")} className="focus-ring inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60">
                <Check className="h-4 w-4" aria-hidden="true" /> Accepté
              </button>
              <button type="button" disabled={busy} onClick={() => setStatus("REFUSE")} className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60">
                <X className="h-4 w-4" aria-hidden="true" /> Refusé
              </button>
              <button type="button" disabled={busy} onClick={() => setStatus("EXPIRE")} className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-loden-ink transition hover:bg-slate-50 disabled:opacity-60">
                <Ban className="h-4 w-4" aria-hidden="true" /> Expiré
              </button>
            </>
          ) : null}
          <button type="button" onClick={() => window.print()} className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-loden-ink transition hover:bg-loden-50">
            <Printer className="h-4 w-4" aria-hidden="true" /> Imprimer / PDF
          </button>
        </div>
      </div>

      {error ? <p className="print-hidden mb-4 rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700">{error}</p> : null}

      <div className="invoice-print relative mx-auto max-w-[210mm] rounded-2xl border border-slate-200 bg-white p-8 shadow-soft sm:p-10">
        {watermark ? (
          <span className={`pointer-events-none absolute inset-0 flex items-center justify-center text-7xl font-black opacity-[0.07] ${quote.status === "REFUSE" ? "text-rose-600" : "text-slate-500"}`} aria-hidden="true">
            {watermark}
          </span>
        ) : null}

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-2xl font-black tracking-tight text-loden-700">LODENE</p>
            <div className="mt-2 text-xs leading-5 text-loden-muted">
              {line(issuer.legalName) ? <p className="font-semibold text-loden-ink">{issuer.legalName}</p> : null}
              {line(issuer.address) ? <p>{issuer.address}</p> : null}
              {line(issuer.postalCode) || line(issuer.city) ? <p>{[issuer.postalCode, issuer.city].filter(Boolean).join(" ")}</p> : null}
              {line(issuer.siret) ? <p>SIRET : {issuer.siret}</p> : null}
              {line(issuer.approvalNumber) ? <p>Agrément : {issuer.approvalNumber}</p> : null}
              {line(issuer.phone) || line(issuer.email) ? <p>{[issuer.phone, issuer.email].filter(Boolean).join(" · ")}</p> : null}
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-loden-ink">{quote.number ? `Devis N° ${quote.number}` : "BROUILLON — non numéroté"}</p>
            <p className="mt-1 text-xs text-loden-muted">Date d&apos;envoi : {quoteDate(quote.sentAt)}</p>
            {quote.validUntil ? <p className="text-xs text-loden-muted">Valable jusqu&apos;au : {quoteDate(quote.validUntil)}</p> : null}
          </div>
        </div>

        <div className="mt-8 rounded-xl bg-slate-50 p-4 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-loden-muted">Devis pour</p>
          <p className="mt-1 font-semibold text-loden-ink">{client.name || "—"}</p>
          {client.email ? <p className="text-xs text-loden-muted">{client.email}</p> : null}
          {client.address ? <p className="text-xs text-loden-muted">{client.address}</p> : null}
        </div>

        <table className="mt-8 w-full text-left text-sm">
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
            {quote.lines.map((l, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="py-2 pr-4 text-loden-ink">{l.label}</td>
                <td className="py-2 pr-4 text-right text-loden-muted">{l.quantity}</td>
                <td className="py-2 pr-4 text-right text-loden-muted">{euros(l.unitAmountCents)}</td>
                <td className="py-2 pr-4 text-right text-loden-muted">{l.vatRate}%</td>
                <td className="py-2 text-right font-medium text-loden-ink">{euros(l.quantity * l.unitAmountCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 flex justify-end">
          <div className="w-full max-w-xs space-y-1 text-sm">
            <div className="flex justify-between text-loden-muted"><span>Total HT</span><span>{euros(quote.subtotalCents)}</span></div>
            {breakdown.length > 0 ? breakdown.map(([rate, cents]) => (
              <div key={rate} className="flex justify-between text-loden-muted"><span>TVA {rate}%</span><span>{euros(cents)}</span></div>
            )) : <div className="flex justify-between text-loden-muted"><span>TVA</span><span>{euros(quote.vatCents)}</span></div>}
            <div className="flex justify-between border-t border-slate-200 pt-1 text-base font-bold text-loden-ink"><span>Total TTC</span><span>{euros(quote.totalCents)}</span></div>
          </div>
        </div>

        {quote.notes ? <p className="mt-6 whitespace-pre-line text-xs text-loden-muted">{quote.notes}</p> : null}
        <p className="mt-8 border-t border-slate-100 pt-4 text-[10px] leading-4 text-loden-muted">
          Devis sans valeur contractuelle jusqu&apos;à acceptation. Document généré par un outil de gestion (non certifié fiscalement).
        </p>
      </div>
    </div>
  );
}
