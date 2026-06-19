"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarCheck,
  CalendarDays,
  KanbanSquare,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Table2,
  Users
} from "lucide-react";
import { ACTIVE_AGENCY_KEY } from "@/components/AgencySwitcher";
import { KpiCard, Skeleton } from "@/components/crm/ui";
import { KanbanView } from "./KanbanView";
import { CalendarView } from "./CalendarView";
import { TableView } from "./TableView";
import { AppointmentDrawer, type DrawerAction } from "./AppointmentDrawer";
import { AppointmentForm } from "./AppointmentForm";
import { KANBAN_ORDER, SOURCE_LABELS, STATUS_LABELS, TYPE_LABELS, vocab } from "./appointment-ui";
import type {
  AppointmentCounts,
  AppointmentFormPayload,
  AppointmentRefs,
  AppointmentSource,
  AppointmentStatus,
  AppointmentType,
  CalendarEvent,
  EnrichedAppointment,
  KanbanColumn,
  RdvFilters
} from "./types";
import { EMPTY_FILTERS } from "./types";

export type ViewMode = "kanban" | "calendar" | "table";

const EMPTY_REFS: AppointmentRefs = {
  instructors: [],
  advisors: [],
  formations: [],
  students: [],
  agencies: [],
  vehicles: []
};

function activeAgency(): string | null {
  if (typeof window === "undefined") return null;
  const agency = window.localStorage.getItem(ACTIVE_AGENCY_KEY);
  return agency && agency !== "all" ? agency : null;
}

/** Construit la query string à partir des filtres (clés non vides uniquement). */
function buildQuery(filters: RdvFilters, agencyId: string | null): string {
  const params = new URLSearchParams();
  const effectiveAgency = filters.agencyId || agencyId || "";
  const entries: [string, string][] = [
    ["q", filters.q],
    ["source", filters.source],
    ["status", filters.status],
    ["type", filters.type],
    ["formationId", filters.formationId],
    ["instructorId", filters.instructorId],
    ["assignedToId", filters.assignedToId],
    ["agencyId", effectiveAgency],
    ["from", filters.from],
    ["to", filters.to]
  ];
  for (const [key, value] of entries) {
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

type RendezVousCockpitProps = {
  /** Vue ouverte par défaut (ex. redirection depuis l'ancien /admin/planning). */
  initialView?: ViewMode;
  /** Filtre source pré-appliqué (ex. redirection depuis /admin/demandes-chatbot). */
  initialSource?: AppointmentSource;
};

export function RendezVousCockpit({ initialView = "kanban", initialSource }: RendezVousCockpitProps = {}) {
  const [view, setView] = useState<ViewMode>(initialView);
  const [filters, setFilters] = useState<RdvFilters>(
    initialSource ? { ...EMPTY_FILTERS, source: initialSource } : EMPTY_FILTERS
  );

  const [refs, setRefs] = useState<AppointmentRefs>(EMPTY_REFS);
  const [counts, setCounts] = useState<AppointmentCounts>({});
  const [appointments, setAppointments] = useState<EnrichedAppointment[]>([]);
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editTarget, setEditTarget] = useState<EnrichedAppointment | null>(null);

  // Plage du calendrier (mise à jour par CalendarView).
  const [calendarRange, setCalendarRange] = useState<{ from: string; to: string } | null>(null);

  const agency = activeAgency();
  const listQuery = useMemo(() => buildQuery(filters, agency), [filters, agency]);

  /** Charge la liste (table + KPIs + refs) et le kanban. */
  const loadCore = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const kanbanQuery = (() => {
        const params = new URLSearchParams();
        const eff = filters.agencyId || agency || "";
        if (filters.source) params.set("source", filters.source);
        if (eff) params.set("agencyId", eff);
        if (filters.instructorId) params.set("instructorId", filters.instructorId);
        if (filters.assignedToId) params.set("assignedToId", filters.assignedToId);
        const qs = params.toString();
        return qs ? `?${qs}` : "";
      })();

      const [listRes, kanbanRes] = await Promise.all([
        fetch(`/api/admin/appointments${listQuery}`).then((r) => r.json()),
        fetch(`/api/admin/appointments/kanban${kanbanQuery}`).then((r) => r.json())
      ]);

      if (!listRes?.data) throw new Error(listRes?.error?.message ?? "Impossible de charger les rendez-vous.");
      setAppointments(listRes.data.appointments as EnrichedAppointment[]);
      setCounts((listRes.data.counts ?? {}) as AppointmentCounts);
      setRefs((listRes.data.refs ?? EMPTY_REFS) as AppointmentRefs);

      if (kanbanRes?.data?.columns) {
        const ordered = [...(kanbanRes.data.columns as KanbanColumn[])].sort(
          (a, b) => KANBAN_ORDER.indexOf(a.id) - KANBAN_ORDER.indexOf(b.id)
        );
        setColumns(ordered);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Le service LODENE est momentanément indisponible.");
    } finally {
      setLoading(false);
    }
  }, [listQuery, filters.source, filters.agencyId, filters.instructorId, filters.assignedToId, agency]);

  useEffect(() => {
    void loadCore();
  }, [loadCore]);

  /** Charge le calendrier quand la plage ou les filtres changent. */
  const loadCalendar = useCallback(
    async (from: string, to: string) => {
      const params = new URLSearchParams({ from, to, includeLessons: "true" });
      const eff = filters.agencyId || agency || "";
      if (filters.instructorId) params.set("instructorId", filters.instructorId);
      if (eff) params.set("agencyId", eff);
      if (filters.formationId) params.set("formationId", filters.formationId);
      if (filters.source) params.set("source", filters.source);
      if (filters.status) params.set("status", filters.status);
      try {
        const res = await fetch(`/api/admin/appointments/calendar?${params.toString()}`).then((r) => r.json());
        if (res?.data?.events) setEvents(res.data.events as CalendarEvent[]);
      } catch {
        /* le calendrier est secondaire : ne bloque pas l'écran */
      }
    },
    [filters.agencyId, filters.instructorId, filters.formationId, filters.source, filters.status, agency]
  );

  useEffect(() => {
    if (view === "calendar" && calendarRange) {
      void loadCalendar(calendarRange.from, calendarRange.to);
    }
  }, [view, calendarRange, loadCalendar]);

  const handleRangeChange = useCallback((from: string, to: string) => {
    setCalendarRange({ from, to });
  }, []);

  const refresh = useCallback(() => {
    setReloadKey((k) => k + 1);
    void loadCore();
    if (view === "calendar" && calendarRange) void loadCalendar(calendarRange.from, calendarRange.to);
  }, [loadCore, loadCalendar, view, calendarRange]);

  const setFilter = (key: keyof RdvFilters, value: string) => setFilters((prev) => ({ ...prev, [key]: value }));

  /* ---------------------------- Actions ---------------------------- */

  const runAction = useCallback(
    async (id: string, action: DrawerAction): Promise<boolean> => {
      setBusyId(id);
      setError(null);
      setNotice(null);
      try {
        let url = "";
        let method: "PATCH" | "POST" | "DELETE" | "PUT" = "PATCH";
        let body: Record<string, unknown> | undefined;

        switch (action.kind) {
          case "status":
            url = `/api/admin/appointments/${id}/status`;
            body = { status: action.status };
            break;
          case "reschedule":
            url = `/api/admin/appointments/${id}/reschedule`;
            body = { startsAt: action.startsAt, endsAt: action.endsAt, force: action.force };
            break;
          case "assign":
            url = `/api/admin/appointments/${id}/assign`;
            body = { assignedToId: action.assignedToId, instructorId: action.instructorId, vehicleId: action.vehicleId };
            break;
          case "notify":
            url = `/api/admin/appointments/${id}/notify`;
            method = "POST";
            body = { channel: action.channel };
            break;
          case "transform":
            url = `/api/admin/appointments/${id}/transform-to-student`;
            method = "POST";
            body = {};
            break;
          case "notes":
            url = `/api/admin/appointments/${id}`;
            method = "PUT";
            body = { notes: action.notes };
            break;
          case "delete":
            url = `/api/admin/appointments/${id}`;
            method = "DELETE";
            break;
        }

        const response = await fetch(url, {
          method,
          ...(body !== undefined ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {})
        });
        const payload = await response.json().catch(() => null);

        if (response.status === 409 && action.kind === "reschedule") {
          const message = payload?.error?.message ?? "Conflit de créneau.";
          const forced = window.confirm(`${message}\n\nForcer la replanification malgré le conflit ?`);
          if (forced) {
            return await runAction(id, { ...action, force: true });
          }
          setError(message);
          return false;
        }

        if (!response.ok) throw new Error(payload?.error?.message ?? "Action impossible.");

        // WhatsApp : ouvrir le lien wa.me retourné.
        if (action.kind === "notify" && action.channel === "whatsapp" && payload?.data?.url) {
          window.open(payload.data.url as string, "_blank", "noopener");
        }

        if (action.kind === "transform") setNotice("Prospect transformé en élève.");
        if (action.kind === "delete") {
          setNotice("Rendez-vous supprimé.");
          if (drawerId === id) setDrawerId(null);
        }

        refresh();
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Action impossible.");
        return false;
      } finally {
        setBusyId(null);
      }
    },
    [drawerId, refresh]
  );

  /** Déplacement kanban (drag-drop ou menu) → PATCH /status. */
  const moveCard = useCallback(
    (appointment: EnrichedAppointment, column: KanbanColumn) => {
      // Optimiste : déplacer la carte localement.
      setColumns((prev) =>
        prev.map((col) => {
          if (col.id === appointment.kanbanColumn) return { ...col, cards: col.cards.filter((c) => c.id !== appointment.id) };
          if (col.id === column.id)
            return { ...col, cards: [{ ...appointment, kanbanColumn: column.id, status: column.dropStatus }, ...col.cards] };
          return col;
        })
      );
      void runAction(appointment.id, { kind: "status", status: column.dropStatus });
    },
    [runAction]
  );

  /* ---------------------------- Formulaire ---------------------------- */

  const submitForm = useCallback(
    async (payload: AppointmentFormPayload) => {
      const url = formMode === "edit" && editTarget ? `/api/admin/appointments/${editTarget.id}` : "/api/admin/appointments";
      const method = formMode === "edit" ? "PUT" : "POST";
      const body: AppointmentFormPayload = { ...payload };
      if (!body.agencyId && agency) body.agencyId = agency;
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error?.message ?? "Enregistrement impossible.");
      setFormOpen(false);
      setEditTarget(null);
      setNotice(formMode === "edit" ? "Rendez-vous mis à jour." : "Rendez-vous créé.");
      refresh();
    },
    [formMode, editTarget, agency, refresh]
  );

  const openEdit = (appointment: EnrichedAppointment) => {
    setEditTarget(appointment);
    setFormMode("edit");
    setFormOpen(true);
  };

  /* ----------------------------- Rendu ----------------------------- */

  const kpis = [
    { label: "À confirmer", value: counts.nouveau ?? 0, icon: CalendarDays, accent: "amber" as const },
    { label: "Confirmés", value: counts.confirme ?? 0, icon: CalendarCheck, accent: "emerald" as const },
    { label: "Planifiés", value: counts.planifie ?? 0, icon: Users, accent: "brand" as const },
    { label: "À relancer", value: counts.relance ?? 0, icon: RotateCcw, accent: "rose" as const }
  ];

  return (
    <div className="grid gap-5">
      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} icon={kpi.icon} label={kpi.label} value={kpi.value} accent={kpi.accent} loading={loading} />
        ))}
      </div>

      {/* Barre supérieure : sélecteur de vue + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-0.5">
          <ViewButton icon={KanbanSquare} label="Kanban" active={view === "kanban"} onClick={() => setView("kanban")} />
          <ViewButton icon={CalendarDays} label="Planning" active={view === "calendar"} onClick={() => setView("calendar")} />
          <ViewButton icon={Table2} label="Tableau" active={view === "table"} onClick={() => setView("table")} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={refresh}
            className="focus-ring inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-loden-ink shadow-soft transition hover:bg-loden-50"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" /> Actualiser
          </button>
          <button
            type="button"
            onClick={() => {
              setFormMode("create");
              setEditTarget(null);
              setFormOpen(true);
            }}
            className="focus-ring inline-flex items-center gap-2 rounded-xl bg-loden-700 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-loden-800"
          >
            <Plus className="h-4 w-4" aria-hidden="true" /> Créer un rendez-vous
          </button>
        </div>
      </div>

      {/* Barre de filtres */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-soft">
        <div className="flex flex-wrap items-center gap-2">
          {view === "table" ? (
            <div className="relative min-w-[180px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                value={filters.q}
                onChange={(e) => setFilter("q", e.target.value)}
                placeholder="Rechercher (nom, téléphone, email)…"
                aria-label="Rechercher"
                className="focus-ring w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-loden-200 focus:bg-white"
              />
            </div>
          ) : null}
          <FilterSelect value={filters.source} onChange={(v) => setFilter("source", v)} ariaLabel="Source" placeholder="Toutes sources">
            {vocab.source.map((s: AppointmentSource) => <option key={s} value={s}>{SOURCE_LABELS[s]}</option>)}
          </FilterSelect>
          <FilterSelect value={filters.status} onChange={(v) => setFilter("status", v)} ariaLabel="Statut" placeholder="Tous statuts">
            {vocab.status.map((s: AppointmentStatus) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </FilterSelect>
          <FilterSelect value={filters.type} onChange={(v) => setFilter("type", v)} ariaLabel="Type" placeholder="Tous types">
            {vocab.type.map((t: AppointmentType) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
          </FilterSelect>
          <FilterSelect value={filters.formationId} onChange={(v) => setFilter("formationId", v)} ariaLabel="Formation" placeholder="Toutes formations">
            {refs.formations.map((f) => <option key={f.id} value={f.id}>{f.title}</option>)}
          </FilterSelect>
          <FilterSelect value={filters.assignedToId} onChange={(v) => setFilter("assignedToId", v)} ariaLabel="Conseiller" placeholder="Tous conseillers">
            {refs.advisors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </FilterSelect>
          <FilterSelect value={filters.instructorId} onChange={(v) => setFilter("instructorId", v)} ariaLabel="Moniteur" placeholder="Tous moniteurs">
            {refs.instructors.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
          </FilterSelect>
          {refs.agencies.length > 1 ? (
            <FilterSelect value={filters.agencyId} onChange={(v) => setFilter("agencyId", v)} ariaLabel="Agence" placeholder="Toutes agences">
              {refs.agencies.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </FilterSelect>
          ) : null}
          <label className="inline-flex items-center gap-1 text-xs text-loden-muted">
            <span className="sr-only">Du</span>
            <input type="date" value={filters.from} onChange={(e) => setFilter("from", e.target.value)} aria-label="Date de début" className="rounded-lg border border-slate-200 bg-slate-50/70 px-2 py-1.5 text-sm text-loden-ink outline-none" />
          </label>
          <label className="inline-flex items-center gap-1 text-xs text-loden-muted">
            <span className="sr-only">Au</span>
            <input type="date" value={filters.to} onChange={(e) => setFilter("to", e.target.value)} aria-label="Date de fin" className="rounded-lg border border-slate-200 bg-slate-50/70 px-2 py-1.5 text-sm text-loden-ink outline-none" />
          </label>
          {Object.values(filters).some(Boolean) ? (
            <button
              type="button"
              onClick={() => setFilters(EMPTY_FILTERS)}
              className="focus-ring rounded-lg px-2 py-1.5 text-xs font-semibold text-loden-700 hover:bg-loden-50"
            >
              Réinitialiser
            </button>
          ) : null}
        </div>
      </div>

      {notice ? <p className="rounded-2xl bg-loden-50 px-4 py-2 text-sm font-medium text-loden-800">{notice}</p> : null}
      {error ? <p className="rounded-2xl bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700">{error}</p> : null}

      {/* Vues */}
      {loading && view !== "calendar" ? (
        <div className="grid gap-3">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : view === "kanban" ? (
        <KanbanView columns={columns} busyId={busyId} onOpen={setDrawerId} onMove={moveCard} onAction={(id, a) => void runAction(id, a)} />
      ) : view === "calendar" ? (
        <CalendarView events={events} onRangeChange={handleRangeChange} onOpenAppointment={setDrawerId} />
      ) : (
        <TableView appointments={appointments} onOpen={setDrawerId} />
      )}

      <AppointmentDrawer
        appointmentId={drawerId}
        refs={refs}
        reloadKey={reloadKey}
        onClose={() => setDrawerId(null)}
        onEdit={openEdit}
        onAction={runAction}
      />

      <AppointmentForm
        open={formOpen}
        mode={formMode}
        appointment={editTarget}
        refs={refs}
        onClose={() => {
          setFormOpen(false);
          setEditTarget(null);
        }}
        onSubmit={submitForm}
      />
    </div>
  );
}


function ViewButton({
  icon: Icon,
  label,
  active,
  onClick
}: {
  icon: typeof KanbanSquare;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`focus-ring inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${active ? "bg-white text-loden-700 shadow-soft" : "text-loden-muted hover:text-loden-ink"}`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  );
}

function FilterSelect({
  value,
  onChange,
  ariaLabel,
  placeholder,
  children
}: {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  placeholder: string;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={ariaLabel}
      className="focus-ring rounded-lg border border-slate-200 bg-slate-50/70 px-2 py-1.5 text-sm font-medium text-loden-ink outline-none transition focus:border-loden-200 focus:bg-white"
    >
      <option value="">{placeholder}</option>
      {children}
    </select>
  );
}
