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
    <section className="bg-loden-pearl py-6 md:py-10 xl:py-14">
      <div className="container-pad">
        <div className="max-w-2xl md:max-w-3xl">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-loden-700 sm:text-xs md:text-sm md:tracking-[0.14em]">{eyebrow}</p>
          <h1 className="mt-2 text-[1.85rem] font-semibold leading-tight text-loden-ink sm:text-4xl md:mt-3 md:text-[2.8rem] xl:text-5xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-loden-muted md:mt-4 md:text-base md:leading-7 xl:text-lg xl:leading-8">{text}</p>
          <Link
            href={ctaHref}
            className="focus-ring mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-loden-700 px-6 py-3.5 font-semibold text-white shadow-soft transition hover:bg-loden-800 sm:w-auto md:mt-6 md:py-4"
          >
            {cta}
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
