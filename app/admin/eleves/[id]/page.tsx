import type { Metadata } from "next";
import { StudentFile } from "@/components/crm/StudentFile";

export const metadata: Metadata = {
  title: "Fiche élève — CRM",
  robots: { index: false, follow: false }
};

export default async function AdminStudentFilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="bg-loden-pearl">
      <section className="container-pad py-12 sm:py-16">
        <StudentFile studentId={id} />
      </section>
    </main>
  );
}
