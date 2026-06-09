-- Module Devis : statut, table Quote (lignes JSON, snapshots figés à l'envoi) + compteur
-- séquentiel par année (numérotation DEV-AAAA-NNNNNN sans rupture).

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('BROUILLON', 'ENVOYE', 'ACCEPTE', 'REFUSE', 'EXPIRE');

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "number" TEXT,
    "status" "QuoteStatus" NOT NULL DEFAULT 'BROUILLON',
    "clientUserId" TEXT NOT NULL,
    "studentId" TEXT,
    "agencyId" TEXT,
    "lines" JSONB NOT NULL,
    "subtotalCents" INTEGER NOT NULL,
    "vatCents" INTEGER NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "issuerSnapshot" JSONB,
    "clientSnapshot" JSONB,
    "sentAt" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "decidedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteCounter" (
    "year" INTEGER NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "QuoteCounter_pkey" PRIMARY KEY ("year")
);

-- CreateIndex
CREATE UNIQUE INDEX "Quote_number_key" ON "Quote"("number");
CREATE INDEX "Quote_agencyId_sentAt_idx" ON "Quote"("agencyId", "sentAt");
CREATE INDEX "Quote_clientUserId_idx" ON "Quote"("clientUserId");

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_clientUserId_fkey" FOREIGN KEY ("clientUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;
