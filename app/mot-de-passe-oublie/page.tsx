import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";
import { PageHero } from "@/components/PageHero";
import { SectionHeader } from "@/components/SectionHeader";

export const metadata: Metadata = {
  title: "Mot de passe oublié",
  description: "Réinitialise le mot de passe de ton espace élève LODENE Auto-École.",
  robots: { index: false, follow: false }
};

export default function MotDePasseOubliePage() {
  return (
    <main>
      <PageHero
        eyebrow="Espace élève"
        title="Réinitialise ton mot de passe"
        text="On t'envoie un lien sécurisé pour choisir un nouveau mot de passe et retrouver ton suivi LODENE."
        cta="Retour à la connexion"
        ctaHref="/connexion"
      />
      <section className="bg-white py-8 sm:py-20">
        <div className="container-pad grid items-start gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <SectionHeader
            eyebrow="Récupération d'accès"
            title="Un lien sécurisé, valable une heure"
            text="Saisis ton email. Si un compte existe, tu reçois un lien pour choisir un nouveau mot de passe."
          />
          <ForgotPasswordForm />
        </div>
      </section>
    </main>
  );
}
