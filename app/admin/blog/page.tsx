import type { Metadata } from "next";
import { ContentEntriesManager } from "@/components/crm/ContentEntriesManager";
import { CrmPageHeader } from "@/components/crm/ui";

export const metadata: Metadata = {
  title: "Blog",
  robots: { index: false, follow: false }
};

export default function AdminBlogPage() {
  return (
    <>
      <CrmPageHeader
        eyebrow="Contenu"
        title="Blog & actualités"
        subtitle="Rédigez et publiez les articles de blog affichés sur le site public."
      />
      <ContentEntriesManager type="ARTICLE" />
    </>
  );
}
