import request from "supertest";
import { describe, expect, it } from "vitest";
import { sanitizeAiOutput } from "../src/ai/safety";
import { createApp } from "../src/app";
import { loadConfig } from "../src/config/env";
import { MemoryLodenRepository } from "../src/repositories/memory-loden-repository";

const config = loadConfig({
  NODE_ENV: "test",
  JWT_SECRET: "test-secret-with-enough-length",
  CORS_ORIGIN: "http://localhost:3000",
  API_USE_MEMORY: "true"
});

const MASK = "[information masquée]";

describe("sanitizeAiOutput — filtre anti-fuite", () => {
  it("masque les clés API (OpenAI, Groq, Stripe)", () => {
    expect(sanitizeAiOutput("clé: sk-abcdef0123456789")).toContain(MASK);
    expect(sanitizeAiOutput("clé: gsk_abcdef0123456789")).toContain(MASK);
    expect(sanitizeAiOutput("clé: sk_live_abcd12345678")).toContain(MASK);
  });

  it("masque les JWT, chaînes de connexion, accès env et VAR=secret", () => {
    expect(sanitizeAiOutput("token eyJhbGciOi.eyJzdWIiOi.abcDEF1234")).toContain(MASK);
    expect(sanitizeAiOutput("db postgres://user:pass@host:5432/loden")).toContain(MASK);
    expect(sanitizeAiOutput("regarde process.env.GROQ_API_KEY")).toContain(MASK);
    const varLeak = sanitizeAiOutput("GROQ_API_KEY=secretvalue123");
    expect(varLeak).toContain(MASK);
    expect(varLeak).not.toContain("secretvalue123");
  });

  it("masque les clés privées PEM", () => {
    const pem = "-----BEGIN PRIVATE KEY-----\nMIIabc\n-----END PRIVATE KEY-----";
    expect(sanitizeAiOutput(pem)).toBe(MASK);
  });

  it("masque la valeur réelle d'un secret de configuration", () => {
    const out = sanitizeAiOutput(`le secret interne est ${config.JWT_SECRET}`, config);
    expect(out).not.toContain(config.JWT_SECRET);
    expect(out).toContain(MASK);
  });

  it("ne touche pas au contenu public légitime (email, téléphone)", () => {
    const text = "Contactez LODENE au 06 60 32 50 87 ou par email à ae@lodene.fr.";
    expect(sanitizeAiOutput(text, config)).toBe(text);
  });
});

describe("filtre appliqué au chatbot public (fallback inclus)", () => {
  it("le endpoint /api/chat/message renvoie une réponse (filtrée) sans planter", async () => {
    const repository = new MemoryLodenRepository();
    const app = createApp(repository, config);
    const res = await request(app)
      .post("/api/chat/message")
      .send({ messages: [{ role: "user", content: "Bonjour, quels sont vos tarifs ?" }] });
    expect(res.status).toBe(200);
    expect(typeof res.body.data.reply).toBe("string");
    expect(res.body.data.reply).not.toContain(MASK); // réponse légitime, rien masqué
  });
});

describe("déduplication des leads (chatbot)", () => {
  it("ne crée pas de doublon pour un même email et met à jour le prospect existant", async () => {
    const repository = new MemoryLodenRepository();
    const app = createApp(repository, config);

    const first = await request(app).post("/api/chat/lead").send({
      formation: "VTC",
      objective: "Obtenir un devis",
      firstName: "Léa",
      lastName: "Bernard",
      phone: "0612345678",
      email: "dup@example.com",
      consentContact: true
    });
    expect(first.status).toBe(201);

    const second = await request(app).post("/api/chat/lead").send({
      formation: "Permis B automatique",
      objective: "Utiliser mon CPF",
      firstName: "Léa",
      lastName: "Bernard",
      phone: "0612345678",
      email: "dup@example.com",
      consentContact: true
    });
    expect(second.status).toBe(201);

    const leads = (await repository.listLeads()).filter((l) => l.email === "dup@example.com");
    expect(leads.length).toBe(1);
    // Mis à jour avec la dernière demande
    expect(leads[0].financingType).toBe("CPF");
    expect(leads[0].interest).toBe("Permis B automatique");
  });
});
