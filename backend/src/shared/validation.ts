import type { Request } from "express";
import { z, type ZodTypeAny } from "zod";
import { HttpError } from "./http-error";

export function validateBody<T extends ZodTypeAny>(schema: T, req: Request): z.infer<T> {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, "Données invalides", "VALIDATION_ERROR", parsed.error.flatten());
  }
  return parsed.data;
}

export function validateQuery<T extends ZodTypeAny>(schema: T, req: Request): z.infer<T> {
  const parsed = schema.safeParse(req.query);
  if (!parsed.success) {
    throw new HttpError(400, "Paramètres invalides", "VALIDATION_ERROR", parsed.error.flatten());
  }
  return parsed.data;
}

export const emailSchema = z.string().trim().toLowerCase().email();
export const phoneSchema = z.string().trim().min(8).max(30).optional();
