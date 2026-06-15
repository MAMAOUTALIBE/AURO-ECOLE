import { Router } from "express";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import jwt, { type SignOptions } from "jsonwebtoken";
import { z } from "zod";
import type { ApiConfig } from "../../config/env";
import type { LodenRepository } from "../../repositories/loden-repository";
import { asyncHandler } from "../../shared/async-handler";
import { badRequest, conflict, unauthorized } from "../../shared/http-error";
import { sendEmail } from "../../shared/mailer";
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

const verifyEmailSchema = z.object({
  token: z.string().min(10)
});

// Durée de validité du lien de réinitialisation : 1 heure.
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
// Durée de validité du lien de vérification d'email : 2 jours.
const VERIFY_EMAIL_TTL = "2d";

function signToken(config: ApiConfig, user: { id: string; role: string; tokenVersion?: number }) {
  return jwt.sign({ sub: user.id, role: user.role, tokenVersion: user.tokenVersion ?? 0 }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN as SignOptions["expiresIn"]
  });
}

// Le lien de vérification d'email est un JWT signé, à usage informatif (pas de
// champ dédié au schéma). Il porte un `purpose` pour ne pas être confondu avec un
// token de session.
function signEmailVerificationToken(config: ApiConfig, userId: string) {
  return jwt.sign({ sub: userId, purpose: "verify-email" }, config.JWT_SECRET, {
    expiresIn: VERIFY_EMAIL_TTL
  });
}

// Le token de réinitialisation est aléatoire (haute entropie) ; on ne stocke en
// base que son hash SHA-256, jamais le secret en clair. La recherche se fait par
// hash, et le token est à usage unique (effacé après réinitialisation).
function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function buildAppUrl(config: ApiConfig, path: string) {
  return `${config.appBaseUrl.replace(/\/$/, "")}${path}`;
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

      // Lien de vérification d'email (best-effort, ne bloque pas l'inscription :
      // le compte est immédiatement utilisable). En l'absence de provider email,
      // sendEmail se contente d'un log et ne lève jamais.
      const verificationToken = signEmailVerificationToken(config, user.id);
      await sendEmail(config, {
        to: user.email,
        subject: "Confirmez votre adresse email LODENE",
        text:
          `Bonjour ${user.firstName},\n\n` +
          `Bienvenue chez LODENE Auto-École. Confirmez votre adresse email :\n` +
          `${buildAppUrl(config, `/verifier-email?token=${verificationToken}`)}\n\n` +
          `À bientôt,\nL'équipe LODENE`
      });

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
      const body = validateBody(forgotPasswordSchema, req);
      const user = await repository.findUserByEmail(body.email);

      // On ne génère un token et n'envoie un email que si le compte existe ET
      // possède déjà un mot de passe (les comptes sans passwordHash, ex. démo,
      // ne sont pas réinitialisables). La réponse reste identique dans tous les
      // cas pour ne pas divulguer l'existence du compte (anti-énumération).
      if (user?.passwordHash) {
        const rawToken = randomBytes(32).toString("hex");
        await repository.updateUser(user.id, {
          resetTokenHash: hashResetToken(rawToken),
          resetTokenExpiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS)
        });

        const resetUrl = buildAppUrl(config, `/reinitialiser-mot-de-passe?token=${rawToken}`);
        await sendEmail(config, {
          to: user.email,
          subject: "Réinitialisation de votre mot de passe LODENE",
          text:
            `Bonjour ${user.firstName},\n\n` +
            `Vous avez demandé à réinitialiser votre mot de passe. Ce lien est valable 1 heure :\n` +
            `${resetUrl}\n\n` +
            `Si vous n'êtes pas à l'origine de cette demande, ignorez cet email : votre mot de passe reste inchangé.\n\n` +
            `L'équipe LODENE`
        });
      }

      res.json({
        ok: true,
        message: "Si un compte existe pour cet email, un lien de réinitialisation vient d'être envoyé."
      });
    })
  );

  router.post(
    "/reset-password",
    sensitiveLimiter,
    asyncHandler(async (req, res) => {
      const body = validateBody(resetPasswordSchema, req);
      const user = await repository.findUserByResetTokenHash(hashResetToken(body.token));

      // Token inconnu, déjà consommé, ou expiré -> message générique unique.
      if (
        !user ||
        !user.resetTokenExpiresAt ||
        user.resetTokenExpiresAt.getTime() < Date.now()
      ) {
        throw badRequest("Lien de réinitialisation invalide ou expiré. Veuillez en demander un nouveau.");
      }

      const passwordHash = await bcrypt.hash(body.password, 12);
      // Usage unique : on efface le token en même temps qu'on change le mot de passe.
      // On incrémente aussi tokenVersion pour invalider toutes les sessions ouvertes
      // avec l'ancien mot de passe (révocation après reset).
      await repository.updateUser(user.id, {
        passwordHash,
        resetTokenHash: null,
        resetTokenExpiresAt: null,
        tokenVersion: (user.tokenVersion ?? 0) + 1
      });

      res.json({ ok: true, message: "Votre mot de passe a été réinitialisé. Vous pouvez vous connecter." });
    })
  );

  router.post(
    "/verify-email",
    sensitiveLimiter,
    asyncHandler(async (req, res) => {
      const body = validateBody(verifyEmailSchema, req);

      let payload: jwt.JwtPayload;
      try {
        const decoded = jwt.verify(body.token, config.JWT_SECRET);
        if (typeof decoded === "string") throw new Error("invalid");
        payload = decoded;
      } catch {
        throw badRequest("Lien de vérification invalide ou expiré.");
      }

      if (payload.purpose !== "verify-email" || !payload.sub) {
        throw badRequest("Lien de vérification invalide.");
      }

      const user = await repository.findUserById(String(payload.sub));
      if (!user) throw badRequest("Lien de vérification invalide.");

      if (!user.emailVerifiedAt) {
        await repository.updateUser(user.id, { emailVerifiedAt: new Date() });
      }

      res.json({ ok: true, message: "Votre adresse email a bien été vérifiée." });
    })
  );

  return router;
}
