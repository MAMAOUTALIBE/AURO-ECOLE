import type { Metadata } from "next";
import type { ReactNode } from "react";
import { CrmShell } from "@/components/crm/shell/CrmShell";

export const metadata: Metadata = {
  title: "CRM LODENE",
  robots: { index: false, follow: false }
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <CrmShell>{children}</CrmShell>;
}
