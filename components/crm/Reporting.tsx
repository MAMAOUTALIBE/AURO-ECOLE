"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

type Stats = {
  students: { total: number };
  leads: { total: number };
  bookings: { upcoming: number };
  payments: { paidCents: number };
  cpf: { pending: number };
  exams: { passRate: number | null };
};
type Row = { label: string; stats: Stats };

function euros(cents: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(cents / 100);
}

export function Reporting() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const agencyPayload = await fetch("/api/agencies").then((r) => (r.ok ? r.json() : null));
        const agencies: { id: string; name: string }[] = Array.isArray(agencyPayload?.data) ? agencyPayload.data : [];
        const targets = [{ label: "Toutes les agences", id: null as string | null }, ...agencies.map((a) => ({ label: a.name, id: a.id }))];

        const results = await Promise.all(
          targets.map(async (target) => {
            const query = target.id ? `?agencyId=${encodeURIComponent(target.id)}` : "";
            const statsPayload = await fetch(`/api/admin/stats${query}`).then((r) => (r.ok ? r.json() : null));
            return statsPayload?.data ? { label: target.label, stats: statsPayload.data as Stats } : null;
          })
        );

        const valid = results.filter((row): row is Row => row !== null);
        if (valid.length === 0) setError("Aucune donnée de reporting disponible.");
        setRows(valid);
      } catch {
        setError("Le service LODENE est momentanément indisponible.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p className="text-sm text-loden-muted">Chargement du reporting…</p>;
  if (error) return <p className="rounded-2xl bg-amber-50 p-4 text-sm font-medium text-amber-800">{error}</p>;

  const columns: { key: string; label: string; render: (s: Stats) => string }[] = [
    { key: "students", label: "Élèves", render: (s) => String(s.students.total) },
    { key: "leads", label: "Prospects", render: (s) => String(s.leads.total) },
    { key: "bookings", label: "Leçons à venir", render: (s) => String(s.bookings.upcoming) },
    { key: "passRate", label: "Taux réussite", render: (s) => (s.exams.passRate === null ? "—" : `${s.exams.passRate}%`) },
    { key: "paid", label: "Encaissé", render: (s) => euros(s.payments.paidCents) },
    { key: "cpf", label: "CPF en cours", render: (s) => String(s.cpf.pending) }
  ];

  const exportCsv = () => {
    const header = ["Agence", ...columns.map((c) => c.label)];
    const lines = [header, ...rows.map((r) => [r.label, ...columns.map((c) => c.render(r.stats))])];
    const csv = lines.map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "reporting-lodene.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-loden-ink">Comparatif par agence</h2>
          <p className="mt-1 text-sm text-loden-muted">Indicateurs clés agrégés par centre.</p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="focus-ring inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-loden-700 shadow-soft transition hover:bg-loden-50"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Exporter CSV
        </button>
      </div>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-loden-muted">
            <tr className="border-b border-slate-200">
              <th className="py-3 pr-4 font-semibold">Agence</th>
              {columns.map((column) => (
                <th key={column.key} className="py-3 pr-4 font-semibold">{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.label} className={`border-b border-slate-100 last:border-0 ${index === 0 ? "bg-loden-pearl/50 font-semibold" : ""}`}>
                <td className="py-3 pr-4 font-semibold text-loden-ink">{row.label}</td>
                {columns.map((column) => (
                  <td key={column.key} className="py-3 pr-4 text-loden-ink">{column.render(row.stats)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
