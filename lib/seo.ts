// Source unique de l'URL canonique du site (référencement).
// Domaine canonique : https://lodene.fr (migration effectuée le 2026-06-26 ;
// lodene.org redirige en 301 vers lodene.fr). Pour changer de domaine il suffit
// de définir NEXT_PUBLIC_SITE_URL — aucune autre modification de code n'est
// nécessaire (sitemap, robots, OG, JSON-LD dérivent tous de cette constante).
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://lodene.fr").replace(/\/+$/, "");

export const SITE_NAME = "LODENE Auto-École";

/** Construit une URL absolue à partir d'un chemin relatif. */
export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Image Open Graph par défaut (absolue). */
export const OG_IMAGE = absoluteUrl("/loden-hero.jpg");

type PageMeta = {
  title: string;
  description: string;
  /** Chemin canonique relatif (ex. `/tarifs`). */
  path: string;
};

/**
 * Construit les métadonnées d'une page publique : titre, description, canonique
 * ET Open Graph unique (évite le repli sur l'OG générique du layout racine). Le
 * suffixe de marque n'est ajouté à l'OG que si le titre ne contient pas déjà
 * « LODENE » (pas de double marque). Retourne un objet compatible `Metadata`.
 */
export function buildMetadata({ title, description, path }: PageMeta) {
  const ogTitle = title.includes("LODENE") ? title : `${title} | ${SITE_NAME}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: ogTitle,
      description,
      url: path,
      type: "website" as const
    }
  };
}
