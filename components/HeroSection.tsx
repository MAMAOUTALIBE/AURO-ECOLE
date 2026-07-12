import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowDown, ArrowRight, BookOpen } from "lucide-react";
import { defaultHeroHome, getSiteSetting, type HeroHome } from "@/lib/site-content";

const heroSlides = [
  {
    src: "/formations/photos/permis-b-auto-declic.webp",
    alt: "Formation permis B automatique LODENE",
    label: "Permis B"
  },
  {
    src: "/formations/photos/vtc-excellence.webp",
    alt: "Formation VTC LODENE devant le centre de formation",
    label: "VTC"
  },
  {
    src: "/formations/photos/permis-b-auto-maitrise.webp",
    alt: "Formation auto-école LODENE",
    label: "Auto-école"
  },
  {
    src: "/formations/photos/sst-initial.webp",
    alt: "Formation SST LODENE",
    label: "SST"
  },
  {
    src: "/formations/photos/chariots-elevateurs-r489.webp",
    alt: "Formation logistique chariots élévateurs LODENE",
    label: "Logistique"
  },
  {
    src: "/formations/photos/terberg-tracteur-parc.webp",
    alt: "Formation sécurité et logistique LODENE",
    label: "Sécurité"
  }
];

export async function HeroSection() {
  const hero = await getSiteSetting<HeroHome>("hero.home", defaultHeroHome);
  if (!hero.enabled) return null;

  return (
    <>
      <h1 className="sr-only">LODENE auto-école et centre de formation à Conflans</h1>
      <section className="relative isolate min-h-[calc(88svh-4rem)] overflow-hidden bg-loden-900 md:min-h-[calc(100svh-5rem)] md:max-h-[860px]">
        <div className="absolute inset-0" aria-hidden="true">
          {heroSlides.map((slide, index) => (
            <div
              key={slide.src}
              className="loden-home-hero-slide absolute inset-0"
              style={{ animationDelay: `${index * 5}s`, opacity: index === 0 ? 1 : 0 } as CSSProperties}
            >
              <Image
                src={slide.src}
                alt={index === 0 ? slide.alt : ""}
                fill
                priority={index === 0}
                sizes="100vw"
                className="object-cover object-center"
              />
            </div>
          ))}
        </div>
        <div className="container-pad relative z-10 flex min-h-[inherit] items-end pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-8 md:hidden">
          <div className="w-full max-w-xl pb-3 text-white">
            <p className="inline-flex rounded-full border border-white/25 bg-white/15 px-3 py-1.5 text-[0.68rem] font-black uppercase tracking-[0.12em] shadow-soft">
              Auto-école & centre de formation
            </p>
            <h2 className="mt-4 text-[2.05rem] font-black leading-[1.05] tracking-normal text-white drop-shadow-[0_4px_18px_rgba(0,0,0,0.35)] min-[380px]:text-[2.25rem]">
              {hero.scriptLine} {hero.connector} {hero.brand}
            </h2>
            <p className="mt-3 max-w-[22rem] text-sm font-semibold leading-6 text-white/90 drop-shadow-[0_2px_10px_rgba(0,0,0,0.35)]">
              {hero.subtitle}
            </p>
            <div className="mt-5 grid gap-2 min-[360px]:grid-cols-2">
              <Link
                href={hero.primaryCta.href}
                className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-loden-700 px-5 py-3 text-sm font-black text-white shadow-[0_18px_45px_rgba(0,134,148,0.35)] transition hover:bg-loden-800"
              >
                {hero.primaryCta.label}
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Link>
              {hero.secondaryCta ? (
                <Link
                  href={hero.secondaryCta.href}
                  className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/60 bg-white/95 px-5 py-3 text-sm font-black text-loden-ink shadow-soft transition hover:bg-white"
                >
                  <BookOpen className="h-5 w-5 text-loden-700" aria-hidden="true" />
                  {hero.secondaryCta.label}
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        <div className="container-pad pointer-events-none absolute inset-x-0 bottom-28 z-30 hidden md:block">
          <div className="pointer-events-auto flex max-w-xl gap-3">
            <Link
              href={hero.primaryCta.href}
              className="focus-ring inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-loden-700 px-8 py-3.5 text-base font-black text-white shadow-[0_18px_45px_rgba(0,134,148,0.35)] transition hover:bg-loden-800"
            >
              {hero.primaryCta.label}
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
            {hero.secondaryCta ? (
              <Link
                href={hero.secondaryCta.href}
                className="focus-ring inline-flex min-h-12 items-center justify-center gap-3 rounded-full border border-loden-500 bg-white/95 px-8 py-3.5 text-base font-black text-loden-ink shadow-soft transition hover:bg-white"
              >
                <BookOpen className="h-5 w-5 text-loden-700" aria-hidden="true" />
                {hero.secondaryCta.label}
              </Link>
            ) : null}
          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 z-20 hidden -translate-x-1/2 md:block">
          <a href="#formations" className="focus-ring grid h-16 w-16 place-items-center rounded-full bg-white/95 text-loden-700 shadow-premium" aria-label="Descendre vers les formations">
            <ArrowDown className="h-7 w-7" aria-hidden="true" />
          </a>
        </div>

        <div className="absolute bottom-[5.15rem] left-4 z-20 flex gap-2 md:bottom-44 md:left-[max(2rem,calc((100vw-80rem)/2+2rem))]">
          {heroSlides.map((slide, index) => (
            <span
              key={slide.label}
              className="loden-home-hero-dot h-3 w-3 rounded-full bg-white/90 shadow-soft ring-1 ring-loden-700/10"
              style={{ animationDelay: `${index * 5}s` } as CSSProperties}
              aria-hidden="true"
            />
          ))}
        </div>

        <div className="sr-only" aria-live="polite">
          Diaporama automatique LODENE : auto-école, VTC, SST, logistique et sécurité.
        </div>
      </section>
    </>
  );
}
