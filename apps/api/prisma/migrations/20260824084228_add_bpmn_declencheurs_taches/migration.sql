-- CreateEnum
CREATE TYPE "DeclencheurEvenement" AS ENUM ('MESSAGE', 'MINUTERIE', 'ERREUR', 'SIGNAL', 'CONDITIONNEL', 'TERMINAISON', 'ESCALADE');

-- CreateEnum
CREATE TYPE "TypeTache" AS ENUM ('UTILISATEUR', 'SERVICE', 'MANUELLE', 'ENVOI', 'RECEPTION', 'REGLE_METIER', 'SCRIPT');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TypeBpmn" ADD VALUE 'PASSERELLE_INCLUSIVE';
ALTER TYPE "TypeBpmn" ADD VALUE 'PASSERELLE_EVENEMENTIELLE';
ALTER TYPE "TypeBpmn" ADD VALUE 'SOUS_PROCESSUS';

-- AlterTable
ALTER TABLE "BpmnElement" ADD COLUMN     "declencheur" "DeclencheurEvenement",
ADD COLUMN     "type_tache" "TypeTache";
