import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().optional(),
  JWT_SECRET: z.string().min(16).default("dev-secret-change-me"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGIN: z.string().default("http://localhost:3000,http://127.0.0.1:3000"),
  API_USE_MEMORY: z
    .string()
    .optional()
    .transform((value) => value === "true")
    .default("false"),
  // Notifications email (optionnel). Sans RESEND_API_KEY/MAIL_FROM, l'envoi se fait en log.
  RESEND_API_KEY: z.string().optional(),
  MAIL_FROM: z.string().optional(),
  LODEN_NOTIFY_TO: z.string().optional(),
  // IA (optionnel). Sans GROQ_API_KEY, l'IA renvoie un message clair (désactivée).
  AI_PROVIDER: z.string().default("groq"),
  AI_MODEL: z.string().default("llama-3.1-8b-instant"),
  GROQ_API_KEY: z.string().optional(),
  // SMS (optionnel). Sans SMS_API_KEY, les SMS passent en log.
  SMS_API_KEY: z.string().optional(),
  SMS_SENDER: z.string().optional()
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
  }

  return {
    ...parsed,
    corsOrigins: parsed.CORS_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean)
  };
}
