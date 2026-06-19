import type { Metadata } from "next";
import { RendezVousCockpit, type ViewMode } from "@/components/crm/rendez-vous/RendezVousCockpit";
import { CrmPageHeader } from "@/components/crm/ui";
import type { AppointmentSource } from "@/components/crm/rendez-vous/types";

export const metadata: Metadata = {
  title: "Centre rendez-vous & planning",
  robots: { index: false, follow: false }
};

const SOURCES: AppointmentSource[] = ["chatbot", "manual", "phone", "whatsapp", "crm"];

// Mappe le paramètre d'URL `view` (dont l'alias historique "planning") vers une vue du cockpit.
function resolveView(value?: string): ViewMode {
  if (value === "planning" || value === "calendar") return "calendar";
  if (value === "table") return "table";
  return "kanban";
}

export default async function AdminRendezVousPage({
  searchParams
}: {
  searchParams: Promise<{ view?: string; source?: string }>;
}) {
  const sp = await searchParams;
  const initialView = resolveView(sp.view);
  const initialSource = sp.source && (SOURCES as string[]).includes(sp.source)
    ? (sp.source as AppointmentSource)
    : undefined;

  return (
    <>
      <CrmPageHeader
        eyebrow="Commercial"
        title="Centre rendez-vous & planning"
        subtitle="Pilotez les demandes entrantes, confirmez les créneaux et orchestrez le planning des conseillers et moniteurs."
      />
      <RendezVousCockpit initialView={initialView} initialSource={initialSource} />
    </>
  );
}
