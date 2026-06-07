"use client";

import { useEffect, useState } from "react";
import { Award, Plus } from "lucide-react";

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

  return (
    <div className="grid gap-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
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

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-loden-50 text-loden-700">
            <Award className="h-5 w-5" aria-hidden="true" />
          </span>
          <h2 className="text-lg font-semibold text-loden-ink">Examens</h2>
        </div>
        {loading ? <p className="mt-6 text-sm text-loden-muted">Chargement…</p> : null}
        {!loading ? (
          <div className="mt-6 overflow-x-auto">
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
                {exams.map((exam) => (
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
                      </div>
                    </td>
                  </tr>
                ))}
                {exams.length === 0 ? (
                  <tr><td colSpan={4} className="py-6 text-center text-sm text-loden-muted">Aucun examen programmé.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
}
