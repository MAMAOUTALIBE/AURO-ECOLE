import { randomBytes } from "node:crypto";
import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { ApiConfig } from "../../config/env";
import { authenticate, requirePermission } from "../../middleware/auth";
import type { LodenRepository } from "../../repositories/loden-repository";
import { asyncHandler } from "../../shared/async-handler";
import { conflict, notFound } from "../../shared/http-error";
import { publicUser } from "../../http/request-context";
import { emailSchema, phoneSchema, validateBody } from "../../shared/validation";

const createSchema = z.object({
  firstName: z.string().trim().min(2),
  lastName: z.string().trim().min(2),
  email: emailSchema,
  phone: phoneSchema,
  bio: z.string().trim().max(2000).optional(),
  photoUrl: z.string().trim().url().optional(),
  specialties: z.array(z.string().trim().min(1)).optional(),
  interventionZones: z.array(z.string().trim().min(1)).optional(),
  agencyId: z.string().trim().optional()
});

const updateSchema = z.object({
  bio: z.string().trim().max(2000).optional(),
  photoUrl: z.string().trim().url().optional(),
  specialties: z.array(z.string().trim().min(1)).optional(),
  interventionZones: z.array(z.string().trim().min(1)).optional(),
  active: z.boolean().optional(),
  agencyId: z.string().trim().optional()
});

export function createInstructorsRouter(repository: LodenRepository, config: ApiConfig) {
  const router = Router();

  // Lecture publique (utilisée par la page À propos).
  router.get(
    "/",
    asyncHandler(async (_req, res) => {
      res.json({ data: await repository.listInstructors() });
    })
  );

  router.get(
    "/:id",
    asyncHandler(async (req, res) => {
      const instructor = await repository.findInstructorById(String(req.params.id));
      if (!instructor) throw notFound("Moniteur introuvable");
      res.json({ data: instructor });
    })
  );

  // Création d'un moniteur depuis le CRM : compte utilisateur (MONITEUR) + profil moniteur.
  router.post(
    "/",
    authenticate(repository, config.JWT_SECRET),
    requirePermission("instructors.manage"),
    asyncHandler(async (req, res) => {
      const body = validateBody(createSchema, req);
      const existing = await repository.findUserByEmail(body.email);
      if (existing) throw conflict("Un compte existe déjà avec cet email");

      const tempPassword = randomBytes(18).toString("base64url");
      const passwordHash = await bcrypt.hash(tempPassword, 12);
      const user = await repository.createUser({
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
        role: "MONITEUR",
        status: "ACTIVE",
        passwordHash
      });
      const instructor = await repository.createInstructor({
        userId: user.id,
        agencyId: body.agencyId,
        bio: body.bio,
        photoUrl: body.photoUrl,
        specialties: body.specialties,
        interventionZones: body.interventionZones
      });

      res.status(201).json({ data: { ...instructor, user: publicUser(user) } });
    })
  );

  router.patch(
    "/:id",
    authenticate(repository, config.JWT_SECRET),
    requirePermission("instructors.manage"),
    asyncHandler(async (req, res) => {
      const body = validateBody(updateSchema, req);
      const instructor = await repository.updateInstructor(String(req.params.id), body);
      res.json({ data: instructor });
    })
  );

  return router;
}
