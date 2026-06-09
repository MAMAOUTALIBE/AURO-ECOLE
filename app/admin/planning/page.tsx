import type { Metadata } from "next";
import { Planning } from "@/components/crm/Planning";
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
        title="Planning des leçons"
        subtitle="Agenda des réservations par jour, avec moniteur, élève et statut de chaque leçon."
      />
      <Planning />
    </>
  );
}
