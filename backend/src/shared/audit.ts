import type { LodenRepository } from "../repositories/loden-repository";

/**
 * Journalisation d'audit centralisée (fire-and-forget : ne bloque jamais la réponse).
 * À utiliser sur toute action sensible (création/modification/suppression/publication).
 */
export function recordAudit(
  repository: LodenRepository,
  input: {
    userId?: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    metadata?: unknown;
  }
): void {
  void repository.createAuditLog({
    userId: input.userId ?? null,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    metadata: input.metadata ?? null
  });
}
