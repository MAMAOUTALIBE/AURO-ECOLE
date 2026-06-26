import type { Metadata } from "next";
import { NavEditor } from "@/components/crm/site/NavEditor";
import { CrmPageHeader } from "@/components/crm/ui";

export const metadata: Metadata = {
  title: "Menu & navigation",
  robots: { index: false, follow: false }
};

export default function AdminNavigationPage() {
  return (
    <>
      <CrmPageHeader
        eyebrow="Site public"
        title="Menu & navigation"
        subtitle="Liens du menu, sous-menus, ordre d’affichage et boutons d’action."
      />
      <NavEditor />
    </>
  );
}
