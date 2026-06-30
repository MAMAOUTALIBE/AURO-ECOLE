// Avis Google côté front : types, valeurs par défaut, lecture serveur et helpers.
// IMPORTANT : garder les défauts en phase avec
//   - backend/src/modules/reviews/google-reviews.service.ts (DEFAULT_GOOGLE_REVIEWS_CONFIG)
//   - backend/src/data/initial-data.ts (clé "google.reviews")

const DEFAULT_BACKEND_URL = "http://127.0.0.1:4000";

// ---- Types --------------------------------------------------------------------

// Configuration complète éditable depuis le CRM (clé SiteSetting "google.reviews").
export type GoogleReviewsConfig = {
  enabled: boolean;
  showOnHomepage: boolean;
  placeId: string;
  reviewUrl: string;
  profileUrl: string;
  sectionTitle: string;
  sectionSubtitle: string;
  minRating: number;
  maxReviews: number;
  fallbackRating: number;
  fallbackCount: number;
};

export type GoogleReviewItem = {
  id: string;
  authorName: string;
  authorPhotoUrl: string;
  rating: number;
  text: string;
  relativeTime: string;
  publishTime: string;
  profileUrl: string;
};

export type GoogleReviewsStats = {
  rating: number;
  totalCount: number;
  syncedAt: string | null;
};

// Sous-ensemble public renvoyé par GET /api/google-reviews (liens déjà résolus).
export type GoogleReviewsPublicConfig = {
  enabled: boolean;
  showOnHomepage: boolean;
  placeId: string;
  reviewUrl: string;
  profileUrl: string;
  sectionTitle: string;
  sectionSubtitle: string;
  minRating: number;
  maxReviews: number;
};

export type GoogleReviewsPayload = {
  config: GoogleReviewsPublicConfig;
  stats: GoogleReviewsStats | null;
  reviews: GoogleReviewItem[];
  syncedAt: string | null;
};

// ---- Valeurs par défaut -------------------------------------------------------

export const defaultGoogleReviewsConfig: GoogleReviewsConfig = {
  enabled: true,
  showOnHomepage: true,
  placeId: "",
  reviewUrl: "",
  profileUrl: "",
  sectionTitle: "Ils ont passé leur permis avec nous",
  sectionSubtitle: "Les avis de nos élèves, directement depuis Google.",
  minRating: 4,
  maxReviews: 6,
  fallbackRating: 0,
  fallbackCount: 0
};

const emptyPayload: GoogleReviewsPayload = {
  config: {
    enabled: false,
    showOnHomepage: false,
    placeId: "",
    reviewUrl: "",
    profileUrl: "",
    sectionTitle: defaultGoogleReviewsConfig.sectionTitle,
    sectionSubtitle: defaultGoogleReviewsConfig.sectionSubtitle,
    minRating: defaultGoogleReviewsConfig.minRating,
    maxReviews: defaultGoogleReviewsConfig.maxReviews
  },
  stats: null,
  reviews: [],
  syncedAt: null
};

// ---- Helpers (purs, utilisables côté client comme serveur) --------------------

/** Construit le lien officiel Google « écrire un avis » à partir d'un Place ID. */
export function buildWriteReviewUrl(placeId: string): string {
  return placeId ? `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId.trim())}` : "";
}

/** Réduit un nom Google complet au prénom (RGPD-friendly, conforme « prénom du client »). */
export function firstName(fullName: string): string {
  const trimmed = (fullName ?? "").trim();
  if (!trimmed) return "Client";
  return trimmed.split(/\s+/)[0];
}

// ---- Lecture côté serveur (composants serveur uniquement) ---------------------

/**
 * Récupère le bloc avis Google depuis le backend (server-side, no-store).
 * Retourne un payload vide/désactivé si l'API est indisponible.
 */
export async function getGoogleReviews(): Promise<GoogleReviewsPayload> {
  const baseUrl = process.env.LODEN_API_URL ?? DEFAULT_BACKEND_URL;
  try {
    const response = await fetch(new URL("/api/google-reviews", baseUrl), { cache: "no-store" });
    if (!response.ok) return emptyPayload;
    const json = (await response.json()) as { data?: GoogleReviewsPayload };
    return json?.data ?? emptyPayload;
  } catch {
    return emptyPayload;
  }
}
