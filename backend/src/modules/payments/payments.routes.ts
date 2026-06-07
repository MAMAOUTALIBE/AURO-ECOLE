import { Router } from "express";
import { z } from "zod";
import type { ApiConfig } from "../../config/env";
import type { AuthenticatedRequest } from "../../http/request-context";
import { authenticate, requirePermission } from "../../middleware/auth";
import type { LodenRepository } from "../../repositories/loden-repository";
import { asyncHandler } from "../../shared/async-handler";
import { hasPermission } from "../../domain/permissions";
import { publicUser } from "../../http/request-context";
import { forbidden } from "../../shared/http-error";
import { validateBody, validateQuery } from "../../shared/validation";

const paymentSchema = z.object({
  userId: z.string().optional(),
  pricingPlanId: z.string().optional(),
  kind: z.enum(["FORMATION", "ACOMPTE", "ECHEANCE", "REMBOURSEMENT"]).default("FORMATION"),
  amountCents: z.number().int().positive(),
  currency: z.string().length(3).default("EUR")
});

const paymentStatusEnum = z.enum(["EN_ATTENTE", "PAYE", "ECHOUE", "REMBOURSE", "PARTIEL"]);

const listQuerySchema = z.object({
  status: paymentStatusEnum.optional(),
  agencyId: z.string().trim().optional()
});

const recordSchema = z.object({
  userId: z.string().trim().min(1),
  pricingPlanId: z.string().trim().optional(),
  agencyId: z.string().trim().optional(),
  kind: z.enum(["FORMATION", "ACOMPTE", "ECHEANCE", "REMBOURSEMENT"]).default("FORMATION"),
  amountCents: z.number().int().positive(),
  currency: z.string().length(3).default("EUR"),
  status: paymentStatusEnum.default("PAYE")
});

const updateSchema = z.object({
  status: paymentStatusEnum,
  invoiceUrl: z.string().trim().optional()
});

export function createPaymentsRouter(repository: LodenRepository, config: ApiConfig) {
  const router = Router();
  router.use(authenticate(repository, config.JWT_SECRET));

  router.get(
    "/",
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const user = req.user;
      if (!user) throw forbidden();

      // Élève : ses propres paiements. Staff : tous (selon permission), avec filtres.
      if (user.role === "ELEVE") {
        res.json({ data: await repository.listPayments({ userId: user.id }) });
        return;
      }
      if (!hasPermission(user.role, "payments.read")) throw forbidden();
      const query = validateQuery(listQuerySchema, req);
      const payments = await repository.listPayments(query);
      const data = await Promise.all(
        payments.map(async (payment) => {
          const payer = await repository.findUserById(payment.userId);
          return { ...payment, user: payer ? publicUser(payer) : null };
        })
      );
      res.json({ data });
    })
  );

  router.post(
    "/",
    requirePermission("payments.manage"),
    asyncHandler(async (req, res) => {
      const body = validateBody(recordSchema, req);
      const payment = await repository.createPayment(body);
      res.status(201).json({ data: payment });
    })
  );

  router.patch(
    "/:id",
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const user = req.user;
      if (!user) throw forbidden();
      const body = validateBody(updateSchema, req);
      // Un remboursement exige la permission dédiée.
      const needed = body.status === "REMBOURSE" ? "payments.refund" : "payments.manage";
      if (!hasPermission(user.role, needed)) throw forbidden();
      const payment = await repository.updatePayment(String(req.params.id), body);
      res.json({ data: payment });
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
    requirePermission("payments.manage"),
    asyncHandler(async (_req, res) => {
      res.status(202).json({ ok: true, message: "Webhook Stripe prêt pour vérification signature." });
    })
  );

  return router;
}
