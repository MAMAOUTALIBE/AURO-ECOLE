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
      <section className="bg-white py-8 md:py-14 xl:py-20">
        <div className="container-pad grid items-start gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="order-2 lg:order-1">
            <SectionHeader
              eyebrow="Compte élève"
              title="Ton dossier élève démarre ici"
              text="Choisis ta formation, laisse tes coordonnées et retrouve ensuite les prochaines étapes dans ton espace élève."
            />
            <div className="mt-7 grid gap-3">
              {["Profil élève sécurisé", "Formation choisie", "Suivi centralisé", "Conseiller disponible"].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-loden-pearl p-4">
                  <CheckCircle2 className="h-5 w-5 text-loden-600" />
                  <span className="font-semibold text-loden-ink">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <Suspense fallback={<div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-premium sm:rounded-3xl sm:p-6">Chargement du formulaire...</div>}>
              <StudentRegistrationForm />
            </Suspense>
          </div>
        </div>
      </section>
    </main>
  );
}
