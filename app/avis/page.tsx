import type { Metadata } from "next";
import { ExternalLink, PenLine } from "lucide-react";
import { ReviewsGrid } from "@/components/ReviewsGrid";
import { ReviewCard, StarRating } from "@/components/GoogleReviewsSection";
import { firstName, getGoogleReviews } from "@/lib/google-reviews";
import { safeJsonLd } from "@/lib/json-ld";
import { SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Avis",
  description: "Les avis Google des élèves de LODENE Auto-École. Laissez le vôtre directement sur Google.",
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

  const averageLabel = stats ? stats.rating.toFixed(1).replace(".", ",") : null;

  return (
    <main>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: safeJsonLd(reviewSchema) }}
      />
      <section className="bg-loden-pearl py-5 md:py-10">
        <div className="container-pad grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-loden-700 md:text-sm">Avis clients</p>
            <h1 className="mt-2 text-[1.85rem] font-semibold leading-tight text-loden-ink sm:text-4xl md:text-[2.8rem]">
              Les avis de nos élèves
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-loden-muted md:mt-3 md:text-base md:leading-7">
              Tous nos avis proviennent de Google. Vous avez passé votre permis avec LODENE ? Partagez votre
              expérience en quelques secondes, directement sur notre fiche Google.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              {config.reviewUrl ? (
                <a
                  href={config.reviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-full bg-loden-700 px-6 py-3.5 font-semibold text-white shadow-soft transition hover:bg-loden-800 sm:w-auto"
                >
                  <PenLine className="h-5 w-5" aria-hidden="true" />
                  Laisser un avis sur Google
                </a>
              ) : null}
              {config.profileUrl ? (
                <a
                  href={config.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3.5 font-semibold text-loden-ink shadow-soft transition hover:border-loden-200 hover:text-loden-700 sm:w-auto"
                >
                  <ExternalLink className="h-5 w-5" aria-hidden="true" />
                  Voir tous les avis Google
                </a>
              ) : null}
            </div>
          </div>

          {stats ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-soft">
              <p className="text-5xl font-bold leading-none text-loden-ink">{averageLabel}</p>
              <div className="mt-3 flex justify-center">
                <StarRating rating={stats.rating} size="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm text-loden-muted">
                {stats.totalCount > 0 ? `Basé sur ${stats.totalCount} avis Google` : "Note Google"}
              </p>
            </div>
          ) : null}
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
            // Aucun avis Google synchronisé : repli sur les avis réels curés depuis le CRM.
            <ReviewsGrid />
          )}
        </div>
      </section>
    </main>
  );
}
