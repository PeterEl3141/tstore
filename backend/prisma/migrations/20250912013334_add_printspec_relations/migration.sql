/*
  Warnings:

  - A unique constraint covering the columns `[currentSpecId]` on the table `TShirt` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."TShirt" ADD COLUMN     "currentSpecId" TEXT;

-- CreateTable
CREATE TABLE "public"."PrintSpec" (
    "id" TEXT NOT NULL,
    "tshirtId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "frontFileUrl" TEXT,
    "backFileUrl" TEXT,
    "dpi" INTEGER,
    "colors" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrintSpec_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PrintVariant" (
    "id" TEXT NOT NULL,
    "specId" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "productUid" TEXT NOT NULL,

    CONSTRAINT "PrintVariant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PrintSpec_tshirtId_version_key" ON "public"."PrintSpec"("tshirtId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "PrintVariant_specId_size_color_key" ON "public"."PrintVariant"("specId", "size", "color");

-- CreateIndex
CREATE UNIQUE INDEX "TShirt_currentSpecId_key" ON "public"."TShirt"("currentSpecId");

-- AddForeignKey
ALTER TABLE "public"."TShirt" ADD CONSTRAINT "TShirt_currentSpecId_fkey" FOREIGN KEY ("currentSpecId") REFERENCES "public"."PrintSpec"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PrintSpec" ADD CONSTRAINT "PrintSpec_tshirtId_fkey" FOREIGN KEY ("tshirtId") REFERENCES "public"."TShirt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PrintVariant" ADD CONSTRAINT "PrintVariant_specId_fkey" FOREIGN KEY ("specId") REFERENCES "public"."PrintSpec"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
