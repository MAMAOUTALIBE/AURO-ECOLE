import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, Car, HeartPulse, Truck, WalletCards } from "lucide-react";
import { FormationExplorer } from "@/components/FormationExplorer";
import { formations } from "@/data/site";
import { safeJsonLd } from "@/lib/json-ld";
import { SITE_NAME, SITE_URL, absoluteUrl, buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Formations",
  description: "Permis B manuel, automatique, accéléré, conduite accompagnée, code en ligne et perfectionnement avec LODENE.",
  path: "/formations"
});

const formationsHeroSlides = [
  {
    src: "/formations/photos/permis-b-auto-declic.webp",
    alt: "Élève en conduite avec un moniteur LODENE.",
    label: "Permis B",
    objectPosition: "50% 47%"
  },
  {
    src: "/formations/photos/vtc-excellence.webp",
    alt: "Formation VTC LODENE avec véhicule professionnel.",
    label: "VTC",
    objectPosition: "50% 48%"
  },
  {
    src: "/formations/photos/sst-initial.webp",
    alt: "Formation SST LODENE avec apprenants et matériel de secourisme.",
    label: "SST",
    objectPosition: "50% 45%"
  },
  {
    src: "/formations/photos/chariots-elevateurs-r489.webp",
    alt: "Formation logistique LODENE sur chariot élévateur.",
    label: "Logistique",
    objectPosition: "50% 48%"
  }
];

const formationsHeroBadges = [
  { icon: Car, label: "Permis B" },
  { icon: WalletCards, label: "CPF" },
  { icon: BookOpenCheck, label: "VTC" },
  { icon: HeartPulse, label: "SST" },
  { icon: Truck, label: "Logistique" }
];

function FormationsHero() {
  return (
    <section className="relative isolate overflow-hidden bg-loden-900 text-white">
      <div className="absolute inset-0" aria-hidden="true">
        {formationsHeroSlides.map((slide, index) => (
          <div
            key={slide.src}
            className="loden-formations-hero-slide absolute inset-0"
            style={{ animationDelay: `${index * 6}s`, opacity: index === 0 ? 1 : 0 } as CSSProperties}
          >
            <Image
              src={slide.src}
              alt=""
              fill
              priority={index === 0}
              sizes="100vw"
              className="object-cover"
              style={{ objectPosition: slide.objectPosition }}
            />
          </div>
        ))}
      </div>

      <div className="container-pad relative z-10 flex min-h-[440px] items-end py-8 sm:min-h-[480px] md:min-h-[540px] md:items-center md:py-12 xl:min-h-[580px]">
        <div className="max-w-3xl pb-3 md:pb-0">
          <p className="inline-flex rounded-full border border-white/20 bg-white/12 px-4 py-2 text-[0.72rem] font-black uppercase tracking-[0.14em] text-white shadow-soft sm:text-sm">
            Formations LODENE
          </p>
          <h1 className="mt-4 text-[2.2rem] font-black leading-[1.04] text-white drop-shadow-[0_5px_24px_rgba(0,0,0,0.35)] sm:text-5xl lg:text-6xl">
            Choisis la formation qui correspond à ton rythme
          </h1>
          <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-white/90 drop-shadow-[0_3px_16px_rgba(0,0,0,0.28)] md:text-lg md:leading-8">
            Permis B, VTC, SST, logistique et sécurité : trouve rapidement le parcours adapté avec les filtres LODENE.
          </p>

          <div className="mt-6 grid gap-3 sm:flex sm:flex-wrap">
            <Link
              href="/contact#demande"
              className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-loden-700 px-6 py-3 text-sm font-black text-white shadow-[0_18px_45px_rgba(0,134,148,0.35)] transition hover:bg-loden-800 sm:w-auto"
            >
              Être rappelé
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
            <Link
              href="#catalogue-formations"
              className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/60 bg-white/95 px-6 py-3 text-sm font-black text-loden-ink shadow-soft transition hover:bg-white sm:w-auto"
            >
              Voir le catalogue
              <BookOpenCheck className="h-5 w-5 text-loden-700" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-5 flex max-w-2xl flex-wrap gap-2">
            {formationsHeroBadges.map(({ icon: Icon, label }) => (
              <span key={label} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/16 bg-white/12 px-3.5 py-2 text-xs font-black text-white shadow-soft">
                <Icon className="h-4 w-4 text-[#08AEB8]" aria-hidden="true" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-5 left-4 z-20 flex gap-2 sm:left-6 lg:left-[max(2rem,calc((100vw-80rem)/2+2rem))]">
        {formationsHeroSlides.map((slide, index) => (
          <span
            key={slide.label}
            className="loden-formations-hero-dot h-2.5 w-8 rounded-full bg-white/75 shadow-soft"
            style={{ animationDelay: `${index * 6}s` } as CSSProperties}
            aria-hidden="true"
          />
        ))}
      </div>

      <div className="sr-only" aria-live="polite">
        Diaporama automatique des formations LODENE : permis B, VTC, SST et logistique.
      </div>
    </section>
  );
}

export default function FormationsPage() {
  // Catalogue structuré (schema.org ItemList → Course) : aide Google à comprendre
  // l'offre de formations. Pas d'Offer chiffrée ici (tarif sur devis pour plusieurs).
  const catalogSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Catalogue des formations LODENE",
    itemListElement: formations.map((formation, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Course",
        name: formation.title,
        description: formation.description,
        url: absoluteUrl(`/formations/${formation.slug}`),
        provider: {
          "@type": ["LocalBusiness", "DrivingSchool"],
          "@id": `${SITE_URL}/#organization`,
          name: SITE_NAME,
          sameAs: SITE_URL
        }
      }
    }))
  };

  return (
    <main>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: safeJsonLd(catalogSchema) }}
      />
      <FormationsHero />
      <FormationExplorer />
    </main>
  );
}
