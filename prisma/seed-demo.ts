/**
 * Insère le jeu de données de DÉMONSTRATION du CRM dans PostgreSQL (prod ou local).
 *
 * Source : `buildDemoSeed()` (backend/src/data/demo-data.ts) — mêmes enregistrements
 * que le mode mémoire (`API_DEMO_SEED`), ids préfixés `demo-`. On n'insère QUE les
 * `demo-*` (les données officielles sont déjà seedées par prisma/seed.ts).
 *
 * Robuste : on filtre chaque enregistrement aux SEULES colonnes réelles du modèle
 * Prisma (via le DMMF), ce qui ignore les champs « domaine » dérivés (ex. Instructor.name
 * calculé depuis User) et les relations. Les ids `demo-` sont préservés (intégrité FK).
 * Idempotent (`skipDuplicates`). Ordre = parents avant enfants.
 *
 * Usage : `npm run db:seed-demo` (nécessite DATABASE_URL).
 */
import { Prisma, PrismaClient } from "@prisma/client";
import { buildDemoSeed } from "../backend/src/data/demo-data";

const prisma = new PrismaClient();

const fieldCache = new Map<string, Set<string>>();
function scalarFields(model: string): Set<string> {
  if (!fieldCache.has(model)) {
    const def = Prisma.dmmf.datamodel.models.find((m) => m.name === model);
    if (!def) throw new Error(`Modèle DMMF introuvable: ${model}`);
    fieldCache.set(model, new Set(def.fields.filter((f) => f.kind === "scalar" || f.kind === "enum").map((f) => f.name)));
  }
  return fieldCache.get(model)!;
}

function pick(row: Record<string, unknown>, fields: Set<string>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(row)) {
    if (fields.has(key) && row[key] !== undefined) out[key] = row[key];
  }
  return out;
}

function demoOnly(rows: unknown[] | undefined): Record<string, unknown>[] {
  return ((rows ?? []) as Record<string, unknown>[]).filter((r) => typeof r?.id === "string" && (r.id as string).startsWith("demo-"));
}

type Delegate = { createMany: (a: { data: unknown[]; skipDuplicates: boolean }) => Promise<{ count: number }> };

async function insert(name: string, modelName: string, delegate: Delegate, rows: unknown[] | undefined) {
  const fields = scalarFields(modelName);
  const data = demoOnly(rows).map((r) => pick(r, fields));
  if (!data.length) {
    console.log(`- ${name}: rien à insérer`);
    return;
  }
  const res = await delegate.createMany({ data, skipDuplicates: true });
  console.log(`- ${name}: +${res.count}/${data.length}`);
}

async function main() {
  const s = buildDemoSeed();

  // Parents -> enfants (intégrité des clés étrangères).
  await insert("agencies", "Agency", prisma.agency, s.agencies);
  await insert("users", "User", prisma.user, s.users);
  await insert("agencyMemberships", "AgencyMembership", prisma.agencyMembership, s.agencyMemberships);
  await insert("instructors", "Instructor", prisma.instructor, s.instructors);
  await insert("vehicles", "Vehicle", prisma.vehicle, s.vehicles);
  await insert("students", "Student", prisma.student, s.students);
  await insert("leads", "Lead", prisma.lead, s.leads);
  await insert("bookings", "Booking", prisma.booking, s.bookings);
  await insert("payments", "Payment", prisma.payment, s.payments);
  await insert("invoices", "Invoice", prisma.invoice, s.invoices);
  await insert("quotes", "Quote", prisma.quote, s.quotes);
  await insert("contracts", "Contract", prisma.contract, s.contracts);
  await insert("cpfRequests", "CpfRequest", prisma.cpfRequest, s.cpfRequests);
  await insert("reviews", "Review", prisma.review, s.reviews);
  await insert("exams", "Exam", prisma.exam, s.exams);
  await insert("chatAppointments", "ChatAppointment", prisma.chatAppointment, s.chatAppointments);
  await insert("chatTasks", "ChatTask", prisma.chatTask, s.chatTasks);
  await insert("chatConversations", "ChatConversation", prisma.chatConversation, s.chatConversations);
  await insert("contentEntries", "ContentEntry", prisma.contentEntry, s.contentEntries);
  await insert("automationRules", "AutomationRule", prisma.automationRule, s.automationRules);

  console.log("[seed-demo] Terminé.");
}

main()
  .catch((error) => {
    console.error("[seed-demo] échec:", (error as Error).message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
