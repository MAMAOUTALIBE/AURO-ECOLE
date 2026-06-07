import type { Metadata } from "next";
import Link from "next/link";
import { Award, BarChart3, CalendarDays, CreditCard, HelpCircle, KanbanSquare, Sparkles, Users } from "lucide-react";
import { AdminDashboard } from "@/components/AdminDashboard";
import { AgencySwitcher } from "@/components/AgencySwitcher";
import { CockpitStats } from "@/components/crm/CockpitStats";
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
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-loden-700">
              Centre de pilotage
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/admin/pipeline"
                className="focus-ring inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-loden-ink shadow-soft hover:bg-loden-50"
              >
                <KanbanSquare className="h-4 w-4 text-loden-700" aria-hidden="true" />
                Pipeline
              </Link>
              <Link
                href="/admin/planning"
                className="focus-ring inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-loden-ink shadow-soft hover:bg-loden-50"
              >
                <CalendarDays className="h-4 w-4 text-loden-700" aria-hidden="true" />
                Planning
              </Link>
              <Link
                href="/admin/examens"
                className="focus-ring inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-loden-ink shadow-soft hover:bg-loden-50"
              >
                <Award className="h-4 w-4 text-loden-700" aria-hidden="true" />
                Examens
              </Link>
              <Link
                href="/admin/finance"
                className="focus-ring inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-loden-ink shadow-soft hover:bg-loden-50"
              >
                <CreditCard className="h-4 w-4 text-loden-700" aria-hidden="true" />
                Finance
              </Link>
              <Link
                href="/admin/reporting"
                className="focus-ring inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-loden-ink shadow-soft hover:bg-loden-50"
              >
                <BarChart3 className="h-4 w-4 text-loden-700" aria-hidden="true" />
                Reporting
              </Link>
              <Link
                href="/admin/site/faq"
                className="focus-ring inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-loden-ink shadow-soft hover:bg-loden-50"
              >
                <HelpCircle className="h-4 w-4 text-loden-700" aria-hidden="true" />
                FAQ
              </Link>
              <Link
                href="/admin/assistant"
                className="focus-ring inline-flex items-center gap-2 rounded-full border border-loden-300 bg-loden-50 px-4 py-2 text-sm font-semibold text-loden-800 shadow-soft hover:bg-loden-100"
              >
                <Sparkles className="h-4 w-4 text-loden-700" aria-hidden="true" />
                Assistant IA
              </Link>
              <Link
                href="/admin/eleves"
                className="focus-ring inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-loden-ink shadow-soft hover:bg-loden-50"
              >
                <Users className="h-4 w-4 text-loden-700" aria-hidden="true" />
                Gérer les élèves
              </Link>
              <AgencySwitcher />
            </div>
          </div>
          <div className="mb-8">
            <CockpitStats />
          </div>
          <AdminDashboard />
        </div>
      </section>
    </main>
  );
}
