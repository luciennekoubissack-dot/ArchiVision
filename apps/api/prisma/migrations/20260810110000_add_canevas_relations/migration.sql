-- CreateEnum
CREATE TYPE "ElementKind" AS ENUM ('ARCHIMATE', 'APPLICATION', 'TECH_COMPONENT', 'DATA_ENTITY');

-- CreateTable
CREATE TABLE "CanevasRelation" (
    "id" TEXT NOT NULL,
    "type" "TypeRelation" NOT NULL,
    "sourceKind" "ElementKind" NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetKind" "ElementKind" NOT NULL,
    "targetId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CanevasRelation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CanevasRelation_organisationId_idx" ON "CanevasRelation"("organisationId");

-- CreateIndex
CREATE INDEX "CanevasRelation_sourceKind_sourceId_idx" ON "CanevasRelation"("sourceKind", "sourceId");

-- CreateIndex
CREATE INDEX "CanevasRelation_targetKind_targetId_idx" ON "CanevasRelation"("targetKind", "targetId");

-- AddForeignKey
ALTER TABLE "CanevasRelation" ADD CONSTRAINT "CanevasRelation_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
