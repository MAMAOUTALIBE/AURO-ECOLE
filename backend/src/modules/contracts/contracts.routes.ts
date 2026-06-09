import { Router } from "express";
import { z } from "zod";
import type { ApiConfig } from "../../config/env";
import type { AuthenticatedRequest } from "../../http/request-context";
import type { InvoiceClientSnapshot, InvoiceIssuerSnapshot } from "../../domain/types";
import { authenticate, requirePermission, resolveScopedAgencyId } from "../../middleware/auth";
import type { LodenRepository } from "../../repositories/loden-repository";
import { asyncHandler } from "../../shared/async-handler";
import { conflict, notFound } from "../../shared/http-error";
import { validateBody, validateQuery } from "../../shared/validation";

const listQuery = z.object({
  agencyId: z.string().trim().optional(),
  status: z.enum(["BROUILLON", "ACTIF", "RESILIE", "TERMINE"]).optional(),
  clientUserId: z.string().trim().optional()
});

const createSchema = z.object({
  clientUserId: z.string().trim().min(1),
  studentId: z.string().trim().optional(),
  formationId: z.string().trim().optional(),
  agencyId: z.string().trim().optional(),
  title: z.string().trim().min(2),
  body: z.string().trim().min(10),
  totalCents: z.number().int().nonnegative().optional(),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
  notes: z.string().trim().optional()
});

const updateSchema = z.object({
  status: z.enum(["RESILIE", "TERMINE"]).optional(),
  title: z.string().trim().min(2).optional(),
  body: z.string().trim().min(10).optional(),
  totalCents: z.number().int().nonnegative().optional(),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
  notes: z.string().trim().optional()
});

export function createContractsRouter(repository: LodenRepository, config: ApiConfig) {
  const router = Router();
  router.use(authenticate(repository, config.JWT_SECRET));

  router.get(
    "/",
    requirePermission("contracts.read"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const query = validateQuery(listQuery, req);
      const agencyId = await resolveScopedAgencyId(repository, req, query.agencyId);
      res.json({ data: await repository.listContracts({ agencyId, status: query.status, clientUserId: query.clientUserId }) });
    })
  );

  router.get(
    "/:id",
    requirePermission("contracts.read"),
    asyncHandler(async (req, res) => {
      const contract = await repository.findContractById(String(req.params.id));
      if (!contract) throw notFound("Contrat introuvable");
      res.json({ data: contract });
    })
  );

  router.post(
    "/",
    requirePermission("contracts.manage"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const body = validateBody(createSchema, req);
      const agencyId = await resolveScopedAgencyId(repository, req, body.agencyId);
      const contract = await repository.createContract({ ...body, agencyId: agencyId ?? null });
      void repository.createAuditLog({ userId: req.user?.id ?? null, action: "contract.create", entityType: "Contract", entityId: contract.id });
      res.status(201).json({ data: contract });
    })
  );

  router.patch(
    "/:id",
    requirePermission("contracts.manage"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const existing = await repository.findContractById(String(req.params.id));
      if (!existing) throw notFound("Contrat introuvable");
      const body = validateBody(updateSchema, req);

      // Le corps/titre/prix ne sont éditables qu'en brouillon ; un contrat actif ne peut que changer de statut.
      if ((body.title || body.body || body.totalCents !== undefined) && existing.status !== "BROUILLON") {
        throw conflict("Contrat actif : le contenu n'est plus modifiable");
      }
      if (body.status && existing.status !== "ACTIF") {
        throw conflict("Transition invalide : seul un contrat actif peut être résilié ou terminé");
      }

      const contract = await repository.updateContract(existing.id, body);
      const action = body.status ? `contract.${body.status.toLowerCase()}` : "contract.update";
      void repository.createAuditLog({ userId: req.user?.id ?? null, action, entityType: "Contract", entityId: contract.id, metadata: { status: body.status } });
      res.json({ data: contract });
    })
  );

  // Activation = signature : attribue le numéro CTR-AAAA-NNNNNN + fige les snapshots.
  router.post(
    "/:id/activate",
    requirePermission("contracts.manage"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const existing = await repository.findContractById(String(req.params.id));
      if (!existing) throw notFound("Contrat introuvable");
      if (existing.status !== "BROUILLON") throw conflict("Contrat déjà activé");

      const company = await repository.getCompanyInfo();
      const user = await repository.findUserById(existing.clientUserId);
      const issuer: InvoiceIssuerSnapshot = {
        legalName: company.legalName,
        legalForm: company.legalForm,
        capital: company.capital,
        address: company.address,
        postalCode: company.postalCode,
        city: company.city,
        country: company.country,
        siret: company.siret,
        approvalNumber: company.approvalNumber,
        phone: company.phone,
        email: company.email
      };
      const client: InvoiceClientSnapshot = {
        name: user ? `${user.firstName} ${user.lastName}`.trim() : "",
        email: user?.email ?? "",
        address: user?.address ?? ""
      };
      const contract = await repository.activateContract(existing.id, { issuer, client });
      void repository.createAuditLog({ userId: req.user?.id ?? null, action: "contract.activate", entityType: "Contract", entityId: contract.id, metadata: { number: contract.number } });
      res.json({ data: contract });
    })
  );

  router.delete(
    "/:id",
    requirePermission("contracts.manage"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const existing = await repository.findContractById(String(req.params.id));
      if (!existing) throw notFound("Contrat introuvable");
      if (existing.status !== "BROUILLON") throw conflict("Seul un brouillon peut être supprimé");
      await repository.deleteContract(existing.id);
      void repository.createAuditLog({ userId: req.user?.id ?? null, action: "contract.delete", entityType: "Contract", entityId: existing.id });
      res.status(204).end();
    })
  );

  return router;
}
