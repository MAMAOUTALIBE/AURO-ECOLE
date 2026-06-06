import type { Metadata } from "next";
import { Star } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { ReviewsGrid } from "@/components/ReviewsGrid";
import { SectionHeader } from "@/components/SectionHeader";

export const metadata: Metadata = {
  title: "Avis",
  description: "Avis Google, témoignages élèves et indicateurs de satisfaction LODEN Auto-École."
};

export default function AvisPage() {
  return (
    <main>
      <PageHero
        eyebrow="Avis clients"
        title="Des élèves accompagnés avec sérieux jusqu'à l'examen"
        text="Avis Google, retours d'expérience et satisfaction suivent la même exigence : transparence et progression."
      />
      <section className="bg-white py-14 sm:py-20">
        <div className="container-pad">
          <div className="grid gap-5 md:grid-cols-3">
            {[
              ["4,9/5", "Note Google moyenne"],
              ["98 %", "Réussite sur parcours complet"],
              ["92 %", "Élèves recommandent LODEN"]
            ].map(([value, label]) => (
              <div key={label} className="rounded-3xl border border-slate-200 bg-loden-pearl p-6 text-center shadow-soft">
                <div className="mx-auto flex w-max gap-1 text-loden-500">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className="h-4 w-4 fill-loden-500" />
                  ))}
                </div>
                <p className="mt-4 text-4xl font-semibold text-loden-ink">{value}</p>
                <p className="mt-2 text-sm text-loden-muted">{label}</p>
              </div>
            ))}
          </div>
          <SectionHeader
            className="mt-14"
            eyebrow="Témoignages"
            title="Ils ont passé leur permis avec LODEN"
            text="Des avis publiés, prêts pour une modération CRM et une future synchronisation Google Reviews."
            align="center"
          />
          <ReviewsGrid />
        </div>
      </section>
    </main>
  );
}
