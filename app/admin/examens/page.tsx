import type { Metadata } from "next";
import { Exams } from "@/components/crm/Exams";
import { PageHero } from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Examens — CRM",
  robots: { index: false, follow: false }
};

export default function AdminExamsPage() {
  return (
    <main>
      <PageHero
        eyebrow="CRM · Pédagogie"
        title="Examens & réussite"
        text="Programmation des examens code et conduite, saisie des résultats et taux de réussite."
        cta="Retour au CRM"
        ctaHref="/admin"
      />
      <section className="bg-loden-pearl py-14 sm:py-20">
        <div className="container-pad">
          <Exams />
        </div>
      </section>
    </main>
  );
}
