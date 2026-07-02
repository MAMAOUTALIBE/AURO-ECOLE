"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { ACTIVE_AGENCY_KEY } from "@/components/AgencySwitcher";

// Planning « ressources » façon Kréno2 : colonnes par moniteur, blocs horaires
// proportionnels. Vues Jour et Semaine. Source : /api/admin/appointments/calendar.

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
type Mode = "day" | "week";

const START_HOUR = 7;
const END_HOUR = 20;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
const ROW_H = 52;
const UNASSIGNED = "__none__";
const DAY_NAMES = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

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
function startOfWeek(d: Date) {
  const x = startOfDay(d);
  return addDays(x, -((x.getDay() + 6) % 7)); // lundi
}
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function hourFloat(iso: string) {
  const d = new Date(iso);
  return d.getHours() + d.getMinutes() / 60;
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}
function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";
}

function EventBlocks({ items }: { items: CalendarEvent[] }) {
  return (
    <>
      {HOURS.map((h) => <div key={h} className="border-t border-slate-100" style={{ height: ROW_H }} />)}
      {items.map((e) => {
        const top = (Math.max(START_HOUR, hourFloat(e.startsAt)) - START_HOUR) * ROW_H;
        const height = Math.max(24, (hourFloat(e.endsAt) - hourFloat(e.startsAt)) * ROW_H - 3);
        return (
          <Link
            key={`${e.kind}-${e.id}`}
            href="/admin/rendez-vous?view=planning"
            title={`${e.title} · ${fmtTime(e.startsAt)}–${fmtTime(e.endsAt)}`}
            className="absolute left-0.5 right-0.5 overflow-hidden rounded-md border-l-4 bg-white px-1.5 py-1 text-[11px] leading-tight shadow-soft transition hover:shadow-premium"
            style={{ top, height, borderLeftColor: e.color || "#08AEB8", backgroundColor: `${e.color || "#08AEB8"}14` }}
          >
            <span className="block truncate font-semibold text-loden-ink">{e.title}</span>
            <span className="block truncate text-[10px] text-loden-muted">{fmtTime(e.startsAt)}</span>
          </Link>
        );
      })}
    </>
  );
}

export function ResourcePlanning() {
  const [mode, setMode] = useState<Mode>("day");
  const [anchor, setAnchor] = useState<Date>(() => startOfDay(new Date()));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) setMode("day");
    fetch("/api/instructors")
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => {
        if (Array.isArray(p?.data)) setInstructors((p.data as { id: string; name: string }[]).map((i) => ({ id: i.id, name: i.name })));
      })
      .catch(() => {});
  }, []);

  const range = useMemo(() => {
    if (mode === "week") return { from: startOfWeek(anchor), to: addDays(startOfWeek(anchor), 7) };
    return { from: startOfDay(anchor), to: addDays(startOfDay(anchor), 1) };
  }, [mode, anchor]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const agency = window.localStorage.getItem(ACTIVE_AGENCY_KEY);
    const agencyQ = agency && agency !== "all" ? `&agencyId=${encodeURIComponent(agency)}` : "";
    fetch(`/api/admin/appointments/calendar?from=${range.from.toISOString()}&to=${range.to.toISOString()}&includeLessons=true${agencyQ}`)
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
  }, [range]);

  // Colonnes moniteurs : tous ceux ayant des évènements (+ tous en vue jour) + « Non assigné ».
  const columns = useMemo(() => {
    const withEvents = new Set(events.map((e) => e.instructorId ?? UNASSIGNED));
    const base = mode === "day" ? instructors : instructors.filter((i) => withEvents.has(i.id));
    const cols = base.map((i) => ({ id: i.id, name: i.name }));
    if (withEvents.has(UNASSIGNED)) cols.push({ id: UNASSIGNED, name: "Non assigné" });
    return cols;
  }, [instructors, events, mode]);

  const eventsFor = (colId: string, day?: Date) =>
    events.filter((e) => (e.instructorId ?? UNASSIGNED) === colId && (!day || sameDay(new Date(e.startsAt), day)));

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(anchor), i)), [anchor]);

  const label =
    mode === "day"
      ? anchor.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
      : `${startOfWeek(anchor).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} – ${addDays(startOfWeek(anchor), 6).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}`;

  const step = (dir: number) => setAnchor((d) => addDays(d, mode === "week" ? dir * 7 : dir));
  const mobileEvents = [...events].sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  const HourAxis = ({ headerH }: { headerH: number }) => (
    <div className="w-12 shrink-0">
      <div style={{ height: headerH }} />
      {HOURS.map((h) => (
        <div key={h} className="relative border-t border-slate-100 text-right" style={{ height: ROW_H }}>
          <span className="absolute -top-2 right-1.5 text-[11px] font-semibold text-loden-muted">{String(h).padStart(2, "0")}h</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => step(-1)} aria-label="Précédent" className="focus-ring rounded-lg border border-slate-200 p-2 hover:bg-loden-50"><ChevronLeft className="h-4 w-4" aria-hidden="true" /></button>
          <button type="button" onClick={() => setAnchor(startOfDay(new Date()))} className="focus-ring rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-loden-ink hover:bg-loden-50">Aujourd&apos;hui</button>
          <button type="button" onClick={() => step(1)} aria-label="Suivant" className="focus-ring rounded-lg border border-slate-200 p-2 hover:bg-loden-50"><ChevronRight className="h-4 w-4" aria-hidden="true" /></button>
          <p className="ml-2 text-sm font-semibold capitalize text-loden-ink">{label}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-soft">
            {(["day", "week"] as const).map((m) => (
              <button key={m} type="button" onClick={() => setMode(m)} className={`focus-ring rounded-lg px-3 py-1.5 text-sm font-semibold transition ${mode === m ? "bg-loden-700 text-white shadow-soft" : "text-loden-muted hover:text-loden-ink"}`}>
                {m === "day" ? "Jour" : "Semaine"}
              </button>
            ))}
          </div>
          <Link href="/admin/rendez-vous" className="focus-ring inline-flex items-center gap-2 rounded-full bg-loden-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-loden-800"><Plus className="h-4 w-4" aria-hidden="true" /> RDV</Link>
        </div>
      </div>

      {error ? <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700">{error}</p> : null}
      {loading ? <p className="mt-6 text-sm text-loden-muted">Chargement…</p> : null}

      {!loading && !error ? (
        <div className="mt-5 grid gap-3 md:hidden">
          {mobileEvents.length === 0 ? (
            <p className="py-6 text-center text-sm text-loden-muted">Aucune leçon ni rendez-vous.</p>
          ) : mobileEvents.map((event) => (
            <Link
              key={`${event.kind}-${event.id}`}
              href="/admin/rendez-vous?view=planning"
              className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-soft"
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-loden-ink">{event.title}</p>
                  <p className="mt-1 text-xs text-loden-muted">{event.instructorName ?? "Non assigné"}</p>
                </div>
                <span className="shrink-0 rounded-full bg-loden-50 px-2.5 py-1 text-xs font-semibold text-loden-700">
                  {fmtTime(event.startsAt)}–{fmtTime(event.endsAt)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : null}

      {!loading && !error && mode === "day" ? (
        <div className="mt-5 hidden overflow-x-auto md:block">
          {columns.length === 0 ? (
            <p className="py-6 text-center text-sm text-loden-muted">Aucun moniteur.</p>
          ) : (
            <div className="flex min-w-max">
              <HourAxis headerH={40} />
              {columns.map((col) => (
                <div key={col.id} className="w-48 shrink-0 border-l border-slate-100">
                  <div className="flex h-10 items-center justify-center border-b border-slate-200 px-2 text-center text-xs font-bold uppercase tracking-wide text-loden-700"><span className="truncate">{col.name}</span></div>
                  <div className="relative" style={{ height: HOURS.length * ROW_H }}><EventBlocks items={eventsFor(col.id)} /></div>
                </div>
              ))}
            </div>
          )}
          {events.length === 0 ? <p className="py-6 text-center text-sm text-loden-muted">Aucune leçon ni rendez-vous ce jour.</p> : null}
        </div>
      ) : null}

      {!loading && !error && mode === "week" ? (
        <div className="mt-5 hidden overflow-x-auto md:block">
          {columns.length === 0 ? (
            <p className="py-6 text-center text-sm text-loden-muted">Aucune leçon ni rendez-vous cette semaine.</p>
          ) : (
            <div className="flex min-w-max">
              <HourAxis headerH={60} />
              {weekDays.map((day, di) => {
                const today = sameDay(day, new Date());
                return (
                  <div key={di} className="shrink-0 border-l-2 border-slate-200">
                    <div className={`flex h-8 items-center justify-center border-b border-slate-100 text-xs font-bold ${today ? "bg-loden-50 text-loden-700" : "text-loden-ink"}`}>
                      {DAY_NAMES[di]} {day.getDate()}
                    </div>
                    <div className="flex">
                      {columns.map((col) => (
                        <div key={col.id} className="w-24 shrink-0 border-l border-slate-100 first:border-l-0">
                          <div className="flex h-7 items-center justify-center border-b border-slate-200 text-[11px] font-semibold text-loden-muted" title={col.name}>{col.id === UNASSIGNED ? "N/A" : initials(col.name)}</div>
                          <div className="relative" style={{ height: HOURS.length * ROW_H }}><EventBlocks items={eventsFor(col.id, day)} /></div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
