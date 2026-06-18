import bcrypt from "bcryptjs";
import { Prisma, PrismaClient } from "@prisma/client";
import {
  initialAgencies,
  initialAgencyMemberships,
  initialAvailabilities,
  initialCompanyInfo,
  initialFaqEntries,
  initialFormations,
  initialInstructors,
  initialMeetingPoints,
  initialPricingPlans,
  initialReviews,
  initialSiteSettings,
  initialUsers
} from "../backend/src/data/initial-data";

const prisma = new PrismaClient();

function requireProductionAdmin() {
  const isProduction = process.env.NODE_ENV === "production";
  const email = process.env.LODEN_ADMIN_EMAIL ?? (isProduction ? undefined : "admin@loden-autoecole.fr");
  const password = process.env.LODEN_ADMIN_PASSWORD ?? (isProduction ? undefined : "admin-password");

  if (!email || !password) {
    throw new Error("LODEN_ADMIN_EMAIL and LODEN_ADMIN_PASSWORD are required when seeding production");
  }

  if (isProduction && (password.includes("CHANGE_ME") || password.length < 14)) {
    throw new Error("LODEN_ADMIN_PASSWORD must contain at least 14 characters in production");
  }

  return { email, password };
}

async function seedAgencies() {
  for (const agency of initialAgencies) {
    await prisma.agency.upsert({
      where: { id: agency.id },
      update: {
        name: agency.name,
        slug: agency.slug,
        address: agency.address,
        latitude: agency.latitude,
        longitude: agency.longitude,
        phone: agency.phone,
        email: agency.email,
        active: agency.active
      },
      create: {
        id: agency.id,
        name: agency.name,
        slug: agency.slug,
        address: agency.address,
        latitude: agency.latitude,
        longitude: agency.longitude,
        phone: agency.phone,
        email: agency.email,
        active: agency.active
      }
    });
  }
}

async function seedAgencyMemberships() {
  for (const membership of initialAgencyMemberships) {
    await prisma.agencyMembership.upsert({
      where: { userId_agencyId: { userId: membership.userId, agencyId: membership.agencyId } },
      update: { role: membership.role, isPrimary: membership.isPrimary },
      create: {
        id: membership.id,
        userId: membership.userId,
        agencyId: membership.agencyId,
        role: membership.role,
        isPrimary: membership.isPrimary
      }
    });
  }
}

async function seedUsers() {
  const { email, password } = requireProductionAdmin();
  const passwordHash = await bcrypt.hash(password, 12);

  for (const user of initialUsers) {
    const isAdmin = user.id === "user-admin";
    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: isAdmin ? email.toLowerCase() : user.email.toLowerCase(),
        phone: user.phone,
        role: user.role,
        status: user.status,
        passwordHash: isAdmin ? passwordHash : user.passwordHash
      },
      create: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: isAdmin ? email.toLowerCase() : user.email.toLowerCase(),
        phone: user.phone,
        role: user.role,
        status: user.status,
        passwordHash: isAdmin ? passwordHash : user.passwordHash
      }
    });
  }
}

async function seedCatalog() {
  for (const formation of initialFormations) {
    const data = {
      title: formation.title,
      subtitle: formation.subtitle ?? null,
      description: formation.description,
      mode: formation.mode,
      productLine: formation.productLine ?? "AUTO_ECOLE",
      priceCents: formation.priceCents,
      taxMode: formation.taxMode ?? "TTC",
      quoteOnly: formation.quoteOnly ?? false,
      internalPriceCents: formation.internalPriceCents ?? null,
      durationLabel: formation.durationLabel,
      defaultHours: formation.defaultHours ?? null,
      imageUrl: formation.imageUrl,
      options: (formation.options as Prisma.InputJsonValue) ?? undefined,
      tags: formation.tags ?? [],
      cpfEligible: formation.cpfEligible,
      cpfStatus: formation.cpfStatus ?? "NON_RENSEIGNE",
      active: formation.active
    };
    await prisma.formation.upsert({
      where: { slug: formation.slug },
      update: data,
      create: { id: formation.id, slug: formation.slug, ...data }
    });
  }

  for (const plan of initialPricingPlans) {
    await prisma.pricingPlan.upsert({
      where: { slug: plan.slug },
      update: {
        formationId: plan.formationId,
        title: plan.title,
        description: plan.description,
        priceCents: plan.priceCents,
        features: plan.features,
        allowOneShotPayment: plan.allowOneShotPayment,
        allowThreeTimes: plan.allowThreeTimes,
        allowFourTimes: plan.allowFourTimes,
        discountCents: plan.discountCents,
        promotionalLabel: plan.promotionalLabel,
        active: plan.active
      },
      create: {
        id: plan.id,
        formationId: plan.formationId,
        title: plan.title,
        slug: plan.slug,
        description: plan.description,
        priceCents: plan.priceCents,
        features: plan.features,
        allowOneShotPayment: plan.allowOneShotPayment,
        allowThreeTimes: plan.allowThreeTimes,
        allowFourTimes: plan.allowFourTimes,
        discountCents: plan.discountCents,
        promotionalLabel: plan.promotionalLabel,
        active: plan.active
      }
    });
  }
}

async function seedOperationsData() {
  for (const instructor of initialInstructors) {
    await prisma.instructor.upsert({
      where: { id: instructor.id },
      update: {
        userId: instructor.userId,
        agencyId: instructor.agencyId,
        bio: instructor.bio,
        specialties: instructor.specialties,
        interventionZones: instructor.interventionZones,
        ratingAverage: instructor.ratingAverage,
        ratingCount: instructor.ratingCount,
        active: instructor.active
      },
      create: {
        id: instructor.id,
        userId: instructor.userId,
        agencyId: instructor.agencyId,
        bio: instructor.bio,
        specialties: instructor.specialties,
        interventionZones: instructor.interventionZones,
        ratingAverage: instructor.ratingAverage,
        ratingCount: instructor.ratingCount,
        active: instructor.active
      }
    });
  }

  for (const meetingPoint of initialMeetingPoints) {
    await prisma.meetingPoint.upsert({
      where: { id: meetingPoint.id },
      update: {
        name: meetingPoint.name,
        address: meetingPoint.address,
        latitude: meetingPoint.latitude,
        longitude: meetingPoint.longitude,
        agencyId: meetingPoint.agencyId,
        active: meetingPoint.active
      },
      create: meetingPoint
    });
  }

  for (const availability of initialAvailabilities) {
    await prisma.availability.upsert({
      where: { id: availability.id },
      update: {
        instructorId: availability.instructorId,
        startsAt: availability.startsAt,
        endsAt: availability.endsAt,
        isAvailable: availability.isAvailable,
        reason: availability.reason
      },
      create: availability
    });
  }
}

async function seedContent() {
  for (const review of initialReviews) {
    await prisma.review.upsert({
      where: { id: review.id },
      update: {
        rating: review.rating,
        comment: review.comment,
        status: review.status,
        publishedAt: review.publishedAt
      },
      create: {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        status: review.status,
        publishedAt: review.publishedAt
      }
    });
  }

  for (const faq of initialFaqEntries) {
    await prisma.faqEntry.upsert({
      where: { id: faq.id },
      update: {
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        active: faq.active
      },
      create: faq
    });
  }

  // Informations société (singleton). On crée la ligne si absente avec les valeurs
  // officielles ; on ne réécrase PAS les champs déjà édités via le CMS.
  const { updatedAt: _companyUpdatedAt, ...companyDefaults } = initialCompanyInfo;
  void _companyUpdatedAt;
  await prisma.companyInfo.upsert({
    where: { id: companyDefaults.id },
    update: {},
    create: companyDefaults
  });
}

// Réglages dynamiques du site : on crée la valeur par défaut si absente, sans jamais
// écraser une valeur déjà éditée depuis le CMS.
async function seedSiteSettings() {
  for (const setting of initialSiteSettings) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: { key: setting.key, value: setting.value as Prisma.InputJsonValue }
    });
  }
}

async function main() {
  await seedAgencies();
  await seedUsers();
  await seedAgencyMemberships();
  await seedCatalog();
  await seedOperationsData();
  await seedContent();
  await seedSiteSettings();
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
