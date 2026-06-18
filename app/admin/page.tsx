import type { Metadata } from "next";
import { CrmDashboard } from "@/components/crm/dashboard/CrmDashboard";

export const metadata: Metadata = {
  title: "Tableau de bord",
  description: "Centre de pilotage LODENE : KPIs, activité, tâches et assistant IA.",
  robots: { index: false, follow: false }
};

export default function AdminDashboardPage() {
  return <CrmDashboard />;
}
