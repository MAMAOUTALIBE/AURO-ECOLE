import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { buildCompactPublicAiPrompt, buildPublicFallbackReply } from "../../ai/public-fallback";
import type { AiMessage, AiProvider } from "../../ai/types";
import { buildPublicAgentSystemPrompt } from "../../ai/prompts";
import { runAgent } from "../../ai/agent";
import { publicTools } from "../../ai/tools";
import type { ApiConfig } from "../../config/env";
import type { AuthenticatedRequest } from "../../http/request-context";
import { authenticate, requirePermission } from "../../middleware/auth";
import type { LodenRepository } from "../../repositories/loden-repository";
import { asyncHandler } from "../../shared/async-handler";
import { badRequest, conflict, notFound } from "../../shared/http-error";
import { sendChatAppointmentAdminAlert, sendChatAppointmentClientConfirmation } from "../../shared/mailer";
import { buildWhatsAppAppointmentText, buildWhatsAppUrl, sendWhatsAppMessage } from "../../shared/whatsapp";
import { emailSchema, phoneSchema, validateBody, validateQuery } from "../../shared/validation";

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
    .max(12)
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
  consentContact: z.literal(true),
  consentWhatsApp: z.boolean().default(false)
});

const appointmentBodySchema = leadBodySchema.extend({
  slotId: z.string().trim().min(1),
  type: z.enum(["APPEL", "AGENCE", "VISIO", "DEVIS", "INSCRIPTION"]).default("APPEL"),
  conversation: messageSchema.shape.messages.optional()
});

const availabilityQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  agencyId: z.string().trim().optional()
});

const adminAppointmentQuerySchema = z.object({
  status: z.enum(["A_CONFIRMER", "CONFIRME", "TRAITE", "ANNULE"]).optional()
});

const updateAppointmentSchema = z.object({
  status: z.enum(["A_CONFIRMER", "CONFIRME", "TRAITE", "ANNULE"]),
  assignedToId: z.string().trim().optional()
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
  return repository.createLead({
    fullName: fullName(input),
    email: input.email,
    phone: input.phone,
    status: "PROSPECT",
    source: "chatbot",
    interest: input.formation,
    notes: [
      `Objectif : ${input.objective}`,
      input.message ? `Message : ${input.message}` : null,
      `Consentement contact : ${input.consentContact ? "oui" : "non"}`,
      `Consentement WhatsApp : ${input.consentWhatsApp ? "oui" : "non"}`
    ].filter(Boolean).join("\n"),
    temperature: "chaud"
  });
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
      return { reply };
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
      res.json({ data });
    })
  );

  router.post(
    "/lead",
    asyncHandler(async (req, res) => {
      const body = validateBody(leadBodySchema, req);
      const lead = await createLeadFromChat(repository, body);
      await repository.createAuditLog({
        userId: null,
        action: "chatbot.lead.created",
        entityType: "Lead",
        entityId: lead.id,
        metadata: { source: "chatbot", formation: body.formation, objective: body.objective }
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
        startsAt: slot.startsAt,
        endsAt: slot.endsAt,
        type: slot.type || body.type,
        status: "A_CONFIRMER",
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

      if (body.conversation?.length) {
        await repository.createChatConversation({
          leadId: lead.id,
          appointmentId: appointment.id,
          visitorName: name,
          messages: body.conversation.map((message) => ({ ...message, createdAt: new Date().toISOString() }))
        });
      }

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
        action: "chatbot.appointment.created",
        entityType: "ChatAppointment",
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

  router.get(
    "/leads",
    requirePermission("leads.read"),
    asyncHandler(async (_req, res) => {
      const leads = await repository.listLeads();
      res.json({ data: leads.filter((lead) => lead.source === "chatbot") });
    })
  );

  router.get(
    "/appointments",
    requirePermission("leads.read"),
    asyncHandler(async (req, res) => {
      const query = validateQuery(adminAppointmentQuerySchema, req);
      const [appointments, tasks, conversations, leads] = await Promise.all([
        repository.listChatAppointments(query),
        repository.listChatTasks(),
        repository.listChatConversations(),
        repository.listLeads()
      ]);
      res.json({
        data: {
          appointments,
          tasks,
          conversations,
          leads: leads.filter((lead) => lead.source === "chatbot")
        }
      });
    })
  );

  router.patch(
    "/appointments/:id",
    requirePermission("leads.manage"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const body = validateBody(updateAppointmentSchema, req);
      const appointment = await repository.findChatAppointmentById(String(req.params.id));
      if (!appointment) throw notFound("Rendez-vous chatbot introuvable");
      const updated = await repository.updateChatAppointment(appointment.id, body);
      await repository.createAuditLog({
        userId: req.user?.id ?? null,
        action: "chatbot.appointment.status",
        entityType: "ChatAppointment",
        entityId: updated.id,
        metadata: { status: body.status }
      });
      res.json({ data: updated });
    })
  );

  return router;
}
