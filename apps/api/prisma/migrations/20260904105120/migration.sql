-- DropForeignKey
ALTER TABLE "ObjectifProcessus" DROP CONSTRAINT "ObjectifProcessus_objectifId_fkey";

-- DropForeignKey
ALTER TABLE "ObjectifProcessus" DROP CONSTRAINT "ObjectifProcessus_processusId_fkey";

-- AddForeignKey
ALTER TABLE "ObjectifProcessus" ADD CONSTRAINT "ObjectifProcessus_processusId_fkey" FOREIGN KEY ("processusId") REFERENCES "BpmnProcessus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObjectifProcessus" ADD CONSTRAINT "ObjectifProcessus_objectifId_fkey" FOREIGN KEY ("objectifId") REFERENCES "Objectif"("id") ON DELETE CASCADE ON UPDATE CASCADE;
