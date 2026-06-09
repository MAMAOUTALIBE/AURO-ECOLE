import type { Metadata } from "next";
import { QuotesManager } from "@/components/crm/QuotesManager";
import { CrmPageHeader } from "@/components/crm/ui";

export const metadata: Metadata = {
  title: "Devis",
  robots: { index: false, follow: false }
};

export default function AdminQuotesPage() {
  return (
    <>
      <CrmPageHeader
        eyebrow="Commercial"
        title="Devis"
        subtitle="Créez, envoyez et suivez vos devis (brouillon → envoyé → accepté/refusé). Document imprimable."
      />
      <QuotesManager />
    </>
  );
}
