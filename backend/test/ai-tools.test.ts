import { beforeEach, describe, expect, it } from "vitest";
import { crmTools, publicTools } from "../src/ai/tools";
import type { ToolContext } from "../src/ai/tools";
import { loadConfig } from "../src/config/env";
import { MemoryLodenRepository } from "../src/repositories/memory-loden-repository";

const config = loadConfig({
  NODE_ENV: "test",
  JWT_SECRET: "test-secret-with-enough-length",
  CORS_ORIGIN: "http://localhost:3000",
  API_USE_MEMORY: "true"
});

const allTools = [...publicTools, ...crmTools];
const tool = (name: string) => allTools.find((t) => t.def.function.name === name)!;

let repository: MemoryLodenRepository;
let ctx: ToolContext;

beforeEach(() => {
  repository = new MemoryLodenRepository();
  // aiProvider volontairement absent : on vérifie aussi la dégradation gracieuse.
  ctx = { repository, config, scope: "crm", actorUserId: "demo-admin", aiProvider: undefined };
});

describe("outils CRM — permissions (RBAC)", () => {
  const expected: Record<string, string | undefined> = {
    search_knowledge: undefined,
    generate_whatsapp_link: undefined,
    create_quote_request: undefined,
    create_lead: undefined,
    find_lead: "leads.read",
    create_task: "leads.manage",
    update_lead_status: "leads.manage",
    score_lead: "leads.read",
    summarize_conversation: "dashboard.read",
    send_admin_email_alert: "leads.manage",
    find_student: "students.read",
    book_appointment: "bookings.manage"
  };
  it("chaque outil porte la permission attendue", () => {
    for (const [name, permission] of Object.entries(expected)) {
      expect(tool(name).permission).toBe(permission);
    }
  });
});

describe("create_quote_request → find_lead → create_task → update_lead_status", () => {
  it("crée un prospect + une tâche, puis le retrouve et le fait avancer", async () => {
    const created = (await tool("create_quote_request").handler(
      { fullName: "Test Devis", email: "test.devis@example.com", formation: "VTC", message: "2 personnes" },
      ctx
    )) as { ok: boolean };
    expect(created.ok).toBe(true);

    const leads = await repository.listLeads();
    const lead = leads.find((l) => l.email === "test.devis@example.com");
    expect(lead).toBeTruthy();
    expect(lead!.source).toBe("assistant-ia-devis");

    const tasks = await repository.listChatTasks({ leadId: lead!.id });
    expect(tasks.length).toBeGreaterThan(0);
    expect(tasks[0].note).toContain("devis");

    const found = (await tool("find_lead").handler({ query: "Test Devis" }, ctx)) as { leadId: string }[];
    expect(found[0]?.leadId).toBe(lead!.id);

    const task = (await tool("create_task").handler(
      { leadId: lead!.id, note: "Vérifier l'éligibilité CPF", type: "RELANCE", dueInDays: 3 },
      ctx
    )) as { ok: boolean; taskId: string };
    expect(task.ok).toBe(true);

    const updated = (await tool("update_lead_status").handler({ leadId: lead!.id, status: "CONTACTE" }, ctx)) as {
      ok: boolean;
    };
    expect(updated.ok).toBe(true);
    const after = (await repository.listLeads()).find((l) => l.id === lead!.id);
    expect(after!.status).toBe("CONTACTE");
  });

  it("update_lead_status renvoie une erreur propre sur un id inconnu", async () => {
    const res = (await tool("update_lead_status").handler({ leadId: "inexistant", status: "PERDU" }, ctx)) as {
      ok: boolean;
    };
    expect(res.ok).toBe(false);
  });
});

describe("generate_whatsapp_link", () => {
  it("génère un lien wa.me prérempli", async () => {
    const res = (await tool("generate_whatsapp_link").handler(
      { fullName: "Alex", formation: "Permis B", date: "lundi", time: "10h" },
      ctx
    )) as { url: string; message: string };
    expect(res.url).toContain("wa.me");
    expect(res.message).toContain("Permis B");
  });
});

describe("dégradation gracieuse sans IA / sans email", () => {
  it("score_lead renvoie une erreur claire quand l'IA est indisponible", async () => {
    const res = (await tool("score_lead").handler({ fullName: "X", interest: "VTC" }, ctx)) as { error?: string };
    expect(res.error).toBeTruthy();
  });

  it("summarize_conversation renvoie une erreur claire quand l'IA est indisponible", async () => {
    const res = (await tool("summarize_conversation").handler({ text: "Bonjour, je veux le permis B." }, ctx)) as {
      error?: string;
    };
    expect(res.error).toBeTruthy();
  });

  it("send_admin_email_alert échoue proprement sans adresse configurée", async () => {
    const res = (await tool("send_admin_email_alert").handler({ subject: "Urgent", body: "Prospect chaud" }, ctx)) as {
      ok: boolean;
    };
    expect(res.ok).toBe(false);
  });
});
