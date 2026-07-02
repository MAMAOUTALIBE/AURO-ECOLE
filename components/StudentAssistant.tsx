"use client";

import { useState } from "react";
import { Send, Sparkles } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Combien d'heures me reste-t-il ?",
  "Quel est mon prochain rendez-vous ?",
  "Quels documents ai-je au dossier ?"
];

// Assistant conversationnel de l'espace élève : répond UNIQUEMENT sur le dossier de l'élève
// connecté (heures, RDV, documents). L'auth passe par le cookie loden_session via le proxy.
export function StudentAssistant() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || loading) return;
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/chat/student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-8) })
      });
      const payload = (await response.json().catch(() => null)) as { data?: { reply?: string }; error?: { message?: string } } | null;
      if (!response.ok) throw new Error(payload?.error?.message ?? "Assistant momentanément indisponible.");
      setMessages((cur) => [...cur, { role: "assistant", content: payload?.data?.reply ?? "Je n'ai pas de réponse pour le moment." }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Assistant momentanément indisponible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft md:p-5">
      <div className="flex items-center gap-2">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-loden-50 text-loden-700">
          <Sparkles className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-loden-ink">Mon assistant LODENE</p>
          <p className="text-xs text-loden-muted">Vos heures, RDV et documents — posez votre question.</p>
        </div>
      </div>

      <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => void send(s)}
                className="focus-ring rounded-full border border-slate-200 bg-loden-pearl px-3 py-1.5 text-xs font-semibold text-loden-700 transition hover:bg-loden-50"
              >
                {s}
              </button>
            ))}
          </div>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3 py-2 text-sm ${
                m.role === "user" ? "ml-auto bg-loden-700 text-white" : "bg-loden-pearl text-loden-ink"
              }`}
            >
              {m.content}
            </div>
          ))
        )}
        {loading ? <p className="text-xs text-loden-muted">L&apos;assistant réfléchit…</p> : null}
      </div>

      {error ? <p className="mt-2 rounded-xl bg-red-50 p-2 text-xs font-medium text-red-700">{error}</p> : null}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
        className="mt-3 flex items-center gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Votre question…"
          className="field-input flex-1"
          aria-label="Votre question"
        />
        <button
          type="submit"
          disabled={loading}
          className="focus-ring inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-loden-700 text-white transition hover:bg-loden-800 disabled:opacity-60"
          aria-label="Envoyer"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}
