import type { Metadata } from "next";
import { ResourcePlanning } from "@/components/crm/planning/ResourcePlanning";
import { CrmPageHeader } from "@/components/crm/ui";

export const metadata: Metadata = {
  title: "Planning",
  robots: { index: false, follow: false }
};

export default function AdminPlanningPage() {
  return (
    <>
      <CrmPageHeader
        eyebrow="Pédagogie"
        title="Planning"
        subtitle="Vue par moniteur : leçons et rendez-vous de la journée, en créneaux horaires."
      />
      <ResourcePlanning />
    </>
  );
}
