import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { runAgent } from "../../ai/agent";
import { buildKnowledgeBlock } from "../../ai/knowledge";
import { sanitizeAiOutput } from "../../ai/safety";
import { buildPublicFallbackReply } from "../../ai/public-fallback";
import { crmTools, publicAgentTools } from "../../ai/tools";
import { listAppointmentSlots } from "../chat/chat-booking";
import type { AiMessage, AiProvider } from "../../ai/types";
import {
  LEAD_SCORE_SYSTEM,
  SUMMARIZE_SYSTEM,
  buildContentSystem,
  buildCrmAgentSystemPrompt,
  buildPublicAgentSystemPrompt
} from "../../ai/prompts";
import type { ApiConfig } from "../../config/env";
import { hasPermission } from "../../domain/permissions";
import type { AuthenticatedRequest } from "../../http/request-context";
import { authenticate, requirePermission } from "../../middleware/auth";
import type { LodenRepository } from "../../repositories/loden-repository";
import { asyncHandler } from "../../shared/async-handler";
import { validateBody } from "../../shared/validation";

// Numéro de repli si CompanyInfo.phone est vide (l'IA renvoie alors vers la page Contact).
const CONTACT_PHONE = "";

// Contexte « coordonnées » fourni à l'agent IA, dérivé du singleton CompanyInfo (CMS).
function buildCompanyContext(info: {
  brandName: string;
  address: string;
  postalCode: string;
  city: string;
  phone: string;
  email: string;
  hours: string;
}) {
  const address = [info.address, [info.postalCode, info.city].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  return {
    brandName: info.brandName || undefined,
    address: address || undefined,
    phone: info.phone || undefined,
    email: info.email || undefined,
    hours: info.hours || undefined
  };
}

const chatSchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(2000) }))
    .min(1)
    .max(12)
});

const summarizeSchema = z.object({ text: z.string().trim().min(5).max(5000) });

const leadScoreSchema = z.object({
  fullName: z.string().trim().max(120).optional(),
  email: z.string().trim().max(160).optional(),
  interest: z.string().trim().max(200).optional(),
  source: z.string().trim().max(120).optional(),
  message: z.string().trim().max(2000).optional()
});

const contentSchema = z.object({
  kind: z.enum(["faq", "formation", "article", "email"]),
  prompt: z.string().trim().min(3).max(1000)
});

function aiUnavailable(res: import("express").Response) {
  res.status(503).json({
    error: {
      code: "AI_UNAVAILABLE",
      message: CONTACT_PHONE
        ? `L'assistant IA n'est pas disponible pour le moment. Vous pouvez joindre un conseiller au ${CONTACT_PHONE}.`
        : "L'assistant IA n'est pas disponible pour le moment. Vous pouvez nous contacter via la page Contact du site."
    }
  });
}

export function createAiRouter(repository: LodenRepository, config: ApiConfig, ai: AiProvider) {
  const router = Router();

  // Limite dédiée (l'IA coûte cher) — plus stricte que la limite globale.
  router.use(
    rateLimit({
      windowMs: 60_000,
      max: config.NODE_ENV === "test" ? 1000 : 20,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: { code: "RATE_LIMITED", message: "Trop de requêtes. Réessayez dans un instant." } }
    })
  );

  async function run(res: import("express").Response, messages: { role: "system" | "user" | "assistant"; content: string }[], options?: { temperature?: number; maxTokens?: number }) {
    if (!ai.available) {
      aiUnavailable(res);
      return null;
    }
    try {
      return sanitizeAiOutput(await ai.complete(messages, options), config);
    } catch (error) {
      console.error("[ai] échec:", error instanceof Error ? error.message : error);
      aiUnavailable(res);
      return null;
    }
  }

  // --- Public : chatbot du site (agent à outils) ---
  router.post(
    "/chat",
    asyncHandler(async (req, res) => {
      const body = validateBody(chatSchema, req);
      const [formations, pricingPlans, agencies, companyInfo] = await Promise.all([
        repository.listFormations(),
        repository.listPricingPlans(),
        repository.listAgencies(),
        repository.getCompanyInfo()
      ]);
      const company = buildCompanyContext(companyInfo);
      // Base de connaissance : on injecte les extraits pertinents au dernier message utilisateur.
      const lastUserMessage = [...body.messages].reverse().find((m) => m.role === "user")?.content ?? "";
      const knowledge = buildKnowledgeBlock(lastUserMessage, 2);
      if (!ai.available) {
        res.json({
          data: {
            reply: buildPublicFallbackReply({
              messages: body.messages,
              formations,
              pricingPlans,
              agencies,
              company: companyInfo,
              contactPhone: company.phone ?? CONTACT_PHONE
            }),
            mode: "fallback"
          }
        });
        return;
      }
      const availableSlots = await listAppointmentSlots(repository);
      const systemPrompt = buildPublicAgentSystemPrompt({
        formations,
        pricingPlans,
        agencies,
        contactPhone: company.phone ?? CONTACT_PHONE,
        company,
        knowledge,
        availableSlots
      });
      const userMessages: AiMessage[] = body.messages.map((m) =>
        m.role === "assistant" ? { role: "assistant", content: m.content } : { role: "user", content: m.content }
      );
      try {
        const reply = await runAgent(ai, {
          systemPrompt,
          userMessages,
          tools: publicAgentTools,
          context: { repository, config, scope: "public", aiProvider: ai },
          maxSteps: 3
        });
        res.json({ data: { reply } });
      } catch (error) {
        console.error("[ai] chat échec:", error instanceof Error ? error.message : error);
        res.json({
          data: {
            reply: buildPublicFallbackReply({
              messages: body.messages,
              formations,
              pricingPlans,
              agencies,
              company: companyInfo,
              contactPhone: company.phone ?? CONTACT_PHONE
            }),
            mode: "fallback"
          }
        });
      }
    })
  );

  // --- CRM : agent interne authentifié (actions réelles, RBAC par rôle) ---
  router.post(
    "/agent",
    authenticate(repository, config.JWT_SECRET),
    requirePermission("dashboard.read"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const body = validateBody(chatSchema, req);
      const user = req.user!;
      if (!ai.available) {
        aiUnavailable(res);
        return;
      }
      const [formations, pricingPlans, agencies, companyInfo] = await Promise.all([
        repository.listFormations(),
        repository.listPricingPlans(),
        repository.listAgencies(),
        repository.getCompanyInfo()
      ]);
      const company = buildCompanyContext(companyInfo);
      const lastUserMessage = [...body.messages].reverse().find((m) => m.role === "user")?.content ?? "";
      const knowledge = buildKnowledgeBlock(lastUserMessage, 2);
      // RBAC : on n'expose que les outils autorisés par le rôle de l'utilisateur.
      const allowedTools = crmTools.filter((tool) => !tool.permission || hasPermission(user.role, tool.permission));
      const systemPrompt = buildCrmAgentSystemPrompt({
        formations,
        pricingPlans,
        agencies,
        contactPhone: company.phone ?? CONTACT_PHONE,
        role: user.role,
        company,
        knowledge
      });
      const userMessages: AiMessage[] = body.messages.map((m) =>
        m.role === "assistant" ? { role: "assistant", content: m.content } : { role: "user", content: m.content }
      );
      try {
        const reply = await runAgent(ai, {
          systemPrompt,
          userMessages,
          tools: allowedTools,
          context: { repository, config, scope: "crm", actorUserId: user.id, aiProvider: ai }
        });
        res.json({ data: { reply, tools: allowedTools.map((t) => t.def.function.name) } });
      } catch (error) {
        console.error("[ai] agent CRM échec:", error instanceof Error ? error.message : error);
        aiUnavailable(res);
      }
    })
  );

  // --- CRM : résumé d'une demande ---
  router.post(
    "/summarize",
    authenticate(repository, config.JWT_SECRET),
    requirePermission("dashboard.read"),
    asyncHandler(async (req, res) => {
      const body = validateBody(summarizeSchema, req);
      const reply = await run(res, [
        { role: "system", content: SUMMARIZE_SYSTEM },
        { role: "user", content: body.text }
      ], { temperature: 0.2, maxTokens: 300 });
      if (reply === null) return;
      res.json({ data: { summary: reply } });
    })
  );

  // --- CRM : qualification prospect (chaud/tiède/froid) ---
  router.post(
    "/lead-score",
    authenticate(repository, config.JWT_SECRET),
    requirePermission("dashboard.read"),
    asyncHandler(async (req, res) => {
      const body = validateBody(leadScoreSchema, req);
      const description = [
        body.fullName ? `Nom: ${body.fullName}` : null,
        body.email ? `Email: ${body.email}` : null,
        body.interest ? `Intérêt: ${body.interest}` : null,
        body.source ? `Source: ${body.source}` : null,
        body.message ? `Message: ${body.message}` : null
      ]
        .filter(Boolean)
        .join("\n");
      const reply = await run(res, [
        { role: "system", content: LEAD_SCORE_SYSTEM },
        { role: "user", content: description || "Aucune information." }
      ], { temperature: 0.1, maxTokens: 200 });
      if (reply === null) return;
      let parsed: unknown;
      try {
        parsed = JSON.parse(reply.replace(/```json|```/g, "").trim());
      } catch {
        parsed = { temperature: "tiede", score: 50, raison: reply.slice(0, 200), prochaineAction: "Recontacter le prospect" };
      }
      res.json({ data: parsed });
    })
  );

  // --- CRM : génération de contenu ---
  router.post(
    "/content-generator",
    authenticate(repository, config.JWT_SECRET),
    requirePermission("content.manage"),
    asyncHandler(async (req, res) => {
      const body = validateBody(contentSchema, req);
      const reply = await run(res, [
        { role: "system", content: buildContentSystem(body.kind) },
        { role: "user", content: body.prompt }
      ], { temperature: 0.7, maxTokens: 700 });
      if (reply === null) return;
      res.json({ data: { content: reply } });
    })
  );

  return router;
}
