import { Router } from "express";
import type { ApiConfig } from "../../config/env";
import type { AuthenticatedRequest } from "../../http/request-context";
import { authenticate, requirePermission } from "../../middleware/auth";
import type { LodenRepository } from "../../repositories/loden-repository";
import { recordAudit } from "../../shared/audit";
import { asyncHandler } from "../../shared/async-handler";
import { HttpError } from "../../shared/http-error";
import {
  buildWriteReviewUrl,
  fetchPlaceFromGoogle,
  isCacheStale,
  readGoogleReviewsCache,
  readGoogleReviewsConfig,
  refreshGoogleReviews,
  GOOGLE_REVIEWS_CACHE_KEY
} from "./google-reviews.service";

export function createGoogleReviewsRouter(repository: LodenRepository, config: ApiConfig) {
  const router = Router();
  const apiKey = config.GOOGLE_PLACES_API_KEY ?? "";

  // Anti-stampede : on ne déclenche au plus qu'une resynchro best-effort par minute.
  let lastBackgroundSync = 0;

  // Public : payload prêt à afficher (config visible + note/avis Google). Aucune clé
  // API exposée. Déclenche une resynchro en arrière-plan si le cache est périmé.
  router.get(
    "/",
    asyncHandler(async (_req, res) => {
      const cfg = await readGoogleReviewsConfig(repository);
      const cache = await readGoogleReviewsCache(repository);

      if (
        cfg.enabled &&
        cfg.placeId &&
        apiKey &&
        isCacheStale(cache) &&
        Date.now() - lastBackgroundSync > 60_000
      ) {
        lastBackgroundSync = Date.now();
        // Best-effort : on ne bloque pas la réponse et on ignore les erreurs réseau.
        void refreshGoogleReviews(repository, config).catch(() => undefined);
      }

      const reviewUrl = cfg.reviewUrl || buildWriteReviewUrl(cfg.placeId);
      const profileUrl = cfg.profileUrl || cache?.mapsUri || "";

      // Note/nombre : on privilégie les vraies données Google ; sinon repli manuel.
      const rating = cache?.rating || cfg.fallbackRating || 0;
      const totalCount = cache?.totalCount || cfg.fallbackCount || 0;
      const hasStats = rating > 0;

      const reviews = (cache?.reviews ?? [])
        .filter((review) => review.rating >= cfg.minRating)
        .slice(0, cfg.maxReviews);

      res.json({
        data: {
          config: {
            enabled: cfg.enabled,
            showOnHomepage: cfg.showOnHomepage,
            placeId: cfg.placeId,
            reviewUrl,
            profileUrl,
            sectionTitle: cfg.sectionTitle,
            sectionSubtitle: cfg.sectionSubtitle,
            minRating: cfg.minRating,
            maxReviews: cfg.maxReviews
          },
          stats: hasStats ? { rating, totalCount, syncedAt: cache?.syncedAt ?? null } : null,
          reviews,
          syncedAt: cache?.syncedAt ?? null
        }
      });
    })
  );

  // Admin : forcer une synchronisation immédiate depuis Google.
  router.post(
    "/sync",
    authenticate(repository, config.JWT_SECRET),
    requirePermission("content.manage", "settings.manage"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const cfg = await readGoogleReviewsConfig(repository);
      if (!cfg.placeId) {
        throw new HttpError(
          400,
          "Renseignez d'abord l'identifiant Google Place (Place ID) dans la configuration.",
          "GOOGLE_PLACE_ID_MISSING"
        );
      }
      if (!apiKey) {
        throw new HttpError(
          400,
          "Clé API Google non configurée sur le serveur (variable GOOGLE_PLACES_API_KEY). Le mode manuel reste disponible.",
          "GOOGLE_API_KEY_MISSING"
        );
      }

      let snapshot;
      try {
        snapshot = await fetchPlaceFromGoogle(cfg.placeId, apiKey);
      } catch (error) {
        throw new HttpError(
          502,
          `Échec de la synchronisation Google : ${(error as Error).message}`,
          "GOOGLE_SYNC_FAILED"
        );
      }
      if (!snapshot) {
        throw new HttpError(502, "Réponse Google vide ou configuration incomplète.", "GOOGLE_SYNC_EMPTY");
      }

      await repository.upsertSiteSetting(GOOGLE_REVIEWS_CACHE_KEY, snapshot);
      recordAudit(repository, {
        userId: req.user?.id ?? null,
        action: "google_reviews.sync",
        entityType: "SiteSetting",
        entityId: GOOGLE_REVIEWS_CACHE_KEY
      });

      res.json({
        data: {
          syncedAt: snapshot.syncedAt,
          rating: snapshot.rating,
          totalCount: snapshot.totalCount,
          fetched: snapshot.reviews.length
        }
      });
    })
  );

  return router;
}
