import { existsSync, mkdirSync, unlink } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import type { ApiConfig } from "../../config/env";
import { authenticate, requirePermission } from "../../middleware/auth";
import type { AuthenticatedRequest } from "../../http/request-context";
import type { LodenRepository } from "../../repositories/loden-repository";
import { recordAudit } from "../../shared/audit";
import { asyncHandler } from "../../shared/async-handler";
import { HttpError } from "../../shared/http-error";
import { validateBody } from "../../shared/validation";

// Dossier de stockage : public/uploads (servi par Next à l'URL /uploads/...).
// Surchargé en prod via UPLOAD_DIR si le cwd du process diffère de la racine repo.
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "public", "uploads");

// SVG volontairement exclu : un SVG peut embarquer du JS (<script>, onload) → vecteur XSS
// s'il est servi en ligne. À réintroduire seulement avec une sanitisation (svg-sanitizer).
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf"
]);

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "application/pdf": ".pdf"
};

const updateSchema = z.object({
  altText: z.string().trim().max(200).optional(),
  category: z.string().trim().max(60).nullable().optional()
});

export function createMediaRouter(repository: LodenRepository, config: ApiConfig) {
  const router = Router();
  if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
      const ext = EXT_BY_MIME[file.mimetype] ?? path.extname(file.originalname).toLowerCase() ?? "";
      cb(null, `${randomUUID()}${ext}`);
    }
  });

  const upload = multer({
    storage,
    limits: { fileSize: 8 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (ALLOWED_MIME.has(file.mimetype)) return cb(null, true);
      cb(new HttpError(400, "Format de fichier non autorisé (image ou PDF uniquement).", "UNSUPPORTED_MEDIA_TYPE"));
    }
  });

  const canRead = [authenticate(repository, config.JWT_SECRET), requirePermission("media.read", "media.manage")];
  const canManage = [authenticate(repository, config.JWT_SECRET), requirePermission("media.manage")];

  // Liste (admin) — filtrable par catégorie.
  router.get(
    "/",
    ...canRead,
    asyncHandler(async (req, res) => {
      const category = typeof req.query.category === "string" ? req.query.category : undefined;
      res.json({ data: await repository.listMedia(category ? { category } : undefined) });
    })
  );

  // Upload d'un fichier.
  router.post(
    "/upload",
    ...canManage,
    upload.single("file"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const file = req.file;
      if (!file) throw new HttpError(400, "Aucun fichier reçu.", "NO_FILE");
      const media = await repository.createMedia({
        filename: file.filename,
        originalName: file.originalname,
        url: `/uploads/${file.filename}`,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        altText: typeof req.body?.altText === "string" ? req.body.altText : "",
        category: typeof req.body?.category === "string" && req.body.category ? req.body.category : null,
        createdById: req.user?.id ?? null
      });
      recordAudit(repository, { userId: req.user?.id ?? null, action: "media.upload", entityType: "Media", entityId: media.id });
      res.status(201).json({ data: media });
    })
  );

  // Mise à jour des métadonnées (alt text, catégorie).
  router.patch(
    "/:id",
    ...canManage,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const body = validateBody(updateSchema, req);
      const media = await repository.updateMedia(String(req.params.id), body);
      recordAudit(repository, { userId: req.user?.id ?? null, action: "media.update", entityType: "Media", entityId: media.id });
      res.json({ data: media });
    })
  );

  // Suppression (DB + fichier disque, best-effort).
  router.delete(
    "/:id",
    ...canManage,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const removed = await repository.deleteMedia(String(req.params.id));
      if (removed) {
        unlink(path.join(UPLOAD_DIR, removed.filename), () => undefined);
        recordAudit(repository, { userId: req.user?.id ?? null, action: "media.delete", entityType: "Media", entityId: removed.id });
      }
      res.status(204).end();
    })
  );

  return router;
}
