import { Router } from "express";
import { z } from "zod";
import type { ApiConfig } from "../../config/env";
import type { AuthenticatedRequest } from "../../http/request-context";
import { authenticate, requirePermission, resolveScopedAgencyId } from "../../middleware/auth";
import type { LodenRepository } from "../../repositories/loden-repository";
import { asyncHandler } from "../../shared/async-handler";
import { notFound } from "../../shared/http-error";
import { validateBody, validateQuery } from "../../shared/validation";

const transmissionEnum = z.enum(["MANUEL", "AUTOMATIQUE", "MIXTE", "CODE"]);

const listQuery = z.object({ agencyId: z.string().trim().optional() });

const createSchema = z.object({
  label: z.string().trim().min(2),
  transmission: transmissionEnum,
  registration: z.string().trim().optional(),
  instructorId: z.string().trim().optional(),
  agencyId: z.string().trim().optional()
});

const updateSchema = createSchema.partial().extend({ active: z.boolean().optional() });

export function createVehiclesRouter(repository: LodenRepository, config: ApiConfig) {
  const router = Router();
  router.use(authenticate(repository, config.JWT_SECRET));

  router.get(
    "/",
    requirePermission("bookings.read"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const { agencyId } = validateQuery(listQuery, req);
      const scoped = await resolveScopedAgencyId(repository, req, agencyId);
      res.json({ data: await repository.listVehicles(scoped ? { agencyId: scoped } : undefined) });
    })
  );

  router.post(
    "/",
    requirePermission("catalog.manage"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const body = validateBody(createSchema, req);
      const vehicle = await repository.createVehicle(body);
      void repository.createAuditLog({ userId: req.user?.id ?? null, action: "vehicle.create", entityType: "Vehicle", entityId: vehicle.id, metadata: { label: vehicle.label } });
      res.status(201).json({ data: vehicle });
    })
  );

  router.patch(
    "/:id",
    requirePermission("catalog.manage"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const existing = await repository.findVehicleById(String(req.params.id));
      if (!existing) throw notFound("Véhicule introuvable");
      const body = validateBody(updateSchema, req);
      const vehicle = await repository.updateVehicle(existing.id, body);
      void repository.createAuditLog({ userId: req.user?.id ?? null, action: "vehicle.update", entityType: "Vehicle", entityId: vehicle.id, metadata: body });
      res.json({ data: vehicle });
    })
  );

  return router;
}
