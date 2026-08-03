-- CreateEnum
CREATE TYPE "TypeElement" AS ENUM ('ACTEUR_METIER', 'ROLE_METIER', 'PROCESSUS_METIER', 'SERVICE_METIER', 'OBJET_METIER');

-- CreateEnum
CREATE TYPE "TypeRelation" AS ENUM ('ASSIGNATION', 'COMPOSITION', 'REALISATION', 'ASSOCIATION');

-- CreateEnum
CREATE TYPE "Criticite" AS ENUM ('HAUTE', 'MOYENNE', 'BASSE');

-- CreateEnum
CREATE TYPE "TypeZone" AS ENUM ('ZONE', 'QUARTIER', 'ILOT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organisation" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organisation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CapaciteMetier" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "organisationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CapaciteMetier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElementArchimate" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" "TypeElement" NOT NULL,
    "description" TEXT,
    "organisationId" TEXT NOT NULL,
    "capaciteMetierId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ElementArchimate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RelationArchimate" (
    "id" TEXT NOT NULL,
    "type" "TypeRelation" NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RelationArchimate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "criticite" "Criticite" NOT NULL DEFAULT 'MOYENNE',
    "organisationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ZoneUrbanisation" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" "TypeZone" NOT NULL,
    "parentId" TEXT,
    "organisationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ZoneUrbanisation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationZone" (
    "applicationId" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,

    CONSTRAINT "ApplicationZone_pkey" PRIMARY KEY ("applicationId","zoneId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "ElementArchimate_organisationId_idx" ON "ElementArchimate"("organisationId");

-- CreateIndex
CREATE INDEX "ElementArchimate_type_idx" ON "ElementArchimate"("type");

-- CreateIndex
CREATE INDEX "RelationArchimate_sourceId_idx" ON "RelationArchimate"("sourceId");

-- CreateIndex
CREATE INDEX "RelationArchimate_targetId_idx" ON "RelationArchimate"("targetId");

-- CreateIndex
CREATE INDEX "Application_organisationId_idx" ON "Application"("organisationId");

-- CreateIndex
CREATE INDEX "ZoneUrbanisation_organisationId_idx" ON "ZoneUrbanisation"("organisationId");

-- CreateIndex
CREATE INDEX "ZoneUrbanisation_parentId_idx" ON "ZoneUrbanisation"("parentId");

-- AddForeignKey
ALTER TABLE "CapaciteMetier" ADD CONSTRAINT "CapaciteMetier_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElementArchimate" ADD CONSTRAINT "ElementArchimate_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElementArchimate" ADD CONSTRAINT "ElementArchimate_capaciteMetierId_fkey" FOREIGN KEY ("capaciteMetierId") REFERENCES "CapaciteMetier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelationArchimate" ADD CONSTRAINT "RelationArchimate_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "ElementArchimate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelationArchimate" ADD CONSTRAINT "RelationArchimate_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "ElementArchimate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZoneUrbanisation" ADD CONSTRAINT "ZoneUrbanisation_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ZoneUrbanisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZoneUrbanisation" ADD CONSTRAINT "ZoneUrbanisation_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationZone" ADD CONSTRAINT "ApplicationZone_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationZone" ADD CONSTRAINT "ApplicationZone_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "ZoneUrbanisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
