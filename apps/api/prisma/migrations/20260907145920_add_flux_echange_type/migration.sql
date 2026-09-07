-- CreateEnum
CREATE TYPE "TypeFluxEchange" AS ENUM ('SYNCHRONE', 'ASYNCHRONE', 'BATCH');

-- AlterTable
ALTER TABLE "ApplicationEchange" ADD COLUMN     "typeFlux" "TypeFluxEchange" NOT NULL DEFAULT 'SYNCHRONE';
