"use client";

import { useRef, useState } from "react";
import { ArrowRight, RotateCcw } from "lucide-react";

// Affiche une liste d'avis paginée (pages fixes + flèches), pour éviter que la page
// s'allonge indéfiniment quand le nombre d'avis grandit. Réutilisable : on lui passe
// les cartes d'avis déjà rendues (Google ou internes) en `children`.
export function PaginatedReviews({
  children,
  pageSize = 6,
  className = ""
}: {
  children: React.ReactNode;
  pageSize?: number;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cards = (Array.isArray(children) ? children.flat() : [children]).filter(Boolean);
  const pageCount = Math.max(1, Math.ceil(cards.length / pageSize));
  const [page, setPage] = useState(0);
  const current = Math.min(page, pageCount - 1);
  const start = current * pageSize;
  const visible = cards.slice(start, start + pageSize);
  const end = Math.min(start + pageSize, cards.length);
  const isLastPage = current >= pageCount - 1;

  const goToNextPage = () => {
    setPage(isLastPage ? 0 : current + 1);
    window.requestAnimationFrame(() => {
      containerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <div ref={containerRef} className={className}>
      <div className="grid gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3">{visible}</div>
      {pageCount > 1 ? (
        <div className="mt-5 flex flex-col items-center justify-between gap-3 sm:flex-row md:mt-6">
          <p className="text-sm font-semibold text-loden-muted" aria-live="polite">
            Avis {start + 1}-{end} sur {cards.length}
          </p>
          <button
            type="button"
            onClick={goToNextPage}
            className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-full border border-loden-200 bg-white px-5 py-3 text-sm font-bold text-loden-800 shadow-soft transition hover:border-loden-300 hover:bg-loden-50 sm:w-auto"
          >
            {isLastPage ? (
              <>
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Revenir aux avis récents
              </>
            ) : (
              <>
                Voir les avis suivants
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </button>
        </div>
      ) : null}
    </div>
  );
}
