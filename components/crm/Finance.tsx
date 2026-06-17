"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock, CreditCard, Plus, Search, Undo2 } from "lucide-react";
import { ACTIVE_AGENCY_KEY } from "@/components/AgencySwitcher";
import { KpiCard, Pagination } from "@/components/crm/ui";

const PAGE_SIZE = 10;

type Payment = {
  id: string;
  userId: string;
  kind: string;
  status: string;
  amountCents: number;
  createdAt: string;
  user: { firstName: string; lastName: string } | null;
};

type StudentOption = { id: string; userId: string; name: string };
type Installment = { id: string; studentId: string; label?: string | null; dueDate: string; amountCents: number; status: string };

const STATUSES = [
  { key: "EN_ATTENTE", label: "En attente" },
  { key: "PAYE", label: "Payé" },
  { key: "PARTIEL", label: "Partiel" },
  { key: "ECHOUE", label: "Échoué" },
  { key: "REMBOURSE", label: "Remboursé" }
];
const STATUS_STYLES: Record<string, string> = {
  EN_ATTENTE: "bg-amber-50 text-amber-700",
  PAYE: "bg-emerald-50 text-emerald-700",
  PARTIEL: "bg-sky-50 text-sky-700",
  ECHOUE: "bg-red-50 text-red-700",
  REMBOURSE: "bg-slate-100 text-slate-600"
};
const KINDS = [
  { key: "FORMATION", label: "Formation" },
  { key: "ACOMPTE", label: "Acompte" },
  { key: "ECHEANCE", label: "Échéance" },
  { key: "REMBOURSEMENT", label: "Remboursement" }
];

function euros(cents: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(cents / 100);
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export function Finance() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ studentUserId: "", amountEuros: "", kind: "FORMATION" });
  const [busy, setBusy] = useState(false);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [plan, setPlan] = useState({ studentId: "", totalEuros: "", count: "3", startDate: "" });
  const [planBusy, setPlanBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const agency = window.localStorage.getItem(ACTIVE_AGENCY_KEY);
    const query = agency && agency !== "all" ? `?agencyId=${encodeURIComponent(agency)}` : "";

    Promise.all([
      fetch(`/api/payments${query}`).then((r) => r.json()).catch(() => null),
      fetch("/api/students").then((r) => r.json()).catch(() => null),
      fetch(`/api/installments${query}`).then((r) => r.json()).catch(() => null)
    ])
      .then(([paymentPayload, studentPayload, installmentPayload]) => {
        if (Array.isArray(paymentPayload?.data)) setPayments(paymentPayload.data as Payment[]);
        else setError(paymentPayload?.error?.message ?? "Impossible de charger les paiements.");
        if (Array.isArray(studentPayload?.data)) {
          setStudents(
            studentPayload.data.map((s: { id: string; userId: string; user: { firstName: string; lastName: string } | null }) => ({
              id: s.id,
              userId: s.userId,
              name: s.user ? `${s.user.firstName} ${s.user.lastName}` : s.id
            }))
          );
        }
        if (Array.isArray(installmentPayload?.data)) setInstallments(installmentPayload.data as Installment[]);
      })
      .finally(() => setLoading(false));
  }, []);

  const studentNameById = (id: string) => students.find((s) => s.id === id)?.name ?? "—";

  const createPlan = async () => {
    const total = Math.round(Number(plan.totalEuros) * 100);
    if (!plan.studentId || !plan.startDate || !Number.isFinite(total) || total <= 0) {
      setError("Renseigne un élève, un montant et une date de départ.");
      return;
    }
    setPlanBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/installments/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: plan.studentId, totalCents: total, count: Number(plan.count), startDate: plan.startDate })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error?.message ?? "Échéancier impossible.");
      setInstallments((current) => [...(payload.data as Installment[]), ...current].sort((a, b) => a.dueDate.localeCompare(b.dueDate)));
      setPlan({ studentId: "", totalEuros: "", count: "3", startDate: "" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échéancier impossible.");
    } finally {
      setPlanBusy(false);
    }
  };

  const markInstallment = async (installment: Installment, status: string) => {
    try {
      const response = await fetch(`/api/installments/${installment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error();
      setInstallments((current) => current.map((item) => (item.id === installment.id ? { ...item, status } : item)));
    } catch {
      setError("Mise à jour de l'échéance impossible.");
    }
  };

  const totals = {
    paid: payments.filter((p) => p.status === "PAYE").reduce((s, p) => s + p.amountCents, 0),
    pending: payments.filter((p) => p.status === "EN_ATTENTE").reduce((s, p) => s + p.amountCents, 0),
    refunded: payments.filter((p) => p.status === "REMBOURSE").reduce((s, p) => s + p.amountCents, 0)
  };

  const payerName = (payment: Payment) => (payment.user ? `${payment.user.firstName} ${payment.user.lastName}` : "—");

  const filteredPayments = useMemo(() => {
    const q = query.trim().toLowerCase();
    return payments.filter((payment) => {
      const name = (payment.user ? `${payment.user.firstName} ${payment.user.lastName}` : "").toLowerCase();
      return (!q || name.includes(q)) && (statusFilter === "ALL" || payment.status === statusFilter);
    });
  }, [payments, query, statusFilter]);
  const pagedPayments = filteredPayments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter]);

  const record = async () => {
    const amount = Math.round(Number(form.amountEuros) * 100);
    if (!form.studentUserId || !Number.isFinite(amount) || amount <= 0) {
      setError("Sélectionne un élève et un montant valide.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: form.studentUserId, amountCents: amount, kind: form.kind, status: "PAYE" })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error?.message ?? "Enregistrement impossible.");
      const student = students.find((s) => s.userId === form.studentUserId);
      const created = { ...(payload.data as Payment), user: student ? { firstName: student.name.split(" ")[0], lastName: student.name.split(" ").slice(1).join(" ") } : null };
      setPayments((current) => [created, ...current]);
      setForm({ studentUserId: "", amountEuros: "", kind: "FORMATION" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enregistrement impossible.");
    } finally {
      setBusy(false);
    }
  };

  const setStatus = async (payment: Payment, status: string) => {
    try {
      const response = await fetch(`/api/payments/${payment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error();
      setPayments((current) => current.map((item) => (item.id === payment.id ? { ...item, status } : item)));
    } catch {
      setError("Mise à jour du paiement impossible.");
    }
  };

  return (
    <div className="grid gap-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard icon={CreditCard} label="Encaissé" value={euros(totals.paid)} accent="emerald" />
        <KpiCard icon={Clock} label="En attente" value={euros(totals.pending)} accent="amber" />
        <KpiCard icon={Undo2} label="Remboursé" value={euros(totals.refunded)} accent="rose" />
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <h2 className="text-lg font-semibold text-loden-ink">Enregistrer un paiement</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select className="field-input" value={form.studentUserId} onChange={(e) => setForm({ ...form, studentUserId: e.target.value })} aria-label="Élève">
            <option value="">— Élève —</option>
            {students.map((s) => <option key={s.id} value={s.userId}>{s.name}</option>)}
          </select>
          <select className="field-input" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })} aria-label="Type">
            {KINDS.map((k) => <option key={k.key} value={k.key}>{k.label}</option>)}
          </select>
          <input type="number" min={0} step="1" className="field-input" placeholder="Montant (€)" value={form.amountEuros} onChange={(e) => setForm({ ...form, amountEuros: e.target.value })} aria-label="Montant en euros" />
          <button
            type="button"
            onClick={record}
            disabled={busy}
            className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-loden-700 px-6 py-3 font-semibold text-white shadow-soft transition hover:bg-loden-800 disabled:opacity-70"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {busy ? "…" : "Enregistrer"}
          </button>
        </div>
        {error ? <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700">{error}</p> : null}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-loden-ink">Paiements</h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[180px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un élève…"
                aria-label="Rechercher un paiement"
                className="focus-ring w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-loden-200 focus:bg-white"
              />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filtrer par statut" className="field-input sm:max-w-[180px]">
              <option value="ALL">Tous les statuts</option>
              {STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
        </div>
        {loading ? <p className="mt-6 text-sm text-loden-muted">Chargement…</p> : null}
        {!loading ? (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-loden-muted">
                <tr className="border-b border-slate-200">
                  <th className="py-3 pr-4 font-semibold">Élève</th>
                  <th className="py-3 pr-4 font-semibold">Type</th>
                  <th className="py-3 pr-4 font-semibold">Montant</th>
                  <th className="py-3 pr-4 font-semibold">Date</th>
                  <th className="py-3 pr-4 font-semibold">Statut</th>
                </tr>
              </thead>
              <tbody>
                {pagedPayments.map((payment) => (
                  <tr key={payment.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 pr-4 font-semibold text-loden-ink">{payerName(payment)}</td>
                    <td className="py-3 pr-4 text-loden-muted">{KINDS.find((k) => k.key === payment.kind)?.label ?? payment.kind}</td>
                    <td className="py-3 pr-4 font-semibold text-loden-ink">{euros(payment.amountCents)}</td>
                    <td className="py-3 pr-4 text-loden-muted">{fmtDate(payment.createdAt)}</td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[payment.status]}`}>
                          {STATUSES.find((s) => s.key === payment.status)?.label ?? payment.status}
                        </span>
                        <select
                          aria-label="Changer le statut"
                          className="focus-ring cursor-pointer rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-loden-ink outline-none"
                          value={payment.status}
                          onChange={(e) => setStatus(payment, e.target.value)}
                        >
                          {STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredPayments.length === 0 ? (
                  <tr><td colSpan={5} className="py-6 text-center text-sm text-loden-muted">
                    {payments.length === 0 ? "Aucun paiement." : "Aucun paiement ne correspond."}
                  </td></tr>
                ) : null}
              </tbody>
            </table>
            <Pagination page={page} pageSize={PAGE_SIZE} total={filteredPayments.length} onPage={setPage} />
          </div>
        ) : null}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <h2 className="text-lg font-semibold text-loden-ink">Paiement en plusieurs fois</h2>
        <p className="mt-1 text-sm text-loden-muted">Génère un échéancier 3× ou 4× réparti sur les mois suivants.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <select className="field-input lg:col-span-2" value={plan.studentId} onChange={(e) => setPlan({ ...plan, studentId: e.target.value })} aria-label="Élève">
            <option value="">— Élève —</option>
            {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input type="number" min={0} className="field-input" placeholder="Total (€)" value={plan.totalEuros} onChange={(e) => setPlan({ ...plan, totalEuros: e.target.value })} aria-label="Total en euros" />
          <select className="field-input" value={plan.count} onChange={(e) => setPlan({ ...plan, count: e.target.value })} aria-label="Nombre de fois">
            <option value="2">2×</option>
            <option value="3">3×</option>
            <option value="4">4×</option>
          </select>
          <input type="date" className="field-input" value={plan.startDate} onChange={(e) => setPlan({ ...plan, startDate: e.target.value })} aria-label="Première échéance" />
        </div>
        <button
          type="button"
          onClick={createPlan}
          disabled={planBusy}
          className="focus-ring mt-4 inline-flex items-center gap-2 rounded-full bg-loden-700 px-6 py-3 font-semibold text-white shadow-soft transition hover:bg-loden-800 disabled:opacity-70"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {planBusy ? "Génération…" : "Générer l'échéancier"}
        </button>

        {installments.length > 0 ? (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-loden-muted">
                <tr className="border-b border-slate-200">
                  <th className="py-3 pr-4 font-semibold">Élève</th>
                  <th className="py-3 pr-4 font-semibold">Échéance</th>
                  <th className="py-3 pr-4 font-semibold">Date</th>
                  <th className="py-3 pr-4 font-semibold">Montant</th>
                  <th className="py-3 pr-4 font-semibold">Statut</th>
                </tr>
              </thead>
              <tbody>
                {installments.map((installment) => (
                  <tr key={installment.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 pr-4 font-semibold text-loden-ink">{studentNameById(installment.studentId)}</td>
                    <td className="py-3 pr-4 text-loden-muted">{installment.label}</td>
                    <td className="py-3 pr-4 text-loden-muted">{fmtDate(installment.dueDate)}</td>
                    <td className="py-3 pr-4 font-semibold text-loden-ink">{euros(installment.amountCents)}</td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${installment.status === "PAYE" ? "bg-emerald-50 text-emerald-700" : installment.status === "EN_RETARD" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                          {installment.status === "PAYE" ? "Payée" : installment.status === "EN_RETARD" ? "En retard" : "En attente"}
                        </span>
                        {installment.status !== "PAYE" ? (
                          <button type="button" onClick={() => markInstallment(installment, "PAYE")} className="focus-ring rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-loden-700 hover:bg-loden-50">
                            Marquer payée
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
}
