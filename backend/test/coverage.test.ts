import request from "supertest";
import type { Express } from "express";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { loadConfig } from "../src/config/env";
import { MemoryLodenRepository } from "../src/repositories/memory-loden-repository";

function testApp() {
  const config = loadConfig({
    NODE_ENV: "test",
    JWT_SECRET: "test-secret-with-enough-length",
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

describe("Couverture API complémentaire", () => {
  it("expose le catalogue public (formations + packs)", async () => {
    const app = testApp();
    const formations = await request(app).get("/api/formations").expect(200);
    expect(Array.isArray(formations.body.data)).toBe(true);
    const plans = await request(app).get("/api/pricing-plans").expect(200);
    expect(Array.isArray(plans.body.data)).toBe(true);
  });

  it("permet à un admin de trier une demande de contact (proxy/route status)", async () => {
    const app = testApp();
    const created = await request(app)
      .post("/api/contact-requests")
      .send({
        fullName: "Jean Test",
        email: "jean.test@example.com",
        type: "INFORMATION",
        message: "Bonjour, je voudrais des informations sur le permis B."
      })
      .expect(201);
    const id = created.body.data.id as string;

    const token = await adminToken(app);
    const updated = await request(app)
      .patch(`/api/contact-requests/${id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "EN_COURS" })
      .expect(200);
    expect(updated.body.data.status).toBe("EN_COURS");
  });

  it("refuse le triage des contacts à un élève (RBAC)", async () => {
    const app = testApp();
    const reg = await request(app)
      .post("/api/auth/register")
      .send({ firstName: "El", lastName: "Eve", email: "eleve.contact@example.com", password: "eleve-password-1" })
      .expect(201);
    const created = await request(app)
      .post("/api/contact-requests")
      .send({ fullName: "X Y", email: "x.y@example.com", type: "INFORMATION", message: "Un message de test suffisamment long." })
      .expect(201);

    await request(app)
      .patch(`/api/contact-requests/${created.body.data.id}/status`)
      .set("Authorization", `Bearer ${reg.body.token}`)
      .send({ status: "EN_COURS" })
      .expect(403);
  });
});
