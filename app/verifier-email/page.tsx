import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { SectionHeader } from "@/components/SectionHeader";
import { VerifyEmailClient } from "@/components/VerifyEmailClient";

export const metadata: Metadata = {
  title: "Vérification de l'email",
  description: "Confirme l'adresse email de ton compte LODENE Auto-École.",
  robots: { index: false, follow: false }
};

export default async function VerifierEmailPage({
  searchParams
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <main>
      <PageHero
        eyebrow="Espace élève"
        title="Confirmation de ton adresse email"
        text="On vérifie ton lien pour activer la confirmation de ton compte LODENE."
        cta="Retour à la connexion"
        ctaHref="/connexion"
      />
      <section className="bg-white py-14 sm:py-20">
        <div className="container-pad grid items-start gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <SectionHeader
            eyebrow="Sécurité du compte"
            title="Une adresse vérifiée pour sécuriser ton suivi"
            text="La vérification de ton email nous permet de te recontacter en toute sécurité et de protéger l'accès à ton espace."
          />
          <VerifyEmailClient token={token?.trim() ?? ""} />
        </div>
      </section>
    </main>
  );
}
