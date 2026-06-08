import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import type { AiProvider } from "../src/ai/types";
import { qualifyLead } from "../src/ai/qualify";
import { crmTools } from "../src/ai/tools";
import { loadConfig } from "../src/config/env";
import { MemoryLodenRepository } from "../src/repositories/memory-loden-repository";

function testApp(aiProvider?: AiProvider) {
  const config = loadConfig({
    NODE_ENV: "test",
    JWT_SECRET: "test-secret-with-enough-length",
    JWT_EXPIRES_IN: "1h",
    CORS_ORIGIN: "http://localhost:3000",
    API_USE_MEMORY: "true"
  });
  const repository = new MemoryLodenRepository();
  return { app: createApp(repository, config, aiProvider ? { aiProvider } : undefined), repository };
}

const stubAi: AiProvider = {
  name: "stub",
  available: true,
  async chat() { return { content: "Réponse de test.", toolCalls: [] }; },
  async complete() { return "Réponse de test."; }
};
const disabledAi: AiProvider = {
  name: "disabled",
  available: false,
  async chat() { throw new Error("off"); },
  async complete() { throw new Error("off"); }
};
// Provider qui déclenche un outil (create_lead) au 1er tour, puis répond.
const toolAi: AiProvider = {
  name: "tool-stub",
  available: true,
  async chat(request) {
    const usedTool = request.messages.some((m) => m.role === "tool");
    if (!usedTool) {
      return {
        content: null,
        toolCalls: [{ id: "call_1", name: "create_lead", arguments: JSON.stringify({ fullName: "Bot Prospect", email: "bot.prospect@example.com", interest: "Permis B" }) }]
      };
    }
    return { content: "Merci, votre demande est bien enregistrée. Un conseiller vous recontactera.", toolCalls: [] };
  },
  async complete() { return "ok"; }
};

describe("LODEN API", () => {
  it("rejects unsafe production configuration", () => {
    expect(() =>
      loadConfig({
        NODE_ENV: "production",
        JWT_SECRET: "change-me-in-production",
        CORS_ORIGIN: "https://loden-autoecole.fr",
        API_USE_MEMORY: "false",
        DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/loden"
      })
    ).toThrow(/JWT_SECRET/);

    expect(() =>
      loadConfig({
        NODE_ENV: "production",
        JWT_SECRET: "production-secret-with-enough-entropy-123",
        CORS_ORIGIN: "https://loden-autoecole.fr",
        API_USE_MEMORY: "true",
        DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/loden"
      })
    ).toThrow(/PostgreSQL/);
  });

  it("exposes health and public catalog endpoints", async () => {
    const { app } = testApp();

    await request(app).get("/api/health").expect(200).expect(({ body }) => {
      expect(body.status).toBe("ok");
    });

    await request(app).get("/api/formations").expect(200).expect(({ body }) => {
      expect(body.data.length).toBeGreaterThanOrEqual(13);
      expect(body.data[0]).toHaveProperty("slug");
      // Les pôles professionnels VTC et CACES sont bien servis par le catalogue.
      expect(body.data.some((f: { productLine?: string }) => f.productLine === "VTC")).toBe(true);
      expect(body.data.some((f: { productLine?: string }) => f.productLine === "CACES")).toBe(true);
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

    // Les résultats "formation" pointent vers la page détail (deep-link), pas la liste générique.
    await request(app).get("/api/search").query({ q: "permis" }).expect(200).expect(({ body }) => {
      const formation = body.data.find((item: { category: string; href: string }) => item.category === "formation");
      expect(formation?.href).toMatch(/^\/formations\/.+/);
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

  it("derives the payment amount from the plan and ignores a tampered client amount", async () => {
    const { app } = testApp();

    const registration = await request(app)
      .post("/api/auth/register")
      .send({
        firstName: "Fraude",
        lastName: "Test",
        email: "fraude@example.com",
        password: "super-password",
        formationId: "formation-permis-b-manuel"
      })
      .expect(201);

    // Tentative de fraude : 1 centime envoyé par le client pour un pack à 1190 €.
    await request(app)
      .post("/api/payments/payment-intents")
      .set("Authorization", `Bearer ${registration.body.token}`)
      .send({ pricingPlanId: "plan-permis-b", kind: "FORMATION", amountCents: 1, currency: "EUR" })
      .expect(201)
      .expect(({ body }) => {
        // Le serveur impose le prix réel du pack, pas le montant client.
        expect(body.data.amountCents).toBe(119000);
      });
  });

  it("rejects a payment intent for an unknown plan", async () => {
    const { app } = testApp();

    const registration = await request(app)
      .post("/api/auth/register")
      .send({
        firstName: "Plan",
        lastName: "Inconnu",
        email: "plan-inconnu@example.com",
        password: "super-password",
        formationId: "formation-permis-b-manuel"
      })
      .expect(201);

    await request(app)
      .post("/api/payments/payment-intents")
      .set("Authorization", `Bearer ${registration.body.token}`)
      .send({ pricingPlanId: "plan-inexistant", kind: "FORMATION", currency: "EUR" })
      .expect(404);
  });

  it("rejects an unsigned Stripe webhook (mock mode: no event is trusted)", async () => {
    const { app } = testApp();

    await request(app)
      .post("/api/payments/stripe/webhook")
      .set("Content-Type", "application/json")
      .send({ type: "payment_intent.succeeded", data: { object: { id: "pi_mock_x" } } })
      .expect(400);
  });

  it("lets a MONITEUR read its instructor scope (bookings, exams) but not admin-only data", async () => {
    const { app } = testApp();

    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "sarah.benali@loden-autoecole.fr", password: "moniteur-password" })
      .expect(200);
    expect(login.body.user.role).toBe("MONITEUR");
    const token = login.body.token as string;

    await request(app).get("/api/bookings").set("Authorization", `Bearer ${token}`).expect(200);
    await request(app).get("/api/exams").set("Authorization", `Bearer ${token}`).expect(200);
    // Pas d'accès à la gestion des comptes utilisateurs.
    await request(app).get("/api/users").set("Authorization", `Bearer ${token}`).expect(403);
  });

  it("creates a student (user + profile) from the CRM with RBAC", async () => {
    const { app } = testApp();
    const admin = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@loden-autoecole.fr", password: "admin-password" })
      .expect(200);
    const token = admin.body.token as string;

    const created = await request(app)
      .post("/api/students")
      .set("Authorization", `Bearer ${token}`)
      .send({ firstName: "Nouvel", lastName: "Eleve", email: "nouvel.eleve@example.com", formationId: "formation-permis-b-manuel" })
      .expect(201);
    expect(created.body.data.user.email).toBe("nouvel.eleve@example.com");
    expect(created.body.data.user.role).toBe("ELEVE");
    expect(created.body.data.user.passwordHash).toBeUndefined();

    // Email déjà utilisé -> conflit.
    await request(app)
      .post("/api/students")
      .set("Authorization", `Bearer ${token}`)
      .send({ firstName: "Doublon", lastName: "Eleve", email: "nouvel.eleve@example.com" })
      .expect(409);

    // Un élève (non-staff) ne peut pas créer d'élève.
    const reg = await request(app)
      .post("/api/auth/register")
      .send({ firstName: "Eleve", lastName: "Simple", email: "eleve.simple@example.com", password: "super-password" })
      .expect(201);
    await request(app)
      .post("/api/students")
      .set("Authorization", `Bearer ${reg.body.token}`)
      .send({ firstName: "X", lastName: "Y", email: "x.y@example.com" })
      .expect(403);
  });

  it("manages instructors (create MONITEUR + update) with RBAC", async () => {
    const { app } = testApp();
    const admin = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@loden-autoecole.fr", password: "admin-password" })
      .expect(200);
    const token = admin.body.token as string;

    const created = await request(app)
      .post("/api/instructors")
      .set("Authorization", `Bearer ${token}`)
      .send({ firstName: "Nouveau", lastName: "Moniteur", email: "moniteur.new@example.com", specialties: ["Boîte manuelle"] })
      .expect(201);
    expect(created.body.data.user.role).toBe("MONITEUR");
    expect(created.body.data.name).toBe("Nouveau Moniteur");

    await request(app)
      .patch(`/api/instructors/${created.body.data.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ active: false })
      .expect(200)
      .expect(({ body }) => expect(body.data.active).toBe(false));

    // Un moniteur ne peut pas créer un moniteur.
    const mon = await request(app)
      .post("/api/auth/login")
      .send({ email: "sarah.benali@loden-autoecole.fr", password: "moniteur-password" })
      .expect(200);
    await request(app)
      .post("/api/instructors")
      .set("Authorization", `Bearer ${mon.body.token}`)
      .send({ firstName: "A", lastName: "B", email: "a.b@example.com" })
      .expect(403);
  });

  it("manages a student dossier documents (add, verify, delete)", async () => {
    const { app } = testApp();
    const admin = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@loden-autoecole.fr", password: "admin-password" })
      .expect(200);
    const token = admin.body.token as string;

    const created = await request(app)
      .post("/api/students")
      .set("Authorization", `Bearer ${token}`)
      .send({ firstName: "Doc", lastName: "Eleve", email: "doc.eleve@example.com" })
      .expect(201);
    const studentId = created.body.data.id as string;

    const doc = await request(app)
      .post(`/api/students/${studentId}/documents`)
      .set("Authorization", `Bearer ${token}`)
      .send({ type: "CNI", url: "https://drive.example/cni.pdf" })
      .expect(201);
    expect(doc.body.data.verifiedAt).toBeNull();
    const documentId = doc.body.data.id as string;

    await request(app)
      .get(`/api/students/${studentId}/documents`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .expect(({ body }) => expect(body.data).toHaveLength(1));

    await request(app)
      .patch(`/api/students/${studentId}/documents/${documentId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ verified: true })
      .expect(200)
      .expect(({ body }) => expect(body.data.verifiedAt).not.toBeNull());

    await request(app)
      .delete(`/api/students/${studentId}/documents/${documentId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    await request(app)
      .get(`/api/students/${studentId}/documents`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .expect(({ body }) => expect(body.data).toHaveLength(0));
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

  it("lets staff read and update a student file, but blocks students", async () => {
    const { app } = testApp();

    const registration = await request(app)
      .post("/api/auth/register")
      .send({
        firstName: "Tom",
        lastName: "Dossier",
        email: "tom.dossier@example.com",
        password: "super-password",
        formationId: "formation-permis-b-manuel"
      })
      .expect(201);

    const adminLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@loden-autoecole.fr", password: "admin-password" })
      .expect(200);

    const list = await request(app)
      .get("/api/students")
      .set("Authorization", `Bearer ${adminLogin.body.token}`)
      .expect(200);

    const studentId = list.body.data[0].id as string;

    await request(app)
      .patch(`/api/students/${studentId}`)
      .set("Authorization", `Bearer ${adminLogin.body.token}`)
      .send({ fileStatus: "EN_COURS", internalNotes: "Bon démarrage", progressPercent: 40, agencyId: "agency-republique" })
      .expect(200)
      .expect(({ body }) => {
        expect(body.data.fileStatus).toBe("EN_COURS");
        expect(body.data.internalNotes).toBe("Bon démarrage");
        expect(body.data.progressPercent).toBe(40);
        expect(body.data.agencyId).toBe("agency-republique");
      });

    // Un élève ne peut pas modifier un dossier.
    await request(app)
      .patch(`/api/students/${studentId}`)
      .set("Authorization", `Bearer ${registration.body.token}`)
      .send({ fileStatus: "TERMINE" })
      .expect(403);

    // Filtrage par agence (inclut les non-rattachés).
    await request(app)
      .get("/api/students")
      .query({ agencyId: "agency-republique" })
      .set("Authorization", `Bearer ${adminLogin.body.token}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.data.some((student: { id: string }) => student.id === studentId)).toBe(true);
      });
  });

  it("serves the AI chatbot publicly and protects admin AI tools", async () => {
    const { app } = testApp(stubAi);

    await request(app)
      .post("/api/ai/chat")
      .send({ messages: [{ role: "user", content: "Quel permis pour débuter ?" }] })
      .expect(200)
      .expect(({ body }) => expect(body.data.reply).toBe("Réponse de test."));

    // Validation des entrées.
    await request(app).post("/api/ai/chat").send({ messages: [] }).expect(400);

    // Outils CRM protégés.
    await request(app).post("/api/ai/summarize").send({ text: "Je veux le permis B." }).expect(401);

    const admin = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@loden-autoecole.fr", password: "admin-password" })
      .expect(200);

    await request(app)
      .post("/api/ai/summarize")
      .set("Authorization", `Bearer ${admin.body.token}`)
      .send({ text: "Bonjour, je souhaite passer mon permis B rapidement, possible en CPF ?" })
      .expect(200)
      .expect(({ body }) => expect(body.data.summary).toBe("Réponse de test."));
  });

  it("returns a clear message when the AI provider is not configured", async () => {
    const { app } = testApp(disabledAi);

    await request(app)
      .post("/api/ai/chat")
      .send({ messages: [{ role: "user", content: "Bonjour" }] })
      .expect(503)
      .expect(({ body }) => expect(body.error.code).toBe("AI_UNAVAILABLE"));
  });

  it("CRM agent endpoint requires authentication", async () => {
    const { app } = testApp(stubAi);
    await request(app).post("/api/ai/agent").send({ messages: [{ role: "user", content: "Bonjour" }] }).expect(401);
  });

  it("book_appointment tool creates a real booking and is gated by permission", async () => {
    const bookTool = crmTools.find((t) => t.def.function.name === "book_appointment");
    const findTool = crmTools.find((t) => t.def.function.name === "find_student");
    expect(bookTool?.permission).toBe("bookings.manage");
    expect(findTool?.permission).toBe("students.read");

    const config = loadConfig({
      NODE_ENV: "test",
      JWT_SECRET: "test-secret-with-enough-length",
      CORS_ORIGIN: "http://localhost:3000",
      API_USE_MEMORY: "true"
    });
    const repository = new MemoryLodenRepository();
    const user = await repository.createUser({ firstName: "Rdv", lastName: "Eleve", email: "rdv.eleve@example.com", role: "ELEVE" });
    const student = await repository.createStudent({ userId: user.id, formationId: "formation-permis-b-manuel" });

    const result = (await bookTool!.handler(
      { studentId: student.id, instructorId: "instructor-sarah", startsAt: "2026-06-15T09:00:00.000Z", endsAt: "2026-06-15T10:00:00.000Z" },
      { repository, config, scope: "crm", actorUserId: "admin-test" }
    )) as { ok: boolean; bookingId?: string };

    expect(result.ok).toBe(true);
    const bookings = await repository.listBookings();
    expect(bookings.some((b) => b.id === result.bookingId && b.status === "CONFIRMEE")).toBe(true);
  });

  it("auto-qualifies a lead temperature via the AI", async () => {
    const repository = new MemoryLodenRepository();
    const lead = await repository.createLead({ fullName: "Hot Lead", email: "hot@example.com", interest: "Permis accéléré, urgent", status: "PROSPECT" });

    const jsonAi: AiProvider = {
      name: "json",
      available: true,
      async chat() { return { content: '{"temperature":"chaud","score":85}', toolCalls: [] }; },
      async complete() { return '{"temperature":"chaud","score":85,"raison":"intention forte","prochaineAction":"appeler"}'; }
    };

    await qualifyLead(jsonAi, repository, lead);
    const updated = (await repository.listLeads()).find((l) => l.id === lead.id);
    expect(updated?.temperature).toBe("chaud");
    expect(updated?.score).toBe(85);
  });

  it("runs the agent tool loop and creates a lead via the create_lead tool", async () => {
    const { app } = testApp(toolAi);

    await request(app)
      .post("/api/ai/chat")
      .send({ messages: [{ role: "user", content: "Je veux des infos et m'inscrire au permis B." }] })
      .expect(200)
      .expect(({ body }) => expect(body.data.reply).toContain("enregistrée"));

    // L'outil create_lead doit avoir créé un prospect dans le CRM.
    const adminLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@loden-autoecole.fr", password: "admin-password" })
      .expect(200);

    await request(app)
      .get("/api/leads")
      .set("Authorization", `Bearer ${adminLogin.body.token}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.data.some((lead: { fullName: string; source?: string }) => lead.fullName === "Bot Prospect" && lead.source === "assistant-ia")).toBe(true);
      });
  });

  it("manages FAQ content (public read, admin CRUD)", async () => {
    const { app } = testApp();

    // Public : FAQ active.
    await request(app).get("/api/faq").expect(200).expect(({ body }) => {
      expect(Array.isArray(body.data)).toBe(true);
    });

    const adminLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@loden-autoecole.fr", password: "admin-password" })
      .expect(200);
    const adminToken = adminLogin.body.token as string;

    // Création réservée au staff (content.manage).
    await request(app).post("/api/faq").send({ question: "Question test ?", answer: "Réponse test." }).expect(401);

    const created = await request(app)
      .post("/api/faq")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ question: "Puis-je payer en plusieurs fois ?", answer: "Oui, en 3× ou 4× sans frais.", category: "Financement" })
      .expect(201);
    const faqId = created.body.data.id as string;

    // Masquer (active:false) -> disparaît du public, reste en gestion.
    await request(app)
      .patch(`/api/faq/${faqId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ active: false })
      .expect(200)
      .expect(({ body }) => expect(body.data.active).toBe(false));

    const publicList = await request(app).get("/api/faq").expect(200);
    expect(publicList.body.data.some((e: { id: string }) => e.id === faqId)).toBe(false);

    const manageList = await request(app).get("/api/faq/manage").set("Authorization", `Bearer ${adminToken}`).expect(200);
    expect(manageList.body.data.some((e: { id: string }) => e.id === faqId)).toBe(true);
  });

  it("generates a 3x installment plan splitting the total", async () => {
    const { app } = testApp();

    await request(app)
      .post("/api/auth/register")
      .send({ firstName: "Aya", lastName: "Echeance", email: "aya.echeance@example.com", password: "super-password", formationId: "formation-permis-b-manuel" })
      .expect(201);

    const adminLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@loden-autoecole.fr", password: "admin-password" })
      .expect(200);
    const adminToken = adminLogin.body.token as string;

    const list = await request(app).get("/api/students").set("Authorization", `Bearer ${adminToken}`).expect(200);
    const studentId = list.body.data[0].id as string;

    const plan = await request(app)
      .post("/api/installments/plan")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ studentId, totalCents: 100000, count: 3, startDate: "2026-07-01" })
      .expect(201)
      .expect(({ body }) => {
        expect(body.data).toHaveLength(3);
        const total = body.data.reduce((sum: number, i: { amountCents: number }) => sum + i.amountCents, 0);
        expect(total).toBe(100000); // 33334 + 33333 + 33333
      });

    await request(app)
      .patch(`/api/installments/${plan.body.data[0].id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "PAYE" })
      .expect(200)
      .expect(({ body }) => expect(body.data.status).toBe("PAYE"));

    await request(app)
      .get("/api/installments")
      .query({ studentId })
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200)
      .expect(({ body }) => expect(body.data).toHaveLength(3));
  });

  it("records payments and refunds with finance permissions", async () => {
    const { app } = testApp();

    const registration = await request(app)
      .post("/api/auth/register")
      .send({ firstName: "Paul", lastName: "Finance", email: "paul.finance@example.com", password: "super-password", formationId: "formation-permis-b-manuel" })
      .expect(201);
    const studentUserId = registration.body.user.id as string;

    const adminLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@loden-autoecole.fr", password: "admin-password" })
      .expect(200);
    const adminToken = adminLogin.body.token as string;

    // Un élève ne peut pas enregistrer un paiement.
    await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${registration.body.token}`)
      .send({ userId: studentUserId, amountCents: 90000, kind: "FORMATION" })
      .expect(403);

    const payment = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ userId: studentUserId, amountCents: 90000, kind: "FORMATION", status: "PAYE" })
      .expect(201)
      .expect(({ body }) => expect(body.data.status).toBe("PAYE"));

    // La liste staff renvoie le paiement enrichi du nom du payeur.
    await request(app)
      .get("/api/payments")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.data).toHaveLength(1);
        expect(body.data[0].user.firstName).toBe("Paul");
      });

    // Remboursement.
    await request(app)
      .patch(`/api/payments/${payment.body.data.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "REMBOURSE" })
      .expect(200)
      .expect(({ body }) => expect(body.data.status).toBe("REMBOURSE"));
  });

  it("tracks student skills against the REMC référentiel", async () => {
    const { app } = testApp();

    const registration = await request(app)
      .post("/api/auth/register")
      .send({ firstName: "Rita", lastName: "Skill", email: "rita.skill@example.com", password: "super-password", formationId: "formation-permis-b-manuel" })
      .expect(201);

    const adminLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@loden-autoecole.fr", password: "admin-password" })
      .expect(200);
    const adminToken = adminLogin.body.token as string;

    const list = await request(app).get("/api/students").set("Authorization", `Bearer ${adminToken}`).expect(200);
    const studentId = list.body.data[0].id as string;

    // Le référentiel est renvoyé avec niveaux à 0 par défaut.
    await request(app)
      .get(`/api/students/${studentId}/skills`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.data).toHaveLength(4);
        expect(body.data.every((skill: { level: number }) => skill.level === 0)).toBe(true);
      });

    // Un élève ne peut pas modifier ses compétences.
    await request(app)
      .patch(`/api/students/${studentId}/skills`)
      .set("Authorization", `Bearer ${registration.body.token}`)
      .send({ skillCode: "C1", level: 3 })
      .expect(403);

    await request(app)
      .patch(`/api/students/${studentId}/skills`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ skillCode: "C1", level: 3 })
      .expect(200)
      .expect(({ body }) => expect(body.data.level).toBe(3));

    await request(app)
      .get(`/api/students/${studentId}/skills`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.data.find((skill: { code: string }) => skill.code === "C1").level).toBe(3);
      });
  });

  it("manages exams and computes the pass rate", async () => {
    const { app } = testApp();

    const registration = await request(app)
      .post("/api/auth/register")
      .send({ firstName: "Inès", lastName: "Examen", email: "ines.examen@example.com", password: "super-password", formationId: "formation-permis-b-manuel" })
      .expect(201);

    const adminLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@loden-autoecole.fr", password: "admin-password" })
      .expect(200);
    const adminToken = adminLogin.body.token as string;

    const list = await request(app).get("/api/students").set("Authorization", `Bearer ${adminToken}`).expect(200);
    const studentId = list.body.data[0].id as string;

    // Un élève ne peut pas créer d'examen.
    await request(app)
      .post("/api/exams")
      .set("Authorization", `Bearer ${registration.body.token}`)
      .send({ studentId, type: "CONDUITE", scheduledAt: "2026-07-01T09:00:00.000Z" })
      .expect(403);

    const exam = await request(app)
      .post("/api/exams")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ studentId, type: "CONDUITE", scheduledAt: "2026-07-01T09:00:00.000Z" })
      .expect(201)
      .expect(({ body }) => {
        expect(body.data.result).toBe("EN_ATTENTE");
        expect(body.data.attempt).toBe(1);
      });

    await request(app)
      .patch(`/api/exams/${exam.body.data.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ result: "REUSSI", score: 32 })
      .expect(200)
      .expect(({ body }) => expect(body.data.result).toBe("REUSSI"));

    await request(app)
      .get("/api/admin/stats")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.data.exams.total).toBe(1);
        expect(body.data.exams.passRate).toBe(100);
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
