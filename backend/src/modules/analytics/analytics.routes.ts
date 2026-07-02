import { Router } from "express";
import { z } from "zod";
import type { ApiConfig } from "../../config/env";
import type { AuthenticatedRequest } from "../../http/request-context";
import { authenticate, requirePermission, resolveScopedAgencyId } from "../../middleware/auth";
import type { LodenRepository } from "../../repositories/loden-repository";
import type { LeadRecord } from "../../domain/types";
import { asyncHandler } from "../../shared/async-handler";
import { validateQuery } from "../../shared/validation";
import { getMatomoTraffic, matomoConfigured, type NamedValue } from "./matomo";

// Tableau de bord « Statistiques & Trafic » du CRM.
//  - Attribution & conversions : calculées à partir des prospects (Lead) réellement générés
//    → fiable et disponible sans dépendance externe.
//  - Trafic (visiteurs, sources, appareils…) : interrogé auprès de Matomo si configuré,
//    sinon `traffic.configured=false` et le front n'affiche que le volet CRM.

const querySchema = z.object({
  agencyId: z.string().trim().optional(),
  days: z.coerce.number().int().min(1).max(365).optional()
});

function topCounts(values: Array<string | null | undefined>, limit = 8, fallback = "Direct / inconnu"): NamedValue[] {
  const counts = new Map<string, number>();
  for (const raw of values) {
    const name = raw && raw.trim() ? raw.trim() : fallback;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

/** Classe un prospect dans un canal marketing lisible (pour « conversions par canal »). */
function channelOf(lead: LeadRecord): string {
  const source = (lead.source ?? "").toLowerCase();
  if (source.startsWith("chatbot") || source.startsWith("assistant-ia")) return "Assistant IA / Chatbot";
  if (source === "inscription") return "Formulaire inscription";
  if (source.startsWith("offer") || source.includes("qr")) return "Offre QR -50 €";
  const medium = (lead.utmMedium ?? "").toLowerCase();
  if (medium.includes("cpc") || medium.includes("ppc") || medium.includes("paid")) return "Publicité payante";
  if (medium.includes("social")) return "Réseaux sociaux";
  if (medium.includes("email")) return "Emailing";
  if (lead.utmSource) return `Campagne : ${lead.utmSource}`;
  if (lead.referrer) {
    try {
      return `Référent : ${new URL(lead.referrer).hostname.replace(/^www\./, "")}`;
    } catch {
      return "Référent";
    }
  }
  return "Direct / naturel";
}

export function createAnalyticsRouter(repository: LodenRepository, config: ApiConfig) {
  const router = Router();
  router.use(authenticate(repository, config.JWT_SECRET), requirePermission("dashboard.read"));

  router.get(
    "/analytics",
    asyncHandler(async (req, res) => {
      const { agencyId: requested, days: requestedDays } = validateQuery(querySchema, req);
      const days = requestedDays ?? 30;
      const agencyId = await resolveScopedAgencyId(repository, req as AuthenticatedRequest, requested);
      const scope = agencyId ? { agencyId } : undefined;

      const now = new Date();
      const from = new Date(now.getTime() - days * 86_400_000);

      const [allLeads, appointments, traffic] = await Promise.all([
        repository.listLeads(scope),
        repository.listChatAppointments(scope ? { agencyId } : undefined),
        getMatomoTraffic(config, days)
      ]);

      const leads = allLeads.filter((lead) => new Date(lead.createdAt) >= from);
      const rdvInRange = appointments.filter((a) => new Date(a.requestedAt ?? a.startsAt ?? now) >= from);
      const inscrits = leads.filter((lead) => lead.status === "INSCRIT").length;

      // Tendance : prospects générés par jour sur la période.
      const perDay = new Map<string, number>();
      for (let i = days - 1; i >= 0; i -= 1) {
        const d = new Date(now.getTime() - i * 86_400_000);
        perDay.set(d.toISOString().slice(0, 10), 0);
      }
      for (const lead of leads) {
        const key = new Date(lead.createdAt).toISOString().slice(0, 10);
        if (perDay.has(key)) perDay.set(key, (perDay.get(key) ?? 0) + 1);
      }
      const leadsTrend = [...perDay.entries()].map(([date, value]) => ({ label: date.slice(5), leads: value }));

      res.json({
        data: {
          range: { days, from: from.toISOString(), to: now.toISOString() },
          attribution: {
            totalLeads: leads.length,
            inscrits,
            bySource: topCounts(leads.map((l) => l.source)),
            byChannel: topCounts(leads.map((l) => channelOf(l)), 8, "Direct / naturel"),
            byUtmSource: topCounts(
              leads.map((l) => l.utmSource).filter(Boolean),
              8,
              "—"
            ),
            byUtmCampaign: topCounts(
              leads.map((l) => l.utmCampaign).filter(Boolean),
              8,
              "—"
            ),
            byFormation: topCounts(leads.map((l) => l.interest), 8, "Non précisée"),
            topLandingPages: topCounts(
              leads.map((l) => l.landingPage).filter(Boolean),
              8,
              "—"
            ),
            leadsTrend
          },
          funnel: {
            leads: leads.length,
            rdv: rdvInRange.length,
            inscrits,
            leadToRdvRate: leads.length > 0 ? Math.round((rdvInRange.length / leads.length) * 100) : null,
            rdvToInscritRate: rdvInRange.length > 0 ? Math.round((inscrits / rdvInRange.length) * 100) : null
          },
          traffic,
          matomoConfigured: matomoConfigured(config)
        }
      });
    })
  );

  return router;
}
