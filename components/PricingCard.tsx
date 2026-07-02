import Link from "next/link";
import { ArrowRight, BadgeEuro, Car, Check, Gauge, Sparkles, Zap, type LucideIcon } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { PricingPlan } from "@/data/site";

type Visual = { icon: LucideIcon; gradient: string };

// Identité visuelle par pack — alignée sur les dégradés des formations (cohérence LODENE).
const VISUALS: Record<string, Visual> = {
  "permis-b": { icon: Car, gradient: "linear-gradient(135deg,#0e7490,#08AEB8 55%,#22d3ee)" },
  "permis-accelere": { icon: Zap, gradient: "linear-gradient(135deg,#b45309,#f59e0b 55%,#fbbf24)" },
  "boite-automatique": { icon: Gauge, gradient: "linear-gradient(135deg,#0891a0,#22d3ee 55%,#38bdf8)" },
  "pack-cpf": { icon: BadgeEuro, gradient: "linear-gradient(135deg,#0f766e,#10b981 55%,#34d399)" }
};
const FALLBACK: Visual = { icon: Sparkles, gradient: "linear-gradient(135deg,#155e75,#0e7490 55%,#14b8a6)" };

export function PricingCard({ plan, featured = false }: { plan: PricingPlan; featured?: boolean }) {
  // Tarifs sur devis tant qu'aucune grille officielle n'est confirmée -> CTA vers la demande de devis.
  const ctaHref = plan.price === 0 ? "/contact#demande" : `/paiement?plan=${encodeURIComponent(plan.id)}`;
  const ctaLabel = plan.price === 0 ? "Demander un devis" : plan.cta;
  const ctaTrack = plan.price === 0 ? "click_devis" : "click_paiement";
  const visual = VISUALS[plan.slug] ?? FALLBACK;
  const Icon = visual.icon;

  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-xl border p-4 shadow-soft transition duration-300 hover:-translate-y-1.5 hover:shadow-premium sm:rounded-2xl md:rounded-3xl md:p-6 ${
        featured ? "border-transparent bg-loden-ink text-white ring-2 ring-loden-500/60" : "border-slate-200 bg-white text-loden-ink hover:border-loden-200"
      }`}
    >
      {featured ? (
        <span
          className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-30 blur-2xl"
          style={{ backgroundImage: visual.gradient }}
          aria-hidden="true"
        />
      ) : null}

      <div className="relative flex items-center justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-soft md:h-12 md:w-12 md:rounded-2xl" style={{ backgroundImage: visual.gradient }}>
          <Icon className="h-5 w-5 md:h-6 md:w-6" aria-hidden="true" />
        </span>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${featured ? "bg-white/15 text-white ring-1 ring-white/25" : "bg-loden-50 text-loden-700"}`}>{plan.badge}</span>
      </div>

      <h3 className="relative mt-4 text-lg font-semibold md:mt-5 md:text-xl">{plan.title}</h3>

      <div className="relative mt-3">
        <p className="text-sm opacity-70">À partir de</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight md:text-4xl">
          {plan.price === 0 ? "Sur devis" : formatCurrency(plan.price)}
        </p>
      </div>

      <ul className="relative mt-4 grid flex-1 gap-2.5 text-sm md:mt-6 md:gap-3">
        {plan.features.map((feature, index) => (
          <li key={feature} className={`gap-3 ${index > 2 ? "hidden sm:flex" : "flex"}`}>
            <Check className={`mt-0.5 h-4 w-4 shrink-0 ${featured ? "text-loden-200" : "text-loden-500"}`} aria-hidden="true" />
            <span className={featured ? "text-white/85" : "text-loden-muted"}>{feature}</span>
          </li>
        ))}
      </ul>

      <Link
        href={ctaHref}
        data-track={ctaTrack}
        className={`focus-ring relative mt-5 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition md:mt-7 ${
          featured ? "bg-white text-loden-ink hover:bg-loden-50" : "bg-loden-700 text-white hover:bg-loden-800"
        }`}
      >
        {ctaLabel}
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
      </Link>
    </article>
  );
}
