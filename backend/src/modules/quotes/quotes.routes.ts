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

const vatRate = z.union([z.literal(0), z.literal(5.5), z.literal(10), z.literal(20)]);
const lineSchema = z.object({
  label: z.string().trim().min(1),
  quantity: z.number().int().positive(),
  unitAmountCents: z.number().int().nonnegative(),
  vatRate: vatRate.optional()
});

const listQuery = z.object({
  agencyId: z.string().trim().optional(),
  status: z.enum(["BROUILLON", "ENVOYE", "ACCEPTE", "REFUSE", "EXPIRE"]).optional(),
  clientUserId: z.string().trim().optional()
});

const createSchema = z.object({
  clientUserId: z.string().trim().min(1),
  studentId: z.string().trim().optional(),
  agencyId: z.string().trim().optional(),
  lines: z.array(lineSchema).min(1),
  validUntil: z.coerce.date().optional(),
  notes: z.string().trim().optional()
});

const updateSchema = z.object({
  status: z.enum(["ACCEPTE", "REFUSE", "EXPIRE"]).optional(),
  notes: z.string().trim().nullable().optional(),
  validUntil: z.union([z.null(), z.coerce.date()]).optional(),
  lines: z.array(lineSchema).min(1).optional()
});

export function createQuotesRouter(repository: LodenRepository, config: ApiConfig) {
  const router = Router();
  router.use(authenticate(repository, config.JWT_SECRET));

  router.get(
    "/",
    requirePermission("quotes.read"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const query = validateQuery(listQuery, req);
      const agencyId = await resolveScopedAgencyId(repository, req, query.agencyId);
      res.json({ data: await repository.listQuotes({ agencyId, status: query.status, clientUserId: query.clientUserId }) });
    })
  );

  router.get(
    "/:id",
    requirePermission("quotes.read"),
    asyncHandler(async (req, res) => {
      const quote = await repository.findQuoteById(String(req.params.id));
      if (!quote) throw notFound("Devis introuvable");
      res.json({ data: quote });
    })
  );

  router.post(
    "/",
    requirePermission("quotes.manage"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const body = validateBody(createSchema, req);
      const agencyId = await resolveScopedAgencyId(repository, req, body.agencyId);
      const quote = await repository.createQuote({ ...body, agencyId: agencyId ?? null });
      void repository.createAuditLog({ userId: req.user?.id ?? null, action: "quote.create", entityType: "Quote", entityId: quote.id });
      res.status(201).json({ data: quote });
    })
  );

  router.patch(
    "/:id",
    requirePermission("quotes.manage"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const existing = await repository.findQuoteById(String(req.params.id));
      if (!existing) throw notFound("Devis introuvable");
      const body = validateBody(updateSchema, req);

      if (body.lines && existing.status !== "BROUILLON") throw conflict("Devis envoyé : les lignes ne sont plus modifiables");
      if (body.status && existing.status !== "ENVOYE") {
        throw conflict("Transition invalide : seul un devis envoyé peut être accepté, refusé ou expiré");
      }

      const quote = await repository.updateQuote(existing.id, body);
      const action = body.status ? `quote.${body.status.toLowerCase()}` : "quote.update";
      void repository.createAuditLog({ userId: req.user?.id ?? null, action, entityType: "Quote", entityId: quote.id, metadata: { status: body.status } });
      res.json({ data: quote });
    })
  );

  // Envoi : attribue le numéro DEV-AAAA-NNNNNN + fige les snapshots émetteur/client.
  router.post(
    "/:id/send",
    requirePermission("quotes.manage"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const existing = await repository.findQuoteById(String(req.params.id));
      if (!existing) throw notFound("Devis introuvable");
      if (existing.status !== "BROUILLON") throw conflict("Devis déjà envoyé");
      if (existing.lines.length === 0) throw badRequest("Un devis doit comporter au moins une ligne");

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
      const quote = await repository.sendQuote(existing.id, { issuer, client });
      void repository.createAuditLog({ userId: req.user?.id ?? null, action: "quote.send", entityType: "Quote", entityId: quote.id, metadata: { number: quote.number } });
      res.json({ data: quote });
    })
  );

  router.delete(
    "/:id",
    requirePermission("quotes.manage"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const existing = await repository.findQuoteById(String(req.params.id));
      if (!existing) throw notFound("Devis introuvable");
      if (existing.status !== "BROUILLON") throw conflict("Seul un brouillon peut être supprimé");
      await repository.deleteQuote(existing.id);
      void repository.createAuditLog({ userId: req.user?.id ?? null, action: "quote.delete", entityType: "Quote", entityId: existing.id });
      res.status(204).end();
    })
  );

  return router;
}
