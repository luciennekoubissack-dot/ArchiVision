-- CreateEnum
CREATE TYPE "StatutConformite" AS ENUM ('CONFORME', 'NON_CONFORME', 'A_EVALUER');

-- CreateEnum
CREATE TYPE "StatutChangement" AS ENUM ('PROPOSE', 'APPROUVE', 'REJETE', 'IMPLEMENTE');

-- CreateTable
CREATE TABLE "PolitiqueGouvernance" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "organisationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PolitiqueGouvernance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConformiteSolution" (
    "id" TEXT NOT NULL,
    "solutionId" TEXT NOT NULL,
    "politiqueId" TEXT NOT NULL,
    "statut" "StatutConformite" NOT NULL DEFAULT 'A_EVALUER',
    "commentaire" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConformiteSolution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemandeChangement" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "statut" "StatutChangement" NOT NULL DEFAULT 'PROPOSE',
    "organisationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DemandeChangement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnqueteReponse" (
    "id" TEXT NOT NULL,
    "repondant" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "commentaire" TEXT,
    "organisationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnqueteReponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PolitiqueGouvernance_organisationId_idx" ON "PolitiqueGouvernance"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "ConformiteSolution_solutionId_politiqueId_key" ON "ConformiteSolution"("solutionId", "politiqueId");

-- CreateIndex
CREATE INDEX "DemandeChangement_organisationId_idx" ON "DemandeChangement"("organisationId");

-- CreateIndex
CREATE INDEX "EnqueteReponse_organisationId_idx" ON "EnqueteReponse"("organisationId");

-- AddForeignKey
ALTER TABLE "PolitiqueGouvernance" ADD CONSTRAINT "PolitiqueGouvernance_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConformiteSolution" ADD CONSTRAINT "ConformiteSolution_solutionId_fkey" FOREIGN KEY ("solutionId") REFERENCES "Solution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConformiteSolution" ADD CONSTRAINT "ConformiteSolution_politiqueId_fkey" FOREIGN KEY ("politiqueId") REFERENCES "PolitiqueGouvernance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemandeChangement" ADD CONSTRAINT "DemandeChangement_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnqueteReponse" ADD CONSTRAINT "EnqueteReponse_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
