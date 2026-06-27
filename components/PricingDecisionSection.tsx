import Link from "next/link";
import { ArrowRight, BadgeCheck, CalendarCheck, CreditCard, Timer, WalletCards } from "lucide-react";
import { SectionHeader } from "@/components/SectionHeader";

const recommendations = [
  {
    icon: BadgeCheck,
    profile: "Je démarre de zéro",
    plan: "Permis B",
    budget: "Sur devis",
    text: "Parcours complet avec code, 20 h de conduite et suivi élève."
  },
  {
    icon: Timer,
    profile: "Je veux aller vite",
    plan: "Permis accéléré",
    budget: "Sur devis",
    text: "Créneaux priorisés et rythme condensé sur quelques semaines."
  },
  {
    icon: CalendarCheck,
    profile: "Je veux plus simple",
    plan: "Boîte automatique",
    budget: "Sur devis",
    text: "Formation plus courte, conduite fluide et conversion possible."
  },
  {
    icon: WalletCards,
    profile: "Je finance avec le CPF",
    plan: "Pack CPF",
    budget: "Sur devis",
    text: "Diagnostic, devis et accompagnement administratif avant inscription."
  }
];

const financingOptions = [
  "Paiement comptant sécurisé",
  "Paiement 3x / 4x selon dossier",
  "CPF accompagné avec reste à charge estimé",
  "Devis personnalisé avant engagement"
];

export function PricingDecisionSection() {
  return (
    <section className="bg-white py-8 md:py-14 xl:py-20">
      <div className="container-pad">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <SectionHeader
              eyebrow="Aide au choix"
              title="Quel pack correspond à ton objectif ?"
              text="Les tarifs deviennent plus simples quand ils sont reliés à ton niveau, ton urgence et ton financement."
            />
            <div className="mt-6 rounded-2xl border border-slate-200 bg-loden-pearl p-4 shadow-soft sm:rounded-3xl md:mt-8 md:p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-loden-700 shadow-soft">
                  <CreditCard className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-semibold text-loden-ink">Financement flexible</p>
                  <p className="mt-1 text-sm text-loden-muted">À confirmer avec un conseiller avant paiement.</p>
                </div>
              </div>
              <div className="mt-5 grid gap-3">
                {financingOptions.map((option) => (
                  <div key={option} className="flex items-center gap-3 rounded-2xl bg-white p-3 sm:p-4">
                    <BadgeCheck className="h-5 w-5 text-loden-600" aria-hidden="true" />
                    <span className="text-sm font-semibold text-loden-ink">{option}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/contact"
                className="focus-ring mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-loden-700 px-5 py-3 text-sm font-semibold text-white hover:bg-loden-800"
              >
                Obtenir un devis clair
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 md:gap-4">
            {recommendations.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.profile} className="rounded-2xl border border-slate-200 bg-loden-pearl p-4 shadow-soft md:rounded-3xl md:p-6">
                  <Icon className="h-6 w-6 text-loden-700" aria-hidden="true" />
                  <p className="mt-4 text-sm font-semibold uppercase tracking-[0.12em] text-loden-muted md:mt-5">{item.profile}</p>
                  <h3 className="mt-2 text-xl font-semibold text-loden-ink">{item.plan}</h3>
                  <p className="mt-2 text-lg font-semibold text-loden-700">{item.budget}</p>
                  <p className="mt-3 hidden text-sm leading-6 text-loden-muted sm:block">{item.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
