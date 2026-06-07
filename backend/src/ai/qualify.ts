import type { LeadRecord } from "../domain/types";
import type { LodenRepository } from "../repositories/loden-repository";
import { LEAD_SCORE_SYSTEM } from "./prompts";
import type { AiProvider } from "./types";

/**
 * Qualifie automatiquement un prospect (chaud/tiède/froid + score) via l'IA et
 * met à jour le lead. Fire-and-forget : ne lève jamais, n'allonge pas la réponse.
 */
export async function qualifyLead(provider: AiProvider | undefined, repository: LodenRepository, lead: LeadRecord): Promise<void> {
  if (!provider?.available) return;
  try {
    const description = [
      `Nom: ${lead.fullName}`,
      `Email: ${lead.email}`,
      lead.interest ? `Intérêt: ${lead.interest}` : null,
      lead.source ? `Source: ${lead.source}` : null,
      lead.notes ? `Message: ${lead.notes}` : null
    ]
      .filter(Boolean)
      .join("\n");

    const raw = await provider.complete(
      [
        { role: "system", content: LEAD_SCORE_SYSTEM },
        { role: "user", content: description }
      ],
      { temperature: 0.1, maxTokens: 200 }
    );

    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim()) as { temperature?: unknown; score?: unknown };
    const temperature = ["chaud", "tiede", "froid"].includes(String(parsed.temperature)) ? String(parsed.temperature) : null;
    const score = typeof parsed.score === "number" ? Math.max(0, Math.min(100, Math.round(parsed.score))) : null;

    if (temperature || score !== null) {
      await repository.updateLead(lead.id, { temperature: temperature ?? undefined, score: score ?? undefined });
    }
  } catch (error) {
    console.error("[ai] qualify échec:", error instanceof Error ? error.message : error);
  }
}
