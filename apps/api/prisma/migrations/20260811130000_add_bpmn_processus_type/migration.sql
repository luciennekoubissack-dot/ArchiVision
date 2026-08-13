-- CreateEnum
CREATE TYPE "TypeProcessus" AS ENUM ('METIER', 'SUPPORT', 'PILOTAGE');

-- AlterTable
ALTER TABLE "BpmnProcessus" ADD COLUMN "type" "TypeProcessus" NOT NULL DEFAULT 'METIER';
