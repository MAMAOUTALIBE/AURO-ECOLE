"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, Newspaper, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { Badge, Card, EmptyState, Pagination, SectionHeader, Skeleton } from "@/components/crm/ui";

const PAGE_SIZE = 10;
const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

type ContentType = "PAGE" | "ARTICLE";
type Entry = {
  id: string;
  type: ContentType;
  title: string;
  slug: string;
  excerpt?: string | null;
  body: string;
  published: boolean;
  publishedAt?: string | null;
  updatedAt: string;
};
const EMPTY = { title: "", slug: "", excerpt: "", body: "", published: false };

export function ContentEntriesManager({ type }: { type: ContentType }) {
  const isArticle = type === "ARTICLE";
  const noun = isArticle ? "article" : "page";
  const Icon = isArticle ? Newspaper : FileText;

  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const load = () => {
    setLoading(true);
    fetch(`/api/content-entries?type=${type}`)
      .then((r) => r.json())
      .then((p) => {
        if (Array.isArray(p?.data)) setEntries(p.data as Entry[]);
        else setError(p?.error?.message ?? "Chargement impossible.");
      })
      .catch(() => setError("Chargement impossible."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [type]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) => `${e.title} ${e.slug}`.toLowerCase().includes(q));
  }, [entries, query]);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [query]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY);
    setShowForm(true);
  };
  const openEdit = (e: Entry) => {
    setEditingId(e.id);
    setForm({ title: e.title, slug: e.slug, excerpt: e.excerpt ?? "", body: e.body, published: e.published });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async () => {
    const slug = form.slug.trim() || slugify(form.title);
    if (form.title.trim().length < 2 || slug.length < 2 || form.body.trim().length < 10) {
      setError("Titre, slug et corps (≥ 10 caractères) sont requis.");
      return;
    }
    setBusy(true);
    setError(null);
    const payload = {
      ...(editingId ? {} : { type }),
      title: form.title.trim(),
      slug,
      ...(form.excerpt.trim() ? { excerpt: form.excerpt.trim() } : {}),
      body: form.body.trim(),
      published: form.published
    };
    try {
      const response = await fetch(editingId ? `/api/content-entries/${editingId}` : "/api/content-entries", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error?.message ?? "Enregistrement impossible.");
      setShowForm(false);
      setForm(EMPTY);
      setEditingId(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enregistrement impossible.");
    } finally {
      setBusy(false);
    }
  };

  const togglePublish = async (e: Entry) => {
    setEntries((cur) => cur.map((x) => (x.id === e.id ? { ...x, published: !x.published } : x)));
    try {
      const response = await fetch(`/api/content-entries/${e.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !e.published })
      });
      if (!response.ok) throw new Error();
    } catch {
      setEntries((cur) => cur.map((x) => (x.id === e.id ? { ...x, published: e.published } : x)));
      setError("Mise à jour impossible.");
    }
  };

  const remove = async (e: Entry) => {
    if (!window.confirm(`Supprimer « ${e.title} » ?`)) return;
    try {
      const response = await fetch(`/api/content-entries/${e.id}`, { method: "DELETE" });
      if (!response.ok && response.status !== 204) throw new Error();
      setEntries((cur) => cur.filter((x) => x.id !== e.id));
    } catch {
      setError("Suppression impossible.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative min-w-[220px] max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Rechercher un ${noun}…`}
            aria-label="Rechercher"
            className="focus-ring w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-loden-200 focus:bg-white"
          />
        </div>
        <button type="button" onClick={openCreate} className="focus-ring inline-flex items-center gap-1.5 rounded-xl bg-loden-700 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-loden-800">
          <Plus className="h-4 w-4" aria-hidden="true" /> {isArticle ? "Nouvel article" : "Nouvelle page"}
        </button>
      </div>

      {error ? <p className="rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700">{error}</p> : null}

      {showForm ? (
        <Card className="p-5">
          <SectionHeader
            title={editingId ? `Modifier ${isArticle ? "l'article" : "la page"}` : isArticle ? "Nouvel article" : "Nouvelle page"}
            icon={editingId ? Pencil : Plus}
            action={
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY); }} className="focus-ring inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-loden-muted hover:bg-slate-50">
                <X className="h-3.5 w-3.5" aria-hidden="true" /> Annuler
              </button>
            }
          />
          <div className="mt-4 grid gap-3">
            <input className="field-input" placeholder="Titre" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} aria-label="Titre" />
            <input className="field-input" placeholder="Slug (auto si vide)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} aria-label="Slug" />
            {isArticle ? (
              <input className="field-input" placeholder="Extrait (résumé court)" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} aria-label="Extrait" />
            ) : null}
            <textarea className="field-input min-h-40" placeholder="Contenu" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} aria-label="Contenu" />
            <label className="flex items-center gap-2 text-sm font-medium text-loden-ink">
              <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} /> Publié (visible sur le site)
            </label>
          </div>
          <button type="button" onClick={submit} disabled={busy} className="focus-ring mt-4 inline-flex items-center gap-2 rounded-xl bg-loden-700 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-loden-800 disabled:opacity-70">
            <Plus className="h-4 w-4" aria-hidden="true" />
            {busy ? "Enregistrement…" : editingId ? "Enregistrer" : "Créer"}
          </button>
        </Card>
      ) : null}

      <Card className="p-0">
        {loading ? (
          <div className="space-y-2 p-5">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="p-6"><EmptyState icon={Icon} title={`Aucun${isArticle ? " article" : "e page"}`} description={`Crée ${isArticle ? "un premier article" : "une première page"} ci-dessus.`} /></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-loden-muted">
                  <tr className="border-b border-slate-200">
                    <th className="px-5 py-3 font-semibold">Titre</th>
                    <th className="px-5 py-3 font-semibold">Slug</th>
                    <th className="px-5 py-3 font-semibold">Statut</th>
                    <th className="px-5 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((e) => (
                    <tr key={e.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-5 py-3 font-semibold text-loden-ink">{e.title}</td>
                      <td className="px-5 py-3 font-mono text-xs text-loden-muted">/{e.slug}</td>
                      <td className="px-5 py-3"><Badge variant={e.published ? "success" : "neutral"} dot>{e.published ? "Publié" : "Brouillon"}</Badge></td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => openEdit(e)} className="focus-ring rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-loden-700 hover:bg-loden-50">Modifier</button>
                          <button type="button" onClick={() => togglePublish(e)} className="focus-ring rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-loden-muted hover:bg-slate-50">{e.published ? "Dépublier" : "Publier"}</button>
                          <button type="button" onClick={() => remove(e)} aria-label="Supprimer" className="focus-ring inline-flex items-center rounded-lg border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"><Trash2 className="h-3.5 w-3.5" aria-hidden="true" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 pb-4"><Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPage={setPage} /></div>
          </>
        )}
      </Card>
    </div>
  );
}
