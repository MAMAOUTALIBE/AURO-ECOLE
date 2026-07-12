import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { FormationCard } from "@/components/FormationCard";
import { PageHeroSlideshow, type PageHeroSlideshowSlide } from "@/components/PageHeroSlideshow";
import { SectionHeader } from "@/components/SectionHeader";
import { formations, poleLandings, productLineLabels } from "@/data/site";
import { safeJsonLd } from "@/lib/json-ld";
import { SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/seo";

const poleHeroSlides: Record<"VTC" | "SST" | "LOGISTIQUE_SECURITE", PageHeroSlideshowSlide[]> = {
  VTC: [
    {
      src: "/formations/photos/vtc-excellence.webp",
      alt: "Formation chauffeur VTC avec remise des clés et véhicule professionnel.",
      label: "VTC excellence",
      objectPosition: "50% 48%"
    },
    {
      src: "/formations/photos/vtc-confort-pro.webp",
      alt: "Chauffeur VTC en préparation professionnelle près d'une berline.",
      label: "Confort Pro",
      objectPosition: "50% 48%"
    },
    {
      src: "/formations/photos/vtc-intermediaire-light.webp",
      alt: "Futur chauffeur VTC accompagné par un formateur LODENE.",
      label: "Intermédiaire",
      objectPosition: "50% 45%"
    },
    {
      src: "/formations/photos/vtc-distanciel-eco.webp",
      alt: "Formation VTC à distance sur ordinateur.",
      label: "Distanciel",
      objectPosition: "50% 45%"
    }
  ],
  SST: [
    {
      src: "/formations/photos/sst-initial.webp",
      alt: "Formation SST initiale avec apprenants et mannequin de secourisme.",
      label: "SST initial",
      objectPosition: "50% 45%"
    },
    {
      src: "/formations/photos/mac-sst.webp",
      alt: "Recyclage MAC SST avec groupe d'apprenants et matériel de premiers secours.",
      label: "MAC SST",
      objectPosition: "50% 45%"
    },
    {
      src: "/formations/photos/sst-initial.webp",
      alt: "Mise en situation de prévention et gestes de secours SST.",
      label: "Gestes de secours",
      objectPosition: "44% 45%"
    },
    {
      src: "/formations/photos/mac-sst.webp",
      alt: "Actualisation des compétences SST en centre de formation.",
      label: "Prévention",
      objectPosition: "56% 45%"
    }
  ],
  LOGISTIQUE_SECURITE: [
    {
      src: "/formations/photos/chariots-elevateurs-r489.webp",
      alt: "Formation chariots élévateurs R489 en entrepôt sécurisé.",
      label: "Chariots",
      objectPosition: "50% 48%"
    },
    {
      src: "/formations/photos/nacelles-pemp-r486.webp",
      alt: "Formation nacelles PEMP R486 avec zone sécurisée.",
      label: "Nacelles",
      objectPosition: "50% 50%"
    },
    {
      src: "/formations/photos/terberg-tracteur-parc.webp",
      alt: "Formation tracteur de parc en environnement logistique.",
      label: "Tracteur",
      objectPosition: "50% 48%"
    },
    {
      src: "/formations/photos/gerbeur-r485.webp",
      alt: "Formation gerbeur accompagnant R485 sous supervision.",
      label: "Gerbeur",
      objectPosition: "50% 48%"
    }
  ]
};

// Page d'atterrissage d'un pôle professionnel (VTC / CACES) : hero, atouts,
// catalogue filtré du pôle et appel au devis. Server component (SSG, bon pour le SEO).
const polePath: Record<"VTC" | "SST" | "LOGISTIQUE_SECURITE", string> = {
  VTC: "/vtc",
  SST: "/sst",
  LOGISTIQUE_SECURITE: "/logistique-securite"
};

export function PoleLanding({ pole }: { pole: "VTC" | "SST" | "LOGISTIQUE_SECURITE" }) {
  const content = poleLandings[pole];
  const poleFormations = formations.filter((formation) => formation.productLine === pole);
  const formationsAnchor = `formations-${pole.toLowerCase().replace(/_/g, "-")}`;

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Formations ${productLineLabels[pole]} — LODENE`,
    itemListElement: poleFormations.map((formation, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Course",
        name: formation.title,
        description: formation.description,
        url: absoluteUrl(`/formations/${formation.slug}`),
        provider: {
          "@type": ["LocalBusiness", "DrivingSchool"],
          name: SITE_NAME,
          sameAs: SITE_URL
        },
        offers: { "@type": "Offer", price: formation.price, priceCurrency: "EUR" }
      }
    }))
  };

  return (
    <main>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: safeJsonLd(itemListSchema) }}
      />
      <Breadcrumbs
        className="container-pad py-3"
        items={[
          { name: "Accueil", path: "/" },
          { name: "Formations", path: "/formations" },
          { name: productLineLabels[pole], path: polePath[pole] }
        ]}
      />
      <PageHeroSlideshow
        eyebrow={content.eyebrow}
        title={content.title}
        text={content.text}
        slides={poleHeroSlides[pole]}
        primaryCta={{ href: `/contact?pole=${pole}#demande`, label: "Demander un devis" }}
        secondaryCta={{ href: `#${formationsAnchor}`, label: "Voir les formations" }}
      />

      <section className="bg-white py-8 md:py-10 xl:py-14">
        <div className="container-pad">
          <p className="mx-auto hidden max-w-3xl text-center text-base leading-7 text-loden-muted md:block md:text-lg md:leading-8">{content.intro}</p>
          <div className="grid gap-3 sm:grid-cols-2 md:mt-7 md:gap-4 lg:grid-cols-4 xl:mt-9">
            {content.benefits.map((benefit) => (
              <div key={benefit.title} className="rounded-xl border border-slate-200 bg-loden-pearl p-4 shadow-soft md:rounded-2xl md:p-5">
                <CheckCircle2 className="h-6 w-6 text-loden-600" aria-hidden="true" />
                <h3 className="mt-3 text-lg font-semibold text-loden-ink">{benefit.title}</h3>
                <p className="mt-2 hidden text-sm leading-6 text-loden-muted md:block">{benefit.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id={formationsAnchor} className="bg-loden-pearl py-8 md:py-10 xl:py-14">
        <div className="container-pad">
          <SectionHeader
            eyebrow="Nos formations"
            title={`Formations ${productLineLabels[pole]}`}
            text="Choisis ta certification : financement CPF, entreprise ou OPCO selon ta situation."
            align="center"
          />
          <div className="mt-5 grid gap-3 md:mt-7 md:grid-cols-2 md:gap-4 xl:mt-8 xl:grid-cols-3">
            {poleFormations.map((formation) => (
              <FormationCard key={formation.slug} formation={formation} />
            ))}
          </div>

          <div className="mt-6 flex flex-col items-start gap-4 rounded-xl bg-loden-800 p-4 text-white sm:flex-row sm:items-center sm:justify-between md:rounded-2xl md:p-6 xl:mt-10">
            <div>
              <h2 className="text-xl font-semibold md:text-2xl">Un projet en entreprise ou un financement OPCO ?</h2>
              <p className="mt-2 hidden max-w-2xl text-sm leading-6 text-white/85 sm:block">
                Demande un devis personnalisé : nous adaptons les sessions à tes effectifs et au financement.
              </p>
            </div>
            <Link
              href={`/contact?pole=${pole}#demande`}
              className="focus-ring inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 font-semibold text-loden-800 transition hover:bg-loden-pearl sm:w-auto md:py-4"
            >
              Demander un devis
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
