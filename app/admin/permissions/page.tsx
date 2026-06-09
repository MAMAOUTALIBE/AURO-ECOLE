import type { Metadata } from "next";
import { PermissionsViewer } from "@/components/crm/PermissionsViewer";
import { CrmPageHeader } from "@/components/crm/ui";

export const metadata: Metadata = {
  title: "Permissions",
  robots: { index: false, follow: false }
};

export default function AdminPermissionsPage() {
  return (
    <>
      <CrmPageHeader
        eyebrow="Administration"
        title="Permissions & rôles"
        subtitle="Visualisez la matrice RBAC appliquée par l'API : quel rôle peut faire quoi."
      />
      <PermissionsViewer />
    </>
  );
}
