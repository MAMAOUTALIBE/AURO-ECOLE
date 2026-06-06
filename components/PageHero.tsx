import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function PageHero({
  eyebrow,
  title,
  text,
  cta = "Démarrer mon inscription",
  ctaHref = "/contact"
}: {
  eyebrow: string;
  title: string;
  text: string;
  cta?: string;
  ctaHref?: string;
}) {
  return (
    <section className="bg-loden-pearl py-14 sm:py-20">
      <div className="container-pad">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-loden-700">{eyebrow}</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-loden-ink sm:text-6xl">{title}</h1>
          <p className="mt-5 text-lg leading-8 text-loden-muted">{text}</p>
          <Link
            href={ctaHref}
            className="focus-ring mt-8 inline-flex items-center gap-2 rounded-full bg-loden-700 px-6 py-4 font-semibold text-white shadow-soft transition hover:bg-loden-800"
          >
            {cta}
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
