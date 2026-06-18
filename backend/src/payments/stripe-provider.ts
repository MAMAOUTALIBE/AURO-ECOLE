import { createHmac, timingSafeEqual } from "node:crypto";
import type { ApiConfig } from "../config/env";

// Provider de paiement. Comme l'IA et l'email : dégradation propre.
// - Sans STRIPE_SECRET_KEY -> mode "mock" (aucun débit, intention factice) pour le dev/démo.
// - Avec STRIPE_SECRET_KEY -> mode "live", vraie intention Stripe via l'API REST (pas de SDK requis).
// Le montant est TOUJOURS fourni par l'appelant (dérivé du PricingPlan côté serveur),
// jamais par le client : ce module ne fait pas confiance à un montant entrant.

export type PaymentIntentMode = "live" | "mock";

export type PaymentIntentResult = {
  id: string;
  clientSecret: string;
  mode: PaymentIntentMode;
};

export type StripeEvent = {
  id?: string;
  type: string;
  data: { object: Record<string, unknown> };
};

export type WebhookVerification =
  | { ok: true; event: StripeEvent }
  | { ok: false; reason: string };

export interface StripeProvider {
  readonly mode: PaymentIntentMode;
  createPaymentIntent(input: {
    amountCents: number;
    currency: string;
    userId: string;
    pricingPlanId: string;
    kind: string;
  }): Promise<PaymentIntentResult>;
  verifyWebhook(rawBody: Buffer, signatureHeader: string | undefined): WebhookVerification;
}

const STRIPE_API = "https://api.stripe.com/v1/payment_intents";
// Tolérance anti-rejeu sur l'horodatage de la signature (secondes).
const SIGNATURE_TOLERANCE_SECONDS = 5 * 60;

function mockId() {
  return `pi_mock_${Date.now()}`;
}

class MockStripeProvider implements StripeProvider {
  readonly mode = "mock" as const;

  async createPaymentIntent(): Promise<PaymentIntentResult> {
    const id = mockId();
    return { id, clientSecret: `${id}_secret_mock`, mode: "mock" };
  }

  verifyWebhook(): WebhookVerification {
    // Sans Stripe configuré, aucun webhook ne peut être authentifié : on refuse.
    return { ok: false, reason: "Stripe non configuré (mode mock) : webhook refusé." };
  }
}

class LiveStripeProvider implements StripeProvider {
  readonly mode = "live" as const;

  constructor(private readonly secretKey: string, private readonly webhookSecret: string | undefined) {}

  async createPaymentIntent(input: {
    amountCents: number;
    currency: string;
    userId: string;
    pricingPlanId: string;
    kind: string;
  }): Promise<PaymentIntentResult> {
    const params = new URLSearchParams();
    params.set("amount", String(input.amountCents));
    params.set("currency", input.currency.toLowerCase());
    params.set("metadata[userId]", input.userId);
    params.set("metadata[pricingPlanId]", input.pricingPlanId);
    params.set("metadata[kind]", input.kind);
    params.append("payment_method_types[]", "card");

    const response = await fetch(STRIPE_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params.toString()
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`Stripe a refusé la création de l'intention (${response.status}): ${detail.slice(0, 300)}`);
    }

    const intent = (await response.json()) as { id?: string; client_secret?: string };
    if (!intent.id || !intent.client_secret) {
      throw new Error("Réponse Stripe invalide (id ou client_secret manquant).");
    }
    return { id: intent.id, clientSecret: intent.client_secret, mode: "live" };
  }

  verifyWebhook(rawBody: Buffer, signatureHeader: string | undefined): WebhookVerification {
    if (!this.webhookSecret) return { ok: false, reason: "STRIPE_WEBHOOK_SECRET absent." };
    if (!signatureHeader) return { ok: false, reason: "En-tête Stripe-Signature manquant." };

    const parts = Object.fromEntries(
      signatureHeader.split(",").map((kv) => {
        const idx = kv.indexOf("=");
        return idx === -1 ? [kv, ""] : [kv.slice(0, idx).trim(), kv.slice(idx + 1).trim()];
      })
    ) as Record<string, string>;

    const timestamp = parts.t;
    const signature = parts.v1;
    if (!timestamp || !signature) return { ok: false, reason: "Signature mal formée." };

    const signedPayload = `${timestamp}.${rawBody.toString("utf8")}`;
    const expected = createHmac("sha256", this.webhookSecret).update(signedPayload).digest("hex");

    const expectedBuf = Buffer.from(expected, "utf8");
    const signatureBuf = Buffer.from(signature, "utf8");
    if (expectedBuf.length !== signatureBuf.length || !timingSafeEqual(expectedBuf, signatureBuf)) {
      return { ok: false, reason: "Signature Stripe invalide." };
    }

    const age = Math.floor(Date.now() / 1000) - Number(timestamp);
    if (!Number.isFinite(age) || age > SIGNATURE_TOLERANCE_SECONDS) {
      return { ok: false, reason: "Signature Stripe expirée (anti-rejeu)." };
    }

    try {
      const event = JSON.parse(rawBody.toString("utf8")) as StripeEvent;
      if (!event?.type || !event?.data?.object) return { ok: false, reason: "Événement Stripe invalide." };
      return { ok: true, event };
    } catch {
      return { ok: false, reason: "Corps de webhook illisible." };
    }
  }
}

let cached: { key: string | undefined; provider: StripeProvider } | null = null;

/** Renvoie le provider Stripe adapté à la config (live si clé présente, sinon mock). */
export function createStripeProvider(config: ApiConfig): StripeProvider {
  if (cached && cached.key === config.STRIPE_SECRET_KEY) return cached.provider;
  const provider = config.STRIPE_SECRET_KEY
    ? new LiveStripeProvider(config.STRIPE_SECRET_KEY, config.STRIPE_WEBHOOK_SECRET)
    : new MockStripeProvider();
  cached = { key: config.STRIPE_SECRET_KEY, provider };
  return provider;
}
