import type { Metadata } from "next";
import { values } from "@/data/site";
import { InstructorsGrid } from "@/components/InstructorsGrid";
import { PageHero } from "@/components/PageHero";
import { SectionHeader } from "@/components/SectionHeader";

export const metadata: Metadata = {
  title: "À propos",
  description: "Découvrez l'histoire, la mission, les valeurs et l'équipe de LODEN Auto-École."
};

export default function AboutPage() {
  return (
    <main>
      <PageHero
        eyebrow="À propos"
        title="Une auto-école pensée comme une plateforme de confiance"
        text="LODEN combine exigence pédagogique, expérience digitale et service premium pour moderniser l'apprentissage de la conduite."
      />
      <section className="bg-white py-14 sm:py-20">
        <div className="container-pad grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <SectionHeader
            eyebrow="Mission"
            title="Rendre le permis plus clair, plus rapide et plus rassurant"
            text="Notre ambition est de devenir une référence nationale des auto-écoles nouvelle génération, avec un parcours simple, des moniteurs sélectionnés et une transparence totale."
          />
          <div className="grid gap-5 sm:grid-cols-3">
            {values.map((value) => {
              const Icon = value.icon;
              return (
                <article key={value.title} className="rounded-3xl border border-slate-200 bg-loden-pearl p-6">
                  <Icon className="h-7 w-7 text-loden-700" />
                  <h3 className="mt-5 font-semibold text-loden-ink">{value.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-loden-muted">{value.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>
      <section className="bg-loden-pearl py-14 sm:py-20">
        <div className="container-pad">
          <SectionHeader
            eyebrow="Équipe"
            title="Des experts de terrain, une culture de service"
            text="L'équipe LODEN est organisée pour répondre vite, planifier mieux et accompagner chaque élève jusqu'à l'examen."
          />
          <InstructorsGrid />
        </div>
      </section>
    </main>
  );
}
