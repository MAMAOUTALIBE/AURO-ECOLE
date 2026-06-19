import { redirect } from "next/navigation";

// Page historique fusionnée dans le Centre rendez-vous & planning (source unique de vérité).
// Le planning (RDV + leçons agrégés) s'ouvre directement sur la vue calendrier.
export default function AdminPlanningPage() {
  redirect("/admin/rendez-vous?view=planning");
}
