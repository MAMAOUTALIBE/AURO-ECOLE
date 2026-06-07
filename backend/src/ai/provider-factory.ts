import type { ApiConfig } from "../config/env";
import { DisabledAiProvider, GroqProvider } from "./groq-provider";
import type { AiProvider } from "./types";

/**
 * Sélectionne le provider IA selon la config. Ajouter un provider = ajouter un
 * `case` ici (openai, mistral, claude, ollama…). Sans clé → provider désactivé
 * (l'app reste fonctionnelle, l'IA renvoie un message clair).
 */
export function createAiProvider(config: ApiConfig): AiProvider {
  switch (config.AI_PROVIDER) {
    case "groq":
      return config.GROQ_API_KEY ? new GroqProvider(config.GROQ_API_KEY, config.AI_MODEL) : new DisabledAiProvider();
    default:
      return new DisabledAiProvider();
  }
}
