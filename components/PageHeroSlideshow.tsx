import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export type PageHeroSlideshowSlide = {
  src: string;
  alt: string;
  label: string;
  objectPosition?: string;
};

type PageHeroSlideshowProps = {
  eyebrow: string;
  title: string;
  text: string;
  slides: PageHeroSlideshowSlide[];
  primaryCta: { href: string; label: string };
  secondaryCta?: { href: string; label: string };
  badges?: string[];
};

export function PageHeroSlideshow({
  eyebrow,
  title,
  text,
  slides,
  primaryCta,
  secondaryCta,
  badges = []
}: PageHeroSlideshowProps) {
  return (
    <section className="relative isolate overflow-hidden bg-loden-900 text-white">
      <div className="absolute inset-0" aria-hidden="true">
        {slides.map((slide, index) => (
          <div
            key={`${slide.src}-${slide.label}`}
            className="loden-marketing-hero-slide absolute inset-0"
            style={{ animationDelay: `${index * 6}s`, opacity: index === 0 ? 1 : 0 } as CSSProperties}
          >
            <Image
              src={slide.src}
              alt=""
              fill
              sizes="100vw"
              className="scale-105 object-cover blur-xl"
              style={{ objectPosition: slide.objectPosition ?? "50% 50%" }}
            />
            <Image
              src={slide.src}
              alt=""
              fill
              priority={index === 0}
              sizes="100vw"
              className="object-contain"
              style={{ objectPosition: slide.objectPosition ?? "50% 50%" }}
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-loden-950/92 via-loden-900/68 to-loden-900/12" />
        <div className="absolute inset-0 bg-gradient-to-t from-loden-950/50 via-transparent to-loden-950/10" />
      </div>

      <div className="container-pad relative z-10 flex min-h-[430px] items-end py-8 sm:min-h-[470px] md:min-h-[520px] md:items-center md:py-12 xl:min-h-[560px]">
        <div className="w-full min-w-0 max-w-3xl pb-3 md:pb-0">
          <p className="inline-flex max-w-full overflow-hidden text-ellipsis whitespace-nowrap rounded-full border border-white/20 bg-white/12 px-3.5 py-2 text-[0.72rem] font-black uppercase tracking-[0.12em] text-white shadow-soft sm:text-sm">
            {eyebrow}
          </p>
          <h1 className="mt-4 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[2.2rem] font-black leading-[1.04] text-white drop-shadow-[0_5px_24px_rgba(0,0,0,0.35)] sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          <p className="mt-3 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold leading-6 text-white/90 drop-shadow-[0_3px_16px_rgba(0,0,0,0.28)] sm:max-w-2xl md:text-base">
            {text}
          </p>

          <div className="mt-5 grid gap-3 sm:flex sm:flex-wrap">
            <Link
              href={primaryCta.href}
              className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-loden-700 px-6 py-3 text-sm font-black text-white shadow-[0_18px_45px_rgba(0,134,148,0.35)] transition hover:bg-loden-800 sm:w-auto"
            >
              {primaryCta.label}
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
            {secondaryCta ? (
              <Link
                href={secondaryCta.href}
                className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/60 bg-white/95 px-6 py-3 text-sm font-black text-loden-ink shadow-soft transition hover:bg-white sm:w-auto"
              >
                {secondaryCta.label}
                <ArrowRight className="h-5 w-5 text-loden-700" aria-hidden="true" />
              </Link>
            ) : null}
          </div>

          {badges.length > 0 ? (
            <div className="mt-5 hidden max-w-2xl flex-wrap gap-2 lg:flex">
              {badges.map((badge) => (
                <span key={badge} className="inline-flex min-h-10 items-center rounded-full border border-white/16 bg-white/12 px-3.5 py-2 text-xs font-black text-white shadow-soft">
                  {badge}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {slides.length > 1 ? (
        <div className="absolute bottom-5 left-4 z-20 flex gap-2 sm:left-6 lg:left-[max(2rem,calc((100vw-80rem)/2+2rem))]">
          {slides.map((slide, index) => (
            <span
              key={`${slide.label}-dot`}
              className="loden-marketing-hero-dot h-2.5 w-8 rounded-full bg-white/75 shadow-soft"
              style={{ animationDelay: `${index * 6}s` } as CSSProperties}
              aria-hidden="true"
            />
          ))}
        </div>
      ) : null}

      <div className="sr-only" aria-live="polite">
        Diaporama automatique : {slides.map((slide) => slide.label).join(", ")}.
      </div>
    </section>
  );
}
