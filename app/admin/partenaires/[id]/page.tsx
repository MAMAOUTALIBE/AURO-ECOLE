import type { Metadata } from "next";
import { PartnerDetail } from "@/components/crm/PartnerDetail";
import { CrmPageHeader } from "@/components/crm/ui";

export const metadata: Metadata = {
  title: "Fiche partenaire",
  robots: { index: false, follow: false }
};

export default async function AdminPartnerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <CrmPageHeader eyebrow="Commercial" title="Fiche partenaire" subtitle="Prospects apportés, commissions et barème." />
      <PartnerDetail partnerId={id} />
    </>
  );
}
