import type { Metadata } from "next";
import { MediaLibrary } from "@/components/crm/site/MediaLibrary";
import { CrmPageHeader } from "@/components/crm/ui";

export const metadata: Metadata = {
  title: "Médiathèque",
  robots: { index: false, follow: false }
};

export default function AdminMediaPage() {
  return (
    <>
      <CrmPageHeader
        eyebrow="Site public"
        title="Médiathèque"
        subtitle="Téléversez et gérez les images et documents réutilisables sur le site (formations, hero, blocs)."
      />
      <MediaLibrary />
    </>
  );
}
