-- CreateEnum
CREATE TYPE "public"."Category" AS ENUM ('GRAPHIC', 'BASICS', 'VINTAGE', 'LIMITED');

-- CreateTable
CREATE TABLE "public"."TShirt" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "images" TEXT[],
    "colorOptions" TEXT[],
    "sizeOptions" TEXT[],
    "category" "public"."Category" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TShirt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Review" (
    "id" TEXT NOT NULL,
    "tshirtId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "authorName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TShirt_slug_key" ON "public"."TShirt"("slug");

-- CreateIndex
CREATE INDEX "TShirt_category_idx" ON "public"."TShirt"("category");

-- CreateIndex
CREATE INDEX "TShirt_name_idx" ON "public"."TShirt"("name");

-- CreateIndex
CREATE INDEX "Review_tshirtId_idx" ON "public"."Review"("tshirtId");

-- CreateIndex
CREATE INDEX "Review_rating_idx" ON "public"."Review"("rating");

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_tshirtId_fkey" FOREIGN KEY ("tshirtId") REFERENCES "public"."TShirt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
