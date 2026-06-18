"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarCheck, ClipboardList, GraduationCap, LogOut, UserRound } from "lucide-react";

type User = { firstName: string; lastName: string; email: string; role: string };
type Booking = { id: string; startsAt: string; status: string };
type Exam = { id: string; type: string; scheduledAt: string; center?: string | null; result: string };

type DashboardState =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "forbidden" }
  | { status: "ready"; user: User; bookings: Booking[]; exams: Exam[] }
  | { status: "error"; message: string };

// Rôles autorisés à consulter l'espace formateur (moniteur + encadrement).
const ALLOWED = ["MONITEUR", "RESPONSABLE_PEDAGOGIQUE", "RESPONSABLE_AGENCE", "DIRECTEUR", "ADMIN", "SUPER_ADMIN"];

export function InstructorDashboard() {
  const [state, setState] = useState<DashboardState>({ status: "loading" });

  useEffect(() => {
    async function load() {
      try {
        const meResponse = await fetch("/api/auth/me");
        if (meResponse.status === 401) {
          setState({ status: "anonymous" });
          return;
        }
        if (!meResponse.ok) throw new Error("auth");
        const me = (await meResponse.json()) as { user: User };

        if (!ALLOWED.includes(me.user.role)) {
          setState({ status: "forbidden" });
          return;
        }

        // Le moniteur a les droits bookings.read / exams.read ; on tolère un 403
        // éventuel par flux (on affiche ce qui est accessible).
        const [bookingsResponse, examsResponse] = await Promise.all([fetch("/api/bookings"), fetch("/api/exams")]);
        const bookings = bookingsResponse.ok ? (((await bookingsResponse.json()) as { data?: Booking[] }).data ?? []) : [];
        const exams = examsResponse.ok ? (((await examsResponse.json()) as { data?: Exam[] }).data ?? []) : [];

        setState({ status: "ready", user: me.user, bookings, exams });
      } catch {
        setState({ status: "error", message: "Impossible de charger l'espace formateur pour le moment." });
      }
    }

    load();
  }, []);

  if (state.status === "loading") {
    return <Panel title="Chargement de l'espace formateur" text="Synchronisation du planning et des examens..." />;
  }

  if (state.status === "anonymous") {
    return (
      <Panel title="Connexion requise" text="Connecte-toi avec ton compte formateur pour accéder à ton planning.">
        <Link className="focus-ring mt-5 inline-flex rounded-full bg-loden-700 px-5 py-3 font-semibold text-white" href="/connexion">
          Me connecter
        </Link>
      </Panel>
    );
  }

  if (state.status === "forbidden") {
    return (
      <Panel title="Espace réservé aux formateurs" text="Ton compte n'a pas le rôle formateur. Si tu es élève, rejoins ton espace dédié.">
        <Link className="focus-ring mt-5 inline-flex rounded-full bg-loden-700 px-5 py-3 font-semibold text-white" href="/espace-eleve">
          Aller à l&apos;espace élève
        </Link>
      </Panel>
    );
  }

  if (state.status === "error") {
    return <Panel title="Espace indisponible" text={state.message} />;
  }

  const now = Date.now();
  const upcomingBookings = state.bookings
    .filter((booking) => new Date(booking.startsAt).getTime() >= now)
    .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime());
  const upcomingExams = state.exams
    .filter((exam) => exam.result === "EN_ATTENTE")
    .sort((left, right) => new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime());

  return (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <Panel title={`Bonjour ${state.user.firstName}`} text="Ton espace formateur : planning des leçons et examens à venir.">
        <button
          type="button"
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            setState({ status: "anonymous" });
          }}
          className="focus-ring mt-5 inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-loden-ink hover:bg-loden-50"
        >
          <LogOut className="h-4 w-4" />
          Se déconnecter
        </button>
      </Panel>

      <div className="grid gap-4 sm:grid-cols-3">
        <Metric icon={UserRound} label="Rôle" value="Formateur" />
        <Metric icon={CalendarCheck} label="Leçons à venir" value={`${upcomingBookings.length}`} />
        <Metric icon={GraduationCap} label="Examens à venir" value={`${upcomingExams.length}`} />
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft lg:col-span-2">
        <h3 className="flex items-center gap-2 text-xl font-semibold text-loden-ink">
          <CalendarCheck className="h-5 w-5 text-loden-700" aria-hidden="true" />
          Planning des leçons
        </h3>
        {upcomingBookings.length > 0 ? (
          <ul className="mt-5 grid gap-3">
            {upcomingBookings.slice(0, 8).map((booking) => (
              <li key={booking.id} className="flex items-center justify-between gap-3 rounded-2xl bg-loden-pearl p-4">
                <span className="font-semibold text-loden-ink">{formatDate(booking.startsAt)}</span>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-loden-700 shadow-soft">
                  {humanize(booking.status)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm leading-6 text-loden-muted">Aucune leçon planifiée à venir.</p>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft lg:col-span-2">
        <h3 className="flex items-center gap-2 text-xl font-semibold text-loden-ink">
          <ClipboardList className="h-5 w-5 text-loden-700" aria-hidden="true" />
          Examens à venir
        </h3>
        {upcomingExams.length > 0 ? (
          <ul className="mt-5 grid gap-3">
            {upcomingExams.slice(0, 8).map((exam) => (
              <li key={exam.id} className="flex items-center justify-between gap-3 rounded-2xl bg-loden-pearl p-4">
                <span className="font-semibold text-loden-ink">
                  {humanize(exam.type)} · {formatDate(exam.scheduledAt)}
                </span>
                {exam.center ? <span className="text-sm text-loden-muted">{exam.center}</span> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm leading-6 text-loden-muted">Aucun examen programmé à venir.</p>
        )}
      </section>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(value));
}

function humanize(value: string) {
  return value.toLowerCase().replaceAll("_", " ");
}

function Panel({ title, text, children }: { title: string; text: string; children?: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-premium">
      <h2 className="text-2xl font-semibold text-loden-ink">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-loden-muted">{text}</p>
      {children}
    </section>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof UserRound; label: string; value: string }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <Icon className="h-6 w-6 text-loden-700" />
      <p className="mt-5 text-sm font-semibold uppercase tracking-[0.12em] text-loden-muted">{label}</p>
      <p className="mt-2 break-words text-2xl font-semibold text-loden-ink">{value}</p>
    </article>
  );
}
