import request from "supertest";
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

describe("Gestion des erreurs HTTP", () => {
  it("répond 400 INVALID_JSON (et non 500) sur un corps JSON malformé", async () => {
    const app = testApp();
    const res = await request(app)
      .post("/api/contact-requests")
      .set("Content-Type", "application/json")
      .send("{ bad json")
      .expect(400);
    expect(res.body.error.code).toBe("INVALID_JSON");
  });
});
