"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  Award,
  Bot,
  CalendarClock,
  CalendarDays,
  CreditCard,
  FileText,
  GraduationCap,
  Inbox,
  PiggyBank,
  Sparkles,
  Star,
  Target,
  UserPlus,
  Users
} from "lucide-react";
import { ACTIVE_AGENCY_KEY } from "@/components/AgencySwitcher";
import { Badge, Card, EmptyState, KpiCard, SectionHeader, Skeleton } from "@/components/crm/ui";
import type { DonutDatum } from "./charts";

// Recharts est lourd (~100 kB) : on le code-split hors du bundle initial de /admin.
const AreaTrendChart = dynamic(() => import("./charts").then((m) => m.AreaTrendChart), {
  ssr: false,
  loading: () => <Skeleton className="h-[240px] w-full" />
});
const DonutChart = dynamic(() => import("./charts").then((m) => m.DonutChart), {
  ssr: false,
  loading: () => <Skeleton className="mx-auto h-[200px] w-[200px] rounded-full" />
});

/* ----------------------------- Types API ----------------------------- */
type Stats = {
  students: { total: number; byStatus: Record<string, number> };
  leads: { total: number; byStage: Record<string, number> };
  bookings: { upcoming: number };
  payments: { paidCents: number; pending: number };
  cpf: { pending: number };
  reviews: { pending: number };
  exams: { total: number; upcoming: number; passRate: number | null };
};
type Lead = { id: string; fullName: string; status: string; source?: string | null; interest?: string | null; createdAt: string };
type Payment = { id: string; amountCents: number; status: string; createdAt: string; paidAt?: string | null };
type Review = { id: string; rating: number; comment: string; status: string; createdAt: string };
type Booking = { id: string; status: string; startsAt: string; createdAt: string };
type Student = { id: string; createdAt: string };

/* ----------------------------- Helpers ----------------------------- */
const DAY = 86_400_000;
const euros = (cents: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(cents / 100);
const nf = (n: number) => new Intl.NumberFormat("fr-FR").format(n);

function trend(cur: number, prev: number): { value: string; direction: "up" | "down" | "flat" } {
  // Pas de base de comparaison (période précédente vide) -> aucune tendance affichée
  // (la KpiCard masque une tendance vide). On n'invente pas de badge "Nouveau".
  if (prev === 0) return { value: "", direction: cur > 0 ? "up" : "flat" };
  const pct = Math.round(((cur - prev) / prev) * 100);
  return { value: `${pct > 0 ? "+" : ""}${pct}%`, direction: pct > 0 ? "up" : pct < 0 ? "down" : "flat" };
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diff)) return "";
  const min = Math.floor(diff / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `il y a ${d} j`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

const LEAD_STAGES: { key: string; name: string; color: string }[] = [
  { key: "PROSPECT", name: "Prospect", color: "#94a3b8" },
  { key: "CONTACTE", name: "Contacté", color: "#38bdf8" },
  { key: "RELANCE", name: "Relance", color: "#f59e0b" },
  { key: "DEVIS_ENVOYE", name: "Devis envoyé", color: "#6366f1" },
  { key: "INSCRIT", name: "Inscrit", color: "#10b981" },
  { key: "PERDU", name: "Perdu", color: "#f43f5e" }
];
const STUDENT_STATUSES: { key: string; name: string; color: string }[] = [
  { key: "NOUVEAU", name: "Nouveau", color: "#94a3b8" },
  { key: "INCOMPLET", name: "Incomplet", color: "#f59e0b" },
  { key: "EN_COURS", name: "En cours", color: "#08AEB8" },
  { key: "PRET_EXAMEN", name: "Prêt examen", color: "#6366f1" },
  { key: "EXAMEN_PLANIFIE", name: "Examen planifié", color: "#0e7490" },
  { key: "TERMINE", name: "Terminé", color: "#10b981" },
  { key: "ARCHIVE", name: "Archivé", color: "#cbd5e1" }
];

/* ----------------------------- Composant ----------------------------- */
export function CrmDashboard() {
  const router = useRouter();
  const [period, setPeriod] = useState<7 | 30 | 90>(30);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [serviceDown, setServiceDown] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    let cancelled = false;
    const agency = window.localStorage.getItem(ACTIVE_AGENCY_KEY);
    const q = agency && agency !== "all" ? `?agencyId=${encodeURIComponent(agency)}` : "";
    // Listes auxiliaires : tolérantes aux pannes. Un 403 ici (ex. avis pour un rôle
    // sans reviews.read) NE doit PAS verrouiller tout le dashboard — on dégrade.
    const list = async (url: string) => {
      try {
        const r = await fetch(url);
        if (r.status === 401) {
          router.push("/connexion?redirect=/admin");
          return [];
        }
        const p = await r.json().catch(() => null);
        return Array.isArray(p?.data) ? p.data : [];
      } catch {
        return [];
      }
    };

    // Endpoint cœur : c'est LUI seul qui détermine l'accès (dashboard.read).
    const fetchStats = async (): Promise<Stats | null> => {
      try {
        const r = await fetch(`/api/admin/stats${q}`);
        if (r.status === 401) {
          router.push("/connexion?redirect=/admin");
          return null;
        }
        if (r.status === 403) {
          setDenied(true);
          return null;
        }
        if (!r.ok) {
          setServiceDown(true);
          return null;
        }
        const p = await r.json().catch(() => null);
        return (p?.data as Stats) ?? null;
      } catch {
        setServiceDown(true);
        return null;
      }
    };

    (async () => {
      try {
        const [meRes, statsData, leadsRes, paymentsRes, reviewsRes, bookingsRes, studentsRes] = await Promise.all([
          fetch(`/api/auth/me`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetchStats(),
          list(`/api/leads${q}`),
          list(`/api/payments${q}`),
          list(`/api/reviews?includeUnpublished=true`),
          list(`/api/bookings${q}`),
          list(`/api/students${q}`)
        ]);
        if (cancelled) return;
        if (meRes?.user?.firstName) setFirstName(meRes.user.firstName as string);
        if (statsData) setStats(statsData);
        setLeads(leadsRes);
        setPayments(paymentsRes);
        setReviews(reviewsRes);
        setBookings(bookingsRes);
        setStudents(studentsRes);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  /* --------- Séries temporelles dérivées (vraies dates) --------- */
  const series = useMemo(() => {
    const now = Date.now();
    const start = new Date(now - (period - 1) * DAY);
    start.setHours(0, 0, 0, 0);
    const buckets = Array.from({ length: period }, (_, i) => {
      const d = new Date(start.getTime() + i * DAY);
      return { label: `${d.getDate()}/${d.getMonth() + 1}`, leads: 0, inscriptions: 0, ca: 0 };
    });
    const idx = (iso?: string | null) => {
      if (!iso) return -1;
      const t = new Date(iso).getTime();
      if (Number.isNaN(t)) return -1;
      const i = Math.floor((t - start.getTime()) / DAY);
      return i >= 0 && i < period ? i : -1;
    };
    leads.forEach((l) => {
      const i = idx(l.createdAt);
      if (i >= 0) buckets[i].leads += 1;
    });
    students.forEach((s) => {
      const i = idx(s.createdAt);
      if (i >= 0) buckets[i].inscriptions += 1;
    });
    payments
      .filter((p) => p.status === "PAYE")
      .forEach((p) => {
        const i = idx(p.paidAt ?? p.createdAt);
        if (i >= 0) buckets[i].ca += p.amountCents / 100;
      });
    return buckets;
  }, [leads, students, payments, period]);

  const activityTotal = series.reduce((s, b) => s + b.leads + b.inscriptions, 0);
  const caTotal = series.reduce((s, b) => s + b.ca, 0);

  /* --------- Tendances 7j vs 7j précédents --------- */
  const now = Date.now();
  const countWin = (arr: { createdAt: string }[], from: number, to: number) =>
    arr.filter((x) => {
      const t = new Date(x.createdAt).getTime();
      return t >= now - from * DAY && t < now - to * DAY;
    }).length;
  const sumPaid = (from: number, to: number) =>
    payments
      .filter((p) => p.status === "PAYE")
      .filter((p) => {
        const t = new Date(p.paidAt ?? p.createdAt).getTime();
        return t >= now - from * DAY && t < now - to * DAY;
      })
      .reduce((s, p) => s + p.amountCents, 0);

  const leadsTrend = trend(countWin(leads, 7, 0), countWin(leads, 14, 7));
  const inscTrend = trend(countWin(students, 7, 0), countWin(students, 14, 7));
  const caTrend = trend(sumPaid(7, 0), sumPaid(14, 7));

  /* --------- Donuts (réels) --------- */
  const pipelineDonut: DonutDatum[] = LEAD_STAGES.map((s) => ({
    name: s.name,
    value: stats?.leads.byStage[s.key] ?? 0,
    color: s.color
  })).filter((d) => d.value > 0);
  const studentDonut: DonutDatum[] = STUDENT_STATUSES.map((s) => ({
    name: s.name,
    value: stats?.students.byStatus[s.key] ?? 0,
    color: s.color
  })).filter((d) => d.value > 0);

  /* --------- Flux d'activité --------- */
  type Feed = { id: string; icon: typeof UserPlus; title: string; detail: string; date: string; href: string; tone: string };
  const feed: Feed[] = useMemo(() => {
    const items: Feed[] = [];
    leads.slice(0, 12).forEach((l) =>
      items.push({
        id: `l-${l.id}`,
        icon: UserPlus,
        title: l.fullName,
        detail: `Nouveau lead · ${l.source || l.interest || "Formulaire"}`,
        date: l.createdAt,
        href: "/admin/pipeline",
        tone: "bg-indigo-50 text-indigo-600"
      })
    );
    payments.slice(0, 12).forEach((p) =>
      items.push({
        id: `p-${p.id}`,
        icon: CreditCard,
        title: euros(p.amountCents),
        detail: `Paiement ${p.status === "PAYE" ? "reçu" : p.status.toLowerCase()}`,
        date: p.paidAt ?? p.createdAt,
        href: "/admin/finance",
        tone: "bg-emerald-50 text-emerald-600"
      })
    );
    reviews.slice(0, 12).forEach((r) =>
      items.push({
        id: `r-${r.id}`,
        icon: Star,
        title: `Avis ${r.rating}/5`,
        detail: r.comment?.slice(0, 48) || "Nouvel avis client",
        date: r.createdAt,
        href: "/admin/avis",
        tone: "bg-amber-50 text-amber-600"
      })
    );
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);
  }, [leads, payments, reviews]);

  /* --------- Tâches prioritaires (réelles) --------- */
  const tasks = [
    { icon: Target, label: "Relances commerciales", count: stats?.leads.byStage.RELANCE ?? 0, href: "/admin/pipeline", tone: "text-amber-600" },
    { icon: CreditCard, label: "Paiements en attente", count: stats?.payments.pending ?? 0, href: "/admin/finance", tone: "text-rose-600" },
    { icon: PiggyBank, label: "Dossiers CPF à traiter", count: stats?.cpf.pending ?? 0, href: "/admin/cpf", tone: "text-indigo-600" },
    { icon: Star, label: "Avis à modérer", count: stats?.reviews.pending ?? 0, href: "/admin/avis", tone: "text-amber-600" },
    { icon: CalendarClock, label: "Réservations à confirmer", count: bookings.filter((b) => b.status === "EN_ATTENTE").length, href: "/admin/rendez-vous?view=planning", tone: "text-sky-600" }
  ];
  const openTasks = tasks.filter((t) => t.count > 0);

  /* --------- Agenda du jour / à venir --------- */
  const upcoming = bookings
    .filter((b) => b.status !== "ANNULEE" && new Date(b.startsAt).getTime() >= now - DAY)
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
    .slice(0, 5);

  /* ----------------------------- Rendu ----------------------------- */
  if (denied) {
    return (
      <Card className="p-10">
        <EmptyState
          icon={Users}
          title="Accès restreint"
          description="Votre rôle ne dispose pas des permissions du tableau de bord. Contactez un administrateur."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {serviceDown ? (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          <span aria-hidden="true">⚠️</span>
          Le service d&apos;indicateurs est momentanément indisponible — certaines données peuvent manquer.
        </div>
      ) : null}
      {/* En-tête */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-loden-ink">
            Bonjour{firstName ? ` ${firstName}` : ""} <span aria-hidden="true">👋</span>
          </h1>
          <p className="mt-1 text-sm text-loden-muted">
            {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            {" · "}Vue d&apos;ensemble de l&apos;activité LODENE.
          </p>
        </div>
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-soft">
          {([7, 30, 90] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`focus-ring rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                period === p ? "bg-loden-700 text-white shadow-soft" : "text-loden-muted hover:text-loden-ink"
              }`}
            >
              {p}J
            </button>
          ))}
        </div>
      </div>

      {/* ZONE 1 — KPIs (cartes compactes : 1 col mobile · 2 tablette · 4 desktop) */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={GraduationCap} href="/admin/eleves" label="Élèves" value={loading ? "" : nf(stats?.students.total ?? 0)} loading={loading} accent="brand" trend={loading ? undefined : inscTrend} subLabel={`${stats?.students.byStatus.EN_COURS ?? 0} en cours`} />
        <KpiCard icon={Target} href="/admin/pipeline" label="Leads" value={loading ? "" : nf(stats?.leads.total ?? 0)} loading={loading} accent="indigo" trend={loading ? undefined : leadsTrend} subLabel={`${stats?.leads.byStage.PROSPECT ?? 0} nouveaux`} />
        <KpiCard icon={CalendarDays} href="/admin/rendez-vous?view=planning" label="Leçons à venir" value={loading ? "" : nf(stats?.bookings.upcoming ?? 0)} loading={loading} accent="sky" />
        <KpiCard icon={CreditCard} href="/admin/finance" label="CA encaissé" value={loading ? "" : euros(stats?.payments.paidCents ?? 0)} loading={loading} accent="emerald" trend={loading ? undefined : caTrend} />
        <KpiCard icon={FileText} href="/admin/finance" label="Paiements en attente" value={loading ? "" : nf(stats?.payments.pending ?? 0)} loading={loading} accent="amber" />
        <KpiCard icon={Award} href="/admin/examens" label="Taux de réussite" value={loading ? "" : stats?.exams.passRate === null || stats?.exams.passRate === undefined ? "—" : `${stats.exams.passRate}%`} loading={loading} accent="brand" subLabel={`${stats?.exams.upcoming ?? 0} examen(s) à venir`} />
        <KpiCard icon={PiggyBank} href="/admin/cpf" label="CPF en cours" value={loading ? "" : nf(stats?.cpf.pending ?? 0)} loading={loading} accent="indigo" />
        <KpiCard icon={Star} href="/admin/avis" label="Avis à modérer" value={loading ? "" : nf(stats?.reviews.pending ?? 0)} loading={loading} accent="rose" />
      </div>

      {/* ZONE 2 — Analyse visuelle */}
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="flex flex-col p-5 xl:col-span-2">
          <SectionHeader title="Évolution de l'activité" subtitle={`Leads & inscriptions · ${period} derniers jours`} icon={Activity} />
          <div className="mt-4 flex-1">
            {loading ? (
              <Skeleton className="h-[240px] w-full" />
            ) : activityTotal === 0 ? (
              <EmptyState icon={Activity} title="Pas encore d'activité" description="Les courbes se rempliront dès les premiers leads et inscriptions." />
            ) : (
              <AreaTrendChart
                data={series}
                series={[
                  { key: "leads", name: "Leads", color: "#6366f1" },
                  { key: "inscriptions", name: "Inscriptions", color: "#08AEB8" }
                ]}
              />
            )}
          </div>
        </Card>
        <Card className="flex flex-col p-5">
          <SectionHeader title="Pipeline commercial" subtitle="Répartition des leads par étape" icon={Target} />
          <div className="mt-4 flex flex-1 items-center">
            {loading ? (
              <Skeleton className="mx-auto h-[200px] w-[200px] rounded-full" />
            ) : pipelineDonut.length === 0 ? (
              <EmptyState icon={Target} title="Aucun lead" description="Le pipeline apparaîtra ici dès la première demande entrante." />
            ) : (
              <DonutChart data={pipelineDonut} total={stats?.leads.total ?? 0} centerLabel="leads" />
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="flex flex-col p-5 xl:col-span-2">
          <SectionHeader title="Chiffre d'affaires encaissé" subtitle={`Paiements confirmés · ${period} derniers jours`} icon={CreditCard} action={<Badge variant="success">{euros(caTotal * 100)}</Badge>} />
          <div className="mt-4 flex-1">
            {loading ? (
              <Skeleton className="h-[240px] w-full" />
            ) : caTotal === 0 ? (
              <EmptyState icon={CreditCard} title="Aucun encaissement" description="Le chiffre d'affaires s'affichera dès le premier paiement confirmé." />
            ) : (
              <AreaTrendChart data={series} series={[{ key: "ca", name: "CA", color: "#10b981", format: "euro" }]} />
            )}
          </div>
        </Card>
        <Card className="flex flex-col p-5">
          <SectionHeader title="Dossiers élèves" subtitle="Répartition par statut" icon={GraduationCap} />
          <div className="mt-4 flex flex-1 items-center">
            {loading ? (
              <Skeleton className="mx-auto h-[200px] w-[200px] rounded-full" />
            ) : studentDonut.length === 0 ? (
              <EmptyState icon={GraduationCap} title="Aucun élève" description="Les statuts de dossiers apparaîtront ici." />
            ) : (
              <DonutChart data={studentDonut} total={stats?.students.total ?? 0} centerLabel="élèves" />
            )}
          </div>
        </Card>
      </div>

      {/* ZONE 3/4/5 — Activité, Tâches, Agenda */}
      <div className="grid gap-4 xl:grid-cols-3">
        {/* Activité récente */}
        <Card className="p-5">
          <SectionHeader title="Activité récente" icon={Activity} />
          <div className="mt-4">
            {loading ? (
              <div className="space-y-3">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-xl" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3 w-2/3" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : feed.length === 0 ? (
              <EmptyState icon={Inbox} title="Rien de neuf" description="Les dernières actions (leads, paiements, avis) s'afficheront ici." compact />
            ) : (
              <ul className="space-y-1">
                {feed.map((f) => {
                  const Icon = f.icon;
                  return (
                    <li key={f.id}>
                      <Link href={f.href} className="flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-slate-50">
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${f.tone}`}>
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-loden-ink">{f.title}</span>
                          <span className="block truncate text-xs text-loden-muted">{f.detail}</span>
                        </span>
                        <span className="shrink-0 text-xs text-loden-muted">{timeAgo(f.date)}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Card>

        {/* Tâches prioritaires */}
        <Card className="p-5">
          <SectionHeader title="Tâches prioritaires" icon={Inbox} />
          <div className="mt-4">
            {loading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-xl" />
                ))}
              </div>
            ) : openTasks.length === 0 ? (
              <EmptyState icon={Award} title="Tout est à jour 🎉" description="Aucune action en attente pour le moment." compact />
            ) : (
              <ul className="space-y-2">
                {openTasks.map((t) => {
                  const Icon = t.icon;
                  return (
                    <li key={t.label}>
                      <Link
                        href={t.href}
                        className="flex items-center gap-3 rounded-xl border border-slate-200/70 px-3 py-2.5 transition hover:border-loden-200 hover:bg-loden-50/40"
                      >
                        <Icon className={`h-[18px] w-[18px] shrink-0 ${t.tone}`} aria-hidden="true" />
                        <span className="flex-1 text-sm font-medium text-loden-ink">{t.label}</span>
                        <span className="rounded-full bg-loden-700 px-2 py-0.5 text-xs font-bold text-white">{t.count}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Card>

        {/* Agenda */}
        <Card className="p-5">
          <SectionHeader title="Prochaines leçons" icon={CalendarClock} action={<Link href="/admin/rendez-vous?view=planning" className="text-xs font-semibold text-loden-700 hover:underline">Planning</Link>} />
          <div className="mt-4">
            {loading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-xl" />
                ))}
              </div>
            ) : upcoming.length === 0 ? (
              <EmptyState icon={CalendarDays} title="Agenda vide" description="Les prochaines leçons planifiées apparaîtront ici." compact />
            ) : (
              <ul className="space-y-2">
                {upcoming.map((b) => {
                  const d = new Date(b.startsAt);
                  return (
                    <li key={b.id} className="flex items-center gap-3 rounded-xl border border-slate-200/70 px-3 py-2.5">
                      <span className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-loden-50 text-loden-700">
                        <span className="text-sm font-bold leading-none">{d.getDate()}</span>
                        <span className="text-[10px] uppercase">{d.toLocaleDateString("fr-FR", { month: "short" })}</span>
                      </span>
                      <span className="flex-1">
                        <span className="block text-sm font-medium text-loden-ink">
                          {d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span className="block text-xs text-loden-muted">Leçon de conduite</span>
                      </span>
                      <Badge variant={b.status === "CONFIRMEE" ? "success" : "warning"}>
                        {b.status === "CONFIRMEE" ? "Confirmée" : "À confirmer"}
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Card>
      </div>

      {/* ZONE 6 — Centre IA */}
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-5 bg-gradient-to-br from-loden-700 to-loden-800 p-6 text-white sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <Bot className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-bold">Assistant IA LODENE</h2>
              <p className="mt-1 max-w-xl text-sm text-white/85">
                Résumé d&apos;activité, détection des prospects chauds, génération d&apos;emails et de SMS, recommandations de relance.
              </p>
            </div>
          </div>
          <Link
            href="/admin/assistant"
            className="focus-ring inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-loden-800 transition hover:bg-loden-pearl"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Ouvrir l&apos;assistant
          </Link>
        </div>
        <div className="grid gap-px bg-slate-100 sm:grid-cols-3">
          {[
            { label: "Résumer l'activité du jour", icon: Activity },
            { label: "Identifier les prospects chauds", icon: Target },
            { label: "Préparer mes relances", icon: Sparkles }
          ].map((a) => {
            const Icon = a.icon;
            return (
              <Link key={a.label} href="/admin/assistant" className="flex items-center gap-3 bg-white px-5 py-4 text-sm font-medium text-loden-ink transition hover:bg-loden-50/50">
                <Icon className="h-4 w-4 text-loden-600" aria-hidden="true" />
                {a.label}
              </Link>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
