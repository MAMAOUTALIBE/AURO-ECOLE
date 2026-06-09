import { randomBytes } from "node:crypto";
import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { ApiConfig } from "../../config/env";
import type { AuthenticatedRequest } from "../../http/request-context";
import { authenticate, requirePermission } from "../../middleware/auth";
import type { LodenRepository } from "../../repositories/loden-repository";
import { asyncHandler } from "../../shared/async-handler";
import { conflict, notFound } from "../../shared/http-error";
import { emailSchema, phoneSchema, validateBody, validateQuery } from "../../shared/validation";
import { publicUser } from "../../http/request-context";

// Tous les rôles (pour le filtre) ; rôles "staff" (création/édition via ce module —
// les ELEVE/VISITEUR se créent via les parcours dédiés et ne sont pas gérés ici).
const ALL_ROLES = [
  "SUPER_ADMIN",
  "DIRECTEUR",
  "RESPONSABLE_AGENCE",
  "RESPONSABLE_PEDAGOGIQUE",
  "ADMIN",
  "SECRETAIRE",
  "COMPTABLE",
  "MONITEUR",
  "ELEVE",
  "VISITEUR"
] as const;
const STAFF_ROLES = [
  "DIRECTEUR",
  "RESPONSABLE_AGENCE",
  "RESPONSABLE_PEDAGOGIQUE",
  "ADMIN",
  "SECRETAIRE",
  "COMPTABLE",
  "MONITEUR"
] as const;
const STATUSES = ["ACTIVE", "SUSPENDED", "ARCHIVED"] as const;

const userQuerySchema = z.object({ role: z.enum(ALL_ROLES).optional() });

const createSchema = z.object({
  firstName: z.string().trim().min(2),
  lastName: z.string().trim().min(2),
  email: emailSchema,
  phone: phoneSchema,
  role: z.enum(STAFF_ROLES)
});

const updateSchema = z.object({
  firstName: z.string().trim().min(2).optional(),
  lastName: z.string().trim().min(2).optional(),
  phone: phoneSchema,
  role: z.enum(STAFF_ROLES).optional(),
  status: z.enum(STATUSES).optional()
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

  // Création d'un membre du personnel (compte + mot de passe temporaire). Réservé users.manage.
  router.post(
    "/",
    requirePermission("users.manage"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const body = validateBody(createSchema, req);
      const existing = await repository.findUserByEmail(body.email);
      if (existing) throw conflict("Un compte existe déjà avec cet email");

      const tempPassword = randomBytes(18).toString("base64url");
      const passwordHash = await bcrypt.hash(tempPassword, 12);
      const user = await repository.createUser({
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
        role: body.role,
        status: "ACTIVE",
        passwordHash
      });
      void repository.createAuditLog({ userId: req.user?.id ?? null, action: "user.create", entityType: "User", entityId: user.id, metadata: { role: user.role } });
      res.status(201).json({ data: publicUser(user) });
    })
  );

  router.patch(
    "/:id",
    requirePermission("users.manage"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const body = validateBody(updateSchema, req);
      const existing = await repository.findUserById(String(req.params.id));
      if (!existing) throw notFound("Utilisateur introuvable");
      const user = await repository.updateUser(existing.id, body);
      void repository.createAuditLog({ userId: req.user?.id ?? null, action: "user.update", entityType: "User", entityId: user.id, metadata: body });
      res.json({ data: publicUser(user) });
    })
  );

  return router;
}
