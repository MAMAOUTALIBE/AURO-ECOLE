import type { Metadata } from "next";
import { ContractsManager } from "@/components/crm/ContractsManager";
import { CrmPageHeader } from "@/components/crm/ui";

export const metadata: Metadata = {
  title: "Contrats",
  robots: { index: false, follow: false }
};

export default function AdminContractsPage() {
  return (
    <>
      <CrmPageHeader
        eyebrow="Commercial"
        title="Contrats de formation"
        subtitle="Rédigez, activez et suivez les contrats (brouillon → actif → résilié/terminé). Document imprimable et signable."
      />
      <ContractsManager />
    </>
  );
}
