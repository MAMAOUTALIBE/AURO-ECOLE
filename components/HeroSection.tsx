import Image from "next/image";
import Link from "next/link";
import { Allura, Great_Vibes, Permanent_Marker } from "next/font/google";
import { ArrowRight, CreditCard, PlayCircle, Star, UsersRound, WalletCards } from "lucide-react";
import { MotionReveal } from "@/components/MotionReveal";

const greatVibes = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  display: "swap"
});

const allura = Allura({
  subsets: ["latin"],
  weight: "400",
  display: "swap"
});

const permanentMarker = Permanent_Marker({
  subsets: ["latin"],
  weight: "400",
  display: "swap"
});

const badges = [
  { icon: Star, title: "4.9/5", detail: "+500 avis" },
  { icon: UsersRound, title: "+2000", detail: "élèves formés" },
  { icon: WalletCards, title: "CPF", detail: "disponible" },
  { icon: CreditCard, title: "Paiement", detail: "en 4x sans frais" }
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-loden-pearl">
      <div className="absolute inset-0 soft-grid opacity-45" aria-hidden="true" />

      <div className="relative">
        <div className="absolute bottom-0 right-0 top-6 hidden w-[80%] overflow-visible xl:w-[76%] 2xl:w-[70%] lg:block" aria-hidden="true">
          <Image
            src="/loden-hero.jpg"
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

        <div className="container-pad relative z-20 grid items-center py-8 lg:min-h-[calc(100svh-8rem)] lg:py-6 lg:grid-cols-[520px_1fr]">
          <MotionReveal>
            <div className="max-w-[520px]">
              <h1
                aria-label="Passe ton permis avec LODENE"
                className="leading-none"
              >
                <span className={`${greatVibes.className} block text-[3.6rem] font-normal leading-[0.9] text-[#087f92] sm:text-[4.5rem] lg:text-[5.25rem]`}>
                  Passe ton permis
                </span>
                <span className={`${allura.className} block pl-5 text-[2.1rem] font-normal leading-[0.9] text-loden-ink sm:text-[2.4rem]`}>
                  avec
                </span>
                <span className={`${permanentMarker.className} block text-[3.4rem] font-normal leading-[0.95] tracking-[-0.04em] text-loden-ink sm:text-[4.25rem] lg:text-[4.75rem]`}>
                  LODENE
                </span>
              </h1>

              <p className="mt-4 max-w-md text-lg leading-7 text-loden-ink">
                Une formation claire, rapide et flexible, adaptée à ton rythme.
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
                  className="focus-ring inline-flex items-center justify-center gap-3 rounded-full border border-loden-500 bg-white/82 px-7 py-3.5 text-base font-semibold text-loden-ink shadow-soft backdrop-blur transition hover:bg-white"
                >
                  <PlayCircle className="h-5 w-5 text-loden-500" aria-hidden="true" />
                  Nos formations
                </Link>
              </div>

              <div className="mt-6 grid max-w-[38rem] grid-cols-2 gap-2.5 sm:grid-cols-4">
                {badges.map((badge) => {
                  const Icon = badge.icon;

                  return (
                    <div key={badge.title} className="rounded-2xl bg-white/82 p-3.5 shadow-soft backdrop-blur">
                      <Icon className="h-5 w-5 text-loden-700" aria-hidden="true" />
                      <p className="mt-2 text-lg font-semibold text-loden-ink">{badge.title}</p>
                      <p className="mt-0.5 text-sm text-loden-muted">{badge.detail}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </MotionReveal>

          <MotionReveal delay={0.1}>
            <div className="relative mt-10 min-h-[360px] lg:hidden">
              <Image
                src="/loden-hero.jpg"
                alt="Voiture école moderne LODENE avec élève et moniteur"
                fill
                priority
                sizes="100vw"
                className="object-contain object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-loden-pearl/30 via-transparent to-loden-pearl" />
            </div>
          </MotionReveal>
        </div>
      </div>
    </section>
  );
}
