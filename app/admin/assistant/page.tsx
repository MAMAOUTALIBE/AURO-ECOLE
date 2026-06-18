import type { Metadata } from "next";
import { AiAssistant } from "@/components/crm/AiAssistant";
import { CrmPageHeader } from "@/components/crm/ui";

export const metadata: Metadata = {
  title: "Assistant IA",
  robots: { index: false, follow: false }
};

export default function AdminAssistantPage() {
  return (
    <>
      <CrmPageHeader
        eyebrow="Automatisation & IA"
        title="Assistant IA"
        subtitle="Résumez les demandes, qualifiez les prospects et générez des contenus — en un clic."
      />
      <AiAssistant />
    </>
  );
}
