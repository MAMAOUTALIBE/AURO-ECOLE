import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { buildPublicFallbackReply } from "../../ai/public-fallback";
import type { AiMessage, AiProvider } from "../../ai/types";
import { buildChatGuidance } from "../../ai/conversation-guidance";
import { buildPublicAgentSystemPrompt, buildStudentAgentSystemPrompt } from "../../ai/prompts";
import { buildKnowledgeBlock } from "../../ai/knowledge";
import { runAgent } from "../../ai/agent";
import { publicAgentTools, studentSelfTools } from "../../ai/tools";
import type { ApiConfig } from "../../config/env";
import { authenticate, requirePermission } from "../../middleware/auth";
import type { AuthenticatedRequest } from "../../http/request-context";
import type { LodenRepository } from "../../repositories/loden-repository";
import { asyncHandler } from "../../shared/async-handler";
import { forbidden, notFound } from "../../shared/http-error";
import { emailSchema, phoneSchema, validateBody, validateQuery } from "../../shared/validation";
import { bookChatAppointment, createCallbackAppointment, displayDate, displayTime, listAppointmentSlots } from "./chat-booking";

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

const conversationStatusSchema = z.object({
  status: z.enum(["OUVERTE", "TRAITEE"])
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
): Promise<{ conversationId: string; intent: string; confidence: number; summary: string; suggestions: ReturnType<typeof buildChatGuidance>["suggestions"] }> {
  const now = new Date().toISOString();
  const stored = [
    ...params.messages.map((m) => ({ role: m.role, content: m.content, createdAt: now })),
    { role: "assistant" as const, content: params.reply, createdAt: now }
  ];
  const lastUser = [...params.messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const guidance = buildChatGuidance(params.messages, params.reply);
  const patch = {
    messages: stored,
    lastMessage: lastUser.slice(0, 300),
    intent: guidance.intent,
    aiConfidence: guidance.confidence,
    summary: guidance.summary
  };

  if (params.conversationId) {
    const existing = await repository.findChatConversationById(params.conversationId);
    if (existing) {
      const updated = await repository.updateChatConversation(params.conversationId, patch);
      return { conversationId: updated.id, ...guidance };
    }
  }
  const created = await repository.createChatConversation(patch);
  return { conversationId: created.id, ...guidance };
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
      let guidance: Awaited<ReturnType<typeof persistPublicConversation>> | undefined;
      try {
        guidance = await persistPublicConversation(repository, {
          conversationId: body.conversationId,
          messages: body.messages,
          reply: data.reply
        });
      } catch (error) {
        console.error("[chat] persistance conversation échouée:", error instanceof Error ? error.message : error);
      }
      res.json({
        data: {
          ...data,
          ...(guidance ?? buildChatGuidance(body.messages, data.reply)),
          conversationId: guidance?.conversationId ?? body.conversationId
        }
      });
    })
  );

  router.post(
    "/lead",
    asyncHandler(async (req, res) => {
      const body = validateBody(leadBodySchema, req);
      // Coordonnées sans créneau → RDV « À rappeler » dans le Centre RDV (pas un lead pipeline).
      const { lead, appointment } = await createCallbackAppointment(repository, body);
      await repository.createAuditLog({
        userId: null,
        action: "chatbot.callback.created",
        entityType: "Appointment",
        entityId: appointment.id,
        metadata: { source: "chatbot", leadId: lead.id, formation: body.formation, objective: body.objective }
      });
      res.status(201).json({ data: { lead, appointment } });
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

  // Assistant ESPACE ÉLÈVE : élève connecté, lecture seule sur SON dossier (studentId = session).
  router.post(
    "/student",
    authenticate(repository, config.JWT_SECRET),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      if (!req.user) throw forbidden("Connexion requise.");
      const student = await repository.findStudentByUserId(req.user.id);
      if (!student) throw forbidden("Espace élève requis.");
      const body = validateBody(messageSchema, req);
      const user = await repository.findUserById(req.user.id);
      if (!ai.available) {
        res.json({ data: { reply: "L'assistant est momentanément indisponible. Un conseiller LODENE peut vous aider au 06 60 32 50 87.", mode: "fallback" } });
        return;
      }
      const userMessages: AiMessage[] = body.messages.map((m) =>
        m.role === "assistant" ? { role: "assistant", content: m.content } : { role: "user", content: m.content }
      );
      try {
        const reply = await runAgent(ai, {
          systemPrompt: buildStudentAgentSystemPrompt({ firstName: user?.firstName }),
          userMessages,
          tools: studentSelfTools,
          context: { repository, config, scope: "student", actorUserId: req.user.id, studentId: student.id, aiProvider: ai },
          maxSteps: 3
        });
        res.json({ data: { reply } });
      } catch (error) {
        console.error("[chat] assistant élève échoué:", error instanceof Error ? error.message : error);
        res.json({ data: { reply: "Désolé, je n'ai pas pu récupérer votre dossier à l'instant. Réessayez, ou contactez le 06 60 32 50 87.", mode: "fallback" } });
      }
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

  router.patch(
    "/chat-conversations/:id",
    requirePermission("leads.read"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const body = validateBody(conversationStatusSchema, req);
      const conversation = await repository.findChatConversationById(String(req.params.id));
      if (!conversation) throw notFound("Conversation introuvable");
      const updated = await repository.updateChatConversation(conversation.id, { status: body.status });
      await repository.createAuditLog({
        userId: req.user?.id ?? null,
        action: "chatbot.conversation.status_updated",
        entityType: "ChatConversation",
        entityId: conversation.id,
        metadata: { status: body.status }
      });
      res.json({ data: updated });
    })
  );

  return router;
}
