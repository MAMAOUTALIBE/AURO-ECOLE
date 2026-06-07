import type { Metadata } from "next";
import { Reporting } from "@/components/crm/Reporting";
import { PageHero } from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Reporting — CRM",
  robots: { index: false, follow: false }
};

export default function AdminReportingPage() {
  return (
    <main>
      <PageHero
        eyebrow="CRM · Pilotage"
        title="Reporting"
        text="Indicateurs clés par agence : élèves, prospects, leçons, taux de réussite, encaissements."
        cta="Retour au CRM"
        ctaHref="/admin"
      />
      <section className="bg-loden-pearl py-14 sm:py-20">
        <div className="container-pad">
          <Reporting />
        </div>
      </section>
    </main>
  );
}
