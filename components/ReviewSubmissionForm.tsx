"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, Send, Star } from "lucide-react";

type ReviewPayload = {
  data?: { id: string; status: string };
  error?: { message?: string };
};

export function ReviewSubmissionForm() {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextName = name.trim();
    const nextCity = city.trim();
    const nextComment = comment.trim();

    setError(null);
    setSuccess(false);

    if (nextName.length < 2) {
      setError("Indiquez votre prénom.");
      return;
    }
    if (nextComment.length < 10) {
      setError("Écrivez au moins 10 caractères.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          comment: nextComment,
          authorName: nextName,
          authorLocation: nextCity || undefined
        })
      });
      const payload = (await response.json().catch(() => null)) as ReviewPayload | null;
      if (!response.ok || !payload?.data) {
        throw new Error(payload?.error?.message ?? "Envoi impossible.");
      }

      setName("");
      setCity("");
      setComment("");
      setRating(5);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Envoi impossible.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border border-loden-100 bg-white p-4 shadow-soft sm:p-5" noValidate>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-loden-ink">Écrire un avis</h2>
          <p className="mt-1 text-sm text-loden-muted">Votre retour sera publié après validation.</p>
        </div>
        {success ? <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600" aria-hidden="true" /> : null}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-loden-ink">
          Prénom
          <input
            type="text"
            className="field-input font-normal"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={60}
            placeholder="Ex : Sarah"
            autoComplete="given-name"
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-loden-ink">
          Ville <span className="font-normal text-loden-muted">(facultatif)</span>
          <input
            type="text"
            className="field-input font-normal"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            maxLength={80}
            placeholder="Ex : Conflans-Sainte-Honorine"
            autoComplete="address-level2"
          />
        </label>
      </div>

      <fieldset className="mt-4">
        <legend className="text-sm font-semibold text-loden-ink">Note</legend>
        <div className="mt-2 flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              className="focus-ring rounded-lg p-1 text-loden-500 transition hover:bg-loden-50"
              aria-label={`${value} sur 5`}
              aria-pressed={rating === value}
            >
              <Star className={`h-7 w-7 ${value <= rating ? "fill-loden-500" : "text-slate-200"}`} aria-hidden="true" />
            </button>
          ))}
        </div>
      </fieldset>

      <label className="mt-4 grid gap-2 text-sm font-semibold text-loden-ink">
        Votre avis
        <textarea
          className="field-input min-h-32 resize-y text-base font-normal leading-7"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          maxLength={600}
          minLength={10}
          placeholder="Exemple : moniteur pédagogue, planning flexible, permis obtenu rapidement..."
          required
        />
      </label>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-loden-muted">{comment.trim().length}/600</span>
        <button
          type="submit"
          disabled={submitting}
          className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-xl bg-loden-700 px-5 py-3 text-sm font-bold text-white shadow-soft transition hover:bg-loden-800 disabled:opacity-70 sm:w-auto"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
          {submitting ? "Envoi..." : "Envoyer l'avis"}
        </button>
      </div>

      {success ? <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">Merci, l&apos;avis est reçu.</p> : null}
      {error ? <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</p> : null}
    </form>
  );
}
