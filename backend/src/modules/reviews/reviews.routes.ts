import { Router } from "express";
import { z } from "zod";
import type { ApiConfig } from "../../config/env";
import type { AuthenticatedRequest } from "../../http/request-context";
import { authenticate, requireRoles } from "../../middleware/auth";
import type { LodenRepository } from "../../repositories/loden-repository";
import { asyncHandler } from "../../shared/async-handler";
import { forbidden } from "../../shared/http-error";
import { validateBody, validateQuery } from "../../shared/validation";

const reviewSchema = z.object({
  instructorId: z.string().optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(10)
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
      if (query.includeUnpublished && user?.role !== "SUPER_ADMIN" && user?.role !== "ADMIN") {
        throw forbidden();
      }
      res.json({ data: await repository.listReviews(query.includeUnpublished) });
    })
  );

  router.post(
    "/",
    authenticate(repository, config.JWT_SECRET),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const body = validateBody(reviewSchema, req);
      const review = await repository.createReview({
        ...body,
        userId: req.user?.id,
        status: "EN_ATTENTE"
      });
      res.status(201).json({ data: review });
    })
  );

  router.patch(
    "/:id/status",
    authenticate(repository, config.JWT_SECRET),
    requireRoles("SUPER_ADMIN", "ADMIN"),
    asyncHandler(async (req, res) => {
      const body = validateBody(statusSchema, req);
      const review = await repository.updateReview(String(req.params.id), body);
      res.json({ data: review });
    })
  );

  return router;
}
