/* ------------------------------------------------------------------ *
 * Cartographies partagées (libellés FR, variantes de badge, icônes).
 * Source unique de vérité pour le vocabulaire du Centre rendez-vous.
 * ------------------------------------------------------------------ */

import {
  Bot,
  Building2,
  CalendarClock,
  FileSignature,
  FileSpreadsheet,
  Hand,
  MessageCircle,
  Phone,
  Video,
  type LucideIcon
} from "lucide-react";
import type { BadgeVariant } from "@/components/crm/ui";
import type {
  AppointmentPriority,
  AppointmentSource,
  AppointmentStatus,
  AppointmentType,
  KanbanColumnId
} from "./types";

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  new: "Nouveau",
  pending_confirmation: "À confirmer",
  confirmed: "Confirmé",
  scheduled: "Planifié",
  completed: "Terminé",
  cancelled: "Annulé",
  no_show: "Absent",
  to_follow_up: "À relancer"
};

export const STATUS_VARIANTS: Record<AppointmentStatus, BadgeVariant> = {
  new: "info",
  pending_confirmation: "warning",
  confirmed: "success",
  scheduled: "brand",
  completed: "indigo",
  cancelled: "danger",
  no_show: "danger",
  to_follow_up: "warning"
};

export const SOURCE_LABELS: Record<AppointmentSource, string> = {
  chatbot: "Chatbot",
  manual: "Manuel",
  phone: "Téléphone",
  whatsapp: "WhatsApp",
  crm: "CRM"
};

export const SOURCE_ICONS: Record<AppointmentSource, LucideIcon> = {
  chatbot: Bot,
  manual: Hand,
  phone: Phone,
  whatsapp: MessageCircle,
  crm: Building2
};

export const SOURCE_VARIANTS: Record<AppointmentSource, BadgeVariant> = {
  chatbot: "indigo", // violet : demandes chatbot
  manual: "neutral",
  phone: "info",
  whatsapp: "success",
  crm: "brand"
};

export const TYPE_LABELS: Record<AppointmentType, string> = {
  call: "Appel",
  agency: "En agence",
  video: "Visio",
  lesson: "Leçon",
  quote: "Devis",
  registration: "Inscription"
};

export const TYPE_ICONS: Record<AppointmentType, LucideIcon> = {
  call: Phone,
  agency: Building2,
  video: Video,
  lesson: CalendarClock,
  quote: FileSpreadsheet,
  registration: FileSignature
};

export const PRIORITY_LABELS: Record<AppointmentPriority, string> = {
  low: "Basse",
  normal: "Normale",
  high: "Haute",
  urgent: "Urgente"
};

/** Couleur de pastille de priorité (urgent/high = rouge/orange). */
export const PRIORITY_DOT: Record<AppointmentPriority, string> = {
  low: "bg-slate-300",
  normal: "bg-sky-400",
  high: "bg-amber-500",
  urgent: "bg-rose-500"
};

export const PRIORITY_VARIANTS: Record<AppointmentPriority, BadgeVariant> = {
  low: "neutral",
  normal: "info",
  high: "warning",
  urgent: "danger"
};

export const KANBAN_LABELS: Record<KanbanColumnId, string> = {
  nouveau: "Nouveau / À confirmer",
  confirme: "Confirmé",
  planifie: "Planifié",
  termine: "Terminé",
  annule: "Annulé / Absent",
  relance: "À relancer"
};

export const KANBAN_ORDER: KanbanColumnId[] = [
  "nouveau",
  "confirme",
  "planifie",
  "termine",
  "annule",
  "relance"
];

/** Libellés FR des actions d'historique. */
export const HISTORY_LABELS: Record<string, string> = {
  "appointment.created": "Créé",
  "appointment.status": "Changement de statut",
  "appointment.assigned": "Assignation",
  "appointment.rescheduled": "Replanifié",
  "appointment.updated": "Modifié",
  "appointment.transformed_to_student": "Transformé en élève",
  "appointment.deleted": "Supprimé"
};

export function historyLabel(action: string): string {
  return HISTORY_LABELS[action] ?? action;
}

/** Vocabulaire complet (utilitaire pour les sélecteurs de filtre). */
export const vocab = {
  status: Object.keys(STATUS_LABELS) as AppointmentStatus[],
  source: Object.keys(SOURCE_LABELS) as AppointmentSource[],
  type: Object.keys(TYPE_LABELS) as AppointmentType[],
  priority: Object.keys(PRIORITY_LABELS) as AppointmentPriority[]
} as const;

/* ----------------------------- Dates ----------------------------- */

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
}

/** Convertit un ISO en valeur d'input datetime-local (heure locale). */
export function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Convertit une valeur d'input datetime-local en ISO. */
export function localInputToIso(value: string): string {
  return new Date(value).toISOString();
}

/* ----------------------------- WhatsApp ---------------------------- */

export function normalizeWhatsappNumber(source: string): string {
  const digits = source.replace(/\D/g, "");
  return digits.startsWith("0") ? `33${digits.slice(1)}` : digits;
}

/* ------------------------------- Tags ------------------------------ */

/** Étiquettes dérivées des données d'un rendez-vous. */
export function deriveTags(appointment: {
  objective?: string | null;
  formation?: string | null;
  formationLabel?: string | null;
  consentWhatsApp?: boolean;
  priority: AppointmentPriority;
}): string[] {
  const tags: string[] = [];
  const haystack = `${appointment.objective ?? ""} ${appointment.formation ?? ""} ${appointment.formationLabel ?? ""}`.toUpperCase();
  if (haystack.includes("CPF")) tags.push("CPF");
  if (haystack.includes("VTC")) tags.push("VTC");
  if (haystack.includes("SST")) tags.push("SST");
  if (appointment.priority === "urgent") tags.push("Urgent");
  if (appointment.consentWhatsApp) tags.push("WhatsApp");
  return tags;
}
