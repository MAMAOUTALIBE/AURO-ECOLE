import type { MetadataRoute } from "next";
import { formations } from "@/data/site";
import { getPublishedContent } from "@/lib/content";
import { absoluteUrl } from "@/lib/seo";

// Pages publiques indexables, avec une priorité indicative. On EXCLUT les pages
// privées / tunnels (connexion, paiement, espaces) — elles sont aussi bloquées
// dans robots.ts.
const staticRoutes: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "/formations", priority: 0.9, changeFrequency: "weekly" },
  { path: "/tarifs", priority: 0.9, changeFrequency: "monthly" },
  { path: "/cpf", priority: 0.8, changeFrequency: "monthly" },
  { path: "/financement", priority: 0.8, changeFrequency: "monthly" },
  { path: "/permis-b-conflans-sainte-honorine", priority: 0.8, changeFrequency: "monthly" },
  { path: "/auto-ecole-cpf-conflans-sainte-honorine", priority: 0.8, changeFrequency: "monthly" },
  { path: "/vtc", priority: 0.7, changeFrequency: "monthly" },
  { path: "/digital", priority: 0.7, changeFrequency: "monthly" },
  { path: "/sst", priority: 0.7, changeFrequency: "monthly" },
  { path: "/caces", priority: 0.7, changeFrequency: "monthly" },
  { path: "/logistique-securite", priority: 0.7, changeFrequency: "monthly" },
  { path: "/a-propos", priority: 0.6, changeFrequency: "monthly" },
  { path: "/partenaires", priority: 0.5, changeFrequency: "monthly" },
  { path: "/avis", priority: 0.6, changeFrequency: "weekly" },
  { path: "/contact", priority: 0.6, changeFrequency: "monthly" },
  { path: "/inscription", priority: 0.6, changeFrequency: "monthly" },
  { path: "/faq", priority: 0.6, changeFrequency: "monthly" },
  { path: "/blog", priority: 0.5, changeFrequency: "weekly" },
  { path: "/mentions-legales", priority: 0.2, changeFrequency: "yearly" },
  { path: "/confidentialite", priority: 0.2, changeFrequency: "yearly" },
  { path: "/cookies", priority: 0.2, changeFrequency: "yearly" }
];

export const revalidate = 3600; // régénère le sitemap au plus une fois par heure

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const baseEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: absoluteUrl(route.path || "/"),
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority
  }));

  const formationEntries: MetadataRoute.Sitemap = formations.map((formation) => ({
    url: absoluteUrl(`/formations/${formation.slug}`),
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8
  }));

  // Contenus éditoriaux publiés depuis le CMS (repli silencieux si l'API est down).
  const [articles, pages] = await Promise.all([
    getPublishedContent("ARTICLE"),
    getPublishedContent("PAGE")
  ]);

  const articleEntries: MetadataRoute.Sitemap = articles.map((article) => ({
    url: absoluteUrl(`/blog/${article.slug}`),
    lastModified: article.updatedAt ? new Date(article.updatedAt) : now,
    changeFrequency: "monthly",
    priority: 0.6
  }));

  const pageEntries: MetadataRoute.Sitemap = pages.map((page) => ({
    url: absoluteUrl(`/pages/${page.slug}`),
    lastModified: page.updatedAt ? new Date(page.updatedAt) : now,
    changeFrequency: "monthly",
    priority: 0.5
  }));

  return [...baseEntries, ...formationEntries, ...articleEntries, ...pageEntries];
}
