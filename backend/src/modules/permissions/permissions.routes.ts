import { Router } from "express";
import type { ApiConfig } from "../../config/env";
import { ALL_PERMISSIONS, ALL_ROLES, hasPermission } from "../../domain/permissions";
import { authenticate, requirePermission } from "../../middleware/auth";
import type { LodenRepository } from "../../repositories/loden-repository";
import { asyncHandler } from "../../shared/async-handler";

export function createPermissionsRouter(repository: LodenRepository, config: ApiConfig) {
  const router = Router();

  // Matrice RBAC en lecture (informative). La matrice est définie dans le code
  // (domain/permissions.ts) ; cet écran la rend transparente côté CRM.
  router.get(
    "/",
    authenticate(repository, config.JWT_SECRET),
    requirePermission("users.read"),
    asyncHandler(async (_req, res) => {
      res.json({
        data: {
          permissions: ALL_PERMISSIONS,
          roles: ALL_ROLES.map((role) => ({
            role,
            permissions: ALL_PERMISSIONS.filter((permission) => hasPermission(role, permission))
          }))
        }
      });
    })
  );

  return router;
}
