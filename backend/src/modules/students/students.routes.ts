import { randomBytes } from "node:crypto";
import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { ApiConfig } from "../../config/env";
import { MAX_SKILL_LEVEL, SKILL_CATALOG, SKILL_CODES } from "../../domain/skills";
import type { AuthenticatedRequest } from "../../http/request-context";
import { assertAgencyAccess, authenticate, requirePermission, resolveScopedAgencyId } from "../../middleware/auth";
import { runAutomations } from "../../automations/engine";
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
  purchasedHours: z.number().int().nonnegative().optional(),
  civility: z.string().trim().max(10).optional(),
  birthName: z.string().trim().max(120).optional(),
  birthDate: z.coerce.date().optional(),
  birthPlace: z.string().trim().max(120).optional(),
  neph: z.string().trim().max(40).optional(),
  filiere: z.string().trim().max(60).optional(),
  financingType: z.string().trim().max(40).optional()
});

const civilFields = {
  civility: z.string().trim().max(10).optional(),
  birthName: z.string().trim().max(120).optional(),
  birthDate: z.coerce.date().optional(),
  birthPlace: z.string().trim().max(120).optional(),
  neph: z.string().trim().max(40).optional(),
  filiere: z.string().trim().max(60).optional(),
  financingType: z.string().trim().max(40).optional(),
  registeredAt: z.coerce.date().optional()
};

const studentUpdateSchema = z.object({
  fileStatus: fileStatusEnum.optional(),
  internalNotes: z.string().trim().max(2000).optional(),
  progressPercent: z.number().int().min(0).max(100).optional(),
  purchasedHours: z.number().int().nonnegative().optional(),
  consumedHours: z.number().int().nonnegative().optional(),
  examDate: z.coerce.date().optional(),
  formationId: z.string().trim().optional(),
  agencyId: z.string().trim().optional(),
  ...civilFields,
  // Champs portés par le compte User (édition depuis l'onglet Profil de la fiche).
  firstName: z.string().trim().min(1).max(120).optional(),
  lastName: z.string().trim().min(1).max(120).optional(),
  phone: z.string().trim().max(30).optional(),
  address: z.string().trim().max(300).optional()
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
      const agencyId = await resolveScopedAgencyId(repository, req as AuthenticatedRequest, query.agencyId);
      const students = await repository.listStudents({ agencyId });
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
        purchasedHours: body.purchasedHours,
        civility: body.civility,
        birthName: body.birthName,
        birthDate: body.birthDate,
        birthPlace: body.birthPlace,
        neph: body.neph,
        filiere: body.filiere,
        financingType: body.financingType,
        registeredAt: new Date()
      });
      const student = body.agencyId
        ? await repository.updateStudent(created.id, { agencyId: body.agencyId })
        : created;

      void repository.createAuditLog({
        userId: (req as AuthenticatedRequest).user?.id ?? null,
        action: "student.create",
        entityType: "Student",
        entityId: student.id
      });
      void runAutomations(repository, config, "STUDENT_CREATED", { entityType: "Student", entityId: student.id, email: user.email, name: `${user.firstName} ${user.lastName}` });
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
      await assertAgencyAccess(repository, req as AuthenticatedRequest, student.agencyId);
      const user = await repository.findUserById(student.userId);
      res.json({ data: { ...student, user: user ? publicUser(user) : null } });
    })
  );

  router.patch(
    "/:id",
    authenticate(repository, config.JWT_SECRET),
    requirePermission("students.manage"),
    asyncHandler(async (req, res) => {
      const id = String(req.params.id);
      const existing = await repository.findStudentById(id);
      if (!existing) throw notFound("Élève introuvable");
      await assertAgencyAccess(repository, req as AuthenticatedRequest, existing.agencyId);
      const body = validateBody(studentUpdateSchema, req);
      const { firstName, lastName, phone, address, ...studentFields } = body;
      if (firstName !== undefined || lastName !== undefined || phone !== undefined || address !== undefined) {
        await repository.updateUser(existing.userId, {
          ...(firstName !== undefined ? { firstName } : {}),
          ...(lastName !== undefined ? { lastName } : {}),
          ...(phone !== undefined ? { phone } : {}),
          ...(address !== undefined ? { address } : {})
        });
      }
      const student = await repository.updateStudent(id, studentFields);
      const user = await repository.findUserById(existing.userId);
      res.json({ data: { ...student, user: user ? publicUser(user) : null } });
    })
  );

  router.get(
    "/:id/skills",
    authenticate(repository, config.JWT_SECRET),
    requirePermission("students.read"),
    asyncHandler(async (req, res) => {
      const id = String(req.params.id);
      const student = await repository.findStudentById(id);
      if (!student) throw notFound("Élève introuvable");
      await assertAgencyAccess(repository, req as AuthenticatedRequest, student.agencyId);
      const skills = await repository.listStudentSkills(id);
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
      await assertAgencyAccess(repository, req as AuthenticatedRequest, student.agencyId);
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
      const id = String(req.params.id);
      const student = await repository.findStudentById(id);
      if (!student) throw notFound("Élève introuvable");
      await assertAgencyAccess(repository, req as AuthenticatedRequest, student.agencyId);
      res.json({ data: await repository.listStudentDocuments(id) });
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
      await assertAgencyAccess(repository, req as AuthenticatedRequest, student.agencyId);
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
      const student = await repository.findStudentById(String(req.params.id));
      if (!student) throw notFound("Élève introuvable");
      await assertAgencyAccess(repository, req as AuthenticatedRequest, student.agencyId);
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
      const student = await repository.findStudentById(String(req.params.id));
      if (!student) throw notFound("Élève introuvable");
      await assertAgencyAccess(repository, req as AuthenticatedRequest, student.agencyId);
      await repository.deleteStudentDocument(String(req.params.documentId));
      res.json({ ok: true });
    })
  );

  return router;
}
