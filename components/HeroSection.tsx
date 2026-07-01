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

        <div className="container-pad relative z-10 grid min-h-[inherit] items-end gap-6 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-8 md:grid-cols-[minmax(0,44rem)_minmax(20rem,1fr)] md:items-center md:pb-16 md:pt-12 lg:gap-10 xl:gap-14">
          <div className="max-w-xl md:hidden">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/inscription"
                className="focus-ring inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-loden-700 px-6 py-3.5 text-base font-black text-white shadow-[0_18px_45px_rgba(0,134,148,0.35)] transition hover:bg-loden-800 sm:w-auto sm:px-8"
              >
                Je m&apos;inscris
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Link>
              <Link
                href="/formations"
                className="focus-ring inline-flex min-h-12 items-center justify-center gap-3 rounded-full border border-loden-500 bg-white/95 px-6 py-3.5 text-base font-black text-loden-ink shadow-soft transition hover:bg-white sm:w-auto sm:px-8"
              >
                <BookOpen className="h-5 w-5 text-loden-700" aria-hidden="true" />
                Voir les formations
              </Link>
            </div>

            <div className="mt-5 flex items-center gap-3 md:hidden">
              <Link
                href="/offre-50?code=LODENE50"
                className="loden-home-hero-badge focus-ring inline-flex items-center gap-3 rounded-2xl border border-white/70 bg-white/95 p-2 pr-4 text-loden-900 shadow-premium"
              >
                <Image src="/offre-50/qr_offre_50_LDNE50.png" alt="QR code offre LODENE -50€" width={64} height={64} className="h-14 w-14 rounded-xl object-contain" />
                <span className="grid">
                  <span className="text-sm font-black">-50 € avec le QR code</span>
                  <span className="text-xs font-semibold text-loden-muted">Voir l&apos;offre</span>
                </span>
              </Link>
            </div>
          </div>

          <div className="pointer-events-none relative hidden min-h-[32rem] md:col-start-2 md:block">
            <Link
              href="/offre-50?code=LODENE50"
              className="loden-home-hero-flyer focus-ring pointer-events-auto absolute right-3 top-10 block w-[12rem] rounded-[1.25rem] shadow-[0_24px_64px_rgba(5,50,74,0.28)] lg:right-8 lg:w-[14rem] xl:right-14 xl:w-[16rem]"
              aria-label="Voir l'offre LODENE -50€"
            >
              <span className="loden-home-hero-canopy" aria-hidden="true" />
              <span className="loden-home-hero-lines" aria-hidden="true" />
              <Image
                src="/offre-50/affiche_offre_50_propre.png"
                alt="Flyer offre spéciale LODENE 50€ de réduction"
                width={2480}
                height={3508}
                className="rounded-[1.25rem] border border-white/70 bg-white object-cover"
              />
            </Link>

            <Link
              href="/offre-50?code=LODENE50"
              className="loden-home-hero-qr focus-ring pointer-events-auto absolute bottom-10 right-2 z-20 flex items-center gap-2 rounded-2xl border border-white bg-white p-2.5 pr-4 text-loden-900 shadow-premium lg:right-8"
            >
              <Image src="/offre-50/qr_offre_50_LDNE50.png" alt="QR code vers l'offre LODENE -50€" width={96} height={96} className="h-16 w-16 rounded-xl object-contain" />
              <span className="grid">
                <span className="text-[0.65rem] font-black uppercase tracking-[0.14em] text-loden-700">Offre limitée</span>
                <span className="text-base font-black">-50 € avec le QR code</span>
                <span className="text-xs font-semibold text-loden-muted">Cliquez ou scannez</span>
              </span>
            </Link>
          </div>
        </div>

        <div className="container-pad pointer-events-none absolute inset-x-0 bottom-28 z-30 hidden md:block">
          <div className="pointer-events-auto flex max-w-xl gap-3">
            <Link
              href="/inscription"
              className="focus-ring inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-loden-700 px-8 py-3.5 text-base font-black text-white shadow-[0_18px_45px_rgba(0,134,148,0.35)] transition hover:bg-loden-800"
            >
              Je m&apos;inscris
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
            <Link
              href="/formations"
              className="focus-ring inline-flex min-h-12 items-center justify-center gap-3 rounded-full border border-loden-500 bg-white/95 px-8 py-3.5 text-base font-black text-loden-ink shadow-soft transition hover:bg-white"
            >
              <BookOpen className="h-5 w-5 text-loden-700" aria-hidden="true" />
              Voir les formations
            </Link>
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
