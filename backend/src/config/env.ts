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
    .default("false")
});

export type ApiConfig = ReturnType<typeof loadConfig>;

export function loadConfig(env = process.env) {
  const parsed = envSchema.parse(env);
  return {
    ...parsed,
    corsOrigins: parsed.CORS_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean)
  };
}
