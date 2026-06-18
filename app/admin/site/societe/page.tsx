import type { Metadata } from "next";
import { CompanyInfoManager } from "@/components/crm/CompanyInfoManager";
import { CrmPageHeader } from "@/components/crm/ui";

export const metadata: Metadata = {
  title: "Informations société",
  robots: { index: false, follow: false }
};

export default function AdminCompanyInfoPage() {
  return (
    <>
      <CrmPageHeader
        eyebrow="Administration"
        title="Informations société"
        subtitle="Nom commercial, adresse, agrément, SIRET, coordonnées et réseaux sociaux affichés sur le site et les mentions légales."
      />
      <CompanyInfoManager />
    </>
  );
}
