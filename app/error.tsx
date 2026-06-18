"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Home, RotateCcw } from "lucide-react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Hook d'observabilité : brancher ici un service (Sentry, etc.) en production.
    console.error(error);
  }, [error]);

  return (
    <main className="bg-loden-pearl">
      <section className="container-pad flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-loden-700">Une erreur est survenue</p>
        <h1 className="mt-4 text-4xl font-semibold text-loden-ink sm:text-5xl">Oups, un imprévu sur la route</h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-loden-muted">
          Une erreur inattendue s&apos;est produite. Vous pouvez réessayer ou revenir à l&apos;accueil.
        </p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-loden-700 px-7 py-4 font-semibold text-white shadow-soft transition hover:bg-loden-800"
          >
            <RotateCcw className="h-5 w-5" aria-hidden="true" />
            Réessayer
          </button>
          <Link
            href="/"
            className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-loden-500 bg-white px-7 py-4 font-semibold text-loden-ink shadow-soft transition hover:bg-loden-50"
          >
            <Home className="h-5 w-5" aria-hidden="true" />
            Retour à l&apos;accueil
          </Link>
        </div>
      </section>
    </main>
  );
}
