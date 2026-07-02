// Contenus éditoriaux (articles de blog & pages) pilotés depuis le CMS.
// Lecture côté serveur (composants serveur) avec repli silencieux si l'API est down.

const DEFAULT_BACKEND_URL = "http://127.0.0.1:4000";

export type ContentEntry = {
  id: string;
  type: "PAGE" | "ARTICLE";
  title: string;
  slug: string;
  excerpt?: string | null;
  body: string;
  coverImageUrl?: string | null;
  category?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  published: boolean;
  publishedAt?: string | null;
  updatedAt: string;
};

export async function getPublishedContent(type: "PAGE" | "ARTICLE"): Promise<ContentEntry[]> {
  const baseUrl = process.env.LODEN_API_URL ?? DEFAULT_BACKEND_URL;
  try {
    const response = await fetch(new URL(`/api/content-entries/public?type=${type}`, baseUrl), { cache: "no-store" });
    if (!response.ok) return [];
    const json = (await response.json()) as { data?: ContentEntry[] };
    return Array.isArray(json?.data) ? json.data : [];
  } catch {
    return [];
  }
}

export async function getContentBySlug(slug: string): Promise<ContentEntry | null> {
  const baseUrl = process.env.LODEN_API_URL ?? DEFAULT_BACKEND_URL;
  try {
    const response = await fetch(new URL(`/api/content-entries/public/${encodeURIComponent(slug)}`, baseUrl), {
      cache: "no-store"
    });
    if (!response.ok) return null;
    const json = (await response.json()) as { data?: ContentEntry | null };
    return json?.data ?? null;
  } catch {
    return null;
  }
}

// Découpe un corps texte en paragraphes (séparés par des lignes vides).
export function toParagraphs(body: string | null | undefined): string[] {
  return (body ?? "")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function formatDateFr(iso?: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  } catch {
    return "";
  }
}
