-- Enrichissement des prospects : prénom/nom structurés, type de financement,
-- et consentements (email / WhatsApp) au niveau du Lead (et non plus en notes).
ALTER TABLE "Lead" ADD COLUMN "firstName" TEXT;
ALTER TABLE "Lead" ADD COLUMN "lastName" TEXT;
ALTER TABLE "Lead" ADD COLUMN "financingType" TEXT;
ALTER TABLE "Lead" ADD COLUMN "consentEmail" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Lead" ADD COLUMN "consentWhatsapp" BOOLEAN NOT NULL DEFAULT false;
