import type { Metadata } from "next";
import { ExternalLink, Star } from "lucide-react";
import { ReviewsGrid } from "@/components/ReviewsGrid";
import { PaginatedReviews } from "@/components/PaginatedReviews";
import { ReviewCard } from "@/components/GoogleReviewsSection";
import { firstName, getGoogleReviews } from "@/lib/google-reviews";
import { safeJsonLd } from "@/lib/json-ld";
import { SITE_NAME, SITE_URL, absoluteUrl, buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Avis",
  description: "Avis des élèves de LODENE Auto-École. Laissez votre avis en quelques secondes, directement sur le site.",
  path: "/avis"
});

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
        <div className="container-pad mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-loden-700 md:text-sm">Avis clients</p>
          <h1 className="mt-2 text-[1.85rem] font-semibold leading-tight text-loden-ink sm:text-4xl md:text-[2.8rem]">
            Votre avis compte
          </h1>
          {config.reviewUrl ? (
            <>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-loden-muted md:mt-3 md:text-base md:leading-7">
                Vous avez suivi une formation avec LODENE ? Publiez votre avis sur Google en quelques
                secondes : c&apos;est le plus utile pour les futurs élèves — et il s&apos;affiche ensuite ici.
              </p>
              <div className="mt-5 flex flex-col items-center gap-3">
                <a
                  href={config.reviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-loden-700 px-6 py-3.5 font-semibold text-white shadow-soft transition hover:bg-loden-800"
                >
                  <Star className="h-5 w-5" aria-hidden="true" />
                  Laisser un avis sur Google
                </a>
                {config.profileUrl ? (
                  <a
                    href={config.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="focus-ring inline-flex items-center gap-1.5 rounded text-sm font-semibold text-loden-700 hover:text-loden-900"
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    Voir tous nos avis Google
                  </a>
                ) : null}
              </div>
            </>
          ) : (
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-loden-muted md:mt-3 md:text-base md:leading-7">
              Vous avez suivi une formation avec LODENE ? Merci de votre confiance — vos avis nous aident
              à accompagner les futurs élèves.
            </p>
          )}
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
            <PaginatedReviews className="mt-5" pageSize={6}>
              {reviews.map((review) => (
                <ReviewCard key={review.id || review.authorName + review.publishTime} review={review} />
              ))}
            </PaginatedReviews>
          ) : (
            // Avis laissés par les clients sur le site (publiés après modération).
            <ReviewsGrid />
          )}
        </div>
      </section>
    </main>
  );
}
