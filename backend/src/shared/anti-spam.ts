import type { NextFunction, Request, Response } from "express";

// Champ « pot de miel » (honeypot) : invisible pour un humain, souvent rempli
// automatiquement par les bots de spam. Le formulaire l'envoie toujours vide.
export const HONEYPOT_FIELD = "website";

/**
 * Middleware anti-spam à poser sur les endpoints de formulaire public, APRÈS le
 * rate-limiter et AVANT la validation Zod. Si le champ honeypot est rempli, la
 * requête provient quasi certainement d'un bot : on la refuse (400 générique).
 *
 * La validation Zod des routes n'étant pas `.strict()`, le champ est de toute
 * façon retiré des données persistées — le guard sert uniquement au filtrage.
 */
export function honeypotGuard(req: Request, res: Response, next: NextFunction) {
  const body = req.body as Record<string, unknown> | undefined;
  const value = body?.[HONEYPOT_FIELD];
  if (typeof value === "string" && value.trim() !== "") {
    res.status(400).json({ error: { code: "SPAM_DETECTED", message: "Requête invalide." } });
    return;
  }
  next();
}
