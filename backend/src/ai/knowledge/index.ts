// Point d'entrée de la base de connaissance LODENE.
export type { KnowledgeArticle, KnowledgeHit, KnowledgeScope } from "./types";
export { knowledgeArticles } from "./articles";
export { selectKnowledge, buildKnowledgeBlock } from "./retriever";
export { INTERNAL_AGENT_RULES, FORBIDDEN_SENSITIVE_DATA, internalKnowledge } from "./internal";
