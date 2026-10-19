ALTER TABLE business_manager."pm_packs"
  ADD COLUMN "applicationId" UUID;

ALTER TABLE ONLY business_manager."pm_packs"
  ADD CONSTRAINT "pm_packs_applicationId_fkey"
  FOREIGN KEY ("applicationId")
  REFERENCES business_manager.applications(id)
  ON UPDATE CASCADE
  ON DELETE RESTRICT;

CREATE INDEX "pm_packs_applicationId_idx"
  ON business_manager."pm_packs"("applicationId");

WITH application_scopes AS (
  SELECT pv."packId", MIN(av."applicationId"::text)::uuid AS "applicationId"
  FROM business_manager."pm_pack_versions" pv
  JOIN business_manager."application_versions" av
    ON av.id = pv."applicationVersionId"
  GROUP BY pv."packId"
  HAVING COUNT(DISTINCT av."applicationId") = 1
)
UPDATE business_manager."pm_packs" p
SET "applicationId" = scopes."applicationId"
FROM application_scopes scopes
WHERE p.id = scopes."packId";
