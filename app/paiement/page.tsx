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
        text="Un parcours connecté au backend pour préparer le futur checkout Stripe sans paiement réel à ce stade."
        cta="Voir les tarifs"
        ctaHref="/tarifs"
      />
      <section className="bg-loden-pearl py-14 sm:py-20">
        <div className="container-pad">
          <Suspense fallback={<div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-premium">Chargement du paiement...</div>}>
            <PaymentIntentForm />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
