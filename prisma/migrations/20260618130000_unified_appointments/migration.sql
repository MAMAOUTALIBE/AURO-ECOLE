-- Rendez-vous unifié : promotion de ChatAppointment en SOURCE UNIQUE DE VÉRITÉ pour tous
-- les rendez-vous (chatbot, manuel, téléphone, whatsapp, crm). Extension additive : on
-- conserve la table et les données, on ajoute les champs opérationnels + FK scalaires.

-- Champs opérationnels.
ALTER TABLE "ChatAppointment" ADD COLUMN "notes" TEXT;
ALTER TABLE "ChatAppointment" ADD COLUMN "requestedAt" TIMESTAMP(3);
ALTER TABLE "ChatAppointment" ADD COLUMN "priority" TEXT NOT NULL DEFAULT 'normal';

-- FK scalaires (libellés résolus côté API/CRM depuis les listes existantes).
ALTER TABLE "ChatAppointment" ADD COLUMN "studentId" TEXT;
ALTER TABLE "ChatAppointment" ADD COLUMN "formationId" TEXT;
ALTER TABLE "ChatAppointment" ADD COLUMN "instructorId" TEXT;
ALTER TABLE "ChatAppointment" ADD COLUMN "vehicleId" TEXT;
ALTER TABLE "ChatAppointment" ADD COLUMN "agencyId" TEXT;
ALTER TABLE "ChatAppointment" ADD COLUMN "createdById" TEXT;
ALTER TABLE "ChatAppointment" ADD COLUMN "updatedById" TEXT;

-- Nouveau défaut de statut (vocabulaire canonique anglais lowercase).
ALTER TABLE "ChatAppointment" ALTER COLUMN "status" SET DEFAULT 'pending_confirmation';

-- Normalisation des valeurs existantes (FR héritées du chatbot -> vocabulaire canonique).
UPDATE "ChatAppointment" SET "status" = 'pending_confirmation' WHERE "status" = 'A_CONFIRMER';
UPDATE "ChatAppointment" SET "status" = 'confirmed'            WHERE "status" = 'CONFIRME';
UPDATE "ChatAppointment" SET "status" = 'completed'            WHERE "status" = 'TRAITE';
UPDATE "ChatAppointment" SET "status" = 'cancelled'           WHERE "status" = 'ANNULE';
UPDATE "ChatAppointment" SET "type"   = 'call'                 WHERE "type"   = 'APPEL';
UPDATE "ChatAppointment" SET "type"   = 'agency'               WHERE "type"   = 'AGENCE';
UPDATE "ChatAppointment" SET "type"   = 'video'                WHERE "type"   = 'VISIO';
UPDATE "ChatAppointment" SET "type"   = 'quote'                WHERE "type"   = 'DEVIS';
UPDATE "ChatAppointment" SET "type"   = 'registration'         WHERE "type"   = 'INSCRIPTION';

-- Index opérationnels (cockpit RDV : filtres par source/statut, calendrier par agence/moniteur).
CREATE INDEX "ChatAppointment_source_status_idx" ON "ChatAppointment"("source", "status");
CREATE INDEX "ChatAppointment_agencyId_startsAt_idx" ON "ChatAppointment"("agencyId", "startsAt");
CREATE INDEX "ChatAppointment_instructorId_startsAt_idx" ON "ChatAppointment"("instructorId", "startsAt");
