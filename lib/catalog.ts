// Lecture serveur du catalogue de formations depuis le backend (source = CRM/BDD),
// avec repli sur le catalogue statique `data/site.ts` si l'API est indisponible.
// IMPORTANT : à utiliser dans les composants serveur pour que les pages publiques
// reflètent les modifications faites dans le CRM (/admin/formations).

import { formations as staticFormations, type Formation } from "@/data/site";
import { mapApiFormation } from "@/lib/catalog-mappers";

const DEFAULT_BACKEND_URL = "http://127.0.0.1:4000";

/**
 * Récupère les formations publiées (server-side, no-store → toujours à jour).
 * Retourne le catalogue statique en repli si l'API est down ou vide.
 */
export async function getFormations(): Promise<Formation[]> {
  const baseUrl = process.env.LODEN_API_URL ?? DEFAULT_BACKEND_URL;
  try {
    const response = await fetch(new URL("/api/formations", baseUrl), { cache: "no-store" });
    if (!response.ok) return staticFormations;
    const json = (await response.json()) as { data?: Parameters<typeof mapApiFormation>[0][] };
    const mapped = (json.data ?? []).map(mapApiFormation);
    return mapped.length > 0 ? mapped : staticFormations;
  } catch {
    return staticFormations;
  }
}

/** Récupère une formation par slug (API + repli statique). */
export async function getFormationBySlug(slug: string): Promise<Formation | undefined> {
  const formations = await getFormations();
  return formations.find((formation) => formation.slug === slug);
}
