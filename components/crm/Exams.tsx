"use client";

import { useEffect, useMemo, useState } from "react";
import { Award, Plus, Search } from "lucide-react";
import { Pagination } from "@/components/crm/ui";

const PAGE_SIZE = 10;

type Exam = {
  id: string;
  studentId: string;
  type: string;
  scheduledAt: string;
  center?: string | null;
  result: string;
  score?: number | null;
};

type StudentOption = { id: string; name: string };

const TYPES = [
  { key: "CODE", label: "Code" },
  { key: "CONDUITE", label: "Conduite" }
];
const RESULTS = [
  { key: "EN_ATTENTE", label: "En attente" },
  { key: "REUSSI", label: "Réussi" },
  { key: "ECHOUE", label: "Échoué" },
  { key: "ABSENT", label: "Absent" }
];
const RESULT_STYLES: Record<string, string> = {
  EN_ATTENTE: "bg-amber-50 text-amber-700",
  REUSSI: "bg-emerald-50 text-emerald-700",
  ECHOUE: "bg-red-50 text-red-700",
  ABSENT: "bg-slate-100 text-slate-600"
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export function Exams() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ studentId: "", type: "CODE", scheduledAt: "", center: "" });
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");
  const [resultFilter, setResultFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const load = () => {
    Promise.all([
      fetch("/api/exams").then((r) => r.json()).catch(() => null),
      fetch("/api/students").then((r) => r.json()).catch(() => null)
    ])
      .then(([examPayload, studentPayload]) => {
        if (Array.isArray(examPayload?.data)) setExams(examPayload.data as Exam[]);
        else setError(examPayload?.error?.message ?? "Impossible de charger les examens.");
        if (Array.isArray(studentPayload?.data)) {
          setStudents(
            studentPayload.data.map((s: { id: string; user: { firstName: string; lastName: string } | null }) => ({
              id: s.id,
              name: s.user ? `${s.user.firstName} ${s.user.lastName}` : s.id
            }))
          );
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const studentName = (id: string) => students.find((s) => s.id === id)?.name ?? id;

  const filteredExams = useMemo(() => {
    const q = query.trim().toLowerCase();
    return exams.filter((exam) => {
      const name = (students.find((s) => s.id === exam.studentId)?.name ?? "").toLowerCase();
      const matchesQuery = !q || name.includes(q) || (exam.center ?? "").toLowerCase().includes(q);
      const matchesResult = resultFilter === "ALL" || exam.result === resultFilter;
      return matchesQuery && matchesResult;
    });
  }, [exams, students, query, resultFilter]);
  const pagedExams = filteredExams.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [query, resultFilter]);

  const create = async () => {
    if (!form.studentId || !form.scheduledAt) {
      setError("Sélectionne un élève et une date.");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const response = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: form.studentId,
          type: form.type,
          scheduledAt: form.scheduledAt,
          ...(form.center ? { center: form.center } : {})
        })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error?.message ?? "Création impossible.");
      setExams((current) => [payload.data as Exam, ...current]);
      setForm({ studentId: "", type: "CODE", scheduledAt: "", center: "" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Création impossible.");
    } finally {
      setCreating(false);
    }
  };

  const updateResult = async (exam: Exam, result: string) => {
    try {
      const response = await fetch(`/api/exams/${exam.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result })
      });
      if (!response.ok) throw new Error();
      setExams((current) => current.map((item) => (item.id === exam.id ? { ...item, result } : item)));
    } catch {
      setError("Mise à jour du résultat impossible.");
    }
  };

  const updateScore = async (exam: Exam, value: string) => {
    if (value === "") return;
    const score = Number(value);
    if (Number.isNaN(score) || score < 0 || score > 100) {
      setError("Le score doit être compris entre 0 et 100.");
      return;
    }
    try {
      const response = await fetch(`/api/exams/${exam.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score })
      });
      if (!response.ok) throw new Error();
      setExams((current) => current.map((item) => (item.id === exam.id ? { ...item, score } : item)));
    } catch {
      setError("Mise à jour du score impossible.");
    }
  };

  return (
    <div className="grid gap-6">
      <div className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-soft sm:p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-loden-50 text-loden-700">
            <Plus className="h-5 w-5" aria-hidden="true" />
          </span>
          <h2 className="text-lg font-semibold text-loden-ink">Programmer un examen</h2>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select className="field-input" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} aria-label="Élève">
            <option value="">— Élève —</option>
            {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select className="field-input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} aria-label="Type d'examen">
            {TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
          <input type="date" className="field-input" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} aria-label="Date" />
          <input className="field-input" placeholder="Centre (optionnel)" value={form.center} onChange={(e) => setForm({ ...form, center: e.target.value })} aria-label="Centre" />
        </div>
        <button
          type="button"
          onClick={create}
          disabled={creating}
          className="focus-ring mt-4 inline-flex items-center gap-2 rounded-full bg-loden-700 px-6 py-3 font-semibold text-white shadow-soft transition hover:bg-loden-800 disabled:opacity-70"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {creating ? "Ajout…" : "Ajouter l'examen"}
        </button>
        {error ? <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700">{error}</p> : null}
      </div>

      <div className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-soft sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-loden-50 text-loden-700">
              <Award className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 className="text-lg font-semibold text-loden-ink">Examens</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[180px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher (élève, centre)…"
                aria-label="Rechercher un examen"
                className="focus-ring w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-loden-200 focus:bg-white"
              />
            </div>
            <select value={resultFilter} onChange={(e) => setResultFilter(e.target.value)} aria-label="Filtrer par résultat" className="field-input sm:max-w-[160px]">
              <option value="ALL">Tous les résultats</option>
              {RESULTS.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
            </select>
          </div>
        </div>
        {loading ? <p className="mt-6 text-sm text-loden-muted">Chargement…</p> : null}
        {!loading ? (
          <div className="mt-6">
            <div className="grid gap-3 md:hidden">
              {pagedExams.map((exam) => (
                <article key={exam.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-loden-ink">{studentName(exam.studentId)}</p>
                      <p className="mt-1 text-xs text-loden-muted">{TYPES.find((t) => t.key === exam.type)?.label ?? exam.type} · {fmtDate(exam.scheduledAt)}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${RESULT_STYLES[exam.result]}`}>
                      {RESULTS.find((r) => r.key === exam.result)?.label ?? exam.result}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-2">
                    <select
                      aria-label="Changer le résultat"
                      className="focus-ring w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-loden-ink outline-none"
                      value={exam.result}
                      onChange={(e) => updateResult(exam, e.target.value)}
                    >
                      {RESULTS.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
                    </select>
                    {exam.result === "REUSSI" || exam.result === "ECHOUE" ? (
                      <input
                        type="number"
                        min={0}
                        max={100}
                        defaultValue={exam.score ?? ""}
                        onBlur={(e) => updateScore(exam, e.target.value)}
                        placeholder="Score /100"
                        aria-label="Score sur 100"
                        className="focus-ring w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-loden-ink outline-none"
                      />
                    ) : exam.score != null ? (
                      <span className="text-xs font-semibold text-loden-muted">{exam.score}/100</span>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-loden-muted">
                <tr className="border-b border-slate-200">
                  <th className="py-3 pr-4 font-semibold">Élève</th>
                  <th className="py-3 pr-4 font-semibold">Type</th>
                  <th className="py-3 pr-4 font-semibold">Date</th>
                  <th className="py-3 pr-4 font-semibold">Résultat</th>
                </tr>
              </thead>
              <tbody>
                {pagedExams.map((exam) => (
                  <tr key={exam.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 pr-4 font-semibold text-loden-ink">{studentName(exam.studentId)}</td>
                    <td className="py-3 pr-4">{TYPES.find((t) => t.key === exam.type)?.label ?? exam.type}</td>
                    <td className="py-3 pr-4 text-loden-muted">{fmtDate(exam.scheduledAt)}</td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${RESULT_STYLES[exam.result]}`}>
                          {RESULTS.find((r) => r.key === exam.result)?.label ?? exam.result}
                        </span>
                        <select
                          aria-label="Changer le résultat"
                          className="focus-ring cursor-pointer rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-loden-ink outline-none"
                          value={exam.result}
                          onChange={(e) => updateResult(exam, e.target.value)}
                        >
                          {RESULTS.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
                        </select>
                        {exam.result === "REUSSI" || exam.result === "ECHOUE" ? (
                          <input
                            type="number"
                            min={0}
                            max={100}
                            defaultValue={exam.score ?? ""}
                            onBlur={(e) => updateScore(exam, e.target.value)}
                            placeholder="/100"
                            aria-label="Score sur 100"
                            className="focus-ring w-16 rounded-lg border border-slate-200 px-2 py-1 text-xs text-loden-ink outline-none"
                          />
                        ) : exam.score != null ? (
                          <span className="text-xs font-semibold text-loden-muted">{exam.score}/100</span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredExams.length === 0 ? (
                  <tr><td colSpan={4} className="py-6 text-center text-sm text-loden-muted">
                    {exams.length === 0 ? "Aucun examen programmé." : "Aucun examen ne correspond."}
                  </td></tr>
                ) : null}
              </tbody>
            </table>
            </div>
            <Pagination page={page} pageSize={PAGE_SIZE} total={filteredExams.length} onPage={setPage} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
