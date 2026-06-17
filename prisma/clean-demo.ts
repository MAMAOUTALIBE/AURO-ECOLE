import { PrismaClient } from "@prisma/client";

// Supprime TOUTES les données de démonstration (à lancer avant la mise en production).
// - Données CRM démo : enregistrements dont l'id commence par "demo-crm-".
// - Élèves démo : comptes dont l'email se termine par "@lodene-demo.fr" (cascade).
// Les données réelles (catalogue officiel, société, vrais comptes) ne sont PAS touchées.
// Lancer : npm run db:clean-demo   (ou npx tsx --env-file=.env prisma/clean-demo.ts)

const prisma = new PrismaClient();

async function main() {
  const idFilter = { id: { startsWith: "demo-crm-" } } as const;

  // Ordre dépendances (enfants avant parents).
  const booking = await prisma.booking.deleteMany({ where: idFilter });
  const exam = await prisma.exam.deleteMany({ where: idFilter });
  const payment = await prisma.payment.deleteMany({ where: idFilter });
  const invoice = await prisma.invoice.deleteMany({ where: idFilter });
  const quote = await prisma.quote.deleteMany({ where: idFilter });
  const contract = await prisma.contract.deleteMany({ where: idFilter });
  const cpf = await prisma.cpfRequest.deleteMany({ where: idFilter });
  const review = await prisma.review.deleteMany({ where: idFilter });
  const lead = await prisma.lead.deleteMany({ where: idFilter });
  const instructor = await prisma.instructor.deleteMany({ where: idFilter });
  const monUsers = await prisma.user.deleteMany({ where: { id: { startsWith: "demo-crm-mon-u-" } } });

  // Élèves de démonstration (User -> Student -> bookings en cascade).
  const demoStudents = await prisma.user.deleteMany({ where: { email: { endsWith: "@lodene-demo.fr" } } });

  console.log("Données de démonstration supprimées :");
  console.table({
    bookings: booking.count,
    exams: exam.count,
    payments: payment.count,
    invoices: invoice.count,
    quotes: quote.count,
    contracts: contract.count,
    cpfRequests: cpf.count,
    reviews: review.count,
    leads: lead.count,
    moniteursDemo: instructor.count,
    comptesMoniteursDemo: monUsers.count,
    elevesDemo: demoStudents.count
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
