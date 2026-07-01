import type { Metadata } from "next";
import { OfferQr50Manager } from "@/components/crm/OfferQr50Manager";
import { CrmPageHeader } from "@/components/crm/ui";

export const metadata: Metadata = {
  title: "Offre QR Code -50 €",
  robots: { index: false, follow: false }
};

export default function AdminOfferQr50Page() {
  return (
    <>
      <CrmPageHeader
        eyebrow="Commercial"
        title="Offre QR Code -50 €"
        subtitle="Suivi des prospects arrivés depuis le QR code LODENE50, export CSV et marquage des bons utilisés."
      />
      <OfferQr50Manager />
    </>
  );
}
