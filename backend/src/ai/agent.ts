import type { ToolContext, ToolEntry } from "./tools";
import type { AiMessage, AiProvider } from "./types";

const FALLBACK = "Je transmets votre demande à un conseiller LODEN qui vous répondra rapidement.";

/**
 * Boucle d'agent : envoie la conversation + les outils au provider, exécute les
 * appels d'outils (avec leurs gardes de sécurité), renvoie la réponse finale.
 * Bornée par maxSteps pour éviter toute boucle infinie.
 */
export async function runAgent(
  provider: AiProvider,
  opts: { systemPrompt: string; userMessages: AiMessage[]; tools: ToolEntry[]; context: ToolContext; maxSteps?: number }
): Promise<string> {
  const maxSteps = opts.maxSteps ?? 4;
  const messages: AiMessage[] = [{ role: "system", content: opts.systemPrompt }, ...opts.userMessages];
  const toolDefs = opts.tools.map((tool) => tool.def);

  for (let step = 0; step < maxSteps; step += 1) {
    const result = await provider.chat({
      messages,
      tools: toolDefs.length ? toolDefs : undefined,
      temperature: 0.4,
      maxTokens: 600
    });

    if (!result.toolCalls.length) {
      return result.content?.trim() || FALLBACK;
    }

    messages.push({ role: "assistant", content: result.content, toolCalls: result.toolCalls });

    for (const call of result.toolCalls) {
      const tool = opts.tools.find((entry) => entry.def.function.name === call.name);
      let output: unknown;
      try {
        const args = call.arguments ? (JSON.parse(call.arguments) as Record<string, unknown>) : {};
        output = tool ? await tool.handler(args, opts.context) : { error: "Outil non autorisé" };
      } catch {
        output = { error: "Échec de l'exécution de l'outil" };
      }
      messages.push({ role: "tool", toolCallId: call.id, content: JSON.stringify(output).slice(0, 4000) });
    }
  }

  // Garde-fou : on force une réponse finale sans nouvel appel d'outil.
  const final = await provider.chat({ messages, temperature: 0.4, maxTokens: 400 });
  return final.content?.trim() || FALLBACK;
}
