import request from "supertest";
import { describe, expect, it } from "vitest";
import { classifyIntent } from "../src/ai/intent";
import { createApp } from "../src/app";
import { loadConfig } from "../src/config/env";
import { MemoryLodenRepository } from "../src/repositories/memory-loden-repository";

function build() {
  const config = loadConfig({
    NODE_ENV: "test",
    JWT_SECRET: "test-secret-with-enough-length",
    CORS_ORIGIN: "http://localhost:3000",
    API_USE_MEMORY: "true"
  });
  const repository = new MemoryLodenRepository();
  return { app: createApp(repository, config), repository };
}

describe("classifyIntent (déterministe)", () => {
  it("détecte le permis B", () => {
    expect(classifyIntent("je veux passer le permis en boite automatique").intent).toBe("permis_b");
  });
  it("détecte le CPF", () => {
    expect(classifyIntent("est-ce que je peux utiliser mon CPF ?").intent).toBe("cpf_financement");
  });
  it("détecte le VTC", () => {
    expect(classifyIntent("formation chauffeur vtc").intent).toBe("vtc");
  });
  it("renvoie 'autre' avec confiance nulle si rien ne matche", () => {
    const r = classifyIntent("bonjour comment allez-vous");
    expect(r.intent).toBe("autre");
    expect(r.confidence).toBe(0);
  });
});

describe("persistance des conversations publiques (/api/chat/message)", () => {
  it("crée une conversation, renvoie un conversationId et persiste intent + lastMessage + messages", async () => {
    const { app, repository } = build();
    const res = await request(app)
      .post("/api/chat/message")
      .send({ messages: [{ role: "user", content: "Je veux passer le permis B en boîte automatique" }] });

    expect(res.status).toBe(200);
    const conversationId = res.body.data.conversationId as string;
    expect(conversationId).toBeTruthy();

    const conv = await repository.findChatConversationById(conversationId);
    expect(conv).toBeTruthy();
    expect(conv!.intent).toBe("permis_b");
    expect(conv!.lastMessage?.toLowerCase()).toContain("permis");
    // user + réponse assistant
    expect(conv!.messages.length).toBeGreaterThanOrEqual(2);
  });

  it("réutilise la conversation existante via conversationId (aucun doublon)", async () => {
    const { app, repository } = build();
    const first = await request(app)
      .post("/api/chat/message")
      .send({ messages: [{ role: "user", content: "Bonjour" }] });
    const conversationId = first.body.data.conversationId as string;

    const second = await request(app)
      .post("/api/chat/message")
      .send({
        messages: [
          { role: "user", content: "Bonjour" },
          { role: "assistant", content: "Bonjour, comment puis-je aider ?" },
          { role: "user", content: "Je veux un devis VTC" }
        ],
        conversationId
      });
    expect(second.body.data.conversationId).toBe(conversationId);

    const all = await repository.listChatConversations();
    expect(all.length).toBe(1);
    const conv = all[0];
    expect(conv.intent).toBe("vtc");
  });
});

describe("liaison de la conversation au RDV (/api/chat/appointment)", () => {
  it("relie la conversation existante au lead + RDV, sans créer de doublon", async () => {
    const { app, repository } = build();

    const msg = await request(app)
      .post("/api/chat/message")
      .send({ messages: [{ role: "user", content: "Je veux prendre rendez-vous pour le permis B" }] });
    const conversationId = msg.body.data.conversationId as string;

    const availability = await request(app).get("/api/appointments/availability");
    expect(availability.status).toBe(200);
    const slot = availability.body.data[0];
    expect(slot?.id).toBeTruthy();

    const booking = await request(app)
      .post("/api/chat/appointment")
      .send({
        slotId: slot.id,
        formation: "Permis B automatique",
        objective: "M'inscrire",
        firstName: "Camille",
        lastName: "Durand",
        phone: "0612345678",
        email: "camille.durand@example.com",
        consentContact: true,
        consentWhatsApp: false,
        conversationId
      });
    expect(booking.status).toBe(201);
    const leadId = booking.body.data.lead.id as string;
    const appointmentId = booking.body.data.appointment.id as string;

    const conversations = await repository.listChatConversations();
    expect(conversations.length).toBe(1);
    const conv = conversations[0];
    expect(conv.id).toBe(conversationId);
    expect(conv.leadId).toBe(leadId);
    expect(conv.appointmentId).toBe(appointmentId);
  });
});
