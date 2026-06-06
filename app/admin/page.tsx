import type { Metadata } from "next";
import { AdminDashboard } from "@/components/AdminDashboard";
import { PageHero } from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Admin CRM",
  description: "Espace administrateur LODEN pour suivre les demandes, paiements et avis.",
  robots: {
    index: false,
    follow: false
  }
};

export default function AdminPage() {
  return (
    <main>
      <PageHero
        eyebrow="Administration"
        title="CRM opérationnel LODEN"
        text="Un premier centre de pilotage pour suivre les demandes entrantes, les dossiers CPF, les réservations, les paiements et les avis."
        cta="Retour accueil"
        ctaHref="/"
      />
      <section className="bg-loden-pearl py-14 sm:py-20">
        <div className="container-pad">
          <AdminDashboard />
        </div>
      </section>
    </main>
  );
}
