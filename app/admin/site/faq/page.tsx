import type { Metadata } from "next";
import { FaqManager } from "@/components/crm/FaqManager";
import { CrmPageHeader } from "@/components/crm/ui";

export const metadata: Metadata = {
  title: "Gestion de la FAQ",
  robots: { index: false, follow: false }
};

export default function AdminFaqPage() {
  return (
    <>
      <CrmPageHeader
        eyebrow="Contenu"
        title="Gestion de la FAQ"
        subtitle="Ajoutez, modifiez et masquez les questions affichées sur le site public."
      />
      <FaqManager />
    </>
  );
}
