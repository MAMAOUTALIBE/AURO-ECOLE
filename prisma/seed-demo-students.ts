import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

// Script de DÉMO (idempotent) : crée 20 élèves répartis sur les différentes
// formations, avec progression/heures/statut de dossier variés, pour visualiser
// les vues du CRM. Relançable sans créer de doublons (upsert par email/userId).
// Lancer : npx tsx --env-file=.env prisma/seed-demo-students.ts

const prisma = new PrismaClient();

const PEOPLE: [string, string][] = [
  ["Camille", "Robert"],
  ["Lucas", "Moreau"],
  ["Inès", "Garnier"],
  ["Hugo", "Lefebvre"],
  ["Manon", "Fontaine"],
  ["Nathan", "Girard"],
  ["Chloé", "Mercier"],
  ["Adam", "Bonnet"],
  ["Sarah", "Lambert"],
  ["Yanis", "Faure"],
  ["Emma", "Rousseau"],
  ["Noah", "Blanc"],
  ["Jade", "Henry"],
  ["Gabriel", "Roux"],
  ["Louna", "Vincent"],
  ["Rayan", "Muller"],
  ["Alice", "Lemaire"],
  ["Tom", "Dumas"],
  ["Lina", "Carpentier"],
  ["Maël", "Brunet"]
];

const FILE_STATUSES = ["NOUVEAU", "INCOMPLET", "EN_COURS", "PRET_EXAMEN", "EXAMEN_PLANIFIE", "TERMINE"] as const;
const PURCHASED = [13, 20, 20, 30];
const PROGRESS = [0, 15, 35, 55, 70, 90, 100];

async function main() {
  const formations = await prisma.formation.findMany({ orderBy: { createdAt: "asc" }, select: { id: true, title: true } });
  if (formations.length === 0) throw new Error("Aucune formation en base — lance d'abord le seed du catalogue.");
  const agency = await prisma.agency.findFirst({ select: { id: true } });
  const passwordHash = await bcrypt.hash("eleve-demo-1234", 10);

  const now = Date.now();
  let created = 0;

  for (let i = 0; i < PEOPLE.length; i++) {
    const [firstName, lastName] = PEOPLE[i];
    const email = `eleve.demo${i + 1}@lodene-demo.fr`;
    const formation = formations[i % formations.length];
    const purchasedHours = PURCHASED[i % PURCHASED.length];
    const progressPercent = PROGRESS[i % PROGRESS.length];
    const consumedHours = Math.min(purchasedHours, Math.round((purchasedHours * progressPercent) / 100));
    const fileStatus = FILE_STATUSES[i % FILE_STATUSES.length];
    const examDate =
      fileStatus === "EXAMEN_PLANIFIE" ? new Date(now + (7 + (i % 21)) * 86_400_000) : null;
    const phone = `06 55 ${String(10 + i).padStart(2, "0")} ${String(40 + i).padStart(2, "0")}`;

    const user = await prisma.user.upsert({
      where: { email },
      update: { firstName, lastName, role: "ELEVE", status: "ACTIVE" },
      create: { email, firstName, lastName, phone, role: "ELEVE", status: "ACTIVE", passwordHash }
    });

    await prisma.student.upsert({
      where: { userId: user.id },
      update: {
        formationId: formation.id,
        agencyId: agency?.id ?? null,
        progressPercent,
        purchasedHours,
        consumedHours,
        examDate,
        fileStatus,
        internalNotes: "Élève de démonstration (données fictives)."
      },
      create: {
        userId: user.id,
        formationId: formation.id,
        agencyId: agency?.id ?? null,
        progressPercent,
        purchasedHours,
        consumedHours,
        examDate,
        fileStatus,
        internalNotes: "Élève de démonstration (données fictives)."
      }
    });
    created += 1;
    console.log(`✓ ${firstName} ${lastName} → ${formation.title} (${progressPercent}%, ${fileStatus})`);
  }

  console.log(`\n${created} élèves de démonstration prêts.`);
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
