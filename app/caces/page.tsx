import type { Metadata } from "next";
import { PoleLanding } from "@/components/PoleLanding";

export const metadata: Metadata = {
  title: "Formation CACES & engins à Conflans-Sainte-Honorine — R489, R485, R486, R484, R457 | LODENE",
  description:
    "Centre de formation logistique & sécurité à Conflans-Sainte-Honorine (78) : chariots élévateurs (R489), gerbeur (R485), nacelles PEMP (R486), pont roulant (R484), échafaudage (R457) et Terberg. Sessions intra-entreprise sur devis.",
  alternates: { canonical: "/logistique-securite" }
};

// L'ancienne URL /caces reste active : le CACES fait partie du pôle Logistique & sécurité.
export default function CacesPage() {
  return <PoleLanding pole="LOGISTIQUE_SECURITE" />;
}
