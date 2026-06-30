import type { Metadata } from "next";
import { cpfSteps } from "@/data/site";
import { CpfRequestForm } from "@/components/CpfRequestForm";
import { FaqSection } from "@/components/FaqSection";
import { PageHero } from "@/components/PageHero";
import { SectionHeader } from "@/components/SectionHeader";
import { getFaqEntries } from "@/lib/faq";

export const metadata: Metadata = {
  title: "CPF et financement",
  description: "Financer son permis avec le CPF, paiement en plusieurs fois, aides régionales et accompagnement administratif LODENE.",
  alternates: { canonical: "/cpf" }
};

export default async function CpfPage() {
  const faqItems = await getFaqEntries();
  return (
    <main>
      <PageHero
        eyebrow="CPF & financement"
        title="Finance ton permis avec un accompagnement clair"
        text="LODENE t'aide à vérifier ton solde CPF, préparer ton dossier et choisir le parcours le plus adapté."
        cta="Vérifier mon financement"
        ctaHref="#demande-cpf"
      />
      <section className="bg-white py-8 md:py-12 xl:py-16">
        <div className="container-pad">
          <SectionHeader
            eyebrow="Méthode"
            title="Un dossier CPF simple et sécurisé"
            text="Le financement ne doit pas ralentir ton permis. Chaque étape est cadrée par un conseiller."
            align="center"
          />
          <div className="mt-5 grid gap-3 md:mt-7 md:grid-cols-3 md:gap-4">
            {cpfSteps.map((step) => {
              const Icon = step.icon;
              return (
                <article key={step.title} className="rounded-xl border border-slate-200 bg-loden-pearl p-4 shadow-soft md:rounded-2xl md:p-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-loden-700 shadow-soft md:h-12 md:w-12 md:rounded-2xl">
                    <Icon className="h-5 w-5 md:h-6 md:w-6" />
                  </span>
                  <h3 className="mt-3 text-lg font-semibold text-loden-ink md:mt-5 md:text-xl">{step.title}</h3>
                  <p className="mt-3 hidden text-sm leading-6 text-loden-muted md:block">{step.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>
      <FaqSection items={faqItems} />
      <section id="demande-cpf" className="bg-loden-pearl py-8 md:py-12 xl:py-16">
        <div className="container-pad grid items-start gap-5 md:gap-7 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionHeader
              eyebrow="Demande CPF"
              title="Vérifie ton financement avant de t'inscrire"
              text="Envoie les informations essentielles. Un conseiller te répond avec la formation, le reste à charge et les prochaines étapes."
            />
            <div className="mt-5 grid gap-2.5 text-sm font-medium text-loden-muted sm:grid-cols-2 lg:grid-cols-1">
              {["Éligibilité CPF analysée", "Reste à charge estimé", "Conseiller dédié", "Parcours adapté au planning"].map((item) => (
                <span key={item} className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-soft">
                  {item}
                </span>
              ))}
            </div>
          </div>
          <CpfRequestForm />
        </div>
      </section>
      <section id="aides" className="scroll-mt-28 bg-loden-pearl py-8 md:py-12 xl:py-16">
        <div className="container-pad grid gap-3 md:grid-cols-3 md:gap-5">
          {["CPF", "Paiement 3x / 4x", "Aides régionales"].map((item) => (
            <div key={item} className="rounded-xl bg-white p-4 shadow-soft md:rounded-2xl md:p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-loden-700">Financement</p>
              <h3 className="mt-3 text-2xl font-semibold text-loden-ink">{item}</h3>
              <p className="mt-3 hidden text-sm leading-6 text-loden-muted sm:block">
                Analyse de ton dossier, estimation du reste à charge et conseils pour choisir la meilleure option.
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
