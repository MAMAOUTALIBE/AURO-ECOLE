"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BadgeCheck,
  CalendarDays,
  ClipboardList,
  CreditCard,
  FileText,
  FolderOpen,
  GraduationCap,
  Inbox,
  KanbanSquare,
  LayoutDashboard,
  LifeBuoy,
  Loader2,
  LogIn,
  LogOut,
  LucideIcon,
  MessageSquare,
  Newspaper,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Star,
  TrendingUp,
  UsersRound
} from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { crmModules, crmRoadmap, crmRoles, salesPipelineStages, type CrmModuleDefinition, type CrmModuleId } from "@/data/crm";
import { formatCurrency } from "@/lib/utils";

type AdminUser = {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  createdAt?: string;
};

type ContactRequest = {
  id: string;
  fullName: string;
  email: string;
  type: string;
  status: string;
  message: string;
  createdAt: string;
};

type CpfRequest = {
  id: string;
  fullName: string;
  email: string;
  status: string;
  requestedAmountCents?: number | null;
  createdAt: string;
};

type Booking = {
  id: string;
  studentId?: string;
  instructorId?: string;
  formationId?: string;
  status: string;
  startsAt: string;
  endsAt?: string;
};

type Payment = {
  id: string;
  userId?: string;
  pricingPlanId?: string | null;
  status: string;
  amountCents: number;
  currency?: string;
  createdAt: string;
};

type Review = {
  id: string;
  rating: number;
  comment: string;
  status: string;
  createdAt: string;
};

type Student = {
  id: string;
  userId: string;
  formationId?: string | null;
  progressPercent: number;
  purchasedHours: number;
  consumedHours: number;
  fileStatus: string;
  createdAt: string;
};

type Instructor = {
  id: string;
  name: string;
  specialties: string[];
  interventionZones: string[];
  ratingAverage: number;
  ratingCount: number;
  active?: boolean;
};

type Lead = {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  status: "PROSPECT" | "CONTACTE" | "RELANCE" | "DEVIS_ENVOYE" | "INSCRIT" | "PERDU";
  source?: string | null;
  interest?: string | null;
  notes?: string | null;
  estimatedValueCents?: number | null;
  nextFollowUpAt?: string | null;
  createdAt: string;
};

type CrmData = {
  contacts: ContactRequest[];
  cpfRequests: CpfRequest[];
  bookings: Booking[];
  payments: Payment[];
  reviews: Review[];
  users: AdminUser[];
  students: Student[];
  instructors: Instructor[];
  leads: Lead[];
};

type DashboardState =
  | { status: "loading" }
  | { status: "login" }
  | { status: "ready"; user: AdminUser; data: CrmData }
  | { status: "error"; message: string };

type SearchResult = {
  id: string;
  category: string;
  title: string;
  description: string;
};

const schema = z.object({
  email: z.string().trim().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis")
});

type LoginValues = z.infer<typeof schema>;

const leadStatusOptions: Array<{ value: Lead["status"]; label: string }> = [
  { value: "PROSPECT", label: "Prospect" },
  { value: "CONTACTE", label: "Contacté" },
  { value: "RELANCE", label: "Relance" },
  { value: "DEVIS_ENVOYE", label: "Devis envoyé" },
  { value: "INSCRIT", label: "Inscrit" },
  { value: "PERDU", label: "Perdu" }
];

const iconMap: Record<string, LucideIcon> = {
  BadgeCheck,
  CalendarDays,
  ClipboardList,
  CreditCard,
  FileText,
  FolderOpen,
  GraduationCap,
  Inbox,
  KanbanSquare,
  LayoutDashboard,
  LifeBuoy,
  MessageSquare,
  Newspaper,
  Send,
  Settings,
  Star,
  UsersRound
};

export function AdminDashboard() {
  const [state, setState] = useState<DashboardState>({ status: "loading" });
  const [activeModule, setActiveModule] = useState<CrmModuleId>("overview");
  const [query, setQuery] = useState("");
  const [crmMessage, setCrmMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    // Auth via cookie httpOnly : loadDashboard sonde la session et bascule en
    // écran de connexion si l'API répond 401 (aucun token lu en JS).
    loadDashboard(setState);
  }, []);

  if (state.status === "loading") {
    return <AdminPanel title="Chargement du CRM" text="Vérification de la session administrateur et synchronisation des modules..." loading />;
  }

  if (state.status === "login") {
    return <AdminLogin onReady={() => loadDashboard(setState)} />;
  }

  if (state.status === "error") {
    return (
      <AdminPanel title="Accès administrateur indisponible" text={state.message}>
        <button
          type="button"
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            setState({ status: "login" });
          }}
          className="focus-ring mt-5 rounded-full bg-loden-700 px-5 py-3 font-semibold text-white"
        >
          Revenir à la connexion
        </button>
      </AdminPanel>
    );
  }

  const searchResults = buildSearchResults(state.data, query);
  const activeDefinition = crmModules.find((module) => module.id === activeModule) ?? crmModules[0];

  const handleLeadStatusChange = async (lead: Lead, status: Lead["status"]) => {
    if (lead.status === status) return;
    setCrmMessage(null);

    try {
      const response = await fetch(`/api/leads/${encodeURIComponent(lead.id)}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          notes: `Statut mis à jour depuis le CRM LODEN: ${formatStatus(lead.status)} -> ${formatStatus(status)}`
        })
      });

      if (response.status === 401) {
        setState({ status: "login" });
        return;
      }
      const payload = (await response.json().catch(() => null)) as { data?: Lead; error?: { message?: string } } | null;

      if (!response.ok || !payload?.data) {
        throw new Error(payload?.error?.message ?? "Mise à jour du lead impossible.");
      }

      setState((current) => {
        if (current.status !== "ready") return current;
        return {
          ...current,
          data: {
            ...current.data,
            leads: current.data.leads.map((item) => (item.id === payload.data?.id ? payload.data : item))
          }
        };
      });
      setCrmMessage({ tone: "success", text: `${lead.fullName} déplacé vers ${formatStatus(status)}.` });
    } catch (error) {
      setCrmMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "Mise à jour du lead impossible."
      });
    }
  };

  return (
    <div className="grid gap-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-premium sm:p-6">
        <div className="grid gap-5 xl:grid-cols-[1fr_420px] xl:items-center">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-loden-700">
              <ShieldCheck className="h-4 w-4" />
              Centre de commande
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-loden-ink">
              Bonjour {state.user.firstName} {state.user.lastName}
            </h2>
            <p className="mt-2 text-sm text-loden-muted">
              {state.user.email} · {state.user.role} · {crmModules.length} modules CRM cartographiés
            </p>
          </div>
          <div className="grid gap-3">
            <label className="relative block">
              <span className="sr-only">Recherche globale CRM</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-loden-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="field-input pl-11"
                placeholder="Rechercher élève, CPF, paiement, avis..."
              />
            </label>
            <button
              type="button"
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                setState({ status: "login" });
              }}
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-loden-ink hover:bg-loden-50"
            >
              <LogOut className="h-4 w-4" />
              Se déconnecter
            </button>
          </div>
        </div>
      </section>

      {crmMessage ? (
        <div className={`rounded-3xl p-4 text-sm font-semibold ${crmMessage.tone === "success" ? "bg-loden-50 text-loden-800" : "bg-red-50 text-red-700"}`}>
          {crmMessage.text}
        </div>
      ) : null}

      {query.trim() ? <SearchResults results={searchResults} query={query} /> : null}

      <section className="grid gap-5 xl:grid-cols-[260px_1fr]">
        <nav className="rounded-3xl border border-slate-200 bg-white p-3 shadow-soft" aria-label="Modules CRM">
          <div className="grid gap-1">
            {crmModules.map((module) => {
              const Icon = iconMap[module.icon] ?? LayoutDashboard;
              const active = module.id === activeModule;
              return (
                <button
                  key={module.id}
                  type="button"
                  onClick={() => setActiveModule(module.id)}
                  className={`focus-ring flex items-center justify-between gap-3 rounded-2xl px-3 py-3 text-left text-sm transition ${
                    active ? "bg-loden-700 text-white" : "text-loden-muted hover:bg-loden-50 hover:text-loden-ink"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate font-semibold">{module.shortLabel}</span>
                  </span>
                  <span className={`h-2 w-2 rounded-full ${getStatusDot(module.status, active)}`} />
                </button>
              );
            })}
          </div>
        </nav>

        <div className="grid gap-5">
          <ModuleHeader module={activeDefinition} />
          <ModuleWorkspace activeModule={activeModule} data={state.data} onLeadStatusChange={handleLeadStatusChange} />
        </div>
      </section>
    </div>
  );
}

function ModuleWorkspace({
  activeModule,
  data,
  onLeadStatusChange
}: {
  activeModule: CrmModuleId;
  data: CrmData;
  onLeadStatusChange: (lead: Lead, status: Lead["status"]) => void;
}) {
  if (activeModule === "overview") return <OverviewView data={data} />;
  if (activeModule === "sales") return <SalesView data={data} onLeadStatusChange={onLeadStatusChange} />;
  if (activeModule === "students") return <StudentsView data={data} />;
  if (activeModule === "instructors") return <InstructorsView data={data} />;
  if (activeModule === "bookings") return <BookingsView data={data} />;
  if (activeModule === "payments") return <PaymentsView data={data} />;
  if (activeModule === "cpf") return <CpfView data={data} />;
  if (activeModule === "reviews") return <ReviewsView data={data} />;
  if (activeModule === "exams") return <PlannedModuleView id="exams" />;
  if (activeModule === "content") return <PlannedModuleView id="content" />;
  if (activeModule === "media") return <PlannedModuleView id="media" />;
  if (activeModule === "communication") return <PlannedModuleView id="communication" />;
  if (activeModule === "support") return <PlannedModuleView id="support" />;
  return <SettingsView />;
}

function OverviewView({ data }: { data: CrmData }) {
  const todayBookings = data.bookings.filter((booking) => isToday(booking.startsAt)).length;
  const todayRegistrations = data.users.filter((user) => user.role === "ELEVE" && user.createdAt && isToday(user.createdAt)).length;
  const pendingPayments = data.payments.filter((payment) => payment.status === "EN_ATTENTE");
  const revenueCents = data.payments.filter((payment) => payment.status === "PAYE").reduce((sum, payment) => sum + payment.amountCents, 0);
  const pendingCpf = data.cpfRequests.filter((request) => ["NOUVELLE_DEMANDE", "DOCUMENTS_MANQUANTS"].includes(request.status)).length;
  const recentReviews = data.reviews.slice(0, 3);
  const notifications = buildNotifications(data);

  return (
    <div className="grid gap-5">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric icon={GraduationCap} label="Élèves" value={`${data.students.length}`} detail={`${data.users.filter((user) => user.role === "ELEVE").length} comptes élèves`} />
        <Metric icon={TrendingUp} label="Inscriptions du jour" value={`${todayRegistrations}`} detail="Depuis minuit" />
        <Metric icon={CalendarDays} label="Réservations du jour" value={`${todayBookings}`} detail={`${data.bookings.length} réservations totales`} />
        <Metric icon={CreditCard} label="Chiffre d'affaires" value={formatCurrency(revenueCents / 100)} detail={`${pendingPayments.length} paiements en attente`} />
        <Metric icon={FileText} label="Dossiers CPF" value={`${pendingCpf}`} detail={`${data.cpfRequests.length} dossiers suivis`} />
        <Metric icon={BadgeCheck} label="Moniteurs actifs" value={`${data.instructors.length}`} detail="Équipe pédagogique" />
        <Metric icon={TrendingUp} label="Pipeline actif" value={`${data.leads.filter((lead) => ["PROSPECT", "CONTACTE", "RELANCE", "DEVIS_ENVOYE"].includes(lead.status)).length}`} detail={`${data.leads.length} leads au total`} />
        <Metric icon={Inbox} label="Avis récents" value={`${recentReviews.length}`} detail={`${data.reviews.filter((review) => review.status === "EN_ATTENTE").length} à modérer`} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <CommandGraph data={data} />
        <CrmList title="Notifications importantes" empty="Aucune alerte prioritaire." items={notifications} />
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <CrmList title="Activité récente" empty="Aucune activité récente." items={getLatestActivity(data)} />
        <CrmList
          title="Avis récents"
          empty="Aucun avis à afficher."
          items={recentReviews.map((review) => ({
            id: review.id,
            title: `${review.rating}/5 · ${formatStatus(review.status)}`,
            meta: formatDate(review.createdAt),
            text: review.comment
          }))}
        />
        <RoadmapCard />
      </section>
    </div>
  );
}

function SalesView({
  data,
  onLeadStatusChange
}: {
  data: CrmData;
  onLeadStatusChange: (lead: Lead, status: Lead["status"]) => void;
}) {
  const leadsByStage = {
    prospect: data.leads.filter((lead) => lead.status === "PROSPECT"),
    contacted: data.leads.filter((lead) => lead.status === "CONTACTE"),
    followup: data.leads.filter((lead) => lead.status === "RELANCE"),
    quote: data.leads.filter((lead) => lead.status === "DEVIS_ENVOYE"),
    won: data.leads.filter((lead) => lead.status === "INSCRIT"),
    lost: data.leads.filter((lead) => lead.status === "PERDU")
  };

  return (
    <section className="grid gap-4 xl:grid-cols-6">
      {salesPipelineStages.map((stage) => {
        const items = leadsByStage[stage.id as keyof typeof leadsByStage] ?? [];
        return (
          <article key={stage.id} className="min-h-64 rounded-3xl border border-slate-200 bg-white p-4 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${stage.color}`}>{stage.label}</span>
                <p className="mt-3 text-xs leading-5 text-loden-muted">{stage.description}</p>
              </div>
              <span className="text-2xl font-semibold text-loden-ink">{items.length}</span>
            </div>
            <div className="mt-4 grid gap-3">
              {items.slice(0, 3).map((lead) => (
                <div key={lead.id} className="rounded-2xl bg-loden-pearl p-3">
                  <p className="truncate text-sm font-semibold text-loden-ink">{lead.fullName}</p>
                  <p className="mt-1 truncate text-xs text-loden-muted">
                    {lead.estimatedValueCents ? `${formatCurrency(lead.estimatedValueCents / 100)} · ` : ""}
                    {lead.interest ?? lead.source ?? lead.email}
                  </p>
                  <label className="mt-3 grid gap-1">
                    <span className="text-xs font-semibold uppercase tracking-[0.1em] text-loden-muted">Action</span>
                    <select
                      value={lead.status}
                      onChange={(event) => onLeadStatusChange(lead, event.target.value as Lead["status"])}
                      className="focus-ring w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-loden-ink"
                    >
                      {leadStatusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              ))}
              {items.length > 3 ? (
                <p className="text-xs font-semibold text-loden-muted">+{items.length - 3} autre(s) lead(s)</p>
              ) : null}
            </div>
          </article>
        );
      })}
    </section>
  );
}

function StudentsView({ data }: { data: CrmData }) {
  const studentUsers = data.users.filter((user) => user.role === "ELEVE");

  return (
    <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <CrmTable
        title="Fiches élèves"
        rows={studentUsers.map((user) => ({
          id: user.id ?? user.email,
          title: `${user.firstName} ${user.lastName}`,
          meta: user.email,
          detail: data.students.find((student) => student.userId === user.id)?.fileStatus ?? "Compte créé"
        }))}
        empty="Aucun élève inscrit."
      />
      <CrmList
        title="Parcours à suivre"
        empty="Aucune progression disponible."
        items={data.students.slice(0, 6).map((student) => ({
          id: student.id,
          title: student.formationId ?? "Formation à confirmer",
          meta: `${student.progressPercent}% progression · ${student.fileStatus}`,
          text: `${Math.max(student.purchasedHours - student.consumedHours, 0)} h restantes`
        }))}
      />
    </section>
  );
}

const EMPTY_INSTRUCTOR_FORM = { firstName: "", lastName: "", email: "", specialties: "", interventionZones: "" };

function InstructorsView({ data }: { data: CrmData }) {
  const [list, setList] = useState<Instructor[]>(data.instructors);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_INSTRUCTOR_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setList(data.instructors);
  }, [data.instructors]);

  const toList = (value: string) =>
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  async function createInstructor(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/instructors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          specialties: form.specialties ? toList(form.specialties) : undefined,
          interventionZones: form.interventionZones ? toList(form.interventionZones) : undefined
        })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setError(payload?.error?.message ?? "Création impossible. Vérifie les champs.");
        return;
      }
      setList((current) => [...current, payload.data as Instructor]);
      setForm(EMPTY_INSTRUCTOR_FORM);
      setShowForm(false);
    } catch {
      setError("Erreur réseau. Réessaie dans quelques instants.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(instructor: Instructor) {
    const response = await fetch(`/api/instructors/${instructor.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: instructor.active === false })
    });
    if (response.ok) {
      const payload = await response.json();
      setList((current) => current.map((item) => (item.id === instructor.id ? { ...item, active: payload.data.active } : item)));
    }
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-loden-700">{list.length} moniteur(s)</p>
        <button
          type="button"
          onClick={() => {
            setShowForm((value) => !value);
            setError(null);
          }}
          className="focus-ring inline-flex items-center gap-2 rounded-full bg-loden-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-loden-800"
        >
          {showForm ? "Fermer" : "Nouveau moniteur"}
        </button>
      </div>

      {showForm ? (
        <form onSubmit={createInstructor} className="grid gap-3 rounded-3xl border border-slate-200 bg-loden-pearl p-5" noValidate>
          <div className="grid gap-3 sm:grid-cols-2">
            <InstructorField label="Prénom" value={form.firstName} onChange={(v) => setForm((f) => ({ ...f, firstName: v }))} required />
            <InstructorField label="Nom" value={form.lastName} onChange={(v) => setForm((f) => ({ ...f, lastName: v }))} required />
            <InstructorField label="Email" type="email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} required />
            <InstructorField label="Spécialités (séparées par ,)" value={form.specialties} onChange={(v) => setForm((f) => ({ ...f, specialties: v }))} />
          </div>
          <InstructorField label="Zones d'intervention (séparées par ,)" value={form.interventionZones} onChange={(v) => setForm((f) => ({ ...f, interventionZones: v }))} />
          {error ? <p className="rounded-2xl bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p> : null}
          <button
            type="submit"
            disabled={submitting}
            className="focus-ring mt-1 inline-flex items-center justify-center rounded-full bg-loden-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-loden-800 disabled:opacity-70"
          >
            {submitting ? "Création…" : "Créer le moniteur"}
          </button>
        </form>
      ) : null}

      <section className="grid gap-5 lg:grid-cols-3">
        {list.map((instructor) => {
          const inactive = instructor.active === false;
          return (
            <article
              key={instructor.id}
              className={`rounded-3xl border bg-white p-5 shadow-soft ${inactive ? "border-slate-200 opacity-60" : "border-slate-200"}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-loden-ink">{instructor.name}</h3>
                  <p className="mt-2 text-sm text-loden-muted">{instructor.interventionZones.join(", ")}</p>
                </div>
                <span className="rounded-full bg-loden-50 px-3 py-1 text-sm font-semibold text-loden-700">{instructor.ratingAverage}/5</span>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {instructor.specialties.map((specialty) => (
                  <span key={specialty} className="rounded-full bg-loden-pearl px-3 py-1 text-xs font-semibold text-loden-muted">
                    {specialty}
                  </span>
                ))}
              </div>
              <div className="mt-5 flex items-center justify-between">
                <span className={`text-xs font-semibold ${inactive ? "text-red-600" : "text-loden-600"}`}>
                  {inactive ? "Inactif" : "Actif"} · {instructor.ratingCount} avis
                </span>
                <button
                  type="button"
                  onClick={() => toggleActive(instructor)}
                  className="focus-ring rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-loden-ink hover:bg-loden-50"
                >
                  {inactive ? "Activer" : "Désactiver"}
                </button>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}

function InstructorField({
  label,
  value,
  onChange,
  type = "text",
  required = false
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-loden-ink">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="field-input"
      />
    </label>
  );
}

function BookingsView({ data }: { data: CrmData }) {
  return (
    <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <CrmTable
        title="Planning reservations"
        rows={data.bookings.map((booking) => ({
          id: booking.id,
          title: formatDate(booking.startsAt),
          meta: formatStatus(booking.status),
          detail: `${booking.instructorId ?? "Moniteur"} · ${booking.formationId ?? "Formation"}`
        }))}
        empty="Aucune réservation."
      />
      <PlannedFeatureCard
        title="Vues calendrier"
        items={["Jour : dispatch opérationnel", "Semaine : charge moniteurs", "Mois : examens et volume"]}
      />
    </section>
  );
}

function PaymentsView({ data }: { data: CrmData }) {
  const pendingAmount = data.payments.filter((payment) => payment.status === "EN_ATTENTE").reduce((sum, payment) => sum + payment.amountCents, 0);

  return (
    <section className="grid gap-5 xl:grid-cols-[360px_1fr]">
      <div className="grid gap-4">
        <Metric icon={CreditCard} label="En attente" value={formatCurrency(pendingAmount / 100)} detail={`${data.payments.length} opérations`} />
        <PlannedFeatureCard title="Comptabilité" items={["Export CSV/logiciel comptable", "Factures PDF", "Remboursements et avoirs"]} />
      </div>
      <CrmTable
        title="Historique paiements"
        rows={data.payments.map((payment) => ({
          id: payment.id,
          title: formatCurrency(payment.amountCents / 100),
          meta: formatStatus(payment.status),
          detail: `${payment.pricingPlanId ?? "Pack"} · ${formatDate(payment.createdAt)}`
        }))}
        empty="Aucune opération de paiement."
      />
    </section>
  );
}

function CpfView({ data }: { data: CrmData }) {
  return (
    <section className="grid gap-5 xl:grid-cols-3">
      {["NOUVELLE_DEMANDE", "DOCUMENTS_MANQUANTS", "VALIDEE"].map((status) => (
        <CrmList
          key={status}
          title={formatStatus(status)}
          empty="Aucun dossier dans cette colonne."
          items={data.cpfRequests
            .filter((request) => request.status === status)
            .map((request) => ({
              id: request.id,
              title: request.fullName,
              meta: request.requestedAmountCents ? formatCurrency(request.requestedAmountCents / 100) : "Montant à confirmer",
              text: request.email
            }))}
        />
      ))}
    </section>
  );
}

function ReviewsView({ data }: { data: CrmData }) {
  return (
    <section className="grid gap-5 xl:grid-cols-[320px_1fr]">
      <Metric
        icon={Star}
        label="Satisfaction"
        value={data.reviews.length ? `${(data.reviews.reduce((sum, review) => sum + review.rating, 0) / data.reviews.length).toFixed(1)}/5` : "0/5"}
        detail={`${data.reviews.filter((review) => review.status === "EN_ATTENTE").length} avis à modérer`}
      />
      <CrmTable
        title="Moderation avis"
        rows={data.reviews.map((review) => ({
          id: review.id,
          title: `${review.rating}/5`,
          meta: formatStatus(review.status),
          detail: review.comment
        }))}
        empty="Aucun avis."
      />
    </section>
  );
}

function PlannedModuleView({ id }: { id: CrmModuleId }) {
  const moduleDefinition = crmModules.find((item) => item.id === id);
  if (!moduleDefinition) return null;

  return (
    <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <h3 className="text-xl font-semibold text-loden-ink">Architecture prévue</h3>
        <p className="mt-3 text-sm leading-6 text-loden-muted">{moduleDefinition.description}</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {moduleDefinition.workflows.map((workflow) => (
            <div key={workflow} className="rounded-2xl bg-loden-pearl p-4 text-sm font-semibold text-loden-ink">
              {workflow}
            </div>
          ))}
        </div>
      </article>
      <PlannedFeatureCard title="APIs cibles" items={moduleDefinition.apiSurfaces} />
    </section>
  );
}

function SettingsView() {
  return (
    <section className="grid gap-5 xl:grid-cols-[1fr_420px]">
      <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <h3 className="text-xl font-semibold text-loden-ink">Rôles et permissions</h3>
        <div className="mt-5 grid gap-3">
          {crmRoles.map((role) => (
            <div key={role.role} className="rounded-2xl bg-loden-pearl p-4">
              <p className="font-semibold text-loden-ink">{role.role}</p>
              <p className="mt-2 text-sm leading-6 text-loden-muted">{role.scope}</p>
            </div>
          ))}
        </div>
      </article>
      <PlannedFeatureCard title="Paramètres à brancher" items={["Agences et zones", "Horaires", "Réseaux sociaux", "Modèles email/SMS", "Permissions fines"]} />
    </section>
  );
}

function ModuleHeader({ module }: { module: CrmModuleDefinition }) {
  const Icon = iconMap[module.icon] ?? LayoutDashboard;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-loden-50 text-loden-700">
            <Icon className="h-6 w-6" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-2xl font-semibold text-loden-ink">{module.label}</h3>
              <StatusBadge status={module.status} />
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-loden-muted">{module.description}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {module.primaryRoles.map((role) => (
            <span key={role} className="rounded-full bg-loden-pearl px-3 py-1 text-xs font-semibold text-loden-muted">
              {role}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function AdminLogin({ onReady }: { onReady: () => void }) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "admin@loden-autoecole.fr",
      password: ""
    }
  });

  const onSubmit = async (values: LoginValues) => {
    setSubmitError(null);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });
    const payload = (await response.json().catch(() => null)) as { user?: AdminUser; error?: { message?: string } } | null;

    if (!response.ok || !payload?.user) {
      setSubmitError(payload?.error?.message ?? "Connexion admin impossible.");
      return;
    }

    if (payload.user.role !== "SUPER_ADMIN" && payload.user.role !== "ADMIN") {
      setSubmitError("Ce compte n'a pas accès au CRM LODEN.");
      return;
    }

    // La session est dans le cookie httpOnly posé par /api/auth/login.
    onReady();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-premium" noValidate>
      <div className="border-b border-slate-200 pb-5">
        <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-loden-700">
          <ShieldCheck className="h-4 w-4" />
          CRM LODEN
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-loden-ink">Connexion administrateur</h2>
        <p className="mt-2 text-sm leading-6 text-loden-muted">
          Accès réservé aux rôles `ADMIN` et `SUPER_ADMIN`. En mode mémoire local : admin@loden-autoecole.fr / admin-password.
        </p>
      </div>

      <Field label="Email" error={errors.email?.message} className="mt-5">
        <input {...register("email")} className="field-input" autoComplete="email" />
      </Field>
      <Field label="Mot de passe" error={errors.password?.message} className="mt-4">
        <input {...register("password")} className="field-input" type="password" autoComplete="current-password" />
      </Field>

      <button
        type="submit"
        disabled={isSubmitting}
        className="focus-ring mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-loden-700 px-6 py-4 font-semibold text-white transition hover:bg-loden-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
        {isSubmitting ? "Connexion..." : "Accéder au CRM"}
      </button>

      {submitError ? <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700">{submitError}</p> : null}
    </form>
  );
}

async function loadDashboard(setState: (state: DashboardState) => void) {
  try {
    // Auth via cookie httpOnly (envoyé automatiquement en same-origin).
    const [
      meResponse,
      contactsResponse,
      cpfResponse,
      bookingsResponse,
      paymentsResponse,
      reviewsResponse,
      usersResponse,
      studentsResponse,
      instructorsResponse,
      leadsResponse
    ] =
      await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/contact-requests"),
        fetch("/api/cpf/requests"),
        fetch("/api/bookings"),
        fetch("/api/payments"),
        fetch("/api/reviews?includeUnpublished=true"),
        fetch("/api/users"),
        fetch("/api/students"),
        fetch("/api/instructors"),
        fetch("/api/leads")
      ]);

    const protectedResponses = [
      meResponse,
      contactsResponse,
      cpfResponse,
      bookingsResponse,
      paymentsResponse,
      reviewsResponse,
      usersResponse,
      studentsResponse,
      leadsResponse
    ];
    if (protectedResponses.some((response) => response.status === 401)) {
      setState({ status: "login" });
      return;
    }

    if (protectedResponses.some((response) => response.status === 403)) {
      throw new Error("Accès refusé : rôle administrateur requis.");
    }

    if (![...protectedResponses, instructorsResponse].every((response) => response.ok)) {
      throw new Error("Impossible de charger les données CRM.");
    }

    const mePayload = (await meResponse.json()) as { user: AdminUser };
    if (mePayload.user.role !== "SUPER_ADMIN" && mePayload.user.role !== "ADMIN") {
      throw new Error("Accès refusé : rôle administrateur requis.");
    }

    const [contactsPayload, cpfPayload, bookingsPayload, paymentsPayload, reviewsPayload, usersPayload, studentsPayload, instructorsPayload, leadsPayload] = await Promise.all([
      contactsResponse.json() as Promise<{ data?: ContactRequest[] }>,
      cpfResponse.json() as Promise<{ data?: CpfRequest[] }>,
      bookingsResponse.json() as Promise<{ data?: Booking[] }>,
      paymentsResponse.json() as Promise<{ data?: Payment[] }>,
      reviewsResponse.json() as Promise<{ data?: Review[] }>,
      usersResponse.json() as Promise<{ data?: AdminUser[] }>,
      studentsResponse.json() as Promise<{ data?: Student[] }>,
      instructorsResponse.json() as Promise<{ data?: Instructor[] }>,
      leadsResponse.json() as Promise<{ data?: Lead[] }>
    ]);

    setState({
      status: "ready",
      user: mePayload.user,
      data: {
        contacts: sortByDateDesc(contactsPayload.data ?? []),
        cpfRequests: sortByDateDesc(cpfPayload.data ?? []),
        bookings: sortBookingsByStartDesc(bookingsPayload.data ?? []),
        payments: sortByDateDesc(paymentsPayload.data ?? []),
        reviews: sortByDateDesc(reviewsPayload.data ?? []),
        users: sortByDateDesc(usersPayload.data ?? []),
        students: sortByDateDesc(studentsPayload.data ?? []),
        instructors: instructorsPayload.data ?? [],
        leads: sortByDateDesc(leadsPayload.data ?? [])
      }
    });
  } catch (error) {
    setState({
      status: "error",
      message: error instanceof Error ? error.message : "Impossible de charger le CRM LODEN."
    });
  }
}

function buildSearchResults(data: CrmData, query: string): SearchResult[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  const results: SearchResult[] = [
    ...data.users.map((user) => ({
      id: `user-${user.id ?? user.email}`,
      category: user.role,
      title: `${user.firstName} ${user.lastName}`,
      description: user.email
    })),
    ...data.contacts.map((contact) => ({
      id: `contact-${contact.id}`,
      category: "Contact",
      title: contact.fullName,
      description: `${contact.type} · ${contact.message}`
    })),
    ...data.leads.map((lead) => ({
      id: `lead-${lead.id}`,
      category: "Lead",
      title: lead.fullName,
      description: `${formatStatus(lead.status)} · ${lead.interest ?? lead.email}`
    })),
    ...data.cpfRequests.map((request) => ({
      id: `cpf-${request.id}`,
      category: "CPF",
      title: request.fullName,
      description: `${formatStatus(request.status)} · ${request.email}`
    })),
    ...data.payments.map((payment) => ({
      id: `payment-${payment.id}`,
      category: "Paiement",
      title: formatCurrency(payment.amountCents / 100),
      description: `${formatStatus(payment.status)} · ${payment.pricingPlanId ?? "Pack"}`
    })),
    ...data.reviews.map((review) => ({
      id: `review-${review.id}`,
      category: "Avis",
      title: `${review.rating}/5`,
      description: review.comment
    }))
  ];

  return results
    .filter((result) => `${result.category} ${result.title} ${result.description}`.toLowerCase().includes(normalized))
    .slice(0, 8);
}

function buildNotifications(data: CrmData) {
  const notifications = [
    {
      id: "contacts",
      title: "Leads commerciaux",
      meta: `${data.leads.filter((lead) => lead.status === "PROSPECT").length} prospects`,
      text: "Prioriser les demandes d'inscription, de rappel et de devis."
    },
    {
      id: "cpf",
      title: "Dossiers CPF",
      meta: `${data.cpfRequests.filter((request) => request.status !== "VALIDEE").length} ouverts`,
      text: "Vérifier les pièces et accompagner les dossiers incomplets."
    },
    {
      id: "payments",
      title: "Paiements",
      meta: `${data.payments.filter((payment) => payment.status === "EN_ATTENTE").length} en attente`,
      text: "Préparer les futures relances automatiques et factures."
    }
  ];

  return notifications.filter((notification) => !notification.meta.startsWith("0 "));
}

function getLatestActivity(data: CrmData) {
  return [
    ...data.contacts.map((item) => ({
      id: `contact-${item.id}`,
      title: item.fullName,
      meta: `Contact · ${formatDate(item.createdAt)}`,
      text: item.message,
      timestamp: item.createdAt
    })),
    ...data.leads.map((item) => ({
      id: `lead-${item.id}`,
      title: item.fullName,
      meta: `Lead · ${formatDate(item.createdAt)}`,
      text: `${formatStatus(item.status)} · ${item.interest ?? item.email}`,
      timestamp: item.createdAt
    })),
    ...data.cpfRequests.map((item) => ({
      id: `cpf-${item.id}`,
      title: item.fullName,
      meta: `CPF · ${formatDate(item.createdAt)}`,
      text: formatStatus(item.status),
      timestamp: item.createdAt
    })),
    ...data.payments.map((item) => ({
      id: `payment-${item.id}`,
      title: formatCurrency(item.amountCents / 100),
      meta: `Paiement · ${formatDate(item.createdAt)}`,
      text: formatStatus(item.status),
      timestamp: item.createdAt
    }))
  ]
    .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())
    .slice(0, 5)
    .map((item) => ({
      id: item.id,
      title: item.title,
      meta: item.meta,
      text: item.text
    }));
}

function SearchResults({ results, query }: { results: SearchResult[]; query: string }) {
  return (
    <section className="rounded-3xl border border-loden-200 bg-white p-5 shadow-premium">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-loden-ink">Recherche globale</h3>
        <span className="text-sm font-semibold text-loden-muted">{results.length} résultat(s)</span>
      </div>
      {results.length > 0 ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {results.map((result) => (
            <div key={result.id} className="rounded-2xl bg-loden-pearl p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-loden-700">{result.category}</p>
              <p className="mt-2 font-semibold text-loden-ink">{result.title}</p>
              <p className="mt-1 line-clamp-2 text-sm leading-6 text-loden-muted">{result.description}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm leading-6 text-loden-muted">Aucun résultat pour “{query}”.</p>
      )}
    </section>
  );
}

function CommandGraph({ data }: { data: CrmData }) {
  const values = [
    { label: "Leads", value: data.leads.length },
    { label: "Élèves", value: data.students.length },
    { label: "Réservations", value: data.bookings.length },
    { label: "CPF", value: data.cpfRequests.length },
    { label: "Paiements", value: data.payments.length }
  ];
  const max = Math.max(...values.map((item) => item.value), 1);

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-loden-ink">Volume opérationnel</h3>
          <p className="mt-2 text-sm text-loden-muted">Indicateurs branchés sur les APIs existantes.</p>
        </div>
        <TrendingUp className="h-6 w-6 text-loden-700" />
      </div>
      <div className="mt-8 grid gap-4">
        {values.map((item) => (
          <div key={item.label} className="grid gap-2">
            <div className="flex justify-between text-sm">
              <span className="font-semibold text-loden-ink">{item.label}</span>
              <span className="text-loden-muted">{item.value}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-loden-pearl">
              <div className="h-full rounded-full bg-loden-600" style={{ width: `${Math.max((item.value / max) * 100, item.value ? 10 : 0)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function RoadmapCard() {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <h3 className="text-xl font-semibold text-loden-ink">Plan de développement</h3>
      <div className="mt-5 grid gap-3">
        {crmRoadmap.map((phase) => (
          <div key={phase.phase} className="rounded-2xl bg-loden-pearl p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-loden-700">{phase.phase} · {phase.status}</p>
            <p className="mt-2 font-semibold text-loden-ink">{phase.title}</p>
            <p className="mt-1 text-sm leading-6 text-loden-muted">{phase.items.join(" · ")}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

function PlannedFeatureCard({ title, items }: { title: string; items: string[] }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <h3 className="text-xl font-semibold text-loden-ink">{title}</h3>
      <div className="mt-5 grid gap-3">
        {items.map((item) => (
          <div key={item} className="rounded-2xl bg-loden-pearl p-4 text-sm font-semibold text-loden-ink">
            {item}
          </div>
        ))}
      </div>
    </article>
  );
}

function AdminPanel({
  title,
  text,
  loading = false,
  children
}: {
  title: string;
  text: string;
  loading?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-premium">
      <h2 className="text-2xl font-semibold text-loden-ink">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-loden-muted">{text}</p>
      {loading ? <Loader2 className="mt-6 h-6 w-6 animate-spin text-loden-700" /> : children}
    </section>
  );
}

function Metric({ icon: Icon, label, value, detail }: { icon: LucideIcon; label: string; value: string; detail: string }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
      <Icon className="h-6 w-6 text-loden-700" />
      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-loden-muted">{label}</p>
      <p className="mt-2 break-words text-3xl font-semibold text-loden-ink">{value}</p>
      <p className="mt-2 text-sm leading-6 text-loden-muted">{detail}</p>
    </article>
  );
}

function CrmList({
  title,
  empty,
  items
}: {
  title: string;
  empty: string;
  items: Array<{ id: string; title: string; meta: string; text: string }>;
}) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex items-center gap-3">
        <MessageSquare className="h-5 w-5 text-loden-700" />
        <h3 className="text-xl font-semibold text-loden-ink">{title}</h3>
      </div>
      {items.length > 0 ? (
        <div className="mt-5 grid gap-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-2xl bg-loden-pearl p-4">
              <p className="font-semibold text-loden-ink">{item.title}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.1em] text-loden-700">{item.meta}</p>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-loden-muted">{item.text}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-5 text-sm leading-6 text-loden-muted">{empty}</p>
      )}
    </article>
  );
}

function CrmTable({
  title,
  rows,
  empty
}: {
  title: string;
  rows: Array<{ id: string; title: string; meta: string; detail: string }>;
  empty: string;
}) {
  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft">
      <div className="border-b border-slate-200 p-6">
        <h3 className="text-xl font-semibold text-loden-ink">{title}</h3>
      </div>
      {rows.length > 0 ? (
        <div className="divide-y divide-slate-100">
          {rows.slice(0, 10).map((row) => (
            <div key={row.id} className="grid gap-2 p-5 md:grid-cols-[1fr_180px_1.2fr] md:items-center">
              <p className="font-semibold text-loden-ink">{row.title}</p>
              <p className="text-sm font-semibold text-loden-700">{row.meta}</p>
              <p className="line-clamp-2 text-sm leading-6 text-loden-muted">{row.detail}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="p-6 text-sm leading-6 text-loden-muted">{empty}</p>
      )}
    </article>
  );
}

function Field({
  label,
  error,
  children,
  className = ""
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`grid gap-2 ${className}`}>
      <span className="text-sm font-semibold text-loden-ink">{label}</span>
      {children}
      {error ? <span className="text-sm font-medium text-red-600">{error}</span> : null}
    </label>
  );
}

function StatusBadge({ status }: { status: CrmModuleDefinition["status"] }) {
  const labels = {
    live: "Actif",
    foundation: "Socle prêt",
    planned: "Planifié"
  };

  return <span className="rounded-full bg-loden-50 px-3 py-1 text-xs font-semibold text-loden-700">{labels[status]}</span>;
}

function getStatusDot(status: CrmModuleDefinition["status"], active: boolean) {
  if (active) return "bg-white";
  if (status === "live") return "bg-emerald-500";
  if (status === "foundation") return "bg-loden-500";
  return "bg-slate-300";
}

function sortByDateDesc<T extends { createdAt?: string }>(items: T[]) {
  return items.slice().sort((left, right) => new Date(right.createdAt ?? 0).getTime() - new Date(left.createdAt ?? 0).getTime());
}

function sortBookingsByStartDesc(items: Booking[]) {
  return items.slice().sort((left, right) => new Date(right.startsAt).getTime() - new Date(left.startsAt).getTime());
}

function formatStatus(value: string) {
  return value.toLowerCase().replaceAll("_", " ");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC"
  }).format(new Date(value));
}

function isToday(value: string) {
  const date = new Date(value);
  const now = new Date();
  return date.getUTCFullYear() === now.getUTCFullYear() && date.getUTCMonth() === now.getUTCMonth() && date.getUTCDate() === now.getUTCDate();
}
