-- CreateEnum
CREATE TYPE "TypeElementArchiApplicative" AS ENUM ('APPLICATION', 'UTILISATEUR_INTERNE', 'UTILISATEUR_EXTERNE', 'SYSTEME_EXTERNE', 'BASE_DE_DONNEES', 'INFRASTRUCTURE', 'SECURITE');

-- CreateEnum
CREATE TYPE "TypeFluxArchiApplicative" AS ENUM ('API', 'DONNEES', 'AUTHENTIFICATION', 'RESEAU');

-- CreateTable
CREATE TABLE "ArchiApplicativeElement" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" "TypeElementArchiApplicative" NOT NULL,
    "description" TEXT,
    "position_x" DOUBLE PRECISION,
    "position_y" DOUBLE PRECISION,
    "organisationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArchiApplicativeElement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArchiApplicativeFlux" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "type" "TypeFluxArchiApplicative" NOT NULL DEFAULT 'DONNEES',
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArchiApplicativeFlux_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ArchiApplicativeElement_organisationId_idx" ON "ArchiApplicativeElement"("organisationId");

-- CreateIndex
CREATE INDEX "ArchiApplicativeFlux_sourceId_idx" ON "ArchiApplicativeFlux"("sourceId");

-- CreateIndex
CREATE INDEX "ArchiApplicativeFlux_targetId_idx" ON "ArchiApplicativeFlux"("targetId");

-- AddForeignKey
ALTER TABLE "ArchiApplicativeElement" ADD CONSTRAINT "ArchiApplicativeElement_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchiApplicativeFlux" ADD CONSTRAINT "ArchiApplicativeFlux_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "ArchiApplicativeElement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchiApplicativeFlux" ADD CONSTRAINT "ArchiApplicativeFlux_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "ArchiApplicativeElement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
