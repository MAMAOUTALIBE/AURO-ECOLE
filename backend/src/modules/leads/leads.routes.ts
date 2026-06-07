import { Router } from "express";
import { z } from "zod";
import type { ApiConfig } from "../../config/env";
import type { AiProvider } from "../../ai/types";
import { qualifyLead } from "../../ai/qualify";
import { authenticate, requirePermission } from "../../middleware/auth";
import type { LodenRepository } from "../../repositories/loden-repository";
import { asyncHandler } from "../../shared/async-handler";
import { notifyNewLead } from "../../shared/mailer";
import { emailSchema, phoneSchema, validateBody, validateQuery } from "../../shared/validation";

const leadStatusSchema = z.enum(["PROSPECT", "CONTACTE", "RELANCE", "DEVIS_ENVOYE", "INSCRIT", "PERDU"]);

const leadQuerySchema = z.object({
  status: leadStatusSchema.optional(),
  agencyId: z.string().trim().optional()
});

const leadCreateSchema = z.object({
  fullName: z.string().trim().min(2),
  email: emailSchema,
  phone: phoneSchema,
  status: leadStatusSchema.default("PROSPECT"),
  source: z.string().trim().optional(),
  interest: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  estimatedValueCents: z.number().int().nonnegative().optional(),
  nextFollowUpAt: z.coerce.date().optional()
});

const leadStatusUpdateSchema = z.object({
  status: leadStatusSchema,
  notes: z.string().trim().optional(),
  nextFollowUpAt: z.coerce.date().optional()
});

export function createLeadsRouter(repository: LodenRepository, config: ApiConfig, aiProvider?: AiProvider) {
  const router = Router();

  router.use(authenticate(repository, config.JWT_SECRET), requirePermission("leads.read"));

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const query = validateQuery(leadQuerySchema, req);
      res.json({ data: await repository.listLeads(query) });
    })
  );

  router.post(
    "/",
    requirePermission("leads.manage"),
    asyncHandler(async (req, res) => {
      const body = validateBody(leadCreateSchema, req);
      const lead = await repository.createLead(body);
      void notifyNewLead(config, lead);
      void qualifyLead(aiProvider, repository, lead);
      res.status(201).json({ data: lead });
    })
  );

  router.patch(
    "/:id/status",
    requirePermission("leads.manage"),
    asyncHandler(async (req, res) => {
      const body = validateBody(leadStatusUpdateSchema, req);
      const lead = await repository.updateLead(String(req.params.id), body);
      res.json({ data: lead });
    })
  );

  return router;
}
