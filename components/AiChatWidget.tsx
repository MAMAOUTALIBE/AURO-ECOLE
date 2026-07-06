"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, CalendarDays, CheckCircle2, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { contactInfo } from "@/data/site";
import { cn } from "@/lib/utils";
import { trackConversion, trackEvent } from "@/lib/analytics";
import { attributionPayload } from "@/lib/attribution";

type Message = { role: "user" | "assistant"; content: string };
type ChatSuggestion = {
  id: string;
  label: string;
  kind: "flow" | "message" | "whatsapp";
  formation?: string;
  objective?: string;
  message?: string;
};
type FlowStep = "formation" | "objective" | "contact" | "slot" | "done";
type AppointmentSlot = {
  id: string;
  label: string;
  date: string;
  time: string;
  startsAt: string;
  endsAt: string;
  type: "APPEL" | "AGENCE" | "VISIO" | "DEVIS" | "INSCRIPTION";
  remaining: number;
};

type FlowState = {
  step: FlowStep;
  formation?: string;
  objective?: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  message: string;
  companySize: string;
  consentContact: boolean;
  consentWhatsApp: boolean;
};

const GREETING: Message = {
  role: "assistant",
  content:
    "Bonjour 👋 Je suis l'assistant LODENE. Je vous aide à choisir votre formation, obtenir un devis ou prendre rendez-vous — en 1 minute, sans engagement ni paiement. Dites-moi ce qui vous intéresse (ou tapez « m'orienter »), et je m'occupe du reste. 🙂"
};

const FORMATIONS = [
  "Permis B manuel",
  "Permis B automatique",
  "VTC",
  "SST",
  "Logistique / sécurité",
  "Je ne sais pas encore"
];

const OBJECTIVES = ["M'inscrire", "Obtenir un devis", "Utiliser mon CPF", "Poser une question", "Être rappelé"];

const DEFAULT_SUGGESTIONS: ChatSuggestion[] = [
  { id: "permis-b", label: "Permis B", kind: "flow", formation: "Permis B automatique", objective: "M'inscrire" },
  { id: "cpf", label: "Vérifier CPF", kind: "flow", objective: "Utiliser mon CPF" },
  { id: "quote", label: "Demander un devis", kind: "flow", objective: "Obtenir un devis" },
  { id: "appointment", label: "Prendre RDV", kind: "flow", objective: "Être rappelé" }
];

const EMPTY_FLOW: FlowState = {
  step: "formation",
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  message: "",
  companySize: "",
  consentContact: true,
  consentWhatsApp: false
};

function normalizeWhatsappNumber(source: string) {
  const digits = source.replace(/\D/g, "");
  return digits.startsWith("0") ? `33${digits.slice(1)}` : digits;
}

function whatsappHref(text = "Bonjour LODENE, je souhaite des informations sur vos formations.") {
  const phone = normalizeWhatsappNumber(contactInfo.whatsapp || contactInfo.phone);
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

function optionButtonClass(active?: boolean) {
  return cn(
    "focus-ring rounded-2xl border px-3 py-2 text-left text-xs font-semibold transition",
    active ? "border-loden-600 bg-loden-50 text-loden-800" : "border-slate-200 bg-white text-loden-ink hover:border-loden-300 hover:bg-loden-50"
  );
}

function normalizeSuggestions(value: unknown): ChatSuggestion[] {
  if (!Array.isArray(value)) return DEFAULT_SUGGESTIONS;
  const suggestions = value
    .filter((item): item is ChatSuggestion => {
      if (!item || typeof item !== "object") return false;
      const candidate = item as Partial<ChatSuggestion>;
      return Boolean(candidate.id && candidate.label && candidate.kind && ["flow", "message", "whatsapp"].includes(candidate.kind));
    })
    .slice(0, 4);
  return suggestions.length ? suggestions : DEFAULT_SUGGESTIONS;
}

export function AiChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const [flow, setFlow] = useState<FlowState | null>(null);
  const [suggestions, setSuggestions] = useState<ChatSuggestion[]>(DEFAULT_SUGGESTIONS);
  const [slots, setSlots] = useState<AppointmentSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [flowError, setFlowError] = useState<string | null>(null);
  const [confirmedWhatsappUrl, setConfirmedWhatsappUrl] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);
  // État courant lu par le déclencheur proactif (évite un setState imbriqué).
  const proactiveRef = useRef({ open, count: messages.length });
  proactiveRef.current = { open, count: messages.length };

  const compactMessages = useMemo(
    () => messages.filter((_, index) => index !== 0).slice(-10),
    [messages]
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, flow, open, slots, loading]);

  useEffect(() => {
    const openAssistant = () => {
      trackEvent("CTA", "click_assistant", "event");
      setOpen(true);
    };
    window.addEventListener("lodene:open-assistant", openAssistant);
    return () => window.removeEventListener("lodene:open-assistant", openAssistant);
  }, []);

  // Déclenchement proactif : 8 s après l'arrivée sur le site, ouvre l'assistant UNE SEULE FOIS
  // par session et invite à s'inscrire (sans engagement, sans paiement). Le drapeau de session
  // est posé dès le déclenchement : si le visiteur ferme l'assistant, il ne se rouvre JAMAIS
  // tout seul (aucune ré-ouverture automatique). Ne s'affiche pas non plus si le visiteur a
  // déjà ouvert le chat ou entamé une conversation.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.sessionStorage.getItem("lodene:proactive-invite") === "done") return;
    const timer = window.setTimeout(() => {
      window.sessionStorage.setItem("lodene:proactive-invite", "done");
      if (proactiveRef.current.open || proactiveRef.current.count > 1) return;
      // Ouvre simplement l'assistant : le message d'accueil (GREETING) contient déjà l'invitation.
      setOpen(true);
    }, 8_000);
    return () => window.clearTimeout(timer);
  }, []);

  const pushAssistant = (content: string) => setMessages((current) => [...current, { role: "assistant", content }]);
  const pushUser = (content: string) => setMessages((current) => [...current, { role: "user", content }]);

  const startFlow = (preset?: Partial<FlowState>) => {
    setOpen(true);
    setFlowError(null);
    setConfirmedWhatsappUrl(null);
    const next = { ...EMPTY_FLOW, ...preset };
    next.step = next.formation ? next.objective ? "contact" : "objective" : "formation";
    setFlow(next);
    pushAssistant("Très bien. Je vais vous orienter en quelques étapes, puis proposer un créneau avec un conseiller LODENE.");
  };

  const sendMessage = async (value: string) => {
    const text = value.trim();
    if (!text || loading) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const response = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.filter((_, index) => index !== 0).slice(-12), conversationId })
      });
      const payload = await response.json().catch(() => null);
      if (payload?.data?.conversationId) setConversationId(payload.data.conversationId as string);
      setSuggestions(normalizeSuggestions(payload?.data?.suggestions));
      const reply =
        response.ok && payload?.data?.reply
          ? payload.data.reply
          : payload?.error?.message ?? "Désolé, je ne peux pas répondre pour le moment. Un conseiller peut vous aider par WhatsApp.";
      pushAssistant(reply);
    } catch {
      pushAssistant("Le service est momentanément indisponible. Vous pouvez continuer sur WhatsApp.");
    } finally {
      setLoading(false);
    }
  };

  const send = async () => {
    await sendMessage(input);
  };

  const applySuggestion = (suggestion: ChatSuggestion) => {
    if (loading) return;
    if (suggestion.kind === "message") {
      void sendMessage(suggestion.message || suggestion.label);
      return;
    }
    if (suggestion.kind === "whatsapp") {
      pushUser(suggestion.label);
      window.open(whatsappHref(), "_blank", "noopener,noreferrer");
      return;
    }
    pushUser(suggestion.label);
    startFlow({ formation: suggestion.formation, objective: suggestion.objective });
  };

  const loadAvailability = async (nextFlow: FlowState) => {
    setLoading(true);
    setFlowError(null);
    try {
      const response = await fetch("/api/appointments/availability");
      const payload = await response.json().catch(() => null);
      if (!response.ok || !Array.isArray(payload?.data)) throw new Error(payload?.error?.message ?? "Créneaux indisponibles.");
      setSlots(payload.data as AppointmentSlot[]);
      setFlow({ ...nextFlow, step: "slot" });
      pushAssistant(
        payload.data.length
          ? "Voici les prochains créneaux proposés par LODENE. Le rendez-vous restera à confirmer par un conseiller."
          : "Aucun créneau n'est disponible pour le moment. Vous pouvez demander un rappel ou continuer sur WhatsApp."
      );
    } catch (error) {
      setFlowError(error instanceof Error ? error.message : "Impossible de charger les créneaux.");
    } finally {
      setLoading(false);
    }
  };

  const submitContact = () => {
    if (!flow) return;
    if (!flow.firstName.trim() || !flow.lastName.trim() || !flow.phone.trim() || !flow.email.trim()) {
      setFlowError("Prénom, nom, téléphone et email sont requis.");
      return;
    }
    if (!flow.email.includes("@")) {
      setFlowError("L'email semble invalide.");
      return;
    }
    if (!flow.consentContact) {
      setFlowError("Le consentement de contact est nécessaire pour envoyer la demande.");
      return;
    }
    void loadAvailability(flow);
  };

  const selectSlot = async (slot: AppointmentSlot) => {
    if (!flow?.formation || !flow.objective || loading) return;
    setLoading(true);
    setFlowError(null);
    try {
      const response = await fetch("/api/chat/appointment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId: slot.id,
          formation: flow.formation,
          objective: flow.objective,
          firstName: flow.firstName,
          lastName: flow.lastName,
          phone: flow.phone,
          email: flow.email,
          message: flow.message,
          companySize: flow.companySize ? Number(flow.companySize) : undefined,
          consentContact: flow.consentContact,
          consentWhatsApp: flow.consentWhatsApp,
          conversation: compactMessages,
          conversationId,
          ...attributionPayload()
        })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error?.message ?? "La prise de rendez-vous a échoué.");
      trackConversion("rdv_request", flow.formation);
      const whatsappUrl = payload?.data?.whatsapp?.url as string | undefined;
      setConfirmedWhatsappUrl(whatsappUrl ?? whatsappHref());
      setFlow({ ...flow, step: "done" });
      pushAssistant(
        `Votre demande est enregistrée pour ${flow.formation}, le ${slot.date} à ${slot.time}. Un conseiller LODENE pourra confirmer ce créneau si nécessaire.`
      );
    } catch (error) {
      setFlowError(error instanceof Error ? error.message : "La demande n'a pas pu être envoyée.");
    } finally {
      setLoading(false);
    }
  };

  const updateFlow = (patch: Partial<FlowState>) => {
    setFlow((current) => (current ? { ...current, ...patch } : current));
    setFlowError(null);
  };

  const renderFlow = () => {
    if (!flow) return null;

    if (flow.step === "formation") {
      return (
        <div className="grid gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-loden-700">Formation souhaitée</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {FORMATIONS.map((formation) => (
              <button
                key={formation}
                type="button"
                className={optionButtonClass(flow.formation === formation)}
                onClick={() => {
                  updateFlow({ formation, step: flow.objective ? "contact" : "objective" });
                  pushUser(formation);
                }}
              >
                {formation}
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (flow.step === "objective") {
      return (
        <div className="grid gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-loden-700">Objectif</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {OBJECTIVES.map((objective) => (
              <button
                key={objective}
                type="button"
                className={optionButtonClass(flow.objective === objective)}
                onClick={() => {
                  updateFlow({ objective, step: "contact" });
                  pushUser(objective);
                }}
              >
                {objective}
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (flow.step === "contact") {
      return (
        <div className="grid gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-loden-700">Coordonnées</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <input className="field-input" value={flow.firstName} onChange={(e) => updateFlow({ firstName: e.target.value })} placeholder="Prénom *" aria-label="Prénom" />
            <input className="field-input" value={flow.lastName} onChange={(e) => updateFlow({ lastName: e.target.value })} placeholder="Nom *" aria-label="Nom" />
            <input className="field-input" value={flow.phone} onChange={(e) => updateFlow({ phone: e.target.value })} placeholder="Téléphone *" aria-label="Téléphone" />
            <input className="field-input" type="email" value={flow.email} onChange={(e) => updateFlow({ email: e.target.value })} placeholder="Email *" aria-label="Email" />
          </div>
          {flow.formation === "Formation entreprise" ? (
            <input
              className="field-input"
              type="number"
              min={1}
              value={flow.companySize}
              onChange={(e) => updateFlow({ companySize: e.target.value })}
              placeholder="Nombre de salariés à former"
              aria-label="Nombre de salariés"
            />
          ) : null}
          <textarea
            className="field-input min-h-20 resize-none"
            value={flow.message}
            onChange={(e) => updateFlow({ message: e.target.value })}
            placeholder="Message ou précision"
            aria-label="Message"
          />
          <label className="flex items-start gap-2 text-xs leading-5 text-loden-muted">
            <input type="checkbox" className="mt-1" checked={flow.consentContact} onChange={(e) => updateFlow({ consentContact: e.target.checked })} />
            J&apos;accepte d&apos;être contacté par LODENE au sujet de ma demande.
          </label>
          <label className="flex items-start gap-2 text-xs leading-5 text-loden-muted">
            <input type="checkbox" className="mt-1" checked={flow.consentWhatsApp} onChange={(e) => updateFlow({ consentWhatsApp: e.target.checked })} />
            J&apos;accepte aussi une confirmation ou relance par WhatsApp.
          </label>
          <button
            type="button"
            onClick={submitContact}
            disabled={loading}
            className="focus-ring inline-flex items-center justify-center gap-2 rounded-2xl bg-loden-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-loden-800 disabled:opacity-60"
          >
            Voir les créneaux
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      );
    }

    if (flow.step === "slot") {
      return (
        <div className="grid gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-loden-700">Créneau proposé</p>
          {slots.length ? (
            <div className="grid gap-2">
              {slots.slice(0, 5).map((slot) => (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => void selectSlot(slot)}
                  disabled={loading}
                  className="focus-ring flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-left transition hover:border-loden-300 hover:bg-loden-50 disabled:opacity-60"
                >
                  <span>
                    <span className="block text-sm font-semibold text-loden-ink">{slot.date}</span>
                    <span className="block text-xs text-loden-muted">{slot.label} · {slot.time}</span>
                  </span>
                  <CalendarDays className="h-4 w-4 shrink-0 text-loden-700" aria-hidden="true" />
                </button>
              ))}
            </div>
          ) : (
            <a
              href={whatsappHref(`Bonjour LODENE, je souhaite prendre rendez-vous pour ${flow.formation ?? "une formation"}.`)}
              target="_blank"
              rel="noreferrer"
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              Continuer sur WhatsApp
            </a>
          )}
        </div>
      );
    }

    return (
      <div className="grid gap-3 rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-800">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p className="font-semibold">Demande transmise au CRM LODENE.</p>
        </div>
        <a
          href={confirmedWhatsappUrl ?? whatsappHref()}
          target="_blank"
          rel="noreferrer"
          className="focus-ring inline-flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          Confirmer sur WhatsApp
        </a>
      </div>
    );
  };

  return (
    <>
      {open ? (
        <div className="fixed inset-x-3 bottom-[calc(4.9rem+env(safe-area-inset-bottom))] z-[60] flex h-[min(72svh,34rem)] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-premium sm:bottom-24 sm:h-[min(78svh,35rem)] sm:z-40 md:left-auto md:right-5 md:w-[24rem]">
          <div className="flex items-center justify-between gap-3 bg-loden-700 px-4 py-3 text-white">
            <div className="flex min-w-0 items-center gap-2">
              <Sparkles className="h-5 w-5 shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold leading-tight">Assistant LODENE</p>
                <p className="truncate text-[11px] text-white/80">Formation, devis et rendez-vous</p>
              </div>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="focus-ring rounded-full p-1 hover:bg-white/15" aria-label="Fermer l'assistant">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-loden-pearl/60 p-3 sm:p-4">
            {messages.map((message, index) => (
              <div key={index} className={message.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <p
                  className={cn(
                    "max-w-[88%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-6 shadow-soft",
                    message.role === "user" ? "bg-loden-700 text-white" : "bg-white text-loden-ink"
                  )}
                >
                  {message.content}
                </p>
              </div>
            ))}

            {!flow ? (
              <div className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-soft">
                <div className="grid grid-cols-2 gap-2">
                  {suggestions.map((action) => (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => applySuggestion(action)}
                      disabled={loading}
                      className={optionButtonClass()}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
                <a
                  href={whatsappHref()}
                  target="_blank"
                  rel="noreferrer"
                  className="focus-ring inline-flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1fbd58]"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  Continuer sur WhatsApp
                </a>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-soft">{renderFlow()}</div>
            )}

            {flowError ? <p className="rounded-2xl bg-red-50 p-3 text-sm font-medium text-red-700">{flowError}</p> : null}
            {loading ? <p className="text-xs text-loden-muted">Traitement en cours…</p> : null}
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

      <div className="fixed bottom-4 right-4 z-30 hidden max-w-[calc(100vw-2rem)] items-center gap-2 sm:bottom-5 sm:right-5 sm:flex">
        <button
          type="button"
          onClick={() =>
            setOpen((value) => {
              if (!value) trackEvent("CTA", "click_assistant", window.location.pathname);
              return !value;
            })
          }
          className="focus-ring inline-flex h-12 w-12 items-center justify-center gap-2 rounded-full bg-loden-700 px-0 text-sm font-semibold text-white shadow-premium transition hover:bg-loden-800 lg:h-14 lg:w-auto lg:px-4"
          aria-label={open ? "Fermer l'assistant LODENE" : "Ouvrir l'assistant LODENE"}
        >
          {open ? <X className="h-5 w-5 shrink-0" aria-hidden="true" /> : <Sparkles className="h-5 w-5 shrink-0" aria-hidden="true" />}
          <span className="hidden lg:inline">{open ? "Fermer" : "Assistant LODENE"}</span>
        </button>
      </div>
    </>
  );
}
