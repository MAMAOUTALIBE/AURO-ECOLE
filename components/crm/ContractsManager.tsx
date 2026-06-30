"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, FileSignature, Plus, Search, X } from "lucide-react";
import { ACTIVE_AGENCY_KEY } from "@/components/AgencySwitcher";
import { Badge, Card, EmptyState, KpiCard, Pagination, SectionHeader, Skeleton, type BadgeVariant } from "@/components/crm/ui";
import { euros, CONTRACT_STATUS_LABELS, type ContractStatus } from "@/lib/contract-mappers";

const PAGE_SIZE = 10;
const DEFAULT_BODY = `Le présent contrat de formation est conclu entre l'auto-école LODENE et l'élève désigné ci-dessous.\n\n1. Objet : formation à la conduite et préparation à l'examen du permis.\n2. Durée et modalités : selon le forfait souscrit.\n3. Prix et règlement : montant indiqué, payable selon l'échéancier convenu.\n4. Conditions générales : conformément au règlement intérieur de l'auto-école.`;

type Contract = {
  id: string;
  number: string | null;
  status: ContractStatus;
  clientUserId: string;
  title: string;
  totalCents: number;
  signedAt?: string | null;
  clientSnapshot?: { name: string } | null;
  createdAt: string;
};
type StudentOpt = { id: string; userId: string; name: string };
type FormationOpt = { id: string; title: string };

const STATUS_VARIANT: Record<ContractStatus, BadgeVariant> = {
  BROUILLON: "neutral",
  ACTIF: "success",
  RESILIE: "danger",
  TERMINE: "info"
};
const STATUS_FILTERS = [
  { key: "ALL", label: "Tous" },
  { key: "BROUILLON", label: "Brouillons" },
  { key: "ACTIF", label: "Actifs" },
  { key: "RESILIE", label: "Résiliés" },
  { key: "TERMINE", label: "Terminés" }
];

export function ContractsManager() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [students, setStudents] = useState<StudentOpt[]>([]);
  const [formations, setFormations] = useState<FormationOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  // Formulaire repliable : masqué par défaut pour que la liste des contrats soit visible d'emblée.
  const [formOpen, setFormOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ clientUserId: "", formationId: "", title: "Contrat de formation au permis B", body: DEFAULT_BODY, priceEuros: "", startsAt: "" });

  const load = () => {
    setLoading(true);
    const agency = window.localStorage.getItem(ACTIVE_AGENCY_KEY);
    const q = agency && agency !== "all" ? `?agencyId=${encodeURIComponent(agency)}` : "";
    Promise.all([
      fetch(`/api/contracts${q}`).then((r) => r.json()).catch(() => null),
      fetch("/api/students").then((r) => r.json()).catch(() => null),
      fetch("/api/formations").then((r) => r.json()).catch(() => null)
    ])
      .then(([contractPayload, studentPayload, formationPayload]) => {
        if (Array.isArray(contractPayload?.data)) setContracts(contractPayload.data as Contract[]);
        else setError(contractPayload?.error?.message ?? "Chargement des contrats impossible.");
        if (Array.isArray(studentPayload?.data)) {
          setStudents(
            studentPayload.data.map((s: { id: string; userId: string; user: { firstName: string; lastName: string } | null }) => ({
              id: s.id,
              userId: s.userId,
              name: s.user ? `${s.user.firstName} ${s.user.lastName}` : s.id
            }))
          );
        }
        if (Array.isArray(formationPayload?.data)) setFormations(formationPayload.data.map((f: { id: string; title: string }) => ({ id: f.id, title: f.title })));
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const clientName = (c: Contract) => c.clientSnapshot?.name || students.find((s) => s.userId === c.clientUserId)?.name || "Client";

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return contracts.filter((c) => {
      const matchesQuery = !term || `${c.number ?? ""} ${clientName(c)} ${c.title}`.toLowerCase().includes(term);
      const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contracts, students, query, statusFilter]);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter]);

  const kpis = useMemo(() => ({
    active: contracts.filter((c) => c.status === "ACTIF").length,
    activeValue: contracts.filter((c) => c.status === "ACTIF").reduce((s, c) => s + c.totalCents, 0),
    drafts: contracts.filter((c) => c.status === "BROUILLON").length
  }), [contracts]);

  const create = async () => {
    if (!form.clientUserId || form.title.trim().length < 2 || form.body.trim().length < 10) {
      setError("Client, titre et corps du contrat (≥10 car.) sont requis.");
      return;
    }
    const student = students.find((s) => s.userId === form.clientUserId);
    setCreating(true);
    setError(null);
    try {
      const response = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientUserId: form.clientUserId,
          ...(student ? { studentId: student.id } : {}),
          ...(form.formationId ? { formationId: form.formationId } : {}),
          title: form.title.trim(),
          body: form.body.trim(),
          totalCents: form.priceEuros ? Math.round(Number(form.priceEuros) * 100) : 0,
          ...(form.startsAt ? { startsAt: form.startsAt } : {})
        })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error?.message ?? "Création impossible.");
      setForm({ clientUserId: "", formationId: "", title: "Contrat de formation au permis B", body: DEFAULT_BODY, priceEuros: "", startsAt: "" });
      setFormOpen(false);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Création impossible.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard icon={FileSignature} label="Contrats actifs" value={loading ? "" : kpis.active} loading={loading} accent="emerald" />
        <KpiCard icon={FileSignature} label="Valeur active" value={loading ? "" : euros(kpis.activeValue)} loading={loading} accent="brand" />
        <KpiCard icon={FileSignature} label="Brouillons" value={loading ? "" : kpis.drafts} loading={loading} accent="amber" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher (n°, client, titre)…"
              aria-label="Rechercher un contrat"
              className="focus-ring w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-loden-200 focus:bg-white"
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filtrer par statut" className="field-input sm:max-w-[170px]">
            {STATUS_FILTERS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
          </select>
        </div>
      </div>

      {error ? <p className="rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700">{error}</p> : null}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-loden-50 text-loden-700">
            <FileSignature className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="font-semibold text-loden-ink">Contrats</p>
            <p className="text-sm text-loden-muted">{contracts.length} contrat(s)</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => (formOpen ? setFormOpen(false) : setFormOpen(true))}
          className={`focus-ring inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold shadow-soft transition ${formOpen ? "border border-slate-200 bg-white text-loden-muted hover:bg-slate-50" : "bg-loden-700 text-white hover:bg-loden-800"}`}
        >
          {formOpen ? <X className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
          {formOpen ? "Fermer le formulaire" : "Nouveau contrat"}
        </button>
      </div>

      {formOpen ? (
        <Card className="p-5">
          <SectionHeader title="Nouveau contrat (brouillon)" subtitle="Le numéro est attribué à l'activation (signature)." icon={FileSignature} />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <select className="field-input" value={form.clientUserId} onChange={(e) => setForm({ ...form, clientUserId: e.target.value })} aria-label="Élève">
              <option value="">— Élève —</option>
              {students.map((s) => <option key={s.id} value={s.userId}>{s.name}</option>)}
            </select>
            <select className="field-input" value={form.formationId} onChange={(e) => setForm({ ...form, formationId: e.target.value })} aria-label="Formation">
              <option value="">— Formation (optionnel) —</option>
              {formations.map((f) => <option key={f.id} value={f.id}>{f.title}</option>)}
            </select>
            <input className="field-input sm:col-span-2" placeholder="Titre du contrat" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} aria-label="Titre" />
            <textarea className="field-input min-h-32 sm:col-span-2" placeholder="Corps / conditions du contrat" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} aria-label="Corps du contrat" />
            <input className="field-input" type="number" min={0} step="0.01" placeholder="Prix € (optionnel)" value={form.priceEuros} onChange={(e) => setForm({ ...form, priceEuros: e.target.value })} aria-label="Prix" />
            <input className="field-input" type="date" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} aria-label="Date de début" />
          </div>
          <button
            type="button"
            onClick={create}
            disabled={creating}
            className="focus-ring mt-4 inline-flex items-center gap-2 rounded-xl bg-loden-700 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-loden-800 disabled:opacity-70"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {creating ? "Création…" : "Enregistrer le brouillon"}
          </button>
        </Card>
      ) : null}

      <Card className="p-0">
        {loading ? (
          <div className="space-y-2 p-5">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={FileSignature} title={contracts.length === 0 ? "Aucun contrat" : "Aucun résultat"} description={contracts.length === 0 ? "Crée un premier contrat ci-dessus." : "Aucun contrat ne correspond."} />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-loden-muted">
                  <tr className="border-b border-slate-200">
                    <th className="px-5 py-3 font-semibold">Numéro</th>
                    <th className="px-5 py-3 font-semibold">Client</th>
                    <th className="px-5 py-3 font-semibold">Objet</th>
                    <th className="px-5 py-3 font-semibold">Montant</th>
                    <th className="px-5 py-3 font-semibold">Statut</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {paged.map((c) => (
                    <tr key={c.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-5 py-3 font-mono text-xs text-loden-ink">{c.number ?? "—"}</td>
                      <td className="px-5 py-3 font-semibold text-loden-ink">{clientName(c)}</td>
                      <td className="px-5 py-3 text-loden-muted">{c.title}</td>
                      <td className="px-5 py-3 font-semibold text-loden-ink">{c.totalCents > 0 ? euros(c.totalCents) : "—"}</td>
                      <td className="px-5 py-3"><Badge variant={STATUS_VARIANT[c.status]}>{CONTRACT_STATUS_LABELS[c.status]}</Badge></td>
                      <td className="px-5 py-3 text-right">
                        <Link href={`/admin/contrats/${c.id}`} className="focus-ring inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-loden-ink hover:bg-loden-50">
                          Ouvrir <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 pb-4">
              <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPage={setPage} />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
