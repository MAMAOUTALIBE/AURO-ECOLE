import { Router } from "express";
import { z } from "zod";
import type { ApiConfig } from "../../config/env";
import type { AuthenticatedRequest } from "../../http/request-context";
import { authenticate, requirePermission } from "../../middleware/auth";
import type { LodenRepository } from "../../repositories/loden-repository";
import { asyncHandler } from "../../shared/async-handler";
import { notFound } from "../../shared/http-error";
import { validateBody, validateQuery } from "../../shared/validation";

const listQuery = z.object({
  type: z.enum(["PAGE", "ARTICLE"]).optional(),
  published: z.enum(["true", "false"]).optional().transform((v) => (v === undefined ? undefined : v === "true"))
});

const createSchema = z.object({
  type: z.enum(["PAGE", "ARTICLE"]),
  title: z.string().trim().min(2),
  slug: z.string().trim().min(2).regex(/^[a-z0-9-]+$/, "Slug invalide (a-z, 0-9, -)"),
  excerpt: z.string().trim().optional(),
  body: z.string().trim().min(10),
  published: z.boolean().optional()
});

const updateSchema = z.object({
  title: z.string().trim().min(2).optional(),
  slug: z.string().trim().min(2).regex(/^[a-z0-9-]+$/).optional(),
  excerpt: z.string().trim().optional(),
  body: z.string().trim().min(10).optional(),
  published: z.boolean().optional()
});

export function createCmsRouter(repository: LodenRepository, config: ApiConfig) {
  const router = Router();
  router.use(authenticate(repository, config.JWT_SECRET), requirePermission("content.manage"));

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const query = validateQuery(listQuery, req);
      res.json({ data: await repository.listContentEntries({ type: query.type, published: query.published }) });
    })
  );

  router.get(
    "/:id",
    asyncHandler(async (req, res) => {
      const entry = await repository.findContentEntryById(String(req.params.id));
      if (!entry) throw notFound("Contenu introuvable");
      res.json({ data: entry });
    })
  );

  router.post(
    "/",
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const body = validateBody(createSchema, req);
      const entry = await repository.createContentEntry(body);
      void repository.createAuditLog({ userId: req.user?.id ?? null, action: "content.create", entityType: "ContentEntry", entityId: entry.id, metadata: { type: entry.type } });
      res.status(201).json({ data: entry });
    })
  );

  router.patch(
    "/:id",
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const existing = await repository.findContentEntryById(String(req.params.id));
      if (!existing) throw notFound("Contenu introuvable");
      const body = validateBody(updateSchema, req);
      const entry = await repository.updateContentEntry(existing.id, body);
      void repository.createAuditLog({ userId: req.user?.id ?? null, action: "content.update", entityType: "ContentEntry", entityId: entry.id });
      res.json({ data: entry });
    })
  );

  router.delete(
    "/:id",
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const existing = await repository.findContentEntryById(String(req.params.id));
      if (!existing) throw notFound("Contenu introuvable");
      await repository.deleteContentEntry(existing.id);
      void repository.createAuditLog({ userId: req.user?.id ?? null, action: "content.delete", entityType: "ContentEntry", entityId: existing.id });
      res.status(204).end();
    })
  );

  return router;
}
