import { Router } from "express";
import { z } from "zod";
import type { ApiConfig } from "../../config/env";
import type { AiProvider } from "../../ai/types";
import { qualifyLead } from "../../ai/qualify";
import type { LodenRepository } from "../../repositories/loden-repository";
import { asyncHandler } from "../../shared/async-handler";
import { notifyNewLead } from "../../shared/mailer";
import { honeypotGuard } from "../../shared/anti-spam";
import { publicFormLimiter } from "../../shared/rate-limit";
import { attributionSchema, emailSchema, phoneSchema, pickAttribution, validateBody } from "../../shared/validation";

// Formulaire d'inscription public SIMPLIFIÉ : le visiteur laisse ses coordonnées et la
// formation souhaitée. On ne crée AUCUN compte élève ici. La demande atterrit dans le
// pipeline commercial (Lead, source="inscription") pour que l'équipe rappelle la personne,
// complète l'inscription puis crée le compte élève depuis le CRM (bouton "Créer le compte").
const inscriptionSchema = z.object({
  firstName: z.string().trim().min(2),
  lastName: z.string().trim().min(2),
  email: emailSchema,
  phone: phoneSchema,
  formationTitle: z.string().trim().min(2),
  formationSlug: z.string().trim().optional(),
  message: z.string().trim().max(1000).optional()
}).merge(attributionSchema);

export function createInscriptionsRouter(repository: LodenRepository, config: ApiConfig, aiProvider?: AiProvider) {
  const router = Router();

  router.post(
    "/",
    publicFormLimiter(config),
    honeypotGuard,
    asyncHandler(async (req, res) => {
      const body = validateBody(inscriptionSchema, req);
      const fullName = `${body.firstName} ${body.lastName}`.trim();
      const notes = [
        `Demande d'inscription : ${body.formationTitle}`,
        body.formationSlug ? `Formation (slug): ${body.formationSlug}` : null,
        body.message ? `Message: ${body.message}` : null
      ]
        .filter(Boolean)
        .join("\n");

      const lead = await repository.createLead({
        fullName,
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone ?? "Non renseigné",
        source: "inscription",
        interest: body.formationTitle,
        notes,
        status: "PROSPECT",
        ...pickAttribution(body)
      });

      // Crée aussi un RDV « inscription » (type=registration, statut Nouveau, sans moniteur)
      // afin que la demande apparaisse dans le Centre RDV. Elle basculera dans le Planning
      // dès qu'un moniteur + un créneau lui seront assignés depuis le CRM.
      const now = new Date();
      const pad = (value: number) => String(value).padStart(2, "0");
      const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
      const endsAt = new Date(now.getTime() + 30 * 60_000);

      await repository.createChatAppointment({
        leadId: lead.id,
        fullName,
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone ?? "Non renseigné",
        email: body.email,
        formation: body.formationTitle,
        objective: "Inscription",
        message: body.message,
        date,
        time,
        requestedAt: now,
        startsAt: now,
        endsAt,
        type: "registration",
        status: "new",
        source: "manual",
        consentContact: true,
        consentWhatsApp: false
      });

      void notifyNewLead(config, lead);
      void qualifyLead(aiProvider, repository, lead);

      // On ne renvoie que l'id : le formulaire public n'a pas besoin d'en savoir plus.
      res.status(201).json({ data: { id: lead.id } });
    })
  );

  return router;
}
