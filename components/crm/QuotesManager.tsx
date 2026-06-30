"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, FileSpreadsheet, Plus, Search, Trash2, X } from "lucide-react";
import { ACTIVE_AGENCY_KEY } from "@/components/AgencySwitcher";
import { Badge, Card, EmptyState, KpiCard, Pagination, SectionHeader, Skeleton, type BadgeVariant } from "@/components/crm/ui";
import { euros, quoteDate, previewTotals, VAT_RATES, QUOTE_STATUS_LABELS, type QuoteStatus } from "@/lib/quote-mappers";

const PAGE_SIZE = 10;

type Line = { label: string; quantity: number; unitAmountCents: number; vatRate: number };
type Quote = {
  id: string;
  number: string | null;
  status: QuoteStatus;
  clientUserId: string;
  lines: Line[];
  totalCents: number;
  sentAt?: string | null;
  validUntil?: string | null;
  clientSnapshot?: { name: string } | null;
  createdAt: string;
};
type StudentOpt = { id: string; userId: string; name: string };
type FormLine = { label: string; quantity: string; unitEuros: string; vatRate: number };

const STATUS_VARIANT: Record<QuoteStatus, BadgeVariant> = {
  BROUILLON: "neutral",
  ENVOYE: "info",
  ACCEPTE: "success",
  REFUSE: "danger",
  EXPIRE: "warning"
};
const STATUS_FILTERS = [
  { key: "ALL", label: "Tous" },
  { key: "BROUILLON", label: "Brouillons" },
  { key: "ENVOYE", label: "Envoyés" },
  { key: "ACCEPTE", label: "Acceptés" },
  { key: "REFUSE", label: "Refusés" },
  { key: "EXPIRE", label: "Expirés" }
];
const EMPTY_LINE: FormLine = { label: "", quantity: "1", unitEuros: "", vatRate: 0 };

export function QuotesManager() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [students, setStudents] = useState<StudentOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [clientUserId, setClientUserId] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<FormLine[]>([{ ...EMPTY_LINE }]);

  const load = () => {
    setLoading(true);
    const agency = window.localStorage.getItem(ACTIVE_AGENCY_KEY);
    const q = agency && agency !== "all" ? `?agencyId=${encodeURIComponent(agency)}` : "";
    Promise.all([
      fetch(`/api/quotes${q}`).then((r) => r.json()).catch(() => null),
      fetch("/api/students").then((r) => r.json()).catch(() => null)
    ])
      .then(([quotePayload, studentPayload]) => {
        if (Array.isArray(quotePayload?.data)) setQuotes(quotePayload.data as Quote[]);
        else setError(quotePayload?.error?.message ?? "Chargement des devis impossible.");
        if (Array.isArray(studentPayload?.data)) {
          setStudents(
            studentPayload.data.map((s: { id: string; userId: string; user: { firstName: string; lastName: string } | null }) => ({
              id: s.id,
              userId: s.userId,
              name: s.user ? `${s.user.firstName} ${s.user.lastName}` : s.id
            }))
          );
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const clientName = (qt: Quote) => qt.clientSnapshot?.name || students.find((s) => s.userId === qt.clientUserId)?.name || "Client";

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return quotes.filter((qt) => {
      const matchesQuery = !term || `${qt.number ?? ""} ${clientName(qt)}`.toLowerCase().includes(term);
      const matchesStatus = statusFilter === "ALL" || qt.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quotes, students, query, statusFilter]);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter]);

  const kpis = useMemo(() => {
    const sum = (status: QuoteStatus) => quotes.filter((q) => q.status === status).reduce((s, q) => s + q.totalCents, 0);
    return { accepted: sum("ACCEPTE"), pending: sum("ENVOYE"), drafts: quotes.filter((q) => q.status === "BROUILLON").length };
  }, [quotes]);

  const previewLines = lines
    .filter((l) => l.label.trim() && l.unitEuros !== "")
    .map((l) => ({ quantity: Number(l.quantity) || 0, unitAmountCents: Math.round(Number(l.unitEuros) * 100) || 0, vatRate: l.vatRate }));
  const preview = previewTotals(previewLines);

  const resetForm = () => {
    setClientUserId("");
    setValidUntil("");
    setNotes("");
    setLines([{ ...EMPTY_LINE }]);
    setFormOpen(false);
  };

  const create = async () => {
    const payloadLines = lines
      .filter((l) => l.label.trim())
      .map((l) => ({
        label: l.label.trim(),
        quantity: Math.max(1, Math.round(Number(l.quantity) || 1)),
        unitAmountCents: Math.max(0, Math.round(Number(l.unitEuros) * 100) || 0),
        vatRate: l.vatRate
      }));
    if (!clientUserId || payloadLines.length === 0) {
      setError("Sélectionne un client et au moins une ligne valide.");
      return;
    }
    const student = students.find((s) => s.userId === clientUserId);
    setCreating(true);
    setError(null);
    try {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientUserId,
          ...(student ? { studentId: student.id } : {}),
          lines: payloadLines,
          ...(validUntil ? { validUntil } : {}),
          ...(notes.trim() ? { notes: notes.trim() } : {})
        })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error?.message ?? "Création impossible.");
      resetForm();
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Création impossible.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard icon={FileSpreadsheet} label="Devis acceptés" value={loading ? "" : euros(kpis.accepted)} loading={loading} accent="emerald" />
        <KpiCard icon={FileSpreadsheet} label="En attente (envoyés)" value={loading ? "" : euros(kpis.pending)} loading={loading} accent="amber" />
        <KpiCard icon={FileSpreadsheet} label="Brouillons" value={loading ? "" : kpis.drafts} loading={loading} accent="brand" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher (n°, client)…"
              aria-label="Rechercher un devis"
              className="focus-ring w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-loden-200 focus:bg-white"
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filtrer par statut" className="field-input sm:max-w-[170px]">
            {STATUS_FILTERS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
          </select>
        </div>
      </div>

      {error ? <p className="rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700">{error}</p> : null}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-loden-50 text-loden-700">
            <FileSpreadsheet className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="font-semibold text-loden-ink">Devis</p>
            <p className="text-sm text-loden-muted">{quotes.length} devis</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => (formOpen ? resetForm() : setFormOpen(true))}
          className={`focus-ring inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold shadow-soft transition ${formOpen ? "border border-slate-200 bg-white text-loden-muted hover:bg-slate-50" : "bg-loden-700 text-white hover:bg-loden-800"}`}
        >
          {formOpen ? <X className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
          {formOpen ? "Fermer le formulaire" : "Nouveau devis"}
        </button>
      </div>

      {formOpen ? (
        <Card className="p-5">
          <SectionHeader title="Nouveau devis (brouillon)" subtitle="Le numéro est attribué à l'envoi, après relecture." icon={FileSpreadsheet} />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <select className="field-input" value={clientUserId} onChange={(e) => setClientUserId(e.target.value)} aria-label="Client">
              <option value="">— Client (élève / prospect) —</option>
              {students.map((s) => <option key={s.id} value={s.userId}>{s.name}</option>)}
            </select>
            <input type="date" className="field-input" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} aria-label="Valable jusqu'au" />
          </div>
          <div className="mt-4 space-y-2">
            <div className="hidden grid-cols-[1fr_70px_110px_90px_40px] gap-2 px-1 text-xs font-semibold uppercase tracking-wide text-loden-muted sm:grid">
              <span>Désignation</span><span>Qté</span><span>PU HT €</span><span>TVA</span><span />
            </div>
            {lines.map((line, i) => (
              <div key={i} className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_70px_110px_90px_40px]">
                <input className="field-input" placeholder="Désignation" value={line.label} onChange={(e) => setLines((cur) => cur.map((l, j) => (j === i ? { ...l, label: e.target.value } : l)))} aria-label="Désignation" />
                <input className="field-input" type="number" min={1} placeholder="Qté" value={line.quantity} onChange={(e) => setLines((cur) => cur.map((l, j) => (j === i ? { ...l, quantity: e.target.value } : l)))} aria-label="Quantité" />
                <input className="field-input" type="number" min={0} step="0.01" placeholder="PU HT" value={line.unitEuros} onChange={(e) => setLines((cur) => cur.map((l, j) => (j === i ? { ...l, unitEuros: e.target.value } : l)))} aria-label="Prix unitaire HT" />
                <select className="field-input" value={line.vatRate} onChange={(e) => setLines((cur) => cur.map((l, j) => (j === i ? { ...l, vatRate: Number(e.target.value) } : l)))} aria-label="TVA">
                  {VAT_RATES.map((r) => <option key={r} value={r}>{r}%</option>)}
                </select>
                <button type="button" onClick={() => setLines((cur) => (cur.length > 1 ? cur.filter((_, j) => j !== i) : cur))} aria-label="Supprimer la ligne" className="focus-ring flex h-11 items-center justify-center rounded-xl border border-slate-200 text-rose-500 hover:bg-rose-50">
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => setLines((cur) => [...cur, { ...EMPTY_LINE }])} className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-loden-700 hover:bg-loden-50">
              <Plus className="h-4 w-4" aria-hidden="true" /> Ajouter une ligne
            </button>
          </div>
          <textarea className="field-input mt-3 min-h-16" placeholder="Notes / conditions" value={notes} onChange={(e) => setNotes(e.target.value)} aria-label="Notes" />
          <div className="mt-3 flex flex-wrap items-end justify-between gap-3 border-t border-slate-100 pt-3">
            <div className="text-sm text-loden-muted">
              HT {euros(preview.subtotalCents)} · TVA {euros(preview.vatCents)} · <span className="font-bold text-loden-ink">TTC {euros(preview.totalCents)}</span>
            </div>
            <button type="button" onClick={create} disabled={creating} className="focus-ring inline-flex items-center gap-2 rounded-xl bg-loden-700 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-loden-800 disabled:opacity-70">
              <Plus className="h-4 w-4" aria-hidden="true" />
              {creating ? "Création…" : "Enregistrer le brouillon"}
            </button>
          </div>
        </Card>
      ) : null}

      <Card className="p-0">
        {loading ? (
          <div className="space-y-2 p-5">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={FileSpreadsheet} title={quotes.length === 0 ? "Aucun devis" : "Aucun résultat"} description={quotes.length === 0 ? "Crée un premier devis ci-dessus." : "Aucun devis ne correspond."} />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-loden-muted">
                  <tr className="border-b border-slate-200">
                    <th className="px-5 py-3 font-semibold">Numéro</th>
                    <th className="px-5 py-3 font-semibold">Client</th>
                    <th className="px-5 py-3 font-semibold">Valable jusqu&apos;au</th>
                    <th className="px-5 py-3 font-semibold">TTC</th>
                    <th className="px-5 py-3 font-semibold">Statut</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {paged.map((qt) => (
                    <tr key={qt.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-5 py-3 font-mono text-xs text-loden-ink">{qt.number ?? "—"}</td>
                      <td className="px-5 py-3 font-semibold text-loden-ink">{clientName(qt)}</td>
                      <td className="px-5 py-3 text-loden-muted">{qt.validUntil ? quoteDate(qt.validUntil) : "—"}</td>
                      <td className="px-5 py-3 font-semibold text-loden-ink">{euros(qt.totalCents)}</td>
                      <td className="px-5 py-3"><Badge variant={STATUS_VARIANT[qt.status]}>{QUOTE_STATUS_LABELS[qt.status]}</Badge></td>
                      <td className="px-5 py-3 text-right">
                        <Link href={`/admin/devis/${qt.id}`} className="focus-ring inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-loden-ink hover:bg-loden-50">
                          Ouvrir <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 pb-4">
              <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPage={setPage} />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
