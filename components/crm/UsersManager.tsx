"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Users, X } from "lucide-react";
import { Badge, Card, EmptyState, Pagination, SectionHeader, Skeleton, type BadgeVariant } from "@/components/crm/ui";

const PAGE_SIZE = 10;

type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
};

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  DIRECTEUR: "Directeur",
  RESPONSABLE_AGENCE: "Resp. agence",
  RESPONSABLE_PEDAGOGIQUE: "Resp. pédagogique",
  ADMIN: "Administrateur",
  SECRETAIRE: "Secrétaire",
  COMPTABLE: "Comptable",
  MONITEUR: "Moniteur",
  EDITEUR: "Éditeur de contenu",
  ELEVE: "Élève",
  VISITEUR: "Visiteur"
};
// Rôles assignables via ce module (pas de SUPER_ADMIN ni ELEVE/VISITEUR).
const ASSIGNABLE = ["DIRECTEUR", "RESPONSABLE_AGENCE", "RESPONSABLE_PEDAGOGIQUE", "ADMIN", "SECRETAIRE", "COMPTABLE", "MONITEUR", "EDITEUR"];
const STATUS_META: Record<string, { label: string; variant: BadgeVariant }> = {
  ACTIVE: { label: "Actif", variant: "success" },
  SUSPENDED: { label: "Suspendu", variant: "warning" },
  ARCHIVED: { label: "Archivé", variant: "neutral" },
  PENDING_EMAIL: { label: "À confirmer", variant: "info" }
};

const EMPTY = { firstName: "", lastName: "", email: "", phone: "", role: "SECRETAIRE" };

export function UsersManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  // Formulaire repliable : masqué par défaut pour que la liste du personnel soit visible d'emblée.
  const [formOpen, setFormOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      `${u.firstName} ${u.lastName} ${u.email} ${ROLE_LABELS[u.role] ?? u.role}`.toLowerCase().includes(q)
    );
  }, [users, query]);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [query]);

  const load = () => {
    setLoading(true);
    fetch("/api/users")
      .then((r) => r.json())
      .then((p) => {
        if (Array.isArray(p?.data)) setUsers(p.data as User[]);
        else setError(p?.error?.message ?? "Chargement des utilisateurs impossible.");
      })
      .catch(() => setError("Chargement des utilisateurs impossible."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const create = async () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      setError("Prénom, nom et email sont requis.");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
          role: form.role
        })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error?.message ?? "Création impossible.");
      setForm(EMPTY);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Création impossible.");
    } finally {
      setCreating(false);
    }
  };

  const patch = async (user: User, body: Partial<Pick<User, "role" | "status">>) => {
    setBusy(user.id);
    setError(null);
    const previous = { role: user.role, status: user.status };
    setUsers((cur) => cur.map((u) => (u.id === user.id ? { ...u, ...body } : u)));
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (!response.ok) throw new Error();
    } catch {
      setUsers((cur) => cur.map((u) => (u.id === user.id ? { ...u, ...previous } : u)));
      setError("Mise à jour de l'utilisateur impossible.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-loden-50 text-loden-700">
            <Plus className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="font-semibold text-loden-ink">Personnel</p>
            <p className="text-sm text-loden-muted">{loading ? "Chargement…" : `${users.length} membre(s)`}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => (formOpen ? setFormOpen(false) : setFormOpen(true))}
          className={`focus-ring inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold shadow-soft transition ${formOpen ? "border border-slate-200 bg-white text-loden-muted hover:bg-slate-50" : "bg-loden-700 text-white hover:bg-loden-800"}`}
        >
          {formOpen ? <X className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
          {formOpen ? "Fermer le formulaire" : "Ajouter un membre"}
        </button>
      </div>

      {formOpen ? (
      <Card className="p-5">
        <SectionHeader title="Ajouter un membre du personnel" subtitle="Crée un compte avec mot de passe temporaire." icon={Plus} />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <input className="field-input" placeholder="Prénom *" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} aria-label="Prénom" />
          <input className="field-input" placeholder="Nom *" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} aria-label="Nom" />
          <input className="field-input" type="email" placeholder="Email *" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} aria-label="Email" />
          <input className="field-input" placeholder="Téléphone (optionnel)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} aria-label="Téléphone" />
          <select className="field-input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} aria-label="Rôle">
            {ASSIGNABLE.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
        </div>
        <button
          type="button"
          onClick={create}
          disabled={creating}
          className="focus-ring mt-4 inline-flex items-center gap-2 rounded-xl bg-loden-700 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-loden-800 disabled:opacity-70"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {creating ? "Ajout…" : "Ajouter le membre"}
        </button>
        {error ? <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700">{error}</p> : null}
      </Card>
      ) : null}

      <div>
        <SectionHeader
          title="Utilisateurs"
          subtitle={loading ? undefined : `${filtered.length} compte(s)`}
          icon={Users}
          action={
            !loading && users.length > 0 ? (
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher (nom, email, rôle)…"
                  aria-label="Rechercher un utilisateur"
                  className="focus-ring w-56 rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-loden-200 focus:bg-white"
                />
              </div>
            ) : undefined
          }
        />
        <div className="mt-4">
          {loading ? (
            <div className="space-y-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>
          ) : filtered.length === 0 ? (
            <Card className="p-6"><EmptyState icon={Users} title={users.length === 0 ? "Aucun utilisateur" : "Aucun résultat"} description={users.length === 0 ? "Ajoute un premier membre du personnel ci-dessus." : "Aucun compte ne correspond à la recherche."} /></Card>
          ) : (
            <>
            <Card className="overflow-x-auto p-0">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-loden-muted">
                  <tr className="border-b border-slate-200">
                    <th className="px-5 py-3 font-semibold">Nom</th>
                    <th className="px-5 py-3 font-semibold">Email</th>
                    <th className="px-5 py-3 font-semibold">Rôle</th>
                    <th className="px-5 py-3 font-semibold">Statut</th>
                    <th className="px-5 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((user) => {
                    const meta = STATUS_META[user.status] ?? { label: user.status, variant: "neutral" as BadgeVariant };
                    const locked = user.role === "SUPER_ADMIN";
                    return (
                      <tr key={user.id} className="border-b border-slate-100 last:border-0">
                        <td className="px-5 py-3 font-semibold text-loden-ink">{user.firstName} {user.lastName}</td>
                        <td className="px-5 py-3 text-loden-muted">{user.email}</td>
                        <td className="px-5 py-3">
                          {locked ? (
                            <Badge variant="brand">{ROLE_LABELS[user.role] ?? user.role}</Badge>
                          ) : (
                            <select
                              aria-label={`Rôle de ${user.firstName}`}
                              disabled={busy === user.id}
                              className="focus-ring cursor-pointer rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-loden-ink outline-none disabled:opacity-60"
                              value={ASSIGNABLE.includes(user.role) ? user.role : ""}
                              onChange={(e) => patch(user, { role: e.target.value })}
                            >
                              {!ASSIGNABLE.includes(user.role) ? <option value="">{ROLE_LABELS[user.role] ?? user.role}</option> : null}
                              {ASSIGNABLE.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                            </select>
                          )}
                        </td>
                        <td className="px-5 py-3"><Badge variant={meta.variant}>{meta.label}</Badge></td>
                        <td className="px-5 py-3">
                          {locked ? (
                            <span className="text-xs text-loden-muted">—</span>
                          ) : (
                            <button
                              type="button"
                              disabled={busy === user.id}
                              onClick={() => patch(user, { status: user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE" })}
                              className="focus-ring rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-loden-ink transition hover:bg-loden-50 disabled:opacity-60"
                            >
                              {user.status === "ACTIVE" ? "Suspendre" : "Réactiver"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
            <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPage={setPage} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
