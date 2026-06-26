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
    <section className="bg-loden-pearl py-10 md:py-14 xl:py-20">
      <div className="container-pad">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-loden-700 sm:text-sm">{eyebrow}</p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight text-loden-ink md:mt-4 md:text-5xl xl:text-6xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-loden-muted md:mt-5 md:text-lg md:leading-8">{text}</p>
          <Link
            href={ctaHref}
            className="focus-ring mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-loden-700 px-6 py-3.5 font-semibold text-white shadow-soft transition hover:bg-loden-800 sm:w-auto md:mt-8 md:py-4"
          >
            {cta}
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
