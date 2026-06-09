"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Plus, X } from "lucide-react";

type Booking = {
  id: string;
  studentId: string;
  instructorId: string;
  startsAt: string;
  endsAt: string;
  status: string;
};

const EMPTY_BOOKING_FORM = { studentId: "", instructorId: "", formationId: "", date: "", start: "", end: "" };

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
  const [formations, setFormations] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_BOOKING_FORM);

  useEffect(() => {
    Promise.all([
      fetch("/api/bookings").then((r) => r.json()).catch(() => null),
      fetch("/api/instructors").then((r) => r.json()).catch(() => null),
      fetch("/api/students").then((r) => r.json()).catch(() => null),
      fetch("/api/formations").then((r) => r.json()).catch(() => null)
    ])
      .then(([bookingPayload, instructorPayload, studentPayload, formationPayload]) => {
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
        if (Array.isArray(formationPayload?.data)) {
          setFormations(formationPayload.data.map((f: { id: string; title: string }) => ({ id: f.id, title: f.title })));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const createBooking = async () => {
    if (!form.studentId || !form.instructorId || !form.formationId || !form.date || !form.start || !form.end) {
      setError("Renseigne élève, moniteur, formation, date et horaires.");
      return;
    }
    const startsAt = new Date(`${form.date}T${form.start}`);
    const endsAt = new Date(`${form.date}T${form.end}`);
    if (endsAt <= startsAt) {
      setError("L'heure de fin doit être après l'heure de début.");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: form.studentId,
          instructorId: form.instructorId,
          formationId: form.formationId,
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString()
        })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error?.message ?? "Création impossible.");
      setBookings((current) => [...current, payload.data as Booking]);
      setForm(EMPTY_BOOKING_FORM);
      setShowForm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Création de la leçon impossible.");
    } finally {
      setCreating(false);
    }
  };

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
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-loden-muted">{bookings.length} leçon(s)</p>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="focus-ring inline-flex items-center gap-1.5 rounded-xl bg-loden-700 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-loden-800"
        >
          {showForm ? <X className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
          {showForm ? "Fermer" : "Planifier une leçon"}
        </button>
      </div>
      {showForm ? (
        <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <select className="field-input" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} aria-label="Élève">
              <option value="">— Élève —</option>
              {Object.entries(students).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
            <select className="field-input" value={form.instructorId} onChange={(e) => setForm({ ...form, instructorId: e.target.value })} aria-label="Moniteur">
              <option value="">— Moniteur —</option>
              {Object.entries(instructors).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
            <select className="field-input" value={form.formationId} onChange={(e) => setForm({ ...form, formationId: e.target.value })} aria-label="Formation">
              <option value="">— Formation —</option>
              {formations.map((f) => <option key={f.id} value={f.id}>{f.title}</option>)}
            </select>
            <input type="date" className="field-input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} aria-label="Date" />
            <input type="time" className="field-input" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} aria-label="Heure de début" />
            <input type="time" className="field-input" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} aria-label="Heure de fin" />
          </div>
          {Object.keys(students).length === 0 || Object.keys(instructors).length === 0 || formations.length === 0 ? (
            <p className="mt-3 text-xs text-loden-muted">Il faut au moins un élève, un moniteur et une formation pour planifier une leçon.</p>
          ) : null}
          <button
            type="button"
            onClick={createBooking}
            disabled={creating}
            className="focus-ring mt-3 inline-flex items-center gap-2 rounded-xl bg-loden-700 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-loden-800 disabled:opacity-70"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {creating ? "Création…" : "Créer la leçon"}
          </button>
        </div>
      ) : null}
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
