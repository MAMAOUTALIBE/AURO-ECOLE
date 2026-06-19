import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { buildPublicFallbackReply } from "../../ai/public-fallback";
import type { AiMessage, AiProvider } from "../../ai/types";
import { buildPublicAgentSystemPrompt } from "../../ai/prompts";
import { buildKnowledgeBlock } from "../../ai/knowledge";
import { classifyIntent } from "../../ai/intent";
import { runAgent } from "../../ai/agent";
import { publicAgentTools } from "../../ai/tools";
import type { ApiConfig } from "../../config/env";
import { authenticate, requirePermission } from "../../middleware/auth";
import type { LodenRepository } from "../../repositories/loden-repository";
import { asyncHandler } from "../../shared/async-handler";
import { emailSchema, phoneSchema, validateBody, validateQuery } from "../../shared/validation";
import { bookChatAppointment, createFinancingFollowUpTask, createLeadFromChat, displayDate, displayTime, listAppointmentSlots } from "./chat-booking";

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

  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const knowledge = buildKnowledgeBlock(lastUser, 2);
  const availableSlots = await listAppointmentSlots(repository);

  try {
    // Agent à outils (Groq inclus) : l'IA peut chercher dans la base de connaissance,
    // proposer des créneaux et RÉSERVER, créer un lead/devis, générer un lien WhatsApp.
    const reply = await runAgent(ai, {
      systemPrompt: buildPublicAgentSystemPrompt({ formations, pricingPlans, agencies, contactPhone: company.phone ?? "", company, knowledge, availableSlots }),
      userMessages,
      tools: publicAgentTools,
      context: { repository, config, scope: "public", aiProvider: ai },
      maxSteps: 3
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
      const result = await bookChatAppointment(repository, config, ai, body);
      res.status(201).json({ data: result });
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
