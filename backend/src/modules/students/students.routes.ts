import { Router } from "express";
import type { ApiConfig } from "../../config/env";
import type { AuthenticatedRequest } from "../../http/request-context";
import { authenticate, requireRoles } from "../../middleware/auth";
import type { LodenRepository } from "../../repositories/loden-repository";
import { asyncHandler } from "../../shared/async-handler";
import { notFound } from "../../shared/http-error";

export function createStudentsRouter(repository: LodenRepository, config: ApiConfig) {
  const router = Router();

  router.get(
    "/me",
    authenticate(repository, config.JWT_SECRET),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      if (!req.user) throw notFound("Utilisateur introuvable");
      const student = await repository.findStudentByUserId(req.user.id);
      res.json({ data: student });
    })
  );

  router.get(
    "/",
    authenticate(repository, config.JWT_SECRET),
    requireRoles("SUPER_ADMIN", "ADMIN"),
    asyncHandler(async (_req, res) => {
      res.json({ data: await repository.listStudents() });
    })
  );

  return router;
}
