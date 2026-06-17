import { Router } from "express";
import { z } from "zod";
import type { ApiConfig } from "../../config/env";
import { authenticate, requirePermission } from "../../middleware/auth";
import type { AuthenticatedRequest } from "../../http/request-context";
import type { LodenRepository } from "../../repositories/loden-repository";
import { recordAudit } from "../../shared/audit";
import { asyncHandler } from "../../shared/async-handler";
import { HttpError } from "../../shared/http-error";

// ---- Schémas de validation par clé de réglage ---------------------------------

const ctaSchema = z.object({
  label: z.string().trim().min(1).max(60),
  href: z.string().trim().min(1).max(200)
});

const navChildSchema = z.object({
  id: z.string().trim().min(1).max(60),
  label: z.string().trim().min(1).max(60),
  href: z.string().trim().min(1).max(200),
  active: z.boolean().default(true),
  icon: z.string().trim().max(40).optional()
});

const navItemSchema = navChildSchema.extend({
  children: z.array(navChildSchema).max(12).optional()
});

const navPrimarySchema = z.object({
  items: z.array(navItemSchema).max(30)
});

const navCtaSchema = navChildSchema.extend({
  variant: z.enum(["outline", "solid"]).optional()
});

const navCtasSchema = z.object({
  items: z.array(navCtaSchema).max(8)
});

const heroBadgeSchema = z.object({
  icon: z.string().trim().max(40).optional().default("ShieldCheck"),
  title: z.string().trim().min(1).max(40),
  detail: z.string().trim().max(80).optional().default("")
});

const heroHomeSchema = z.object({
  enabled: z.boolean().default(true),
  scriptLine: z.string().trim().max(80),
  connector: z.string().trim().max(40).optional().default(""),
  brand: z.string().trim().max(40),
  subtitle: z.string().trim().max(280),
  image: z.string().trim().max(300).optional().default(""),
  imageAlt: z.string().trim().max(200).optional().default(""),
  primaryCta: ctaSchema,
  secondaryCta: ctaSchema.optional(),
  badges: z.array(heroBadgeSchema).max(6).default([])
});

// Schéma générique pour les clés autorisées sans schéma dédié (phases ultérieures).
const genericSchema = z.record(z.string(), z.unknown());

const KEY_SCHEMAS: Record<string, z.ZodTypeAny> = {
  "nav.primary": navPrimarySchema,
  "nav.ctas": navCtasSchema,
  "hero.home": heroHomeSchema
};

// Liste blanche des clés pilotables depuis le CMS (évite l'écriture de clés arbitraires).
const ALLOWED_KEYS = new Set<string>([
  "nav.primary",
  "nav.ctas",
  "hero.home",
  "footer",
  "sections.home",
  "hours",
  "pole.VTC",
  "pole.SST",
  "pole.LOGISTIQUE_SECURITE"
]);

export function createSiteRouter(repository: LodenRepository, config: ApiConfig) {
  const router = Router();
  // Écriture réservée aux rôles habilités au contenu/site (backend = source de vérité).
  const adminOnly = [
    authenticate(repository, config.JWT_SECRET),
    requirePermission("settings.manage", "nav.manage", "content.manage")
  ];

  // Public : tous les réglages sous forme de map { clé: valeur } (consommé par le site).
  router.get(
    "/",
    asyncHandler(async (_req, res) => {
      const settings = await repository.listSiteSettings();
      const map: Record<string, unknown> = {};
      for (const setting of settings) map[setting.key] = setting.value;
      res.json({ data: map });
    })
  );

  // Admin : liste complète avec métadonnées (updatedAt). AVANT /:key.
  router.get(
    "/manage",
    ...adminOnly,
    asyncHandler(async (_req, res) => {
      res.json({ data: await repository.listSiteSettings() });
    })
  );

  // Public : une clé précise (le site applique son fallback si null).
  router.get(
    "/:key",
    asyncHandler(async (req, res) => {
      const setting = await repository.getSiteSetting(String(req.params.key));
      res.json({ data: setting });
    })
  );

  // Admin : enregistrer/écraser la valeur d'une clé (validée par son schéma).
  router.put(
    "/:key",
    ...adminOnly,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const key = String(req.params.key);
      if (!ALLOWED_KEYS.has(key)) {
        throw new HttpError(400, "Clé de réglage inconnue", "UNKNOWN_SETTING_KEY");
      }
      const schema = KEY_SCHEMAS[key] ?? genericSchema;
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        throw new HttpError(400, "Données invalides", "VALIDATION_ERROR", parsed.error.flatten());
      }
      const setting = await repository.upsertSiteSetting(key, parsed.data);
      recordAudit(repository, {
        userId: req.user?.id ?? null,
        action: "site_setting.update",
        entityType: "SiteSetting",
        entityId: key
      });
      res.json({ data: setting });
    })
  );

  // Admin : réinitialiser une clé (suppression → le site retombe sur sa valeur par défaut).
  router.delete(
    "/:key",
    ...adminOnly,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const key = String(req.params.key);
      await repository.deleteSiteSetting(key);
      recordAudit(repository, {
        userId: req.user?.id ?? null,
        action: "site_setting.reset",
        entityType: "SiteSetting",
        entityId: key
      });
      res.status(204).end();
    })
  );

  return router;
}
