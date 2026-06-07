import type {
  AgencyMembershipRecord,
  AgencyRecord,
  AvailabilityRecord,
  FaqEntryRecord,
  FormationRecord,
  InstructorRecord,
  MeetingPointRecord,
  PricingPlanRecord,
  ReviewRecord,
  UserRecord
} from "../domain/types";

const now = new Date("2026-06-06T00:00:00.000Z");

export const initialAgencies: AgencyRecord[] = [
  {
    id: "agency-republique",
    name: "LODEN République",
    slug: "republique",
    address: "24 avenue de la République, 75011 Paris",
    latitude: 48.865,
    longitude: 2.37,
    phone: "01 84 80 12 45",
    email: "republique@loden-autoecole.fr",
    active: true
  },
  {
    id: "agency-nation",
    name: "LODEN Nation",
    slug: "nation",
    address: "Place de la Nation, 75012 Paris",
    latitude: 48.848,
    longitude: 2.395,
    phone: "01 84 80 12 46",
    email: "nation@loden-autoecole.fr",
    active: true
  }
];

export const initialAgencyMemberships: AgencyMembershipRecord[] = [
  { id: "membership-admin-republique", userId: "user-admin", agencyId: "agency-republique", role: "SUPER_ADMIN", isPrimary: true },
  { id: "membership-admin-nation", userId: "user-admin", agencyId: "agency-nation", role: "SUPER_ADMIN", isPrimary: false },
  { id: "membership-sarah-republique", userId: "user-sarah", agencyId: "agency-republique", role: "MONITEUR", isPrimary: true },
  { id: "membership-mathieu-nation", userId: "user-mathieu", agencyId: "agency-nation", role: "MONITEUR", isPrimary: true },
  { id: "membership-nadia-republique", userId: "user-nadia", agencyId: "agency-republique", role: "MONITEUR", isPrimary: true }
];

export const initialFormations: FormationRecord[] = [
  {
    id: "formation-permis-b-manuel",
    title: "Permis B manuel",
    slug: "permis-b-manuel",
    description: "Formation complète en boîte manuelle avec suivi jusqu'à l'examen.",
    mode: "MANUEL",
    priceCents: 119000,
    durationLabel: "20 h minimum",
    defaultHours: 20,
    imageUrl: "/loden-hero.jpg",
    options: { tags: ["Débutant", "CPF", "Manuel"] },
    cpfEligible: true,
    active: true
  },
  {
    id: "formation-permis-b-automatique",
    title: "Permis B automatique",
    slug: "permis-b-automatique",
    description: "Parcours court et confortable pour obtenir le permis en boîte automatique.",
    mode: "AUTOMATIQUE",
    priceCents: 89000,
    durationLabel: "13 h minimum",
    defaultHours: 13,
    imageUrl: "/loden-hero.jpg",
    options: { tags: ["Automatique", "CPF", "Rapide"] },
    cpfEligible: true,
    active: true
  },
  {
    id: "formation-conduite-accompagnee",
    title: "Conduite accompagnée",
    slug: "conduite-accompagnee",
    description: "Accompagnement dès 15 ans pour gagner en expérience avant l'examen.",
    mode: "MANUEL",
    priceCents: 129000,
    durationLabel: "Dès 15 ans",
    defaultHours: 20,
    imageUrl: "/loden-hero.jpg",
    options: { tags: ["Jeune conducteur", "Famille", "Manuel"] },
    cpfEligible: false,
    active: true
  },
  {
    id: "formation-permis-accelere",
    title: "Permis accéléré",
    slug: "permis-accelere",
    description: "Programme condensé avec créneaux prioritaires pour passer rapidement.",
    mode: "MIXTE",
    priceCents: 159000,
    durationLabel: "2 à 4 semaines",
    defaultHours: 20,
    imageUrl: "/loden-hero.jpg",
    options: { tags: ["Accéléré", "CPF", "Planning prioritaire"] },
    cpfEligible: true,
    active: true
  },
  {
    id: "formation-code-en-ligne",
    title: "Code en ligne",
    slug: "code-en-ligne",
    description: "Séries de code, examens blancs et statistiques de progression.",
    mode: "CODE",
    priceCents: 3900,
    durationLabel: "Accès illimité",
    imageUrl: "/loden-hero.jpg",
    options: { tags: ["Code", "Mobile", "Révisions"] },
    cpfEligible: false,
    active: true
  },
  {
    id: "formation-stage-code",
    title: "Stage de code",
    slug: "stage-code",
    description: "Préparation intensive en petit groupe pour sécuriser l'examen du code.",
    mode: "CODE",
    priceCents: 19900,
    durationLabel: "3 jours",
    imageUrl: "/loden-hero.jpg",
    options: { tags: ["Stage", "Code", "Intensif"] },
    cpfEligible: false,
    active: true
  },
  {
    id: "formation-annulation-permis",
    title: "Annulation permis",
    slug: "annulation-permis",
    description: "Plan de reprise après invalidation, suspension ou annulation.",
    mode: "MIXTE",
    priceCents: 49000,
    durationLabel: "Sur diagnostic",
    imageUrl: "/loden-hero.jpg",
    options: { tags: ["Remise à niveau", "CPF", "Diagnostic"] },
    cpfEligible: true,
    active: true
  },
  {
    id: "formation-perfectionnement",
    title: "Perfectionnement",
    slug: "perfectionnement",
    description: "Séances pour reprendre confiance ou préparer un trajet spécifique.",
    mode: "MIXTE",
    priceCents: 6500,
    durationLabel: "À la carte",
    imageUrl: "/loden-hero.jpg",
    options: { tags: ["Remise à niveau", "Confiance", "À la carte"] },
    cpfEligible: false,
    active: true
  }
];

export const initialPricingPlans: PricingPlanRecord[] = [
  {
    id: "plan-permis-b",
    formationId: "formation-permis-b-manuel",
    title: "Permis B",
    slug: "permis-b",
    description: "Pack 20 h avec code inclus.",
    priceCents: 119000,
    features: ["20 h de conduite", "Code inclus", "Planning flexible", "Suivi élève"],
    allowOneShotPayment: true,
    allowThreeTimes: true,
    allowFourTimes: true,
    discountCents: 0,
    promotionalLabel: "Le plus choisi",
    active: true
  },
  {
    id: "plan-permis-accelere",
    formationId: "formation-permis-accelere",
    title: "Permis accéléré",
    slug: "permis-accelere",
    description: "Créneaux prioritaires sur 2 à 4 semaines.",
    priceCents: 159000,
    features: ["Parcours 2 à 4 semaines", "Créneaux prioritaires", "Coach référent", "Présentation examen"],
    allowOneShotPayment: true,
    allowThreeTimes: true,
    allowFourTimes: false,
    discountCents: 0,
    promotionalLabel: "Rapide",
    active: true
  },
  {
    id: "plan-boite-automatique",
    formationId: "formation-permis-b-automatique",
    title: "Boîte automatique",
    slug: "boite-automatique",
    description: "Pack 13 h boîte automatique.",
    priceCents: 89000,
    features: ["13 h de conduite", "Voitures récentes", "Conversion possible", "CPF compatible"],
    allowOneShotPayment: true,
    allowThreeTimes: true,
    allowFourTimes: true,
    discountCents: 0,
    promotionalLabel: "Confort",
    active: true
  },
  {
    id: "plan-cpf",
    title: "Pack CPF",
    slug: "pack-cpf",
    description: "Accompagnement administratif CPF.",
    priceCents: 0,
    features: ["Montage dossier", "Conseiller dédié", "Devis personnalisé", "Reste à charge optimisé"],
    allowOneShotPayment: false,
    allowThreeTimes: false,
    allowFourTimes: false,
    discountCents: 0,
    promotionalLabel: "Financé",
    active: true
  }
];

export const initialReviews: ReviewRecord[] = [
  {
    id: "review-camille",
    rating: 5,
    comment: "Inscription rapide, monitrice très claire et planning vraiment flexible. J'ai eu mon permis du premier coup.",
    status: "PUBLIE",
    publishedAt: new Date("2026-05-12T10:00:00.000Z"),
    createdAt: new Date("2026-05-12T10:00:00.000Z"),
    updatedAt: new Date("2026-05-12T10:00:00.000Z")
  },
  {
    id: "review-yanis",
    rating: 5,
    comment: "Le simulateur et l'app donnent une vraie visibilité sur le budget et la progression. Très rassurant.",
    status: "PUBLIE",
    publishedAt: new Date("2026-05-18T10:00:00.000Z"),
    createdAt: new Date("2026-05-18T10:00:00.000Z"),
    updatedAt: new Date("2026-05-18T10:00:00.000Z")
  },
  {
    id: "review-lea",
    rating: 5,
    comment: "LODEN m'a accompagnée pour le CPF et les créneaux d'examen. Une expérience moderne et sérieuse.",
    status: "PUBLIE",
    publishedAt: new Date("2026-05-24T10:00:00.000Z"),
    createdAt: new Date("2026-05-24T10:00:00.000Z"),
    updatedAt: new Date("2026-05-24T10:00:00.000Z")
  }
];

export const initialUsers: UserRecord[] = [
  {
    id: "user-admin",
    firstName: "Admin",
    lastName: "LODEN",
    email: "admin@loden-autoecole.fr",
    role: "SUPER_ADMIN",
    status: "ACTIVE",
    passwordHash: "$2b$12$mRza/sJqI7LAe1tXc9ddveiJQ063tyGfnZV.eZ2RS.nYiHJsY72gm",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "user-sarah",
    firstName: "Sarah",
    lastName: "Benali",
    email: "sarah.benali@loden-autoecole.fr",
    phone: "0600000001",
    role: "MONITEUR",
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "user-mathieu",
    firstName: "Mathieu",
    lastName: "Lefèvre",
    email: "mathieu.lefevre@loden-autoecole.fr",
    phone: "0600000002",
    role: "MONITEUR",
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "user-nadia",
    firstName: "Nadia",
    lastName: "Diallo",
    email: "nadia.diallo@loden-autoecole.fr",
    phone: "0600000003",
    role: "MONITEUR",
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now
  }
];

export const initialInstructors: InstructorRecord[] = [
  {
    id: "instructor-sarah",
    userId: "user-sarah",
    agencyId: "agency-republique",
    name: "Sarah Benali",
    bio: "Référente conduite urbaine.",
    specialties: ["Conduite urbaine", "Permis B manuel"],
    interventionZones: ["Paris 11", "Nation", "République"],
    ratingAverage: 4.9,
    ratingCount: 124,
    active: true
  },
  {
    id: "instructor-mathieu",
    userId: "user-mathieu",
    agencyId: "agency-nation",
    name: "Mathieu Lefèvre",
    bio: "Spécialiste permis accéléré.",
    specialties: ["Permis accéléré", "Boîte automatique"],
    interventionZones: ["Montreuil", "Vincennes", "Paris Est"],
    ratingAverage: 4.8,
    ratingCount: 98,
    active: true
  },
  {
    id: "instructor-nadia",
    userId: "user-nadia",
    agencyId: "agency-republique",
    name: "Nadia Diallo",
    bio: "Coach confiance au volant.",
    specialties: ["Remise à niveau", "Conduite accompagnée"],
    interventionZones: ["Paris 12", "Charonne", "Bastille"],
    ratingAverage: 5,
    ratingCount: 86,
    active: true
  }
];

export const initialMeetingPoints: MeetingPointRecord[] = [
  {
    id: "meeting-republique",
    name: "Point de rendez-vous République",
    address: "24 avenue de la République, 75011 Paris",
    latitude: 48.865,
    longitude: 2.37,
    agencyId: "agency-republique",
    active: true
  },
  {
    id: "meeting-nation",
    name: "Point de rendez-vous Nation",
    address: "Place de la Nation, 75012 Paris",
    latitude: 48.848,
    longitude: 2.395,
    agencyId: "agency-nation",
    active: true
  }
];

export const initialAvailabilities: AvailabilityRecord[] = [
  {
    id: "availability-sarah-1",
    instructorId: "instructor-sarah",
    startsAt: new Date("2026-06-08T08:30:00.000Z"),
    endsAt: new Date("2026-06-08T19:30:00.000Z"),
    isAvailable: true
  },
  {
    id: "availability-mathieu-1",
    instructorId: "instructor-mathieu",
    startsAt: new Date("2026-06-09T08:30:00.000Z"),
    endsAt: new Date("2026-06-09T19:30:00.000Z"),
    isAvailable: true
  },
  {
    id: "availability-nadia-1",
    instructorId: "instructor-nadia",
    startsAt: new Date("2026-06-10T08:30:00.000Z"),
    endsAt: new Date("2026-06-10T19:30:00.000Z"),
    isAvailable: true
  }
];

export const initialFaqEntries: FaqEntryRecord[] = [
  {
    id: "faq-cpf",
    question: "Le permis est-il finançable avec le CPF ?",
    answer: "Oui, les formations permis B éligibles peuvent être accompagnées par LODEN.",
    category: "Financement",
    active: true
  },
  {
    id: "faq-reservation",
    question: "Puis-je réserver une leçon en ligne ?",
    answer: "Oui, l'espace élève permettra de réserver, modifier ou annuler un créneau.",
    category: "Réservation",
    active: true
  }
];
