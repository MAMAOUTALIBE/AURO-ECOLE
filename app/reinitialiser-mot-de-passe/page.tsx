import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";
import { SectionHeader } from "@/components/SectionHeader";

export const metadata: Metadata = {
  title: "Nouveau mot de passe",
  description: "Définis un nouveau mot de passe pour ton espace élève LODENE Auto-École.",
  robots: { index: false, follow: false }
};

export default async function ReinitialiserMotDePassePage({
  searchParams
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <main>
      <PageHero
        eyebrow="Espace élève"
        title="Choisis ton nouveau mot de passe"
        text="Dernière étape : définis un mot de passe et reconnecte-toi à ton suivi LODENE."
        cta="Retour à la connexion"
        ctaHref="/connexion"
      />
      <section className="bg-white py-8 md:py-12 xl:py-16">
        <div className="container-pad grid items-start gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <SectionHeader
            eyebrow="Sécurité du compte"
            title="Un mot de passe solide pour ton espace"
            text="Choisis au moins 10 caractères. Le lien que tu as reçu est à usage unique et expire après une heure."
          />
          <ResetPasswordForm token={token?.trim() ?? ""} />
        </div>
      </section>
    </main>
  );
}
