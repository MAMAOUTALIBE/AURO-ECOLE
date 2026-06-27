import type { Metadata } from "next";
import { values } from "@/data/site";
import { InstructorsGrid } from "@/components/InstructorsGrid";
import { PageHero } from "@/components/PageHero";
import { SectionHeader } from "@/components/SectionHeader";

export const metadata: Metadata = {
  title: "À propos",
  description: "Découvrez l'histoire, la mission, les valeurs et l'équipe de LODENE Auto-École.",
  alternates: { canonical: "/a-propos" }
};

export default function AboutPage() {
  return (
    <main>
      <PageHero
        eyebrow="À propos"
        title="Une auto-école pensée comme une plateforme de confiance"
        text="LODENE combine exigence pédagogique, expérience digitale et service premium pour moderniser l'apprentissage de la conduite."
      />
      <section className="bg-white py-8 sm:py-20">
        <div className="container-pad grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <SectionHeader
            eyebrow="Mission"
            title="Rendre le permis plus clair, plus rapide et plus rassurant"
            text="Notre ambition est de devenir une référence nationale des auto-écoles nouvelle génération, avec un parcours simple, des moniteurs sélectionnés et une transparence totale."
          />
            <div className="grid gap-3 sm:grid-cols-3 sm:gap-5">
            {values.map((value) => {
              const Icon = value.icon;
              return (
                <article key={value.title} className="rounded-2xl border border-slate-200 bg-loden-pearl p-4 sm:rounded-3xl sm:p-6">
                  <Icon className="h-7 w-7 text-loden-700" />
                  <h3 className="mt-4 font-semibold text-loden-ink sm:mt-5">{value.title}</h3>
                  <p className="mt-2 hidden text-sm leading-6 text-loden-muted sm:block">{value.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>
      <section className="bg-loden-pearl py-8 sm:py-20">
        <div className="container-pad">
          <SectionHeader
            eyebrow="Équipe"
            title="Des experts de terrain, une culture de service"
            text="L'équipe LODENE est organisée pour répondre vite, planifier mieux et accompagner chaque élève jusqu'à l'examen."
          />
          <InstructorsGrid />
        </div>
      </section>
    </main>
  );
}
