import type { AiChatRequest, AiChatResult, AiCompletionOptions, AiMessage, AiProvider } from "./types";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

type OpenAiMessage = Record<string, unknown>;

function toOpenAi(messages: AiMessage[]): OpenAiMessage[] {
  return messages.map((message) => {
    if (message.role === "assistant") {
      return {
        role: "assistant",
        content: message.content ?? "",
        ...(message.toolCalls && message.toolCalls.length
          ? {
              tool_calls: message.toolCalls.map((call) => ({
                id: call.id,
                type: "function",
                function: { name: call.name, arguments: call.arguments }
              }))
            }
          : {})
      };
    }
    if (message.role === "tool") {
      return { role: "tool", tool_call_id: message.toolCallId, content: message.content };
    }
    return { role: message.role, content: message.content };
  });
}

/**
 * Provider Groq (API compatible OpenAI), avec tool-calling. Pas de SDK : fetch.
 * Modèle par défaut rapide/économique : llama-3.1-8b-instant (le tool-use est
 * plus fiable avec llama-3.3-70b-versatile — configurable via AI_MODEL).
 */
export class GroqProvider implements AiProvider {
  readonly name = "groq";
  readonly available = true;

  constructor(
    private readonly apiKey: string,
    private readonly model: string
  ) {}

  async chat(request: AiChatRequest): Promise<AiChatResult> {
    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        messages: toOpenAi(request.messages),
        temperature: request.temperature ?? 0.4,
        max_tokens: request.maxTokens ?? 600,
        ...(request.tools && request.tools.length ? { tools: request.tools, tool_choice: "auto" } : {})
      })
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`Groq API ${response.status}: ${detail.slice(0, 300)}`);
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string | null; tool_calls?: { id: string; function: { name: string; arguments: string } }[] } }[];
    };
    const message = data.choices?.[0]?.message;
    return {
      content: message?.content ?? null,
      toolCalls: (message?.tool_calls ?? []).map((call) => ({
        id: call.id,
        name: call.function.name,
        arguments: call.function.arguments
      }))
    };
  }

  async complete(messages: AiMessage[], options?: AiCompletionOptions): Promise<string> {
    const result = await this.chat({ messages, temperature: options?.temperature, maxTokens: options?.maxTokens });
    if (!result.content) throw new Error("Réponse IA vide");
    return result.content.trim();
  }
}

/** Provider neutre quand aucune clé n'est configurée (gardé par `available`). */
export class DisabledAiProvider implements AiProvider {
  readonly name = "disabled";
  readonly available = false;
  async chat(): Promise<AiChatResult> {
    throw new Error("Aucun provider IA configuré");
  }
  async complete(): Promise<string> {
    throw new Error("Aucun provider IA configuré");
  }
}
