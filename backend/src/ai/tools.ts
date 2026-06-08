import { z } from "zod";
import type { ApiConfig } from "../config/env";
import type { Permission } from "../domain/permissions";
import type { LodenRepository } from "../repositories/loden-repository";
import { notifyNewLead, sendEmail } from "../shared/mailer";
import { sendSms } from "../shared/sms";
import { qualifyLead } from "./qualify";
import type { AiProvider, AiTool } from "./types";

function euros(cents: number) {
  return `${Math.round(cents / 100)} €`;
}

export type ToolContext = {
  repository: LodenRepository;
  config: ApiConfig;
  scope: "public" | "crm";
  actorUserId?: string | null;
  aiProvider?: AiProvider;
};

export type ToolEntry = {
  def: AiTool;
  /** Permission requise pour exposer/exécuter cet outil (côté CRM). */
  permission?: Permission;
  handler: (args: Record<string, unknown>, ctx: ToolContext) => Promise<unknown>;
};

const leadArgs = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().max(40).optional(),
  interest: z.string().trim().max(200).optional(),
  message: z.string().trim().max(1000).optional()
});

const appointmentArgs = leadArgs.extend({
  desiredDate: z.string().trim().max(120).optional(),
  agency: z.string().trim().max(120).optional(),
  formation: z.string().trim().max(160).optional()
});

/**
 * Outils de l'agent PUBLIC : lecture de données publiques + création de
 * prospect / demande de RDV. AUCUN outil ne lit de données sensibles
 * (dossiers élèves, finances, autres clients) → sécurité par capacités :
 * même en cas de prompt-injection, l'agent public ne PEUT pas y accéder.
 */
export const publicTools: ToolEntry[] = [
  {
    def: {
      type: "function",
      function: {
        name: "get_formations",
        description: "Liste les formations au permis proposées par LODEN (titre, type de boîte, durée, prix indicatif, éligibilité CPF).",
        parameters: { type: "object", properties: {}, additionalProperties: false }
      }
    },
    handler: async (_args, ctx) => {
      const formations = await ctx.repository.listFormations();
      return formations.map((f) => ({ titre: f.title, type: f.mode, duree: f.durationLabel, prix: `dès ${euros(f.priceCents)}`, cpf: f.cpfEligible }));
    }
  },
  {
    def: {
      type: "function",
      function: {
        name: "get_prices",
        description: "Liste les packs et tarifs publics validés de LODEN.",
        parameters: { type: "object", properties: {}, additionalProperties: false }
      }
    },
    handler: async (_args, ctx) => {
      const plans = await ctx.repository.listPricingPlans();
      return plans.map((p) => ({ titre: p.title, prix: `dès ${euros(p.priceCents)}`, inclus: p.features.slice(0, 4) }));
    }
  },
  {
    def: {
      type: "function",
      function: {
        name: "get_agencies",
        description: "Liste les agences LODEN (nom et adresse publique).",
        parameters: { type: "object", properties: {}, additionalProperties: false }
      }
    },
    handler: async (_args, ctx) => {
      const agencies = await ctx.repository.listAgencies();
      return agencies.map((a) => ({ nom: a.name, adresse: a.address ?? undefined }));
    }
  },
  {
    def: {
      type: "function",
      function: {
        name: "get_available_slots",
        description: "Donne des créneaux indicatifs de disponibilité des moniteurs. Ces créneaux ne sont pas définitifs tant qu'un conseiller ne les a pas confirmés.",
        parameters: { type: "object", properties: {}, additionalProperties: false }
      }
    },
    handler: async (_args, ctx) => {
      const [availabilities, instructors] = await Promise.all([ctx.repository.listAvailabilities(), ctx.repository.listInstructors()]);
      const nameById = new Map(instructors.map((i) => [i.id, i.name]));
      return availabilities.slice(0, 8).map((a) => ({ moniteur: nameById.get(a.instructorId) ?? "Moniteur LODEN", debut: a.startsAt.toISOString(), fin: a.endsAt.toISOString() }));
    }
  },
  {
    def: {
      type: "function",
      function: {
        name: "create_lead",
        description: "Enregistre un prospect dans le CRM (à utiliser après avoir recueilli au moins le nom et l'email avec l'accord de la personne).",
        parameters: {
          type: "object",
          properties: {
            fullName: { type: "string", description: "Nom complet" },
            email: { type: "string", description: "Email" },
            phone: { type: "string", description: "Téléphone (optionnel)" },
            interest: { type: "string", description: "Besoin / formation visée" },
            message: { type: "string", description: "Précisions" }
          },
          required: ["fullName", "email"],
          additionalProperties: false
        }
      }
    },
    handler: async (args, ctx) => {
      const parsed = leadArgs.safeParse(args);
      if (!parsed.success) return { ok: false, error: "Nom et email valides requis." };
      const lead = await ctx.repository.createLead({
        fullName: parsed.data.fullName,
        email: parsed.data.email,
        phone: parsed.data.phone,
        source: "assistant-ia",
        interest: parsed.data.interest,
        notes: parsed.data.message,
        status: "PROSPECT"
      });
      void notifyNewLead(ctx.config, lead);
      void qualifyLead(ctx.aiProvider, ctx.repository, lead);
      await ctx.repository.createAuditLog({ action: "ai.create_lead", entityType: "Lead", entityId: lead.id, metadata: { source: "assistant-ia" }, userId: ctx.actorUserId ?? null });
      return { ok: true, message: "Prospect enregistré. Un conseiller pourra recontacter." };
    }
  },
  {
    def: {
      type: "function",
      function: {
        name: "request_appointment",
        description: "Enregistre une DEMANDE de rendez-vous (pas une réservation définitive) et envoie une confirmation de réception. Un conseiller confirmera le créneau réel.",
        parameters: {
          type: "object",
          properties: {
            fullName: { type: "string" },
            email: { type: "string" },
            phone: { type: "string" },
            desiredDate: { type: "string", description: "Créneau souhaité décrit par la personne" },
            agency: { type: "string" },
            formation: { type: "string" },
            message: { type: "string" }
          },
          required: ["fullName", "email"],
          additionalProperties: false
        }
      }
    },
    handler: async (args, ctx) => {
      const parsed = appointmentArgs.safeParse(args);
      if (!parsed.success) return { ok: false, error: "Nom et email valides requis pour la demande de rendez-vous." };
      const d = parsed.data;
      const notes = [d.message, d.desiredDate ? `Créneau souhaité: ${d.desiredDate}` : null, d.agency ? `Agence: ${d.agency}` : null, d.formation ? `Formation: ${d.formation}` : null]
        .filter(Boolean)
        .join(" | ");
      const lead = await ctx.repository.createLead({
        fullName: d.fullName,
        email: d.email,
        phone: d.phone,
        source: "assistant-ia-rdv",
        interest: "RENDEZ-VOUS",
        notes,
        status: "PROSPECT"
      });
      void notifyNewLead(ctx.config, lead);
      void sendEmail(ctx.config, {
        to: d.email,
        subject: "Votre demande de rendez-vous — LODEN Auto-École",
        text: `Bonjour ${d.fullName},\n\nNous avons bien reçu votre demande de rendez-vous${d.desiredDate ? ` (${d.desiredDate})` : ""}. Un conseiller LODEN va confirmer le créneau rapidement.\n\nÀ très vite,\nL'équipe LODEN`
      });
      if (d.phone) void sendSms(ctx.config, d.phone, `LODEN : votre demande de RDV est bien reçue${d.desiredDate ? ` (${d.desiredDate})` : ""}. Un conseiller confirmera le créneau.`);
      void qualifyLead(ctx.aiProvider, ctx.repository, lead);
      await ctx.repository.createAuditLog({ action: "ai.request_appointment", entityType: "Lead", entityId: lead.id, metadata: { desiredDate: d.desiredDate ?? null }, userId: ctx.actorUserId ?? null });
      return { ok: true, message: "Demande de rendez-vous enregistrée. Un conseiller confirmera le créneau (rien n'est définitif avant sa confirmation)." };
    }
  }
];

// --- Outils CRM (équipe authentifiée), chacun gardé par une permission ---

const findStudentTool: ToolEntry = {
  permission: "students.read",
  def: {
    type: "function",
    function: {
      name: "find_student",
      description: "Recherche un élève par nom ou email. Retourne son id, son nom, son email et sa formation.",
      parameters: {
        type: "object",
        properties: { query: { type: "string", description: "Nom ou email de l'élève" } },
        required: ["query"],
        additionalProperties: false
      }
    }
  },
  handler: async (args, ctx) => {
    const query = String(args.query ?? "").trim().toLowerCase();
    if (!query) return { error: "Requête vide." };
    const [students, users] = await Promise.all([ctx.repository.listStudents(), ctx.repository.listUsers()]);
    const userById = new Map(users.map((u) => [u.id, u]));
    return students
      .map((s) => ({ student: s, user: userById.get(s.userId) }))
      .filter(({ user }) => {
        const haystack = `${user?.firstName ?? ""} ${user?.lastName ?? ""} ${user?.email ?? ""}`.toLowerCase();
        return haystack.includes(query);
      })
      .slice(0, 5)
      .map(({ student, user }) => ({
        studentId: student.id,
        nom: user ? `${user.firstName} ${user.lastName}` : student.id,
        email: user?.email,
        formationId: student.formationId ?? undefined,
        statutDossier: student.fileStatus
      }));
  }
};

const bookArgs = z.object({
  studentId: z.string().trim().min(1),
  instructorId: z.string().trim().min(1),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  meetingPointId: z.string().trim().optional(),
  formationId: z.string().trim().optional()
});

const bookAppointmentTool: ToolEntry = {
  permission: "bookings.manage",
  def: {
    type: "function",
    function: {
      name: "book_appointment",
      description: "Réserve une leçon RÉELLE dans le planning pour un élève (vérifie les conflits moniteur). Utiliser find_student et get_available_slots au préalable.",
      parameters: {
        type: "object",
        properties: {
          studentId: { type: "string" },
          instructorId: { type: "string" },
          startsAt: { type: "string", description: "Début ISO 8601" },
          endsAt: { type: "string", description: "Fin ISO 8601" },
          meetingPointId: { type: "string" },
          formationId: { type: "string" }
        },
        required: ["studentId", "instructorId", "startsAt", "endsAt"],
        additionalProperties: false
      }
    }
  },
  handler: async (args, ctx) => {
    const parsed = bookArgs.safeParse(args);
    if (!parsed.success) {
      return {
        ok: false,
        error:
          "Paramètres invalides. Fournis studentId, instructorId, et startsAt/endsAt au format ISO 8601 (ex: 2026-06-08T09:00:00.000Z). Appelle get_available_slots pour obtenir des créneaux au bon format."
      };
    }
    const b = parsed.data;
    if (b.endsAt <= b.startsAt) return { ok: false, error: "La fin doit être après le début." };

    const student = await ctx.repository.findStudentById(b.studentId);
    if (!student) return { ok: false, error: "Élève introuvable." };
    const formationId = b.formationId ?? student.formationId;
    if (!formationId) return { ok: false, error: "Aucune formation associée à l'élève." };

    let meetingPointId = b.meetingPointId;
    if (!meetingPointId) {
      const points = await ctx.repository.listMeetingPoints();
      meetingPointId = points[0]?.id;
    }

    const conflict = await ctx.repository.hasInstructorConflict(b.instructorId, b.startsAt, b.endsAt);
    if (conflict) return { ok: false, error: "Le moniteur est déjà réservé sur ce créneau." };

    const booking = await ctx.repository.createBooking({
      studentId: b.studentId,
      instructorId: b.instructorId,
      formationId,
      meetingPointId,
      agencyId: student.agencyId ?? undefined,
      startsAt: b.startsAt,
      endsAt: b.endsAt,
      status: "CONFIRMEE"
    });

    const user = await ctx.repository.findUserById(student.userId);
    if (user?.email) {
      void sendEmail(ctx.config, {
        to: user.email,
        subject: "Confirmation de votre leçon — LODEN Auto-École",
        text: `Bonjour ${user.firstName},\n\nVotre leçon est confirmée le ${b.startsAt.toLocaleString("fr-FR")}.\n\nÀ très vite,\nLODEN Auto-École`
      });
    }
    if (user?.phone) void sendSms(ctx.config, user.phone, `LODEN : votre leçon est confirmée le ${b.startsAt.toLocaleString("fr-FR")}.`);

    await ctx.repository.createAuditLog({
      action: "ai.book_appointment",
      entityType: "Booking",
      entityId: booking.id,
      metadata: { studentId: b.studentId, instructorId: b.instructorId },
      userId: ctx.actorUserId ?? null
    });

    return { ok: true, bookingId: booking.id, message: "Leçon confirmée dans le planning." };
  }
};

const byName = (name: string) => publicTools.find((tool) => tool.def.function.name === name)!;

/**
 * Outils de l'agent CRM (équipe authentifiée). Lectures publiques réutilisées +
 * création de prospect + recherche élève + réservation réelle. Le routeur filtre
 * cette liste par les permissions du rôle connecté (RBAC).
 */
export const crmTools: ToolEntry[] = [
  byName("get_formations"),
  byName("get_prices"),
  byName("get_agencies"),
  byName("get_available_slots"),
  byName("create_lead"),
  findStudentTool,
  bookAppointmentTool
];
