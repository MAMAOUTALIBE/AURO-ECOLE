export type AiToolFunction = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
};
export type AiTool = { type: "function"; function: AiToolFunction };
export type AiToolCall = { id: string; name: string; arguments: string };

export type AiMessage =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | { role: "assistant"; content: string | null; toolCalls?: AiToolCall[] }
  | { role: "tool"; content: string; toolCallId: string };

export type AiChatRequest = {
  messages: AiMessage[];
  tools?: AiTool[];
  temperature?: number;
  maxTokens?: number;
};
export type AiChatResult = { content: string | null; toolCalls: AiToolCall[] };

export type AiCompletionOptions = { temperature?: number; maxTokens?: number };

/**
 * Interface provider-agnostique. Aujourd'hui Groq ; demain OpenAI / Mistral /
 * Claude / Ollama : ajouter une implémentation et l'enregistrer dans
 * provider-factory.ts. Le reste de l'app ne dépend que de cette interface.
 */
export interface AiProvider {
  readonly name: string;
  /** false quand aucune clé n'est configurée → l'app dégrade proprement. */
  readonly available: boolean;
  /** Appel avec support des outils (tool-calling). */
  chat(request: AiChatRequest): Promise<AiChatResult>;
  /** Raccourci sans outils (résumé, génération de contenu…). */
  complete(messages: AiMessage[], options?: AiCompletionOptions): Promise<string>;
}
