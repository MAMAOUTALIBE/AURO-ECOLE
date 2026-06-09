import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { StudentDashboard } from "@/components/StudentDashboard";

export const metadata: Metadata = {
  title: "Espace élève",
  description: "Tableau de bord élève LODENE Auto-École."
};

export default function EspaceElevePage() {
  return (
    <main>
      <PageHero
        eyebrow="Espace élève"
        title="Ton parcours permis centralisé"
        text="Un premier tableau de bord connecté au backend pour préparer la progression, les réservations et les documents."
        cta="Créer un compte"
        ctaHref="/inscription"
      />
      <section className="bg-loden-pearl py-14 sm:py-20">
        <div className="container-pad">
          <StudentDashboard />
        </div>
      </section>
    </main>
  );
}
