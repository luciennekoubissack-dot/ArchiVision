-- Étape 2/2 de la simplification des rôles : bascule des comptes existants
-- DIRIGEANT/REPRESENTANT/COLLABORATEUR vers ARCHITECTE, puis recréation de
-- l'enum sans ces 3 valeurs (Postgres ne permet pas de retirer une valeur
-- d'enum directement).
UPDATE "User" SET "role" = 'ARCHITECTE' WHERE "role" IN ('DIRIGEANT', 'REPRESENTANT', 'COLLABORATEUR');

CREATE TYPE "RoleUtilisateur_new" AS ENUM ('SUPERADMIN', 'ADMINISTRATEUR', 'ARCHITECTE');
ALTER TABLE "User" ALTER COLUMN "role" TYPE "RoleUtilisateur_new" USING ("role"::text::"RoleUtilisateur_new");
DROP TYPE "RoleUtilisateur";
ALTER TYPE "RoleUtilisateur_new" RENAME TO "RoleUtilisateur";

-- Canevas ArchiMate : couche Motivation (Vision, Objectif d'architecture,
-- Principe, Exigence), en plus des 5 types métier existants.
ALTER TYPE "TypeElement" ADD VALUE 'VISION';
ALTER TYPE "TypeElement" ADD VALUE 'OBJECTIF_ARCHIMATE';
ALTER TYPE "TypeElement" ADD VALUE 'PRINCIPE';
ALTER TYPE "TypeElement" ADD VALUE 'EXIGENCE';

-- Canevas ArchiMate : taille manuelle des éléments (position_x/position_y
-- existent déjà depuis la migration 20260806124303).
ALTER TABLE "ElementArchimate" ADD COLUMN     "width" DOUBLE PRECISION,
ADD COLUMN     "height" DOUBLE PRECISION;
