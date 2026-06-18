import type { ApiConfig } from "../config/env";
import nodemailer from "nodemailer";

type EmailMessage = { to: string; subject: string; text: string; html?: string };
export type EmailDeliveryStatus = "sent" | "skipped" | "failed";

/**
 * Adaptateur email pluggable.
 * - Si RESEND_API_KEY + MAIL_FROM sont configurés -> envoi via l'API HTTP Resend.
 * - Sinon -> repli en log (utile en dev / sans credentials). Ne lève jamais.
 */
export async function sendEmail(config: ApiConfig, message: EmailMessage): Promise<EmailDeliveryStatus> {
  if (config.SMTP_HOST && config.SMTP_PORT && config.SMTP_FROM) {
    try {
      const transporter = nodemailer.createTransport({
        host: config.SMTP_HOST,
        port: config.SMTP_PORT,
        secure: config.SMTP_PORT === 465,
        auth: config.SMTP_USER && config.SMTP_PASS ? { user: config.SMTP_USER, pass: config.SMTP_PASS } : undefined
      });
      await transporter.sendMail({
        from: config.SMTP_FROM,
        to: message.to,
        subject: message.subject,
        text: message.text,
        ...(message.html ? { html: message.html } : {})
      });
      return "sent";
    } catch (error) {
      console.error("[mail] erreur SMTP:", error);
      return "failed";
    }
  }

  if (!config.RESEND_API_KEY || !config.MAIL_FROM) {
    console.log(`[mail] (provider absent, non envoyé) -> ${message.to} | ${message.subject}`);
    return "skipped";
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
      return "failed";
    }
    return "sent";
  } catch (error) {
    console.error("[mail] erreur d'envoi:", error);
    return "failed";
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
  const to = config.LODEN_NOTIFY_TO ?? config.OWNER_ALERT_EMAIL;
  if (!to) {
    console.log(`[mail] nouveau prospect : ${lead.fullName} (aucun LODEN_NOTIFY_TO configuré)`);
    return;
  }

  const lines = [
    `Nouveau prospect LODENE : ${lead.fullName}`,
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

export type ChatAppointmentEmailInput = {
  leadId: string;
  appointmentId: string;
  fullName: string;
  firstName: string;
  phone: string;
  email?: string | null;
  formation: string;
  date: string;
  time: string;
  message?: string | null;
};

export async function sendChatAppointmentAdminAlert(config: ApiConfig, appointment: ChatAppointmentEmailInput): Promise<"sent" | "skipped" | "failed"> {
  const to = config.OWNER_ALERT_EMAIL ?? config.LODEN_NOTIFY_TO;
  if (!to) {
    console.log(`[mail] rendez-vous chatbot ${appointment.appointmentId} : aucun OWNER_ALERT_EMAIL/LODEN_NOTIFY_TO configuré`);
    return "skipped";
  }
  const crmLeadUrl = `${config.appBaseUrl}/admin/demandes-chatbot?lead=${encodeURIComponent(appointment.leadId)}`;
  const crmAppointmentUrl = `${config.appBaseUrl}/admin/demandes-chatbot?appointment=${encodeURIComponent(appointment.appointmentId)}`;
  const lines = [
    "Nouveau rendez-vous depuis le chatbot LODENE",
    "",
    `Nom : ${appointment.fullName}`,
    `Téléphone : ${appointment.phone}`,
    appointment.email ? `Email : ${appointment.email}` : null,
    `Formation demandée : ${appointment.formation}`,
    `Créneau : ${appointment.date} à ${appointment.time}`,
    appointment.message ? `Message : ${appointment.message}` : null,
    `Fiche CRM : ${crmLeadUrl}`,
    `Rendez-vous CRM : ${crmAppointmentUrl}`
  ].filter(Boolean) as string[];

  try {
    return await sendEmail(config, {
      to,
      subject: "Nouveau rendez-vous depuis le chatbot LODENE",
      text: lines.join("\n")
    });
  } catch (error) {
    console.error("[mail] alerte rendez-vous chatbot échouée:", error);
    return "failed";
  }
}

export async function sendChatAppointmentClientConfirmation(config: ApiConfig, appointment: ChatAppointmentEmailInput): Promise<"sent" | "skipped" | "failed"> {
  if (!appointment.email) return "skipped";
  try {
    return await sendEmail(config, {
      to: appointment.email,
      subject: "Votre demande de rendez-vous LODENE est bien reçue",
      text: [
        `Bonjour ${appointment.firstName},`,
        "",
        "Votre demande de rendez-vous a bien été enregistrée.",
        "",
        `Formation : ${appointment.formation}`,
        `Créneau : ${appointment.date} à ${appointment.time}`,
        "",
        "Un conseiller LODENE pourra vous confirmer ce créneau si nécessaire."
      ].join("\n")
    });
  } catch (error) {
    console.error("[mail] confirmation client chatbot échouée:", error);
    return "failed";
  }
}
