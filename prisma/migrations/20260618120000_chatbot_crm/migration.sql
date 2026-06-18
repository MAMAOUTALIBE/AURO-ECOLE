-- Chatbot conversion CRM: leads qualifiés, rendez-vous, tâches, conversations et créneaux configurables.
CREATE TABLE "ChatAppointment" (
  "id" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "email" TEXT,
  "formation" TEXT NOT NULL,
  "objective" TEXT NOT NULL,
  "message" TEXT,
  "date" TEXT NOT NULL,
  "time" TEXT NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "type" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'A_CONFIRMER',
  "assignedToId" TEXT,
  "source" TEXT NOT NULL DEFAULT 'chatbot',
  "consentContact" BOOLEAN NOT NULL DEFAULT true,
  "consentWhatsApp" BOOLEAN NOT NULL DEFAULT false,
  "whatsappMessage" TEXT,
  "adminEmailStatus" TEXT NOT NULL DEFAULT 'pending',
  "clientEmailStatus" TEXT NOT NULL DEFAULT 'pending',
  "whatsappStatus" TEXT NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ChatAppointment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ChatTask" (
  "id" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "appointmentId" TEXT,
  "type" TEXT NOT NULL,
  "priority" TEXT NOT NULL DEFAULT 'HAUTE',
  "assignedToId" TEXT,
  "deadline" TIMESTAMP(3) NOT NULL,
  "note" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'A_FAIRE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ChatTask_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ChatConversation" (
  "id" TEXT NOT NULL,
  "leadId" TEXT,
  "appointmentId" TEXT,
  "visitorName" TEXT,
  "messages" JSONB NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'OUVERTE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ChatConversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ChatAvailabilitySlot" (
  "id" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "type" TEXT NOT NULL,
  "agencyId" TEXT,
  "assignedToId" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "capacity" INTEGER NOT NULL DEFAULT 1,
  "bookedCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ChatAvailabilitySlot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ChatAppointment_status_createdAt_idx" ON "ChatAppointment"("status", "createdAt");
CREATE INDEX "ChatAppointment_leadId_idx" ON "ChatAppointment"("leadId");
CREATE INDEX "ChatAppointment_startsAt_idx" ON "ChatAppointment"("startsAt");
CREATE INDEX "ChatTask_status_deadline_idx" ON "ChatTask"("status", "deadline");
CREATE INDEX "ChatTask_leadId_idx" ON "ChatTask"("leadId");
CREATE INDEX "ChatTask_appointmentId_idx" ON "ChatTask"("appointmentId");
CREATE INDEX "ChatConversation_updatedAt_idx" ON "ChatConversation"("updatedAt");
CREATE INDEX "ChatConversation_leadId_idx" ON "ChatConversation"("leadId");
CREATE INDEX "ChatConversation_appointmentId_idx" ON "ChatConversation"("appointmentId");
CREATE INDEX "ChatAvailabilitySlot_active_startsAt_idx" ON "ChatAvailabilitySlot"("active", "startsAt");
