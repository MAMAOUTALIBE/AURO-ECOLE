import type { Metadata } from "next";
import { Finance } from "@/components/crm/Finance";
import { CrmPageHeader } from "@/components/crm/ui";

export const metadata: Metadata = {
  title: "Paiements & encaissements",
  robots: { index: false, follow: false }
};

export default function AdminFinancePage() {
  return (
    <>
      <CrmPageHeader
        eyebrow="Finance"
        title="Paiements & encaissements"
        subtitle="Suivi des paiements, encaissements, remboursements et enregistrement manuel, par agence."
      />
      <Finance />
    </>
  );
}
