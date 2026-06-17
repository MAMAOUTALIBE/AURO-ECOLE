import { Prisma, PrismaClient } from "@prisma/client";

// Script de DÉMO CRM (idempotent) : peuple moniteurs, planning (réservations),
// paiements, pipeline (leads), examens, factures et devis — pour visualiser les
// modules du back-office. Tous les enregistrements ont un id préfixé `demo-crm-`
// et sont supprimés/recréés à chaque exécution (relançable sans doublon).
// Lancer : npx tsx --env-file=.env prisma/seed-demo-crm.ts

const prisma = new PrismaClient();

const DAY = 86_400_000;
const now = Date.now();
const at = (deltaDays: number, hour: number) => {
  const d = new Date(now + deltaDays * DAY);
  d.setHours(hour, 0, 0, 0);
  return d;
};

async function cleanup() {
  const idFilter = { id: { startsWith: "demo-crm-" } } as const;
  await prisma.booking.deleteMany({ where: idFilter });
  await prisma.exam.deleteMany({ where: idFilter });
  await prisma.payment.deleteMany({ where: idFilter });
  await prisma.invoice.deleteMany({ where: idFilter });
  await prisma.quote.deleteMany({ where: idFilter });
  await prisma.contract.deleteMany({ where: idFilter });
  await prisma.cpfRequest.deleteMany({ where: idFilter });
  await prisma.review.deleteMany({ where: idFilter });
  await prisma.lead.deleteMany({ where: idFilter });
  // Les avis référencent les moniteurs (onDelete SetNull) : on supprime les avis avant.
  await prisma.instructor.deleteMany({ where: idFilter });
  await prisma.user.deleteMany({ where: { id: { startsWith: "demo-crm-mon-u-" } } });
}

async function main() {
  await cleanup();

  const agency = await prisma.agency.findFirst({ select: { id: true } });
  const agencyId = agency?.id ?? null;
  const company = await prisma.companyInfo.findFirst();
  const students = await prisma.student.findMany({
    where: { user: { email: { endsWith: "lodene-demo.fr" } } },
    include: { user: true, formation: true },
    orderBy: { createdAt: "asc" }
  });
  if (students.length === 0) throw new Error("Aucun élève de démo — lance d'abord prisma/seed-demo-students.ts");

  // --- Moniteurs (User MONITEUR + Instructor) ---
  const MONITEURS = [
    { first: "Karim", last: "Haddad", specialties: ["Boîte manuelle", "Conduite accompagnée"] },
    { first: "Sophie", last: "Bernard", specialties: ["Boîte automatique", "Perfectionnement"] },
    { first: "Thomas", last: "Leroy", specialties: ["Code", "Stage accéléré"] }
  ];
  const instructorIds: string[] = [];
  for (let i = 0; i < MONITEURS.length; i++) {
    const m = MONITEURS[i];
    const userId = `demo-crm-mon-u-${i + 1}`;
    const instructorId = `demo-crm-instr-${i + 1}`;
    await prisma.user.create({
      data: {
        id: userId,
        email: `moniteur.demo${i + 1}@lodene-demo.fr`,
        firstName: m.first,
        lastName: m.last,
        phone: `06 66 00 0${i}`,
        role: "MONITEUR",
        status: "ACTIVE"
      }
    });
    await prisma.instructor.create({
      data: {
        id: instructorId,
        userId,
        agencyId,
        specialties: m.specialties,
        interventionZones: ["Conflans-Sainte-Honorine", "Andrésy"],
        ratingAverage: [4.8, 4.6, 4.9][i],
        ratingCount: [32, 21, 14][i],
        active: i !== 2
      }
    });
    instructorIds.push(instructorId);
  }

  // --- Planning : réservations (passées terminées + à venir) ---
  let bk = 0;
  const bookingCount = Math.min(10, students.length);
  for (let i = 0; i < bookingCount; i++) {
    const s = students[i];
    const instructorId = instructorIds[i % instructorIds.length];
    // Leçon passée (terminée)
    await prisma.booking.create({
      data: {
        id: `demo-crm-bk-${bk++}`,
        studentId: s.id,
        instructorId,
        formationId: s.formationId!,
        agencyId,
        startsAt: at(-(i + 2), 9),
        endsAt: at(-(i + 2), 11),
        status: "TERMINEE"
      }
    });
    // Leçon à venir (confirmée ou en attente)
    await prisma.booking.create({
      data: {
        id: `demo-crm-bk-${bk++}`,
        studentId: s.id,
        instructorId,
        formationId: s.formationId!,
        agencyId,
        startsAt: at(i + 1, 14),
        endsAt: at(i + 1, 16),
        status: i % 2 === 0 ? "CONFIRMEE" : "EN_ATTENTE"
      }
    });
  }

  // --- Paiements ---
  let pay = 0;
  const paymentCount = Math.min(12, students.length);
  for (let i = 0; i < paymentCount; i++) {
    const s = students[i];
    const amount = s.formation && s.formation.priceCents > 0 ? s.formation.priceCents : 90000;
    const paid = i % 4 !== 0; // 3/4 payés, 1/4 en attente
    await prisma.payment.create({
      data: {
        id: `demo-crm-pay-${pay++}`,
        userId: s.userId,
        kind: "FORMATION",
        status: paid ? "PAYE" : "EN_ATTENTE",
        amountCents: amount,
        currency: "EUR",
        agencyId,
        paidAt: paid ? at(-(i + 1), 10) : null
      }
    });
  }

  // --- Pipeline : leads ---
  const LEADS: { fullName: string; interest: string; status: string; temperature: string; score: number; value: number; source: string; followUp: number | null }[] = [
    { fullName: "Émilie Faure", interest: "Permis B automatique", status: "PROSPECT", temperature: "chaud", score: 82, value: 92400, source: "Site web", followUp: -1 },
    { fullName: "Karim Benali", interest: "Formation VTC", status: "CONTACTE", temperature: "tiede", score: 60, value: 249900, source: "Google Ads", followUp: 2 },
    { fullName: "Sandra Lopez", interest: "SST Initial (entreprise)", status: "RELANCE", temperature: "chaud", score: 75, value: 119000, source: "Réseaux sociaux", followUp: -2 },
    { fullName: "Mehdi Cherif", interest: "Chariots élévateurs R489", status: "DEVIS_ENVOYE", temperature: "chaud", score: 88, value: 150000, source: "Recommandation", followUp: 1 },
    { fullName: "Laura Petit", interest: "Permis B manuel", status: "PROSPECT", temperature: "tiede", score: 55, value: 134400, source: "Flyer", followUp: 3 },
    { fullName: "Antoine Roy", interest: "Stage accéléré", status: "INSCRIT", temperature: "chaud", score: 95, value: 134400, source: "Site web", followUp: null },
    { fullName: "Nadia Slimani", interest: "Nacelles PEMP R486", status: "CONTACTE", temperature: "tiede", score: 58, value: 180000, source: "Salon pro", followUp: 4 },
    { fullName: "Hugo Marchand", interest: "Code seul", status: "PERDU", temperature: "froid", score: 25, value: 5900, source: "Google Ads", followUp: null },
    { fullName: "Sofia Da Silva", interest: "VTC Distanciel", status: "PROSPECT", temperature: "chaud", score: 79, value: 39900, source: "Instagram", followUp: -1 },
    { fullName: "Paul Girard", interest: "Permis B automatique", status: "RELANCE", temperature: "tiede", score: 50, value: 92400, source: "Site web", followUp: 5 }
  ];
  let ld = 0;
  for (const l of LEADS) {
    const email = `${l.fullName.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]+/g, ".")}@exemple.fr`;
    await prisma.lead.create({
      data: {
        id: `demo-crm-lead-${ld++}`,
        fullName: l.fullName,
        email,
        phone: `06 70 0${ld % 10} ${10 + ld} ${20 + ld}`,
        status: l.status as Prisma.LeadCreateInput["status"],
        source: l.source,
        interest: l.interest,
        notes: "Lead de démonstration (données fictives).",
        estimatedValueCents: l.value,
        temperature: l.temperature,
        score: l.score,
        agencyId,
        nextFollowUpAt: l.followUp === null ? null : at(l.followUp, 10)
      }
    });
  }

  // --- Examens ---
  let ex = 0;
  const examPlans: { idx: number; type: string; delta: number; result: string; score: number | null }[] = [
    { idx: 0, type: "CODE", delta: -20, result: "REUSSI", score: 38 },
    { idx: 1, type: "CODE", delta: -10, result: "ECHOUE", score: 28 },
    { idx: 2, type: "CONDUITE", delta: -5, result: "REUSSI", score: null },
    { idx: 3, type: "CONDUITE", delta: 7, result: "EN_ATTENTE", score: null },
    { idx: 4, type: "CONDUITE", delta: 12, result: "EN_ATTENTE", score: null },
    { idx: 5, type: "CODE", delta: -2, result: "ABSENT", score: null }
  ];
  for (const e of examPlans) {
    const s = students[e.idx % students.length];
    await prisma.exam.create({
      data: {
        id: `demo-crm-exam-${ex++}`,
        studentId: s.id,
        agencyId,
        type: e.type as Prisma.ExamCreateInput["type"],
        scheduledAt: at(e.delta, 8 + (ex % 6)),
        center: "Centre d'examen de Conflans",
        result: e.result as Prisma.ExamCreateInput["result"],
        score: e.score
      }
    });
  }

  // --- Factures & devis (lignes + snapshots) ---
  const issuer = company
    ? {
        legalName: company.legalName,
        legalForm: company.legalForm,
        capital: company.capital,
        address: company.address,
        postalCode: company.postalCode,
        city: company.city,
        country: company.country,
        siret: company.siret,
        approvalNumber: company.approvalNumber,
        phone: company.phone,
        email: company.email
      }
    : null;
  const clientSnap = (u: { firstName: string; lastName: string; email: string; address: string | null }) => ({
    name: `${u.firstName} ${u.lastName}`,
    email: u.email,
    address: u.address ?? ""
  });
  const lineFor = (s: (typeof students)[number]) => {
    const amount = s.formation && s.formation.priceCents > 0 ? s.formation.priceCents : 90000;
    return [{ label: `${s.formation?.title ?? "Formation"} — ${s.user.firstName} ${s.user.lastName}`, quantity: 1, unitAmountCents: amount, vatRate: 0 }];
  };
  const totals = (lines: { quantity: number; unitAmountCents: number; vatRate: number }[]) => {
    const subtotalCents = lines.reduce((sum, l) => sum + l.quantity * l.unitAmountCents, 0);
    const vatCents = lines.reduce((sum, l) => sum + Math.round((l.quantity * l.unitAmountCents * l.vatRate) / 100), 0);
    return { subtotalCents, vatCents, totalCents: subtotalCents + vatCents };
  };

  // Factures : 1 payée, 2 émises, 1 brouillon
  const invoicePlans = [
    { idx: 0, status: "PAYEE", num: "FAC-2026-000001", issuedDelta: -15, paid: true, due: -1 },
    { idx: 1, status: "EMISE", num: "FAC-2026-000002", issuedDelta: -6, paid: false, due: 24 },
    { idx: 2, status: "EMISE", num: "FAC-2026-000003", issuedDelta: -2, paid: false, due: 28 },
    { idx: 3, status: "BROUILLON", num: null, issuedDelta: null, paid: false, due: null }
  ];
  let inv = 0;
  for (const p of invoicePlans) {
    const s = students[p.idx % students.length];
    const lines = lineFor(s);
    const t = totals(lines);
    const issued = p.status !== "BROUILLON";
    await prisma.invoice.create({
      data: {
        id: `demo-crm-inv-${inv++}`,
        number: p.num,
        status: p.status as Prisma.InvoiceCreateInput["status"],
        clientUserId: s.userId,
        studentId: s.id,
        agencyId,
        lines: lines as unknown as Prisma.InputJsonValue,
        subtotalCents: t.subtotalCents,
        vatCents: t.vatCents,
        totalCents: t.totalCents,
        currency: "EUR",
        issuerSnapshot: issued && issuer ? (issuer as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
        clientSnapshot: issued ? (clientSnap(s.user) as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
        issuedAt: p.issuedDelta === null ? null : at(p.issuedDelta, 10),
        dueDate: p.due === null ? null : at(p.due, 10),
        paidAt: p.paid ? at(-3, 9) : null,
        notes: "Facture de démonstration (données fictives)."
      }
    });
  }

  // Devis : 1 accepté, 1 envoyé, 1 brouillon
  const quotePlans = [
    { idx: 5, status: "ACCEPTE", num: "DEV-2026-000001", sentDelta: -12, valid: 18, decided: true },
    { idx: 6, status: "ENVOYE", num: "DEV-2026-000002", sentDelta: -4, valid: 26, decided: false },
    { idx: 7, status: "BROUILLON", num: null, sentDelta: null, valid: null, decided: false }
  ];
  let qt = 0;
  for (const p of quotePlans) {
    const s = students[p.idx % students.length];
    const lines = lineFor(s);
    const t = totals(lines);
    const sent = p.status !== "BROUILLON";
    await prisma.quote.create({
      data: {
        id: `demo-crm-quote-${qt++}`,
        number: p.num,
        status: p.status as Prisma.QuoteCreateInput["status"],
        clientUserId: s.userId,
        studentId: s.id,
        agencyId,
        lines: lines as unknown as Prisma.InputJsonValue,
        subtotalCents: t.subtotalCents,
        vatCents: t.vatCents,
        totalCents: t.totalCents,
        currency: "EUR",
        issuerSnapshot: sent && issuer ? (issuer as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
        clientSnapshot: sent ? (clientSnap(s.user) as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
        sentAt: p.sentDelta === null ? null : at(p.sentDelta, 10),
        validUntil: p.valid === null ? null : at(p.valid, 10),
        decidedAt: p.decided ? at(-2, 10) : null,
        notes: "Devis de démonstration (données fictives)."
      }
    });
  }

  // --- Avis clients (publics + en modération) ---
  const REVIEWS = [
    { idx: 0, rating: 5, status: "PUBLIE", comment: "Moniteur très pédagogue, permis obtenu du premier coup. Je recommande LODENE !" },
    { idx: 1, rating: 5, status: "PUBLIE", comment: "Super accompagnement, planning flexible et suivi en ligne très pratique." },
    { idx: 2, rating: 4, status: "PUBLIE", comment: "Bonne formation, équipe à l'écoute. Quelques créneaux difficiles à obtenir." },
    { idx: 3, rating: 5, status: "PUBLIE", comment: "Formation VTC complète et claire, j'ai eu ma carte pro sans souci." },
    { idx: 4, rating: 4, status: "PUBLIE", comment: "Très bon rapport qualité-prix, moniteurs professionnels." },
    { idx: 5, rating: 5, status: "EN_ATTENTE", comment: "Accueil au top et explications limpides, merci à toute l'équipe !" },
    { idx: 6, rating: 3, status: "EN_ATTENTE", comment: "Correct dans l'ensemble, j'aurais aimé plus de disponibilités le samedi." }
  ];
  let rv = 0;
  for (const r of REVIEWS) {
    const s = students[r.idx % students.length];
    await prisma.review.create({
      data: {
        id: `demo-crm-review-${rv++}`,
        userId: s.userId,
        instructorId: instructorIds[r.idx % instructorIds.length],
        agencyId,
        rating: r.rating,
        comment: r.comment,
        status: r.status as Prisma.ReviewCreateInput["status"],
        publishedAt: r.status === "PUBLIE" ? at(-(r.idx + 3), 12) : null
      }
    });
  }

  // --- Contrats de formation ---
  const contractBody = (s: (typeof students)[number]) =>
    [
      `Contrat de formation entre LODENE et ${s.user.firstName} ${s.user.lastName}.`,
      `Formation : ${s.formation?.title ?? "Formation"}.`,
      "Le présent contrat précise le programme, le nombre d'heures, les modalités de paiement et les conditions générales de la formation.",
      "Document de démonstration (données fictives)."
    ].join("\n");
  const contractPlans = [
    { idx: 0, status: "ACTIF", num: "CON-2026-000001", signed: -14, starts: -10, ends: 80 },
    { idx: 2, status: "TERMINE", num: "CON-2026-000002", signed: -120, starts: -110, ends: -5 },
    { idx: 6, status: "BROUILLON", num: null, signed: null, starts: null, ends: null },
    { idx: 8, status: "RESILIE", num: "CON-2026-000003", signed: -60, starts: -55, ends: -20 }
  ];
  let ct = 0;
  for (const p of contractPlans) {
    const s = students[p.idx % students.length];
    const amount = s.formation && s.formation.priceCents > 0 ? s.formation.priceCents : 90000;
    const active = p.status !== "BROUILLON";
    await prisma.contract.create({
      data: {
        id: `demo-crm-contract-${ct++}`,
        number: p.num,
        status: p.status as Prisma.ContractCreateInput["status"],
        clientUserId: s.userId,
        studentId: s.id,
        formationId: s.formationId,
        agencyId,
        title: `Contrat de formation — ${s.formation?.title ?? "Formation"}`,
        body: contractBody(s),
        totalCents: amount,
        currency: "EUR",
        issuerSnapshot: active && issuer ? (issuer as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
        clientSnapshot: active ? (clientSnap(s.user) as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
        signedAt: p.signed === null ? null : at(p.signed, 11),
        startsAt: p.starts === null ? null : at(p.starts, 9),
        endsAt: p.ends === null ? null : at(p.ends, 9),
        notes: "Contrat de démonstration (données fictives)."
      }
    });
  }

  // --- Demandes de financement CPF ---
  const cpfPlans = [
    { idx: 0, status: "NOUVELLE_DEMANDE", missing: [] as string[] },
    { idx: 1, status: "EN_COURS", missing: [] as string[] },
    { idx: 2, status: "DOCUMENTS_MANQUANTS", missing: ["Pièce d'identité", "Attestation CPF"] },
    { idx: 3, status: "VALIDEE", missing: [] as string[] },
    { idx: 7, status: "REFUSEE", missing: [] as string[] },
    { idx: 9, status: "EN_COURS", missing: [] as string[] }
  ];
  let cpf = 0;
  for (const p of cpfPlans) {
    const s = students[p.idx % students.length];
    const amount = s.formation && s.formation.priceCents > 0 ? s.formation.priceCents : 90000;
    await prisma.cpfRequest.create({
      data: {
        id: `demo-crm-cpf-${cpf++}`,
        studentId: s.id,
        formationId: s.formationId,
        agencyId,
        fullName: `${s.user.firstName} ${s.user.lastName}`,
        email: s.user.email,
        phone: s.user.phone,
        status: p.status as Prisma.CpfRequestCreateInput["status"],
        requestedAmountCents: amount,
        missingDocuments: p.missing,
        internalNotes: "Demande CPF de démonstration (données fictives)."
      }
    });
  }

  console.log("Données CRM de démonstration créées :");
  console.log(`  • Moniteurs : ${instructorIds.length}`);
  console.log(`  • Réservations (planning) : ${bk}`);
  console.log(`  • Paiements : ${pay}`);
  console.log(`  • Leads (pipeline) : ${ld}`);
  console.log(`  • Examens : ${ex}`);
  console.log(`  • Factures : ${inv}`);
  console.log(`  • Devis : ${qt}`);
  console.log(`  • Avis : ${rv}`);
  console.log(`  • Contrats : ${ct}`);
  console.log(`  • Demandes CPF : ${cpf}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
