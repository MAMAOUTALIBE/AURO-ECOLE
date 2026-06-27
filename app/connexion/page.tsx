import type { Metadata } from "next";
import { LoginForm } from "@/components/LoginForm";
import { PageHero } from "@/components/PageHero";
import { SectionHeader } from "@/components/SectionHeader";

export const metadata: Metadata = {
  title: "Connexion élève",
  description: "Connexion à l'espace élève LODENE Auto-École."
};

export default function ConnexionPage() {
  return (
    <main>
      <PageHero
        eyebrow="Espace élève"
        title="Connecte-toi à ton suivi LODENE"
        text="Retrouve ton profil, ta formation et les prochaines briques de suivi élève."
        cta="Créer un compte"
        ctaHref="/inscription"
      />
      <section className="bg-white py-8 sm:py-20">
        <div className="container-pad grid items-start gap-6 sm:gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <SectionHeader
            eyebrow="Connexion"
            title="Un accès sécurisé pour centraliser ton parcours"
            text="Connecte-toi pour retrouver ta formation, ton dossier et tes prochaines actions."
          />
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
