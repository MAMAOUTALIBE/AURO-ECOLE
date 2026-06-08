import Link from "next/link";
import { ArrowRight, BadgeEuro, Car, Check, Gauge, Sparkles, Zap, type LucideIcon } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { PricingPlan } from "@/data/site";

type Visual = { icon: LucideIcon; gradient: string };

// Identité visuelle par pack — alignée sur les dégradés des formations (cohérence LODEN).
const VISUALS: Record<string, Visual> = {
  "permis-b": { icon: Car, gradient: "linear-gradient(135deg,#0e7490,#08AEB8 55%,#22d3ee)" },
  "permis-accelere": { icon: Zap, gradient: "linear-gradient(135deg,#b45309,#f59e0b 55%,#fbbf24)" },
  "boite-automatique": { icon: Gauge, gradient: "linear-gradient(135deg,#0891a0,#22d3ee 55%,#38bdf8)" },
  "pack-cpf": { icon: BadgeEuro, gradient: "linear-gradient(135deg,#0f766e,#10b981 55%,#34d399)" }
};
const FALLBACK: Visual = { icon: Sparkles, gradient: "linear-gradient(135deg,#155e75,#0e7490 55%,#14b8a6)" };

export function PricingCard({ plan, featured = false }: { plan: PricingPlan; featured?: boolean }) {
  const ctaHref = plan.price === 0 ? "/cpf" : `/paiement?plan=${encodeURIComponent(plan.id)}`;
  const visual = VISUALS[plan.slug] ?? FALLBACK;
  const Icon = visual.icon;

  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border p-6 shadow-soft transition duration-300 hover:-translate-y-1.5 hover:shadow-premium ${
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
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-soft" style={{ backgroundImage: visual.gradient }}>
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${featured ? "bg-white/15 text-white ring-1 ring-white/25" : "bg-loden-50 text-loden-700"}`}>{plan.badge}</span>
      </div>

      <h3 className="relative mt-5 text-xl font-semibold">{plan.title}</h3>

      <div className="relative mt-3">
        <p className="text-sm opacity-70">À partir de</p>
        <p className="mt-1 text-4xl font-semibold tracking-tight">
          {plan.price === 0 ? "Sur devis" : formatCurrency(plan.price)}
        </p>
      </div>

      <ul className="relative mt-6 grid flex-1 gap-3 text-sm">
        {plan.features.map((feature) => (
          <li key={feature} className="flex gap-3">
            <Check className={`mt-0.5 h-4 w-4 shrink-0 ${featured ? "text-loden-200" : "text-loden-500"}`} aria-hidden="true" />
            <span className={featured ? "text-white/85" : "text-loden-muted"}>{feature}</span>
          </li>
        ))}
      </ul>

      <Link
        href={ctaHref}
        className={`focus-ring relative mt-7 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition ${
          featured ? "bg-white text-loden-ink hover:bg-loden-50" : "bg-loden-700 text-white hover:bg-loden-800"
        }`}
      >
        {plan.cta}
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
      </Link>
    </article>
  );
}
