import type {
  AgencyMembershipRecord,
  AgencyRecord,
  AvailabilityRecord,
  CompanyInfoRecord,
  FaqEntryRecord,
  FormationRecord,
  InstructorRecord,
  MeetingPointRecord,
  PricingPlanRecord,
  ReviewRecord,
  UserRecord
} from "../domain/types";

// Informations société officielles (singleton). Seuls nom, adresse, SIRET et agrément
// sont confirmés ; tél/email/horaires/réseaux/forme/capital restent vides (jamais inventés).
export const initialCompanyInfo: CompanyInfoRecord = {
  id: "company",
  brandName: "LODENE",
  legalName: "",
  address: "30 rue Pierre Le Guen",
  postalCode: "78700",
  city: "Conflans-Sainte-Honorine",
  country: "France",
  siret: "84282888100040",
  approvalNumber: "E2507800260",
  phone: "",
  email: "",
  hours: "",
  legalForm: "",
  capital: "",
  publicationDirector: "",
  hostingProvider: "",
  instagram: "",
  facebook: "",
  tiktok: "",
  youtube: "",
  updatedAt: new Date("2026-06-06T00:00:00.000Z")
};

const now = new Date("2026-06-06T00:00:00.000Z");

// Établissement unique officiel (Conflans-Sainte-Honorine). Coordonnées GPS et
// téléphone/email non confirmés -> laissés vides (jamais inventés).
export const initialAgencies: AgencyRecord[] = [
  {
    id: "agency-republique",
    name: "LODENE Conflans-Sainte-Honorine",
    slug: "conflans-sainte-honorine",
    address: "30 rue Pierre Le Guen, 78700 Conflans-Sainte-Honorine, France",
    latitude: null,
    longitude: null,
    phone: null,
    email: null,
    active: true
  }
];

export const initialAgencyMemberships: AgencyMembershipRecord[] = [
  { id: "membership-admin-republique", userId: "user-admin", agencyId: "agency-republique", role: "SUPER_ADMIN", isPrimary: true }
];

export const initialFormations: FormationRecord[] = [
  {
    id: "formation-permis-b-manuel",
    title: "Permis B manuel",
    slug: "permis-b-manuel",
    description: "Formation complète en boîte manuelle avec suivi jusqu'à l'examen.",
    mode: "MANUEL",
    priceCents: 0,
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
    priceCents: 0,
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
    priceCents: 0,
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
    priceCents: 0,
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
    priceCents: 0,
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
    priceCents: 0,
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
    priceCents: 0,
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
    priceCents: 0,
    durationLabel: "À la carte",
    imageUrl: "/loden-hero.jpg",
    options: { tags: ["Remise à niveau", "Confiance", "À la carte"] },
    cpfEligible: false,
    active: true
  },
  {
    id: "formation-vtc",
    title: "Formation VTC — Carte professionnelle",
    slug: "formation-vtc",
    description:
      "Préparation complète à l'examen VTC : réglementation T3P, sécurité routière, gestion, anglais et développement commercial pour obtenir la carte professionnelle de chauffeur.",
    mode: "MIXTE",
    productLine: "VTC",
    priceCents: 0,
    durationLabel: "Préparation examen + théorie",
    imageUrl: "/loden-hero.jpg",
    options: { tags: ["VTC", "CPF", "Reconversion", "Carte pro"] },
    cpfEligible: true,
    active: true
  },
  {
    id: "formation-vtc-continue",
    title: "VTC — Formation continue (recyclage)",
    slug: "vtc-formation-continue",
    description:
      "Stage de formation continue obligatoire tous les 5 ans pour renouveler la carte VTC : mises à jour réglementaires, sécurité et relation client.",
    mode: "MIXTE",
    productLine: "VTC",
    priceCents: 0,
    durationLabel: "14 h sur 2 jours",
    imageUrl: "/loden-hero.jpg",
    options: { tags: ["VTC", "Recyclage", "Obligatoire 5 ans"] },
    cpfEligible: false,
    active: true
  },
  {
    id: "formation-caces-r489",
    title: "CACES R489 — Chariots élévateurs",
    slug: "caces-r489-chariots",
    description:
      "Certificat d'aptitude à la conduite en sécurité des chariots élévateurs (catégories 1 à 5) : théorie, pratique et passage du test CACES R489.",
    mode: "MIXTE",
    productLine: "CACES",
    priceCents: 0,
    durationLabel: "3 à 5 jours",
    imageUrl: "/loden-hero.jpg",
    options: { tags: ["CACES", "R489", "CPF", "Logistique"] },
    cpfEligible: true,
    active: true
  },
  {
    id: "formation-caces-r486",
    title: "CACES R486 — Nacelles élévatrices (PEMP)",
    slug: "caces-r486-nacelles",
    description:
      "Formation à la conduite des plateformes élévatrices mobiles de personnes (catégories A et B) avec passage du test CACES R486.",
    mode: "MIXTE",
    productLine: "CACES",
    priceCents: 0,
    durationLabel: "2 à 4 jours",
    imageUrl: "/loden-hero.jpg",
    options: { tags: ["CACES", "R486", "CPF", "Nacelle"] },
    cpfEligible: true,
    active: true
  },
  {
    id: "formation-caces-r482",
    title: "CACES R482 — Engins de chantier",
    slug: "caces-r482-engins-chantier",
    description:
      "Formation à la conduite en sécurité des engins de chantier (pelles, chargeuses, mini-pelles…) avec passage du test CACES R482.",
    mode: "MIXTE",
    productLine: "CACES",
    priceCents: 0,
    durationLabel: "3 à 5 jours",
    imageUrl: "/loden-hero.jpg",
    options: { tags: ["CACES", "R482", "CPF", "BTP"] },
    cpfEligible: true,
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
    priceCents: 0,
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
    priceCents: 0,
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
    priceCents: 0,
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

// Aucun avis client vérifié -> aucun avis seedé (pas de faux témoignages).
export const initialReviews: ReviewRecord[] = [];

export const initialUsers: UserRecord[] = [
  {
    id: "user-admin",
    firstName: "Admin",
    lastName: "LODENE",
    email: "admin@loden-autoecole.fr",
    role: "SUPER_ADMIN",
    status: "ACTIVE",
    passwordHash: "$2b$12$mRza/sJqI7LAe1tXc9ddveiJQ063tyGfnZV.eZ2RS.nYiHJsY72gm",
    createdAt: now,
    updatedAt: now
  }
];

// Aucune identité de moniteur vérifiée -> liste vide (pas de fausses personnes).
// Les vrais moniteurs sont créés via le CRM (gestion des moniteurs).
export const initialInstructors: InstructorRecord[] = [];

// Aucun point de rendez-vous confirmé hors établissement -> liste vide.
export const initialMeetingPoints: MeetingPointRecord[] = [];

export const initialAvailabilities: AvailabilityRecord[] = [];

export const initialFaqEntries: FaqEntryRecord[] = [
  {
    id: "faq-cpf",
    question: "Le permis est-il finançable avec le CPF ?",
    answer: "Oui, les formations permis B éligibles peuvent être accompagnées par LODENE.",
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
