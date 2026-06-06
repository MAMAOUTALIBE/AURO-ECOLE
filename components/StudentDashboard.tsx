"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarCheck, CreditCard, GraduationCap, LogOut, UserRound } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type User = {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
};

type Student = {
  formationId?: string | null;
  progressPercent: number;
  purchasedHours: number;
  consumedHours: number;
  fileStatus: string;
};

type Booking = {
  id: string;
  startsAt: string;
  status: string;
};

type Payment = {
  id: string;
  pricingPlanId?: string | null;
  status: string;
  amountCents: number;
  currency: string;
  createdAt: string;
};

type DashboardState =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "ready"; user: User; student: Student | null; bookings: Booking[]; payments: Payment[] }
  | { status: "error"; message: string };

export function StudentDashboard() {
  const [state, setState] = useState<DashboardState>({ status: "loading" });

  useEffect(() => {
    const token = window.localStorage.getItem("loden_student_token");

    if (!token) {
      setState({ status: "anonymous" });
      return;
    }

    async function loadDashboard() {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [meResponse, studentResponse, bookingsResponse, paymentsResponse] = await Promise.all([
          fetch("/api/auth/me", { headers }),
          fetch("/api/students/me", { headers }),
          fetch("/api/bookings", { headers }),
          fetch("/api/payments", { headers })
        ]);

        if (
          meResponse.status === 401 ||
          studentResponse.status === 401 ||
          bookingsResponse.status === 401 ||
          paymentsResponse.status === 401
        ) {
          window.localStorage.removeItem("loden_student_token");
          setState({ status: "anonymous" });
          return;
        }

        if (!meResponse.ok || !studentResponse.ok || !bookingsResponse.ok || !paymentsResponse.ok) {
          throw new Error("Dashboard request failed");
        }

        const mePayload = await meResponse.json() as { user: User };
        const studentPayload = await studentResponse.json() as { data: Student | null };
        const bookingsPayload = await bookingsResponse.json() as { data: Booking[] };
        const paymentsPayload = await paymentsResponse.json() as { data?: Payment[] };
        setState({
          status: "ready",
          user: mePayload.user,
          student: studentPayload.data,
          bookings: bookingsPayload.data,
          payments: paymentsPayload.data ?? []
        });
      } catch {
        setState({ status: "error", message: "Impossible de charger ton espace élève pour le moment." });
      }
    }

    loadDashboard();
  }, []);

  if (state.status === "loading") {
    return <Panel title="Chargement de ton espace" text="Synchronisation du profil élève LODEN..." />;
  }

  if (state.status === "anonymous") {
    return (
      <Panel title="Connexion requise" text="Connecte-toi ou crée ton compte élève pour accéder à ton suivi.">
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Link className="focus-ring rounded-full bg-loden-700 px-5 py-3 text-center font-semibold text-white" href="/connexion">
            Me connecter
          </Link>
          <Link className="focus-ring rounded-full border border-slate-200 px-5 py-3 text-center font-semibold text-loden-ink" href="/inscription">
            Créer un compte
          </Link>
        </div>
      </Panel>
    );
  }

  if (state.status === "error") {
    return <Panel title="Espace indisponible" text={state.message} />;
  }

  const student = state.student;
  const payments = state.payments ?? [];
  const remainingHours = Math.max((student?.purchasedHours ?? 0) - (student?.consumedHours ?? 0), 0);
  const nextBooking = state.bookings
    .slice()
    .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime())[0];
  const latestPayment = payments
    .slice()
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())[0];

  return (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <Panel title={`Bonjour ${state.user.firstName}`} text="Ton espace élève est prêt pour le suivi LODEN.">
        <button
          type="button"
          onClick={() => {
            window.localStorage.removeItem("loden_student_token");
            setState({ status: "anonymous" });
          }}
          className="focus-ring mt-5 inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-loden-ink hover:bg-loden-50"
        >
          <LogOut className="h-4 w-4" />
          Se déconnecter
        </button>
      </Panel>

      <div className="grid gap-4 sm:grid-cols-2">
        <Metric icon={UserRound} label="Profil" value={state.user.role === "ELEVE" ? "Élève" : state.user.role} />
        <Metric icon={GraduationCap} label="Formation" value={student?.formationId ?? "À confirmer"} />
        <Metric icon={CalendarCheck} label="Heures restantes" value={`${remainingHours} h`} />
        <Metric icon={GraduationCap} label="Progression" value={`${student?.progressPercent ?? 0} %`} />
        <Metric icon={CreditCard} label="Paiements" value={`${payments.length}`} />
      </div>
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft lg:col-span-2">
        <h3 className="text-xl font-semibold text-loden-ink">Réservations</h3>
        {nextBooking ? (
          <p className="mt-3 text-sm leading-6 text-loden-muted">
            Prochain créneau : {formatBookingDate(nextBooking.startsAt)} · {formatBookingStatus(nextBooking.status)}
          </p>
        ) : (
          <p className="mt-3 text-sm leading-6 text-loden-muted">
            Aucun créneau réservé pour le moment. Choisis un horaire depuis le calendrier d&apos;accueil.
          </p>
        )}
      </section>
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft lg:col-span-2">
        <h3 className="text-xl font-semibold text-loden-ink">Paiements</h3>
        {latestPayment ? (
          <p className="mt-3 text-sm leading-6 text-loden-muted">
            Dernière intention : {formatCurrency(latestPayment.amountCents / 100)} · {formatBookingStatus(latestPayment.status)}
          </p>
        ) : (
          <div className="mt-3 text-sm leading-6 text-loden-muted">
            Aucun paiement préparé pour le moment.
            <Link className="ml-1 font-semibold text-loden-700 underline-offset-4 hover:underline" href="/tarifs">
              Choisir un pack
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}

function formatBookingDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC"
  }).format(new Date(value));
}

function formatBookingStatus(value: string) {
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
