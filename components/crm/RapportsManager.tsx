"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, Download, Printer } from "lucide-react";
import { ACTIVE_AGENCY_KEY } from "@/components/AgencySwitcher";
import { Card, EmptyState, Skeleton } from "@/components/crm/ui";
import { euros } from "@/lib/invoice-mappers";

type Stats = {
  students: { total: number; byStatus: Record<string, number> };
  leads: { total: number; byStage: Record<string, number> };
  bookings: { upcoming: number };
  payments: { paidCents: number; pending: number };
  cpf: { pending: number };
  reviews: { pending: number };
  exams: { total: number; upcoming: number; passRate: number | null };
};

const STAGE_LABELS: Record<string, string> = {
  PROSPECT: "Prospect",
  CONTACTE: "Contacté",
  RELANCE: "Relance",
  DEVIS_ENVOYE: "Devis envoyé",
  INSCRIT: "Inscrit",
  PERDU: "Perdu"
};
const STATUS_LABELS: Record<string, string> = {
  NOUVEAU: "Nouveau",
  INCOMPLET: "Incomplet",
  EN_COURS: "En cours",
  PRET_EXAMEN: "Prêt examen",
  EXAMEN_PLANIFIE: "Examen planifié",
  TERMINE: "Terminé",
  ARCHIVE: "Archivé"
};

function Section({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div className="break-inside-avoid">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-loden-700">{title}</h3>
      <table className="mt-2 w-full text-left text-sm">
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k} className="border-b border-slate-100 last:border-0">
              <td className="py-1.5 pr-4 text-loden-muted">{k}</td>
              <td className="py-1.5 text-right font-semibold text-loden-ink">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RapportsManager() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const agency = window.localStorage.getItem(ACTIVE_AGENCY_KEY);
    const q = agency && agency !== "all" ? `?agencyId=${encodeURIComponent(agency)}` : "";
    fetch(`/api/admin/stats${q}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => {
        if (p?.data) setStats(p.data as Stats);
        else setError(p?.error?.message ?? "Rapport indisponible.");
      })
      .catch(() => setError("Le service LODENE est momentanément indisponible."))
      .finally(() => setLoading(false));
  }, []);

  const sections = useMemo(() => {
    if (!stats) return [];
    return [
      {
        title: "Synthèse",
        rows: [
          ["Élèves (total)", String(stats.students.total)],
          ["Prospects (total)", String(stats.leads.total)],
          ["Leçons à venir", String(stats.bookings.upcoming)],
          ["Chiffre d'affaires encaissé", euros(stats.payments.paidCents)],
          ["Taux de réussite", stats.exams.passRate === null ? "—" : `${stats.exams.passRate}%`]
        ] as [string, string][]
      },
      {
        title: "Commercial — pipeline",
        rows: Object.entries(STAGE_LABELS).map(([k, label]) => [label, String(stats.leads.byStage[k] ?? 0)] as [string, string])
      },
      {
        title: "Pédagogie — dossiers élèves",
        rows: Object.entries(STATUS_LABELS).map(([k, label]) => [label, String(stats.students.byStatus[k] ?? 0)] as [string, string])
      },
      {
        title: "Examens",
        rows: [
          ["Total programmés", String(stats.exams.total)],
          ["À venir", String(stats.exams.upcoming)],
          ["Taux de réussite", stats.exams.passRate === null ? "—" : `${stats.exams.passRate}%`]
        ] as [string, string][]
      },
      {
        title: "Finance & engagement",
        rows: [
          ["Encaissé", euros(stats.payments.paidCents)],
          ["Paiements en attente", String(stats.payments.pending)],
          ["Dossiers CPF en cours", String(stats.cpf.pending)],
          ["Avis à modérer", String(stats.reviews.pending)]
        ] as [string, string][]
      }
    ];
  }, [stats]);

  const exportCsv = () => {
    const lines: string[][] = [["Section", "Indicateur", "Valeur"]];
    for (const section of sections) for (const [k, v] of section.rows) lines.push([section.title, k, v]);
    const csv = lines.map((l) => l.map((c) => `"${c.replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "rapport-lodene.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <Skeleton className="h-96 w-full rounded-2xl" />;
  if (error || !stats) {
    return (
      <Card className="p-8">
        <EmptyState icon={BarChart3} title="Rapport indisponible" description={error ?? "Aucune donnée."} />
      </Card>
    );
  }

  const today = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div>
      <div className="print-hidden mb-4 flex flex-wrap items-center justify-end gap-2">
        <button type="button" onClick={exportCsv} className="focus-ring inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-loden-700 shadow-soft transition hover:bg-loden-50">
          <Download className="h-4 w-4" aria-hidden="true" /> Exporter CSV
        </button>
        <button type="button" onClick={() => window.print()} className="focus-ring inline-flex items-center gap-2 rounded-xl bg-loden-700 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-loden-800">
          <Printer className="h-4 w-4" aria-hidden="true" /> Imprimer / PDF
        </button>
      </div>

      <div className="invoice-print rounded-2xl border border-slate-200 bg-white p-8 shadow-soft">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <p className="text-2xl font-black tracking-tight text-loden-700">LODENE</p>
            <p className="text-sm text-loden-muted">Rapport d&apos;activité</p>
          </div>
          <p className="text-sm text-loden-muted">Généré le {today}</p>
        </div>
        <div className="mt-6 grid gap-8 sm:grid-cols-2">
          {sections.map((s) => <Section key={s.title} title={s.title} rows={s.rows} />)}
        </div>
        <p className="mt-8 border-t border-slate-100 pt-4 text-[10px] text-loden-muted">
          Rapport indicatif généré par le CRM LODENE à partir des données en base à la date de génération.
        </p>
      </div>
    </div>
  );
}
