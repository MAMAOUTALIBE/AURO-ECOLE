"use client";

import { useEffect, useState } from "react";
import { testimonials, type Testimonial } from "@/data/site";
import { mapApiReview } from "@/lib/social-mappers";
import { TestimonialCard } from "@/components/TestimonialCard";

// Avis réels uniquement (plus de duplication artificielle de la liste).
const fallbackTestimonials = testimonials;

export function ReviewsGrid() {
  const [remoteReviews, setRemoteReviews] = useState<Testimonial[] | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadReviews() {
      try {
        const response = await fetch("/api/reviews", { signal: controller.signal });
        if (!response.ok) return;

        const payload = (await response.json()) as { data?: Parameters<typeof mapApiReview>[0][] };
        const nextReviews = (payload.data ?? []).map(mapApiReview);
        if (nextReviews.length > 0) setRemoteReviews(nextReviews);
      } catch {
        if (!controller.signal.aborted) setRemoteReviews(null);
      }
    }

    loadReviews();

    return () => controller.abort();
  }, []);

  const reviews = remoteReviews ?? fallbackTestimonials;

  return (
    <div className="mt-9 grid gap-5 md:grid-cols-3">
      {reviews.map((testimonial, index) => (
        <TestimonialCard key={`${testimonial.name}-${index}`} testimonial={testimonial} />
      ))}
    </div>
  );
}
