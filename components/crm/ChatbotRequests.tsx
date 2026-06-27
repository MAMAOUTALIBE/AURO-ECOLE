"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarCheck, CheckCircle2, Mail, MessageCircle, Phone, RefreshCw, UserPlus } from "lucide-react";
import { Badge, Card, EmptyState, type BadgeVariant } from "@/components/crm/ui";
import { contactInfo } from "@/data/site";

type Lead = {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  interest?: string | null;
  status: string;
  temperature?: string | null;
  createdAt: string;
};

type Appointment = {
  id: string;
  leadId: string;
  fullName: string;
  phone: string;
  email?: string | null;
  formation: string;
  objective: string;
  message?: string | null;
  date: string;
  time: string;
  type: string;
  status: "A_CONFIRMER" | "CONFIRME" | "TRAITE" | "ANNULE";
  consentWhatsApp: boolean;
  whatsappMessage?: string | null;
  adminEmailStatus: string;
  clientEmailStatus: string;
  whatsappStatus: string;
  createdAt: string;
};

type Task = {
  id: string;
  leadId: string;
  appointmentId?: string | null;
  type: string;
  priority: string;
  deadline: string;
  note: string;
  status: string;
};

type Conversation = {
  id: string;
  leadId?: string | null;
  appointmentId?: string | null;
  messages: { role: "user" | "assistant"; content: string; createdAt: string }[];
  summary?: string | null;
  intent?: string | null;
  aiConfidence?: number | null;
  lastMessage?: string | null;
  status: "OUVERTE" | "TRAITEE";
  updatedAt: string;
};

const STATUS_LABELS: Record<Appointment["status"], string> = {
  A_CONFIRMER: "À confirmer",
  CONFIRME: "Confirmé",
  TRAITE: "Traité",
  ANNULE: "Annulé"
};

const STATUS_VARIANTS: Record<Appointment["status"], "warning" | "success" | "brand" | "danger"> = {
  A_CONFIRMER: "warning",
  CONFIRME: "success",
  TRAITE: "brand",
  ANNULE: "danger"
};

const INTENT_LABELS: Record<string, string> = {
  permis_b: "Permis B",
  vtc: "VTC",
  sst: "SST",
  logistique: "Logistique",
  cpf_financement: "CPF",
  devis: "Devis",
  rendez_vous: "RDV",
  inscription: "Inscription",
  documents: "Documents",
  contact: "Contact",
  entreprise: "Entreprise",
  reclamation: "Urgent",
  autre: "À qualifier"
};

const INTENT_VARIANTS: Record<string, BadgeVariant> = {
  cpf_financement: "info",
  devis: "warning",
  rendez_vous: "brand",
  inscription: "success",
  entreprise: "indigo",
  reclamation: "danger"
};

function intentLabel(intent?: string | null) {
  if (!intent) return "À qualifier";
  return INTENT_LABELS[intent] ?? intent;
}

function intentVariant(intent?: string | null): BadgeVariant {
  return intent ? INTENT_VARIANTS[intent] ?? "neutral" : "neutral";
}

function normalizeWhatsappNumber(source: string) {
  const digits = source.replace(/\D/g, "");
  return digits.startsWith("0") ? `33${digits.slice(1)}` : digits;
}

function whatsappUrl(message?: string | null) {
  const number = normalizeWhatsappNumber(contactInfo.whatsapp || contactInfo.phone);
  return `https://wa.me/${number}?text=${encodeURIComponent(message || "Bonjour LODENE, je reviens vers vous au sujet d'une demande chatbot.")}`;
}

function dateTime(value: string) {
  return new Date(value).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function ChatbotRequests() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    fetch("/api/admin/appointments")
      .then((response) => response.json())
      .then((payload) => {
        if (!payload?.data?.appointments) throw new Error(payload?.error?.message ?? "Impossible de charger les demandes chatbot.");
        setAppointments(payload.data.appointments as Appointment[]);
        setLeads(payload.data.leads as Lead[]);
        setTasks(payload.data.tasks as Task[]);
        setConversations(payload.data.conversations as Conversation[]);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Chargement impossible."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const counts = useMemo(
    () => ({
      pending: appointments.filter((appointment) => appointment.status === "A_CONFIRMER").length,
      confirmed: appointments.filter((appointment) => appointment.status === "CONFIRME").length,
      leads: leads.length,
      tasks: tasks.filter((task) => task.status === "A_FAIRE").length,
      urgent: conversations.filter((conversation) => conversation.intent === "reclamation" || (conversation.aiConfidence ?? 0) >= 85).length
    }),
    [appointments, leads, tasks, conversations]
  );

  const standaloneConversations = useMemo(() => {
    const appointmentIds = new Set(appointments.map((appointment) => appointment.id));
    return conversations.filter((conversation) => !conversation.appointmentId || !appointmentIds.has(conversation.appointmentId));
  }, [appointments, conversations]);

  const changeStatus = async (appointment: Appointment, status: Appointment["status"]) => {
    if (appointment.status === status) return;
    setBusyId(appointment.id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/appointments/${appointment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error?.message ?? "Mise à jour impossible.");
      setAppointments((current) => current.map((item) => (item.id === appointment.id ? payload.data as Appointment : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mise à jour impossible.");
    } finally {
      setBusyId(null);
    }
  };

  const changeConversationStatus = async (conversation: Conversation, status: Conversation["status"]) => {
    if (conversation.status === status) return;
    setBusyId(conversation.id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/chat-conversations/${conversation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error?.message ?? "Mise à jour de la conversation impossible.");
      setConversations((current) => current.map((item) => (item.id === conversation.id ? payload.data as Conversation : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mise à jour de la conversation impossible.");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <p className="text-sm text-loden-muted">Chargement des demandes chatbot…</p>;

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-loden-muted">À confirmer</p>
          <p className="mt-1 text-2xl font-bold text-loden-ink">{counts.pending}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-loden-muted">Confirmés</p>
          <p className="mt-1 text-2xl font-bold text-loden-ink">{counts.confirmed}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-loden-muted">Leads chatbot</p>
          <p className="mt-1 text-2xl font-bold text-loden-ink">{counts.leads}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-loden-muted">À prioriser</p>
          <p className="mt-1 text-2xl font-bold text-loden-ink">{counts.urgent}</p>
          <p className="mt-1 text-xs text-loden-muted">{counts.tasks} tâche(s) ouvertes</p>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {error ? <p className="rounded-2xl bg-red-50 px-4 py-2 text-sm font-medium text-red-700">{error}</p> : <p className="text-sm text-loden-muted">{appointments.length} demande(s) rendez-vous</p>}
        <button
          type="button"
          onClick={load}
          className="focus-ring inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-loden-ink shadow-soft transition hover:bg-loden-50"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Actualiser
        </button>
      </div>

      {appointments.length ? (
        <div className="grid gap-4">
          {appointments.map((appointment) => {
            const relatedTasks = tasks.filter((task) => task.appointmentId === appointment.id);
            const conversation = conversations.find((item) => item.appointmentId === appointment.id || item.leadId === appointment.leadId);
            return (
              <Card key={appointment.id} className="p-4">
                <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr_auto]">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold text-loden-ink">{appointment.fullName}</h2>
                      <Badge variant={STATUS_VARIANTS[appointment.status]}>{STATUS_LABELS[appointment.status]}</Badge>
                      <Badge variant={intentVariant(conversation?.intent)}>{intentLabel(conversation?.intent)}</Badge>
                      {conversation?.aiConfidence ? <Badge variant="info">{conversation.aiConfidence}%</Badge> : null}
                      <Badge variant="brand">{appointment.formation}</Badge>
                      <Badge variant="neutral">{appointment.objective}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-loden-muted">
                      {appointment.date} à {appointment.time} · {appointment.type.toLowerCase()}
                    </p>
                    {appointment.message ? <p className="mt-2 text-sm leading-6 text-loden-ink">{appointment.message}</p> : null}
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-loden-muted">
                      <span>Admin email : {appointment.adminEmailStatus}</span>
                      <span>Client email : {appointment.clientEmailStatus}</span>
                      <span>WhatsApp : {appointment.whatsappStatus}</span>
                    </div>
                  </div>

                  <div className="grid gap-2 text-sm">
                    <a className="focus-ring inline-flex items-center gap-2 rounded-xl bg-loden-50 px-3 py-2 font-semibold text-loden-800" href={`tel:${appointment.phone}`}>
                      <Phone className="h-4 w-4" aria-hidden="true" />
                      {appointment.phone}
                    </a>
                    {appointment.email ? (
                      <a className="focus-ring inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 font-semibold text-loden-ink" href={`mailto:${appointment.email}`}>
                        <Mail className="h-4 w-4" aria-hidden="true" />
                        {appointment.email}
                      </a>
                    ) : null}
                    <a
                      className="focus-ring inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-3 py-2 font-semibold text-white"
                      href={whatsappUrl(appointment.whatsappMessage)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MessageCircle className="h-4 w-4" aria-hidden="true" />
                      Ouvrir WhatsApp
                    </a>
                  </div>

                  <div className="flex flex-col gap-2">
                    <select
                      className="field-input"
                      value={appointment.status}
                      disabled={busyId === appointment.id}
                      onChange={(event) => void changeStatus(appointment, event.target.value as Appointment["status"])}
                      aria-label={`Statut de ${appointment.fullName}`}
                    >
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => void changeStatus(appointment, "CONFIRME")}
                      disabled={busyId === appointment.id}
                      className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                    >
                      <CalendarCheck className="h-4 w-4" aria-hidden="true" />
                      Confirmer
                    </button>
                    <Link href="/admin/eleves" className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-loden-ink hover:bg-loden-50">
                      <UserPlus className="h-4 w-4" aria-hidden="true" />
                      Transformer en élève
                    </Link>
                    <button
                      type="button"
                      onClick={() => void changeStatus(appointment, "TRAITE")}
                      disabled={busyId === appointment.id}
                      className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-loden-ink hover:bg-loden-50 disabled:opacity-60"
                    >
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      Marquer traité
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 lg:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-loden-muted">Tâches CRM</p>
                    <div className="mt-2 grid gap-2">
                      {relatedTasks.length ? relatedTasks.map((task) => (
                        <div key={task.id} className="rounded-2xl bg-loden-pearl/70 p-3 text-sm">
                          <p className="font-semibold text-loden-ink">{task.type} · {task.priority}</p>
                          <p className="mt-1 text-loden-muted">{task.note}</p>
                          <p className="mt-1 text-xs text-loden-muted">Deadline : {dateTime(task.deadline)}</p>
                        </div>
                      )) : <p className="text-sm text-loden-muted">Aucune tâche liée.</p>}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-loden-muted">Conversation récente</p>
                    {conversation?.summary ? (
                      <p className="mt-2 rounded-2xl bg-loden-50 p-3 text-sm leading-6 text-loden-900">{conversation.summary}</p>
                    ) : conversation?.lastMessage ? (
                      <p className="mt-2 rounded-2xl bg-loden-50 p-3 text-sm leading-6 text-loden-900">Dernier message : {conversation.lastMessage}</p>
                    ) : null}
                    {conversation?.messages?.length ? (
                      <div className="mt-2 max-h-32 overflow-y-auto rounded-2xl bg-slate-50 p-3 text-sm text-loden-ink">
                        {conversation.messages.slice(-4).map((message, index) => (
                          <p key={index} className="mb-1">
                            <span className="font-semibold">{message.role === "user" ? "Visiteur" : "Assistant"} : </span>
                            {message.content}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-loden-muted">Aucune conversation enregistrée.</p>
                    )}
                    {conversation ? (
                      <button
                        type="button"
                        onClick={() => void changeConversationStatus(conversation, conversation.status === "TRAITEE" ? "OUVERTE" : "TRAITEE")}
                        disabled={busyId === conversation.id}
                        className="focus-ring mt-2 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-loden-ink hover:bg-loden-50 disabled:opacity-60"
                      >
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        {conversation.status === "TRAITEE" ? "Rouvrir la conversation" : "Marquer la conversation traitée"}
                      </button>
                    ) : null}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : standaloneConversations.length ? null : (
        <EmptyState icon={MessageCircle} title="Aucune demande chatbot" description="Les prochains rendez-vous pris depuis l'assistant apparaîtront ici." />
      )}

      {standaloneConversations.length ? (
        <div className="grid gap-3">
          <p className="text-sm font-semibold text-loden-ink">Conversations à qualifier</p>
          <div className="grid gap-3 lg:grid-cols-2">
            {standaloneConversations.map((conversation) => (
              <Card key={conversation.id} className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={intentVariant(conversation.intent)}>{intentLabel(conversation.intent)}</Badge>
                  {conversation.aiConfidence ? <Badge variant="info">{conversation.aiConfidence}%</Badge> : null}
                  <Badge variant={conversation.status === "TRAITEE" ? "success" : "warning"}>{conversation.status === "TRAITEE" ? "Traitée" : "Ouverte"}</Badge>
                </div>
                {conversation.summary ? (
                  <p className="mt-3 text-sm leading-6 text-loden-ink">{conversation.summary}</p>
                ) : conversation.lastMessage ? (
                  <p className="mt-3 text-sm leading-6 text-loden-ink">Dernier message : {conversation.lastMessage}</p>
                ) : null}
                {conversation.messages.length ? (
                  <div className="mt-3 max-h-28 overflow-y-auto rounded-2xl bg-slate-50 p-3 text-sm text-loden-ink">
                    {conversation.messages.slice(-3).map((message, index) => (
                      <p key={index} className="mb-1">
                        <span className="font-semibold">{message.role === "user" ? "Visiteur" : "Assistant"} : </span>
                        {message.content}
                      </p>
                    ))}
                  </div>
                ) : null}
                <p className="mt-3 text-xs text-loden-muted">Dernière activité : {dateTime(conversation.updatedAt)}</p>
                <button
                  type="button"
                  onClick={() => void changeConversationStatus(conversation, conversation.status === "TRAITEE" ? "OUVERTE" : "TRAITEE")}
                  disabled={busyId === conversation.id}
                  className="focus-ring mt-3 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-loden-ink hover:bg-loden-50 disabled:opacity-60"
                >
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  {conversation.status === "TRAITEE" ? "Rouvrir" : "Marquer traitée"}
                </button>
              </Card>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
