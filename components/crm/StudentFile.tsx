"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { FILE_STATUS_LABELS } from "@/components/crm/StudentsList";

type UserLite = { firstName: string; lastName: string; email: string; phone?: string | null; address?: string | null };
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
  civility?: string | null;
  birthName?: string | null;
  birthDate?: string | null;
  birthPlace?: string | null;
  neph?: string | null;
  filiere?: string | null;
  financingType?: string | null;
  registeredAt?: string | null;
  user: UserLite | null;
};

type Option = { id: string; label: string };
type Skill = { code: string; label: string; level: number };
type StudentDocument = { id: string; type: string; url: string; verifiedAt?: string | null; createdAt: string };
type Booking = { id: string; status: string; startsAt: string; endsAt: string };
type Invoice = { id: string; number?: string | null; totalCents: number; status: string; createdAt: string };
type Quote = { id: string; number?: string | null; totalCents: number; status: string; createdAt: string };
type Installment = { id: string; amountCents: number; dueDate?: string | null; status: string };
type Contract = { id: string; number?: string | null; status: string; createdAt: string };

type Tab = "profil" | "formation" | "documents" | "comptabilite" | "consommations" | "contrats" | "planning";
const TABS: { key: Tab; label: string }[] = [
  { key: "profil", label: "Profil" },
  { key: "formation", label: "Formation" },
  { key: "documents", label: "Documents" },
  { key: "comptabilite", label: "Comptabilité" },
  { key: "consommations", label: "Consommations" },
  { key: "contrats", label: "Contrats" },
  { key: "planning", label: "Planning" }
];

const DOCUMENT_TYPES = [
  "Pièce d'identité (CNI)",
  "Justificatif de domicile",
  "Photo d'identité",
  "Attestation ASSR / ASR",
  "Attestation JDC / recensement",
  "Photo-signature numérique",
  "Autre"
];

const euros = (cents: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format((cents ?? 0) / 100);
const toDateInput = (value?: string | null) => (value ? value.slice(0, 10) : "");
function fmtDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function age(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 86_400_000));
}

export function StudentFile({ studentId }: { studentId: string }) {
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [agencies, setAgencies] = useState<Option[]>([]);
  const [formations, setFormations] = useState<Option[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [docForm, setDocForm] = useState({ type: DOCUMENT_TYPES[0], url: "" });
  const [status, setStatus] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<Tab>("profil");

  useEffect(() => {
    let cancelled = false;
    const list = (url: string) => fetch(url).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    (async () => {
      const studentPayload = await fetch(`/api/students/${studentId}`).then((r) => r.json()).catch(() => null);
      if (cancelled) return;
      if (studentPayload?.data) setStudent(studentPayload.data as StudentDetail);
      else {
        setStatus({ tone: "error", text: studentPayload?.error?.message ?? "Élève introuvable." });
        setLoading(false);
        return;
      }
      const userId = studentPayload.data.user?.id ?? studentPayload.data.userId;
      const [ag, fo, sk, doc, bk, inv, qt, inst, ct] = await Promise.all([
        list("/api/agencies"),
        list("/api/formations"),
        list(`/api/students/${studentId}/skills`),
        list(`/api/students/${studentId}/documents`),
        list(`/api/bookings?studentId=${studentId}`),
        userId ? list(`/api/invoices?clientUserId=${userId}`) : Promise.resolve(null),
        userId ? list(`/api/quotes?clientUserId=${userId}`) : Promise.resolve(null),
        list(`/api/installments?studentId=${studentId}`),
        userId ? list(`/api/contracts?clientUserId=${userId}`) : Promise.resolve(null)
      ]);
      if (cancelled) return;
      if (Array.isArray(ag?.data)) setAgencies(ag.data.map((a: { id: string; name: string }) => ({ id: a.id, label: a.name })));
      if (Array.isArray(fo?.data)) setFormations(fo.data.map((f: { id: string; title: string }) => ({ id: f.id, label: f.title })));
      if (Array.isArray(sk?.data)) setSkills(sk.data as Skill[]);
      if (Array.isArray(doc?.data)) setDocuments(doc.data as StudentDocument[]);
      if (Array.isArray(bk?.data)) setBookings(bk.data as Booking[]);
      if (Array.isArray(inv?.data)) setInvoices(inv.data as Invoice[]);
      if (Array.isArray(qt?.data)) setQuotes(qt.data as Quote[]);
      if (Array.isArray(inst?.data)) setInstallments(inst.data as Installment[]);
      if (Array.isArray(ct?.data)) setContracts(ct.data as Contract[]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  const update = (patch: Partial<StudentDetail>) => setStudent((c) => (c ? { ...c, ...patch } : c));
  const updateUser = (patch: Partial<UserLite>) => setStudent((c) => (c && c.user ? { ...c, user: { ...c.user, ...patch } } : c));

  const formationLabel = useMemo(() => formations.find((f) => f.id === student?.formationId)?.label, [formations, student?.formationId]);
  const agencyLabel = useMemo(() => agencies.find((a) => a.id === student?.agencyId)?.label, [agencies, student?.agencyId]);

  const save = async (fields: Record<string, unknown>) => {
    setSaving(true);
    setStatus(null);
    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields)
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error?.message ?? "Échec de l'enregistrement.");
      setStudent(payload.data as StudentDetail);
      setStatus({ tone: "success", text: "Fiche enregistrée." });
    } catch (error) {
      setStatus({ tone: "error", text: error instanceof Error ? error.message : "Échec de l'enregistrement." });
    } finally {
      setSaving(false);
    }
  };

  const saveProfil = () => {
    if (!student) return;
    save({
      civility: student.civility ?? "",
      firstName: student.user?.firstName,
      lastName: student.user?.lastName,
      phone: student.user?.phone ?? "",
      address: student.user?.address ?? "",
      birthName: student.birthName ?? "",
      birthDate: student.birthDate || undefined,
      birthPlace: student.birthPlace ?? "",
      neph: student.neph ?? "",
      filiere: student.filiere ?? "",
      financingType: student.financingType ?? ""
    });
  };

  const saveFormation = () => {
    if (!student) return;
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
    save(body);
  };

  const setSkillLevel = async (code: string, level: number) => {
    try {
      const response = await fetch(`/api/students/${studentId}/skills`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillCode: code, level })
      });
      if (!response.ok) throw new Error();
      setSkills((c) => c.map((s) => (s.code === code ? { ...s, level } : s)));
    } catch {
      setStatus({ tone: "error", text: "Mise à jour de la compétence impossible." });
    }
  };

  const addDocument = async () => {
    if (!docForm.type || !docForm.url.trim()) {
      setStatus({ tone: "error", text: "Renseigne un type et un lien/référence." });
      return;
    }
    try {
      const response = await fetch(`/api/students/${studentId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: docForm.type, url: docForm.url.trim() })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error?.message ?? "Ajout impossible.");
      setDocuments((c) => [payload.data as StudentDocument, ...c]);
      setDocForm({ type: DOCUMENT_TYPES[0], url: "" });
    } catch (error) {
      setStatus({ tone: "error", text: error instanceof Error ? error.message : "Ajout impossible." });
    }
  };
  const toggleVerify = async (doc: StudentDocument) => {
    const response = await fetch(`/api/students/${studentId}/documents/${doc.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verified: !doc.verifiedAt })
    });
    if (response.ok) {
      const payload = await response.json();
      setDocuments((c) => c.map((d) => (d.id === doc.id ? { ...d, verifiedAt: payload.data.verifiedAt } : d)));
    }
  };
  const removeDocument = async (doc: StudentDocument) => {
    if (!window.confirm(`Supprimer le document « ${doc.type} » ?`)) return;
    const response = await fetch(`/api/students/${studentId}/documents/${doc.id}`, { method: "DELETE" });
    if (response.ok) setDocuments((c) => c.filter((d) => d.id !== doc.id));
  };
  const safeHref = (url: string) => (/^(https?:\/\/|\/)/i.test(url.trim()) ? url : "#");

  if (loading) return <p className="text-sm text-loden-muted">Chargement du dossier…</p>;
  if (!student) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <p className="rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700">{status?.text ?? "Élève introuvable."}</p>
        <Link href="/admin/eleves" className="focus-ring mt-4 inline-flex items-center gap-2 text-sm font-semibold text-loden-700"><ArrowLeft className="h-4 w-4" /> Retour</Link>
      </div>
    );
  }

  const u = student.user;
  const fullName = u ? `${u.firstName} ${u.lastName}` : "Élève";
  const ageY = age(student.birthDate);

  return (
    <div className="grid gap-5">
      <Link href="/admin/eleves" className="focus-ring inline-flex w-fit items-center gap-2 text-sm font-semibold text-loden-700"><ArrowLeft className="h-4 w-4" /> Retour aux apprenants</Link>

      {/* Bandeau résumé */}
      <div className="rounded-3xl border border-slate-200 bg-loden-pearl/50 p-6 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-loden-100 text-lg font-bold text-loden-700">
              {(u?.firstName?.[0] ?? "") + (u?.lastName?.[0] ?? "")}
            </span>
            <div>
              <h2 className="text-2xl font-bold text-loden-ink">{fullName}</h2>
              <p className="text-sm text-loden-muted">{u?.email}</p>
            </div>
          </div>
          {formationLabel ? <span className="rounded-xl border border-loden-200 px-4 py-2 text-sm font-semibold text-loden-700">{formationLabel}</span> : null}
        </div>
        <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3 lg:grid-cols-4">
          <Info label="NEPH" value={student.neph || "—"} />
          <Info label="Date de naissance" value={`${fmtDate(student.birthDate)}${ageY != null ? ` (${ageY} ans)` : ""}`} />
          <Info label="Date d'inscription" value={fmtDate(student.registeredAt)} />
          <Info label="Agence" value={agencyLabel || "—"} />
          <Info label="Financement" value={student.financingType || "—"} />
          <Info label="Téléphone" value={u?.phone || "—"} />
          <Info label="Filière" value={student.filiere || "—"} />
          <Info label="Statut" value={FILE_STATUS_LABELS[student.fileStatus] ?? student.fileStatus} />
        </div>
      </div>

      {/* Onglets */}
      <div className="flex flex-wrap gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-soft">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`focus-ring rounded-xl px-4 py-2 text-sm font-semibold transition ${tab === t.key ? "bg-loden-700 text-white shadow-soft" : "text-loden-muted hover:text-loden-ink"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {status ? (
        <p className={`rounded-2xl p-3 text-sm font-medium ${status.tone === "success" ? "bg-loden-50 text-loden-800" : "bg-red-50 text-red-700"}`}>{status.text}</p>
      ) : null}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        {tab === "profil" ? (
          <div className="grid gap-4">
            <h3 className="text-lg font-semibold text-loden-ink">Profil — état civil</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Civilité">
                <select className="field-input" value={student.civility ?? ""} onChange={(e) => update({ civility: e.target.value })}>
                  <option value="">—</option>
                  <option value="M">M</option>
                  <option value="Mme">Mme</option>
                </select>
              </Field>
              <div />
              <Field label="Prénom"><input className="field-input" value={u?.firstName ?? ""} onChange={(e) => updateUser({ firstName: e.target.value })} /></Field>
              <Field label="Nom d'usage"><input className="field-input" value={u?.lastName ?? ""} onChange={(e) => updateUser({ lastName: e.target.value })} /></Field>
              <Field label="Nom de naissance"><input className="field-input" value={student.birthName ?? ""} onChange={(e) => update({ birthName: e.target.value })} /></Field>
              <Field label="NEPH"><input className="field-input" value={student.neph ?? ""} onChange={(e) => update({ neph: e.target.value })} /></Field>
              <Field label="Date de naissance"><input type="date" className="field-input" value={toDateInput(student.birthDate)} onChange={(e) => update({ birthDate: e.target.value || null })} /></Field>
              <Field label="Lieu de naissance"><input className="field-input" value={student.birthPlace ?? ""} onChange={(e) => update({ birthPlace: e.target.value })} /></Field>
              <Field label="Email (lecture)"><input className="field-input bg-slate-50" value={u?.email ?? ""} readOnly /></Field>
              <Field label="Téléphone"><input className="field-input" value={u?.phone ?? ""} onChange={(e) => updateUser({ phone: e.target.value })} /></Field>
              <Field label="Filière"><input className="field-input" value={student.filiere ?? ""} onChange={(e) => update({ filiere: e.target.value })} /></Field>
              <Field label="Financement"><input className="field-input" value={student.financingType ?? ""} onChange={(e) => update({ financingType: e.target.value })} placeholder="CPF, Personnel, Entreprise…" /></Field>
              <Field label="Adresse" className="sm:col-span-2"><input className="field-input" value={u?.address ?? ""} onChange={(e) => updateUser({ address: e.target.value })} /></Field>
            </div>
            <SaveButton onClick={saveProfil} saving={saving} />
          </div>
        ) : null}

        {tab === "formation" ? (
          <div className="grid gap-5">
            <h3 className="text-lg font-semibold text-loden-ink">Formation & progression</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Statut du dossier">
                <select className="field-input" value={student.fileStatus} onChange={(e) => update({ fileStatus: e.target.value })}>
                  {Object.entries(FILE_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </Field>
              <Field label="Formation">
                <select className="field-input" value={student.formationId ?? ""} onChange={(e) => update({ formationId: e.target.value || null })}>
                  <option value="">— Aucune —</option>
                  {formations.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
                </select>
              </Field>
              <Field label="Agence">
                <select className="field-input" value={student.agencyId ?? ""} onChange={(e) => update({ agencyId: e.target.value || null })}>
                  <option value="">— Non rattaché —</option>
                  {agencies.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
                </select>
              </Field>
              <Field label="Date d'examen"><input type="date" className="field-input" value={toDateInput(student.examDate)} onChange={(e) => update({ examDate: e.target.value || null })} /></Field>
              <Field label="Progression (%)"><input type="number" min={0} max={100} className="field-input" value={student.progressPercent} onChange={(e) => update({ progressPercent: Number(e.target.value) })} /></Field>
              <Field label="Heures achetées"><input type="number" min={0} className="field-input" value={student.purchasedHours} onChange={(e) => update({ purchasedHours: Number(e.target.value) })} /></Field>
              <Field label="Heures consommées"><input type="number" min={0} className="field-input" value={student.consumedHours} onChange={(e) => update({ consumedHours: Number(e.target.value) })} /></Field>
              <Field label="Notes internes" className="sm:col-span-2"><textarea className="field-input min-h-20" value={student.internalNotes ?? ""} onChange={(e) => update({ internalNotes: e.target.value })} /></Field>
            </div>
            <SaveButton onClick={saveFormation} saving={saving} />
            <div>
              <h4 className="mt-2 text-sm font-semibold text-loden-ink">Compétences (REMC)</h4>
              <div className="mt-3 grid gap-2">
                {skills.map((skill) => (
                  <div key={skill.code} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-loden-pearl/50 p-3">
                    <div className="min-w-0"><p className="text-sm font-semibold text-loden-ink">{skill.code}</p><p className="text-xs text-loden-muted">{skill.label}</p></div>
                    <div className="flex items-center gap-1.5" role="radiogroup" aria-label={`Niveau ${skill.code}`}>
                      {[0, 1, 2, 3, 4].map((level) => (
                        <button key={level} type="button" role="radio" aria-checked={skill.level === level} aria-label={`Niveau ${level}`} onClick={() => setSkillLevel(skill.code, level)}
                          className={`focus-ring h-8 w-8 rounded-full text-sm font-semibold transition ${skill.level >= level && level > 0 ? "bg-loden-600 text-white" : skill.level === 0 && level === 0 ? "bg-slate-200 text-slate-600" : "bg-white text-loden-muted ring-1 ring-slate-200 hover:bg-loden-50"}`}>{level}</button>
                      ))}
                    </div>
                  </div>
                ))}
                {skills.length === 0 ? <p className="text-sm text-loden-muted">Référentiel indisponible.</p> : null}
              </div>
            </div>
          </div>
        ) : null}

        {tab === "documents" ? (
          <div className="grid gap-4">
            <h3 className="text-lg font-semibold text-loden-ink">Documents du dossier</h3>
            <div className="grid gap-3 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end">
              <Field label="Type">
                <select className="field-input" value={docForm.type} onChange={(e) => setDocForm((f) => ({ ...f, type: e.target.value }))}>
                  {DOCUMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Lien / référence"><input className="field-input" placeholder="https://… ou référence" value={docForm.url} onChange={(e) => setDocForm((f) => ({ ...f, url: e.target.value }))} /></Field>
              <button type="button" onClick={addDocument} className="focus-ring inline-flex h-11 items-center justify-center rounded-full bg-loden-700 px-5 text-sm font-semibold text-white transition hover:bg-loden-800">Ajouter</button>
            </div>
            <div className="grid gap-2">
              {documents.map((doc) => (
                <div key={doc.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-loden-pearl/50 p-3">
                  <div className="min-w-0"><p className="text-sm font-semibold text-loden-ink">{doc.type}</p><a href={safeHref(doc.url)} target="_blank" rel="noreferrer" className="break-all text-xs text-loden-700 hover:underline">{doc.url}</a></div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${doc.verifiedAt ? "bg-loden-50 text-loden-700" : "bg-amber-50 text-amber-700"}`}>{doc.verifiedAt ? "Vérifié" : "À vérifier"}</span>
                    <button type="button" onClick={() => toggleVerify(doc)} className="focus-ring rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-loden-ink hover:bg-loden-50">{doc.verifiedAt ? "Annuler" : "Vérifier"}</button>
                    <button type="button" onClick={() => removeDocument(doc)} className="focus-ring rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">Suppr.</button>
                  </div>
                </div>
              ))}
              {documents.length === 0 ? <p className="text-sm text-loden-muted">Aucun document.</p> : null}
            </div>
          </div>
        ) : null}

        {tab === "comptabilite" ? (
          <div className="grid gap-5">
            <h3 className="text-lg font-semibold text-loden-ink">Comptabilité</h3>
            <ListBlock title={`Factures (${invoices.length})`} href="/admin/factures" items={invoices.map((i) => ({ id: i.id, left: i.number || "Brouillon", mid: fmtDate(i.createdAt), right: euros(i.totalCents), badge: i.status }))} empty="Aucune facture." />
            <ListBlock title={`Devis (${quotes.length})`} href="/admin/devis" items={quotes.map((q) => ({ id: q.id, left: q.number || "Brouillon", mid: fmtDate(q.createdAt), right: euros(q.totalCents), badge: q.status }))} empty="Aucun devis." />
            <ListBlock title={`Échéances (${installments.length})`} href="/admin/finance" items={installments.map((i) => ({ id: i.id, left: fmtDate(i.dueDate), mid: "", right: euros(i.amountCents), badge: i.status }))} empty="Aucune échéance." />
          </div>
        ) : null}

        {tab === "consommations" ? (
          <div className="grid gap-4">
            <h3 className="text-lg font-semibold text-loden-ink">Consommations</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <Stat label="Heures achetées" value={`${student.purchasedHours} h`} />
              <Stat label="Heures consommées" value={`${student.consumedHours} h`} />
              <Stat label="Leçons planifiées" value={String(bookings.length)} />
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-loden-500" style={{ width: `${student.purchasedHours ? Math.min(100, Math.round((student.consumedHours / student.purchasedHours) * 100)) : 0}%` }} />
            </div>
          </div>
        ) : null}

        {tab === "contrats" ? (
          <div className="grid gap-4">
            <h3 className="text-lg font-semibold text-loden-ink">Contrats</h3>
            <ListBlock title={`Contrats (${contracts.length})`} href="/admin/contrats" items={contracts.map((c) => ({ id: c.id, left: c.number || "Contrat", mid: fmtDate(c.createdAt), right: "", badge: c.status }))} empty="Aucun contrat." />
          </div>
        ) : null}

        {tab === "planning" ? (
          <div className="grid gap-4">
            <h3 className="text-lg font-semibold text-loden-ink">Planning — leçons</h3>
            <div className="grid gap-2">
              {[...bookings].sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime()).map((b) => (
                <div key={b.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-loden-pearl/50 p-3">
                  <span className="text-sm font-medium text-loden-ink">{fmtDate(b.startsAt)} · {new Date(b.startsAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}–{new Date(b.endsAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                  <span className="rounded-full bg-loden-50 px-3 py-1 text-xs font-semibold text-loden-700">{b.status}</span>
                </div>
              ))}
              {bookings.length === 0 ? <p className="text-sm text-loden-muted">Aucune leçon planifiée.</p> : null}
            </div>
            <Link href="/admin/rendez-vous?view=planning" className="text-sm font-semibold text-loden-700 hover:underline">Ouvrir le planning →</Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-loden-muted">{label}</p>
      <p className="font-semibold text-loden-ink">{value}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-loden-pearl/50 p-4">
      <p className="text-xs uppercase tracking-wide text-loden-muted">{label}</p>
      <p className="mt-1 text-xl font-bold text-loden-ink">{value}</p>
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

function SaveButton({ onClick, saving }: { onClick: () => void; saving: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={saving} className="focus-ring inline-flex w-fit items-center gap-2 rounded-full bg-loden-700 px-6 py-3 font-semibold text-white shadow-soft transition hover:bg-loden-800 disabled:opacity-70">
      <Save className="h-5 w-5" aria-hidden="true" /> {saving ? "Enregistrement…" : "Enregistrer"}
    </button>
  );
}

function ListBlock({ title, href, items, empty }: { title: string; href: string; items: { id: string; left: string; mid: string; right: string; badge: string }[]; empty: string }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-loden-ink">{title}</h4>
        <Link href={href} className="text-xs font-semibold text-loden-700 hover:underline">Ouvrir →</Link>
      </div>
      <div className="mt-2 grid gap-2">
        {items.map((it) => (
          <div key={it.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-100 bg-loden-pearl/50 p-3 text-sm">
            <span className="font-medium text-loden-ink">{it.left}</span>
            <span className="text-loden-muted">{it.mid}</span>
            <span className="flex items-center gap-2">
              {it.right ? <span className="font-semibold text-loden-ink">{it.right}</span> : null}
              <span className="rounded-full bg-loden-50 px-2.5 py-0.5 text-xs font-semibold text-loden-700">{it.badge}</span>
            </span>
          </div>
        ))}
        {items.length === 0 ? <p className="text-sm text-loden-muted">{empty}</p> : null}
      </div>
    </div>
  );
}
