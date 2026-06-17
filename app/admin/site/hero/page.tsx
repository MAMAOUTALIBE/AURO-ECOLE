import type { Metadata } from "next";
import { HeroEditor } from "@/components/crm/site/HeroEditor";
import { CrmPageHeader } from "@/components/crm/ui";

export const metadata: Metadata = {
  title: "Hero de l’accueil",
  robots: { index: false, follow: false }
};

export default function AdminHeroPage() {
  return (
    <>
      <CrmPageHeader
        eyebrow="Site public"
        title="Hero de la page d’accueil"
        subtitle="Titre, accroche, image, boutons et badges affichés en haut de l’accueil."
      />
      <HeroEditor />
    </>
  );
}
