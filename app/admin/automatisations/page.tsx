import type { Metadata } from "next";
import { AutomationsOverview } from "@/components/crm/AutomationsOverview";
import { CrmPageHeader } from "@/components/crm/ui";

export const metadata: Metadata = {
  title: "Automatisations",
  robots: { index: false, follow: false }
};

export default function AdminAutomationsPage() {
  return (
    <>
      <CrmPageHeader
        eyebrow="Automatisation & IA"
        title="Automatisations"
        subtitle="Supervision des règles actives et de leurs exécutions. La configuration se fait dans Workflows."
      />
      <AutomationsOverview />
    </>
  );
}
