import { beforeEach, describe, expect, it } from "vitest";
import { publicTools } from "../src/ai/tools";
import type { ToolContext } from "../src/ai/tools";
import { loadConfig } from "../src/config/env";
import { MemoryLodenRepository } from "../src/repositories/memory-loden-repository";

const config = loadConfig({
  NODE_ENV: "test",
  JWT_SECRET: "test-secret-with-enough-length",
  CORS_ORIGIN: "http://localhost:3000",
  API_USE_MEMORY: "true"
});

const tool = (name: string) => publicTools.find((t) => t.def.function.name === name)!;

let repository: MemoryLodenRepository;
let ctx: ToolContext;

beforeEach(() => {
  repository = new MemoryLodenRepository();
  ctx = { repository, config, scope: "public", aiProvider: undefined };
});

describe("outils de réservation conversationnelle", () => {
  it("get_appointment_slots renvoie des créneaux réels", async () => {
    const out = (await tool("get_appointment_slots").handler({}, ctx)) as { slots: { id: string; date: string; time: string }[] };
    expect(out.slots.length).toBeGreaterThan(0);
    expect(out.slots[0].id).toBeTruthy();
    expect(out.slots[0].time).toBeTruthy();
  });

  it("book_appointment_slot réserve réellement (lead + RDV + lien WhatsApp)", async () => {
    const slots = (await tool("get_appointment_slots").handler({}, ctx)) as { slots: { id: string }[] };
    const slotId = slots.slots[0].id;

    const res = (await tool("book_appointment_slot").handler(
      { slotId, fullName: "Marie Conversation", email: "marie.conv@example.com", phone: "0612345678", formation: "VTC", objective: "M'inscrire" },
      ctx
    )) as { ok: boolean; whatsappUrl?: string };
    expect(res.ok).toBe(true);
    expect(res.whatsappUrl).toContain("wa.me");

    const lead = (await repository.listLeads()).find((l) => l.email === "marie.conv@example.com");
    expect(lead).toBeTruthy();
    expect(lead!.firstName).toBe("Marie");
    expect(lead!.source).toBe("chatbot");

    const appts = await repository.listChatAppointments();
    const appt = appts.find((a) => a.email === "marie.conv@example.com");
    expect(appt).toBeTruthy();
    expect(appt!.status).toBe("pending_confirmation");

    const tasks = await repository.listChatTasks({ leadId: lead!.id });
    expect(tasks.some((t) => t.type === "CONFIRMATION")).toBe(true);
  });

  it("book_appointment_slot refuse proprement un créneau inexistant", async () => {
    const res = (await tool("book_appointment_slot").handler(
      { slotId: "creneau-inexistant", fullName: "Paul Test", email: "paul.test@example.com", phone: "0612345678" },
      ctx
    )) as { ok: boolean; error?: string };
    expect(res.ok).toBe(false);
    expect(res.error).toBeTruthy();
  });

  it("get_appointment_slots et book_appointment_slot sont publics (sans permission)", () => {
    expect(tool("get_appointment_slots").permission).toBeUndefined();
    expect(tool("book_appointment_slot").permission).toBeUndefined();
  });
});
