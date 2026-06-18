-- Échéances (paiement en plusieurs fois 3x/4x).

-- CreateEnum
CREATE TYPE "InstallmentStatus" AS ENUM ('EN_ATTENTE', 'PAYE', 'EN_RETARD');

-- CreateTable
CREATE TABLE "Installment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "agencyId" TEXT,
    "label" TEXT,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "status" "InstallmentStatus" NOT NULL DEFAULT 'EN_ATTENTE',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Installment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Installment_studentId_idx" ON "Installment"("studentId");
CREATE INDEX "Installment_agencyId_dueDate_idx" ON "Installment"("agencyId", "dueDate");

-- AddForeignKey
ALTER TABLE "Installment" ADD CONSTRAINT "Installment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Installment" ADD CONSTRAINT "Installment_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;
