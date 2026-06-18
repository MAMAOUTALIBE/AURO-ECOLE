import type { Metadata } from "next";
import { RelancesManager } from "@/components/crm/RelancesManager";
import { CrmPageHeader } from "@/components/crm/ui";

export const metadata: Metadata = {
  title: "Relances",
  robots: { index: false, follow: false }
};

export default function AdminRelancesPage() {
  return (
    <>
      <CrmPageHeader
        eyebrow="Commercial"
        title="Relances"
        subtitle="File de prospects à recontacter, classés par échéance. Reportez ou marquez chaque relance comme effectuée."
      />
      <RelancesManager />
    </>
  );
}
