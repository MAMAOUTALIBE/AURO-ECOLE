"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, X } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string };

const GREETING: Message = {
  role: "assistant",
  content: "Bonjour 👋 Je suis l'assistant LODENE. Je peux vous aider à choisir une formation, comprendre le CPF, les tarifs ou l'inscription. Que puis-je faire pour vous ?"
};

export function AiChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // On n'envoie que les 12 derniers tours, sans le message d'accueil.
        body: JSON.stringify({ messages: next.filter((m, i) => !(i === 0 && m === GREETING)).slice(-12) })
      });
      const payload = await response.json().catch(() => null);
      const reply =
        response.ok && payload?.data?.reply
          ? payload.data.reply
          : payload?.error?.message ?? "Désolé, je ne peux pas répondre pour le moment. Vous pouvez nous joindre au 01 84 80 12 45.";
      setMessages((current) => [...current, { role: "assistant", content: reply }]);
    } catch {
      setMessages((current) => [
        ...current,
        { role: "assistant", content: "Le service est momentanément indisponible. Réessayez ou appelez le 01 84 80 12 45." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {open ? (
        <div className="fixed bottom-24 right-5 z-40 flex h-[30rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-premium">
          <div className="flex items-center justify-between gap-3 bg-loden-700 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold leading-tight">Assistant LODENE</p>
                <p className="text-[11px] text-white/80">Réponses indicatives — un conseiller peut vous rappeler</p>
              </div>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="focus-ring rounded-full p-1 hover:bg-white/15" aria-label="Fermer l'assistant">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-loden-pearl/60 p-4">
            {messages.map((message, index) => (
              <div key={index} className={message.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <p
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-6 shadow-soft ${
                    message.role === "user" ? "bg-loden-700 text-white" : "bg-white text-loden-ink"
                  }`}
                >
                  {message.content}
                </p>
              </div>
            ))}
            {loading ? <p className="text-xs text-loden-muted">L’assistant écrit…</p> : null}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void send();
            }}
            className="flex items-center gap-2 border-t border-slate-200 p-3"
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              maxLength={2000}
              placeholder="Votre question…"
              aria-label="Votre question"
              className="field-input flex-1"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="focus-ring inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-loden-700 text-white transition hover:bg-loden-800 disabled:opacity-60"
              aria-label="Envoyer"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="focus-ring fixed bottom-24 right-5 z-30 inline-flex h-14 w-14 items-center justify-center rounded-full bg-loden-500 text-white shadow-premium transition hover:bg-loden-600"
        aria-label={open ? "Fermer l'assistant LODENE" : "Ouvrir l'assistant LODENE"}
      >
        {open ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
      </button>
    </>
  );
}
