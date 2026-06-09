"use client";

import { useEffect, useState } from "react";
import { Building2, MapPin, Pencil, Plus, X } from "lucide-react";
import { Card, EmptyState, SectionHeader, Skeleton } from "@/components/crm/ui";

type Agency = {
  id: string;
  name: string;
  slug: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  active: boolean;
};

const EMPTY = { name: "", slug: "", address: "", phone: "", email: "" };

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function AgenciesManager() {
  const [items, setItems] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);

  const load = () => {
    setLoading(true);
    fetch("/api/agencies")
      .then((r) => r.json())
      .then((p) => {
        if (Array.isArray(p?.data)) setItems(p.data as Agency[]);
        else setError(p?.error?.message ?? "Chargement des agences impossible.");
      })
      .catch(() => setError("Chargement des agences impossible."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const cancel = () => {
    setEditingId(null);
    setForm(EMPTY);
  };

  const startEdit = (a: Agency) => {
    setEditingId(a.id);
    setForm({ name: a.name, slug: a.slug, address: a.address ?? "", phone: a.phone ?? "", email: a.email ?? "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async () => {
    const slug = form.slug.trim() || slugify(form.name);
    if (form.name.trim().length < 2 || slug.length < 2) {
      setError("Nom et slug (≥ 2 caractères) sont requis.");
      return;
    }
    setBusy(true);
    setError(null);
    const payload = {
      name: form.name.trim(),
      slug,
      ...(form.address.trim() ? { address: form.address.trim() } : {}),
      ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
      ...(form.email.trim() ? { email: form.email.trim() } : {})
    };
    try {
      const response = await fetch(editingId ? `/api/agencies/${editingId}` : "/api/agencies", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error?.message ?? "Enregistrement impossible.");
      cancel();
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enregistrement impossible.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <SectionHeader
          title={editingId ? "Modifier l'agence" : "Ajouter une agence"}
          subtitle="Centres / agences de l'auto-école."
          icon={editingId ? Pencil : Plus}
          action={
            editingId ? (
              <button type="button" onClick={cancel} className="focus-ring inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-loden-muted hover:bg-slate-50">
                <X className="h-3.5 w-3.5" aria-hidden="true" /> Annuler
              </button>
            ) : undefined
          }
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input className="field-input" placeholder="Nom *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} aria-label="Nom" />
          <input className="field-input" placeholder="Slug (auto si vide)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} aria-label="Slug" />
          <input className="field-input sm:col-span-2" placeholder="Adresse" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} aria-label="Adresse" />
          <input className="field-input" placeholder="Téléphone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} aria-label="Téléphone" />
          <input className="field-input" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} aria-label="Email" />
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={busy}
          className="focus-ring mt-4 inline-flex items-center gap-2 rounded-xl bg-loden-700 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-loden-800 disabled:opacity-70"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {busy ? "Enregistrement…" : editingId ? "Enregistrer" : "Ajouter l'agence"}
        </button>
        {error ? <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700">{error}</p> : null}
      </Card>

      <div>
        <SectionHeader title="Agences / centres" subtitle={loading ? undefined : `${items.length} agence(s)`} icon={Building2} />
        <div className="mt-4">
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2">{[0, 1].map((i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}</div>
          ) : items.length === 0 ? (
            <Card className="p-6"><EmptyState icon={Building2} title="Aucune agence" description="Ajoute ta première agence ci-dessus." /></Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {items.map((a) => (
                <Card key={a.id} className="flex flex-col p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-loden-50 text-loden-700">
                        <Building2 className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div>
                        <p className="font-semibold text-loden-ink">{a.name}</p>
                        <p className="text-xs text-loden-muted">{a.slug}</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => startEdit(a)} className="focus-ring rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-loden-700 hover:bg-loden-50">Modifier</button>
                  </div>
                  <div className="mt-3 space-y-1 text-sm text-loden-muted">
                    {a.address ? <p className="flex items-start gap-1.5"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />{a.address}</p> : null}
                    {a.phone ? <p>{a.phone}</p> : null}
                    {a.email ? <p>{a.email}</p> : null}
                    {!a.address && !a.phone && !a.email ? <p className="italic">Coordonnées non renseignées</p> : null}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
