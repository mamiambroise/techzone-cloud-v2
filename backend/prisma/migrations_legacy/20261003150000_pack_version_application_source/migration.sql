-- Pack versions created before this migration remain explicitly unlinked.
-- New pack versions must provide a tenant-validated application version.
ALTER TABLE "pm_pack_versions" ADD COLUMN "applicationVersionId" UUID;

ALTER TABLE "pm_pack_versions"
  ADD CONSTRAINT "pm_pack_versions_applicationVersionId_fkey"
  FOREIGN KEY ("applicationVersionId") REFERENCES "application_versions"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "pm_pack_versions_applicationVersionId_idx"
  ON "pm_pack_versions"("applicationVersionId");
