-- Business Manager tables generated from the canonical Prisma schema.
CREATE TYPE "BmEntityStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

CREATE TYPE "BmDataTypeCode" AS ENUM ('TEXT', 'LONG_TEXT', 'INTEGER', 'BIG_INTEGER', 'DECIMAL', 'CURRENCY', 'PERCENTAGE', 'BOOLEAN', 'DATE', 'DATETIME', 'TIME', 'EMAIL', 'PHONE', 'URL', 'ENUM', 'MULTI_ENUM', 'UUID', 'SEQUENCE', 'FILE', 'IMAGE', 'JSON', 'RELATION', 'FORMULA');

CREATE TYPE "BmDataClassification" AS ENUM ('PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'SENSITIVE');

CREATE TYPE "BmDataScope" AS ENUM ('GLOBAL', 'ORGANIZATION', 'SITE', 'USER', 'CONTEXT');

CREATE TYPE "BmRelationType" AS ENUM ('ONE_TO_ONE', 'ONE_TO_MANY', 'MANY_TO_ONE', 'MANY_TO_MANY');

CREATE TYPE "BmDeleteBehavior" AS ENUM ('RESTRICT', 'CASCADE', 'SET_NULL');

CREATE TYPE "BmConstraintType" AS ENUM ('PRIMARY', 'UNIQUE', 'NOT_NULL', 'VALUE_RANGE', 'FORMAT', 'RELATION', 'COMPOSITE_UNIQUE', 'DECLARATIVE_CUSTOM');

CREATE TYPE "BmIndexType" AS ENUM ('SIMPLE', 'UNIQUE', 'COMPOSITE');

CREATE TYPE "BmValidationType" AS ENUM ('REQUIRED', 'MIN', 'MAX', 'MIN_LENGTH', 'MAX_LENGTH', 'REGEX', 'EMAIL', 'URL', 'ALLOWED_VALUES', 'PRECISION', 'SCALE');

CREATE TYPE "BmFeatureStatus" AS ENUM ('DRAFT', 'ACTIVE', 'DEPRECATED', 'ARCHIVED');

CREATE TYPE "BmCapabilityStatus" AS ENUM ('DRAFT', 'ACTIVE', 'DEPRECATED', 'ARCHIVED');

CREATE TYPE "BmDependencyType" AS ENUM ('REQUIRED', 'OPTIONAL', 'CONFLICTS_WITH');

CREATE TYPE "BmNavigationStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

CREATE TYPE "BmMenuLocation" AS ENUM ('SIDEBAR', 'TOPBAR', 'CONTEXT_MENU', 'FOOTER', 'DASHBOARD', 'CUSTOM');

CREATE TYPE "BmMenuItemType" AS ENUM ('LINK', 'GROUP', 'SEPARATOR', 'EXTERNAL_LINK');

CREATE TYPE "BmNavigationVisibility" AS ENUM ('VISIBLE', 'HIDDEN', 'DISABLED');

CREATE TYPE "BmContractStatus" AS ENUM ('DRAFT', 'VALIDATING', 'LOCKED', 'ACTIVE', 'DEPRECATED', 'RETIRED');

CREATE TYPE "BmRuntimeReadiness" AS ENUM ('NOT_READY', 'READY', 'ERROR', 'DEGRADED');

CREATE TYPE "BmqSeverity" AS ENUM ('INFO', 'WARNING', 'ERROR', 'BLOCKER');

CREATE TYPE "BmqStatus" AS ENUM ('PENDING', 'RUNNING', 'PASSED', 'WARNING', 'FAILED', 'BLOCKED', 'CANCELLED');

CREATE TYPE "BmqGateResult" AS ENUM ('PASS', 'WARNING', 'FAIL', 'BLOCKED');

CREATE TABLE "bm_entities" (
    "id" UUID NOT NULL,
    "applicationId" UUID NOT NULL,
    "applicationVersionId" UUID NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "pluralName" VARCHAR(255),
    "description" TEXT,
    "icon" VARCHAR(50),
    "status" "BmEntityStatus" NOT NULL DEFAULT 'DRAFT',
    "scope" "BmDataScope",
    "classification" "BmDataClassification",
    "version" VARCHAR(50) NOT NULL DEFAULT '1.0.0',
    "tenantId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bm_entities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bm_fields" (
    "id" UUID NOT NULL,
    "entityId" UUID NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "label" VARCHAR(255),
    "description" TEXT,
    "type" "BmDataTypeCode" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "unique" BOOLEAN NOT NULL DEFAULT false,
    "readonly" BOOLEAN NOT NULL DEFAULT false,
    "indexed" BOOLEAN NOT NULL DEFAULT false,
    "defaultValue" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "scope" "BmDataScope",
    "classification" "BmDataClassification",
    "configuration" JSONB,
    "version" VARCHAR(50),
    "tenantId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bm_fields_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bm_field_validations" (
    "id" UUID NOT NULL,
    "fieldId" UUID NOT NULL,
    "validationType" "BmValidationType" NOT NULL,
    "value" TEXT,
    "message" TEXT,
    "configuration" JSONB,
    "version" VARCHAR(50),
    "tenantId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bm_field_validations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bm_relations" (
    "id" UUID NOT NULL,
    "applicationVersionId" UUID NOT NULL,
    "sourceEntityId" UUID NOT NULL,
    "targetEntityId" UUID NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "relationType" "BmRelationType" NOT NULL DEFAULT 'ONE_TO_MANY',
    "sourceLabel" TEXT,
    "targetLabel" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "deleteBehavior" "BmDeleteBehavior" NOT NULL DEFAULT 'RESTRICT',
    "configuration" JSONB,
    "version" VARCHAR(50),
    "tenantId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bm_relations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bm_constraints" (
    "id" UUID NOT NULL,
    "entityId" UUID NOT NULL,
    "fieldId" UUID,
    "code" VARCHAR(100) NOT NULL,
    "constraintType" "BmConstraintType" NOT NULL DEFAULT 'UNIQUE',
    "name" VARCHAR(255),
    "definition" JSONB,
    "version" VARCHAR(50),
    "tenantId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bm_constraints_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bm_indexes" (
    "id" UUID NOT NULL,
    "entityId" UUID NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255),
    "indexType" "BmIndexType" NOT NULL DEFAULT 'SIMPLE',
    "unique" BOOLEAN NOT NULL DEFAULT false,
    "definition" JSONB,
    "version" VARCHAR(50),
    "tenantId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bm_indexes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bm_index_fields" (
    "id" UUID NOT NULL,
    "indexId" UUID NOT NULL,
    "fieldId" UUID NOT NULL,
    "sort" VARCHAR(10) NOT NULL DEFAULT 'ASC',
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "bm_index_fields_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bm_computed_fields" (
    "id" UUID NOT NULL,
    "entityId" UUID NOT NULL,
    "applicationId" UUID NOT NULL,
    "applicationVersionId" UUID NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "expression" TEXT,
    "targetFieldCode" TEXT,
    "description" TEXT,
    "configuration" JSONB,
    "version" VARCHAR(50),
    "tenantId" UUID,

    CONSTRAINT "bm_computed_fields_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bm_features" (
    "id" UUID NOT NULL,
    "applicationId" UUID NOT NULL,
    "applicationVersionId" UUID NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(100),
    "tags" TEXT[],
    "status" "BmFeatureStatus" NOT NULL DEFAULT 'DRAFT',
    "source" VARCHAR(50),
    "version" VARCHAR(50) NOT NULL DEFAULT '1.0.0',
    "tenantId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bm_features_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bm_feature_capabilities" (
    "id" UUID NOT NULL,
    "featureId" UUID NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "status" "BmCapabilityStatus" NOT NULL DEFAULT 'DRAFT',
    "requiredEntities" TEXT[],
    "configuration" JSONB,
    "version" VARCHAR(50),
    "tenantId" UUID,

    CONSTRAINT "bm_feature_capabilities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bm_capability_dependencies" (
    "id" UUID NOT NULL,
    "capabilityId" UUID NOT NULL,
    "targetCapabilityCode" VARCHAR(100) NOT NULL,
    "dependencyType" "BmDependencyType" NOT NULL,
    "configuration" JSONB,
    "tenantId" UUID,

    CONSTRAINT "bm_capability_dependencies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bm_version_features" (
    "id" UUID NOT NULL,
    "applicationId" UUID NOT NULL,
    "applicationVersionId" UUID NOT NULL,
    "featureCode" VARCHAR(100) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "activationStrategy" VARCHAR(50),
    "configuration" JSONB,
    "version" VARCHAR(50) NOT NULL DEFAULT '1.0.0',
    "tenantId" UUID,

    CONSTRAINT "bm_version_features_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bm_version_capabilities" (
    "id" UUID NOT NULL,
    "applicationId" UUID NOT NULL,
    "applicationVersionId" UUID NOT NULL,
    "featureCode" VARCHAR(100) NOT NULL,
    "capabilityCode" VARCHAR(100) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "tenantId" UUID,

    CONSTRAINT "bm_version_capabilities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bm_menus" (
    "id" UUID NOT NULL,
    "applicationId" UUID NOT NULL,
    "applicationVersionId" UUID NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "location" "BmMenuLocation" NOT NULL DEFAULT 'SIDEBAR',
    "status" "BmNavigationStatus" NOT NULL DEFAULT 'DRAFT',
    "version" VARCHAR(50) NOT NULL DEFAULT '1.0.0',
    "tenantId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bm_menus_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bm_navigation_items" (
    "id" UUID NOT NULL,
    "menuId" UUID NOT NULL,
    "parentItemId" UUID,
    "code" VARCHAR(100) NOT NULL,
    "label" VARCHAR(255),
    "itemType" "BmMenuItemType" NOT NULL DEFAULT 'LINK',
    "routePath" TEXT,
    "icon" VARCHAR(50),
    "requiredCapabilities" TEXT[],
    "capabilityOperator" VARCHAR(10) NOT NULL DEFAULT 'ANY',
    "visibility" "BmNavigationVisibility" NOT NULL DEFAULT 'VISIBLE',
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "configuration" JSONB,
    "version" VARCHAR(50),
    "tenantId" UUID,

    CONSTRAINT "bm_navigation_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bm_contracts" (
    "id" UUID NOT NULL,
    "applicationId" UUID NOT NULL,
    "applicationVersionId" UUID NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "version" VARCHAR(50) NOT NULL DEFAULT '1.0.0',
    "status" "BmContractStatus" NOT NULL DEFAULT 'DRAFT',
    "contractHash" VARCHAR(255),
    "manifest" JSONB,
    "tenantId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bm_contracts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bm_contract_versions" (
    "id" UUID NOT NULL,
    "contractId" UUID NOT NULL,
    "versionNumber" VARCHAR(50) NOT NULL,
    "content" JSONB,
    "hash" VARCHAR(255),
    "compatibility" VARCHAR(50),
    "status" "BmContractStatus" NOT NULL DEFAULT 'DRAFT',
    "tenantId" UUID,

    CONSTRAINT "bm_contract_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bm_runtime_manifests" (
    "id" UUID NOT NULL,
    "applicationId" UUID NOT NULL,
    "applicationVersionId" UUID NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "version" VARCHAR(50) NOT NULL DEFAULT '1.0.0',
    "status" "BmNavigationStatus" NOT NULL DEFAULT 'DRAFT',
    "manifest" JSONB,
    "hash" VARCHAR(255),
    "tenantId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bm_runtime_manifests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bm_runtime_bindings" (
    "id" UUID NOT NULL,
    "manifestId" UUID NOT NULL,
    "targetType" VARCHAR(50) NOT NULL,
    "targetId" VARCHAR(255) NOT NULL,
    "configuration" JSONB,
    "status" "BmRuntimeReadiness" NOT NULL DEFAULT 'NOT_READY',
    "tenantId" UUID,

    CONSTRAINT "bm_runtime_bindings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bm_quality_reports" (
    "id" UUID NOT NULL,
    "applicationId" UUID NOT NULL,
    "applicationVersionId" UUID NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "scope" VARCHAR(50),
    "status" "BmqStatus" NOT NULL DEFAULT 'PENDING',
    "score" DOUBLE PRECISION,
    "gateResult" "BmqGateResult",
    "triggeredBy" VARCHAR(100),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "tenantId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bm_quality_reports_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bm_quality_issues" (
    "id" UUID NOT NULL,
    "reportId" UUID,
    "runId" UUID,
    "ruleCode" VARCHAR(100),
    "severity" "BmqSeverity" NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "message" TEXT NOT NULL,
    "details" JSONB,
    "source" VARCHAR(100),
    "waived" BOOLEAN NOT NULL DEFAULT false,
    "waiverReason" TEXT,
    "tenantId" UUID,

    CONSTRAINT "bm_quality_issues_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bm_quality_metrics" (
    "id" UUID NOT NULL,
    "reportId" UUID,
    "key" VARCHAR(100) NOT NULL,
    "label" VARCHAR(255),
    "value" TEXT,
    "numericValue" DOUBLE PRECISION,
    "unit" VARCHAR(50),
    "tenantId" UUID,

    CONSTRAINT "bm_quality_metrics_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bm_quality_gates" (
    "id" UUID NOT NULL,
    "applicationVersionId" UUID NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "blockOnFailure" BOOLEAN NOT NULL DEFAULT true,
    "rules" JSONB,
    "result" "BmqGateResult",
    "tenantId" UUID,

    CONSTRAINT "bm_quality_gates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bm_validation_campaigns" (
    "id" UUID NOT NULL,
    "applicationVersionId" UUID NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "profileCode" VARCHAR(100),
    "status" "BmqStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "trigger" VARCHAR(50),
    "tenantId" UUID,

    CONSTRAINT "bm_validation_campaigns_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bm_validation_runs" (
    "id" UUID NOT NULL,
    "campaignId" UUID NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "status" "BmqStatus" NOT NULL DEFAULT 'PENDING',
    "validatorCode" VARCHAR(100),
    "result" JSONB,
    "durationMs" INTEGER,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "tenantId" UUID,

    CONSTRAINT "bm_validation_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bm_test_suites" (
    "id" UUID NOT NULL,
    "applicationVersionId" UUID NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "status" "BmqStatus" NOT NULL DEFAULT 'PENDING',
    "tenantId" UUID,

    CONSTRAINT "bm_test_suites_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bm_test_cases" (
    "id" UUID NOT NULL,
    "suiteId" UUID NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "status" "BmqStatus" NOT NULL DEFAULT 'PENDING',
    "expectedResult" JSONB,
    "actualResult" JSONB,
    "durationMs" INTEGER,
    "tenantId" UUID,

    CONSTRAINT "bm_test_cases_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bm_test_runs" (
    "id" UUID NOT NULL,
    "testCaseId" UUID NOT NULL,
    "status" "BmqStatus" NOT NULL DEFAULT 'PENDING',
    "result" JSONB,
    "durationMs" INTEGER,
    "executedAt" TIMESTAMP(3),
    "tenantId" UUID,

    CONSTRAINT "bm_test_runs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "bm_entities_applicationVersionId_idx" ON "bm_entities"("applicationVersionId");

CREATE INDEX "bm_entities_tenantId_idx" ON "bm_entities"("tenantId");

CREATE INDEX "bm_entities_status_idx" ON "bm_entities"("status");

CREATE UNIQUE INDEX "bm_entities_tenantId_applicationId_applicationVersionId_cod_key" ON "bm_entities"("tenantId", "applicationId", "applicationVersionId", "code");

CREATE INDEX "bm_fields_entityId_idx" ON "bm_fields"("entityId");

CREATE INDEX "bm_fields_tenantId_idx" ON "bm_fields"("tenantId");

CREATE UNIQUE INDEX "bm_fields_entityId_code_key" ON "bm_fields"("entityId", "code");

CREATE INDEX "bm_field_validations_fieldId_idx" ON "bm_field_validations"("fieldId");

CREATE INDEX "bm_field_validations_tenantId_idx" ON "bm_field_validations"("tenantId");

CREATE INDEX "bm_relations_applicationVersionId_idx" ON "bm_relations"("applicationVersionId");

CREATE INDEX "bm_relations_sourceEntityId_idx" ON "bm_relations"("sourceEntityId");

CREATE INDEX "bm_relations_targetEntityId_idx" ON "bm_relations"("targetEntityId");

CREATE UNIQUE INDEX "bm_relations_applicationVersionId_sourceEntityId_targetEnti_key" ON "bm_relations"("applicationVersionId", "sourceEntityId", "targetEntityId", "code");

CREATE INDEX "bm_constraints_entityId_idx" ON "bm_constraints"("entityId");

CREATE INDEX "bm_constraints_fieldId_idx" ON "bm_constraints"("fieldId");

CREATE INDEX "bm_constraints_tenantId_idx" ON "bm_constraints"("tenantId");

CREATE UNIQUE INDEX "bm_constraints_entityId_code_key" ON "bm_constraints"("entityId", "code");

CREATE INDEX "bm_indexes_entityId_idx" ON "bm_indexes"("entityId");

CREATE INDEX "bm_indexes_tenantId_idx" ON "bm_indexes"("tenantId");

CREATE UNIQUE INDEX "bm_indexes_entityId_code_key" ON "bm_indexes"("entityId", "code");

CREATE INDEX "bm_index_fields_indexId_idx" ON "bm_index_fields"("indexId");

CREATE INDEX "bm_index_fields_fieldId_idx" ON "bm_index_fields"("fieldId");

CREATE UNIQUE INDEX "bm_index_fields_indexId_fieldId_position_key" ON "bm_index_fields"("indexId", "fieldId", "position");

CREATE INDEX "bm_computed_fields_applicationVersionId_idx" ON "bm_computed_fields"("applicationVersionId");

CREATE INDEX "bm_computed_fields_entityId_idx" ON "bm_computed_fields"("entityId");

CREATE INDEX "bm_computed_fields_tenantId_idx" ON "bm_computed_fields"("tenantId");

CREATE UNIQUE INDEX "bm_computed_fields_applicationVersionId_entityId_code_key" ON "bm_computed_fields"("applicationVersionId", "entityId", "code");

CREATE INDEX "bm_features_applicationVersionId_idx" ON "bm_features"("applicationVersionId");

CREATE INDEX "bm_features_tenantId_idx" ON "bm_features"("tenantId");

CREATE INDEX "bm_features_status_idx" ON "bm_features"("status");

CREATE UNIQUE INDEX "bm_features_tenantId_applicationId_applicationVersionId_cod_key" ON "bm_features"("tenantId", "applicationId", "applicationVersionId", "code");

CREATE INDEX "bm_feature_capabilities_featureId_idx" ON "bm_feature_capabilities"("featureId");

CREATE INDEX "bm_feature_capabilities_tenantId_idx" ON "bm_feature_capabilities"("tenantId");

CREATE INDEX "bm_feature_capabilities_status_idx" ON "bm_feature_capabilities"("status");

CREATE UNIQUE INDEX "bm_feature_capabilities_featureId_code_key" ON "bm_feature_capabilities"("featureId", "code");

CREATE INDEX "bm_capability_dependencies_capabilityId_idx" ON "bm_capability_dependencies"("capabilityId");

CREATE UNIQUE INDEX "bm_capability_dependencies_capabilityId_targetCapabilityCod_key" ON "bm_capability_dependencies"("capabilityId", "targetCapabilityCode", "dependencyType");

CREATE INDEX "bm_version_features_applicationVersionId_idx" ON "bm_version_features"("applicationVersionId");

CREATE INDEX "bm_version_features_tenantId_idx" ON "bm_version_features"("tenantId");

CREATE UNIQUE INDEX "bm_version_features_applicationVersionId_featureCode_key" ON "bm_version_features"("applicationVersionId", "featureCode");

CREATE INDEX "bm_version_capabilities_applicationVersionId_idx" ON "bm_version_capabilities"("applicationVersionId");

CREATE INDEX "bm_version_capabilities_tenantId_idx" ON "bm_version_capabilities"("tenantId");

CREATE UNIQUE INDEX "bm_version_capabilities_applicationVersionId_capabilityCode_key" ON "bm_version_capabilities"("applicationVersionId", "capabilityCode");

CREATE INDEX "bm_menus_applicationVersionId_idx" ON "bm_menus"("applicationVersionId");

CREATE INDEX "bm_menus_tenantId_idx" ON "bm_menus"("tenantId");

CREATE INDEX "bm_menus_status_idx" ON "bm_menus"("status");

CREATE UNIQUE INDEX "bm_menus_tenantId_applicationId_applicationVersionId_code_key" ON "bm_menus"("tenantId", "applicationId", "applicationVersionId", "code");

CREATE INDEX "bm_navigation_items_menuId_idx" ON "bm_navigation_items"("menuId");

CREATE INDEX "bm_navigation_items_parentItemId_idx" ON "bm_navigation_items"("parentItemId");

CREATE INDEX "bm_navigation_items_tenantId_idx" ON "bm_navigation_items"("tenantId");

CREATE UNIQUE INDEX "bm_navigation_items_menuId_code_key" ON "bm_navigation_items"("menuId", "code");

CREATE INDEX "bm_contracts_applicationVersionId_idx" ON "bm_contracts"("applicationVersionId");

CREATE INDEX "bm_contracts_tenantId_idx" ON "bm_contracts"("tenantId");

CREATE INDEX "bm_contracts_status_idx" ON "bm_contracts"("status");

CREATE UNIQUE INDEX "bm_contracts_tenantId_applicationId_applicationVersionId_co_key" ON "bm_contracts"("tenantId", "applicationId", "applicationVersionId", "code", "version");

CREATE INDEX "bm_contract_versions_contractId_idx" ON "bm_contract_versions"("contractId");

CREATE UNIQUE INDEX "bm_contract_versions_contractId_versionNumber_key" ON "bm_contract_versions"("contractId", "versionNumber");

CREATE INDEX "bm_runtime_manifests_applicationVersionId_idx" ON "bm_runtime_manifests"("applicationVersionId");

CREATE INDEX "bm_runtime_manifests_tenantId_idx" ON "bm_runtime_manifests"("tenantId");

CREATE INDEX "bm_runtime_manifests_status_idx" ON "bm_runtime_manifests"("status");

CREATE UNIQUE INDEX "bm_runtime_manifests_tenantId_applicationId_applicationVers_key" ON "bm_runtime_manifests"("tenantId", "applicationId", "applicationVersionId", "code");

CREATE INDEX "bm_runtime_bindings_manifestId_idx" ON "bm_runtime_bindings"("manifestId");

CREATE INDEX "bm_runtime_bindings_tenantId_idx" ON "bm_runtime_bindings"("tenantId");

CREATE UNIQUE INDEX "bm_runtime_bindings_manifestId_targetType_targetId_key" ON "bm_runtime_bindings"("manifestId", "targetType", "targetId");

CREATE INDEX "bm_quality_reports_applicationVersionId_idx" ON "bm_quality_reports"("applicationVersionId");

CREATE INDEX "bm_quality_reports_tenantId_idx" ON "bm_quality_reports"("tenantId");

CREATE INDEX "bm_quality_reports_status_idx" ON "bm_quality_reports"("status");

CREATE UNIQUE INDEX "bm_quality_reports_tenantId_applicationVersionId_code_key" ON "bm_quality_reports"("tenantId", "applicationVersionId", "code");

CREATE INDEX "bm_quality_issues_reportId_idx" ON "bm_quality_issues"("reportId");

CREATE INDEX "bm_quality_issues_runId_idx" ON "bm_quality_issues"("runId");

CREATE INDEX "bm_quality_issues_ruleCode_idx" ON "bm_quality_issues"("ruleCode");

CREATE INDEX "bm_quality_issues_severity_idx" ON "bm_quality_issues"("severity");

CREATE INDEX "bm_quality_metrics_reportId_idx" ON "bm_quality_metrics"("reportId");

CREATE INDEX "bm_quality_gates_applicationVersionId_idx" ON "bm_quality_gates"("applicationVersionId");

CREATE INDEX "bm_quality_gates_tenantId_idx" ON "bm_quality_gates"("tenantId");

CREATE UNIQUE INDEX "bm_quality_gates_applicationVersionId_code_key" ON "bm_quality_gates"("applicationVersionId", "code");

CREATE INDEX "bm_validation_campaigns_applicationVersionId_idx" ON "bm_validation_campaigns"("applicationVersionId");

CREATE INDEX "bm_validation_campaigns_tenantId_idx" ON "bm_validation_campaigns"("tenantId");

CREATE UNIQUE INDEX "bm_validation_campaigns_applicationVersionId_code_key" ON "bm_validation_campaigns"("applicationVersionId", "code");

CREATE INDEX "bm_validation_runs_campaignId_idx" ON "bm_validation_runs"("campaignId");

CREATE INDEX "bm_validation_runs_tenantId_idx" ON "bm_validation_runs"("tenantId");

CREATE UNIQUE INDEX "bm_validation_runs_campaignId_code_key" ON "bm_validation_runs"("campaignId", "code");

CREATE INDEX "bm_test_suites_applicationVersionId_idx" ON "bm_test_suites"("applicationVersionId");

CREATE UNIQUE INDEX "bm_test_suites_applicationVersionId_code_key" ON "bm_test_suites"("applicationVersionId", "code");

CREATE INDEX "bm_test_cases_suiteId_idx" ON "bm_test_cases"("suiteId");

CREATE UNIQUE INDEX "bm_test_cases_suiteId_code_key" ON "bm_test_cases"("suiteId", "code");

CREATE INDEX "bm_test_runs_testCaseId_idx" ON "bm_test_runs"("testCaseId");

ALTER TABLE "bm_fields" ADD CONSTRAINT "bm_fields_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "bm_entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bm_field_validations" ADD CONSTRAINT "bm_field_validations_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "bm_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bm_constraints" ADD CONSTRAINT "bm_constraints_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "bm_entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bm_constraints" ADD CONSTRAINT "bm_constraints_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "bm_fields"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "bm_indexes" ADD CONSTRAINT "bm_indexes_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "bm_entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bm_index_fields" ADD CONSTRAINT "bm_index_fields_indexId_fkey" FOREIGN KEY ("indexId") REFERENCES "bm_indexes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bm_computed_fields" ADD CONSTRAINT "bm_computed_fields_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "bm_entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bm_feature_capabilities" ADD CONSTRAINT "bm_feature_capabilities_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "bm_features"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bm_capability_dependencies" ADD CONSTRAINT "bm_capability_dependencies_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "bm_feature_capabilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bm_navigation_items" ADD CONSTRAINT "bm_navigation_items_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "bm_menus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bm_navigation_items" ADD CONSTRAINT "bm_navigation_items_parentItemId_fkey" FOREIGN KEY ("parentItemId") REFERENCES "bm_navigation_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "bm_contract_versions" ADD CONSTRAINT "bm_contract_versions_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "bm_contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bm_runtime_bindings" ADD CONSTRAINT "bm_runtime_bindings_manifestId_fkey" FOREIGN KEY ("manifestId") REFERENCES "bm_runtime_manifests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bm_quality_issues" ADD CONSTRAINT "bm_quality_issues_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "bm_quality_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bm_quality_issues" ADD CONSTRAINT "bm_quality_issues_runId_fkey" FOREIGN KEY ("runId") REFERENCES "bm_validation_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bm_quality_metrics" ADD CONSTRAINT "bm_quality_metrics_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "bm_quality_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bm_validation_runs" ADD CONSTRAINT "bm_validation_runs_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "bm_validation_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bm_test_cases" ADD CONSTRAINT "bm_test_cases_suiteId_fkey" FOREIGN KEY ("suiteId") REFERENCES "bm_test_suites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bm_test_runs" ADD CONSTRAINT "bm_test_runs_testCaseId_fkey" FOREIGN KEY ("testCaseId") REFERENCES "bm_test_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
