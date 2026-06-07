import type { Metadata } from "next";
import { StudentsList } from "@/components/crm/StudentsList";
import { PageHero } from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Élèves — CRM",
  robots: { index: false, follow: false }
};

export default function AdminStudentsPage() {
  return (
    <main>
      <PageHero
        eyebrow="CRM · Élèves"
        title="Dossiers élèves"
        text="Suivi des dossiers, statuts, progression et rattachement aux agences."
        cta="Retour au CRM"
        ctaHref="/admin"
      />
      <section className="bg-loden-pearl py-14 sm:py-20">
        <div className="container-pad">
          <StudentsList />
        </div>
      </section>
    </main>
  );
}
