import { Router } from "express";
import { z } from "zod";
import type { ApiConfig } from "../../config/env";
import type { AuthenticatedRequest } from "../../http/request-context";
import { authenticate, requirePermission, resolveScopedAgencyId } from "../../middleware/auth";
import type { LodenRepository } from "../../repositories/loden-repository";
import { asyncHandler } from "../../shared/async-handler";
import { validateBody, validateQuery } from "../../shared/validation";

const examTypeEnum = z.enum(["CODE", "CONDUITE"]);
const examResultEnum = z.enum(["EN_ATTENTE", "REUSSI", "ECHOUE", "ABSENT"]);

const listQuerySchema = z.object({
  agencyId: z.string().trim().optional(),
  studentId: z.string().trim().optional()
});

const createSchema = z.object({
  studentId: z.string().trim().min(1),
  agencyId: z.string().trim().optional(),
  type: examTypeEnum,
  scheduledAt: z.coerce.date(),
  center: z.string().trim().optional(),
  result: examResultEnum.optional(),
  score: z.number().int().min(0).max(100).optional(),
  attempt: z.number().int().positive().optional()
});

const updateSchema = z.object({
  type: examTypeEnum.optional(),
  scheduledAt: z.coerce.date().optional(),
  center: z.string().trim().optional(),
  result: examResultEnum.optional(),
  score: z.number().int().min(0).max(100).optional(),
  attempt: z.number().int().positive().optional(),
  agencyId: z.string().trim().optional()
});

export function createExamsRouter(repository: LodenRepository, config: ApiConfig) {
  const router = Router();
  router.use(authenticate(repository, config.JWT_SECRET));

  router.get(
    "/",
    requirePermission("exams.read"),
    asyncHandler(async (req, res) => {
      const query = validateQuery(listQuerySchema, req);
      const agencyId = await resolveScopedAgencyId(repository, req as AuthenticatedRequest, query.agencyId);
      res.json({ data: await repository.listExams({ ...query, agencyId }) });
    })
  );

  router.post(
    "/",
    requirePermission("exams.manage"),
    asyncHandler(async (req, res) => {
      const body = validateBody(createSchema, req);
      const exam = await repository.createExam(body);
      res.status(201).json({ data: exam });
    })
  );

  router.patch(
    "/:id",
    requirePermission("exams.manage"),
    asyncHandler(async (req, res) => {
      const body = validateBody(updateSchema, req);
      const exam = await repository.updateExam(String(req.params.id), body);
      void repository.createAuditLog({
        userId: (req as AuthenticatedRequest).user?.id ?? null,
        action: "exam.update",
        entityType: "Exam",
        entityId: exam.id,
        metadata: { result: body.result, score: body.score }
      });
      res.json({ data: exam });
    })
  );

  return router;
}
