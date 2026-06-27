import { Star } from "lucide-react";

export function TestimonialCard({
  testimonial
}: {
  testimonial: {
    name: string;
    location: string;
    rating: number;
    text: string;
  };
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft sm:rounded-3xl sm:p-6">
      <div className="flex gap-1" role="img" aria-label={`${testimonial.rating} étoiles`}>
        {Array.from({ length: testimonial.rating }).map((_, index) => (
          <Star key={index} className="h-4 w-4 fill-loden-500 text-loden-500 sm:h-5 sm:w-5" aria-hidden="true" />
        ))}
      </div>
      <p className="mt-4 text-sm leading-6 text-loden-ink sm:mt-5 sm:text-base sm:leading-7">“{testimonial.text}”</p>
      <div className="mt-4 border-t border-slate-200 pt-3 sm:mt-6 sm:pt-4">
        <p className="font-semibold text-loden-ink">{testimonial.name}</p>
        <p className="text-sm text-loden-muted">{testimonial.location}</p>
      </div>
    </article>
  );
}
