import type { Metadata } from "next";
import { AiAssistant } from "@/components/crm/AiAssistant";
import { PageHero } from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Assistant IA — CRM",
  robots: { index: false, follow: false }
};

export default function AdminAssistantPage() {
  return (
    <main>
      <PageHero
        eyebrow="CRM · IA"
        title="Assistant IA"
        text="Résumez les demandes, qualifiez les prospects et générez des contenus — en un clic."
        cta="Retour au CRM"
        ctaHref="/admin"
      />
      <section className="bg-loden-pearl py-14 sm:py-20">
        <div className="container-pad">
          <AiAssistant />
        </div>
      </section>
    </main>
  );
}
