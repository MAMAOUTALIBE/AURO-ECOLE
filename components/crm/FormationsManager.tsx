"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { ChevronDown, ChevronUp, Euro, FileText, GraduationCap, ImagePlus, Lock, Pencil, Plus, Settings2, Tags, Trash2, X, type LucideIcon } from "lucide-react";
import { Badge, Card, EmptyState, SectionHeader, Skeleton } from "@/components/crm/ui";
import { MediaPickerModal } from "@/components/crm/site/MediaPickerModal";

type ProductLine = "AUTO_ECOLE" | "VTC" | "CACES" | "SST" | "LOGISTIQUE_SECURITE" | "DIGITAL";
type TaxMode = "TTC" | "HT";
type CpfStatus = "NON_RENSEIGNE" | "NON_ELIGIBLE" | "POSSIBLE" | "A_CONFIRMER" | "ELIGIBLE";

type Formation = {
  id: string;
  title: string;
  slug: string;
  subtitle?: string | null;
  description: string;
  mode: "MANUEL" | "AUTOMATIQUE" | "MIXTE" | "CODE";
  productLine?: ProductLine;
  priceCents: number;
  taxMode?: TaxMode;
  quoteOnly?: boolean;
  internalPriceCents?: number | null;
  durationLabel: string;
  imageUrl?: string | null;
  tags?: string[];
  cpfEligible: boolean;
  cpfStatus?: CpfStatus;
  active: boolean;
};

const MODES = [
  { key: "MANUEL", label: "Manuelle" },
  { key: "AUTOMATIQUE", label: "Automatique" },
  { key: "MIXTE", label: "Mixte" },
  { key: "CODE", label: "Code" }
];

const PRODUCT_LINES: { key: ProductLine; label: string }[] = [
  { key: "AUTO_ECOLE", label: "Auto-école" },
  { key: "VTC", label: "VTC" },
  { key: "SST", label: "SST" },
  { key: "LOGISTIQUE_SECURITE", label: "Logistique & sécurité" },
  { key: "CACES", label: "CACES" },
  { key: "DIGITAL", label: "Digital & IA" }
];

const TAX_MODES: { key: TaxMode; label: string }[] = [
  { key: "TTC", label: "TTC" },
  { key: "HT", label: "HT" }
];

const CPF_STATUSES: { key: CpfStatus; label: string }[] = [
  { key: "NON_RENSEIGNE", label: "Non renseigné" },
  { key: "NON_ELIGIBLE", label: "Non éligible" },
  { key: "POSSIBLE", label: "CPF possible" },
  { key: "A_CONFIRMER", label: "À confirmer" },
  { key: "ELIGIBLE", label: "Éligible" }
];

const EMPTY = {
  title: "",
  slug: "",
  subtitle: "",
  description: "",
  mode: "MANUEL",
  productLine: "AUTO_ECOLE" as ProductLine,
  taxMode: "TTC" as TaxMode,
  priceEuros: "",
  internalPriceEuros: "",
  quoteOnly: false,
  durationLabel: "",
  imageUrl: "",
  cpfEligible: false,
  cpfStatus: "NON_RENSEIGNE" as CpfStatus,
  tags: "",
  active: true
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const euros = (cents: number) =>
  cents > 0 ? new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(cents / 100) : "Sur devis";

const productLineLabel = (key?: ProductLine) => PRODUCT_LINES.find((p) => p.key === key)?.label ?? "Auto-école";

type FormSectionKey = "main" | "pricing" | "media" | "options";

export function FormationsManager() {
  const [items, setItems] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [pickerOpen, setPickerOpen] = useState(false);
  // Formulaire repliable : masqué par défaut pour que le catalogue soit visible d'emblée.
  const [formOpen, setFormOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formSections, setFormSections] = useState<Record<FormSectionKey, boolean>>({
    main: true,
    pricing: false,
    media: false,
    options: false
  });

  const load = () => {
    setLoading(true);
    // Lecture admin protégée : inclut le prix interne (jamais exposé côté public).
    fetch("/api/formations/admin")
      .then((r) => r.json())
      .then((p) => {
        if (Array.isArray(p?.data)) setItems(p.data as Formation[]);
        else setError("Chargement du catalogue impossible.");
      })
      .catch(() => setError("Chargement du catalogue impossible."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const cancel = () => {
    setEditingId(null);
    setForm(EMPTY);
    setFormOpen(false);
  };

  const startEdit = (f: Formation) => {
    setEditingId(f.id);
    setForm({
      title: f.title,
      slug: f.slug,
      subtitle: f.subtitle ?? "",
      description: f.description,
      mode: f.mode,
      productLine: f.productLine ?? "AUTO_ECOLE",
      taxMode: f.taxMode ?? "TTC",
      priceEuros: f.priceCents > 0 ? String(Math.round(f.priceCents / 100)) : "",
      internalPriceEuros: f.internalPriceCents && f.internalPriceCents > 0 ? String(Math.round(f.internalPriceCents / 100)) : "",
      quoteOnly: f.quoteOnly ?? false,
      durationLabel: f.durationLabel,
      imageUrl: f.imageUrl ?? "",
      cpfEligible: f.cpfEligible,
      cpfStatus: f.cpfStatus ?? "NON_RENSEIGNE",
      tags: (f.tags ?? []).join(", "),
      active: f.active
    });
    setFormOpen(true);
    setFormSections({ main: true, pricing: true, media: false, options: false });
    setExpandedId(f.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleFormSection = (section: FormSectionKey) => {
    setFormSections((current) => ({ ...current, [section]: !current[section] }));
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
      subtitle: form.subtitle.trim(),
      description: form.description.trim(),
      mode: form.mode,
      productLine: form.productLine,
      priceCents: form.quoteOnly ? 0 : form.priceEuros ? Math.round(Number(form.priceEuros) * 100) : 0,
      taxMode: form.taxMode,
      quoteOnly: form.quoteOnly,
      internalPriceCents: form.internalPriceEuros ? Math.round(Number(form.internalPriceEuros) * 100) : null,
      durationLabel: form.durationLabel.trim(),
      imageUrl: form.imageUrl.trim(),
      cpfEligible: form.cpfEligible,
      cpfStatus: form.cpfStatus,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
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

  const remove = async (f: Formation) => {
    const confirmed = window.confirm(
      `Supprimer définitivement la formation "${f.title}" ?\n\nSi elle est déjà liée à des élèves, devis ou réservations, la suppression sera refusée.`
    );
    if (!confirmed) return;

    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/formations/${f.id}`, { method: "DELETE" });
      const body = response.status === 204 ? null : await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error?.message ?? "Suppression impossible.");
      if (editingId === f.id) cancel();
      setItems((cur) => cur.filter((item) => item.id !== f.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Suppression impossible.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-full space-y-4 overflow-x-hidden">
      <MediaPickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={(media) => setForm((prev) => ({ ...prev, imageUrl: media.url }))} />

      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-loden-50 text-loden-700">
              <GraduationCap className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold text-loden-ink">Catalogue des formations</p>
              <p className="text-sm text-loden-muted">{loading ? "Chargement…" : `${items.length} formation(s)`}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => (formOpen ? cancel() : setFormOpen(true))}
            className={`focus-ring inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold shadow-soft transition sm:w-auto ${formOpen ? "border border-slate-200 bg-white text-loden-muted hover:bg-slate-50" : "bg-loden-700 text-white hover:bg-loden-800"}`}
          >
            {formOpen ? <X className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
            {formOpen ? "Fermer le formulaire" : "Ajouter une formation"}
          </button>
        </div>
      </Card>

      {error ? <p className="rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700">{error}</p> : null}

      {formOpen ? (
        <Card className="overflow-hidden p-0">
          <div className="border-b border-slate-100 p-4">
            <SectionHeader
              title={editingId ? "Modifier la formation" : "Ajouter une formation"}
              subtitle="Renseignez l'essentiel. Les options avancées restent repliées pour garder la page lisible."
              icon={editingId ? Pencil : Plus}
              action={
                <button type="button" onClick={cancel} className="focus-ring inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-loden-muted hover:bg-slate-50">
                  <X className="h-3.5 w-3.5" aria-hidden="true" /> {editingId ? "Annuler" : "Fermer"}
                </button>
              }
            />
          </div>

          <div className="grid gap-3 p-4">
            <FormSection
              title="Informations principales"
              description="Titre, formule, catégorie et description publique."
              icon={FileText}
              open={formSections.main}
              onToggle={() => toggleFormSection("main")}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <input className="field-input" placeholder="Titre *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} aria-label="Titre" />
                <input className="field-input" placeholder="Sous-titre / formule" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} aria-label="Sous-titre" />
                <input className="field-input" placeholder="Slug (auto si vide)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} aria-label="Slug" />
                <select className="field-input" value={form.productLine} onChange={(e) => setForm({ ...form, productLine: e.target.value as ProductLine })} aria-label="Catégorie">
                  {PRODUCT_LINES.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                </select>
                <textarea className="field-input min-h-24 sm:col-span-2" placeholder="Description (≥ 10 caractères) *" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} aria-label="Description" />
                <select className="field-input" value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })} aria-label="Mode">
                  {MODES.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
                </select>
                <input className="field-input" placeholder="Durée (ex. 20 leçons) *" value={form.durationLabel} onChange={(e) => setForm({ ...form, durationLabel: e.target.value })} aria-label="Durée" />
              </div>
            </FormSection>

            <FormSection
              title="Tarifs & financement"
              description="Prix public, prix interne privé, TVA et statut CPF."
              icon={Euro}
              open={formSections.pricing}
              onToggle={() => toggleFormSection("pricing")}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className="field-input disabled:opacity-50"
                  type="number"
                  min={0}
                  placeholder="Prix public en €"
                  value={form.priceEuros}
                  disabled={form.quoteOnly}
                  onChange={(e) => setForm({ ...form, priceEuros: e.target.value })}
                  aria-label="Prix public en euros"
                />
                <select className="field-input" value={form.taxMode} onChange={(e) => setForm({ ...form, taxMode: e.target.value as TaxMode })} aria-label="TVA">
                  {TAX_MODES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
                </select>
                <label className="flex min-w-0 items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/60 px-3 text-sm font-medium text-loden-ink">
                  <Lock className="h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
                  <input
                    className="field-input my-2 min-w-0 border-0 bg-transparent p-0 shadow-none focus:ring-0"
                    type="number"
                    min={0}
                    placeholder="Prix interne € (privé)"
                    value={form.internalPriceEuros}
                    onChange={(e) => setForm({ ...form, internalPriceEuros: e.target.value })}
                    aria-label="Prix interne en euros (privé)"
                  />
                </label>
                <select className="field-input" value={form.cpfStatus} onChange={(e) => setForm({ ...form, cpfStatus: e.target.value as CpfStatus })} aria-label="Statut CPF">
                  {CPF_STATUSES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </div>
            </FormSection>

            <FormSection
              title="Image principale"
              description="Aperçu compact, médiathèque ou URL directe."
              icon={ImagePlus}
              open={formSections.media}
              onToggle={() => toggleFormSection("media")}
            >
              <div className="grid gap-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  {form.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.imageUrl} alt="Aperçu" className="h-20 w-32 rounded-xl border border-slate-200 object-cover" />
                  ) : (
                    <div className="flex h-20 w-32 items-center justify-center rounded-xl border border-dashed border-slate-300 text-xs text-loden-muted">Aucune image</div>
                  )}
                  <div className="flex min-w-0 flex-col gap-2">
                    <button type="button" onClick={() => setPickerOpen(true)} className="focus-ring inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-loden-700 hover:bg-loden-50 sm:w-auto">
                      <ImagePlus className="h-4 w-4" aria-hidden="true" /> Choisir dans la médiathèque
                    </button>
                    {form.imageUrl ? (
                      <button type="button" onClick={() => setForm({ ...form, imageUrl: "" })} className="focus-ring inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:underline">
                        <X className="h-3.5 w-3.5" aria-hidden="true" /> Retirer
                      </button>
                    ) : null}
                  </div>
                </div>
                <input className="field-input text-xs" placeholder="ou colle une URL d'image" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} aria-label="URL de l'image" />
              </div>
            </FormSection>

            <FormSection
              title="Options internes"
              description="Tags, statut actif, badge CPF et affichage sur devis."
              icon={Settings2}
              open={formSections.options}
              onToggle={() => toggleFormSection("options")}
            >
              <div className="grid gap-3">
                <input className="field-input" placeholder="Tags (séparés par des virgules)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} aria-label="Tags" />
                <div className="flex flex-wrap items-center gap-4 rounded-xl bg-loden-pearl px-3 py-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-loden-ink">
                    <input type="checkbox" checked={form.quoteOnly} onChange={(e) => setForm({ ...form, quoteOnly: e.target.checked })} /> Sur devis
                  </label>
                  <label className="flex items-center gap-2 text-sm font-medium text-loden-ink">
                    <input type="checkbox" checked={form.cpfEligible} onChange={(e) => setForm({ ...form, cpfEligible: e.target.checked })} /> Badge CPF public
                  </label>
                  <label className="flex items-center gap-2 text-sm font-medium text-loden-ink">
                    <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active
                  </label>
                </div>
              </div>
            </FormSection>
          </div>

          <div className="sticky bottom-0 z-10 flex flex-col gap-2 border-t border-slate-100 bg-white/95 p-4 backdrop-blur sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={submit}
              disabled={busy}
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl bg-loden-700 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-loden-800 disabled:opacity-70"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {busy ? "Enregistrement..." : editingId ? "Enregistrer les modifications" : "Ajouter la formation"}
            </button>
            <button type="button" onClick={cancel} className="focus-ring inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-loden-muted hover:bg-slate-50">
              Annuler
            </button>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-3">
        {loading ? (
          [0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)
        ) : items.length === 0 ? (
          <Card className="p-6"><EmptyState icon={GraduationCap} title="Catalogue vide" description="Clique sur « Ajouter une formation » en haut pour créer la première." /></Card>
        ) : (
          items.map((f) => {
            const expanded = expandedId === f.id;
            const modeLabel = MODES.find((m) => m.key === f.mode)?.label ?? f.mode;
            return (
              <Card key={f.id} as="article" className="overflow-hidden p-0">
                <div className="grid gap-3 p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                  <div className="min-w-0">
                    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                      <h3 className="max-w-full truncate text-base font-semibold text-loden-ink lg:max-w-[34rem]">{f.title}</h3>
                      {f.subtitle ? <span className="hidden max-w-[28rem] truncate text-sm text-loden-muted md:inline">— {f.subtitle}</span> : null}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge variant={f.active ? "success" : "neutral"} dot>{f.active ? "Active" : "Inactive"}</Badge>
                      <Badge variant="neutral">{productLineLabel(f.productLine)}</Badge>
                      {f.quoteOnly ? <Badge variant="warning">Sur devis</Badge> : null}
                      {f.cpfEligible ? <Badge variant="brand">CPF</Badge> : null}
                    </div>
                    <p className="mt-2 truncate text-xs text-loden-muted">
                      {modeLabel} · {f.durationLabel} · {f.quoteOnly ? "Sur devis" : `${euros(f.priceCents)} ${f.taxMode ?? "TTC"}`}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
                    <button
                      type="button"
                      onClick={() => setExpandedId(expanded ? null : f.id)}
                      className="focus-ring inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-loden-muted hover:bg-slate-50"
                      aria-expanded={expanded}
                    >
                      {expanded ? <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" /> : <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />}
                      Détails
                    </button>
                    <button type="button" onClick={() => startEdit(f)} className="focus-ring rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-loden-700 hover:bg-loden-50">Modifier</button>
                    <button type="button" onClick={() => toggleActive(f)} className="focus-ring rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-loden-muted hover:bg-slate-50">
                      {f.active ? "Désactiver" : "Activer"}
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(f)}
                      disabled={busy}
                      className="focus-ring inline-flex items-center justify-center gap-1 rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Supprimer
                    </button>
                  </div>
                </div>

                {expanded ? (
                  <div className="border-t border-slate-100 bg-loden-pearl/45 p-4">
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <DetailBlock label="Slug" value={f.slug} />
                      <DetailBlock label="Prix public" value={f.quoteOnly ? "Sur devis" : `${euros(f.priceCents)} ${f.taxMode ?? "TTC"}`} />
                      <DetailBlock label="Prix interne" value={f.internalPriceCents && f.internalPriceCents > 0 ? euros(f.internalPriceCents) : "Non renseigné"} privateValue />
                      <DetailBlock label="CPF" value={CPF_STATUSES.find((c) => c.key === f.cpfStatus)?.label ?? "Non renseigné"} />
                    </div>
                    {f.subtitle ? <p className="mt-3 text-sm font-semibold text-loden-ink">{f.subtitle}</p> : null}
                    <p className="mt-2 max-w-5xl text-sm leading-6 text-loden-muted">{f.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(f.tags ?? []).length > 0 ? (
                        (f.tags ?? []).map((tag) => (
                          <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-loden-muted">
                            <Tags className="h-3 w-3" aria-hidden="true" />
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs font-semibold text-loden-muted">Aucun tag</span>
                      )}
                    </div>
                  </div>
                ) : null}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

function FormSection({
  title,
  description,
  icon: Icon,
  open,
  onToggle,
  children
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="focus-ring flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
        aria-expanded={open}
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-loden-50 text-loden-700">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-loden-ink">{title}</span>
            <span className="block truncate text-xs text-loden-muted">{description}</span>
          </span>
        </span>
        {open ? <ChevronUp className="h-4 w-4 shrink-0 text-loden-muted" aria-hidden="true" /> : <ChevronDown className="h-4 w-4 shrink-0 text-loden-muted" aria-hidden="true" />}
      </button>
      {open ? <div className="border-t border-slate-100 p-4">{children}</div> : null}
    </section>
  );
}

function DetailBlock({ label, value, privateValue = false }: { label: string; value: string; privateValue?: boolean }) {
  return (
    <div className="min-w-0 rounded-xl bg-white px-3 py-2 shadow-soft">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-loden-muted">{label}</p>
      <p className={`mt-1 truncate text-sm font-semibold ${privateValue ? "text-amber-700" : "text-loden-ink"}`}>
        {privateValue ? <Lock className="mr-1 inline h-3 w-3 align-[-1px]" aria-hidden="true" /> : null}
        {value}
      </p>
    </div>
  );
}
