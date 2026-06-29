import { Router, type NextFunction, type Response } from "express";
import { z } from "zod";
import type { ApiConfig } from "../../config/env";
import type { AuthenticatedRequest } from "../../http/request-context";
import { authenticate, requirePermission } from "../../middleware/auth";
import { hasPermission } from "../../domain/permissions";
import type { LodenRepository } from "../../repositories/loden-repository";
import { asyncHandler } from "../../shared/async-handler";
import { forbidden } from "../../shared/http-error";
import { validateBody, validateQuery } from "../../shared/validation";

const reviewSchema = z.object({
  instructorId: z.string().optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(10).max(600),
  status: z.enum(["EN_ATTENTE", "PUBLIE", "REJETE"]).optional()
});

const reviewQuery = z.object({
  includeUnpublished: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true")
});

const statusSchema = z.object({
  status: z.enum(["EN_ATTENTE", "PUBLIE", "REJETE"])
});

export function createReviewsRouter(repository: LodenRepository, config: ApiConfig) {
  const router = Router();
  const optionalAuthenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (req.header("authorization")?.startsWith("Bearer ")) {
      authenticate(repository, config.JWT_SECRET)(req, res, next);
      return;
    }
    next();
  };

  router.get(
    "/",
    (req, res, next) => {
      if (req.query.includeUnpublished === "true") {
        authenticate(repository, config.JWT_SECRET)(req as AuthenticatedRequest, res, next);
        return;
      }
      next();
    },
    asyncHandler(async (req, res) => {
      const query = validateQuery(reviewQuery, req);
      const user = (req as AuthenticatedRequest).user;
      // Voir les avis non publiés (file de modération) = permission reviews.read,
      // détenue par tous les rôles habilités à modérer/consulter — pas seulement ADMIN.
      if (query.includeUnpublished && !(user && hasPermission(user.role, "reviews.read"))) {
        throw forbidden();
      }
      res.json({ data: await repository.listReviews(query.includeUnpublished) });
    })
  );

  router.post(
    "/",
    optionalAuthenticate,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const body = validateBody(reviewSchema, req);
      const status = body.status ?? "EN_ATTENTE";
      if (status !== "EN_ATTENTE" && !(req.user && hasPermission(req.user.role, "reviews.moderate"))) {
        throw forbidden();
      }

      const review = await repository.createReview({
        instructorId: body.instructorId,
        rating: body.rating,
        comment: body.comment,
        userId: req.user?.id,
        status
      });
      void repository.createAuditLog({
        userId: req.user?.id ?? null,
        action: "review.create",
        entityType: "Review",
        entityId: review.id,
        metadata: { status }
      });
      res.status(201).json({ data: review });
    })
  );

  router.patch(
    "/:id/status",
    authenticate(repository, config.JWT_SECRET),
    requirePermission("reviews.moderate"),
    asyncHandler(async (req, res) => {
      const body = validateBody(statusSchema, req);
      const review = await repository.updateReview(String(req.params.id), body);
      void repository.createAuditLog({
        userId: (req as AuthenticatedRequest).user?.id ?? null,
        action: "review.moderate",
        entityType: "Review",
        entityId: review.id,
        metadata: { status: body.status }
      });
      res.json({ data: review });
    })
  );

  return router;
}
