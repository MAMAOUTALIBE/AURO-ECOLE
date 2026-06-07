"use client";

import { useEffect, useState } from "react";
import { Award, CalendarDays, CreditCard, FileText, GraduationCap, KanbanSquare, Star } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ACTIVE_AGENCY_KEY } from "@/components/AgencySwitcher";

type Stats = {
  students: { total: number; byStatus: Record<string, number> };
  leads: { total: number; byStage: Record<string, number> };
  bookings: { upcoming: number };
  payments: { paidCents: number; pending: number };
  cpf: { pending: number };
  reviews: { pending: number };
  exams: { total: number; upcoming: number; passRate: number | null };
};

function euros(cents: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(cents / 100);
}

export function CockpitStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const agency = window.localStorage.getItem(ACTIVE_AGENCY_KEY);
    const query = agency && agency !== "all" ? `?agencyId=${encodeURIComponent(agency)}` : "";

    fetch(`/api/admin/stats${query}`)
      .then((response) => response.json())
      .then((payload) => {
        if (payload?.data) setStats(payload.data as Stats);
        else setError(payload?.error?.message ?? "Indicateurs indisponibles.");
      })
      .catch(() => setError("Le service LODEN est momentanément indisponible."));
  }, []);

  if (error) {
    return <p className="rounded-2xl bg-amber-50 p-4 text-sm font-medium text-amber-800">{error}</p>;
  }
  if (!stats) {
    return <p className="text-sm text-loden-muted">Chargement des indicateurs…</p>;
  }

  const cards: { icon: LucideIcon; label: string; value: string | number; hint?: string }[] = [
    { icon: GraduationCap, label: "Élèves", value: stats.students.total, hint: `${stats.students.byStatus.EN_COURS ?? 0} en cours` },
    { icon: KanbanSquare, label: "Prospects", value: stats.leads.total, hint: `${stats.leads.byStage.PROSPECT ?? 0} nouveaux` },
    { icon: CalendarDays, label: "Leçons à venir", value: stats.bookings.upcoming },
    { icon: Award, label: "Taux de réussite", value: stats.exams.passRate === null ? "—" : `${stats.exams.passRate}%`, hint: `${stats.exams.upcoming} examen(s) à venir` },
    { icon: CreditCard, label: "Encaissé", value: euros(stats.payments.paidCents), hint: `${stats.payments.pending} en attente` },
    { icon: FileText, label: "CPF en cours", value: stats.cpf.pending },
    { icon: Star, label: "Avis à modérer", value: stats.reviews.pending }
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <Icon className="h-5 w-5 text-loden-700" aria-hidden="true" />
            <p className="mt-3 text-2xl font-semibold text-loden-ink">{card.value}</p>
            <p className="mt-1 text-sm text-loden-muted">{card.label}</p>
            {card.hint ? <p className="mt-0.5 text-xs text-loden-muted">{card.hint}</p> : null}
          </div>
        );
      })}
    </div>
  );
}
