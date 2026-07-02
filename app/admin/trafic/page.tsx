import type { Metadata } from "next";
import { TrafficAnalytics } from "@/components/crm/TrafficAnalytics";
import { CrmPageHeader } from "@/components/crm/ui";

export const metadata: Metadata = {
  title: "Statistiques & Trafic",
  description: "Trafic du site, sources, clics et conversions commerciales LODENE.",
  robots: { index: false, follow: false }
};

export default function AdminTrafficPage() {
  return (
    <>
      <CrmPageHeader
        eyebrow="Reporting"
        title="Statistiques & Trafic"
        subtitle="Visiteurs, sources d'acquisition, pages clés et conversions (prospects, RDV, inscriptions) — pour piloter la croissance."
      />
      <TrafficAnalytics />
    </>
  );
}
