"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarCheck, MapPin } from "lucide-react";
import { meetingPoints, slots } from "@/data/site";

type SlotOption = {
  label: string;
  instructorId?: string;
  startsAt?: string;
  endsAt?: string;
};

type CalendarDay = {
  day: string;
  date: string;
  slots: SlotOption[];
};

type Availability = {
  instructorId: string;
  startsAt: string;
  endsAt: string;
  isAvailable: boolean;
};

const fallbackDays: CalendarDay[] = slots.map((day) => ({
  ...day,
  slots: day.slots.map((slot) => ({ label: slot }))
}));

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(value: number) {
  const hours = Math.floor(value / 60).toString().padStart(2, "0");
  const minutes = (value % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

function formatDayLabel(date: string) {
  const day = new Date(`${date}T00:00:00.000Z`)
    .toLocaleDateString("fr-FR", { weekday: "short", timeZone: "UTC" })
    .replace(".", "");

  return day.charAt(0).toUpperCase() + day.slice(1, 3);
}

function buildCalendarDays(availabilities: Availability[]): CalendarDay[] {
  const days = new Map<string, SlotOption[]>();

  for (const availability of availabilities) {
    if (!availability.isAvailable) continue;

    const date = availability.startsAt.slice(0, 10);
    const startTime = availability.startsAt.slice(11, 16);
    const endTime = availability.endsAt.slice(11, 16);
    const start = timeToMinutes(startTime);
    const end = timeToMinutes(endTime);

    if (!days.has(date)) days.set(date, []);

    for (let time = start; time + 60 <= end; time += 180) {
      const label = minutesToTime(time);
      const endLabel = minutesToTime(time + 60);
      days.get(date)?.push({
        label,
        instructorId: availability.instructorId,
        startsAt: `${date}T${label}:00.000Z`,
        endsAt: `${date}T${endLabel}:00.000Z`
      });
    }
  }

  return Array.from(days.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, daySlots]) => {
      const uniqueSlots = new Map<string, SlotOption>();
      for (const slot of daySlots.sort((left, right) => left.label.localeCompare(right.label))) {
        if (!uniqueSlots.has(slot.label)) uniqueSlots.set(slot.label, slot);
      }

      return {
      day: formatDayLabel(date),
      date: date.slice(8, 10),
      slots: Array.from(uniqueSlots.values())
      };
    })
    .filter((day) => day.slots.length > 0)
    .slice(0, 5);
}

export function BookingCalendar() {
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState(fallbackDays[0].slots[0].label);
  const [selectedMeetingPoint, setSelectedMeetingPoint] = useState(meetingPoints[0]?.id ?? "");
  const [remoteDays, setRemoteDays] = useState<CalendarDay[] | null>(null);
  const [bookingMessage, setBookingMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSlots() {
      try {
        const response = await fetch("/api/bookings/slots", { signal: controller.signal });
        if (!response.ok) return;

        const payload = (await response.json()) as { data?: Availability[] };
        const nextDays = buildCalendarDays(payload.data ?? []);
        if (nextDays.length > 0) {
          setRemoteDays(nextDays);
          setSelectedDay(0);
          setSelectedSlot(nextDays[0].slots[0].label);
        }
      } catch {
        if (!controller.signal.aborted) {
          setRemoteDays(null);
        }
      }
    }

    loadSlots();

    return () => controller.abort();
  }, []);

  const availableDays = useMemo(() => remoteDays ?? fallbackDays, [remoteDays]);
  const day = availableDays[selectedDay] ?? availableDays[0];
  const slot = day.slots.find((item) => item.label === selectedSlot) ?? day.slots[0];

  const createBooking = async () => {
    setBookingMessage(null);

    if (!slot?.instructorId || !slot.startsAt || !slot.endsAt) {
      setBookingMessage({ tone: "error", text: "Les créneaux API sont momentanément indisponibles." });
      return;
    }

    setSubmitting(true);

    try {
      // Auth via le cookie httpOnly (envoyé automatiquement en same-origin).
      const studentResponse = await fetch("/api/students/me");
      if (studentResponse.status === 401) {
        setBookingMessage({ tone: "error", text: "Connecte-toi à ton espace élève pour réserver ce créneau." });
        return;
      }
      if (!studentResponse.ok) throw new Error("Student profile unavailable");
      const studentPayload = await studentResponse.json() as { data?: { formationId?: string | null } | null };

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instructorId: slot.instructorId,
          formationId: studentPayload.data?.formationId ?? "formation-permis-b-manuel",
          meetingPointId: selectedMeetingPoint,
          startsAt: slot.startsAt,
          endsAt: slot.endsAt
        })
      });

      if (response.status === 401) {
        setBookingMessage({ tone: "error", text: "Connecte-toi à ton espace élève pour réserver ce créneau." });
        return;
      }
      const payload = await response.json().catch(() => null) as { error?: { message?: string } } | null;
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Réservation impossible pour ce créneau.");
      }

      const pointName = meetingPoints.find((point) => point.id === selectedMeetingPoint)?.name ?? "";
      setBookingMessage({
        tone: "success",
        text: `Créneau ${day.day} ${day.date} à ${slot.label} réservé${pointName ? ` · RDV ${pointName}` : ""}. Statut : en attente de confirmation.`
      });
    } catch (error) {
      setBookingMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "Réservation impossible pour ce créneau."
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-premium">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-loden-ink">Réserver une leçon</h3>
          <p className="mt-1 text-sm text-loden-muted">Créneaux disponibles synchronisés avec le planning LODENE.</p>
        </div>
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-loden-50 text-loden-700">
          <CalendarCheck className="h-6 w-6" />
        </span>
      </div>
      <div className="mt-6 grid grid-cols-5 gap-2">
        {availableDays.map((item, index) => (
          <button
            type="button"
            key={`${item.day}-${item.date}`}
            onClick={() => {
              setSelectedDay(index);
              setSelectedSlot(item.slots[0].label);
              setBookingMessage(null);
            }}
            className={`focus-ring rounded-2xl border p-3 text-center transition ${selectedDay === index ? "border-loden-400 bg-loden-50 text-loden-800" : "border-slate-200 text-loden-muted hover:border-loden-200"}`}
          >
            <span className="block text-xs font-semibold uppercase">{item.day}</span>
            <span className="mt-1 block text-xl font-semibold">{item.date}</span>
          </button>
        ))}
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {day.slots.map((item) => (
          <button
            type="button"
            key={item.label}
            onClick={() => {
              setSelectedSlot(item.label);
              setBookingMessage(null);
            }}
            className={`focus-ring rounded-2xl border px-4 py-3 text-sm font-semibold transition ${selectedSlot === item.label ? "border-loden-700 bg-loden-700 text-white" : "border-slate-200 text-loden-muted hover:border-loden-200"}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="mt-6" hidden={meetingPoints.length === 0}>
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-loden-muted">
          <MapPin className="h-4 w-4 text-loden-600" aria-hidden="true" />
          Point de rendez-vous
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Point de rendez-vous">
          {meetingPoints.map((point) => {
            const active = selectedMeetingPoint === point.id;

            return (
              <button
                type="button"
                key={point.id}
                role="radio"
                aria-checked={active}
                onClick={() => {
                  setSelectedMeetingPoint(point.id);
                  setBookingMessage(null);
                }}
                className={`focus-ring rounded-2xl border px-4 py-3 text-left transition ${active ? "border-loden-700 bg-loden-50" : "border-slate-200 hover:border-loden-200"}`}
              >
                <span className="block text-sm font-semibold text-loden-ink">{point.name}</span>
                <span className="mt-0.5 block text-xs text-loden-muted">{point.address}</span>
              </button>
            );
          })}
        </div>
      </div>
      <button
        type="button"
        onClick={createBooking}
        disabled={submitting || bookingMessage?.tone === "success"}
        className="focus-ring mt-6 w-full rounded-full bg-loden-700 px-5 py-4 font-semibold text-white transition hover:bg-loden-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitting ? "Réservation..." : `Réserver ${day.day} ${day.date} à ${selectedSlot}`}
      </button>
      {bookingMessage ? (
        <p className={`mt-4 rounded-2xl p-4 text-sm font-medium ${bookingMessage.tone === "success" ? "bg-loden-50 text-loden-800" : "bg-red-50 text-red-700"}`}>
          {bookingMessage.text}
        </p>
      ) : null}
    </div>
  );
}
