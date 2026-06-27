import { Router } from "express";
import { z } from "zod";
import type { ApiConfig } from "../../config/env";
import { authenticate, requirePermission } from "../../middleware/auth";
import type { LodenRepository } from "../../repositories/loden-repository";
import { asyncHandler } from "../../shared/async-handler";
import { validateBody, validateQuery } from "../../shared/validation";

const booleanQuery = z
  .enum(["true", "false"])
  .optional()
  .transform((value) => value === "true");

const listQuery = z.object({
  includeInactive: booleanQuery
});

const formationSchema = z.object({
  title: z.string().trim().min(2),
  slug: z.string().trim().min(2).regex(/^[a-z0-9-]+$/),
  subtitle: z.string().trim().optional(),
  description: z.string().trim().min(10),
  mode: z.enum(["MANUEL", "AUTOMATIQUE", "MIXTE", "CODE"]),
  productLine: z.enum(["AUTO_ECOLE", "VTC", "CACES", "SST", "LOGISTIQUE_SECURITE"]).optional(),
  priceCents: z.number().int().nonnegative(),
  taxMode: z.enum(["TTC", "HT"]).optional(),
  quoteOnly: z.boolean().optional(),
  // Champ interne : modifiable uniquement via l'admin (route protégée catalog.manage).
  internalPriceCents: z.number().int().nonnegative().nullable().optional(),
  durationLabel: z.string().trim().min(2),
  defaultHours: z.number().int().positive().optional(),
  imageUrl: z.string().optional(),
  options: z.record(z.unknown()).optional(),
  tags: z.array(z.string().trim()).optional(),
  cpfEligible: z.boolean().default(false),
  cpfStatus: z.enum(["NON_RENSEIGNE", "NON_ELIGIBLE", "POSSIBLE", "A_CONFIRMER", "ELIGIBLE"]).optional(),
  active: z.boolean().default(true)
});

export function createCatalogRouter(repository: LodenRepository, config: ApiConfig) {
  const router = Router();
  const adminOnly = [authenticate(repository, config.JWT_SECRET), requirePermission("catalog.manage")];

  router.get(
    "/formations",
    asyncHandler(async (req, res) => {
      const query = validateQuery(listQuery, req);
      const formations = await repository.listFormations(query.includeInactive);
      // Confidentialité : le prix interne (base de calcul de devis) ne sort jamais
      // côté public. Il reste géré dans l'admin CRM via des routes protégées.
      const publicFormations = formations.map((formation) => {
        const rest = { ...formation };
        delete rest.internalPriceCents;
        return rest;
      });
      res.json({ data: publicFormations });
    })
  );

  // Lecture ADMIN (protégée) : renvoie les formations complètes, y compris le prix
  // interne (internalPriceCents) que la route publique masque. Inactives incluses.
  router.get(
    "/formations/admin",
    ...adminOnly,
    asyncHandler(async (_req, res) => {
      res.json({ data: await repository.listFormations(true) });
    })
  );

  router.post(
    "/formations",
    ...adminOnly,
    asyncHandler(async (req, res) => {
      const body = validateBody(formationSchema, req);
      const formation = await repository.createFormation(body);
      res.status(201).json({ data: formation });
    })
  );

  router.patch(
    "/formations/:id",
    ...adminOnly,
    asyncHandler(async (req, res) => {
      const body = validateBody(formationSchema.partial(), req);
      const formation = await repository.updateFormation(String(req.params.id), body);
      res.json({ data: formation });
    })
  );

  router.delete(
    "/formations/:id",
    ...adminOnly,
    asyncHandler(async (req, res) => {
      await repository.deleteFormation(String(req.params.id));
      res.status(204).end();
    })
  );

  router.get(
    "/pricing-plans",
    asyncHandler(async (req, res) => {
      const query = validateQuery(listQuery, req);
      res.json({ data: await repository.listPricingPlans(query.includeInactive) });
    })
  );

  router.get(
    "/tarifs",
    asyncHandler(async (req, res) => {
      const query = validateQuery(listQuery, req);
      res.json({ data: await repository.listPricingPlans(query.includeInactive) });
    })
  );

  router.get(
    "/meeting-points",
    asyncHandler(async (_req, res) => {
      res.json({ data: await repository.listMeetingPoints() });
    })
  );

  router.get(
    "/faq",
    asyncHandler(async (_req, res) => {
      res.json({ data: await repository.listFaqEntries() });
    })
  );

  return router;
}
