-- CreateEnum
CREATE TYPE "EnvironmentType" AS ENUM ('DEVELOPMENT', 'TEST', 'STAGING', 'PRODUCTION');

-- CreateEnum
CREATE TYPE "EnvironmentStatus" AS ENUM ('ACTIVE', 'MAINTENANCE', 'DEGRADED', 'DISABLED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'VALIDATING', 'LOCKED', 'ACTIVE', 'DEPRECATED', 'RETIRED');

-- CreateEnum
CREATE TYPE "ConfigurationScope" AS ENUM ('PLATFORM', 'APPLICATION', 'APPLICATION_VERSION', 'ENVIRONMENT', 'TENANT');

-- CreateEnum
CREATE TYPE "ConfigurationType" AS ENUM ('STRING', 'NUMBER', 'BOOLEAN', 'ENUM', 'JSON', 'URL', 'DURATION');

-- CreateEnum
CREATE TYPE "ConfigurationStatus" AS ENUM ('DRAFT', 'VALIDATING', 'ACTIVE', 'DEPRECATED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SnapshotStatus" AS ENUM ('DRAFT', 'VALIDATING', 'VALID', 'INVALID', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SnapshotHistoryAction" AS ENUM ('CREATED', 'VALIDATED', 'ACTIVATED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ConnectorProviderType" AS ENUM ('REST', 'GRAPHQL', 'DATABASE_ADAPTER', 'FILE', 'MESSAGE_QUEUE', 'CUSTOM_PROVIDER');

-- CreateEnum
CREATE TYPE "ConnectorStatus" AS ENUM ('DRAFT', 'CONFIGURING', 'VALIDATING', 'READY', 'ACTIVE', 'DEGRADED', 'DISABLED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ConnectorHealthStatus" AS ENUM ('HEALTHY', 'WARNING', 'DEGRADED', 'CRITICAL', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ApiStatus" AS ENUM ('DRAFT', 'VALIDATING', 'READY', 'ACTIVE', 'DEPRECATED', 'RETIRED');

-- CreateEnum
CREATE TYPE "ApiAuthenticationType" AS ENUM ('NONE', 'API_KEY', 'BEARER', 'OAUTH2', 'BASIC', 'CUSTOM');

-- CreateEnum
CREATE TYPE "WebhookDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "WebhookStatus" AS ENUM ('DRAFT', 'CONFIGURING', 'VALIDATING', 'READY', 'ACTIVE', 'DISABLED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "WebhookDeliveryStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'RETRYING', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CredentialType" AS ENUM ('API_KEY', 'BASIC_AUTH', 'BEARER_TOKEN', 'OAUTH_CLIENT', 'CERTIFICATE_REFERENCE', 'CUSTOM_SECRET_REFERENCE');

-- CreateEnum
CREATE TYPE "CredentialStatus" AS ENUM ('ACTIVE', 'DISABLED', 'EXPIRED', 'ROTATION_REQUIRED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SynchronizationDirection" AS ENUM ('PULL', 'PUSH', 'BIDIRECTIONAL');

-- CreateEnum
CREATE TYPE "SynchronizationMode" AS ENUM ('FULL', 'INCREMENTAL');

-- CreateEnum
CREATE TYPE "SynchronizationStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'PARTIAL', 'FAILED', 'PAUSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "IntegrationLogDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "IntegrationLogStatus" AS ENUM ('STARTED', 'SUCCEEDED', 'FAILED', 'TIMEOUT', 'RETRYING', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReleaseStatus" AS ENUM ('DRAFT', 'ASSEMBLING', 'VALIDATING', 'READY', 'APPROVED', 'RELEASED', 'SUPERSEDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DeploymentStatus" AS ENUM ('PENDING', 'RUNNING', 'VERIFYING', 'SUCCEEDED', 'FAILED', 'ROLLED_BACK', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DeploymentStrategy" AS ENUM ('STANDARD', 'ROLLING', 'BLUE_GREEN', 'CANARY');

-- CreateEnum
CREATE TYPE "EnvironmentDeploymentStatus" AS ENUM ('ACTIVE', 'DEPLOYING', 'FAILED', 'ROLLED_BACK', 'DRIFTED', 'LOCKED');

-- CreateEnum
CREATE TYPE "DeploymentGateType" AS ENUM ('CONTRACT_COMPATIBILITY', 'SNAPSHOT_VALID', 'CONFIGURATION_VALID', 'BUILD_AVAILABLE', 'TESTS_PASS', 'SECURITY_CHECK', 'ENVIRONMENT_READY', 'HEALTH_PRECHECK', 'MANUAL_APPROVAL', 'CUSTOM_REGISTERED_GATE');

-- CreateEnum
CREATE TYPE "DeploymentGateResult" AS ENUM ('PASSED', 'FAILED', 'WARNING', 'SKIPPED', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "RollbackType" AS ENUM ('MANUAL_ROLLBACK', 'AUTOMATIC_ROLLBACK', 'REDEPLOY_PREVIOUS');

-- CreateEnum
CREATE TYPE "RollbackStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DeploymentHistoryAction" AS ENUM ('CREATED', 'VALIDATING', 'GATE_CHECK', 'STARTED', 'HEALTH_CHECK', 'SUCCEEDED', 'FAILED', 'ROLLBACK_STARTED', 'ROLLBACK_COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "environments" (
    "id" UUID NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "type" "EnvironmentType" NOT NULL,
    "status" "EnvironmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "region" VARCHAR(100),
    "baseUrl" VARCHAR(500),
    "configurationRef" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "environments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" UUID NOT NULL,
    "contractCode" VARCHAR(100) NOT NULL,
    "contractVersion" VARCHAR(50) NOT NULL,
    "ownerTeam" VARCHAR(100) NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'DRAFT',
    "schema" JSONB NOT NULL,
    "compatibilityPolicy" JSONB NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "deprecatedAt" TIMESTAMP(3),
    "hash" VARCHAR(128),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configurations" (
    "id" UUID NOT NULL,
    "key" VARCHAR(150) NOT NULL,
    "scope" "ConfigurationScope" NOT NULL,
    "scopeId" VARCHAR(100) NOT NULL,
    "type" "ConfigurationType" NOT NULL,
    "value" JSONB,
    "defaultValue" JSONB,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "schema" JSONB,
    "version" VARCHAR(50) NOT NULL DEFAULT '1.0.0',
    "status" "ConfigurationStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snapshots" (
    "id" UUID NOT NULL,
    "applicationId" UUID NOT NULL,
    "applicationVersionId" UUID NOT NULL,
    "environmentId" UUID NOT NULL,
    "contracts" JSONB NOT NULL,
    "configuration" JSONB NOT NULL,
    "metadata" JSONB,
    "createdBy" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hash" VARCHAR(128) NOT NULL,
    "status" "SnapshotStatus" NOT NULL DEFAULT 'DRAFT',

    CONSTRAINT "snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snapshot_history" (
    "id" UUID NOT NULL,
    "snapshotId" UUID NOT NULL,
    "action" "SnapshotHistoryAction" NOT NULL,
    "createdBy" VARCHAR(100) NOT NULL,
    "traceId" VARCHAR(100),
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "snapshot_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connectors" (
    "id" UUID NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "providerType" "ConnectorProviderType" NOT NULL,
    "contractVersion" VARCHAR(50),
    "status" "ConnectorStatus" NOT NULL DEFAULT 'DRAFT',
    "configurationSchema" JSONB,
    "credentialRef" VARCHAR(255),
    "capabilities" JSONB,
    "health" "ConnectorHealthStatus" NOT NULL DEFAULT 'UNKNOWN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "connectors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_definitions" (
    "id" UUID NOT NULL,
    "apiCode" VARCHAR(100) NOT NULL,
    "version" VARCHAR(50) NOT NULL,
    "basePath" VARCHAR(255) NOT NULL,
    "operations" JSONB NOT NULL,
    "authentication" "ApiAuthenticationType" NOT NULL DEFAULT 'BEARER',
    "authorization" JSONB,
    "rateLimit" JSONB,
    "requestSchema" JSONB,
    "responseSchema" JSONB,
    "status" "ApiStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "api_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhooks" (
    "id" UUID NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "direction" "WebhookDirection" NOT NULL,
    "event" VARCHAR(150) NOT NULL,
    "endpoint" VARCHAR(500) NOT NULL,
    "status" "WebhookStatus" NOT NULL DEFAULT 'DRAFT',
    "secretRef" VARCHAR(255),
    "signaturePolicy" JSONB,
    "retryPolicy" JSONB,
    "timeout" INTEGER,
    "filters" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_deliveries" (
    "id" UUID NOT NULL,
    "webhookId" UUID NOT NULL,
    "eventId" VARCHAR(150) NOT NULL,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "status" "WebhookDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "httpStatus" INTEGER,
    "duration" INTEGER,
    "nextRetryAt" TIMESTAMP(3),
    "traceId" VARCHAR(100),
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credential_references" (
    "id" UUID NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "type" "CredentialType" NOT NULL,
    "provider" VARCHAR(100) NOT NULL,
    "status" "CredentialStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastRotatedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "metadataSafe" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credential_references_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "synchronizations" (
    "id" UUID NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "connectorId" UUID NOT NULL,
    "source" VARCHAR(255) NOT NULL,
    "target" VARCHAR(255) NOT NULL,
    "direction" "SynchronizationDirection" NOT NULL,
    "mode" "SynchronizationMode" NOT NULL,
    "schedule" VARCHAR(100),
    "mappingRef" VARCHAR(255),
    "conflictPolicy" JSONB,
    "batchSize" INTEGER,
    "status" "SynchronizationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "synchronizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_logs" (
    "id" UUID NOT NULL,
    "traceId" VARCHAR(100) NOT NULL,
    "tenantId" VARCHAR(100),
    "connectorId" UUID,
    "operation" VARCHAR(255) NOT NULL,
    "direction" "IntegrationLogDirection" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "status" "IntegrationLogStatus" NOT NULL,
    "errorCode" VARCHAR(100),
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integration_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "releases" (
    "id" UUID NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "version" VARCHAR(50) NOT NULL,
    "applicationId" UUID NOT NULL,
    "applicationVersionId" UUID NOT NULL,
    "snapshotId" UUID NOT NULL,
    "artifactRefs" JSONB NOT NULL,
    "contractVersions" JSONB NOT NULL,
    "configurationVersion" VARCHAR(50) NOT NULL,
    "status" "ReleaseStatus" NOT NULL DEFAULT 'DRAFT',
    "createdBy" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),

    CONSTRAINT "releases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deployments" (
    "id" UUID NOT NULL,
    "releaseId" UUID NOT NULL,
    "environmentId" UUID NOT NULL,
    "status" "DeploymentStatus" NOT NULL DEFAULT 'PENDING',
    "strategy" "DeploymentStrategy" NOT NULL DEFAULT 'STANDARD',
    "idempotencyKey" VARCHAR(150) NOT NULL,
    "startedBy" VARCHAR(100) NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "healthStatus" VARCHAR(50),
    "traceId" VARCHAR(100),

    CONSTRAINT "deployments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "environment_deployments" (
    "id" UUID NOT NULL,
    "environmentId" UUID NOT NULL,
    "applicationId" UUID NOT NULL,
    "currentReleaseId" UUID,
    "previousReleaseId" UUID,
    "deploymentId" UUID,
    "deployedAt" TIMESTAMP(3),
    "healthStatus" VARCHAR(50),
    "status" "EnvironmentDeploymentStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "environment_deployments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deployment_gates" (
    "id" UUID NOT NULL,
    "deploymentId" UUID NOT NULL,
    "type" "DeploymentGateType" NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "result" "DeploymentGateResult" NOT NULL DEFAULT 'NOT_APPLICABLE',
    "required" BOOLEAN NOT NULL DEFAULT true,
    "message" TEXT,
    "executedBy" VARCHAR(100),
    "executedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deployment_gates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rollbacks" (
    "id" UUID NOT NULL,
    "deploymentId" UUID NOT NULL,
    "fromReleaseId" UUID NOT NULL,
    "toReleaseId" UUID NOT NULL,
    "type" "RollbackType" NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "RollbackStatus" NOT NULL DEFAULT 'PENDING',
    "startedBy" VARCHAR(100) NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "traceId" VARCHAR(100),
    "metadata" JSONB,

    CONSTRAINT "rollbacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deployment_history" (
    "id" UUID NOT NULL,
    "traceId" VARCHAR(100) NOT NULL,
    "releaseId" UUID,
    "deploymentId" UUID,
    "applicationId" UUID,
    "environmentId" UUID,
    "action" "DeploymentHistoryAction" NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "actor" VARCHAR(100),
    "errorCode" VARCHAR(100),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deployment_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "environments_code_key" ON "environments"("code");

-- CreateIndex
CREATE INDEX "environments_type_idx" ON "environments"("type");

-- CreateIndex
CREATE INDEX "environments_status_idx" ON "environments"("status");

-- CreateIndex
CREATE INDEX "contracts_contractCode_idx" ON "contracts"("contractCode");

-- CreateIndex
CREATE INDEX "contracts_status_idx" ON "contracts"("status");

-- CreateIndex
CREATE INDEX "contracts_ownerTeam_idx" ON "contracts"("ownerTeam");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_contractCode_contractVersion_key" ON "contracts"("contractCode", "contractVersion");

-- CreateIndex
CREATE INDEX "configurations_key_idx" ON "configurations"("key");

-- CreateIndex
CREATE INDEX "configurations_scope_scopeId_idx" ON "configurations"("scope", "scopeId");

-- CreateIndex
CREATE INDEX "configurations_status_idx" ON "configurations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "configurations_key_scope_scopeId_version_key" ON "configurations"("key", "scope", "scopeId", "version");

-- CreateIndex
CREATE INDEX "snapshots_applicationId_idx" ON "snapshots"("applicationId");

-- CreateIndex
CREATE INDEX "snapshots_applicationVersionId_idx" ON "snapshots"("applicationVersionId");

-- CreateIndex
CREATE INDEX "snapshots_environmentId_idx" ON "snapshots"("environmentId");

-- CreateIndex
CREATE INDEX "snapshots_status_idx" ON "snapshots"("status");

-- CreateIndex
CREATE INDEX "snapshots_createdAt_idx" ON "snapshots"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "snapshots_applicationVersionId_environmentId_hash_key" ON "snapshots"("applicationVersionId", "environmentId", "hash");

-- CreateIndex
CREATE INDEX "snapshot_history_snapshotId_idx" ON "snapshot_history"("snapshotId");

-- CreateIndex
CREATE INDEX "snapshot_history_action_idx" ON "snapshot_history"("action");

-- CreateIndex
CREATE INDEX "snapshot_history_createdAt_idx" ON "snapshot_history"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "connectors_code_key" ON "connectors"("code");

-- CreateIndex
CREATE INDEX "connectors_providerType_idx" ON "connectors"("providerType");

-- CreateIndex
CREATE INDEX "connectors_status_idx" ON "connectors"("status");

-- CreateIndex
CREATE INDEX "connectors_health_idx" ON "connectors"("health");

-- CreateIndex
CREATE INDEX "api_definitions_apiCode_idx" ON "api_definitions"("apiCode");

-- CreateIndex
CREATE INDEX "api_definitions_status_idx" ON "api_definitions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "api_definitions_apiCode_version_key" ON "api_definitions"("apiCode", "version");

-- CreateIndex
CREATE UNIQUE INDEX "webhooks_code_key" ON "webhooks"("code");

-- CreateIndex
CREATE INDEX "webhooks_direction_idx" ON "webhooks"("direction");

-- CreateIndex
CREATE INDEX "webhooks_event_idx" ON "webhooks"("event");

-- CreateIndex
CREATE INDEX "webhooks_status_idx" ON "webhooks"("status");

-- CreateIndex
CREATE INDEX "webhook_deliveries_webhookId_idx" ON "webhook_deliveries"("webhookId");

-- CreateIndex
CREATE INDEX "webhook_deliveries_eventId_idx" ON "webhook_deliveries"("eventId");

-- CreateIndex
CREATE INDEX "webhook_deliveries_status_idx" ON "webhook_deliveries"("status");

-- CreateIndex
CREATE INDEX "webhook_deliveries_traceId_idx" ON "webhook_deliveries"("traceId");

-- CreateIndex
CREATE INDEX "webhook_deliveries_createdAt_idx" ON "webhook_deliveries"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "credential_references_code_key" ON "credential_references"("code");

-- CreateIndex
CREATE INDEX "credential_references_type_idx" ON "credential_references"("type");

-- CreateIndex
CREATE INDEX "credential_references_provider_idx" ON "credential_references"("provider");

-- CreateIndex
CREATE INDEX "credential_references_status_idx" ON "credential_references"("status");

-- CreateIndex
CREATE INDEX "credential_references_expiresAt_idx" ON "credential_references"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "synchronizations_code_key" ON "synchronizations"("code");

-- CreateIndex
CREATE INDEX "synchronizations_connectorId_idx" ON "synchronizations"("connectorId");

-- CreateIndex
CREATE INDEX "synchronizations_direction_idx" ON "synchronizations"("direction");

-- CreateIndex
CREATE INDEX "synchronizations_mode_idx" ON "synchronizations"("mode");

-- CreateIndex
CREATE INDEX "synchronizations_status_idx" ON "synchronizations"("status");

-- CreateIndex
CREATE INDEX "integration_logs_traceId_idx" ON "integration_logs"("traceId");

-- CreateIndex
CREATE INDEX "integration_logs_tenantId_idx" ON "integration_logs"("tenantId");

-- CreateIndex
CREATE INDEX "integration_logs_connectorId_idx" ON "integration_logs"("connectorId");

-- CreateIndex
CREATE INDEX "integration_logs_status_idx" ON "integration_logs"("status");

-- CreateIndex
CREATE INDEX "integration_logs_errorCode_idx" ON "integration_logs"("errorCode");

-- CreateIndex
CREATE INDEX "integration_logs_startedAt_idx" ON "integration_logs"("startedAt");

-- CreateIndex
CREATE INDEX "releases_applicationId_idx" ON "releases"("applicationId");

-- CreateIndex
CREATE INDEX "releases_applicationVersionId_idx" ON "releases"("applicationVersionId");

-- CreateIndex
CREATE INDEX "releases_snapshotId_idx" ON "releases"("snapshotId");

-- CreateIndex
CREATE INDEX "releases_status_idx" ON "releases"("status");

-- CreateIndex
CREATE INDEX "releases_createdAt_idx" ON "releases"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "releases_code_version_key" ON "releases"("code", "version");

-- CreateIndex
CREATE UNIQUE INDEX "deployments_idempotencyKey_key" ON "deployments"("idempotencyKey");

-- CreateIndex
CREATE INDEX "deployments_releaseId_idx" ON "deployments"("releaseId");

-- CreateIndex
CREATE INDEX "deployments_environmentId_idx" ON "deployments"("environmentId");

-- CreateIndex
CREATE INDEX "deployments_status_idx" ON "deployments"("status");

-- CreateIndex
CREATE INDEX "deployments_strategy_idx" ON "deployments"("strategy");

-- CreateIndex
CREATE INDEX "deployments_traceId_idx" ON "deployments"("traceId");

-- CreateIndex
CREATE INDEX "deployments_startedAt_idx" ON "deployments"("startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "environment_deployments_deploymentId_key" ON "environment_deployments"("deploymentId");

-- CreateIndex
CREATE INDEX "environment_deployments_environmentId_idx" ON "environment_deployments"("environmentId");

-- CreateIndex
CREATE INDEX "environment_deployments_applicationId_idx" ON "environment_deployments"("applicationId");

-- CreateIndex
CREATE INDEX "environment_deployments_currentReleaseId_idx" ON "environment_deployments"("currentReleaseId");

-- CreateIndex
CREATE INDEX "environment_deployments_status_idx" ON "environment_deployments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "environment_deployments_environmentId_applicationId_key" ON "environment_deployments"("environmentId", "applicationId");

-- CreateIndex
CREATE INDEX "deployment_gates_deploymentId_idx" ON "deployment_gates"("deploymentId");

-- CreateIndex
CREATE INDEX "deployment_gates_type_idx" ON "deployment_gates"("type");

-- CreateIndex
CREATE INDEX "deployment_gates_result_idx" ON "deployment_gates"("result");

-- CreateIndex
CREATE INDEX "deployment_gates_required_idx" ON "deployment_gates"("required");

-- CreateIndex
CREATE INDEX "rollbacks_deploymentId_idx" ON "rollbacks"("deploymentId");

-- CreateIndex
CREATE INDEX "rollbacks_fromReleaseId_idx" ON "rollbacks"("fromReleaseId");

-- CreateIndex
CREATE INDEX "rollbacks_toReleaseId_idx" ON "rollbacks"("toReleaseId");

-- CreateIndex
CREATE INDEX "rollbacks_status_idx" ON "rollbacks"("status");

-- CreateIndex
CREATE INDEX "rollbacks_type_idx" ON "rollbacks"("type");

-- CreateIndex
CREATE INDEX "rollbacks_traceId_idx" ON "rollbacks"("traceId");

-- CreateIndex
CREATE INDEX "rollbacks_startedAt_idx" ON "rollbacks"("startedAt");

-- CreateIndex
CREATE INDEX "deployment_history_traceId_idx" ON "deployment_history"("traceId");

-- CreateIndex
CREATE INDEX "deployment_history_releaseId_idx" ON "deployment_history"("releaseId");

-- CreateIndex
CREATE INDEX "deployment_history_deploymentId_idx" ON "deployment_history"("deploymentId");

-- CreateIndex
CREATE INDEX "deployment_history_applicationId_idx" ON "deployment_history"("applicationId");

-- CreateIndex
CREATE INDEX "deployment_history_environmentId_idx" ON "deployment_history"("environmentId");

-- CreateIndex
CREATE INDEX "deployment_history_action_idx" ON "deployment_history"("action");

-- CreateIndex
CREATE INDEX "deployment_history_status_idx" ON "deployment_history"("status");

-- CreateIndex
CREATE INDEX "deployment_history_createdAt_idx" ON "deployment_history"("createdAt");

-- AddForeignKey
ALTER TABLE "snapshots" ADD CONSTRAINT "snapshots_applicationVersionId_fkey" FOREIGN KEY ("applicationVersionId") REFERENCES "application_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snapshots" ADD CONSTRAINT "snapshots_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "environments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snapshot_history" ADD CONSTRAINT "snapshot_history_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES "webhooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "synchronizations" ADD CONSTRAINT "synchronizations_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "connectors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_logs" ADD CONSTRAINT "integration_logs_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "connectors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "releases" ADD CONSTRAINT "releases_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "releases" ADD CONSTRAINT "releases_applicationVersionId_fkey" FOREIGN KEY ("applicationVersionId") REFERENCES "application_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "releases" ADD CONSTRAINT "releases_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "snapshots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "releases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "environments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "environment_deployments" ADD CONSTRAINT "environment_deployments_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "environments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "environment_deployments" ADD CONSTRAINT "environment_deployments_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "environment_deployments" ADD CONSTRAINT "environment_deployments_deploymentId_fkey" FOREIGN KEY ("deploymentId") REFERENCES "deployments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "environment_deployments" ADD CONSTRAINT "environment_deployments_currentReleaseId_fkey" FOREIGN KEY ("currentReleaseId") REFERENCES "releases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "environment_deployments" ADD CONSTRAINT "environment_deployments_previousReleaseId_fkey" FOREIGN KEY ("previousReleaseId") REFERENCES "releases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployment_gates" ADD CONSTRAINT "deployment_gates_deploymentId_fkey" FOREIGN KEY ("deploymentId") REFERENCES "deployments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rollbacks" ADD CONSTRAINT "rollbacks_deploymentId_fkey" FOREIGN KEY ("deploymentId") REFERENCES "deployments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rollbacks" ADD CONSTRAINT "rollbacks_fromReleaseId_fkey" FOREIGN KEY ("fromReleaseId") REFERENCES "releases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rollbacks" ADD CONSTRAINT "rollbacks_toReleaseId_fkey" FOREIGN KEY ("toReleaseId") REFERENCES "releases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployment_history" ADD CONSTRAINT "deployment_history_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "releases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployment_history" ADD CONSTRAINT "deployment_history_deploymentId_fkey" FOREIGN KEY ("deploymentId") REFERENCES "deployments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployment_history" ADD CONSTRAINT "deployment_history_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployment_history" ADD CONSTRAINT "deployment_history_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "environments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
