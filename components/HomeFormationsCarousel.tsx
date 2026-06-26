"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Clock3, Euro, Sparkles } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { productLineLabels, type Formation } from "@/data/site";
import { formationImageMeta } from "@/lib/formation-image";
import { formatCurrency } from "@/lib/utils";

const prioritySlugs = ["permis-b-auto-declic", "vtc-distanciel-eco", "sst-initial"];

const homeCopy: Record<string, { category: string; title: string; description: string }> = {
  "permis-b-auto-declic": {
    category: "Permis B",
    title: "Permis B",
    description: "Boîte auto ou manuelle, CPF possible et planning adapté à ton rythme."
  },
  "vtc-distanciel-eco": {
    category: "VTC",
    title: "Formation VTC",
    description: "Préparation à l'examen CMA, plateforme et accompagnement carte pro."
  },
  "sst-initial": {
    category: "Sécurité au travail",
    title: "SST / Sécurité au travail",
    description: "SST initial ou recyclage pour former les équipes aux bons réflexes."
  }
};

function orderedHomeFormations(formations: Formation[]) {
  const bySlug = new Map(formations.map((formation) => [formation.slug, formation]));
  const priority = prioritySlugs.flatMap((slug) => {
    const formation = bySlug.get(slug);
    return formation ? [formation] : [];
  });
  const rest = formations.filter((formation) => !prioritySlugs.includes(formation.slug));
  return [...priority, ...rest];
}

function labelFor(formation: Formation) {
  const copy = homeCopy[formation.slug];
  const category =
    copy?.category ??
    (formation.productLine && formation.productLine !== "AUTO_ECOLE"
      ? productLineLabels[formation.productLine]
      : "Permis B");

  return {
    category,
    title: copy?.title ?? formation.title,
    description: copy?.description ?? formation.description
  };
}

export function HomeFormationsCarousel({ formations }: { formations: Formation[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const orderedFormations = useMemo(() => orderedHomeFormations(formations), [formations]);
  const [activeIndex, setActiveIndex] = useState(0);

  function scroll(direction: "previous" | "next") {
    const track = trackRef.current;
    if (!track) return;

    const card = track.querySelector<HTMLElement>("[data-carousel-card]");
    const cardWidth = card?.offsetWidth ?? track.clientWidth;
    const gap = 24;
    track.scrollBy({
      left: direction === "next" ? cardWidth + gap : -(cardWidth + gap),
      behavior: "smooth"
    });
  }

  function updateActiveIndex() {
    const track = trackRef.current;
    if (!track) return;

    const card = track.querySelector<HTMLElement>("[data-carousel-card]");
    const cardWidth = card?.offsetWidth ?? track.clientWidth;
    const gap = 24;
    setActiveIndex(Math.round(track.scrollLeft / (cardWidth + gap)));
  }

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase text-loden-700">Formations principales</p>
          <h2 className="mt-3 text-2xl font-semibold leading-tight text-loden-ink sm:text-4xl">
            Les parcours les plus demandés
          </h2>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <button
            type="button"
            onClick={() => scroll("previous")}
            className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-loden-ink shadow-soft transition hover:border-loden-200 hover:text-loden-700"
            aria-label="Voir les formations précédentes"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => scroll("next")}
            className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-full bg-loden-700 text-white shadow-soft transition hover:bg-loden-800"
            aria-label="Voir les formations suivantes"
          >
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        onScroll={updateActiveIndex}
        className="mt-6 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Carousel des formations LODENE"
      >
        {orderedFormations.map((formation) => {
          const image = formation.imageUrl
            ? { src: formation.imageUrl, alt: formation.subtitle ?? formation.title, objectPosition: "50% 50%" }
            : formationImageMeta(formation.slug, formation.productLine);
          const labels = labelFor(formation);
          const price = formation.quoteOnly || formation.price === 0 ? "Sur devis" : `Dès ${formatCurrency(formation.price)}`;

          return (
            <article
              key={formation.slug}
              data-carousel-card
              className="group flex min-w-0 shrink-0 basis-[88%] snap-start overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft transition duration-300 hover:-translate-y-1 hover:border-loden-200 hover:shadow-premium sm:basis-full sm:rounded-[1.75rem] md:basis-[calc((100%_-_1.5rem)_/_2)] xl:basis-[calc((100%_-_3rem)_/_3)]"
            >
              <Link href={`/formations/${formation.slug}`} className="focus-ring flex h-full w-full flex-col rounded-3xl sm:rounded-[1.75rem]">
                <div className="relative h-36 overflow-hidden bg-loden-900 sm:h-48">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    loading="lazy"
                    sizes="(min-width: 1280px) 31vw, (min-width: 768px) 48vw, 100vw"
                    unoptimized
                    className="object-cover transition duration-500 group-hover:scale-105"
                    style={{ objectPosition: image.objectPosition ?? "50% 50%" }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-loden-ink/55 via-transparent to-black/10" aria-hidden="true" />
                  <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-loden-700 shadow-soft">
                    {labels.category}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-4 sm:p-6">
                  <h3 className="text-lg font-semibold leading-tight text-loden-ink sm:text-xl">{labels.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-loden-muted sm:mt-3">{labels.description}</p>

                  <div className="mt-5 grid gap-2 text-sm text-loden-muted">
                    <span className="inline-flex items-center gap-2">
                      <Euro className="h-4 w-4 text-loden-600" aria-hidden="true" />
                      <strong className="font-semibold text-loden-ink">{price}</strong>
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Clock3 className="h-4 w-4 text-loden-600" aria-hidden="true" />
                      {formation.duration}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 sm:mt-5">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-loden-700">
                      <Sparkles className="h-4 w-4" aria-hidden="true" />
                      Découvrir
                    </span>
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-loden-700 text-white shadow-soft transition group-hover:translate-x-0.5 group-hover:bg-loden-800 sm:h-11 sm:w-11">
                      <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                    </span>
                  </div>
                </div>
              </Link>
            </article>
          );
        })}
      </div>

      <div className="mt-1 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-loden-muted">
            {Math.min(activeIndex + 1, orderedFormations.length)} / {orderedFormations.length}
          </span>
          <div className="h-1.5 w-28 overflow-hidden rounded-full bg-loden-100" aria-hidden="true">
            <span
              className="block h-full rounded-full bg-loden-700 transition-all"
              style={{ width: `${((Math.min(activeIndex + 1, orderedFormations.length)) / orderedFormations.length) * 100}%` }}
            />
          </div>
        </div>
        <div className="flex gap-3 sm:hidden">
          <button
            type="button"
            onClick={() => scroll("previous")}
            className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-loden-ink shadow-soft"
            aria-label="Voir les formations précédentes"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => scroll("next")}
            className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-full bg-loden-700 text-white shadow-soft"
            aria-label="Voir les formations suivantes"
          >
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <Link
          href="/formations"
          className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-loden-ink shadow-soft transition hover:border-loden-200 hover:text-loden-700"
        >
          Voir toutes les formations
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
