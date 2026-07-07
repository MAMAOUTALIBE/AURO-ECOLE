-- Attribution partenaire propagée à l'inscription : quand un lead apporté par un
-- prescripteur est converti en élève, l'élève est rattaché au partenaire (suivi des
-- apprenants + commissions). Colonne optionnelle, sans impact sur les élèves existants.

-- AlterTable
ALTER TABLE "Student" ADD COLUMN "partnerId" TEXT;

-- CreateIndex
CREATE INDEX "Student_partnerId_idx" ON "Student"("partnerId");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;
