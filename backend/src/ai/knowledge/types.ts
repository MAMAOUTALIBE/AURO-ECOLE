// Base de connaissance LODENE pour l'agent IA.
//
// Contenu organisé en "articles" (markdown) tagués par mots-clés. La récupération
// (retriever.ts) est volontairement déterministe (scoring par mots-clés, sans
// embeddings ni dépendance externe) : c'est fiable, testable et aligné sur le
// style de public-fallback.ts. Le scope distingue strictement :
//   - "public"   : consultable par l'agent public ET l'agent CRM (offre LODENE).
//   - "internal" : règles d'agent / liste de données interdites. JAMAIS exposé au
//                  public ; structurellement hors du pool consultable (voir internal.ts).

export type KnowledgeScope = "public" | "internal";

export type KnowledgeArticle = {
  /** Identifiant stable (ex: "public_formations_permis_b"). */
  id: string;
  /** Titre lisible, affiché en tête de l'extrait injecté. */
  title: string;
  scope: KnowledgeScope;
  /** Termes de correspondance (normalisés à la volée : minuscules, sans accents). */
  keywords: string[];
  /** Corps de l'article, en markdown. */
  body: string;
};

export type KnowledgeHit = {
  id: string;
  title: string;
  body: string;
  score: number;
};
