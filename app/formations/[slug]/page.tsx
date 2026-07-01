import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
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
  const isPermisAutoMaitrise = formation.slug === "permis-b-auto-maitrise";
  const isPermisManuelEssentiel = formation.slug === "permis-b-manuel-essentiel";
  const isPermisManuelConfort = formation.slug === "permis-b-manuel-confort";
  const eyebrow = isPro ? `Formation ${productLineLabels[productLine]}` : `Formation ${formation.mode}`;
  const heroKicker =
    isPermisAutoMaitrise || isPermisManuelEssentiel || isPermisManuelConfort
      ? "Pôle Auto-école · Permis B"
      : isIaCrm
        ? "Pôle Digital, IA & CRM"
        : eyebrow;
  const heroTitle =
    isPermisAutoMaitrise
      ? "Permis B automatique"
      : isPermisManuelEssentiel || isPermisManuelConfort
        ? "Permis B manuel"
        : formation.title;
  const heroSubtitle = isPermisAutoMaitrise
    ? "Formule Maîtrise Auto — 20 leçons pour progresser en toute sérénité."
    : isPermisManuelEssentiel
      ? "Formule Essentiel Manuelle — 20 leçons pour maîtriser la boîte manuelle."
      : isPermisManuelConfort
        ? "Formule Confort Manuelle — 30 leçons pour aborder l'examen en toute confiance."
        : isIaCrm
          ? "Digitalisez, organisez et automatisez votre activité en 14 h."
          : formation.subtitle ?? formation.description.split(".")[0] ?? formation.duration;
  const priceLabel = isIaCrm
    ? "Dès 990 €"
    : isPermisAutoMaitrise || isPermisManuelEssentiel
      ? "1 344 €"
      : isPermisManuelConfort
        ? "1 944 €"
        : formation.price > 0
          ? `Dès ${formatCurrency(formation.price)}`
          : "Sur devis";
  const fundingLabel = isIaCrm
    ? "OPCO / entreprise"
    : isPermisAutoMaitrise || isPermisManuelEssentiel || isPermisManuelConfort || formation.cpf
      ? "CPF possible"
      : "Financement accompagné";
  const heroSlides = formationHeroSlides(formation.slug, productLine);
  const primaryCta = { href: `/contact?formation=${formation.slug}#demande`, label: "Demander un devis" };
  const secondaryCta = { href: `/inscription?formation=${formation.slug}`, label: "Pré-inscription" };
  const bodyDescription = isPermisAutoMaitrise
    ? "Une formule complète en boîte automatique, avec davantage d'heures de conduite individuelles pour aborder l'examen en confiance."
    : isPermisManuelEssentiel
      ? "Une formation complète pour apprendre à conduire en boîte manuelle, avec un accompagnement pédagogique jusqu'à l'examen."
      : isPermisManuelConfort
        ? "Une formule renforcée en boîte manuelle, avec davantage d'heures de conduite pour aborder l'examen en confiance."
        : formation.description;

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

  const keyPoints = isIaCrm
    ? [
        "Structurer un mini-CRM pour suivre prospects, clients et relances.",
        "Utiliser l'IA pour rédiger, qualifier et préparer les réponses.",
        "Automatiser les tâches répétitives sans complexité technique.",
        "Repartir avec une méthode directement applicable."
      ]
    : isPermisAutoMaitrise
      ? [
          "Boîte automatique : conduite simplifiée",
          "20 h de conduite pour plus d'aisance",
          "Rythme progressif et serein",
          "CPF possible selon dossier"
        ]
      : isPermisManuelEssentiel
        ? [
            "Boîte manuelle : conduire tous les véhicules",
            "20 h de conduite + accompagnement examen",
            "Le permis le plus polyvalent",
            "CPF possible selon dossier"
          ]
      : isPermisManuelConfort
        ? [
            "Boîte manuelle : conduire tous les véhicules",
            "30 h de conduite pour plus de pratique",
            "Idéale pour progresser sans stress",
            "CPF possible selon dossier"
          ]
        : guarantees;

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

      <FormationHero
        slides={heroSlides}
        kicker={heroKicker}
        title={heroTitle}
        subtitle={heroSubtitle}
        badges={[
          { icon: "Clock3", label: formation.duration },
          { icon: "BadgeCheck", label: priceLabel },
          { icon: isPermisAutoMaitrise || isPermisManuelEssentiel || isPermisManuelConfort ? "WalletCards" : "Building2", label: fundingLabel }
        ]}
        primaryCta={primaryCta}
        secondaryCta={secondaryCta}
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
