import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MessageSquareText, ShieldCheck, TrendingUp } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { ReviewsGrid } from "@/components/ReviewsGrid";
import { SectionHeader } from "@/components/SectionHeader";
import { testimonials } from "@/data/site";
import { safeJsonLd } from "@/lib/json-ld";

export const metadata: Metadata = {
  title: "Avis",
  description: "Retours d'expérience des élèves de LODENE Auto-École."
};

export default function AvisPage() {
  // JSON-LD sans note agrégée : on n'émet d'avis structurés que s'il existe de vrais avis.
  const reviewSchema = {
    "@context": "https://schema.org",
    "@type": "DrivingSchool",
    name: "LODENE Auto-École",
    url: "https://loden-autoecole.fr/avis",
    ...(testimonials.length > 0
      ? {
          review: testimonials.map((testimonial) => ({
            "@type": "Review",
            author: { "@type": "Person", name: testimonial.name },
            reviewRating: { "@type": "Rating", ratingValue: testimonial.rating, bestRating: 5 },
            reviewBody: testimonial.text
          }))
        }
      : {})
  };

  const qualitySignals = [
    {
      icon: ShieldCheck,
      title: "Aucun avis inventé",
      text: "Nous n'affichons que de vrais retours d'élèves. Tant qu'aucun avis n'est publié, cette page reste sobre."
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
        title="Les retours de nos élèves"
        text="Cette page présentera les avis vérifiés des élèves de LODENE. Nous ne publions aucun témoignage fictif."
      />
      <section className="bg-white py-14 sm:py-20">
        <div className="container-pad">
          <SectionHeader
            eyebrow="Témoignages"
            title="Avis des élèves LODENE"
            text="Les avis réels seront publiés ici au fur et à mesure des retours d'élèves."
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
              LODENE ne traite pas les avis comme une vitrine figée. Les retours élèves nourrissent le suivi qualité,
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
