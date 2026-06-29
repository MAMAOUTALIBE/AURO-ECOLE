import type { Metadata } from "next";
import { ReviewSubmissionForm } from "@/components/ReviewSubmissionForm";
import { ReviewsGrid } from "@/components/ReviewsGrid";
import { testimonials } from "@/data/site";
import { safeJsonLd } from "@/lib/json-ld";
import { SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Avis",
  description: "Retours d'expérience des élèves de LODENE Auto-École.",
  alternates: { canonical: "/avis" }
};

export default function AvisPage() {
  // JSON-LD sans note agrégée : on n'émet d'avis structurés que s'il existe de vrais avis.
  const reviewSchema = {
    "@context": "https://schema.org",
    "@type": "DrivingSchool",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: absoluteUrl("/avis"),
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

  return (
    <main>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: safeJsonLd(reviewSchema) }}
      />
      <section className="bg-loden-pearl py-5 sm:py-12">
        <div className="container-pad grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-loden-700 sm:text-sm">Avis clients</p>
            <h1 className="mt-2 text-3xl font-semibold leading-tight text-loden-ink sm:text-5xl">Avis élèves</h1>
            <p className="mt-3 max-w-xl text-base leading-7 text-loden-muted">
              Partagez votre expérience avec LODENE ou consultez les retours déjà publiés.
            </p>
          </div>
          <ReviewSubmissionForm />
        </div>
      </section>

      <section className="bg-white py-6 sm:py-14">
        <div className="container-pad">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-loden-700 sm:text-sm">Avis publiés</p>
            <h2 className="mt-2 text-2xl font-semibold leading-tight text-loden-ink sm:text-4xl">Ce que disent les élèves</h2>
          </div>
          <ReviewsGrid />
        </div>
      </section>
    </main>
  );
}
