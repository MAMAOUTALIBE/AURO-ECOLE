import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarCheck, CheckCircle2, PlayCircle } from "lucide-react";
import { heroStats } from "@/data/site";
import { MotionReveal } from "@/components/MotionReveal";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-loden-pearl">
      <div className="absolute inset-0 soft-grid opacity-60" aria-hidden="true" />
      <div className="container-pad relative grid min-h-[calc(100svh-7.5rem)] items-center gap-10 py-12 lg:grid-cols-[0.95fr_1.05fr] lg:py-16">
        <MotionReveal>
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-loden-100 bg-white px-4 py-2 text-sm font-semibold text-loden-700 shadow-soft">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Auto-école premium, CPF accepté
            </div>
            <h1 className="text-5xl font-semibold leading-[1.02] text-loden-ink sm:text-6xl lg:text-7xl">
              Passe ton permis avec LODEN
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-loden-muted sm:text-xl">
              Formation rapide, flexible et personnalisée. Réussis ton permis en toute confiance.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/inscription"
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-loden-700 px-6 py-4 font-semibold text-white shadow-soft transition hover:bg-loden-800"
              >
                Démarrer mon inscription
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Link>
              <Link
                href="/formations"
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-4 font-semibold text-loden-ink transition hover:border-loden-200 hover:bg-loden-50"
              >
                <PlayCircle className="h-5 w-5 text-loden-500" aria-hidden="true" />
                Découvrir nos formations
              </Link>
            </div>
            <div className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {heroStats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-soft">
                  <p className="text-2xl font-semibold text-loden-ink">{stat.value}</p>
                  <p className="mt-1 text-sm text-loden-muted">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </MotionReveal>

        <MotionReveal delay={0.12}>
          <div className="relative">
            <div className="relative overflow-hidden rounded-[2rem] border border-white bg-white shadow-premium">
              <Image
                src="/loden-hero.jpg"
                alt="Voiture école moderne LODEN dans une rue lumineuse"
                width={1200}
                height={900}
                loading="eager"
                fetchPriority="high"
                sizes="(min-width: 1024px) 52vw, 100vw"
                className="aspect-[4/3] w-full object-cover"
              />
              <div className="absolute bottom-5 left-5 right-5 grid gap-3 rounded-3xl bg-white/92 p-4 shadow-soft backdrop-blur md:grid-cols-2">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-loden-50 text-loden-700">
                    <CalendarCheck className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold text-loden-ink">Prochaine leçon</p>
                    <p className="text-sm text-loden-muted">Aujourd&apos;hui · 17:30</p>
                  </div>
                </div>
                <div className="rounded-2xl bg-loden-700 px-4 py-3 text-white">
                  <p className="text-sm text-white/85">Progression code</p>
                  <p className="text-xl font-semibold">86 % prêt</p>
                </div>
              </div>
            </div>
          </div>
        </MotionReveal>
      </div>
    </section>
  );
}
