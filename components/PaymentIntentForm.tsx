"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CreditCard, Loader2, LockKeyhole, ShieldCheck } from "lucide-react";
import { pricingPlans } from "@/data/site";
import { formatCurrency } from "@/lib/utils";

type PlanOption = {
  id: string;
  title: string;
  priceCents: number;
  badge: string;
  features: string[];
};

type Payment = {
  id: string;
  pricingPlanId?: string | null;
  status: string;
  amountCents: number;
  currency: string;
  stripePaymentIntentId?: string | null;
  createdAt: string;
};

type PaymentIntentResponse = {
  data: Payment;
  stripe: {
    mode: "mock";
    clientSecret: string;
  };
};

type FormState =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "ready" }
  | { status: "submitting" }
  | { status: "success"; payment: Payment; clientSecret: string }
  | { status: "error"; message: string };

const fallbackPlans: PlanOption[] = pricingPlans.map((plan) => ({
  id: plan.id,
  title: plan.title,
  priceCents: plan.price * 100,
  badge: plan.badge,
  features: plan.features
}));

export function PaymentIntentForm() {
  const searchParams = useSearchParams();
  const initialPlanId = searchParams.get("plan") ?? "plan-permis-b";
  const [plans, setPlans] = useState<PlanOption[]>(fallbackPlans);
  const [selectedPlanId, setSelectedPlanId] = useState(initialPlanId);
  const [state, setState] = useState<FormState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();

    async function loadPlans() {
      try {
        // Auth via cookie httpOnly : on sonde la session (jamais de token en JS).
        const meResponse = await fetch("/api/auth/me", { signal: controller.signal });
        if (!meResponse.ok) {
          setState({ status: "anonymous" });
          return;
        }

        const response = await fetch("/api/tarifs", { signal: controller.signal });
        if (response.ok) {
          const payload = (await response.json()) as {
            data?: Array<{
              id: string;
              title: string;
              priceCents: number;
              promotionalLabel?: string | null;
              features: string[];
            }>;
          };
          const nextPlans = (payload.data ?? [])
            .filter((plan) => plan.priceCents > 0)
            .map((plan) => ({
              id: plan.id,
              title: plan.title,
              priceCents: plan.priceCents,
              badge: plan.promotionalLabel ?? "LODENE",
              features: plan.features
            }));

          if (nextPlans.length > 0) {
            setPlans(nextPlans);
            if (!nextPlans.some((plan) => plan.id === initialPlanId)) {
              setSelectedPlanId(nextPlans[0].id);
            }
          }
        }

        setState({ status: "ready" });
      } catch {
        if (!controller.signal.aborted) setState({ status: "ready" });
      }
    }

    loadPlans();

    return () => controller.abort();
  }, [initialPlanId]);

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === selectedPlanId && plan.priceCents > 0) ?? plans.find((plan) => plan.priceCents > 0),
    [plans, selectedPlanId]
  );

  async function createPaymentIntent() {
    if (!selectedPlan) {
      setState({ status: "error", message: "Aucun pack payant disponible pour le moment." });
      return;
    }

    setState({ status: "submitting" });

    try {
      const response = await fetch("/api/payments/payment-intents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pricingPlanId: selectedPlan.id,
          kind: "FORMATION",
          amountCents: selectedPlan.priceCents,
          currency: "EUR"
        })
      });

      if (response.status === 401) {
        setState({ status: "anonymous" });
        return;
      }

      if (!response.ok) {
        throw new Error("Payment intent failed");
      }

      const payload = (await response.json()) as PaymentIntentResponse;
      setState({ status: "success", payment: payload.data, clientSecret: payload.stripe.clientSecret });
    } catch {
      setState({ status: "error", message: "Impossible de préparer le paiement pour le moment." });
    }
  }

  if (state.status === "loading") {
    return (
      <PaymentPanel title="Préparation du paiement" text="Chargement sécurisé du pack sélectionné...">
        <Loader2 className="mt-6 h-6 w-6 animate-spin text-loden-700" />
      </PaymentPanel>
    );
  }

  if (state.status === "anonymous") {
    return (
      <PaymentPanel
        title="Ton pack sélectionné"
        text="Voici le détail de ta formation. Connecte-toi ou crée ton compte élève pour finaliser le paiement en toute sécurité."
      >
        {selectedPlan ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-loden-pearl p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-lg font-semibold text-loden-ink">{selectedPlan.title}</span>
              <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-loden-700 shadow-soft">
                {formatCurrency(selectedPlan.priceCents / 100)}
              </span>
            </div>
            {selectedPlan.badge ? <p className="mt-1 text-sm text-loden-muted">{selectedPlan.badge}</p> : null}
            {selectedPlan.features.length > 0 ? (
              <ul className="mt-4 grid gap-2 text-sm text-loden-muted">
                {selectedPlan.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-loden-600" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link className="focus-ring rounded-full bg-loden-700 px-5 py-3 text-center font-semibold text-white" href="/connexion">
            Me connecter
          </Link>
          <Link className="focus-ring rounded-full border border-slate-200 px-5 py-3 text-center font-semibold text-loden-ink" href="/inscription">
            Créer un compte
          </Link>
        </div>
        <p className="mt-4 text-xs text-loden-muted">Aucun débit à cette étape — la préparation du paiement se fait une fois connecté.</p>
      </PaymentPanel>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <PaymentPanel
        title="Paiement formation"
        text="Sélectionne ton pack. LODENE crée ici une intention Stripe mockée, sans saisie de carte ni débit réel."
      >
        <div className="mt-7 grid gap-3" role="radiogroup" aria-label="Choisir un pack">
          {plans
            .filter((plan) => plan.priceCents > 0)
            .map((plan) => {
              const checked = plan.id === selectedPlan?.id;
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`focus-ring rounded-2xl border p-4 text-left transition ${
                    checked ? "border-loden-500 bg-loden-50" : "border-slate-200 bg-white hover:border-loden-200"
                  }`}
                  role="radio"
                  aria-checked={checked}
                >
                  <span className="flex flex-wrap items-center justify-between gap-3">
                    <span className="font-semibold text-loden-ink">{plan.title}</span>
                    <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-loden-700 shadow-soft">
                      {formatCurrency(plan.priceCents / 100)}
                    </span>
                  </span>
                  <span className="mt-2 block text-sm text-loden-muted">{plan.badge}</span>
                </button>
              );
            })}
        </div>

        <button
          type="button"
          onClick={createPaymentIntent}
          disabled={state.status === "submitting" || !selectedPlan}
          className="focus-ring mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-loden-700 px-6 py-4 font-semibold text-white shadow-soft transition hover:bg-loden-800 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        >
          {state.status === "submitting" ? <Loader2 className="h-5 w-5 animate-spin" /> : <CreditCard className="h-5 w-5" />}
          Préparer le paiement sécurisé
        </button>

        {state.status === "error" ? (
          <p className="mt-4 text-sm font-semibold text-red-600" role="alert">
            {state.message}
          </p>
        ) : null}
      </PaymentPanel>

      <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-premium">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-loden-50 text-loden-700">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h2 className="mt-5 text-2xl font-semibold text-loden-ink">Base Stripe prête</h2>
        <p className="mt-3 text-sm leading-6 text-loden-muted">
          Cette étape prépare le futur checkout : montant, élève, pack et identifiant d’intention sont déjà structurés côté API.
        </p>
        <ul className="mt-6 grid gap-3 text-sm text-loden-muted">
          {["Aucun débit réel", "Connexion élève requise", "Historique visible dans l’espace élève"].map((item) => (
            <li key={item} className="flex gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-loden-600" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        {state.status === "success" ? (
          <div className="mt-7 rounded-2xl bg-loden-50 p-4" role="status">
            <p className="text-sm font-semibold text-loden-ink">Intention créée</p>
            <p className="mt-2 text-sm text-loden-muted">
              Statut : {formatPaymentStatus(state.payment.status)} · Référence : {state.payment.stripePaymentIntentId}
            </p>
            <Link className="focus-ring mt-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-loden-700 shadow-soft" href="/espace-eleve">
              Voir mon espace élève
            </Link>
          </div>
        ) : null}
      </aside>
    </div>
  );
}

function PaymentPanel({ title, text, children }: { title: string; text: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-premium">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-loden-50 text-loden-700">
        <LockKeyhole className="h-6 w-6" />
      </div>
      <h2 className="mt-5 text-2xl font-semibold text-loden-ink">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-loden-muted">{text}</p>
      {children}
    </section>
  );
}

function formatPaymentStatus(value: string) {
  return value.toLowerCase().replaceAll("_", " ");
}
