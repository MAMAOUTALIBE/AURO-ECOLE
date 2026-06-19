import type { ApiConfig } from "../config/env";

// Filtre de sortie de l'IA : dernière barrière avant d'envoyer une réponse à
// l'utilisateur. Masque tout ce qui ressemble à un secret (clé API, token, JWT,
// clé privée, chaîne de connexion, variable d'environnement) ET les valeurs réelles
// des secrets de configuration si elles fuitaient telles quelles. Complète (sans
// remplacer) le prompt système : on ne dépend jamais uniquement du LLM.

const REDACTION = "[information masquée]";

const SECRET_PATTERNS: RegExp[] = [
  /\bsk-[A-Za-z0-9_-]{12,}\b/g, // clés type OpenAI
  /\bgsk_[A-Za-z0-9_-]{12,}\b/g, // clés Groq
  /\b(?:pk|sk|rk)_(?:live|test)_[A-Za-z0-9]{8,}\b/g, // clés Stripe
  /\beyJ[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}\b/g, // JWT
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, // clés privées PEM
  /\bpostgres(?:ql)?:\/\/\S+/gi, // chaînes de connexion DB
  /\bprocess\.env(?:\.[A-Za-z0-9_]+)?/g, // accès aux variables d'environnement
  /\b[A-Z][A-Z0-9_]{2,}_(?:API_KEY|SECRET|TOKEN|PASSWORD|KEY)\b\s*[:=]\s*\S+/g // VAR_SECRET=valeur
];

/** Masque les secrets potentiels d'une réponse IA avant envoi à l'utilisateur. */
export function sanitizeAiOutput(text: string, config?: ApiConfig): string {
  if (!text) return text;
  let out = text;

  // 1) Masquer les valeurs réelles des secrets de configuration (garantie forte).
  if (config) {
    for (const secret of [config.JWT_SECRET, config.GROQ_API_KEY, config.DATABASE_URL, config.STRIPE_SECRET_KEY]) {
      if (secret && secret.length >= 8 && out.includes(secret)) {
        out = out.split(secret).join(REDACTION);
      }
    }
  }

  // 2) Masquer les motifs ressemblant à des secrets.
  for (const pattern of SECRET_PATTERNS) {
    out = out.replace(pattern, REDACTION);
  }

  return out;
}
