import type { Metadata } from "next";
import { RapportsManager } from "@/components/crm/RapportsManager";
import { CrmPageHeader } from "@/components/crm/ui";

export const metadata: Metadata = {
  title: "Rapports",
  robots: { index: false, follow: false }
};

export default function AdminReportsPage() {
  return (
    <>
      <CrmPageHeader
        eyebrow="Reporting"
        title="Rapports"
        subtitle="Rapport d'activité consolidé, exportable en CSV et imprimable (PDF)."
      />
      <RapportsManager />
    </>
  );
}
