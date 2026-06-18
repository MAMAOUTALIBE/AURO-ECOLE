import type { Metadata } from "next";
import { ContentEntriesManager } from "@/components/crm/ContentEntriesManager";
import { CrmPageHeader } from "@/components/crm/ui";

export const metadata: Metadata = {
  title: "Pages",
  robots: { index: false, follow: false }
};

export default function AdminPagesPage() {
  return (
    <>
      <CrmPageHeader
        eyebrow="Contenu"
        title="Pages du site"
        subtitle="Créez et publiez les pages de contenu affichées sur le site public."
      />
      <ContentEntriesManager type="PAGE" />
    </>
  );
}
