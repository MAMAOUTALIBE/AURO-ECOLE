-- Module Contrats : statut, table Contract (corps texte + prix, snapshots figés à l'activation)
-- + compteur séquentiel par année (numérotation CTR-AAAA-NNNNNN sans rupture).

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('BROUILLON', 'ACTIF', 'RESILIE', 'TERMINE');

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "number" TEXT,
    "status" "ContractStatus" NOT NULL DEFAULT 'BROUILLON',
    "clientUserId" TEXT NOT NULL,
    "studentId" TEXT,
    "formationId" TEXT,
    "agencyId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "totalCents" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "issuerSnapshot" JSONB,
    "clientSnapshot" JSONB,
    "signedAt" TIMESTAMP(3),
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractCounter" (
    "year" INTEGER NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ContractCounter_pkey" PRIMARY KEY ("year")
);

-- CreateIndex
CREATE UNIQUE INDEX "Contract_number_key" ON "Contract"("number");
CREATE INDEX "Contract_agencyId_signedAt_idx" ON "Contract"("agencyId", "signedAt");
CREATE INDEX "Contract_clientUserId_idx" ON "Contract"("clientUserId");

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_clientUserId_fkey" FOREIGN KEY ("clientUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;
