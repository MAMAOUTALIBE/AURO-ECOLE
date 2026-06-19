-- État civil & gestion auto-école structurés sur l'élève (style Kréno2) :
-- titre, nom de naissance, date/lieu de naissance, NEPH, filière, financement, date d'inscription.
ALTER TABLE "Student" ADD COLUMN "civility" TEXT;
ALTER TABLE "Student" ADD COLUMN "birthName" TEXT;
ALTER TABLE "Student" ADD COLUMN "birthDate" TIMESTAMP(3);
ALTER TABLE "Student" ADD COLUMN "birthPlace" TEXT;
ALTER TABLE "Student" ADD COLUMN "neph" TEXT;
ALTER TABLE "Student" ADD COLUMN "filiere" TEXT;
ALTER TABLE "Student" ADD COLUMN "financingType" TEXT;
ALTER TABLE "Student" ADD COLUMN "registeredAt" TIMESTAMP(3);
