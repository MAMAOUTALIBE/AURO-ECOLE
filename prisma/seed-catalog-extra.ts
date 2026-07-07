/**
 * Catalogue de départ — centre de formation LODENE.
 * Ajoute le pôle Digital (IA/CRM/Automatisation, d'après le pack) + des compléments
 * Sécurité / Transport / Mobilité, en complément du catalogue auto-école existant.
 *
 * IDEMPOTENT et NON destructif : ne crée que les formations dont le slug n'existe pas
 * encore. Une formation déjà présente (ou éditée dans le CRM) n'est jamais écrasée.
 *
 * Lancer : npx tsx --env-file=.env prisma/seed-catalog-extra.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Mode = "MANUEL" | "AUTOMATIQUE" | "MIXTE" | "CODE";
type Pole = "AUTO_ECOLE" | "VTC" | "CACES" | "SST" | "LOGISTIQUE_SECURITE" | "DIGITAL";
type Cpf = "NON_RENSEIGNE" | "NON_ELIGIBLE" | "POSSIBLE" | "A_CONFIRMER" | "ELIGIBLE";

type Seed = {
  slug: string;
  title: string;
  subtitle?: string;
  description: string;
  mode: Mode;
  productLine: Pole;
  priceEuros?: number; // absent ou 0 => sur devis
  quoteOnly?: boolean;
  durationLabel: string;
  defaultHours?: number;
  tags?: string[];
  cpfStatus?: Cpf;
};

const FORMATIONS: Seed[] = [
  // ——— Pôle Digital — IA, CRM & Automatisation ———
  {
    slug: "ia-crm-automatisation",
    title: "Formation IA, CRM & Automatisation",
    subtitle: "Pack signature — 14H",
    description:
      "Formation courte et concrète pour digitaliser, organiser et automatiser son activité : structurer un mini-CRM, utiliser l'IA au quotidien et automatiser les relances et tâches répétitives. Présentiel ou distanciel, pour dirigeants, TPE, PME et indépendants. Offres Essentiel, Pro et Intra sur-mesure.",
    mode: "MIXTE",
    productLine: "DIGITAL",
    priceEuros: 990,
    durationLabel: "14 heures",
    defaultHours: 14,
    tags: ["IA", "CRM", "Automatisation", "Présentiel", "Distanciel"],
    cpfStatus: "NON_ELIGIBLE"
  },
  {
    slug: "site-web-landing-page",
    title: "Site web & landing page",
    subtitle: "Créer une présence web qui convertit",
    description:
      "Construire ou refondre une page web professionnelle : message clair, structure de landing page, formulaire de contact, SEO local, suivi des conversions et parcours de demande de devis.",
    mode: "MIXTE",
    productLine: "DIGITAL",
    priceEuros: 690,
    durationLabel: "7 heures",
    defaultHours: 7,
    tags: ["Web", "Landing page", "SEO local", "Conversion"],
    cpfStatus: "NON_ELIGIBLE"
  },
  {
    slug: "ia-professionnels",
    title: "L'IA pour les professionnels",
    subtitle: "Gagner du temps au quotidien",
    description:
      "Prendre en main les assistants IA (rédaction, réponses, qualification des demandes) avec des prompts métier prêts à l'emploi pour gagner en réactivité et en productivité.",
    mode: "MIXTE",
    productLine: "DIGITAL",
    priceEuros: 590,
    durationLabel: "7 heures",
    defaultHours: 7,
    tags: ["IA", "Productivité", "Présentiel", "Distanciel"],
    cpfStatus: "NON_ELIGIBLE"
  },
  {
    slug: "mini-crm",
    title: "Créer & piloter son mini-CRM",
    subtitle: "Suivi prospects, devis & relances",
    description:
      "Mettre en place un CRM simple et efficace : base prospects/clients, statuts, pipeline commercial, suivi des devis et relances, tableau de bord pour ne plus rien oublier.",
    mode: "MIXTE",
    productLine: "DIGITAL",
    priceEuros: 690,
    durationLabel: "7 heures",
    defaultHours: 7,
    tags: ["CRM", "Prospection", "Organisation"],
    cpfStatus: "NON_ELIGIBLE"
  },
  {
    slug: "automatisation-no-code",
    title: "Automatisation no-code",
    subtitle: "Relances, notifications, workflows",
    description:
      "Automatiser les tâches répétitives sans coder : notifications, rappels, relances automatiques, prises de rendez-vous et workflows simples pour fluidifier l'activité.",
    mode: "MIXTE",
    productLine: "DIGITAL",
    priceEuros: 690,
    durationLabel: "7 heures",
    defaultHours: 7,
    tags: ["Automatisation", "No-code", "Workflows"],
    cpfStatus: "NON_ELIGIBLE"
  },
  {
    slug: "prospection-presence-en-ligne",
    title: "Prospection & présence en ligne",
    subtitle: "Site, Google, réseaux sociaux",
    description:
      "Développer sa visibilité et sa prospection : fiche Google, site vitrine, réseaux sociaux et messages de prospection efficaces pour générer plus de demandes.",
    mode: "MIXTE",
    productLine: "DIGITAL",
    priceEuros: 590,
    durationLabel: "7 heures",
    defaultHours: 7,
    tags: ["Prospection", "Web", "Réseaux sociaux"],
    cpfStatus: "NON_ELIGIBLE"
  },

  // ——— Pôle Sécurité & Prévention ———
  {
    slug: "habilitation-electrique",
    title: "Habilitation électrique (B0/H0 – BS/BE)",
    subtitle: "Personnel non-électricien & intervention",
    description:
      "Préparer à l'habilitation électrique selon la norme NF C 18-510 : risques électriques, prévention, conduite à tenir et opérations autorisées. Niveaux adaptés au poste (B0/H0, BS/BE).",
    mode: "MIXTE",
    productLine: "LOGISTIQUE_SECURITE",
    quoteOnly: true,
    durationLabel: "1 à 2 jours",
    defaultHours: 14,
    tags: ["Habilitation électrique", "Sécurité", "NF C 18-510"],
    cpfStatus: "A_CONFIRMER"
  },
  {
    slug: "gestes-postures-prap",
    title: "Gestes & postures / PRAP",
    subtitle: "Prévention des risques liés à l'activité physique",
    description:
      "Adopter les bons gestes et postures pour prévenir les TMS et accidents : analyse de poste, manutention, ergonomie et prévention au quotidien.",
    mode: "MIXTE",
    productLine: "SST",
    quoteOnly: true,
    durationLabel: "1 jour",
    defaultHours: 7,
    tags: ["Prévention", "TMS", "Ergonomie"],
    cpfStatus: "A_CONFIRMER"
  },
  {
    slug: "incendie-evacuation",
    title: "Manipulation extincteur & évacuation",
    subtitle: "EPI, alerte et évacuation",
    description:
      "Réagir face à un départ de feu : consignes de sécurité, manipulation des extincteurs, rôle des équipiers de première intervention, alerte et évacuation.",
    mode: "MIXTE",
    productLine: "LOGISTIQUE_SECURITE",
    quoteOnly: true,
    durationLabel: "1/2 journée",
    defaultHours: 4,
    tags: ["Incendie", "Évacuation", "Sécurité"],
    cpfStatus: "A_CONFIRMER"
  },

  // ——— Pôle Transport professionnel ———
  {
    slug: "formation-taxi",
    title: "Formation Taxi",
    subtitle: "Préparation à la carte professionnelle",
    description:
      "Préparation à l'examen Taxi (réglementation, gestion, sécurité, conduite) pour obtenir la carte professionnelle et exercer le métier de chauffeur de taxi.",
    mode: "MIXTE",
    productLine: "VTC",
    quoteOnly: true,
    durationLabel: "Selon parcours",
    tags: ["Taxi", "Carte pro", "Transport"],
    cpfStatus: "A_CONFIRMER"
  },
  {
    slug: "fimo-fco",
    title: "FIMO / FCO",
    subtitle: "Marchandises & voyageurs",
    description:
      "Formation Initiale Minimale Obligatoire (FIMO) et Formation Continue Obligatoire (FCO) pour les conducteurs de transport routier de marchandises ou de voyageurs.",
    mode: "MIXTE",
    productLine: "VTC",
    quoteOnly: true,
    durationLabel: "Selon parcours",
    tags: ["FIMO", "FCO", "Transport routier"],
    cpfStatus: "A_CONFIRMER"
  },

  // ——— Pôle Mobilité élargie ———
  {
    slug: "permis-remorque-be-b96",
    title: "Permis remorque B96 / BE",
    subtitle: "Tracter en toute sécurité",
    description:
      "Formation pour conduire en toute sécurité avec une remorque : extension B96 ou permis BE selon le poids total, maniabilité, attelage et conduite.",
    mode: "MANUEL",
    productLine: "AUTO_ECOLE",
    quoteOnly: true,
    durationLabel: "7 à 14 heures",
    tags: ["Remorque", "BE", "B96"],
    cpfStatus: "A_CONFIRMER"
  },
  {
    slug: "stage-recuperation-points",
    title: "Stage de récupération de points",
    subtitle: "Sensibilisation sécurité routière",
    description:
      "Stage de sensibilisation à la sécurité routière (2 jours) agréé permettant de récupérer jusqu'à 4 points sur le permis de conduire.",
    mode: "MIXTE",
    productLine: "AUTO_ECOLE",
    priceEuros: 250,
    durationLabel: "2 jours",
    defaultHours: 14,
    tags: ["Points", "Sécurité routière", "Stage"],
    cpfStatus: "NON_ELIGIBLE"
  }
];

async function main() {
  let created = 0;
  let skipped = 0;
  for (const f of FORMATIONS) {
    const existing = await prisma.formation.findUnique({ where: { slug: f.slug } });
    if (existing) {
      skipped++;
      continue;
    }
    await prisma.formation.create({
      data: {
        slug: f.slug,
        title: f.title,
        subtitle: f.subtitle ?? null,
        description: f.description,
        mode: f.mode,
        productLine: f.productLine,
        priceCents: f.quoteOnly ? 0 : Math.round((f.priceEuros ?? 0) * 100),
        taxMode: "TTC",
        quoteOnly: f.quoteOnly ?? false,
        durationLabel: f.durationLabel,
        defaultHours: f.defaultHours ?? null,
        tags: f.tags ?? [],
        cpfEligible: false,
        cpfStatus: f.cpfStatus ?? "NON_RENSEIGNE",
        active: true
      }
    });
    created++;
    console.log(`+ ${f.title} [${f.productLine}]`);
  }
  console.log(`\nCatalogue de départ : ${created} formation(s) créée(s), ${skipped} déjà présente(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
