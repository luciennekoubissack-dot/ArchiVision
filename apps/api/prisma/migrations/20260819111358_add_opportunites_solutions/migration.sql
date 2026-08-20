-- CreateEnum
CREATE TYPE "StatutSolution" AS ENUM ('PROPOSEE', 'RETENUE', 'REJETEE');

-- CreateTable
CREATE TABLE "Solution" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "statut" "StatutSolution" NOT NULL DEFAULT 'PROPOSEE',
    "plan_mise_oeuvre" TEXT,
    "organisationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Solution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CritereEvaluation" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "organisationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CritereEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluationScore" (
    "id" TEXT NOT NULL,
    "solutionId" TEXT NOT NULL,
    "critereId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "commentaire" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvaluationScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Solution_organisationId_idx" ON "Solution"("organisationId");

-- CreateIndex
CREATE INDEX "CritereEvaluation_organisationId_idx" ON "CritereEvaluation"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluationScore_solutionId_critereId_key" ON "EvaluationScore"("solutionId", "critereId");

-- AddForeignKey
ALTER TABLE "Solution" ADD CONSTRAINT "Solution_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CritereEvaluation" ADD CONSTRAINT "CritereEvaluation_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationScore" ADD CONSTRAINT "EvaluationScore_solutionId_fkey" FOREIGN KEY ("solutionId") REFERENCES "Solution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationScore" ADD CONSTRAINT "EvaluationScore_critereId_fkey" FOREIGN KEY ("critereId") REFERENCES "CritereEvaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
