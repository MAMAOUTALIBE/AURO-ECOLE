import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, CalendarCheck, FileCheck2, WalletCards } from "lucide-react";
import { CpfRequestForm } from "@/components/CpfRequestForm";
import { PageHero } from "@/components/PageHero";
import { SectionHeader } from "@/components/SectionHeader";

export const metadata: Metadata = {
  title: "Auto-école CPF Conflans-Sainte-Honorine",
  description:
    "Financez votre permis avec le CPF à Conflans-Sainte-Honorine (78) avec LODENE Auto-École : diagnostic, devis, accompagnement administratif et planning adapté.",
  alternates: { canonical: "/auto-ecole-cpf-paris" }
};

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
      <PageHero
        eyebrow="CPF permis Conflans-Sainte-Honorine"
        title="Finance ton permis avec le CPF à Conflans-Sainte-Honorine"
        text="LODENE t'aide à comprendre ton solde, préparer ton dossier et choisir une formation compatible avec ton planning."
        cta="Vérifier mon CPF"
        ctaHref="#demande-cpf"
      />
      <section className="bg-white py-14 sm:py-20">
        <div className="container-pad grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <SectionHeader
            eyebrow="Accompagnement CPF"
            title="Un dossier clair avant engagement"
            text="Le financement CPF doit rassurer, pas compliquer l'inscription. LODENE centralise le diagnostic, le devis et les prochaines étapes administratives."
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <Step icon={FileCheck2} title="Diagnostic" text="Solde, formation et pièces nécessaires." />
            <Step icon={WalletCards} title="Reste à charge" text="Estimation claire avant inscription." />
            <Step icon={CalendarCheck} title="Planning" text="Créneaux adaptés après validation." />
          </div>
        </div>
      </section>
      <section id="demande-cpf" className="bg-loden-pearl py-14 sm:py-20">
        <div className="container-pad grid items-start gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionHeader
              eyebrow="Demande rapide"
              title="Demande une analyse CPF"
              text="Transmets les informations utiles pour que l'équipe prépare une réponse exploitable : formation, montant estimé, disponibilité et situation."
            />
            <Link className="focus-ring mt-8 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 font-semibold text-loden-ink shadow-soft hover:bg-loden-50" href="/tarifs">
              Comparer les tarifs
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
          </div>
          <CpfRequestForm />
        </div>
      </section>
      <section className="bg-white py-14 sm:py-20">
        <div className="container-pad">
          <SectionHeader
            eyebrow="Questions CPF"
            title="Les points à vérifier avant de démarrer"
            text="Ces réponses cadrent les questions fréquentes avant l'analyse personnalisée."
          />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {cpfFaq.map((item) => (
              <article key={item.question} className="rounded-3xl border border-slate-200 bg-loden-pearl p-6 shadow-soft">
                <BadgeCheck className="h-6 w-6 text-loden-700" aria-hidden="true" />
                <h2 className="mt-4 text-lg font-semibold text-loden-ink">{item.question}</h2>
                <p className="mt-2 text-sm leading-6 text-loden-muted">{item.answer}</p>
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
    <article className="rounded-3xl border border-slate-200 bg-loden-pearl p-6 shadow-soft">
      <Icon className="h-6 w-6 text-loden-700" aria-hidden="true" />
      <h2 className="mt-4 text-xl font-semibold text-loden-ink">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-loden-muted">{text}</p>
    </article>
  );
}
