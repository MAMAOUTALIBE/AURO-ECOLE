/* ------------------------------------------------------------------ *
 * Types partagés du Centre rendez-vous & planning.
 * Reflètent fidèlement le contrat de l'API /api/admin/appointments.
 * ------------------------------------------------------------------ */

export type AppointmentStatus =
  | "new"
  | "pending_confirmation"
  | "confirmed"
  | "scheduled"
  | "completed"
  | "cancelled"
  | "no_show"
  | "to_follow_up";

export type AppointmentSource = "chatbot" | "manual" | "phone" | "whatsapp" | "crm";

export type AppointmentType = "call" | "agency" | "video" | "lesson" | "quote" | "registration";

export type AppointmentPriority = "low" | "normal" | "high" | "urgent";

export type KanbanColumnId = "nouveau" | "confirme" | "planifie" | "termine" | "annule" | "relance";

export type NotificationStatus = string;

/** Rendez-vous enrichi tel que renvoyé par l'API (avec libellés résolus). */
export type EnrichedAppointment = {
  id: string;
  leadId?: string | null;
  fullName: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
  formation: string;
  objective: string;
  message?: string | null;
  notes?: string | null;
  date: string;
  time: string;
  requestedAt?: string | null;
  startsAt: string;
  endsAt: string;
  type: AppointmentType;
  status: AppointmentStatus;
  priority: AppointmentPriority;
  source: AppointmentSource;
  assignedToId?: string | null;
  studentId?: string | null;
  formationId?: string | null;
  instructorId?: string | null;
  vehicleId?: string | null;
  agencyId?: string | null;
  consentContact: boolean;
  consentWhatsApp: boolean;
  whatsappMessage?: string | null;
  adminEmailStatus?: NotificationStatus | null;
  clientEmailStatus?: NotificationStatus | null;
  whatsappStatus?: NotificationStatus | null;
  createdAt: string;
  updatedAt: string;
  // Libellés résolus
  kanbanColumn: KanbanColumnId;
  color: string;
  instructorName?: string | null;
  advisorName?: string | null;
  studentName?: string | null;
  formationLabel?: string | null;
  agencyName?: string | null;
  vehicleLabel?: string | null;
};

export type AppointmentTask = {
  id: string;
  leadId?: string | null;
  appointmentId?: string | null;
  type: string;
  priority: string;
  deadline: string;
  note: string;
  status: string;
};

export type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type Conversation = {
  id: string;
  leadId?: string | null;
  appointmentId?: string | null;
  messages: ConversationMessage[];
  updatedAt: string;
};

export type AppointmentLead = {
  id: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  interest?: string | null;
  status: string;
  temperature?: string | null;
  createdAt: string;
};

export type HistoryEntry = {
  id: string;
  action: string;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
  userId?: string | null;
};

/** Référentiels pour peupler les sélecteurs des formulaires. */
export type AppointmentRefs = {
  instructors: { id: string; name: string; agencyId?: string | null }[];
  advisors: { id: string; name: string; role?: string | null }[];
  formations: { id: string; title: string }[];
  students: { id: string; name: string }[];
  agencies: { id: string; name: string }[];
  vehicles: { id: string; label: string; instructorId?: string | null }[];
};

export type AppointmentCounts = Partial<Record<KanbanColumnId, number>>;

export type ListResponse = {
  appointments: EnrichedAppointment[];
  tasks: AppointmentTask[];
  conversations: Conversation[];
  leads: AppointmentLead[];
  refs: AppointmentRefs;
  counts: AppointmentCounts;
  total: number;
};

export type KanbanColumn = {
  id: KanbanColumnId;
  label: string;
  dropStatus: AppointmentStatus;
  cards: EnrichedAppointment[];
};

export type KanbanResponse = {
  columns: KanbanColumn[];
  refs: AppointmentRefs;
};

export type CalendarEvent = {
  id: string;
  refId: string;
  kind: "appointment" | "lesson";
  title: string;
  startsAt: string;
  endsAt: string;
  status: string;
  source: string;
  type: string;
  color: string;
  instructorId?: string | null;
  instructorName?: string | null;
  advisorName?: string | null;
  agencyId?: string | null;
  formationLabel?: string | null;
};

export type CalendarResponse = {
  events: CalendarEvent[];
  range: { from: string; to: string };
};

export type AppointmentDetail = {
  appointment: EnrichedAppointment;
  lead?: AppointmentLead | null;
  tasks: AppointmentTask[];
  conversations: Conversation[];
  history: HistoryEntry[];
};

/** Filtres partagés entre les vues. */
export type RdvFilters = {
  q: string;
  source: string;
  status: string;
  type: string;
  formationId: string;
  assignedToId: string;
  instructorId: string;
  agencyId: string;
  from: string;
  to: string;
};

export const EMPTY_FILTERS: RdvFilters = {
  q: "",
  source: "",
  status: "",
  type: "",
  formationId: "",
  assignedToId: "",
  instructorId: "",
  agencyId: "",
  from: "",
  to: ""
};

/** Corps de création / édition d'un rendez-vous. */
export type AppointmentFormPayload = {
  source: AppointmentSource;
  type: AppointmentType;
  status?: AppointmentStatus;
  priority: AppointmentPriority;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  formation: string;
  objective: string;
  message?: string;
  notes?: string;
  startsAt: string;
  endsAt: string;
  leadId?: string;
  studentId?: string;
  formationId?: string;
  instructorId?: string;
  vehicleId?: string;
  agencyId?: string;
  assignedToId?: string;
  consentContact: boolean;
  consentWhatsApp: boolean;
  notify?: boolean;
};
