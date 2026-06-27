// Classifieur d'intention déterministe (mots-clés, sans IA ni dépendance).
// Sert à étiqueter les conversations chatbot pour le suivi CRM, à coût nul et de
// façon testable. La "confidence" est un proxy basé sur le nombre de correspondances.

export type IntentResult = { intent: string; confidence: number };

const INTENT_RULES: { intent: string; keywords: string[] }[] = [
  { intent: "reclamation", keywords: ["reclamation", "plainte", "mecontent", "pas content", "probleme", "urgent", "urgence", "annuler", "annulation", "remboursement", "litige"] },
  { intent: "cpf_financement", keywords: ["cpf", "financement", "financer", "opco", "aide", "labaz", "compte formation"] },
  { intent: "permis_b", keywords: ["permis", "conduire", "conduite", "boite", "automatique", "manuel", "code", "conduite accompagnee", "aac"] },
  { intent: "vtc", keywords: ["vtc", "chauffeur", "cma", "carte pro", "carte professionnelle"] },
  { intent: "sst", keywords: ["sst", "secour", "sauveteur", "secourisme"] },
  { intent: "logistique", keywords: ["caces", "chariot", "nacelle", "gerbeur", "pont roulant", "echafaudage", "logistique", "r489", "r485", "r486", "r484", "r457"] },
  { intent: "devis", keywords: ["devis", "tarif", "prix", "combien", "cout", "coute"] },
  { intent: "rendez_vous", keywords: ["rendez", "rdv", "reserver", "creneau", "rappel", "rappeler", "rendez-vous"] },
  { intent: "documents", keywords: ["documents", "pieces", "piece", "justificatif", "photo", "identite", "domicile", "ants", "neph"] },
  { intent: "inscription", keywords: ["inscription", "inscrire", "m inscrire", "commencer", "demarrer", "debuter"] },
  { intent: "contact", keywords: ["adresse", "horaire", "telephone", "ou etes", "ou se trouve", "contact", "email"] },
  { intent: "entreprise", keywords: ["entreprise", "salaries", "salarie", "intra", "inter-entreprise", "collaborateurs"] }
];

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** Détermine l'intention dominante d'un texte (ou de plusieurs messages concaténés). */
export function classifyIntent(text: string): IntentResult {
  const t = normalize(text ?? "");
  if (!t.trim()) return { intent: "autre", confidence: 0 };

  let best = { intent: "autre", hits: 0 };
  for (const rule of INTENT_RULES) {
    let hits = 0;
    for (const keyword of rule.keywords) {
      if (t.includes(normalize(keyword))) hits += 1;
    }
    if (hits > best.hits) best = { intent: rule.intent, hits };
  }

  if (best.hits === 0) return { intent: "autre", confidence: 0 };
  return { intent: best.intent, confidence: Math.min(95, 55 + best.hits * 15) };
}
