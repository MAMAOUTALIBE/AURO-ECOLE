import type { Metadata } from "next";
import { PartnerDashboard } from "@/components/PartnerDashboard";
import { PageHero } from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Espace partenaire",
  description: "Espace partenaire LODENE : recommandez des candidats, suivez leur conversion et vos commissions.",
  robots: { index: false, follow: false }
};

export default function EspacePartenairePage() {
  return (
    <main>
      <PageHero
        eyebrow="Espace partenaire"
        title="Recommandez, suivez, encaissez"
        text="Envoyez vos candidats à LODENE, suivez leur avancement et le détail de vos commissions. Réservé aux partenaires prescripteurs."
      />
      <section className="bg-loden-pearl py-8 md:py-12 xl:py-16">
        <div className="container-pad">
          <PartnerDashboard />
        </div>
      </section>
    </main>
  );
}
