import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().optional(),
  JWT_SECRET: z.string().min(16).default("dev-secret-change-me"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGIN: z.string().default("http://localhost:3000,http://127.0.0.1:3000"),
  // URL publique du front, utilisée pour construire les liens des emails
  // (réinitialisation de mot de passe, vérification d'adresse). À défaut, on
  // retombe sur la première origine CORS, puis sur localhost.
  APP_BASE_URL: z.string().url().optional(),
  API_USE_MEMORY: z
    .string()
    .optional()
    .transform((value) => value === "true")
    .default("false"),
  // Données de DÉMONSTRATION (toggle). À true, le repo mémoire est seedé avec un jeu
  // de démo réaliste + clairement marqué (ids "demo-"). Désactivé = jeu réel vide.
  // Refusé en production (cf. garde-fou plus bas) pour ne jamais polluer la vraie base.
  API_DEMO_SEED: z
    .string()
    .optional()
    .transform((value) => value === "true")
    .default("false"),
  // Notifications email (optionnel). Sans RESEND_API_KEY/MAIL_FROM, l'envoi se fait en log.
  RESEND_API_KEY: z.string().optional(),
  MAIL_FROM: z.string().optional(),
  LODEN_NOTIFY_TO: z.string().optional(),
  OWNER_ALERT_EMAIL: z.string().email().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  WHATSAPP_PROVIDER: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_ACCESS_TOKEN: z.string().optional(),
  WHATSAPP_BUSINESS_NUMBER: z.string().optional(),
  WHATSAPP_TEMPLATE_APPOINTMENT_CONFIRMATION: z.string().optional(),
  // IA (optionnel). Sans GROQ_API_KEY, l'IA renvoie un message clair (désactivée).
  AI_PROVIDER: z.string().default("groq"),
  // 70B requis pour un tool-calling fiable (le 8B formate mal les appels d'outils).
  AI_MODEL: z.string().default("llama-3.3-70b-versatile"),
  GROQ_API_KEY: z.string().optional(),
  // SMS (optionnel). Sans SMS_API_KEY, les SMS passent en log.
  SMS_API_KEY: z.string().optional(),
  SMS_SENDER: z.string().optional(),
  // Paiement (optionnel). Sans STRIPE_SECRET_KEY, le paiement tourne en mode mock
  // (aucun débit). En live, STRIPE_WEBHOOK_SECRET est obligatoire pour authentifier
  // les événements de paiement (cf. garde-fou production ci-dessous).
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional()
});

export type ApiConfig = ReturnType<typeof loadConfig>;

const unsafeJwtSecrets = new Set([
  "dev-secret-change-me",
  "change-me-in-production",
  "local-dev-secret-change-before-production",
  "CHANGE_ME_WITH_A_RANDOM_SECRET_OF_AT_LEAST_32_CHARACTERS",
  "test-secret-with-enough-length"
]);

export function loadConfig(env = process.env) {
  const parsed = envSchema.parse(env);
  if (parsed.NODE_ENV === "production") {
    if (
      unsafeJwtSecrets.has(parsed.JWT_SECRET) ||
      parsed.JWT_SECRET.includes("CHANGE_ME") ||
      parsed.JWT_SECRET.length < 32
    ) {
      throw new Error("JWT_SECRET must be a strong production secret with at least 32 characters");
    }

    if (parsed.API_USE_MEMORY || !parsed.DATABASE_URL) {
      throw new Error("Production API must use PostgreSQL through DATABASE_URL");
    }

    // Jamais de données de démo en production.
    if (parsed.API_DEMO_SEED) {
      throw new Error("API_DEMO_SEED must be disabled in production");
    }

    // Paiement live sans vérification de signature = porte ouverte aux faux "payé".
    if (parsed.STRIPE_SECRET_KEY && !parsed.STRIPE_WEBHOOK_SECRET) {
      throw new Error("STRIPE_WEBHOOK_SECRET is required in production when STRIPE_SECRET_KEY is set");
    }
  }

  const corsOrigins = parsed.CORS_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean);
  return {
    ...parsed,
    corsOrigins,
    appBaseUrl: parsed.APP_BASE_URL ?? corsOrigins[0] ?? "http://localhost:3000"
  };
}
