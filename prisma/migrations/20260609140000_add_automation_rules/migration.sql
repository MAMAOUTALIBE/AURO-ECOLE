-- Module Automatisations : règles « déclencheur -> action », activables, avec compteur d'exécutions.

-- CreateEnum
CREATE TYPE "AutomationTrigger" AS ENUM ('LEAD_CREATED', 'STUDENT_CREATED');
CREATE TYPE "AutomationAction" AS ENUM ('SEND_WELCOME_EMAIL', 'NOTIFY_TEAM', 'LOG');

-- CreateTable
CREATE TABLE "AutomationRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trigger" "AutomationTrigger" NOT NULL,
    "action" "AutomationAction" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "agencyId" TEXT,
    "runCount" INTEGER NOT NULL DEFAULT 0,
    "lastRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AutomationRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AutomationRule_trigger_active_idx" ON "AutomationRule"("trigger", "active");
