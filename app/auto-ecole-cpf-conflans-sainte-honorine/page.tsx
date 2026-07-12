import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, CalendarCheck, FileCheck2, WalletCards } from "lucide-react";
import { BreadcrumbJsonLd } from "@/components/BreadcrumbJsonLd";
import { CpfRequestForm } from "@/components/CpfRequestForm";
import { PageHero } from "@/components/PageHero";
import { SectionHeader } from "@/components/SectionHeader";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Auto-école CPF Conflans-Sainte-Honorine",
  description:
    "Financez votre permis avec le CPF à Conflans-Sainte-Honorine (78) avec LODENE Auto-École : diagnostic, devis, accompagnement administratif et planning adapté.",
  path: "/auto-ecole-cpf-conflans-sainte-honorine"
});

const cpfFaq = [
  {
    question: "Le permis B est-il finançable avec le CPF ?",
    answer: "Oui, selon ton dossier et ton objectif professionnel. LODENE vérifie l'éligibilité avant de préparer le devis."
  },
  {
    question: "Puis-je compléter avec un paiement en plusieurs fois ?",
    answer: "Oui, si le solde CPF ne couvre pas tout le parcours, l'équipe peut proposer un reste à charge clair."
  },
  {
    question: "Combien de temps prend la validation ?",
    answer: "Le délai dépend du dossier CPF et des pièces fournies. Le diagnostic permet de cadrer rapidement les prochaines étapes."
  }
];

export default function AutoEcoleCpfParisPage() {
  return (
    <main>
      <BreadcrumbJsonLd
        items={[
          { name: "Accueil", path: "/" },
          { name: "Auto-école CPF à Conflans-Sainte-Honorine", path: "/auto-ecole-cpf-conflans-sainte-honorine" }
        ]}
      />
      <PageHero
        eyebrow="CPF permis Conflans-Sainte-Honorine"
        title="Finance ton permis avec le CPF à Conflans-Sainte-Honorine"
        text="LODENE t'aide à comprendre ton solde, préparer ton dossier et choisir une formation compatible avec ton planning."
        cta="Vérifier mon CPF"
        ctaHref="#demande-cpf"
      />
      <section className="bg-white py-8 md:py-12 xl:py-16">
        <div className="container-pad grid gap-5 md:gap-7 lg:grid-cols-[0.9fr_1.1fr]">
          <SectionHeader
            eyebrow="Accompagnement CPF"
            title="Un dossier clair avant engagement"
            text="Le financement CPF doit rassurer, pas compliquer l'inscription. LODENE centralise le diagnostic, le devis et les prochaines étapes administratives."
          />
          <div className="grid gap-3 sm:grid-cols-3 md:gap-4">
            <Step icon={FileCheck2} title="Diagnostic" text="Solde, formation et pièces nécessaires." />
            <Step icon={WalletCards} title="Reste à charge" text="Estimation claire avant inscription." />
            <Step icon={CalendarCheck} title="Planning" text="Créneaux adaptés après validation." />
          </div>
        </div>
      </section>
      <section id="demande-cpf" className="bg-loden-pearl py-8 md:py-12 xl:py-16">
        <div className="container-pad grid items-start gap-5 md:gap-7 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionHeader
              eyebrow="Demande rapide"
              title="Demande une analyse CPF"
              text="Envoie les informations essentielles. L'équipe revient avec une réponse claire."
            />
            <Link className="focus-ring mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 font-semibold text-loden-ink shadow-soft hover:bg-loden-50 md:mt-7 sm:w-auto" href="/tarifs">
              Comparer les tarifs
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
          </div>
          <CpfRequestForm />
        </div>
      </section>
      <section className="bg-white py-8 md:py-12 xl:py-16">
        <div className="container-pad">
          <SectionHeader
            eyebrow="Questions CPF"
            title="Les points à vérifier avant de démarrer"
            text="Ces réponses cadrent les questions fréquentes avant l'analyse personnalisée."
          />
          <div className="mt-5 grid gap-3 md:mt-7 md:grid-cols-3 md:gap-4">
            {cpfFaq.map((item) => (
              <article key={item.question} className="rounded-xl border border-slate-200 bg-loden-pearl p-4 shadow-soft md:rounded-2xl md:p-5">
                <BadgeCheck className="h-6 w-6 text-loden-700" aria-hidden="true" />
                <h2 className="mt-3 text-lg font-semibold text-loden-ink md:mt-4">{item.question}</h2>
                <p className="mt-2 hidden text-sm leading-6 text-loden-muted md:block">{item.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function Step({ icon: Icon, title, text }: { icon: typeof FileCheck2; title: string; text: string }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-loden-pearl p-4 shadow-soft md:rounded-2xl md:p-5">
      <Icon className="h-6 w-6 text-loden-700" aria-hidden="true" />
      <h2 className="mt-3 text-lg font-semibold text-loden-ink md:mt-4 md:text-xl">{title}</h2>
      <p className="mt-2 hidden text-sm leading-6 text-loden-muted md:block">{text}</p>
    </article>
  );
}
