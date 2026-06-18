import type { Metadata } from "next";
import { ContractDetail } from "@/components/crm/ContractDetail";

export const metadata: Metadata = {
  title: "Contrat",
  robots: { index: false, follow: false }
};

export default async function AdminContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ContractDetail id={id} />;
}
