import {
  Award,
  BadgeCheck,
  CalendarCheck,
  Car,
  ClipboardCheck,
  CreditCard,
  FileCheck2,
  GraduationCap,
  HeartHandshake,
  MapPin,
  MessageCircle,
  Route,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Target,
  Timer,
  WalletCards
} from "lucide-react";

export const navItems = [
  { href: "/", label: "Accueil" },
  { href: "/formations", label: "Formations" },
  { href: "/tarifs", label: "Tarifs" },
  { href: "/financement", label: "Financement" },
  { href: "/cpf", label: "CPF" },
  { href: "/faq", label: "FAQ" },
  { href: "/a-propos", label: "À propos" },
  { href: "/avis", label: "Avis" },
  { href: "/contact", label: "Contact" }
];

export const legalLinks = [
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/confidentialite", label: "Confidentialité" },
  { href: "/cookies", label: "Cookies" }
];

export const localSeoPages = [
  {
    href: "/permis-b-paris-11",
    label: "Permis B Conflans-Sainte-Honorine",
    title: "Permis B à Conflans-Sainte-Honorine",
    description: "Formation permis B manuel ou automatique à Conflans-Sainte-Honorine (78), avec planning flexible, CPF et suivi élève."
  },
  {
    href: "/auto-ecole-cpf-paris",
    label: "Auto-école CPF Conflans-Sainte-Honorine",
    title: "Auto-école CPF à Conflans-Sainte-Honorine",
    description: "Accompagnement CPF pour financer le permis à Conflans-Sainte-Honorine et dans les Yvelines, avec diagnostic, devis et suivi administratif."
  }
];

// Coordonnées affichées. Source de repli ; éditable via le CMS (CompanyInfo).
// RÈGLE : ne JAMAIS afficher une donnée non vérifiée — les champs non confirmés
// (téléphone, WhatsApp, horaires, email) restent VIDES et l'UI masque les lignes vides.
export const contactInfo = {
  phone: "06 60 32 50 87",
  whatsapp: "",
  address: "30 rue Pierre Le Guen, 78700 Conflans-Sainte-Honorine, France",
  mapQuery: "30 rue Pierre Le Guen, 78700 Conflans-Sainte-Honorine",
  hours:
    "Bureau : mar & mer 10h-12h / 14h-18h · jeu & ven 10h-12h / 14h-20h · sam 9h-12h / 13h-17h (fermé lun & dim). Cours pratiques : 7j/7, 8h-20h sur réservation.",
  email: "ae@lodene.fr"
};

// Données officielles vérifiées de l'entreprise (source de repli ; éditable via CMS CompanyInfo).
// Seuls nom commercial, adresse, SIRET et agrément sont confirmés — le reste reste vide.
export const companyInfo = {
  brandName: "LODENE",
  legalName: "",
  address: "30 rue Pierre Le Guen",
  postalCode: "78700",
  city: "Conflans-Sainte-Honorine",
  country: "France",
  siret: "84282888100040",
  approvalNumber: "E2507800260",
  legalForm: "",
  capital: "",
  publicationDirector: "",
  hostingProvider: ""
};

// Réseaux sociaux : aucun compte officiel confirmé -> liste vide (l'UI n'affiche rien).
// À renseigner via le CMS dès que les comptes officiels sont confirmés.
export const socialLinks: { label: string; href: string }[] = [];

// Source unique des preuves chiffrées (affichage). Toutes les sections — hero,
// page Avis, JSON-LD — lisent ces valeurs pour garantir des chiffres cohérents
// d'une page à l'autre. À mettre à jour avec les chiffres réels validés.
// Preuves chiffrées : AUCUNE statistique n'est officiellement confirmée (taux de réussite,
// nombre d'élèves, note, recommandation). Champs VIDES tant que non vérifiés — l'UI masque
// tout indicateur vide. À renseigner via le CMS avec des chiffres réels.
export const proofStats = {
  ratingDisplay: "",
  ratingValueSchema: "",
  bestRating: "",
  passRate: "",
  studentsAccompanied: "",
  recommendRate: "",
  cpfAccepted: "",
  availability: ""
};

// Indicateurs hero : on n'affiche que ceux dont la valeur est renseignée (filtré à l'usage).
export const heroStats = [
  { label: "de réussite", value: proofStats.passRate },
  { label: "élèves accompagnés", value: proofStats.studentsAccompanied },
  { label: "CPF accepté", value: proofStats.cpfAccepted },
  { label: "réservation", value: proofStats.availability }
].filter((stat) => stat.value);

export const benefits = [
  {
    icon: Timer,
    title: "Formations rapides",
    text: "Des parcours intensifs ou progressifs selon ton rythme."
  },
  {
    icon: Award,
    title: "Moniteurs experts",
    text: "Une équipe certifiée, pédagogue et notée par les élèves."
  },
  {
    icon: WalletCards,
    title: "Paiement flexible",
    text: "CPF, packs, paiement fractionné et accompagnement administratif."
  },
  {
    icon: Target,
    title: "Suivi personnalisé",
    text: "Objectifs, progression, points faibles et planning centralisés."
  }
];

export const trustProofs = [
  {
    icon: ShieldCheck,
    title: "Dossier conforme",
    text: "Contrat, pièces élève et suivi administratif cadrés avant le démarrage."
  },
  {
    icon: BadgeCheck,
    title: "Qualiopi & CPF",
    text: "Parcours compatibles CPF avec accompagnement sur le reste à charge."
  },
  {
    icon: Route,
    title: "Conflans-Sainte-Honorine & Yvelines",
    text: "Formation et points de rendez-vous dans le secteur de Conflans-Sainte-Honorine (78)."
  },
  {
    icon: Star,
    title: "Suivi élève structuré",
    text: "Dossier, progression et étapes centralisés dans l'espace élève."
  }
];

export const credibilityBadges = [
  "Auto-école déclarée",
  "CPF accompagné",
  "Paiement 3x / 4x",
  "Moniteurs diplômés",
  "Suivi élève digital"
];

export const diagnosticSteps = [
  {
    icon: ClipboardCheck,
    title: "Diagnostic permis",
    text: "Formation, niveau, budget, financement et disponibilités clarifiés en quelques minutes."
  },
  {
    icon: CalendarCheck,
    title: "Planning réaliste",
    text: "Un conseiller propose un rythme compatible avec tes contraintes et l'examen visé."
  },
  {
    icon: MessageCircle,
    title: "Réponse rapide",
    text: "Rappel, WhatsApp ou email pour obtenir un devis clair avant inscription."
  }
];

// Pôle métier d'une formation. Par défaut AUTO_ECOLE (permis) ; VTC, SST et
// LOGISTIQUE_SECURITE couvrent le centre de formation professionnelle.
// CACES reste pour compatibilité (sous-ensemble de la logistique & sécurité).
export type ProductLine = "AUTO_ECOLE" | "VTC" | "CACES" | "SST" | "LOGISTIQUE_SECURITE";

export type Formation = {
  title: string;
  slug: string;
  subtitle?: string;
  mode: "Manuel" | "Automatique" | "Mixte" | "Code";
  productLine?: ProductLine;
  duration: string;
  price: number;
  quoteOnly?: boolean;
  cpf: boolean;
  tags: string[];
  description: string;
  imageUrl?: string;
};

// Libellés d'affichage des pôles (menu, filtres, fil d'ariane).
export const productLineLabels: Record<ProductLine, string> = {
  AUTO_ECOLE: "Auto-école",
  VTC: "VTC",
  CACES: "CACES",
  SST: "SST",
  LOGISTIQUE_SECURITE: "Logistique & sécurité"
};

// Catalogue public (SSR/SEO/accueil) — aligné sur la base (backend/src/data/initial-data.ts).
// Prix publics en euros (0 = « sur devis »). Aucun coût/marge interne ici.
export const formations: Formation[] = [
  // ——— Pôle Auto-école / Permis B ———
  {
    title: "Permis B automatique",
    slug: "permis-b-auto-declic",
    subtitle: "Formule Déclic Auto — 13 leçons",
    mode: "Automatique",
    productLine: "AUTO_ECOLE",
    duration: "13 leçons",
    price: 924,
    cpf: true,
    tags: ["Permis B", "Boîte automatique", "Rapide", "CPF possible"],
    description: "Parcours court et confortable pour apprendre à conduire en boîte automatique et avancer efficacement vers l'examen."
  },
  {
    title: "Permis B automatique",
    slug: "permis-b-auto-maitrise",
    subtitle: "Formule Maîtrise Auto — 20 leçons",
    mode: "Automatique",
    productLine: "AUTO_ECOLE",
    duration: "20 leçons",
    price: 1344,
    cpf: true,
    tags: ["Permis B", "Boîte automatique", "CPF possible"],
    description: "Une formule complète en boîte automatique pour progresser sereinement avec davantage d'heures de conduite individuelles."
  },
  {
    title: "Permis B manuel",
    slug: "permis-b-manuel-essentiel",
    subtitle: "Formule Essentiel Manuelle — 20 leçons",
    mode: "Manuel",
    productLine: "AUTO_ECOLE",
    duration: "20 leçons",
    price: 1344,
    cpf: true,
    tags: ["Permis B", "Boîte manuelle", "CPF possible"],
    description: "Formation complète pour apprendre à conduire en boîte manuelle avec un accompagnement pédagogique jusqu'à l'examen."
  },
  {
    title: "Permis B manuel",
    slug: "permis-b-manuel-confort",
    subtitle: "Formule Confort Manuelle — 30 leçons",
    mode: "Manuel",
    productLine: "AUTO_ECOLE",
    duration: "30 leçons",
    price: 1944,
    cpf: true,
    tags: ["Permis B", "Boîte manuelle", "Plus d'heures", "CPF possible"],
    description: "Une formule renforcée en boîte manuelle avec davantage d'heures de conduite pour aborder l'examen en confiance."
  },
  {
    title: "Stage accéléré code et conduite",
    slug: "stage-accelere",
    subtitle: "Parcours intensif",
    mode: "Mixte",
    productLine: "AUTO_ECOLE",
    duration: "2 à 4 semaines",
    price: 0,
    quoteOnly: true,
    cpf: true,
    tags: ["Permis B", "Accéléré", "Planning prioritaire"],
    description: "Un parcours intensif pour avancer plus vite sur le code et la conduite avec une planification resserrée et prioritaire."
  },
  {
    title: "Passerelle BVA vers boîte manuelle",
    slug: "passerelle-bva-manuelle",
    subtitle: "Complément de formation",
    mode: "Manuel",
    productLine: "AUTO_ECOLE",
    duration: "Formation courte",
    price: 0,
    quoteOnly: true,
    cpf: false,
    tags: ["Permis B", "Passerelle", "Boîte manuelle"],
    description: "La passerelle permet d'évoluer d'un permis boîte automatique vers la boîte manuelle après le délai réglementaire applicable."
  },
  {
    title: "Conduite accompagnée",
    slug: "conduite-accompagnee",
    subtitle: "AAC dès 15 ans",
    mode: "Manuel",
    productLine: "AUTO_ECOLE",
    duration: "Dès 15 ans",
    price: 0,
    quoteOnly: true,
    cpf: false,
    tags: ["Permis B", "Jeune conducteur", "Famille"],
    description: "Accompagnement dès 15 ans pour gagner en expérience de conduite avant le passage de l'examen."
  },
  // ——— Pôle VTC ———
  {
    title: "Formation VTC",
    slug: "vtc-distanciel-eco",
    subtitle: "Distanciel Éco",
    mode: "Mixte",
    productLine: "VTC",
    duration: "Accès plateforme 24h/24",
    price: 399,
    cpf: false,
    tags: ["VTC", "Distanciel", "CMA"],
    description: "L'accès essentiel pour préparer les épreuves théoriques VTC avec une plateforme en ligne 24h/24, les 7 modules réglementaires et l'aide au dossier CMA."
  },
  {
    title: "Formation VTC",
    slug: "vtc-intermediaire-light",
    subtitle: "Intermédiaire Light",
    mode: "Mixte",
    productLine: "VTC",
    duration: "Distanciel + 2 visios collectives",
    price: 599,
    cpf: false,
    tags: ["VTC", "Distanciel", "Coaching"],
    description: "Un parcours théorique renforcé avec 2 sessions de révision collectives en visioconférence et un module gestion/tarification."
  },
  {
    title: "Formation VTC",
    slug: "vtc-confort-pro",
    subtitle: "Confort Pro",
    mode: "Mixte",
    productLine: "VTC",
    duration: "Préparation complète sans conduite",
    price: 899,
    cpf: false,
    tags: ["VTC", "Théorie + pratique", "Carte pro"],
    description: "Une préparation complète théorie + épreuve pratique (hors conduite) avec module vidéo, simulations de repérage et assistance carte pro VTC."
  },
  {
    title: "Formation VTC",
    slug: "vtc-excellence",
    subtitle: "Excellence Haute Exigence",
    mode: "Mixte",
    productLine: "VTC",
    duration: "Pack clé en main avec conduite",
    price: 2499,
    cpf: false,
    tags: ["VTC", "Clé en main", "Conduite incluse", "Véhicule examen"],
    description: "La formule clé en main : plateforme complète, frais CMA inclus, 10 h de conduite, véhicule double-commande à l'examen et coaching jusqu'à la carte pro."
  },
  // ——— Pôle SST ———
  {
    title: "SST Initial",
    slug: "sst-initial",
    subtitle: "Sauveteur Secouriste du Travail",
    mode: "Mixte",
    productLine: "SST",
    duration: "14 h / 2 jours",
    price: 120,
    cpf: false,
    tags: ["SST", "Sécurité", "Inter & intra-entreprises"],
    description: "Formation complète pour acquérir les gestes de premiers secours au travail et participer à la prévention des risques. 120 € HT/pers. (inter) ou 1 190 € HT/groupe (intra)."
  },
  {
    title: "MAC SST / Recyclage",
    slug: "mac-sst",
    subtitle: "Maintien et actualisation des compétences",
    mode: "Mixte",
    productLine: "SST",
    duration: "7 h / 1 jour",
    price: 75,
    cpf: false,
    tags: ["SST", "Recyclage", "Inter & intra-entreprises"],
    description: "Formation de maintien et d'actualisation des compétences SST pour les titulaires d'un certificat à renouveler. 75 € HT/pers. (inter) ou 690 € HT/groupe (intra)."
  },
  // ——— Pôle Logistique & sécurité (intra-entreprise, sur devis) ———
  {
    title: "Chariots élévateurs — R489",
    slug: "chariots-elevateurs-r489",
    subtitle: "Conduite en sécurité",
    mode: "Mixte",
    productLine: "LOGISTIQUE_SECURITE",
    duration: "2 à 3 jours selon niveau",
    price: 0,
    quoteOnly: true,
    cpf: false,
    tags: ["Logistique", "R489", "Intra-entreprise", "Sur devis"],
    description: "Formation à la conduite en sécurité des chariots élévateurs (catégories 1, 2, 3, 5) : théorie, pratique, vérifications et chargement/déchargement, sur site client."
  },
  {
    title: "Gerbeur accompagnant — R485",
    slug: "gerbeur-r485",
    subtitle: "Conduite en sécurité",
    mode: "Mixte",
    productLine: "LOGISTIQUE_SECURITE",
    duration: "1 à 2 jours",
    price: 0,
    quoteOnly: true,
    cpf: false,
    tags: ["Logistique", "R485", "Intra-entreprise", "Sur devis"],
    description: "Formation à l'utilisation en sécurité du gerbeur accompagnant, avec mise en pratique sur site client."
  },
  {
    title: "Nacelles / PEMP — R486",
    slug: "nacelles-pemp-r486",
    subtitle: "Travaux en hauteur",
    mode: "Mixte",
    productLine: "LOGISTIQUE_SECURITE",
    duration: "2 à 3 jours",
    price: 0,
    quoteOnly: true,
    cpf: false,
    tags: ["Travaux en hauteur", "R486", "Intra-entreprise", "Sur devis"],
    description: "Formation à l'utilisation réglementaire des plateformes élévatrices mobiles de personnel : prévention des chutes, EPI et stabilisation de l'engin."
  },
  {
    title: "Pont roulant — R484",
    slug: "pont-roulant-r484",
    subtitle: "Commande au sol ou télécommande",
    mode: "Mixte",
    productLine: "LOGISTIQUE_SECURITE",
    duration: "1 à 2 jours",
    price: 0,
    quoteOnly: true,
    cpf: false,
    tags: ["Industrie", "R484", "Intra-entreprise", "Sur devis"],
    description: "Formation à l'utilisation du pont roulant avec commande au sol ou télécommande, incluant l'évaluation pratique sur site."
  },
  {
    title: "Échafaudage roulant — R457",
    slug: "echafaudage-roulant-r457",
    subtitle: "Montage, démontage, utilisation",
    mode: "Mixte",
    productLine: "LOGISTIQUE_SECURITE",
    duration: "1 jour",
    price: 0,
    quoteOnly: true,
    cpf: false,
    tags: ["BTP", "R457", "Intra-entreprise", "Sur devis"],
    description: "Formation au montage, démontage et utilisation en sécurité d'un échafaudage roulant, avec rappel des règles de conformité."
  },
  {
    title: "Terberg / tracteur de parc",
    slug: "terberg-tracteur-parc",
    subtitle: "Manœuvres en environnement logistique",
    mode: "Mixte",
    productLine: "LOGISTIQUE_SECURITE",
    duration: "1 à 2 jours",
    price: 0,
    quoteOnly: true,
    cpf: false,
    tags: ["Logistique", "Parc", "Intra-entreprise", "Sur devis"],
    description: "Formation à la prise en main et aux manœuvres de tracteur de parc, adaptée aux environnements logistiques et industriels."
  }
];

// Contenu éditorial des pages d'atterrissage des pôles professionnels (SEO + conversion).
export const poleLandings: Record<
  "VTC" | "SST" | "LOGISTIQUE_SECURITE",
  {
    eyebrow: string;
    title: string;
    text: string;
    intro: string;
    benefits: { title: string; text: string }[];
  }
> = {
  VTC: {
    eyebrow: "Centre de formation VTC",
    title: "Deviens chauffeur VTC avec une formation reconnue",
    text: "Préparation à l'examen CMA, carte professionnelle et accompagnement administratif : un parcours clair pour te lancer dans le transport de personnes.",
    intro:
      "Le métier de chauffeur VTC attire de nombreuses reconversions. LODENE te prépare aux épreuves officielles VTC (gérées par la Chambre de Métiers et de l'Artisanat) avec 4 formules, de la préparation distancielle au pack clé en main avec conduite et véhicule d'examen.",
    benefits: [
      { title: "Examen CMA préparé", text: "Réglementation, sécurité routière, gestion, anglais et relation client : tous les modules théoriques de l'examen VTC sont couverts." },
      { title: "4 formules dès 399 €", text: "Distanciel Éco, Intermédiaire Light, Confort Pro ou Excellence Haute Exigence (clé en main, jusqu'à 2 499 €)." },
      { title: "Carte professionnelle", text: "Accompagnement administratif jusqu'à l'obtention de la carte VTC (formules Confort Pro et Excellence)." },
      { title: "Conduite & véhicule d'examen", text: "La formule Excellence inclut 10 h de conduite et le véhicule double-commande le jour de l'examen pratique." }
    ]
  },
  SST: {
    eyebrow: "Sauveteur Secouriste du Travail",
    title: "Formez vos salariés au SST avec LODENE",
    text: "SST Initial (14 h) et MAC SST (7 h) : des sessions inter-entreprises ou intra-entreprise pour la prévention des risques au travail.",
    intro:
      "Le SST permet à vos salariés de maîtriser les gestes de premiers secours et de participer à la prévention des risques professionnels. LODENE assure le SST Initial et le recyclage (MAC SST), en inter-entreprises ou directement chez vous.",
    benefits: [
      { title: "SST Initial — 14 h / 2 jours", text: "Gestes de premiers secours, réaction face à un malaise ou un accident, utilisation d'un défibrillateur. 120 € HT/personne en inter." },
      { title: "MAC SST — 7 h / 1 jour", text: "Maintien et actualisation des compétences pour prolonger la validité du certificat. 75 € HT/personne en inter." },
      { title: "Sessions intra-entreprise", text: "Formation sur votre site pour des groupes : 1 190 € HT (SST Initial) ou 690 € HT (MAC SST) par groupe." },
      { title: "Prévention des risques", text: "Un atout conformité pour l'employeur et la sécurité des équipes au quotidien." }
    ]
  },
  LOGISTIQUE_SECURITE: {
    eyebrow: "Logistique, manutention & sécurité",
    title: "Formez vos équipes à la conduite en sécurité",
    text: "Chariots, gerbeur, nacelles, pont roulant, échafaudage, tracteur de parc : des formations intra-entreprise proposées sur devis.",
    intro:
      "LODENE forme vos équipes à l'utilisation en sécurité des équipements de logistique et de manutention, directement sur votre site. Le tarif est établi sur devis car il dépend du matériel, du nombre de participants, du lieu et des objectifs.",
    benefits: [
      { title: "Chariots & gerbeur (R489 / R485)", text: "Conduite en sécurité des chariots élévateurs et du gerbeur accompagnant, théorie et pratique." },
      { title: "Travaux en hauteur (R486 / R457)", text: "Nacelles / PEMP et échafaudage roulant : prévention des chutes, EPI et règles de conformité." },
      { title: "Industrie & parc (R484 / Terberg)", text: "Pont roulant et tracteur de parc adaptés aux environnements industriels et logistiques." },
      { title: "Sur site & sur devis", text: "Sessions intra-entreprise adaptées à vos effectifs, votre matériel et votre financement (OPCO/entreprise)." }
    ]
  }
};

export const pricingPlans = [
  {
    id: "plan-declic-auto",
    slug: "declic-auto-13",
    title: "Déclic Auto — 13 leçons",
    price: 924,
    badge: "Boîte auto",
    features: ["Pack administratif & Code", "Évaluation de départ", "13 h de conduite", "Accompagnement examen", "Suivi Drive inclus"],
    cta: "Choisir ce pack"
  },
  {
    id: "plan-essentiel-manuelle",
    slug: "essentiel-manuelle-20",
    title: "Essentiel Manuelle — 20 leçons",
    price: 1344,
    badge: "Le plus choisi",
    features: ["Pack administratif & Code", "Évaluation de départ", "20 h de conduite", "Accompagnement examen", "Suivi Drive inclus"],
    cta: "Choisir ce pack"
  },
  {
    id: "plan-vtc-distanciel-eco",
    slug: "vtc-distanciel-eco",
    title: "VTC Distanciel Éco",
    price: 399,
    badge: "VTC",
    features: ["Plateforme VTC 24h/24", "7 modules réglementaires", "Aide au dossier CMA", "Examens blancs corrigés"],
    cta: "Voir le pack"
  },
  {
    id: "plan-sst-initial",
    slug: "sst-initial-inter",
    title: "SST Initial",
    price: 120,
    badge: "Entreprises",
    features: ["14 h / 2 jours", "120 € HT / personne (inter)", "1 190 € HT / groupe (intra)", "Certificat SST selon validation"],
    cta: "Demander une session"
  }
];

export type PricingPlan = (typeof pricingPlans)[number];

export const simulatorOptions = {
  formations: [
    { label: "Permis B manuel", value: "manual", hourly: 58, base: 260 },
    { label: "Permis B automatique", value: "auto", hourly: 62, base: 190 },
    { label: "Permis accéléré", value: "fast", hourly: 68, base: 330 }
  ],
  financing: [
    { label: "Classique", value: "classic", discount: 0 },
    { label: "CPF", value: "cpf", discount: 450 },
    { label: "Paiement 4x", value: "split", discount: 0 }
  ]
};

export const slots = [
  { day: "Lun", date: "08", slots: ["08:30", "11:00", "17:30"] },
  { day: "Mar", date: "09", slots: ["09:00", "14:00", "18:00"] },
  { day: "Mer", date: "10", slots: ["10:30", "15:30"] },
  { day: "Jeu", date: "11", slots: ["08:00", "12:30", "16:00"] },
  { day: "Ven", date: "12", slots: ["09:30", "13:30", "19:00"] }
];

export type Instructor = { name: string; role: string; experience: string; rating: string; initials: string };

// Aucune identité de moniteur n'est officiellement vérifiée -> liste vide (pas de fausses personnes).
// L'équipe réelle s'alimente via le CRM (gestion des moniteurs).
export const instructors: Instructor[] = [];

export type Testimonial = { name: string; location: string; rating: number; text: string };

// Aucun avis client vérifié -> liste vide (pas de faux témoignages). À alimenter avec de vrais avis.
export const testimonials: Testimonial[] = [];

export const appFeatures = [
  { icon: CalendarCheck, label: "Réserver une leçon" },
  { icon: GraduationCap, label: "Réviser le code" },
  { icon: BadgeCheck, label: "Suivre sa progression" },
  { icon: Smartphone, label: "Recevoir les notifications" }
];

export const cpfSteps = [
  {
    icon: FileCheck2,
    title: "Diagnostic du besoin",
    text: "On vérifie ton solde CPF, ton niveau et le parcours compatible."
  },
  {
    icon: ShieldCheck,
    title: "Dossier sécurisé",
    text: "Un conseiller prépare les éléments administratifs et le devis."
  },
  {
    icon: CalendarCheck,
    title: "Planning prioritaire",
    text: "Tu réserves tes leçons et suis ton avancement dans l'espace élève."
  }
];

export const values = [
  { icon: HeartHandshake, title: "Bienveillance", text: "Un cadre exigeant, jamais intimidant." },
  { icon: Sparkles, title: "Excellence", text: "Des standards de service élevés à chaque étape." },
  { icon: Car, title: "Mobilité", text: "Une formation utile pour conduire partout, sereinement." }
];

export type FaqEntry = {
  question: string;
  answer: string;
  category: "CPF" | "Tarifs" | "Inscription" | "Formation" | "Examen" | "Permis B" | "VTC" | "SST" | "Logistique & sécurité";
};

export const faqEntries: FaqEntry[] = [
  {
    question: "Le permis B est-il finançable avec le CPF ?",
    answer:
      "Le financement CPF peut être possible selon votre situation et l'éligibilité de votre dossier. Un conseiller LODENE peut vous accompagner dans la vérification.",
    category: "CPF"
  },
  {
    question: "Proposez-vous le permis en boîte automatique ?",
    answer:
      "Oui. LODENE propose des formules boîte automatique : Déclic Auto (13 leçons, 924 € TTC) et Maîtrise Auto (20 leçons, 1 344 € TTC).",
    category: "Permis B"
  },
  {
    question: "Quel est le tarif d'une heure de conduite ?",
    answer: "L'heure de conduite (boîte auto ou manuelle) est affichée à 60 € TTC. Le pack administratif & Code en ligne est à 59 € TTC.",
    category: "Tarifs"
  },
  {
    question: "Puis-je faire un stage accéléré ?",
    answer:
      "Oui, LODENE propose des parcours intensifs selon les disponibilités du planning et votre niveau. Le tarif est établi sur devis.",
    category: "Permis B"
  },
  {
    question: "Peut-on payer en plusieurs fois ?",
    answer:
      "Oui, LODENE propose le paiement en plusieurs fois (3× / 4×) sur les formules permis, en complément du paiement comptant ou d'un financement CPF.",
    category: "Tarifs"
  },
  {
    question: "À quoi prépare la formation VTC ?",
    answer:
      "Elle prépare aux épreuves théoriques et pratiques de l'examen VTC gérées par la Chambre de Métiers et de l'Artisanat (CMA). Nos formules vont de 399 € à 2 499 €.",
    category: "VTC"
  },
  {
    question: "Les frais d'inscription CMA sont-ils inclus pour le VTC ?",
    answer:
      "Les frais CMA sont inclus uniquement dans la formule Excellence Haute Exigence (2 499 €). Les autres formules préparent à l'examen, hors frais d'inscription CMA.",
    category: "VTC"
  },
  {
    question: "Combien de temps dure la formation SST ?",
    answer:
      "Le SST Initial dure 14 heures (2 jours) et le MAC SST / recyclage 7 heures (1 jour). Sessions inter-entreprises ou intra-entreprise chez le client.",
    category: "SST"
  },
  {
    question: "Pourquoi les formations logistique sont-elles sur devis ?",
    answer:
      "Le tarif dépend du matériel, du nombre de participants, du lieu, de la durée et des objectifs. Ces formations sont proposées en intra-entreprise sur site client.",
    category: "Logistique & sécurité"
  },
  {
    question: "Comment se déroule l'inscription ?",
    answer:
      "Vous pouvez envoyer une demande en ligne. L'équipe vous rappelle, vérifie votre objectif, prépare le dossier administratif puis ouvre votre planning et votre espace élève.",
    category: "Inscription"
  }
];

export const searchItems = [
  ...formations.map((formation) => ({
    title: formation.title,
    category: "Formation",
    href: `/formations/${formation.slug}`,
    description: formation.description
  })),
  ...pricingPlans.map((plan) => ({
    title: plan.title,
    category: "Tarif",
    href: "/tarifs",
    description: plan.features.join(", ")
  })),
  {
    title: "Financement CPF",
    category: "Guide",
    href: "/cpf",
    description: "Comprendre le financement CPF avec LODENE."
  },
  {
    title: "Point de rendez-vous République",
    category: "Point de rendez-vous",
    href: "/contact",
    description: contactInfo.address
  },
  {
    title: "Horaires d'ouverture",
    category: "FAQ",
    href: "/contact",
    description: contactInfo.hours
  },
  ...faqEntries.map((entry) => ({
    title: entry.question,
    category: "FAQ",
    href: "/faq",
    description: entry.answer
  })),
  ...localSeoPages.map((page) => ({
    title: page.title,
    category: "Guide local",
    href: page.href,
    description: page.description
  })),
  ...legalLinks.map((page) => ({
    title: page.label,
    category: "Page",
    href: page.href,
    description: "Informations légales et réglementaires LODENE Auto-École."
  }))
];

// Points de rendez-vous — les `id` doivent correspondre à ceux du backend
// (backend/src/data/initial-data.ts → initialMeetingPoints).
// Aucun point de rendez-vous confirmé hors établissement -> liste vide (pas de centres inventés).
export const meetingPoints: { id: string; name: string; address: string }[] = [];

// Faits affichés : uniquement des éléments officiels/vérifiés (implantation, agrément, financement CPF).
export const quickFacts = [
  { icon: MapPin, label: "Conflans-Sainte-Honorine (78)" },
  { icon: ShieldCheck, label: "Agrément E2507800260" },
  { icon: CreditCard, label: "CPF accepté" }
];
