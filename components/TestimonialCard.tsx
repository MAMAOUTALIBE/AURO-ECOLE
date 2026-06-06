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
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex gap-1" role="img" aria-label={`${testimonial.rating} étoiles`}>
        {Array.from({ length: testimonial.rating }).map((_, index) => (
          <Star key={index} className="h-5 w-5 fill-loden-500 text-loden-500" aria-hidden="true" />
        ))}
      </div>
      <p className="mt-5 text-base leading-7 text-loden-ink">“{testimonial.text}”</p>
      <div className="mt-6 border-t border-slate-200 pt-4">
        <p className="font-semibold text-loden-ink">{testimonial.name}</p>
        <p className="text-sm text-loden-muted">{testimonial.location}</p>
      </div>
    </article>
  );
}
