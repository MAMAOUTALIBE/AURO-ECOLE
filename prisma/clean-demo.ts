import { PrismaClient } from "@prisma/client";

// Supprime TOUTES les données de démonstration insérées par `npm run db:seed-demo`
// (enregistrements dont l'id commence par "demo-"). Les données réelles (catalogue
// officiel, société, vrais comptes, créneaux "auto-") ne sont PAS touchées.
// Ordre = enfants avant parents (intégrité des clés étrangères).
// Lancer : npm run db:clean-demo

const prisma = new PrismaClient();
const demo = { id: { startsWith: "demo-" } } as const;

async function main() {
  const counts: Record<string, number> = {};
  const del = async (label: string, fn: () => Promise<{ count: number }>) => {
    counts[label] = (await fn()).count;
  };

  // Enfants / sans contrainte FK d'abord
  await del("chatTasks", () => prisma.chatTask.deleteMany({ where: demo }));
  await del("chatConversations", () => prisma.chatConversation.deleteMany({ where: demo }));
  await del("chatAppointments", () => prisma.chatAppointment.deleteMany({ where: demo }));
  await del("bookings", () => prisma.booking.deleteMany({ where: demo }));
  await del("exams", () => prisma.exam.deleteMany({ where: demo }));
  await del("payments", () => prisma.payment.deleteMany({ where: demo }));
  await del("invoices", () => prisma.invoice.deleteMany({ where: demo }));
  await del("quotes", () => prisma.quote.deleteMany({ where: demo }));
  await del("contracts", () => prisma.contract.deleteMany({ where: demo }));
  await del("cpfRequests", () => prisma.cpfRequest.deleteMany({ where: demo }));
  await del("reviews", () => prisma.review.deleteMany({ where: demo }));
  await del("leads", () => prisma.lead.deleteMany({ where: demo }));
  // Parents
  await del("students", () => prisma.student.deleteMany({ where: demo }));
  await del("instructors", () => prisma.instructor.deleteMany({ where: demo }));
  await del("vehicles", () => prisma.vehicle.deleteMany({ where: demo }));
  await del("automationRules", () => prisma.automationRule.deleteMany({ where: demo }));
  await del("contentEntries", () => prisma.contentEntry.deleteMany({ where: demo }));
  await del("agencyMemberships", () => prisma.agencyMembership.deleteMany({ where: demo }));
  await del("users", () => prisma.user.deleteMany({ where: demo }));
  await del("agencies", () => prisma.agency.deleteMany({ where: demo }));

  console.log("Données de démonstration supprimées :");
  console.table(counts);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
