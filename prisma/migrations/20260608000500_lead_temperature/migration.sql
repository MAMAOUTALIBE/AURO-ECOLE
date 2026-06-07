-- Qualification automatique des prospects (chaud/tiède/froid + score).
ALTER TABLE "Lead" ADD COLUMN "temperature" TEXT;
ALTER TABLE "Lead" ADD COLUMN "score" INTEGER;
