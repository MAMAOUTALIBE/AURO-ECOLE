import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, MapPin, MessageCircle, Timer, WalletCards } from "lucide-react";
import { MotionReveal } from "@/components/MotionReveal";
import { contactInfo } from "@/data/site";
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
  const whatsappHref = contactInfo.whatsapp ? `https://wa.me/${contactInfo.whatsapp}` : "/contact";
  const whatsappIsExternal = Boolean(contactInfo.whatsapp);

  return (
    <>
      <h1 className="sr-only">LODENE auto-école et centre de formation à Conflans</h1>
      <section className="relative h-[calc(92svh-4rem)] min-h-[30rem] max-h-[42rem] overflow-hidden bg-loden-900 md:hidden">
        {hero.image ? (
          <Image
            src={hero.image}
            alt={hero.imageAlt}
            fill
            priority
            sizes="100vw"
            className="object-cover object-[82%_center]"
          />
        ) : null}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/25 to-transparent" aria-hidden="true" />
        <div
          className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(8,24,30,0.04)_18%,rgba(8,24,30,0.3)_48%,rgba(8,24,30,0.9)_100%)]"
          aria-hidden="true"
        />

        <div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
          <p className="inline-flex rounded-full border border-white/25 bg-white/15 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md">
            Auto-école & centre de formation à Conflans
          </p>
          <p className="mt-3 max-w-[18rem] text-[1.9rem] font-extrabold leading-tight text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.35)]">
            Permis, CPF, formations pro.
          </p>
          <p className="mt-2 max-w-[19rem] text-sm font-semibold leading-6 text-white/90 drop-shadow-[0_2px_10px_rgba(0,0,0,0.35)]">
            Un conseiller t&apos;oriente vite vers le bon parcours.
          </p>
          <div className="mt-4 grid grid-cols-[1.1fr_1fr_1fr] gap-1.5 min-[375px]:gap-2">
            <Link
              href="/inscription"
              className="focus-ring inline-flex min-h-12 min-w-0 items-center justify-center gap-1 rounded-full bg-loden-600 px-2 text-[0.72rem] font-extrabold text-white shadow-[0_18px_45px_rgba(0,134,148,0.35)] transition hover:bg-loden-700 min-[375px]:gap-2 min-[375px]:px-3 min-[375px]:text-sm"
            >
              <span className="whitespace-nowrap">S&apos;inscrire</span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 min-[375px]:h-4 min-[375px]:w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/formations"
              className="focus-ring inline-flex min-h-12 min-w-0 items-center justify-center gap-1 rounded-full border border-white/35 bg-white/18 px-1.5 text-[0.68rem] font-extrabold text-white shadow-[0_14px_34px_rgba(0,0,0,0.16)] backdrop-blur-md transition hover:bg-white/28 min-[375px]:gap-1.5 min-[375px]:px-2 min-[375px]:text-[0.8rem]"
            >
              <BookOpen className="h-3.5 w-3.5 shrink-0 min-[375px]:h-4 min-[375px]:w-4" aria-hidden="true" />
              <span className="whitespace-nowrap">Formations</span>
            </Link>
            <a
              href={whatsappHref}
              target={whatsappIsExternal ? "_blank" : undefined}
              rel={whatsappIsExternal ? "noreferrer" : undefined}
              className="focus-ring inline-flex min-h-12 min-w-0 items-center justify-center gap-1 rounded-full border border-white/35 bg-white/18 px-1.5 text-[0.68rem] font-extrabold text-white shadow-[0_14px_34px_rgba(0,0,0,0.16)] backdrop-blur-md transition hover:bg-white/28 min-[375px]:gap-1.5 min-[375px]:px-2 min-[375px]:text-[0.8rem]"
            >
              <MessageCircle className="h-3.5 w-3.5 shrink-0 min-[375px]:h-4 min-[375px]:w-4" aria-hidden="true" />
              <span className="whitespace-nowrap">WhatsApp</span>
            </a>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {badges.slice(0, 3).map((badge) => {
              const Icon = badge.icon;
              return (
                <span key={badge.label} className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-loden-ink shadow-soft">
                  <Icon className="h-3.5 w-3.5 text-loden-700" aria-hidden="true" />
                  {badge.label}
                </span>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative hidden overflow-hidden bg-loden-pearl md:block">
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

          <div className="container-pad relative z-20 grid items-center py-8 sm:py-10 lg:min-h-[520px] lg:grid-cols-[520px_1fr] lg:py-10">
            <MotionReveal>
              <div className="max-w-[520px]">
                <p className="mb-4 inline-flex rounded-full border border-loden-100 bg-white/90 px-3 py-2 text-xs font-semibold text-loden-700 shadow-soft sm:px-4 sm:text-sm">
                  <span className="sm:hidden">Auto-école CPF à Conflans</span>
                  <span className="hidden sm:inline">Auto-école & centre de formation à Conflans</span>
                </p>

                <p className="mt-2 max-w-md text-base leading-7 text-loden-muted sm:mt-3 sm:text-lg sm:leading-8">
                  <span className="sm:hidden">Permis B, CPF et planning flexible à Conflans.</span>
                  <span className="hidden sm:inline">Permis B, VTC, SST et formations professionnelles à Conflans.</span>
                </p>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/inscription"
                    className="focus-ring inline-flex w-full max-w-[22rem] items-center justify-center gap-3 rounded-full bg-loden-700 px-6 py-3.5 text-base font-semibold text-white shadow-soft transition hover:bg-loden-800 sm:w-auto sm:max-w-none sm:px-7"
                  >
                    Je m&apos;inscris
                    <ArrowRight className="h-5 w-5" aria-hidden="true" />
                  </Link>
                  <Link
                    href="/formations"
                    className="focus-ring inline-flex w-full max-w-[22rem] items-center justify-center gap-3 rounded-full border border-loden-500 bg-white/90 px-6 py-3.5 text-base font-semibold text-loden-ink shadow-soft backdrop-blur transition hover:bg-white sm:w-auto sm:max-w-none sm:px-7"
                  >
                    Voir les formations
                  </Link>
                </div>

                <div className="-mx-4 mt-6 flex max-w-[38rem] gap-2.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden">
                  {badges.map((badge) => {
                    const Icon = badge.icon;
                    return (
                      <span key={badge.label} className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-loden-ink shadow-soft backdrop-blur">
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
                <div className="relative mt-5 min-h-[170px] sm:min-h-[300px] lg:hidden">
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
    </>
  );
}
