"use client";

import { ChevronDown, ChevronUp, ExternalLink, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import {
  defaultNavCtas,
  defaultNavPrimary,
  type NavChild,
  type NavCta,
  type NavCtas,
  type NavItem,
  type NavPrimary
} from "@/lib/site-content";
import { IconSelect } from "@/components/crm/site/IconSelect";
import { useSiteSetting } from "@/components/crm/site/useSiteSetting";

function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function move<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr;
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function ActiveToggle({ active, onChange }: { active: boolean; onChange: (active: boolean) => void }) {
  return (
    <label className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-loden-muted">
      <input type="checkbox" checked={active} onChange={(event) => onChange(event.target.checked)} />
      Visible
    </label>
  );
}

export function NavEditor() {
  const primary = useSiteSetting<NavPrimary>("nav.primary", defaultNavPrimary);
  const ctas = useSiteSetting<NavCtas>("nav.ctas", defaultNavCtas);

  if (primary.loading || ctas.loading) return <p className="text-sm text-loden-muted">Chargement…</p>;

  const items = primary.value.items;
  const setItems = (next: NavItem[]) => primary.setValue({ items: next });
  const patchItem = (index: number, next: Partial<NavItem>) =>
    setItems(items.map((item, i) => (i === index ? { ...item, ...next } : item)));

  const setChildren = (itemIndex: number, children: NavChild[]) => patchItem(itemIndex, { children });
  const patchChild = (itemIndex: number, childIndex: number, next: Partial<NavChild>) => {
    const children = (items[itemIndex].children ?? []).map((child, i) => (i === childIndex ? { ...child, ...next } : child));
    setChildren(itemIndex, children);
  };

  const ctaItems = ctas.value.items;
  const setCtaItems = (next: NavCta[]) => ctas.setValue({ items: next });
  const patchCta = (index: number, next: Partial<NavCta>) =>
    setCtaItems(ctaItems.map((item, i) => (i === index ? { ...item, ...next } : item)));

  return (
    <div className="grid gap-6">
      <a
        href="/"
        target="_blank"
        rel="noreferrer"
        className="focus-ring inline-flex w-fit items-center gap-1.5 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-loden-700 hover:bg-loden-50"
      >
        <ExternalLink className="h-4 w-4" aria-hidden="true" /> Prévisualiser le site
      </a>

      {/* ---- Menu principal ---- */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-loden-ink">Menu principal ({items.length})</h2>
          <button
            type="button"
            onClick={() => setItems([...items, { id: newId("item"), label: "Nouveau lien", href: "/", active: true, icon: "Sparkles" }])}
            className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-loden-700 hover:bg-loden-50"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Ajouter un lien
          </button>
        </div>

        <div className="mt-4 grid gap-4">
          {items.map((item, index) => {
            const children = item.children ?? [];
            return (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-loden-pearl/40 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex shrink-0 flex-col">
                    <button type="button" aria-label="Monter" onClick={() => setItems(move(items, index, index - 1))} className="focus-ring rounded text-loden-muted hover:text-loden-ink">
                      <ChevronUp className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button type="button" aria-label="Descendre" onClick={() => setItems(move(items, index, index + 1))} className="focus-ring rounded text-loden-muted hover:text-loden-ink">
                      <ChevronDown className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                  <IconSelect value={item.icon} onChange={(icon) => patchItem(index, { icon })} />
                  <input className="field-input min-w-32 flex-1" placeholder="Libellé" value={item.label} onChange={(e) => patchItem(index, { label: e.target.value })} />
                  <input className="field-input min-w-32 flex-1" placeholder="Lien" value={item.href} onChange={(e) => patchItem(index, { href: e.target.value })} />
                  <ActiveToggle active={item.active} onChange={(active) => patchItem(index, { active })} />
                  <button type="button" onClick={() => setItems(items.filter((_, i) => i !== index))} aria-label="Supprimer le lien" className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50">
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>

                <div className="mt-3 grid gap-2 border-l-2 border-loden-100 pl-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-loden-muted">Sous-menu ({children.length})</p>
                  {children.map((child, childIndex) => (
                    <div key={child.id} className="flex flex-wrap items-center gap-2">
                      <IconSelect value={child.icon} onChange={(icon) => patchChild(index, childIndex, { icon })} />
                      <input className="field-input min-w-28 flex-1" placeholder="Libellé" value={child.label} onChange={(e) => patchChild(index, childIndex, { label: e.target.value })} />
                      <input className="field-input min-w-28 flex-1" placeholder="Lien" value={child.href} onChange={(e) => patchChild(index, childIndex, { href: e.target.value })} />
                      <ActiveToggle active={child.active} onChange={(active) => patchChild(index, childIndex, { active })} />
                      <button type="button" onClick={() => setChildren(index, children.filter((_, i) => i !== childIndex))} aria-label="Supprimer le sous-lien" className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50">
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setChildren(index, [...children, { id: newId("child"), label: "Nouveau sous-lien", href: "/", active: true, icon: "Sparkles" }])}
                    className="focus-ring inline-flex w-fit items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-loden-700 hover:bg-loden-50"
                  >
                    <Plus className="h-3 w-3" aria-hidden="true" /> Sous-lien
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {primary.error ? <p className="mt-4 rounded-2xl bg-rose-50 p-3 text-sm font-medium text-rose-700">{primary.error}</p> : null}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => primary.save(primary.value)} disabled={primary.saving} className="focus-ring inline-flex items-center gap-2 rounded-full bg-loden-700 px-5 py-2.5 text-sm font-semibold text-white shadow-soft hover:bg-loden-800 disabled:opacity-70">
            <Save className="h-4 w-4" aria-hidden="true" /> {primary.saving ? "Enregistrement…" : "Publier le menu"}
          </button>
          <button type="button" onClick={() => { if (window.confirm("Réinitialiser le menu ?")) void primary.reset(defaultNavPrimary); }} disabled={primary.saving} className="focus-ring inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-loden-muted hover:bg-loden-50 disabled:opacity-70">
            <RotateCcw className="h-4 w-4" aria-hidden="true" /> Réinitialiser
          </button>
          {primary.savedAt ? <span className="text-sm font-medium text-emerald-600">Enregistré à {primary.savedAt} ✓</span> : null}
        </div>
      </div>

      {/* ---- Boutons CTA ---- */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-loden-ink">Boutons (Espace Élève, Inscription…) ({ctaItems.length})</h2>
          <button
            type="button"
            onClick={() => setCtaItems([...ctaItems, { id: newId("cta"), label: "Nouveau bouton", href: "/", active: true, icon: "Sparkles", variant: "outline" }])}
            className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-loden-700 hover:bg-loden-50"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Ajouter un bouton
          </button>
        </div>

        <div className="mt-4 grid gap-2">
          {ctaItems.map((cta, index) => (
            <div key={cta.id} className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-100 bg-loden-pearl/40 p-3">
              <div className="flex shrink-0 flex-col">
                <button type="button" aria-label="Monter" onClick={() => setCtaItems(move(ctaItems, index, index - 1))} className="focus-ring rounded text-loden-muted hover:text-loden-ink">
                  <ChevronUp className="h-4 w-4" aria-hidden="true" />
                </button>
                <button type="button" aria-label="Descendre" onClick={() => setCtaItems(move(ctaItems, index, index + 1))} className="focus-ring rounded text-loden-muted hover:text-loden-ink">
                  <ChevronDown className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <IconSelect value={cta.icon} onChange={(icon) => patchCta(index, { icon })} />
              <input className="field-input min-w-28 flex-1" placeholder="Libellé" value={cta.label} onChange={(e) => patchCta(index, { label: e.target.value })} />
              <input className="field-input min-w-28 flex-1" placeholder="Lien" value={cta.href} onChange={(e) => patchCta(index, { href: e.target.value })} />
              <select className="field-input w-32 shrink-0" value={cta.variant ?? "outline"} onChange={(e) => patchCta(index, { variant: e.target.value as "outline" | "solid" })} aria-label="Style">
                <option value="outline">Contour</option>
                <option value="solid">Plein</option>
              </select>
              <ActiveToggle active={cta.active} onChange={(active) => patchCta(index, { active })} />
              <button type="button" onClick={() => setCtaItems(ctaItems.filter((_, i) => i !== index))} aria-label="Supprimer le bouton" className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50">
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>

        {ctas.error ? <p className="mt-4 rounded-2xl bg-rose-50 p-3 text-sm font-medium text-rose-700">{ctas.error}</p> : null}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => ctas.save(ctas.value)} disabled={ctas.saving} className="focus-ring inline-flex items-center gap-2 rounded-full bg-loden-700 px-5 py-2.5 text-sm font-semibold text-white shadow-soft hover:bg-loden-800 disabled:opacity-70">
            <Save className="h-4 w-4" aria-hidden="true" /> {ctas.saving ? "Enregistrement…" : "Publier les boutons"}
          </button>
          <button type="button" onClick={() => { if (window.confirm("Réinitialiser les boutons ?")) void ctas.reset(defaultNavCtas); }} disabled={ctas.saving} className="focus-ring inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-loden-muted hover:bg-loden-50 disabled:opacity-70">
            <RotateCcw className="h-4 w-4" aria-hidden="true" /> Réinitialiser
          </button>
          {ctas.savedAt ? <span className="text-sm font-medium text-emerald-600">Enregistré à {ctas.savedAt} ✓</span> : null}
        </div>
      </div>
    </div>
  );
}
