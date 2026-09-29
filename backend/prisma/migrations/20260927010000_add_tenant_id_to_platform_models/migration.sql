-- Add tenant_id to platform models for tenant isolation
-- Safe, additive migration. No data loss.
-- Reason: Platform models (Application, ApplicationVersion, Environment, Contract,
--   Configuration, Snapshot, Release, Deployment, EnvironmentDeployment, DeploymentHistory)
--   lack tenantId. The TenantGuard cannot enforce tenant scoping without it.
-- Data impact: Existing rows are backfilled with 'legacy' tenantId so the
--   column is NOT NULL and the guard can evaluate. SuperAdmin/legacy access
--   is handled in application code.
-- Rollback: Reverse this migration by dropping tenantId columns and restoring
--   the original single-column unique constraints.

BEGIN;

-- =========================================================================
-- applications
-- =========================================================================
ALTER TABLE "applications" ADD COLUMN IF NOT EXISTS "tenantId" VARCHAR(100);
UPDATE "applications" SET "tenantId" = 'legacy' WHERE "tenantId" IS NULL OR "tenantId" = '';
ALTER TABLE "applications" ALTER COLUMN "tenantId" SET NOT NULL;

ALTER TABLE "applications" DROP CONSTRAINT IF EXISTS "applications_code_key";
CREATE UNIQUE INDEX IF NOT EXISTS "applications_tenantId_code_key" ON "applications" ("tenantId", "code");
CREATE INDEX IF NOT EXISTS "applications_tenantId_idx" ON "applications" ("tenantId");

-- =========================================================================
-- application_versions
-- =========================================================================
ALTER TABLE "application_versions" ADD COLUMN IF NOT EXISTS "tenantId" VARCHAR(100);
UPDATE "application_versions" SET "tenantId" = 'legacy' WHERE "tenantId" IS NULL OR "tenantId" = '';
ALTER TABLE "application_versions" ALTER COLUMN "tenantId" SET NOT NULL;
CREATE INDEX IF NOT EXISTS "application_versions_tenantId_idx" ON "application_versions" ("tenantId");
CREATE INDEX IF NOT EXISTS "application_versions_tenantId_status_idx" ON "application_versions" ("tenantId", "status");

-- =========================================================================
-- environments
-- =========================================================================
ALTER TABLE "environments" ADD COLUMN IF NOT EXISTS "tenantId" VARCHAR(100);
UPDATE "environments" SET "tenantId" = 'legacy' WHERE "tenantId" IS NULL OR "tenantId" = '';
ALTER TABLE "environments" ALTER COLUMN "tenantId" SET NOT NULL;

ALTER TABLE "environments" DROP CONSTRAINT IF EXISTS "environments_code_key";
CREATE UNIQUE INDEX IF NOT EXISTS "environments_tenantId_code_key" ON "environments" ("tenantId", "code");
CREATE INDEX IF NOT EXISTS "environments_tenantId_idx" ON "environments" ("tenantId");

-- =========================================================================
-- contracts
-- =========================================================================
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "tenantId" VARCHAR(100);
UPDATE "contracts" SET "tenantId" = 'legacy' WHERE "tenantId" IS NULL OR "tenantId" = '';
ALTER TABLE "contracts" ALTER COLUMN "tenantId" SET NOT NULL;

ALTER TABLE "contracts" DROP CONSTRAINT IF EXISTS "contracts_contractCode_contractVersion_key";
CREATE UNIQUE INDEX IF NOT EXISTS "contracts_tenantId_contractCode_contractVersion_key" ON "contracts" ("tenantId", "contractCode", "contractVersion");
CREATE INDEX IF NOT EXISTS "contracts_tenantId_idx" ON "contracts" ("tenantId");
CREATE INDEX IF NOT EXISTS "contracts_tenantId_status_idx" ON "contracts" ("tenantId", "status");

-- =========================================================================
-- configurations
-- =========================================================================
ALTER TABLE "configurations" ADD COLUMN IF NOT EXISTS "tenantId" VARCHAR(100);
UPDATE "configurations" SET "tenantId" = 'legacy' WHERE "tenantId" IS NULL OR "tenantId" = '';
ALTER TABLE "configurations" ALTER COLUMN "tenantId" SET NOT NULL;

ALTER TABLE "configurations" DROP CONSTRAINT IF EXISTS "configurations_key_scope_scopeId_version_key";
CREATE UNIQUE INDEX IF NOT EXISTS "configurations_tenantId_key_scope_scopeId_version_key" ON "configurations" ("tenantId", "key", "scope", "scopeId", "version");
CREATE INDEX IF NOT EXISTS "configurations_tenantId_idx" ON "configurations" ("tenantId");

-- =========================================================================
-- snapshots
-- =========================================================================
ALTER TABLE "snapshots" ADD COLUMN IF NOT EXISTS "tenantId" VARCHAR(100);
UPDATE "snapshots" SET "tenantId" = 'legacy' WHERE "tenantId" IS NULL OR "tenantId" = '';
ALTER TABLE "snapshots" ALTER COLUMN "tenantId" SET NOT NULL;
CREATE INDEX IF NOT EXISTS "snapshots_tenantId_idx" ON "snapshots" ("tenantId");
CREATE INDEX IF NOT EXISTS "snapshots_tenantId_status_idx" ON "snapshots" ("tenantId", "status");

-- =========================================================================
-- releases
-- =========================================================================
ALTER TABLE "releases" ADD COLUMN IF NOT EXISTS "tenantId" VARCHAR(100);
UPDATE "releases" SET "tenantId" = 'legacy' WHERE "tenantId" IS NULL OR "tenantId" = '';
ALTER TABLE "releases" ALTER COLUMN "tenantId" SET NOT NULL;

ALTER TABLE "releases" DROP CONSTRAINT IF EXISTS "releases_code_version_key";
CREATE UNIQUE INDEX IF NOT EXISTS "releases_tenantId_code_version_key" ON "releases" ("tenantId", "code", "version");
CREATE INDEX IF NOT EXISTS "releases_tenantId_idx" ON "releases" ("tenantId");

-- =========================================================================
-- environment_deployments
-- =========================================================================
ALTER TABLE "environment_deployments" ADD COLUMN IF NOT EXISTS "tenantId" VARCHAR(100);
UPDATE "environment_deployments" SET "tenantId" = 'legacy' WHERE "tenantId" IS NULL OR "tenantId" = '';
ALTER TABLE "environment_deployments" ALTER COLUMN "tenantId" SET NOT NULL;
CREATE INDEX IF NOT EXISTS "environment_deployments_tenantId_idx" ON "environment_deployments" ("tenantId");

-- =========================================================================
-- deployments
-- =========================================================================
ALTER TABLE "deployments" ADD COLUMN IF NOT EXISTS "tenantId" VARCHAR(100);
UPDATE "deployments" SET "tenantId" = 'legacy' WHERE "tenantId" IS NULL OR "tenantId" = '';
ALTER TABLE "deployments" ALTER COLUMN "tenantId" SET NOT NULL;
CREATE INDEX IF NOT EXISTS "deployments_tenantId_idx" ON "deployments" ("tenantId");

-- =========================================================================
-- deployment_history
-- =========================================================================
ALTER TABLE "deployment_history" ADD COLUMN IF NOT EXISTS "tenantId" VARCHAR(100);
UPDATE "deployment_history" SET "tenantId" = 'legacy' WHERE "tenantId" IS NULL OR "tenantId" = '';
CREATE INDEX IF NOT EXISTS "deployment_history_tenantId_idx" ON "deployment_history" ("tenantId");

-- =========================================================================
-- environment_history
-- =========================================================================
ALTER TABLE "environment_history" ADD COLUMN IF NOT EXISTS "tenantId" VARCHAR(100);
UPDATE "environment_history" SET "tenantId" = 'legacy' WHERE "tenantId" IS NULL OR "tenantId" = '';
CREATE INDEX IF NOT EXISTS "environment_history_tenantId_idx" ON "environment_history" ("tenantId");

-- =========================================================================
-- contract_history
-- =========================================================================
ALTER TABLE "contract_history" ADD COLUMN IF NOT EXISTS "tenantId" VARCHAR(100);
UPDATE "contract_history" SET "tenantId" = 'legacy' WHERE "tenantId" IS NULL OR "tenantId" = '';
CREATE INDEX IF NOT EXISTS "contract_history_tenantId_idx" ON "contract_history" ("tenantId");

-- =========================================================================
-- configuration_history
-- =========================================================================
ALTER TABLE "configuration_history" ADD COLUMN IF NOT EXISTS "tenantId" VARCHAR(100);
UPDATE "configuration_history" SET "tenantId" = 'legacy' WHERE "tenantId" IS NULL OR "tenantId" = '';
CREATE INDEX IF NOT EXISTS "configuration_history_tenantId_idx" ON "configuration_history" ("tenantId");

-- =========================================================================
-- snapshot_history
-- =========================================================================
ALTER TABLE "snapshot_history" ADD COLUMN IF NOT EXISTS "tenantId" VARCHAR(100);
UPDATE "snapshot_history" SET "tenantId" = 'legacy' WHERE "tenantId" IS NULL OR "tenantId" = '';
CREATE INDEX IF NOT EXISTS "snapshot_history_tenantId_idx" ON "snapshot_history" ("tenantId");

COMMIT;
