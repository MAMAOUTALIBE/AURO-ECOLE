import { classifyIntent } from "./intent";

export type ChatSuggestion = {
  id: string;
  label: string;
  kind: "flow" | "message" | "whatsapp";
  formation?: string;
  objective?: string;
  message?: string;
};

export type ChatGuidance = {
  intent: string;
  confidence: number;
  summary: string;
  suggestions: ChatSuggestion[];
};

const INTENT_LABELS: Record<string, string> = {
  permis_b: "Permis B",
  vtc: "VTC",
  sst: "SST",
  logistique: "Logistique / sécurité",
  cpf_financement: "CPF / financement",
  devis: "Devis / tarifs",
  rendez_vous: "Rendez-vous",
  inscription: "Inscription",
  documents: "Documents",
  contact: "Contact",
  entreprise: "Entreprise",
  reclamation: "À traiter par l'équipe",
  autre: "À qualifier"
};

function lastUserMessage(messages: { role: "user" | "assistant"; content: string }[]) {
  return [...messages].reverse().find((message) => message.role === "user")?.content.trim() ?? "";
}

function dedupeSuggestions(suggestions: ChatSuggestion[]) {
  const seen = new Set<string>();
  return suggestions.filter((suggestion) => {
    const key = `${suggestion.kind}:${suggestion.label}:${suggestion.formation ?? ""}:${suggestion.objective ?? ""}:${suggestion.message ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function intentLabel(intent: string) {
  return INTENT_LABELS[intent] ?? intent;
}

export function buildConversationSummary(params: {
  messages: { role: "user" | "assistant"; content: string }[];
  intent: string;
  confidence: number;
  reply?: string;
}) {
  const lastUser = lastUserMessage(params.messages).replace(/\s+/g, " ").slice(0, 220);
  const answer = params.reply?.replace(/\s+/g, " ").slice(0, 180);
  const parts = [
    `Intention détectée : ${intentLabel(params.intent)} (${params.confidence}%).`,
    lastUser ? `Dernier besoin : ${lastUser}.` : null,
    answer ? `Réponse proposée : ${answer}.` : null
  ].filter(Boolean);
  return parts.join(" ");
}

export function buildChatSuggestions(intent: string): ChatSuggestion[] {
  const common: ChatSuggestion[] = [
    { id: "book", label: "Prendre RDV", kind: "flow", objective: "Être rappelé" },
    { id: "whatsapp", label: "WhatsApp", kind: "whatsapp" }
  ];

  const byIntent: Record<string, ChatSuggestion[]> = {
    permis_b: [
      { id: "permis-auto", label: "Permis auto", kind: "flow", formation: "Permis B automatique", objective: "M'inscrire" },
      { id: "permis-manuel", label: "Permis manuel", kind: "flow", formation: "Permis B manuel", objective: "M'inscrire" },
      { id: "cpf", label: "Vérifier CPF", kind: "flow", objective: "Utiliser mon CPF" }
    ],
    vtc: [
      { id: "vtc-devis", label: "Devis VTC", kind: "flow", formation: "VTC", objective: "Obtenir un devis" },
      { id: "vtc-cpf", label: "CPF VTC", kind: "flow", formation: "VTC", objective: "Utiliser mon CPF" },
      { id: "vtc-info", label: "Formules VTC", kind: "message", message: "Quelles sont les formules VTC disponibles ?" }
    ],
    sst: [
      { id: "sst-devis", label: "Devis SST", kind: "flow", formation: "SST", objective: "Obtenir un devis" },
      { id: "sst-entreprise", label: "Session entreprise", kind: "flow", formation: "Formation entreprise", objective: "Obtenir un devis" },
      { id: "sst-info", label: "Durées SST", kind: "message", message: "Quelle est la durée des formations SST ?" }
    ],
    logistique: [
      { id: "log-devis", label: "Demander un devis", kind: "flow", formation: "Logistique / sécurité", objective: "Obtenir un devis" },
      { id: "log-entreprise", label: "Formation entreprise", kind: "flow", formation: "Formation entreprise", objective: "Obtenir un devis" },
      { id: "log-info", label: "Formations CACES", kind: "message", message: "Quelles formations CACES et logistique proposez-vous ?" }
    ],
    cpf_financement: [
      { id: "cpf-check", label: "Vérifier CPF", kind: "flow", objective: "Utiliser mon CPF" },
      { id: "cpf-permis", label: "CPF permis", kind: "flow", formation: "Permis B automatique", objective: "Utiliser mon CPF" },
      { id: "cpf-info", label: "Aides possibles", kind: "message", message: "Quelles aides et financements sont possibles ?" }
    ],
    devis: [
      { id: "quote", label: "Demander un devis", kind: "flow", objective: "Obtenir un devis" },
      { id: "prices", label: "Voir les tarifs", kind: "message", message: "Quels sont les tarifs publics des formations ?" },
      { id: "business-quote", label: "Devis entreprise", kind: "flow", formation: "Formation entreprise", objective: "Obtenir un devis" }
    ],
    rendez_vous: [
      { id: "appointment", label: "Choisir un créneau", kind: "flow", objective: "Être rappelé" },
      { id: "registration", label: "M'inscrire", kind: "flow", objective: "M'inscrire" }
    ],
    inscription: [
      { id: "sign-up", label: "M'inscrire", kind: "flow", objective: "M'inscrire" },
      { id: "documents", label: "Documents", kind: "message", message: "Quels documents faut-il fournir pour l'inscription ?" }
    ],
    documents: [
      { id: "doc-permis", label: "Dossier permis", kind: "message", message: "Quels documents faut-il pour un dossier permis B ?" },
      { id: "contact-advisor", label: "Être rappelé", kind: "flow", objective: "Être rappelé" }
    ],
    contact: [
      { id: "contact-whatsapp", label: "WhatsApp", kind: "whatsapp" },
      { id: "contact-call", label: "Être rappelé", kind: "flow", objective: "Être rappelé" }
    ],
    entreprise: [
      { id: "company-quote", label: "Devis entreprise", kind: "flow", formation: "Formation entreprise", objective: "Obtenir un devis" },
      { id: "company-sst", label: "SST entreprise", kind: "flow", formation: "SST", objective: "Obtenir un devis" }
    ],
    reclamation: [
      { id: "human", label: "Être rappelé", kind: "flow", objective: "Être rappelé" },
      { id: "urgent-whatsapp", label: "WhatsApp", kind: "whatsapp" }
    ],
    autre: [
      { id: "choose", label: "Choisir formation", kind: "flow" },
      { id: "prices", label: "Voir les tarifs", kind: "message", message: "Quels sont les tarifs publics des formations ?" }
    ]
  };

  return dedupeSuggestions([...(byIntent[intent] ?? byIntent.autre), ...common]).slice(0, 4);
}

export function buildChatGuidance(messages: { role: "user" | "assistant"; content: string }[], reply?: string): ChatGuidance {
  const userText = messages.filter((message) => message.role === "user").map((message) => message.content).join(" ");
  const result = classifyIntent(userText);
  return {
    intent: result.intent,
    confidence: result.confidence,
    summary: buildConversationSummary({ messages, intent: result.intent, confidence: result.confidence, reply }),
    suggestions: buildChatSuggestions(result.intent)
  };
}
