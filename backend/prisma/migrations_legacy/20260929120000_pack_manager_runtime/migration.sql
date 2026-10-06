-- Migration : Pack Manager (pm_*) + Pack Runtime (pr_*)
-- Source de vérité : backend/prisma/schema.prisma (modèles Pm*, Pr*)
-- UUID, tenantId nullable (isolation applicative, cohérent avec le reste du schéma),
-- unicités et index conformes aux @@unique / @@index Prisma.

-- =====================================================================
-- PACK MANAGER
-- =====================================================================

CREATE TYPE "PmPackStatus" AS ENUM ('DRAFT', 'ACTIVE', 'SUSPENDED', 'DEPRECATED', 'ARCHIVED');
CREATE TYPE "PmSourceType" AS ENUM ('INTERNAL', 'IMPORTED', 'TEMPLATE');
CREATE TYPE "PmVersionStatus" AS ENUM ('DRAFT', 'CONFIGURING', 'VALIDATING', 'READY', 'PUBLISHED', 'SUPERSEDED', 'DEPRECATED', 'ARCHIVED', 'INVALID', 'ERROR');
CREATE TYPE "PmValidationStatus" AS ENUM ('NOT_RUN', 'RUNNING', 'VALID', 'INVALID', 'OUTDATED', 'ERROR');
CREATE TYPE "PmManifestStatus" AS ENUM ('NOT_GENERATED', 'GENERATING', 'VALID', 'INVALID', 'OUTDATED', 'ERROR');
CREATE TYPE "PmDependencyType" AS ENUM ('REQUIRED', 'OPTIONAL', 'CONFLICTS_WITH', 'RECOMMENDS', 'IMPLIES');
CREATE TYPE "PmDependencyTargetType" AS ENUM ('PACK', 'MODULE', 'FEATURE', 'CAPABILITY');
CREATE TYPE "PmRuleType" AS ENUM ('ACTIVATION', 'AVAILABILITY', 'CONSTRAINT');
CREATE TYPE "PmSeverity" AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');

CREATE TABLE "pm_packs" (
    "id" UUID NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "shortName" VARCHAR(80),
    "description" TEXT,
    "category" VARCHAR(100),
    "iconKey" VARCHAR(100),
    "status" "PmPackStatus" NOT NULL DEFAULT 'DRAFT',
    "sourceType" "PmSourceType" NOT NULL DEFAULT 'INTERNAL',
    "metadata" JSONB,
    "tenantId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "rowVersion" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "pm_packs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pm_pack_versions" (
    "id" UUID NOT NULL,
    "packId" UUID NOT NULL,
    "versionNumber" VARCHAR(50) NOT NULL,
    "label" VARCHAR(150),
    "description" TEXT,
    "status" "PmVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "validationStatus" "PmValidationStatus" NOT NULL DEFAULT 'NOT_RUN',
    "manifestStatus" "PmManifestStatus" NOT NULL DEFAULT 'NOT_GENERATED',
    "sourceVersionId" UUID,
    "snapshotHash" VARCHAR(128),
    "releaseNotes" TEXT,
    "tenantId" UUID,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "rowVersion" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "pm_pack_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pm_modules" (
    "id" UUID NOT NULL,
    "versionId" UUID NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "config" JSONB,
    "tenantId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pm_modules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pm_features" (
    "id" UUID NOT NULL,
    "versionId" UUID NOT NULL,
    "code" VARCHAR(150) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "tenantId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pm_features_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pm_capabilities" (
    "id" UUID NOT NULL,
    "versionId" UUID NOT NULL,
    "code" VARCHAR(150) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "tenantId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pm_capabilities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pm_module_features" (
    "id" UUID NOT NULL,
    "moduleId" UUID NOT NULL,
    "featureId" UUID NOT NULL,
    "tenantId" UUID,

    CONSTRAINT "pm_module_features_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pm_feature_capabilities" (
    "id" UUID NOT NULL,
    "featureId" UUID NOT NULL,
    "capabilityId" UUID NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "tenantId" UUID,

    CONSTRAINT "pm_feature_capabilities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pm_dependencies" (
    "id" UUID NOT NULL,
    "versionId" UUID NOT NULL,
    "targetType" "PmDependencyTargetType" NOT NULL,
    "targetPackId" UUID,
    "targetCode" VARCHAR(150) NOT NULL,
    "versionRange" VARCHAR(50),
    "type" "PmDependencyType" NOT NULL DEFAULT 'REQUIRED',
    "status" VARCHAR(50),
    "metadata" JSONB,
    "tenantId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pm_dependencies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pm_rules" (
    "id" UUID NOT NULL,
    "versionId" UUID NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "type" "PmRuleType" NOT NULL DEFAULT 'ACTIVATION',
    "description" TEXT,
    "conditions" JSONB NOT NULL,
    "effect" VARCHAR(50) NOT NULL DEFAULT 'ENABLE',
    "priority" INTEGER NOT NULL DEFAULT 100,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "moduleId" UUID,
    "tenantId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pm_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pm_validations" (
    "id" UUID NOT NULL,
    "versionId" UUID NOT NULL,
    "status" "PmValidationStatus" NOT NULL DEFAULT 'NOT_RUN',
    "checks" JSONB,
    "issues" JSONB,
    "durationMs" INTEGER,
    "tenantId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pm_validations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pm_manifests" (
    "id" UUID NOT NULL,
    "versionId" UUID NOT NULL,
    "contract" VARCHAR(100) NOT NULL DEFAULT 'techzone.pack-manifest',
    "contractVersion" VARCHAR(20) NOT NULL DEFAULT '1.0',
    "status" "PmManifestStatus" NOT NULL DEFAULT 'NOT_GENERATED',
    "content" JSONB NOT NULL,
    "hash" VARCHAR(128) NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "tenantId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pm_manifests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pm_snapshots" (
    "id" UUID NOT NULL,
    "versionId" UUID NOT NULL,
    "hash" VARCHAR(128) NOT NULL,
    "content" JSONB NOT NULL,
    "tenantId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pm_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pm_audit_events" (
    "id" UUID NOT NULL,
    "versionId" UUID,
    "packId" UUID,
    "action" VARCHAR(100) NOT NULL,
    "actor" VARCHAR(150),
    "details" JSONB,
    "traceId" VARCHAR(64),
    "tenantId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pm_audit_events_pkey" PRIMARY KEY ("id")
);

-- Contraintes d'unicité
CREATE UNIQUE INDEX "pm_packs_tenantId_code_key" ON "pm_packs"("tenantId", "code");
CREATE UNIQUE INDEX "pm_pack_versions_packId_versionNumber_key" ON "pm_pack_versions"("packId", "versionNumber");
CREATE UNIQUE INDEX "pm_modules_versionId_code_key" ON "pm_modules"("versionId", "code");
CREATE UNIQUE INDEX "pm_features_versionId_code_key" ON "pm_features"("versionId", "code");
CREATE UNIQUE INDEX "pm_capabilities_versionId_code_key" ON "pm_capabilities"("versionId", "code");
CREATE UNIQUE INDEX "pm_module_features_moduleId_featureId_key" ON "pm_module_features"("moduleId", "featureId");
CREATE UNIQUE INDEX "pm_feature_capabilities_featureId_capabilityId_key" ON "pm_feature_capabilities"("featureId", "capabilityId");
CREATE UNIQUE INDEX "pm_dependencies_versionId_targetType_targetCode_key" ON "pm_dependencies"("versionId", "targetType", "targetCode");
CREATE UNIQUE INDEX "pm_rules_versionId_code_key" ON "pm_rules"("versionId", "code");
CREATE UNIQUE INDEX "pm_manifests_versionId_revision_key" ON "pm_manifests"("versionId", "revision");

-- Index
CREATE INDEX "pm_packs_tenantId_idx" ON "pm_packs"("tenantId");
CREATE INDEX "pm_packs_status_idx" ON "pm_packs"("status");
CREATE INDEX "pm_packs_category_idx" ON "pm_packs"("category");
CREATE INDEX "pm_pack_versions_tenantId_idx" ON "pm_pack_versions"("tenantId");
CREATE INDEX "pm_pack_versions_packId_idx" ON "pm_pack_versions"("packId");
CREATE INDEX "pm_pack_versions_status_idx" ON "pm_pack_versions"("status");
CREATE INDEX "pm_pack_versions_validationStatus_idx" ON "pm_pack_versions"("validationStatus");
CREATE INDEX "pm_modules_versionId_idx" ON "pm_modules"("versionId");
CREATE INDEX "pm_modules_tenantId_idx" ON "pm_modules"("tenantId");
CREATE INDEX "pm_features_versionId_idx" ON "pm_features"("versionId");
CREATE INDEX "pm_features_tenantId_idx" ON "pm_features"("tenantId");
CREATE INDEX "pm_capabilities_versionId_idx" ON "pm_capabilities"("versionId");
CREATE INDEX "pm_capabilities_tenantId_idx" ON "pm_capabilities"("tenantId");
CREATE INDEX "pm_module_features_moduleId_idx" ON "pm_module_features"("moduleId");
CREATE INDEX "pm_module_features_featureId_idx" ON "pm_module_features"("featureId");
CREATE INDEX "pm_feature_capabilities_featureId_idx" ON "pm_feature_capabilities"("featureId");
CREATE INDEX "pm_feature_capabilities_capabilityId_idx" ON "pm_feature_capabilities"("capabilityId");
CREATE INDEX "pm_dependencies_versionId_idx" ON "pm_dependencies"("versionId");
CREATE INDEX "pm_dependencies_targetPackId_idx" ON "pm_dependencies"("targetPackId");
CREATE INDEX "pm_dependencies_tenantId_idx" ON "pm_dependencies"("tenantId");
CREATE INDEX "pm_rules_versionId_idx" ON "pm_rules"("versionId");
CREATE INDEX "pm_rules_tenantId_idx" ON "pm_rules"("tenantId");
CREATE INDEX "pm_validations_versionId_idx" ON "pm_validations"("versionId");
CREATE INDEX "pm_validations_status_idx" ON "pm_validations"("status");
CREATE INDEX "pm_validations_tenantId_idx" ON "pm_validations"("tenantId");
CREATE INDEX "pm_manifests_versionId_idx" ON "pm_manifests"("versionId");
CREATE INDEX "pm_manifests_tenantId_idx" ON "pm_manifests"("tenantId");
CREATE INDEX "pm_snapshots_versionId_idx" ON "pm_snapshots"("versionId");
CREATE INDEX "pm_snapshots_tenantId_idx" ON "pm_snapshots"("tenantId");
CREATE INDEX "pm_audit_events_tenantId_idx" ON "pm_audit_events"("tenantId");
CREATE INDEX "pm_audit_events_packId_idx" ON "pm_audit_events"("packId");
CREATE INDEX "pm_audit_events_versionId_idx" ON "pm_audit_events"("versionId");
CREATE INDEX "pm_audit_events_createdAt_idx" ON "pm_audit_events"("createdAt");

-- Clés étrangères
ALTER TABLE "pm_pack_versions" ADD CONSTRAINT "pm_pack_versions_packId_fkey" FOREIGN KEY ("packId") REFERENCES "pm_packs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pm_pack_versions" ADD CONSTRAINT "pm_pack_versions_sourceVersionId_fkey" FOREIGN KEY ("sourceVersionId") REFERENCES "pm_pack_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "pm_modules" ADD CONSTRAINT "pm_modules_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "pm_pack_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pm_features" ADD CONSTRAINT "pm_features_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "pm_pack_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pm_capabilities" ADD CONSTRAINT "pm_capabilities_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "pm_pack_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pm_module_features" ADD CONSTRAINT "pm_module_features_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "pm_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pm_module_features" ADD CONSTRAINT "pm_module_features_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "pm_features"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pm_feature_capabilities" ADD CONSTRAINT "pm_feature_capabilities_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "pm_features"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pm_feature_capabilities" ADD CONSTRAINT "pm_feature_capabilities_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "pm_capabilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pm_dependencies" ADD CONSTRAINT "pm_dependencies_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "pm_pack_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pm_dependencies" ADD CONSTRAINT "pm_dependencies_targetPackId_fkey" FOREIGN KEY ("targetPackId") REFERENCES "pm_packs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "pm_rules" ADD CONSTRAINT "pm_rules_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "pm_pack_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pm_rules" ADD CONSTRAINT "pm_rules_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "pm_modules"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "pm_validations" ADD CONSTRAINT "pm_validations_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "pm_pack_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pm_manifests" ADD CONSTRAINT "pm_manifests_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "pm_pack_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pm_snapshots" ADD CONSTRAINT "pm_snapshots_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "pm_pack_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pm_audit_events" ADD CONSTRAINT "pm_audit_events_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "pm_pack_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- =====================================================================
-- PACK RUNTIME
-- =====================================================================

CREATE TYPE "PrResolutionStatus" AS ENUM ('NOT_RESOLVED', 'RESOLVING', 'RESOLVED', 'PARTIALLY_RESOLVED', 'BLOCKED', 'DEGRADED', 'ERROR');

CREATE TABLE "pr_runtime_contexts" (
    "id" UUID NOT NULL,
    "label" VARCHAR(150) NOT NULL,
    "tenantId" UUID,
    "applicationId" UUID,
    "environment" VARCHAR(50) NOT NULL DEFAULT 'PRODUCTION',
    "featureFlags" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pr_runtime_contexts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pr_runtime_resolutions" (
    "id" UUID NOT NULL,
    "tenantId" UUID,
    "applicationId" UUID,
    "packId" UUID,
    "packVersionId" UUID,
    "packCode" VARCHAR(100),
    "packVersion" VARCHAR(50),
    "sourceManifestHash" VARCHAR(128),
    "effectiveManifestHash" VARCHAR(128),
    "status" "PrResolutionStatus" NOT NULL DEFAULT 'NOT_RESOLVED',
    "contextId" UUID,
    "steps" JSONB,
    "issues" JSONB,
    "effectiveManifest" JSONB,
    "durationMs" INTEGER,
    "traceId" VARCHAR(64),
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pr_runtime_resolutions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pr_runtime_cache" (
    "id" UUID NOT NULL,
    "cacheKey" VARCHAR(300) NOT NULL,
    "tenantId" UUID,
    "payload" JSONB NOT NULL,
    "hash" VARCHAR(128),
    "hits" INTEGER NOT NULL DEFAULT 0,
    "misses" INTEGER NOT NULL DEFAULT 0,
    "ttlSeconds" INTEGER NOT NULL DEFAULT 300,
    "expiresAt" TIMESTAMP(3),
    "lastInvalidatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pr_runtime_cache_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pr_runtime_diagnostics" (
    "id" UUID NOT NULL,
    "severity" VARCHAR(20) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "component" VARCHAR(50) NOT NULL,
    "message" VARCHAR(500) NOT NULL,
    "details" JSONB,
    "resolutionId" UUID,
    "traceId" VARCHAR(64),
    "tenantId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pr_runtime_diagnostics_pkey" PRIMARY KEY ("id")
);

-- Index
CREATE INDEX "pr_runtime_contexts_tenantId_idx" ON "pr_runtime_contexts"("tenantId");
CREATE INDEX "pr_runtime_contexts_applicationId_idx" ON "pr_runtime_contexts"("applicationId");
CREATE INDEX "pr_runtime_resolutions_tenantId_idx" ON "pr_runtime_resolutions"("tenantId");
CREATE INDEX "pr_runtime_resolutions_packCode_packVersion_idx" ON "pr_runtime_resolutions"("packCode", "packVersion");
CREATE INDEX "pr_runtime_resolutions_status_idx" ON "pr_runtime_resolutions"("status");
CREATE INDEX "pr_runtime_resolutions_traceId_idx" ON "pr_runtime_resolutions"("traceId");
CREATE INDEX "pr_runtime_resolutions_createdAt_idx" ON "pr_runtime_resolutions"("createdAt");
CREATE UNIQUE INDEX "pr_runtime_cache_cacheKey_key" ON "pr_runtime_cache"("cacheKey");
CREATE INDEX "pr_runtime_cache_tenantId_idx" ON "pr_runtime_cache"("tenantId");
CREATE INDEX "pr_runtime_cache_expiresAt_idx" ON "pr_runtime_cache"("expiresAt");
CREATE INDEX "pr_runtime_diagnostics_tenantId_idx" ON "pr_runtime_diagnostics"("tenantId");
CREATE INDEX "pr_runtime_diagnostics_severity_idx" ON "pr_runtime_diagnostics"("severity");
CREATE INDEX "pr_runtime_diagnostics_resolutionId_idx" ON "pr_runtime_diagnostics"("resolutionId");
CREATE INDEX "pr_runtime_diagnostics_createdAt_idx" ON "pr_runtime_diagnostics"("createdAt");

-- Clés étrangères
ALTER TABLE "pr_runtime_resolutions" ADD CONSTRAINT "pr_runtime_resolutions_contextId_fkey" FOREIGN KEY ("contextId") REFERENCES "pr_runtime_contexts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
