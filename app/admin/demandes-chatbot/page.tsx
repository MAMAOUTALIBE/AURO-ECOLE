import type { Metadata } from "next";
import { ChatbotRequests } from "@/components/crm/ChatbotRequests";
import { CrmPageHeader } from "@/components/crm/ui";

export const metadata: Metadata = {
  title: "Demandes chatbot",
  robots: { index: false, follow: false }
};

export default function AdminChatbotRequestsPage() {
  return (
    <>
      <CrmPageHeader
        eyebrow="Commercial"
        title="Demandes chatbot"
        subtitle="Leads, rendez-vous et relances créés depuis l'assistant LODENE."
      />
      <ChatbotRequests />
    </>
  );
}
