// Synchronisation des VRAIS avis Google (Google Places API "New").
//
// Principe : aucune fabrication d'avis. On lit la fiche Google Business via l'API
// officielle Places (Place Details) qui renvoie la note moyenne réelle, le nombre
// total d'avis et jusqu'à 5 avis (limite de l'API officielle). Le résultat est mis
// en cache dans un SiteSetting (`google.reviews.cache`) pour ne pas appeler Google à
// chaque visite. Sans clé API ou sans Place ID, tout se désactive proprement
// (mode manuel) — cf. CLAUDE.md « intégrations optionnelles, dégradation no-op ».
//
// La config éditable (Place ID, liens, libellés, visibilité) vit dans le SiteSetting
// `google.reviews` piloté depuis le CRM. La clé API reste côté serveur uniquement.

import type { ApiConfig } from "../../config/env";
import type { LodenRepository } from "../../repositories/loden-repository";

export const GOOGLE_REVIEWS_CONFIG_KEY = "google.reviews";
export const GOOGLE_REVIEWS_CACHE_KEY = "google.reviews.cache";

// Au-delà de ce délai, le cache est considéré périmé et une resynchro best-effort
// est déclenchée en arrière-plan lors d'une lecture publique.
const STALE_MS = 12 * 60 * 60 * 1000;

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

// Instantané renvoyé par Google et mis en cache.
export type GoogleReviewsCache = {
  rating: number; // note moyenne réelle (sur l'ensemble des avis Google)
  totalCount: number; // nombre total d'avis sur Google
  mapsUri: string; // lien fiche Google Maps
  syncedAt: string; // ISO
  reviews: GoogleReviewItem[]; // jusqu'à 5 avis (limite API officielle)
};

// Réglages pilotables depuis le CRM (clé SiteSetting `google.reviews`).
export type GoogleReviewsConfig = {
  enabled: boolean; // active toute la fonctionnalité (section + boutons)
  showOnHomepage: boolean; // affiche la section sur la page d'accueil
  placeId: string; // identifiant Google Place (pour la synchro + le lien d'avis)
  reviewUrl: string; // lien « Laisser un avis » (override ; sinon dérivé du Place ID)
  profileUrl: string; // lien « Voir tous les avis Google » (override ; sinon fiche Maps)
  sectionTitle: string;
  sectionSubtitle: string;
  minRating: number; // n'affiche que les avis >= cette note
  maxReviews: number; // nombre max de cartes affichées
  fallbackRating: number; // note affichée en mode manuel (si pas de synchro)
  fallbackCount: number; // nombre d'avis affiché en mode manuel
};

export const DEFAULT_GOOGLE_REVIEWS_CONFIG: GoogleReviewsConfig = {
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

/** Construit le lien officiel Google « écrire un avis » à partir d'un Place ID. */
export function buildWriteReviewUrl(placeId: string): string {
  return placeId ? `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}` : "";
}

// ---- Lecture / écriture du SiteSetting -----------------------------------------

export async function readGoogleReviewsConfig(repository: LodenRepository): Promise<GoogleReviewsConfig> {
  const setting = await repository.getSiteSetting(GOOGLE_REVIEWS_CONFIG_KEY);
  const stored = (setting?.value ?? {}) as Partial<GoogleReviewsConfig>;
  return { ...DEFAULT_GOOGLE_REVIEWS_CONFIG, ...stored };
}

export async function readGoogleReviewsCache(repository: LodenRepository): Promise<GoogleReviewsCache | null> {
  const setting = await repository.getSiteSetting(GOOGLE_REVIEWS_CACHE_KEY);
  return (setting?.value as GoogleReviewsCache | undefined) ?? null;
}

export function isCacheStale(cache: GoogleReviewsCache | null): boolean {
  if (!cache?.syncedAt) return true;
  const ts = new Date(cache.syncedAt).getTime();
  if (Number.isNaN(ts)) return true;
  return Date.now() - ts > STALE_MS;
}

// ---- Appel à l'API Google Places (New) -----------------------------------------

type GooglePlaceReview = {
  name?: string;
  relativePublishTimeDescription?: string;
  rating?: number;
  text?: { text?: string };
  originalText?: { text?: string };
  authorAttribution?: { displayName?: string; uri?: string; photoUri?: string };
  publishTime?: string;
};

type GooglePlaceResponse = {
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  reviews?: GooglePlaceReview[];
};

/**
 * Récupère la fiche Google et la mappe en instantané cache.
 * Retourne `null` si la fonctionnalité n'est pas configurable (pas de clé/Place ID).
 * Lève en cas d'erreur réseau/API (utile pour remonter un message clair à l'admin).
 */
export async function fetchPlaceFromGoogle(placeId: string, apiKey: string): Promise<GoogleReviewsCache | null> {
  if (!placeId || !apiKey) return null;

  const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=fr&regionCode=FR`;
  const response = await fetch(url, {
    headers: {
      "X-Goog-Api-Key": apiKey,
      // On ne demande QUE les champs nécessaires (maîtrise du coût/SKU).
      "X-Goog-FieldMask": "rating,userRatingCount,googleMapsUri,reviews"
    }
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Google Places API ${response.status} ${detail.slice(0, 200)}`.trim());
  }

  const data = (await response.json()) as GooglePlaceResponse;
  const reviews: GoogleReviewItem[] = (data.reviews ?? []).map((review) => ({
    id: review.name ?? "",
    authorName: review.authorAttribution?.displayName ?? "",
    authorPhotoUrl: review.authorAttribution?.photoUri ?? "",
    rating: typeof review.rating === "number" ? review.rating : 0,
    text: review.text?.text ?? review.originalText?.text ?? "",
    relativeTime: review.relativePublishTimeDescription ?? "",
    publishTime: review.publishTime ?? "",
    profileUrl: review.authorAttribution?.uri ?? ""
  }));

  return {
    rating: typeof data.rating === "number" ? data.rating : 0,
    totalCount: typeof data.userRatingCount === "number" ? data.userRatingCount : 0,
    mapsUri: data.googleMapsUri ?? "",
    syncedAt: new Date().toISOString(),
    reviews
  };
}

/**
 * Resynchronise depuis Google et met le cache à jour. Retourne le nouvel instantané,
 * ou `null` si la synchro n'est pas configurée (pas de clé ou pas de Place ID).
 */
export async function refreshGoogleReviews(
  repository: LodenRepository,
  config: ApiConfig
): Promise<GoogleReviewsCache | null> {
  const cfg = await readGoogleReviewsConfig(repository);
  const snapshot = await fetchPlaceFromGoogle(cfg.placeId, config.GOOGLE_PLACES_API_KEY ?? "");
  if (!snapshot) return null;
  await repository.upsertSiteSetting(GOOGLE_REVIEWS_CACHE_KEY, snapshot);
  return snapshot;
}
