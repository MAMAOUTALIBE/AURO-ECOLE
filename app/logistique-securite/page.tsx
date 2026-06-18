import type { Metadata } from "next";
import { PoleLanding } from "@/components/PoleLanding";

export const metadata: Metadata = {
  title: "Formations logistique et sécurité | Chariots, nacelles, gerbeur, échafaudage | LODENE",
  description:
    "LODENE propose des formations logistique et sécurité sur devis : chariots élévateurs (R489), gerbeur (R485), nacelles PEMP (R486), pont roulant (R484), échafaudage (R457) et Terberg. Intra-entreprise à Conflans-Sainte-Honorine (78).",
  alternates: { canonical: "/logistique-securite" }
};

export default function LogistiqueSecuritePage() {
  return <PoleLanding pole="LOGISTIQUE_SECURITE" />;
}
