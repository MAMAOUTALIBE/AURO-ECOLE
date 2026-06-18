import { Router } from "express";
import { z } from "zod";
import type { ApiConfig } from "../../config/env";
import { authenticate, requirePermission } from "../../middleware/auth";
import type { LodenRepository } from "../../repositories/loden-repository";
import { asyncHandler } from "../../shared/async-handler";
import { notFound } from "../../shared/http-error";
import { sendChatAppointmentAdminAlert, sendChatAppointmentClientConfirmation } from "../../shared/mailer";
import { buildWhatsAppAppointmentText, buildWhatsAppUrl, sendWhatsAppMessage } from "../../shared/whatsapp";
import { validateBody } from "../../shared/validation";

const appointmentNotificationSchema = z.object({
  appointmentId: z.string().trim().min(1)
});

function toEmailInput(appointment: NonNullable<Awaited<ReturnType<LodenRepository["findChatAppointmentById"]>>>) {
  return {
    leadId: appointment.leadId,
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
}

export function createNotificationsRouter(repository: LodenRepository, config: ApiConfig) {
  const router = Router();
  router.use(authenticate(repository, config.JWT_SECRET), requirePermission("leads.manage"));

  router.post(
    "/email/admin-alert",
    asyncHandler(async (req, res) => {
      const body = validateBody(appointmentNotificationSchema, req);
      const appointment = await repository.findChatAppointmentById(body.appointmentId);
      if (!appointment) throw notFound("Rendez-vous chatbot introuvable");
      const status = await sendChatAppointmentAdminAlert(config, toEmailInput(appointment));
      const updated = await repository.updateChatAppointment(appointment.id, { adminEmailStatus: status });
      res.json({ data: { appointment: updated, status } });
    })
  );

  router.post(
    "/email/client-confirmation",
    asyncHandler(async (req, res) => {
      const body = validateBody(appointmentNotificationSchema, req);
      const appointment = await repository.findChatAppointmentById(body.appointmentId);
      if (!appointment) throw notFound("Rendez-vous chatbot introuvable");
      const status = await sendChatAppointmentClientConfirmation(config, toEmailInput(appointment));
      const updated = await repository.updateChatAppointment(appointment.id, { clientEmailStatus: status });
      res.json({ data: { appointment: updated, status } });
    })
  );

  router.post(
    "/whatsapp",
    asyncHandler(async (req, res) => {
      const body = validateBody(appointmentNotificationSchema, req);
      const appointment = await repository.findChatAppointmentById(body.appointmentId);
      if (!appointment) throw notFound("Rendez-vous chatbot introuvable");
      const text =
        appointment.whatsappMessage ||
        buildWhatsAppAppointmentText({
          formation: appointment.formation,
          date: appointment.date,
          time: appointment.time,
          fullName: appointment.fullName
        });
      const companyInfo = await repository.getCompanyInfo();
      const status = await sendWhatsAppMessage(config, { to: appointment.phone, text, consent: appointment.consentWhatsApp });
      const updated = await repository.updateChatAppointment(appointment.id, { whatsappStatus: status, whatsappMessage: text });
      res.json({
        data: {
          appointment: updated,
          status,
          url: buildWhatsAppUrl(config, companyInfo.phone, text)
        }
      });
    })
  );

  return router;
}
