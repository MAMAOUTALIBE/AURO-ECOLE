"use client";

import { useEffect, useState } from "react";
import { HelpCircle, Pencil, Plus, X } from "lucide-react";

type FaqEntry = { id: string; question: string; answer: string; category?: string | null; active: boolean };

const EMPTY = { question: "", answer: "", category: "" };

export function FaqManager() {
  const [entries, setEntries] = useState<FaqEntry[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    fetch("/api/faq/manage")
      .then((r) => r.json())
      .then((p) => {
        if (Array.isArray(p?.data)) setEntries(p.data as FaqEntry[]);
        else setError(p?.error?.message ?? "Impossible de charger la FAQ.");
      })
      .catch(() => setError("Le service LODEN est momentanément indisponible."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const startEdit = (entry: FaqEntry) => {
    setEditingId(entry.id);
    setForm({ question: entry.question, answer: entry.answer, category: entry.category ?? "" });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY);
  };

  const submit = async () => {
    if (form.question.trim().length < 5 || form.answer.trim().length < 5) {
      setError("Question et réponse (5 caractères minimum).");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const url = editingId ? `/api/faq/${editingId}` : "/api/faq";
      const method = editingId ? "PATCH" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: form.question, answer: form.answer, category: form.category || undefined })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error?.message ?? "Enregistrement impossible.");
      const saved = payload.data as FaqEntry;
      setEntries((current) => (editingId ? current.map((e) => (e.id === saved.id ? saved : e)) : [...current, saved]));
      cancelEdit();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enregistrement impossible.");
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (entry: FaqEntry) => {
    try {
      const response = await fetch(`/api/faq/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !entry.active })
      });
      if (!response.ok) throw new Error();
      setEntries((current) => current.map((e) => (e.id === entry.id ? { ...e, active: !e.active } : e)));
    } catch {
      setError("Mise à jour impossible.");
    }
  };

  return (
    <div className="grid gap-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-loden-50 text-loden-700">
            {editingId ? <Pencil className="h-5 w-5" aria-hidden="true" /> : <Plus className="h-5 w-5" aria-hidden="true" />}
          </span>
          <h2 className="text-lg font-semibold text-loden-ink">{editingId ? "Modifier la question" : "Ajouter une question"}</h2>
          {editingId ? (
            <button type="button" onClick={cancelEdit} className="focus-ring ml-auto inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-loden-muted hover:bg-loden-50">
              <X className="h-3.5 w-3.5" aria-hidden="true" /> Annuler
            </button>
          ) : null}
        </div>
        <div className="mt-5 grid gap-3">
          <input className="field-input" placeholder="Question" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} aria-label="Question" />
          <textarea className="field-input min-h-24" placeholder="Réponse" value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} aria-label="Réponse" />
          <input className="field-input sm:max-w-xs" placeholder="Catégorie (optionnel)" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} aria-label="Catégorie" />
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={busy}
          className="focus-ring mt-4 inline-flex items-center gap-2 rounded-full bg-loden-700 px-6 py-3 font-semibold text-white shadow-soft transition hover:bg-loden-800 disabled:opacity-70"
        >
          {busy ? "Enregistrement…" : editingId ? "Enregistrer" : "Ajouter"}
        </button>
        {error ? <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700">{error}</p> : null}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-loden-50 text-loden-700">
            <HelpCircle className="h-5 w-5" aria-hidden="true" />
          </span>
          <h2 className="text-lg font-semibold text-loden-ink">FAQ du site ({entries.length})</h2>
        </div>
        {loading ? <p className="mt-6 text-sm text-loden-muted">Chargement…</p> : null}
        <div className="mt-6 grid gap-3">
          {entries.map((entry) => (
            <div key={entry.id} className="rounded-2xl border border-slate-100 bg-loden-pearl/50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-loden-ink">{entry.question}</p>
                  <p className="mt-1 text-sm text-loden-muted">{entry.answer}</p>
                  {entry.category ? <span className="mt-2 inline-block rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-loden-700 shadow-soft">{entry.category}</span> : null}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${entry.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                    {entry.active ? "Visible" : "Masquée"}
                  </span>
                  <button type="button" onClick={() => startEdit(entry)} className="focus-ring rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-loden-700 hover:bg-loden-50">Modifier</button>
                  <button type="button" onClick={() => toggleActive(entry)} className="focus-ring rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-loden-muted hover:bg-loden-50">
                    {entry.active ? "Masquer" : "Afficher"}
                  </button>
                </div>
              </div>
            </div>
          ))}
          {!loading && entries.length === 0 ? <p className="text-sm text-loden-muted">Aucune question pour le moment.</p> : null}
        </div>
      </div>
    </div>
  );
}
