-- CreateEnum
CREATE TYPE "AvancementSolution" AS ENUM ('NON_DEMARRE', 'EN_COURS', 'TERMINE', 'BLOQUE');

-- AlterTable
ALTER TABLE "Solution" ADD COLUMN     "avancement" "AvancementSolution" NOT NULL DEFAULT 'NON_DEMARRE',
ADD COLUMN     "commentaire_suivi" TEXT;
