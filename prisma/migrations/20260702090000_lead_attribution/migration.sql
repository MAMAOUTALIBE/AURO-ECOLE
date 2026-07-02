-- Attribution marketing des prospects : provenance capturée côté front (first-touch)
-- et transmise avec les formulaires (inscription, RDV chatbot…). Colonnes optionnelles :
-- aucun impact sur les leads existants.
ALTER TABLE "Lead" ADD COLUMN "utmSource" TEXT;
ALTER TABLE "Lead" ADD COLUMN "utmMedium" TEXT;
ALTER TABLE "Lead" ADD COLUMN "utmCampaign" TEXT;
ALTER TABLE "Lead" ADD COLUMN "referrer" TEXT;
ALTER TABLE "Lead" ADD COLUMN "landingPage" TEXT;
