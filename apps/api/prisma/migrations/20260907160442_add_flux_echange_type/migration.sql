-- Duplicate of 20260907145920_add_flux_echange_type (same enum + column).
-- Made idempotent so production can retry after the failed deploy (P3009).

DO $$ BEGIN
    CREATE TYPE "TypeFluxEchange" AS ENUM ('SYNCHRONE', 'ASYNCHRONE', 'BATCH');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "ApplicationEchange" ADD COLUMN IF NOT EXISTS "typeFlux" "TypeFluxEchange" NOT NULL DEFAULT 'SYNCHRONE';
