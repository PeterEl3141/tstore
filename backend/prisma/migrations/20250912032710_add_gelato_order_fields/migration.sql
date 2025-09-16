/*
  Warnings:

  - A unique constraint covering the columns `[gelatoOrderId]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Order" ADD COLUMN     "gelatoOrderId" TEXT,
ADD COLUMN     "submittedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Order_gelatoOrderId_key" ON "public"."Order"("gelatoOrderId");
