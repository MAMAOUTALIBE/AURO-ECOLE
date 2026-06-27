import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHero } from "@/components/PageHero";
import { PaymentIntentForm } from "@/components/PaymentIntentForm";

export const metadata: Metadata = {
  title: "Paiement sécurisé",
  description: "Préparation du paiement formation LODENE avec une base compatible Stripe."
};

export default function PaiementPage() {
  return (
    <main>
      <PageHero
        eyebrow="Paiement"
        title="Prépare ton paiement LODENE en toute sécurité"
        text="Choisis ton pack et prépare l'étape de paiement depuis ton espace élève."
        cta="Voir les tarifs"
        ctaHref="/tarifs"
      />
      <section className="bg-loden-pearl py-8 sm:py-20">
        <div className="container-pad">
          <Suspense fallback={<div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-premium sm:rounded-3xl sm:p-6">Chargement du paiement...</div>}>
            <PaymentIntentForm />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
