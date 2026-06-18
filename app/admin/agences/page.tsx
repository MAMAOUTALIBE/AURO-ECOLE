import type { Metadata } from "next";
import { AgenciesManager } from "@/components/crm/AgenciesManager";
import { CrmPageHeader } from "@/components/crm/ui";

export const metadata: Metadata = {
  title: "Agences",
  robots: { index: false, follow: false }
};

export default function AdminAgenciesPage() {
  return (
    <>
      <CrmPageHeader
        eyebrow="Administration"
        title="Agences & centres"
        subtitle="Gérez les agences/centres de l'auto-école et leurs coordonnées."
      />
      <AgenciesManager />
    </>
  );
}
