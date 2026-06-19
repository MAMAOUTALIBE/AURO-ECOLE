"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { ACTIVE_AGENCY_KEY } from "@/components/AgencySwitcher";

// Planning « ressources » façon Kréno2 : une colonne par moniteur, blocs horaires
// proportionnels à la durée. Source : /api/admin/appointments/calendar (leçons + RDV enrichis).

type CalendarEvent = {
  id: string;
  kind: "appointment" | "lesson";
  title: string;
  startsAt: string;
  endsAt: string;
  status: string;
  source: string;
  color: string;
  instructorId?: string | null;
  instructorName?: string | null;
};
type Instructor = { id: string; name: string };

const START_HOUR = 7;
const END_HOUR = 20;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
const ROW_H = 56;
const UNASSIGNED = "__none__";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function hourFloat(iso: string) {
  const d = new Date(iso);
  return d.getHours() + d.getMinutes() / 60;
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export function ResourcePlanning() {
  const [anchor, setAnchor] = useState<Date>(() => startOfDay(new Date()));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/instructors")
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => {
        if (Array.isArray(p?.data)) setInstructors((p.data as { id: string; name: string }[]).map((i) => ({ id: i.id, name: i.name })));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const from = startOfDay(anchor).toISOString();
    const to = addDays(startOfDay(anchor), 1).toISOString();
    const agency = window.localStorage.getItem(ACTIVE_AGENCY_KEY);
    const agencyQ = agency && agency !== "all" ? `&agencyId=${encodeURIComponent(agency)}` : "";
    fetch(`/api/admin/appointments/calendar?from=${from}&to=${to}&includeLessons=true${agencyQ}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => {
        if (cancelled) return;
        if (Array.isArray(p?.data?.events)) setEvents(p.data.events as CalendarEvent[]);
        else setError("Chargement du planning impossible.");
      })
      .catch(() => !cancelled && setError("Le service LODENE est momentanément indisponible."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [anchor]);

  // Colonnes : moniteurs ayant des évènements ce jour + ceux connus, + « Non assigné » si besoin.
  const columns = useMemo(() => {
    const withEvents = new Set(events.map((e) => e.instructorId ?? UNASSIGNED));
    const cols = instructors
      .filter((i) => withEvents.has(i.id) || true)
      .map((i) => ({ id: i.id, name: i.name }));
    if (withEvents.has(UNASSIGNED)) cols.push({ id: UNASSIGNED, name: "Non assigné" });
    // Si aucun moniteur connu mais des events, au moins la colonne Non assigné.
    if (cols.length === 0) cols.push({ id: UNASSIGNED, name: "Non assigné" });
    return cols;
  }, [instructors, events]);

  const eventsByColumn = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const key = e.instructorId ?? UNASSIGNED;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return map;
  }, [events]);

  const isToday = startOfDay(anchor).getTime() === startOfDay(new Date()).getTime();

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setAnchor((d) => addDays(d, -1))} aria-label="Jour précédent" className="focus-ring rounded-lg border border-slate-200 p-2 hover:bg-loden-50">
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => setAnchor(startOfDay(new Date()))} className={`focus-ring rounded-lg border px-3 py-1.5 text-sm font-semibold ${isToday ? "border-loden-200 bg-loden-50 text-loden-700" : "border-slate-200 text-loden-ink hover:bg-loden-50"}`}>
            Aujourd&apos;hui
          </button>
          <button type="button" onClick={() => setAnchor((d) => addDays(d, 1))} aria-label="Jour suivant" className="focus-ring rounded-lg border border-slate-200 p-2 hover:bg-loden-50">
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
          <p className="ml-2 text-sm font-semibold text-loden-ink">
            {anchor.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <Link href="/admin/rendez-vous" className="focus-ring inline-flex items-center gap-2 rounded-full bg-loden-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-loden-800">
          <Plus className="h-4 w-4" aria-hidden="true" /> Rendez-vous
        </Link>
      </div>

      {error ? <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700">{error}</p> : null}
      {loading ? <p className="mt-6 text-sm text-loden-muted">Chargement…</p> : null}

      {!loading && !error ? (
        <div className="mt-5 overflow-x-auto">
          <div className="flex min-w-max">
            {/* Axe horaire */}
            <div className="w-14 shrink-0">
              <div className="h-10" />
              {HOURS.map((h) => (
                <div key={h} className="relative border-t border-slate-100 text-right" style={{ height: ROW_H }}>
                  <span className="absolute -top-2 right-2 text-xs font-semibold text-loden-muted">{String(h).padStart(2, "0")}:00</span>
                </div>
              ))}
            </div>

            {/* Colonnes par moniteur */}
            {columns.map((col) => {
              const colEvents = eventsByColumn.get(col.id) ?? [];
              return (
                <div key={col.id} className="w-48 shrink-0 border-l border-slate-100">
                  <div className="flex h-10 items-center justify-center border-b border-slate-200 px-2 text-center text-xs font-bold uppercase tracking-wide text-loden-700">
                    <span className="truncate">{col.name}</span>
                  </div>
                  <div className="relative" style={{ height: HOURS.length * ROW_H }}>
                    {HOURS.map((h) => <div key={h} className="border-t border-slate-100" style={{ height: ROW_H }} />)}
                    {colEvents.map((e) => {
                      const top = (Math.max(START_HOUR, hourFloat(e.startsAt)) - START_HOUR) * ROW_H;
                      const rawH = (hourFloat(e.endsAt) - hourFloat(e.startsAt)) * ROW_H;
                      const height = Math.max(26, rawH - 3);
                      return (
                        <Link
                          key={`${e.kind}-${e.id}`}
                          href="/admin/rendez-vous?view=planning"
                          title={`${e.title} · ${fmtTime(e.startsAt)}–${fmtTime(e.endsAt)}`}
                          className="absolute left-1 right-1 overflow-hidden rounded-lg border-l-4 bg-white px-2 py-1 text-xs shadow-soft transition hover:shadow-premium"
                          style={{ top, height, borderLeftColor: e.color || "#08AEB8", backgroundColor: `${e.color || "#08AEB8"}14` }}
                        >
                          <span className="block truncate font-semibold text-loden-ink">{e.title}</span>
                          <span className="block truncate text-[11px] text-loden-muted">{fmtTime(e.startsAt)}–{fmtTime(e.endsAt)}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          {events.length === 0 ? <p className="py-6 text-center text-sm text-loden-muted">Aucune leçon ni rendez-vous ce jour.</p> : null}
        </div>
      ) : null}
    </div>
  );
}
