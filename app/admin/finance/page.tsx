import type { Metadata } from "next";
import { Finance } from "@/components/crm/Finance";
import { PageHero } from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Finance — CRM",
  robots: { index: false, follow: false }
};

export default function AdminFinancePage() {
  return (
    <main>
      <PageHero
        eyebrow="CRM · Finance"
        title="Paiements & encaissements"
        text="Suivi des paiements, encaissements, remboursements et enregistrement manuel, par agence."
        cta="Retour au CRM"
        ctaHref="/admin"
      />
      <section className="bg-loden-pearl py-14 sm:py-20">
        <div className="container-pad">
          <Finance />
        </div>
      </section>
    </main>
  );
}
