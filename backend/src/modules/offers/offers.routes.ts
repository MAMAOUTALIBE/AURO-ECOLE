import { Router } from "express";
import { z } from "zod";
import type { ApiConfig } from "../../config/env";
import type { AiProvider } from "../../ai/types";
import { qualifyLead } from "../../ai/qualify";
import type { LodenRepository } from "../../repositories/loden-repository";
import { asyncHandler } from "../../shared/async-handler";
import { conflict, forbidden } from "../../shared/http-error";
import { notifyNewLead, sendOffer50VoucherEmail } from "../../shared/mailer";
import { honeypotGuard } from "../../shared/anti-spam";
import { publicFormLimiter } from "../../shared/rate-limit";
import { emailSchema, validateBody } from "../../shared/validation";
import { buildWhatsAppUrl, sendWhatsAppMessage } from "../../shared/whatsapp";

const OFFER_50_CODE = "LODENE50";
const OFFER_50_SOURCE = "QR_CODE_OFFRE_50";
const VOUCHER_PATH = "/offre-50/bon50.jpeg";
const OFFER_50_FORMATION = "PERMIS_B";
const OFFER_50_FORMATION_LABEL = "Permis B";

const deliveryLabels = {
  EMAIL: "Email",
  WHATSAPP: "WhatsApp",
  BOTH: "Email et WhatsApp"
} as const;

const conversationMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(2000)
});

const offerLeadSchema = z
  .object({
    code: z.string().trim(),
    fullName: z.string().trim().min(2).max(180).optional(),
    firstName: z.string().trim().min(1).max(80).optional(),
    lastName: z.string().trim().min(1).max(100).optional(),
    phone: z.string().trim().min(8).max(30),
    email: emailSchema,
    formation: z.literal(OFFER_50_FORMATION).default(OFFER_50_FORMATION),
    delivery: z.enum(["EMAIL", "WHATSAPP", "BOTH"]),
    origin: z.enum(["PAGE_QR", "ASSISTANT_IA"]).default("PAGE_QR"),
    conversation: z.array(conversationMessageSchema).max(12).optional(),
    conversationId: z.string().trim().min(1).max(60).optional(),
    consent: z.literal(true)
  })
  .superRefine((value, ctx) => {
    if (value.fullName || (value.firstName && value.lastName)) return;
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Le nom complet est requis.",
      path: ["fullName"]
    });
  });

function normalizePhoneForCompare(phone?: string | null) {
  return phone?.replace(/\D/g, "") ?? "";
}

function hasOffer50Marker(notes?: string | null) {
  return notes?.includes(`Code promo: ${OFFER_50_CODE}`) ?? false;
}

function buildOffer50Notes(input: {
  formationLabel: string;
  deliveryLabel: string;
  voucherUrl: string;
  originLabel: string;
}) {
  return [
    "Campagne: Offre QR Code -50 €",
    `Source: ${OFFER_50_SOURCE}`,
    `Canal: ${input.originLabel}`,
    `Code promo: ${OFFER_50_CODE}`,
    `Formation souhaitée: ${input.formationLabel}`,
    `Envoi demandé: ${input.deliveryLabel}`,
    `Bon: ${input.voucherUrl}`,
    "Statut bon: ENVOYE",
    "Consentement RGPD: oui"
  ].join("\n");
}

function splitFullName(fullName: string) {
  const normalized = fullName.trim().replace(/\s+/g, " ");
  const [firstName = normalized, ...rest] = normalized.split(" ");
  return {
    fullName: normalized,
    firstName,
    lastName: rest.join(" ") || "Non renseigné"
  };
}

function resolveName(input: z.infer<typeof offerLeadSchema>) {
  if (input.fullName) return splitFullName(input.fullName);
  const firstName = (input.firstName ?? "").trim();
  const lastName = (input.lastName ?? "").trim();
  return {
    fullName: `${firstName} ${lastName}`.trim().replace(/\s+/g, " "),
    firstName,
    lastName
  };
}

function formatLocalDateTime(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return {
    date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    time: `${pad(date.getHours())}:${pad(date.getMinutes())}`
  };
}

async function linkOfferConversation(
  repository: LodenRepository,
  input: {
    leadId: string;
    appointmentId: string;
    visitorName: string;
    conversationId?: string;
    conversation?: z.infer<typeof conversationMessageSchema>[];
  }
) {
  if (input.conversationId) {
    const existing = await repository.findChatConversationById(input.conversationId);
    if (existing) {
      const updated = await repository.updateChatConversation(input.conversationId, {
        leadId: input.leadId,
        appointmentId: input.appointmentId,
        visitorName: input.visitorName
      });
      return updated.id;
    }
  }

  if (input.conversation?.length) {
    const created = await repository.createChatConversation({
      leadId: input.leadId,
      appointmentId: input.appointmentId,
      visitorName: input.visitorName,
      messages: input.conversation.map((message) => ({ ...message, createdAt: new Date().toISOString() })),
      intent: "offre_50",
      summary: "Demande du bon de réduction -50 € depuis l'assistant LODENE."
    });
    return created.id;
  }

  return undefined;
}

function buildWhatsAppOfferText(firstName: string, voucherUrl: string) {
  return [
    `Bonjour ${firstName},`,
    "",
    `Merci pour votre inscription. Voici votre bon de réduction de 50 € avec le code : ${OFFER_50_CODE}.`,
    `Bon : ${voucherUrl}`,
    "",
    "Présentez ce bon lors de votre inscription chez LODENE Formation.",
    "Offre valable une seule fois par personne, non cumulable avec une autre promotion."
  ].join("\n");
}

export function createOffersRouter(repository: LodenRepository, config: ApiConfig, aiProvider?: AiProvider) {
  const router = Router();

  router.post(
    "/qr-50",
    publicFormLimiter(config),
    honeypotGuard,
    asyncHandler(async (req, res) => {
      const body = validateBody(offerLeadSchema, req);
      if (body.code !== OFFER_50_CODE) {
        throw forbidden("Code promo invalide.");
      }

      const normalizedPhone = normalizePhoneForCompare(body.phone);
      const existingByEmail = await repository.findLeadByEmail(body.email);
      if (
        existingByEmail &&
        (existingByEmail.source === OFFER_50_SOURCE || hasOffer50Marker(existingByEmail.notes))
      ) {
        throw conflict("Un bon de réduction a déjà été demandé avec cet email.");
      }

      const leads = await repository.listLeads();
      const existingByPhone = leads.find(
        (lead) =>
          normalizePhoneForCompare(lead.phone) === normalizedPhone &&
          (lead.source === OFFER_50_SOURCE || hasOffer50Marker(lead.notes))
      );
      if (existingByPhone) {
        throw conflict("Un bon de réduction a déjà été demandé avec ce téléphone.");
      }

      const voucherUrl = new URL(VOUCHER_PATH, config.appBaseUrl).toString();
      const formationLabel = OFFER_50_FORMATION_LABEL;
      const deliveryLabel = deliveryLabels[body.delivery];
      const originLabel = body.origin === "ASSISTANT_IA" ? "Assistant IA" : "Page QR code";
      const { fullName, firstName, lastName } = resolveName(body);
      const notes = buildOffer50Notes({ formationLabel, deliveryLabel, voucherUrl, originLabel });

      const lead = await repository.createLead({
        fullName,
        firstName,
        lastName,
        email: body.email,
        phone: body.phone,
        source: OFFER_50_SOURCE,
        interest: formationLabel,
        financingType: "OFFRE_50",
        notes,
        status: "PROSPECT",
        consentEmail: body.delivery === "EMAIL" || body.delivery === "BOTH",
        consentWhatsapp: body.delivery === "WHATSAPP" || body.delivery === "BOTH"
      });

      const now = new Date();
      const { date, time } = formatLocalDateTime(now);
      const appointment = await repository.createChatAppointment({
        leadId: lead.id,
        fullName,
        firstName,
        lastName,
        phone: body.phone,
        email: body.email,
        formation: formationLabel,
        objective: "Récupérer le bon -50 €",
        message: `Demande du bon LODENE50 depuis ${originLabel}.`,
        notes,
        date,
        time,
        requestedAt: now,
        startsAt: now,
        endsAt: new Date(now.getTime() + 30 * 60_000),
        type: "registration",
        status: "new",
        priority: "high",
        source: "chatbot",
        consentContact: true,
        consentWhatsApp: body.delivery === "WHATSAPP" || body.delivery === "BOTH"
      });

      const task = await repository.createChatTask({
        leadId: lead.id,
        appointmentId: appointment.id,
        type: "RELANCE",
        priority: "HAUTE",
        deadline: new Date(Date.now() + 24 * 60 * 60_000),
        note: `Rappeler ${fullName} (${body.phone}) — bon -50 € LODENE50 · ${formationLabel}.`
      });

      const conversationId = await linkOfferConversation(repository, {
        leadId: lead.id,
        appointmentId: appointment.id,
        visitorName: fullName,
        conversationId: body.conversationId,
        conversation: body.conversation
      });

      const emailStatus =
        body.delivery === "EMAIL" || body.delivery === "BOTH"
          ? await sendOffer50VoucherEmail(config, {
              to: body.email,
              firstName,
              voucherUrl,
              code: OFFER_50_CODE
            })
          : "skipped";

      const whatsappText = buildWhatsAppOfferText(firstName, voucherUrl);
      const whatsappStatus =
        body.delivery === "WHATSAPP" || body.delivery === "BOTH"
          ? await sendWhatsAppMessage(config, {
              to: body.phone,
              text: whatsappText,
              consent: true
            })
          : "skipped";

      void notifyNewLead(config, lead);
      void qualifyLead(aiProvider, repository, lead);
      void repository.createAuditLog({
        userId: null,
        action: "offer50.lead.created",
        entityType: "Appointment",
        entityId: appointment.id,
        metadata: {
          leadId: lead.id,
          taskId: task.id,
          conversationId,
          source: OFFER_50_SOURCE,
          promoCode: OFFER_50_CODE,
          origin: body.origin,
          delivery: body.delivery,
          emailStatus,
          whatsappStatus
        }
      });

      res.status(201).json({
        data: {
          leadId: lead.id,
          appointmentId: appointment.id,
          conversationId,
          code: OFFER_50_CODE,
          source: OFFER_50_SOURCE,
          voucherUrl,
          emailStatus,
          whatsappStatus,
          whatsappUrl: buildWhatsAppUrl(
            config,
            "33660325087",
            "Bonjour LODENE, je viens de m'inscrire via l'offre QR code et je souhaite recevoir mon bon de réduction de 50 €."
          )
        }
      });
    })
  );

  return router;
}
