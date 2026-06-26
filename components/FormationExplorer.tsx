"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { formations, productLineLabels, type Formation, type ProductLine } from "@/data/site";
import { FormationCard } from "@/components/FormationCard";
import { mapApiFormation } from "@/lib/catalog-mappers";

const filters = ["Manuel", "Automatique", "Accéléré", "CPF", "Débutant", "Remise à niveau"];

const poles: { key: "ALL" | ProductLine; label: string }[] = [
  { key: "ALL", label: "Tous les pôles" },
  { key: "AUTO_ECOLE", label: productLineLabels.AUTO_ECOLE },
  { key: "VTC", label: productLineLabels.VTC },
  { key: "SST", label: productLineLabels.SST },
  { key: "LOGISTIQUE_SECURITE", label: productLineLabels.LOGISTIQUE_SECURITE }
];

export function FormationExplorer() {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("Toutes");
  const [activePole, setActivePole] = useState<"ALL" | ProductLine>("ALL");
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
      const matchesPole = activePole === "ALL" || (formation.productLine ?? "AUTO_ECOLE") === activePole;
      const matchesQuery =
        !normalized ||
        `${formation.title} ${formation.description} ${formation.tags.join(" ")}`.toLowerCase().includes(normalized);
      const matchesFilter =
        activeFilter === "Toutes" ||
        formation.tags.includes(activeFilter) ||
        formation.mode === activeFilter ||
        (activeFilter === "CPF" && formation.cpf);
      return matchesPole && matchesQuery && matchesFilter;
    });
  }, [activeFilter, activePole, query, sourceFormations]);

  return (
    <section className="bg-white py-10 md:py-14 xl:py-20">
      <div className="container-pad">
        <div className="rounded-3xl border border-slate-200 bg-loden-pearl p-3 sm:rounded-[1.75rem] sm:p-5 lg:p-6">
          <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-soft">
            <Search className="h-5 w-5 text-loden-500" aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-loden-muted"
              placeholder="Rechercher une formation..."
              aria-label="Recherche avancée des formations"
            />
          </div>
          <div className="-mx-3 mt-4 flex gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden" role="group" aria-label="Filtrer par pôle">
            {poles.map((pole) => (
              <button
                key={pole.key}
                type="button"
                onClick={() => setActivePole(pole.key)}
                aria-pressed={activePole === pole.key}
                className={`focus-ring shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${activePole === pole.key ? "border-loden-900 bg-loden-900 text-white" : "border-slate-200 bg-white text-loden-ink hover:border-loden-300"}`}
              >
                {pole.label}
              </button>
            ))}
          </div>
          <div className="-mx-3 mt-3 flex gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden" role="group" aria-label="Filtrer par type">
            {["Toutes", ...filters].map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                aria-pressed={activeFilter === filter}
                className={`focus-ring shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${activeFilter === filter ? "border-loden-700 bg-loden-700 text-white" : "border-slate-200 bg-white text-loden-muted hover:border-loden-200"}`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
        {visibleFormations.length > 0 ? (
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:gap-6">
            {visibleFormations.map((formation) => (
              <FormationCard key={formation.slug} formation={formation} />
            ))}
          </div>
        ) : (
          <p className="mt-8 rounded-3xl border border-slate-200 bg-loden-pearl p-6 text-center text-sm font-medium text-loden-muted">
            Aucune formation ne correspond à ces filtres. Essaie un autre pôle ou réinitialise la recherche.
          </p>
        )}
      </div>
    </section>
  );
}
