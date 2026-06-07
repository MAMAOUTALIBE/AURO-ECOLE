"use client";

import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";

type Booking = {
  id: string;
  studentId: string;
  instructorId: string;
  startsAt: string;
  endsAt: string;
  status: string;
};

const STATUSES: { key: string; label: string }[] = [
  { key: "EN_ATTENTE", label: "En attente" },
  { key: "CONFIRMEE", label: "Confirmée" },
  { key: "TERMINEE", label: "Terminée" },
  { key: "ABSENT", label: "Absent" },
  { key: "ANNULEE", label: "Annulée" }
];

const STATUS_STYLES: Record<string, string> = {
  EN_ATTENTE: "bg-amber-50 text-amber-700",
  CONFIRMEE: "bg-emerald-50 text-emerald-700",
  TERMINEE: "bg-loden-50 text-loden-700",
  ABSENT: "bg-slate-100 text-slate-600",
  ANNULEE: "bg-red-50 text-red-700"
};

function dayLabel(iso: string) {
  const label = new Date(iso).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}
function time(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export function Planning() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [instructors, setInstructors] = useState<Record<string, string>>({});
  const [students, setStudents] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/bookings").then((r) => r.json()).catch(() => null),
      fetch("/api/instructors").then((r) => r.json()).catch(() => null),
      fetch("/api/students").then((r) => r.json()).catch(() => null)
    ])
      .then(([bookingPayload, instructorPayload, studentPayload]) => {
        if (Array.isArray(bookingPayload?.data)) setBookings(bookingPayload.data as Booking[]);
        else setError(bookingPayload?.error?.message ?? "Impossible de charger le planning.");
        if (Array.isArray(instructorPayload?.data)) {
          setInstructors(Object.fromEntries(instructorPayload.data.map((i: { id: string; name: string }) => [i.id, i.name])));
        }
        if (Array.isArray(studentPayload?.data)) {
          setStudents(
            Object.fromEntries(
              studentPayload.data.map((s: { id: string; user: { firstName: string; lastName: string } | null }) => [
                s.id,
                s.user ? `${s.user.firstName} ${s.user.lastName}` : s.id
              ])
            )
          );
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const changeStatus = async (booking: Booking, status: string) => {
    if (status === booking.status) return;
    setBusyId(booking.id);
    try {
      const response = await fetch(`/api/bookings/${booking.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error();
      setBookings((current) => current.map((item) => (item.id === booking.id ? { ...item, status } : item)));
    } catch {
      setError("Le changement de statut a échoué.");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <p className="text-sm text-loden-muted">Chargement du planning…</p>;

  const sorted = [...bookings].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const days = new Map<string, Booking[]>();
  for (const booking of sorted) {
    const key = booking.startsAt.slice(0, 10);
    if (!days.has(key)) days.set(key, []);
    days.get(key)?.push(booking);
  }

  return (
    <div>
      {error ? <p className="mb-4 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700">{error}</p> : null}

      {days.size === 0 ? (
        <div className="flex items-center gap-2 rounded-2xl bg-white p-4 text-sm text-loden-muted shadow-soft">
          <CalendarDays className="h-4 w-4 text-loden-700" aria-hidden="true" />
          Aucune leçon planifiée.
        </div>
      ) : null}

      <div className="grid gap-6">
        {Array.from(days.entries()).map(([key, dayBookings]) => (
          <div key={key} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-loden-700">{dayLabel(`${key}T00:00:00`)}</h3>
            <div className="mt-4 grid gap-3">
              {dayBookings.map((booking) => (
                <div key={booking.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-loden-pearl/50 p-3">
                  <div className="flex items-center gap-4">
                    <span className="rounded-xl bg-white px-3 py-1.5 text-sm font-semibold text-loden-ink shadow-soft">
                      {time(booking.startsAt)}–{time(booking.endsAt)}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-loden-ink">
                        {students[booking.studentId] ?? "Élève"}
                      </p>
                      <p className="text-xs text-loden-muted">Moniteur : {instructors[booking.instructorId] ?? booking.instructorId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[booking.status] ?? "bg-slate-100 text-slate-600"}`}>
                      {STATUSES.find((s) => s.key === booking.status)?.label ?? booking.status}
                    </span>
                    <select
                      aria-label="Changer le statut"
                      className="focus-ring cursor-pointer rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-loden-ink outline-none disabled:opacity-60"
                      value={booking.status}
                      disabled={busyId === booking.id}
                      onChange={(event) => changeStatus(booking, event.target.value)}
                    >
                      {STATUSES.map((option) => (
                        <option key={option.key} value={option.key}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
