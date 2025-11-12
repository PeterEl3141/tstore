-- AlterTable
ALTER TABLE "public"."Review" ADD COLUMN     "authorEmail" TEXT;

-- CreateIndex
CREATE INDEX "Review_authorEmail_idx" ON "public"."Review"("authorEmail");
