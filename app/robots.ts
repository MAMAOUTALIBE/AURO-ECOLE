import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Zones sans valeur SEO ou privées : on économise le budget de crawl et on
        // évite d'indexer les espaces authentifiés / tunnels de conversion.
        disallow: [
          "/admin",
          "/api",
          "/connexion",
          "/paiement",
          "/espace-eleve",
          "/espace-formateur",
          "/mot-de-passe-oublie",
          "/reinitialiser-mot-de-passe",
          "/verifier-email",
          "/bientot"
        ]
      }
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL
  };
}
