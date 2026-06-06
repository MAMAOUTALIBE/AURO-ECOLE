import { Router } from "express";
import { z } from "zod";
import type { ApiConfig } from "../../config/env";
import { authenticate, requireRoles } from "../../middleware/auth";
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
  description: z.string().trim().min(10),
  mode: z.enum(["MANUEL", "AUTOMATIQUE", "MIXTE", "CODE"]),
  priceCents: z.number().int().nonnegative(),
  durationLabel: z.string().trim().min(2),
  defaultHours: z.number().int().positive().optional(),
  imageUrl: z.string().optional(),
  options: z.record(z.unknown()).optional(),
  cpfEligible: z.boolean().default(false),
  active: z.boolean().default(true)
});

export function createCatalogRouter(repository: LodenRepository, config: ApiConfig) {
  const router = Router();
  const adminOnly = [authenticate(repository, config.JWT_SECRET), requireRoles("SUPER_ADMIN", "ADMIN")];

  router.get(
    "/formations",
    asyncHandler(async (req, res) => {
      const query = validateQuery(listQuery, req);
      res.json({ data: await repository.listFormations(query.includeInactive) });
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
