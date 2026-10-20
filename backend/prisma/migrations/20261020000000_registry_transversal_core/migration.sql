CREATE TYPE "RegistryNamespace" AS ENUM ('BUSINESS', 'UI', 'AUTOMATION', 'DATA', 'INTEGRATION', 'RUNTIME', 'API', 'PLATFORM');
CREATE TYPE "RegistrySubDomain" AS ENUM (
  'BUSINESS_FEATURE', 'BUSINESS_CAPABILITY', 'BUSINESS_EVENT',
  'UI_COMPONENT', 'UI_ACTION', 'UI_TEMPLATE',
  'AUTOMATION_NODE', 'AUTOMATION_TRIGGER', 'AUTOMATION_ACTION',
  'DATA_PROVIDER', 'DATA_REPOSITORY', 'DATA_CONTRACT', 'DATA_CAPABILITY',
  'INTEGRATION_CONNECTOR', 'INTEGRATION_CONTRACT', 'INTEGRATION_CAPABILITY',
  'RUNTIME_CAPABILITY', 'RUNTIME_SCHEMA',
  'API_CONTRACT', 'API_VERSION', 'API_SCOPE',
  'PLATFORM_CAPABILITY', 'PLATFORM_SCHEMA', 'PLATFORM_SERVICE'
);
CREATE TYPE "RegistryEntryStatus" AS ENUM ('REGISTERED', 'AVAILABLE', 'DEPRECATED', 'DISABLED', 'UNAVAILABLE', 'REMOVED');
CREATE TYPE "RegistryScope" AS ENUM ('GLOBAL', 'TENANT', 'APPLICATION', 'APPLICATION_VERSION', 'ENVIRONMENT');
CREATE TYPE "RegistryProvider" AS ENUM ('CORE', 'BUSINESS_MANAGER', 'UI_BUILDER', 'AUTOMATION', 'DATA_PLATFORM', 'INTEGRATION_HUB', 'PACK_RUNTIME', 'API_MANAGER', 'PLUGIN');
CREATE TYPE "RegistryEntryType" AS ENUM ('FEATURE', 'CAPABILITY', 'EVENT', 'COMPONENT', 'ACTION', 'TEMPLATE', 'NODE', 'TRIGGER', 'PROVIDER', 'REPOSITORY', 'CONTRACT', 'VERSION', 'SCOPE', 'CONNECTOR', 'SCHEMA', 'SERVICE');
CREATE TYPE "RegistryCompatibilityResult" AS ENUM ('COMPATIBLE', 'INCOMPATIBLE', 'DEGRADED', 'UNKNOWN');
CREATE TYPE "RegistryAvailabilityStatus" AS ENUM ('REGISTERED', 'CONFIGURED', 'REACHABLE', 'AVAILABLE', 'DEGRADED', 'UNAVAILABLE');

CREATE TABLE "registry_namespaces" (
  "id" UUID NOT NULL,
  "namespace" "RegistryNamespace" NOT NULL,
  "description" TEXT,
  "authority" "RegistryProvider" NOT NULL,
  "isGlobal" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "registry_namespaces_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "registry_namespaces_namespace_key" ON "registry_namespaces"("namespace");

CREATE TABLE "registry_entries" (
  "id" UUID NOT NULL,
  "namespaceId" UUID NOT NULL,
  "subDomain" "RegistrySubDomain" NOT NULL,
  "key" VARCHAR(150) NOT NULL,
  "version" VARCHAR(50) NOT NULL DEFAULT '1.0.0',
  "type" "RegistryEntryType" NOT NULL,
  "owner" VARCHAR(100) NOT NULL,
  "provider" "RegistryProvider" NOT NULL,
  "scope" "RegistryScope" NOT NULL DEFAULT 'TENANT',
  "scopeId" VARCHAR(100) NOT NULL DEFAULT 'GLOBAL',
  "status" "RegistryEntryStatus" NOT NULL DEFAULT 'REGISTERED',
  "displayName" VARCHAR(255),
  "description" TEXT,
  "schemaRef" VARCHAR(100),
  "metadata" JSONB,
  "compatibility" JSONB,
  "replacementKey" VARCHAR(200),
  "deprecatedSince" TIMESTAMP(3),
  "removalTarget" TIMESTAMP(3),
  "deprecationMessage" TEXT,
  "tenantId" UUID,
  "sourceModule" VARCHAR(100) NOT NULL,
  "sourceRef" VARCHAR(200),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdBy" VARCHAR(100),
  "updatedBy" VARCHAR(100),
  CONSTRAINT "registry_entries_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "registry_entries_namespaceId_fkey" FOREIGN KEY ("namespaceId") REFERENCES "registry_namespaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "registry_entry_unique_key" ON "registry_entries"("namespaceId", "subDomain", "key", "version", "scope", "scopeId");
CREATE UNIQUE INDEX "registry_entry_tenant_unique" ON "registry_entries"("tenantId", "namespaceId", "subDomain", "key", "version");
CREATE INDEX "registry_entries_tenantId_idx" ON "registry_entries"("tenantId");
CREATE INDEX "registry_entries_namespaceId_idx" ON "registry_entries"("namespaceId");
CREATE INDEX "registry_entries_subDomain_idx" ON "registry_entries"("subDomain");
CREATE INDEX "registry_entries_key_idx" ON "registry_entries"("key");
CREATE INDEX "registry_entries_status_idx" ON "registry_entries"("status");
CREATE INDEX "registry_entries_scope_scopeId_idx" ON "registry_entries"("scope", "scopeId");
CREATE INDEX "registry_entries_sourceModule_sourceRef_idx" ON "registry_entries"("sourceModule", "sourceRef");
CREATE INDEX "registry_entries_createdAt_idx" ON "registry_entries"("createdAt");

CREATE TABLE "registry_versions" (
  "id" UUID NOT NULL,
  "entryId" UUID NOT NULL,
  "version" VARCHAR(50) NOT NULL,
  "changelog" TEXT,
  "isLatest" BOOLEAN NOT NULL DEFAULT false,
  "status" "RegistryEntryStatus" NOT NULL DEFAULT 'REGISTERED',
  "metadata" JSONB,
  "tenantId" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdBy" VARCHAR(100),
  CONSTRAINT "registry_versions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "registry_versions_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "registry_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "registry_versions_entryId_version_key" ON "registry_versions"("entryId", "version");
CREATE INDEX "registry_versions_entryId_idx" ON "registry_versions"("entryId");
CREATE INDEX "registry_versions_tenantId_idx" ON "registry_versions"("tenantId");
CREATE INDEX "registry_versions_isLatest_idx" ON "registry_versions"("isLatest");

CREATE TABLE "registry_capabilities" (
  "id" UUID NOT NULL,
  "entryId" UUID NOT NULL,
  "code" VARCHAR(100) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "type" VARCHAR(50) NOT NULL DEFAULT 'FUNCTIONAL',
  "required" BOOLEAN NOT NULL DEFAULT false,
  "metadata" JSONB,
  "tenantId" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "registry_capabilities_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "registry_capabilities_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "registry_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "registry_capabilities_entryId_code_key" ON "registry_capabilities"("entryId", "code");
CREATE INDEX "registry_capabilities_entryId_idx" ON "registry_capabilities"("entryId");
CREATE INDEX "registry_capabilities_code_idx" ON "registry_capabilities"("code");
CREATE INDEX "registry_capabilities_tenantId_idx" ON "registry_capabilities"("tenantId");

CREATE TABLE "registry_providers" (
  "id" UUID NOT NULL,
  "provider" "RegistryProvider" NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "description" TEXT,
  "isCore" BOOLEAN NOT NULL DEFAULT false,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "registry_providers_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "registry_providers_provider_key" ON "registry_providers"("provider");

CREATE TABLE "registry_schemas" (
  "id" UUID NOT NULL,
  "code" VARCHAR(100) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "version" VARCHAR(50) NOT NULL,
  "description" TEXT,
  "definition" JSONB,
  "supportedBy" JSONB,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "tenantId" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdBy" VARCHAR(100),
  "updatedBy" VARCHAR(100),
  CONSTRAINT "registry_schemas_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "registry_schemas_code_key" ON "registry_schemas"("code");
CREATE INDEX "registry_schemas_code_idx" ON "registry_schemas"("code");
CREATE INDEX "registry_schemas_status_idx" ON "registry_schemas"("status");
CREATE INDEX "registry_schemas_tenantId_idx" ON "registry_schemas"("tenantId");

CREATE TABLE "registry_compatibilities" (
  "id" UUID NOT NULL,
  "sourceEntryId" UUID NOT NULL,
  "targetEntryId" UUID,
  "targetSchemaId" UUID,
  "requiredVersion" VARCHAR(50),
  "requiredCapabilities" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "result" "RegistryCompatibilityResult" NOT NULL DEFAULT 'UNKNOWN',
  "details" JSONB,
  "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "checkedBy" VARCHAR(100),
  "tenantId" UUID,
  CONSTRAINT "registry_compatibilities_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "registry_compatibilities_sourceEntryId_fkey" FOREIGN KEY ("sourceEntryId") REFERENCES "registry_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "registry_compatibilities_targetEntryId_fkey" FOREIGN KEY ("targetEntryId") REFERENCES "registry_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "registry_compatibilities_targetSchemaId_fkey" FOREIGN KEY ("targetSchemaId") REFERENCES "registry_schemas"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "registry_compatibilities_sourceEntryId_idx" ON "registry_compatibilities"("sourceEntryId");
CREATE INDEX "registry_compatibilities_targetEntryId_idx" ON "registry_compatibilities"("targetEntryId");
CREATE INDEX "registry_compatibilities_targetSchemaId_idx" ON "registry_compatibilities"("targetSchemaId");
CREATE INDEX "registry_compatibilities_tenantId_idx" ON "registry_compatibilities"("tenantId");
CREATE INDEX "registry_compatibilities_result_idx" ON "registry_compatibilities"("result");

CREATE TABLE "registry_availabilities" (
  "id" UUID NOT NULL,
  "entryId" UUID NOT NULL,
  "environmentId" UUID,
  "environmentCode" VARCHAR(50),
  "registered" BOOLEAN NOT NULL DEFAULT true,
  "configured" BOOLEAN NOT NULL DEFAULT false,
  "reachable" BOOLEAN NOT NULL DEFAULT false,
  "effectiveStatus" "RegistryAvailabilityStatus" NOT NULL DEFAULT 'REGISTERED',
  "providerStatus" VARCHAR(50),
  "lastProbeAt" TIMESTAMP(3),
  "lastProbeResult" JSONB,
  "metadata" JSONB,
  "tenantId" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "registry_availabilities_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "registry_availabilities_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "registry_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "registry_availability_unique" ON "registry_availabilities"("entryId", "environmentId", "environmentCode");
CREATE INDEX "registry_availabilities_entryId_idx" ON "registry_availabilities"("entryId");
CREATE INDEX "registry_availabilities_environmentId_idx" ON "registry_availabilities"("environmentId");
CREATE INDEX "registry_availabilities_environmentCode_idx" ON "registry_availabilities"("environmentCode");
CREATE INDEX "registry_availabilities_effectiveStatus_idx" ON "registry_availabilities"("effectiveStatus");
CREATE INDEX "registry_availabilities_tenantId_idx" ON "registry_availabilities"("tenantId");

CREATE TABLE "registry_diagnostics" (
  "id" UUID NOT NULL,
  "entryId" UUID,
  "severity" VARCHAR(20) NOT NULL,
  "category" VARCHAR(50) NOT NULL,
  "component" VARCHAR(50) NOT NULL,
  "message" TEXT NOT NULL,
  "details" JSONB,
  "resolutionId" UUID,
  "traceId" VARCHAR(100),
  "tenantId" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  "resolvedBy" VARCHAR(100),
  CONSTRAINT "registry_diagnostics_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "registry_diagnostics_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "registry_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "registry_diagnostics_entryId_idx" ON "registry_diagnostics"("entryId");
CREATE INDEX "registry_diagnostics_severity_idx" ON "registry_diagnostics"("severity");
CREATE INDEX "registry_diagnostics_category_idx" ON "registry_diagnostics"("category");
CREATE INDEX "registry_diagnostics_component_idx" ON "registry_diagnostics"("component");
CREATE INDEX "registry_diagnostics_tenantId_idx" ON "registry_diagnostics"("tenantId");
CREATE INDEX "registry_diagnostics_createdAt_idx" ON "registry_diagnostics"("createdAt");
CREATE INDEX "registry_diagnostics_traceId_idx" ON "registry_diagnostics"("traceId");

CREATE TABLE "registry_audit_events" (
  "id" UUID NOT NULL,
  "traceId" VARCHAR(100) NOT NULL,
  "actorId" VARCHAR(100),
  "tenantId" UUID,
  "action" VARCHAR(50) NOT NULL,
  "targetType" VARCHAR(50) NOT NULL,
  "targetId" UUID,
  "result" VARCHAR(20) NOT NULL,
  "reason" TEXT,
  "before" JSONB,
  "after" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "registry_audit_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "registry_audit_events_traceId_idx" ON "registry_audit_events"("traceId");
CREATE INDEX "registry_audit_events_actorId_idx" ON "registry_audit_events"("actorId");
CREATE INDEX "registry_audit_events_tenantId_idx" ON "registry_audit_events"("tenantId");
CREATE INDEX "registry_audit_events_action_idx" ON "registry_audit_events"("action");
CREATE INDEX "registry_audit_events_targetType_targetId_idx" ON "registry_audit_events"("targetType", "targetId");
CREATE INDEX "registry_audit_events_createdAt_idx" ON "registry_audit_events"("createdAt");

INSERT INTO "registry_namespaces" ("id", "namespace", "authority", "isGlobal", "updatedAt")
VALUES
  ('00000000-0000-4000-8000-000000000001', 'BUSINESS', 'BUSINESS_MANAGER', false, CURRENT_TIMESTAMP),
  ('00000000-0000-4000-8000-000000000002', 'UI', 'UI_BUILDER', false, CURRENT_TIMESTAMP),
  ('00000000-0000-4000-8000-000000000003', 'AUTOMATION', 'AUTOMATION', false, CURRENT_TIMESTAMP),
  ('00000000-0000-4000-8000-000000000004', 'DATA', 'DATA_PLATFORM', false, CURRENT_TIMESTAMP),
  ('00000000-0000-4000-8000-000000000005', 'INTEGRATION', 'INTEGRATION_HUB', false, CURRENT_TIMESTAMP),
  ('00000000-0000-4000-8000-000000000006', 'RUNTIME', 'PACK_RUNTIME', false, CURRENT_TIMESTAMP),
  ('00000000-0000-4000-8000-000000000007', 'API', 'API_MANAGER', false, CURRENT_TIMESTAMP),
  ('00000000-0000-4000-8000-000000000008', 'PLATFORM', 'CORE', true, CURRENT_TIMESTAMP);

INSERT INTO "registry_providers" ("id", "provider", "name", "isCore", "updatedAt")
VALUES
  ('00000000-0000-4000-8000-000000000101', 'CORE', 'Platform Core', true, CURRENT_TIMESTAMP),
  ('00000000-0000-4000-8000-000000000102', 'BUSINESS_MANAGER', 'Business Manager', false, CURRENT_TIMESTAMP),
  ('00000000-0000-4000-8000-000000000103', 'UI_BUILDER', 'UI Builder', false, CURRENT_TIMESTAMP),
  ('00000000-0000-4000-8000-000000000104', 'AUTOMATION', 'Automation', false, CURRENT_TIMESTAMP),
  ('00000000-0000-4000-8000-000000000105', 'DATA_PLATFORM', 'Data Platform', false, CURRENT_TIMESTAMP),
  ('00000000-0000-4000-8000-000000000106', 'INTEGRATION_HUB', 'Integration Hub', false, CURRENT_TIMESTAMP),
  ('00000000-0000-4000-8000-000000000107', 'PACK_RUNTIME', 'Pack Runtime', false, CURRENT_TIMESTAMP),
  ('00000000-0000-4000-8000-000000000108', 'API_MANAGER', 'API Manager', false, CURRENT_TIMESTAMP),
  ('00000000-0000-4000-8000-000000000109', 'PLUGIN', 'External Plugin', false, CURRENT_TIMESTAMP);
