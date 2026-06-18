import type { ApiConfig } from "../config/env";

export type WhatsAppDeliveryStatus = "sent" | "skipped" | "failed";

export type WhatsAppMessageInput = {
  to: string;
  text: string;
  consent: boolean;
};

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) return `33${digits.slice(1)}`;
  return digits;
}

export function buildWhatsAppAppointmentText(input: { formation: string; date: string; time: string; fullName: string }) {
  return `Bonjour LODENE, je souhaite confirmer mon rendez-vous pour ${input.formation} le ${input.date} à ${input.time}. Mon nom est ${input.fullName}.`;
}

export function buildWhatsAppUrl(config: ApiConfig, phone: string, text: string) {
  const businessNumber = normalizePhone(config.WHATSAPP_BUSINESS_NUMBER || phone);
  return `https://wa.me/${businessNumber}?text=${encodeURIComponent(text)}`;
}

export async function sendWhatsAppMessage(config: ApiConfig, input: WhatsAppMessageInput): Promise<WhatsAppDeliveryStatus> {
  if (!input.consent) {
    console.log("[whatsapp] envoi ignoré : consentement absent");
    return "skipped";
  }
  if (config.WHATSAPP_PROVIDER !== "cloud-api" || !config.WHATSAPP_PHONE_NUMBER_ID || !config.WHATSAPP_ACCESS_TOKEN) {
    console.log(`[whatsapp] provider absent, non envoyé -> ${input.to} | ${input.text.slice(0, 80)}`);
    return "skipped";
  }

  try {
    const response = await fetch(`https://graph.facebook.com/v20.0/${config.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: normalizePhone(input.to),
        type: "text",
        text: { preview_url: false, body: input.text }
      })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error(`[whatsapp] échec Cloud API (${response.status}): ${detail}`);
      return "failed";
    }
    return "sent";
  } catch (error) {
    console.error("[whatsapp] erreur d'envoi:", error);
    return "failed";
  }
}
