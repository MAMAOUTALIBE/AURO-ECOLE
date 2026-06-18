import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, HelpCircle, MapPin, ScrollText, ShieldCheck, Users } from "lucide-react";
import { Card, CrmPageHeader } from "@/components/crm/ui";

export const metadata: Metadata = {
  title: "Paramètres",
  robots: { index: false, follow: false }
};

const SETTINGS = [
  { href: "/admin/site/societe", icon: Building2, title: "Société", desc: "Raison sociale, adresse, agrément, SIRET, coordonnées, réseaux." },
  { href: "/admin/agences", icon: MapPin, title: "Agences & centres", desc: "Gérer les agences et leurs coordonnées." },
  { href: "/admin/utilisateurs", icon: Users, title: "Utilisateurs & rôles", desc: "Comptes du personnel, rôles et activation." },
  { href: "/admin/permissions", icon: ShieldCheck, title: "Permissions", desc: "Matrice RBAC appliquée par l'API (lecture)." },
  { href: "/admin/site/faq", icon: HelpCircle, title: "FAQ", desc: "Questions affichées sur le site public." },
  { href: "/admin/journaux", icon: ScrollText, title: "Journaux d'activité", desc: "Traçabilité des actions sensibles." }
];

export default function AdminSettingsPage() {
  return (
    <>
      <CrmPageHeader eyebrow="Administration" title="Paramètres" subtitle="Configuration et administration du CRM LODENE." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SETTINGS.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="focus-ring group rounded-2xl">
              <Card className="flex h-full flex-col p-5 transition duration-300 group-hover:-translate-y-0.5 group-hover:shadow-premium">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-loden-50 text-loden-700">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <p className="mt-3 font-semibold text-loden-ink">{item.title}</p>
                <p className="mt-1 flex-1 text-sm text-loden-muted">{item.desc}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-loden-700">
                  Ouvrir <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </Card>
            </Link>
          );
        })}
      </div>
    </>
  );
}
