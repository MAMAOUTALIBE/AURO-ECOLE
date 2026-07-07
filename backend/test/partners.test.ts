import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { loadConfig } from "../src/config/env";
import { MemoryLodenRepository } from "../src/repositories/memory-loden-repository";

// Espace partenaire (prescripteur) piloté par le CRM : chaîne complète
// création CRM → connexion partenaire → soumission de prospect (attribution) →
// commission → contrôles RBAC.

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

async function adminToken(app: ReturnType<typeof testApp>) {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email: "admin@loden-autoecole.fr", password: "admin-password" })
    .expect(200);
  return res.body.token as string;
}

describe("Partenaires prescripteurs", () => {
  it("crée un partenaire, provisionne son compte, et attribue les prospects apportés", async () => {
    const app = testApp();
    const admin = await adminToken(app);

    // 1. Le CRM crée un partenaire avec un compte de connexion.
    const created = await request(app)
      .post("/api/partners")
      .set("Authorization", `Bearer ${admin}`)
      .send({
        companyName: "CFA Test",
        contactName: "Marie Martin",
        email: "partenaire@example.com",
        commissionType: "FLAT",
        commissionValue: 5000
      })
      .expect(201);

    const partnerId = created.body.data.id as string;
    const tempPassword = created.body.data.temporaryPassword as string;
    expect(partnerId).toBeTruthy();
    expect(tempPassword).toBeTruthy();

    // 2. Le partenaire se connecte avec le mot de passe temporaire.
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "partenaire@example.com", password: tempPassword })
      .expect(200);
    const partnerJwt = login.body.token as string;
    expect(login.body.user.role).toBe("PARTENAIRE");

    // 3. GET /me renvoie son profil.
    const me = await request(app).get("/api/partners/me").set("Authorization", `Bearer ${partnerJwt}`).expect(200);
    expect(me.body.data.companyName).toBe("CFA Test");

    // 4. Il recommande un candidat → Lead attribué (source=partner, partnerId).
    const lead = await request(app)
      .post("/api/partners/me/leads")
      .set("Authorization", `Bearer ${partnerJwt}`)
      .send({ fullName: "Nouveau Candidat", email: "candidat@example.com", phone: "0600000000" })
      .expect(201);
    expect(lead.body.data.source).toBe("partner");
    expect(lead.body.data.partnerId).toBe(partnerId);

    // 5. Il ne voit QUE ses propres prospects.
    const myLeads = await request(app).get("/api/partners/me/leads").set("Authorization", `Bearer ${partnerJwt}`).expect(200);
    expect(myLeads.body.data).toHaveLength(1);

    // 6. Le CRM voit le lead attribué dans le détail partenaire.
    const detail = await request(app).get(`/api/partners/${partnerId}`).set("Authorization", `Bearer ${admin}`).expect(200);
    expect(detail.body.data.leads).toHaveLength(1);

    // 7. Commission : création (ESTIMEE) puis validation par le CRM.
    const commission = await request(app)
      .post(`/api/partners/${partnerId}/commissions`)
      .set("Authorization", `Bearer ${admin}`)
      .send({ amount: 5000, leadId: lead.body.data.id })
      .expect(201);
    expect(commission.body.data.status).toBe("ESTIMEE");

    const validated = await request(app)
      .patch(`/api/partners/${partnerId}/commissions/${commission.body.data.id}`)
      .set("Authorization", `Bearer ${admin}`)
      .send({ status: "VALIDEE" })
      .expect(200);
    expect(validated.body.data.status).toBe("VALIDEE");

    const partnerCommissions = await request(app)
      .get("/api/partners/me/commissions")
      .set("Authorization", `Bearer ${partnerJwt}`)
      .expect(200);
    expect(partnerCommissions.body.data).toHaveLength(1);
  });

  it("rattache l'élève et génère la commission à la conversion d'un lead apporté", async () => {
    const app = testApp();
    const admin = await adminToken(app);

    const created = await request(app)
      .post("/api/partners")
      .set("Authorization", `Bearer ${admin}`)
      .send({ companyName: "CFA Conversion", email: "cfa-conv@example.com", commissionType: "FLAT", commissionValue: 5000 })
      .expect(201);
    const partnerId = created.body.data.id as string;
    const partnerJwt = (
      await request(app)
        .post("/api/auth/login")
        .send({ email: "cfa-conv@example.com", password: created.body.data.temporaryPassword })
        .expect(200)
    ).body.token as string;

    const lead = await request(app)
      .post("/api/partners/me/leads")
      .set("Authorization", `Bearer ${partnerJwt}`)
      .send({ fullName: "Candidat Converti", email: "converti@example.com" })
      .expect(201);

    // Le CRM convertit le lead en élève.
    const conversion = await request(app)
      .post(`/api/leads/${lead.body.data.id}/convert-to-student`)
      .set("Authorization", `Bearer ${admin}`)
      .expect(201);
    expect(conversion.body.data.studentId).toBeTruthy();

    // Commission ESTIMEE générée automatiquement selon le barème (5000 cents).
    const commissions = await request(app)
      .get("/api/partners/me/commissions")
      .set("Authorization", `Bearer ${partnerJwt}`)
      .expect(200);
    expect(commissions.body.data).toHaveLength(1);
    expect(commissions.body.data[0].amount).toBe(5000);
    expect(commissions.body.data[0].status).toBe("ESTIMEE");

    // L'élève est rattaché au partenaire (« mes apprenants »).
    const learners = await request(app)
      .get("/api/partners/me/students")
      .set("Authorization", `Bearer ${partnerJwt}`)
      .expect(200);
    expect(learners.body.data).toHaveLength(1);

    // Le CRM voit la commission dans la fiche partenaire.
    const detail = await request(app).get(`/api/partners/${partnerId}`).set("Authorization", `Bearer ${admin}`).expect(200);
    expect(detail.body.data.commissions).toHaveLength(1);
  });

  it("cloisonne les accès (RBAC)", async () => {
    const app = testApp();
    const admin = await adminToken(app);

    const created = await request(app)
      .post("/api/partners")
      .set("Authorization", `Bearer ${admin}`)
      .send({ companyName: "Garage Partenaire", email: "garage@example.com" })
      .expect(201);
    const partnerJwt = (
      await request(app)
        .post("/api/auth/login")
        .send({ email: "garage@example.com", password: created.body.data.temporaryPassword })
        .expect(200)
    ).body.token as string;

    // Le partenaire ne peut pas lister le référentiel CRM des partenaires.
    await request(app).get("/api/partners").set("Authorization", `Bearer ${partnerJwt}`).expect(403);

    // Un compte non-partenaire (admin) n'a pas de profil /me.
    await request(app).get("/api/partners/me").set("Authorization", `Bearer ${admin}`).expect(403);

    // Sans authentification : 401.
    await request(app).get("/api/partners/me").expect(401);
  });
});
