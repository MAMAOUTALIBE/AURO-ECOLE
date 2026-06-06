import { Router } from "express";
import { z } from "zod";
import type { ApiConfig } from "../../config/env";
import { authenticate, requireRoles } from "../../middleware/auth";
import type { LodenRepository } from "../../repositories/loden-repository";
import { asyncHandler } from "../../shared/async-handler";
import { emailSchema, phoneSchema, validateBody } from "../../shared/validation";

const contactSchema = z.object({
  fullName: z.string().trim().min(2),
  email: emailSchema,
  phone: phoneSchema,
  type: z.enum(["INFORMATION", "RAPPEL", "INSCRIPTION", "CPF", "AUTRE"]).default("INFORMATION"),
  source: z.string().trim().optional(),
  message: z.string().trim().min(10)
});

const statusSchema = z.object({
  status: z.enum(["NOUVELLE", "EN_COURS", "TRAITEE", "ARCHIVEE"])
});

export function createContactsRouter(repository: LodenRepository, config: ApiConfig) {
  const router = Router();

  router.post(
    "/",
    asyncHandler(async (req, res) => {
      const body = validateBody(contactSchema, req);
      const contact = await repository.createContactRequest(body);
      await repository.createLead({
        fullName: body.fullName,
        email: body.email,
        phone: body.phone,
        source: body.source ?? "contact",
        interest: body.type,
        notes: body.message,
        status: "PROSPECT"
      });
      res.status(201).json({ data: contact });
    })
  );

  router.get(
    "/",
    authenticate(repository, config.JWT_SECRET),
    requireRoles("SUPER_ADMIN", "ADMIN"),
    asyncHandler(async (_req, res) => {
      res.json({ data: await repository.listContactRequests() });
    })
  );

  router.patch(
    "/:id/status",
    authenticate(repository, config.JWT_SECRET),
    requireRoles("SUPER_ADMIN", "ADMIN"),
    asyncHandler(async (req, res) => {
      const body = validateBody(statusSchema, req);
      const contact = await repository.updateContactRequest(String(req.params.id), body);
      res.json({ data: contact });
    })
  );

  return router;
}
