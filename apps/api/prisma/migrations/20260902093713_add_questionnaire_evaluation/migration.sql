-- CreateEnum
CREATE TYPE "TypeQuestion" AS ENUM ('OUI_NON', 'CHOIX_MULTIPLE', 'NOTE_MAX', 'REPONSE_OUVERTE', 'SUGGESTION');

-- CreateTable
CREATE TABLE "Questionnaire" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "reponse_fichier_url" TEXT,
    "reponse_fichier_nom" TEXT,
    "organisationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Questionnaire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "intitule" TEXT NOT NULL,
    "type" "TypeQuestion" NOT NULL,
    "options" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "note_max" INTEGER,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "questionnaireId" TEXT NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Questionnaire_organisationId_idx" ON "Questionnaire"("organisationId");

-- CreateIndex
CREATE INDEX "Question_questionnaireId_idx" ON "Question"("questionnaireId");

-- AddForeignKey
ALTER TABLE "Questionnaire" ADD CONSTRAINT "Questionnaire_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_questionnaireId_fkey" FOREIGN KEY ("questionnaireId") REFERENCES "Questionnaire"("id") ON DELETE CASCADE ON UPDATE CASCADE;
