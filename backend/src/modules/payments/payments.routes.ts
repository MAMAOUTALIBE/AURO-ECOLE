import { Router } from "express";
import { z } from "zod";
import type { ApiConfig } from "../../config/env";
import type { AuthenticatedRequest } from "../../http/request-context";
import { authenticate, requireRoles } from "../../middleware/auth";
import type { LodenRepository } from "../../repositories/loden-repository";
import { asyncHandler } from "../../shared/async-handler";
import { validateBody } from "../../shared/validation";

const paymentSchema = z.object({
  userId: z.string().optional(),
  pricingPlanId: z.string().optional(),
  kind: z.enum(["FORMATION", "ACOMPTE", "ECHEANCE", "REMBOURSEMENT"]).default("FORMATION"),
  amountCents: z.number().int().positive(),
  currency: z.string().length(3).default("EUR")
});

export function createPaymentsRouter(repository: LodenRepository, config: ApiConfig) {
  const router = Router();
  router.use(authenticate(repository, config.JWT_SECRET));

  router.get(
    "/",
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      if (req.user?.role !== "ELEVE" && req.user?.role !== "ADMIN" && req.user?.role !== "SUPER_ADMIN") {
        res.status(403).json({ error: { code: "FORBIDDEN", message: "Accès refusé" } });
        return;
      }

      const userId = req.user.role === "ELEVE" ? req.user.id : undefined;
      res.json({ data: await repository.listPayments({ userId }) });
    })
  );

  router.post(
    "/payment-intents",
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const body = validateBody(paymentSchema, req);
      const canCreateForOthers = req.user?.role === "ADMIN" || req.user?.role === "SUPER_ADMIN";
      const userId = req.user?.role === "ELEVE" ? req.user.id : body.userId;

      if (req.user?.role !== "ELEVE" && !canCreateForOthers) {
        res.status(403).json({ error: { code: "FORBIDDEN", message: "Accès refusé" } });
        return;
      }

      if (!userId) {
        res.status(400).json({ error: { code: "USER_REQUIRED", message: "userId requis" } });
        return;
      }
      const payment = await repository.createPayment({
        userId,
        pricingPlanId: body.pricingPlanId,
        kind: body.kind,
        status: "EN_ATTENTE",
        amountCents: body.amountCents,
        currency: body.currency,
        stripePaymentIntentId: `pi_mock_${Date.now()}`
      });
      res.status(201).json({
        data: payment,
        stripe: {
          mode: "mock",
          clientSecret: `${payment.stripePaymentIntentId}_secret_mock`
        }
      });
    })
  );

  router.post(
    "/stripe/webhook",
    requireRoles("SUPER_ADMIN", "ADMIN"),
    asyncHandler(async (_req, res) => {
      res.status(202).json({ ok: true, message: "Webhook Stripe prêt pour vérification signature." });
    })
  );

  return router;
}
