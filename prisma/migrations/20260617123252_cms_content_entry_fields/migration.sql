-- AlterTable
ALTER TABLE "ContentEntry" ADD COLUMN     "category" TEXT,
ADD COLUMN     "coverImageUrl" TEXT,
ADD COLUMN     "seoDescription" TEXT,
ADD COLUMN     "seoTitle" TEXT;

-- CreateIndex
CREATE INDEX "ContentEntry_slug_idx" ON "ContentEntry"("slug");
