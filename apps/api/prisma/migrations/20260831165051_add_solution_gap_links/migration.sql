-- CreateEnum
CREATE TYPE "DomaineEcart" AS ENUM ('OBJECTIF', 'METIER', 'DONNEES', 'APPLICATIF', 'TECHNOLOGIQUE');

-- CreateTable
CREATE TABLE "SolutionGap" (
    "id" TEXT NOT NULL,
    "solutionId" TEXT NOT NULL,
    "domaine" "DomaineEcart" NOT NULL,
    "element_id" TEXT NOT NULL,
    "element_nom" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SolutionGap_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SolutionGap_solutionId_idx" ON "SolutionGap"("solutionId");

-- CreateIndex
CREATE INDEX "SolutionGap_domaine_element_id_idx" ON "SolutionGap"("domaine", "element_id");

-- CreateIndex
CREATE UNIQUE INDEX "SolutionGap_solutionId_domaine_element_id_key" ON "SolutionGap"("solutionId", "domaine", "element_id");

-- AddForeignKey
ALTER TABLE "SolutionGap" ADD CONSTRAINT "SolutionGap_solutionId_fkey" FOREIGN KEY ("solutionId") REFERENCES "Solution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
