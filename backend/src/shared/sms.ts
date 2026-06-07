import type { ApiConfig } from "../config/env";

/**
 * Adaptateur SMS pluggable. Sans clé configurée → repli en log (ne lève jamais).
 * Brancher un vrai provider (Brevo, Twilio, OVH…) dans ce fichier le moment venu.
 */
export async function sendSms(config: ApiConfig, to: string, text: string): Promise<void> {
  if (!config.SMS_API_KEY) {
    console.log(`[sms] (provider absent, non envoyé) -> ${to} | ${text.slice(0, 80)}`);
    return;
  }
  try {
    // Exemple Brevo (API HTTP). Adapter selon le provider retenu.
    const response = await fetch("https://api.brevo.com/v3/transactionalSMS/sms", {
      method: "POST",
      headers: { "api-key": config.SMS_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ sender: config.SMS_SENDER ?? "LODEN", recipient: to, content: text })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error(`[sms] échec (${response.status}): ${detail.slice(0, 200)}`);
    }
  } catch (error) {
    console.error("[sms] erreur d'envoi:", error);
  }
}
