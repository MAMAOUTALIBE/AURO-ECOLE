import { Router } from "express";
import { z } from "zod";
import type { ApiConfig } from "../../config/env";
import type { AiProvider } from "../../ai/types";
import { qualifyLead } from "../../ai/qualify";
import type { LodenRepository } from "../../repositories/loden-repository";
import { asyncHandler } from "../../shared/async-handler";
import { conflict, forbidden } from "../../shared/http-error";
import { notifyNewLead, sendOffer50VoucherEmail } from "../../shared/mailer";
import { publicFormLimiter } from "../../shared/rate-limit";
import { emailSchema, validateBody } from "../../shared/validation";
import { buildWhatsAppUrl, sendWhatsAppMessage } from "../../shared/whatsapp";

const OFFER_50_CODE = "LODENE50";
const OFFER_50_SOURCE = "QR_CODE_OFFRE_50";
const VOUCHER_PATH = "/offre-50/bon_reduction_50_propre.png";

const formationLabels = {
  PERMIS_B: "Permis B",
  VTC: "VTC",
  SST: "SST",
  LOGISTIQUE: "Logistique",
  SECURITE: "Sécurité",
  AUTRE: "Autre"
} as const;

const deliveryLabels = {
  EMAIL: "Email",
  WHATSAPP: "WhatsApp",
  BOTH: "Email et WhatsApp"
} as const;

const offerLeadSchema = z.object({
  code: z.string().trim(),
  firstName: z.string().trim().min(2),
  lastName: z.string().trim().min(2),
  phone: z.string().trim().min(8).max(30),
  email: emailSchema,
  formation: z.enum(["PERMIS_B", "VTC", "SST", "LOGISTIQUE", "SECURITE", "AUTRE"]),
  delivery: z.enum(["EMAIL", "WHATSAPP", "BOTH"]),
  consent: z.literal(true)
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
}) {
  return [
    "Campagne: Offre QR Code -50 €",
    `Source: ${OFFER_50_SOURCE}`,
    `Code promo: ${OFFER_50_CODE}`,
    `Formation souhaitée: ${input.formationLabel}`,
    `Envoi demandé: ${input.deliveryLabel}`,
    `Bon: ${input.voucherUrl}`,
    "Statut bon: ENVOYE",
    "Consentement RGPD: oui"
  ].join("\n");
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
      const formationLabel = formationLabels[body.formation];
      const deliveryLabel = deliveryLabels[body.delivery];
      const fullName = `${body.firstName} ${body.lastName}`.trim();
      const notes = buildOffer50Notes({ formationLabel, deliveryLabel, voucherUrl });

      const lead = await repository.createLead({
        fullName,
        firstName: body.firstName,
        lastName: body.lastName,
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

      const emailStatus =
        body.delivery === "EMAIL" || body.delivery === "BOTH"
          ? await sendOffer50VoucherEmail(config, {
              to: body.email,
              firstName: body.firstName,
              voucherUrl,
              code: OFFER_50_CODE
            })
          : "skipped";

      const whatsappText = buildWhatsAppOfferText(body.firstName, voucherUrl);
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
        entityType: "Lead",
        entityId: lead.id,
        metadata: {
          source: OFFER_50_SOURCE,
          promoCode: OFFER_50_CODE,
          delivery: body.delivery,
          emailStatus,
          whatsappStatus
        }
      });

      res.status(201).json({
        data: {
          leadId: lead.id,
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
