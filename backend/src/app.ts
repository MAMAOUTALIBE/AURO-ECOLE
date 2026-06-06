import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import type { ApiConfig } from "./config/env";
import { createAuthRouter } from "./modules/auth/auth.routes";
import { createBookingsRouter } from "./modules/bookings/bookings.routes";
import { createCatalogRouter } from "./modules/catalog/catalog.routes";
import { createContactsRouter } from "./modules/contacts/contacts.routes";
import { createCpfRouter } from "./modules/cpf/cpf.routes";
import { createInstructorsRouter } from "./modules/instructors/instructors.routes";
import { createLeadsRouter } from "./modules/leads/leads.routes";
import { createPaymentsRouter } from "./modules/payments/payments.routes";
import { createReviewsRouter } from "./modules/reviews/reviews.routes";
import { createSearchRouter } from "./modules/search/search.routes";
import { createStudentsRouter } from "./modules/students/students.routes";
import { createUsersRouter } from "./modules/users/users.routes";
import type { LodenRepository } from "./repositories/loden-repository";
import { errorHandler } from "./middleware/error-handler";
import { notFoundHandler } from "./middleware/not-found";

export function createApp(repository: LodenRepository, config: ApiConfig) {
  const app = express();

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
  app.use("/api", createCatalogRouter(repository, config));
  app.use("/api/instructors", createInstructorsRouter(repository));
  app.use("/api/leads", createLeadsRouter(repository, config));
  app.use("/api/users", createUsersRouter(repository, config));
  app.use("/api/students", createStudentsRouter(repository, config));
  app.use("/api/bookings", createBookingsRouter(repository, config));
  app.use("/api/payments", createPaymentsRouter(repository, config));
  app.use("/api/cpf", createCpfRouter(repository, config));
  app.use("/api/contact-requests", createContactsRouter(repository, config));
  app.use("/api/reviews", createReviewsRouter(repository, config));
  app.use("/api/search", createSearchRouter(repository));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
