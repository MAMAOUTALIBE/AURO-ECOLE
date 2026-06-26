"use client";

import { useEffect, useState } from "react";
import { pricingPlans, type PricingPlan } from "@/data/site";
import { mapApiPricingPlan } from "@/lib/catalog-mappers";
import { PricingCard } from "@/components/PricingCard";

export function PricingPlansGrid() {
  const [remotePlans, setRemotePlans] = useState<PricingPlan[] | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPlans() {
      try {
        const response = await fetch("/api/tarifs", { signal: controller.signal });
        if (!response.ok) return;

        const payload = (await response.json()) as { data?: Parameters<typeof mapApiPricingPlan>[0][] };
        const nextPlans = (payload.data ?? []).map(mapApiPricingPlan);
        if (nextPlans.length > 0) setRemotePlans(nextPlans);
      } catch {
        if (!controller.signal.aborted) setRemotePlans(null);
      }
    }

    loadPlans();

    return () => controller.abort();
  }, []);

  const plans = remotePlans ?? pricingPlans;

  return (
    <div className="container-pad grid gap-5 md:grid-cols-2 xl:grid-cols-4 2xl:gap-6">
      {plans.map((plan, index) => (
        <PricingCard key={plan.title} plan={plan} featured={index === 1} />
      ))}
    </div>
  );
}
