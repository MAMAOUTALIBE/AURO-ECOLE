import { Router } from "express";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { z } from "zod";
import type { ApiConfig } from "../../config/env";
import type { LodenRepository } from "../../repositories/loden-repository";
import { asyncHandler } from "../../shared/async-handler";
import { conflict, unauthorized } from "../../shared/http-error";
import { emailSchema, phoneSchema, validateBody } from "../../shared/validation";
import { authenticate } from "../../middleware/auth";
import { publicUser } from "../../http/request-context";
import type { AuthenticatedRequest } from "../../http/request-context";

const registerSchema = z.object({
  firstName: z.string().trim().min(2),
  lastName: z.string().trim().min(2),
  email: emailSchema,
  phone: phoneSchema,
  password: z.string().min(10),
  formationId: z.string().optional()
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1)
});

const forgotPasswordSchema = z.object({
  email: emailSchema
});

const resetPasswordSchema = z.object({
  token: z.string().min(16),
  password: z.string().min(10)
});

function signToken(config: ApiConfig, user: { id: string; role: string }) {
  return jwt.sign({ sub: user.id, role: user.role }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN as SignOptions["expiresIn"]
  });
}

export function createAuthRouter(repository: LodenRepository, config: ApiConfig) {
  const router = Router();

  // Limiteur strict dédié aux routes sensibles (anti-bourrage d'identifiants),
  // en plus du rate-limit global. Désactivé de fait en test (seuil très haut).
  const sensitiveLimiter = rateLimit({
    windowMs: 60_000,
    max: config.NODE_ENV === "test" ? 10_000 : 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { code: "RATE_LIMITED", message: "Trop de tentatives. Réessayez dans une minute." } }
  });

  router.post(
    "/register",
    sensitiveLimiter,
    asyncHandler(async (req, res) => {
      const body = validateBody(registerSchema, req);
      const existingUser = await repository.findUserByEmail(body.email);
      if (existingUser) throw conflict("Un compte existe déjà avec cet email");

      const passwordHash = await bcrypt.hash(body.password, 12);
      const user = await repository.createUser({
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
        role: "ELEVE",
        status: "ACTIVE",
        passwordHash
      });
      const student = await repository.createStudent({ userId: user.id, formationId: body.formationId });
      const token = signToken(config, user);

      res.status(201).json({ user: publicUser(user), student, token });
    })
  );

  router.post(
    "/login",
    sensitiveLimiter,
    asyncHandler(async (req, res) => {
      const body = validateBody(loginSchema, req);
      const user = await repository.findUserByEmail(body.email);
      if (!user?.passwordHash) throw unauthorized("Identifiants invalides");
      const isValid = await bcrypt.compare(body.password, user.passwordHash);
      if (!isValid) throw unauthorized("Identifiants invalides");
      const token = signToken(config, user);
      await repository.updateUser(user.id, { lastLoginAt: new Date() });
      res.json({ user: publicUser({ ...user, lastLoginAt: new Date() }), token });
    })
  );

  router.get(
    "/me",
    authenticate(repository, config.JWT_SECRET),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      res.json({ user: req.user });
    })
  );

  router.post(
    "/forgot-password",
    sensitiveLimiter,
    asyncHandler(async (req, res) => {
      validateBody(forgotPasswordSchema, req);
      // Deliberately do not disclose whether the email exists.
      res.json({ ok: true, message: "Si le compte existe, un email de réinitialisation sera envoyé." });
    })
  );

  router.post(
    "/reset-password",
    sensitiveLimiter,
    asyncHandler(async (req, res) => {
      validateBody(resetPasswordSchema, req);
      res.status(202).json({ ok: true, message: "Flux reset prêt pour intégration email sécurisée." });
    })
  );

  router.post(
    "/verify-email",
    asyncHandler(async (_req, res) => {
      res.status(202).json({ ok: true, message: "Flux vérification email prêt pour intégration token." });
    })
  );

  return router;
}
