import type { MetadataRoute } from "next";
import { formations } from "@/data/site";

const routes = [
  "",
  "/formations",
  "/vtc",
  "/sst",
  "/logistique-securite",
  "/caces",
  "/tarifs",
  "/financement",
  "/cpf",
  "/faq",
  "/a-propos",
  "/avis",
  "/blog",
  "/contact",
  "/inscription",
  "/connexion",
  "/paiement",
  "/espace-eleve",
  "/permis-b-paris-11",
  "/auto-ecole-cpf-paris",
  "/mentions-legales",
  "/confidentialite",
  "/cookies"
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://loden-autoecole.fr";
  const formationRoutes = formations.map((formation) => `/formations/${formation.slug}`);

  return [...routes, ...formationRoutes].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date("2026-06-06"),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.8
  }));
}
