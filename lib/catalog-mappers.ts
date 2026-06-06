import type { Formation, PricingPlan } from "@/data/site";

type ApiFormation = {
  title: string;
  slug: string;
  mode: "MANUEL" | "AUTOMATIQUE" | "MIXTE" | "CODE";
  durationLabel: string;
  priceCents: number;
  cpfEligible: boolean;
  description: string;
  options?: unknown;
};

type ApiPricingPlan = {
  id: string;
  slug: string;
  title: string;
  priceCents: number;
  promotionalLabel?: string | null;
  features: string[];
};

const modeLabels: Record<ApiFormation["mode"], Formation["mode"]> = {
  MANUEL: "Manuel",
  AUTOMATIQUE: "Automatique",
  MIXTE: "Mixte",
  CODE: "Code"
};

function extractTags(options: unknown): string[] {
  if (!options || typeof options !== "object" || !("tags" in options)) return [];

  const tags = (options as { tags?: unknown }).tags;
  return Array.isArray(tags) ? tags.filter((tag): tag is string => typeof tag === "string") : [];
}

export function mapApiFormation(formation: ApiFormation): Formation {
  return {
    title: formation.title,
    slug: formation.slug,
    mode: modeLabels[formation.mode],
    duration: formation.durationLabel,
    price: formation.priceCents / 100,
    cpf: formation.cpfEligible,
    tags: extractTags(formation.options),
    description: formation.description
  };
}

export function mapApiPricingPlan(plan: ApiPricingPlan): PricingPlan {
  return {
    id: plan.id,
    slug: plan.slug,
    title: plan.title,
    price: plan.priceCents / 100,
    badge: plan.promotionalLabel ?? "LODEN",
    features: plan.features,
    cta: plan.title.toLowerCase().includes("cpf") ? "Vérifier mon CPF" : "Choisir ce pack"
  };
}
