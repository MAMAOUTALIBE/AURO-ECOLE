import type { Metadata } from "next";
import { FormationsManager } from "@/components/crm/FormationsManager";
import { CrmPageHeader } from "@/components/crm/ui";

export const metadata: Metadata = {
  title: "Formations",
  robots: { index: false, follow: false }
};

export default function AdminFormationsPage() {
  return (
    <>
      <CrmPageHeader
        eyebrow="Catalogue"
        title="Formations"
        subtitle="Gérez le catalogue affiché sur le site : intitulés, modes, durées, tarifs et éligibilité CPF."
      />
      <FormationsManager />
    </>
  );
}
