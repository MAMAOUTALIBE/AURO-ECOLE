import { Router } from "express";
import { z } from "zod";
import type { ApiConfig } from "../../config/env";
import { authenticate, requirePermission } from "../../middleware/auth";
import type { LodenRepository } from "../../repositories/loden-repository";
import { asyncHandler } from "../../shared/async-handler";
import { validateQuery } from "../../shared/validation";

const listQuery = z.object({
  limit: z.coerce.number().int().min(1).max(500).optional()
});

export function createAuditRouter(repository: LodenRepository, config: ApiConfig) {
  const router = Router();

  // Lecture des journaux d'activité (traçabilité / conformité).
  router.get(
    "/",
    authenticate(repository, config.JWT_SECRET),
    requirePermission("audit.read"),
    asyncHandler(async (req, res) => {
      const { limit } = validateQuery(listQuery, req);
      res.json({ data: await repository.listAuditLogs(limit ?? 100) });
    })
  );

  return router;
}
