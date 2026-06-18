import type { Metadata } from "next";
import { Pipeline } from "@/components/crm/Pipeline";
import { CrmPageHeader } from "@/components/crm/ui";

export const metadata: Metadata = {
  title: "Pipeline commercial",
  robots: { index: false, follow: false }
};

export default function AdminPipelinePage() {
  return (
    <>
      <CrmPageHeader
        eyebrow="Commercial"
        title="Pipeline commercial"
        subtitle="Suivi des prospects de la demande entrante à l'inscription, par étape et par agence."
      />
      <Pipeline />
    </>
  );
}
