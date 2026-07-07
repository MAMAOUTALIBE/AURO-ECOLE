-- Espace partenaire (prescripteur / apporteur d'affaires) piloté par le CRM.
-- Nouveau rôle PARTENAIRE, tables Partner (barème de commission inclus) et
-- PartnerCommission, plus l'attribution partnerId sur Lead (colonne optionnelle,
-- aucun impact sur les leads existants).

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'PARTENAIRE' BEFORE 'VISITEUR';

-- CreateEnum
CREATE TYPE "PartnerType" AS ENUM ('PRESCRIPTEUR');

-- CreateEnum
CREATE TYPE "PartnerStatus" AS ENUM ('ACTIF', 'SUSPENDU');

-- CreateEnum
CREATE TYPE "CommissionType" AS ENUM ('FLAT', 'PERCENT');

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('ESTIMEE', 'VALIDEE', 'PAYEE', 'ANNULEE');

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN "partnerId" TEXT;

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "companyName" TEXT NOT NULL,
    "type" "PartnerType" NOT NULL DEFAULT 'PRESCRIPTEUR',
    "status" "PartnerStatus" NOT NULL DEFAULT 'ACTIF',
    "contactName" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "commissionType" "CommissionType" NOT NULL DEFAULT 'FLAT',
    "commissionValue" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "agencyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerCommission" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "leadId" TEXT,
    "studentId" TEXT,
    "amount" INTEGER NOT NULL,
    "status" "CommissionStatus" NOT NULL DEFAULT 'ESTIMEE',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PartnerCommission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Partner_userId_key" ON "Partner"("userId");
CREATE INDEX "Partner_status_idx" ON "Partner"("status");
CREATE INDEX "Partner_email_idx" ON "Partner"("email");
CREATE INDEX "Partner_agencyId_idx" ON "Partner"("agencyId");

-- CreateIndex
CREATE INDEX "PartnerCommission_partnerId_status_idx" ON "PartnerCommission"("partnerId", "status");

-- CreateIndex
CREATE INDEX "Lead_partnerId_idx" ON "Lead"("partnerId");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Partner" ADD CONSTRAINT "Partner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Partner" ADD CONSTRAINT "Partner_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerCommission" ADD CONSTRAINT "PartnerCommission_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
