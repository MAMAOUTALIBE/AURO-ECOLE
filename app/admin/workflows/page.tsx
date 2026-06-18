import type { Metadata } from "next";
import { WorkflowsManager } from "@/components/crm/WorkflowsManager";
import { CrmPageHeader } from "@/components/crm/ui";

export const metadata: Metadata = {
  title: "Workflows",
  robots: { index: false, follow: false }
};

export default function AdminWorkflowsPage() {
  return (
    <>
      <CrmPageHeader
        eyebrow="Automatisation & IA"
        title="Workflows"
        subtitle="Créez des règles « quand un événement se produit, alors exécuter une action ». Activez ou mettez en pause chaque règle à tout moment."
      />
      <WorkflowsManager />
    </>
  );
}
