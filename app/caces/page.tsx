import type { Metadata } from "next";
import { PoleLanding } from "@/components/PoleLanding";

export const metadata: Metadata = {
  title: "Formation CACES à Conflans-Sainte-Honorine — R489, R486, R482 (CPF & OPCO)",
  description:
    "Centre de formation CACES à Conflans-Sainte-Honorine (78) : chariots élévateurs (R489), nacelles (R486) et engins de chantier (R482). Formations certifiantes finançables CPF, entreprise ou OPCO.",
  alternates: { canonical: "/caces" }
};

export default function CacesPage() {
  return <PoleLanding pole="CACES" />;
}
