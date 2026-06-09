import type { ProductLine } from "@/data/site";

// Illustration d'en-tête (SVG on-brand) par formation, avec repli par pôle.
const BY_SLUG: Record<string, string> = {
  "permis-b-manuel": "/formations/auto-ecole.svg",
  "permis-b-automatique": "/formations/auto-ecole.svg",
  "conduite-accompagnee": "/formations/auto-ecole.svg",
  "permis-accelere": "/formations/auto-ecole.svg",
  "annulation-permis": "/formations/auto-ecole.svg",
  perfectionnement: "/formations/auto-ecole.svg",
  "code-en-ligne": "/formations/code.svg",
  "stage-code": "/formations/code.svg",
  "formation-vtc": "/formations/vtc.svg",
  "vtc-formation-continue": "/formations/vtc.svg",
  "caces-r489-chariots": "/formations/caces-chariot.svg",
  "caces-r486-nacelles": "/formations/caces-nacelle.svg",
  "caces-r482-engins-chantier": "/formations/caces-chantier.svg"
};

const BY_PRODUCT_LINE: Record<string, string> = {
  AUTO_ECOLE: "/formations/auto-ecole.svg",
  VTC: "/formations/vtc.svg",
  CACES: "/formations/caces-chariot.svg"
};

export function formationImage(slug: string, productLine?: ProductLine): string {
  return BY_SLUG[slug] ?? BY_PRODUCT_LINE[productLine ?? "AUTO_ECOLE"] ?? "/formations/auto-ecole.svg";
}
