import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import type { AiProvider } from "../src/ai/types";
import { qualifyLead } from "../src/ai/qualify";
import { crmTools } from "../src/ai/tools";
import { loadConfig } from "../src/config/env";
import { initialAgencyMemberships, initialPricingPlans, initialUsers } from "../src/data/initial-data";
import { MemoryLodenRepository } from "../src/repositories/memory-loden-repository";

// Fixtures de TEST uniquement (la production ne seed AUCUNE donnée fictive : pas d'avis,
// pas de moniteur nommé, prix à 0). Ici on reconstitue le minimum nécessaire aux tests :
// un moniteur connectable, un instructeur listable, un avis publié et un pack payant.
const TEST_NOW = new Date("2026-06-06T00:00:00.000Z");
const TEST_MONITEUR = {
  id: "user-test-moniteur",
  firstName: "Moniteur",
  lastName: "Test",
  email: "moniteur.test@loden-autoecole.fr",
  role: "MONITEUR" as const,
  status: "ACTIVE" as const,
  // hash bcrypt de "moniteur-password"
  passwordHash: "$2b$12$VIx2vVB4pKggoYxz0uh.n.sIFBfoDTJ3MZUz.y2dS7MLoNk0V6nPe",
  createdAt: TEST_NOW,
  updatedAt: TEST_NOW
};

function buildTestSeed() {
  return {
    users: [...initialUsers, TEST_MONITEUR],
    agencyMemberships: [
      ...initialAgencyMemberships,
      { id: "membership-test-moniteur", userId: TEST_MONITEUR.id, agencyId: "agency-republique", role: "MONITEUR" as const, isPrimary: true }
    ],
    instructors: [
      {
        id: "instructor-test",
        userId: TEST_MONITEUR.id,
        agencyId: "agency-republique",
        name: "Moniteur Test",
        specialties: ["Conduite"],
        interventionZones: [],
        ratingAverage: 0,
        ratingCount: 0,
        active: true
      }
    ],
    reviews: [
      {
        id: "review-test",
        rating: 5,
        comment: "Avis de test publié.",
        status: "PUBLIE" as const,
        publishedAt: TEST_NOW,
        createdAt: TEST_NOW,
        updatedAt: TEST_NOW
      }
    ],
    pricingPlans: initialPricingPlans.map((plan) => (plan.id === "plan-permis-b" ? { ...plan, priceCents: 119000 } : plan))
  };
}

function testApp(aiProvider?: AiProvider) {
  const config = loadConfig({
    NODE_ENV: "test",
    JWT_SECRET: "test-secret-with-enough-length",
    JWT_EXPIRES_IN: "1h",
    CORS_ORIGIN: "http://localhost:3000",
    API_USE_MEMORY: "true"
  });
  const repository = new MemoryLodenRepository(buildTestSeed());
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

describe("LODENE API", () => {
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
      // Les pôles professionnels VTC et Logistique & sécurité sont bien servis par le catalogue.
      expect(body.data.some((f: { productLine?: string }) => f.productLine === "VTC")).toBe(true);
      expect(body.data.some((f: { productLine?: string }) => f.productLine === "LOGISTIQUE_SECURITE")).toBe(true);
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

  it("accepts public review submissions only as pending moderation", async () => {
    const { app } = testApp();

    await request(app)
      .post("/api/reviews")
      .send({
        rating: 5,
        comment: "Avis public envoyé depuis la page avis."
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body.data.status).toBe("EN_ATTENTE");
        expect(body.data.userId).toBeUndefined();
      });

    await request(app)
      .post("/api/reviews")
      .send({
        rating: 5,
        comment: "Tentative de publication directe non autorisée.",
        status: "PUBLIE"
      })
      .expect(403);

    await request(app)
      .get("/api/reviews")
      .expect(200)
      .expect(({ body }) => {
        expect(body.data.some((review: { comment: string }) => review.comment === "Avis public envoyé depuis la page avis.")).toBe(false);
      });
  });

  it("searches formations, pricing and CPF content", async () => {
    const { app } = testApp();

    await request(app).get("/api/search").query({ q: "accéléré" }).expect(200).expect(({ body }) => {
      expect(body.data.some((item: { title: string }) => item.title.toLowerCase().includes("accéléré"))).toBe(true);
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

  it("exposes and updates official company info via the CMS with RBAC", async () => {
    const { app } = testApp();

    // Lecture publique : données officielles posées, champs non confirmés vides.
    await request(app).get("/api/content/company").expect(200).expect(({ body }) => {
      expect(body.data.brandName).toBe("LODENE");
      expect(body.data.siret).toBe("84282888100040");
      expect(body.data.approvalNumber).toBe("E2507800260");
      expect(body.data.city).toBe("Conflans-Sainte-Honorine");
      // Téléphone officiel LODENE désormais renseigné (donnée vérifiée).
      expect(body.data.phone).toBe("06 60 32 50 87");
    });

    // Édition réservée : un anonyme ne peut pas modifier.
    await request(app).patch("/api/content/company").send({ phone: "01 39 00 00 00" }).expect(401);

    const admin = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@loden-autoecole.fr", password: "admin-password" })
      .expect(200);

    await request(app)
      .patch("/api/content/company")
      .set("Authorization", `Bearer ${admin.body.token}`)
      .send({ phone: "01 39 00 00 00" })
      .expect(200)
      .expect(({ body }) => expect(body.data.phone).toBe("01 39 00 00 00"));
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

  it("creates a chatbot lead, appointment, task and CRM admin view", async () => {
    const { app } = testApp();

    const availability = await request(app).get("/api/appointments/availability").expect(200);
    expect(availability.body.data.length).toBeGreaterThan(0);
    const slot = availability.body.data[0];

    const created = await request(app)
      .post("/api/chat/appointment")
      .send({
        slotId: slot.id,
        formation: "Permis B automatique",
        objective: "M'inscrire",
        firstName: "Nadia",
        lastName: "Chatbot",
        phone: "0660325087",
        email: "nadia.chatbot@example.com",
        message: "Je souhaite commencer rapidement.",
        consentContact: true,
        consentWhatsApp: true,
        conversation: [{ role: "user", content: "Je veux prendre rendez-vous." }]
      })
      .expect(201);

    expect(created.body.data.lead.source).toBe("chatbot");
    expect(created.body.data.lead.temperature).toBe("chaud");
    expect(created.body.data.appointment.status).toBe("pending_confirmation");
    expect(created.body.data.appointment.source).toBe("chatbot");
    expect(created.body.data.appointment.formation).toBe("Permis B automatique");
    expect(created.body.data.task.priority).toBe("HAUTE");
    expect(created.body.data.whatsapp.message).toContain("Permis B automatique");
    expect(created.body.data.whatsapp.url).toContain("wa.me");

    const admin = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@loden-autoecole.fr", password: "admin-password" })
      .expect(200);

    await request(app)
      .get("/api/admin/appointments")
      .set("Authorization", `Bearer ${admin.body.token}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.data.appointments.some((item: { id: string }) => item.id === created.body.data.appointment.id)).toBe(true);
        expect(body.data.leads.some((item: { id: string }) => item.id === created.body.data.lead.id)).toBe(true);
        expect(body.data.tasks.some((item: { appointmentId: string }) => item.appointmentId === created.body.data.appointment.id)).toBe(true);
      });
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
        pricingPlanId: "plan-essentiel-manuelle",
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
        // Le serveur impose le prix réel du pack "Essentiel Manuelle" (1344 €), pas le montant client.
        expect(body.data[0].amountCents).toBe(134400);
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

    // Tentative de fraude : 1 centime envoyé par le client pour un pack à 1344 €.
    await request(app)
      .post("/api/payments/payment-intents")
      .set("Authorization", `Bearer ${registration.body.token}`)
      .send({ pricingPlanId: "plan-essentiel-manuelle", kind: "FORMATION", amountCents: 1, currency: "EUR" })
      .expect(201)
      .expect(({ body }) => {
        // Le serveur impose le prix réel du pack, pas le montant client.
        expect(body.data.amountCents).toBe(134400);
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
      .send({ email: "moniteur.test@loden-autoecole.fr", password: "moniteur-password" })
      .expect(200);
    expect(login.body.user.role).toBe("MONITEUR");
    const token = login.body.token as string;

    await request(app).get("/api/bookings").set("Authorization", `Bearer ${token}`).expect(200);
    await request(app).get("/api/exams").set("Authorization", `Bearer ${token}`).expect(200);
    // Cloisonnement multi-agences : lit bien SA propre agence…
    await request(app).get("/api/exams").query({ agencyId: "agency-republique" }).set("Authorization", `Bearer ${token}`).expect(200);
    // …mais 403 sur une agence hors de son périmètre (anti-IDOR inter-agences).
    await request(app).get("/api/exams").query({ agencyId: "agency-autre" }).set("Authorization", `Bearer ${token}`).expect(403);
    // Pas d'accès à la gestion des comptes utilisateurs ni aux journaux d'audit.
    await request(app).get("/api/users").set("Authorization", `Bearer ${token}`).expect(403);
    await request(app).get("/api/audit-logs").set("Authorization", `Bearer ${token}`).expect(403);
    await request(app).get("/api/permissions").set("Authorization", `Bearer ${token}`).expect(403);
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
      .send({ email: "moniteur.test@loden-autoecole.fr", password: "moniteur-password" })
      .expect(200);
    await request(app)
      .post("/api/instructors")
      .set("Authorization", `Bearer ${mon.body.token}`)
      .send({ firstName: "A", lastName: "B", email: "a.b@example.com" })
      .expect(403);
  });

  it("manages staff users and agencies (create + update) with RBAC", async () => {
    const { app } = testApp();
    const admin = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@loden-autoecole.fr", password: "admin-password" })
      .expect(200);
    const token = admin.body.token as string;

    // Création d'un membre du personnel + changement de statut.
    const user = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${token}`)
      .send({ firstName: "Sandra", lastName: "Secrétaire", email: "sandra.secretaire@example.com", role: "SECRETAIRE" })
      .expect(201);
    expect(user.body.data.role).toBe("SECRETAIRE");
    expect(user.body.data.passwordHash).toBeUndefined();
    await request(app)
      .patch(`/api/users/${user.body.data.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "SUSPENDED" })
      .expect(200)
      .expect(({ body }) => expect(body.data.status).toBe("SUSPENDED"));

    // Création + édition d'une agence.
    const agency = await request(app)
      .post("/api/agencies")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "LODENE Cergy", slug: "cergy" })
      .expect(201);
    expect(agency.body.data.name).toBe("LODENE Cergy");
    await request(app)
      .patch(`/api/agencies/${agency.body.data.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ phone: "0100000000" })
      .expect(200)
      .expect(({ body }) => expect(body.data.phone).toBe("0100000000"));

    // Un moniteur ne peut ni créer un utilisateur ni une agence.
    const mon = await request(app)
      .post("/api/auth/login")
      .send({ email: "moniteur.test@loden-autoecole.fr", password: "moniteur-password" })
      .expect(200);
    await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${mon.body.token}`)
      .send({ firstName: "X", lastName: "Y", email: "x.y2@example.com", role: "SECRETAIRE" })
      .expect(403);
    await request(app)
      .post("/api/agencies")
      .set("Authorization", `Bearer ${mon.body.token}`)
      .send({ name: "Pirate", slug: "pirate" })
      .expect(403);

    // Véhicules : l'admin crée ; le moniteur peut consulter mais pas créer.
    const vehicle = await request(app)
      .post("/api/vehicles")
      .set("Authorization", `Bearer ${token}`)
      .send({ label: "Clio Test", transmission: "MANUEL", registration: "AA-123-BB" })
      .expect(201);
    expect(vehicle.body.data.label).toBe("Clio Test");
    await request(app).get("/api/vehicles").set("Authorization", `Bearer ${mon.body.token}`).expect(200);
    await request(app)
      .post("/api/vehicles")
      .set("Authorization", `Bearer ${mon.body.token}`)
      .send({ label: "Pirate", transmission: "MANUEL" })
      .expect(403);
  });

  it("gère les factures : numérotation séquentielle, immutabilité, transitions, autorité des totaux, RBAC", async () => {
    const { app } = testApp();
    const admin = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@loden-autoecole.fr", password: "admin-password" })
      .expect(200);
    const token = admin.body.token as string;
    const clientUserId = admin.body.user.id as string;
    const bearer = `Bearer ${token}`;

    // 1. Création brouillon : totaux dérivés serveur, pas de numéro. Le total envoyé est ignoré.
    const draft = await request(app)
      .post("/api/invoices")
      .set("Authorization", bearer)
      .send({ clientUserId, totalCents: 999999, lines: [{ label: "Forfait conduite", quantity: 2, unitAmountCents: 5000, vatRate: 20 }] })
      .expect(201);
    expect(draft.body.data.number).toBeNull();
    expect(draft.body.data.status).toBe("BROUILLON");
    expect(draft.body.data.subtotalCents).toBe(10000);
    expect(draft.body.data.vatCents).toBe(2000);
    expect(draft.body.data.totalCents).toBe(12000);
    const id1 = draft.body.data.id as string;

    // 2. Émission : numéro FAC-AAAA-NNNNNN + snapshot émetteur.
    const issued = await request(app).post(`/api/invoices/${id1}/issue`).set("Authorization", bearer).expect(200);
    expect(issued.body.data.number).toMatch(/^FAC-\d{4}-\d{6}$/);
    expect(issued.body.data.status).toBe("EMISE");
    expect(issued.body.data.issuedAt).toBeTruthy();
    const n1 = Number(String(issued.body.data.number).slice(-6));

    // 3. Séquence sans rupture.
    const draft2 = await request(app)
      .post("/api/invoices")
      .set("Authorization", bearer)
      .send({ clientUserId, lines: [{ label: "Code", quantity: 1, unitAmountCents: 3000 }] })
      .expect(201);
    const issued2 = await request(app).post(`/api/invoices/${draft2.body.data.id}/issue`).set("Authorization", bearer).expect(200);
    expect(Number(String(issued2.body.data.number).slice(-6))).toBe(n1 + 1);

    // 4. Immutabilité + paiement.
    await request(app).patch(`/api/invoices/${id1}`).set("Authorization", bearer).send({ lines: [{ label: "X", quantity: 1, unitAmountCents: 1 }] }).expect(409);
    const paid = await request(app).patch(`/api/invoices/${id1}`).set("Authorization", bearer).send({ status: "PAYEE" }).expect(200);
    expect(paid.body.data.paidAt).toBeTruthy();

    // 5. Transition invalide : PAYEE sur un brouillon.
    const draft3 = await request(app)
      .post("/api/invoices")
      .set("Authorization", bearer)
      .send({ clientUserId, lines: [{ label: "Acompte", quantity: 1, unitAmountCents: 4000 }] })
      .expect(201);
    await request(app).patch(`/api/invoices/${draft3.body.data.id}`).set("Authorization", bearer).send({ status: "PAYEE" }).expect(409);

    // 6. Annulation conserve le numéro.
    const cancelled = await request(app).patch(`/api/invoices/${id1}`).set("Authorization", bearer).send({ status: "ANNULEE" }).expect(200);
    expect(cancelled.body.data.number).toBe(issued.body.data.number);

    // 7. Suppression d'un brouillon OK ; suppression d'une émise refusée.
    await request(app).delete(`/api/invoices/${draft3.body.data.id}`).set("Authorization", bearer).expect(204);
    await request(app).delete(`/api/invoices/${id1}`).set("Authorization", bearer).expect(409);

    // 8. RBAC : un moniteur (sans invoices.*) ne lit ni ne crée.
    const mon = await request(app)
      .post("/api/auth/login")
      .send({ email: "moniteur.test@loden-autoecole.fr", password: "moniteur-password" })
      .expect(200);
    await request(app).get("/api/invoices").set("Authorization", `Bearer ${mon.body.token}`).expect(403);
    await request(app)
      .post("/api/invoices")
      .set("Authorization", `Bearer ${mon.body.token}`)
      .send({ clientUserId, lines: [{ label: "X", quantity: 1, unitAmountCents: 1 }] })
      .expect(403);
  });

  it("gère les devis : numérotation, envoi (snapshot), transitions, RBAC", async () => {
    const { app } = testApp();
    const admin = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@loden-autoecole.fr", password: "admin-password" })
      .expect(200);
    const token = admin.body.token as string;
    const clientUserId = admin.body.user.id as string;
    const bearer = `Bearer ${token}`;

    const draft = await request(app)
      .post("/api/quotes")
      .set("Authorization", bearer)
      .send({ clientUserId, lines: [{ label: "Forfait Permis B", quantity: 1, unitAmountCents: 119000, vatRate: 0 }] })
      .expect(201);
    expect(draft.body.data.number).toBeNull();
    expect(draft.body.data.status).toBe("BROUILLON");
    expect(draft.body.data.totalCents).toBe(119000);
    const qid = draft.body.data.id as string;

    // Envoi : numéro DEV-AAAA-NNNNNN + snapshot.
    const sent = await request(app).post(`/api/quotes/${qid}/send`).set("Authorization", bearer).expect(200);
    expect(sent.body.data.number).toMatch(/^DEV-\d{4}-\d{6}$/);
    expect(sent.body.data.status).toBe("ENVOYE");

    // Transition invalide : accepter un brouillon.
    const draft2 = await request(app)
      .post("/api/quotes")
      .set("Authorization", bearer)
      .send({ clientUserId, lines: [{ label: "Code", quantity: 1, unitAmountCents: 3000 }] })
      .expect(201);
    await request(app).patch(`/api/quotes/${draft2.body.data.id}`).set("Authorization", bearer).send({ status: "ACCEPTE" }).expect(409);

    const editedDraft = await request(app)
      .patch(`/api/quotes/${draft2.body.data.id}`)
      .set("Authorization", bearer)
      .send({
        lines: [{ label: "Code + accompagnement", quantity: 2, unitAmountCents: 4500, vatRate: 0 }],
        notes: "Devis ajusté avant envoi.",
        validUntil: null
      })
      .expect(200);
    expect(editedDraft.body.data.totalCents).toBe(9000);
    expect(editedDraft.body.data.notes).toBe("Devis ajusté avant envoi.");
    expect(editedDraft.body.data.validUntil).toBeNull();

    // Devis envoyé : acceptation OK, lignes figées.
    await request(app).patch(`/api/quotes/${qid}`).set("Authorization", bearer).send({ lines: [{ label: "X", quantity: 1, unitAmountCents: 1 }] }).expect(409);
    const accepted = await request(app).patch(`/api/quotes/${qid}`).set("Authorization", bearer).send({ status: "ACCEPTE" }).expect(200);
    expect(accepted.body.data.status).toBe("ACCEPTE");

    // RBAC : un moniteur ne lit ni ne crée de devis.
    const mon = await request(app)
      .post("/api/auth/login")
      .send({ email: "moniteur.test@loden-autoecole.fr", password: "moniteur-password" })
      .expect(200);
    await request(app).get("/api/quotes").set("Authorization", `Bearer ${mon.body.token}`).expect(403);
  });

  it("gère les contrats : numérotation à l'activation, transitions, RBAC", async () => {
    const { app } = testApp();
    const admin = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@loden-autoecole.fr", password: "admin-password" })
      .expect(200);
    const token = admin.body.token as string;
    const clientUserId = admin.body.user.id as string;
    const bearer = `Bearer ${token}`;

    const draft = await request(app)
      .post("/api/contracts")
      .set("Authorization", bearer)
      .send({ clientUserId, title: "Contrat permis B", body: "Conditions générales de la formation au permis B.", totalCents: 119000 })
      .expect(201);
    expect(draft.body.data.number).toBeNull();
    expect(draft.body.data.status).toBe("BROUILLON");
    const cid = draft.body.data.id as string;

    const active = await request(app).post(`/api/contracts/${cid}/activate`).set("Authorization", bearer).expect(200);
    expect(active.body.data.number).toMatch(/^CTR-\d{4}-\d{6}$/);
    expect(active.body.data.status).toBe("ACTIF");
    expect(active.body.data.signedAt).toBeTruthy();

    // Contrat actif : corps figé, mais résiliation possible.
    await request(app).patch(`/api/contracts/${cid}`).set("Authorization", bearer).send({ body: "Contenu modifié après activation du contrat." }).expect(409);
    const cancelled = await request(app).patch(`/api/contracts/${cid}`).set("Authorization", bearer).send({ status: "RESILIE" }).expect(200);
    expect(cancelled.body.data.number).toBe(active.body.data.number);

    const mon = await request(app)
      .post("/api/auth/login")
      .send({ email: "moniteur.test@loden-autoecole.fr", password: "moniteur-password" })
      .expect(200);
    await request(app).get("/api/contracts").set("Authorization", `Bearer ${mon.body.token}`).expect(403);
  });

  it("gère les automatisations : CRUD, moteur (lead → exécution), activation, RBAC", async () => {
    const { app, repository } = testApp();
    const admin = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@loden-autoecole.fr", password: "admin-password" })
      .expect(200);
    const bearer = `Bearer ${admin.body.token}`;

    // Création d'une règle active : nouveau lead → email de bienvenue.
    const created = await request(app)
      .post("/api/automations")
      .set("Authorization", bearer)
      .send({ name: "Accueil prospects", trigger: "LEAD_CREATED", action: "SEND_WELCOME_EMAIL" })
      .expect(201);
    expect(created.body.data.active).toBe(true);
    expect(created.body.data.runCount).toBe(0);
    const ruleId = created.body.data.id as string;

    // Filtre par déclencheur.
    const list = await request(app).get("/api/automations").query({ trigger: "LEAD_CREATED" }).set("Authorization", bearer).expect(200);
    expect(list.body.data.some((r: { id: string }) => r.id === ruleId)).toBe(true);

    // Le moteur s'exécute à la création d'un lead (best-effort → on attend l'incrément).
    await request(app)
      .post("/api/leads")
      .set("Authorization", bearer)
      .send({ fullName: "Test Prospect", email: "prospect@example.com", phone: "0612345678" })
      .expect(201);
    let ran = false;
    for (let i = 0; i < 25 && !ran; i += 1) {
      const rule = await repository.findAutomationRuleById(ruleId);
      if (rule && rule.runCount >= 1) ran = true;
      else await new Promise((resolve) => setTimeout(resolve, 10));
    }
    expect(ran).toBe(true);

    // Désactivation : aucune nouvelle exécution.
    await request(app).patch(`/api/automations/${ruleId}`).set("Authorization", bearer).send({ active: false }).expect(200);
    const runsBefore = (await repository.findAutomationRuleById(ruleId))?.runCount ?? 0;
    await request(app)
      .post("/api/leads")
      .set("Authorization", bearer)
      .send({ fullName: "Autre Prospect", email: "autre@example.com", phone: "0612345679" })
      .expect(201);
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect((await repository.findAutomationRuleById(ruleId))?.runCount).toBe(runsBefore);

    // Suppression.
    await request(app).delete(`/api/automations/${ruleId}`).set("Authorization", bearer).expect(204);
    expect(await repository.findAutomationRuleById(ruleId)).toBeNull();

    // RBAC : un moniteur (sans automations.*) ne lit ni ne gère.
    const mon = await request(app)
      .post("/api/auth/login")
      .send({ email: "moniteur.test@loden-autoecole.fr", password: "moniteur-password" })
      .expect(200);
    await request(app).get("/api/automations").set("Authorization", `Bearer ${mon.body.token}`).expect(403);
    await request(app)
      .post("/api/automations")
      .set("Authorization", `Bearer ${mon.body.token}`)
      .send({ name: "Tentative", trigger: "LEAD_CREATED", action: "LOG" })
      .expect(403);
  });

  it("gère le CMS (pages/articles) : CRUD, publication, filtre par type, RBAC", async () => {
    const { app } = testApp();
    const admin = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@loden-autoecole.fr", password: "admin-password" })
      .expect(200);
    const bearer = `Bearer ${admin.body.token}`;

    const page = await request(app)
      .post("/api/content-entries")
      .set("Authorization", bearer)
      .send({ type: "PAGE", title: "Mentions légales", slug: "mentions-legales", body: "Contenu des mentions légales de l'auto-école." })
      .expect(201);
    expect(page.body.data.type).toBe("PAGE");
    expect(page.body.data.published).toBe(false);
    const pid = page.body.data.id as string;

    await request(app)
      .post("/api/content-entries")
      .set("Authorization", bearer)
      .send({ type: "ARTICLE", title: "Bienvenue", slug: "bienvenue", excerpt: "Premier article", body: "Bienvenue sur le blog LODENE et merci de nous suivre." })
      .expect(201);

    // Filtre par type.
    const pages = await request(app).get("/api/content-entries").query({ type: "PAGE" }).set("Authorization", bearer).expect(200);
    expect(pages.body.data.every((e: { type: string }) => e.type === "PAGE")).toBe(true);

    // Publication.
    const published = await request(app).patch(`/api/content-entries/${pid}`).set("Authorization", bearer).send({ published: true }).expect(200);
    expect(published.body.data.published).toBe(true);
    expect(published.body.data.publishedAt).toBeTruthy();

    // Suppression.
    await request(app).delete(`/api/content-entries/${pid}`).set("Authorization", bearer).expect(204);

    // RBAC : un moniteur (sans content.manage) ne gère pas le contenu.
    const mon = await request(app)
      .post("/api/auth/login")
      .send({ email: "moniteur.test@loden-autoecole.fr", password: "moniteur-password" })
      .expect(200);
    await request(app).get("/api/content-entries").set("Authorization", `Bearer ${mon.body.token}`).expect(403);
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

  it("lets moderators create a directly published review", async () => {
    const { app } = testApp();

    const student = await request(app)
      .post("/api/auth/register")
      .send({
        firstName: "Nora",
        lastName: "Student",
        email: "nora.student@example.com",
        password: "super-password",
        formationId: "formation-permis-b-manuel"
      })
      .expect(201);

    await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${student.body.token}`)
      .send({
        rating: 5,
        comment: "Tentative de publication directe par un élève.",
        status: "PUBLIE"
      })
      .expect(403);

    const admin = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@loden-autoecole.fr", password: "admin-password" })
      .expect(200);

    await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${admin.body.token}`)
      .send({
        rating: 5,
        comment: "Avis réel publié directement depuis le CRM.",
        status: "PUBLIE"
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body.data.status).toBe("PUBLIE");
        expect(body.data.publishedAt).toBeTruthy();
      });

    await request(app)
      .get("/api/reviews")
      .expect(200)
      .expect(({ body }) => {
        expect(body.data.some((review: { comment: string }) => review.comment === "Avis réel publié directement depuis le CRM.")).toBe(true);
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

  it("serves a useful public chatbot fallback when the AI provider is not configured", async () => {
    const { app } = testApp(disabledAi);

    await request(app)
      .post("/api/ai/chat")
      .send({ messages: [{ role: "user", content: "Quel est le prix du permis B ?" }] })
      .expect(200)
      .expect(({ body }) => {
        expect(body.data.mode).toBe("fallback");
        expect(body.data.reply).toContain("Permis B automatique");
        expect(body.data.reply).toContain("924");
      });
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
