import type { Metadata } from "next";
import { PasserelleEditor } from "@/components/crm/site/PasserelleEditor";
import { CrmPageHeader } from "@/components/crm/ui";

export const metadata: Metadata = {
  title: "Page passerelle",
  robots: { index: false, follow: false }
};

export default function AdminPasserellePage() {
  return (
    <>
      <CrmPageHeader
        eyebrow="Site public"
        title="Page passerelle boîte auto → manuelle"
        subtitle="Illustration de la page et documents téléchargeables, choisis dans la médiathèque."
      />
      <PasserelleEditor />
    </>
  );
}
