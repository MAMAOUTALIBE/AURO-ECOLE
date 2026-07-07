import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  Clock3,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  UserRound,
  WalletCards
} from "lucide-react";
import { HeroSection } from "@/components/HeroSection";
import { HomeFormationsCarousel } from "@/components/HomeFormationsCarousel";
import { GoogleReviewsSection } from "@/components/GoogleReviewsSection";
import { PartnersSection } from "@/components/PartnersSection";
import { MotionReveal } from "@/components/MotionReveal";
import { contactInfo } from "@/data/site";
import { getFormations } from "@/lib/catalog";
import { getPublicPartners } from "@/lib/partners-public";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = {
  title: "LODENE — Auto-école & centre de formation à Conflans",
  description:
    "Auto-école et centre de formation à Conflans-Sainte-Honorine : permis B, VTC, sécurité (SST, CACES) et formations professionnelles IA, CRM & automatisation. Financement OPCO/FAF/CPF, présentiel ou distanciel, accompagnement personnalisé.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "LODENE — Auto-école & centre de formation nouvelle génération",
    description:
      "Permis B, VTC, sécurité et formations pro (IA, CRM, automatisation) à Conflans-Sainte-Honorine. Financement OPCO/FAF/CPF, présentiel ou distanciel.",
    url: "/",
    type: "website"
  }
};

const advantages = [
  {
    icon: WalletCards,
    title: "CPF accompagné",
    text: "On vérifie ton dossier et ton financement avant l'inscription."
  },
  {
    icon: CalendarCheck,
    title: "Planning flexible",
    text: "Des créneaux adaptés à ton rythme et à tes contraintes."
  },
  {
    icon: Clock3,
    title: "Formations courtes",
    text: "Des formats rapides pour avancer sans perdre de temps."
  },
  {
    icon: UserRound,
    title: "Suivi humain",
    text: "Un conseiller t'oriente et garde ton parcours lisible."
  }
];

const priceHighlights = [
  { label: "Permis B automatique", price: 924 },
  { label: "Permis B manuel", price: 1344 },
  { label: "Formation VTC", price: 399 }
];

const mobileShortcuts = [
  {
    icon: CalendarCheck,
    title: "Passer mon permis",
    text: "Comparer auto, manuel ou accéléré.",
    href: "/formations"
  },
  {
    icon: WalletCards,
    title: "Financer ma formation",
    text: "CPF, aides ou paiement en plusieurs fois.",
    href: "/financement"
  },
  {
    icon: MessageCircle,
    title: "Parler à un conseiller",
    text: "Réponse rapide par appel ou WhatsApp.",
    href: "/contact#demande"
  }
];

function whatsappHref() {
  if (contactInfo.whatsapp) return `https://wa.me/${contactInfo.whatsapp}`;
  const digits = contactInfo.phone.replace(/\D/g, "");
  const international = digits.startsWith("0") ? `33${digits.slice(1)}` : digits;
  return `https://wa.me/${international}`;
}

export default async function HomePage() {
  const [formations, partners] = await Promise.all([getFormations(), getPublicPartners()]);
  return (
    <main>
      <HeroSection />

      <section className="bg-white py-5 md:hidden">
        <div className="container-pad">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-loden-700">Je veux...</p>
          <div className="mt-3 grid gap-3">
            {mobileShortcuts.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="focus-ring flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-loden-pearl p-4 shadow-soft"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-loden-700 shadow-soft">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-bold leading-tight text-loden-ink">{item.title}</span>
                      <span className="mt-1 block text-sm leading-5 text-loden-muted">{item.text}</span>
                    </span>
                  </span>
                  <ArrowRight className="h-5 w-5 shrink-0 text-loden-700" aria-hidden="true" />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section id="formations" className="bg-white py-7 md:py-10">
        <div className="container-pad">
          <HomeFormationsCarousel formations={formations} />
        </div>
      </section>

      <section className="bg-loden-pearl py-7 md:py-10">
        <div className="container-pad">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-loden-700 sm:text-sm">Pourquoi choisir LODENE ?</p>
            <h2 className="mt-2 text-[1.45rem] font-semibold leading-tight text-loden-ink sm:text-3xl lg:text-4xl">
              Un parcours simple, encadré et orienté résultat
            </h2>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-4">
            {advantages.map((advantage, index) => {
              const Icon = advantage.icon;
              return (
                <MotionReveal key={advantage.title} delay={index * 0.04}>
                  <article className="h-full rounded-xl border border-slate-200 bg-white p-4 shadow-soft md:rounded-2xl md:p-5">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-loden-50 text-loden-700 md:h-11 md:w-11 md:rounded-2xl">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h3 className="mt-3 text-lg font-semibold text-loden-ink md:mt-4">{advantage.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-loden-muted">{advantage.text}</p>
                  </article>
                </MotionReveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white py-7 md:py-10">
        <div className="container-pad">
          <div className="rounded-xl bg-loden-900 p-4 text-white shadow-premium md:rounded-2xl md:p-6 lg:flex lg:items-center lg:justify-between lg:gap-8">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase text-loden-100">Diagnostic</p>
              <h2 className="mt-2 text-xl font-semibold leading-tight md:text-3xl">Pas sûr de la bonne formation ?</h2>
              <p className="mt-2 text-sm leading-6 text-white/80 md:text-base md:leading-7">
                Réponds à quelques questions, on t&apos;oriente vers le bon parcours.
              </p>
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row lg:mt-0">
              <Link
                href="/contact"
                className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 font-semibold text-loden-ink shadow-soft transition hover:bg-loden-50 sm:w-auto"
              >
                Demander mon diagnostic
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Link>
              <a
                href={whatsappHref()}
                className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/30 px-6 py-3.5 font-semibold text-white transition hover:bg-white/10 sm:w-auto"
              >
                <MessageCircle className="h-5 w-5" aria-hidden="true" />
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white pb-7 md:pb-10">
        <div className="container-pad">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-loden-700 sm:text-sm">Tarifs de départ</p>
              <h2 className="mt-2 text-[1.45rem] font-semibold leading-tight text-loden-ink sm:text-3xl lg:text-4xl">
                Trois repères pour décider vite
              </h2>
            </div>
            <Link
              href="/tarifs"
              className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-loden-ink shadow-soft transition hover:border-loden-200 hover:text-loden-700 sm:w-auto"
            >
              Voir tous les tarifs
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3 md:gap-4">
            {priceHighlights.map((item, index) => (
              <MotionReveal key={item.label} delay={index * 0.04}>
                <article className="rounded-xl border border-slate-200 bg-loden-pearl p-4 shadow-soft md:rounded-2xl md:p-5">
                  <p className="text-sm font-semibold text-loden-muted">{item.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-loden-ink md:mt-3 md:text-3xl">dès {formatCurrency(item.price)}</p>
                </article>
              </MotionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Avis clients — vrais avis Google synchronisés (note, étoiles, prénom, commentaire). */}
      <GoogleReviewsSection />

      {/* Partenaires opt-in (« Ils nous font confiance ») — piloté depuis /admin/partenaires. */}
      <PartnersSection partners={partners} />

      <section className="bg-loden-pearl py-7 md:py-10">
        <div className="container-pad">
          <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-soft md:gap-6 md:rounded-2xl md:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-loden-700 sm:text-sm">Agence LODENE</p>
              <h2 className="mt-2 text-[1.45rem] font-semibold leading-tight text-loden-ink md:text-3xl">
                Conflans-Sainte-Honorine
              </h2>
              <div className="mt-4 grid gap-3 text-sm leading-6 text-loden-muted sm:grid-cols-2 md:mt-5">
                <p className="flex gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-loden-600" aria-hidden="true" />
                  <span>{contactInfo.address}</span>
                </p>
                <p className="flex gap-3">
                  <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-loden-600" aria-hidden="true" />
                  <span>Bureau mar-sam. Conduite 7j/7 sur réservation.</span>
                </p>
                <a className="flex gap-3 font-semibold text-loden-ink hover:text-loden-700" href={`tel:${contactInfo.phone.replaceAll(" ", "")}`}>
                  <Phone className="mt-0.5 h-5 w-5 shrink-0 text-loden-600" aria-hidden="true" />
                  {contactInfo.phone}
                </a>
                <a className="flex gap-3 font-semibold text-loden-ink hover:text-loden-700" href={`mailto:${contactInfo.email}`}>
                  <Mail className="mt-0.5 h-5 w-5 shrink-0 text-loden-600" aria-hidden="true" />
                  {contactInfo.email}
                </a>
              </div>
            </div>
            <Link
              href="/contact"
              className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-full bg-loden-700 px-6 py-3.5 font-semibold text-white shadow-soft transition hover:bg-loden-800 sm:w-auto"
            >
              Nous contacter
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
