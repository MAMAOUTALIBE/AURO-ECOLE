import type { Metadata } from "next";
import { QuoteDetail } from "@/components/crm/QuoteDetail";

export const metadata: Metadata = {
  title: "Devis",
  robots: { index: false, follow: false }
};

export default async function AdminQuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <QuoteDetail id={id} />;
}
