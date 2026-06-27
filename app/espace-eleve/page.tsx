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
        text="Retrouve ton dossier, tes prochaines actions et les informations utiles pour avancer."
        cta="Créer un compte"
        ctaHref="/inscription"
      />
      <section className="bg-loden-pearl py-8 sm:py-20">
        <div className="container-pad">
          <StudentDashboard />
        </div>
      </section>
    </main>
  );
}
