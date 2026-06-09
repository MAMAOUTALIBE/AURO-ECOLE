import { Router } from "express";
import { z } from "zod";
import type { ApiConfig } from "../../config/env";
import type { AuthenticatedRequest } from "../../http/request-context";
import { authenticate, requirePermission, resolveScopedAgencyId } from "../../middleware/auth";
import type { LodenRepository } from "../../repositories/loden-repository";
import { asyncHandler } from "../../shared/async-handler";
import { validateBody, validateQuery } from "../../shared/validation";

const listQuerySchema = z.object({
  studentId: z.string().trim().optional(),
  agencyId: z.string().trim().optional()
});

const planSchema = z.object({
  studentId: z.string().trim().min(1),
  agencyId: z.string().trim().optional(),
  totalCents: z.number().int().positive(),
  count: z.number().int().min(2).max(4),
  startDate: z.coerce.date()
});

const updateSchema = z.object({
  status: z.enum(["EN_ATTENTE", "PAYE", "EN_RETARD"])
});

export function createInstallmentsRouter(repository: LodenRepository, config: ApiConfig) {
  const router = Router();
  router.use(authenticate(repository, config.JWT_SECRET));

  router.get(
    "/",
    requirePermission("payments.read"),
    asyncHandler(async (req, res) => {
      const query = validateQuery(listQuerySchema, req);
      const agencyId = await resolveScopedAgencyId(repository, req as AuthenticatedRequest, query.agencyId);
      res.json({ data: await repository.listInstallments({ ...query, agencyId }) });
    })
  );

  // Génère un échéancier (paiement en plusieurs fois) en répartissant le total.
  router.post(
    "/plan",
    requirePermission("payments.manage"),
    asyncHandler(async (req, res) => {
      const body = validateBody(planSchema, req);
      const base = Math.floor(body.totalCents / body.count);
      const remainder = body.totalCents - base * body.count;

      const created = [];
      for (let index = 0; index < body.count; index += 1) {
        const dueDate = new Date(
          body.startDate.getFullYear(),
          body.startDate.getMonth() + index,
          body.startDate.getDate()
        );
        const amountCents = base + (index === 0 ? remainder : 0);
        created.push(
          await repository.createInstallment({
            studentId: body.studentId,
            agencyId: body.agencyId,
            label: `Échéance ${index + 1}/${body.count}`,
            dueDate,
            amountCents
          })
        );
      }

      res.status(201).json({ data: created });
    })
  );

  router.patch(
    "/:id",
    requirePermission("payments.manage"),
    asyncHandler(async (req, res) => {
      const body = validateBody(updateSchema, req);
      const installment = await repository.updateInstallment(String(req.params.id), body);
      res.json({ data: installment });
    })
  );

  return router;
}
