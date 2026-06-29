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
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft sm:rounded-2xl sm:p-5">
      <div className="flex gap-1" role="img" aria-label={`${testimonial.rating} étoiles`}>
        {Array.from({ length: testimonial.rating }).map((_, index) => (
          <Star key={index} className="h-4 w-4 fill-loden-500 text-loden-500" aria-hidden="true" />
        ))}
      </div>
      <p className="mt-3 text-[15px] leading-6 text-loden-ink">“{testimonial.text}”</p>
      <div className="mt-3 border-t border-slate-200 pt-3">
        <p className="text-sm font-semibold text-loden-ink">{testimonial.name}</p>
        {testimonial.location ? <p className="text-sm text-loden-muted">{testimonial.location}</p> : null}
      </div>
    </article>
  );
}
