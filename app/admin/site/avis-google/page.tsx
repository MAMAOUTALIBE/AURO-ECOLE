import type { Metadata } from "next";
import { GoogleReviewsEditor } from "@/components/crm/site/GoogleReviewsEditor";
import { CrmPageHeader } from "@/components/crm/ui";

export const metadata: Metadata = {
  title: "Avis Google",
  robots: { index: false, follow: false }
};

export default function AdminGoogleReviewsPage() {
  return (
    <>
      <CrmPageHeader
        eyebrow="Site public"
        title="Avis Google"
        subtitle="Reliez votre fiche Google, synchronisez les vrais avis et pilotez la section affichée sur le site."
      />
      <GoogleReviewsEditor />
    </>
  );
}
