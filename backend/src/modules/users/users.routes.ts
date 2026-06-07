import { Router } from "express";
import { z } from "zod";
import type { ApiConfig } from "../../config/env";
import { authenticate, requirePermission } from "../../middleware/auth";
import type { LodenRepository } from "../../repositories/loden-repository";
import { asyncHandler } from "../../shared/async-handler";
import { validateQuery } from "../../shared/validation";
import { publicUser } from "../../http/request-context";

const userQuerySchema = z.object({
  role: z.enum(["SUPER_ADMIN", "ADMIN", "MONITEUR", "ELEVE", "VISITEUR"]).optional()
});

export function createUsersRouter(repository: LodenRepository, config: ApiConfig) {
  const router = Router();
  router.use(authenticate(repository, config.JWT_SECRET), requirePermission("users.read"));

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const query = validateQuery(userQuerySchema, req);
      const users = await repository.listUsers(query);
      res.json({ data: users.map(publicUser) });
    })
  );

  return router;
}
