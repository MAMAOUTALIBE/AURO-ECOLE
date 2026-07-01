"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Building2, Clock3, Database, ShieldCheck, Sparkles, Users, WalletCards, Workflow, Zap, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import type { FormationHeroIllustrationIcon, FormationHeroSlide } from "@/lib/formation-image";
import { cn } from "@/lib/utils";

type HeroBadge = {
  icon: "Clock3" | "BadgeCheck" | "Building2" | "ShieldCheck" | "WalletCards";
  label: string;
};

type FormationHeroProps = {
  slides: FormationHeroSlide[];
  kicker: string;
  title: string;
  subtitle: string;
  badges: HeroBadge[];
  primaryCta: { href: string; label: string };
  secondaryCta: { href: string; label: string };
};

const ILLUSTRATION_ICONS: Record<FormationHeroIllustrationIcon, LucideIcon> = {
  Sparkles,
  Database,
  Users,
  Workflow,
  Zap
};

const BADGE_ICONS: Record<HeroBadge["icon"], LucideIcon> = {
  Clock3,
  BadgeCheck,
  Building2,
  ShieldCheck,
  WalletCards
};

export function FormationHero({
  slides,
  kicker,
  title,
  subtitle,
  badges,
  primaryCta,
  secondaryCta
}: FormationHeroProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const visibleSlides = slides.length > 0 ? slides : [];

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotionPreference = () => setReducedMotion(media.matches);
    syncMotionPreference();
    media.addEventListener("change", syncMotionPreference);
    return () => media.removeEventListener("change", syncMotionPreference);
  }, []);

  useEffect(() => {
    if (reducedMotion || paused || visibleSlides.length < 2) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % visibleSlides.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [paused, reducedMotion, visibleSlides.length]);

  const displayedIndex = reducedMotion ? 0 : activeIndex;

  return (
    <section
      className="relative isolate max-h-[640px] min-h-[52vh] overflow-hidden bg-loden-900 md:min-h-[56vh]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label={`Formation ${title}`}
    >
      <div className="absolute inset-0" aria-hidden="true">
        {visibleSlides.map((slide, index) => {
          const visible = index === displayedIndex;
          const Icon = slide.kind === "illustration" ? ILLUSTRATION_ICONS[slide.icon] : null;

          return (
            <div
              key={slide.kind === "image" ? slide.src : `${slide.icon}-${slide.keyword}`}
              className={cn(
                "absolute inset-0 opacity-0 transition-opacity duration-700 ease-out",
                visible && "opacity-100"
              )}
            >
              {slide.kind === "image" ? (
                <Image
                  src={slide.src}
                  alt={index === 0 ? slide.alt : ""}
                  fill
                  priority={index === 0}
                  unoptimized
                  sizes="100vw"
                  className="object-cover"
                  style={{ objectPosition: slide.objectPosition ?? "50% 50%" }}
                />
              ) : (
                <div className={cn("absolute inset-0 bg-gradient-to-br", slide.gradient ?? "from-loden-700 to-loden-900")}>
                  <div className="absolute inset-y-0 right-0 flex w-[58%] items-center justify-center opacity-25">
                    {Icon ? <Icon className="h-56 w-56 text-white md:h-80 md:w-80" strokeWidth={1.25} /> : null}
                  </div>
                  <div className="absolute bottom-7 right-4 max-w-[calc(100%-2rem)] text-right text-3xl font-black uppercase leading-[0.95] text-white/20 sm:bottom-8 sm:right-6 sm:text-4xl md:right-10 md:text-5xl lg:text-6xl">
                    {slide.keyword}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/40 to-black/10" aria-hidden="true" />
        {visibleSlides[displayedIndex]?.kind === "image" && visibleSlides[displayedIndex]?.keyword ? (
          <div className="absolute bottom-7 right-4 max-w-[calc(100%-2rem)] text-right text-3xl font-black uppercase leading-[0.95] text-white/20 sm:bottom-8 sm:right-6 sm:text-4xl md:right-10 md:text-5xl lg:text-6xl">
            {visibleSlides[displayedIndex].keyword}
          </div>
        ) : null}
      </div>

      <div className="container-pad relative z-10 flex min-h-[52vh] items-center py-10 md:min-h-[56vh]">
        <div className="max-w-3xl text-white">
          <p className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white shadow-soft backdrop-blur-sm sm:text-sm">
            {kicker}
          </p>
          <h1 className="mt-4 text-[2.15rem] font-black leading-[1.04] sm:text-5xl lg:text-6xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-white/88 md:text-lg">{subtitle}</p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href={primaryCta.href}
              className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-loden-700 px-6 py-3 text-sm font-black text-white shadow-soft transition hover:bg-loden-800 sm:w-auto"
            >
              {primaryCta.label}
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
            <Link
              href={secondaryCta.href}
              className="focus-ring inline-flex min-h-12 items-center justify-center rounded-full border border-white/50 bg-white/95 px-6 py-3 text-sm font-black text-loden-ink shadow-soft transition hover:bg-white sm:w-auto"
            >
              {secondaryCta.label}
            </Link>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {badges.slice(0, 3).map((badge) => {
              const BadgeIcon = BADGE_ICONS[badge.icon];
              return (
                <span
                  key={badge.label}
                  className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/15 bg-white/12 px-3.5 py-2 text-xs font-black text-white shadow-soft backdrop-blur-sm"
                >
                  <BadgeIcon className="h-4 w-4 text-[#08AEB8]" aria-hidden="true" />
                  {badge.label}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {visibleSlides.length > 1 ? (
        <div className="absolute inset-x-0 bottom-4 z-20 flex justify-center gap-2">
          {visibleSlides.map((slide, index) => (
            <button
              key={slide.kind === "image" ? `${slide.src}-dot` : `${slide.keyword}-dot`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={cn(
                "focus-ring h-2.5 w-8 rounded-full bg-white/55 transition hover:bg-white",
                index === displayedIndex && "bg-[#08AEB8]"
              )}
              aria-label={`Afficher le slide ${index + 1}`}
            />
          ))}
        </div>
      ) : null}

      <div className="sr-only" aria-live="polite">
        Slide {displayedIndex + 1} sur {Math.max(visibleSlides.length, 1)}
      </div>
    </section>
  );
}
