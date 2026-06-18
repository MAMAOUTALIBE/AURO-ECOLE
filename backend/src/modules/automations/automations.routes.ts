import { Router } from "express";
import { z } from "zod";
import type { ApiConfig } from "../../config/env";
import type { AuthenticatedRequest } from "../../http/request-context";
import { authenticate, requirePermission } from "../../middleware/auth";
import type { LodenRepository } from "../../repositories/loden-repository";
import { asyncHandler } from "../../shared/async-handler";
import { notFound } from "../../shared/http-error";
import { validateBody, validateQuery } from "../../shared/validation";

const triggerEnum = z.enum(["LEAD_CREATED", "STUDENT_CREATED"]);
const actionEnum = z.enum(["SEND_WELCOME_EMAIL", "NOTIFY_TEAM", "LOG"]);

const listQuery = z.object({
  trigger: triggerEnum.optional(),
  active: z.enum(["true", "false"]).optional().transform((v) => (v === undefined ? undefined : v === "true"))
});

const createSchema = z.object({
  name: z.string().trim().min(2),
  trigger: triggerEnum,
  action: actionEnum,
  active: z.boolean().optional()
});

const updateSchema = z.object({
  name: z.string().trim().min(2).optional(),
  trigger: triggerEnum.optional(),
  action: actionEnum.optional(),
  active: z.boolean().optional()
});

export function createAutomationsRouter(repository: LodenRepository, config: ApiConfig) {
  const router = Router();
  router.use(authenticate(repository, config.JWT_SECRET));

  router.get(
    "/",
    requirePermission("automations.read"),
    asyncHandler(async (req, res) => {
      const query = validateQuery(listQuery, req);
      res.json({ data: await repository.listAutomationRules({ trigger: query.trigger, active: query.active }) });
    })
  );

  router.post(
    "/",
    requirePermission("automations.manage"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const body = validateBody(createSchema, req);
      const rule = await repository.createAutomationRule(body);
      void repository.createAuditLog({ userId: req.user?.id ?? null, action: "automation.create", entityType: "AutomationRule", entityId: rule.id, metadata: { trigger: rule.trigger, action: rule.action } });
      res.status(201).json({ data: rule });
    })
  );

  router.patch(
    "/:id",
    requirePermission("automations.manage"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const existing = await repository.findAutomationRuleById(String(req.params.id));
      if (!existing) throw notFound("Règle introuvable");
      const body = validateBody(updateSchema, req);
      const rule = await repository.updateAutomationRule(existing.id, body);
      void repository.createAuditLog({ userId: req.user?.id ?? null, action: "automation.update", entityType: "AutomationRule", entityId: rule.id, metadata: { active: rule.active } });
      res.json({ data: rule });
    })
  );

  router.delete(
    "/:id",
    requirePermission("automations.manage"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const existing = await repository.findAutomationRuleById(String(req.params.id));
      if (!existing) throw notFound("Règle introuvable");
      await repository.deleteAutomationRule(existing.id);
      void repository.createAuditLog({ userId: req.user?.id ?? null, action: "automation.delete", entityType: "AutomationRule", entityId: existing.id });
      res.status(204).end();
    })
  );

  return router;
}
