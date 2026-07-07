import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { ApiConfig } from "../../config/env";
import type { AiProvider } from "../../ai/types";
import type { AuthenticatedRequest } from "../../http/request-context";
import { publicUser } from "../../http/request-context";
import { qualifyLead } from "../../ai/qualify";
import { runAutomations } from "../../automations/engine";
import {
  assertAgencyAccess,
  authenticate,
  requirePermission,
  requireRoles,
  resolveScopedAgencyId
} from "../../middleware/auth";
import type { LodenRepository } from "../../repositories/loden-repository";
import type { PartnerRecord } from "../../domain/types";
import { asyncHandler } from "../../shared/async-handler";
import { conflict, notFound } from "../../shared/http-error";
import { notifyNewLead } from "../../shared/mailer";
import { generateTempPassword } from "../../shared/password";
import { emailSchema, phoneSchema, validateBody, validateQuery } from "../../shared/validation";

// Module « Partenaires prescripteurs » : gestion CRM des apporteurs d'affaires (création
// du compte, barème de commission, suivi) + espace partenaire self-service (/me/*) où le
// prescripteur recommande des candidats et suit ses commissions. Les leads apportés portent
// `partnerId` (attribution) ; la conversion en inscription génère une commission (voir L4).

const partnerStatusSchema = z.enum(["ACTIF", "SUSPENDU"]);
const commissionTypeSchema = z.enum(["FLAT", "PERCENT"]);
const commissionStatusSchema = z.enum(["ESTIMEE", "VALIDEE", "PAYEE", "ANNULEE"]);

const listQuerySchema = z.object({
  status: partnerStatusSchema.optional(),
  agencyId: z.string().trim().optional()
});

const partnerCreateSchema = z.object({
  companyName: z.string().trim().min(2),
  contactName: z.string().trim().optional(),
  email: emailSchema,
  phone: phoneSchema,
  commissionType: commissionTypeSchema.default("FLAT"),
  commissionValue: z.number().int().nonnegative().default(0),
  notes: z.string().trim().optional(),
  publicVisible: z.boolean().optional(),
  logoUrl: z.string().trim().max(1000).optional(),
  websiteUrl: z.string().trim().max(500).optional(),
  agencyId: z.string().trim().optional(),
  // Provisionne un compte de connexion (rôle PARTENAIRE) : mot de passe temporaire renvoyé UNE fois.
  createAccount: z.boolean().default(true)
});

const partnerUpdateSchema = z.object({
  companyName: z.string().trim().min(2).optional(),
  contactName: z.string().trim().nullable().optional(),
  email: emailSchema.optional(),
  phone: z.string().trim().min(8).max(30).nullable().optional(),
  status: partnerStatusSchema.optional(),
  commissionType: commissionTypeSchema.optional(),
  commissionValue: z.number().int().nonnegative().optional(),
  notes: z.string().trim().nullable().optional(),
  publicVisible: z.boolean().optional(),
  logoUrl: z.string().trim().max(1000).nullable().optional(),
  websiteUrl: z.string().trim().max(500).nullable().optional(),
  agencyId: z.string().trim().nullable().optional()
});

// Formulaire « recommander un candidat » du portail partenaire.
const leadSubmitSchema = z.object({
  fullName: z.string().trim().min(2),
  email: emailSchema,
  phone: phoneSchema,
  interest: z.string().trim().optional(),
  notes: z.string().trim().optional()
});

const commissionCreateSchema = z.object({
  amount: z.number().int(),
  leadId: z.string().trim().optional(),
  studentId: z.string().trim().optional(),
  note: z.string().trim().optional(),
  status: commissionStatusSchema.optional()
});

const commissionUpdateSchema = z.object({
  status: commissionStatusSchema.optional(),
  amount: z.number().int().optional(),
  note: z.string().trim().nullable().optional()
});

export function createPartnersRouter(repository: LodenRepository, config: ApiConfig, aiProvider?: AiProvider) {
  const router = Router();

  // ── Vitrine publique (AUCUNE auth) — déclarée AVANT le middleware d'authentification.
  // N'expose que les champs publics des partenaires opt-in actifs (jamais email/tél/commission).
  router.get(
    "/public",
    asyncHandler(async (_req, res) => {
      const partners = await repository.listPartners({ publicVisible: true, status: "ACTIF" });
      res.json({
        data: partners.map((partner) => ({
          id: partner.id,
          companyName: partner.companyName,
          logoUrl: partner.logoUrl ?? null,
          websiteUrl: partner.websiteUrl ?? null
        }))
      });
    })
  );

  router.use(authenticate(repository, config.JWT_SECRET));

  // Résout le partenaire du compte connecté (scoping strict des routes /me/* — anti-IDOR).
  async function currentPartner(req: AuthenticatedRequest): Promise<PartnerRecord> {
    const userId = req.user?.id;
    const partner = userId ? await repository.findPartnerByUserId(userId) : null;
    if (!partner) throw notFound("Profil partenaire introuvable");
    return partner;
  }

  // ── Espace partenaire (self-service, rôle PARTENAIRE) ──────────────────────
  router.get(
    "/me",
    requireRoles("PARTENAIRE"),
    asyncHandler(async (req, res) => {
      const partner = await currentPartner(req as AuthenticatedRequest);
      res.json({ data: partner });
    })
  );

  router.get(
    "/me/leads",
    requireRoles("PARTENAIRE"),
    asyncHandler(async (req, res) => {
      const partner = await currentPartner(req as AuthenticatedRequest);
      res.json({ data: await repository.listLeads({ partnerId: partner.id }) });
    })
  );

  router.post(
    "/me/leads",
    requireRoles("PARTENAIRE"),
    asyncHandler(async (req, res) => {
      const partner = await currentPartner(req as AuthenticatedRequest);
      if (partner.status !== "ACTIF") throw conflict("Compte partenaire suspendu");
      const body = validateBody(leadSubmitSchema, req);
      const lead = await repository.createLead({
        fullName: body.fullName,
        email: body.email,
        phone: body.phone,
        interest: body.interest,
        notes: body.notes,
        source: "partner",
        partnerId: partner.id,
        agencyId: partner.agencyId ?? undefined
      });
      void notifyNewLead(config, lead);
      void qualifyLead(aiProvider, repository, lead);
      void runAutomations(repository, config, "LEAD_CREATED", {
        entityType: "Lead",
        entityId: lead.id,
        email: lead.email,
        name: lead.fullName
      });
      res.status(201).json({ data: lead });
    })
  );

  router.get(
    "/me/commissions",
    requireRoles("PARTENAIRE"),
    asyncHandler(async (req, res) => {
      const partner = await currentPartner(req as AuthenticatedRequest);
      res.json({ data: await repository.listPartnerCommissions({ partnerId: partner.id }) });
    })
  );

  // Apprenants issus des conversions du partenaire : identité minimale + avancement,
  // JAMAIS de coordonnées (email/téléphone) — périmètre prescripteur restreint.
  router.get(
    "/me/students",
    requireRoles("PARTENAIRE"),
    asyncHandler(async (req, res) => {
      const partner = await currentPartner(req as AuthenticatedRequest);
      const students = await repository.listStudents({ partnerId: partner.id });
      const data = await Promise.all(
        students.map(async (student) => {
          const user = await repository.findUserById(student.userId);
          return {
            id: student.id,
            firstName: user?.firstName ?? null,
            lastName: user?.lastName ?? null,
            progressPercent: student.progressPercent,
            fileStatus: student.fileStatus,
            registeredAt: student.registeredAt
          };
        })
      );
      res.json({ data });
    })
  );

  // ── Gestion CRM (permissions partners.read / partners.manage) ──────────────
  router.get(
    "/",
    requirePermission("partners.read"),
    asyncHandler(async (req, res) => {
      const query = validateQuery(listQuerySchema, req);
      const agencyId = await resolveScopedAgencyId(repository, req as AuthenticatedRequest, query.agencyId);
      const partners = await repository.listPartners({ status: query.status, agencyId });
      const data = await Promise.all(
        partners.map(async (partner) => {
          const user = partner.userId ? await repository.findUserById(partner.userId) : null;
          return { ...partner, user: user ? publicUser(user) : null };
        })
      );
      res.json({ data });
    })
  );

  router.post(
    "/",
    requirePermission("partners.manage"),
    asyncHandler(async (req, res) => {
      const body = validateBody(partnerCreateSchema, req);
      let userId: string | undefined;
      let temporaryPassword: string | undefined;
      if (body.createAccount) {
        const existing = await repository.findUserByEmail(body.email);
        if (existing) throw conflict("Un compte existe déjà avec cet email");
        const nameParts = (body.contactName ?? "").trim().split(/\s+/).filter(Boolean);
        const firstName = nameParts[0] || "Partenaire";
        const lastName = nameParts.slice(1).join(" ") || body.companyName;
        temporaryPassword = generateTempPassword();
        const passwordHash = await bcrypt.hash(temporaryPassword, 12);
        const user = await repository.createUser({
          firstName,
          lastName,
          email: body.email,
          phone: body.phone,
          role: "PARTENAIRE",
          status: "ACTIVE",
          passwordHash
        });
        userId = user.id;
      }
      const partner = await repository.createPartner({
        userId,
        companyName: body.companyName,
        contactName: body.contactName,
        email: body.email,
        phone: body.phone,
        commissionType: body.commissionType,
        commissionValue: body.commissionValue,
        notes: body.notes,
        publicVisible: body.publicVisible,
        logoUrl: body.logoUrl,
        websiteUrl: body.websiteUrl,
        agencyId: body.agencyId
      });
      void repository.createAuditLog({
        userId: (req as AuthenticatedRequest).user?.id ?? null,
        action: "partner.create",
        entityType: "Partner",
        entityId: partner.id
      });
      // temporaryPassword n'est renvoyé qu'ici (jamais journalisé).
      res.status(201).json({ data: { ...partner, temporaryPassword } });
    })
  );

  router.get(
    "/:id",
    requirePermission("partners.read"),
    asyncHandler(async (req, res) => {
      const partner = await repository.findPartnerById(String(req.params.id));
      if (!partner) throw notFound("Partenaire introuvable");
      await assertAgencyAccess(repository, req as AuthenticatedRequest, partner.agencyId);
      const user = partner.userId ? await repository.findUserById(partner.userId) : null;
      const commissions = await repository.listPartnerCommissions({ partnerId: partner.id });
      const leads = await repository.listLeads({ partnerId: partner.id });
      res.json({ data: { ...partner, user: user ? publicUser(user) : null, commissions, leads } });
    })
  );

  router.patch(
    "/:id",
    requirePermission("partners.manage"),
    asyncHandler(async (req, res) => {
      const id = String(req.params.id);
      const existing = await repository.findPartnerById(id);
      if (!existing) throw notFound("Partenaire introuvable");
      await assertAgencyAccess(repository, req as AuthenticatedRequest, existing.agencyId);
      const body = validateBody(partnerUpdateSchema, req);
      const partner = await repository.updatePartner(id, body);
      // Répercute email/téléphone sur le compte de connexion s'il existe.
      if (existing.userId && (body.email !== undefined || body.phone !== undefined)) {
        await repository.updateUser(existing.userId, {
          ...(body.email !== undefined ? { email: body.email } : {}),
          ...(body.phone !== undefined ? { phone: body.phone ?? undefined } : {})
        });
      }
      res.json({ data: partner });
    })
  );

  router.post(
    "/:id/reset-password",
    requirePermission("partners.manage"),
    asyncHandler(async (req, res) => {
      const partner = await repository.findPartnerById(String(req.params.id));
      if (!partner) throw notFound("Partenaire introuvable");
      await assertAgencyAccess(repository, req as AuthenticatedRequest, partner.agencyId);
      if (!partner.userId) throw conflict("Ce partenaire n'a pas de compte de connexion");
      const user = await repository.findUserById(partner.userId);
      if (!user) throw notFound("Compte introuvable");
      const tempPassword = generateTempPassword();
      const passwordHash = await bcrypt.hash(tempPassword, 12);
      await repository.updateUser(user.id, { passwordHash });
      void repository.createAuditLog({
        userId: (req as AuthenticatedRequest).user?.id ?? null,
        action: "partner.reset_password",
        entityType: "Partner",
        entityId: partner.id
      });
      res.json({ data: { tempPassword, email: user.email } });
    })
  );

  router.get(
    "/:id/commissions",
    requirePermission("partners.read"),
    asyncHandler(async (req, res) => {
      const partner = await repository.findPartnerById(String(req.params.id));
      if (!partner) throw notFound("Partenaire introuvable");
      await assertAgencyAccess(repository, req as AuthenticatedRequest, partner.agencyId);
      res.json({ data: await repository.listPartnerCommissions({ partnerId: partner.id }) });
    })
  );

  router.post(
    "/:id/commissions",
    requirePermission("partners.manage"),
    asyncHandler(async (req, res) => {
      const partner = await repository.findPartnerById(String(req.params.id));
      if (!partner) throw notFound("Partenaire introuvable");
      await assertAgencyAccess(repository, req as AuthenticatedRequest, partner.agencyId);
      const body = validateBody(commissionCreateSchema, req);
      const commission = await repository.createCommission({ partnerId: partner.id, ...body });
      void repository.createAuditLog({
        userId: (req as AuthenticatedRequest).user?.id ?? null,
        action: "partner.commission_create",
        entityType: "PartnerCommission",
        entityId: commission.id,
        metadata: { partnerId: partner.id, amount: commission.amount }
      });
      res.status(201).json({ data: commission });
    })
  );

  router.patch(
    "/:id/commissions/:cid",
    requirePermission("partners.manage"),
    asyncHandler(async (req, res) => {
      const partner = await repository.findPartnerById(String(req.params.id));
      if (!partner) throw notFound("Partenaire introuvable");
      await assertAgencyAccess(repository, req as AuthenticatedRequest, partner.agencyId);
      const commission = await repository.findCommissionById(String(req.params.cid));
      if (!commission || commission.partnerId !== partner.id) throw notFound("Commission introuvable");
      const body = validateBody(commissionUpdateSchema, req);
      const updated = await repository.updateCommission(commission.id, body);
      void repository.createAuditLog({
        userId: (req as AuthenticatedRequest).user?.id ?? null,
        action: "partner.commission_update",
        entityType: "PartnerCommission",
        entityId: commission.id,
        metadata: { status: body.status ?? commission.status }
      });
      res.json({ data: updated });
    })
  );

  return router;
}
