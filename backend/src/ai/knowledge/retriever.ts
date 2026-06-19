import { knowledgeArticles } from "./articles";
import type { KnowledgeHit } from "./types";

// Récupération déterministe par mots-clés (pas d'embeddings, pas de dépendance).
// Seuls les articles PUBLICS (knowledgeArticles) sont consultables : le contenu
// interne (internal.ts) est structurellement hors de ce pool → aucune fuite possible,
// même en cas de prompt-injection.

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/**
 * Sélectionne les articles publics les plus pertinents pour une requête.
 * Scoring : +2 par mot-clé présent, +1 par mot significatif du titre présent.
 */
export function selectKnowledge(query: string, opts?: { limit?: number }): KnowledgeHit[] {
  const limit = opts?.limit ?? 2;
  const q = normalize(query ?? "").trim();
  if (!q) return [];

  const scored = knowledgeArticles
    .map((article) => {
      let score = 0;
      for (const keyword of article.keywords) {
        const n = normalize(keyword);
        if (n && q.includes(n)) score += 2;
      }
      for (const word of normalize(article.title).split(/[^a-z0-9]+/)) {
        if (word.length >= 4 && q.includes(word)) score += 1;
      }
      return { article, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(({ article, score }) => ({ id: article.id, title: article.title, body: article.body, score }));
}

/**
 * Construit un bloc texte « Connaissances LODENE pertinentes » à injecter dans un
 * prompt système. Renvoie une chaîne vide si rien de pertinent (prompt reste compact).
 */
export function buildKnowledgeBlock(query: string, limit = 2): string {
  const hits = selectKnowledge(query, { limit });
  if (!hits.length) return "";
  return [
    "Connaissances LODENE pertinentes (utilise-les pour répondre précisément, sans rien inventer) :",
    ...hits.map((hit) => `### ${hit.title}\n${hit.body}`)
  ].join("\n\n");
}
