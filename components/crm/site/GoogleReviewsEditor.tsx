"use client";

import { useState } from "react";
import { ExternalLink, Info, RefreshCw, RotateCcw, Save } from "lucide-react";
import {
  buildWriteReviewUrl,
  defaultGoogleReviewsConfig,
  type GoogleReviewsConfig
} from "@/lib/google-reviews";
import { useSiteSetting } from "@/components/crm/site/useSiteSetting";

type SyncState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ok"; message: string }
  | { kind: "error"; message: string };

export function GoogleReviewsEditor() {
  const { value, setValue, loading, saving, error, savedAt, save, reset } = useSiteSetting<GoogleReviewsConfig>(
    "google.reviews",
    defaultGoogleReviewsConfig
  );
  const [sync, setSync] = useState<SyncState>({ kind: "idle" });

  const patch = (next: Partial<GoogleReviewsConfig>) => setValue({ ...value, ...next });

  const runSync = async () => {
    setSync({ kind: "loading" });
    try {
      const response = await fetch("/api/google-reviews/sync", { method: "POST" });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Synchronisation impossible.");
      }
      const data = payload?.data ?? {};
      const note = typeof data.rating === "number" ? data.rating.toFixed(1).replace(".", ",") : "—";
      setSync({
        kind: "ok",
        message: `Synchronisé : note ${note}/5, ${data.totalCount ?? 0} avis Google, ${data.fetched ?? 0} avis récupérés.`
      });
    } catch (err) {
      setSync({ kind: "error", message: err instanceof Error ? err.message : "Synchronisation impossible." });
    }
  };

  if (loading) return <p className="text-sm text-loden-muted">Chargement…</p>;

  const derivedReviewUrl = buildWriteReviewUrl(value.placeId);

  return (
    <div className="grid gap-6">
      {/* Visibilité */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-loden-ink shadow-soft">
          <input type="checkbox" checked={value.enabled} onChange={(e) => patch({ enabled: e.target.checked })} />
          Section avis Google activée
        </label>
        <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-loden-ink shadow-soft">
          <input
            type="checkbox"
            checked={value.showOnHomepage}
            onChange={(e) => patch({ showOnHomepage: e.target.checked })}
          />
          Afficher sur la page d’accueil
        </label>
        <a
          href="/avis"
          target="_blank"
          rel="noreferrer"
          className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-loden-700 hover:bg-loden-50"
        >
          <ExternalLink className="h-4 w-4" aria-hidden="true" /> Voir la page avis
        </a>
      </div>

      {/* Connexion Google */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <h2 className="text-lg font-semibold text-loden-ink">Connexion à votre fiche Google</h2>
        <p className="mt-1 text-sm text-loden-muted">
          L’identifiant Google Place relie le site à votre fiche d’établissement (pour la synchro des avis et le bouton « Laisser un avis »).
        </p>
        <div className="mt-5 grid gap-3">
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-loden-muted">Identifiant Google Place (Place ID)</span>
            <input
              className="field-input"
              placeholder="ex : ChIJH2l0yXu0RIYRPEW4YNryFM8"
              value={value.placeId}
              onChange={(e) => patch({ placeId: e.target.value })}
            />
            {derivedReviewUrl ? (
              <span className="mt-1 break-all text-xs text-loden-muted">
                Lien « Laisser un avis » généré : <span className="font-medium text-loden-700">{derivedReviewUrl}</span>
              </span>
            ) : null}
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-medium text-loden-muted">Lien « Laisser un avis » (optionnel — sinon généré automatiquement)</span>
            <input
              className="field-input"
              placeholder={derivedReviewUrl || "https://search.google.com/local/writereview?placeid=…"}
              value={value.reviewUrl}
              onChange={(e) => patch({ reviewUrl: e.target.value })}
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-medium text-loden-muted">Lien « Voir tous les avis Google » (optionnel — sinon fiche Maps)</span>
            <input
              className="field-input"
              placeholder="https://maps.google.com/?cid=…"
              value={value.profileUrl}
              onChange={(e) => patch({ profileUrl: e.target.value })}
            />
          </label>
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-2xl bg-loden-pearl/60 p-3 text-xs leading-5 text-loden-muted">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-loden-600" aria-hidden="true" />
          <span>
            Trouver votre Place ID : recherchez votre établissement sur le sélecteur officiel Google « Place ID Finder ».
            La synchronisation automatique des avis nécessite en plus une clé API Google (variable serveur
            <span className="font-medium"> GOOGLE_PLACES_API_KEY</span>). Sans clé, le mode manuel ci-dessous reste actif.
          </span>
        </div>
      </div>

      {/* Synchronisation */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-loden-ink">Synchronisation Google</h2>
            <p className="mt-1 text-sm text-loden-muted">
              Récupère la note moyenne, le nombre d’avis et jusqu’à 5 avis récents depuis Google.
            </p>
          </div>
          <button
            type="button"
            onClick={runSync}
            disabled={sync.kind === "loading"}
            className="focus-ring inline-flex items-center gap-2 rounded-full bg-loden-700 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-loden-800 disabled:opacity-70"
          >
            <RefreshCw className={`h-4 w-4 ${sync.kind === "loading" ? "animate-spin" : ""}`} aria-hidden="true" />
            {sync.kind === "loading" ? "Synchronisation…" : "Synchroniser maintenant"}
          </button>
        </div>
        {sync.kind === "ok" ? (
          <p className="mt-4 rounded-2xl bg-emerald-50 p-3 text-sm font-medium text-emerald-700">{sync.message}</p>
        ) : null}
        {sync.kind === "error" ? (
          <p className="mt-4 rounded-2xl bg-amber-50 p-3 text-sm font-medium text-amber-800">{sync.message}</p>
        ) : null}
        <p className="mt-3 text-xs text-loden-muted">Pensez à enregistrer la configuration avant de synchroniser.</p>
      </div>

      {/* Présentation */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <h2 className="text-lg font-semibold text-loden-ink">Présentation de la section</h2>
        <div className="mt-5 grid gap-3">
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-loden-muted">Titre</span>
            <input className="field-input" value={value.sectionTitle} onChange={(e) => patch({ sectionTitle: e.target.value })} />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-loden-muted">Sous-titre</span>
            <input
              className="field-input"
              value={value.sectionSubtitle}
              onChange={(e) => patch({ sectionSubtitle: e.target.value })}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-loden-muted">Note minimale affichée</span>
              <select
                className="field-input"
                value={value.minRating}
                onChange={(e) => patch({ minRating: Number(e.target.value) })}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n} étoile{n > 1 ? "s" : ""} et plus
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-loden-muted">Nombre d’avis affichés (max)</span>
              <input
                type="number"
                min={1}
                max={12}
                className="field-input"
                value={value.maxReviews}
                onChange={(e) => patch({ maxReviews: Math.max(1, Math.min(12, Number(e.target.value) || 1)) })}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Repli manuel */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <h2 className="text-lg font-semibold text-loden-ink">Mode manuel (sans clé API)</h2>
        <p className="mt-1 text-sm text-loden-muted">
          Si la synchronisation automatique n’est pas configurée, ces valeurs s’affichent quand même (note + nombre d’avis Google réels que vous recopiez ici). Laissez à 0 pour masquer.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-loden-muted">Note moyenne Google</span>
            <input
              type="number"
              min={0}
              max={5}
              step={0.1}
              className="field-input"
              value={value.fallbackRating}
              onChange={(e) => patch({ fallbackRating: Math.max(0, Math.min(5, Number(e.target.value) || 0)) })}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-loden-muted">Nombre total d’avis Google</span>
            <input
              type="number"
              min={0}
              className="field-input"
              value={value.fallbackCount}
              onChange={(e) => patch({ fallbackCount: Math.max(0, Number(e.target.value) || 0) })}
            />
          </label>
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
            if (window.confirm("Réinitialiser la configuration des avis Google ?")) void reset(defaultGoogleReviewsConfig);
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
