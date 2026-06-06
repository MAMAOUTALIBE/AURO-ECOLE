import { Router } from "express";
import { z } from "zod";
import type { ApiConfig } from "../../config/env";
import type { AuthenticatedRequest } from "../../http/request-context";
import { authenticate, requireRoles } from "../../middleware/auth";
import type { LodenRepository } from "../../repositories/loden-repository";
import { asyncHandler } from "../../shared/async-handler";
import { conflict, forbidden, notFound } from "../../shared/http-error";
import { validateBody, validateQuery } from "../../shared/validation";

const bookingCreateSchema = z.object({
  studentId: z.string().optional(),
  instructorId: z.string(),
  formationId: z.string(),
  meetingPointId: z.string().optional(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date()
});

const bookingListQuery = z.object({
  status: z.enum(["EN_ATTENTE", "CONFIRMEE", "ANNULEE", "TERMINEE", "ABSENT"]).optional(),
  instructorId: z.string().optional(),
  studentId: z.string().optional()
});

const bookingStatusSchema = z.object({
  status: z.enum(["EN_ATTENTE", "CONFIRMEE", "ANNULEE", "TERMINEE", "ABSENT"]),
  cancellationReason: z.string().optional()
});

export function createBookingsRouter(repository: LodenRepository, config: ApiConfig) {
  const router = Router();

  router.get(
    "/slots",
    asyncHandler(async (req, res) => {
      const query = validateQuery(z.object({ instructorId: z.string().optional() }), req);
      res.json({ data: await repository.listAvailabilities(query.instructorId) });
    })
  );

  router.use(authenticate(repository, config.JWT_SECRET));

  router.get(
    "/",
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const query = validateQuery(bookingListQuery, req);
      const user = req.user;
      if (!user) throw forbidden();
      if (user.role === "ELEVE") {
        const student = await repository.findStudentByUserId(user.id);
        res.json({ data: student ? await repository.listBookings({ studentId: student.id, status: query.status }) : [] });
        return;
      }
      res.json({ data: await repository.listBookings(query) });
    })
  );

  router.post(
    "/",
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const body = validateBody(bookingCreateSchema, req);
      if (body.endsAt <= body.startsAt) throw conflict("Le créneau de fin doit être après le début");

      let studentId = body.studentId;
      if (req.user?.role === "ELEVE") {
        const student = await repository.findStudentByUserId(req.user.id);
        if (!student) throw notFound("Profil élève introuvable");
        studentId = student.id;
      } else if (!studentId) {
        throw conflict("studentId requis pour une réservation admin");
      }

      const hasConflict = await repository.hasInstructorConflict(body.instructorId, body.startsAt, body.endsAt);
      if (hasConflict) throw conflict("Le moniteur est déjà réservé sur ce créneau");

      const booking = await repository.createBooking({
        studentId,
        instructorId: body.instructorId,
        formationId: body.formationId,
        meetingPointId: body.meetingPointId,
        startsAt: body.startsAt,
        endsAt: body.endsAt,
        status: "EN_ATTENTE"
      });
      res.status(201).json({ data: booking });
    })
  );

  router.patch(
    "/:id/status",
    requireRoles("SUPER_ADMIN", "ADMIN", "MONITEUR"),
    asyncHandler(async (req, res) => {
      const body = validateBody(bookingStatusSchema, req);
      const booking = await repository.updateBooking(String(req.params.id), body);
      res.json({ data: booking });
    })
  );

  return router;
}
