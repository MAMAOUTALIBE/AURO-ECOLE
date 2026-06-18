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

// Champs société éditables (tous optionnels, vides autorisés). id/updatedAt gérés serveur.
const companyUpdateSchema = z.object({
  brandName: z.string().trim().max(120).optional(),
  legalName: z.string().trim().max(160).optional(),
  address: z.string().trim().max(200).optional(),
  postalCode: z.string().trim().max(20).optional(),
  city: z.string().trim().max(120).optional(),
  country: z.string().trim().max(80).optional(),
  siret: z.string().trim().max(20).optional(),
  approvalNumber: z.string().trim().max(40).optional(),
  phone: z.string().trim().max(40).optional(),
  email: z.string().trim().max(160).optional(),
  hours: z.string().trim().max(200).optional(),
  legalForm: z.string().trim().max(120).optional(),
  capital: z.string().trim().max(60).optional(),
  publicationDirector: z.string().trim().max(120).optional(),
  hostingProvider: z.string().trim().max(300).optional(),
  instagram: z.string().trim().max(300).optional(),
  facebook: z.string().trim().max(300).optional(),
  tiktok: z.string().trim().max(300).optional(),
  youtube: z.string().trim().max(300).optional()
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

  // Informations société : lecture publique, édition réservée (content.manage).
  // Défini AVANT /:id pour ne pas être capturé par la route paramétrée.
  router.get(
    "/company",
    asyncHandler(async (_req, res) => {
      res.json({ data: await repository.getCompanyInfo() });
    })
  );

  router.patch(
    "/company",
    ...adminOnly,
    asyncHandler(async (req, res) => {
      const body = validateBody(companyUpdateSchema, req);
      const data = await repository.updateCompanyInfo(body);
      res.json({ data });
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
