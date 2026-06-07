import type { Metadata } from "next";
import { Planning } from "@/components/crm/Planning";
import { PageHero } from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Planning — CRM",
  robots: { index: false, follow: false }
};

export default function AdminPlanningPage() {
  return (
    <main>
      <PageHero
        eyebrow="CRM · Opérations"
        title="Planning des leçons"
        text="Agenda des réservations par jour, avec moniteur, élève et statut de chaque leçon."
        cta="Retour au CRM"
        ctaHref="/admin"
      />
      <section className="bg-loden-pearl py-14 sm:py-20">
        <div className="container-pad">
          <Planning />
        </div>
      </section>
    </main>
  );
}
