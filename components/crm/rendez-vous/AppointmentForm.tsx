"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import {
  PRIORITY_LABELS,
  SOURCE_LABELS,
  STATUS_LABELS,
  TYPE_LABELS,
  localInputToIso,
  toLocalInput,
  vocab
} from "./appointment-ui";
import type {
  AppointmentFormPayload,
  AppointmentPriority,
  AppointmentRefs,
  AppointmentSource,
  AppointmentStatus,
  AppointmentType,
  EnrichedAppointment
} from "./types";

type FormState = {
  source: AppointmentSource;
  type: AppointmentType;
  status: AppointmentStatus;
  priority: AppointmentPriority;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  formation: string;
  objective: string;
  message: string;
  notes: string;
  startsLocal: string;
  endsLocal: string;
  formationId: string;
  instructorId: string;
  vehicleId: string;
  agencyId: string;
  assignedToId: string;
  consentContact: boolean;
  consentWhatsApp: boolean;
  notify: boolean;
};

function defaultState(): FormState {
  const start = new Date();
  start.setHours(start.getHours() + 1, 0, 0, 0);
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  return {
    source: "manual",
    type: "call",
    status: "new",
    priority: "normal",
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    formation: "",
    objective: "",
    message: "",
    notes: "",
    startsLocal: toLocalInput(start.toISOString()),
    endsLocal: toLocalInput(end.toISOString()),
    formationId: "",
    instructorId: "",
    vehicleId: "",
    agencyId: "",
    assignedToId: "",
    consentContact: true,
    consentWhatsApp: false,
    notify: false
  };
}

function fromAppointment(appointment: EnrichedAppointment): FormState {
  return {
    source: appointment.source,
    type: appointment.type,
    status: appointment.status,
    priority: appointment.priority,
    firstName: appointment.firstName ?? "",
    lastName: appointment.lastName ?? "",
    phone: appointment.phone ?? "",
    email: appointment.email ?? "",
    formation: appointment.formation ?? "",
    objective: appointment.objective ?? "",
    message: appointment.message ?? "",
    notes: appointment.notes ?? "",
    startsLocal: toLocalInput(appointment.startsAt),
    endsLocal: toLocalInput(appointment.endsAt),
    formationId: appointment.formationId ?? "",
    instructorId: appointment.instructorId ?? "",
    vehicleId: appointment.vehicleId ?? "",
    agencyId: appointment.agencyId ?? "",
    assignedToId: appointment.assignedToId ?? "",
    consentContact: appointment.consentContact,
    consentWhatsApp: appointment.consentWhatsApp,
    notify: false
  };
}

export function AppointmentForm({
  open,
  mode,
  appointment,
  refs,
  onClose,
  onSubmit
}: {
  open: boolean;
  mode: "create" | "edit";
  appointment?: EnrichedAppointment | null;
  refs: AppointmentRefs;
  onClose: () => void;
  onSubmit: (payload: AppointmentFormPayload) => Promise<void>;
}) {
  const [form, setForm] = useState<FormState>(defaultState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(mode === "edit" && appointment ? fromAppointment(appointment) : defaultState());
  }, [open, mode, appointment]);

  const vehiclesForInstructor = useMemo(() => {
    if (!form.instructorId) return refs.vehicles;
    return refs.vehicles.filter((v) => !v.instructorId || v.instructorId === form.instructorId);
  }, [refs.vehicles, form.instructorId]);

  if (!open) return null;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!form.firstName.trim() || !form.lastName.trim() || !form.phone.trim()) {
      setError("Prénom, nom et téléphone sont requis.");
      return;
    }
    if (!form.startsLocal || !form.endsLocal) {
      setError("Renseigne le créneau (début et fin).");
      return;
    }
    const startsAt = localInputToIso(form.startsLocal);
    const endsAt = localInputToIso(form.endsLocal);
    if (new Date(endsAt) <= new Date(startsAt)) {
      setError("L'heure de fin doit être après l'heure de début.");
      return;
    }
    const payload: AppointmentFormPayload = {
      source: form.source,
      type: form.type,
      status: form.status,
      priority: form.priority,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || undefined,
      formation: form.formation.trim(),
      objective: form.objective.trim(),
      message: form.message.trim() || undefined,
      notes: form.notes.trim() || undefined,
      startsAt,
      endsAt,
      formationId: form.formationId || undefined,
      instructorId: form.instructorId || undefined,
      vehicleId: form.vehicleId || undefined,
      agencyId: form.agencyId || undefined,
      assignedToId: form.assignedToId || undefined,
      consentContact: form.consentContact,
      consentWhatsApp: form.consentWhatsApp,
      notify: form.notify
    };
    setSubmitting(true);
    try {
      await onSubmit(payload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enregistrement impossible.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-premium">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-loden-ink">
            {mode === "edit" ? "Modifier le rendez-vous" : "Créer un rendez-vous"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-loden-muted hover:bg-loden-50"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 grid gap-4" noValidate>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Prénom *">
              <input className="field-input" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} aria-label="Prénom" />
            </Field>
            <Field label="Nom *">
              <input className="field-input" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} aria-label="Nom" />
            </Field>
            <Field label="Téléphone *">
              <input className="field-input" value={form.phone} onChange={(e) => set("phone", e.target.value)} aria-label="Téléphone" />
            </Field>
            <Field label="Email">
              <input className="field-input" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} aria-label="Email" />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Source">
              <select className="field-input" value={form.source} onChange={(e) => set("source", e.target.value as AppointmentSource)} aria-label="Source">
                {vocab.source.map((s) => (
                  <option key={s} value={s}>{SOURCE_LABELS[s]}</option>
                ))}
              </select>
            </Field>
            <Field label="Type">
              <select className="field-input" value={form.type} onChange={(e) => set("type", e.target.value as AppointmentType)} aria-label="Type">
                {vocab.type.map((t) => (
                  <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                ))}
              </select>
            </Field>
            <Field label="Statut">
              <select className="field-input" value={form.status} onChange={(e) => set("status", e.target.value as AppointmentStatus)} aria-label="Statut">
                {vocab.status.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </Field>
            <Field label="Priorité">
              <select className="field-input" value={form.priority} onChange={(e) => set("priority", e.target.value as AppointmentPriority)} aria-label="Priorité">
                {vocab.priority.map((p) => (
                  <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Formation (libellé)">
              <input className="field-input" value={form.formation} onChange={(e) => set("formation", e.target.value)} aria-label="Formation" placeholder="Ex. Permis B" />
            </Field>
            <Field label="Objectif">
              <input className="field-input" value={form.objective} onChange={(e) => set("objective", e.target.value)} aria-label="Objectif" placeholder="Ex. Inscription CPF" />
            </Field>
            <Field label="Début *">
              <input className="field-input" type="datetime-local" value={form.startsLocal} onChange={(e) => set("startsLocal", e.target.value)} aria-label="Début" />
            </Field>
            <Field label="Fin *">
              <input className="field-input" type="datetime-local" value={form.endsLocal} onChange={(e) => set("endsLocal", e.target.value)} aria-label="Fin" />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Formation (référentiel)">
              <select className="field-input" value={form.formationId} onChange={(e) => set("formationId", e.target.value)} aria-label="Formation liée">
                <option value="">— Aucune —</option>
                {refs.formations.map((f) => (
                  <option key={f.id} value={f.id}>{f.title}</option>
                ))}
              </select>
            </Field>
            <Field label="Conseiller">
              <select className="field-input" value={form.assignedToId} onChange={(e) => set("assignedToId", e.target.value)} aria-label="Conseiller assigné">
                <option value="">— Non assigné —</option>
                {refs.advisors.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Moniteur">
              <select className="field-input" value={form.instructorId} onChange={(e) => set("instructorId", e.target.value)} aria-label="Moniteur">
                <option value="">— Aucun —</option>
                {refs.instructors.map((i) => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Véhicule">
              <select className="field-input" value={form.vehicleId} onChange={(e) => set("vehicleId", e.target.value)} aria-label="Véhicule">
                <option value="">— Aucun —</option>
                {vehiclesForInstructor.map((v) => (
                  <option key={v.id} value={v.id}>{v.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Agence">
              <select className="field-input" value={form.agencyId} onChange={(e) => set("agencyId", e.target.value)} aria-label="Agence">
                <option value="">— Non rattaché —</option>
                {refs.agencies.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Message du prospect">
            <textarea className="field-input min-h-[64px]" value={form.message} onChange={(e) => set("message", e.target.value)} aria-label="Message" />
          </Field>
          <Field label="Notes internes">
            <textarea className="field-input min-h-[64px]" value={form.notes} onChange={(e) => set("notes", e.target.value)} aria-label="Notes internes" />
          </Field>

          <div className="flex flex-wrap items-center gap-4 text-sm text-loden-ink">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={form.consentContact} onChange={(e) => set("consentContact", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-loden-600" />
              Consentement contact
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={form.consentWhatsApp} onChange={(e) => set("consentWhatsApp", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-loden-600" />
              Consentement WhatsApp
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={form.notify} onChange={(e) => set("notify", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-loden-600" />
              Envoyer les notifications
            </label>
          </div>

          {error ? <p className="rounded-2xl bg-rose-50 p-3 text-sm font-medium text-rose-700">{error}</p> : null}

          <div className="flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="focus-ring rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-loden-ink hover:bg-loden-50">
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-loden-700 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-loden-800 disabled:opacity-70"
            >
              {submitting ? "Enregistrement…" : mode === "edit" ? "Enregistrer" : "Créer le rendez-vous"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-semibold text-loden-ink">{label}</span>
      {children}
    </label>
  );
}
