import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Banknote, Building2, GraduationCap, HandCoins, MapPin, ShieldCheck } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { SectionHeader } from "@/components/SectionHeader";
import { CpfRequestForm } from "@/components/CpfRequestForm";

export const metadata: Metadata = {
  title: "Financement de votre formation — CPF, LABAZ, OPCO & aides | LODENE",
  description:
    "Financez votre permis ou votre formation professionnelle avec LODENE : CPF selon éligibilité, aide LABAZ (15-25 ans), OPCO/entreprises, aides régionales et accompagnement administratif.",
  alternates: { canonical: "/financement" }
};

const options = [
  {
    icon: GraduationCap,
    title: "CPF — Compte Personnel de Formation",
    text: "Certaines formations peuvent être financées via le CPF selon votre situation et l'éligibilité de votre dossier. Nous vous accompagnons dans la vérification et le montage."
  },
  {
    icon: HandCoins,
    title: "Aide LABAZ (15-25 ans)",
    text: "Une aide possible pour certains jeunes de 15 à 25 ans afin de réduire le reste à charge de la formation au permis."
  },
  {
    icon: Building2,
    title: "OPCO & entreprises",
    text: "Pour les salariés et les entreprises, une prise en charge OPCO ou employeur est possible selon votre situation (SST, logistique & sécurité notamment)."
  },
  {
    icon: MapPin,
    title: "Aides régionales",
    text: "Selon votre profil et votre territoire, des aides régionales peuvent compléter le financement. Un conseiller vous oriente."
  },
  {
    icon: Banknote,
    title: "Paiement en plusieurs fois",
    text: "Le paiement en 3× ou 4× est possible sur les formules permis, en complément du paiement comptant ou d'un financement."
  },
  {
    icon: ShieldCheck,
    title: "Accompagnement administratif",
    text: "Nous préparons les pièces, le devis et le suivi du dossier jusqu'au démarrage de votre formation."
  }
];

export default function FinancementPage() {
  return (
    <main>
      <PageHero
        eyebrow="Financement"
        title="Des solutions pour financer votre formation"
        text="CPF, LABAZ, OPCO, aides régionales et paiement fractionné : on vous aide à trouver le bon montage et à vérifier votre éligibilité."
        cta="Vérifier mon financement"
        ctaHref="#verifier"
      />

      <section className="bg-white py-8 sm:py-20">
        <div className="container-pad">
          <SectionHeader
            eyebrow="Vos options"
            title="Les dispositifs de financement"
            text="Chaque situation est différente : nous vérifions ce qui s'applique à votre projet avant tout engagement."
            align="center"
          />
          <div className="mt-7 grid gap-3 sm:mt-10 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {options.map((option) => {
              const Icon = option.icon;
              return (
                <div key={option.title} className="rounded-2xl border border-slate-200 bg-loden-pearl p-4 shadow-soft sm:rounded-3xl sm:p-6">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-loden-700 shadow-soft">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-loden-ink">{option.title}</h3>
                  <p className="mt-2 hidden text-sm leading-6 text-loden-muted sm:block">{option.text}</p>
                </div>
              );
            })}
          </div>
          <p className="mx-auto mt-6 max-w-3xl rounded-2xl border border-slate-200 bg-loden-pearl p-4 text-center text-xs leading-5 text-loden-muted sm:mt-8 sm:rounded-3xl sm:p-5 sm:text-sm sm:leading-6">
            Important : aucun financement « 100 % financé » n&apos;est garanti sans validation exacte du dispositif et de
            votre dossier. Un conseiller LODENE confirme votre éligibilité avant toute inscription.
          </p>
        </div>
      </section>

      <section id="verifier" className="scroll-mt-28 bg-loden-pearl py-8 sm:py-20">
        <div className="container-pad grid items-start gap-6 sm:gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionHeader
              eyebrow="Vérification"
              title="Vérifiez votre financement"
              text="Envoyez votre demande : nous étudions votre éligibilité (CPF et autres dispositifs) et revenons vers vous avec un devis clair."
            />
            <div className="mt-6 rounded-2xl bg-loden-800 p-4 text-white sm:mt-8 sm:rounded-3xl sm:p-6">
              <h3 className="text-lg font-semibold sm:text-xl">Besoin d&apos;un échange direct ?</h3>
              <p className="mt-2 hidden text-sm leading-6 text-white/85 sm:block">
                Un conseiller peut vous rappeler pour faire le point sur votre projet et votre financement.
              </p>
              <Link
                href="/contact#demande"
                className="focus-ring mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-loden-800 transition hover:bg-loden-pearl"
              >
                Être rappelé
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
          <CpfRequestForm />
        </div>
      </section>
    </main>
  );
}
