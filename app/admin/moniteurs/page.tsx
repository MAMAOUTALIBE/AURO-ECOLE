import type { Metadata } from "next";
import { InstructorsManager } from "@/components/crm/InstructorsManager";
import { CrmPageHeader } from "@/components/crm/ui";

export const metadata: Metadata = {
  title: "Moniteurs",
  robots: { index: false, follow: false }
};

export default function AdminInstructorsPage() {
  return (
    <>
      <CrmPageHeader
        eyebrow="Pédagogie"
        title="Moniteurs"
        subtitle="Créez les comptes moniteurs, leurs spécialités et zones, et gérez leur activation."
      />
      <InstructorsManager />
    </>
  );
}
