import type { Metadata } from "next";
import { InvoiceDetail } from "@/components/crm/InvoiceDetail";

export const metadata: Metadata = {
  title: "Facture",
  robots: { index: false, follow: false }
};

export default async function AdminInvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <InvoiceDetail id={id} />;
}
