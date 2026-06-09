import type { Metadata } from "next";
import { ReviewsManager } from "@/components/crm/ReviewsManager";
import { CrmPageHeader } from "@/components/crm/ui";

export const metadata: Metadata = {
  title: "Avis",
  robots: { index: false, follow: false }
};

export default function AdminReviewsPage() {
  return (
    <>
      <CrmPageHeader
        eyebrow="Engagement"
        title="Avis clients"
        subtitle="Modérez les avis avant publication sur le site public : publier ou rejeter."
      />
      <ReviewsManager />
    </>
  );
}
