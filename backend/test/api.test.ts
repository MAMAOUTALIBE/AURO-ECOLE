import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { loadConfig } from "../src/config/env";
import { MemoryLodenRepository } from "../src/repositories/memory-loden-repository";

function testApp() {
  const config = loadConfig({
    NODE_ENV: "test",
    JWT_SECRET: "test-secret-with-enough-length",
    JWT_EXPIRES_IN: "1h",
    CORS_ORIGIN: "http://localhost:3000",
    API_USE_MEMORY: "true"
  });
  const repository = new MemoryLodenRepository();
  return { app: createApp(repository, config), repository };
}

describe("LODEN API", () => {
  it("exposes health and public catalog endpoints", async () => {
    const { app } = testApp();

    await request(app).get("/api/health").expect(200).expect(({ body }) => {
      expect(body.status).toBe("ok");
    });

    await request(app).get("/api/formations").expect(200).expect(({ body }) => {
      expect(body.data).toHaveLength(8);
      expect(body.data[0]).toHaveProperty("slug");
    });

    await request(app).get("/api/pricing-plans").expect(200).expect(({ body }) => {
      expect(body.data.length).toBeGreaterThan(0);
    });

    await request(app).get("/api/tarifs").expect(200).expect(({ body }) => {
      expect(body.data.length).toBeGreaterThan(0);
    });

    await request(app).get("/api/instructors").expect(200).expect(({ body }) => {
      expect(body.data.length).toBeGreaterThan(0);
    });

    await request(app).get("/api/reviews").expect(200).expect(({ body }) => {
      expect(body.data.length).toBeGreaterThan(0);
      expect(body.data.every((review: { status: string }) => review.status === "PUBLIE")).toBe(true);
    });
  });

  it("searches formations, pricing and CPF content", async () => {
    const { app } = testApp();

    await request(app).get("/api/search").query({ q: "permis accéléré" }).expect(200).expect(({ body }) => {
      expect(body.data[0].title).toContain("Permis accéléré");
    });

    await request(app).get("/api/search").query({ q: "cpf" }).expect(200).expect(({ body }) => {
      expect(body.data.some((item: { title: string }) => item.title.toLowerCase().includes("cpf"))).toBe(true);
    });
  });

  it("accepts contact and CPF public requests with validation", async () => {
    const { app } = testApp();

    await request(app)
      .post("/api/contact-requests")
      .send({
        fullName: "Jean Test",
        email: "jean.test@example.com",
        phone: "0612345678",
        type: "INSCRIPTION",
        source: "site",
        message: "Je souhaite démarrer une formation permis B."
      })
      .expect(201);

    await request(app)
      .post("/api/cpf/requests")
      .send({
        fullName: "Awa Test",
        email: "awa.test@example.com",
        phone: "0611111111",
        formationId: "formation-permis-b-manuel",
        requestedAmountCents: 90000
      })
      .expect(201);

    await request(app).post("/api/contact-requests").send({ email: "bad" }).expect(400);
  });

  it("registers and authenticates a student", async () => {
    const { app } = testApp();

    const registration = await request(app)
      .post("/api/auth/register")
      .send({
        firstName: "Lina",
        lastName: "Permis",
        email: "lina@example.com",
        phone: "0612345678",
        password: "super-password",
        formationId: "formation-permis-b-manuel"
      })
      .expect(201);

    expect(registration.body.token).toBeTruthy();
    expect(registration.body.user.passwordHash).toBeUndefined();

    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "lina@example.com", password: "super-password" })
      .expect(200);

    await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${login.body.token}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.user.email).toBe("lina@example.com");
      });
  });

  it("creates authenticated mock payment intents for students", async () => {
    const { app } = testApp();

    await request(app)
      .post("/api/payments/payment-intents")
      .send({
        pricingPlanId: "plan-permis-b",
        kind: "FORMATION",
        amountCents: 119000,
        currency: "EUR"
      })
      .expect(401);

    const registration = await request(app)
      .post("/api/auth/register")
      .send({
        firstName: "Nora",
        lastName: "Paiement",
        email: "nora@example.com",
        password: "super-password",
        formationId: "formation-permis-b-manuel"
      })
      .expect(201);

    await request(app)
      .post("/api/payments/payment-intents")
      .set("Authorization", `Bearer ${registration.body.token}`)
      .send({
        pricingPlanId: "plan-permis-b",
        kind: "FORMATION",
        amountCents: 119000,
        currency: "EUR"
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body.data.userId).toBe(registration.body.user.id);
        expect(body.data.status).toBe("EN_ATTENTE");
        expect(body.data.stripePaymentIntentId).toContain("pi_mock_");
        expect(body.stripe.clientSecret).toContain("_secret_mock");
      });

    await request(app)
      .get("/api/payments")
      .set("Authorization", `Bearer ${registration.body.token}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.data).toHaveLength(1);
        expect(body.data[0].amountCents).toBe(119000);
      });
  });

  it("protects CRM data behind admin roles", async () => {
    const { app } = testApp();

    await request(app)
      .post("/api/contact-requests")
      .send({
        fullName: "Prospect CRM",
        email: "prospect.crm@example.com",
        type: "RAPPEL",
        source: "test",
        message: "Je souhaite être rappelé pour une inscription."
      })
      .expect(201);

    await request(app)
      .post("/api/cpf/requests")
      .send({
        fullName: "Dossier CPF",
        email: "cpf.crm@example.com",
        formationId: "formation-permis-b-manuel",
        requestedAmountCents: 90000
      })
      .expect(201);

    const student = await request(app)
      .post("/api/auth/register")
      .send({
        firstName: "Eli",
        lastName: "Student",
        email: "eli.student@example.com",
        password: "super-password",
        formationId: "formation-permis-b-manuel"
      })
      .expect(201);

    await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${student.body.token}`)
      .send({
        rating: 4,
        comment: "Avis en attente pour vérifier la modération admin."
      })
      .expect(201);

    await request(app).get("/api/contact-requests").expect(401);
    await request(app).get("/api/reviews").query({ includeUnpublished: "true" }).expect(401);

    await request(app)
      .get("/api/contact-requests")
      .set("Authorization", `Bearer ${student.body.token}`)
      .expect(403);

    const adminLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@loden-autoecole.fr", password: "admin-password" })
      .expect(200);

    expect(adminLogin.body.user.role).toBe("SUPER_ADMIN");

    await request(app)
      .get("/api/contact-requests")
      .set("Authorization", `Bearer ${adminLogin.body.token}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.data).toHaveLength(1);
      });

    await request(app)
      .get("/api/cpf/requests")
      .set("Authorization", `Bearer ${adminLogin.body.token}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.data).toHaveLength(1);
      });

    await request(app)
      .get("/api/reviews")
      .query({ includeUnpublished: "true" })
      .set("Authorization", `Bearer ${adminLogin.body.token}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.data.some((review: { status: string }) => review.status === "EN_ATTENTE")).toBe(true);
      });
  });

  it("manages commercial leads through the protected CRM pipeline", async () => {
    const { app } = testApp();

    await request(app).get("/api/leads").expect(401);

    const student = await request(app)
      .post("/api/auth/register")
      .send({
        firstName: "Samir",
        lastName: "Lead",
        email: "samir.lead@example.com",
        password: "super-password",
        formationId: "formation-permis-b-manuel"
      })
      .expect(201);

    await request(app)
      .get("/api/leads")
      .set("Authorization", `Bearer ${student.body.token}`)
      .expect(403);

    await request(app)
      .post("/api/contact-requests")
      .send({
        fullName: "Prospect Pipeline",
        email: "prospect.pipeline@example.com",
        phone: "0611223344",
        type: "INSCRIPTION",
        source: "landing",
        message: "Je veux recevoir un devis pour le permis accéléré."
      })
      .expect(201);

    const adminLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@loden-autoecole.fr", password: "admin-password" })
      .expect(200);

    const leads = await request(app)
      .get("/api/leads")
      .set("Authorization", `Bearer ${adminLogin.body.token}`)
      .expect(200);

    expect(leads.body.data).toHaveLength(1);
    expect(leads.body.data[0].status).toBe("PROSPECT");
    expect(leads.body.data[0].interest).toBe("INSCRIPTION");

    const manualLead = await request(app)
      .post("/api/leads")
      .set("Authorization", `Bearer ${adminLogin.body.token}`)
      .send({
        fullName: "Lead Manuel",
        email: "lead.manuel@example.com",
        phone: "0600001122",
        status: "CONTACTE",
        source: "admin",
        interest: "Permis B",
        estimatedValueCents: 119000
      })
      .expect(201);

    await request(app)
      .patch(`/api/leads/${manualLead.body.data.id}/status`)
      .set("Authorization", `Bearer ${adminLogin.body.token}`)
      .send({ status: "DEVIS_ENVOYE", notes: "Devis permis B envoyé." })
      .expect(200)
      .expect(({ body }) => {
        expect(body.data.status).toBe("DEVIS_ENVOYE");
        expect(body.data.notes).toBe("Devis permis B envoyé.");
      });

    await request(app)
      .get("/api/leads")
      .query({ status: "DEVIS_ENVOYE" })
      .set("Authorization", `Bearer ${adminLogin.body.token}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.data).toHaveLength(1);
        expect(body.data[0].fullName).toBe("Lead Manuel");
      });
  });

  it("prevents instructor booking conflicts", async () => {
    const { app } = testApp();

    const registration = await request(app)
      .post("/api/auth/register")
      .send({
        firstName: "Moussa",
        lastName: "Eleve",
        email: "moussa@example.com",
        password: "super-password",
        formationId: "formation-permis-b-manuel"
      })
      .expect(201);

    const payload = {
      instructorId: "instructor-sarah",
      formationId: "formation-permis-b-manuel",
      meetingPointId: "meeting-republique",
      startsAt: "2026-06-08T09:00:00.000Z",
      endsAt: "2026-06-08T10:00:00.000Z"
    };

    await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${registration.body.token}`)
      .send(payload)
      .expect(201);

    await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${registration.body.token}`)
      .send({ ...payload, startsAt: "2026-06-08T09:30:00.000Z", endsAt: "2026-06-08T10:30:00.000Z" })
      .expect(409);
  });
});
