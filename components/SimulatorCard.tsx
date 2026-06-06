"use client";

import { useMemo, useState } from "react";
import { Calculator, Clock3 } from "lucide-react";
import { simulatorOptions } from "@/data/site";
import { formatCurrency } from "@/lib/utils";

export function SimulatorCard() {
  const [formation, setFormation] = useState(simulatorOptions.formations[0].value);
  const [hours, setHours] = useState(20);
  const [financing, setFinancing] = useState(simulatorOptions.financing[0].value);

  const estimate = useMemo(() => {
    const selectedFormation = simulatorOptions.formations.find((item) => item.value === formation) ?? simulatorOptions.formations[0];
    const selectedFinancing = simulatorOptions.financing.find((item) => item.value === financing) ?? simulatorOptions.financing[0];
    return Math.max(0, selectedFormation.base + selectedFormation.hourly * hours - selectedFinancing.discount);
  }, [financing, formation, hours]);

  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-premium">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-loden-50 text-loden-700">
          <Calculator className="h-6 w-6" />
        </span>
        <div>
          <h3 className="text-xl font-semibold text-loden-ink">Simulateur de tarif</h3>
          <p className="text-sm text-loden-muted">Estimation immédiate, ajustable avant devis.</p>
        </div>
      </div>
      <div className="mt-6 grid gap-5">
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-loden-ink">Formation</span>
          <select
            className="focus-ring rounded-2xl border border-slate-200 bg-loden-fog px-4 py-3 text-loden-ink"
            value={formation}
            onChange={(event) => setFormation(event.target.value)}
          >
            {simulatorOptions.formations.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-3">
          <span className="flex items-center justify-between text-sm font-semibold text-loden-ink">
            Nombre d&apos;heures
            <span className="rounded-full bg-loden-50 px-3 py-1 text-loden-700">{hours} h</span>
          </span>
          <input
            type="range"
            min="10"
            max="40"
            value={hours}
            onChange={(event) => setHours(Number(event.target.value))}
            className="accent-loden-500"
          />
        </label>
        <fieldset className="grid gap-3">
          <legend className="text-sm font-semibold text-loden-ink">Financement</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {simulatorOptions.financing.map((option) => (
              <label
                key={option.value}
                className={`cursor-pointer rounded-2xl border px-4 py-3 text-center text-sm font-semibold transition ${financing === option.value ? "border-loden-400 bg-loden-50 text-loden-800" : "border-slate-200 bg-white text-loden-muted hover:border-loden-200"}`}
              >
                <input
                  type="radio"
                  name="financing"
                  value={option.value}
                  checked={financing === option.value}
                  onChange={(event) => setFinancing(event.target.value)}
                  className="sr-only"
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>
      </div>
      <div className="mt-6 rounded-3xl bg-loden-ink p-5 text-white">
        <p className="flex items-center gap-2 text-sm text-white/75">
          <Clock3 className="h-4 w-4" />
          Prix estimé
        </p>
        <p className="mt-2 text-4xl font-semibold">{formatCurrency(estimate)}</p>
        <p className="mt-2 text-sm text-white/70">Le devis final dépend du diagnostic initial et du planning choisi.</p>
      </div>
    </div>
  );
}
