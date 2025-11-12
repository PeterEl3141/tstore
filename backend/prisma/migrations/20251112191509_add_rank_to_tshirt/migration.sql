-- AlterTable
ALTER TABLE "public"."TShirt" ADD COLUMN     "rank" INTEGER NOT NULL DEFAULT 1000;

-- CreateIndex
CREATE INDEX "TShirt_rank_createdAt_idx" ON "public"."TShirt"("rank", "createdAt");
