"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Send } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string };

const GREETING: Message = {
  role: "assistant",
  content:
    "Bonjour 👋 Je suis l'agent interne LODEN. Je peux rechercher un élève, consulter les créneaux et réserver une leçon dans le planning (selon vos droits). Ex : « Réserve une leçon à Karim avec Sarah demain 10h »."
};

export function AiAgentChat() {
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [tools, setTools] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const response = await fetch("/api/ai/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.filter((m) => m !== GREETING).slice(-12) })
      });
      const payload = await response.json().catch(() => null);
      const reply =
        response.ok && payload?.data?.reply
          ? payload.data.reply
          : payload?.error?.message ?? "Service indisponible. Réessayez plus tard.";
      if (Array.isArray(payload?.data?.tools)) setTools(payload.data.tools);
      setMessages((current) => [...current, { role: "assistant", content: reply }]);
    } catch {
      setMessages((current) => [...current, { role: "assistant", content: "Le service est momentanément indisponible." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-loden-50 text-loden-700">
          <Bot className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-loden-ink">Agent interne (actions)</h2>
          <p className="text-xs text-loden-muted">Actions limitées à vos permissions. Les réservations sont réelles.</p>
        </div>
      </div>

      <div ref={scrollRef} className="mt-5 max-h-[26rem] space-y-3 overflow-y-auto rounded-2xl bg-loden-pearl/50 p-4">
        {messages.map((message, index) => (
          <div key={index} className={message.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <p className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-6 shadow-soft ${message.role === "user" ? "bg-loden-700 text-white" : "bg-white text-loden-ink"}`}>
              {message.content}
            </p>
          </div>
        ))}
        {loading ? <p className="text-xs text-loden-muted">L’agent réfléchit…</p> : null}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
        className="mt-3 flex items-center gap-2"
      >
        <input value={input} onChange={(event) => setInput(event.target.value)} maxLength={2000} placeholder="Demandez une action…" aria-label="Message à l'agent" className="field-input flex-1" />
        <button type="submit" disabled={loading || !input.trim()} className="focus-ring inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-loden-700 text-white transition hover:bg-loden-800 disabled:opacity-60" aria-label="Envoyer">
          <Send className="h-5 w-5" />
        </button>
      </form>

      {tools.length ? <p className="mt-3 text-xs text-loden-muted">Outils disponibles pour votre rôle : {tools.join(", ")}</p> : null}
    </div>
  );
}
