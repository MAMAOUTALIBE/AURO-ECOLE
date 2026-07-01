import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckCircle2 } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { SectionHeader } from "@/components/SectionHeader";
import { InscriptionForm } from "@/components/InscriptionForm";
import { getFormations } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Inscription",
  description:
    "Demandez votre inscription à une formation LODENE. Un conseiller vous rappelle pour finaliser votre dossier.",
  alternates: { canonical: "/inscription" }
};

export default async function InscriptionPage() {
  const formations = await getFormations();
  const options = formations.map((formation) => ({
    slug: formation.slug,
    title: formation.title,
    subtitle: formation.subtitle
  }));

  return (
    <main>
      <PageHero
        eyebrow="Inscription"
        title="Demande d'inscription à une formation"
        text="Laisse tes coordonnées et la formation souhaitée : un conseiller LODENE te rappelle pour finaliser ton inscription."
        cta="Parler à un conseiller"
        ctaHref="/contact"
      />
      <section className="bg-white py-8 md:py-10 xl:py-14">
        <div className="container-pad grid items-start gap-5 md:gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-8">
          <div className="order-2 lg:order-1">
            <SectionHeader
              eyebrow="Comment ça marche"
              title="Simple et sans engagement"
              text="Tu remplis une demande rapide. On te rappelle pour valider ta formation et ton financement, puis on ouvre ton dossier et on te transmet ton accès élève."
            />
            <div className="mt-5 grid gap-3 md:mt-7">
              {[
                "Demande en 1 minute",
                "On te rappelle",
                "Inscription finalisée ensemble",
                "Accès élève transmis par nos soins"
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-loden-pearl p-4 md:rounded-2xl">
                  <CheckCircle2 className="h-5 w-5 text-loden-600" />
                  <span className="font-semibold text-loden-ink">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <Suspense
              fallback={
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-premium md:rounded-3xl md:p-6">
                  Chargement du formulaire...
                </div>
              }
            >
              <InscriptionForm formations={options} />
            </Suspense>
          </div>
        </div>
      </section>
    </main>
  );
}
