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
  SiteSettingRecord,
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
  phone: "06 60 32 50 87",
  email: "ae@lodene.fr",
  hours:
    "Bureau : mardi & mercredi 10h-12h / 14h-18h · jeudi & vendredi 10h-12h / 14h-20h · samedi 9h-12h / 13h-17h (fermé lundi & dimanche). Cours pratiques : 7j/7, 8h-20h sur réservation.",
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
    phone: "06 60 32 50 87",
    email: "ae@lodene.fr",
    active: true
  }
];

export const initialAgencyMemberships: AgencyMembershipRecord[] = [
  { id: "membership-admin-republique", userId: "user-admin", agencyId: "agency-republique", role: "SUPER_ADMIN", isPrimary: true }
];

// Catalogue public LODENE. Prix = tarifs PUBLICS issus du dossier d'intégration
// (à confirmer commercialement avant publication définitive). Aucun coût/marge
// interne n'est stocké ici (internalPriceCents laissé absent) : confidentialité.
export const initialFormations: FormationRecord[] = [
  // ---------------------------------------------------------------------------
  // 1. Auto-école — Permis B
  // ---------------------------------------------------------------------------
  {
    id: "formation-permis-b-auto-declic",
    title: "Permis B automatique",
    slug: "permis-b-auto-declic",
    subtitle: "Formule Déclic Auto — 13 leçons",
    description:
      "Parcours court et confortable pour apprendre à conduire en boîte automatique et avancer efficacement vers l'examen.",
    mode: "AUTOMATIQUE",
    productLine: "AUTO_ECOLE",
    priceCents: 92400,
    taxMode: "TTC",
    quoteOnly: false,
    durationLabel: "13 leçons",
    defaultHours: 13,
    imageUrl: null,
    tags: ["Permis B", "Boîte automatique", "Rapide", "CPF possible"],
    cpfEligible: true,
    cpfStatus: "POSSIBLE",
    active: true
  },
  {
    id: "formation-permis-b-auto-maitrise",
    title: "Permis B automatique",
    slug: "permis-b-auto-maitrise",
    subtitle: "Formule Maîtrise Auto — 20 leçons",
    description:
      "Une formule complète en boîte automatique pour progresser sereinement avec davantage d'heures de conduite individuelles.",
    mode: "AUTOMATIQUE",
    productLine: "AUTO_ECOLE",
    priceCents: 134400,
    taxMode: "TTC",
    quoteOnly: false,
    durationLabel: "20 leçons",
    defaultHours: 20,
    imageUrl: null,
    tags: ["Permis B", "Boîte automatique", "CPF possible"],
    cpfEligible: true,
    cpfStatus: "POSSIBLE",
    active: true
  },
  {
    id: "formation-permis-b-manuel-essentiel",
    title: "Permis B manuel",
    slug: "permis-b-manuel-essentiel",
    subtitle: "Formule Essentiel Manuelle — 20 leçons",
    description:
      "Formation complète pour apprendre à conduire en boîte manuelle avec un accompagnement pédagogique jusqu'à l'examen.",
    mode: "MANUEL",
    productLine: "AUTO_ECOLE",
    priceCents: 134400,
    taxMode: "TTC",
    quoteOnly: false,
    durationLabel: "20 leçons",
    defaultHours: 20,
    imageUrl: null,
    tags: ["Permis B", "Boîte manuelle", "CPF possible"],
    cpfEligible: true,
    cpfStatus: "POSSIBLE",
    active: true
  },
  {
    id: "formation-permis-b-manuel-confort",
    title: "Permis B manuel",
    slug: "permis-b-manuel-confort",
    subtitle: "Formule Confort Manuelle — 30 leçons",
    description:
      "Une formule renforcée en boîte manuelle avec davantage d'heures de conduite pour aborder l'examen en confiance.",
    mode: "MANUEL",
    productLine: "AUTO_ECOLE",
    priceCents: 194400,
    taxMode: "TTC",
    quoteOnly: false,
    durationLabel: "30 leçons",
    defaultHours: 30,
    imageUrl: null,
    tags: ["Permis B", "Boîte manuelle", "Plus d'heures", "CPF possible"],
    cpfEligible: true,
    cpfStatus: "POSSIBLE",
    active: true
  },
  {
    id: "formation-stage-accelere",
    title: "Stage accéléré code et conduite",
    slug: "stage-accelere",
    subtitle: "Parcours intensif",
    description:
      "Un parcours intensif pour avancer plus vite sur le code et la conduite avec une planification resserrée et prioritaire.",
    mode: "MIXTE",
    productLine: "AUTO_ECOLE",
    priceCents: 0,
    taxMode: "TTC",
    quoteOnly: true,
    durationLabel: "2 à 4 semaines",
    imageUrl: null,
    tags: ["Permis B", "Accéléré", "Planning prioritaire"],
    cpfEligible: true,
    cpfStatus: "POSSIBLE",
    active: true
  },
  {
    id: "formation-passerelle-bva-manuelle",
    title: "Passerelle BVA vers boîte manuelle",
    slug: "passerelle-bva-manuelle",
    subtitle: "Complément de formation",
    description:
      "La passerelle permet d'évoluer d'un permis boîte automatique vers la boîte manuelle après le délai réglementaire applicable.",
    mode: "MANUEL",
    productLine: "AUTO_ECOLE",
    priceCents: 0,
    taxMode: "TTC",
    quoteOnly: true,
    durationLabel: "Formation courte",
    imageUrl: null,
    tags: ["Permis B", "Passerelle", "Boîte manuelle"],
    cpfEligible: false,
    cpfStatus: "NON_RENSEIGNE",
    active: true
  },
  {
    id: "formation-conduite-accompagnee",
    title: "Conduite accompagnée",
    slug: "conduite-accompagnee",
    subtitle: "AAC dès 15 ans",
    description:
      "Accompagnement dès 15 ans pour gagner en expérience de conduite avant le passage de l'examen.",
    mode: "MANUEL",
    productLine: "AUTO_ECOLE",
    priceCents: 0,
    taxMode: "TTC",
    quoteOnly: true,
    durationLabel: "Dès 15 ans",
    defaultHours: 20,
    imageUrl: null,
    tags: ["Permis B", "Jeune conducteur", "Famille"],
    cpfEligible: false,
    cpfStatus: "NON_RENSEIGNE",
    active: true
  },
  // ---------------------------------------------------------------------------
  // 2. Formation chauffeur VTC (préparation examen CMA / T3P)
  // ---------------------------------------------------------------------------
  {
    id: "formation-vtc-distanciel-eco",
    title: "Formation VTC",
    slug: "vtc-distanciel-eco",
    subtitle: "Distanciel Éco",
    description:
      "L'accès essentiel pour préparer les épreuves théoriques VTC avec une plateforme en ligne disponible 24h/24, couvrant les 7 modules réglementaires et l'aide au dossier CMA.",
    mode: "MIXTE",
    productLine: "VTC",
    priceCents: 39900,
    taxMode: "TTC",
    quoteOnly: false,
    durationLabel: "Accès plateforme 24h/24",
    imageUrl: null,
    tags: ["VTC", "Distanciel", "CMA"],
    cpfEligible: false,
    cpfStatus: "A_CONFIRMER",
    active: true
  },
  {
    id: "formation-vtc-intermediaire-light",
    title: "Formation VTC",
    slug: "vtc-intermediaire-light",
    subtitle: "Intermédiaire Light",
    description:
      "Un parcours théorique renforcé avec 2 sessions de révision collectives en visioconférence et un module gestion/tarification pour consolider la préparation.",
    mode: "MIXTE",
    productLine: "VTC",
    priceCents: 59900,
    taxMode: "TTC",
    quoteOnly: false,
    durationLabel: "Distanciel + 2 visios collectives",
    imageUrl: null,
    tags: ["VTC", "Distanciel", "Coaching"],
    cpfEligible: false,
    cpfStatus: "A_CONFIRMER",
    active: true
  },
  {
    id: "formation-vtc-confort-pro",
    title: "Formation VTC",
    slug: "vtc-confort-pro",
    subtitle: "Confort Pro",
    description:
      "Une préparation complète théorie + épreuve pratique (hors conduite) avec module vidéo, simulations de repérage et assistance pour la carte professionnelle VTC.",
    mode: "MIXTE",
    productLine: "VTC",
    priceCents: 89900,
    taxMode: "TTC",
    quoteOnly: false,
    durationLabel: "Préparation complète sans conduite",
    imageUrl: null,
    tags: ["VTC", "Théorie + pratique", "Carte pro"],
    cpfEligible: false,
    cpfStatus: "A_CONFIRMER",
    active: true
  },
  {
    id: "formation-vtc-excellence",
    title: "Formation VTC",
    slug: "vtc-excellence",
    subtitle: "Excellence Haute Exigence",
    description:
      "La formule clé en main : plateforme complète, frais d'inscription CMA inclus, 10 h de conduite, véhicule double-commande le jour de l'examen et coaching jusqu'à l'obtention de la carte pro.",
    mode: "MIXTE",
    productLine: "VTC",
    priceCents: 249900,
    taxMode: "TTC",
    quoteOnly: false,
    durationLabel: "Pack clé en main avec conduite",
    imageUrl: null,
    tags: ["VTC", "Clé en main", "Conduite incluse", "Véhicule examen"],
    cpfEligible: false,
    cpfStatus: "A_CONFIRMER",
    active: true
  },
  // ---------------------------------------------------------------------------
  // 3. SST — Sauveteur Secouriste du Travail (tarifs HT)
  // ---------------------------------------------------------------------------
  {
    id: "formation-sst-initial",
    title: "SST Initial",
    slug: "sst-initial",
    subtitle: "Sauveteur Secouriste du Travail",
    description:
      "Formation complète pour acquérir les gestes de premiers secours au travail et participer à la prévention des risques professionnels. Sessions inter-entreprises (120 € HT/pers.) ou intra-entreprise (1 190 € HT/groupe).",
    mode: "MIXTE",
    productLine: "SST",
    priceCents: 12000,
    taxMode: "HT",
    quoteOnly: false,
    durationLabel: "14 h / 2 jours",
    imageUrl: null,
    tags: ["SST", "Sécurité", "Inter & intra-entreprises"],
    cpfEligible: false,
    cpfStatus: "NON_RENSEIGNE",
    active: true
  },
  {
    id: "formation-mac-sst",
    title: "MAC SST / Recyclage",
    slug: "mac-sst",
    subtitle: "Maintien et actualisation des compétences",
    description:
      "Formation de maintien et d'actualisation des compétences SST pour les titulaires d'un certificat à renouveler. Inter-entreprises (75 € HT/pers.) ou intra-entreprise (690 € HT/groupe).",
    mode: "MIXTE",
    productLine: "SST",
    priceCents: 7500,
    taxMode: "HT",
    quoteOnly: false,
    durationLabel: "7 h / 1 jour",
    imageUrl: null,
    tags: ["SST", "Recyclage", "Inter & intra-entreprises"],
    cpfEligible: false,
    cpfStatus: "NON_RENSEIGNE",
    active: true
  },
  // ---------------------------------------------------------------------------
  // 4. Logistique & sécurité (intra-entreprise, sur devis — tarifs HT)
  // ---------------------------------------------------------------------------
  {
    id: "formation-chariots-r489",
    title: "Chariots élévateurs — R489",
    slug: "chariots-elevateurs-r489",
    subtitle: "Conduite en sécurité",
    description:
      "Formation à la conduite en sécurité des chariots élévateurs (catégories 1, 2, 3, 5) : théorie, pratique, vérifications de base et techniques de chargement/déchargement, sur site client.",
    mode: "MIXTE",
    productLine: "LOGISTIQUE_SECURITE",
    priceCents: 0,
    taxMode: "HT",
    quoteOnly: true,
    durationLabel: "2 à 3 jours selon niveau",
    imageUrl: null,
    tags: ["Logistique", "R489", "Intra-entreprise", "Sur devis"],
    cpfEligible: false,
    cpfStatus: "NON_RENSEIGNE",
    active: true
  },
  {
    id: "formation-gerbeur-r485",
    title: "Gerbeur accompagnant — R485",
    slug: "gerbeur-r485",
    subtitle: "Conduite en sécurité",
    description:
      "Formation à l'utilisation en sécurité du gerbeur accompagnant, avec mise en pratique sur site client.",
    mode: "MIXTE",
    productLine: "LOGISTIQUE_SECURITE",
    priceCents: 0,
    taxMode: "HT",
    quoteOnly: true,
    durationLabel: "1 à 2 jours",
    imageUrl: null,
    tags: ["Logistique", "R485", "Intra-entreprise", "Sur devis"],
    cpfEligible: false,
    cpfStatus: "NON_RENSEIGNE",
    active: true
  },
  {
    id: "formation-nacelles-r486",
    title: "Nacelles / PEMP — R486",
    slug: "nacelles-pemp-r486",
    subtitle: "Travaux en hauteur",
    description:
      "Formation à l'utilisation réglementaire des plateformes élévatrices mobiles de personnel : prévention des chutes, EPI et stabilisation de l'engin.",
    mode: "MIXTE",
    productLine: "LOGISTIQUE_SECURITE",
    priceCents: 0,
    taxMode: "HT",
    quoteOnly: true,
    durationLabel: "2 à 3 jours",
    imageUrl: null,
    tags: ["Travaux en hauteur", "R486", "Intra-entreprise", "Sur devis"],
    cpfEligible: false,
    cpfStatus: "NON_RENSEIGNE",
    active: true
  },
  {
    id: "formation-pont-roulant-r484",
    title: "Pont roulant — R484",
    slug: "pont-roulant-r484",
    subtitle: "Commande au sol ou télécommande",
    description:
      "Formation à l'utilisation du pont roulant avec commande au sol ou télécommande, incluant l'évaluation pratique sur site.",
    mode: "MIXTE",
    productLine: "LOGISTIQUE_SECURITE",
    priceCents: 0,
    taxMode: "HT",
    quoteOnly: true,
    durationLabel: "1 à 2 jours",
    imageUrl: null,
    tags: ["Industrie", "R484", "Intra-entreprise", "Sur devis"],
    cpfEligible: false,
    cpfStatus: "NON_RENSEIGNE",
    active: true
  },
  {
    id: "formation-echafaudage-r457",
    title: "Échafaudage roulant — R457",
    slug: "echafaudage-roulant-r457",
    subtitle: "Montage, démontage, utilisation",
    description:
      "Formation au montage, démontage et utilisation en sécurité d'un échafaudage roulant, avec rappel des règles de conformité.",
    mode: "MIXTE",
    productLine: "LOGISTIQUE_SECURITE",
    priceCents: 0,
    taxMode: "HT",
    quoteOnly: true,
    durationLabel: "1 jour",
    imageUrl: null,
    tags: ["BTP", "R457", "Intra-entreprise", "Sur devis"],
    cpfEligible: false,
    cpfStatus: "NON_RENSEIGNE",
    active: true
  },
  {
    id: "formation-terberg",
    title: "Terberg / tracteur de parc",
    slug: "terberg-tracteur-parc",
    subtitle: "Manœuvres en environnement logistique",
    description:
      "Formation à la prise en main et aux manœuvres de tracteur de parc, adaptée aux environnements logistiques et industriels.",
    mode: "MIXTE",
    productLine: "LOGISTIQUE_SECURITE",
    priceCents: 0,
    taxMode: "HT",
    quoteOnly: true,
    durationLabel: "1 à 2 jours",
    imageUrl: null,
    tags: ["Logistique", "Parc", "Intra-entreprise", "Sur devis"],
    cpfEligible: false,
    cpfStatus: "NON_RENSEIGNE",
    active: true
  },

  // ---------------------------------------------------------------------------
  // 5. Tech, Web & IA
  // ---------------------------------------------------------------------------
  {
    id: "formation-ia-crm-automatisation",
    title: "Formation IA, CRM & Automatisation",
    slug: "ia-crm-automatisation",
    subtitle: "Pack signature — 14H",
    description:
      "Formation courte et concrète pour digitaliser, organiser et automatiser son activité : structurer un mini-CRM, utiliser l'IA au quotidien et automatiser les relances et tâches répétitives.",
    mode: "MIXTE",
    productLine: "DIGITAL",
    priceCents: 99000,
    taxMode: "HT",
    quoteOnly: false,
    durationLabel: "14 heures",
    defaultHours: 14,
    imageUrl: "/formations/photos/digital-internet-crm-automation.webp",
    tags: ["IA", "CRM", "Automatisation", "Présentiel", "Distanciel"],
    cpfEligible: false,
    cpfStatus: "NON_ELIGIBLE",
    active: true
  },
  {
    id: "formation-site-web-landing-page",
    title: "Site web & landing page",
    slug: "site-web-landing-page",
    subtitle: "Créer une présence web qui convertit",
    description:
      "Construire ou refondre une page web professionnelle : message clair, structure de landing page, formulaire de contact, SEO local, suivi des conversions et parcours de demande de devis.",
    mode: "MIXTE",
    productLine: "DIGITAL",
    priceCents: 69000,
    taxMode: "HT",
    quoteOnly: false,
    durationLabel: "7 heures",
    defaultHours: 7,
    imageUrl: "/formations/photos/digital-code-web-development.webp",
    tags: ["Web", "Landing page", "SEO local", "Conversion"],
    cpfEligible: false,
    cpfStatus: "NON_ELIGIBLE",
    active: true
  },
  {
    id: "formation-ia-professionnels",
    title: "L'IA pour les professionnels",
    slug: "ia-professionnels",
    subtitle: "Gagner du temps au quotidien",
    description:
      "Prendre en main les assistants IA avec des prompts métier prêts à l'emploi pour rédiger, répondre, qualifier les demandes et gagner en productivité.",
    mode: "MIXTE",
    productLine: "DIGITAL",
    priceCents: 59000,
    taxMode: "HT",
    quoteOnly: false,
    durationLabel: "7 heures",
    defaultHours: 7,
    imageUrl: "/formations/photos/digital-ai-agent-training.webp",
    tags: ["IA", "Productivité", "Présentiel", "Distanciel"],
    cpfEligible: false,
    cpfStatus: "NON_ELIGIBLE",
    active: true
  },
  {
    id: "formation-mini-crm",
    title: "Créer & piloter son mini-CRM",
    slug: "mini-crm",
    subtitle: "Suivi prospects, devis & relances",
    description:
      "Mettre en place un CRM simple et efficace : base prospects/clients, statuts, pipeline commercial, suivi des devis, relances et tableau de bord.",
    mode: "MIXTE",
    productLine: "DIGITAL",
    priceCents: 69000,
    taxMode: "HT",
    quoteOnly: false,
    durationLabel: "7 heures",
    defaultHours: 7,
    imageUrl: "/formations/photos/digital-internet-crm-automation.webp",
    tags: ["CRM", "Prospection", "Organisation"],
    cpfEligible: false,
    cpfStatus: "NON_ELIGIBLE",
    active: true
  },
  {
    id: "formation-automatisation-no-code",
    title: "Automatisation no-code",
    slug: "automatisation-no-code",
    subtitle: "Relances, notifications, workflows",
    description:
      "Automatiser les tâches répétitives sans coder : notifications, rappels, relances automatiques, prises de rendez-vous et workflows simples.",
    mode: "MIXTE",
    productLine: "DIGITAL",
    priceCents: 69000,
    taxMode: "HT",
    quoteOnly: false,
    durationLabel: "7 heures",
    defaultHours: 7,
    imageUrl: "/formations/photos/digital-transformation-training.webp",
    tags: ["Automatisation", "No-code", "Workflows"],
    cpfEligible: false,
    cpfStatus: "NON_ELIGIBLE",
    active: true
  },
  {
    id: "formation-prospection-presence-en-ligne",
    title: "Prospection & présence en ligne",
    slug: "prospection-presence-en-ligne",
    subtitle: "Site, Google, réseaux sociaux",
    description:
      "Développer sa visibilité et sa prospection : fiche Google, site vitrine, réseaux sociaux et messages commerciaux efficaces pour générer plus de demandes.",
    mode: "MIXTE",
    productLine: "DIGITAL",
    priceCents: 59000,
    taxMode: "HT",
    quoteOnly: false,
    durationLabel: "7 heures",
    defaultHours: 7,
    imageUrl: "/formations/photos/digital-transformation-training.webp",
    tags: ["Prospection", "Web", "Réseaux sociaux"],
    cpfEligible: false,
    cpfStatus: "NON_ELIGIBLE",
    active: true
  }
];

// Tarifs publics (packs et formules). Montants en centimes. Tarifs internes/marges
// non stockés ici. Le détail à l'unité reste dans les `features`.
export const initialPricingPlans: PricingPlanRecord[] = [
  // --- Auto-école : prestations à l'unité ---
  {
    id: "plan-unite-auto-ecole",
    title: "Prestations à l'unité",
    slug: "prestations-unite",
    description: "Tarifs à la carte pour compléter une formation ou avancer à votre rythme.",
    priceCents: 6000,
    features: [
      "Heure de conduite (auto ou manuelle) : 60 € TTC",
      "Accompagnement à l'examen pratique : 60 € TTC",
      "Évaluation de départ : 60 € TTC",
      "Pack administratif & Code en ligne : 59 € TTC",
      "Suivi Drive / pédagogique numérique : 15 € TTC"
    ],
    allowOneShotPayment: true,
    allowThreeTimes: false,
    allowFourTimes: false,
    discountCents: 0,
    promotionalLabel: "À la carte",
    active: true
  },
  // --- Permis B : boîte automatique ---
  {
    id: "plan-declic-auto",
    formationId: "formation-permis-b-auto-declic",
    title: "Déclic Auto — 13 leçons",
    slug: "declic-auto-13",
    description: "Formule boîte automatique pour démarrer vite et bien.",
    priceCents: 92400,
    features: [
      "Pack administratif & Code : 59 €",
      "Évaluation de départ : 60 €",
      "13 h de conduite : 780 €",
      "Accompagnement examen : 60 €",
      "Suivi Drive inclus : 15 €"
    ],
    allowOneShotPayment: true,
    allowThreeTimes: true,
    allowFourTimes: true,
    discountCents: 0,
    promotionalLabel: "Boîte auto",
    active: true
  },
  {
    id: "plan-maitrise-auto",
    formationId: "formation-permis-b-auto-maitrise",
    title: "Maîtrise Auto — 20 leçons",
    slug: "maitrise-auto-20",
    description: "Formule complète en boîte automatique, plus d'heures de conduite.",
    priceCents: 134400,
    features: [
      "Pack administratif & Code : 59 €",
      "Évaluation de départ : 60 €",
      "20 h de conduite : 1 200 €",
      "Accompagnement examen : 60 €",
      "Suivi Drive inclus : 15 €"
    ],
    allowOneShotPayment: true,
    allowThreeTimes: true,
    allowFourTimes: true,
    discountCents: 0,
    promotionalLabel: null,
    active: true
  },
  // --- Permis B : boîte manuelle ---
  {
    id: "plan-essentiel-manuelle",
    formationId: "formation-permis-b-manuel-essentiel",
    title: "Essentiel Manuelle — 20 leçons",
    slug: "essentiel-manuelle-20",
    description: "Formule complète en boîte manuelle avec accompagnement jusqu'à l'examen.",
    priceCents: 134400,
    features: [
      "Pack administratif & Code : 59 €",
      "Évaluation de départ : 60 €",
      "20 h de conduite : 1 200 €",
      "Accompagnement examen : 60 €",
      "Suivi Drive inclus : 15 €"
    ],
    allowOneShotPayment: true,
    allowThreeTimes: true,
    allowFourTimes: true,
    discountCents: 0,
    promotionalLabel: "Le plus choisi",
    active: true
  },
  {
    id: "plan-confort-manuelle",
    formationId: "formation-permis-b-manuel-confort",
    title: "Confort Manuelle — 30 leçons",
    slug: "confort-manuelle-30",
    description: "Formule renforcée en boîte manuelle pour aborder l'examen en confiance.",
    priceCents: 194400,
    features: [
      "Pack administratif & Code : 59 €",
      "Évaluation de départ : 60 €",
      "30 h de conduite : 1 800 €",
      "Accompagnement examen : 60 €",
      "Suivi Drive inclus : 15 €"
    ],
    allowOneShotPayment: true,
    allowThreeTimes: true,
    allowFourTimes: true,
    discountCents: 0,
    promotionalLabel: null,
    active: true
  },
  // --- VTC ---
  {
    id: "plan-vtc-distanciel-eco",
    formationId: "formation-vtc-distanciel-eco",
    title: "VTC Distanciel Éco",
    slug: "vtc-distanciel-eco",
    description: "Plateforme en ligne + suivi administratif pour préparer l'examen VTC.",
    priceCents: 39900,
    features: ["Plateforme VTC 24h/24", "7 modules réglementaires", "Aide au dossier CMA", "Examens blancs corrigés"],
    allowOneShotPayment: true,
    allowThreeTimes: true,
    allowFourTimes: false,
    discountCents: 0,
    promotionalLabel: "Économique",
    active: true
  },
  {
    id: "plan-vtc-intermediaire-light",
    formationId: "formation-vtc-intermediaire-light",
    title: "VTC Intermédiaire Light",
    slug: "vtc-intermediaire-light",
    description: "Distanciel renforcé avec coaching collectif.",
    priceCents: 59900,
    features: ["Tout Distanciel Éco", "2 visios collectives", "Module gestion & tarification", "Fiches de synthèse"],
    allowOneShotPayment: true,
    allowThreeTimes: true,
    allowFourTimes: false,
    discountCents: 0,
    promotionalLabel: null,
    active: true
  },
  {
    id: "plan-vtc-confort-pro",
    formationId: "formation-vtc-confort-pro",
    title: "VTC Confort Pro",
    slug: "vtc-confort-pro",
    description: "Préparation complète théorie + épreuve pratique (hors conduite).",
    priceCents: 89900,
    features: ["Tout Intermédiaire Light", "Module vidéo épreuve pratique", "Simulations repérage & parcours", "Assistance carte pro VTC"],
    allowOneShotPayment: true,
    allowThreeTimes: true,
    allowFourTimes: false,
    discountCents: 0,
    promotionalLabel: null,
    active: true
  },
  {
    id: "plan-vtc-excellence",
    formationId: "formation-vtc-excellence",
    title: "VTC Excellence Haute Exigence",
    slug: "vtc-excellence",
    description: "Pack clé en main avec conduite et véhicule d'examen.",
    priceCents: 249900,
    features: ["Plateforme complète", "Frais CMA inclus", "10 h de conduite", "Véhicule double-commande à l'examen", "Coaching jusqu'à la carte pro"],
    allowOneShotPayment: true,
    allowThreeTimes: true,
    allowFourTimes: true,
    discountCents: 0,
    promotionalLabel: "Clé en main",
    active: true
  },
  // --- SST (tarifs HT, sessions inter-entreprises) ---
  {
    id: "plan-sst-initial",
    formationId: "formation-sst-initial",
    title: "SST Initial",
    slug: "sst-initial-inter",
    description: "Session inter-entreprises — Sauveteur Secouriste du Travail (14 h / 2 jours).",
    priceCents: 12000,
    features: ["14 h / 2 jours", "120 € HT / personne (inter)", "1 190 € HT / groupe (intra)", "Certificat SST selon validation"],
    allowOneShotPayment: true,
    allowThreeTimes: false,
    allowFourTimes: false,
    discountCents: 0,
    promotionalLabel: "Entreprises",
    active: true
  },
  {
    id: "plan-mac-sst",
    formationId: "formation-mac-sst",
    title: "MAC SST / Recyclage",
    slug: "mac-sst-inter",
    description: "Session inter-entreprises — maintien et actualisation des compétences (7 h / 1 jour).",
    priceCents: 7500,
    features: ["7 h / 1 jour", "75 € HT / personne (inter)", "690 € HT / groupe (intra)", "Prolongation de validité SST"],
    allowOneShotPayment: true,
    allowThreeTimes: false,
    allowFourTimes: false,
    discountCents: 0,
    promotionalLabel: "Entreprises",
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
    question: "Le permis B est-il finançable avec le CPF ?",
    answer:
      "Le financement CPF peut être possible selon votre situation et l'éligibilité de votre dossier. Un conseiller LODENE peut vous accompagner dans la vérification.",
    category: "Financement",
    active: true
  },
  {
    id: "faq-boite-auto",
    question: "Proposez-vous le permis en boîte automatique ?",
    answer:
      "Oui. LODENE propose des formules boîte automatique : Déclic Auto (13 leçons, 924 € TTC) et Maîtrise Auto (20 leçons, 1 344 € TTC).",
    category: "Permis B",
    active: true
  },
  {
    id: "faq-heure-conduite",
    question: "Quel est le tarif d'une heure de conduite ?",
    answer: "L'heure de conduite (boîte auto ou manuelle) est affichée à 60 € TTC.",
    category: "Permis B",
    active: true
  },
  {
    id: "faq-stage-accelere",
    question: "Puis-je faire un stage accéléré ?",
    answer:
      "Oui, LODENE propose des parcours intensifs selon les disponibilités du planning et votre niveau. Le tarif est établi sur devis.",
    category: "Permis B",
    active: true
  },
  {
    id: "faq-vtc-examen",
    question: "À quoi prépare la formation VTC ?",
    answer:
      "Elle prépare aux épreuves théoriques et pratiques de l'examen VTC gérées par la Chambre de Métiers et de l'Artisanat (CMA). Nos formules vont de 399 € à 2 499 €.",
    category: "VTC",
    active: true
  },
  {
    id: "faq-vtc-cma",
    question: "Les frais d'inscription CMA sont-ils inclus ?",
    answer:
      "Les frais CMA sont inclus uniquement dans la formule Excellence Haute Exigence (2 499 €). Les autres formules préparent à l'examen, hors frais d'inscription CMA.",
    category: "VTC",
    active: true
  },
  {
    id: "faq-sst-duree",
    question: "Combien de temps dure la formation SST ?",
    answer:
      "Le SST Initial dure 14 heures (2 jours) et le MAC SST / recyclage 7 heures (1 jour). Sessions inter-entreprises ou intra-entreprise chez le client.",
    category: "SST",
    active: true
  },
  {
    id: "faq-logistique-devis",
    question: "Pourquoi les formations logistique sont-elles sur devis ?",
    answer:
      "Le tarif dépend du matériel, du nombre de participants, du lieu, de la durée et des objectifs. Ces formations sont proposées en intra-entreprise sur site client.",
    category: "Logistique & sécurité",
    active: true
  },
  {
    id: "faq-reservation",
    question: "Puis-je réserver une leçon en ligne ?",
    answer: "Oui, l'espace élève permet de réserver, modifier ou annuler un créneau de conduite.",
    category: "Réservation",
    active: true
  }
];

// Réglages dynamiques du site public (pilotés via le CMS). Valeurs par défaut = état
// actuel du site (fallback). IMPORTANT : garder en phase avec lib/site-content.ts (front).
const SITE_SETTINGS_DEFAULT_DATE = new Date("2025-01-01T00:00:00.000Z");

export const initialSiteSettings: SiteSettingRecord[] = [
  {
    key: "nav.primary",
    updatedAt: SITE_SETTINGS_DEFAULT_DATE,
    value: {
      items: [
        {
          id: "formations",
          label: "Formations",
          href: "/formations",
          active: true,
          icon: "GraduationCap",
          children: [
            { id: "permis", label: "Permis B & conduite", href: "/formations", active: true, icon: "Car" },
            { id: "vtc", label: "VTC & transport", href: "/vtc", active: true, icon: "CarTaxiFront" },
            { id: "securite", label: "Sécurité & secourisme (SST)", href: "/sst", active: true, icon: "ShieldCheck" },
            { id: "caces", label: "CACES & logistique", href: "/logistique-securite", active: true, icon: "HardHat" },
            { id: "digital", label: "Tech, Web & IA", href: "/digital", active: true, icon: "Sparkles" },
            { id: "toutes", label: "Toutes les formations", href: "/formations", active: true, icon: "GraduationCap" }
          ]
        },
        {
          id: "financement",
          label: "Financement",
          href: "/financement",
          active: true,
          icon: "WalletCards",
          children: [
            { id: "financement", label: "Financement", href: "/financement", active: true, icon: "WalletCards" },
            { id: "cpf", label: "CPF", href: "/cpf", active: true, icon: "WalletCards" },
            { id: "tarifs", label: "Tarifs", href: "/tarifs", active: true, icon: "CreditCard" },
            { id: "paiement", label: "Paiement en plusieurs fois", href: "/tarifs#simulateur", active: true, icon: "CreditCard" }
          ]
        },
        { id: "agences", label: "Nos agences", href: "/contact#agences", active: true, icon: "Building2" },
        {
          id: "decouvrir",
          label: "Découvrir",
          href: "/a-propos",
          active: true,
          icon: "Sparkles",
          children: [
            { id: "a-propos", label: "À propos", href: "/a-propos", active: true, icon: "Info" },
            { id: "faq", label: "FAQ", href: "/faq", active: true, icon: "CircleHelp" },
            { id: "blog", label: "Blog", href: "/blog", active: true, icon: "Newspaper" }
          ]
        },
        { id: "avis", label: "Avis", href: "/avis", active: true, icon: "Star" },
        { id: "contact", label: "Contact", href: "/contact", active: true, icon: "MessageCircle" }
      ]
    }
  },
  {
    key: "nav.ctas",
    updatedAt: SITE_SETTINGS_DEFAULT_DATE,
    value: {
      items: [
        { id: "inscription", label: "Inscription", href: "/inscription", active: true, icon: "Sparkles", variant: "solid" }
      ]
    }
  },
  {
    key: "hero.home",
    updatedAt: SITE_SETTINGS_DEFAULT_DATE,
    value: {
      enabled: true,
      scriptLine: "Passe ton permis",
      connector: "avec",
      brand: "LODENE",
      subtitle: "Une formation claire, rapide et flexible, adaptée à ton rythme.",
      image: "/loden-hero.jpg",
      imageAlt: "Voiture école moderne LODENE avec élève et moniteur",
      primaryCta: { label: "Je m'inscris", href: "/inscription" },
      secondaryCta: { label: "Nos formations", href: "/formations" },
      badges: [
        { icon: "ShieldCheck", title: "Agréée", detail: "Agrément E2507800260" },
        { icon: "MapPin", title: "Conflans", detail: "Sainte-Honorine (78)" },
        { icon: "WalletCards", title: "CPF", detail: "formations éligibles" }
      ]
    }
  },
  {
    // Avis Google. Place ID/liens vides par défaut : la section se configure depuis
    // le CRM (/admin/site/avis-google). Aucun faux avis n'est injecté.
    key: "google.reviews",
    updatedAt: SITE_SETTINGS_DEFAULT_DATE,
    value: {
      enabled: true,
      showOnHomepage: true,
      placeId: "",
      reviewUrl: "",
      profileUrl: "",
      sectionTitle: "Ils ont passé leur permis avec nous",
      sectionSubtitle: "Les avis de nos élèves, directement depuis Google.",
      minRating: 4,
      maxReviews: 6,
      fallbackRating: 0,
      fallbackCount: 0
    }
  }
];
