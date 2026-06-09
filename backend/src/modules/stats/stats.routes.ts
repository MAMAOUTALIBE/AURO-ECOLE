import { Router } from "express";
import { z } from "zod";
import type { ApiConfig } from "../../config/env";
import type { AuthenticatedRequest } from "../../http/request-context";
import { authenticate, requirePermission, resolveScopedAgencyId } from "../../middleware/auth";
import type { LodenRepository } from "../../repositories/loden-repository";
import { asyncHandler } from "../../shared/async-handler";
import { validateQuery } from "../../shared/validation";

const querySchema = z.object({ agencyId: z.string().trim().optional() });

function countBy<T>(items: T[], key: (item: T) => string) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const value = key(item);
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

export function createStatsRouter(repository: LodenRepository, config: ApiConfig) {
  const router = Router();
  router.use(authenticate(repository, config.JWT_SECRET), requirePermission("dashboard.read"));

  router.get(
    "/stats",
    asyncHandler(async (req, res) => {
      const { agencyId: requested } = validateQuery(querySchema, req);
      const agencyId = await resolveScopedAgencyId(repository, req as AuthenticatedRequest, requested);
      const scope = agencyId ? { agencyId } : undefined;

      const [students, leads, bookings, payments, cpfRequests, reviews, exams] = await Promise.all([
        repository.listStudents(scope),
        repository.listLeads(scope),
        repository.listBookings(scope),
        repository.listPayments(scope),
        repository.listCpfRequests(),
        repository.listReviews(true),
        repository.listExams(scope)
      ]);

      const now = new Date();
      const passed = exams.filter((exam) => exam.result === "REUSSI").length;
      const failed = exams.filter((exam) => exam.result === "ECHOUE").length;
      const decided = passed + failed;

      res.json({
        data: {
          students: {
            total: students.length,
            byStatus: countBy(students, (student) => student.fileStatus)
          },
          leads: {
            total: leads.length,
            byStage: countBy(leads, (lead) => lead.status)
          },
          bookings: {
            upcoming: bookings.filter((booking) => booking.status !== "ANNULEE" && booking.startsAt > now).length
          },
          payments: {
            paidCents: payments.filter((p) => p.status === "PAYE").reduce((sum, p) => sum + p.amountCents, 0),
            pending: payments.filter((p) => p.status === "EN_ATTENTE").length
          },
          cpf: {
            pending: cpfRequests.filter((request) => request.status !== "VALIDEE" && request.status !== "REFUSEE").length
          },
          reviews: {
            pending: reviews.filter((review) => review.status === "EN_ATTENTE").length
          },
          exams: {
            total: exams.length,
            upcoming: exams.filter((exam) => exam.result === "EN_ATTENTE" && exam.scheduledAt > now).length,
            passRate: decided > 0 ? Math.round((passed / decided) * 100) : null
          }
        }
      });
    })
  );

  return router;
}
