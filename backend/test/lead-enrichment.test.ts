import request from "supertest";
import { describe, expect, it } from "vitest";
import { publicTools } from "../src/ai/tools";
import type { ToolContext } from "../src/ai/tools";
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
  return { app: createApp(repository, config), repository, config };
}

describe("enrichissement Lead + flow CPF (prise de RDV chatbot)", () => {
  it("structure le prospect (prénom/nom/consentements) et crée une tâche de vérification CPF", async () => {
    const { app, repository } = build();
    const availability = await request(app).get("/api/appointments/availability");
    const slot = availability.body.data[0];

    const booking = await request(app)
      .post("/api/chat/appointment")
      .send({
        slotId: slot.id,
        formation: "Permis B automatique",
        objective: "Utiliser mon CPF",
        firstName: "Camille",
        lastName: "Durand",
        phone: "0612345678",
        email: "camille.cpf@example.com",
        consentContact: true,
        consentWhatsApp: true,
        conversation: [{ role: "user", content: "Puis-je financer avec mon CPF ?" }]
      });
    expect(booking.status).toBe(201);

    const lead = (await repository.listLeads()).find((l) => l.email === "camille.cpf@example.com")!;
    expect(lead.firstName).toBe("Camille");
    expect(lead.lastName).toBe("Durand");
    expect(lead.financingType).toBe("CPF");
    expect(lead.consentEmail).toBe(true);
    expect(lead.consentWhatsapp).toBe(true);

    const tasks = await repository.listChatTasks({ leadId: lead.id });
    // Confirmation du RDV + vérification CPF prudente
    expect(tasks.some((t) => t.type === "CONFIRMATION")).toBe(true);
    const cpfTask = tasks.find((t) => /CPF/i.test(t.note));
    expect(cpfTask).toBeTruthy();
    expect(cpfTask!.note.toLowerCase()).toContain("ne pas promettre");
  });
});

describe("flow entreprise (/api/chat/lead)", () => {
  it("déduit le financement ENTREPRISE, stocke le nombre de salariés et crée une tâche devis", async () => {
    const { app, repository } = build();
    const res = await request(app)
      .post("/api/chat/lead")
      .send({
        formation: "Formation entreprise",
        objective: "Obtenir un devis",
        firstName: "Sonia",
        lastName: "Martin",
        phone: "0788990011",
        email: "sonia.entreprise@example.com",
        companySize: 12,
        consentContact: true
      });
    expect(res.status).toBe(201);

    const lead = (await repository.listLeads()).find((l) => l.email === "sonia.entreprise@example.com")!;
    expect(lead.financingType).toBe("ENTREPRISE");
    expect(lead.notes).toContain("12");

    const tasks = await repository.listChatTasks({ leadId: lead.id });
    const devisTask = tasks.find((t) => /salari/i.test(t.note));
    expect(devisTask).toBeTruthy();
    expect(devisTask!.priority).toBe("HAUTE");
  });
});

describe("outil create_lead — structuration du prospect", () => {
  it("scinde le nom complet et conserve le type de financement", async () => {
    const { repository, config } = build();
    const ctx: ToolContext = { repository, config, scope: "public", aiProvider: undefined };
    const tool = publicTools.find((t) => t.def.function.name === "create_lead")!;

    const out = (await tool.handler(
      { fullName: "Jean Petit", email: "jean.petit@example.com", financingType: "CPF" },
      ctx
    )) as { ok: boolean };
    expect(out.ok).toBe(true);

    const lead = (await repository.listLeads()).find((l) => l.email === "jean.petit@example.com")!;
    expect(lead.firstName).toBe("Jean");
    expect(lead.lastName).toBe("Petit");
    expect(lead.financingType).toBe("CPF");
  });
});
