-- Preserve historical packs: their application source is unknown, never guessed.
ALTER TABLE business_manager."pm_pack_versions"
  ADD COLUMN "applicationVersionId" UUID;

ALTER TABLE business_manager."pm_pack_versions"
  ADD CONSTRAINT "pm_pack_versions_applicationVersionId_fkey"
  FOREIGN KEY ("applicationVersionId")
  REFERENCES business_manager."application_versions"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "pm_pack_versions_applicationVersionId_idx"
  ON business_manager."pm_pack_versions"("applicationVersionId");
