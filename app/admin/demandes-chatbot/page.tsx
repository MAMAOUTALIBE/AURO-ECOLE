import { redirect } from "next/navigation";

// Page historique fusionnée dans le Centre rendez-vous & planning (source unique de vérité).
// Les demandes chatbot y restent accessibles via le filtre source=chatbot.
export default function AdminChatbotRequestsPage() {
  redirect("/admin/rendez-vous?source=chatbot");
}
