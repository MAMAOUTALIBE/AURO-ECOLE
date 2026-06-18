import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

// On mocke le mailer pour capturer les emails (et donc les liens/token) sans
// envoi réel. vi.mock est hoisté avant l'import de createApp -> la route auth
// utilise bien cette implémentation.
const sentEmails: Array<{ to: string; subject: string; text: string }> = [];
vi.mock("../src/shared/mailer", () => ({
  sendEmail: async (_config: unknown, message: { to: string; subject: string; text: string }) => {
    sentEmails.push(message);
  },
  notifyNewLead: async () => {}
}));

import { createApp } from "../src/app";
import { loadConfig } from "../src/config/env";
import { MemoryLodenRepository } from "../src/repositories/memory-loden-repository";

function testApp() {
  const config = loadConfig({
    NODE_ENV: "test",
    JWT_SECRET: "test-secret-with-enough-length",
    JWT_EXPIRES_IN: "1h",
    CORS_ORIGIN: "http://localhost:3000",
    API_USE_MEMORY: "true"
  });
  const repository = new MemoryLodenRepository();
  return createApp(repository, config);
}

const baseUser = {
  firstName: "Test",
  lastName: "Reset",
  email: "test.reset@example.com",
  password: "initial-password-1"
};

function resetTokenFromEmails() {
  const email = sentEmails.find((e) => e.subject.includes("Réinitialisation"));
  return email?.text.match(/token=([a-f0-9]+)/)?.[1] ?? null;
}

function verifyTokenFromEmails() {
  const email = sentEmails.find((e) => e.subject.includes("Confirmez"));
  return email?.text.match(/token=([^\s]+)/)?.[1] ?? null;
}

describe("Flux mot de passe oublié / réinitialisation", () => {
  beforeEach(() => {
    sentEmails.length = 0;
  });

  it("réinitialise le mot de passe de bout en bout (forgot -> email -> reset -> login)", async () => {
    const app = testApp();
    await request(app).post("/api/auth/register").send(baseUser).expect(201);

    const forgot = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: baseUser.email })
      .expect(200);
    expect(forgot.body.ok).toBe(true);

    const token = resetTokenFromEmails();
    expect(token).toBeTruthy();

    await request(app)
      .post("/api/auth/reset-password")
      .send({ token, password: "brand-new-password-2" })
      .expect(200);

    // L'ancien mot de passe ne marche plus.
    await request(app)
      .post("/api/auth/login")
      .send({ email: baseUser.email, password: baseUser.password })
      .expect(401);

    // Le nouveau mot de passe fonctionne.
    await request(app)
      .post("/api/auth/login")
      .send({ email: baseUser.email, password: "brand-new-password-2" })
      .expect(200);
  });

  it("rend le token à usage unique (un 2e reset avec le même token échoue)", async () => {
    const app = testApp();
    await request(app).post("/api/auth/register").send(baseUser).expect(201);
    await request(app).post("/api/auth/forgot-password").send({ email: baseUser.email }).expect(200);
    const token = resetTokenFromEmails();

    await request(app).post("/api/auth/reset-password").send({ token, password: "first-reset-pass-1" }).expect(200);
    // Réutilisation du même token -> refusé.
    await request(app).post("/api/auth/reset-password").send({ token, password: "second-reset-pass-2" }).expect(400);
  });

  it("ne divulgue pas l'existence du compte et n'envoie rien pour un email inconnu", async () => {
    const app = testApp();
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "inconnu@example.com" })
      .expect(200);
    expect(res.body.ok).toBe(true);
    expect(sentEmails.find((e) => e.subject.includes("Réinitialisation"))).toBeUndefined();
  });

  it("refuse un token de réinitialisation invalide", async () => {
    const app = testApp();
    await request(app)
      .post("/api/auth/reset-password")
      .send({ token: "0".repeat(64), password: "whatever-pass-123" })
      .expect(400);
  });

  it("vérifie l'email via le token envoyé à l'inscription", async () => {
    const app = testApp();
    await request(app).post("/api/auth/register").send(baseUser).expect(201);

    const token = verifyTokenFromEmails();
    expect(token).toBeTruthy();

    const res = await request(app).post("/api/auth/verify-email").send({ token }).expect(200);
    expect(res.body.ok).toBe(true);
  });

  it("refuse une vérification d'email avec un token bidon", async () => {
    const app = testApp();
    await request(app)
      .post("/api/auth/verify-email")
      .send({ token: "not-a-valid-jwt-token" })
      .expect(400);
  });

  it("révoque les sessions ouvertes après une réinitialisation (tokenVersion)", async () => {
    const app = testApp();
    const registration = await request(app).post("/api/auth/register").send(baseUser).expect(201);
    const oldToken = registration.body.token as string;

    // Le token initial est valide.
    await request(app).get("/api/auth/me").set("Authorization", `Bearer ${oldToken}`).expect(200);

    // Réinitialisation du mot de passe -> incrémente tokenVersion.
    await request(app).post("/api/auth/forgot-password").send({ email: baseUser.email }).expect(200);
    const token = resetTokenFromEmails();
    await request(app).post("/api/auth/reset-password").send({ token, password: "rotated-password-9" }).expect(200);

    // L'ancien token (émis avant le reset) est désormais rejeté.
    await request(app).get("/api/auth/me").set("Authorization", `Bearer ${oldToken}`).expect(401);

    // Un login frais redonne un token valide.
    const relogin = await request(app)
      .post("/api/auth/login")
      .send({ email: baseUser.email, password: "rotated-password-9" })
      .expect(200);
    await request(app).get("/api/auth/me").set("Authorization", `Bearer ${relogin.body.token}`).expect(200);
  });
});
