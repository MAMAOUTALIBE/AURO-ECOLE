import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { PricingPlansGrid } from "@/components/PricingPlansGrid";
import { SimulatorCard } from "@/components/SimulatorCard";
import { SectionHeader } from "@/components/SectionHeader";

export const metadata: Metadata = {
  title: "Tarifs",
  description: "Tarifs permis B, permis accéléré, boîte automatique, CPF et paiement en plusieurs fois chez LODEN."
};

export default function TarifsPage() {
  return (
    <main>
      <PageHero
        eyebrow="Tarifs"
        title="Des prix lisibles et un budget maîtrisé"
        text="Packs permis, financement CPF et paiement fractionné avec une estimation transparente avant inscription."
      />
      <section className="bg-white py-14 sm:py-20">
        <PricingPlansGrid />
      </section>
      <section className="bg-loden-pearl py-14 sm:py-20">
        <div className="container-pad grid items-start gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionHeader
              eyebrow="Simulation"
              title="Ajuste ton parcours avant le devis"
              text="Le simulateur donne un ordre de grandeur immédiat selon la formation, les heures et le financement."
            />
            <div className="mt-8 grid gap-3">
              {["Paiement en plusieurs fois", "CPF accompagné", "Pack code + conduite", "Devis personnalisé"].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-soft">
                  <CheckCircle2 className="h-5 w-5 text-loden-500" />
                  <span className="font-semibold text-loden-ink">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <SimulatorCard />
        </div>
      </section>
    </main>
  );
}
