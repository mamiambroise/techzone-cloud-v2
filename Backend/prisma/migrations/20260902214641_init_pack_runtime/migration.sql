-- CreateTable
CREATE TABLE "pm_packs" (
    "id" UUID NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "description" TEXT,
    "categoryId" TEXT,
    "iconKey" TEXT,
    "logoRef" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "sourceType" TEXT NOT NULL DEFAULT 'CUSTOM',
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "updatedBy" TEXT,
    "archivedAt" TIMESTAMPTZ(6),
    "rowVersion" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "pm_packs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm_pack_versions" (
    "id" UUID NOT NULL,
    "tenantId" TEXT NOT NULL,
    "packId" UUID NOT NULL,
    "versionNumber" TEXT NOT NULL,
    "label" TEXT,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "validationStatus" TEXT NOT NULL DEFAULT 'NOT_RUN',
    "manifestStatus" TEXT NOT NULL DEFAULT 'NOT_GENERATED',
    "changeType" TEXT NOT NULL DEFAULT 'INITIAL',
    "sourceVersionId" UUID,
    "releaseNotes" TEXT,
    "snapshotHash" TEXT,
    "manifestHash" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "updatedBy" TEXT,
    "validatedAt" TIMESTAMPTZ(6),
    "validatedBy" TEXT,
    "publishedAt" TIMESTAMPTZ(6),
    "publishedBy" TEXT,
    "deprecatedAt" TIMESTAMPTZ(6),
    "archivedAt" TIMESTAMPTZ(6),
    "rowVersion" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "pm_pack_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm_pack_modules" (
    "id" UUID NOT NULL,
    "tenantId" TEXT NOT NULL,
    "packVersionId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "description" TEXT,
    "moduleType" TEXT NOT NULL DEFAULT 'BUSINESS',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "iconKey" TEXT,
    "configuration" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "updatedBy" TEXT,
    "archivedAt" TIMESTAMPTZ(6),
    "rowVersion" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "pm_pack_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm_pack_features" (
    "id" UUID NOT NULL,
    "tenantId" TEXT NOT NULL,
    "packVersionId" UUID NOT NULL,
    "moduleId" UUID,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "description" TEXT,
    "featureType" TEXT NOT NULL DEFAULT 'BUSINESS',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "defaultEnabled" BOOLEAN NOT NULL DEFAULT true,
    "visibility" TEXT NOT NULL DEFAULT 'VISIBLE',
    "configuration" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "updatedBy" TEXT,
    "archivedAt" TIMESTAMPTZ(6),
    "rowVersion" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "pm_pack_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm_capabilities" (
    "id" UUID NOT NULL,
    "tenantId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "capabilityType" TEXT NOT NULL DEFAULT 'BUSINESS',
    "scope" TEXT NOT NULL DEFAULT 'TENANT',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "contractRef" TEXT,
    "contractVersion" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "pm_capabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm_feature_capabilities" (
    "id" UUID NOT NULL,
    "tenantId" TEXT NOT NULL,
    "featureId" UUID NOT NULL,
    "capabilityId" UUID NOT NULL,
    "relationType" TEXT NOT NULL DEFAULT 'REQUIRES',
    "required" BOOLEAN NOT NULL DEFAULT true,
    "configuration" JSONB,

    CONSTRAINT "pm_feature_capabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm_dependencies" (
    "id" UUID NOT NULL,
    "tenantId" TEXT NOT NULL,
    "packVersionId" UUID NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "dependencyType" TEXT NOT NULL DEFAULT 'REQUIRES',
    "targetType" TEXT NOT NULL,
    "targetRef" TEXT NOT NULL,
    "targetVersionRange" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "conditionRef" TEXT,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "resolutionStatus" TEXT NOT NULL DEFAULT 'NOT_RESOLVED',
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "updatedBy" TEXT,
    "archivedAt" TIMESTAMPTZ(6),
    "rowVersion" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "pm_dependencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm_rules" (
    "id" UUID NOT NULL,
    "tenantId" TEXT NOT NULL,
    "packVersionId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ruleType" TEXT NOT NULL DEFAULT 'ACTIVATION',
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "effect" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "expressionVersion" TEXT NOT NULL DEFAULT '1.0',
    "expression" JSONB NOT NULL,
    "ruleHash" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "updatedBy" TEXT,
    "archivedAt" TIMESTAMPTZ(6),
    "rowVersion" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "pm_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm_validations" (
    "id" UUID NOT NULL,
    "tenantId" TEXT NOT NULL,
    "packVersionId" UUID NOT NULL,
    "status" TEXT NOT NULL,
    "issues" JSONB NOT NULL,
    "summary" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "pm_validations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm_snapshots" (
    "id" UUID NOT NULL,
    "tenantId" TEXT NOT NULL,
    "packVersionId" UUID NOT NULL,
    "snapshotHash" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pm_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm_manifests" (
    "id" UUID NOT NULL,
    "tenantId" TEXT NOT NULL,
    "packVersionId" UUID NOT NULL,
    "contractVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "manifestHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'GENERATED',
    "content" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMPTZ(6),

    CONSTRAINT "pm_manifests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm_audit_events" (
    "id" UUID NOT NULL,
    "tenantId" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "traceId" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pm_audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm_outbox_events" (
    "id" UUID NOT NULL,
    "tenantId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMPTZ(6),

    CONSTRAINT "pm_outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pr_runtime_resolutions" (
    "id" UUID NOT NULL,
    "tenantId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "packId" UUID NOT NULL,
    "packVersionId" UUID NOT NULL,
    "requestHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "context" JSONB NOT NULL,
    "result" JSONB,
    "diagnostics" JSONB,
    "startedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMPTZ(6),
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "pr_runtime_resolutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pr_runtime_resolution_steps" (
    "id" UUID NOT NULL,
    "resolutionId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL,
    "inputHash" TEXT,
    "outputHash" TEXT,
    "details" JSONB,
    "startedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMPTZ(6),

    CONSTRAINT "pr_runtime_resolution_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pr_effective_manifests" (
    "id" UUID NOT NULL,
    "tenantId" TEXT NOT NULL,
    "resolutionId" UUID NOT NULL,
    "applicationId" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "manifestHash" TEXT NOT NULL,
    "functionalHash" TEXT NOT NULL,
    "contractVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "status" TEXT NOT NULL,
    "executable" BOOLEAN NOT NULL,
    "content" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pr_effective_manifests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pr_runtime_diagnostics" (
    "id" UUID NOT NULL,
    "tenantId" TEXT NOT NULL,
    "resolutionId" UUID,
    "severity" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "details" JSONB,
    "traceId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pr_runtime_diagnostics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pm_packs_tenantId_status_idx" ON "pm_packs"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "pm_packs_tenantId_code_key" ON "pm_packs"("tenantId", "code");

-- CreateIndex
CREATE INDEX "pm_pack_versions_tenantId_status_idx" ON "pm_pack_versions"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "pm_pack_versions_tenantId_packId_versionNumber_key" ON "pm_pack_versions"("tenantId", "packId", "versionNumber");

-- CreateIndex
CREATE INDEX "pm_pack_modules_tenantId_packVersionId_displayOrder_idx" ON "pm_pack_modules"("tenantId", "packVersionId", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "pm_pack_modules_tenantId_packVersionId_code_key" ON "pm_pack_modules"("tenantId", "packVersionId", "code");

-- CreateIndex
CREATE INDEX "pm_pack_features_tenantId_moduleId_idx" ON "pm_pack_features"("tenantId", "moduleId");

-- CreateIndex
CREATE UNIQUE INDEX "pm_pack_features_tenantId_packVersionId_code_key" ON "pm_pack_features"("tenantId", "packVersionId", "code");

-- CreateIndex
CREATE INDEX "pm_capabilities_code_status_idx" ON "pm_capabilities"("code", "status");

-- CreateIndex
CREATE UNIQUE INDEX "pm_capabilities_tenantId_code_key" ON "pm_capabilities"("tenantId", "code");

-- CreateIndex
CREATE INDEX "pm_feature_capabilities_tenantId_capabilityId_idx" ON "pm_feature_capabilities"("tenantId", "capabilityId");

-- CreateIndex
CREATE UNIQUE INDEX "pm_feature_capabilities_tenantId_featureId_capabilityId_rel_key" ON "pm_feature_capabilities"("tenantId", "featureId", "capabilityId", "relationType");

-- CreateIndex
CREATE INDEX "pm_dependencies_tenantId_packVersionId_resolutionStatus_idx" ON "pm_dependencies"("tenantId", "packVersionId", "resolutionStatus");

-- CreateIndex
CREATE UNIQUE INDEX "pm_dependencies_tenantId_packVersionId_sourceType_sourceId__key" ON "pm_dependencies"("tenantId", "packVersionId", "sourceType", "sourceId", "dependencyType", "targetType", "targetRef");

-- CreateIndex
CREATE INDEX "pm_rules_tenantId_packVersionId_enabled_priority_idx" ON "pm_rules"("tenantId", "packVersionId", "enabled", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "pm_rules_tenantId_packVersionId_code_key" ON "pm_rules"("tenantId", "packVersionId", "code");

-- CreateIndex
CREATE INDEX "pm_validations_tenantId_packVersionId_createdAt_idx" ON "pm_validations"("tenantId", "packVersionId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "pm_snapshots_packVersionId_key" ON "pm_snapshots"("packVersionId");

-- CreateIndex
CREATE INDEX "pm_snapshots_tenantId_snapshotHash_idx" ON "pm_snapshots"("tenantId", "snapshotHash");

-- CreateIndex
CREATE UNIQUE INDEX "pm_manifests_packVersionId_key" ON "pm_manifests"("packVersionId");

-- CreateIndex
CREATE INDEX "pm_manifests_tenantId_manifestHash_idx" ON "pm_manifests"("tenantId", "manifestHash");

-- CreateIndex
CREATE INDEX "pm_audit_events_tenantId_aggregateType_aggregateId_createdA_idx" ON "pm_audit_events"("tenantId", "aggregateType", "aggregateId", "createdAt");

-- CreateIndex
CREATE INDEX "pm_outbox_events_status_createdAt_idx" ON "pm_outbox_events"("status", "createdAt");

-- CreateIndex
CREATE INDEX "pm_outbox_events_tenantId_aggregateType_aggregateId_idx" ON "pm_outbox_events"("tenantId", "aggregateType", "aggregateId");

-- CreateIndex
CREATE INDEX "pr_runtime_resolutions_tenantId_applicationId_environment_s_idx" ON "pr_runtime_resolutions"("tenantId", "applicationId", "environment", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "pr_runtime_resolutions_tenantId_requestHash_key" ON "pr_runtime_resolutions"("tenantId", "requestHash");

-- CreateIndex
CREATE INDEX "pr_runtime_resolution_steps_resolutionId_displayOrder_idx" ON "pr_runtime_resolution_steps"("resolutionId", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "pr_runtime_resolution_steps_resolutionId_code_key" ON "pr_runtime_resolution_steps"("resolutionId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "pr_effective_manifests_resolutionId_key" ON "pr_effective_manifests"("resolutionId");

-- CreateIndex
CREATE INDEX "pr_effective_manifests_tenantId_applicationId_environment_c_idx" ON "pr_effective_manifests"("tenantId", "applicationId", "environment", "createdAt");

-- CreateIndex
CREATE INDEX "pr_effective_manifests_manifestHash_idx" ON "pr_effective_manifests"("manifestHash");

-- CreateIndex
CREATE INDEX "pr_runtime_diagnostics_tenantId_resolutionId_createdAt_idx" ON "pr_runtime_diagnostics"("tenantId", "resolutionId", "createdAt");

-- CreateIndex
CREATE INDEX "pr_runtime_diagnostics_tenantId_severity_category_idx" ON "pr_runtime_diagnostics"("tenantId", "severity", "category");

-- AddForeignKey
ALTER TABLE "pm_pack_versions" ADD CONSTRAINT "pm_pack_versions_packId_fkey" FOREIGN KEY ("packId") REFERENCES "pm_packs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_pack_modules" ADD CONSTRAINT "pm_pack_modules_packVersionId_fkey" FOREIGN KEY ("packVersionId") REFERENCES "pm_pack_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_pack_features" ADD CONSTRAINT "pm_pack_features_packVersionId_fkey" FOREIGN KEY ("packVersionId") REFERENCES "pm_pack_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_pack_features" ADD CONSTRAINT "pm_pack_features_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "pm_pack_modules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_feature_capabilities" ADD CONSTRAINT "pm_feature_capabilities_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "pm_pack_features"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_feature_capabilities" ADD CONSTRAINT "pm_feature_capabilities_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "pm_capabilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_dependencies" ADD CONSTRAINT "pm_dependencies_packVersionId_fkey" FOREIGN KEY ("packVersionId") REFERENCES "pm_pack_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_rules" ADD CONSTRAINT "pm_rules_packVersionId_fkey" FOREIGN KEY ("packVersionId") REFERENCES "pm_pack_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_validations" ADD CONSTRAINT "pm_validations_packVersionId_fkey" FOREIGN KEY ("packVersionId") REFERENCES "pm_pack_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_snapshots" ADD CONSTRAINT "pm_snapshots_packVersionId_fkey" FOREIGN KEY ("packVersionId") REFERENCES "pm_pack_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_manifests" ADD CONSTRAINT "pm_manifests_packVersionId_fkey" FOREIGN KEY ("packVersionId") REFERENCES "pm_pack_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pr_runtime_resolution_steps" ADD CONSTRAINT "pr_runtime_resolution_steps_resolutionId_fkey" FOREIGN KEY ("resolutionId") REFERENCES "pr_runtime_resolutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pr_effective_manifests" ADD CONSTRAINT "pr_effective_manifests_resolutionId_fkey" FOREIGN KEY ("resolutionId") REFERENCES "pr_runtime_resolutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
