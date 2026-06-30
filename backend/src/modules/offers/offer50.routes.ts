import { Router } from "express";
import { z } from "zod";
import type { ApiConfig } from "../../config/env";
import type { AiProvider } from "../../ai/types";
import { qualifyLead } from "../../ai/qualify";
import { runAutomations } from "../../automations/engine";
import type { LodenRepository } from "../../repositories/loden-repository";
import { asyncHandler } from "../../shared/async-handler";
import { notifyNewLead } from "../../shared/mailer";
import { publicFormLimiter } from "../../shared/rate-limit";
import { emailSchema, validateBody } from "../../shared/validation";

const OFFER_CODE = "LODENE50";
const OFFER_SOURCE = "QR_OFFRE_50";

const leadSchema = z.object({
  fullName: z.string().trim().min(2),
  email: emailSchema,
  phone: z.string().trim().min(8).max(30),
  formation: z.string().trim().min(2).max(120),
  preferredContact: z.enum(["Téléphone", "WhatsApp", "Email"]).default("Téléphone"),
  message: z.string().trim().max(800).optional(),
  code: z.literal(OFFER_CODE),
  consentContact: z.literal(true),
  consentWhatsapp: z.boolean().default(false)
});

const eventSchema = z.object({
  event: z.enum(["qr_offer_page_view", "qr_offer_site_click", "qr_offer_voucher_download", "qr_offer_lead_submit", "qr_offer_whatsapp_click"]),
  code: z.literal(OFFER_CODE),
  target: z.string().trim().max(240).optional()
});

export function createOffer50Router(repository: LodenRepository, config: ApiConfig, aiProvider?: AiProvider) {
  const router = Router();

  router.post(
    "/leads",
    publicFormLimiter(config),
    asyncHandler(async (req, res) => {
      const body = validateBody(leadSchema, req);
      const notes = [
        "Campagne QR Offre -50€",
        `Code promo: ${OFFER_CODE}`,
        `Source: ${OFFER_SOURCE}`,
        `Formation souhaitée: ${body.formation}`,
        `Canal préféré: ${body.preferredContact}`,
        `Consentement recontact: oui`,
        `Consentement WhatsApp: ${body.consentWhatsapp ? "oui" : "non"}`,
        body.message ? `Commentaire prospect: ${body.message}` : null,
        "Page: /offre-50?code=LODENE50"
      ]
        .filter(Boolean)
        .join("\n");

      const contact = await repository.createContactRequest({
        fullName: body.fullName,
        email: body.email,
        phone: body.phone,
        type: "INSCRIPTION",
        source: OFFER_SOURCE,
        message: notes
      });

      const lead = await repository.createLead({
        fullName: body.fullName,
        email: body.email,
        phone: body.phone,
        source: OFFER_SOURCE,
        interest: body.formation,
        notes,
        status: "PROSPECT",
        temperature: "chaud",
        score: 80,
        consentEmail: true,
        consentWhatsapp: body.consentWhatsapp
      });

      void repository.createAuditLog({
        userId: null,
        action: "qr_offer_lead_submit",
        entityType: "Lead",
        entityId: lead.id,
        metadata: { source: OFFER_SOURCE, code: OFFER_CODE, formation: body.formation, contactRequestId: contact.id }
      });
      void notifyNewLead(config, lead);
      void qualifyLead(aiProvider, repository, lead);
      void runAutomations(repository, config, "LEAD_CREATED", { entityType: "Lead", entityId: lead.id, email: lead.email, name: lead.fullName });

      res.status(201).json({
        data: {
          contact,
          lead,
          promo: { code: OFFER_CODE, source: OFFER_SOURCE }
        }
      });
    })
  );

  router.post(
    "/events",
    publicFormLimiter(config),
    asyncHandler(async (req, res) => {
      const body = validateBody(eventSchema, req);
      await repository.createAuditLog({
        userId: null,
        action: body.event,
        entityType: "QrOfferCampaign",
        entityId: OFFER_CODE,
        metadata: { source: OFFER_SOURCE, code: OFFER_CODE, target: body.target ?? null }
      });
      res.status(201).json({ data: { tracked: true } });
    })
  );

  return router;
}
