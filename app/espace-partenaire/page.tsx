import type { Metadata } from "next";
import { PartnerDashboard } from "@/components/PartnerDashboard";

export const metadata: Metadata = {
  title: "Nos partenaire",
  description: "Nos partenaire LODENE : venez recuperer le bon de 50 euros.",
  robots: { index: false, follow: false }
};

export default function EspacePartenairePage() {
  return (
    <main>
      <section className="bg-loden-pearl py-6 md:py-10 xl:py-14">
        <div className="container-pad">
          <div className="max-w-2xl md:max-w-3xl">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-loden-700 sm:text-xs md:text-sm md:tracking-[0.14em]">
              NOS PARTENAIRE
            </p>
            <h1 className="mt-2 text-[1.85rem] font-semibold leading-tight text-loden-ink sm:text-4xl md:mt-3 md:text-[2.8rem] xl:text-5xl">
              VENEZ RECUPERER LE BON DE 50 EUROS
            </h1>
          </div>
        </div>
      </section>
      <section className="bg-loden-pearl py-8 md:py-12 xl:py-16">
        <div className="container-pad">
          <PartnerDashboard />
        </div>
      </section>
    </main>
  );
}
