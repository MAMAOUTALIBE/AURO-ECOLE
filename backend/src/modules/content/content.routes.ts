import { Router } from "express";
import { z } from "zod";
import type { ApiConfig } from "../../config/env";
import { authenticate, requirePermission } from "../../middleware/auth";
import type { LodenRepository } from "../../repositories/loden-repository";
import { asyncHandler } from "../../shared/async-handler";
import { validateBody } from "../../shared/validation";

const faqSchema = z.object({
  question: z.string().trim().min(5),
  answer: z.string().trim().min(5),
  category: z.string().trim().optional(),
  active: z.boolean().default(true)
});

const faqUpdateSchema = z.object({
  question: z.string().trim().min(5).optional(),
  answer: z.string().trim().min(5).optional(),
  category: z.string().trim().optional(),
  active: z.boolean().optional()
});

export function createContentRouter(repository: LodenRepository, config: ApiConfig) {
  const router = Router();
  const adminOnly = [authenticate(repository, config.JWT_SECRET), requirePermission("content.manage")];

  // Public : FAQ active (alimente le site).
  router.get(
    "/",
    asyncHandler(async (_req, res) => {
      res.json({ data: await repository.listFaqEntries() });
    })
  );

  // Admin : toutes les entrées (actives + inactives).
  router.get(
    "/manage",
    ...adminOnly,
    asyncHandler(async (_req, res) => {
      res.json({ data: await repository.listFaqEntries(true) });
    })
  );

  router.post(
    "/",
    ...adminOnly,
    asyncHandler(async (req, res) => {
      const body = validateBody(faqSchema, req);
      const entry = await repository.createFaqEntry(body);
      res.status(201).json({ data: entry });
    })
  );

  router.patch(
    "/:id",
    ...adminOnly,
    asyncHandler(async (req, res) => {
      const body = validateBody(faqUpdateSchema, req);
      const entry = await repository.updateFaqEntry(String(req.params.id), body);
      res.json({ data: entry });
    })
  );

  router.delete(
    "/:id",
    ...adminOnly,
    asyncHandler(async (req, res) => {
      await repository.deleteFaqEntry(String(req.params.id));
      res.status(204).end();
    })
  );

  return router;
}
