import {
  Award,
  BadgeCheck,
  CalendarCheck,
  Car,
  ClipboardCheck,
  Clock3,
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
  { href: "/cpf", label: "CPF" },
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
    label: "Permis B Paris 11",
    title: "Permis B à Paris 11",
    description: "Formation permis B manuel ou automatique près de République, avec planning flexible, CPF et suivi élève."
  },
  {
    href: "/auto-ecole-cpf-paris",
    label: "Auto-école CPF Paris",
    title: "Auto-école CPF à Paris",
    description: "Accompagnement CPF pour financer le permis à Paris, avec diagnostic, devis et suivi administratif."
  }
];

export const contactInfo = {
  phone: "01 84 80 12 45",
  whatsapp: "33618451245",
  address: "24 avenue de la République, 75011 Paris",
  mapQuery: "24 avenue de la République, 75011 Paris",
  hours: "Lun-Sam 8h-20h",
  email: "contact@loden-autoecole.fr"
};

export const socialLinks = [
  { label: "Instagram LODEN", href: "https://www.instagram.com/loden.autoecole" },
  { label: "Facebook LODEN", href: "https://www.facebook.com/loden.autoecole" }
];

export const heroStats = [
  { label: "de réussite", value: "98 %" },
  { label: "élèves accompagnés", value: "+800" },
  { label: "CPF accepté", value: "100 %" },
  { label: "réservation", value: "7j/7" }
];

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
    title: "Paris 11 & Est parisien",
    text: "Points de rendez-vous pratiques et conduite urbaine orientée examen."
  },
  {
    icon: Star,
    title: "Avis vérifiables",
    text: "Avis élèves modérés dans le CRM et prêts pour synchronisation Google."
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

export type Formation = {
  title: string;
  slug: string;
  mode: "Manuel" | "Automatique" | "Mixte" | "Code";
  duration: string;
  price: number;
  cpf: boolean;
  tags: string[];
  description: string;
};

export const formations: Formation[] = [
  {
    title: "Permis B manuel",
    slug: "permis-b-manuel",
    mode: "Manuel",
    duration: "20 h minimum",
    price: 1190,
    cpf: true,
    tags: ["Débutant", "CPF", "Manuel"],
    description: "La formation complète pour apprendre à conduire en boîte manuelle avec un suivi précis jusqu'à l'examen."
  },
  {
    title: "Permis B automatique",
    slug: "permis-b-automatique",
    mode: "Automatique",
    duration: "13 h minimum",
    price: 890,
    cpf: true,
    tags: ["Automatique", "CPF", "Rapide"],
    description: "Un parcours plus court et confortable pour obtenir ton permis sur boîte automatique."
  },
  {
    title: "Conduite accompagnée",
    slug: "conduite-accompagnee",
    mode: "Manuel",
    duration: "Dès 15 ans",
    price: 1290,
    cpf: false,
    tags: ["Jeune conducteur", "Famille", "Manuel"],
    description: "Un accompagnement complet pour gagner en expérience avant l'examen final."
  },
  {
    title: "Permis accéléré",
    slug: "permis-accelere",
    mode: "Mixte",
    duration: "2 à 4 semaines",
    price: 1590,
    cpf: true,
    tags: ["Accéléré", "CPF", "Planning prioritaire"],
    description: "Un programme condensé avec créneaux prioritaires pour passer le permis rapidement."
  },
  {
    title: "Code en ligne",
    slug: "code-en-ligne",
    mode: "Code",
    duration: "Accès illimité",
    price: 39,
    cpf: false,
    tags: ["Code", "Mobile", "Révisions"],
    description: "Des séries de code, examens blancs et statistiques de progression accessibles depuis l'app."
  },
  {
    title: "Stage de code",
    slug: "stage-code",
    mode: "Code",
    duration: "3 jours",
    price: 199,
    cpf: false,
    tags: ["Stage", "Code", "Intensif"],
    description: "Une préparation intensive en petit groupe pour sécuriser ton passage à l'examen du code."
  },
  {
    title: "Annulation permis",
    slug: "annulation-permis",
    mode: "Mixte",
    duration: "Sur diagnostic",
    price: 490,
    cpf: true,
    tags: ["Remise à niveau", "CPF", "Diagnostic"],
    description: "Un plan de reprise ciblé après invalidation, suspension ou annulation du permis."
  },
  {
    title: "Perfectionnement",
    slug: "perfectionnement",
    mode: "Mixte",
    duration: "À la carte",
    price: 65,
    cpf: false,
    tags: ["Remise à niveau", "Confiance", "À la carte"],
    description: "Des séances pour reprendre confiance, conduire en ville ou préparer un trajet spécifique."
  }
];

export const pricingPlans = [
  {
    id: "plan-permis-b",
    slug: "permis-b",
    title: "Permis B",
    price: 1190,
    badge: "Le plus choisi",
    features: ["20 h de conduite", "Code inclus", "Planning flexible", "Suivi élève"],
    cta: "Choisir ce pack"
  },
  {
    id: "plan-permis-accelere",
    slug: "permis-accelere",
    title: "Permis accéléré",
    price: 1590,
    badge: "Rapide",
    features: ["Parcours 2 à 4 semaines", "Créneaux prioritaires", "Coach référent", "Présentation examen"],
    cta: "Démarrer vite"
  },
  {
    id: "plan-boite-automatique",
    slug: "boite-automatique",
    title: "Boîte automatique",
    price: 890,
    badge: "Confort",
    features: ["13 h de conduite", "Voitures récentes", "Conversion possible", "CPF compatible"],
    cta: "Voir le pack"
  },
  {
    id: "plan-cpf",
    slug: "pack-cpf",
    title: "Pack CPF",
    price: 0,
    badge: "Financé",
    features: ["Montage dossier", "Conseiller dédié", "Devis personnalisé", "Reste à charge optimisé"],
    cta: "Vérifier mon CPF"
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

export const instructors = [
  {
    name: "Sarah Benali",
    role: "Référente conduite urbaine",
    experience: "9 ans d'expérience",
    rating: "4,9",
    initials: "SB"
  },
  {
    name: "Mathieu Lefèvre",
    role: "Spécialiste permis accéléré",
    experience: "11 ans d'expérience",
    rating: "4,8",
    initials: "ML"
  },
  {
    name: "Nadia Diallo",
    role: "Coach confiance au volant",
    experience: "7 ans d'expérience",
    rating: "5,0",
    initials: "ND"
  }
];

export type Instructor = (typeof instructors)[number];

export const testimonials = [
  {
    name: "Camille R.",
    location: "Paris 11",
    rating: 5,
    text: "Inscription rapide, monitrice très claire et planning vraiment flexible. J'ai eu mon permis du premier coup."
  },
  {
    name: "Yanis B.",
    location: "Montreuil",
    rating: 5,
    text: "Le simulateur et l'app donnent une vraie visibilité sur le budget et la progression. Très rassurant."
  },
  {
    name: "Léa M.",
    location: "Vincennes",
    rating: 5,
    text: "LODEN m'a accompagnée pour le CPF et les créneaux d'examen. Une expérience moderne et sérieuse."
  }
];

export type Testimonial = (typeof testimonials)[number];

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
  category: "CPF" | "Tarifs" | "Inscription" | "Formation" | "Examen";
};

export const faqEntries: FaqEntry[] = [
  {
    question: "Le permis peut-il être financé avec le CPF ?",
    answer:
      "Oui, plusieurs formations LODEN sont compatibles CPF. Un conseiller vérifie ton besoin, ton solde disponible, le reste à charge éventuel et les pièces nécessaires avant validation du dossier.",
    category: "CPF"
  },
  {
    question: "Combien coûte le permis B chez LODEN ?",
    answer:
      "Le pack permis B démarre à 1 190 euros avec 20 heures de conduite, code inclus, planning flexible et suivi élève. Un devis personnalisé confirme le tarif selon ton niveau et ton objectif.",
    category: "Tarifs"
  },
  {
    question: "Peut-on payer en plusieurs fois ?",
    answer:
      "Oui, LODEN propose des solutions de paiement fractionné selon le dossier, en complément du paiement comptant, du CPF ou d'un reste à charge estimé.",
    category: "Tarifs"
  },
  {
    question: "Comment se déroule l'inscription ?",
    answer:
      "Tu peux envoyer une demande de diagnostic en ligne. L'équipe te rappelle, vérifie ton objectif, prépare le dossier administratif puis ouvre ton planning et ton espace élève.",
    category: "Inscription"
  },
  {
    question: "Puis-je suivre une formation accélérée ?",
    answer:
      "Oui, le parcours accéléré concentre les heures sur deux à quatre semaines avec des créneaux prioritaires, sous réserve de disponibilités et de validation du niveau de départ.",
    category: "Formation"
  },
  {
    question: "Où se passent les leçons de conduite ?",
    answer:
      "LODEN organise les rendez-vous autour de Paris 11 et de l'Est parisien, avec des parcours urbains utiles pour progresser en circulation dense et préparer l'examen.",
    category: "Formation"
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
    description: "Comprendre le financement CPF avec LODEN."
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
    href: "/cpf",
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
    description: "Informations légales et réglementaires LODEN Auto-École."
  }))
];

// Points de rendez-vous — les `id` doivent correspondre à ceux du backend
// (backend/src/data/initial-data.ts → initialMeetingPoints).
export const meetingPoints = [
  { id: "meeting-republique", name: "République", address: "24 avenue de la République, 75011 Paris" },
  { id: "meeting-nation", name: "Nation", address: "Place de la Nation, 75012 Paris" }
];

export const quickFacts = [
  { icon: PhoneIconPlaceholder, label: contactInfo.phone },
  { icon: MapPin, label: "Paris 11 et Est parisien" },
  { icon: Clock3, label: contactInfo.hours },
  { icon: CreditCard, label: "CPF et paiement 4x" },
  { icon: Star, label: "4,9/5 avis élèves" }
];

function PhoneIconPlaceholder() {
  return null;
}
