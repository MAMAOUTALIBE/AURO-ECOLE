"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/crm/ui";
import { formatTime } from "./appointment-ui";
import type { CalendarEvent } from "./types";

type CalendarMode = "day" | "week" | "month";

const MODE_LABELS: Record<CalendarMode, string> = { day: "Jour", week: "Semaine", month: "Mois" };
const DAY_NAMES = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7h → 20h

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
  const day = (x.getDay() + 6) % 7; // lundi = 0
  return addDays(x, -day);
}
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function isoDate(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function CalendarView({
  events,
  onRangeChange,
  onOpenAppointment
}: {
  events: CalendarEvent[];
  onRangeChange: (from: string, to: string) => void;
  onOpenAppointment: (refId: string) => void;
}) {
  const [mode, setMode] = useState<CalendarMode>("day");
  const [anchor, setAnchor] = useState<Date>(() => startOfDay(new Date()));

  // En mobile, vue Jour par défaut.
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 640) setMode("day");
  }, []);

  const range = useMemo(() => {
    if (mode === "day") return { from: startOfDay(anchor), to: addDays(startOfDay(anchor), 1) };
    if (mode === "week") return { from: startOfWeek(anchor), to: addDays(startOfWeek(anchor), 7) };
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const gridStart = startOfWeek(first);
    return { from: gridStart, to: addDays(gridStart, 42) };
  }, [mode, anchor]);

  const lastRange = useRef("");
  useEffect(() => {
    const key = `${range.from.toISOString()}|${range.to.toISOString()}`;
    if (key === lastRange.current) return;
    lastRange.current = key;
    onRangeChange(range.from.toISOString(), range.to.toISOString());
  }, [range, onRangeChange]);

  const move = (dir: 1 | -1) => {
    if (mode === "day") setAnchor((d) => addDays(d, dir));
    else if (mode === "week") setAnchor((d) => addDays(d, dir * 7));
    else setAnchor((d) => new Date(d.getFullYear(), d.getMonth() + dir, 1));
  };

  const title = useMemo(() => {
    if (mode === "day") {
      const label = anchor.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
      return label.charAt(0).toUpperCase() + label.slice(1);
    }
    if (mode === "week") {
      const ws = startOfWeek(anchor);
      const we = addDays(ws, 6);
      return `${ws.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} – ${we.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}`;
    }
    const label = anchor.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }, [mode, anchor]);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => move(-1)} aria-label="Précédent" className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-loden-ink hover:bg-loden-50">
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => setAnchor(startOfDay(new Date()))} className="focus-ring rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-loden-ink hover:bg-loden-50">
            Aujourd&apos;hui
          </button>
          <button type="button" onClick={() => move(1)} aria-label="Suivant" className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-loden-ink hover:bg-loden-50">
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
          <p className="ml-1 text-sm font-semibold text-loden-ink">{title}</p>
        </div>
        <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-0.5">
          {(Object.keys(MODE_LABELS) as CalendarMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`focus-ring rounded-lg px-3 py-1.5 text-sm font-semibold transition ${mode === m ? "bg-white text-loden-700 shadow-soft" : "text-loden-muted hover:text-loden-ink"}`}
            >
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

      {mode === "day" ? <DayGrid date={anchor} events={events} onOpen={onOpenAppointment} /> : null}
      {mode === "week" ? <WeekGrid anchor={anchor} events={events} onOpen={onOpenAppointment} /> : null}
      {mode === "month" ? <MonthGrid anchor={anchor} events={events} onOpen={onOpenAppointment} /> : null}

      <div className="mt-3 flex flex-wrap gap-3 text-xs text-loden-muted">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-loden-400" /> Rendez-vous</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm border border-dashed border-slate-400" /> Leçon (lecture seule)</span>
      </div>
    </div>
  );
}

function eventsForDay(events: CalendarEvent[], day: Date) {
  return events
    .filter((e) => sameDay(new Date(e.startsAt), day))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

function EventChip({
  event,
  onOpen,
  compact = false
}: {
  event: CalendarEvent;
  onOpen: (refId: string) => void;
  compact?: boolean;
}) {
  const isLesson = event.kind === "lesson";
  const tint = `${event.color}22`;
  const base = "block w-full truncate rounded-lg px-2 py-1 text-left text-xs font-medium transition";
  const style: React.CSSProperties = isLesson
    ? { borderLeft: `3px dashed ${event.color}`, background: tint, color: "#142126" }
    : { borderLeft: `3px solid ${event.color}`, background: tint, color: "#142126" };

  const content = (
    <>
      <span className="font-semibold">{formatTime(event.startsAt)}</span> {event.title}
      {isLesson ? <span className="ml-1 rounded bg-white/70 px-1 text-[9px] uppercase text-loden-muted">Leçon</span> : null}
    </>
  );

  if (isLesson) {
    return (
      <span
        className={`${base} cursor-default ${compact ? "" : ""}`}
        style={style}
        title={`Leçon · ${event.instructorName ?? ""} · ${formatTime(event.startsAt)}–${formatTime(event.endsAt)}`}
      >
        {content}
      </span>
    );
  }
  return (
    <button type="button" onClick={() => onOpen(event.refId)} className={`focus-ring ${base} hover:brightness-95`} style={style} title={event.title}>
      {content}
    </button>
  );
}

function DayGrid({ date, events, onOpen }: { date: Date; events: CalendarEvent[]; onOpen: (refId: string) => void }) {
  const dayEvents = eventsForDay(events, date);
  return (
    <div className="grid gap-1">
      {HOURS.map((hour) => {
        const slot = dayEvents.filter((e) => new Date(e.startsAt).getHours() === hour);
        return (
          <div key={hour} className="grid grid-cols-[56px_1fr] gap-2 border-b border-slate-100 py-1.5">
            <span className="pt-1 text-right text-xs font-semibold text-loden-muted">{String(hour).padStart(2, "0")}:00</span>
            <div className="grid gap-1">
              {slot.map((e) => <EventChip key={`${e.kind}-${e.id}`} event={e} onOpen={onOpen} />)}
            </div>
          </div>
        );
      })}
      {dayEvents.length === 0 ? <p className="py-6 text-center text-sm text-loden-muted">Aucun évènement ce jour.</p> : null}
    </div>
  );
}

function WeekGrid({ anchor, events, onOpen }: { anchor: Date; events: CalendarEvent[]; onOpen: (refId: string) => void }) {
  const ws = startOfWeek(anchor);
  const days = Array.from({ length: 7 }, (_, i) => addDays(ws, i));
  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[700px] grid-cols-7 gap-2">
        {days.map((day, idx) => {
          const dayEvents = eventsForDay(events, day);
          const today = sameDay(day, new Date());
          return (
            <div key={isoDate(day)} className="rounded-2xl border border-slate-100 bg-loden-pearl/40 p-2">
              <p className={`text-center text-xs font-semibold ${today ? "text-loden-700" : "text-loden-muted"}`}>
                {DAY_NAMES[idx]} {day.getDate()}
              </p>
              <div className="mt-2 grid max-h-[60vh] gap-1 overflow-y-auto">
                {dayEvents.map((e) => <EventChip key={`${e.kind}-${e.id}`} event={e} onOpen={onOpen} />)}
                {dayEvents.length === 0 ? <p className="py-2 text-center text-[11px] text-loden-muted">—</p> : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MonthGrid({ anchor, events, onOpen }: { anchor: Date; events: CalendarEvent[]; onOpen: (refId: string) => void }) {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const gridStart = startOfWeek(first);
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  return (
    <div>
      <div className="grid grid-cols-7 gap-1 pb-1">
        {DAY_NAMES.map((d) => <span key={d} className="text-center text-[11px] font-semibold uppercase text-loden-muted">{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day) => {
          const inMonth = day.getMonth() === anchor.getMonth();
          const dayEvents = eventsForDay(events, day);
          const today = sameDay(day, new Date());
          return (
            <div
              key={isoDate(day)}
              className={`min-h-[88px] rounded-xl border p-1.5 ${inMonth ? "border-slate-100 bg-white" : "border-transparent bg-slate-50/60"}`}
            >
              <p className={`text-right text-xs font-semibold ${today ? "text-loden-700" : inMonth ? "text-loden-ink" : "text-slate-300"}`}>
                {day.getDate()}
              </p>
              <div className="mt-1 grid gap-0.5">
                {dayEvents.slice(0, 3).map((e) => <EventChip key={`${e.kind}-${e.id}`} event={e} onOpen={onOpen} compact />)}
                {dayEvents.length > 3 ? (
                  <Badge variant="neutral" className="justify-center">+{dayEvents.length - 3}</Badge>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
