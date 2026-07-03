"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Check, Plus, Star, Trash2, X } from "lucide-react";
import { Badge, Card, EmptyState, SectionHeader, Skeleton, type BadgeVariant } from "@/components/crm/ui";

type Review = {
  id: string;
  rating: number;
  comment: string;
  authorName?: string | null;
  authorLocation?: string | null;
  status: "EN_ATTENTE" | "PUBLIE" | "REJETE";
  createdAt: string;
};

type ReviewPayload = {
  data?: Review;
  error?: { message?: string };
};

const FILTERS = [
  { key: "EN_ATTENTE", label: "À modérer" },
  { key: "PUBLIE", label: "Publiés" },
  { key: "REJETE", label: "Rejetés" },
  { key: "ALL", label: "Tous" }
] as const;

const STATUS_META: Record<Review["status"], { label: string; variant: BadgeVariant }> = {
  EN_ATTENTE: { label: "À modérer", variant: "warning" },
  PUBLIE: { label: "Publié", variant: "success" },
  REJETE: { label: "Rejeté", variant: "danger" }
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex" aria-label={`${rating} sur 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`h-4 w-4 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} aria-hidden="true" />
      ))}
    </span>
  );
}

export function ReviewsManager() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("EN_ATTENTE");
  const [formOpen, setFormOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [formRating, setFormRating] = useState(5);
  const [formName, setFormName] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formComment, setFormComment] = useState("");
  const [publishImmediately, setPublishImmediately] = useState(true);

  const load = () => {
    setLoading(true);
    fetch("/api/reviews?includeUnpublished=true")
      .then((r) => r.json())
      .then((p) => {
        if (Array.isArray(p?.data)) setReviews(p.data as Review[]);
        else setError(p?.error?.message ?? "Chargement des avis impossible.");
      })
      .catch(() => setError("Chargement des avis impossible."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const createReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const comment = formComment.trim();

    setError(null);
    setSuccess(null);

    if (comment.length < 10) {
      setError("Le commentaire doit contenir au moins 10 caractères.");
      return;
    }

    setCreating(true);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: formRating,
          comment,
          authorName: formName.trim() || undefined,
          authorLocation: formCity.trim() || undefined,
          status: publishImmediately ? "PUBLIE" : "EN_ATTENTE"
        })
      });
      const payload = (await response.json().catch(() => null)) as ReviewPayload | null;
      const createdReview = payload?.data;
      if (!response.ok || !createdReview) {
        throw new Error(payload?.error?.message ?? "Création de l'avis impossible.");
      }

      setReviews((cur) => [createdReview, ...cur]);
      setFilter(createdReview.status);
      setFormRating(5);
      setFormName("");
      setFormCity("");
      setFormComment("");
      setPublishImmediately(true);
      setFormOpen(false);
      setSuccess(publishImmediately ? "Avis publié sur le site." : "Avis ajouté à la file de modération.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Création de l'avis impossible.");
    } finally {
      setCreating(false);
    }
  };

  const moderate = async (review: Review, status: Review["status"]) => {
    setBusy(review.id);
    setError(null);
    try {
      const response = await fetch(`/api/reviews/${review.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error();
      setReviews((cur) => cur.map((r) => (r.id === review.id ? { ...r, status } : r)));
    } catch {
      setError("Action de modération impossible.");
    } finally {
      setBusy(null);
    }
  };

  const remove = async (review: Review) => {
    if (!window.confirm("Supprimer définitivement cet avis ? Cette action est irréversible.")) return;
    setBusy(review.id);
    setError(null);
    try {
      const response = await fetch(`/api/reviews/${review.id}`, { method: "DELETE" });
      if (!response.ok && response.status !== 204) throw new Error();
      setReviews((cur) => cur.filter((r) => r.id !== review.id));
    } catch {
      setError("Suppression impossible.");
    } finally {
      setBusy(null);
    }
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = { EN_ATTENTE: 0, PUBLIE: 0, REJETE: 0, ALL: reviews.length };
    reviews.forEach((r) => (c[r.status] = (c[r.status] ?? 0) + 1));
    return c;
  }, [reviews]);

  const visible = filter === "ALL" ? reviews : reviews.filter((r) => r.status === filter);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-loden-50 text-loden-700">
            <Star className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="font-semibold text-loden-ink">Avis</p>
            <p className="text-sm text-loden-muted">{counts.ALL ?? reviews.length} avis</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setFormOpen((v) => !v)}
          className={`focus-ring inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold shadow-soft transition ${formOpen ? "border border-slate-200 bg-white text-loden-muted hover:bg-slate-50" : "bg-loden-700 text-white hover:bg-loden-800"}`}
        >
          {formOpen ? <X className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
          {formOpen ? "Fermer le formulaire" : "Ajouter un avis"}
        </button>
      </div>

      {formOpen ? (
      <Card className="p-5">
        <SectionHeader title="Ajouter un avis" subtitle="Saisissez uniquement un retour client réel." icon={Plus} />
        <form onSubmit={createReview} className="mt-5 grid gap-4" noValidate>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-loden-ink">
              Prénom du client
              <input
                type="text"
                className="field-input font-normal"
                value={formName}
                onChange={(event) => setFormName(event.target.value)}
                maxLength={60}
                placeholder="Ex : Sarah"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-loden-ink">
              Ville <span className="font-normal text-loden-muted">(facultatif)</span>
              <input
                type="text"
                className="field-input font-normal"
                value={formCity}
                onChange={(event) => setFormCity(event.target.value)}
                maxLength={80}
                placeholder="Ex : Conflans-Sainte-Honorine"
              />
            </label>
          </div>

          <div>
            <span className="text-sm font-semibold text-loden-ink">Note</span>
            <div className="mt-2 flex gap-1">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => setFormRating(rating)}
                  className="focus-ring rounded-lg p-1 text-amber-400 transition hover:bg-amber-50"
                  aria-label={`${rating} sur 5`}
                  aria-pressed={formRating === rating}
                >
                  <Star className={`h-6 w-6 ${rating <= formRating ? "fill-amber-400" : "text-slate-200"}`} aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>

          <label className="grid gap-2 text-sm font-semibold text-loden-ink">
            Commentaire
            <textarea
              className="field-input min-h-28 resize-y font-normal"
              value={formComment}
              onChange={(event) => setFormComment(event.target.value)}
              placeholder="Retour client réel, sans information sensible."
              minLength={10}
              required
            />
          </label>

          <label className="flex items-center gap-2 text-sm font-semibold text-loden-ink">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-loden-700 focus:ring-loden-500"
              checked={publishImmediately}
              onChange={(event) => setPublishImmediately(event.target.checked)}
            />
            Publier immédiatement
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={creating}
              className="focus-ring inline-flex items-center gap-2 rounded-xl bg-loden-700 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-loden-800 disabled:opacity-70"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {creating ? "Ajout..." : "Ajouter l'avis"}
            </button>
            {success ? <p className="text-sm font-medium text-emerald-700">{success}</p> : null}
          </div>
        </form>
      </Card>
      ) : null}

      <div className="inline-flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-soft">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`focus-ring rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
              filter === f.key ? "bg-loden-700 text-white shadow-soft" : "text-loden-muted hover:text-loden-ink"
            }`}
          >
            {f.label} <span className="opacity-70">({counts[f.key] ?? 0})</span>
          </button>
        ))}
      </div>

      {error ? <p className="rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700">{error}</p> : null}

      <Card className="p-5">
        <SectionHeader title="Modération des avis" subtitle="Publiez ou rejetez les avis clients avant affichage public." icon={Star} />
        <div className="mt-4">
          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-2xl" />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <EmptyState icon={Star} title="Aucun avis" description="Les avis clients à modérer apparaîtront ici." compact />
          ) : (
            <ul className="space-y-3">
              {visible.map((review) => {
                const meta = STATUS_META[review.status] ?? { label: review.status, variant: "neutral" as BadgeVariant };
                return (
                  <li key={review.id} className="rounded-2xl border border-slate-200/70 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Stars rating={review.rating} />
                        {review.authorName ? (
                          <span className="text-sm font-semibold text-loden-ink">
                            {review.authorName}
                            {review.authorLocation ? <span className="font-normal text-loden-muted"> · {review.authorLocation}</span> : null}
                          </span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                        <span className="text-xs text-loden-muted">
                          {new Date(review.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                      </div>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-loden-ink">{review.comment}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {review.status !== "PUBLIE" ? (
                          <button
                            type="button"
                            disabled={busy === review.id}
                            onClick={() => moderate(review, "PUBLIE")}
                            className="focus-ring inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                          >
                            <Check className="h-3.5 w-3.5" aria-hidden="true" />
                            Publier
                          </button>
                        ) : null}
                        {review.status !== "REJETE" ? (
                          <button
                            type="button"
                            disabled={busy === review.id}
                            onClick={() => moderate(review, "REJETE")}
                            className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
                          >
                            <X className="h-3.5 w-3.5" aria-hidden="true" />
                            Rejeter
                          </button>
                        ) : null}
                        <button
                          type="button"
                          disabled={busy === review.id}
                          onClick={() => remove(review)}
                          className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          Supprimer
                        </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Card>
    </div>
  );
}
