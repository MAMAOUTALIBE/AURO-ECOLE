import { Router } from "express";
import { z } from "zod";
import type { ApiConfig } from "../../config/env";
import type { AiProvider } from "../../ai/types";
import type { AuthenticatedRequest } from "../../http/request-context";
import { qualifyLead } from "../../ai/qualify";
import { runAutomations } from "../../automations/engine";
import { authenticate, requirePermission, resolveScopedAgencyId } from "../../middleware/auth";
import type { LodenRepository } from "../../repositories/loden-repository";
import { asyncHandler } from "../../shared/async-handler";
import { conflict, notFound } from "../../shared/http-error";
import { notifyNewLead } from "../../shared/mailer";
import { attributePartnerOnConversion } from "../partners/attribution";
import { generateTempPassword } from "../../shared/password";
import { emailSchema, phoneSchema, validateBody, validateQuery } from "../../shared/validation";
import bcrypt from "bcryptjs";

const leadStatusSchema = z.enum(["PROSPECT", "CONTACTE", "RELANCE", "DEVIS_ENVOYE", "INSCRIT", "PERDU"]);

const leadQuerySchema = z.object({
  status: leadStatusSchema.optional(),
  agencyId: z.string().trim().optional()
});

const leadCreateSchema = z.object({
  fullName: z.string().trim().min(2),
  email: emailSchema,
  phone: phoneSchema,
  status: leadStatusSchema.default("PROSPECT"),
  source: z.string().trim().optional(),
  utmSource: z.string().trim().max(200).optional(),
  utmMedium: z.string().trim().max(200).optional(),
  utmCampaign: z.string().trim().max(200).optional(),
  referrer: z.string().trim().max(500).optional(),
  landingPage: z.string().trim().max(300).optional(),
  interest: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  estimatedValueCents: z.number().int().nonnegative().optional(),
  nextFollowUpAt: z.coerce.date().optional()
});

const leadStatusUpdateSchema = z.object({
  status: leadStatusSchema,
  notes: z.string().trim().optional(),
  nextFollowUpAt: z.coerce.date().optional()
});

export function createLeadsRouter(repository: LodenRepository, config: ApiConfig, aiProvider?: AiProvider) {
  const router = Router();

  router.use(authenticate(repository, config.JWT_SECRET), requirePermission("leads.read"));

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const query = validateQuery(leadQuerySchema, req);
      const agencyId = await resolveScopedAgencyId(repository, req as AuthenticatedRequest, query.agencyId);
      res.json({ data: await repository.listLeads({ ...query, agencyId }) });
    })
  );

  router.post(
    "/",
    requirePermission("leads.manage"),
    asyncHandler(async (req, res) => {
      const body = validateBody(leadCreateSchema, req);
      const lead = await repository.createLead(body);
      void notifyNewLead(config, lead);
      void qualifyLead(aiProvider, repository, lead);
      void runAutomations(repository, config, "LEAD_CREATED", { entityType: "Lead", entityId: lead.id, email: lead.email, name: lead.fullName });
      res.status(201).json({ data: lead });
    })
  );

  router.patch(
    "/:id/status",
    requirePermission("leads.manage"),
    asyncHandler(async (req, res) => {
      const body = validateBody(leadStatusUpdateSchema, req);
      const lead = await repository.updateLead(String(req.params.id), body);
      void repository.createAuditLog({
        userId: (req as AuthenticatedRequest).user?.id ?? null,
        action: "lead.status",
        entityType: "Lead",
        entityId: lead.id,
        metadata: { status: body.status }
      });
      res.json({ data: lead });
    })
  );

  // Convertit une demande d'inscription (Lead) en compte élève : crée le User (rôle ELEVE)
  // + le Student, génère un mot de passe temporaire (renvoyé UNE fois), et passe le lead
  // en statut INSCRIT. C'est l'action "Créer le compte élève" du pipeline.
  router.post(
    "/:id/convert-to-student",
    requirePermission("students.manage"),
    asyncHandler(async (req, res) => {
      const lead = await repository.findLeadById(String(req.params.id));
      if (!lead) throw notFound("Demande d'inscription introuvable");

      const existing = await repository.findUserByEmail(lead.email);
      if (existing) throw conflict("Un compte existe déjà avec cet email");

      const nameParts = lead.fullName.trim().split(/\s+/);
      const firstName = lead.firstName?.trim() || nameParts[0] || "Élève";
      const lastName = lead.lastName?.trim() || nameParts.slice(1).join(" ") || "LODENE";

      const temporaryPassword = generateTempPassword();
      const passwordHash = await bcrypt.hash(temporaryPassword, 12);

      const user = await repository.createUser({
        firstName,
        lastName,
        email: lead.email,
        phone: lead.phone ?? undefined,
        role: "ELEVE",
        status: "ACTIVE",
        passwordHash
      });
      const student = await repository.createStudent({ userId: user.id });
      const updatedLead = await repository.updateLead(lead.id, { status: "INSCRIT" });

      // Attribution partenaire : rattache l'élève + génère la commission ESTIMEE le cas échéant.
      await attributePartnerOnConversion(repository, lead, student);

      void repository.createAuditLog({
        userId: (req as AuthenticatedRequest).user?.id ?? null,
        action: "lead.convert_to_student",
        entityType: "Lead",
        entityId: lead.id,
        metadata: { studentId: student.id, userId: user.id }
      });

      res.status(201).json({
        data: {
          email: user.email,
          temporaryPassword,
          studentId: student.id,
          lead: updatedLead
        }
      });
    })
  );

  return router;
}
