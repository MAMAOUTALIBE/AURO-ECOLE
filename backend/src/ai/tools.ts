import { z } from "zod";
import type { ApiConfig } from "../config/env";
import type { Permission } from "../domain/permissions";
import type { LeadRecord } from "../domain/types";
import { bookChatAppointment, listAppointmentSlots } from "../modules/chat/chat-booking";
import type { LodenRepository } from "../repositories/loden-repository";
import { notifyNewLead, sendEmail } from "../shared/mailer";
import { sendSms } from "../shared/sms";
import { buildWhatsAppAppointmentText, buildWhatsAppUrl } from "../shared/whatsapp";
import { selectKnowledge } from "./knowledge";
import { LEAD_SCORE_SYSTEM, SUMMARIZE_SYSTEM } from "./prompts";
import { qualifyLead } from "./qualify";
import type { AiProvider, AiTool } from "./types";

function euros(cents: number) {
  // "sur devis" tant que le prix public n'est pas renseigné.
  return cents > 0 ? `${Math.round(cents / 100)} €` : "sur devis";
}

/** Sépare un nom complet en prénom / nom pour structurer le prospect. */
function splitFullName(value: string): { firstName: string; lastName: string } {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { firstName: parts[0] ?? value.trim(), lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

function normalizeText(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}

// Détecte les valeurs d'exemple que le modèle pourrait inventer au lieu de demander
// les vraies coordonnées (« Prénom Nom », « John Doe », « votre nom »…). Garde-fou
// déterministe : on ne crée jamais de lead/RDV avec une identité factice.
const PLACEHOLDER_NAMES = new Set([
  "prenom nom", "nom prenom", "prenom", "nom", "votre nom", "votre prenom", "nom complet",
  "nom et prenom", "prenom et nom", "nom du client", "prenom du client", "le client", "client",
  "jean dupont", "john doe", "jane doe", "marie martin", "test test", "test", "essai",
  "exemple", "example", "anonyme", "inconnu", "na", "n/a", "xxx", "aaa", "abc"
]);
const PLACEHOLDER_NAME_TOKENS = new Set(["prenom", "firstname", "lastname", "exemple", "example", "placeholder", "xxx"]);

function looksLikePlaceholderName(value: string): boolean {
  const n = normalizeText(value);
  if (n.length < 2) return true;
  if (PLACEHOLDER_NAMES.has(n)) return true;
  if (/^<.*>$/.test(n) || /\[.*\]/.test(n)) return true; // <nom>, [prénom]
  if (n.includes("votre nom") || n.includes("votre prenom")) return true;
  return n.split(/\s+/).some((token) => PLACEHOLDER_NAME_TOKENS.has(token));
}

const PLACEHOLDER_EMAIL_LOCAL = new Set([
  "exemple", "example", "votre", "nom", "prenom", "email", "user", "client", "monemail", "votremail", "votreemail"
]);

function looksLikePlaceholderEmail(value: string): boolean {
  const n = normalizeText(value);
  const [local, domain = ""] = n.split("@");
  if (!local || !domain) return false;
  if (PLACEHOLDER_EMAIL_LOCAL.has(local)) return true;
  // Domaines manifestement factices qu'un vrai prospect n'utilise pas (on laisse
  // passer l'anglais example.com, convention de test/RFC, mais pas exemple.fr).
  return /^(email|domaine|domain|votremail|exemple|votre)\./.test(domain);
}

/** Garde-fou partagé : refuse une identité factice avant toute création (lead/devis/RDV). */
function rejectPlaceholderIdentity(fullName: string, email?: string): { ok: false; error: string } | null {
  if (looksLikePlaceholderName(fullName) || (email ? looksLikePlaceholderEmail(email) : false)) {
    return {
      ok: false,
      error:
        "Coordonnées non valides : demande à la personne son VRAI nom complet et son email avant toute création. N'utilise jamais de valeurs d'exemple (« Prénom Nom », « exemple@email.fr »)."
    };
  }
  return null;
}

const CATEGORY_LABELS: Record<string, string> = {
  AUTO_ECOLE: "Auto-école / Permis B",
  VTC: "VTC",
  SST: "SST",
  LOGISTIQUE_SECURITE: "Logistique & sécurité",
  CACES: "CACES"
};

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
  financingType: z.enum(["CPF", "PERSONNEL", "ENTREPRISE", "OPCO", "AUTRE"]).optional(),
  message: z.string().trim().max(1000).optional()
});

const appointmentArgs = leadArgs.extend({
  desiredDate: z.string().trim().max(120).optional(),
  agency: z.string().trim().max(120).optional(),
  formation: z.string().trim().max(160).optional()
});

const quoteRequestArgs = leadArgs.extend({
  formation: z.string().trim().max(160).optional()
});

const bookSlotArgs = z.object({
  slotId: z.string().trim().min(1),
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().min(6).max(40),
  formation: z.string().trim().max(160).optional(),
  objective: z.string().trim().max(160).optional(),
  message: z.string().trim().max(1000).optional(),
  consentContact: z.boolean().optional(),
  consentWhatsApp: z.boolean().optional()
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
        description:
          "Liste les formations proposées par LODENE (permis B, VTC, SST, logistique & sécurité) : titre, formule, catégorie, durée, prix public ou « sur devis », éligibilité CPF.",
        parameters: { type: "object", properties: {}, additionalProperties: false }
      }
    },
    handler: async (_args, ctx) => {
      const formations = await ctx.repository.listFormations();
      // Confidentialité : on n'expose que des champs publics (jamais internalPriceCents).
      return formations.map((f) => ({
        titre: f.subtitle ? `${f.title} — ${f.subtitle}` : f.title,
        categorie: CATEGORY_LABELS[f.productLine ?? "AUTO_ECOLE"] ?? f.productLine,
        duree: f.durationLabel,
        prix: f.quoteOnly ? "sur devis" : `${euros(f.priceCents)}${f.priceCents > 0 ? ` ${f.taxMode ?? "TTC"}` : ""}`,
        cpf: f.cpfEligible
      }));
    }
  },
  {
    def: {
      type: "function",
      function: {
        name: "get_prices",
        description: "Liste les packs et tarifs publics validés de LODENE.",
        parameters: { type: "object", properties: {}, additionalProperties: false }
      }
    },
    handler: async (_args, ctx) => {
      const plans = await ctx.repository.listPricingPlans();
      return plans.map((p) => ({ titre: p.title, prix: euros(p.priceCents), inclus: p.features.slice(0, 4) }));
    }
  },
  {
    def: {
      type: "function",
      function: {
        name: "get_agencies",
        description: "Liste les agences LODENE (nom et adresse publique).",
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
      return availabilities.slice(0, 8).map((a) => ({ moniteur: nameById.get(a.instructorId) ?? "Moniteur LODENE", debut: a.startsAt.toISOString(), fin: a.endsAt.toISOString() }));
    }
  },
  {
    def: {
      type: "function",
      function: {
        name: "search_knowledge",
        description:
          "Recherche dans la base de connaissance PUBLIQUE de LODENE (formations permis B / VTC / SST / logistique, tarifs publics, CPF & financements, documents à fournir, horaires & contact, FAQ). À utiliser pour répondre précisément à une question sur l'offre LODENE, sans rien inventer.",
        parameters: {
          type: "object",
          properties: { query: { type: "string", description: "Sujet ou question de l'utilisateur" } },
          required: ["query"],
          additionalProperties: false
        }
      }
    },
    handler: async (args) => {
      const query = String(args.query ?? "").trim();
      if (!query) return { results: [] };
      // selectKnowledge ne consulte QUE les articles publics : aucune donnée interne possible.
      const hits = selectKnowledge(query, { limit: 3 });
      return { results: hits.map((h) => ({ titre: h.title, contenu: h.body })) };
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
            financingType: { type: "string", enum: ["CPF", "PERSONNEL", "ENTREPRISE", "OPCO", "AUTRE"], description: "Financement évoqué (optionnel)" },
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
      const placeholder = rejectPlaceholderIdentity(parsed.data.fullName, parsed.data.email);
      if (placeholder) return placeholder;
      const { firstName, lastName } = splitFullName(parsed.data.fullName);
      const lead = await ctx.repository.createLead({
        fullName: parsed.data.fullName,
        firstName,
        lastName,
        email: parsed.data.email,
        phone: parsed.data.phone,
        source: "assistant-ia",
        interest: parsed.data.interest,
        financingType: parsed.data.financingType,
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
      const placeholder = rejectPlaceholderIdentity(d.fullName, d.email);
      if (placeholder) return placeholder;
      const notes = [d.message, d.desiredDate ? `Créneau souhaité: ${d.desiredDate}` : null, d.agency ? `Agence: ${d.agency}` : null, d.formation ? `Formation: ${d.formation}` : null]
        .filter(Boolean)
        .join(" | ");
      const { firstName, lastName } = splitFullName(d.fullName);
      const lead = await ctx.repository.createLead({
        fullName: d.fullName,
        firstName,
        lastName,
        email: d.email,
        phone: d.phone,
        source: "assistant-ia-rdv",
        interest: "RENDEZ-VOUS",
        financingType: d.financingType,
        notes,
        status: "PROSPECT"
      });
      void notifyNewLead(ctx.config, lead);
      void sendEmail(ctx.config, {
        to: d.email,
        subject: "Votre demande de rendez-vous — LODENE Auto-École",
        text: `Bonjour ${d.fullName},\n\nNous avons bien reçu votre demande de rendez-vous${d.desiredDate ? ` (${d.desiredDate})` : ""}. Un conseiller LODENE va confirmer le créneau rapidement.\n\nÀ très vite,\nL'équipe LODENE`
      });
      if (d.phone) void sendSms(ctx.config, d.phone, `LODENE : votre demande de RDV est bien reçue${d.desiredDate ? ` (${d.desiredDate})` : ""}. Un conseiller confirmera le créneau.`);
      void qualifyLead(ctx.aiProvider, ctx.repository, lead);
      await ctx.repository.createAuditLog({ action: "ai.request_appointment", entityType: "Lead", entityId: lead.id, metadata: { desiredDate: d.desiredDate ?? null }, userId: ctx.actorUserId ?? null });
      return { ok: true, message: "Demande de rendez-vous enregistrée. Un conseiller confirmera le créneau (rien n'est définitif avant sa confirmation)." };
    }
  },
  {
    def: {
      type: "function",
      function: {
        name: "generate_whatsapp_link",
        description:
          "Génère un lien WhatsApp prérempli pour contacter LODENE (ne révèle aucune donnée sensible). Utiliser quand la personne souhaite continuer sur WhatsApp.",
        parameters: {
          type: "object",
          properties: {
            fullName: { type: "string", description: "Nom de la personne (optionnel)" },
            formation: { type: "string", description: "Formation concernée (optionnel)" },
            date: { type: "string", description: "Date souhaitée (optionnel)" },
            time: { type: "string", description: "Heure souhaitée (optionnel)" },
            message: { type: "string", description: "Message libre prérempli (optionnel)" }
          },
          additionalProperties: false
        }
      }
    },
    handler: async (args, ctx) => {
      const rawName = String(args.fullName ?? "").trim();
      // On ignore un nom factice (« Prénom Nom ») plutôt que de l'écrire dans le message.
      const fullName = looksLikePlaceholderName(rawName) ? "" : rawName;
      const formation = String(args.formation ?? "").trim();
      const date = String(args.date ?? "").trim();
      const time = String(args.time ?? "").trim();
      const custom = String(args.message ?? "").trim();
      const text =
        custom ||
        (formation && date && time
          ? buildWhatsAppAppointmentText({ formation, date, time, fullName })
          : `Bonjour LODENE, je souhaite des informations${formation ? ` sur la formation ${formation}` : ""}.`);
      const company = await ctx.repository.getCompanyInfo();
      // buildWhatsAppUrl privilégie WHATSAPP_BUSINESS_NUMBER, sinon le numéro fourni (ici, celui de LODENE).
      const url = buildWhatsAppUrl(ctx.config, company.phone ?? "", text);
      return { url, message: text };
    }
  },
  {
    def: {
      type: "function",
      function: {
        name: "create_quote_request",
        description:
          "Enregistre une DEMANDE DE DEVIS dans le CRM (crée un prospect + une tâche « devis » pour l'équipe). À utiliser après avoir recueilli au moins le nom et l'email avec l'accord de la personne.",
        parameters: {
          type: "object",
          properties: {
            fullName: { type: "string" },
            email: { type: "string" },
            phone: { type: "string" },
            formation: { type: "string", description: "Formation / besoin pour le devis" },
            message: { type: "string", description: "Précisions (nombre de personnes, lieu, dates…)" }
          },
          required: ["fullName", "email"],
          additionalProperties: false
        }
      }
    },
    handler: async (args, ctx) => {
      const parsed = quoteRequestArgs.safeParse(args);
      if (!parsed.success) return { ok: false, error: "Nom et email valides requis pour la demande de devis." };
      const d = parsed.data;
      const placeholder = rejectPlaceholderIdentity(d.fullName, d.email);
      if (placeholder) return placeholder;
      const subject = d.formation ?? d.interest ?? "formation à préciser";
      const notes = ["Demande de devis", d.formation ? `Formation: ${d.formation}` : null, d.message]
        .filter(Boolean)
        .join(" | ");
      const { firstName, lastName } = splitFullName(d.fullName);
      const lead = await ctx.repository.createLead({
        fullName: d.fullName,
        firstName,
        lastName,
        email: d.email,
        phone: d.phone,
        source: "assistant-ia-devis",
        interest: d.formation ?? d.interest ?? "DEVIS",
        financingType: d.financingType,
        notes,
        status: "PROSPECT"
      });
      await ctx.repository.createChatTask({
        leadId: lead.id,
        type: "RELANCE",
        priority: "NORMALE",
        deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        note: `Établir un devis — ${subject}`,
        assignedToId: ctx.actorUserId ?? null
      });
      void notifyNewLead(ctx.config, lead);
      void qualifyLead(ctx.aiProvider, ctx.repository, lead);
      await ctx.repository.createAuditLog({
        action: "ai.create_quote_request",
        entityType: "Lead",
        entityId: lead.id,
        metadata: { formation: d.formation ?? null },
        userId: ctx.actorUserId ?? null
      });
      return { ok: true, message: "Demande de devis enregistrée. Un conseiller préparera le devis et reviendra vers vous." };
    }
  },
  {
    def: {
      type: "function",
      function: {
        name: "get_appointment_slots",
        description:
          "Liste les créneaux de rendez-vous RÉELLEMENT disponibles (id, date, heure, type). À appeler AVANT book_appointment_slot pour proposer des créneaux concrets à la personne.",
        parameters: { type: "object", properties: {}, additionalProperties: false }
      }
    },
    handler: async (_args, ctx) => {
      const slots = await listAppointmentSlots(ctx.repository);
      return { slots: slots.slice(0, 8) };
    }
  },
  {
    def: {
      type: "function",
      function: {
        name: "book_appointment_slot",
        description:
          "Réserve un créneau de rendez-vous (DEMANDE, confirmée ensuite par un conseiller). Nécessite un slotId obtenu via get_appointment_slots, + nom complet, email, téléphone, et l'accord explicite de la personne. Crée le prospect + le RDV + alerte l'équipe et renvoie un lien WhatsApp.",
        parameters: {
          type: "object",
          properties: {
            slotId: { type: "string", description: "Identifiant du créneau (via get_appointment_slots)" },
            fullName: { type: "string", description: "Nom complet" },
            email: { type: "string" },
            phone: { type: "string" },
            formation: { type: "string", description: "Formation concernée" },
            objective: { type: "string", description: "Objectif du RDV (ex: M'inscrire, Obtenir un devis)" },
            message: { type: "string" },
            consentContact: { type: "boolean", description: "La personne accepte d'être contactée" },
            consentWhatsApp: { type: "boolean", description: "La personne accepte WhatsApp" }
          },
          required: ["slotId", "fullName", "email", "phone"],
          additionalProperties: false
        }
      }
    },
    handler: async (args, ctx) => {
      const parsed = bookSlotArgs.safeParse(args);
      if (!parsed.success) return { ok: false, error: "slotId, nom complet, email et téléphone valides requis." };
      const d = parsed.data;
      if (looksLikePlaceholderName(d.fullName) || looksLikePlaceholderEmail(d.email)) {
        return {
          ok: false,
          error:
            "Coordonnées non valides : demande à la personne son VRAI nom complet, son email et son téléphone avant de réserver. N'utilise jamais de valeurs d'exemple (« Prénom Nom », « exemple@email.fr »)."
        };
      }
      const { firstName, lastName } = splitFullName(d.fullName);
      try {
        const result = await bookChatAppointment(ctx.repository, ctx.config, ctx.aiProvider, {
          slotId: d.slotId,
          firstName,
          lastName,
          email: d.email,
          phone: d.phone,
          formation: d.formation ?? "À préciser",
          objective: d.objective ?? "Être rappelé",
          message: d.message,
          consentContact: d.consentContact ?? true,
          consentWhatsApp: d.consentWhatsApp ?? false
        });
        return {
          ok: true,
          message: `Rendez-vous demandé pour le ${result.appointment.date} à ${result.appointment.time}. Un conseiller LODENE confirmera le créneau.`,
          whatsappUrl: result.whatsapp.url
        };
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : "Réservation impossible. Proposez un autre créneau." };
      }
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
        subject: "Confirmation de votre leçon — LODENE Auto-École",
        text: `Bonjour ${user.firstName},\n\nVotre leçon est confirmée le ${b.startsAt.toLocaleString("fr-FR")}.\n\nÀ très vite,\nLODEN Auto-École`
      });
    }
    if (user?.phone) void sendSms(ctx.config, user.phone, `LODENE : votre leçon est confirmée le ${b.startsAt.toLocaleString("fr-FR")}.`);

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

// --- find_lead : retrouver un prospect pour pouvoir agir dessus (create_task, update_lead_status) ---
const findLeadTool: ToolEntry = {
  permission: "leads.read",
  def: {
    type: "function",
    function: {
      name: "find_lead",
      description: "Recherche un prospect/lead par nom, email ou téléphone. Retourne son id, son statut et ses coordonnées.",
      parameters: {
        type: "object",
        properties: { query: { type: "string", description: "Nom, email ou téléphone du prospect" } },
        required: ["query"],
        additionalProperties: false
      }
    }
  },
  handler: async (args, ctx) => {
    const query = String(args.query ?? "").trim().toLowerCase();
    if (!query) return { error: "Requête vide." };
    const leads = await ctx.repository.listLeads();
    return leads
      .filter((l) => `${l.fullName} ${l.email} ${l.phone ?? ""}`.toLowerCase().includes(query))
      .slice(0, 5)
      .map((l) => ({
        leadId: l.id,
        nom: l.fullName,
        email: l.email,
        telephone: l.phone ?? undefined,
        statut: l.status,
        source: l.source ?? undefined,
        interet: l.interest ?? undefined,
        temperature: l.temperature ?? undefined,
        score: l.score ?? undefined
      }));
  }
};

// --- create_task : créer une tâche CRM (relance / confirmation) liée à un prospect ---
const createTaskArgs = z.object({
  leadId: z.string().trim().min(1),
  note: z.string().trim().min(2).max(1000),
  type: z.enum(["RELANCE", "CONFIRMATION"]).optional(),
  priority: z.enum(["HAUTE", "NORMALE", "BASSE"]).optional(),
  dueInDays: z.coerce.number().int().min(0).max(120).optional(),
  appointmentId: z.string().trim().optional()
});

const createTaskTool: ToolEntry = {
  permission: "leads.manage",
  def: {
    type: "function",
    function: {
      name: "create_task",
      description:
        "Crée une tâche CRM (relance, confirmation, devis, vérification CPF…) liée à un prospect. Précise l'objet dans 'note'. Nécessite le leadId (utilise find_lead si besoin).",
      parameters: {
        type: "object",
        properties: {
          leadId: { type: "string" },
          note: { type: "string", description: "Objet de la tâche (ex: « Vérifier l'éligibilité CPF »)" },
          type: { type: "string", enum: ["RELANCE", "CONFIRMATION"], description: "Type (défaut RELANCE)" },
          priority: { type: "string", enum: ["HAUTE", "NORMALE", "BASSE"], description: "Priorité (défaut NORMALE)" },
          dueInDays: { type: "number", description: "Échéance en jours (défaut 2)" },
          appointmentId: { type: "string", description: "RDV lié (optionnel)" }
        },
        required: ["leadId", "note"],
        additionalProperties: false
      }
    }
  },
  handler: async (args, ctx) => {
    const parsed = createTaskArgs.safeParse(args);
    if (!parsed.success) return { ok: false, error: "leadId et note requis." };
    const t = parsed.data;
    const task = await ctx.repository.createChatTask({
      leadId: t.leadId,
      type: t.type ?? "RELANCE",
      priority: t.priority ?? "NORMALE",
      deadline: new Date(Date.now() + (t.dueInDays ?? 2) * 24 * 60 * 60 * 1000),
      note: t.note,
      appointmentId: t.appointmentId,
      assignedToId: ctx.actorUserId ?? null
    });
    await ctx.repository.createAuditLog({
      action: "ai.create_task",
      entityType: "ChatTask",
      entityId: task.id,
      metadata: { leadId: t.leadId, type: task.type },
      userId: ctx.actorUserId ?? null
    });
    return { ok: true, taskId: task.id, message: "Tâche créée." };
  }
};

// --- update_lead_status : faire avancer un prospect dans le pipeline ---
const updateLeadStatusArgs = z.object({
  leadId: z.string().trim().min(1),
  status: z.enum(["PROSPECT", "CONTACTE", "RELANCE", "DEVIS_ENVOYE", "INSCRIT", "BON_UTILISE", "PERDU"]),
  notes: z.string().trim().max(1000).optional(),
  nextFollowUpInDays: z.coerce.number().int().min(0).max(120).optional()
});

const updateLeadStatusTool: ToolEntry = {
  permission: "leads.manage",
  def: {
    type: "function",
    function: {
      name: "update_lead_status",
      description:
        "Met à jour le statut d'un prospect (PROSPECT, CONTACTE, RELANCE, DEVIS_ENVOYE, INSCRIT, BON_UTILISE, PERDU). Nécessite le leadId (utilise find_lead).",
      parameters: {
        type: "object",
        properties: {
          leadId: { type: "string" },
          status: { type: "string", enum: ["PROSPECT", "CONTACTE", "RELANCE", "DEVIS_ENVOYE", "INSCRIT", "BON_UTILISE", "PERDU"] },
          notes: { type: "string", description: "Note de suivi (optionnel)" },
          nextFollowUpInDays: { type: "number", description: "Prochaine relance dans N jours (optionnel)" }
        },
        required: ["leadId", "status"],
        additionalProperties: false
      }
    }
  },
  handler: async (args, ctx) => {
    const parsed = updateLeadStatusArgs.safeParse(args);
    if (!parsed.success) return { ok: false, error: "leadId et statut valides requis." };
    const u = parsed.data;
    const patch: Partial<LeadRecord> = { status: u.status };
    if (u.notes) patch.notes = u.notes;
    if (u.nextFollowUpInDays != null) patch.nextFollowUpAt = new Date(Date.now() + u.nextFollowUpInDays * 24 * 60 * 60 * 1000);
    try {
      const lead = await ctx.repository.updateLead(u.leadId, patch);
      await ctx.repository.createAuditLog({
        action: "ai.update_lead_status",
        entityType: "Lead",
        entityId: lead.id,
        metadata: { status: u.status },
        userId: ctx.actorUserId ?? null
      });
      return { ok: true, message: `Statut mis à jour : ${u.status}.` };
    } catch {
      return { ok: false, error: "Prospect introuvable." };
    }
  }
};

// --- score_lead : qualifier un prospect (chaud/tiède/froid) via l'IA, persistable ---
const scoreLeadArgs = z.object({
  leadId: z.string().trim().optional(),
  fullName: z.string().trim().max(120).optional(),
  interest: z.string().trim().max(200).optional(),
  source: z.string().trim().max(120).optional(),
  message: z.string().trim().max(2000).optional()
});

const scoreLeadTool: ToolEntry = {
  permission: "leads.read",
  def: {
    type: "function",
    function: {
      name: "score_lead",
      description:
        "Évalue la température d'un prospect (chaud/tiède/froid + score 0-100 + action recommandée). Si leadId est fourni, le score est enregistré sur le prospect.",
      parameters: {
        type: "object",
        properties: {
          leadId: { type: "string", description: "Prospect à mettre à jour (optionnel)" },
          fullName: { type: "string" },
          interest: { type: "string", description: "Besoin / formation visée" },
          source: { type: "string" },
          message: { type: "string", description: "Message ou contexte du prospect" }
        },
        additionalProperties: false
      }
    }
  },
  handler: async (args, ctx) => {
    if (!ctx.aiProvider?.available) return { error: "Qualification IA indisponible pour le moment." };
    const a = scoreLeadArgs.safeParse(args).data ?? {};
    const description =
      [a.fullName ? `Nom: ${a.fullName}` : null, a.interest ? `Intérêt: ${a.interest}` : null, a.source ? `Source: ${a.source}` : null, a.message ? `Message: ${a.message}` : null]
        .filter(Boolean)
        .join("\n") || "Aucune information.";
    const reply = await ctx.aiProvider.complete(
      [
        { role: "system", content: LEAD_SCORE_SYSTEM },
        { role: "user", content: description }
      ],
      { temperature: 0.1, maxTokens: 200 }
    );
    let parsed: { temperature?: string; score?: number; raison?: string; prochaineAction?: string };
    try {
      parsed = JSON.parse(reply.replace(/```json|```/g, "").trim());
    } catch {
      parsed = { temperature: "tiede", score: 50, raison: reply.slice(0, 200), prochaineAction: "Recontacter le prospect" };
    }
    if (a.leadId) {
      try {
        await ctx.repository.updateLead(a.leadId, {
          temperature: parsed.temperature ?? null,
          score: typeof parsed.score === "number" ? parsed.score : null
        });
      } catch {
        // le prospect peut ne plus exister : on renvoie quand même le score calculé.
      }
    }
    return parsed;
  }
};

// --- summarize_conversation : résumé d'une conversation / demande ---
const summarizeConversationTool: ToolEntry = {
  permission: "dashboard.read",
  def: {
    type: "function",
    function: {
      name: "summarize_conversation",
      description: "Résume une conversation ou une demande client en quelques puces + une catégorie.",
      parameters: {
        type: "object",
        properties: { text: { type: "string", description: "Texte de la conversation / demande à résumer" } },
        required: ["text"],
        additionalProperties: false
      }
    }
  },
  handler: async (args, ctx) => {
    if (!ctx.aiProvider?.available) return { error: "Résumé IA indisponible pour le moment." };
    const text = String(args.text ?? "").trim();
    if (text.length < 5) return { error: "Texte trop court à résumer." };
    const summary = await ctx.aiProvider.complete(
      [
        { role: "system", content: SUMMARIZE_SYSTEM },
        { role: "user", content: text.slice(0, 5000) }
      ],
      { temperature: 0.2, maxTokens: 300 }
    );
    return { summary };
  }
};

// --- send_admin_email_alert : alerter l'équipe LODENE par email ---
const sendAdminEmailAlertArgs = z.object({
  subject: z.string().trim().min(2).max(200),
  body: z.string().trim().min(2).max(4000),
  leadId: z.string().trim().optional()
});

const sendAdminEmailAlertTool: ToolEntry = {
  permission: "leads.manage",
  def: {
    type: "function",
    function: {
      name: "send_admin_email_alert",
      description: "Envoie une alerte par email à l'équipe LODENE (responsable). Pour signaler un prospect urgent ou une action à traiter.",
      parameters: {
        type: "object",
        properties: {
          subject: { type: "string", description: "Objet court" },
          body: { type: "string", description: "Contenu de l'alerte" },
          leadId: { type: "string", description: "Prospect concerné (optionnel)" }
        },
        required: ["subject", "body"],
        additionalProperties: false
      }
    }
  },
  handler: async (args, ctx) => {
    const parsed = sendAdminEmailAlertArgs.safeParse(args);
    if (!parsed.success) return { ok: false, error: "Objet et contenu requis." };
    const to = ctx.config.OWNER_ALERT_EMAIL || ctx.config.LODEN_NOTIFY_TO;
    if (!to) return { ok: false, error: "Aucune adresse d'alerte n'est configurée." };
    const status = await sendEmail(ctx.config, {
      to,
      subject: `[LODENE] ${parsed.data.subject}`,
      text: parsed.data.body
    });
    await ctx.repository.createAuditLog({
      action: "ai.admin_alert",
      entityType: "Lead",
      entityId: parsed.data.leadId ?? "n/a",
      metadata: { status },
      userId: ctx.actorUserId ?? null
    });
    return status === "sent"
      ? { ok: true, message: "Alerte envoyée à l'équipe LODENE." }
      : { ok: false, status, message: "Alerte non envoyée (email non configuré)." };
  }
};

const byName = (name: string) => publicTools.find((tool) => tool.def.function.name === name)!;

/**
 * Outils de l'agent CRM (équipe authentifiée). Lectures publiques réutilisées +
 * création de prospect + recherche élève + réservation réelle. Le routeur filtre
 * cette liste par les permissions du rôle connecté (RBAC).
 */
/**
 * Outils de l'agent PUBLIC conversationnel : sous-ensemble FOCALISÉ pour limiter
 * la taille du prompt (coût/tokens) tout en couvrant les actions clés : connaissance,
 * proposition + réservation de créneau, lead, devis, WhatsApp. La liste complète des
 * formations/tarifs passe par search_knowledge plutôt que d'alourdir chaque requête.
 */
export const publicAgentTools: ToolEntry[] = [
  byName("search_knowledge"),
  byName("book_appointment_slot"),
  byName("create_lead"),
  byName("create_quote_request"),
  byName("generate_whatsapp_link")
];

export const crmTools: ToolEntry[] = [
  byName("search_knowledge"),
  byName("get_formations"),
  byName("get_prices"),
  byName("get_agencies"),
  byName("get_available_slots"),
  byName("generate_whatsapp_link"),
  byName("get_appointment_slots"),
  byName("book_appointment_slot"),
  byName("create_lead"),
  byName("create_quote_request"),
  findLeadTool,
  findStudentTool,
  createTaskTool,
  updateLeadStatusTool,
  scoreLeadTool,
  summarizeConversationTool,
  sendAdminEmailAlertTool,
  bookAppointmentTool
];
