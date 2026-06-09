import { Router } from "express";
import { z } from "zod";
import type { ApiConfig } from "../../config/env";
import type { AuthenticatedRequest } from "../../http/request-context";
import type { InvoiceClientSnapshot, InvoiceIssuerSnapshot } from "../../domain/types";
import { authenticate, requirePermission, resolveScopedAgencyId } from "../../middleware/auth";
import type { LodenRepository } from "../../repositories/loden-repository";
import { asyncHandler } from "../../shared/async-handler";
import { badRequest, conflict, notFound } from "../../shared/http-error";
import { validateBody, validateQuery } from "../../shared/validation";

// TVA fermée aux taux français usuels (autorité serveur — l'UI ne fait que refléter).
const vatRate = z.union([z.literal(0), z.literal(5.5), z.literal(10), z.literal(20)]);
const lineSchema = z.object({
  label: z.string().trim().min(1),
  quantity: z.number().int().positive(),
  unitAmountCents: z.number().int().nonnegative(),
  vatRate: vatRate.optional()
});

const listQuery = z.object({
  agencyId: z.string().trim().optional(),
  status: z.enum(["BROUILLON", "EMISE", "PAYEE", "ANNULEE"]).optional(),
  clientUserId: z.string().trim().optional()
});

const createSchema = z.object({
  clientUserId: z.string().trim().min(1),
  studentId: z.string().trim().optional(),
  agencyId: z.string().trim().optional(),
  paymentId: z.string().trim().optional(),
  lines: z.array(lineSchema).min(1),
  dueDate: z.coerce.date().optional(),
  notes: z.string().trim().optional()
});

// PATCH n'expose JAMAIS l'émission ni la modification du numéro/totaux directement.
const updateSchema = z.object({
  status: z.enum(["PAYEE", "ANNULEE"]).optional(),
  notes: z.string().trim().optional(),
  dueDate: z.coerce.date().optional(),
  lines: z.array(lineSchema).min(1).optional()
});

export function createInvoicesRouter(repository: LodenRepository, config: ApiConfig) {
  const router = Router();
  router.use(authenticate(repository, config.JWT_SECRET));

  router.get(
    "/",
    requirePermission("invoices.read"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const query = validateQuery(listQuery, req);
      const agencyId = await resolveScopedAgencyId(repository, req, query.agencyId);
      res.json({ data: await repository.listInvoices({ agencyId, status: query.status, clientUserId: query.clientUserId }) });
    })
  );

  router.get(
    "/:id",
    requirePermission("invoices.read"),
    asyncHandler(async (req, res) => {
      const invoice = await repository.findInvoiceById(String(req.params.id));
      if (!invoice) throw notFound("Facture introuvable");
      res.json({ data: invoice });
    })
  );

  router.post(
    "/",
    requirePermission("invoices.manage"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const body = validateBody(createSchema, req);
      // Épingle l'agence côté serveur (évite la fuite inter-agences via un body forgé).
      const agencyId = await resolveScopedAgencyId(repository, req, body.agencyId);
      const invoice = await repository.createInvoice({ ...body, agencyId: agencyId ?? null });
      void repository.createAuditLog({ userId: req.user?.id ?? null, action: "invoice.create", entityType: "Invoice", entityId: invoice.id });
      res.status(201).json({ data: invoice });
    })
  );

  router.patch(
    "/:id",
    requirePermission("invoices.manage"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const existing = await repository.findInvoiceById(String(req.params.id));
      if (!existing) throw notFound("Facture introuvable");
      const body = validateBody(updateSchema, req);

      // Immutabilité : lignes éditables uniquement en brouillon.
      if (body.lines && existing.status !== "BROUILLON") throw conflict("Facture émise : les lignes ne sont plus modifiables");
      // Machine à états comptable.
      if (body.status === "PAYEE" && existing.status !== "EMISE") throw conflict("Transition invalide : seule une facture émise peut être marquée payée");
      if (body.status === "ANNULEE" && existing.status !== "EMISE" && existing.status !== "PAYEE") {
        throw conflict("Transition invalide : seule une facture émise ou payée peut être annulée");
      }

      const invoice = await repository.updateInvoice(existing.id, body);
      const action = body.status === "ANNULEE" ? "invoice.cancel" : body.status === "PAYEE" ? "invoice.pay" : "invoice.update";
      void repository.createAuditLog({ userId: req.user?.id ?? null, action, entityType: "Invoice", entityId: invoice.id, metadata: { status: body.status } });
      res.json({ data: invoice });
    })
  );

  // Émission : attribue le numéro séquentiel + fige les snapshots émetteur/client. Irréversible.
  router.post(
    "/:id/issue",
    requirePermission("invoices.manage"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const existing = await repository.findInvoiceById(String(req.params.id));
      if (!existing) throw notFound("Facture introuvable");
      if (existing.status !== "BROUILLON") throw conflict("Facture déjà émise");
      if (existing.lines.length === 0) throw badRequest("Une facture doit comporter au moins une ligne");
      if (existing.totalCents === 0) throw badRequest("Impossible d'émettre une facture à 0 €");

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
      const invoice = await repository.issueInvoice(existing.id, { issuer, client });
      void repository.createAuditLog({
        userId: req.user?.id ?? null,
        action: "invoice.issue",
        entityType: "Invoice",
        entityId: invoice.id,
        metadata: { number: invoice.number, totalCents: invoice.totalCents }
      });
      res.json({ data: invoice });
    })
  );

  router.delete(
    "/:id",
    requirePermission("invoices.manage"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const existing = await repository.findInvoiceById(String(req.params.id));
      if (!existing) throw notFound("Facture introuvable");
      if (existing.status !== "BROUILLON") throw conflict("Seul un brouillon peut être supprimé (une facture émise s'annule)");
      await repository.deleteInvoice(existing.id);
      void repository.createAuditLog({ userId: req.user?.id ?? null, action: "invoice.delete", entityType: "Invoice", entityId: existing.id });
      res.status(204).end();
    })
  );

  return router;
}
