import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import type { ApiConfig } from "./config/env";
import { createAiProvider } from "./ai/provider-factory";
import type { AiProvider } from "./ai/types";
import { createAgenciesRouter } from "./modules/agencies/agencies.routes";
import { createAiRouter } from "./modules/ai/ai.routes";
import { createAnalyticsRouter } from "./modules/analytics/analytics.routes";
import { createAuditRouter } from "./modules/audit/audit.routes";
import { createAuthRouter } from "./modules/auth/auth.routes";
import { createBookingsRouter } from "./modules/bookings/bookings.routes";
import { createCatalogRouter } from "./modules/catalog/catalog.routes";
import { createAppointmentsRouter, createChatAdminRouter, createChatRouter } from "./modules/chat/chat.routes";
import { createAppointmentsAdminRouter } from "./modules/appointments/appointments.routes";
import { createContactsRouter } from "./modules/contacts/contacts.routes";
import { createContentRouter } from "./modules/content/content.routes";
import { createCpfRouter } from "./modules/cpf/cpf.routes";
import { createExamsRouter } from "./modules/exams/exams.routes";
import { createInstallmentsRouter } from "./modules/installments/installments.routes";
import { createInstructorsRouter } from "./modules/instructors/instructors.routes";
import { createInvoicesRouter } from "./modules/invoices/invoices.routes";
import { createQuotesRouter } from "./modules/quotes/quotes.routes";
import { createContractsRouter } from "./modules/contracts/contracts.routes";
import { createCmsRouter } from "./modules/cms/cms.routes";
import { createAutomationsRouter } from "./modules/automations/automations.routes";
import { createLeadsRouter } from "./modules/leads/leads.routes";
import { createPartnersRouter } from "./modules/partners/partners.routes";
import { createInscriptionsRouter } from "./modules/inscriptions/inscriptions.routes";
import { createMediaRouter } from "./modules/media/media.routes";
import { createNotificationsRouter } from "./modules/notifications/notifications.routes";
import { createOffersRouter } from "./modules/offers/offers.routes";
import { createPaymentsRouter, createStripeWebhookHandler } from "./modules/payments/payments.routes";
import { createPermissionsRouter } from "./modules/permissions/permissions.routes";
import { createStripeProvider } from "./payments/stripe-provider";
import { createReviewsRouter } from "./modules/reviews/reviews.routes";
import { createGoogleReviewsRouter } from "./modules/reviews/google-reviews.routes";
import { createSearchRouter } from "./modules/search/search.routes";
import { createSiteRouter } from "./modules/site/site.routes";
import { createStatsRouter } from "./modules/stats/stats.routes";
import { createStudentsRouter } from "./modules/students/students.routes";
import { createUsersRouter } from "./modules/users/users.routes";
import { createVehiclesRouter } from "./modules/vehicles/vehicles.routes";
import type { LodenRepository } from "./repositories/loden-repository";
import { errorHandler } from "./middleware/error-handler";
import { notFoundHandler } from "./middleware/not-found";

export function createApp(repository: LodenRepository, config: ApiConfig, deps: { aiProvider?: AiProvider } = {}) {
  const app = express();
  const aiProvider = deps.aiProvider ?? createAiProvider(config);
  const stripeProvider = createStripeProvider(config);

  // Derrière le reverse-proxy nginx (1 saut) : indispensable pour que le
  // rate-limit et l'IP réelle soient corrects (sinon tout est vu comme 127.0.0.1).
  app.set("trust proxy", 1);

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || config.corsOrigins.includes(origin)) return callback(null, true);
        return callback(new Error(`Origine CORS non autorisée: ${origin}`));
      },
      credentials: true
    })
  );
  // Webhook Stripe : AVANT express.json() (corps brut requis pour vérifier la
  // signature) et hors de tout middleware d'authentification (Stripe n'a pas de JWT).
  app.post(
    "/api/payments/stripe/webhook",
    express.raw({ type: () => true }),
    createStripeWebhookHandler(repository, config, stripeProvider)
  );

  app.use(express.json({ limit: "1mb" }));
  app.use(
    rateLimit({
      windowMs: 60_000,
      max: config.NODE_ENV === "test" ? 10_000 : 120,
      standardHeaders: true,
      legacyHeaders: false
    })
  );

  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "loden-api",
      timestamp: new Date().toISOString()
    });
  });

  app.use("/api/auth", createAuthRouter(repository, config));
  app.use("/api/agencies", createAgenciesRouter(repository, config));
  app.use("/api/admin", createStatsRouter(repository, config));
  app.use("/api/admin", createAnalyticsRouter(repository, config));
  app.use("/api/admin", createChatAdminRouter(repository, config));
  // Centre rendez-vous & planning unifié (source unique de vérité, tous canaux).
  app.use("/api/admin/appointments", createAppointmentsAdminRouter(repository, config));
  app.use("/api/audit-logs", createAuditRouter(repository, config));
  app.use("/api/permissions", createPermissionsRouter(repository, config));
  app.use("/api", createCatalogRouter(repository, config));
  app.use("/api/instructors", createInstructorsRouter(repository, config));
  app.use("/api/vehicles", createVehiclesRouter(repository, config));
  app.use("/api/leads", createLeadsRouter(repository, config, aiProvider));
  app.use("/api/partners", createPartnersRouter(repository, config, aiProvider));
  app.use("/api/offers", createOffersRouter(repository, config, aiProvider));
  app.use("/api/users", createUsersRouter(repository, config));
  app.use("/api/students", createStudentsRouter(repository, config));
  app.use("/api/bookings", createBookingsRouter(repository, config));
  app.use("/api/appointments", createAppointmentsRouter(repository));
  app.use("/api/payments", createPaymentsRouter(repository, config, stripeProvider));
  app.use("/api/installments", createInstallmentsRouter(repository, config));
  app.use("/api/invoices", createInvoicesRouter(repository, config));
  app.use("/api/quotes", createQuotesRouter(repository, config));
  app.use("/api/contracts", createContractsRouter(repository, config));
  app.use("/api/content-entries", createCmsRouter(repository, config));
  app.use("/api/automations", createAutomationsRouter(repository, config));
  app.use("/api/cpf", createCpfRouter(repository, config));
  app.use("/api/exams", createExamsRouter(repository, config));
  app.use("/api/contact-requests", createContactsRouter(repository, config, aiProvider));
  app.use("/api/inscriptions", createInscriptionsRouter(repository, config, aiProvider));
  const contentRouter = createContentRouter(repository, config);
  app.use("/api/faq", contentRouter);
  // Même routeur exposé sous /api/content (notamment /api/content/company).
  app.use("/api/content", contentRouter);
  app.use("/api/reviews", createReviewsRouter(repository, config));
  // Avis Google (synchro fiche Google Business + boutons « laisser un avis »).
  app.use("/api/google-reviews", createGoogleReviewsRouter(repository, config));
  app.use("/api/media", createMediaRouter(repository, config));
  app.use("/api/notifications", createNotificationsRouter(repository, config));
  app.use("/api/site", createSiteRouter(repository, config));
  app.use("/api/search", createSearchRouter(repository));
  app.use("/api/chat", createChatRouter(repository, config, aiProvider));
  app.use("/api/ai", createAiRouter(repository, config, aiProvider));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
