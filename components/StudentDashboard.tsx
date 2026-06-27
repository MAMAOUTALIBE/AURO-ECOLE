"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  CreditCard,
  FileText,
  GraduationCap,
  LogOut,
  MessageCircle,
  UserRound
} from "lucide-react";
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
    async function loadDashboard() {
      try {
        // Auth via cookie httpOnly (envoyé automatiquement en same-origin).
        const [meResponse, studentResponse, bookingsResponse, paymentsResponse] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/students/me"),
          fetch("/api/bookings"),
          fetch("/api/payments")
        ]);

        if (
          meResponse.status === 401 ||
          studentResponse.status === 401 ||
          bookingsResponse.status === 401 ||
          paymentsResponse.status === 401
        ) {
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
    return <Panel title="Chargement de ton espace" text="Synchronisation du profil élève LODENE..." />;
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
  const progressPercent = student?.progressPercent ?? 0;
  const purchasedHours = student?.purchasedHours ?? 0;
  const consumedHours = student?.consumedHours ?? 0;
  const fileStatus = student?.fileStatus ?? "NOUVEAU";

  return (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <Panel title={`Bonjour ${state.user.firstName}`} text="Ton espace élève est prêt pour le suivi LODENE.">
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

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        <Metric icon={UserRound} label="Profil" value={state.user.role === "ELEVE" ? "Élève" : state.user.role} />
        <Metric icon={GraduationCap} label="Formation" value={student?.formationId ?? "À confirmer"} />
        <Metric icon={CalendarCheck} label="Heures restantes" value={`${remainingHours} h`} />
        <Metric icon={GraduationCap} label="Progression" value={`${progressPercent} %`} />
        <Metric icon={CreditCard} label="Paiements" value={`${payments.length}`} />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft sm:rounded-3xl sm:p-6 lg:col-span-2">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div>
            <h3 className="text-xl font-semibold text-loden-ink">Progression pédagogique</h3>
            <p className="mt-2 text-sm leading-6 text-loden-muted">
              Suivi synthétique de ton dossier, de tes heures et des prochaines étapes avant examen.
            </p>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-loden-fog">
              <div className="h-full rounded-full bg-loden-600" style={{ width: `${Math.min(progressPercent, 100)}%` }} />
            </div>
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
              <StatusPill label="Dossier" value={formatFileStatus(fileStatus)} />
              <StatusPill label="Heures faites" value={`${consumedHours} h`} />
              <StatusPill label="Heures achetées" value={`${purchasedHours} h`} />
            </div>
          </div>
          <div className="rounded-3xl bg-loden-pearl p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-loden-700">Prochaine action</p>
            <h4 className="mt-2 text-lg font-semibold text-loden-ink">{getNextAction(student, nextBooking, latestPayment)}</h4>
            <p className="mt-2 text-sm leading-6 text-loden-muted">
              L&apos;espace élève sert de checklist pour ne pas perdre le fil entre inscription, paiement, leçons et examen.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft sm:rounded-3xl sm:p-6 lg:col-span-2">
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
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft sm:rounded-3xl sm:p-6 lg:col-span-2">
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

      <section className="grid gap-4 lg:col-span-2 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft sm:rounded-3xl sm:p-6">
          <h3 className="text-xl font-semibold text-loden-ink">Documents à préparer</h3>
          <div className="mt-5 grid gap-3">
            {["Pièce d'identité", "Justificatif de domicile", "Photo signature numérique", "Attestation ASSR ou JDC"].map((item, index) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl bg-loden-pearl p-4">
                {index === 0 && fileStatus !== "NOUVEAU" ? (
                  <CheckCircle2 className="h-5 w-5 text-loden-600" aria-hidden="true" />
                ) : (
                  <FileText className="h-5 w-5 text-loden-600" aria-hidden="true" />
                )}
                <span className="text-sm font-semibold text-loden-ink">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft sm:rounded-3xl sm:p-6">
          <h3 className="text-xl font-semibold text-loden-ink">Accès rapides</h3>
          <div className="mt-5 grid gap-3">
            <QuickAction href="/#reservation" icon={CalendarCheck} label="Réserver une leçon" />
            <QuickAction href="/paiement" icon={CreditCard} label="Préparer un paiement" />
            <QuickAction href="/contact" icon={MessageCircle} label="Contacter un conseiller" />
          </div>
        </div>
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

function formatFileStatus(value: string) {
  return value.toLowerCase().replaceAll("_", " ");
}

function getNextAction(student: Student | null, nextBooking: Booking | undefined, latestPayment: Payment | undefined) {
  if (!student) return "Finaliser ton profil élève";
  if (student.fileStatus === "NOUVEAU" || student.fileStatus === "INCOMPLET") return "Compléter ton dossier administratif";
  if (!latestPayment) return "Choisir un pack ou préparer un paiement";
  if (!nextBooking) return "Réserver ta prochaine leçon";
  if ((student.progressPercent ?? 0) >= 80) return "Préparer la présentation à l'examen";
  return "Continuer les leçons planifiées";
}

function Panel({ title, text, children }: { title: string; text: string; children?: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-premium sm:rounded-3xl sm:p-6">
      <h2 className="text-xl font-semibold text-loden-ink sm:text-2xl">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-loden-muted">{text}</p>
      {children}
    </section>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof UserRound; label: string; value: string }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft sm:rounded-3xl sm:p-6">
      <Icon className="h-6 w-6 text-loden-700" />
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-loden-muted sm:mt-5 sm:text-sm">{label}</p>
      <p className="mt-2 break-words text-xl font-semibold text-loden-ink sm:text-2xl">{value}</p>
    </article>
  );
}

function StatusPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <p className="font-semibold text-loden-ink">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.1em] text-loden-muted">{label}</p>
    </div>
  );
}

function QuickAction({ href, icon: Icon, label }: { href: string; icon: typeof UserRound; label: string }) {
  return (
    <Link
      href={href}
      className="focus-ring flex items-center justify-between gap-4 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-loden-ink hover:bg-loden-50"
    >
      <span className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-loden-700" aria-hidden="true" />
        {label}
      </span>
      <ArrowRight className="h-4 w-4 text-loden-muted" aria-hidden="true" />
    </Link>
  );
}
