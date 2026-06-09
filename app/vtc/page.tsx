import type { Metadata } from "next";
import { PoleLanding } from "@/components/PoleLanding";

export const metadata: Metadata = {
  title: "Formation VTC à Conflans-Sainte-Honorine — Carte professionnelle & CPF",
  description:
    "Centre de formation VTC à Conflans-Sainte-Honorine (78) : préparation à l'examen T3P, carte professionnelle de chauffeur, financement CPF et formation continue obligatoire.",
  alternates: { canonical: "/vtc" }
};

export default function VtcPage() {
  return <PoleLanding pole="VTC" />;
}
