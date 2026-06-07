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
      <section className="container-pad flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-loden-700 text-white shadow-soft">
          <Compass className="h-8 w-8" aria-hidden="true" />
        </span>
        <p className="mt-8 text-sm font-semibold uppercase tracking-[0.18em] text-loden-700">Erreur 404</p>
        <h1 className="mt-4 text-4xl font-semibold text-loden-ink sm:text-5xl">Cette page a pris une autre route</h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-loden-muted">
          La page que vous cherchez n&apos;existe pas ou a été déplacée. Reprenons le volant ensemble.
        </p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-loden-700 px-7 py-4 font-semibold text-white shadow-soft transition hover:bg-loden-800"
          >
            <Home className="h-5 w-5" aria-hidden="true" />
            Retour à l&apos;accueil
          </Link>
          <Link
            href="/formations"
            className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-loden-500 bg-white px-7 py-4 font-semibold text-loden-ink shadow-soft transition hover:bg-loden-50"
          >
            Voir les formations
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}
