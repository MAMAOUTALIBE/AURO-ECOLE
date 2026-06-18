-- Examens (code/conduite) + résultats pour le taux de réussite.

-- CreateEnum
CREATE TYPE "ExamType" AS ENUM ('CODE', 'CONDUITE');
CREATE TYPE "ExamResult" AS ENUM ('EN_ATTENTE', 'REUSSI', 'ECHOUE', 'ABSENT');

-- CreateTable
CREATE TABLE "Exam" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "agencyId" TEXT,
    "type" "ExamType" NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "center" TEXT,
    "result" "ExamResult" NOT NULL DEFAULT 'EN_ATTENTE',
    "score" INTEGER,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Exam_agencyId_scheduledAt_idx" ON "Exam"("agencyId", "scheduledAt");
CREATE INDEX "Exam_studentId_idx" ON "Exam"("studentId");

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;
