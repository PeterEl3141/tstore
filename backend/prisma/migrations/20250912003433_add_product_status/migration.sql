-- CreateEnum
CREATE TYPE "public"."ProductStatus" AS ENUM ('DRAFT', 'LIVE', 'RETIRED');

-- AlterTable
ALTER TABLE "public"."TShirt" ADD COLUMN     "status" "public"."ProductStatus" NOT NULL DEFAULT 'DRAFT';
