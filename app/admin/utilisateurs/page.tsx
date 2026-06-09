import type { Metadata } from "next";
import { UsersManager } from "@/components/crm/UsersManager";
import { CrmPageHeader } from "@/components/crm/ui";

export const metadata: Metadata = {
  title: "Utilisateurs",
  robots: { index: false, follow: false }
};

export default function AdminUsersPage() {
  return (
    <>
      <CrmPageHeader
        eyebrow="Administration"
        title="Utilisateurs & rôles"
        subtitle="Créez les comptes du personnel, gérez leurs rôles et leur activation."
      />
      <UsersManager />
    </>
  );
}
