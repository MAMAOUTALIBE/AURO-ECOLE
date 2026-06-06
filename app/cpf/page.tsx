import type { Metadata } from "next";
import { cpfSteps } from "@/data/site";
import { CpfRequestForm } from "@/components/CpfRequestForm";
import { PageHero } from "@/components/PageHero";
import { SectionHeader } from "@/components/SectionHeader";

export const metadata: Metadata = {
  title: "CPF et financement",
  description: "Financer son permis avec le CPF, paiement en plusieurs fois, aides régionales et accompagnement administratif LODEN."
};

export default function CpfPage() {
  return (
    <main>
      <PageHero
        eyebrow="CPF & financement"
        title="Finance ton permis avec un accompagnement clair"
        text="LODEN t'aide à vérifier ton solde CPF, préparer ton dossier et choisir le parcours le plus adapté."
        cta="Vérifier mon financement"
        ctaHref="#demande-cpf"
      />
      <section className="bg-white py-14 sm:py-20">
        <div className="container-pad">
          <SectionHeader
            eyebrow="Méthode"
            title="Un dossier CPF simple et sécurisé"
            text="Le financement ne doit pas ralentir ton permis. Chaque étape est cadrée par un conseiller."
            align="center"
          />
          <div className="mt-9 grid gap-5 md:grid-cols-3">
            {cpfSteps.map((step) => {
              const Icon = step.icon;
              return (
                <article key={step.title} className="rounded-3xl border border-slate-200 bg-loden-pearl p-6 shadow-soft">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-loden-700 shadow-soft">
                    <Icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-5 text-xl font-semibold text-loden-ink">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-loden-muted">{step.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>
      <section id="demande-cpf" className="bg-loden-pearl py-14 sm:py-20">
        <div className="container-pad grid items-start gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionHeader
              eyebrow="Demande CPF"
              title="Obtiens une réponse claire avant de t'inscrire"
              text="Le formulaire transmet une demande structurée au CRM LODEN. L'équipe peut ensuite qualifier le dossier, vérifier les pièces utiles et prioriser le planning."
            />
            <div className="mt-6 grid gap-3 text-sm font-medium text-loden-muted">
              {["Éligibilité CPF analysée", "Reste à charge estimé", "Conseiller dédié", "Parcours adapté au planning"].map((item) => (
                <span key={item} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-soft">
                  {item}
                </span>
              ))}
            </div>
          </div>
          <CpfRequestForm />
        </div>
      </section>
      <section className="bg-loden-pearl py-14 sm:py-20">
        <div className="container-pad grid gap-5 md:grid-cols-3">
          {["CPF", "Paiement 3x / 4x", "Aides régionales"].map((item) => (
            <div key={item} className="rounded-3xl bg-white p-6 shadow-soft">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-loden-700">Financement</p>
              <h3 className="mt-3 text-2xl font-semibold text-loden-ink">{item}</h3>
              <p className="mt-3 text-sm leading-6 text-loden-muted">
                Analyse de ton dossier, estimation du reste à charge et conseils pour choisir la meilleure option.
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
