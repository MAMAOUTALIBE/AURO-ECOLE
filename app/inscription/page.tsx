import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckCircle2 } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { SectionHeader } from "@/components/SectionHeader";
import { StudentRegistrationForm } from "@/components/StudentRegistrationForm";

export const metadata: Metadata = {
  title: "Inscription",
  description: "Créer son compte élève LODENE et démarrer une formation permis avec suivi personnalisé.",
  alternates: { canonical: "/inscription" }
};

export default function InscriptionPage() {
  return (
    <main>
      <PageHero
        eyebrow="Inscription élève"
        title="Crée ton espace LODENE et prépare ton parcours permis"
        text="Un compte élève permet de centraliser la formation choisie, les heures, le planning et le futur suivi de progression."
        cta="Parler à un conseiller"
        ctaHref="/contact"
      />
      <section className="bg-white py-14 sm:py-20">
        <div className="container-pad grid items-start gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionHeader
              eyebrow="Compte élève"
              title="Une inscription prête pour le futur espace élève"
              text="Le backend crée le profil utilisateur, le profil élève et rattache la formation souhaitée. Les prochaines étapes pourront ajouter documents, paiements et réservations authentifiées."
            />
            <div className="mt-7 grid gap-3">
              {["Profil élève sécurisé", "Formation rattachée", "JWT prêt pour l'espace élève", "Connexion CRM administrateur"].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-loden-pearl p-4">
                  <CheckCircle2 className="h-5 w-5 text-loden-600" />
                  <span className="font-semibold text-loden-ink">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <Suspense fallback={<div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-premium">Chargement du formulaire...</div>}>
            <StudentRegistrationForm />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
