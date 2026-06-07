import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MessageSquareText, ShieldCheck, Star, TrendingUp } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { ReviewsGrid } from "@/components/ReviewsGrid";
import { SectionHeader } from "@/components/SectionHeader";
import { testimonials } from "@/data/site";
import { safeJsonLd } from "@/lib/json-ld";

export const metadata: Metadata = {
  title: "Avis",
  description: "Avis Google, témoignages élèves et indicateurs de satisfaction LODEN Auto-École."
};

export default function AvisPage() {
  const reviewSchema = {
    "@context": "https://schema.org",
    "@type": "DrivingSchool",
    name: "LODEN Auto-École",
    url: "https://loden-autoecole.fr/avis",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      bestRating: "5",
      reviewCount: "128"
    },
    review: testimonials.map((testimonial) => ({
      "@type": "Review",
      author: {
        "@type": "Person",
        name: testimonial.name
      },
      reviewRating: {
        "@type": "Rating",
        ratingValue: testimonial.rating,
        bestRating: 5
      },
      reviewBody: testimonial.text
    }))
  };

  const qualitySignals = [
    {
      icon: ShieldCheck,
      title: "Avis modérés",
      text: "Les retours élèves sont centralisés dans le CRM pour éviter les doublons et garder une lecture fiable."
    },
    {
      icon: TrendingUp,
      title: "Qualité suivie",
      text: "Les notes, motifs de satisfaction et points faibles alimentent les décisions pédagogiques."
    },
    {
      icon: MessageSquareText,
      title: "Réponse humaine",
      text: "Une remarque ou une difficulté déclenche un échange avec l'équipe plutôt qu'une réponse automatique."
    }
  ];

  return (
    <main>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: safeJsonLd(reviewSchema) }}
      />
      <PageHero
        eyebrow="Avis clients"
        title="Des élèves accompagnés avec sérieux jusqu'à l'examen"
        text="Avis Google, retours d'expérience et satisfaction suivent la même exigence : transparence et progression."
      />
      <section className="bg-white py-14 sm:py-20">
        <div className="container-pad">
          <div className="grid gap-5 md:grid-cols-3">
            {[
              ["4,9/5", "Note Google moyenne"],
              ["98 %", "Réussite sur parcours complet"],
              ["92 %", "Élèves recommandent LODEN"]
            ].map(([value, label]) => (
              <div key={label} className="rounded-3xl border border-slate-200 bg-loden-pearl p-6 text-center shadow-soft">
                <div className="mx-auto flex w-max gap-1 text-loden-500">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className="h-4 w-4 fill-loden-500" />
                  ))}
                </div>
                <p className="mt-4 text-4xl font-semibold text-loden-ink">{value}</p>
                <p className="mt-2 text-sm text-loden-muted">{label}</p>
              </div>
            ))}
          </div>
          <SectionHeader
            className="mt-14"
            eyebrow="Témoignages"
            title="Ils ont passé leur permis avec LODEN"
            text="Des avis publiés, prêts pour une modération CRM et une future synchronisation Google Reviews."
            align="center"
          />
          <ReviewsGrid />
        </div>
      </section>
      <section className="bg-loden-800 py-14 text-white sm:py-20">
        <div className="container-pad grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-white/75">Transparence</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
              Les avis servent aussi à améliorer la formation
            </h2>
            <p className="mt-4 text-base leading-7 text-white/75">
              LODEN ne traite pas les avis comme une vitrine figée. Les retours élèves nourrissent le suivi qualité,
              les ajustements de planning et l&apos;accompagnement des moniteurs.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/contact#demande"
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-4 font-semibold text-loden-800 transition hover:bg-loden-pearl"
              >
                Parler à l&apos;équipe
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/formations"
                className="focus-ring inline-flex items-center justify-center rounded-full border border-white/25 px-6 py-4 font-semibold text-white transition hover:bg-white/10"
              >
                Voir les formations
              </Link>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-1">
            {qualitySignals.map((signal) => {
              const Icon = signal.icon;
              return (
                <article key={signal.title} className="rounded-3xl border border-white/15 bg-white/10 p-6">
                  <Icon className="h-7 w-7 text-loden-200" />
                  <h3 className="mt-4 text-xl font-semibold">{signal.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/75">{signal.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
