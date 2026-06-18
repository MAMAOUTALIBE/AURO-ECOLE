import type { Metadata } from "next";
import { CpfManager } from "@/components/crm/CpfManager";
import { CrmPageHeader } from "@/components/crm/ui";

export const metadata: Metadata = {
  title: "Dossiers CPF",
  robots: { index: false, follow: false }
};

export default function AdminCpfPage() {
  return (
    <>
      <CrmPageHeader
        eyebrow="Finance"
        title="Dossiers CPF"
        subtitle="Suivez et faites avancer les demandes de financement CPF, de la réception à la validation."
      />
      <CpfManager />
    </>
  );
}
