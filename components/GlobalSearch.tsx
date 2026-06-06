"use client";

import Link from "next/link";
import { Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { searchItems } from "@/data/site";

type SearchItem = {
  title: string;
  category: string;
  href: string;
  description: string;
};

const categoryLabels: Record<string, string> = {
  formation: "Formation",
  tarif: "Tarif",
  moniteur: "Moniteur",
  faq: "FAQ",
  point_rdv: "Point de rendez-vous",
  page: "Page"
};

function normalizeApiResult(item: SearchItem): SearchItem {
  return {
    title: item.title,
    category: categoryLabels[item.category] ?? item.category,
    href: item.href,
    description: item.description
  };
}

export function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [remoteResults, setRemoteResults] = useState<SearchItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setQuery("");
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const localResults = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return searchItems.slice(0, 6);

    return searchItems
      .filter((item) =>
        `${item.title} ${item.category} ${item.description}`.toLowerCase().includes(normalized)
      )
      .slice(0, 8);
  }, [query]);

  useEffect(() => {
    const normalized = query.trim();

    if (!normalized) {
      setRemoteResults(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);

      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(normalized)}`, {
          signal: controller.signal
        });

        if (!response.ok) throw new Error("Search request failed");

        const payload = (await response.json()) as { data?: SearchItem[] };
        setRemoteResults((payload.data ?? []).map(normalizeApiResult));
      } catch {
        if (!controller.signal.aborted) {
          setRemoteResults(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 180);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const results = remoteResults ?? localResults;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-loden-ink/25 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Recherche globale">
      <div className="mx-auto mt-10 w-full max-w-3xl overflow-hidden rounded-[1.75rem] bg-white shadow-premium">
        <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
          <Search className="h-5 w-5 text-loden-500" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-base text-loden-ink outline-none placeholder:text-loden-muted"
            placeholder="Rechercher une formation, un tarif, un point de rendez-vous..."
            aria-label="Recherche"
          />
          <button
            type="button"
            onClick={onClose}
            className="focus-ring rounded-full p-2 text-loden-muted hover:bg-loden-50 hover:text-loden-800"
            aria-label="Fermer la recherche"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-3">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.14em] text-loden-muted">
            {loading ? "Recherche en cours" : "Suggestions instantanées"}
          </p>
          <div className="grid gap-2">
            {results.length > 0 ? (
              results.map((item) => (
                <Link
                  key={`${item.category}-${item.title}`}
                  href={item.href}
                  onClick={onClose}
                  className="focus-ring rounded-2xl border border-transparent p-4 transition hover:border-loden-100 hover:bg-loden-50"
                >
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-loden-700">
                    {item.category}
                  </span>
                  <span className="mt-1 block text-base font-semibold text-loden-ink">{item.title}</span>
                  <span className="mt-1 block text-sm leading-6 text-loden-muted">{item.description}</span>
                </Link>
              ))
            ) : (
              <div className="rounded-2xl bg-loden-fog p-6 text-sm text-loden-muted">
                Aucun résultat. Essaie “CPF”, “automatique” ou “accéléré”.
              </div>
            )}
          </div>
        </div>
      </div>
      <button className="absolute inset-0 -z-10 cursor-default" type="button" aria-label="Fermer" onClick={onClose} />
    </div>
  );
}
