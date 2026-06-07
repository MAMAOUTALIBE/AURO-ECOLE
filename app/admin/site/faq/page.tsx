import type { Metadata } from "next";
import { FaqManager } from "@/components/crm/FaqManager";
import { PageHero } from "@/components/PageHero";

export const metadata: Metadata = {
  title: "FAQ — CRM",
  robots: { index: false, follow: false }
};

export default function AdminFaqPage() {
  return (
    <main>
      <PageHero
        eyebrow="CRM · Site web"
        title="Gestion de la FAQ"
        text="Ajoutez, modifiez et masquez les questions affichées sur le site public."
        cta="Retour au CRM"
        ctaHref="/admin"
      />
      <section className="bg-loden-pearl py-14 sm:py-20">
        <div className="container-pad">
          <FaqManager />
        </div>
      </section>
    </main>
  );
}
