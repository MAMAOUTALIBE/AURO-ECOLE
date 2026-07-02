import { z } from "zod";

// ---------------------------------------------------------------------------
// Vocabulaire canonique du rendez-vous unifié (source unique de vérité).
// Partagé par le module appointments ET le flux chatbot pour garantir une seule
// logique métier quel que soit le canal d'origine.
// ---------------------------------------------------------------------------

export const APPOINTMENT_SOURCES = ["chatbot", "manual", "phone", "whatsapp", "crm"] as const;
export const APPOINTMENT_TYPES = ["call", "agency", "video", "lesson", "quote", "registration"] as const;
export const APPOINTMENT_STATUSES = [
  "new",
  "pending_confirmation",
  "confirmed",
  "scheduled",
  "completed",
  "cancelled",
  "no_show",
  "to_follow_up"
] as const;
export const APPOINTMENT_PRIORITIES = ["low", "normal", "high", "urgent"] as const;

export const appointmentSourceSchema = z.enum(APPOINTMENT_SOURCES);
export const appointmentTypeSchema = z.enum(APPOINTMENT_TYPES);
export const appointmentStatusSchema = z.enum(APPOINTMENT_STATUSES);
export const appointmentPrioritySchema = z.enum(APPOINTMENT_PRIORITIES);

// Colonnes Kanban → statuts couverts + statut appliqué lors d'un drop dans la colonne.
export const KANBAN_COLUMNS = [
  { id: "nouveau", label: "Nouveau / À confirmer", statuses: ["new", "pending_confirmation"], dropStatus: "pending_confirmation" },
  { id: "confirme", label: "Confirmé", statuses: ["confirmed"], dropStatus: "confirmed" },
  { id: "planifie", label: "Planifié", statuses: ["scheduled"], dropStatus: "scheduled" },
  { id: "termine", label: "Terminé", statuses: ["completed"], dropStatus: "completed" },
  { id: "annule", label: "Annulé / Absent", statuses: ["cancelled", "no_show"], dropStatus: "cancelled" },
  { id: "relance", label: "À relancer", statuses: ["to_follow_up"], dropStatus: "to_follow_up" }
] as const;

export type KanbanColumnId = (typeof KANBAN_COLUMNS)[number]["id"];

export function kanbanColumnForStatus(status: string): KanbanColumnId {
  const column = KANBAN_COLUMNS.find((col) => (col.statuses as readonly string[]).includes(status));
  return (column?.id ?? "nouveau") as KanbanColumnId;
}

// Couleur d'affichage par statut (calendrier + badges).
// orange: à confirmer · vert: confirmé · bleu: planifié · gris: terminé · rouge: annulé/absent · ambre: à relancer
export function statusColor(status: string): string {
  switch (status) {
    case "confirmed":
      return "#16a34a"; // vert
    case "scheduled":
      return "#2563eb"; // bleu
    case "completed":
      return "#6b7280"; // gris
    case "cancelled":
    case "no_show":
      return "#dc2626"; // rouge
    case "to_follow_up":
      return "#d97706"; // ambre
    case "new":
    case "pending_confirmation":
    default:
      return "#f97316"; // orange
  }
}

// Mappe les anciennes valeurs FR (créneaux chatbot, widget public) vers le vocabulaire canonique.
export function canonicalType(value: string | null | undefined): string {
  const map: Record<string, string> = {
    APPEL: "call",
    AGENCE: "agency",
    VISIO: "video",
    DEVIS: "quote",
    INSCRIPTION: "registration"
  };
  if (!value) return "call";
  return map[value] ?? value;
}

// Ramène une source quelconque vers le vocabulaire canonique (chatbot|manual|phone|whatsapp|crm).
// Indispensable : les outils de l'agent IA créent des RDV avec des sources granulaires
// ("assistant-ia", "assistant-ia-rdv", "assistant-ia-devis") — non canoniques — qui, non
// normalisées, cassent l'affichage du Centre RDV (icône/libellé introuvable). L'assistant IA
// EST le chatbot → on ramène ces valeurs à "chatbot".
export function canonicalSource(value: string | null | undefined): string {
  const v = (value ?? "").toLowerCase();
  if (!v) return "manual";
  if ((APPOINTMENT_SOURCES as readonly string[]).includes(v)) return v;
  if (v.startsWith("assistant-ia") || v.startsWith("chatbot") || v.includes("assistant") || v.includes("chat")) return "chatbot";
  if (v.includes("whatsapp")) return "whatsapp";
  if (v.includes("phone") || v.includes("tel")) return "phone";
  return "crm";
}

export function canonicalStatus(value: string | null | undefined): string {
  const map: Record<string, string> = {
    A_CONFIRMER: "pending_confirmation",
    CONFIRME: "confirmed",
    TRAITE: "completed",
    ANNULE: "cancelled"
  };
  if (!value) return "pending_confirmation";
  return map[value] ?? value;
}

// Statuts considérés comme "actifs" (occupent un créneau) pour la détection de conflits.
export const ACTIVE_STATUSES_FOR_CONFLICT = ["new", "pending_confirmation", "confirmed", "scheduled"] as const;
