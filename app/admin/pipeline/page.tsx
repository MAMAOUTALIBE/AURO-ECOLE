import type { Metadata } from "next";
import { Pipeline } from "@/components/crm/Pipeline";
import { PageHero } from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Pipeline commercial — CRM",
  robots: { index: false, follow: false }
};

export default function AdminPipelinePage() {
  return (
    <main>
      <PageHero
        eyebrow="CRM · Acquisition"
        title="Pipeline commercial"
        text="Suivi des prospects de la demande entrante à l'inscription, par étape et par agence."
        cta="Retour au CRM"
        ctaHref="/admin"
      />
      <section className="bg-loden-pearl py-14 sm:py-20">
        <div className="container-pad">
          <Pipeline />
        </div>
      </section>
    </main>
  );
}
