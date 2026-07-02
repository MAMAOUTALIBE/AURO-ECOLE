"use client";

import { useEffect, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  History,
  Mail,
  MessageCircle,
  Pencil,
  Phone,
  RefreshCw,
  RotateCcw,
  Trash2,
  UserPlus,
  Users,
  X
} from "lucide-react";
import { Badge, EmptyState, Skeleton } from "@/components/crm/ui";
import {
  PRIORITY_DOT,
  PRIORITY_LABELS,
  SOURCE_ICONS,
  SOURCE_LABELS,
  SOURCE_VARIANTS,
  STATUS_LABELS,
  STATUS_VARIANTS,
  TYPE_LABELS,
  formatDateTime,
  historyLabel
} from "./appointment-ui";
import type { AppointmentDetail, AppointmentRefs, EnrichedAppointment } from "./types";

type DrawerAction =
  | { kind: "status"; status: EnrichedAppointment["status"] }
  | { kind: "notify"; channel: "client" | "whatsapp" }
  | { kind: "transform" }
  | { kind: "delete" }
  | { kind: "reschedule"; startsAt: string; endsAt: string; force?: boolean }
  | { kind: "assign"; assignedToId?: string; instructorId?: string; vehicleId?: string }
  | { kind: "notes"; notes: string };

export function AppointmentDrawer({
  appointmentId,
  refs,
  onClose,
  onEdit,
  onAction,
  reloadKey
}: {
  appointmentId: string | null;
  refs: AppointmentRefs;
  onClose: () => void;
  onEdit: (appointment: EnrichedAppointment) => void;
  onAction: (id: string, action: DrawerAction) => Promise<boolean>;
  reloadKey: number;
}) {
  const [detail, setDetail] = useState<AppointmentDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleStart, setRescheduleStart] = useState("");
  const [rescheduleEnd, setRescheduleEnd] = useState("");
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignAdvisor, setAssignAdvisor] = useState("");
  const [assignInstructor, setAssignInstructor] = useState("");
  const [assignVehicle, setAssignVehicle] = useState("");

  useEffect(() => {
    if (!appointmentId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/admin/appointments/${appointmentId}`)
      .then((r) => r.json())
      .then((payload) => {
        if (cancelled) return;
        if (!payload?.data?.appointment) throw new Error(payload?.error?.message ?? "Rendez-vous introuvable.");
        const data = payload.data as AppointmentDetail;
        setDetail(data);
        setNotesDraft(data.appointment.notes ?? "");
        setAssignAdvisor(data.appointment.assignedToId ?? "");
        setAssignInstructor(data.appointment.instructorId ?? "");
        setAssignVehicle(data.appointment.vehicleId ?? "");
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : "Chargement impossible."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [appointmentId, reloadKey]);

  if (!appointmentId) return null;

  const appointment = detail?.appointment;

  const run = async (action: DrawerAction) => {
    if (!appointmentId) return;
    setBusy(true);
    setError(null);
    try {
      const ok = await onAction(appointmentId, action);
      if (ok && (action.kind === "reschedule" || action.kind === "assign")) {
        setRescheduleOpen(false);
        setAssignOpen(false);
      }
    } finally {
      setBusy(false);
    }
  };

  // Fallback si la source n'est pas dans la cartographie (robustesse : jamais de composant
  // undefined qui ferait planter le rendu du volet).
  const SourceIcon = (appointment ? SOURCE_ICONS[appointment.source] : MessageCircle) ?? MessageCircle;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/40" role="dialog" aria-modal="true">
      <button type="button" className="flex-1 cursor-default" aria-label="Fermer" onClick={onClose} />
      <div className="flex h-full w-full max-w-lg flex-col overflow-y-auto border-l border-slate-200 bg-white shadow-premium">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur">
          <h2 className="text-base font-semibold text-loden-ink">Détail du rendez-vous</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-loden-muted hover:bg-loden-50"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="grid gap-5 px-5 py-5">
          {loading ? (
            <div className="grid gap-3">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : error && !appointment ? (
            <p className="rounded-2xl bg-rose-50 p-4 text-sm font-medium text-rose-700">{error}</p>
          ) : appointment ? (
            <>
              {error ? <p className="rounded-2xl bg-rose-50 p-3 text-sm font-medium text-rose-700">{error}</p> : null}

              {/* En-tête prospect */}
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold text-loden-ink">{appointment.fullName}</h3>
                  <Badge variant={STATUS_VARIANTS[appointment.status]}>{STATUS_LABELS[appointment.status]}</Badge>
                  <Badge variant={SOURCE_VARIANTS[appointment.source]}>
                    <SourceIcon className="h-3 w-3" aria-hidden="true" />
                    {SOURCE_LABELS[appointment.source]}
                  </Badge>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-loden-muted">
                    <span className={`h-2 w-2 rounded-full ${PRIORITY_DOT[appointment.priority]}`} aria-hidden="true" />
                    {PRIORITY_LABELS[appointment.priority]}
                  </span>
                </div>
                <div className="mt-3 grid gap-2 text-sm">
                  <a className="focus-ring inline-flex items-center gap-2 rounded-xl bg-loden-50 px-3 py-2 font-semibold text-loden-800" href={`tel:${appointment.phone}`}>
                    <Phone className="h-4 w-4" aria-hidden="true" /> {appointment.phone}
                  </a>
                  {appointment.email ? (
                    <a className="focus-ring inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 font-semibold text-loden-ink" href={`mailto:${appointment.email}`}>
                      <Mail className="h-4 w-4" aria-hidden="true" /> {appointment.email}
                    </a>
                  ) : null}
                </div>
              </div>

              {/* Informations clés */}
              <dl className="grid grid-cols-2 gap-3 rounded-2xl bg-loden-pearl/60 p-4 text-sm">
                <Info label="Créneau" value={`${formatDateTime(appointment.startsAt)} → ${new Date(appointment.endsAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`} />
                <Info label="Type" value={TYPE_LABELS[appointment.type]} />
                <Info label="Formation" value={appointment.formationLabel || appointment.formation || "—"} />
                <Info label="Objectif" value={appointment.objective || "—"} />
                <Info label="Conseiller" value={appointment.advisorName || "Non assigné"} />
                <Info label="Moniteur" value={appointment.instructorName || "—"} />
                <Info label="Véhicule" value={appointment.vehicleLabel || "—"} />
                <Info label="Agence" value={appointment.agencyName || "—"} />
              </dl>

              {appointment.message ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-loden-muted">Message du prospect</p>
                  <p className="mt-1 rounded-2xl bg-slate-50 p-3 text-sm leading-6 text-loden-ink">{appointment.message}</p>
                </div>
              ) : null}

              {/* Actions */}
              <div className="grid gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-loden-muted">Actions</p>
                <div className="flex flex-wrap gap-2">
                  <ActionButton icon={CheckCircle2} label="Confirmer" tone="success" disabled={busy} onClick={() => void run({ kind: "status", status: "confirmed" })} />
                  <ActionButton icon={CalendarClock} label="Replanifier" disabled={busy} onClick={() => {
                    setRescheduleStart(toInput(appointment.startsAt));
                    setRescheduleEnd(toInput(appointment.endsAt));
                    setRescheduleOpen((v) => !v);
                  }} />
                  <ActionButton icon={RotateCcw} label="Relancer" disabled={busy} onClick={() => void run({ kind: "status", status: "to_follow_up" })} />
                  <ActionButton icon={Users} label="Assigner" disabled={busy} onClick={() => setAssignOpen((v) => !v)} />
                  <ActionButton icon={MessageCircle} label="WhatsApp" tone="whatsapp" disabled={busy} onClick={() => void run({ kind: "notify", channel: "whatsapp" })} />
                  <ActionButton icon={Mail} label="Email" disabled={busy} onClick={() => void run({ kind: "notify", channel: "client" })} />
                  <ActionButton icon={UserPlus} label="Transformer en élève" disabled={busy} onClick={() => void run({ kind: "transform" })} />
                  <ActionButton icon={Pencil} label="Modifier" disabled={busy} onClick={() => onEdit(appointment)} />
                  <ActionButton icon={Trash2} label="Annuler / Supprimer" tone="danger" disabled={busy} onClick={() => void run({ kind: "delete" })} />
                </div>

                {rescheduleOpen ? (
                  <div className="mt-1 grid gap-2 rounded-2xl border border-slate-200 bg-white p-3">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <label className="grid gap-1 text-xs font-semibold text-loden-ink">
                        Nouveau début
                        <input type="datetime-local" className="field-input" value={rescheduleStart} onChange={(e) => setRescheduleStart(e.target.value)} />
                      </label>
                      <label className="grid gap-1 text-xs font-semibold text-loden-ink">
                        Nouvelle fin
                        <input type="datetime-local" className="field-input" value={rescheduleEnd} onChange={(e) => setRescheduleEnd(e.target.value)} />
                      </label>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        disabled={busy || !rescheduleStart || !rescheduleEnd}
                        onClick={() => void run({ kind: "reschedule", startsAt: new Date(rescheduleStart).toISOString(), endsAt: new Date(rescheduleEnd).toISOString() })}
                        className="focus-ring rounded-xl bg-loden-700 px-4 py-2 text-xs font-semibold text-white hover:bg-loden-800 disabled:opacity-60"
                      >
                        Replanifier
                      </button>
                    </div>
                  </div>
                ) : null}

                {assignOpen ? (
                  <div className="mt-1 grid gap-2 rounded-2xl border border-slate-200 bg-white p-3">
                    <div className="grid gap-2 sm:grid-cols-3">
                      <select className="field-input" value={assignAdvisor} onChange={(e) => setAssignAdvisor(e.target.value)} aria-label="Conseiller">
                        <option value="">— Conseiller —</option>
                        {refs.advisors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                      <select className="field-input" value={assignInstructor} onChange={(e) => setAssignInstructor(e.target.value)} aria-label="Moniteur">
                        <option value="">— Moniteur —</option>
                        {refs.instructors.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                      </select>
                      <select className="field-input" value={assignVehicle} onChange={(e) => setAssignVehicle(e.target.value)} aria-label="Véhicule">
                        <option value="">— Véhicule —</option>
                        {refs.vehicles.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
                      </select>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void run({ kind: "assign", assignedToId: assignAdvisor || undefined, instructorId: assignInstructor || undefined, vehicleId: assignVehicle || undefined })}
                        className="focus-ring rounded-xl bg-loden-700 px-4 py-2 text-xs font-semibold text-white hover:bg-loden-800 disabled:opacity-60"
                      >
                        Enregistrer l&apos;assignation
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Notifications */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-loden-muted">Notifications</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <Badge variant="neutral">Admin : {appointment.adminEmailStatus ?? "—"}</Badge>
                  <Badge variant="neutral">Client : {appointment.clientEmailStatus ?? "—"}</Badge>
                  <Badge variant="neutral">WhatsApp : {appointment.whatsappStatus ?? "—"}</Badge>
                </div>
              </div>

              {/* Notes internes */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-loden-muted">Notes internes</p>
                <textarea
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  className="field-input mt-2 min-h-[72px]"
                  aria-label="Notes internes"
                />
                <button
                  type="button"
                  disabled={busy || notesDraft === (appointment.notes ?? "")}
                  onClick={() => void run({ kind: "notes", notes: notesDraft })}
                  className="focus-ring mt-2 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-loden-ink hover:bg-loden-50 disabled:opacity-50"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Enregistrer la note
                </button>
              </div>

              {/* Tâches liées */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-loden-muted">Tâches liées</p>
                <div className="mt-2 grid gap-2">
                  {detail.tasks.length ? (
                    detail.tasks.map((task) => (
                      <div key={task.id} className="rounded-2xl bg-loden-pearl/70 p-3 text-sm">
                        <p className="font-semibold text-loden-ink">{task.type} · {task.priority}</p>
                        <p className="mt-1 text-loden-muted">{task.note}</p>
                        <p className="mt-1 text-xs text-loden-muted">Échéance : {formatDateTime(task.deadline)}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-loden-muted">Aucune tâche liée.</p>
                  )}
                </div>
              </div>

              {/* Conversation chatbot */}
              {detail.conversations.length ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-loden-muted">Conversation chatbot</p>
                  <div className="mt-2 grid gap-2 rounded-2xl bg-slate-50 p-3">
                    {detail.conversations.flatMap((c) => c.messages).map((message, index) => (
                      <div
                        key={index}
                        className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                          message.role === "user" ? "self-end bg-loden-50 text-loden-800" : "self-start bg-white text-loden-ink shadow-soft"
                        }`}
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-loden-muted">
                          {message.role === "user" ? "Visiteur" : "Assistant"}
                        </p>
                        <p className="mt-0.5 leading-5">{message.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Historique */}
              <div>
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-loden-muted">
                  <History className="h-3.5 w-3.5" aria-hidden="true" /> Historique
                </p>
                {detail.history.length ? (
                  <ol className="mt-3 grid gap-3 border-l border-slate-200 pl-4">
                    {detail.history.map((entry) => (
                      <li key={entry.id} className="relative">
                        <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-loden-500" aria-hidden="true" />
                        <p className="text-sm font-semibold text-loden-ink">{historyLabel(entry.action)}</p>
                        <p className="text-xs text-loden-muted">{formatDateTime(entry.createdAt)}</p>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="mt-2 text-sm text-loden-muted">Aucun évènement.</p>
                )}
              </div>
            </>
          ) : (
            <EmptyState icon={RefreshCw} title="Rendez-vous introuvable" />
          )}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-loden-muted">{label}</dt>
      <dd className="mt-0.5 truncate text-sm text-loden-ink" title={value}>{value}</dd>
    </div>
  );
}

const ACTION_TONES: Record<string, string> = {
  default: "border-slate-200 text-loden-ink hover:bg-loden-50",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  danger: "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
  whatsapp: "border-transparent bg-[#25D366] text-white hover:bg-[#1ebe5b]"
};

function ActionButton({
  icon: Icon,
  label,
  tone = "default",
  disabled,
  onClick
}: {
  icon: typeof CheckCircle2;
  label: string;
  tone?: "default" | "success" | "danger" | "whatsapp";
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`focus-ring inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition disabled:opacity-50 ${ACTION_TONES[tone]}`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </button>
  );
}

function toInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export type { DrawerAction };
