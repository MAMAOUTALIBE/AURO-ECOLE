import { z } from "zod";

/**
 * Numéro de téléphone français (mobile ou fixe), tolérant aux espaces, points,
 * tirets et à l'indicatif international : 06 12 34 56 78, +33 6 12 34 56 78, 0033...
 */
export const phoneSchema = z
  .string()
  .trim()
  .min(1, "Indique ton numéro de téléphone")
  .refine((value) => /^(?:\+33|0033|0)[1-9]\d{8}$/.test(value.replace(/[\s.\-()]/g, "")), {
    message: "Numéro invalide (ex : 06 12 34 56 78)"
  });

/** Props communes à appliquer sur tous les <input> de téléphone. */
export const phoneInputProps = {
  type: "tel" as const,
  inputMode: "tel" as const,
  autoComplete: "tel" as const,
  placeholder: "06 12 34 56 78"
};
