import { Router } from "express";
import { z } from "zod";
import type { ApiConfig } from "../../config/env";
import { authenticate, requireRoles } from "../../middleware/auth";
import type { LodenRepository } from "../../repositories/loden-repository";
import { asyncHandler } from "../../shared/async-handler";
import { emailSchema, phoneSchema, validateBody } from "../../shared/validation";

const cpfRequestSchema = z.object({
  studentId: z.string().optional(),
  formationId: z.string().optional(),
  fullName: z.string().trim().min(2),
  email: emailSchema,
  phone: phoneSchema,
  requestedAmountCents: z.number().int().nonnegative().optional(),
  internalNotes: z.string().optional()
});

const statusSchema = z.object({
  status: z.enum(["NOUVELLE_DEMANDE", "EN_COURS", "DOCUMENTS_MANQUANTS", "VALIDEE", "REFUSEE"]),
  missingDocuments: z.array(z.string()).optional(),
  internalNotes: z.string().optional()
});

export function createCpfRouter(repository: LodenRepository, config: ApiConfig) {
  const router = Router();

  router.post(
    "/requests",
    asyncHandler(async (req, res) => {
      const body = validateBody(cpfRequestSchema, req);
      const cpfRequest = await repository.createCpfRequest(body);
      res.status(201).json({ data: cpfRequest });
    })
  );

  router.get(
    "/requests",
    authenticate(repository, config.JWT_SECRET),
    requireRoles("SUPER_ADMIN", "ADMIN"),
    asyncHandler(async (_req, res) => {
      res.json({ data: await repository.listCpfRequests() });
    })
  );

  router.patch(
    "/requests/:id/status",
    authenticate(repository, config.JWT_SECRET),
    requireRoles("SUPER_ADMIN", "ADMIN"),
    asyncHandler(async (req, res) => {
      const body = validateBody(statusSchema, req);
      const cpfRequest = await repository.updateCpfRequest(String(req.params.id), body);
      res.json({ data: cpfRequest });
    })
  );

  return router;
}
