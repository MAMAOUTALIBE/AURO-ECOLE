"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { FILE_STATUS_LABELS } from "@/components/crm/StudentsList";

type StudentDetail = {
  id: string;
  agencyId?: string | null;
  formationId?: string | null;
  fileStatus: string;
  progressPercent: number;
  purchasedHours: number;
  consumedHours: number;
  examDate?: string | null;
  internalNotes?: string | null;
  user: { firstName: string; lastName: string; email: string; phone?: string | null } | null;
};

type Option = { id: string; label: string };
type Skill = { code: string; label: string; level: number };

function toDateInput(value?: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

export function StudentFile({ studentId }: { studentId: string }) {
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [agencies, setAgencies] = useState<Option[]>([]);
  const [formations, setFormations] = useState<Option[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [status, setStatus] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/students/${studentId}`).then((r) => r.json()).catch(() => null),
      fetch("/api/agencies").then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch("/api/formations").then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch(`/api/students/${studentId}/skills`).then((r) => (r.ok ? r.json() : null)).catch(() => null)
    ])
      .then(([studentPayload, agencyPayload, formationPayload, skillPayload]) => {
        if (studentPayload?.data) setStudent(studentPayload.data as StudentDetail);
        else setStatus({ tone: "error", text: studentPayload?.error?.message ?? "Élève introuvable." });
        if (Array.isArray(agencyPayload?.data)) {
          setAgencies(agencyPayload.data.map((a: { id: string; name: string }) => ({ id: a.id, label: a.name })));
        }
        if (Array.isArray(formationPayload?.data)) {
          setFormations(formationPayload.data.map((f: { id: string; title: string }) => ({ id: f.id, label: f.title })));
        }
        if (Array.isArray(skillPayload?.data)) setSkills(skillPayload.data as Skill[]);
      })
      .finally(() => setLoading(false));
  }, [studentId]);

  const update = (patch: Partial<StudentDetail>) => setStudent((current) => (current ? { ...current, ...patch } : current));

  const save = async () => {
    if (!student) return;
    setSaving(true);
    setStatus(null);

    const body: Record<string, unknown> = {
      fileStatus: student.fileStatus,
      progressPercent: Number(student.progressPercent),
      purchasedHours: Number(student.purchasedHours),
      consumedHours: Number(student.consumedHours),
      internalNotes: student.internalNotes ?? ""
    };
    if (student.formationId) body.formationId = student.formationId;
    if (student.agencyId) body.agencyId = student.agencyId;
    if (student.examDate) body.examDate = student.examDate;

    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error?.message ?? "Échec de l'enregistrement.");
      setStudent(payload.data as StudentDetail);
      setStatus({ tone: "success", text: "Dossier enregistré." });
    } catch (error) {
      setStatus({ tone: "error", text: error instanceof Error ? error.message : "Échec de l'enregistrement." });
    } finally {
      setSaving(false);
    }
  };

  const setSkillLevel = async (code: string, level: number) => {
    try {
      const response = await fetch(`/api/students/${studentId}/skills`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillCode: code, level })
      });
      if (!response.ok) throw new Error();
      setSkills((current) => current.map((skill) => (skill.code === code ? { ...skill, level } : skill)));
    } catch {
      setStatus({ tone: "error", text: "Mise à jour de la compétence impossible." });
    }
  };

  if (loading) return <p className="text-sm text-loden-muted">Chargement du dossier…</p>;
  if (!student) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <p className="rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700">{status?.text ?? "Élève introuvable."}</p>
        <Link href="/admin/eleves" className="focus-ring mt-4 inline-flex items-center gap-2 text-sm font-semibold text-loden-700">
          <ArrowLeft className="h-4 w-4" /> Retour à la liste
        </Link>
      </div>
    );
  }

  const fullName = student.user ? `${student.user.firstName} ${student.user.lastName}` : "Élève";

  return (
    <div className="grid gap-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
      <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <Link href="/admin/eleves" className="focus-ring inline-flex items-center gap-2 text-sm font-semibold text-loden-700">
          <ArrowLeft className="h-4 w-4" /> Élèves
        </Link>
        <h2 className="mt-4 text-2xl font-semibold text-loden-ink">{fullName}</h2>
        <p className="mt-1 text-sm text-loden-muted">{student.user?.email}</p>
        {student.user?.phone ? <p className="text-sm text-loden-muted">{student.user.phone}</p> : null}
        <div className="mt-5 grid gap-3 text-sm">
          <div className="flex justify-between"><span className="text-loden-muted">Statut</span><span className="font-semibold text-loden-ink">{FILE_STATUS_LABELS[student.fileStatus] ?? student.fileStatus}</span></div>
          <div className="flex justify-between"><span className="text-loden-muted">Progression</span><span className="font-semibold text-loden-ink">{student.progressPercent}%</span></div>
          <div className="flex justify-between"><span className="text-loden-muted">Heures</span><span className="font-semibold text-loden-ink">{student.consumedHours}/{student.purchasedHours}</span></div>
        </div>
      </aside>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <h3 className="text-lg font-semibold text-loden-ink">Modifier le dossier</h3>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Statut du dossier">
            <select className="field-input" value={student.fileStatus} onChange={(e) => update({ fileStatus: e.target.value })}>
              {Object.entries(FILE_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </Field>
          <Field label="Agence">
            <select className="field-input" value={student.agencyId ?? ""} onChange={(e) => update({ agencyId: e.target.value || null })}>
              <option value="">— Non rattaché —</option>
              {agencies.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
            </select>
          </Field>
          <Field label="Formation">
            <select className="field-input" value={student.formationId ?? ""} onChange={(e) => update({ formationId: e.target.value || null })}>
              <option value="">— Aucune —</option>
              {formations.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
          </Field>
          <Field label="Date d'examen">
            <input type="date" className="field-input" value={toDateInput(student.examDate)} onChange={(e) => update({ examDate: e.target.value || null })} />
          </Field>
          <Field label="Progression (%)">
            <input type="number" min={0} max={100} className="field-input" value={student.progressPercent} onChange={(e) => update({ progressPercent: Number(e.target.value) })} />
          </Field>
          <Field label="Heures achetées">
            <input type="number" min={0} className="field-input" value={student.purchasedHours} onChange={(e) => update({ purchasedHours: Number(e.target.value) })} />
          </Field>
          <Field label="Heures consommées">
            <input type="number" min={0} className="field-input" value={student.consumedHours} onChange={(e) => update({ consumedHours: Number(e.target.value) })} />
          </Field>
          <Field label="Notes internes" className="sm:col-span-2">
            <textarea className="field-input min-h-24" value={student.internalNotes ?? ""} onChange={(e) => update({ internalNotes: e.target.value })} />
          </Field>
        </div>

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="focus-ring mt-6 inline-flex items-center gap-2 rounded-full bg-loden-700 px-6 py-3 font-semibold text-white shadow-soft transition hover:bg-loden-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <Save className="h-5 w-5" aria-hidden="true" />
          {saving ? "Enregistrement…" : "Enregistrer le dossier"}
        </button>

        {status ? (
          <p className={`mt-4 rounded-2xl p-4 text-sm font-medium ${status.tone === "success" ? "bg-loden-50 text-loden-800" : "bg-red-50 text-red-700"}`}>
            {status.text}
          </p>
        ) : null}
      </section>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <h3 className="text-lg font-semibold text-loden-ink">Compétences (REMC)</h3>
        <p className="mt-1 text-sm text-loden-muted">Niveau par compétence : 0 (non abordé) à 4 (acquis).</p>
        <div className="mt-5 grid gap-4">
          {skills.map((skill) => (
            <div key={skill.code} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-loden-pearl/50 p-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-loden-ink">{skill.code}</p>
                <p className="text-xs text-loden-muted">{skill.label}</p>
              </div>
              <div className="flex items-center gap-1.5" role="radiogroup" aria-label={`Niveau ${skill.code}`}>
                {[0, 1, 2, 3, 4].map((level) => (
                  <button
                    key={level}
                    type="button"
                    role="radio"
                    aria-checked={skill.level === level}
                    aria-label={`Niveau ${level}`}
                    onClick={() => setSkillLevel(skill.code, level)}
                    className={`focus-ring h-8 w-8 rounded-full text-sm font-semibold transition ${
                      skill.level >= level && level > 0
                        ? "bg-loden-600 text-white"
                        : skill.level === 0 && level === 0
                          ? "bg-slate-200 text-slate-600"
                          : "bg-white text-loden-muted ring-1 ring-slate-200 hover:bg-loden-50"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {skills.length === 0 ? <p className="text-sm text-loden-muted">Référentiel indisponible.</p> : null}
        </div>
      </section>
    </div>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`grid gap-2 ${className}`}>
      <span className="text-sm font-semibold text-loden-ink">{label}</span>
      {children}
    </label>
  );
}
