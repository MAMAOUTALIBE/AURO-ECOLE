import Link from "next/link";
import { safeJsonLd } from "@/lib/json-ld";
import { absoluteUrl } from "@/lib/seo";

export type BreadcrumbItem = {
  /** Libellé affiché du maillon (ex. « Formations »). */
  name: string;
  /** Chemin relatif de la page (ex. `/formations`). Rendu en URL absolue. */
  path: string;
};

/**
 * Fil d'Ariane : rend à la fois la navigation VISIBLE (accessible, `aria-current`
 * sur le maillon courant) ET les données structurées `BreadcrumbList` schema.org
 * (rich result Google). Toujours démarrer par l'accueil ; le dernier maillon est
 * la page courante. Composant serveur.
 */
export function Breadcrumbs({ items, className = "" }: { items: BreadcrumbItem[]; className?: string }) {
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
    <nav aria-label="Fil d'Ariane" className={className}>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }}
      />
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-loden-muted">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.path} className="flex items-center gap-x-1.5">
              {index > 0 ? (
                <span aria-hidden="true" className="text-loden-300">
                  /
                </span>
              ) : null}
              {isLast ? (
                <span aria-current="page" className="font-semibold text-loden-ink">
                  {item.name}
                </span>
              ) : (
                <Link href={item.path} className="focus-ring rounded hover:text-loden-700 hover:underline">
                  {item.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
