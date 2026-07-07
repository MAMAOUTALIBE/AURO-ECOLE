"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BadgeEuro, CheckCircle2, GraduationCap, LogOut, Send, Sparkles, UserPlus, Users } from "lucide-react";
import {
  describeCommission,
  mapApiCommission,
  type ApiPartnerCommission,
  type CommissionType,
  type PartnerCommission
} from "@/lib/partner-mappers";

type User = { firstName: string; lastName: string; email: string; role: string };
type PartnerProfile = {
  id: string;
  companyName: string;
  status: "ACTIF" | "SUSPENDU";
  commissionType: CommissionType;
  commissionValue: number;
};
type Lead = {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  status: string;
  interest?: string | null;
  createdAt: string;
};
type Learner = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  progressPercent: number;
  fileStatus: string;
  registeredAt?: string | null;
};

type DashboardState =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "forbidden" }
  | {
      status: "ready";
      user: User;
      partner: PartnerProfile;
      leads: Lead[];
      learners: Learner[];
      commissions: PartnerCommission[];
    }
  | { status: "error"; message: string };

const FILE_STATUS_LABELS: Record<string, string> = {
  NOUVEAU: "Nouveau",
  INCOMPLET: "Incomplet",
  EN_COURS: "En cours",
  PRET_EXAMEN: "Prêt examen",
  EXAMEN_PLANIFIE: "Examen planifié",
  TERMINE: "Terminé",
  ARCHIVE: "Archivé"
};

const LEAD_STATUS: Record<string, { label: string; className: string }> = {
  PROSPECT: { label: "Nouveau", className: "bg-sky-50 text-sky-700" },
  CONTACTE: { label: "Contacté", className: "bg-indigo-50 text-indigo-700" },
  RELANCE: { label: "Relancé", className: "bg-amber-50 text-amber-700" },
  DEVIS_ENVOYE: { label: "Devis envoyé", className: "bg-violet-50 text-violet-700" },
  INSCRIT: { label: "Inscrit", className: "bg-emerald-50 text-emerald-700" },
  PERDU: { label: "Perdu", className: "bg-rose-50 text-rose-700" }
};

const EMPTY_FORM = { fullName: "", email: "", phone: "", interest: "", notes: "" };

export function PartnerDashboard() {
  const [state, setState] = useState<DashboardState>({ status: "loading" });
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  async function load() {
    try {
      const meResponse = await fetch("/api/auth/me");
      if (meResponse.status === 401) {
        setState({ status: "anonymous" });
        return;
      }
      if (!meResponse.ok) throw new Error("auth");
      const me = (await meResponse.json()) as { user: User };
      if (me.user.role !== "PARTENAIRE") {
        setState({ status: "forbidden" });
        return;
      }

      const [profileResponse, leadsResponse, learnersResponse, commissionsResponse] = await Promise.all([
        fetch("/api/partners/me"),
        fetch("/api/partners/me/leads"),
        fetch("/api/partners/me/students"),
        fetch("/api/partners/me/commissions")
      ]);
      if (!profileResponse.ok) {
        setState({ status: "forbidden" });
        return;
      }
      const partner = ((await profileResponse.json()) as { data: PartnerProfile }).data;
      const leads = leadsResponse.ok ? (((await leadsResponse.json()) as { data?: Lead[] }).data ?? []) : [];
      const learners = learnersResponse.ok ? (((await learnersResponse.json()) as { data?: Learner[] }).data ?? []) : [];
      const commissions = commissionsResponse.ok
        ? (((await commissionsResponse.json()) as { data?: ApiPartnerCommission[] }).data ?? []).map(mapApiCommission)
        : [];

      setState({ status: "ready", user: me.user, partner, leads, learners, commissions });
    } catch {
      setState({ status: "error", message: "Impossible de charger votre espace partenaire pour le moment." });
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function submitLead(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setFormSuccess(null);
    try {
      const response = await fetch("/api/partners/me/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          interest: form.interest.trim() || undefined,
          notes: form.notes.trim() || undefined
        })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setFormError(payload?.error?.message ?? "Envoi impossible.");
        return;
      }
      setForm(EMPTY_FORM);
      setFormSuccess("Candidat transmis à LODENE. Vous suivrez sa conversion ci-dessous.");
      await load();
    } catch {
      setFormError("Le service LODENE est momentanément indisponible.");
    } finally {
      setSubmitting(false);
    }
  }

  if (state.status === "loading") {
    return <Panel title="Chargement de votre espace" text="Synchronisation de vos prospects et commissions…" />;
  }

  if (state.status === "anonymous") {
    return (
      <Panel title="Connexion requise" text="Connectez-vous avec votre compte partenaire pour accéder à votre espace.">
        <Link className="focus-ring mt-5 inline-flex rounded-full bg-loden-700 px-5 py-3 font-semibold text-white" href="/connexion">
          Me connecter
        </Link>
      </Panel>
    );
  }

  if (state.status === "forbidden") {
    return (
      <Panel
        title="Espace réservé aux partenaires"
        text="Votre compte n&apos;a pas le rôle partenaire. Contactez LODENE pour rejoindre le réseau de prescripteurs."
      >
        <Link className="focus-ring mt-5 inline-flex rounded-full bg-loden-700 px-5 py-3 font-semibold text-white" href="/contact">
          Contacter LODENE
        </Link>
      </Panel>
    );
  }

  if (state.status === "error") {
    return <Panel title="Espace indisponible" text={state.message} />;
  }

  const { user, partner, leads, learners, commissions } = state;
  const inscrits = leads.filter((lead) => lead.status === "INSCRIT").length;
  const validatedTotal = commissions
    .filter((commission) => commission.status === "VALIDEE" || commission.status === "PAYEE")
    .reduce((sum, commission) => sum + commission.amount, 0);
  const euros = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

  return (
    <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <Panel title={`Bonjour ${user.firstName}`} text={`${partner.companyName} · Barème : ${describeCommission(partner.commissionType, partner.commissionValue)}`}>
        {partner.status === "SUSPENDU" ? (
          <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm font-medium text-amber-800">
            Votre compte est suspendu : la recommandation de candidats est désactivée. Contactez LODENE.
          </p>
        ) : null}
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

      <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        <Metric icon={Users} label="Prospects apportés" value={`${leads.length}`} />
        <Metric icon={CheckCircle2} label="Inscrits" value={`${inscrits}`} />
        <Metric icon={BadgeEuro} label="Commissions acquises" value={euros.format(validatedTotal)} />
      </div>

      {/* Recommander un candidat */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft sm:rounded-3xl sm:p-6 lg:col-span-2">
        <h3 className="flex items-center gap-2 text-xl font-semibold text-loden-ink">
          <UserPlus className="h-5 w-5 text-loden-700" aria-hidden="true" />
          Recommander un candidat
        </h3>
        <p className="mt-1 text-sm text-loden-muted">Transmettez ses coordonnées : LODENE le contacte et vous suivez sa conversion.</p>
        <form onSubmit={submitLead} className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Nom complet *">
            <input
              required
              value={form.fullName}
              onChange={(event) => setForm({ ...form, fullName: event.target.value })}
              className="field-input"
              disabled={partner.status === "SUSPENDU"}
            />
          </Field>
          <Field label="Email *">
            <input
              required
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              className="field-input"
              disabled={partner.status === "SUSPENDU"}
            />
          </Field>
          <Field label="Téléphone">
            <input
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
              className="field-input"
              disabled={partner.status === "SUSPENDU"}
            />
          </Field>
          <Field label="Formation visée">
            <input
              value={form.interest}
              onChange={(event) => setForm({ ...form, interest: event.target.value })}
              className="field-input"
              placeholder="Permis B, VTC, CACES…"
              disabled={partner.status === "SUSPENDU"}
            />
          </Field>
          <Field label="Précisions" className="sm:col-span-2">
            <textarea
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
              rows={2}
              className="field-input"
              disabled={partner.status === "SUSPENDU"}
            />
          </Field>
          {formError ? <p className="text-sm font-medium text-rose-600 sm:col-span-2">{formError}</p> : null}
          {formSuccess ? (
            <p className="flex items-center gap-2 text-sm font-medium text-emerald-700 sm:col-span-2">
              <Sparkles className="h-4 w-4" /> {formSuccess}
            </p>
          ) : null}
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={submitting || partner.status === "SUSPENDU"}
              className="focus-ring inline-flex items-center gap-2 rounded-full bg-loden-700 px-5 py-3 font-semibold text-white transition hover:bg-loden-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              {submitting ? "Envoi…" : "Transmettre le candidat"}
            </button>
          </div>
        </form>
      </section>

      {/* Mes prospects */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft sm:rounded-3xl sm:p-6 lg:col-span-2">
        <h3 className="flex items-center gap-2 text-xl font-semibold text-loden-ink">
          <Users className="h-5 w-5 text-loden-700" aria-hidden="true" />
          Mes prospects
        </h3>
        {leads.length > 0 ? (
          <ul className="mt-5 grid gap-3">
            {leads.map((lead) => {
              const badge = LEAD_STATUS[lead.status] ?? { label: lead.status, className: "bg-slate-100 text-slate-600" };
              return (
                <li key={lead.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-loden-pearl p-4">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-loden-ink">{lead.fullName}</p>
                    <p className="truncate text-sm text-loden-muted">
                      {lead.interest ? `${lead.interest} · ` : ""}
                      {formatDate(lead.createdAt)}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}>{badge.label}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-4 text-sm leading-6 text-loden-muted">Aucun prospect transmis pour le moment.</p>
        )}
      </section>

      {/* Mes apprenants */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft sm:rounded-3xl sm:p-6 lg:col-span-2">
        <h3 className="flex items-center gap-2 text-xl font-semibold text-loden-ink">
          <GraduationCap className="h-5 w-5 text-loden-700" aria-hidden="true" />
          Mes apprenants
        </h3>
        {learners.length > 0 ? (
          <ul className="mt-5 grid gap-3">
            {learners.map((learner) => {
              const name = [learner.firstName, learner.lastName].filter(Boolean).join(" ") || "Élève";
              const progress = Math.max(0, Math.min(100, learner.progressPercent ?? 0));
              return (
                <li key={learner.id} className="rounded-2xl bg-loden-pearl p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-loden-ink">{name}</span>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-loden-700 shadow-soft">
                      {FILE_STATUS_LABELS[learner.fileStatus] ?? learner.fileStatus}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-white">
                      <div className="h-full rounded-full bg-loden-600" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-loden-muted">{progress}%</span>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-4 text-sm leading-6 text-loden-muted">
            Aucun apprenant pour le moment : vos candidats apparaîtront ici une fois inscrits.
          </p>
        )}
      </section>

      {/* Mes commissions */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft sm:rounded-3xl sm:p-6 lg:col-span-2">
        <h3 className="flex items-center gap-2 text-xl font-semibold text-loden-ink">
          <BadgeEuro className="h-5 w-5 text-loden-700" aria-hidden="true" />
          Mes commissions
        </h3>
        {commissions.length > 0 ? (
          <ul className="mt-5 grid gap-3">
            {commissions.map((commission) => (
              <li key={commission.id} className="flex items-center justify-between gap-3 rounded-2xl bg-loden-pearl p-4">
                <span className="font-semibold text-loden-ink">{commission.amountLabel}</span>
                <span className="flex items-center gap-3 text-sm text-loden-muted">
                  {formatDate(commission.createdAt)}
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-loden-700 shadow-soft">
                    {commission.statusLabel}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm leading-6 text-loden-muted">
            Vos commissions apparaîtront ici dès qu&apos;un candidat que vous avez apporté s&apos;inscrit.
          </p>
        )}
      </section>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeZone: "UTC" }).format(date);
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

function Metric({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft sm:rounded-3xl sm:p-6">
      <Icon className="h-6 w-6 text-loden-700" />
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-loden-muted sm:mt-5 sm:text-sm">{label}</p>
      <p className="mt-2 break-words text-xl font-semibold text-loden-ink sm:text-2xl">{value}</p>
    </article>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`grid gap-2 ${className}`}>
      <span className="text-sm font-semibold text-loden-ink">{label}</span>
      {children}
    </label>
  );
}
