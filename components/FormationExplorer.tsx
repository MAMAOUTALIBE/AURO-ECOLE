"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { formations, type Formation } from "@/data/site";
import { FormationCard } from "@/components/FormationCard";
import { mapApiFormation } from "@/lib/catalog-mappers";

const filters = ["Manuel", "Automatique", "Accéléré", "CPF", "Débutant", "Remise à niveau"];

export function FormationExplorer() {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("Toutes");
  const [remoteFormations, setRemoteFormations] = useState<Formation[] | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadFormations() {
      try {
        const response = await fetch("/api/formations", { signal: controller.signal });
        if (!response.ok) return;

        const payload = (await response.json()) as { data?: Parameters<typeof mapApiFormation>[0][] };
        const nextFormations = (payload.data ?? []).map(mapApiFormation);
        if (nextFormations.length > 0) setRemoteFormations(nextFormations);
      } catch {
        if (!controller.signal.aborted) setRemoteFormations(null);
      }
    }

    loadFormations();

    return () => controller.abort();
  }, []);

  const sourceFormations = remoteFormations ?? formations;

  const visibleFormations = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return sourceFormations.filter((formation) => {
      const matchesQuery =
        !normalized ||
        `${formation.title} ${formation.description} ${formation.tags.join(" ")}`.toLowerCase().includes(normalized);
      const matchesFilter =
        activeFilter === "Toutes" ||
        formation.tags.includes(activeFilter) ||
        formation.mode === activeFilter ||
        (activeFilter === "CPF" && formation.cpf);
      return matchesQuery && matchesFilter;
    });
  }, [activeFilter, query, sourceFormations]);

  return (
    <section className="bg-white py-14 sm:py-20">
      <div className="container-pad">
        <div className="rounded-[1.75rem] border border-slate-200 bg-loden-pearl p-4 sm:p-5">
          <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-soft">
            <Search className="h-5 w-5 text-loden-500" aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-loden-muted"
              placeholder="Rechercher une formation, un financement, un objectif..."
              aria-label="Recherche avancée des formations"
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {["Toutes", ...filters].map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`focus-ring rounded-full border px-4 py-2 text-sm font-semibold transition ${activeFilter === filter ? "border-loden-700 bg-loden-700 text-white" : "border-slate-200 bg-white text-loden-muted hover:border-loden-200"}`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visibleFormations.map((formation) => (
            <FormationCard key={formation.slug} formation={formation} />
          ))}
        </div>
      </div>
    </section>
  );
}
