import type { Metadata } from "next";
import { PartnersList } from "@/components/crm/PartnersList";
import { CrmPageHeader } from "@/components/crm/ui";

export const metadata: Metadata = {
  title: "Partenaires prescripteurs",
  robots: { index: false, follow: false }
};

export default function AdminPartnersPage() {
  return (
    <>
      <CrmPageHeader
        eyebrow="Commercial"
        title="Partenaires prescripteurs"
        subtitle="Apporteurs d'affaires (CFA, missions locales, comités d'entreprise…) : comptes, barème de commission et prospects apportés."
      />
      <PartnersList />
    </>
  );
}
