import { randomBytes } from "node:crypto";
import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { ApiConfig } from "../../config/env";
import { MAX_SKILL_LEVEL, SKILL_CATALOG, SKILL_CODES } from "../../domain/skills";
import type { AuthenticatedRequest } from "../../http/request-context";
import { authenticate, requirePermission } from "../../middleware/auth";
import type { LodenRepository } from "../../repositories/loden-repository";
import { asyncHandler } from "../../shared/async-handler";
import { conflict, notFound } from "../../shared/http-error";
import { publicUser } from "../../http/request-context";
import { emailSchema, phoneSchema, validateBody, validateQuery } from "../../shared/validation";

const fileStatusEnum = z.enum([
  "NOUVEAU",
  "INCOMPLET",
  "EN_COURS",
  "PRET_EXAMEN",
  "EXAMEN_PLANIFIE",
  "TERMINE",
  "ARCHIVE"
]);

const listQuerySchema = z.object({
  agencyId: z.string().trim().optional()
});

const skillUpdateSchema = z.object({
  skillCode: z.string().refine((code) => SKILL_CODES.includes(code), "Compétence inconnue"),
  level: z.number().int().min(0).max(MAX_SKILL_LEVEL)
});

const documentCreateSchema = z.object({
  type: z.string().trim().min(2).max(80),
  url: z.string().trim().min(1).max(500)
});

const documentVerifySchema = z.object({
  verified: z.boolean()
});

const studentCreateSchema = z.object({
  firstName: z.string().trim().min(2),
  lastName: z.string().trim().min(2),
  email: emailSchema,
  phone: phoneSchema,
  formationId: z.string().trim().optional(),
  agencyId: z.string().trim().optional(),
  purchasedHours: z.number().int().nonnegative().optional()
});

const studentUpdateSchema = z.object({
  fileStatus: fileStatusEnum.optional(),
  internalNotes: z.string().trim().max(2000).optional(),
  progressPercent: z.number().int().min(0).max(100).optional(),
  purchasedHours: z.number().int().nonnegative().optional(),
  consumedHours: z.number().int().nonnegative().optional(),
  examDate: z.coerce.date().optional(),
  formationId: z.string().trim().optional(),
  agencyId: z.string().trim().optional()
});

export function createStudentsRouter(repository: LodenRepository, config: ApiConfig) {
  const router = Router();

  router.get(
    "/me",
    authenticate(repository, config.JWT_SECRET),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      if (!req.user) throw notFound("Utilisateur introuvable");
      const student = await repository.findStudentByUserId(req.user.id);
      res.json({ data: student });
    })
  );

  router.get(
    "/",
    authenticate(repository, config.JWT_SECRET),
    requirePermission("students.read"),
    asyncHandler(async (req, res) => {
      const query = validateQuery(listQuerySchema, req);
      const students = await repository.listStudents(query);
      const data = await Promise.all(
        students.map(async (student) => {
          const user = await repository.findUserById(student.userId);
          return { ...student, user: user ? publicUser(user) : null };
        })
      );
      res.json({ data });
    })
  );

  // Création d'un élève depuis le CRM : crée le compte utilisateur (ELEVE) + le profil élève.
  // Mot de passe temporaire aléatoire (non exposé) — l'élève le définit ensuite via reset.
  router.post(
    "/",
    authenticate(repository, config.JWT_SECRET),
    requirePermission("students.manage"),
    asyncHandler(async (req, res) => {
      const body = validateBody(studentCreateSchema, req);
      const existing = await repository.findUserByEmail(body.email);
      if (existing) throw conflict("Un compte existe déjà avec cet email");

      const tempPassword = randomBytes(18).toString("base64url");
      const passwordHash = await bcrypt.hash(tempPassword, 12);
      const user = await repository.createUser({
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
        role: "ELEVE",
        status: "ACTIVE",
        passwordHash
      });
      const created = await repository.createStudent({
        userId: user.id,
        formationId: body.formationId,
        purchasedHours: body.purchasedHours
      });
      const student = body.agencyId
        ? await repository.updateStudent(created.id, { agencyId: body.agencyId })
        : created;

      res.status(201).json({ data: { ...student, user: publicUser(user) } });
    })
  );

  router.get(
    "/:id",
    authenticate(repository, config.JWT_SECRET),
    requirePermission("students.read"),
    asyncHandler(async (req, res) => {
      const student = await repository.findStudentById(String(req.params.id));
      if (!student) throw notFound("Élève introuvable");
      const user = await repository.findUserById(student.userId);
      res.json({ data: { ...student, user: user ? publicUser(user) : null } });
    })
  );

  router.patch(
    "/:id",
    authenticate(repository, config.JWT_SECRET),
    requirePermission("students.manage"),
    asyncHandler(async (req, res) => {
      const body = validateBody(studentUpdateSchema, req);
      const student = await repository.updateStudent(String(req.params.id), body);
      res.json({ data: student });
    })
  );

  router.get(
    "/:id/skills",
    authenticate(repository, config.JWT_SECRET),
    requirePermission("students.read"),
    asyncHandler(async (req, res) => {
      const skills = await repository.listStudentSkills(String(req.params.id));
      const levelByCode = new Map(skills.map((skill) => [skill.skillCode, skill.level]));
      const data = SKILL_CATALOG.map((skill) => ({
        code: skill.code,
        label: skill.label,
        level: levelByCode.get(skill.code) ?? 0
      }));
      res.json({ data });
    })
  );

  router.patch(
    "/:id/skills",
    authenticate(repository, config.JWT_SECRET),
    requirePermission("students.manage"),
    asyncHandler(async (req, res) => {
      const id = String(req.params.id);
      const student = await repository.findStudentById(id);
      if (!student) throw notFound("Élève introuvable");
      const body = validateBody(skillUpdateSchema, req);
      const skill = await repository.setStudentSkill(id, body.skillCode, body.level);
      res.json({ data: skill });
    })
  );

  // --- Documents du dossier élève (métadonnées + lien) ---
  router.get(
    "/:id/documents",
    authenticate(repository, config.JWT_SECRET),
    requirePermission("students.read"),
    asyncHandler(async (req, res) => {
      res.json({ data: await repository.listStudentDocuments(String(req.params.id)) });
    })
  );

  router.post(
    "/:id/documents",
    authenticate(repository, config.JWT_SECRET),
    requirePermission("students.manage"),
    asyncHandler(async (req, res) => {
      const id = String(req.params.id);
      const student = await repository.findStudentById(id);
      if (!student) throw notFound("Élève introuvable");
      const body = validateBody(documentCreateSchema, req);
      const document = await repository.createStudentDocument({ studentId: id, type: body.type, url: body.url });
      res.status(201).json({ data: document });
    })
  );

  router.patch(
    "/:id/documents/:documentId",
    authenticate(repository, config.JWT_SECRET),
    requirePermission("students.manage"),
    asyncHandler(async (req, res) => {
      const body = validateBody(documentVerifySchema, req);
      const document = await repository.setStudentDocumentVerified(String(req.params.documentId), body.verified);
      res.json({ data: document });
    })
  );

  router.delete(
    "/:id/documents/:documentId",
    authenticate(repository, config.JWT_SECRET),
    requirePermission("students.manage"),
    asyncHandler(async (req, res) => {
      await repository.deleteStudentDocument(String(req.params.documentId));
      res.json({ ok: true });
    })
  );

  return router;
}
