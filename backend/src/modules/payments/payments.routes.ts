import type { Request, Response } from "express";
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
import { createStripeProvider, type StripeProvider } from "../../payments/stripe-provider";

// Le montant N'EST PAS accepté du client : il est dérivé du PricingPlan côté serveur.
// Le client n'envoie que le pack choisi (et le type d'opération).
const paymentSchema = z.object({
  userId: z.string().optional(),
  pricingPlanId: z.string().trim().min(1, "pricingPlanId requis"),
  kind: z.enum(["FORMATION", "ACOMPTE", "ECHEANCE", "REMBOURSEMENT"]).default("FORMATION"),
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

export function createPaymentsRouter(repository: LodenRepository, config: ApiConfig, stripe?: StripeProvider) {
  const router = Router();
  const stripeProvider = stripe ?? createStripeProvider(config);
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

      // Montant autoritatif : on relit le prix du pack en base, on ignore tout
      // montant fourni par le client (anti-fraude tarifaire).
      const plan = await repository.findPricingPlanById(body.pricingPlanId);
      if (!plan || !plan.active) {
        res.status(404).json({ error: { code: "PLAN_NOT_FOUND", message: "Pack introuvable ou inactif" } });
        return;
      }
      const amountCents = plan.priceCents;
      if (amountCents <= 0) {
        res.status(409).json({ error: { code: "PLAN_NOT_PAYABLE", message: "Ce pack n'est pas payable en ligne" } });
        return;
      }

      const intent = await stripeProvider.createPaymentIntent({
        amountCents,
        currency: body.currency,
        userId,
        pricingPlanId: plan.id,
        kind: body.kind
      });

      const payment = await repository.createPayment({
        userId,
        pricingPlanId: plan.id,
        kind: body.kind,
        status: "EN_ATTENTE",
        amountCents,
        currency: body.currency,
        stripePaymentIntentId: intent.id
      });

      res.status(201).json({
        data: payment,
        stripe: { mode: intent.mode, clientSecret: intent.clientSecret }
      });
    })
  );

  return router;
}

/**
 * Handler du webhook Stripe. Monté HORS du routeur authentifié et AVANT le parseur
 * JSON (corps brut requis pour vérifier la signature HMAC). Un paiement ne passe à
 * "PAYE" que sur un événement Stripe signé valide.
 */
export function createStripeWebhookHandler(
  repository: LodenRepository,
  config: ApiConfig,
  stripe?: StripeProvider
) {
  const stripeProvider = stripe ?? createStripeProvider(config);

  return asyncHandler(async (req: Request, res: Response) => {
    const signature = req.header("stripe-signature");
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(typeof req.body === "string" ? req.body : "");
    const verification = stripeProvider.verifyWebhook(rawBody, signature ?? undefined);

    if (!verification.ok) {
      res.status(400).json({ error: { code: "INVALID_SIGNATURE", message: verification.reason } });
      return;
    }

    const event = verification.event;
    const intentId = (event.data?.object as { id?: string } | undefined)?.id;

    if (intentId) {
      const payment = await repository.findPaymentByStripePaymentIntentId(intentId);
      if (payment) {
        if (event.type === "payment_intent.succeeded") {
          await repository.updatePayment(payment.id, { status: "PAYE" });
        } else if (event.type === "payment_intent.payment_failed") {
          await repository.updatePayment(payment.id, { status: "ECHOUE" });
        }
      }
    }

    res.json({ received: true });
  });
}
