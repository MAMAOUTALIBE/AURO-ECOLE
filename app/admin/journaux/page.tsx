import type { Metadata } from "next";
import { AuditLogViewer } from "@/components/crm/AuditLogViewer";
import { CrmPageHeader } from "@/components/crm/ui";

export const metadata: Metadata = {
  title: "Journaux d'activité",
  robots: { index: false, follow: false }
};

export default function AdminAuditLogsPage() {
  return (
    <>
      <CrmPageHeader
        eyebrow="Administration"
        title="Journaux d'activité"
        subtitle="Traçabilité des actions sensibles réalisées dans le CRM (lecture seule)."
      />
      <AuditLogViewer />
    </>
  );
}
