-- Migration: add_objectif_processus_link
-- Table de jointure entre BpmnProcessus et Objectif, permettant de déclarer
-- qu'un processus vise un ou plusieurs objectifs stratégiques. Utilisée par
-- l'Analyse des écarts pour calculer la progression d'un processus vers ses
-- objectifs cibles.

CREATE TABLE "ObjectifProcessus" (
  "processusId" TEXT NOT NULL,
  "objectifId"  TEXT NOT NULL,

  CONSTRAINT "ObjectifProcessus_pkey" PRIMARY KEY ("processusId", "objectifId"),
  CONSTRAINT "ObjectifProcessus_processusId_fkey"
    FOREIGN KEY ("processusId") REFERENCES "BpmnProcessus"("id") ON DELETE CASCADE,
  CONSTRAINT "ObjectifProcessus_objectifId_fkey"
    FOREIGN KEY ("objectifId")  REFERENCES "Objectif"("id")       ON DELETE CASCADE
);

CREATE INDEX "ObjectifProcessus_processusId_idx" ON "ObjectifProcessus"("processusId");
CREATE INDEX "ObjectifProcessus_objectifId_idx"  ON "ObjectifProcessus"("objectifId");
