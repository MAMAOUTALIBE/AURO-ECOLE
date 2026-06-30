import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { ReviewSubmissionForm } from "@/components/ReviewSubmissionForm";
import { ReviewsGrid } from "@/components/ReviewsGrid";
import { ReviewCard } from "@/components/GoogleReviewsSection";
import { firstName, getGoogleReviews } from "@/lib/google-reviews";
import { safeJsonLd } from "@/lib/json-ld";
import { SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Avis",
  description: "Avis des élèves de LODENE Auto-École. Laissez votre avis en quelques secondes, directement sur le site.",
  alternates: { canonical: "/avis" }
};

export default async function AvisPage() {
  const { config, stats, reviews } = await getGoogleReviews();

  // JSON-LD : note agrégée + avis seulement s'ils sont RÉELS (issus de Google).
  const reviewSchema = {
    "@context": "https://schema.org",
    "@type": "DrivingSchool",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: absoluteUrl("/avis"),
    ...(stats && stats.totalCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: stats.rating,
            reviewCount: stats.totalCount,
            bestRating: 5
          }
        }
      : {}),
    ...(reviews.length > 0
      ? {
          review: reviews.map((review) => ({
            "@type": "Review",
            author: { "@type": "Person", name: firstName(review.authorName) },
            reviewRating: { "@type": "Rating", ratingValue: review.rating, bestRating: 5 },
            reviewBody: review.text
          }))
        }
      : {})
  };

  return (
    <main>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: safeJsonLd(reviewSchema) }}
      />
      <section className="bg-loden-pearl py-5 md:py-10">
        <div className="container-pad grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-loden-700 md:text-sm">Avis clients</p>
            <h1 className="mt-2 text-[1.85rem] font-semibold leading-tight text-loden-ink sm:text-4xl md:text-[2.8rem]">
              Donnez votre avis
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-loden-muted md:mt-3 md:text-base md:leading-7">
              Vous avez suivi une formation avec LODENE ? Partagez votre expérience en quelques secondes,
              directement ici. Votre avis sera publié après validation.
            </p>
            {config.profileUrl ? (
              <a
                href={config.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-loden-700 hover:text-loden-800"
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                Voir aussi nos avis Google
              </a>
            ) : null}
          </div>

          <ReviewSubmissionForm />
        </div>
      </section>

      <section className="bg-white py-6 md:py-10">
        <div className="container-pad">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-loden-700 md:text-sm">
              {reviews.length > 0 ? "Avis Google" : "Avis publiés"}
            </p>
            <h2 className="mt-2 text-[1.45rem] font-semibold leading-tight text-loden-ink sm:text-3xl">
              Ce que disent nos élèves
            </h2>
          </div>
          {reviews.length > 0 ? (
            <div className="mt-5 grid gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
              {reviews.map((review) => (
                <ReviewCard key={review.id || review.authorName + review.publishTime} review={review} />
              ))}
            </div>
          ) : (
            // Avis laissés par les clients sur le site (publiés après modération).
            <ReviewsGrid />
          )}
        </div>
      </section>
    </main>
  );
}
