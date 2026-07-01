"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  const cards = (Array.isArray(children) ? children.flat() : [children]).filter(Boolean);
  const pageCount = Math.max(1, Math.ceil(cards.length / pageSize));
  const [page, setPage] = useState(0);
  const current = Math.min(page, pageCount - 1);
  const start = current * pageSize;
  const visible = cards.slice(start, start + pageSize);

  return (
    <div className={className}>
      {pageCount > 1 ? (
        <div className="mb-3 flex items-center justify-end gap-2 md:mb-4">
          <button
            type="button"
            aria-label="Avis précédents"
            onClick={() => setPage(Math.max(0, current - 1))}
            disabled={current === 0}
            className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-loden-700 shadow-soft transition hover:bg-loden-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <span className="min-w-[3rem] text-center text-sm font-semibold text-loden-muted" aria-live="polite">
            {current + 1}/{pageCount}
          </span>
          <button
            type="button"
            aria-label="Avis suivants"
            onClick={() => setPage(Math.min(pageCount - 1, current + 1))}
            disabled={current >= pageCount - 1}
            className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-loden-700 shadow-soft transition hover:bg-loden-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ) : null}
      <div className="grid gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3">{visible}</div>
    </div>
  );
}
