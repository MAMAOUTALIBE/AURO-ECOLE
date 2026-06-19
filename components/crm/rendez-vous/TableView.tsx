"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Download, Eye } from "lucide-react";
import { Badge, EmptyState, Pagination } from "@/components/crm/ui";
import {
  SOURCE_LABELS,
  SOURCE_VARIANTS,
  STATUS_LABELS,
  STATUS_VARIANTS,
  TYPE_LABELS,
  formatDate,
  formatDateTime,
  formatTime
} from "./appointment-ui";
import type { EnrichedAppointment } from "./types";

const PAGE_SIZE = 12;

type SortKey = "startsAt" | "fullName" | "status" | "source" | "updatedAt";

export function TableView({
  appointments,
  onOpen
}: {
  appointments: EnrichedAppointment[];
  onOpen: (id: string) => void;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("startsAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    const copy = [...appointments];
    copy.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "fullName":
          cmp = a.fullName.localeCompare(b.fullName);
          break;
        case "status":
          cmp = STATUS_LABELS[a.status].localeCompare(STATUS_LABELS[b.status]);
          break;
        case "source":
          cmp = SOURCE_LABELS[a.source].localeCompare(SOURCE_LABELS[b.source]);
          break;
        case "updatedAt":
          cmp = a.updatedAt.localeCompare(b.updatedAt);
          break;
        default:
          cmp = a.startsAt.localeCompare(b.startsAt);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [appointments, sortKey, sortDir]);

  useEffect(() => {
    setPage(1);
  }, [appointments, sortKey, sortDir]);

  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const exportCsv = () => {
    const headers = ["Date", "Heure", "Nom", "Téléphone", "Email", "Source", "Formation", "Type", "Statut", "Assigné à", "Email admin", "Email client", "WhatsApp"];
    const rows = sorted.map((a) => [
      formatDate(a.startsAt),
      formatTime(a.startsAt),
      a.fullName,
      a.phone,
      a.email ?? "",
      SOURCE_LABELS[a.source],
      a.formationLabel || a.formation || "",
      TYPE_LABELS[a.type],
      STATUS_LABELS[a.status],
      a.advisorName || a.instructorName || "",
      a.adminEmailStatus ?? "",
      a.clientEmailStatus ?? "",
      a.whatsappStatus ?? ""
    ]);
    const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map((r) => r.map(escape).join(";")).join("\n");
    const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rendez-vous-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (appointments.length === 0) {
    return <EmptyState icon={Eye} title="Aucun rendez-vous" description="Ajuste les filtres ou crée un nouveau rendez-vous." />;
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-loden-muted">{sorted.length} rendez-vous</p>
        <button
          type="button"
          onClick={exportCsv}
          className="focus-ring inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-loden-ink hover:bg-loden-50"
        >
          <Download className="h-4 w-4" aria-hidden="true" /> Export CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-loden-muted">
            <tr className="border-b border-slate-200">
              <SortableTh label="Date" active={sortKey === "startsAt"} dir={sortDir} onClick={() => toggleSort("startsAt")} />
              <th className="py-3 pr-4 font-semibold">Heure</th>
              <SortableTh label="Nom" active={sortKey === "fullName"} dir={sortDir} onClick={() => toggleSort("fullName")} />
              <th className="hidden py-3 pr-4 font-semibold md:table-cell">Téléphone</th>
              <th className="hidden py-3 pr-4 font-semibold lg:table-cell">Email</th>
              <SortableTh label="Source" active={sortKey === "source"} dir={sortDir} onClick={() => toggleSort("source")} className="hidden sm:table-cell" />
              <th className="hidden py-3 pr-4 font-semibold lg:table-cell">Formation</th>
              <th className="hidden py-3 pr-4 font-semibold md:table-cell">Type</th>
              <SortableTh label="Statut" active={sortKey === "status"} dir={sortDir} onClick={() => toggleSort("status")} />
              <th className="hidden py-3 pr-4 font-semibold lg:table-cell">Assigné à</th>
              <th className="hidden py-3 pr-4 font-semibold xl:table-cell">Dernière action</th>
              <th className="hidden py-3 pr-4 font-semibold xl:table-cell">Notifs</th>
              <th className="py-3 pr-4" />
            </tr>
          </thead>
          <tbody>
            {paged.map((a) => (
              <tr key={a.id} className="border-b border-slate-100 last:border-0">
                <td className="py-3 pr-4 text-loden-ink">{formatDate(a.startsAt)}</td>
                <td className="py-3 pr-4 text-loden-muted">{formatTime(a.startsAt)}</td>
                <td className="py-3 pr-4">
                  <p className="font-semibold text-loden-ink">{a.fullName}</p>
                  <p className="text-xs text-loden-muted md:hidden">{a.phone}</p>
                </td>
                <td className="hidden py-3 pr-4 text-loden-muted md:table-cell">{a.phone}</td>
                <td className="hidden max-w-[180px] truncate py-3 pr-4 text-loden-muted lg:table-cell" title={a.email ?? ""}>{a.email ?? "—"}</td>
                <td className="hidden py-3 pr-4 sm:table-cell">
                  <Badge variant={SOURCE_VARIANTS[a.source]}>{SOURCE_LABELS[a.source]}</Badge>
                </td>
                <td className="hidden py-3 pr-4 text-loden-muted lg:table-cell">{a.formationLabel || a.formation || "—"}</td>
                <td className="hidden py-3 pr-4 text-loden-muted md:table-cell">{TYPE_LABELS[a.type]}</td>
                <td className="py-3 pr-4">
                  <Badge variant={STATUS_VARIANTS[a.status]}>{STATUS_LABELS[a.status]}</Badge>
                </td>
                <td className="hidden py-3 pr-4 text-loden-muted lg:table-cell">{a.advisorName || a.instructorName || "—"}</td>
                <td className="hidden py-3 pr-4 text-xs text-loden-muted xl:table-cell">{formatDateTime(a.updatedAt)}</td>
                <td className="hidden py-3 pr-4 xl:table-cell">
                  <div className="flex flex-wrap gap-1">
                    <NotifBadge label="A" value={a.adminEmailStatus} />
                    <NotifBadge label="C" value={a.clientEmailStatus} />
                    <NotifBadge label="W" value={a.whatsappStatus} />
                  </div>
                </td>
                <td className="py-3 pr-4 text-right">
                  <button
                    type="button"
                    onClick={() => onOpen(a.id)}
                    className="focus-ring inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-loden-ink hover:bg-loden-50"
                  >
                    <Eye className="h-3.5 w-3.5" aria-hidden="true" /> Ouvrir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pageSize={PAGE_SIZE} total={sorted.length} onPage={setPage} />
    </div>
  );
}

function SortableTh({
  label,
  active,
  dir,
  onClick,
  className
}: {
  label: string;
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
  className?: string;
}) {
  const Icon = !active ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th className={`py-3 pr-4 font-semibold ${className ?? ""}`}>
      <button type="button" onClick={onClick} className="focus-ring inline-flex items-center gap-1 uppercase tracking-wide hover:text-loden-ink">
        {label}
        <Icon className="h-3 w-3" aria-hidden="true" />
      </button>
    </th>
  );
}

function NotifBadge({ label, value }: { label: string; value?: string | null }) {
  if (!value || value === "none" || value === "PENDING") {
    return <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-400" title={`${label} : ${value ?? "—"}`}>{label}</span>;
  }
  const ok = /sent|delivered|ok|success|envoy/i.test(value);
  return (
    <span
      title={`${label} : ${value}`}
      className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold ${ok ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
    >
      {label}
    </span>
  );
}
