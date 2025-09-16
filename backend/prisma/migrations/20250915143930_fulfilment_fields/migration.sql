-- AlterTable
ALTER TABLE "public"."Order" ADD COLUMN     "carrier" TEXT,
ADD COLUMN     "gelatoStatus" TEXT,
ADD COLUMN     "lastFulfillCheckAt" TIMESTAMP(3),
ADD COLUMN     "lastFulfillError" TEXT,
ADD COLUMN     "shippedAt" TIMESTAMP(3),
ADD COLUMN     "trackingNumber" TEXT,
ADD COLUMN     "trackingUrl" TEXT;
