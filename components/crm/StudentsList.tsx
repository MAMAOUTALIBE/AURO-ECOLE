"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Download, Mail, Phone, Plus, Search, Users, X } from "lucide-react";
import { ACTIVE_AGENCY_KEY } from "@/components/AgencySwitcher";
import { Pagination } from "@/components/crm/ui";

const PAGE_SIZE = 12;

type Student = {
  id: string;
  fileStatus: string;
  progressPercent: number;
  agencyId?: string | null;
  formationId?: string | null;
  birthDate?: string | null;
  registeredAt?: string | null;
  filiere?: string | null;
  neph?: string | null;
  user: { firstName: string; lastName: string; email: string; phone?: string | null } | null;
};

type Option = { id: string; title: string };

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

function initials(s: Student) {
  const f = s.user?.firstName?.[0] ?? "";
  const l = s.user?.lastName?.[0] ?? "";
  return (f + l).toUpperCase() || "—";
}

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function StudentsList() {
  const [students, setStudents] = useState<Student[]>([]);
  const [formations, setFormations] = useState<Option[]>([]);
  const [agencies, setAgencies] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [created, setCreated] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [formationFilter, setFormationFilter] = useState("ALL");
  const [filiereFilter, setFiliereFilter] = useState("ALL");
  const [agencyFilter, setAgencyFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const formationById = useMemo(() => new Map(formations.map((f) => [f.id, f.title])), [formations]);
  const filiereOptions = useMemo(
    () => Array.from(new Set(students.map((s) => s.filiere).filter((v): v is string => !!v))).sort(),
    [students]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students.filter((student) => {
      const haystack = student.user
        ? `${student.user.firstName} ${student.user.lastName} ${student.user.email} ${student.neph ?? ""}`.toLowerCase()
        : "";
      return (
        (!q || haystack.includes(q)) &&
        (statusFilter === "ALL" || student.fileStatus === statusFilter) &&
        (formationFilter === "ALL" || student.formationId === formationFilter) &&
        (filiereFilter === "ALL" || student.filiere === filiereFilter) &&
        (agencyFilter === "ALL" || student.agencyId === agencyFilter)
      );
    });
  }, [students, query, statusFilter, formationFilter, filiereFilter, agencyFilter]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter, formationFilter, filiereFilter, agencyFilter]);

  async function loadStudents() {
    setLoading(true);
    setError(null);
    try {
      const agency = activeAgency();
      const q = agency ? `?agencyId=${encodeURIComponent(agency)}` : "";
      const response = await fetch(`/api/students${q}`);
      const payload = await response.json();
      if (Array.isArray(payload?.data)) setStudents(payload.data as Student[]);
      else setError(payload?.error?.message ?? "Impossible de charger les élèves.");
    } catch {
      setError("Le service LODENE est momentanément indisponible.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStudents();
    fetch("/api/formations")
      .then((r) => r.json())
      .then((p) => {
        if (Array.isArray(p?.data)) setFormations((p.data as { id: string; title: string }[]).map((f) => ({ id: f.id, title: f.title })));
      })
      .catch(() => {});
    fetch("/api/agencies")
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => {
        if (Array.isArray(p?.data)) setAgencies((p.data as { id: string; name: string }[]).map((a) => ({ id: a.id, name: a.name })));
      })
      .catch(() => {});
  }, []);

  function exportCsv() {
    const head = ["Nom", "Prénom", "Email", "Téléphone", "Formation", "Filière", "NEPH", "Date de naissance", "Date d'inscription", "Statut"];
    const rows = filtered.map((s) => [
      s.user?.lastName ?? "",
      s.user?.firstName ?? "",
      s.user?.email ?? "",
      s.user?.phone ?? "",
      s.formationId ? formationById.get(s.formationId) ?? "" : "",
      s.filiere ?? "",
      s.neph ?? "",
      fmtDate(s.birthDate),
      fmtDate(s.registeredAt),
      FILE_STATUS_LABELS[s.fileStatus] ?? s.fileStatus
    ]);
    const csv = [head, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
      .join("\n");
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `apprenants-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

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
    <div className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-soft sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-loden-50 text-loden-700">
            <Users className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-xl font-semibold text-loden-ink">Apprenants <span className="text-loden-muted">({filtered.length})</span></h2>
            <p className="text-sm text-loden-muted">Dossiers élèves · statuts, formations, état civil.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportCsv}
            className="focus-ring inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-loden-ink transition hover:bg-loden-50"
          >
            <Download className="h-4 w-4" aria-hidden="true" /> Export CSV
          </button>
          <button
            type="button"
            onClick={() => {
              setShowForm((value) => !value);
              setFormError(null);
            }}
            className="focus-ring inline-flex items-center gap-2 rounded-full bg-loden-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-loden-800"
          >
            {showForm ? <X className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
            {showForm ? "Fermer" : "Ajouter un apprenant"}
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher (nom, email, NEPH)…"
            aria-label="Rechercher un apprenant"
            className="focus-ring w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-loden-200 focus:bg-white"
          />
        </div>
        <select value={formationFilter} onChange={(e) => setFormationFilter(e.target.value)} aria-label="Filtrer par formation" className="field-input sm:max-w-[200px]">
          <option value="ALL">Toutes formations</option>
          {formations.map((f) => <option key={f.id} value={f.id}>{f.title}</option>)}
        </select>
        {filiereOptions.length > 0 ? (
          <select value={filiereFilter} onChange={(e) => setFiliereFilter(e.target.value)} aria-label="Filtrer par filière" className="field-input sm:max-w-[160px]">
            <option value="ALL">Toutes filières</option>
            {filiereOptions.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        ) : null}
        {agencies.length > 1 ? (
          <select value={agencyFilter} onChange={(e) => setAgencyFilter(e.target.value)} aria-label="Filtrer par agence" className="field-input sm:max-w-[180px]">
            <option value="ALL">Toutes agences</option>
            {agencies.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        ) : null}
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filtrer par statut" className="field-input sm:max-w-[170px]">
          <option value="ALL">Tous statuts</option>
          {Object.entries(FILE_STATUS_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
      </div>

      {created ? (
        <p className="mt-4 rounded-2xl bg-loden-50 p-4 text-sm font-medium text-loden-800">
          Apprenant « {created} » créé. Un mot de passe temporaire a été généré (réinitialisation à communiquer).
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
            <select value={form.formationId} onChange={(event) => setForm((f) => ({ ...f, formationId: event.target.value }))} className="field-input">
              <option value="">— Aucune pour le moment —</option>
              {formations.map((formation) => <option key={formation.id} value={formation.id}>{formation.title}</option>)}
            </select>
          </label>
          {formError ? <p className="rounded-2xl bg-red-50 p-3 text-sm font-medium text-red-700">{formError}</p> : null}
          <button
            type="submit"
            disabled={submitting}
            className="focus-ring mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-loden-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-loden-800 disabled:opacity-70"
          >
            {submitting ? "Création…" : "Créer le dossier apprenant"}
          </button>
        </form>
      ) : null}

      {loading ? <p className="mt-6 text-sm text-loden-muted">Chargement…</p> : null}
      {error ? <p className="mt-6 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700">{error}</p> : null}

      {!loading && !error ? (
        <div className="mt-6">
          <div className="grid gap-3 lg:hidden">
            {paged.map((student) => (
              <article key={student.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-loden-50 text-xs font-bold text-loden-700">
                    {initials(student)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-loden-ink">
                      {student.user ? `${student.user.firstName} ${student.user.lastName}` : "—"}
                    </p>
                    <p className="truncate text-xs text-loden-muted">{student.user?.email}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-loden-50 px-2.5 py-1 text-xs font-semibold text-loden-700">
                    {FILE_STATUS_LABELS[student.fileStatus] ?? student.fileStatus}
                  </span>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-loden-muted">
                  <p>
                    <span className="font-semibold text-loden-ink">Formation : </span>
                    {student.formationId ? formationById.get(student.formationId) ?? "—" : "—"}
                  </p>
                  <p>
                    <span className="font-semibold text-loden-ink">Inscription : </span>
                    {fmtDate(student.registeredAt)}
                  </p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {student.user?.phone ? (
                    <a href={`tel:${student.user.phone}`} className="focus-ring inline-flex flex-1 items-center justify-center gap-1 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-loden-ink hover:bg-loden-50">
                      <Phone className="h-3.5 w-3.5" aria-hidden="true" /> Appeler
                    </a>
                  ) : null}
                  {student.user?.email ? (
                    <a href={`mailto:${student.user.email}`} className="focus-ring inline-flex flex-1 items-center justify-center gap-1 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-loden-ink hover:bg-loden-50">
                      <Mail className="h-3.5 w-3.5" aria-hidden="true" /> Email
                    </a>
                  ) : null}
                  <Link href={`/admin/eleves/${student.id}`} className="focus-ring inline-flex flex-1 items-center justify-center gap-1 rounded-full bg-loden-700 px-3 py-2 text-xs font-semibold text-white hover:bg-loden-800">
                    Ouvrir <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
          <div className="hidden overflow-x-auto lg:block">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-loden-muted">
              <tr className="border-b border-slate-200">
                <th className="py-3 pr-4 font-semibold">Apprenant</th>
                <th className="py-3 pr-4 font-semibold">Formation</th>
                <th className="py-3 pr-4 font-semibold">Inscription</th>
                <th className="py-3 pr-4 font-semibold">Naissance</th>
                <th className="py-3 pr-4 font-semibold">Statut</th>
                <th className="py-3 pr-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((student) => (
                <tr key={student.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-loden-50 text-xs font-bold text-loden-700">
                        {initials(student)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-loden-ink">
                          {student.user ? `${student.user.firstName} ${student.user.lastName}` : "—"}
                        </p>
                        <p className="truncate text-xs text-loden-muted">{student.user?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <p className="text-loden-ink">{student.formationId ? formationById.get(student.formationId) ?? "—" : "—"}</p>
                    {student.filiere ? <p className="text-xs text-loden-muted">{student.filiere}</p> : null}
                  </td>
                  <td className="py-3 pr-4 text-loden-muted">{fmtDate(student.registeredAt)}</td>
                  <td className="py-3 pr-4 text-loden-muted">{fmtDate(student.birthDate)}</td>
                  <td className="py-3 pr-4">
                    <span className="rounded-full bg-loden-50 px-3 py-1 text-xs font-semibold text-loden-700">
                      {FILE_STATUS_LABELS[student.fileStatus] ?? student.fileStatus}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center justify-end gap-1.5">
                      {student.user?.phone ? (
                        <a href={`tel:${student.user.phone}`} aria-label="Appeler" title={student.user.phone} className="focus-ring rounded-full border border-slate-200 p-1.5 text-loden-ink hover:bg-loden-50">
                          <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                        </a>
                      ) : null}
                      {student.user?.email ? (
                        <a href={`mailto:${student.user.email}`} aria-label="Envoyer un email" className="focus-ring rounded-full border border-slate-200 p-1.5 text-loden-ink hover:bg-loden-50">
                          <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                        </a>
                      ) : null}
                      <Link
                        href={`/admin/eleves/${student.id}`}
                        className="focus-ring inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-loden-ink hover:bg-loden-50"
                      >
                        Ouvrir <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-sm text-loden-muted">
                    {students.length === 0 ? "Aucun apprenant pour cette sélection." : "Aucun apprenant ne correspond aux filtres."}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
          </div>
          <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPage={setPage} />
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
      <input type={type} value={value} required={required} onChange={(event) => onChange(event.target.value)} className="field-input" />
    </label>
  );
}
