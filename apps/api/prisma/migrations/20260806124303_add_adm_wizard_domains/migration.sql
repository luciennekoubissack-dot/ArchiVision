-- CreateEnum
CREATE TYPE "StatutElement" AS ENUM ('AS_IS', 'TO_BE', 'LES_DEUX');

-- CreateEnum
CREATE TYPE "TypeBpmn" AS ENUM ('EVENEMENT_DEBUT', 'EVENEMENT_FIN', 'EVENEMENT_INTERMEDIAIRE', 'TACHE', 'PASSERELLE_EXCLUSIVE', 'PASSERELLE_PARALLELE');

-- CreateEnum
CREATE TYPE "TypeCardinalite" AS ENUM ('UN_A_UN', 'UN_A_PLUSIEURS', 'PLUSIEURS_A_PLUSIEURS');

-- CreateEnum
CREATE TYPE "TypeTechComponent" AS ENUM ('SERVEUR', 'RESEAU', 'CLOUD', 'BASE_DE_DONNEES', 'MIDDLEWARE');

-- CreateEnum
CREATE TYPE "PrioriteProjet" AS ENUM ('HAUTE', 'MOYENNE', 'BASSE');

-- CreateEnum
CREATE TYPE "StatutProjet" AS ENUM ('PLANIFIE', 'EN_COURS', 'TERMINE');

-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "position_x" DOUBLE PRECISION,
ADD COLUMN     "position_y" DOUBLE PRECISION,
ADD COLUMN     "statut" "StatutElement" NOT NULL DEFAULT 'LES_DEUX';

-- AlterTable
ALTER TABLE "ElementArchimate" ADD COLUMN     "position_x" DOUBLE PRECISION,
ADD COLUMN     "position_y" DOUBLE PRECISION,
ADD COLUMN     "statut" "StatutElement" NOT NULL DEFAULT 'LES_DEUX';

-- AlterTable
ALTER TABLE "Organisation" ADD COLUMN     "problemes_resoudre" TEXT,
ADD COLUMN     "vision" TEXT;

-- CreateTable
CREATE TABLE "ApplicationEchange" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "description" TEXT,
    "protocole" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationEchange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartiePrenante" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "role" TEXT,
    "organisationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartiePrenante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BpmnProcessus" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "bpmn_xml" TEXT,
    "organisationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BpmnProcessus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BpmnElement" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" "TypeBpmn" NOT NULL,
    "statut" "StatutElement" NOT NULL DEFAULT 'LES_DEUX',
    "position_x" DOUBLE PRECISION,
    "position_y" DOUBLE PRECISION,
    "processusId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BpmnElement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BpmnFlow" (
    "id" TEXT NOT NULL,
    "label" TEXT,
    "sourceId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,

    CONSTRAINT "BpmnFlow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataEntity" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "statut" "StatutElement" NOT NULL DEFAULT 'LES_DEUX',
    "position_x" DOUBLE PRECISION,
    "position_y" DOUBLE PRECISION,
    "organisationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataEntity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataAttribute" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,

    CONSTRAINT "DataAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataRelation" (
    "id" TEXT NOT NULL,
    "cardinalite" "TypeCardinalite" NOT NULL,
    "label" TEXT,
    "sourceId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,

    CONSTRAINT "DataRelation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechComponent" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" "TypeTechComponent" NOT NULL,
    "description" TEXT,
    "statut" "StatutElement" NOT NULL DEFAULT 'LES_DEUX',
    "position_x" DOUBLE PRECISION,
    "position_y" DOUBLE PRECISION,
    "organisationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TechComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechDeploiement" (
    "applicationId" TEXT NOT NULL,
    "techComponentId" TEXT NOT NULL,

    CONSTRAINT "TechDeploiement_pkey" PRIMARY KEY ("applicationId","techComponentId")
);

-- CreateTable
CREATE TABLE "SequenceDiagramme" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SequenceDiagramme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SequenceParticipant" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL,
    "diagrammeId" TEXT NOT NULL,

    CONSTRAINT "SequenceParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SequenceMessage" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL,
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,

    CONSTRAINT "SequenceMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Projet" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "priorite" "PrioriteProjet" NOT NULL DEFAULT 'MOYENNE',
    "cout_estime" TEXT,
    "date_debut" TIMESTAMP(3),
    "date_fin" TIMESTAMP(3),
    "statut" "StatutProjet" NOT NULL DEFAULT 'PLANIFIE',
    "organisationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Projet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApplicationEchange_sourceId_idx" ON "ApplicationEchange"("sourceId");

-- CreateIndex
CREATE INDEX "ApplicationEchange_targetId_idx" ON "ApplicationEchange"("targetId");

-- CreateIndex
CREATE INDEX "PartiePrenante_organisationId_idx" ON "PartiePrenante"("organisationId");

-- CreateIndex
CREATE INDEX "BpmnProcessus_organisationId_idx" ON "BpmnProcessus"("organisationId");

-- CreateIndex
CREATE INDEX "BpmnElement_processusId_idx" ON "BpmnElement"("processusId");

-- CreateIndex
CREATE INDEX "BpmnFlow_sourceId_idx" ON "BpmnFlow"("sourceId");

-- CreateIndex
CREATE INDEX "BpmnFlow_targetId_idx" ON "BpmnFlow"("targetId");

-- CreateIndex
CREATE INDEX "DataEntity_organisationId_idx" ON "DataEntity"("organisationId");

-- CreateIndex
CREATE INDEX "DataAttribute_entityId_idx" ON "DataAttribute"("entityId");

-- CreateIndex
CREATE INDEX "DataRelation_sourceId_idx" ON "DataRelation"("sourceId");

-- CreateIndex
CREATE INDEX "DataRelation_targetId_idx" ON "DataRelation"("targetId");

-- CreateIndex
CREATE INDEX "TechComponent_organisationId_idx" ON "TechComponent"("organisationId");

-- CreateIndex
CREATE INDEX "SequenceDiagramme_organisationId_idx" ON "SequenceDiagramme"("organisationId");

-- CreateIndex
CREATE INDEX "SequenceParticipant_diagrammeId_idx" ON "SequenceParticipant"("diagrammeId");

-- CreateIndex
CREATE INDEX "SequenceMessage_fromId_idx" ON "SequenceMessage"("fromId");

-- CreateIndex
CREATE INDEX "SequenceMessage_toId_idx" ON "SequenceMessage"("toId");

-- CreateIndex
CREATE INDEX "Projet_organisationId_idx" ON "Projet"("organisationId");

-- AddForeignKey
ALTER TABLE "ApplicationEchange" ADD CONSTRAINT "ApplicationEchange_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationEchange" ADD CONSTRAINT "ApplicationEchange_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartiePrenante" ADD CONSTRAINT "PartiePrenante_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BpmnProcessus" ADD CONSTRAINT "BpmnProcessus_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BpmnElement" ADD CONSTRAINT "BpmnElement_processusId_fkey" FOREIGN KEY ("processusId") REFERENCES "BpmnProcessus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BpmnFlow" ADD CONSTRAINT "BpmnFlow_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "BpmnElement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BpmnFlow" ADD CONSTRAINT "BpmnFlow_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "BpmnElement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataEntity" ADD CONSTRAINT "DataEntity_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataAttribute" ADD CONSTRAINT "DataAttribute_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "DataEntity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataRelation" ADD CONSTRAINT "DataRelation_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "DataEntity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataRelation" ADD CONSTRAINT "DataRelation_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "DataEntity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechComponent" ADD CONSTRAINT "TechComponent_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechDeploiement" ADD CONSTRAINT "TechDeploiement_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechDeploiement" ADD CONSTRAINT "TechDeploiement_techComponentId_fkey" FOREIGN KEY ("techComponentId") REFERENCES "TechComponent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SequenceDiagramme" ADD CONSTRAINT "SequenceDiagramme_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SequenceParticipant" ADD CONSTRAINT "SequenceParticipant_diagrammeId_fkey" FOREIGN KEY ("diagrammeId") REFERENCES "SequenceDiagramme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SequenceMessage" ADD CONSTRAINT "SequenceMessage_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "SequenceParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SequenceMessage" ADD CONSTRAINT "SequenceMessage_toId_fkey" FOREIGN KEY ("toId") REFERENCES "SequenceParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Projet" ADD CONSTRAINT "Projet_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
