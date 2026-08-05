import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, CalendarCheck, Car, CheckCircle2, Clock3, Download, FileText, Gauge, IdCard, Phone, Route } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { FaqSection } from "@/components/FaqSection";
import { PageHero } from "@/components/PageHero";
import { SectionHeader } from "@/components/SectionHeader";
import type { FaqItem } from "@/lib/faq";
import {
  PASSERELLE_ANCIENNETE,
  PASSERELLE_DUREE,
  PASSERELLE_FORMATION_SLUG,
  PASSERELLE_PATH
} from "@/lib/passerelle";
import { safeJsonLd } from "@/lib/json-ld";
import { SITE_NAME, SITE_URL, absoluteUrl, buildMetadata } from "@/lib/seo";
import { contactInfo } from "@/data/site";
import { defaultPasserellePage, getSiteSetting, type PasserellePage } from "@/lib/site-content";

// Durée et ancienneté proviennent de lib/passerelle.ts — voir l'avertissement de validation
// réglementaire qui y figure. Elles sont partagées avec la fiche catalogue.
const DUREE_FORMATION = PASSERELLE_DUREE;
const ANCIENNETE_MINIMALE = PASSERELLE_ANCIENNETE;

const PATH = PASSERELLE_PATH;
const FORMATION_SLUG = PASSERELLE_FORMATION_SLUG;
const DEVIS_HREF = `/contact?formation=${FORMATION_SLUG}#demande`;

export const metadata: Metadata = buildMetadata({
  title: `Passerelle boîte automatique vers boîte manuelle — ${DUREE_FORMATION}`,
  description: `Votre permis B porte la mention 78 (boîte automatique) ? La formation passerelle de ${DUREE_FORMATION} chez LODENE vous permet de conduire en boîte manuelle sans repasser le code ni l'examen. Conflans-Sainte-Honorine (78).`,
  path: PATH
});

const keyFacts = [
  {
    icon: Clock3,
    label: DUREE_FORMATION,
    text: "Une journée de formation, répartie en une ou deux sessions selon votre planning."
  },
  {
    icon: BadgeCheck,
    label: "Sans nouvel examen",
    text: "Ni code ni examen pratique à repasser : le suivi de la formation suffit."
  },
  {
    icon: CalendarCheck,
    label: `Dès ${ANCIENNETE_MINIMALE} de permis`,
    text: "Vous devez justifier d'une ancienneté minimale avec votre permis boîte automatique."
  },
  {
    icon: FileText,
    label: "Attestation remise",
    text: "En fin de formation, LODENE vous délivre l'attestation à joindre à votre demande de nouveau titre."
  }
];

const eligibility = [
  "Votre permis B porte la mention « 78 » — elle apparaît en colonne 12, au dos du titre.",
  `Vous détenez ce permis depuis au moins ${ANCIENNETE_MINIMALE}.`,
  "Vous voulez conduire une voiture à boîte mécanique : véhicule familial, location standard ou véhicule de fonction."
];

const programme = [
  {
    icon: Gauge,
    step: "Théorie",
    title: "Comprendre la boîte mécanique",
    text: "Rôle de l'embrayage et du point de patinage, choix et enchaînement des rapports, freinage moteur, lecture des situations où la boîte manuelle change la conduite."
  },
  {
    icon: Car,
    step: "Hors circulation",
    title: "Prendre les automatismes",
    text: "Démarrage et arrêt sans à-coups, passage montant et descendant des rapports, démarrage en côte, manœuvres à faible allure et marche arrière."
  },
  {
    icon: Route,
    step: "En circulation",
    title: "Conduire en autonomie",
    text: "Insertion et changements de file, ronds-points, circulation dense, montées et descentes : la boîte mécanique devient un réflexe, plus une contrainte."
  }
];

const apresFormation = [
  {
    title: "Vous repartez avec votre attestation",
    text: "LODENE vous remet l'attestation de suivi de formation le jour même, à l'issue des " + DUREE_FORMATION + "."
  },
  {
    title: "Vous demandez votre nouveau titre",
    text: "La démarche se fait en ligne sur le site de l'ANTS, en joignant l'attestation à votre dossier. LODENE vous guide sur les pièces à fournir."
  },
  {
    title: "Vous recevez un permis sans mention 78",
    text: "Votre nouveau titre couvre toute la catégorie B : vous conduisez indifféremment une boîte automatique ou une boîte mécanique."
  }
];

const faqItems: FaqItem[] = [
  {
    question: "Puis-je conduire une boîte manuelle avec un permis boîte automatique ?",
    answer:
      "Non. La mention 78 inscrite sur votre permis B le limite aux véhicules à changement de vitesses automatique. Conduire une boîte mécanique avec ce permis revient à conduire sans permis valide pour le véhicule utilisé. La formation passerelle sert précisément à lever cette limitation."
  },
  {
    question: "Faut-il repasser le code ou l'examen de conduite ?",
    answer:
      "Non. La passerelle ne comporte aucun examen : ni épreuve théorique, ni épreuve pratique. C'est le suivi complet de la formation qui donne droit au nouveau titre."
  },
  {
    question: `Pourquoi la formation dure-t-elle ${DUREE_FORMATION} ?`,
    answer: `La formation passerelle est fixée à ${DUREE_FORMATION}. Chez LODENE, elle s'organise en trois temps : la théorie propre à la boîte mécanique, la pratique hors circulation pour installer les automatismes, puis la conduite en circulation pour gagner en autonomie.`
  },
  {
    question: "Quand puis-je suivre la formation passerelle ?",
    answer: `Il faut détenir votre permis B boîte automatique depuis au moins ${ANCIENNETE_MINIMALE}. En deçà, la formation ne peut pas encore être validée. Contactez-nous : nous vérifions votre date d'obtention avec vous et nous positionnons la session dès que vous êtes éligible.`
  },
  {
    question: "Que dois-je faire une fois la formation terminée ?",
    answer:
      "Vous repartez avec votre attestation de suivi de formation. Il vous reste à demander votre nouveau permis en ligne sur le site de l'ANTS, en joignant cette attestation. Nous vous indiquons les pièces à préparer avant votre départ."
  },
  {
    question: "Combien coûte la passerelle chez LODENE ?",
    answer:
      "La prestation est établie sur devis, afin de tenir compte de votre situation et de vos disponibilités. Le devis est remis avant toute inscription, sans engagement de votre part."
  },
  {
    question: "La formation passerelle est-elle finançable ?",
    answer:
      "Les possibilités de financement sont étudiées au cas par cas selon votre dossier. Parlez-en lors de la demande de devis : nous vous indiquons les dispositifs mobilisables dans votre situation."
  },
  {
    question: "Où se déroule la formation ?",
    answer: `La formation se déroule au départ de notre agence, ${contactInfo.address}. Nous accueillons les élèves de Conflans-Sainte-Honorine et de l'ensemble des Yvelines (78).`
  }
];

const courseSchema = {
  "@context": "https://schema.org",
  "@type": "Course",
  name: "Passerelle boîte automatique vers boîte manuelle",
  description: `Formation de ${DUREE_FORMATION} permettant à un titulaire du permis B boîte automatique (mention 78) de conduire un véhicule à boîte mécanique, sans repasser d'examen.`,
  url: absoluteUrl(PATH),
  provider: {
    "@type": ["LocalBusiness", "DrivingSchool"],
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    sameAs: SITE_URL
  }
};

export default async function PasserelleBoiteManuellePage() {
  // Illustration et documents sont pilotés depuis le CRM (/admin/site/passerelle).
  // Repli sur les valeurs par défaut si la clé est absente ou l'API indisponible.
  const cms = await getSiteSetting<PasserellePage>("page.passerelle", defaultPasserellePage);
  const heroImage = cms.image || defaultPasserellePage.image;
  const heroImageAlt = cms.imageAlt || defaultPasserellePage.imageAlt;
  const documents = Array.isArray(cms.documents) ? cms.documents.filter((doc) => doc.label && doc.url) : [];

  return (
    <main>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: safeJsonLd(courseSchema) }}
      />

      <Breadcrumbs
        className="container-pad py-3"
        items={[
          { name: "Accueil", path: "/" },
          { name: "Formations", path: "/formations" },
          { name: "Passerelle boîte automatique vers manuelle", path: PATH }
        ]}
      />

      <PageHero
        eyebrow="Pôle Auto-école · Permis B"
        title="Passer de la boîte automatique à la boîte manuelle"
        text={`Vous avez obtenu votre permis B sur une voiture automatique ? La mention « 78 » vous limite aujourd'hui à ce type de véhicule. La formation passerelle de ${DUREE_FORMATION} lève cette restriction — sans repasser le code ni l'examen de conduite.`}
        cta="Demander un devis"
        ctaHref={DEVIS_HREF}
      />

      <section className="border-b border-slate-200 bg-white py-6">
        <div className="container-pad grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {keyFacts.map((fact) => {
            const FactIcon = fact.icon;
            return (
              <article key={fact.label} className="rounded-2xl border border-slate-200 bg-loden-pearl p-4 shadow-soft">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-loden-700 shadow-soft">
                  <FactIcon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h2 className="mt-3 text-base font-black text-loden-ink">{fact.label}</h2>
                <p className="mt-2 text-sm leading-6 text-loden-muted">{fact.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="bg-loden-pearl py-8 md:py-12 xl:py-16">
        <div className="container-pad grid items-start gap-6 lg:grid-cols-[1fr_1fr] lg:gap-10">
          <div>
            <SectionHeader
              eyebrow="Éligibilité"
              title="Êtes-vous concerné ?"
              text="La passerelle s'adresse aux conducteurs déjà titulaires du permis B, obtenu sur boîte automatique. Trois conditions à réunir."
            />
            <ul className="mt-5 grid gap-3">
              {eligibility.map((item) => (
                <li key={item} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-loden-700" aria-hidden="true" />
                  <span className="text-sm font-semibold leading-6 text-loden-muted">{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-loden-200 bg-white p-4 shadow-soft">
              <IdCard className="mt-0.5 h-5 w-5 shrink-0 text-loden-700" aria-hidden="true" />
              <p className="text-sm leading-6 text-loden-muted">
                <span className="font-bold text-loden-ink">Un doute sur votre permis ?</span> Appelez-nous au{" "}
                <a className="focus-ring font-bold text-loden-700 hover:text-loden-900" href={`tel:${contactInfo.phone.replace(/\s/g, "")}`}>
                  {contactInfo.phone}
                </a>{" "}
                : nous vérifions votre situation avec vous en quelques minutes.
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-soft md:rounded-[1.75rem]">
            <div className="relative aspect-[4/3]">
              <Image
                src={heroImage}
                alt={heroImageAlt}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-8 md:py-12 xl:py-16">
        <div className="container-pad">
          <SectionHeader
            eyebrow="Déroulé"
            title={`Comment LODENE organise les ${DUREE_FORMATION}`}
            text="Un fil conducteur simple : comprendre, automatiser, puis conduire seul en conditions réelles."
          />
          <div className="mt-5 grid gap-3 md:mt-7 md:grid-cols-3 md:gap-4">
            {programme.map((bloc, index) => {
              const BlocIcon = bloc.icon;
              return (
                <article key={bloc.step} className="rounded-2xl border border-slate-200 bg-loden-pearl p-5 shadow-soft">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-sm font-black text-loden-700 shadow-soft">
                      {index + 1}
                    </span>
                    <BlocIcon className="h-5 w-5 text-loden-700" aria-hidden="true" />
                    <span className="text-xs font-black uppercase tracking-[0.12em] text-loden-700">{bloc.step}</span>
                  </div>
                  <h3 className="mt-3 text-lg font-black leading-6 text-loden-ink">{bloc.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-loden-muted">{bloc.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-loden-pearl py-8 md:py-12 xl:py-16">
        <div className="container-pad">
          <SectionHeader
            eyebrow="Après la formation"
            title="De l'attestation au nouveau permis"
            text="C'est l'étape que l'on oublie souvent d'expliquer. La voici, dans l'ordre."
          />
          <ol className="mt-5 grid gap-3 md:mt-7 md:grid-cols-3 md:gap-4">
            {apresFormation.map((etape, index) => (
              <li key={etape.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-loden-50 text-sm font-black text-loden-700">
                  {index + 1}
                </span>
                <h3 className="mt-3 text-base font-black leading-6 text-loden-ink">{etape.title}</h3>
                <p className="mt-2 text-sm leading-6 text-loden-muted">{etape.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-white py-8 md:py-12 xl:py-16">
        <div className="container-pad grid gap-5 md:gap-7 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <SectionHeader
            eyebrow="Tarif & financement"
            title="Un devis clair avant de vous engager"
            text="La passerelle est chiffrée sur devis, en fonction de votre situation et de vos disponibilités. Aucun engagement tant que le devis n'est pas accepté."
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-loden-pearl p-5 shadow-soft">
              <BadgeCheck className="h-6 w-6 text-loden-700" aria-hidden="true" />
              <h3 className="mt-3 font-black text-loden-ink">Sur devis</h3>
              <p className="mt-2 text-sm leading-6 text-loden-muted">
                Le montant vous est communiqué avant inscription, détaillé et sans frais cachés.
              </p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-loden-pearl p-5 shadow-soft">
              <Phone className="h-6 w-6 text-loden-700" aria-hidden="true" />
              <h3 className="mt-3 font-black text-loden-ink">Financement étudié</h3>
              <p className="mt-2 text-sm leading-6 text-loden-muted">
                Les dispositifs mobilisables dépendent de votre dossier.{" "}
                <Link className="focus-ring font-bold text-loden-700 hover:text-loden-900" href="/financement">
                  Voir les financements
                </Link>
                .
              </p>
            </article>
          </div>
        </div>
      </section>

      {documents.length > 0 ? (
        <section className="bg-loden-pearl py-8 md:py-12 xl:py-16">
          <div className="container-pad">
            <SectionHeader
              eyebrow="Documents"
              title={cms.documentsTitle || defaultPasserellePage.documentsTitle}
              text={cms.documentsIntro || undefined}
            />
            <ul className="mt-5 grid gap-3 md:mt-7 md:grid-cols-2 md:gap-4">
              {documents.map((doc) => (
                <li key={doc.id || doc.url}>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="focus-ring group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft transition hover:border-loden-300 hover:shadow-premium md:p-5"
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-loden-50 text-loden-700">
                      <FileText className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-black text-loden-ink">{doc.label}</span>
                      {doc.description ? (
                        <span className="mt-1 block text-sm leading-6 text-loden-muted">{doc.description}</span>
                      ) : null}
                    </span>
                    <Download className="mt-1 h-5 w-5 shrink-0 text-loden-muted transition group-hover:text-loden-700" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <FaqSection
        items={faqItems}
        eyebrow="Questions fréquentes"
        title="Tout ce qu'il faut savoir sur la passerelle"
        text="Délai, examen, démarches, tarif : les réponses aux questions que se posent les conducteurs titulaires d'un permis boîte automatique."
      />

      <section className="bg-loden-700 py-7 text-white md:py-10">
        <div className="container-pad flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-white/80">Passerelle boîte manuelle</p>
            <h2 className="mt-2 text-[1.45rem] font-semibold sm:text-3xl lg:text-4xl">
              Prêt à conduire tous les véhicules ?
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/85">
              Décrivez-nous votre situation : nous vérifions votre éligibilité et vous proposons une date.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 font-semibold text-loden-ink shadow-soft transition hover:bg-loden-50"
              href={DEVIS_HREF}
            >
              Demander un devis
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
            <Link
              className="focus-ring inline-flex min-h-12 items-center justify-center rounded-full border border-white/35 px-6 py-3.5 font-semibold text-white transition hover:bg-white/10"
              href={`/formations/${FORMATION_SLUG}`}
            >
              Voir la fiche formation
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
