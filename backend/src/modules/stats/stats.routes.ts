import { Router } from "express";
import { z } from "zod";
import type { ApiConfig } from "../../config/env";
import type { AuthenticatedRequest } from "../../http/request-context";
import { authenticate, requirePermission, resolveScopedAgencyId } from "../../middleware/auth";
import type { LodenRepository } from "../../repositories/loden-repository";
import { asyncHandler } from "../../shared/async-handler";
import { validateQuery } from "../../shared/validation";

const querySchema = z.object({ agencyId: z.string().trim().optional() });

function countBy<T>(items: T[], key: (item: T) => string) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const value = key(item);
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

export function createStatsRouter(repository: LodenRepository, config: ApiConfig) {
  const router = Router();
  router.use(authenticate(repository, config.JWT_SECRET), requirePermission("dashboard.read"));

  router.get(
    "/stats",
    asyncHandler(async (req, res) => {
      const { agencyId: requested } = validateQuery(querySchema, req);
      const agencyId = await resolveScopedAgencyId(repository, req as AuthenticatedRequest, requested);
      const scope = agencyId ? { agencyId } : undefined;

      const [students, leads, bookings, payments, cpfRequests, reviews, exams] = await Promise.all([
        repository.listStudents(scope),
        repository.listLeads(scope),
        repository.listBookings(scope),
        repository.listPayments(scope),
        repository.listCpfRequests(),
        repository.listReviews(true),
        repository.listExams(scope)
      ]);

      const now = new Date();
      const passed = exams.filter((exam) => exam.result === "REUSSI").length;
      const failed = exams.filter((exam) => exam.result === "ECHOUE").length;
      const decided = passed + failed;

      res.json({
        data: {
          students: {
            total: students.length,
            byStatus: countBy(students, (student) => student.fileStatus)
          },
          leads: {
            total: leads.length,
            byStage: countBy(leads, (lead) => lead.status)
          },
          bookings: {
            upcoming: bookings.filter((booking) => booking.status !== "ANNULEE" && booking.startsAt > now).length
          },
          payments: {
            paidCents: payments.filter((p) => p.status === "PAYE").reduce((sum, p) => sum + p.amountCents, 0),
            pending: payments.filter((p) => p.status === "EN_ATTENTE").length
          },
          cpf: {
            pending: cpfRequests.filter((request) => request.status !== "VALIDEE" && request.status !== "REFUSEE").length
          },
          reviews: {
            pending: reviews.filter((review) => review.status === "EN_ATTENTE").length
          },
          exams: {
            total: exams.length,
            upcoming: exams.filter((exam) => exam.result === "EN_ATTENTE" && exam.scheduledAt > now).length,
            passRate: decided > 0 ? Math.round((passed / decided) * 100) : null
          }
        }
      });
    })
  );

  // --- Copilote CRM : pilotage opérationnel (KPIs, file « à traiter », relances) ---
  router.get(
    "/cockpit",
    asyncHandler(async (req, res) => {
      const { agencyId: requested } = validateQuery(querySchema, req);
      const agencyId = await resolveScopedAgencyId(repository, req as AuthenticatedRequest, requested);
      const scope = agencyId ? { agencyId } : undefined;

      const [leads, appointments, tasks, conversations] = await Promise.all([
        repository.listLeads(scope),
        repository.listChatAppointments(scope ? { agencyId } : undefined),
        repository.listChatTasks(),
        repository.listChatConversations()
      ]);

      const now = new Date();
      const isToday = (d: Date | string | null | undefined) => {
        if (!d) return false;
        const x = new Date(d);
        return x.getFullYear() === now.getFullYear() && x.getMonth() === now.getMonth() && x.getDate() === now.getDate();
      };
      const daysSince = (d: Date | string | null | undefined) => (d ? Math.floor((now.getTime() - new Date(d).getTime()) / 86_400_000) : Infinity);
      const fullName = (l: { fullName?: string; firstName?: string | null; lastName?: string | null }) =>
        l.fullName || `${l.firstName ?? ""} ${l.lastName ?? ""}`.trim() || "Prospect";

      const PENDING = ["new", "pending_confirmation"];
      const rdvPending = appointments.filter((a) => PENDING.includes(a.status));
      const rdvToFollowUp = appointments.filter((a) => a.status === "to_follow_up");
      const openTasks = tasks.filter((t) => t.status === "A_FAIRE");
      const overdueTasks = openTasks.filter((t) => new Date(t.deadline).getTime() < now.getTime());
      const hotLeads = leads.filter((l) => l.temperature === "chaud" && l.status !== "INSCRIT" && l.status !== "BON_UTILISE" && l.status !== "PERDU");
      const chatbotLeads = leads.filter((l) => (l.source ?? "").startsWith("chatbot") || (l.source ?? "").startsWith("assistant-ia"));
      const inscrits = leads.filter((l) => l.status === "INSCRIT").length;

      // File « à traiter maintenant » (priorisée).
      type Item = { type: string; label: string; detail: string; href: string; priority: "urgent" | "high" | "normal" };
      const toProcess: Item[] = [];
      for (const a of rdvPending.slice(0, 8)) {
        toProcess.push({
          type: "rdv",
          label: `Confirmer le RDV de ${fullName(a)}`,
          detail: `${a.formation} · ${a.date} ${a.time} · ${a.source}`,
          href: "/admin/rendez-vous?source=chatbot",
          priority: a.priority === "urgent" ? "urgent" : "high"
        });
      }
      for (const t of overdueTasks.slice(0, 8)) {
        toProcess.push({ type: "task", label: t.note.slice(0, 80), detail: `Tâche en retard (${t.type})`, href: "/admin/relances", priority: "high" });
      }
      for (const l of hotLeads.filter((l) => !l.nextFollowUpAt).slice(0, 8)) {
        toProcess.push({ type: "lead", label: `Relancer ${fullName(l)} (chaud)`, detail: l.interest ?? "Prospect chaud sans relance planifiée", href: "/admin/relances", priority: "high" });
      }
      for (const c of conversations.filter((c) => c.status === "OUVERTE" && !c.appointmentId).slice(0, 5)) {
        toProcess.push({ type: "conversation", label: `Conversation à traiter${c.visitorName ? ` — ${c.visitorName}` : ""}`, detail: c.lastMessage?.slice(0, 80) ?? c.intent ?? "Chatbot", href: "/admin/rendez-vous?source=chatbot", priority: "normal" });
      }
      const rank = { urgent: 0, high: 1, normal: 2 } as const;
      toProcess.sort((x, y) => rank[x.priority] - rank[y.priority]);

      // Suggestions de relance détectées (le « moteur »).
      type Suggestion = { leadId: string; fullName: string; reason: string; temperature: string | null; interest: string | null; daysInactive: number };
      const suggestions: Suggestion[] = [];
      for (const l of leads) {
        if (l.status === "INSCRIT" || l.status === "BON_UTILISE" || l.status === "PERDU") continue;
        const inactive = daysSince(l.updatedAt);
        let reason: string | null = null;
        if (l.temperature === "chaud" && !l.nextFollowUpAt && (l.status === "PROSPECT" || l.status === "CONTACTE")) reason = "Prospect chaud sans relance planifiée";
        else if (l.status === "DEVIS_ENVOYE" && inactive >= 5) reason = `Devis envoyé sans réponse depuis ${inactive} j`;
        else if (l.status === "RELANCE" && (!l.nextFollowUpAt || new Date(l.nextFollowUpAt).getTime() < now.getTime())) reason = "Relance à planifier / en retard";
        else if (l.nextFollowUpAt && new Date(l.nextFollowUpAt).getTime() < now.getTime()) reason = "Date de relance dépassée";
        if (reason) suggestions.push({ leadId: l.id, fullName: fullName(l), reason, temperature: l.temperature ?? null, interest: l.interest ?? null, daysInactive: inactive === Infinity ? 0 : inactive });
      }
      suggestions.sort((a, b) => b.daysInactive - a.daysInactive);

      res.json({
        data: {
          kpis: {
            conversationsToday: conversations.filter((c) => isToday(c.createdAt)).length,
            conversationsOpen: conversations.filter((c) => c.status === "OUVERTE").length,
            rdvPendingConfirmation: rdvPending.length,
            rdvToday: appointments.filter((a) => isToday(a.startsAt) && a.status !== "cancelled").length,
            rdvToFollowUp: rdvToFollowUp.length,
            hotLeads: hotLeads.length,
            tasksOverdue: overdueTasks.length,
            tasksDueToday: openTasks.filter((t) => isToday(t.deadline)).length
          },
          funnel: {
            chatbotLeads: chatbotLeads.length,
            rdv: appointments.length,
            inscrits,
            leadToRdvRate: chatbotLeads.length > 0 ? Math.round((appointments.filter((a) => a.source === "chatbot").length / chatbotLeads.length) * 100) : null,
            rdvToInscritRate: appointments.length > 0 ? Math.round((inscrits / Math.max(appointments.length, 1)) * 100) : null
          },
          toProcess: toProcess.slice(0, 12),
          relanceSuggestions: suggestions.slice(0, 25)
        }
      });
    })
  );

  return router;
}
