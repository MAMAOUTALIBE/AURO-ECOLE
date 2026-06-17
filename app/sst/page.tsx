import type { Metadata } from "next";
import { PoleLanding } from "@/components/PoleLanding";

export const metadata: Metadata = {
  title: "Formation SST et MAC SST à Conflans-Sainte-Honorine | Sauveteur Secouriste du Travail | LODENE",
  description:
    "Formez vos salariés au SST avec LODENE : SST Initial 14 h (120 € HT/pers.), MAC SST 7 h, sessions inter-entreprises ou intra-entreprise à Conflans-Sainte-Honorine (78).",
  alternates: { canonical: "/sst" }
};

export default function SstPage() {
  return <PoleLanding pole="SST" />;
}
