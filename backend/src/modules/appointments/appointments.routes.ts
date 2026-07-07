import { Router } from "express";
import { z } from "zod";
import type { ApiConfig } from "../../config/env";
import type { AuthenticatedRequest } from "../../http/request-context";
import { assertAgencyAccess, authenticate, requirePermission, resolveScopedAgencyId } from "../../middleware/auth";
import type { LodenRepository } from "../../repositories/loden-repository";
import type { BookingRecord, ChatAppointmentRecord } from "../../domain/types";
import { asyncHandler } from "../../shared/async-handler";
import { badRequest, conflict, notFound } from "../../shared/http-error";
import bcrypt from "bcryptjs";
import { generateTempPassword } from "../../shared/password";
import { attributePartnerOnConversion } from "../partners/attribution";
import { emailSchema, validateBody, validateQuery } from "../../shared/validation";
import { sendChatAppointmentAdminAlert, sendChatAppointmentClientConfirmation } from "../../shared/mailer";
import { buildWhatsAppAppointmentText, buildWhatsAppUrl, sendWhatsAppMessage } from "../../shared/whatsapp";
import {
  ACTIVE_STATUSES_FOR_CONFLICT,
  KANBAN_COLUMNS,
  appointmentPrioritySchema,
  appointmentSourceSchema,
  appointmentStatusSchema,
  appointmentTypeSchema,
  canonicalSource,
  kanbanColumnForStatus,
  statusColor
} from "./appointments.vocab";

// ---------------------------------------------------------------------------
// Schémas de validation
// ---------------------------------------------------------------------------

const isoDate = z.coerce.date();

const listQuerySchema = z.object({
  status: appointmentStatusSchema.optional(),
  source: appointmentSourceSchema.optional(),
  type: appointmentTypeSchema.optional(),
  formationId: z.string().trim().optional(),
  instructorId: z.string().trim().optional(),
  assignedToId: z.string().trim().optional(),
  agencyId: z.string().trim().optional(),
  from: isoDate.optional(),
  to: isoDate.optional(),
  q: z.string().trim().max(120).optional()
});

const calendarQuerySchema = z.object({
  from: isoDate.optional(),
  to: isoDate.optional(),
  instructorId: z.string().trim().optional(),
  agencyId: z.string().trim().optional(),
  formationId: z.string().trim().optional(),
  source: appointmentSourceSchema.optional(),
  status: appointmentStatusSchema.optional(),
  includeLessons: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((value) => value !== "false")
});

const createSchema = z.object({
  source: appointmentSourceSchema.default("manual"),
  type: appointmentTypeSchema.default("call"),
  status: appointmentStatusSchema.optional(),
  priority: appointmentPrioritySchema.default("normal"),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(4).max(30),
  email: emailSchema.optional(),
  formation: z.string().trim().max(160).default(""),
  objective: z.string().trim().max(200).default(""),
  message: z.string().trim().max(2000).optional(),
  notes: z.string().trim().max(2000).optional(),
  startsAt: isoDate,
  endsAt: isoDate,
  requestedAt: isoDate.optional(),
  leadId: z.string().trim().optional(),
  studentId: z.string().trim().optional(),
  formationId: z.string().trim().optional(),
  instructorId: z.string().trim().optional(),
  vehicleId: z.string().trim().optional(),
  agencyId: z.string().trim().optional(),
  assignedToId: z.string().trim().optional(),
  consentContact: z.boolean().default(true),
  consentWhatsApp: z.boolean().default(false),
  notify: z.boolean().default(false)
});

const updateSchema = z.object({
  type: appointmentTypeSchema.optional(),
  priority: appointmentPrioritySchema.optional(),
  source: appointmentSourceSchema.optional(),
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(100).optional(),
  phone: z.string().trim().min(4).max(30).optional(),
  email: emailSchema.optional(),
  formation: z.string().trim().max(160).optional(),
  objective: z.string().trim().max(200).optional(),
  message: z.string().trim().max(2000).nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
  startsAt: isoDate.optional(),
  endsAt: isoDate.optional(),
  studentId: z.string().trim().nullable().optional(),
  formationId: z.string().trim().nullable().optional(),
  instructorId: z.string().trim().nullable().optional(),
  vehicleId: z.string().trim().nullable().optional(),
  agencyId: z.string().trim().nullable().optional(),
  assignedToId: z.string().trim().nullable().optional()
});

const statusSchema = z.object({ status: appointmentStatusSchema, notify: z.boolean().default(false) });
const assignSchema = z.object({
  assignedToId: z.string().trim().nullable().optional(),
  instructorId: z.string().trim().nullable().optional(),
  vehicleId: z.string().trim().nullable().optional()
});
const rescheduleSchema = z.object({ startsAt: isoDate, endsAt: isoDate, force: z.boolean().default(false) });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Refs = {
  instructors: Awaited<ReturnType<LodenRepository["listInstructors"]>>;
  users: Awaited<ReturnType<LodenRepository["listUsers"]>>;
  formations: Awaited<ReturnType<LodenRepository["listFormations"]>>;
  students: Awaited<ReturnType<LodenRepository["listStudents"]>>;
  agencies: Awaited<ReturnType<LodenRepository["listAgencies"]>>;
  vehicles: Awaited<ReturnType<LodenRepository["listVehicles"]>>;
};

async function buildRefs(repository: LodenRepository): Promise<Refs> {
  const [instructors, users, formations, students, agencies, vehicles] = await Promise.all([
    repository.listInstructors(),
    repository.listUsers(),
    repository.listFormations(true),
    repository.listStudents(),
    repository.listAgencies(),
    repository.listVehicles()
  ]);
  return { instructors, users, formations, students, agencies, vehicles };
}

function userName(users: Refs["users"], userId?: string | null) {
  const user = userId ? users.find((u) => u.id === userId) : null;
  return user ? `${user.firstName} ${user.lastName}`.trim() : null;
}

function studentName(refs: Refs, studentId?: string | null) {
  const student = studentId ? refs.students.find((s) => s.id === studentId) : null;
  return student ? userName(refs.users, student.userId) : null;
}

function enrichAppointment(appointment: ChatAppointmentRecord, refs: Refs) {
  const instructor = appointment.instructorId ? refs.instructors.find((i) => i.id === appointment.instructorId) : null;
  const formation = appointment.formationId ? refs.formations.find((f) => f.id === appointment.formationId) : null;
  const agency = appointment.agencyId ? refs.agencies.find((a) => a.id === appointment.agencyId) : null;
  const vehicle = appointment.vehicleId ? refs.vehicles.find((v) => v.id === appointment.vehicleId) : null;
  return {
    ...appointment,
    // Normalise la source vers le vocabulaire canonique : les RDV créés par l'agent IA
    // portent des sources granulaires ("assistant-ia-devis"…) que le front ne sait pas
    // afficher (icône/libellé introuvable → plantage du volet détail). On ramène à canonique.
    source: canonicalSource(appointment.source),
    kanbanColumn: kanbanColumnForStatus(appointment.status),
    color: statusColor(appointment.status),
    instructorName: instructor?.name ?? null,
    advisorName: userName(refs.users, appointment.assignedToId),
    studentName: studentName(refs, appointment.studentId),
    formationLabel: formation?.title ?? appointment.formation ?? null,
    agencyName: agency?.name ?? null,
    vehicleLabel: vehicle?.label ?? null
  };
}

// Refs allégées pour les sélecteurs du cockpit (création/édition de RDV).
function lightRefs(refs: Refs) {
  return {
    instructors: refs.instructors.map((i) => ({ id: i.id, name: i.name, agencyId: i.agencyId ?? null })),
    advisors: refs.users
      .filter((u) => u.role !== "ELEVE" && u.role !== "VISITEUR")
      .map((u) => ({ id: u.id, name: `${u.firstName} ${u.lastName}`.trim(), role: u.role })),
    formations: refs.formations.map((f) => ({ id: f.id, title: f.title })),
    students: refs.students.map((s) => ({ id: s.id, name: userName(refs.users, s.userId) ?? "Élève" })),
    agencies: refs.agencies.map((a) => ({ id: a.id, name: a.name })),
    vehicles: refs.vehicles.map((v) => ({ id: v.id, label: v.label, instructorId: v.instructorId ?? null }))
  };
}

function overlaps(startsAt: Date, endsAt: Date, otherStart: Date, otherEnd: Date) {
  return startsAt < otherEnd && endsAt > otherStart;
}

// Détection de conflit : moniteur (RDV + leçons), conseiller (RDV). Retourne un motif ou null.
async function findConflict(
  repository: LodenRepository,
  params: { instructorId?: string | null; assignedToId?: string | null; startsAt: Date; endsAt: Date; ignoreId?: string }
): Promise<string | null> {
  const { instructorId, assignedToId, startsAt, endsAt, ignoreId } = params;
  if (endsAt <= startsAt) return "Le créneau est invalide (fin avant début).";

  const all = await repository.listChatAppointments({});
  const active = (a: ChatAppointmentRecord) =>
    a.id !== ignoreId &&
    (ACTIVE_STATUSES_FOR_CONFLICT as readonly string[]).includes(a.status) &&
    overlaps(startsAt, endsAt, a.startsAt, a.endsAt);

  if (instructorId && all.some((a) => a.instructorId === instructorId && active(a))) {
    return "Le moniteur a déjà un rendez-vous sur ce créneau.";
  }
  if (assignedToId && all.some((a) => a.assignedToId === assignedToId && active(a))) {
    return "Le conseiller a déjà un rendez-vous sur ce créneau.";
  }
  if (instructorId && (await repository.hasInstructorConflict(instructorId, startsAt, endsAt))) {
    return "Le moniteur a déjà une leçon planifiée sur ce créneau.";
  }
  return null;
}

type CalendarEvent = {
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
  instructorId: string | null;
  instructorName: string | null;
  advisorName: string | null;
  agencyId: string | null;
  formationLabel: string | null;
};

function bookingEvent(booking: BookingRecord, refs: Refs): CalendarEvent {
  const statusMap: Record<string, string> = {
    EN_ATTENTE: "pending_confirmation",
    CONFIRMEE: "confirmed",
    TERMINEE: "completed",
    ANNULEE: "cancelled",
    ABSENT: "no_show"
  };
  const canonical = statusMap[booking.status] ?? "scheduled";
  const instructor = refs.instructors.find((i) => i.id === booking.instructorId);
  const formation = refs.formations.find((f) => f.id === booking.formationId);
  return {
    id: `lesson-${booking.id}`,
    refId: booking.id,
    kind: "lesson" as const,
    title: `Leçon — ${studentName(refs, booking.studentId) ?? "Élève"}`,
    startsAt: booking.startsAt.toISOString(),
    endsAt: booking.endsAt.toISOString(),
    status: canonical,
    source: "crm",
    type: "lesson",
    color: statusColor(canonical),
    instructorId: booking.instructorId,
    instructorName: instructor?.name ?? null,
    advisorName: null,
    agencyId: booking.agencyId ?? null,
    formationLabel: formation?.title ?? null
  };
}

function appointmentEvent(appointment: ChatAppointmentRecord, refs: Refs): CalendarEvent {
  const enriched = enrichAppointment(appointment, refs);
  return {
    id: `appt-${appointment.id}`,
    refId: appointment.id,
    kind: "appointment" as const,
    title: `${appointment.fullName} — ${enriched.formationLabel ?? appointment.objective ?? "RDV"}`,
    startsAt: appointment.startsAt.toISOString(),
    endsAt: appointment.endsAt.toISOString(),
    status: appointment.status,
    source: enriched.source,
    type: appointment.type,
    // Source chatbot mise en avant en violet (cf. cahier des charges), sinon couleur par statut.
    color: enriched.source === "chatbot" ? "#7c3aed" : enriched.color,
    instructorId: appointment.instructorId ?? null,
    instructorName: enriched.instructorName,
    advisorName: enriched.advisorName,
    agencyId: appointment.agencyId ?? null,
    formationLabel: enriched.formationLabel
  };
}

async function appointmentDetail(repository: LodenRepository, appointment: ChatAppointmentRecord, refs: Refs) {
  const [tasks, conversations, history, leads] = await Promise.all([
    repository.listChatTasks({ appointmentId: appointment.id }),
    repository.listChatConversations({ appointmentId: appointment.id }),
    repository.listAuditLogsForEntity("Appointment", appointment.id, 100),
    appointment.leadId ? repository.listLeads() : Promise.resolve([])
  ]);
  const lead = appointment.leadId ? leads.find((l) => l.id === appointment.leadId) ?? null : null;
  return {
    appointment: enrichAppointment(appointment, refs),
    lead,
    tasks,
    conversations,
    history
  };
}

function buildEmailInput(appointment: ChatAppointmentRecord) {
  return {
    leadId: appointment.leadId,
    appointmentId: appointment.id,
    fullName: appointment.fullName,
    firstName: appointment.firstName,
    phone: appointment.phone,
    email: appointment.email,
    formation: appointment.formation,
    date: appointment.date,
    time: appointment.time,
    message: appointment.message
  };
}

function displayDate(date: Date) {
  return date.toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long" });
}
function displayTime(date: Date) {
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export function createAppointmentsAdminRouter(repository: LodenRepository, config: ApiConfig) {
  const router = Router();
  router.use(authenticate(repository, config.JWT_SECRET));

  // --- Vue calendrier (RDV + leçons agrégés) -------------------------------
  router.get(
    "/calendar",
    requirePermission("leads.read"),
    asyncHandler(async (req, res) => {
      const query = validateQuery(calendarQuerySchema, req);
      const agencyId = await resolveScopedAgencyId(repository, req as AuthenticatedRequest, query.agencyId);
      const from = query.from ?? new Date(Date.now() - 7 * 24 * 60 * 60_000);
      const to = query.to ?? new Date(Date.now() + 60 * 24 * 60 * 60_000);
      const refs = await buildRefs(repository);

      const appointments = await repository.listChatAppointments({
        from,
        to,
        agencyId,
        instructorId: query.instructorId,
        source: query.source,
        status: query.status
      });
      let events = appointments
        .filter((a) => (!query.formationId || a.formationId === query.formationId))
        .map((a) => appointmentEvent(a, refs));

      if (query.includeLessons && !query.source) {
        const bookings = await repository.listBookings({ agencyId, instructorId: query.instructorId });
        const lessonEvents = bookings
          .filter((b) => b.startsAt >= from && b.startsAt <= to)
          .filter((b) => (!query.formationId || b.formationId === query.formationId))
          .map((b) => bookingEvent(b, refs));
        events = [...events, ...lessonEvents];
      }

      events.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
      res.json({ data: { events, range: { from: from.toISOString(), to: to.toISOString() } } });
    })
  );

  // --- Vue Kanban ----------------------------------------------------------
  router.get(
    "/kanban",
    requirePermission("leads.read"),
    asyncHandler(async (req, res) => {
      const query = validateQuery(listQuerySchema, req);
      const agencyId = await resolveScopedAgencyId(repository, req as AuthenticatedRequest, query.agencyId);
      const refs = await buildRefs(repository);
      const appointments = await repository.listChatAppointments({
        source: query.source,
        agencyId,
        instructorId: query.instructorId,
        assignedToId: query.assignedToId
      });
      const enriched = appointments.map((a) => enrichAppointment(a, refs));
      const columns = KANBAN_COLUMNS.map((col) => ({
        id: col.id,
        label: col.label,
        dropStatus: col.dropStatus,
        cards: enriched.filter((a) => (col.statuses as readonly string[]).includes(a.status))
      }));
      res.json({ data: { columns, refs: lightRefs(refs) } });
    })
  );

  // --- Disponibilités (créneaux chatbot + occupation moniteur) -------------
  router.get(
    "/availability",
    requirePermission("leads.read"),
    asyncHandler(async (req, res) => {
      const query = validateQuery(calendarQuerySchema, req);
      const agencyId = await resolveScopedAgencyId(repository, req as AuthenticatedRequest, query.agencyId);
      const from = query.from ?? new Date();
      const to = query.to ?? new Date(Date.now() + 30 * 24 * 60 * 60_000);
      const [slots, availabilities] = await Promise.all([
        repository.listChatAvailabilitySlots({ from, to, active: true, agencyId }),
        repository.listAvailabilities(query.instructorId)
      ]);
      res.json({
        data: {
          slots: slots.map((s) => ({
            id: s.id,
            label: s.label,
            startsAt: s.startsAt.toISOString(),
            endsAt: s.endsAt.toISOString(),
            type: s.type,
            remaining: Math.max(0, s.capacity - s.bookedCount)
          })),
          instructorAvailabilities: availabilities
            .filter((a) => a.startsAt >= from && a.startsAt <= to)
            .map((a) => ({ id: a.id, instructorId: a.instructorId, startsAt: a.startsAt.toISOString(), endsAt: a.endsAt.toISOString(), isAvailable: a.isAvailable }))
        }
      });
    })
  );

  // --- Liste (table) + données pour les sélecteurs -------------------------
  router.get(
    "/",
    requirePermission("leads.read"),
    asyncHandler(async (req, res) => {
      const query = validateQuery(listQuerySchema, req);
      const agencyId = await resolveScopedAgencyId(repository, req as AuthenticatedRequest, query.agencyId);
      const refs = await buildRefs(repository);
      let appointments = await repository.listChatAppointments({
        status: query.status,
        source: query.source,
        agencyId,
        instructorId: query.instructorId,
        assignedToId: query.assignedToId,
        from: query.from,
        to: query.to
      });
      if (query.type) appointments = appointments.filter((a) => a.type === query.type);
      if (query.formationId) appointments = appointments.filter((a) => a.formationId === query.formationId);
      if (query.q) {
        const needle = query.q.toLowerCase();
        appointments = appointments.filter((a) =>
          [a.fullName, a.phone, a.email, a.formation, a.objective, a.notes]
            .filter(Boolean)
            .some((field) => String(field).toLowerCase().includes(needle))
        );
      }
      const enriched = appointments.map((a) => enrichAppointment(a, refs));

      // Données complémentaires (compatibilité demandes-chatbot + cockpit).
      const [tasks, conversations, leads] = await Promise.all([
        repository.listChatTasks(),
        repository.listChatConversations(),
        repository.listLeads()
      ]);
      const counts: Record<string, number> = {};
      for (const col of KANBAN_COLUMNS) counts[col.id] = enriched.filter((a) => a.kanbanColumn === col.id).length;

      res.json({
        data: {
          appointments: enriched,
          tasks,
          conversations,
          leads,
          refs: lightRefs(refs),
          counts,
          total: enriched.length
        }
      });
    })
  );

  // --- Détail --------------------------------------------------------------
  router.get(
    "/:id",
    requirePermission("leads.read"),
    asyncHandler(async (req, res) => {
      const appointment = await repository.findChatAppointmentById(String(req.params.id));
      if (!appointment) throw notFound("Rendez-vous introuvable");
      await assertAgencyAccess(repository, req as AuthenticatedRequest, appointment.agencyId);
      const refs = await buildRefs(repository);
      res.json({ data: await appointmentDetail(repository, appointment, refs) });
    })
  );

  // --- Création manuelle (source par défaut = manual) ----------------------
  router.post(
    "/",
    requirePermission("leads.manage"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const body = validateBody(createSchema, req);
      if (body.endsAt <= body.startsAt) throw badRequest("La fin du rendez-vous doit être après le début.");

      // Conflit (sauf RDV non bloquants : on vérifie dès qu'il y a un moniteur/conseiller).
      const conflictReason = await findConflict(repository, {
        instructorId: body.instructorId,
        assignedToId: body.assignedToId,
        startsAt: body.startsAt,
        endsAt: body.endsAt
      });
      if (conflictReason) throw conflict(conflictReason);

      const name = `${body.firstName} ${body.lastName}`.replace(/\s+/g, " ").trim();

      // Lead : réutilise celui fourni ; sinon déduplique par email (évite les doublons)
      // avant d'en créer un (source unique de vérité côté prospects).
      let leadId = body.leadId;
      if (!leadId) {
        const existing = body.email ? await repository.findLeadByEmail(body.email) : null;
        if (existing) {
          leadId = existing.id;
        } else {
          const lead = await repository.createLead({
            fullName: name,
            email: body.email ?? "",
            phone: body.phone,
            status: "PROSPECT",
            source: body.source,
            interest: body.formation || undefined,
            notes: body.message
          });
          leadId = lead.id;
        }
      }

      const whatsappMessage = buildWhatsAppAppointmentText({
        formation: body.formation || "votre rendez-vous",
        date: displayDate(body.startsAt),
        time: displayTime(body.startsAt),
        fullName: name
      });

      const appointment = await repository.createChatAppointment({
        leadId,
        fullName: name,
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone,
        email: body.email,
        formation: body.formation,
        objective: body.objective,
        message: body.message,
        notes: body.notes,
        date: displayDate(body.startsAt),
        time: displayTime(body.startsAt),
        requestedAt: body.requestedAt ?? new Date(),
        startsAt: body.startsAt,
        endsAt: body.endsAt,
        type: body.type,
        status: body.status ?? "confirmed",
        priority: body.priority,
        source: body.source,
        assignedToId: body.assignedToId,
        studentId: body.studentId,
        formationId: body.formationId,
        instructorId: body.instructorId,
        vehicleId: body.vehicleId,
        agencyId: body.agencyId,
        createdById: req.user?.id ?? null,
        consentContact: body.consentContact,
        consentWhatsApp: body.consentWhatsApp,
        whatsappMessage
      });

      if (body.notify) {
        const emailInput = buildEmailInput(appointment);
        const [adminEmailStatus, clientEmailStatus, whatsappStatus] = await Promise.all([
          sendChatAppointmentAdminAlert(config, emailInput),
          appointment.email ? sendChatAppointmentClientConfirmation(config, emailInput) : Promise.resolve("skipped" as const),
          sendWhatsAppMessage(config, { to: body.phone, text: whatsappMessage, consent: body.consentWhatsApp })
        ]);
        await repository.updateChatAppointment(appointment.id, { adminEmailStatus, clientEmailStatus, whatsappStatus });
      }

      await repository.createAuditLog({
        userId: req.user?.id ?? null,
        action: "appointment.created",
        entityType: "Appointment",
        entityId: appointment.id,
        metadata: { source: body.source, type: body.type, status: appointment.status }
      });

      const refs = await buildRefs(repository);
      res.status(201).json({ data: enrichAppointment(await repository.findChatAppointmentById(appointment.id) ?? appointment, refs) });
    })
  );

  // --- Mise à jour complète ------------------------------------------------
  router.put(
    "/:id",
    requirePermission("leads.manage"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const id = String(req.params.id);
      const existing = await repository.findChatAppointmentById(id);
      if (!existing) throw notFound("Rendez-vous introuvable");
      await assertAgencyAccess(repository, req as AuthenticatedRequest, existing.agencyId);
      const body = validateBody(updateSchema, req);

      const startsAt = body.startsAt ?? existing.startsAt;
      const endsAt = body.endsAt ?? existing.endsAt;
      const instructorId = body.instructorId === undefined ? existing.instructorId : body.instructorId;
      const assignedToId = body.assignedToId === undefined ? existing.assignedToId : body.assignedToId;
      if (body.startsAt || body.endsAt || body.instructorId !== undefined || body.assignedToId !== undefined) {
        const conflictReason = await findConflict(repository, { instructorId, assignedToId, startsAt, endsAt, ignoreId: id });
        if (conflictReason) throw conflict(conflictReason);
      }

      const patch = { ...body, updatedById: req.user?.id ?? null } as Parameters<LodenRepository["updateChatAppointment"]>[1];
      if (body.startsAt) {
        patch.date = displayDate(body.startsAt);
        patch.time = displayTime(body.startsAt);
      }
      const updated = await repository.updateChatAppointment(id, patch);
      await repository.createAuditLog({
        userId: req.user?.id ?? null,
        action: "appointment.updated",
        entityType: "Appointment",
        entityId: id,
        metadata: { fields: Object.keys(body) }
      });
      const refs = await buildRefs(repository);
      res.json({ data: enrichAppointment(updated, refs) });
    })
  );

  // --- Changement de statut (drag Kanban) ----------------------------------
  router.patch(
    "/:id/status",
    requirePermission("leads.manage"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const id = String(req.params.id);
      const existing = await repository.findChatAppointmentById(id);
      if (!existing) throw notFound("Rendez-vous introuvable");
      await assertAgencyAccess(repository, req as AuthenticatedRequest, existing.agencyId);
      const body = validateBody(statusSchema, req);

      const updated = await repository.updateChatAppointment(id, { status: body.status, updatedById: req.user?.id ?? null });

      // Confirmation côté client (best-effort) quand on passe en "confirmed".
      let clientEmailStatus = updated.clientEmailStatus;
      if (body.notify && body.status === "confirmed" && updated.email) {
        clientEmailStatus = await sendChatAppointmentClientConfirmation(config, buildEmailInput(updated));
        await repository.updateChatAppointment(id, { clientEmailStatus });
      }

      await repository.createAuditLog({
        userId: req.user?.id ?? null,
        action: "appointment.status",
        entityType: "Appointment",
        entityId: id,
        metadata: { from: existing.status, to: body.status }
      });
      const refs = await buildRefs(repository);
      res.json({ data: enrichAppointment({ ...updated, clientEmailStatus }, refs) });
    })
  );

  // --- Assignation (conseiller / moniteur / véhicule) ----------------------
  router.patch(
    "/:id/assign",
    requirePermission("leads.manage"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const id = String(req.params.id);
      const existing = await repository.findChatAppointmentById(id);
      if (!existing) throw notFound("Rendez-vous introuvable");
      await assertAgencyAccess(repository, req as AuthenticatedRequest, existing.agencyId);
      const body = validateBody(assignSchema, req);

      const instructorId = body.instructorId === undefined ? existing.instructorId : body.instructorId;
      const assignedToId = body.assignedToId === undefined ? existing.assignedToId : body.assignedToId;
      const conflictReason = await findConflict(repository, {
        instructorId,
        assignedToId,
        startsAt: existing.startsAt,
        endsAt: existing.endsAt,
        ignoreId: id
      });
      if (conflictReason) throw conflict(conflictReason);

      const updated = await repository.updateChatAppointment(id, { ...body, updatedById: req.user?.id ?? null });
      await repository.createAuditLog({
        userId: req.user?.id ?? null,
        action: "appointment.assigned",
        entityType: "Appointment",
        entityId: id,
        metadata: { assignedToId: body.assignedToId, instructorId: body.instructorId, vehicleId: body.vehicleId }
      });
      const refs = await buildRefs(repository);
      res.json({ data: enrichAppointment(updated, refs) });
    })
  );

  // --- Replanification (avec vérification de conflit) ----------------------
  router.patch(
    "/:id/reschedule",
    requirePermission("leads.manage"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const id = String(req.params.id);
      const existing = await repository.findChatAppointmentById(id);
      if (!existing) throw notFound("Rendez-vous introuvable");
      await assertAgencyAccess(repository, req as AuthenticatedRequest, existing.agencyId);
      const body = validateBody(rescheduleSchema, req);
      if (body.endsAt <= body.startsAt) throw badRequest("La fin doit être après le début.");

      if (!body.force) {
        const conflictReason = await findConflict(repository, {
          instructorId: existing.instructorId,
          assignedToId: existing.assignedToId,
          startsAt: body.startsAt,
          endsAt: body.endsAt,
          ignoreId: id
        });
        if (conflictReason) throw conflict(conflictReason);
      }

      const updated = await repository.updateChatAppointment(id, {
        startsAt: body.startsAt,
        endsAt: body.endsAt,
        date: displayDate(body.startsAt),
        time: displayTime(body.startsAt),
        updatedById: req.user?.id ?? null
      });
      await repository.createAuditLog({
        userId: req.user?.id ?? null,
        action: "appointment.rescheduled",
        entityType: "Appointment",
        entityId: id,
        metadata: { from: existing.startsAt.toISOString(), to: body.startsAt.toISOString(), forced: body.force }
      });
      const refs = await buildRefs(repository);
      res.json({ data: enrichAppointment(updated, refs) });
    })
  );

  // --- Notifications manuelles (email/whatsapp) ----------------------------
  router.post(
    "/:id/notify",
    requirePermission("leads.manage"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const id = String(req.params.id);
      const appointment = await repository.findChatAppointmentById(id);
      if (!appointment) throw notFound("Rendez-vous introuvable");
      const channel = z.enum(["admin", "client", "whatsapp"]).parse((req.body ?? {}).channel);
      const emailInput = buildEmailInput(appointment);

      if (channel === "admin") {
        const adminEmailStatus = await sendChatAppointmentAdminAlert(config, emailInput);
        const updated = await repository.updateChatAppointment(id, { adminEmailStatus });
        res.json({ data: { status: adminEmailStatus, appointment: updated } });
        return;
      }
      if (channel === "client") {
        if (!appointment.email) throw badRequest("Le rendez-vous n'a pas d'email client.");
        const clientEmailStatus = await sendChatAppointmentClientConfirmation(config, emailInput);
        const updated = await repository.updateChatAppointment(id, { clientEmailStatus });
        res.json({ data: { status: clientEmailStatus, appointment: updated } });
        return;
      }
      const text = appointment.whatsappMessage ?? buildWhatsAppAppointmentText({
        formation: appointment.formation,
        date: appointment.date,
        time: appointment.time,
        fullName: appointment.fullName
      });
      const whatsappStatus = await sendWhatsAppMessage(config, { to: appointment.phone, text, consent: appointment.consentWhatsApp });
      const updated = await repository.updateChatAppointment(id, { whatsappStatus });
      const company = await repository.getCompanyInfo();
      res.json({ data: { status: whatsappStatus, url: buildWhatsAppUrl(config, company.phone, text), appointment: updated } });
    })
  );

  // --- Transformation prospect -> élève ------------------------------------
  router.post(
    "/:id/transform-to-student",
    requirePermission("students.manage"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const id = String(req.params.id);
      const appointment = await repository.findChatAppointmentById(id);
      if (!appointment) throw notFound("Rendez-vous introuvable");
      await assertAgencyAccess(repository, req as AuthenticatedRequest, appointment.agencyId);
      if (appointment.studentId) throw conflict("Ce rendez-vous est déjà lié à un élève.");

      const body = z
        .object({ formationId: z.string().trim().optional(), purchasedHours: z.number().int().min(0).optional() })
        .parse(req.body ?? {});

      // Utilisateur : réutilise l'existant par email, sinon création en ELEVE avec un
      // mot de passe temporaire renvoyé UNE fois (à transmettre à l'élève pour /connexion).
      let temporaryPassword: string | null = null;
      let user = appointment.email ? await repository.findUserByEmail(appointment.email) : null;
      if (!user) {
        temporaryPassword = generateTempPassword();
        const passwordHash = await bcrypt.hash(temporaryPassword, 12);
        user = await repository.createUser({
          firstName: appointment.firstName,
          lastName: appointment.lastName,
          email: appointment.email || `${appointment.phone.replace(/\D/g, "")}@lead.loden.local`,
          phone: appointment.phone,
          role: "ELEVE",
          status: "ACTIVE",
          passwordHash
        });
      }
      // Fiche élève (réutilise l'existante).
      let student = await repository.findStudentByUserId(user.id);
      if (!student) {
        student = await repository.createStudent({
          userId: user.id,
          formationId: body.formationId ?? appointment.formationId ?? null,
          purchasedHours: body.purchasedHours ?? 0,
          agencyId: appointment.agencyId
        });
      }

      // Lien RDV -> élève + lead INSCRIT + tâche administrative + audit.
      const updated = await repository.updateChatAppointment(id, { studentId: student.id, updatedById: req.user?.id ?? null });
      if (appointment.leadId) {
        await repository.updateLead(appointment.leadId, { status: "INSCRIT" }).catch(() => undefined);
        // Attribution partenaire : rattache l'élève + commission ESTIMEE si lead apporté.
        const lead = await repository.findLeadById(appointment.leadId).catch(() => null);
        await attributePartnerOnConversion(repository, lead, student);
      }
      const task = await repository.createChatTask({
        leadId: appointment.leadId,
        appointmentId: appointment.id,
        type: "RELANCE",
        priority: "NORMALE",
        assignedToId: appointment.assignedToId,
        deadline: new Date(Date.now() + 48 * 60 * 60_000),
        note: `Compléter le dossier élève de ${appointment.fullName} (transformé depuis un RDV ${appointment.source}).`
      });
      await repository.createAuditLog({
        userId: req.user?.id ?? null,
        action: "appointment.transformed_to_student",
        entityType: "Appointment",
        entityId: id,
        metadata: { studentId: student.id, userId: user.id, leadId: appointment.leadId }
      });

      const refs = await buildRefs(repository);
      res.status(201).json({ data: { appointment: enrichAppointment(updated, refs), student, user: { id: user.id, email: user.email }, task, temporaryPassword } });
    })
  );

  // --- Suppression ---------------------------------------------------------
  router.delete(
    "/:id",
    requirePermission("leads.manage"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const id = String(req.params.id);
      const existing = await repository.findChatAppointmentById(id);
      if (!existing) throw notFound("Rendez-vous introuvable");
      await assertAgencyAccess(repository, req as AuthenticatedRequest, existing.agencyId);
      await repository.deleteChatAppointment(id);
      await repository.createAuditLog({
        userId: req.user?.id ?? null,
        action: "appointment.deleted",
        entityType: "Appointment",
        entityId: id,
        metadata: { source: existing.source }
      });
      res.json({ data: { id, deleted: true } });
    })
  );

  return router;
}
