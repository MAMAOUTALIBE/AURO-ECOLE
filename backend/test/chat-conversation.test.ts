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
  it("détecte les documents et les réclamations", () => {
    expect(classifyIntent("quels documents fournir pour mon dossier ?").intent).toBe("documents");
    expect(classifyIntent("j'ai un problème urgent avec mon rendez-vous").intent).toBe("reclamation");
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
    expect(res.body.data.intent).toBe("permis_b");
    expect(res.body.data.confidence).toBeGreaterThan(0);
    expect(res.body.data.summary).toContain("Permis B");
    expect(res.body.data.suggestions.some((suggestion: { label: string }) => suggestion.label === "Permis auto")).toBe(true);

    const conv = await repository.findChatConversationById(conversationId);
    expect(conv).toBeTruthy();
    expect(conv!.intent).toBe("permis_b");
    expect(conv!.summary).toContain("Intention détectée");
    expect(conv!.lastMessage?.toLowerCase()).toContain("permis");
    // user + réponse assistant
    expect(conv!.messages.length).toBeGreaterThanOrEqual(2);
  });

  it("renvoie des suggestions CPF actionnables sans provider IA", async () => {
    const { app } = build();
    const res = await request(app)
      .post("/api/chat/message")
      .send({ messages: [{ role: "user", content: "Je veux savoir si je peux utiliser mon CPF" }] });

    expect(res.status).toBe(200);
    expect(res.body.data.intent).toBe("cpf_financement");
    expect(res.body.data.suggestions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Vérifier CPF", kind: "flow", objective: "Utiliser mon CPF" })
      ])
    );
  });

  it("permet au CRM de marquer une conversation traitée puis ouverte", async () => {
    const { app, repository } = build();
    const created = await request(app)
      .post("/api/chat/message")
      .send({ messages: [{ role: "user", content: "Je veux être rappelé pour un devis" }] });
    const conversationId = created.body.data.conversationId as string;

    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@loden-autoecole.fr", password: "admin-password" })
      .expect(200);
    const token = login.body.token as string;

    const treated = await request(app)
      .patch(`/api/admin/chat-conversations/${conversationId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "TRAITEE" })
      .expect(200);
    expect(treated.body.data.status).toBe("TRAITEE");
    expect((await repository.findChatConversationById(conversationId))?.status).toBe("TRAITEE");

    const reopened = await request(app)
      .patch(`/api/admin/chat-conversations/${conversationId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "OUVERTE" })
      .expect(200);
    expect(reopened.body.data.status).toBe("OUVERTE");
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

  it("accepte une inscription Digital IA via le parcours rendez-vous classique", async () => {
    const { app } = build();

    const availability = await request(app).get("/api/appointments/availability");
    expect(availability.status).toBe(200);
    const slot = availability.body.data[0];
    expect(slot?.id).toBeTruthy();

    const booking = await request(app)
      .post("/api/chat/appointment")
      .send({
        slotId: slot.id,
        formation: "Digital IA",
        objective: "M'inscrire",
        firstName: "Aminata",
        lastName: "Diallo",
        phone: "0677889900",
        email: "aminata.diallo@example.com",
        message: "Je veux m'inscrire à la formation IA.",
        consentContact: true,
        consentWhatsApp: false
      })
      .expect(201);

    expect(booking.body.data.lead.interest).toBe("Digital IA");
    expect(booking.body.data.appointment.formation).toBe("Digital IA");
    expect(booking.body.data.appointment.objective).toBe("M'inscrire");
  });
});

describe("offre -50 € depuis l'assistant IA", () => {
  it("crée une fiche rendez-vous, une tâche de rappel et relie la conversation", async () => {
    const { app, repository } = build();

    const conversation = await request(app)
      .post("/api/chat/message")
      .send({ messages: [{ role: "user", content: "Je veux m'inscrire et récupérer le bon de 50 euros" }] })
      .expect(200);
    const conversationId = conversation.body.data.conversationId as string;

    const res = await request(app)
      .post("/api/offers/qr-50")
      .send({
        code: "LODENE50",
        fullName: "Nadia Benali",
        phone: "0611223344",
        email: "nadia.benali@example.com",
        formation: "PERMIS_B",
        delivery: "EMAIL",
        origin: "ASSISTANT_IA",
        consent: true,
        conversationId,
        conversation: [
          { role: "assistant", content: "Carte du bon de réduction -50 € proposée dans l'assistant LODENE." },
          { role: "user", content: "Demande du bon -50 € pour Permis B." }
        ]
      })
      .expect(201);

    expect(res.body.data.leadId).toBeTruthy();
    expect(res.body.data.appointmentId).toBeTruthy();
    expect(res.body.data.conversationId).toBe(conversationId);
    expect(res.body.data.voucherUrl).toContain("/offre-50/bon50.jpeg");

    const appointments = await repository.listChatAppointments({ source: "chatbot" });
    const appointment = appointments.find((item) => item.id === res.body.data.appointmentId);
    expect(appointment).toBeTruthy();
    expect(appointment!.fullName).toBe("Nadia Benali");
    expect(appointment!.formation).toBe("Permis B");
    expect(appointment!.objective).toBe("Récupérer le bon -50 €");
    expect(appointment!.notes).toContain("Canal: Assistant IA");

    const tasks = await repository.listChatTasks({ leadId: res.body.data.leadId });
    expect(tasks.some((task) => task.appointmentId === appointment!.id && task.type === "RELANCE")).toBe(true);

    const linked = await repository.findChatConversationById(conversationId);
    expect(linked?.leadId).toBe(res.body.data.leadId);
    expect(linked?.appointmentId).toBe(appointment!.id);
    expect(linked?.visitorName).toBe("Nadia Benali");
  });

  it("refuse le bon -50 € pour une autre formation que Permis B", async () => {
    const { app } = build();

    await request(app)
      .post("/api/offers/qr-50")
      .send({
        code: "LODENE50",
        fullName: "Client VTC",
        phone: "0699887766",
        email: "client.vtc@example.com",
        formation: "VTC",
        delivery: "EMAIL",
        consent: true
      })
      .expect(400);
  });
});
