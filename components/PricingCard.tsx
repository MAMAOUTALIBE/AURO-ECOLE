import Link from "next/link";
import { Check } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { PricingPlan } from "@/data/site";

export function PricingCard({
  plan,
  featured = false
}: {
  plan: PricingPlan;
  featured?: boolean;
}) {
  const ctaHref = plan.price === 0 ? "/cpf" : `/paiement?plan=${encodeURIComponent(plan.id)}`;

  return (
    <article className={`flex h-full flex-col rounded-3xl border p-6 shadow-soft ${featured ? "border-loden-300 bg-loden-ink text-white" : "border-slate-200 bg-white text-loden-ink"}`}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xl font-semibold">{plan.title}</h3>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${featured ? "bg-white/14 text-white" : "bg-loden-50 text-loden-700"}`}>
          {plan.badge}
        </span>
      </div>
      <div className="mt-6">
        <p className="text-sm opacity-75">À partir de</p>
        <p className="mt-1 text-4xl font-semibold">{plan.price === 0 ? "Sur devis" : formatCurrency(plan.price)}</p>
      </div>
      <ul className="mt-6 grid flex-1 gap-3 text-sm">
        {plan.features.map((feature) => (
          <li key={feature} className="flex gap-3">
            <Check className={`mt-0.5 h-4 w-4 shrink-0 ${featured ? "text-loden-200" : "text-loden-500"}`} />
            <span className={featured ? "text-white/82" : "text-loden-muted"}>{feature}</span>
          </li>
        ))}
      </ul>
      <Link
        href={ctaHref}
        className={`focus-ring mt-7 rounded-full px-5 py-3 text-center text-sm font-semibold transition ${featured ? "bg-white text-loden-ink hover:bg-loden-50" : "bg-loden-700 text-white hover:bg-loden-800"}`}
      >
        {plan.cta}
      </Link>
    </article>
  );
}
