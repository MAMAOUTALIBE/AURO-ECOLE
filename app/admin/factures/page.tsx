import type { Metadata } from "next";
import { InvoicesManager } from "@/components/crm/InvoicesManager";
import { CrmPageHeader } from "@/components/crm/ui";

export const metadata: Metadata = {
  title: "Factures",
  robots: { index: false, follow: false }
};

export default function AdminInvoicesPage() {
  return (
    <>
      <CrmPageHeader
        eyebrow="Finance"
        title="Factures"
        subtitle="Émettez et suivez vos factures. Document d'aide à la facturation, non certifié fiscalement."
      />
      <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        ⚠️ Cet outil n&apos;est pas un logiciel de caisse ni un logiciel comptable certifié (NF525). Les mentions légales,
        le régime et les taux de TVA relèvent de votre responsabilité — vérifiez la conformité avec votre expert-comptable.
      </div>
      <InvoicesManager />
    </>
  );
}
