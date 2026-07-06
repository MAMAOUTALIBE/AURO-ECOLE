"use client";

import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";

type Agency = { id: string; name: string };

export const ACTIVE_AGENCY_KEY = "loden_active_agency";

export function AgencySwitcher() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [active, setActive] = useState("all");

  useEffect(() => {
    setActive(window.localStorage.getItem(ACTIVE_AGENCY_KEY) ?? "all");

    let cancelled = false;
    fetch("/api/agencies")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (!cancelled && Array.isArray(payload?.data)) setAgencies(payload.data as Agency[]);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = (value: string) => {
    setActive(value);
    window.localStorage.setItem(ACTIVE_AGENCY_KEY, value);
    // Recharge la page pour que tous les modules CRM relisent l'agence active.
    window.location.reload();
  };

  // Inutile d'afficher le sélecteur si l'utilisateur n'a accès qu'à une agence.
  if (agencies.length < 2) return null;

  return (
    <label className="hidden min-w-0 max-w-[13rem] items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-loden-ink shadow-soft sm:inline-flex md:max-w-[18rem] xl:max-w-none xl:px-4">
      <Building2 className="h-4 w-4 shrink-0 text-loden-700" aria-hidden="true" />
      <span className="sr-only">Agence active</span>
      <select
        value={active}
        onChange={(event) => handleChange(event.target.value)}
        className="focus-ring min-w-0 max-w-full cursor-pointer truncate bg-transparent pr-1 outline-none"
        aria-label="Agence active"
      >
        <option value="all">Toutes les agences</option>
        {agencies.map((agency) => (
          <option key={agency.id} value={agency.id}>
            {agency.name}
          </option>
        ))}
      </select>
    </label>
  );
}
