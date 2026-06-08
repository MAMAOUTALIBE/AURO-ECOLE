"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Plus, Users, X } from "lucide-react";
import { ACTIVE_AGENCY_KEY } from "@/components/AgencySwitcher";

type Student = {
  id: string;
  fileStatus: string;
  progressPercent: number;
  agencyId?: string | null;
  user: { firstName: string; lastName: string; email: string } | null;
};

type FormationOption = { id: string; title: string };

const EMPTY_FORM = { firstName: "", lastName: "", email: "", phone: "", formationId: "" };

export const FILE_STATUS_LABELS: Record<string, string> = {
  NOUVEAU: "Nouveau",
  INCOMPLET: "Incomplet",
  EN_COURS: "En cours",
  PRET_EXAMEN: "Prêt examen",
  EXAMEN_PLANIFIE: "Examen planifié",
  TERMINE: "Terminé",
  ARCHIVE: "Archivé"
};

function activeAgency(): string | null {
  const agency = window.localStorage.getItem(ACTIVE_AGENCY_KEY);
  return agency && agency !== "all" ? agency : null;
}

export function StudentsList() {
  const [students, setStudents] = useState<Student[]>([]);
  const [formations, setFormations] = useState<FormationOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [created, setCreated] = useState<string | null>(null);

  async function loadStudents() {
    setLoading(true);
    setError(null);
    try {
      const agency = activeAgency();
      const query = agency ? `?agencyId=${encodeURIComponent(agency)}` : "";
      const response = await fetch(`/api/students${query}`);
      const payload = await response.json();
      if (Array.isArray(payload?.data)) setStudents(payload.data as Student[]);
      else setError(payload?.error?.message ?? "Impossible de charger les élèves.");
    } catch {
      setError("Le service LODEN est momentanément indisponible.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStudents();
    fetch("/api/formations")
      .then((response) => response.json())
      .then((payload) => {
        if (Array.isArray(payload?.data)) {
          setFormations((payload.data as { id: string; title: string }[]).map((f) => ({ id: f.id, title: f.title })));
        }
      })
      .catch(() => {});
  }, []);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setCreated(null);
    try {
      const agency = activeAgency();
      const response = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone || undefined,
          formationId: form.formationId || undefined,
          agencyId: agency ?? undefined
        })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setFormError(payload?.error?.message ?? "Création impossible. Vérifie les champs.");
        return;
      }
      setCreated(`${form.firstName} ${form.lastName}`);
      setForm(EMPTY_FORM);
      setShowForm(false);
      await loadStudents();
    } catch {
      setFormError("Erreur réseau. Réessaie dans quelques instants.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-loden-50 text-loden-700">
            <Users className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-xl font-semibold text-loden-ink">Élèves</h2>
            <p className="text-sm text-loden-muted">{students.length} dossier(s)</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowForm((value) => !value);
            setFormError(null);
          }}
          className="focus-ring inline-flex items-center gap-2 rounded-full bg-loden-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-loden-800"
        >
          {showForm ? <X className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
          {showForm ? "Fermer" : "Nouvel élève"}
        </button>
      </div>

      {created ? (
        <p className="mt-4 rounded-2xl bg-loden-50 p-4 text-sm font-medium text-loden-800">
          Élève « {created} » créé. Un mot de passe temporaire a été généré (réinitialisation à communiquer).
        </p>
      ) : null}

      {showForm ? (
        <form onSubmit={handleCreate} className="mt-5 grid gap-3 rounded-2xl border border-slate-200 bg-loden-pearl p-5" noValidate>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Prénom" value={form.firstName} onChange={(v) => setForm((f) => ({ ...f, firstName: v }))} required />
            <Input label="Nom" value={form.lastName} onChange={(v) => setForm((f) => ({ ...f, lastName: v }))} required />
            <Input label="Email" type="email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} required />
            <Input label="Téléphone" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} />
          </div>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-loden-ink">Formation (optionnel)</span>
            <select
              value={form.formationId}
              onChange={(event) => setForm((f) => ({ ...f, formationId: event.target.value }))}
              className="field-input"
            >
              <option value="">— Aucune pour le moment —</option>
              {formations.map((formation) => (
                <option key={formation.id} value={formation.id}>
                  {formation.title}
                </option>
              ))}
            </select>
          </label>
          {formError ? <p className="rounded-2xl bg-red-50 p-3 text-sm font-medium text-red-700">{formError}</p> : null}
          <button
            type="submit"
            disabled={submitting}
            className="focus-ring mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-loden-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-loden-800 disabled:opacity-70"
          >
            {submitting ? "Création…" : "Créer le dossier élève"}
          </button>
        </form>
      ) : null}

      {loading ? <p className="mt-6 text-sm text-loden-muted">Chargement…</p> : null}
      {error ? <p className="mt-6 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700">{error}</p> : null}

      {!loading && !error ? (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-loden-muted">
              <tr className="border-b border-slate-200">
                <th className="py-3 pr-4 font-semibold">Élève</th>
                <th className="py-3 pr-4 font-semibold">Statut</th>
                <th className="py-3 pr-4 font-semibold">Progression</th>
                <th className="py-3 pr-4" />
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-3 pr-4">
                    <p className="font-semibold text-loden-ink">
                      {student.user ? `${student.user.firstName} ${student.user.lastName}` : "—"}
                    </p>
                    <p className="text-xs text-loden-muted">{student.user?.email}</p>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="rounded-full bg-loden-50 px-3 py-1 text-xs font-semibold text-loden-700">
                      {FILE_STATUS_LABELS[student.fileStatus] ?? student.fileStatus}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-loden-500" style={{ width: `${student.progressPercent}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-loden-muted">{student.progressPercent}%</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <Link
                      href={`/admin/eleves/${student.id}`}
                      className="focus-ring inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-loden-ink hover:bg-loden-50"
                    >
                      Ouvrir
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </td>
                </tr>
              ))}
              {students.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-sm text-loden-muted">
                    Aucun élève pour cette sélection.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  required = false
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-loden-ink">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="field-input"
      />
    </label>
  );
}
