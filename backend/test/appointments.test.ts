import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import type { Express } from "express";
import { createApp } from "../src/app";
import { loadConfig } from "../src/config/env";
import { MemoryLodenRepository } from "../src/repositories/memory-loden-repository";

function buildApp() {
  const config = loadConfig({
    NODE_ENV: "test",
    JWT_SECRET: "test-secret-with-enough-length",
    JWT_EXPIRES_IN: "1h",
    CORS_ORIGIN: "http://localhost:3000",
    API_USE_MEMORY: "true"
  });
  return createApp(new MemoryLodenRepository(), config);
}

async function adminToken(app: Express) {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email: "admin@loden-autoecole.fr", password: "admin-password" })
    .expect(200);
  return res.body.token as string;
}

function baseAppointment(overrides: Record<string, unknown> = {}) {
  return {
    source: "manual",
    type: "call",
    firstName: "Jean",
    lastName: "Dupont",
    phone: "0612345678",
    email: "jean.dupont@example.com",
    formation: "Permis B manuel",
    objective: "M'inscrire",
    startsAt: "2026-07-01T09:00:00.000Z",
    endsAt: "2026-07-01T09:30:00.000Z",
    ...overrides
  };
}

describe("Centre rendez-vous unifié", () => {
  let app: Express;
  let token: string;

  beforeEach(async () => {
    app = buildApp();
    token = await adminToken(app);
  });

  it("crée un RDV manuel et le place dans la bonne colonne Kanban", async () => {
    const created = await request(app)
      .post("/api/admin/appointments")
      .set("Authorization", `Bearer ${token}`)
      .send(baseAppointment())
      .expect(201);

    expect(created.body.data.source).toBe("manual");
    expect(created.body.data.status).toBe("confirmed");
    expect(created.body.data.kanbanColumn).toBe("confirme");
    expect(created.body.data.id).toBeTruthy();

    const kanban = await request(app)
      .get("/api/admin/appointments/kanban")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    const confirme = kanban.body.data.columns.find((c: { id: string }) => c.id === "confirme");
    expect(confirme.cards.some((card: { id: string }) => card.id === created.body.data.id)).toBe(true);
  });

  it("change le statut (drag Kanban) et trace l'historique", async () => {
    const created = await request(app)
      .post("/api/admin/appointments")
      .set("Authorization", `Bearer ${token}`)
      .send(baseAppointment())
      .expect(201);
    const id = created.body.data.id;

    await request(app)
      .patch(`/api/admin/appointments/${id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "to_follow_up" })
      .expect(200)
      .expect(({ body }) => {
        expect(body.data.status).toBe("to_follow_up");
        expect(body.data.kanbanColumn).toBe("relance");
      });

    const detail = await request(app)
      .get(`/api/admin/appointments/${id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    const actions = detail.body.data.history.map((h: { action: string }) => h.action);
    expect(actions).toContain("appointment.created");
    expect(actions).toContain("appointment.status");
  });

  it("refuse un conflit de conseiller sur le même créneau", async () => {
    const first = await request(app)
      .post("/api/admin/appointments")
      .set("Authorization", `Bearer ${token}`)
      .send(baseAppointment({ assignedToId: "user-admin" }))
      .expect(201);
    expect(first.body.data.assignedToId).toBe("user-admin");

    await request(app)
      .post("/api/admin/appointments")
      .set("Authorization", `Bearer ${token}`)
      .send(
        baseAppointment({
          assignedToId: "user-admin",
          firstName: "Autre",
          startsAt: "2026-07-01T09:15:00.000Z",
          endsAt: "2026-07-01T09:45:00.000Z"
        })
      )
      .expect(409)
      .expect(({ body }) => {
        expect(body.error.code).toBe("CONFLICT");
        expect(body.error.message).toMatch(/conseiller/i);
      });
  });

  it("replanifie un RDV et met à jour le créneau", async () => {
    const created = await request(app)
      .post("/api/admin/appointments")
      .set("Authorization", `Bearer ${token}`)
      .send(baseAppointment())
      .expect(201);

    await request(app)
      .patch(`/api/admin/appointments/${created.body.data.id}/reschedule`)
      .set("Authorization", `Bearer ${token}`)
      .send({ startsAt: "2026-07-02T14:00:00.000Z", endsAt: "2026-07-02T14:30:00.000Z" })
      .expect(200)
      .expect(({ body }) => {
        expect(body.data.startsAt).toBe("2026-07-02T14:00:00.000Z");
      });
  });

  it("transforme un prospect en élève et lie le RDV", async () => {
    const created = await request(app)
      .post("/api/admin/appointments")
      .set("Authorization", `Bearer ${token}`)
      .send(baseAppointment({ email: "future.eleve@example.com" }))
      .expect(201);

    const transformed = await request(app)
      .post(`/api/admin/appointments/${created.body.data.id}/transform-to-student`)
      .set("Authorization", `Bearer ${token}`)
      .send({})
      .expect(201);

    expect(transformed.body.data.student.id).toBeTruthy();
    expect(transformed.body.data.appointment.studentId).toBe(transformed.body.data.student.id);

    const detail = await request(app)
      .get(`/api/admin/appointments/${created.body.data.id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(detail.body.data.lead.status).toBe("INSCRIT");
  });

  it("annule (supprime) un RDV", async () => {
    const created = await request(app)
      .post("/api/admin/appointments")
      .set("Authorization", `Bearer ${token}`)
      .send(baseAppointment())
      .expect(201);

    await request(app)
      .delete(`/api/admin/appointments/${created.body.data.id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    await request(app)
      .get(`/api/admin/appointments/${created.body.data.id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(404);
  });

  it("agrège RDV et leçons dans la vue calendrier", async () => {
    await request(app)
      .post("/api/admin/appointments")
      .set("Authorization", `Bearer ${token}`)
      .send(baseAppointment({ startsAt: "2026-07-03T09:00:00.000Z", endsAt: "2026-07-03T09:30:00.000Z" }))
      .expect(201);

    const calendar = await request(app)
      .get("/api/admin/appointments/calendar")
      .query({ from: "2026-06-01T00:00:00.000Z", to: "2026-08-01T00:00:00.000Z" })
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(calendar.body.data.events.some((e: { kind: string }) => e.kind === "appointment")).toBe(true);
  });
});
