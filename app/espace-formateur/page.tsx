import type { Metadata } from "next";
import { InstructorDashboard } from "@/components/InstructorDashboard";
import { PageHero } from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Espace formateur",
  description: "Espace formateur LODENE : planning des leçons et examens à venir.",
  robots: { index: false, follow: false }
};

export default function EspaceFormateurPage() {
  return (
    <main>
      <PageHero
        eyebrow="Espace formateur"
        title="Ton planning et tes examens en un coup d'œil"
        text="Retrouve les leçons à venir et les examens programmés. Réservé aux moniteurs et à l'encadrement pédagogique."
      />
      <section className="bg-loden-pearl py-8 md:py-12 xl:py-16">
        <div className="container-pad">
          <InstructorDashboard />
        </div>
      </section>
    </main>
  );
}
