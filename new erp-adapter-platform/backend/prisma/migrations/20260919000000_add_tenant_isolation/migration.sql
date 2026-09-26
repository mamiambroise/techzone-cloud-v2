-- Add tenant isolation to ERP Adapter schema
-- Safe, additive migration. No data loss.

BEGIN;

-- erp_registry
ALTER TABLE "erp_registry" ADD COLUMN IF NOT EXISTS "tenantId" VARCHAR(100);

-- Backfill existing rows with a deterministic tenant BEFORE enforcing NOT NULL,
-- otherwise ALTER COLUMN ... SET NOT NULL fails on tables that already contain rows.
UPDATE "erp_registry" SET "tenantId" = 'legacy' WHERE "tenantId" IS NULL OR "tenantId" = '';
ALTER TABLE "erp_registry" ALTER COLUMN "tenantId" SET NOT NULL;

-- Replace the old global unique constraint on code with a tenant-scoped one.
ALTER TABLE "erp_registry" DROP CONSTRAINT IF EXISTS "erp_registry_code_key";
CREATE UNIQUE INDEX IF NOT EXISTS "erp_registry_tenantId_code_key" ON "erp_registry" ("tenantId", "code");
CREATE INDEX IF NOT EXISTS "erp_registry_tenantId_idx" ON "erp_registry" ("tenantId");
CREATE INDEX IF NOT EXISTS "erp_registry_tenantId_status_idx" ON "erp_registry" ("tenantId", "status");

-- entity_mapping
ALTER TABLE "entity_mapping" ADD COLUMN IF NOT EXISTS "tenantId" VARCHAR(100);

UPDATE "entity_mapping" SET "tenantId" = 'legacy' WHERE "tenantId" IS NULL OR "tenantId" = '';
ALTER TABLE "entity_mapping" ALTER COLUMN "tenantId" SET NOT NULL;

ALTER TABLE "entity_mapping" DROP CONSTRAINT IF EXISTS "entity_mapping_erpId_entity_key";
CREATE UNIQUE INDEX IF NOT EXISTS "entity_mapping_tenantId_erpId_entity_key" ON "entity_mapping" ("tenantId", "erpId", "entity");
CREATE INDEX IF NOT EXISTS "entity_mapping_tenantId_idx" ON "entity_mapping" ("tenantId");
CREATE INDEX IF NOT EXISTS "entity_mapping_erpId_idx" ON "entity_mapping" ("erpId");

COMMIT;