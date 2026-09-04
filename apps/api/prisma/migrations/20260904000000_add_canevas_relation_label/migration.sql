-- Migration: add_canevas_relation_label
-- Adds the optional `label` column to CanevasRelation, used by the deployment
-- diagram to annotate communication paths with the network link type
-- (e.g. "VPN", "HTTPS", "Fibre").

ALTER TABLE "CanevasRelation" ADD COLUMN "label" TEXT;
