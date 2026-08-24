-- CreateEnum
CREATE TYPE "CategorieExigence" AS ENUM ('FONCTIONNELLE', 'NON_FONCTIONNELLE');

-- AlterTable
ALTER TABLE "ElementArchimate" ADD COLUMN     "categorie_exigence" "CategorieExigence";
