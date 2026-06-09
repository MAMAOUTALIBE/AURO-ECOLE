"use client";

import { useEffect, useState } from "react";
import { GraduationCap, Pencil, Plus, X } from "lucide-react";
import { Badge, Card, EmptyState, SectionHeader, Skeleton } from "@/components/crm/ui";

type Formation = {
  id: string;
  title: string;
  slug: string;
  description: string;
  mode: "MANUEL" | "AUTOMATIQUE" | "MIXTE" | "CODE";
  priceCents: number;
  durationLabel: string;
  cpfEligible: boolean;
  active: boolean;
};

const MODES = [
  { key: "MANUEL", label: "Manuelle" },
  { key: "AUTOMATIQUE", label: "Automatique" },
  { key: "MIXTE", label: "Mixte" },
  { key: "CODE", label: "Code" }
];

const EMPTY = { title: "", slug: "", description: "", mode: "MANUEL", priceEuros: "", durationLabel: "", cpfEligible: false, active: true };

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const euros = (cents: number) =>
  cents > 0 ? new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(cents / 100) : "Sur devis";

export function FormationsManager() {
  const [items, setItems] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);

  const load = () => {
    setLoading(true);
    fetch("/api/formations?includeInactive=true")
      .then((r) => r.json())
      .then((p) => {
        if (Array.isArray(p?.data)) setItems(p.data as Formation[]);
      })
      .catch(() => setError("Chargement du catalogue impossible."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const cancel = () => {
    setEditingId(null);
    setForm(EMPTY);
  };

  const startEdit = (f: Formation) => {
    setEditingId(f.id);
    setForm({
      title: f.title,
      slug: f.slug,
      description: f.description,
      mode: f.mode,
      priceEuros: f.priceCents > 0 ? String(Math.round(f.priceCents / 100)) : "",
      durationLabel: f.durationLabel,
      cpfEligible: f.cpfEligible,
      active: f.active
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async () => {
    const slug = form.slug.trim() || slugify(form.title);
    if (form.title.trim().length < 2 || slug.length < 2 || form.description.trim().length < 10 || form.durationLabel.trim().length < 2) {
      setError("Titre, slug, description (≥10 car.) et durée sont requis.");
      return;
    }
    setBusy(true);
    setError(null);
    const payload = {
      title: form.title.trim(),
      slug,
      description: form.description.trim(),
      mode: form.mode,
      priceCents: form.priceEuros ? Math.round(Number(form.priceEuros) * 100) : 0,
      durationLabel: form.durationLabel.trim(),
      cpfEligible: form.cpfEligible,
      active: form.active
    };
    try {
      const response = await fetch(editingId ? `/api/formations/${editingId}` : "/api/formations", {
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

  const toggleActive = async (f: Formation) => {
    setItems((cur) => cur.map((i) => (i.id === f.id ? { ...i, active: !i.active } : i)));
    try {
      const response = await fetch(`/api/formations/${f.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !f.active })
      });
      if (!response.ok) throw new Error();
    } catch {
      setItems((cur) => cur.map((i) => (i.id === f.id ? { ...i, active: f.active } : i)));
      setError("Mise à jour impossible.");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <SectionHeader
          title={editingId ? "Modifier la formation" : "Ajouter une formation"}
          subtitle="Catalogue affiché sur le site public."
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
          <input className="field-input" placeholder="Titre *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} aria-label="Titre" />
          <input className="field-input" placeholder="Slug (auto si vide)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} aria-label="Slug" />
          <textarea className="field-input min-h-20 sm:col-span-2" placeholder="Description (≥ 10 caractères) *" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} aria-label="Description" />
          <select className="field-input" value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })} aria-label="Mode">
            {MODES.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
          </select>
          <input className="field-input" placeholder="Durée (ex. 20 h) *" value={form.durationLabel} onChange={(e) => setForm({ ...form, durationLabel: e.target.value })} aria-label="Durée" />
          <input className="field-input" type="number" min={0} placeholder="Prix en € (0 = sur devis)" value={form.priceEuros} onChange={(e) => setForm({ ...form, priceEuros: e.target.value })} aria-label="Prix en euros" />
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm font-medium text-loden-ink">
              <input type="checkbox" checked={form.cpfEligible} onChange={(e) => setForm({ ...form, cpfEligible: e.target.checked })} /> CPF
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-loden-ink">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active
            </label>
          </div>
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={busy}
          className="focus-ring mt-4 inline-flex items-center gap-2 rounded-xl bg-loden-700 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-loden-800 disabled:opacity-70"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {busy ? "Enregistrement…" : editingId ? "Enregistrer" : "Ajouter la formation"}
        </button>
        {error ? <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700">{error}</p> : null}
      </Card>

      <div>
        <SectionHeader title="Catalogue" subtitle={loading ? undefined : `${items.length} formation(s)`} icon={GraduationCap} />
        <div className="mt-4">
          {loading ? (
            <div className="grid gap-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}</div>
          ) : items.length === 0 ? (
            <Card className="p-6"><EmptyState icon={GraduationCap} title="Catalogue vide" description="Ajoute ta première formation ci-dessus." /></Card>
          ) : (
            <div className="grid gap-3">
              {items.map((f) => (
                <Card key={f.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-loden-ink">{f.title}</p>
                      <Badge variant={f.active ? "success" : "neutral"} dot>{f.active ? "Active" : "Inactive"}</Badge>
                      {f.cpfEligible ? <Badge variant="brand">CPF</Badge> : null}
                    </div>
                    <p className="mt-0.5 text-xs text-loden-muted">
                      {MODES.find((m) => m.key === f.mode)?.label ?? f.mode} · {f.durationLabel} · {euros(f.priceCents)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button type="button" onClick={() => startEdit(f)} className="focus-ring rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-loden-700 hover:bg-loden-50">Modifier</button>
                    <button type="button" onClick={() => toggleActive(f)} className="focus-ring rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-loden-muted hover:bg-slate-50">
                      {f.active ? "Désactiver" : "Activer"}
                    </button>
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
