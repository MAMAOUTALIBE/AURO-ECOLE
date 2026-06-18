import type { Metadata } from "next";
import { StudentsList } from "@/components/crm/StudentsList";
import { CrmPageHeader } from "@/components/crm/ui";

export const metadata: Metadata = {
  title: "Dossiers élèves",
  robots: { index: false, follow: false }
};

export default function AdminStudentsPage() {
  return (
    <>
      <CrmPageHeader
        eyebrow="Pédagogie"
        title="Dossiers élèves"
        subtitle="Suivi des dossiers, statuts, progression et rattachement aux agences."
      />
      <StudentsList />
    </>
  );
}
