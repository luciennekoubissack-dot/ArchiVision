-- Add explicit AS-IS -> TO-BE links for non-objective architecture domains.
ALTER TABLE "ElementArchimate" ADD COLUMN "as_is_id" TEXT;
ALTER TABLE "Application" ADD COLUMN "as_is_id" TEXT;
ALTER TABLE "DataEntity" ADD COLUMN "as_is_id" TEXT;
ALTER TABLE "TechComponent" ADD COLUMN "as_is_id" TEXT;

CREATE INDEX "ElementArchimate_as_is_id_idx" ON "ElementArchimate"("as_is_id");
CREATE INDEX "Application_as_is_id_idx" ON "Application"("as_is_id");
CREATE INDEX "DataEntity_as_is_id_idx" ON "DataEntity"("as_is_id");
CREATE INDEX "TechComponent_as_is_id_idx" ON "TechComponent"("as_is_id");

ALTER TABLE "ElementArchimate"
  ADD CONSTRAINT "ElementArchimate_as_is_id_fkey"
  FOREIGN KEY ("as_is_id") REFERENCES "ElementArchimate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Application"
  ADD CONSTRAINT "Application_as_is_id_fkey"
  FOREIGN KEY ("as_is_id") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DataEntity"
  ADD CONSTRAINT "DataEntity_as_is_id_fkey"
  FOREIGN KEY ("as_is_id") REFERENCES "DataEntity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TechComponent"
  ADD CONSTRAINT "TechComponent_as_is_id_fkey"
  FOREIGN KEY ("as_is_id") REFERENCES "TechComponent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
