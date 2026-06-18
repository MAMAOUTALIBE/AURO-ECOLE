import type { ApiConfig } from "../config/env";
import type { AutomationAction, AutomationTrigger } from "../domain/types";
import type { LodenRepository } from "../repositories/loden-repository";
import { sendEmail } from "../shared/mailer";

export type AutomationContext = {
  entityType: string;
  entityId?: string | null;
  email?: string | null;
  name?: string | null;
};

async function executeAction(config: ApiConfig, action: AutomationAction, context: AutomationContext): Promise<void> {
  switch (action) {
    case "SEND_WELCOME_EMAIL":
      if (context.email) {
        await sendEmail(config, {
          to: context.email,
          subject: "Bienvenue chez LODENE Auto-École",
          text: `Bonjour ${context.name ?? ""},\n\nMerci de votre intérêt pour LODENE Auto-École. Notre équipe revient vers vous très vite pour construire votre parcours.\n\nÀ très bientôt,\nL'équipe LODENE`
        });
      }
      return;
    case "NOTIFY_TEAM":
      if (config.LODEN_NOTIFY_TO) {
        await sendEmail(config, {
          to: config.LODEN_NOTIFY_TO,
          subject: `Automatisation LODENE — ${context.entityType}`,
          text: `Déclenchement automatique pour ${context.entityType} : ${context.name ?? context.entityId ?? "—"}.`
        });
      }
      return;
    case "LOG":
    default:
      return;
  }
}

/**
 * Moteur d'automatisations : best-effort, jamais bloquant (appelé via `void`).
 * Exécute toutes les règles ACTIVES liées au déclencheur, trace chaque exécution.
 */
export async function runAutomations(
  repository: LodenRepository,
  config: ApiConfig,
  trigger: AutomationTrigger,
  context: AutomationContext
): Promise<void> {
  try {
    const rules = await repository.listAutomationRules({ trigger, active: true });
    for (const rule of rules) {
      try {
        await executeAction(config, rule.action, context);
        await repository.recordAutomationRun(rule.id);
        void repository.createAuditLog({
          userId: null,
          action: "automation.run",
          entityType: "AutomationRule",
          entityId: rule.id,
          metadata: { trigger, action: rule.action, target: context.entityId }
        });
      } catch (error) {
        console.error(`[automation] échec règle ${rule.id}:`, error);
      }
    }
  } catch (error) {
    console.error("[automation] erreur moteur:", error);
  }
}
