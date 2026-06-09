import type { Metadata } from "next";
import { Reporting } from "@/components/crm/Reporting";
import { CrmPageHeader } from "@/components/crm/ui";

export const metadata: Metadata = {
  title: "Reporting",
  robots: { index: false, follow: false }
};

export default function AdminReportingPage() {
  return (
    <>
      <CrmPageHeader
        eyebrow="Reporting"
        title="Statistiques par agence"
        subtitle="Indicateurs clés par agence : élèves, prospects, leçons, taux de réussite, encaissements."
      />
      <Reporting />
    </>
  );
}
