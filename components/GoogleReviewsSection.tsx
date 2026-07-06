import { ExternalLink, PenLine, Star } from "lucide-react";
import { TestimonialCard } from "@/components/TestimonialCard";
import { PaginatedReviews } from "@/components/PaginatedReviews";
import { firstName, getGoogleReviews, getPublishedInternalReviews, type GoogleReviewItem } from "@/lib/google-reviews";

// Étoiles avec remplissage partiel (ex. 4,7/5). Deux rangées superposées :
// une grise (fond) et une dorée rognée à la largeur correspondant à la note.
export function StarRating({ rating, size = "h-4 w-4" }: { rating: number; size?: string }) {
  const pct = Math.max(0, Math.min(100, (rating / 5) * 100));
  return (
    <span className="relative inline-flex" role="img" aria-label={`${rating.toFixed(1).replace(".", ",")} sur 5`}>
      <span className="flex gap-0.5 text-slate-300">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star key={index} className={`${size} fill-current`} aria-hidden="true" />
        ))}
      </span>
      <span className="absolute inset-0 flex gap-0.5 overflow-hidden text-amber-400" style={{ width: `${pct}%` }}>
        {Array.from({ length: 5 }).map((_, index) => (
          <Star key={index} className={`${size} shrink-0 fill-current`} aria-hidden="true" />
        ))}
      </span>
    </span>
  );
}

function Avatar({ name }: { name: string }) {
  const initial = (name?.trim()?.[0] ?? "?").toUpperCase();
  return (
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-loden-100 text-sm font-bold text-loden-700">
      {initial}
    </span>
  );
}

export function ReviewCard({ review }: { review: GoogleReviewItem }) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex items-center gap-3">
        <Avatar name={review.authorName} />
        <div className="min-w-0">
          <p className="truncate font-semibold text-loden-ink">{firstName(review.authorName)}</p>
          <div className="mt-0.5 flex items-center gap-2">
            <StarRating rating={review.rating} size="h-3.5 w-3.5" />
            {review.relativeTime ? <span className="text-xs text-loden-muted">{review.relativeTime}</span> : null}
          </div>
        </div>
      </div>
      <p className="mt-3 line-clamp-5 text-[15px] leading-6 text-loden-ink">“{review.text}”</p>
      <p className="mt-auto pt-3 text-xs font-medium text-loden-muted">Avis publié sur Google</p>
    </article>
  );
}

/**
 * Section « Avis clients » de la page d'accueil. Composant serveur : lit les vrais
 * avis Google (note moyenne, nombre, jusqu'à 5 avis) via le backend. Affiche les
 * deux boutons officiels (laisser un avis / voir sur Google). N'affiche jamais de
 * faux avis : sans données réelles ni liens, la section ne s'affiche pas.
 */
export async function GoogleReviewsSection() {
  const { config, stats, reviews } = await getGoogleReviews();

  if (!config.enabled || !config.showOnHomepage) return null;

  // Source d'affichage : avis Google si synchronisés, sinon repli sur les avis
  // internes publiés (laissés par les clients sur le site, validés en modération).
  const usingGoogle = reviews.length > 0;
  const internal = usingGoogle ? [] : await getPublishedInternalReviews();

  const displayStats = stats
    ? { rating: stats.rating, totalCount: stats.totalCount, google: true }
    : internal.length > 0
      ? {
          rating: internal.reduce((sum, t) => sum + t.rating, 0) / internal.length,
          totalCount: internal.length,
          google: false
        }
      : null;

  // Rien à montrer (ni avis, ni note, ni liens) → on n'affiche pas une section vide.
  const hasCards = usingGoogle || internal.length > 0;
  const hasAnything = hasCards || Boolean(displayStats) || Boolean(config.reviewUrl) || Boolean(config.profileUrl);
  if (!hasAnything) return null;

  const averageLabel = displayStats ? displayStats.rating.toFixed(1).replace(".", ",") : null;
  const countLabel = displayStats
    ? displayStats.google
      ? displayStats.totalCount > 0
        ? `${displayStats.totalCount} avis sur Google`
        : "Avis Google"
      : `${displayStats.totalCount} avis clients`
    : null;

  return (
    <section className="bg-white py-7 md:py-10">
      <div className="container-pad">
        <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-loden-pearl/40 p-5 shadow-soft md:p-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-loden-700 sm:text-sm">Avis clients</p>
            <h2 className="mt-2 text-[1.45rem] font-semibold leading-tight text-loden-ink sm:text-3xl lg:text-4xl">
              {config.sectionTitle}
            </h2>
            {config.sectionSubtitle ? (
              <p className="mt-2 text-sm leading-6 text-loden-muted md:text-base">{config.sectionSubtitle}</p>
            ) : null}
          </div>

          {displayStats ? (
            <div className="flex shrink-0 items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-soft">
              <span className="text-4xl font-bold leading-none text-loden-ink">{averageLabel}</span>
              <div>
                <StarRating rating={displayStats.rating} size="h-5 w-5" />
                <p className="mt-1 text-sm text-loden-muted">{countLabel}</p>
              </div>
            </div>
          ) : null}
        </div>

        {usingGoogle ? (
          <PaginatedReviews className="mt-5" pageSize={6}>
            {reviews.map((review) => (
              <ReviewCard key={review.id || review.authorName + review.publishTime} review={review} />
            ))}
          </PaginatedReviews>
        ) : internal.length > 0 ? (
          <PaginatedReviews className="mt-5" pageSize={6}>
            {internal.map((testimonial, index) => (
              <TestimonialCard key={`${testimonial.name}-${index}`} testimonial={testimonial} />
            ))}
          </PaginatedReviews>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          {config.reviewUrl ? (
            <a
              href={config.reviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-full bg-loden-700 px-6 py-3.5 font-semibold text-white shadow-soft transition hover:bg-loden-800 sm:w-auto"
            >
              <PenLine className="h-5 w-5" aria-hidden="true" />
              Laisser un avis
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
    </section>
  );
}
