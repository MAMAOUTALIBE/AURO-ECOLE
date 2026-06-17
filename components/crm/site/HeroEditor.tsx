"use client";

import { ExternalLink, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { defaultHeroHome, type HeroBadge, type HeroHome } from "@/lib/site-content";
import { IconSelect } from "@/components/crm/site/IconSelect";
import { useSiteSetting } from "@/components/crm/site/useSiteSetting";

export function HeroEditor() {
  const { value, setValue, loading, saving, error, savedAt, save, reset } = useSiteSetting<HeroHome>(
    "hero.home",
    defaultHeroHome
  );

  const patch = (next: Partial<HeroHome>) => setValue({ ...value, ...next });

  const patchBadge = (index: number, next: Partial<HeroBadge>) => {
    const badges = value.badges.map((badge, i) => (i === index ? { ...badge, ...next } : badge));
    patch({ badges });
  };

  const addBadge = () => patch({ badges: [...value.badges, { icon: "ShieldCheck", title: "Nouveau", detail: "" }] });
  const removeBadge = (index: number) => patch({ badges: value.badges.filter((_, i) => i !== index) });

  if (loading) return <p className="text-sm text-loden-muted">Chargement…</p>;

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-loden-ink shadow-soft">
          <input
            type="checkbox"
            checked={value.enabled}
            onChange={(event) => patch({ enabled: event.target.checked })}
          />
          Bloc Hero affiché sur l’accueil
        </label>
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-loden-700 hover:bg-loden-50"
        >
          <ExternalLink className="h-4 w-4" aria-hidden="true" /> Prévisualiser l’accueil
        </a>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <h2 className="text-lg font-semibold text-loden-ink">Titre & accroche</h2>
        <div className="mt-5 grid gap-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-loden-muted">Ligne 1 (script)</span>
              <input className="field-input" value={value.scriptLine} onChange={(e) => patch({ scriptLine: e.target.value })} />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-loden-muted">Liaison</span>
              <input className="field-input" value={value.connector} onChange={(e) => patch({ connector: e.target.value })} />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-loden-muted">Marque</span>
              <input className="field-input" value={value.brand} onChange={(e) => patch({ brand: e.target.value })} />
            </label>
          </div>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-loden-muted">Sous-titre</span>
            <textarea className="field-input min-h-20" value={value.subtitle} onChange={(e) => patch({ subtitle: e.target.value })} />
          </label>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <h2 className="text-lg font-semibold text-loden-ink">Image</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-loden-muted">Chemin de l’image (ex : /loden-hero.jpg)</span>
            <input className="field-input" value={value.image} onChange={(e) => patch({ image: e.target.value })} />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-loden-muted">Texte alternatif (SEO/accessibilité)</span>
            <input className="field-input" value={value.imageAlt} onChange={(e) => patch({ imageAlt: e.target.value })} />
          </label>
        </div>
        <p className="mt-2 text-xs text-loden-muted">La médiathèque (upload d’images) arrive à la phase suivante ; pour l’instant, indique un chemin existant.</p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <h2 className="text-lg font-semibold text-loden-ink">Boutons</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2 rounded-2xl bg-loden-pearl/50 p-3">
            <span className="text-sm font-semibold text-loden-ink">Bouton principal</span>
            <input className="field-input" placeholder="Libellé" value={value.primaryCta.label} onChange={(e) => patch({ primaryCta: { ...value.primaryCta, label: e.target.value } })} />
            <input className="field-input" placeholder="Lien" value={value.primaryCta.href} onChange={(e) => patch({ primaryCta: { ...value.primaryCta, href: e.target.value } })} />
          </div>
          <div className="grid gap-2 rounded-2xl bg-loden-pearl/50 p-3">
            <label className="inline-flex items-center gap-2 text-sm font-semibold text-loden-ink">
              <input
                type="checkbox"
                checked={Boolean(value.secondaryCta)}
                onChange={(e) => patch({ secondaryCta: e.target.checked ? { label: "Nos formations", href: "/formations" } : undefined })}
              />
              Bouton secondaire
            </label>
            {value.secondaryCta ? (
              <>
                <input className="field-input" placeholder="Libellé" value={value.secondaryCta.label} onChange={(e) => patch({ secondaryCta: { ...value.secondaryCta!, label: e.target.value } })} />
                <input className="field-input" placeholder="Lien" value={value.secondaryCta.href} onChange={(e) => patch({ secondaryCta: { ...value.secondaryCta!, href: e.target.value } })} />
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-loden-ink">Badges ({value.badges.length})</h2>
          <button type="button" onClick={addBadge} className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-loden-700 hover:bg-loden-50">
            <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Ajouter
          </button>
        </div>
        <div className="mt-4 grid gap-3">
          {value.badges.map((badge, index) => (
            <div key={index} className="grid items-end gap-2 rounded-2xl border border-slate-100 bg-loden-pearl/40 p-3 sm:grid-cols-[auto_1fr_1fr_auto]">
              <IconSelect value={badge.icon} onChange={(icon) => patchBadge(index, { icon })} />
              <input className="field-input" placeholder="Titre" value={badge.title} onChange={(e) => patchBadge(index, { title: e.target.value })} />
              <input className="field-input" placeholder="Détail" value={badge.detail} onChange={(e) => patchBadge(index, { detail: e.target.value })} />
              <button type="button" onClick={() => removeBadge(index)} aria-label="Supprimer le badge" className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50">
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ))}
          {value.badges.length === 0 ? <p className="text-sm text-loden-muted">Aucun badge.</p> : null}
        </div>
      </div>

      {error ? <p className="rounded-2xl bg-rose-50 p-4 text-sm font-medium text-rose-700">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => save(value)}
          disabled={saving}
          className="focus-ring inline-flex items-center gap-2 rounded-full bg-loden-700 px-6 py-3 font-semibold text-white shadow-soft transition hover:bg-loden-800 disabled:opacity-70"
        >
          <Save className="h-4 w-4" aria-hidden="true" /> {saving ? "Enregistrement…" : "Publier les modifications"}
        </button>
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Réinitialiser le Hero aux valeurs par défaut ?")) void reset(defaultHeroHome);
          }}
          disabled={saving}
          className="focus-ring inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-loden-muted hover:bg-loden-50 disabled:opacity-70"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" /> Réinitialiser
        </button>
        {savedAt ? <span className="text-sm font-medium text-emerald-600">Enregistré à {savedAt} ✓</span> : null}
      </div>
    </div>
  );
}
