import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { buildCompactPublicAiPrompt, buildPublicFallbackReply } from "../../ai/public-fallback";
import type { AiMessage, AiProvider } from "../../ai/types";
import { buildPublicAgentSystemPrompt, SUMMARIZE_SYSTEM } from "../../ai/prompts";
import { classifyIntent } from "../../ai/intent";
import { runAgent } from "../../ai/agent";
import { sanitizeAiOutput } from "../../ai/safety";
import { publicTools } from "../../ai/tools";
import type { ApiConfig } from "../../config/env";
import { authenticate, requirePermission } from "../../middleware/auth";
import type { LodenRepository } from "../../repositories/loden-repository";
import { asyncHandler } from "../../shared/async-handler";
import { badRequest, conflict } from "../../shared/http-error";
import { sendChatAppointmentAdminAlert, sendChatAppointmentClientConfirmation } from "../../shared/mailer";
import { buildWhatsAppAppointmentText, buildWhatsAppUrl, sendWhatsAppMessage } from "../../shared/whatsapp";
import { emailSchema, phoneSchema, validateBody, validateQuery } from "../../shared/validation";
import { canonicalType } from "../appointments/appointments.vocab";

const publicChatLimiter = rateLimit({
  windowMs: 60_000,
  max: process.env.NODE_ENV === "test" ? 1000 : 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: "RATE_LIMITED", message: "Trop de demandes. Réessayez dans un instant." } }
});

const messageSchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(2000) }))
    .min(1)
    .max(12),
  conversationId: z.string().trim().min(1).max(60).optional()
});

const formationSchema = z.enum([
  "Permis B manuel",
  "Permis B automatique",
  "VTC",
  "SST",
  "Logistique / sécurité",
  "Je ne sais pas encore",
  "Formation entreprise"
]);

const objectiveSchema = z.enum(["M'inscrire", "Obtenir un devis", "Utiliser mon CPF", "Poser une question", "Être rappelé"]);

const leadBodySchema = z.object({
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(100),
  phone: phoneSchema.unwrap().trim().min(8).max(30),
  email: emailSchema,
  formation: formationSchema,
  objective: objectiveSchema,
  message: z.string().trim().max(1500).optional(),
  companySize: z.coerce.number().int().min(1).max(100000).optional(),
  consentContact: z.literal(true),
  consentWhatsApp: z.boolean().default(false)
});

/** Déduit le type de financement à partir de la formation et de l'objectif déclarés. */
function deriveFinancingType(input: { formation: string; objective: string }): string {
  if (input.formation === "Formation entreprise") return "ENTREPRISE";
  if (input.objective === "Utiliser mon CPF") return "CPF";
  return "PERSONNEL";
}

const appointmentBodySchema = leadBodySchema.extend({
  slotId: z.string().trim().min(1),
  type: z.enum(["APPEL", "AGENCE", "VISIO", "DEVIS", "INSCRIPTION"]).default("APPEL"),
  conversation: messageSchema.shape.messages.optional(),
  conversationId: z.string().trim().min(1).max(60).optional()
});

const availabilityQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  agencyId: z.string().trim().optional()
});

function fullName(input: { firstName: string; lastName: string }) {
  return `${input.firstName.trim()} ${input.lastName.trim()}`.replace(/\s+/g, " ");
}

function displayDate(date: Date) {
  return date.toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long" });
}

function displayTime(date: Date) {
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function mapSlot(slot: Awaited<ReturnType<LodenRepository["listChatAvailabilitySlots"]>>[number]) {
  return {
    id: slot.id,
    label: slot.label,
    startsAt: slot.startsAt.toISOString(),
    endsAt: slot.endsAt.toISOString(),
    date: displayDate(slot.startsAt),
    time: displayTime(slot.startsAt),
    type: slot.type,
    remaining: Math.max(0, slot.capacity - slot.bookedCount)
  };
}

async function createLeadFromChat(repository: LodenRepository, input: z.infer<typeof leadBodySchema>) {
  const fields = {
    fullName: fullName(input),
    firstName: input.firstName,
    lastName: input.lastName,
    phone: input.phone,
    interest: input.formation,
    financingType: deriveFinancingType(input),
    consentEmail: input.consentContact,
    consentWhatsapp: input.consentWhatsApp,
    notes: [
      `Objectif : ${input.objective}`,
      input.companySize ? `Nombre de salariés : ${input.companySize}` : null,
      input.message ? `Message : ${input.message}` : null
    ].filter(Boolean).join("\n"),
    temperature: "chaud"
  };

  // Déduplication : si un prospect existe déjà avec cet email, on le met à jour
  // (sans toucher au statut du pipeline ni à sa source d'origine) plutôt que de
  // créer un doublon.
  const existing = await repository.findLeadByEmail(input.email);
  if (existing) return repository.updateLead(existing.id, fields);

  return repository.createLead({ ...fields, email: input.email, source: "chatbot", status: "PROSPECT" });
}

/**
 * Tâche de suivi prudente selon le financement :
 * - CPF : « vérification CPF » (jamais de promesse de validation automatique).
 * - Entreprise : préparer un devis (priorité haute).
 */
async function createFinancingFollowUpTask(
  repository: LodenRepository,
  leadId: string,
  input: z.infer<typeof leadBodySchema>,
  appointmentId?: string
) {
  const deadline = new Date(Date.now() + 2 * 24 * 60 * 60_000);
  if (input.objective === "Utiliser mon CPF") {
    await repository.createChatTask({
      leadId,
      appointmentId,
      type: "RELANCE",
      priority: "HAUTE",
      deadline,
      note: `Vérifier l'éligibilité CPF — ${input.formation} (${fullName(input)}). Ne pas promettre de validation avant vérification.`
    });
  } else if (input.formation === "Formation entreprise") {
    await repository.createChatTask({
      leadId,
      appointmentId,
      type: "RELANCE",
      priority: "HAUTE",
      deadline,
      note: `Demande entreprise${input.companySize ? ` — ${input.companySize} salariés` : ""} — préparer un devis (${fullName(input)}).`
    });
  }
}

/**
 * Persiste la conversation publique (chaque échange). Round-trip via conversationId :
 * crée la conversation au 1er message, la met à jour ensuite. Calcule l'intention
 * (déterministe, sans coût IA) et le dernier message pour le suivi CRM.
 */
async function persistPublicConversation(
  repository: LodenRepository,
  params: { conversationId?: string; messages: z.infer<typeof messageSchema>["messages"]; reply: string }
): Promise<string> {
  const now = new Date().toISOString();
  const stored = [
    ...params.messages.map((m) => ({ role: m.role, content: m.content, createdAt: now })),
    { role: "assistant" as const, content: params.reply, createdAt: now }
  ];
  const userText = params.messages.filter((m) => m.role === "user").map((m) => m.content).join(" ");
  const lastUser = [...params.messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const { intent, confidence } = classifyIntent(userText);
  const patch = { messages: stored, lastMessage: lastUser.slice(0, 300), intent, aiConfidence: confidence };

  if (params.conversationId) {
    const existing = await repository.findChatConversationById(params.conversationId);
    if (existing) return (await repository.updateChatConversation(params.conversationId, patch)).id;
  }
  return (await repository.createChatConversation(patch)).id;
}

/** Génère et stocke un résumé IA de la conversation (best-effort, non bloquant). */
async function summarizeAndStoreConversation(repository: LodenRepository, ai: AiProvider, conversationId: string): Promise<void> {
  try {
    if (!ai.available) return;
    const conv = await repository.findChatConversationById(conversationId);
    if (!conv || !conv.messages.length) return;
    const text = conv.messages
      .map((m) => `${m.role === "user" ? "Client" : "Assistant"}: ${m.content}`)
      .join("\n")
      .slice(0, 5000);
    const summary = await ai.complete(
      [
        { role: "system", content: SUMMARIZE_SYSTEM },
        { role: "user", content: text }
      ],
      { temperature: 0.2, maxTokens: 300 }
    );
    await repository.updateChatConversation(conversationId, { summary });
  } catch (error) {
    console.error("[chat] résumé conversation échoué:", error instanceof Error ? error.message : error);
  }
}

async function buildPublicReply(repository: LodenRepository, config: ApiConfig, ai: AiProvider, messages: z.infer<typeof messageSchema>["messages"]) {
  const [formations, pricingPlans, agencies, companyInfo] = await Promise.all([
    repository.listFormations(),
    repository.listPricingPlans(),
    repository.listAgencies(),
    repository.getCompanyInfo()
  ]);
  const company = {
    brandName: companyInfo.brandName || undefined,
    address: [companyInfo.address, [companyInfo.postalCode, companyInfo.city].filter(Boolean).join(" ")].filter(Boolean).join(", ") || undefined,
    phone: companyInfo.phone || undefined,
    email: companyInfo.email || undefined,
    hours: companyInfo.hours || undefined
  };

  if (!ai.available) {
    return {
      reply: buildPublicFallbackReply({ messages, formations, pricingPlans, agencies, company: companyInfo, contactPhone: company.phone }),
      mode: "fallback"
    };
  }

  const userMessages: AiMessage[] = messages.map((m) =>
    m.role === "assistant" ? { role: "assistant", content: m.content } : { role: "user", content: m.content }
  );

  try {
    if (ai.name === "groq") {
      const reply = await ai.complete(
        [
          {
            role: "system",
            content: buildCompactPublicAiPrompt({ formations, pricingPlans, agencies, company: companyInfo, contactPhone: company.phone })
          },
          ...userMessages
        ],
        { temperature: 0.3, maxTokens: 260 }
      );
      return { reply: sanitizeAiOutput(reply, config) };
    }

    const reply = await runAgent(ai, {
      systemPrompt: buildPublicAgentSystemPrompt({ formations, pricingPlans, agencies, contactPhone: company.phone ?? "", company }),
      userMessages,
      tools: publicTools,
      context: { repository, config, scope: "public", aiProvider: ai }
    });
    return { reply };
  } catch (error) {
    console.error("[chat] IA publique échouée:", error instanceof Error ? error.message : error);
    return {
      reply: buildPublicFallbackReply({ messages, formations, pricingPlans, agencies, company: companyInfo, contactPhone: company.phone }),
      mode: "fallback"
    };
  }
}

export function createChatRouter(repository: LodenRepository, config: ApiConfig, ai: AiProvider) {
  const router = Router();
  router.use(publicChatLimiter);

  router.post(
    "/message",
    asyncHandler(async (req, res) => {
      const body = validateBody(messageSchema, req);
      const data = await buildPublicReply(repository, config, ai, body.messages);
      let conversationId = body.conversationId;
      try {
        conversationId = await persistPublicConversation(repository, {
          conversationId: body.conversationId,
          messages: body.messages,
          reply: data.reply
        });
      } catch (error) {
        console.error("[chat] persistance conversation échouée:", error instanceof Error ? error.message : error);
      }
      res.json({ data: { ...data, conversationId } });
    })
  );

  router.post(
    "/lead",
    asyncHandler(async (req, res) => {
      const body = validateBody(leadBodySchema, req);
      const lead = await createLeadFromChat(repository, body);
      await createFinancingFollowUpTask(repository, lead.id, body);
      await repository.createAuditLog({
        userId: null,
        action: "chatbot.lead.created",
        entityType: "Lead",
        entityId: lead.id,
        metadata: { source: "chatbot", formation: body.formation, objective: body.objective, financingType: lead.financingType }
      });
      res.status(201).json({ data: { lead } });
    })
  );

  router.post(
    "/appointment",
    asyncHandler(async (req, res) => {
      const body = validateBody(appointmentBodySchema, req);
      const availableSlots = await repository.listChatAvailabilitySlots({ from: new Date(), active: true });
      const slot = availableSlots.find((item) => item.id === body.slotId);
      if (!slot) throw conflict("Ce créneau n'est plus disponible. Choisissez un autre créneau.");
      if (slot.endsAt <= slot.startsAt) throw badRequest("Créneau invalide.");

      const lead = await createLeadFromChat(repository, body);
      const name = fullName(body);
      const date = displayDate(slot.startsAt);
      const time = displayTime(slot.startsAt);
      const whatsappMessage = buildWhatsAppAppointmentText({ formation: body.formation, date, time, fullName: name });

      const appointment = await repository.createChatAppointment({
        leadId: lead.id,
        fullName: name,
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone,
        email: body.email,
        formation: body.formation,
        objective: body.objective,
        message: body.message,
        date,
        time,
        requestedAt: new Date(),
        startsAt: slot.startsAt,
        endsAt: slot.endsAt,
        type: canonicalType(slot.type || body.type),
        status: "pending_confirmation",
        priority: "normal",
        source: "chatbot",
        assignedToId: slot.assignedToId,
        consentContact: body.consentContact,
        consentWhatsApp: body.consentWhatsApp,
        whatsappMessage
      });

      const deadline = new Date(Math.min(slot.startsAt.getTime(), Date.now() + 24 * 60 * 60_000));
      const task = await repository.createChatTask({
        leadId: lead.id,
        appointmentId: appointment.id,
        type: "CONFIRMATION",
        priority: "HAUTE",
        assignedToId: slot.assignedToId,
        deadline,
        note: `Confirmer le rendez-vous chatbot ${body.formation} avec ${name} (${body.phone}).`
      });
      // Tâche de suivi financement (CPF prudent / devis entreprise), en plus de la confirmation.
      await createFinancingFollowUpTask(repository, lead.id, body, appointment.id);

      // Relie la conversation publique déjà persistée (pas de doublon), sinon en crée une.
      let conversationId: string | undefined;
      if (body.conversationId) {
        const existing = await repository.findChatConversationById(body.conversationId);
        if (existing) {
          await repository.updateChatConversation(body.conversationId, {
            leadId: lead.id,
            appointmentId: appointment.id,
            visitorName: name
          });
          conversationId = existing.id;
        }
      }
      if (!conversationId && body.conversation?.length) {
        const created = await repository.createChatConversation({
          leadId: lead.id,
          appointmentId: appointment.id,
          visitorName: name,
          messages: body.conversation.map((message) => ({ ...message, createdAt: new Date().toISOString() }))
        });
        conversationId = created.id;
      }
      if (conversationId) void summarizeAndStoreConversation(repository, ai, conversationId);

      const emailInput = {
        leadId: lead.id,
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
      const [adminEmailStatus, clientEmailStatus, whatsappStatus] = await Promise.all([
        sendChatAppointmentAdminAlert(config, emailInput),
        sendChatAppointmentClientConfirmation(config, emailInput),
        sendWhatsAppMessage(config, { to: body.phone, text: whatsappMessage, consent: body.consentWhatsApp })
      ]);
      const companyInfo = await repository.getCompanyInfo();
      const updatedAppointment = await repository.updateChatAppointment(appointment.id, {
        adminEmailStatus,
        clientEmailStatus,
        whatsappStatus
      });

      await repository.createAuditLog({
        userId: null,
        action: "appointment.created",
        entityType: "Appointment",
        entityId: appointment.id,
        metadata: { leadId: lead.id, taskId: task.id, source: "chatbot" }
      });

      res.status(201).json({
        data: {
          lead,
          appointment: updatedAppointment,
          task,
          whatsapp: {
            message: whatsappMessage,
            url: buildWhatsAppUrl(config, companyInfo.phone, whatsappMessage),
            status: whatsappStatus
          }
        }
      });
    })
  );

  return router;
}

export function createAppointmentsRouter(repository: LodenRepository) {
  const router = Router();

  router.get(
    "/availability",
    asyncHandler(async (req, res) => {
      const query = validateQuery(availabilityQuerySchema, req);
      const from = query.from ?? new Date();
      const to = query.to ?? new Date(Date.now() + 30 * 24 * 60 * 60_000);
      const slots = await repository.listChatAvailabilitySlots({ from, to, agencyId: query.agencyId, active: true });
      res.json({ data: slots.map(mapSlot) });
    })
  );

  return router;
}

export function createChatAdminRouter(repository: LodenRepository, config: ApiConfig) {
  const router = Router();
  router.use(authenticate(repository, config.JWT_SECRET));

  // Leads issus du chatbot. Les rendez-vous sont désormais servis par le module
  // unifié `appointments` (/api/admin/appointments) — source unique de vérité.
  router.get(
    "/leads",
    requirePermission("leads.read"),
    asyncHandler(async (_req, res) => {
      const leads = await repository.listLeads();
      res.json({ data: leads.filter((lead) => lead.source === "chatbot") });
    })
  );

  return router;
}
