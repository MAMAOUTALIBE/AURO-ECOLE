import type { ApiConfig } from "../../config/env";
import { SUMMARIZE_SYSTEM } from "../../ai/prompts";
import type { AiProvider } from "../../ai/types";
import type { LodenRepository } from "../../repositories/loden-repository";
import { badRequest, conflict } from "../../shared/http-error";
import { sendChatAppointmentAdminAlert, sendChatAppointmentClientConfirmation } from "../../shared/mailer";
import { buildWhatsAppAppointmentText, buildWhatsAppUrl, sendWhatsAppMessage } from "../../shared/whatsapp";
import { canonicalType } from "../appointments/appointments.vocab";

// Logique de réservation chatbot partagée entre la route HTTP (/api/chat/appointment)
// et l'outil de l'agent IA (book_appointment_slot) — source unique de vérité.

/** Détails de contact/besoin pour un lead/RDV chatbot (champs souples : strings). */
export type ChatBookingDetails = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  formation: string;
  objective: string;
  message?: string;
  companySize?: number;
  consentContact: boolean;
  consentWhatsApp: boolean;
};

export function fullName(input: { firstName: string; lastName: string }) {
  return `${input.firstName.trim()} ${input.lastName.trim()}`.replace(/\s+/g, " ");
}

export function displayDate(date: Date) {
  return date.toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long" });
}

export function displayTime(date: Date) {
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

/** Déduit le type de financement à partir de la formation et de l'objectif déclarés. */
export function deriveFinancingType(input: { formation: string; objective: string }): string {
  if (input.formation === "Formation entreprise") return "ENTREPRISE";
  if (input.objective === "Utiliser mon CPF") return "CPF";
  return "PERSONNEL";
}

/** Crée (ou met à jour via dédup email) un prospect issu du chatbot. */
export async function createLeadFromChat(repository: LodenRepository, input: ChatBookingDetails) {
  const fields = {
    fullName: fullName(input),
    firstName: input.firstName,
    lastName: input.lastName,
    phone: input.phone,
    interest: input.formation,
    financingType: deriveFinancingType(input),
    consentEmail: input.consentContact,
    consentWhatsapp: input.consentWhatsApp,
    notes: [
      `Objectif : ${input.objective}`,
      input.companySize ? `Nombre de salariés : ${input.companySize}` : null,
      input.message ? `Message : ${input.message}` : null
    ]
      .filter(Boolean)
      .join("\n"),
    temperature: "chaud"
  };

  // Déduplication par email : on met à jour l'existant (sans toucher au statut du pipeline).
  const existing = await repository.findLeadByEmail(input.email);
  if (existing) return repository.updateLead(existing.id, fields);
  return repository.createLead({ ...fields, email: input.email, source: "chatbot", status: "PROSPECT" });
}

/** Tâche de suivi prudente : vérification CPF (sans promesse) ou devis entreprise. */
export async function createFinancingFollowUpTask(
  repository: LodenRepository,
  leadId: string,
  input: ChatBookingDetails,
  appointmentId?: string
) {
  const deadline = new Date(Date.now() + 2 * 24 * 60 * 60_000);
  if (input.objective === "Utiliser mon CPF") {
    await repository.createChatTask({
      leadId,
      appointmentId,
      type: "RELANCE",
      priority: "HAUTE",
      deadline,
      note: `Vérifier l'éligibilité CPF — ${input.formation} (${fullName(input)}). Ne pas promettre de validation avant vérification.`
    });
  } else if (input.formation === "Formation entreprise") {
    await repository.createChatTask({
      leadId,
      appointmentId,
      type: "RELANCE",
      priority: "HAUTE",
      deadline,
      note: `Demande entreprise${input.companySize ? ` — ${input.companySize} salariés` : ""} — préparer un devis (${fullName(input)}).`
    });
  }
}

/** Génère et stocke un résumé IA de la conversation (best-effort, non bloquant). */
export async function summarizeAndStoreConversation(repository: LodenRepository, ai: AiProvider | undefined, conversationId: string): Promise<void> {
  try {
    if (!ai?.available) return;
    const conv = await repository.findChatConversationById(conversationId);
    if (!conv || !conv.messages.length) return;
    const text = conv.messages
      .map((m) => `${m.role === "user" ? "Client" : "Assistant"}: ${m.content}`)
      .join("\n")
      .slice(0, 5000);
    const summary = await ai.complete(
      [
        { role: "system", content: SUMMARIZE_SYSTEM },
        { role: "user", content: text }
      ],
      { temperature: 0.2, maxTokens: 300 }
    );
    await repository.updateChatConversation(conversationId, { summary });
  } catch (error) {
    console.error("[chat] résumé conversation échoué:", error instanceof Error ? error.message : error);
  }
}

/** Liste les créneaux de RDV disponibles (pour affichage chatbot / outil IA). */
export async function listAppointmentSlots(repository: LodenRepository) {
  const slots = await repository.listChatAvailabilitySlots({ from: new Date(), active: true });
  return slots.map((slot) => ({
    id: slot.id,
    label: slot.label,
    date: displayDate(slot.startsAt),
    time: displayTime(slot.startsAt),
    type: slot.type,
    remaining: Math.max(0, slot.capacity - slot.bookedCount)
  }));
}

export type ChatBookingInput = ChatBookingDetails & {
  slotId: string;
  type?: string;
  conversationId?: string;
  conversation?: { role: "user" | "assistant"; content: string }[];
};

/**
 * Réserve un créneau de RDV chatbot : crée le lead, le ChatAppointment
 * (pending_confirmation), la tâche de confirmation + suivi financement, relie la
 * conversation, envoie les notifications. Lève conflict/badRequest si le créneau est invalide.
 */
export async function bookChatAppointment(repository: LodenRepository, config: ApiConfig, ai: AiProvider | undefined, input: ChatBookingInput) {
  const availableSlots = await repository.listChatAvailabilitySlots({ from: new Date(), active: true });
  const slot = availableSlots.find((item) => item.id === input.slotId);
  if (!slot) throw conflict("Ce créneau n'est plus disponible. Choisissez un autre créneau.");
  if (slot.endsAt <= slot.startsAt) throw badRequest("Créneau invalide.");

  const lead = await createLeadFromChat(repository, input);
  const name = fullName(input);
  const date = displayDate(slot.startsAt);
  const time = displayTime(slot.startsAt);
  const whatsappMessage = buildWhatsAppAppointmentText({ formation: input.formation, date, time, fullName: name });

  const appointment = await repository.createChatAppointment({
    leadId: lead.id,
    fullName: name,
    firstName: input.firstName,
    lastName: input.lastName,
    phone: input.phone,
    email: input.email,
    formation: input.formation,
    objective: input.objective,
    message: input.message,
    date,
    time,
    requestedAt: new Date(),
    startsAt: slot.startsAt,
    endsAt: slot.endsAt,
    type: canonicalType(slot.type || input.type || "APPEL"),
    status: "pending_confirmation",
    priority: "normal",
    source: "chatbot",
    assignedToId: slot.assignedToId,
    consentContact: input.consentContact,
    consentWhatsApp: input.consentWhatsApp,
    whatsappMessage
  });

  const deadline = new Date(Math.min(slot.startsAt.getTime(), Date.now() + 24 * 60 * 60_000));
  const task = await repository.createChatTask({
    leadId: lead.id,
    appointmentId: appointment.id,
    type: "CONFIRMATION",
    priority: "HAUTE",
    assignedToId: slot.assignedToId,
    deadline,
    note: `Confirmer le rendez-vous chatbot ${input.formation} avec ${name} (${input.phone}).`
  });
  await createFinancingFollowUpTask(repository, lead.id, input, appointment.id);

  // Relie la conversation publique déjà persistée (pas de doublon), sinon en crée une.
  let conversationId: string | undefined;
  if (input.conversationId) {
    const existing = await repository.findChatConversationById(input.conversationId);
    if (existing) {
      await repository.updateChatConversation(input.conversationId, { leadId: lead.id, appointmentId: appointment.id, visitorName: name });
      conversationId = existing.id;
    }
  }
  if (!conversationId && input.conversation?.length) {
    const created = await repository.createChatConversation({
      leadId: lead.id,
      appointmentId: appointment.id,
      visitorName: name,
      messages: input.conversation.map((message) => ({ ...message, createdAt: new Date().toISOString() }))
    });
    conversationId = created.id;
  }
  if (conversationId) void summarizeAndStoreConversation(repository, ai, conversationId);

  const emailInput = {
    leadId: lead.id,
    appointmentId: appointment.id,
    fullName: appointment.fullName,
    firstName: appointment.firstName,
    phone: appointment.phone,
    email: appointment.email,
    formation: appointment.formation,
    date: appointment.date,
    time: appointment.time,
    message: appointment.message
  };
  const [adminEmailStatus, clientEmailStatus, whatsappStatus] = await Promise.all([
    sendChatAppointmentAdminAlert(config, emailInput),
    sendChatAppointmentClientConfirmation(config, emailInput),
    sendWhatsAppMessage(config, { to: input.phone, text: whatsappMessage, consent: input.consentWhatsApp })
  ]);
  const companyInfo = await repository.getCompanyInfo();
  const updatedAppointment = await repository.updateChatAppointment(appointment.id, {
    adminEmailStatus,
    clientEmailStatus,
    whatsappStatus
  });

  await repository.createAuditLog({
    userId: null,
    action: "appointment.created",
    entityType: "Appointment",
    entityId: appointment.id,
    metadata: { leadId: lead.id, taskId: task.id, source: "chatbot" }
  });

  return {
    lead,
    appointment: updatedAppointment,
    task,
    whatsapp: {
      message: whatsappMessage,
      url: buildWhatsAppUrl(config, companyInfo.phone, whatsappMessage),
      status: whatsappStatus
    }
  };
}
