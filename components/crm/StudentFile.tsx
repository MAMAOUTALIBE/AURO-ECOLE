"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Phone,
  Mail,
  MessageCircle,
  KeyRound,
  Copy,
  CalendarPlus,
  GraduationCap
} from "lucide-react";
import { FILE_STATUS_LABELS } from "@/components/crm/StudentsList";

type UserLite = { id?: string; firstName: string; lastName: string; email: string; phone?: string | null; address?: string | null };
type StudentDetail = {
  id: string;
  userId?: string;
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
type Payment = { id: string; amountCents: number; status: string; kind: string; paidAt?: string | null; createdAt: string };
type Exam = { id: string; type: string; scheduledAt: string; center?: string | null; result: string; score?: number | null; attempt: number };

type Tab = "profil" | "formation" | "documents" | "examens" | "comptabilite" | "consommations" | "contrats" | "planning";
const TABS: { key: Tab; label: string }[] = [
  { key: "profil", label: "Profil" },
  { key: "formation", label: "Formation" },
  { key: "documents", label: "Documents" },
  { key: "examens", label: "Examens" },
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

const EXAM_TYPE_LABELS: Record<string, string> = { CODE: "Code", CONDUITE: "Conduite" };
const EXAM_RESULT_LABELS: Record<string, string> = { EN_ATTENTE: "En attente", REUSSI: "Réussi", ECHOUE: "Échoué", ABSENT: "Absent" };

const euros = (cents: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format((cents ?? 0) / 100);
const toDateInput = (value?: string | null) => (value ? value.slice(0, 10) : "");
function fmtDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function fmtTime(value: string) {
  return new Date(value).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}
function fmtDateTime(value?: string | null) {
  if (!value) return "—";
  return `${fmtDate(value)} · ${fmtTime(value)}`;
}
function age(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 86_400_000));
}
function badgeTone(status: string) {
  const s = (status ?? "").toUpperCase();
  if (/(PAYE|PAYEE|REUSSI|VALID|SIGNE|ACTIF|TERMINE|REALIS|HONORE)/.test(s)) return "bg-emerald-50 text-emerald-700";
  if (/(ECHEC|ECHOUE|ANNUL|REFUS|RETARD|IMPAYE|ABSENT)/.test(s)) return "bg-rose-50 text-rose-700";
  if (/(ATTENTE|BROUILLON|EN_COURS|PARTIEL|ENVOYE|EMISE|PLANIFIE)/.test(s)) return "bg-amber-50 text-amber-700";
  return "bg-loden-50 text-loden-700";
}
function waNumber(phone?: string | null) {
  if (!phone) return null;
  let digits = phone.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  else if (digits.startsWith("00")) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = `33${digits.slice(1)}`;
  return digits.length >= 8 ? digits : null;
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
  const [payments, setPayments] = useState<Payment[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [docForm, setDocForm] = useState({ type: DOCUMENT_TYPES[0], url: "" });
  const [examForm, setExamForm] = useState({ type: "CONDUITE", scheduledAt: "", center: "" });
  const [status, setStatus] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [resetInfo, setResetInfo] = useState<{ tempPassword: string; email: string } | null>(null);
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
      const [ag, fo, sk, doc, bk, inv, qt, inst, ct, pay, ex] = await Promise.all([
        list("/api/agencies"),
        list("/api/formations"),
        list(`/api/students/${studentId}/skills`),
        list(`/api/students/${studentId}/documents`),
        list(`/api/bookings?studentId=${studentId}`),
        userId ? list(`/api/invoices?clientUserId=${userId}`) : Promise.resolve(null),
        userId ? list(`/api/quotes?clientUserId=${userId}`) : Promise.resolve(null),
        list(`/api/installments?studentId=${studentId}`),
        userId ? list(`/api/contracts?clientUserId=${userId}`) : Promise.resolve(null),
        userId ? list(`/api/payments?userId=${userId}`) : Promise.resolve(null),
        list(`/api/exams?studentId=${studentId}`)
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
      if (Array.isArray(pay?.data)) setPayments(pay.data as Payment[]);
      if (Array.isArray(ex?.data)) setExams(ex.data as Exam[]);
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

  // --- Indicateurs financiers & d'activité dérivés ---
  const finance = useMemo(() => {
    const billed = invoices.filter((i) => !/ANNUL/i.test(i.status)).reduce((s, i) => s + (i.totalCents ?? 0), 0);
    const collected = payments.filter((p) => /^PAYE$/i.test(p.status)).reduce((s, p) => s + (p.amountCents ?? 0), 0);
    const dueInstallments = installments.filter((i) => !/PAYE/i.test(i.status)).reduce((s, i) => s + (i.amountCents ?? 0), 0);
    return { billed, collected, balance: billed - collected, dueInstallments };
  }, [invoices, payments, installments]);

  const lessons = useMemo(() => {
    const now = Date.now();
    const cancelled = bookings.filter((b) => /ANNUL/i.test(b.status));
    const upcoming = bookings
      .filter((b) => !/ANNUL/i.test(b.status) && new Date(b.startsAt).getTime() >= now)
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
    const past = bookings
      .filter((b) => !/ANNUL/i.test(b.status) && new Date(b.startsAt).getTime() < now)
      .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());
    return { upcoming, past, cancelled, next: upcoming[0] ?? null };
  }, [bookings]);

  const nextExam = useMemo(() => {
    const now = Date.now();
    return [...exams]
      .filter((e) => new Date(e.scheduledAt).getTime() >= now && e.result === "EN_ATTENTE")
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0] ?? null;
  }, [exams]);

  const hoursPct = student && student.purchasedHours ? Math.min(100, Math.round((student.consumedHours / student.purchasedHours) * 100)) : 0;

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

  // --- Examens ---
  const addExam = async () => {
    if (!examForm.scheduledAt) {
      setStatus({ tone: "error", text: "Renseigne la date de l'examen." });
      return;
    }
    try {
      const response = await fetch(`/api/exams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          type: examForm.type,
          scheduledAt: new Date(examForm.scheduledAt).toISOString(),
          ...(examForm.center.trim() ? { center: examForm.center.trim() } : {}),
          ...(student?.agencyId ? { agencyId: student.agencyId } : {})
        })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error?.message ?? "Ajout impossible.");
      setExams((c) => [payload.data as Exam, ...c]);
      setExamForm({ type: "CONDUITE", scheduledAt: "", center: "" });
      setStatus({ tone: "success", text: "Examen planifié." });
    } catch (error) {
      setStatus({ tone: "error", text: error instanceof Error ? error.message : "Ajout impossible." });
    }
  };
  const patchExam = async (exam: Exam, fields: Record<string, unknown>) => {
    const response = await fetch(`/api/exams/${exam.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields)
    });
    if (response.ok) {
      const payload = await response.json();
      setExams((c) => c.map((e) => (e.id === exam.id ? (payload.data as Exam) : e)));
    } else {
      setStatus({ tone: "error", text: "Mise à jour de l'examen impossible." });
    }
  };

  // --- Réinitialisation du mot de passe (action bureau) ---
  const resetPassword = async () => {
    if (!window.confirm("Générer un nouveau mot de passe pour cet élève ? L'ancien sera invalidé.")) return;
    setStatus(null);
    try {
      const response = await fetch(`/api/students/${studentId}/reset-password`, { method: "POST" });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error?.message ?? "Réinitialisation impossible.");
      setResetInfo(payload.data as { tempPassword: string; email: string });
    } catch (error) {
      setStatus({ tone: "error", text: error instanceof Error ? error.message : "Réinitialisation impossible." });
    }
  };

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
  const wa = waNumber(u?.phone);

  return (
    <div className="grid gap-5">
      <Link href="/admin/eleves" className="focus-ring inline-flex w-fit items-center gap-2 text-sm font-semibold text-loden-700"><ArrowLeft className="h-4 w-4" /> Retour aux apprenants</Link>

      {/* Bandeau résumé + actions rapides */}
      <div className="rounded-3xl border border-slate-200 bg-loden-pearl/50 p-6 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-loden-100 text-lg font-bold text-loden-700">
              {(u?.firstName?.[0] ?? "") + (u?.lastName?.[0] ?? "")}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-bold text-loden-ink">{fullName}</h2>
                <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${badgeTone(student.fileStatus)}`}>{FILE_STATUS_LABELS[student.fileStatus] ?? student.fileStatus}</span>
              </div>
              <p className="truncate text-sm text-loden-muted">{u?.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {u?.phone ? <ActionLink href={`tel:${u.phone}`} icon={<Phone className="h-4 w-4" aria-hidden="true" />} label="Appeler" /> : null}
            {u?.email ? <ActionLink href={`mailto:${u.email}`} icon={<Mail className="h-4 w-4" aria-hidden="true" />} label="Email" /> : null}
            {wa ? <ActionLink href={`https://wa.me/${wa}`} external icon={<MessageCircle className="h-4 w-4" aria-hidden="true" />} label="WhatsApp" /> : null}
            <button type="button" onClick={resetPassword} className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-loden-ink transition hover:bg-loden-50">
              <KeyRound className="h-4 w-4" aria-hidden="true" /> Réinitialiser le mot de passe
            </button>
            {formationLabel ? <span className="rounded-xl border border-loden-200 px-3 py-1.5 text-xs font-semibold text-loden-700">{formationLabel}</span> : null}
          </div>
        </div>

        {resetInfo ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="text-sm text-amber-900">
              <p className="font-semibold">Mot de passe temporaire pour {resetInfo.email}</p>
              <p className="mt-1">Communiquez-le à l&apos;élève — il ne sera plus affiché : <code className="rounded bg-white px-2 py-0.5 font-mono text-base font-bold text-loden-ink">{resetInfo.tempPassword}</code></p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => navigator.clipboard?.writeText(resetInfo.tempPassword)} className="focus-ring inline-flex items-center gap-1.5 rounded-full bg-loden-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-loden-800"><Copy className="h-4 w-4" aria-hidden="true" /> Copier</button>
              <button type="button" onClick={() => setResetInfo(null)} className="focus-ring rounded-full border border-amber-300 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100">Fermer</button>
            </div>
          </div>
        ) : null}

        {/* KPI rapides */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Kpi label="Solde dû" value={euros(finance.balance)} tone={finance.balance > 0 ? "danger" : "ok"} />
          <KpiBar label="Progression" pct={student.progressPercent} value={`${student.progressPercent}%`} />
          <KpiBar label="Heures" pct={hoursPct} value={`${student.consumedHours}/${student.purchasedHours} h`} />
          <Kpi label="Prochaine leçon" value={lessons.next ? fmtDateTime(lessons.next.startsAt) : "—"} />
          <Kpi label="Prochain examen" value={nextExam ? `${EXAM_TYPE_LABELS[nextExam.type] ?? nextExam.type} · ${fmtDate(nextExam.scheduledAt)}` : "—"} />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-slate-200/70 pt-4 text-sm sm:grid-cols-3 lg:grid-cols-4">
          <Info label="NEPH" value={student.neph || "—"} />
          <Info label="Date de naissance" value={`${fmtDate(student.birthDate)}${ageY != null ? ` (${ageY} ans)` : ""}`} />
          <Info label="Date d'inscription" value={fmtDate(student.registeredAt)} />
          <Info label="Agence" value={agencyLabel || "—"} />
          <Info label="Financement" value={student.financingType || "—"} />
          <Info label="Téléphone" value={u?.phone || "—"} />
          <Info label="Filière" value={student.filiere || "—"} />
          <Info label="Lieu de naissance" value={student.birthPlace || "—"} />
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

        {tab === "examens" ? (
          <div className="grid gap-5">
            <h3 className="text-lg font-semibold text-loden-ink">Examens</h3>
            <div className="grid gap-3 sm:grid-cols-[auto_1fr_1fr_auto] sm:items-end">
              <Field label="Type">
                <select className="field-input" value={examForm.type} onChange={(e) => setExamForm((f) => ({ ...f, type: e.target.value }))}>
                  <option value="CODE">Code</option>
                  <option value="CONDUITE">Conduite</option>
                </select>
              </Field>
              <Field label="Date & heure"><input type="datetime-local" className="field-input" value={examForm.scheduledAt} onChange={(e) => setExamForm((f) => ({ ...f, scheduledAt: e.target.value }))} /></Field>
              <Field label="Centre"><input className="field-input" placeholder="Centre d'examen" value={examForm.center} onChange={(e) => setExamForm((f) => ({ ...f, center: e.target.value }))} /></Field>
              <button type="button" onClick={addExam} className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-full bg-loden-700 px-5 text-sm font-semibold text-white transition hover:bg-loden-800"><CalendarPlus className="h-4 w-4" aria-hidden="true" /> Planifier</button>
            </div>
            <div className="grid gap-2">
              {[...exams].sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()).map((exam) => (
                <div key={exam.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-loden-pearl/50 p-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-loden-100 text-loden-700"><GraduationCap className="h-4 w-4" aria-hidden="true" /></span>
                    <div>
                      <p className="text-sm font-semibold text-loden-ink">{EXAM_TYPE_LABELS[exam.type] ?? exam.type}{exam.attempt > 1 ? ` · tentative ${exam.attempt}` : ""}</p>
                      <p className="text-xs text-loden-muted">{fmtDateTime(exam.scheduledAt)}{exam.center ? ` · ${exam.center}` : ""}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeTone(exam.result)}`}>{EXAM_RESULT_LABELS[exam.result] ?? exam.result}</span>
                    <select className="field-input h-9 w-36 py-1 text-xs" value={exam.result} onChange={(e) => patchExam(exam, { result: e.target.value })} aria-label="Résultat">
                      {Object.entries(EXAM_RESULT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                    <input type="number" min={0} max={100} className="field-input h-9 w-20 py-1 text-xs" placeholder="Score" defaultValue={exam.score ?? ""} onBlur={(e) => { const v = e.target.value === "" ? undefined : Number(e.target.value); if (v !== (exam.score ?? undefined)) patchExam(exam, { score: v }); }} aria-label="Score" />
                  </div>
                </div>
              ))}
              {exams.length === 0 ? <p className="text-sm text-loden-muted">Aucun examen planifié.</p> : null}
            </div>
          </div>
        ) : null}

        {tab === "comptabilite" ? (
          <div className="grid gap-5">
            <h3 className="text-lg font-semibold text-loden-ink">Comptabilité</h3>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Stat label="Facturé" value={euros(finance.billed)} />
              <Stat label="Encaissé" value={euros(finance.collected)} />
              <Stat label="Solde dû" value={euros(finance.balance)} tone={finance.balance > 0 ? "danger" : "ok"} />
              <Stat label="Échéances à venir" value={euros(finance.dueInstallments)} />
            </div>
            <ListBlock title={`Factures (${invoices.length})`} href="/admin/factures" items={invoices.map((i) => ({ id: i.id, left: i.number || "Brouillon", mid: fmtDate(i.createdAt), right: euros(i.totalCents), badge: i.status }))} empty="Aucune facture." />
            <ListBlock title={`Paiements (${payments.length})`} href="/admin/finance" items={payments.map((p) => ({ id: p.id, left: p.kind, mid: fmtDate(p.paidAt || p.createdAt), right: euros(p.amountCents), badge: p.status }))} empty="Aucun paiement." />
            <ListBlock title={`Devis (${quotes.length})`} href="/admin/devis" items={quotes.map((q) => ({ id: q.id, left: q.number || "Brouillon", mid: fmtDate(q.createdAt), right: euros(q.totalCents), badge: q.status }))} empty="Aucun devis." />
            <ListBlock title={`Échéances (${installments.length})`} href="/admin/finance" items={installments.map((i) => ({ id: i.id, left: fmtDate(i.dueDate), mid: "", right: euros(i.amountCents), badge: i.status }))} empty="Aucune échéance." />
          </div>
        ) : null}

        {tab === "consommations" ? (
          <div className="grid gap-4">
            <h3 className="text-lg font-semibold text-loden-ink">Consommations</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Heures achetées" value={`${student.purchasedHours} h`} />
              <Stat label="Heures consommées" value={`${student.consumedHours} h`} />
              <Stat label="Heures restantes" value={`${Math.max(0, student.purchasedHours - student.consumedHours)} h`} tone={student.purchasedHours - student.consumedHours <= 0 ? "danger" : "ok"} />
              <Stat label="Leçons à venir" value={String(lessons.upcoming.length)} />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs font-semibold text-loden-muted"><span>Heures utilisées</span><span>{hoursPct}%</span></div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full rounded-full ${hoursPct >= 100 ? "bg-rose-500" : "bg-loden-500"}`} style={{ width: `${hoursPct}%` }} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">{lessons.past.length} réalisées</span>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">{lessons.upcoming.length} à venir</span>
              <span className="rounded-full bg-rose-50 px-3 py-1 text-rose-700">{lessons.cancelled.length} annulées</span>
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
          <div className="grid gap-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-loden-ink">Planning — leçons</h3>
              <Link href="/admin/rendez-vous?view=planning" className="text-sm font-semibold text-loden-700 hover:underline">Ouvrir le planning →</Link>
            </div>
            <LessonGroup title={`À venir (${lessons.upcoming.length})`} items={lessons.upcoming} empty="Aucune leçon à venir." />
            <LessonGroup title={`Historique (${lessons.past.length})`} items={lessons.past} empty="Aucune leçon passée." />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ActionLink({ href, icon, label, external = false }: { href: string; icon: React.ReactNode; label: string; external?: boolean }) {
  return (
    <a href={href} {...(external ? { target: "_blank", rel: "noreferrer" } : {})} className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-loden-ink transition hover:bg-loden-50">
      {icon} {label}
    </a>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone?: "ok" | "danger" }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-3">
      <p className="text-xs uppercase tracking-wide text-loden-muted">{label}</p>
      <p className={`mt-1 truncate text-base font-bold ${tone === "danger" ? "text-rose-600" : tone === "ok" ? "text-emerald-600" : "text-loden-ink"}`} title={value}>{value}</p>
    </div>
  );
}

function KpiBar({ label, pct, value }: { label: string; pct: number; value: string }) {
  const safe = Math.max(0, Math.min(100, pct));
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-3">
      <p className="text-xs uppercase tracking-wide text-loden-muted">{label}</p>
      <p className="mt-1 text-base font-bold text-loden-ink">{value}</p>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${safe >= 100 ? "bg-rose-500" : "bg-loden-500"}`} style={{ width: `${safe}%` }} />
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

function Stat({ label, value, tone }: { label: string; value: string; tone?: "ok" | "danger" }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-loden-pearl/50 p-4">
      <p className="text-xs uppercase tracking-wide text-loden-muted">{label}</p>
      <p className={`mt-1 text-xl font-bold ${tone === "danger" ? "text-rose-600" : tone === "ok" ? "text-emerald-600" : "text-loden-ink"}`}>{value}</p>
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

function LessonGroup({ title, items, empty }: { title: string; items: Booking[]; empty: string }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-loden-ink">{title}</h4>
      <div className="mt-2 grid gap-2">
        {items.map((b) => (
          <div key={b.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-loden-pearl/50 p-3">
            <span className="text-sm font-medium text-loden-ink">{fmtDate(b.startsAt)} · {fmtTime(b.startsAt)}–{fmtTime(b.endsAt)}</span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeTone(b.status)}`}>{b.status}</span>
          </div>
        ))}
        {items.length === 0 ? <p className="text-sm text-loden-muted">{empty}</p> : null}
      </div>
    </div>
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
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeTone(it.badge)}`}>{it.badge}</span>
            </span>
          </div>
        ))}
        {items.length === 0 ? <p className="text-sm text-loden-muted">{empty}</p> : null}
      </div>
    </div>
  );
}
