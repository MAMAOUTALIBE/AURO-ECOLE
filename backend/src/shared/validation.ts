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

// Attribution marketing (provenance du prospect), transmise par les formulaires publics.
// Tous les champs sont optionnels : un formulaire sans UTM reste parfaitement valide.
export const attributionSchema = z.object({
  utmSource: z.string().trim().max(200).optional(),
  utmMedium: z.string().trim().max(200).optional(),
  utmCampaign: z.string().trim().max(200).optional(),
  referrer: z.string().trim().max(500).optional(),
  landingPage: z.string().trim().max(300).optional()
});
export type AttributionInput = z.infer<typeof attributionSchema>;

/** Ne retient que les champs d'attribution renseignés (évite d'écrire des `undefined`). */
export function pickAttribution(input: Partial<AttributionInput>): AttributionInput {
  const out: AttributionInput = {};
  if (input.utmSource) out.utmSource = input.utmSource;
  if (input.utmMedium) out.utmMedium = input.utmMedium;
  if (input.utmCampaign) out.utmCampaign = input.utmCampaign;
  if (input.referrer) out.referrer = input.referrer;
  if (input.landingPage) out.landingPage = input.landingPage;
  return out;
}
