/**
 * Génère une fenêtre glissante de créneaux de rendez-vous chatbot (ChatAvailabilitySlot)
 * pour les ~3 prochaines semaines. Idempotent (id déterministe par jour+heure → upsert),
 * donc relançable par un cron quotidien sans créer de doublons. Les créneaux passés
 * restent en base mais sont filtrés par l'API (startsAt >= now).
 *
 * Usage : `npm run db:seed-availability` (nécessite DATABASE_URL).
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DAYS_AHEAD = 21;
// Créneaux types proposés chaque jour ouvré (heures locales du serveur).
const DAILY_SLOTS = [
  { hour: 10, minute: 0, type: "APPEL", label: "Appel conseiller" },
  { hour: 14, minute: 0, type: "AGENCE", label: "Rendez-vous agence" },
  { hour: 17, minute: 0, type: "DEVIS", label: "Diagnostic / devis" }
];
const SLOT_DURATION_MIN = 30;
const CAPACITY = 4;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

async function main() {
  const agency = await prisma.agency.findFirst();
  const advisor = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });

  const today = new Date();
  let ensured = 0;

  for (let offset = 1; offset <= DAYS_AHEAD; offset += 1) {
    const day = new Date(today);
    day.setDate(today.getDate() + offset);
    if (day.getDay() === 0) continue; // fermé le dimanche

    for (const slot of DAILY_SLOTS) {
      const startsAt = new Date(day.getFullYear(), day.getMonth(), day.getDate(), slot.hour, slot.minute, 0, 0);
      const endsAt = new Date(startsAt.getTime() + SLOT_DURATION_MIN * 60_000);
      const id = `auto-${startsAt.getFullYear()}${pad(startsAt.getMonth() + 1)}${pad(startsAt.getDate())}-${pad(slot.hour)}${pad(slot.minute)}`;

      await prisma.chatAvailabilitySlot.upsert({
        where: { id },
        create: {
          id,
          label: slot.label,
          startsAt,
          endsAt,
          type: slot.type,
          agencyId: agency?.id ?? null,
          assignedToId: advisor?.id ?? null,
          active: true,
          capacity: CAPACITY,
          bookedCount: 0
        },
        // On NE touche PAS à bookedCount/capacity en update (préserve les réservations existantes).
        update: { label: slot.label, startsAt, endsAt, type: slot.type, active: true }
      });
      ensured += 1;
    }
  }

  console.log(`[seed-availability] ${ensured} créneaux assurés sur ${DAYS_AHEAD} jours.`);
}

main()
  .catch((error) => {
    console.error("[seed-availability] échec:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
