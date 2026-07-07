// Lecture serveur des partenaires « vitrine » (opt-in) depuis le backend.
// À utiliser dans les composants serveur : la section publique reflète le CRM
// (/admin/partenaires → « Afficher sur le site »). Repli silencieux si l'API est down.

import type { PublicPartner } from "@/lib/partner-mappers";

const DEFAULT_BACKEND_URL = "http://127.0.0.1:4000";

export async function getPublicPartners(): Promise<PublicPartner[]> {
  const baseUrl = process.env.LODEN_API_URL ?? DEFAULT_BACKEND_URL;
  try {
    const response = await fetch(new URL("/api/partners/public", baseUrl), { cache: "no-store" });
    if (!response.ok) return [];
    const json = (await response.json()) as { data?: PublicPartner[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}
