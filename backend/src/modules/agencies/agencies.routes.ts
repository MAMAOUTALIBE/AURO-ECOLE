import { Router } from "express";
import { z } from "zod";
import type { ApiConfig } from "../../config/env";
import type { AuthenticatedRequest } from "../../http/request-context";
import { authenticate, requirePermission } from "../../middleware/auth";
import type { LodenRepository } from "../../repositories/loden-repository";
import { asyncHandler } from "../../shared/async-handler";
import { notFound, unauthorized } from "../../shared/http-error";
import { validateBody } from "../../shared/validation";

const createSchema = z.object({
  name: z.string().trim().min(2),
  slug: z.string().trim().min(2).regex(/^[a-z0-9-]+$/, "Slug invalide (a-z, 0-9, -)"),
  address: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.string().trim().email().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional()
});

const updateSchema = createSchema.partial().extend({ active: z.boolean().optional() });

export function createAgenciesRouter(repository: LodenRepository, config: ApiConfig) {
  const router = Router();
  router.use(authenticate(repository, config.JWT_SECRET));

  // Agences accessibles à l'utilisateur : tout pour SUPER_ADMIN/DIRECTEUR,
  // sinon celles de ses affiliations (AgencyMembership).
  router.get(
    "/",
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const user = req.user;
      if (!user) throw unauthorized();

      const agencies = await repository.listAgencies();

      if (user.role === "SUPER_ADMIN" || user.role === "DIRECTEUR") {
        res.json({ data: agencies });
        return;
      }

      const memberships = await repository.listAgencyMembershipsByUser(user.id);
      const agencyIds = new Set(memberships.map((membership) => membership.agencyId));
      res.json({ data: agencies.filter((agency) => agencyIds.has(agency.id)) });
    })
  );

  router.post(
    "/",
    requirePermission("agency.manage"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const body = validateBody(createSchema, req);
      const agency = await repository.createAgency(body);
      void repository.createAuditLog({ userId: req.user?.id ?? null, action: "agency.create", entityType: "Agency", entityId: agency.id, metadata: { name: agency.name } });
      res.status(201).json({ data: agency });
    })
  );

  router.patch(
    "/:id",
    requirePermission("agency.manage"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const existing = await repository.findAgencyById(String(req.params.id));
      if (!existing) throw notFound("Agence introuvable");
      const body = validateBody(updateSchema, req);
      const agency = await repository.updateAgency(existing.id, body);
      void repository.createAuditLog({ userId: req.user?.id ?? null, action: "agency.update", entityType: "Agency", entityId: agency.id, metadata: body });
      res.json({ data: agency });
    })
  );

  return router;
}
