-- CreateEnum
CREATE TYPE "TaxMode" AS ENUM ('TTC', 'HT');

-- CreateEnum
CREATE TYPE "CpfStatus" AS ENUM ('NON_RENSEIGNE', 'NON_ELIGIBLE', 'POSSIBLE', 'A_CONFIRMER', 'ELIGIBLE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ProductLine" ADD VALUE 'SST';
ALTER TYPE "ProductLine" ADD VALUE 'LOGISTIQUE_SECURITE';

-- AlterTable
ALTER TABLE "Formation" ADD COLUMN     "cpfStatus" "CpfStatus" NOT NULL DEFAULT 'NON_RENSEIGNE',
ADD COLUMN     "internalPriceCents" INTEGER,
ADD COLUMN     "quoteOnly" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "subtitle" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "taxMode" "TaxMode" NOT NULL DEFAULT 'TTC';
