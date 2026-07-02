"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BadgeCheck, Ban, Building2, CalendarDays, Check, FileText, Pencil, PenLine, Plus, Printer, Save, Send, ShieldCheck, Trash2, UserRound, X } from "lucide-react";
import { Badge, Skeleton, type BadgeVariant } from "@/components/crm/ui";
import { euros, quoteDate, previewTotals, QUOTE_STATUS_LABELS, VAT_RATES, type QuoteStatus } from "@/lib/quote-mappers";

const parseEuros = (v: string) => {
  const n = Number(String(v).replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

type Line = { label: string; quantity: number; unitAmountCents: number; vatRate: number };
type FormLine = { label: string; quantity: string; unitEuros: string; vatRate: number };
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
type QuotePayload = { data?: Quote; error?: { message?: string } };

const STATUS_VARIANT: Record<QuoteStatus, BadgeVariant> = {
  BROUILLON: "neutral",
  ENVOYE: "info",
  ACCEPTE: "success",
  REFUSE: "danger",
  EXPIRE: "warning"
};

const DOCUMENT_STATUS_CLASS: Record<QuoteStatus, string> = {
  BROUILLON: "border-slate-200 bg-white text-slate-700",
  ENVOYE: "border-loden-200 bg-loden-50 text-loden-800",
  ACCEPTE: "border-emerald-200 bg-emerald-50 text-emerald-800",
  REFUSE: "border-rose-200 bg-rose-50 text-rose-700",
  EXPIRE: "border-amber-200 bg-amber-50 text-amber-800"
};

const EMPTY_LINE: FormLine = { label: "", quantity: "1", unitEuros: "", vatRate: 0 };

function centsToEurosInput(cents: number) {
  const value = cents / 100;
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function isoToDateInput(iso?: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function lineToFormLine(line: Line): FormLine {
  return {
    label: line.label,
    quantity: String(line.quantity),
    unitEuros: centsToEurosInput(line.unitAmountCents),
    vatRate: line.vatRate
  };
}

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
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editLines, setEditLines] = useState<FormLine[]>([{ ...EMPTY_LINE }]);
  const [editValidUntil, setEditValidUntil] = useState("");
  const [editNotes, setEditNotes] = useState("");

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

  const openEditor = () => {
    if (!quote) return;
    setError(null);
    setEditLines(quote.lines.length > 0 ? quote.lines.map(lineToFormLine) : [{ ...EMPTY_LINE }]);
    setEditValidUntil(isoToDateInput(quote.validUntil));
    setEditNotes(quote.notes ?? "");
    setEditing(true);
  };

  const saveEdit = async () => {
    const payloadLines = editLines
      .filter((line) => line.label.trim())
      .map((line) => ({
        label: line.label.trim(),
        quantity: Math.max(1, Math.round(Number(line.quantity) || 1)),
        unitAmountCents: Math.max(0, Math.round(parseEuros(line.unitEuros) * 100)),
        vatRate: line.vatRate
      }));

    if (payloadLines.length === 0) {
      setError("Ajoutez au moins une ligne de devis.");
      return;
    }

    setSaving(true);
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/quotes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: payloadLines,
          validUntil: editValidUntil || null,
          notes: editNotes.trim() || null
        })
      });
      const payload = (await response.json().catch(() => null)) as QuotePayload | null;
      if (!response.ok || !payload?.data) {
        throw new Error(payload?.error?.message ?? "Modification impossible.");
      }
      setQuote(payload.data);
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Modification impossible.");
    } finally {
      setSaving(false);
      setBusy(false);
    }
  };

  if (loading) return <Skeleton className="h-[60vh] w-full rounded-2xl" />;
  if (!quote) return <p className="rounded-xl bg-rose-50 p-4 text-sm font-medium text-rose-700">{error ?? "Devis introuvable."}</p>;

  const issuer = quote.issuerSnapshot ?? company ?? {};
  const client = quote.clientSnapshot ?? { name: clientName || "Client", email: "", address: "" };
  const isDraft = quote.status === "BROUILLON";
  const breakdown = vatBreakdown(quote.lines);
  const line = (v?: string) => (v && v.trim() ? v : null);
  const watermark = isDraft ? "BROUILLON" : quote.status === "REFUSE" ? "REFUSÉ" : quote.status === "EXPIRE" ? "EXPIRÉ" : null;
  const editPreview = previewTotals(
    editLines
      .filter((item) => item.label.trim() && item.unitEuros !== "")
      .map((item) => ({
        quantity: Math.max(1, Math.round(Number(item.quantity) || 1)),
        unitAmountCents: Math.max(0, Math.round(parseEuros(item.unitEuros) * 100)),
        vatRate: item.vatRate
      }))
  );

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
              <button
                type="button"
                disabled={busy}
                onClick={editing ? () => setEditing(false) : openEditor}
                className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-loden-ink transition hover:bg-loden-50 disabled:opacity-60"
              >
                {editing ? <X className="h-4 w-4" aria-hidden="true" /> : <Pencil className="h-4 w-4" aria-hidden="true" />}
                {editing ? "Fermer l'édition" : "Modifier"}
              </button>
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

      {editing && isDraft ? (
        <div className="print-hidden mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-loden-ink">Modifier le brouillon</h2>
              <p className="mt-1 text-sm text-loden-muted">Les lignes restent modifiables tant que le devis n&apos;est pas envoyé.</p>
            </div>
            <button
              type="button"
              onClick={saveEdit}
              disabled={saving}
              className="focus-ring inline-flex items-center gap-2 rounded-xl bg-loden-700 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-loden-800 disabled:opacity-70"
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-loden-ink">
              Valable jusqu&apos;au
              <input type="date" className="field-input font-normal" value={editValidUntil} onChange={(event) => setEditValidUntil(event.target.value)} />
            </label>
          </div>

          <div className="mt-4 space-y-2">
            <div className="hidden grid-cols-[1fr_70px_110px_90px_40px] gap-2 px-1 text-xs font-semibold uppercase tracking-wide text-loden-muted sm:grid">
              <span>Désignation</span><span>Qté</span><span>PU HT €</span><span>TVA</span><span />
            </div>
            {editLines.map((item, index) => (
              <div key={index} className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_70px_110px_90px_40px]">
                <input
                  className="field-input"
                  placeholder="Désignation"
                  value={item.label}
                  onChange={(event) => setEditLines((current) => current.map((lineItem, itemIndex) => (itemIndex === index ? { ...lineItem, label: event.target.value } : lineItem)))}
                  aria-label="Désignation"
                />
                <input
                  className="field-input"
                  type="number"
                  min={1}
                  placeholder="Qté"
                  value={item.quantity}
                  onChange={(event) => setEditLines((current) => current.map((lineItem, itemIndex) => (itemIndex === index ? { ...lineItem, quantity: event.target.value } : lineItem)))}
                  aria-label="Quantité"
                />
                <input
                  className="field-input"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="PU HT"
                  value={item.unitEuros}
                  onChange={(event) => setEditLines((current) => current.map((lineItem, itemIndex) => (itemIndex === index ? { ...lineItem, unitEuros: event.target.value } : lineItem)))}
                  aria-label="Prix unitaire HT"
                />
                <select
                  className="field-input"
                  value={item.vatRate}
                  onChange={(event) => setEditLines((current) => current.map((lineItem, itemIndex) => (itemIndex === index ? { ...lineItem, vatRate: Number(event.target.value) } : lineItem)))}
                  aria-label="TVA"
                >
                  {VAT_RATES.map((rate) => <option key={rate} value={rate}>{rate}%</option>)}
                </select>
                <button
                  type="button"
                  onClick={() => setEditLines((current) => (current.length > 1 ? current.filter((_, itemIndex) => itemIndex !== index) : current))}
                  aria-label="Supprimer la ligne"
                  className="focus-ring flex h-11 items-center justify-center rounded-xl border border-slate-200 text-rose-500 hover:bg-rose-50"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setEditLines((current) => [...current, { ...EMPTY_LINE }])}
              className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-loden-700 hover:bg-loden-50"
            >
              <Plus className="h-4 w-4" aria-hidden="true" /> Ajouter une ligne
            </button>
          </div>

          <textarea className="field-input mt-3 min-h-16" placeholder="Notes / conditions" value={editNotes} onChange={(event) => setEditNotes(event.target.value)} aria-label="Notes" />
          <div className="mt-3 border-t border-slate-100 pt-3 text-sm text-loden-muted">
            HT {euros(editPreview.subtotalCents)} · TVA {euros(editPreview.vatCents)} · <span className="font-bold text-loden-ink">TTC {euros(editPreview.totalCents)}</span>
          </div>
        </div>
      ) : null}

      <div className="invoice-print quote-print relative mx-auto max-w-[210mm] overflow-hidden rounded-[1.75rem] border border-loden-100 bg-white shadow-[0_24px_90px_rgba(20,33,38,0.12)] print:rounded-none print:border-0 print:shadow-none">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#f3fcfd_0%,#ffffff_34%,#ffffff_100%)]" aria-hidden="true" />
        <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-loden-900 via-loden-500 to-loden-900" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-10 bottom-12 h-56 w-56 opacity-[0.035]" aria-hidden="true">
          <Image src="/lodene-logo.png" alt="" fill sizes="224px" className="object-contain" />
        </div>
        {watermark ? (
          <span className={`pointer-events-none absolute inset-0 flex rotate-[-14deg] items-center justify-center text-6xl font-black uppercase tracking-[0.18em] opacity-[0.06] sm:text-8xl ${quote.status === "REFUSE" ? "text-rose-600" : "text-loden-900"}`} aria-hidden="true">
            {watermark}
          </span>
        ) : null}

        <div className="relative p-5 sm:p-8">
          <header className="grid gap-6 border-b border-loden-100 pb-6 sm:grid-cols-[1fr_auto] sm:items-start">
            <div>
              <div className="inline-flex rounded-2xl bg-white p-2 shadow-sm ring-1 ring-loden-100">
                <Image src="/lodene-logo-wordmark.png" alt="LODENE Formation" width={1320} height={660} className="h-16 w-auto max-w-[220px] sm:h-20" priority={false} />
              </div>
              <p className="mt-4 max-w-md text-sm font-semibold leading-6 text-loden-muted">
                Auto-école, VTC, SST, logistique & sécurité à Conflans-Sainte-Honorine.
              </p>
            </div>

            <div className="rounded-2xl bg-loden-900 p-5 text-white shadow-[0_18px_45px_rgba(22,78,99,0.22)] sm:min-w-[240px] sm:text-right">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-loden-200">Devis</p>
              <p className="mt-2 text-xl font-black">{quote.number ?? "Non numéroté"}</p>
              <span className={`mt-4 inline-flex rounded-full border px-3 py-1 text-xs font-black ${DOCUMENT_STATUS_CLASS[quote.status]}`}>
                {QUOTE_STATUS_LABELS[quote.status]}
              </span>
            </div>
          </header>

          <section className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-loden-100 bg-white/85 p-4 shadow-sm">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-loden-50 text-loden-700">
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
              </span>
              <p className="mt-3 text-[0.68rem] font-black uppercase tracking-[0.16em] text-loden-muted">Date d&apos;envoi</p>
              <p className="mt-1 text-sm font-black text-loden-ink">{quoteDate(quote.sentAt)}</p>
            </div>
            <div className="rounded-2xl border border-loden-100 bg-white/85 p-4 shadow-sm">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-loden-50 text-loden-700">
                <BadgeCheck className="h-4 w-4" aria-hidden="true" />
              </span>
              <p className="mt-3 text-[0.68rem] font-black uppercase tracking-[0.16em] text-loden-muted">Validité</p>
              <p className="mt-1 text-sm font-black text-loden-ink">{quote.validUntil ? quoteDate(quote.validUntil) : "À confirmer"}</p>
            </div>
            <div className="rounded-2xl border border-loden-100 bg-loden-50 p-4 shadow-sm">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-loden-700">
                <FileText className="h-4 w-4" aria-hidden="true" />
              </span>
              <p className="mt-3 text-[0.68rem] font-black uppercase tracking-[0.16em] text-loden-muted">Montant TTC</p>
              <p className="mt-1 text-lg font-black text-loden-900">{euros(quote.totalCents)}</p>
            </div>
          </section>

          <section className="mt-6 grid gap-4 sm:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-loden-700">
                <Building2 className="h-4 w-4" aria-hidden="true" />
                Émis par
              </div>
              <div className="mt-4 text-sm leading-6 text-loden-muted">
                {line(issuer.legalName) ? <p className="font-black text-loden-ink">{issuer.legalName}</p> : <p className="font-black text-loden-ink">LODENE Formation</p>}
                {line(issuer.legalForm) || line(issuer.capital) ? <p>{[issuer.legalForm, issuer.capital && `capital ${issuer.capital}`].filter(Boolean).join(" · ")}</p> : null}
                {line(issuer.address) ? <p>{issuer.address}</p> : null}
                {line(issuer.postalCode) || line(issuer.city) ? <p>{[issuer.postalCode, issuer.city].filter(Boolean).join(" ")}</p> : null}
                {line(issuer.siret) ? <p>SIRET : {issuer.siret}</p> : null}
                {line(issuer.approvalNumber) ? <p>Agrément : {issuer.approvalNumber}</p> : null}
                {line(issuer.phone) || line(issuer.email) ? <p className="font-semibold text-loden-ink">{[issuer.phone, issuer.email].filter(Boolean).join(" · ")}</p> : null}
              </div>
            </article>

            <article className="rounded-2xl border border-loden-100 bg-loden-50/80 p-5">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-loden-700">
                <UserRound className="h-4 w-4" aria-hidden="true" />
                Devis pour
              </div>
              <div className="mt-4 text-sm leading-6 text-loden-muted">
                <p className="text-base font-black text-loden-ink">{client.name || "Client"}</p>
                {client.email ? <p>{client.email}</p> : null}
                {client.address ? <p>{client.address}</p> : null}
              </div>
            </article>
          </section>

          <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="bg-loden-900 px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-white">
              Détail de la proposition
            </div>

            <div className="grid gap-3 p-4 sm:hidden print:hidden">
              {quote.lines.map((item, index) => (
                <article key={index} className="rounded-xl border border-slate-200 bg-loden-fog p-3 text-sm">
                  <p className="font-black text-loden-ink">{item.label}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-loden-muted">
                    <p>Qté : <span className="font-bold text-loden-ink">{item.quantity}</span></p>
                    <p>TVA : <span className="font-bold text-loden-ink">{item.vatRate}%</span></p>
                    <p>PU HT : <span className="font-bold text-loden-ink">{euros(item.unitAmountCents)}</span></p>
                    <p>Total HT : <span className="font-bold text-loden-ink">{euros(item.quantity * item.unitAmountCents)}</span></p>
                  </div>
                </article>
              ))}
            </div>

            <table className="hidden w-full text-left text-sm sm:table print:table">
              <thead className="bg-loden-50 text-[0.68rem] uppercase tracking-[0.14em] text-loden-700">
                <tr>
                  <th className="px-5 py-3 font-black">Désignation</th>
                  <th className="px-3 py-3 text-right font-black">Qté</th>
                  <th className="px-3 py-3 text-right font-black">PU HT</th>
                  <th className="px-3 py-3 text-right font-black">TVA</th>
                  <th className="px-5 py-3 text-right font-black">Total HT</th>
                </tr>
              </thead>
              <tbody>
                {quote.lines.map((item, index) => (
                  <tr key={index} className="border-t border-slate-100">
                    <td className="px-5 py-4 font-semibold text-loden-ink">{item.label}</td>
                    <td className="px-3 py-4 text-right text-loden-muted">{item.quantity}</td>
                    <td className="px-3 py-4 text-right text-loden-muted">{euros(item.unitAmountCents)}</td>
                    <td className="px-3 py-4 text-right text-loden-muted">{item.vatRate}%</td>
                    <td className="px-5 py-4 text-right font-black text-loden-ink">{euros(item.quantity * item.unitAmountCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="mt-6 grid gap-5 lg:grid-cols-[1fr_340px]">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-loden-700">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Conditions
              </div>
              <p className="mt-3 text-xs leading-5 text-loden-muted">
                Devis valable selon les dates et disponibilités indiquées. Offre non contractuelle avant acceptation, validation administrative et règlement des conditions d&apos;inscription.
              </p>
              {quote.notes ? <p className="mt-4 whitespace-pre-line rounded-xl bg-loden-fog p-3 text-xs leading-5 text-loden-muted">{quote.notes}</p> : null}
            </div>

            <div className="rounded-2xl bg-loden-900 p-5 text-white shadow-[0_18px_45px_rgba(22,78,99,0.18)]">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-white/75"><span>Total HT</span><span>{euros(quote.subtotalCents)}</span></div>
                {breakdown.length > 0 ? breakdown.map(([rate, cents]) => (
                  <div key={rate} className="flex justify-between text-white/75"><span>TVA {rate}%</span><span>{euros(cents)}</span></div>
                )) : <div className="flex justify-between text-white/75"><span>TVA</span><span>{euros(quote.vatCents)}</span></div>}
              </div>
              <div className="mt-4 border-t border-white/15 pt-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-loden-200">Total à régler</p>
                <p className="mt-1 text-3xl font-black tracking-tight">{euros(quote.totalCents)}</p>
              </div>
            </div>
          </section>

          <section className="mt-7 grid gap-4 sm:grid-cols-2">
            <div className="min-h-28 rounded-2xl border border-dashed border-slate-300 bg-white p-5">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-loden-muted">
                <PenLine className="h-4 w-4" aria-hidden="true" />
                Signature client
              </div>
              <p className="mt-8 text-xs font-semibold text-loden-muted">Bon pour accord</p>
            </div>
            <div className="min-h-28 rounded-2xl border border-dashed border-slate-300 bg-white p-5">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-loden-muted">
                <PenLine className="h-4 w-4" aria-hidden="true" />
                Signature LODENE
              </div>
            </div>
          </section>

          <footer className="mt-8 border-t border-loden-100 pt-4 text-[10px] leading-4 text-loden-muted">
            <p className="font-semibold text-loden-ink">LODENE Formation — 30 rue Pierre Le Guen, 78700 Conflans-Sainte-Honorine — 06 60 32 50 87 — lodene.fr</p>
            <p className="mt-1">
              Document généré par un outil de gestion. Les mentions légales, le régime et les taux de TVA relèvent de la responsabilité de LODENE Formation.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
