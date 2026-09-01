-- AlterTable
ALTER TABLE "Objectif" ADD COLUMN     "objectif_as_is_id" TEXT,
ADD COLUMN     "statut" "StatutElement" NOT NULL DEFAULT 'LES_DEUX';

-- CreateIndex
CREATE INDEX "Objectif_objectif_as_is_id_idx" ON "Objectif"("objectif_as_is_id");

-- AddForeignKey
ALTER TABLE "Objectif" ADD CONSTRAINT "Objectif_objectif_as_is_id_fkey" FOREIGN KEY ("objectif_as_is_id") REFERENCES "Objectif"("id") ON DELETE SET NULL ON UPDATE CASCADE;
