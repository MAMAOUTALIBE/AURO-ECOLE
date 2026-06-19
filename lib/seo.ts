// Source unique de l'URL canonique du site (référencement).
// Le site tourne en production sur https://lodene.org. Pour basculer le domaine
// canonique (ex. vers lodene.fr) il suffit de définir NEXT_PUBLIC_SITE_URL —
// aucune autre modification de code n'est nécessaire (sitemap, robots, OG, JSON-LD
// dérivent tous de cette constante).
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://lodene.org").replace(/\/+$/, "");

export const SITE_NAME = "LODENE Auto-École";

/** Construit une URL absolue à partir d'un chemin relatif. */
export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Image Open Graph par défaut (absolue). */
export const OG_IMAGE = absoluteUrl("/loden-hero.jpg");
