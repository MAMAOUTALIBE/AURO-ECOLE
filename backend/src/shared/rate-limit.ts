import rateLimit from "express-rate-limit";
import type { ApiConfig } from "../config/env";

/**
 * Limiteur pour les soumissions de formulaires PUBLICS (contact, CPF) :
 * protège contre le spam et l'énumération. 20 req/min/IP en prod (large en test/CI).
 * S'ajoute au rate-limit global (120/min) et aux limiteurs sensibles des routes auth.
 */
export function publicFormLimiter(config: ApiConfig) {
  return rateLimit({
    windowMs: 60_000,
    max: config.NODE_ENV === "test" ? 10_000 : 20,
    standardHeaders: true,
    legacyHeaders: false
  });
}
