import type { ApiConfig } from "../config/env";

type EmailMessage = { to: string; subject: string; text: string; html?: string };

/**
 * Adaptateur email pluggable.
 * - Si RESEND_API_KEY + MAIL_FROM sont configurés -> envoi via l'API HTTP Resend.
 * - Sinon -> repli en log (utile en dev / sans credentials). Ne lève jamais.
 */
export async function sendEmail(config: ApiConfig, message: EmailMessage): Promise<void> {
  if (!config.RESEND_API_KEY || !config.MAIL_FROM) {
    console.log(`[mail] (provider absent, non envoyé) -> ${message.to} | ${message.subject}`);
    return;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: config.MAIL_FROM,
        to: message.to,
        subject: message.subject,
        text: message.text,
        ...(message.html ? { html: message.html } : {})
      })
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error(`[mail] échec Resend (${response.status}): ${detail}`);
    }
  } catch (error) {
    console.error("[mail] erreur d'envoi:", error);
  }
}

type LeadLike = {
  fullName: string;
  email: string;
  phone?: string | null;
  interest?: string | null;
  source?: string | null;
  notes?: string | null;
};

/** Notifie l'équipe (LODEN_NOTIFY_TO) de l'arrivée d'un nouveau prospect. */
export async function notifyNewLead(config: ApiConfig, lead: LeadLike): Promise<void> {
  const to = config.LODEN_NOTIFY_TO;
  if (!to) {
    console.log(`[mail] nouveau prospect : ${lead.fullName} (aucun LODEN_NOTIFY_TO configuré)`);
    return;
  }

  const lines = [
    `Nouveau prospect LODEN : ${lead.fullName}`,
    `Email : ${lead.email}`,
    lead.phone ? `Téléphone : ${lead.phone}` : null,
    lead.interest ? `Intérêt : ${lead.interest}` : null,
    lead.source ? `Source : ${lead.source}` : null,
    lead.notes ? `Message : ${lead.notes}` : null
  ].filter(Boolean) as string[];

  await sendEmail(config, {
    to,
    subject: `Nouveau prospect : ${lead.fullName}`,
    text: lines.join("\n")
  });
}
