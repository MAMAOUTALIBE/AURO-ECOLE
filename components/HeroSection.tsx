import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, MapPin, Timer, WalletCards } from "lucide-react";
import { MotionReveal } from "@/components/MotionReveal";
import { defaultHeroHome, getSiteSetting, type HeroHome } from "@/lib/site-content";

export async function HeroSection() {
  const hero = await getSiteSetting<HeroHome>("hero.home", defaultHeroHome);
  if (!hero.enabled) return null;

  const badges = [
    { icon: WalletCards, label: "CPF possible" },
    { icon: Timer, label: "Formations rapides" },
    { icon: CheckCircle2, label: "Planning flexible" },
    { icon: MapPin, label: "Conflans" }
  ];

  return (
    <section className="relative overflow-hidden bg-loden-pearl">
      <div className="absolute inset-0 soft-grid opacity-45" aria-hidden="true" />

      <div className="relative">
        {hero.image ? (
          <div className="absolute bottom-0 right-0 top-6 hidden w-[80%] overflow-visible xl:w-[76%] 2xl:w-[70%] lg:block" aria-hidden="true">
            <Image
              src={hero.image}
              alt=""
              fill
              priority
              sizes="(min-width: 1536px) 70vw, 80vw"
              className="object-contain object-[right_bottom]"
            />
            {/* Fondu vers la gauche : l'image se fond dans le fond clair derrière le texte, sans la rogner. */}
            <div className="absolute inset-0 z-10 bg-[linear-gradient(to_right,#fbfdfc_0%,rgba(251,253,252,0.92)_20%,rgba(251,253,252,0.4)_42%,rgba(251,253,252,0)_70%)]" />
            {/* Fondu haut/bas pour intégrer la zone vide laissée par object-contain. */}
            <div className="absolute inset-x-0 top-0 z-10 h-32 bg-gradient-to-b from-loden-pearl via-loden-pearl/40 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 z-10 h-24 bg-gradient-to-t from-loden-pearl via-loden-pearl/40 to-transparent" />
          </div>
        ) : null}

        <div className="container-pad relative z-20 grid items-center py-10 sm:py-12 lg:min-h-[560px] lg:grid-cols-[520px_1fr] lg:py-10">
          <MotionReveal>
            <div className="max-w-[520px]">
              <p className="mb-4 inline-flex rounded-full border border-loden-100 bg-white/90 px-4 py-2 text-sm font-semibold text-loden-700 shadow-soft">
                Auto-école & centre de formation à Conflans
              </p>
              <h1 className="text-4xl font-semibold leading-tight text-loden-ink sm:text-5xl lg:text-6xl">
                Passe ton permis avec LODENE
              </h1>

              <p className="mt-5 max-w-md text-lg leading-8 text-loden-muted">
                Permis B, VTC, SST et formations professionnelles à Conflans.
              </p>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/inscription"
                  className="focus-ring inline-flex items-center justify-center gap-3 rounded-full bg-loden-700 px-7 py-3.5 text-base font-semibold text-white shadow-soft transition hover:bg-loden-800"
                >
                  Je m&apos;inscris
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </Link>
                <Link
                  href="/formations"
                  className="focus-ring inline-flex items-center justify-center gap-3 rounded-full border border-loden-500 bg-white/90 px-7 py-3.5 text-base font-semibold text-loden-ink shadow-soft backdrop-blur transition hover:bg-white"
                >
                  Voir les formations
                </Link>
              </div>

              <div className="mt-6 flex max-w-[38rem] flex-wrap gap-2.5">
                {badges.map((badge) => {
                  const Icon = badge.icon;
                  return (
                    <span key={badge.label} className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-loden-ink shadow-soft backdrop-blur">
                      <Icon className="h-4 w-4 text-loden-700" aria-hidden="true" />
                      {badge.label}
                    </span>
                  );
                })}
              </div>
            </div>
          </MotionReveal>

          {hero.image ? (
            <MotionReveal delay={0.1}>
              <div className="relative mt-6 min-h-[210px] sm:min-h-[300px] lg:hidden">
                <Image
                  src={hero.image}
                  alt={hero.imageAlt}
                  fill
                  priority
                  sizes="100vw"
                  className="object-contain object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-loden-pearl/30 via-transparent to-loden-pearl" />
              </div>
            </MotionReveal>
          ) : null}
        </div>
      </div>
    </section>
  );
}
