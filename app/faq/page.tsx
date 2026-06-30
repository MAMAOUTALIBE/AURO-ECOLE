import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { FaqSection } from "@/components/FaqSection";

export const metadata: Metadata = {
  title: "FAQ — Permis B, VTC, SST, logistique & financement | LODENE",
  description:
    "Toutes les réponses sur les formations LODENE à Conflans-Sainte-Honorine : permis B, boîte automatique, VTC, SST, logistique, tarifs et financement CPF.",
  alternates: { canonical: "/faq" }
};

export default function FaqPage() {
  return (
    <main>
      <PageHero
        eyebrow="Questions fréquentes"
        title="Vos questions, nos réponses"
        text="Permis B, VTC, SST, logistique, tarifs et financement : l'essentiel pour préparer votre projet en toute clarté."
        cta="Être rappelé par un conseiller"
        ctaHref="/contact#demande"
      />
      <FaqSection
        eyebrow="FAQ LODENE"
        title="Les réponses utiles avant de vous engager"
        text="Une question qui n'apparaît pas ici ? Contactez un conseiller, nous vous répondons rapidement."
      />
      <section className="bg-loden-pearl py-8 md:py-12 xl:py-16">
        <div className="container-pad">
          <div className="flex flex-col items-start gap-4 rounded-xl bg-loden-800 p-4 text-white sm:flex-row sm:items-center sm:justify-between md:rounded-2xl md:p-6">
            <div>
              <h2 className="text-xl font-semibold md:text-2xl">Besoin d&apos;une réponse personnalisée ?</h2>
              <p className="mt-2 hidden max-w-2xl text-sm leading-6 text-white/85 sm:block">
                Notre équipe vous oriente vers la bonne formation et vérifie votre financement.
              </p>
            </div>
            <Link
              href="/contact#demande"
              className="focus-ring inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 font-semibold text-loden-800 transition hover:bg-loden-pearl sm:w-auto md:py-4"
            >
              Contacter LODENE
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
