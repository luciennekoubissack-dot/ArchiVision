-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "titulaire_id" TEXT;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_titulaire_id_fkey" FOREIGN KEY ("titulaire_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
