import { safeJsonLd } from "@/lib/json-ld";
import { absoluteUrl } from "@/lib/seo";

export type BreadcrumbItem = {
  /** Libellé affiché du maillon (ex. « Formations »). */
  name: string;
  /** Chemin relatif de la page (ex. `/formations`). Rendu en URL absolue. */
  path: string;
};

/**
 * Émet un `BreadcrumbList` schema.org (données structurées de fil d'Ariane) pour
 * rendre les pages éligibles au rich result « breadcrumb » de Google et clarifier
 * la hiérarchie du site. Toujours démarrer par l'accueil.
 *
 * Composant serveur : n'injecte que du JSON-LD (aucun rendu visuel). Le fil d'Ariane
 * visible reste optionnel — Google accepte le balisage sans affichage, même si un
 * fil visible est préférable pour l'UX.
 */
export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path)
    }))
  };

  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }}
    />
  );
}
