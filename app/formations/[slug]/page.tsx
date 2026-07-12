import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BreadcrumbJsonLd } from "@/components/BreadcrumbJsonLd";
import { FormationHero } from "@/components/FormationHero";
import { formationHeroSlides } from "@/lib/formation-image";
import { ArrowRight, BadgeCheck, CalendarCheck, CheckCircle2, Clock3, ShieldCheck } from "lucide-react";
import { productLineLabels } from "@/data/site";
import { getFormationBySlug, getFormations } from "@/lib/catalog";
import { formatCurrency } from "@/lib/utils";
import { safeJsonLd } from "@/lib/json-ld";
import { SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/seo";

type PageProps = {
  params: Promise<{ slug: string }>;
};

type HeroBadgeIcon = "Clock3" | "BadgeCheck" | "Building2" | "ShieldCheck" | "WalletCards";

type CuratedFormationContent = {
  kicker: string;
  title: string;
  subtitle: string;
  priceLabel: string;
  fundingLabel: string;
  fundingIcon: HeroBadgeIcon;
  description: string;
  keyPoints: string[];
};

const CURATED_FORMATION_CONTENT: Record<string, CuratedFormationContent> = {
  "permis-b-auto-declic": {
    kicker: "Pôle Auto-école · Permis B",
    title: "Permis B automatique",
    subtitle: "Formule Déclic Auto — 13 leçons pour avancer efficacement vers l'examen.",
    priceLabel: "924 €",
    fundingLabel: "CPF possible",
    fundingIcon: "WalletCards",
    description: "Un parcours court en boîte automatique pour apprendre l'essentiel et avancer efficacement vers l'examen.",
    keyPoints: [
      "Boîte automatique : conduite simplifiée",
      "13 h de conduite pour démarrer vite",
      "Rythme efficace et objectifs ciblés",
      "CPF possible selon dossier"
    ]
  },
  "permis-b-auto-maitrise": {
    kicker: "Pôle Auto-école · Permis B",
    title: "Permis B automatique",
    subtitle: "Formule Maîtrise Auto — 20 leçons pour progresser en toute sérénité.",
    priceLabel: "1 344 €",
    fundingLabel: "CPF possible",
    fundingIcon: "WalletCards",
    description: "Une formule complète en boîte automatique, avec davantage d'heures de conduite individuelles pour aborder l'examen en confiance.",
    keyPoints: [
      "Boîte automatique : conduite simplifiée",
      "20 h de conduite pour plus d'aisance",
      "Rythme progressif et serein",
      "CPF possible selon dossier"
    ]
  },
  "permis-b-manuel-essentiel": {
    kicker: "Pôle Auto-école · Permis B",
    title: "Permis B manuel",
    subtitle: "Formule Essentiel Manuelle — 20 leçons pour maîtriser la boîte manuelle.",
    priceLabel: "1 344 €",
    fundingLabel: "CPF possible",
    fundingIcon: "WalletCards",
    description: "Une formation complète pour apprendre à conduire en boîte manuelle, avec un accompagnement pédagogique jusqu'à l'examen.",
    keyPoints: [
      "Boîte manuelle : conduire tous les véhicules",
      "20 h de conduite + accompagnement examen",
      "Le permis le plus polyvalent",
      "CPF possible selon dossier"
    ]
  },
  "permis-b-manuel-confort": {
    kicker: "Pôle Auto-école · Permis B",
    title: "Permis B manuel",
    subtitle: "Formule Confort Manuelle — 30 leçons pour aborder l'examen en toute confiance.",
    priceLabel: "1 944 €",
    fundingLabel: "CPF possible",
    fundingIcon: "WalletCards",
    description: "Une formule renforcée en boîte manuelle, avec davantage d'heures de conduite pour aborder l'examen en confiance.",
    keyPoints: [
      "Boîte manuelle : conduire tous les véhicules",
      "30 h de conduite pour plus de pratique",
      "Idéale pour progresser sans stress",
      "CPF possible selon dossier"
    ]
  },
  "stage-accelere": {
    kicker: "Pôle Auto-école · Permis B",
    title: "Stage accéléré code et conduite",
    subtitle: "Parcours intensif — code et conduite avec planning prioritaire.",
    priceLabel: "Sur devis",
    fundingLabel: "CPF possible",
    fundingIcon: "WalletCards",
    description: "Un parcours intensif pour avancer plus vite sur le code et la conduite, avec une planification resserrée et prioritaire.",
    keyPoints: [
      "Code et conduite sur rythme intensif",
      "Planning prioritaire selon disponibilités",
      "Objectifs suivis à chaque étape",
      "CPF possible selon dossier"
    ]
  },
  "passerelle-bva-manuelle": {
    kicker: "Pôle Auto-école · Permis B",
    title: "Passerelle BVA vers boîte manuelle",
    subtitle: "Complément de formation — reprenez la main sur la boîte manuelle.",
    priceLabel: "Sur devis",
    fundingLabel: "Financement accompagné",
    fundingIcon: "Building2",
    description: "Une formation courte pour évoluer d'un permis boîte automatique vers la boîte manuelle, avec un travail ciblé sur les bons réflexes.",
    keyPoints: [
      "Transition de la BVA vers la boîte manuelle",
      "Travail du levier et de l'embrayage",
      "Formation courte et ciblée",
      "Devis clair avant inscription"
    ]
  },
  "conduite-accompagnee": {
    kicker: "Pôle Auto-école · Permis B",
    title: "Conduite accompagnée",
    subtitle: "AAC dès 15 ans — gagnez de l'expérience avant l'examen.",
    priceLabel: "Sur devis",
    fundingLabel: "Suivi famille",
    fundingIcon: "ShieldCheck",
    description: "Un accompagnement dès 15 ans pour gagner en expérience, construire de bons réflexes et préparer l'examen avec plus de recul.",
    keyPoints: [
      "Accessible dès 15 ans",
      "Expérience progressive avec accompagnateur",
      "Suivi pédagogique jusqu'à l'examen",
      "Parcours adapté au rythme de l'élève"
    ]
  },
  "permis-remorque-be-b96": {
    kicker: "Pôle Auto-école · Remorque",
    title: "Permis remorque B96 / BE",
    subtitle: "Tracter en toute sécurité — maniabilité, attelage et conduite.",
    priceLabel: "Sur devis",
    fundingLabel: "Financement accompagné",
    fundingIcon: "Building2",
    description: "Une formation pour conduire avec une remorque en sécurité, selon le besoin : extension B96 ou permis BE.",
    keyPoints: [
      "Extension B96 ou permis BE selon le poids",
      "Attelage, vérifications et règles de sécurité",
      "Maniabilité et conduite avec remorque",
      "Parcours adapté au véhicule et au projet"
    ]
  },
  "stage-recuperation-points": {
    kicker: "Pôle Auto-école · Sécurité routière",
    title: "Stage de récupération de points",
    subtitle: "Sensibilisation sécurité routière — 2 jours pour récupérer jusqu'à 4 points.",
    priceLabel: "250 €",
    fundingLabel: "Stage agréé",
    fundingIcon: "ShieldCheck",
    description: "Un stage de sensibilisation à la sécurité routière sur deux jours, permettant de récupérer jusqu'à 4 points sur le permis de conduire.",
    keyPoints: [
      "Stage agréé sur 2 jours",
      "Récupération possible jusqu'à 4 points",
      "Sensibilisation aux risques routiers",
      "Inscription simple avec documents permis"
    ]
  },
  "vtc-distanciel-eco": {
    kicker: "Pôle VTC · Chauffeur professionnel",
    title: "Formation VTC",
    subtitle: "Distanciel Éco — préparez les modules réglementaires à votre rythme.",
    priceLabel: "399 €",
    fundingLabel: "Dossier CMA",
    fundingIcon: "Building2",
    description: "L'accès essentiel pour préparer les épreuves théoriques VTC avec une plateforme disponible 24h/24 et un appui au dossier CMA.",
    keyPoints: [
      "Plateforme en ligne accessible 24h/24",
      "7 modules réglementaires VTC",
      "Aide au dossier CMA",
      "Rythme flexible en distanciel"
    ]
  },
  "vtc-intermediaire-light": {
    kicker: "Pôle VTC · Chauffeur professionnel",
    title: "Formation VTC",
    subtitle: "Intermédiaire Light — distanciel renforcé avec 2 visios collectives.",
    priceLabel: "599 €",
    fundingLabel: "Coaching inclus",
    fundingIcon: "Building2",
    description: "Un parcours théorique renforcé avec deux sessions collectives en visioconférence et un accompagnement ciblé sur les points clés de l'examen.",
    keyPoints: [
      "Distanciel + 2 visios collectives",
      "Révisions encadrées par un formateur",
      "Module gestion et tarification",
      "Préparation structurée à l'examen"
    ]
  },
  "vtc-confort-pro": {
    kicker: "Pôle VTC · Chauffeur professionnel",
    title: "Formation VTC",
    subtitle: "Confort Pro — préparation complète théorie + pratique hors conduite.",
    priceLabel: "899 €",
    fundingLabel: "Carte pro",
    fundingIcon: "Building2",
    description: "Une préparation complète pour consolider la théorie, travailler les simulations pratiques et avancer vers la carte professionnelle VTC.",
    keyPoints: [
      "Théorie + épreuve pratique hors conduite",
      "Modules vidéo et supports structurés",
      "Simulations de repérage",
      "Assistance carte professionnelle VTC"
    ]
  },
  "vtc-excellence": {
    kicker: "Pôle VTC · Chauffeur professionnel",
    title: "Formation VTC Excellence",
    subtitle: "Pack clé en main — conduite, véhicule examen et coaching jusqu'à la carte pro.",
    priceLabel: "2 499 €",
    fundingLabel: "Véhicule examen",
    fundingIcon: "Building2",
    description: "La formule la plus complète pour préparer l'activité VTC avec conduite incluse, véhicule double-commande et accompagnement jusqu'à la carte pro.",
    keyPoints: [
      "Pack clé en main avec frais CMA inclus",
      "10 h de conduite incluses",
      "Véhicule double-commande à l'examen",
      "Coaching jusqu'à la carte professionnelle"
    ]
  },
  "formation-taxi": {
    kicker: "Pôle Transport · Taxi",
    title: "Formation Taxi",
    subtitle: "Préparation à la carte professionnelle — réglementation, gestion et sécurité.",
    priceLabel: "Sur devis",
    fundingLabel: "Carte pro",
    fundingIcon: "Building2",
    description: "Une préparation à l'examen Taxi pour obtenir la carte professionnelle et exercer le métier de chauffeur de taxi.",
    keyPoints: [
      "Préparation à la carte professionnelle Taxi",
      "Réglementation, gestion et sécurité",
      "Travail des attentes de l'examen",
      "Parcours adapté selon le niveau"
    ]
  },
  "fimo-fco": {
    kicker: "Pôle Transport · Routier",
    title: "FIMO / FCO",
    subtitle: "Marchandises & voyageurs — formation obligatoire des conducteurs routiers.",
    priceLabel: "Sur devis",
    fundingLabel: "Parcours pro",
    fundingIcon: "Building2",
    description: "Une formation destinée aux conducteurs de transport routier de marchandises ou de voyageurs, selon le parcours FIMO ou FCO.",
    keyPoints: [
      "FIMO ou FCO selon situation",
      "Marchandises ou voyageurs",
      "Cadre réglementaire du transport routier",
      "Devis adapté au parcours professionnel"
    ]
  },
  "sst-initial": {
    kicker: "Pôle SST · Sécurité au travail",
    title: "SST Initial",
    subtitle: "Sauveteur Secouriste du Travail — 14 h pour agir et prévenir.",
    priceLabel: "120 € HT / pers.",
    fundingLabel: "Inter / intra",
    fundingIcon: "ShieldCheck",
    description: "Une formation complète pour acquérir les gestes de premiers secours au travail et participer à la prévention des risques.",
    keyPoints: [
      "Gestes de secours et conduite à tenir",
      "Prévention des risques professionnels",
      "Format inter ou intra-entreprise",
      "Certificat SST selon validation"
    ]
  },
  "mac-sst": {
    kicker: "Pôle SST · Sécurité au travail",
    title: "MAC SST / Recyclage",
    subtitle: "Maintien et actualisation — 7 h pour renouveler les compétences SST.",
    priceLabel: "75 € HT / pers.",
    fundingLabel: "Recyclage SST",
    fundingIcon: "ShieldCheck",
    description: "Une journée de maintien et d'actualisation pour renouveler les compétences SST et consolider les réflexes de prévention.",
    keyPoints: [
      "Actualisation des gestes de secours",
      "Révision des situations de travail",
      "Mise en pratique encadrée",
      "Renouvellement du certificat SST"
    ]
  },
  "gestes-postures-prap": {
    kicker: "Pôle SST · Prévention",
    title: "Gestes & postures / PRAP",
    subtitle: "Prévention des risques liés à l'activité physique — 1 jour.",
    priceLabel: "Sur devis",
    fundingLabel: "Prévention TMS",
    fundingIcon: "ShieldCheck",
    description: "Une formation pour adopter les bons gestes, réduire les risques de TMS et améliorer la prévention au quotidien.",
    keyPoints: [
      "Analyse des situations de travail",
      "Gestes et postures adaptés",
      "Prévention des TMS et accidents",
      "Mise en pratique sur cas concrets"
    ]
  },
  "incendie-evacuation": {
    kicker: "Pôle Sécurité · Incendie",
    title: "Manipulation extincteur & évacuation",
    subtitle: "EPI, alerte et évacuation — savoir réagir face à un départ de feu.",
    priceLabel: "Sur devis",
    fundingLabel: "Intra-entreprise",
    fundingIcon: "ShieldCheck",
    description: "Une formation courte pour connaître les consignes de sécurité, manipuler les extincteurs et organiser l'alerte ou l'évacuation.",
    keyPoints: [
      "Consignes de sécurité incendie",
      "Manipulation des extincteurs",
      "Rôle des équipiers de première intervention",
      "Alerte et évacuation"
    ]
  },
  "habilitation-electrique": {
    kicker: "Pôle Sécurité · Habilitation",
    title: "Habilitation électrique",
    subtitle: "B0/H0 – BS/BE — prévention des risques électriques selon le poste.",
    priceLabel: "Sur devis",
    fundingLabel: "NF C 18-510",
    fundingIcon: "ShieldCheck",
    description: "Une préparation à l'habilitation électrique selon la norme NF C 18-510, avec niveaux adaptés au poste et aux opérations autorisées.",
    keyPoints: [
      "Risques électriques et prévention",
      "Niveaux B0/H0, BS/BE selon besoin",
      "Conduite à tenir en situation à risque",
      "Parcours adapté au poste de travail"
    ]
  },
  "chariots-elevateurs-r489": {
    kicker: "Pôle Logistique · CACES",
    title: "Chariots élévateurs R489",
    subtitle: "Conduite en sécurité — catégories chariots selon besoin et niveau.",
    priceLabel: "Sur devis",
    fundingLabel: "Intra-entreprise",
    fundingIcon: "Building2",
    description: "Une formation sur site client pour conduire les chariots élévateurs en sécurité, avec théorie, pratique et vérifications essentielles.",
    keyPoints: [
      "Catégories 1, 2, 3 et 5 selon besoin",
      "Théorie + pratique sur site",
      "Vérifications et conduite en sécurité",
      "Parcours adapté au niveau des participants"
    ]
  },
  "gerbeur-r485": {
    kicker: "Pôle Logistique · CACES",
    title: "Gerbeur accompagnant R485",
    subtitle: "Conduite en sécurité — prise en main du gerbeur sur site client.",
    priceLabel: "Sur devis",
    fundingLabel: "Intra-entreprise",
    fundingIcon: "Building2",
    description: "Une formation opérationnelle pour utiliser un gerbeur accompagnant en sécurité, avec mise en pratique dans l'environnement de travail.",
    keyPoints: [
      "Utilisation sécurisée du gerbeur",
      "Manœuvres et circulation en entrepôt",
      "Mise en pratique sur site client",
      "Évaluation adaptée au poste de travail"
    ]
  },
  "nacelles-pemp-r486": {
    kicker: "Pôle Sécurité · Travaux en hauteur",
    title: "Nacelles / PEMP R486",
    subtitle: "Travaux en hauteur — utiliser une PEMP en sécurité.",
    priceLabel: "Sur devis",
    fundingLabel: "Intra-entreprise",
    fundingIcon: "ShieldCheck",
    description: "Une formation pour utiliser les plateformes élévatrices mobiles de personnel en sécurité, avec rappel des EPI et règles de stabilisation.",
    keyPoints: [
      "Prévention des chutes et risques hauteur",
      "Utilisation des EPI et contrôles avant départ",
      "Stabilisation et manœuvres de la PEMP",
      "Formation adaptée au matériel de l'entreprise"
    ]
  },
  "pont-roulant-r484": {
    kicker: "Pôle Logistique · Industrie",
    title: "Pont roulant R484",
    subtitle: "Commande au sol ou télécommande — manœuvrer en sécurité.",
    priceLabel: "Sur devis",
    fundingLabel: "Intra-entreprise",
    fundingIcon: "Building2",
    description: "Une formation pratique pour utiliser le pont roulant avec commande au sol ou télécommande, incluant les règles de sécurité et l'évaluation sur site.",
    keyPoints: [
      "Commande au sol ou télécommande",
      "Élingage, consignes et zones de sécurité",
      "Manœuvres en atelier industriel",
      "Évaluation pratique sur site"
    ]
  },
  "echafaudage-roulant-r457": {
    kicker: "Pôle Sécurité · Travaux en hauteur",
    title: "Échafaudage roulant R457",
    subtitle: "Montage, démontage, utilisation — travailler en hauteur en sécurité.",
    priceLabel: "Sur devis",
    fundingLabel: "Intra-entreprise",
    fundingIcon: "ShieldCheck",
    description: "Une formation pour monter, démonter et utiliser un échafaudage roulant conformément aux règles de sécurité et de conformité.",
    keyPoints: [
      "Montage et démontage en sécurité",
      "Contrôles de conformité avant utilisation",
      "Prévention des risques de chute",
      "Cas pratiques adaptés au terrain"
    ]
  },
  "terberg-tracteur-parc": {
    kicker: "Pôle Logistique · Manœuvres",
    title: "Terberg / tracteur de parc",
    subtitle: "Manœuvres logistiques — prise en main en environnement sécurisé.",
    priceLabel: "Sur devis",
    fundingLabel: "Intra-entreprise",
    fundingIcon: "Building2",
    description: "Une formation à la prise en main et aux manœuvres de tracteur de parc, adaptée aux environnements logistiques et industriels.",
    keyPoints: [
      "Prise en main du tracteur de parc",
      "Manœuvres en zone logistique",
      "Sécurité, angles morts et circulation",
      "Adaptation au site et aux flux de l'entreprise"
    ]
  },
  "site-web-landing-page": {
    kicker: "Pôle Tech · Web",
    title: "Site web & landing page",
    subtitle: "Construisez une page claire, crédible et pensée pour générer des demandes.",
    priceLabel: "690 € HT",
    fundingLabel: "Entreprise / OPCO",
    fundingIcon: "Building2",
    description: "Une formation-action pour clarifier votre offre, structurer une page web, brancher un formulaire utile et suivre les demandes générées.",
    keyPoints: [
      "Clarifier l'offre, la cible et le message principal.",
      "Construire une structure de landing page orientée conversion.",
      "Préparer formulaire, CTA, SEO local et suivi des demandes.",
      "Repartir avec une base directement exploitable."
    ]
  },
  "ia-professionnels": {
    kicker: "Pôle Digital",
    title: "IA pour professionnels",
    subtitle: "Gagnez du temps avec des usages IA simples et concrets.",
    priceLabel: "590 €",
    fundingLabel: "Entreprise / OPCO",
    fundingIcon: "Building2",
    description: "Une formation pratique pour prendre en main les assistants IA, rédiger plus vite et améliorer la qualification des demandes.",
    keyPoints: [
      "Prompts métier prêts à l'emploi",
      "Rédaction, réponses et qualification",
      "Gain de temps sur les tâches courantes",
      "Méthode directement applicable"
    ]
  },
  "mini-crm": {
    kicker: "Pôle Digital",
    title: "Mini-CRM",
    subtitle: "Organisez vos prospects, clients et relances simplement.",
    priceLabel: "690 €",
    fundingLabel: "Entreprise / OPCO",
    fundingIcon: "Building2",
    description: "Une formation pour mettre en place un CRM simple : prospects, clients, statuts, devis, relances et tableau de bord.",
    keyPoints: [
      "Base prospects et clients structurée",
      "Pipeline commercial clair",
      "Suivi des devis et relances",
      "Tableau de bord simple à piloter"
    ]
  },
  "automatisation-no-code": {
    kicker: "Pôle Digital · Automatisation",
    title: "Automatisation no-code",
    subtitle: "Relances, notifications, workflows — automatiser sans coder.",
    priceLabel: "690 €",
    fundingLabel: "Entreprise / OPCO",
    fundingIcon: "Building2",
    description: "Une formation pour automatiser les tâches répétitives sans coder : rappels, relances, notifications et workflows simples.",
    keyPoints: [
      "Automatisations simples sans code",
      "Relances et rappels automatiques",
      "Notifications et workflows",
      "Process plus fluides au quotidien"
    ]
  },
  "prospection-presence-en-ligne": {
    kicker: "Pôle Digital · Prospection",
    title: "Prospection & présence en ligne",
    subtitle: "Site, Google, réseaux sociaux — générer plus de demandes.",
    priceLabel: "590 €",
    fundingLabel: "Entreprise / OPCO",
    fundingIcon: "Building2",
    description: "Une formation pour développer sa visibilité, structurer ses messages de prospection et améliorer sa présence en ligne.",
    keyPoints: [
      "Fiche Google et présence locale",
      "Site vitrine et messages clairs",
      "Réseaux sociaux utiles",
      "Prospection plus régulière"
    ]
  },
  "ia-crm-automatisation": {
    kicker: "Pôle Digital",
    title: "IA & CRM",
    subtitle: "Automatisez vos suivis clients avec une méthode simple, en 14 h.",
    priceLabel: "Dès 990 €",
    fundingLabel: "OPCO / entreprise",
    fundingIcon: "Building2",
    description: "Une formation courte pour structurer votre organisation, utiliser l'IA au quotidien et automatiser les relances utiles.",
    keyPoints: [
      "Structurer un mini-CRM pour suivre prospects, clients et relances.",
      "Utiliser l'IA pour rédiger, qualifier et préparer les réponses.",
      "Automatiser les tâches répétitives sans complexité technique.",
      "Repartir avec une méthode directement applicable."
    ]
  }
};

export async function generateStaticParams() {
  const formations = await getFormations();
  return formations.map((formation) => ({ slug: formation.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const formation = await getFormationBySlug(slug);

  if (!formation) {
    return {
      title: "Formation introuvable"
    };
  }

  const description = `${formation.description} Durée : ${formation.duration}. Tarif sur devis personnalisé.`;
  const path = `/formations/${formation.slug}`;
  return {
    title: `${formation.title} à Conflans-Sainte-Honorine`,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${formation.title} | LODENE Auto-École`,
      description,
      url: path,
      type: "article"
    }
  };
}

export default async function FormationDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const formation = await getFormationBySlug(slug);

  if (!formation) notFound();

  const productLine = formation.productLine ?? "AUTO_ECOLE";
  const isPro = productLine !== "AUTO_ECOLE";
  const isIaCrm = formation.slug === "ia-crm-automatisation";
  const isCompactImageHero = isIaCrm || ["ia-professionnels", "mini-crm"].includes(formation.slug);
  const curatedContent = CURATED_FORMATION_CONTENT[formation.slug];
  const eyebrow = isPro ? `Formation ${productLineLabels[productLine]}` : `Formation ${formation.mode}`;
  const heroKicker = curatedContent?.kicker ?? eyebrow;
  const heroTitle = curatedContent?.title ?? formation.title;
  const heroSubtitle = curatedContent?.subtitle ?? formation.subtitle ?? formation.description.split(".")[0] ?? formation.duration;
  const priceLabel = curatedContent?.priceLabel ?? (formation.price > 0 ? `Dès ${formatCurrency(formation.price)}` : "Sur devis");
  const fundingLabel = curatedContent?.fundingLabel ?? (formation.cpf ? "CPF possible" : "Financement accompagné");
  const fundingIcon = curatedContent?.fundingIcon ?? (formation.cpf ? "WalletCards" : "Building2");
  const heroSlides = formationHeroSlides(
    formation.slug,
    productLine,
    formation.imageUrl ? { src: formation.imageUrl, alt: `Visuel de la formation ${formation.title}` } : undefined
  );
  const primaryCta = { href: `/contact?formation=${formation.slug}#demande`, label: "Demander un devis" };
  const secondaryCta = { href: `/inscription?formation=${formation.slug}`, label: "Pré-inscription" };
  const bodyDescription = curatedContent?.description ?? formation.description;

  const courseSchema = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: formation.title,
    description: formation.description,
    provider: {
      "@type": ["LocalBusiness", "DrivingSchool"],
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      sameAs: SITE_URL
    },
    // Pas de prix officiel confirmé -> on n'émet pas d'Offer chiffrée (tarif sur devis).
    ...(formation.price > 0
      ? {
          offers: {
            "@type": "Offer",
            price: formation.price,
            priceCurrency: "EUR",
            availability: "https://schema.org/InStock",
            url: absoluteUrl(`/formations/${formation.slug}`)
          }
        }
      : {})
  };

  const programSteps = [
    isIaCrm ? "Diagnostic des outils et priorités métier" : "Diagnostic du niveau et choix du rythme",
    isIaCrm ? "Mise en place d'un mini-CRM simple" : "Créneaux planifiés avec un moniteur référent",
    isIaCrm ? "Cas d'usage IA et relances automatisées" : "Suivi de progression et ajustement des objectifs",
    isIaCrm ? "Plan d'action pour déployer en autonomie" : "Préparation à l'examen ou à l'objectif de conduite"
  ];

  const guarantees = [
    isIaCrm
      ? "Financement OPCO ou entreprise selon votre dossier"
      : formation.cpf
        ? "Parcours compatible CPF selon le dossier"
        : "Conseil financement selon la situation",
    isPro ? "Financement entreprise / OPCO possible" : "Planning visible et suivi élève digital",
    "Devis clair avant engagement",
    "Accompagnement administratif jusqu'au démarrage"
  ];

  const keyPoints = curatedContent?.keyPoints ?? guarantees;

  const keyFacts = [
    { icon: Clock3, label: "Durée", value: formation.duration },
    { icon: BadgeCheck, label: "Tarif", value: priceLabel },
    { icon: ShieldCheck, label: "Financement", value: fundingLabel },
    { icon: CalendarCheck, label: "Mode", value: formation.mode }
  ];

  return (
    <main>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: safeJsonLd(courseSchema) }}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Accueil", path: "/" },
          { name: "Formations", path: "/formations" },
          { name: formation.title, path: `/formations/${formation.slug}` }
        ]}
      />

      <FormationHero
        slides={heroSlides}
        kicker={heroKicker}
        title={heroTitle}
        subtitle={heroSubtitle}
        badges={[
          { icon: "Clock3", label: formation.duration },
          { icon: "BadgeCheck", label: priceLabel },
          { icon: fundingIcon, label: fundingLabel }
        ]}
        primaryCta={primaryCta}
        secondaryCta={secondaryCta}
        variant={isCompactImageHero ? "compactImage" : "default"}
      />

      <section className="border-b border-slate-200 bg-white py-6">
        <div className="container-pad grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {keyFacts.map((fact) => {
            const FactIcon = fact.icon;
            return (
              <div key={fact.label} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-loden-pearl px-4 py-3 shadow-soft">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-loden-700">
                  <FactIcon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-loden-muted">{fact.label}</p>
                  <p className="truncate text-sm font-black text-loden-ink">{fact.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-loden-pearl py-6">
        <div className="container-pad grid gap-4 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-loden-700">Objectif</p>
            <h2 className="mt-2 text-2xl font-black text-loden-ink sm:text-3xl">Comprendre le parcours</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-loden-muted md:text-base">
              {bodyDescription}
            </p>
            {isIaCrm ? (
              <Link href="/digital" className="focus-ring mt-3 inline-flex rounded-full text-sm font-black text-loden-700 hover:text-loden-900">
                Voir le programme détaillé
              </Link>
            ) : null}
          </div>

          <div className="grid gap-3">
            {keyPoints.map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-loden-700" aria-hidden="true" />
                <p className="text-sm font-semibold leading-6 text-loden-muted">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-6">
        <div className="container-pad">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-loden-700">Programme</p>
              <h2 className="mt-2 text-2xl font-black text-loden-ink sm:text-3xl">4 étapes concrètes</h2>
            </div>
            <span className="rounded-full bg-loden-50 px-4 py-2 text-sm font-black text-loden-700">
              {formation.duration}
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {programSteps.map((step, index) => (
              <article key={step} className="rounded-2xl border border-slate-200 bg-loden-pearl p-4 shadow-soft">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-sm font-black text-loden-700 shadow-soft">
                  {index + 1}
                </span>
                <h3 className="mt-3 text-sm font-black leading-6 text-loden-ink">{step}</h3>
                <p className="mt-2 text-xs font-semibold leading-5 text-loden-muted">
                  Une action claire, un livrable utile et une prochaine étape visible.
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-loden-pearl py-6">
        <div className="container-pad">
          <div className="rounded-2xl bg-loden-800 p-5 text-white shadow-premium md:flex md:items-center md:justify-between md:gap-6 md:p-6">
            <div className="max-w-2xl">
              <CalendarCheck className="h-7 w-7 text-[#08AEB8]" aria-hidden="true" />
              <h2 className="mt-3 text-2xl font-black">Demander un devis / planning</h2>
              <p className="mt-2 text-sm leading-6 text-white/85">
                Partagez votre objectif et vos disponibilités. LODENE vous confirme un parcours clair avant engagement.
              </p>
            </div>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row md:mt-0">
              <Link
                href={primaryCta.href}
                className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-loden-800 transition hover:bg-loden-pearl"
              >
                Demander un devis
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href={secondaryCta.href}
                className="focus-ring inline-flex min-h-12 items-center justify-center rounded-full border border-white/35 px-5 py-3 text-sm font-black text-white transition hover:bg-white/10"
              >
                Pré-inscription
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
