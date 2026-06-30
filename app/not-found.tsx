import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Compass, Home } from "lucide-react";

export const metadata: Metadata = {
  title: "Page introuvable",
  description: "La page que vous cherchez n'existe pas ou a été déplacée.",
  robots: { index: false }
};

export default function NotFound() {
  return (
    <main className="bg-loden-pearl">
      <section className="container-pad flex min-h-[58vh] flex-col items-center justify-center py-12 text-center md:py-12 xl:py-16">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-loden-700 text-white shadow-soft sm:h-16 sm:w-16">
          <Compass className="h-7 w-7 sm:h-8 sm:w-8" aria-hidden="true" />
        </span>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-loden-700 sm:mt-8 sm:text-sm sm:tracking-[0.18em]">Erreur 404</p>
        <h1 className="mt-3 text-2xl font-semibold leading-tight text-loden-ink sm:mt-4 sm:text-5xl">Cette page a pris une autre route</h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-loden-muted sm:mt-5 sm:text-lg sm:leading-8">
          La page que vous cherchez n&apos;existe pas ou a été déplacée. Reprenons le volant ensemble.
        </p>
        <div className="mt-7 flex w-full max-w-sm flex-col gap-3 sm:mt-9 sm:max-w-none sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-loden-700 px-7 py-3.5 font-semibold text-white shadow-soft transition hover:bg-loden-800 sm:py-4"
          >
            <Home className="h-5 w-5" aria-hidden="true" />
            Retour à l&apos;accueil
          </Link>
          <Link
            href="/formations"
            className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-loden-500 bg-white px-7 py-3.5 font-semibold text-loden-ink shadow-soft transition hover:bg-loden-50 sm:py-4"
          >
            Voir les formations
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}
