import { Router } from "express";
import { z } from "zod";
import type { ApiConfig } from "../../config/env";
import type { AiProvider } from "../../ai/types";
import { qualifyLead } from "../../ai/qualify";
import type { LodenRepository } from "../../repositories/loden-repository";
import { asyncHandler } from "../../shared/async-handler";
import { notifyNewLead } from "../../shared/mailer";
import { publicFormLimiter } from "../../shared/rate-limit";
import { emailSchema, phoneSchema, validateBody } from "../../shared/validation";

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
});

export function createInscriptionsRouter(repository: LodenRepository, config: ApiConfig, aiProvider?: AiProvider) {
  const router = Router();

  router.post(
    "/",
    publicFormLimiter(config),
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
        phone: body.phone,
        source: "inscription",
        interest: body.formationTitle,
        notes,
        status: "PROSPECT"
      });

      void notifyNewLead(config, lead);
      void qualifyLead(aiProvider, repository, lead);

      // On ne renvoie que l'id : le formulaire public n'a pas besoin d'en savoir plus.
      res.status(201).json({ data: { id: lead.id } });
    })
  );

  return router;
}
