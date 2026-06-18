import type { Metadata } from "next";
import { Exams } from "@/components/crm/Exams";
import { CrmPageHeader } from "@/components/crm/ui";

export const metadata: Metadata = {
  title: "Examens",
  robots: { index: false, follow: false }
};

export default function AdminExamsPage() {
  return (
    <>
      <CrmPageHeader
        eyebrow="Pédagogie"
        title="Examens & réussite"
        subtitle="Programmation des examens code et conduite, saisie des résultats et taux de réussite."
      />
      <Exams />
    </>
  );
}
