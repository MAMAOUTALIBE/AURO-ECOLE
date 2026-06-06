import type { MetadataRoute } from "next";

const routes = [
  "",
  "/formations",
  "/tarifs",
  "/cpf",
  "/a-propos",
  "/avis",
  "/contact",
  "/inscription",
  "/connexion",
  "/paiement",
  "/espace-eleve"
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://loden-autoecole.fr";

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date("2026-06-06"),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.8
  }));
}
