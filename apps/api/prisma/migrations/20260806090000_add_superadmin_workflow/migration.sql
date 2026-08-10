-- Renommage sûr d'une valeur d'enum (préserve les lignes existantes, contrairement
-- au diff automatique de Prisma qui tenterait de DROP/CREATE le type).
ALTER TYPE "RoleUtilisateur" RENAME VALUE 'ARCHITECTE' TO 'ADMINISTRATEUR';
-- Ajout additif, sans risque pour les lignes existantes.
ALTER TYPE "RoleUtilisateur" ADD VALUE 'SUPERADMIN';

-- Le superadmin n'est rattaché à aucune organisation.
ALTER TABLE "User" ALTER COLUMN "organisationId" DROP NOT NULL;

-- Workflow d'approbation des organisations.
CREATE TYPE "StatutOrganisation" AS ENUM ('EN_ATTENTE', 'VALIDEE', 'REJETEE');
ALTER TABLE "Organisation" ADD COLUMN "statut" "StatutOrganisation" NOT NULL DEFAULT 'EN_ATTENTE';
ALTER TABLE "Organisation" ADD COLUMN "validated_at" TIMESTAMP(3);

-- Rétrocompatibilité : les organisations déjà en base (seed + organisations de test créées
-- pendant le développement) doivent rester utilisables après cette migration.
UPDATE "Organisation" SET "statut" = 'VALIDEE', "validated_at" = now();
