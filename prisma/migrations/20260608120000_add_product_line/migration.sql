-- Ajoute le pôle métier (auto-école / VTC / CACES) aux formations.
-- Les lignes existantes basculent par défaut sur AUTO_ECOLE.

-- CreateEnum
CREATE TYPE "ProductLine" AS ENUM ('AUTO_ECOLE', 'VTC', 'CACES');

-- AlterTable
ALTER TABLE "Formation" ADD COLUMN "productLine" "ProductLine" NOT NULL DEFAULT 'AUTO_ECOLE';
