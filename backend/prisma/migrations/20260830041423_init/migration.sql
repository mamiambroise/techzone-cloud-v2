-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'LOCKED', 'DISABLED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "IdentityType" AS ENUM ('HUMAN', 'SERVICE_ACCOUNT', 'APPLICATION', 'DEVICE', 'SYSTEM', 'EXTERNAL_IDENTITY', 'API_CLIENT', 'AUTOMATION', 'AGENT');

-- CreateEnum
CREATE TYPE "IdentityStatus" AS ENUM ('PENDING', 'VERIFIED', 'ACTIVE', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'DISABLED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "OrganizationStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SiteStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('INVITED', 'PENDING', 'ACTIVE', 'SUSPENDED', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "GroupType" AS ENUM ('SYSTEM', 'STATIC', 'DYNAMIC');

-- CreateEnum
CREATE TYPE "RoleStatus" AS ENUM ('ACTIVE', 'DISABLED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PolicyEffect" AS ENUM ('ALLOW', 'DENY', 'STEP_UP', 'APPROVAL_REQUIRED');

-- CreateEnum
CREATE TYPE "PolicyStatus" AS ENUM ('DRAFT', 'ACTIVE', 'DISABLED', 'SUPERSEDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AuthorizationResult" AS ENUM ('ALLOW', 'DENY', 'STEP_UP_REQUIRED', 'APPROVAL_REQUIRED');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "TokenStatus" AS ENUM ('ACTIVE', 'ROTATED', 'REVOKED', 'EXPIRED', 'REUSED');

-- CreateEnum
CREATE TYPE "CredentialType" AS ENUM ('PASSWORD', 'PASSKEY', 'API_KEY', 'EXTERNAL', 'RECOVERY');

-- CreateEnum
CREATE TYPE "CredentialStatus" AS ENUM ('ACTIVE', 'DISABLED', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "MfaType" AS ENUM ('TOTP', 'EMAIL_OTP', 'SMS_OTP', 'PASSKEY');

-- CreateEnum
CREATE TYPE "DeviceTrustLevel" AS ENUM ('UNKNOWN', 'UNTRUSTED', 'TRUSTED', 'PRIVILEGED');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "Environment" AS ENUM ('DEVELOPMENT', 'TEST', 'STAGING', 'PRODUCTION');

-- CreateEnum
CREATE TYPE "ServiceAccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DISABLED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SecuritySeverity" AS ENUM ('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('DRAFT', 'ACTIVE', 'DISABLED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "BillingInterval" AS ENUM ('MONTHLY', 'QUARTERLY', 'SEMESTER', 'YEARLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'OPEN', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'VOID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateEnum
CREATE TYPE "EntitlementValueType" AS ENUM ('BOOLEAN', 'INTEGER', 'DECIMAL', 'STRING', 'JSON');

-- CreateEnum
CREATE TYPE "AdminActionStatus" AS ENUM ('REQUESTED', 'PENDING_APPROVAL', 'APPROVED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DiagnosticStatus" AS ENUM ('HEALTHY', 'DEGRADED', 'WARNING', 'CRITICAL', 'UNAVAILABLE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "PlatformServiceStatus" AS ENUM ('STARTING', 'HEALTHY', 'DEGRADED', 'UNAVAILABLE', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "DelegationStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'REVOKED', 'EXPIRED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "primaryEmail" TEXT,
    "phone" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "displayName" TEXT,
    "avatarRef" TEXT,
    "locale" TEXT,
    "timezone" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
    "defaultTenantId" TEXT,
    "metadata" JSONB,
    "statusChangedAt" TIMESTAMP(3),
    "statusChangedBy" TEXT,
    "statusChangedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,
    "archivedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Identity" (
    "id" TEXT NOT NULL,
    "type" "IdentityType" NOT NULL,
    "status" "IdentityStatus" NOT NULL DEFAULT 'PENDING',
    "provider" TEXT,
    "subject" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "confidence" DOUBLE PRECISION,
    "verifiedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "statusChangedAt" TIMESTAMP(3),
    "statusChangedBy" TEXT,
    "statusChangedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,
    "archivedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Identity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserIdentity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "identityId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "linkedBy" TEXT,
    "unlinkedAt" TIMESTAMP(3),
    "unlinkedBy" TEXT,

    CONSTRAINT "UserIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalIdentityLink" (
    "id" TEXT NOT NULL,
    "identityId" TEXT NOT NULL,
    "providerType" TEXT NOT NULL,
    "providerInstanceId" TEXT NOT NULL,
    "externalSubjectId" TEXT NOT NULL,
    "externalEntityType" TEXT,
    "confidence" DOUBLE PRECISION,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "lastSyncAt" TIMESTAMP(3),
    "disabledAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalIdentityLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "TenantStatus" NOT NULL DEFAULT 'PENDING',
    "locale" TEXT,
    "timezone" TEXT,
    "metadata" JSONB,
    "statusChangedAt" TIMESTAMP(3),
    "statusChangedBy" TEXT,
    "statusChangedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,
    "archivedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "OrganizationStatus" NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB,
    "statusChangedAt" TIMESTAMP(3),
    "statusChangedBy" TEXT,
    "statusChangedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,
    "archivedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "SiteStatus" NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB,
    "statusChangedAt" TIMESTAMP(3),
    "statusChangedBy" TEXT,
    "statusChangedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "organizationId" TEXT,
    "siteId" TEXT,
    "status" "MembershipStatus" NOT NULL DEFAULT 'INVITED',
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "joinedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "revokedBy" TEXT,
    "revokeReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "organizationId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "GroupType" NOT NULL DEFAULT 'STATIC',
    "dynamicRule" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,
    "archivedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupMember" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "removedAt" TIMESTAMP(3),
    "removedBy" TEXT,

    CONSTRAINT "GroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "critical" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "RoleStatus" NOT NULL DEFAULT 'ACTIVE',
    "system" BOOLEAN NOT NULL DEFAULT false,
    "privileged" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "statusChangedAt" TIMESTAMP(3),
    "statusChangedBy" TEXT,
    "statusChangedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,
    "archivedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grantedBy" TEXT,
    "revokedAt" TIMESTAMP(3),
    "revokedBy" TEXT,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "RoleAssignment" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "userId" TEXT,
    "groupId" TEXT,
    "serviceAccountId" TEXT,
    "tenantId" TEXT,
    "organizationId" TEXT,
    "siteId" TEXT,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "temporary" BOOLEAN NOT NULL DEFAULT false,
    "delegated" BOOLEAN NOT NULL DEFAULT false,
    "assignedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "revokedBy" TEXT,
    "revokeReason" TEXT,

    CONSTRAINT "RoleAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessPolicy" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "PolicyStatus" NOT NULL DEFAULT 'DRAFT',
    "effect" "PolicyEffect" NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "resource" TEXT,
    "action" TEXT,
    "subjectType" TEXT,
    "subjectRef" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveUntil" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "supersededById" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "AccessPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyCondition" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "attribute" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "value" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,

    CONSTRAINT "PolicyCondition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthorizationDecision" (
    "id" TEXT NOT NULL,
    "traceId" TEXT NOT NULL,
    "userId" TEXT,
    "identityId" TEXT,
    "tenantId" TEXT,
    "organizationId" TEXT,
    "siteId" TEXT,
    "applicationId" TEXT,
    "environment" "Environment",
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "result" "AuthorizationResult" NOT NULL,
    "matchedRoleIds" JSONB,
    "matchedPermissionIds" JSONB,
    "matchedPolicyIds" JSONB,
    "reason" JSONB,
    "riskLevel" "RiskLevel",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthorizationDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Credential" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "CredentialType" NOT NULL,
    "status" "CredentialStatus" NOT NULL DEFAULT 'ACTIVE',
    "secretHash" TEXT,
    "secretRef" TEXT,
    "identifier" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "revokedBy" TEXT,
    "revokeReason" TEXT,
    "lastUsedAt" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "Credential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fingerprintHash" TEXT,
    "name" TEXT,
    "deviceType" TEXT,
    "trustLevel" "DeviceTrustLevel" NOT NULL DEFAULT 'UNKNOWN',
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trustedAt" TIMESTAMP(3),
    "trustedBy" TEXT,
    "revokedAt" TIMESTAMP(3),
    "revokedBy" TEXT,
    "revokeReason" TEXT,
    "metadata" JSONB,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT,
    "organizationId" TEXT,
    "siteId" TEXT,
    "applicationId" TEXT,
    "environment" "Environment",
    "deviceId" TEXT,
    "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "authenticationLevel" TEXT,
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'LOW',
    "ipHash" TEXT,
    "userAgentHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "idleExpiresAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "revokedBy" TEXT,
    "revokeReason" TEXT,
    "statusChangedAt" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "status" "TokenStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "rotatedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "revokeReason" TEXT,
    "replacedByTokenId" TEXT,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MfaMethod" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "MfaType" NOT NULL,
    "label" TEXT,
    "secretRef" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "disabledAt" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "MfaMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecoveryCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "RecoveryCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceAccount" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "identityId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "ServiceAccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB,
    "statusChangedAt" TIMESTAMP(3),
    "statusChangedBy" TEXT,
    "statusChangedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,
    "archivedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ServiceAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceAccountCredential" (
    "id" TEXT NOT NULL,
    "serviceAccountId" TEXT NOT NULL,
    "keyId" TEXT NOT NULL,
    "secretHash" TEXT,
    "secretRef" TEXT,
    "status" "CredentialStatus" NOT NULL DEFAULT 'ACTIVE',
    "scopes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "revokedBy" TEXT,
    "revokeReason" TEXT,

    CONSTRAINT "ServiceAccountCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityEvent" (
    "id" TEXT NOT NULL,
    "traceId" TEXT,
    "type" TEXT NOT NULL,
    "severity" "SecuritySeverity" NOT NULL,
    "userId" TEXT,
    "identityId" TEXT,
    "tenantId" TEXT,
    "organizationId" TEXT,
    "siteId" TEXT,
    "sessionId" TEXT,
    "deviceId" TEXT,
    "riskLevel" "RiskLevel",
    "source" TEXT,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContextSnapshot" (
    "id" TEXT NOT NULL,
    "traceId" TEXT,
    "userId" TEXT NOT NULL,
    "identityId" TEXT,
    "tenantId" TEXT,
    "organizationId" TEXT,
    "siteId" TEXT,
    "applicationId" TEXT,
    "environment" "Environment",
    "sessionId" TEXT,
    "roles" JSONB NOT NULL,
    "permissions" JSONB NOT NULL,
    "policies" JSONB,
    "authentication" JSONB NOT NULL,
    "security" JSONB NOT NULL,
    "subscriptionContext" JSONB,
    "entitlementContext" JSONB,
    "sourceRevision" TEXT,
    "resolvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "ContextSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContextSwitchEvent" (
    "id" TEXT NOT NULL,
    "traceId" TEXT,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT,
    "fromTenantId" TEXT,
    "fromOrganizationId" TEXT,
    "fromSiteId" TEXT,
    "toTenantId" TEXT,
    "toOrganizationId" TEXT,
    "toSiteId" TEXT,
    "previousContextId" TEXT,
    "resolvedContextId" TEXT,
    "result" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContextSwitchEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContextInvalidation" (
    "id" TEXT NOT NULL,
    "subjectType" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "tenantId" TEXT,
    "reason" TEXT NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "sourceEventType" TEXT,
    "sourceEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "ContextInvalidation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "traceId" TEXT NOT NULL,
    "actorId" TEXT,
    "effectiveIdentityId" TEXT,
    "effectiveUserId" TEXT,
    "tenantId" TEXT,
    "organizationId" TEXT,
    "siteId" TEXT,
    "sessionId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "result" TEXT NOT NULL,
    "reason" TEXT,
    "before" JSONB,
    "after" JSONB,
    "metadata" JSONB,
    "previousHash" TEXT,
    "eventHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboxEvent" (
    "id" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "traceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,

    CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "PlanStatus" NOT NULL DEFAULT 'DRAFT',
    "billingInterval" "BillingInterval" NOT NULL DEFAULT 'MONTHLY',
    "price" DECIMAL(18,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'MGA',
    "trialDays" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,
    "archivedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanEntitlement" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "featureCode" TEXT NOT NULL,
    "valueType" "EntitlementValueType" NOT NULL DEFAULT 'BOOLEAN',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "integerValue" INTEGER,
    "decimalValue" DECIMAL(18,4),
    "stringValue" TEXT,
    "jsonValue" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanEntitlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "applicationCode" TEXT,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "trialEndsAt" TIMESTAMP(3),
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "suspendedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelledBy" TEXT,
    "cancellationReason" TEXT,
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionEntitlementOverride" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "featureCode" TEXT NOT NULL,
    "valueType" "EntitlementValueType" NOT NULL DEFAULT 'BOOLEAN',
    "enabled" BOOLEAN,
    "integerValue" INTEGER,
    "decimalValue" DECIMAL(18,4),
    "stringValue" TEXT,
    "jsonValue" JSONB,
    "reason" TEXT,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "SubscriptionEntitlementOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotaUsage" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "featureCode" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "usedValue" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "limitValue" DECIMAL(18,4),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuotaUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "invoiceNumber" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "currency" VARCHAR(3) NOT NULL DEFAULT 'MGA',
    "subtotal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "taxTotal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "discountTotal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "amountPaid" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "amountDue" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "issuedAt" TIMESTAMP(3),
    "dueAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(18,2) NOT NULL,
    "subtotal" DECIMAL(18,2) NOT NULL,
    "taxAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(18,2) NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "provider" TEXT,
    "paymentMethod" TEXT,
    "externalReference" TEXT,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'MGA',
    "initiatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "failureCode" TEXT,
    "failureMessage" TEXT,
    "metadata" JSONB,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingEvent" (
    "id" TEXT NOT NULL,
    "traceId" TEXT,
    "tenantId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "invoiceId" TEXT,
    "paymentId" TEXT,
    "eventType" TEXT NOT NULL,
    "payload" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminDelegation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "grantorUserId" TEXT NOT NULL,
    "granteeUserId" TEXT NOT NULL,
    "scopeType" TEXT NOT NULL,
    "scopeId" TEXT,
    "permissions" JSONB NOT NULL,
    "status" "DelegationStatus" NOT NULL DEFAULT 'ACTIVE',
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "revokedAt" TIMESTAMP(3),
    "revokedBy" TEXT,

    CONSTRAINT "AdminDelegation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdministrativeAction" (
    "id" TEXT NOT NULL,
    "traceId" TEXT,
    "actorId" TEXT NOT NULL,
    "tenantId" TEXT,
    "actionType" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "status" "AdminActionStatus" NOT NULL DEFAULT 'REQUESTED',
    "reason" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "executedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "metadata" JSONB,

    CONSTRAINT "AdministrativeAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformService" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "PlatformServiceStatus" NOT NULL DEFAULT 'STARTING',
    "version" TEXT,
    "baseUrl" TEXT,
    "environment" "Environment",
    "metadata" JSONB,
    "lastHealthCheckAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformDiagnostic" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT,
    "component" TEXT NOT NULL,
    "status" "DiagnosticStatus" NOT NULL DEFAULT 'UNKNOWN',
    "severity" "SecuritySeverity",
    "message" TEXT,
    "details" JSONB,
    "traceId" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "PlatformDiagnostic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformConfiguration" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB,
    "secretRef" TEXT,
    "description" TEXT,
    "category" TEXT,
    "editable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "PlatformConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformMaintenance" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "component" TEXT,
    "environment" "Environment",
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "PlatformMaintenance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_primaryEmail_key" ON "User"("primaryEmail");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "User_primaryEmail_idx" ON "User"("primaryEmail");

-- CreateIndex
CREATE INDEX "User_phone_idx" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_defaultTenantId_idx" ON "User"("defaultTenantId");

-- CreateIndex
CREATE INDEX "Identity_type_idx" ON "Identity"("type");

-- CreateIndex
CREATE INDEX "Identity_status_idx" ON "Identity"("status");

-- CreateIndex
CREATE INDEX "Identity_email_idx" ON "Identity"("email");

-- CreateIndex
CREATE INDEX "Identity_phone_idx" ON "Identity"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Identity_provider_subject_key" ON "Identity"("provider", "subject");

-- CreateIndex
CREATE INDEX "UserIdentity_userId_idx" ON "UserIdentity"("userId");

-- CreateIndex
CREATE INDEX "UserIdentity_identityId_idx" ON "UserIdentity"("identityId");

-- CreateIndex
CREATE UNIQUE INDEX "UserIdentity_userId_identityId_key" ON "UserIdentity"("userId", "identityId");

-- CreateIndex
CREATE INDEX "ExternalIdentityLink_identityId_idx" ON "ExternalIdentityLink"("identityId");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalIdentityLink_providerType_providerInstanceId_extern_key" ON "ExternalIdentityLink"("providerType", "providerInstanceId", "externalSubjectId");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_code_key" ON "Tenant"("code");

-- CreateIndex
CREATE INDEX "Tenant_status_idx" ON "Tenant"("status");

-- CreateIndex
CREATE INDEX "Organization_tenantId_idx" ON "Organization"("tenantId");

-- CreateIndex
CREATE INDEX "Organization_status_idx" ON "Organization"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_tenantId_code_key" ON "Organization"("tenantId", "code");

-- CreateIndex
CREATE INDEX "Site_organizationId_idx" ON "Site"("organizationId");

-- CreateIndex
CREATE INDEX "Site_status_idx" ON "Site"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Site_organizationId_code_key" ON "Site"("organizationId", "code");

-- CreateIndex
CREATE INDEX "Membership_userId_idx" ON "Membership"("userId");

-- CreateIndex
CREATE INDEX "Membership_tenantId_idx" ON "Membership"("tenantId");

-- CreateIndex
CREATE INDEX "Membership_organizationId_idx" ON "Membership"("organizationId");

-- CreateIndex
CREATE INDEX "Membership_siteId_idx" ON "Membership"("siteId");

-- CreateIndex
CREATE INDEX "Membership_status_idx" ON "Membership"("status");

-- CreateIndex
CREATE INDEX "Membership_tenantId_status_idx" ON "Membership"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Group_tenantId_idx" ON "Group"("tenantId");

-- CreateIndex
CREATE INDEX "Group_organizationId_idx" ON "Group"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Group_tenantId_code_key" ON "Group"("tenantId", "code");

-- CreateIndex
CREATE INDEX "GroupMember_groupId_idx" ON "GroupMember"("groupId");

-- CreateIndex
CREATE INDEX "GroupMember_userId_idx" ON "GroupMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupMember_groupId_userId_key" ON "GroupMember"("groupId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_code_key" ON "Permission"("code");

-- CreateIndex
CREATE INDEX "Permission_resource_action_idx" ON "Permission"("resource", "action");

-- CreateIndex
CREATE INDEX "Permission_active_idx" ON "Permission"("active");

-- CreateIndex
CREATE INDEX "Role_tenantId_idx" ON "Role"("tenantId");

-- CreateIndex
CREATE INDEX "Role_status_idx" ON "Role"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Role_tenantId_code_key" ON "Role"("tenantId", "code");

-- CreateIndex
CREATE INDEX "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");

-- CreateIndex
CREATE INDEX "RoleAssignment_roleId_idx" ON "RoleAssignment"("roleId");

-- CreateIndex
CREATE INDEX "RoleAssignment_userId_idx" ON "RoleAssignment"("userId");

-- CreateIndex
CREATE INDEX "RoleAssignment_groupId_idx" ON "RoleAssignment"("groupId");

-- CreateIndex
CREATE INDEX "RoleAssignment_serviceAccountId_idx" ON "RoleAssignment"("serviceAccountId");

-- CreateIndex
CREATE INDEX "RoleAssignment_tenantId_idx" ON "RoleAssignment"("tenantId");

-- CreateIndex
CREATE INDEX "RoleAssignment_organizationId_idx" ON "RoleAssignment"("organizationId");

-- CreateIndex
CREATE INDEX "RoleAssignment_siteId_idx" ON "RoleAssignment"("siteId");

-- CreateIndex
CREATE INDEX "AccessPolicy_tenantId_idx" ON "AccessPolicy"("tenantId");

-- CreateIndex
CREATE INDEX "AccessPolicy_status_idx" ON "AccessPolicy"("status");

-- CreateIndex
CREATE INDEX "AccessPolicy_resource_action_idx" ON "AccessPolicy"("resource", "action");

-- CreateIndex
CREATE INDEX "AccessPolicy_effectiveFrom_effectiveUntil_idx" ON "AccessPolicy"("effectiveFrom", "effectiveUntil");

-- CreateIndex
CREATE UNIQUE INDEX "AccessPolicy_tenantId_code_version_key" ON "AccessPolicy"("tenantId", "code", "version");

-- CreateIndex
CREATE INDEX "PolicyCondition_policyId_idx" ON "PolicyCondition"("policyId");

-- CreateIndex
CREATE INDEX "PolicyCondition_attribute_idx" ON "PolicyCondition"("attribute");

-- CreateIndex
CREATE INDEX "AuthorizationDecision_traceId_idx" ON "AuthorizationDecision"("traceId");

-- CreateIndex
CREATE INDEX "AuthorizationDecision_userId_idx" ON "AuthorizationDecision"("userId");

-- CreateIndex
CREATE INDEX "AuthorizationDecision_tenantId_idx" ON "AuthorizationDecision"("tenantId");

-- CreateIndex
CREATE INDEX "AuthorizationDecision_resource_action_idx" ON "AuthorizationDecision"("resource", "action");

-- CreateIndex
CREATE INDEX "AuthorizationDecision_createdAt_idx" ON "AuthorizationDecision"("createdAt");

-- CreateIndex
CREATE INDEX "Credential_userId_idx" ON "Credential"("userId");

-- CreateIndex
CREATE INDEX "Credential_type_idx" ON "Credential"("type");

-- CreateIndex
CREATE INDEX "Credential_status_idx" ON "Credential"("status");

-- CreateIndex
CREATE INDEX "PasswordHistory_userId_idx" ON "PasswordHistory"("userId");

-- CreateIndex
CREATE INDEX "PasswordHistory_createdAt_idx" ON "PasswordHistory"("createdAt");

-- CreateIndex
CREATE INDEX "Device_userId_idx" ON "Device"("userId");

-- CreateIndex
CREATE INDEX "Device_trustLevel_idx" ON "Device"("trustLevel");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_tenantId_idx" ON "Session"("tenantId");

-- CreateIndex
CREATE INDEX "Session_deviceId_idx" ON "Session"("deviceId");

-- CreateIndex
CREATE INDEX "Session_status_idx" ON "Session"("status");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE INDEX "Session_userId_status_idx" ON "Session"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_sessionId_idx" ON "RefreshToken"("sessionId");

-- CreateIndex
CREATE INDEX "RefreshToken_familyId_idx" ON "RefreshToken"("familyId");

-- CreateIndex
CREATE INDEX "RefreshToken_status_idx" ON "RefreshToken"("status");

-- CreateIndex
CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");

-- CreateIndex
CREATE INDEX "MfaMethod_userId_idx" ON "MfaMethod"("userId");

-- CreateIndex
CREATE INDEX "MfaMethod_type_idx" ON "MfaMethod"("type");

-- CreateIndex
CREATE INDEX "MfaMethod_enabled_idx" ON "MfaMethod"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "RecoveryCode_codeHash_key" ON "RecoveryCode"("codeHash");

-- CreateIndex
CREATE INDEX "RecoveryCode_userId_idx" ON "RecoveryCode"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceAccount_identityId_key" ON "ServiceAccount"("identityId");

-- CreateIndex
CREATE INDEX "ServiceAccount_tenantId_idx" ON "ServiceAccount"("tenantId");

-- CreateIndex
CREATE INDEX "ServiceAccount_status_idx" ON "ServiceAccount"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceAccount_tenantId_code_key" ON "ServiceAccount"("tenantId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceAccountCredential_keyId_key" ON "ServiceAccountCredential"("keyId");

-- CreateIndex
CREATE INDEX "ServiceAccountCredential_serviceAccountId_idx" ON "ServiceAccountCredential"("serviceAccountId");

-- CreateIndex
CREATE INDEX "ServiceAccountCredential_status_idx" ON "ServiceAccountCredential"("status");

-- CreateIndex
CREATE INDEX "SecurityEvent_traceId_idx" ON "SecurityEvent"("traceId");

-- CreateIndex
CREATE INDEX "SecurityEvent_userId_idx" ON "SecurityEvent"("userId");

-- CreateIndex
CREATE INDEX "SecurityEvent_tenantId_idx" ON "SecurityEvent"("tenantId");

-- CreateIndex
CREATE INDEX "SecurityEvent_type_idx" ON "SecurityEvent"("type");

-- CreateIndex
CREATE INDEX "SecurityEvent_severity_idx" ON "SecurityEvent"("severity");

-- CreateIndex
CREATE INDEX "SecurityEvent_occurredAt_idx" ON "SecurityEvent"("occurredAt");

-- CreateIndex
CREATE INDEX "ContextSnapshot_userId_idx" ON "ContextSnapshot"("userId");

-- CreateIndex
CREATE INDEX "ContextSnapshot_tenantId_idx" ON "ContextSnapshot"("tenantId");

-- CreateIndex
CREATE INDEX "ContextSnapshot_organizationId_idx" ON "ContextSnapshot"("organizationId");

-- CreateIndex
CREATE INDEX "ContextSnapshot_sessionId_idx" ON "ContextSnapshot"("sessionId");

-- CreateIndex
CREATE INDEX "ContextSnapshot_traceId_idx" ON "ContextSnapshot"("traceId");

-- CreateIndex
CREATE INDEX "ContextSnapshot_resolvedAt_idx" ON "ContextSnapshot"("resolvedAt");

-- CreateIndex
CREATE INDEX "ContextSwitchEvent_userId_idx" ON "ContextSwitchEvent"("userId");

-- CreateIndex
CREATE INDEX "ContextSwitchEvent_sessionId_idx" ON "ContextSwitchEvent"("sessionId");

-- CreateIndex
CREATE INDEX "ContextSwitchEvent_traceId_idx" ON "ContextSwitchEvent"("traceId");

-- CreateIndex
CREATE INDEX "ContextSwitchEvent_createdAt_idx" ON "ContextSwitchEvent"("createdAt");

-- CreateIndex
CREATE INDEX "ContextInvalidation_subjectType_subjectId_idx" ON "ContextInvalidation"("subjectType", "subjectId");

-- CreateIndex
CREATE INDEX "ContextInvalidation_tenantId_idx" ON "ContextInvalidation"("tenantId");

-- CreateIndex
CREATE INDEX "ContextInvalidation_processedAt_idx" ON "ContextInvalidation"("processedAt");

-- CreateIndex
CREATE INDEX "ContextInvalidation_createdAt_idx" ON "ContextInvalidation"("createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_traceId_idx" ON "AuditEvent"("traceId");

-- CreateIndex
CREATE INDEX "AuditEvent_actorId_idx" ON "AuditEvent"("actorId");

-- CreateIndex
CREATE INDEX "AuditEvent_effectiveUserId_idx" ON "AuditEvent"("effectiveUserId");

-- CreateIndex
CREATE INDEX "AuditEvent_tenantId_idx" ON "AuditEvent"("tenantId");

-- CreateIndex
CREATE INDEX "AuditEvent_targetType_targetId_idx" ON "AuditEvent"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "AuditEvent_createdAt_idx" ON "AuditEvent"("createdAt");

-- CreateIndex
CREATE INDEX "OutboxEvent_eventType_idx" ON "OutboxEvent"("eventType");

-- CreateIndex
CREATE INDEX "OutboxEvent_aggregateType_aggregateId_idx" ON "OutboxEvent"("aggregateType", "aggregateId");

-- CreateIndex
CREATE INDEX "OutboxEvent_publishedAt_idx" ON "OutboxEvent"("publishedAt");

-- CreateIndex
CREATE INDEX "OutboxEvent_createdAt_idx" ON "OutboxEvent"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_code_key" ON "Plan"("code");

-- CreateIndex
CREATE INDEX "Plan_status_idx" ON "Plan"("status");

-- CreateIndex
CREATE INDEX "PlanEntitlement_featureCode_idx" ON "PlanEntitlement"("featureCode");

-- CreateIndex
CREATE UNIQUE INDEX "PlanEntitlement_planId_featureCode_key" ON "PlanEntitlement"("planId", "featureCode");

-- CreateIndex
CREATE INDEX "Subscription_tenantId_idx" ON "Subscription"("tenantId");

-- CreateIndex
CREATE INDEX "Subscription_planId_idx" ON "Subscription"("planId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE INDEX "Subscription_tenantId_status_idx" ON "Subscription"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Subscription_currentPeriodEnd_idx" ON "Subscription"("currentPeriodEnd");

-- CreateIndex
CREATE INDEX "SubscriptionEntitlementOverride_featureCode_idx" ON "SubscriptionEntitlementOverride"("featureCode");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionEntitlementOverride_subscriptionId_featureCode_key" ON "SubscriptionEntitlementOverride"("subscriptionId", "featureCode");

-- CreateIndex
CREATE INDEX "QuotaUsage_subscriptionId_idx" ON "QuotaUsage"("subscriptionId");

-- CreateIndex
CREATE INDEX "QuotaUsage_featureCode_idx" ON "QuotaUsage"("featureCode");

-- CreateIndex
CREATE UNIQUE INDEX "QuotaUsage_subscriptionId_featureCode_periodStart_periodEnd_key" ON "QuotaUsage"("subscriptionId", "featureCode", "periodStart", "periodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_tenantId_idx" ON "Invoice"("tenantId");

-- CreateIndex
CREATE INDEX "Invoice_subscriptionId_idx" ON "Invoice"("subscriptionId");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "Invoice_dueAt_idx" ON "Invoice"("dueAt");

-- CreateIndex
CREATE INDEX "InvoiceItem_invoiceId_idx" ON "InvoiceItem"("invoiceId");

-- CreateIndex
CREATE INDEX "Payment_invoiceId_idx" ON "Payment"("invoiceId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_externalReference_idx" ON "Payment"("externalReference");

-- CreateIndex
CREATE INDEX "BillingEvent_tenantId_idx" ON "BillingEvent"("tenantId");

-- CreateIndex
CREATE INDEX "BillingEvent_subscriptionId_idx" ON "BillingEvent"("subscriptionId");

-- CreateIndex
CREATE INDEX "BillingEvent_invoiceId_idx" ON "BillingEvent"("invoiceId");

-- CreateIndex
CREATE INDEX "BillingEvent_paymentId_idx" ON "BillingEvent"("paymentId");

-- CreateIndex
CREATE INDEX "BillingEvent_eventType_idx" ON "BillingEvent"("eventType");

-- CreateIndex
CREATE INDEX "BillingEvent_occurredAt_idx" ON "BillingEvent"("occurredAt");

-- CreateIndex
CREATE INDEX "AdminDelegation_tenantId_idx" ON "AdminDelegation"("tenantId");

-- CreateIndex
CREATE INDEX "AdminDelegation_grantorUserId_idx" ON "AdminDelegation"("grantorUserId");

-- CreateIndex
CREATE INDEX "AdminDelegation_granteeUserId_idx" ON "AdminDelegation"("granteeUserId");

-- CreateIndex
CREATE INDEX "AdminDelegation_status_idx" ON "AdminDelegation"("status");

-- CreateIndex
CREATE INDEX "AdministrativeAction_traceId_idx" ON "AdministrativeAction"("traceId");

-- CreateIndex
CREATE INDEX "AdministrativeAction_actorId_idx" ON "AdministrativeAction"("actorId");

-- CreateIndex
CREATE INDEX "AdministrativeAction_tenantId_idx" ON "AdministrativeAction"("tenantId");

-- CreateIndex
CREATE INDEX "AdministrativeAction_targetType_targetId_idx" ON "AdministrativeAction"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "AdministrativeAction_status_idx" ON "AdministrativeAction"("status");

-- CreateIndex
CREATE INDEX "AdministrativeAction_requestedAt_idx" ON "AdministrativeAction"("requestedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformService_code_key" ON "PlatformService"("code");

-- CreateIndex
CREATE INDEX "PlatformService_status_idx" ON "PlatformService"("status");

-- CreateIndex
CREATE INDEX "PlatformService_environment_idx" ON "PlatformService"("environment");

-- CreateIndex
CREATE INDEX "PlatformDiagnostic_serviceId_idx" ON "PlatformDiagnostic"("serviceId");

-- CreateIndex
CREATE INDEX "PlatformDiagnostic_component_idx" ON "PlatformDiagnostic"("component");

-- CreateIndex
CREATE INDEX "PlatformDiagnostic_status_idx" ON "PlatformDiagnostic"("status");

-- CreateIndex
CREATE INDEX "PlatformDiagnostic_checkedAt_idx" ON "PlatformDiagnostic"("checkedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformConfiguration_key_key" ON "PlatformConfiguration"("key");

-- CreateIndex
CREATE INDEX "PlatformConfiguration_category_idx" ON "PlatformConfiguration"("category");

-- CreateIndex
CREATE INDEX "PlatformMaintenance_active_idx" ON "PlatformMaintenance"("active");

-- CreateIndex
CREATE INDEX "PlatformMaintenance_startsAt_idx" ON "PlatformMaintenance"("startsAt");

-- CreateIndex
CREATE INDEX "PlatformMaintenance_environment_idx" ON "PlatformMaintenance"("environment");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_defaultTenantId_fkey" FOREIGN KEY ("defaultTenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserIdentity" ADD CONSTRAINT "UserIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserIdentity" ADD CONSTRAINT "UserIdentity_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "Identity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalIdentityLink" ADD CONSTRAINT "ExternalIdentityLink_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "Identity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Site" ADD CONSTRAINT "Site_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleAssignment" ADD CONSTRAINT "RoleAssignment_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleAssignment" ADD CONSTRAINT "RoleAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleAssignment" ADD CONSTRAINT "RoleAssignment_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleAssignment" ADD CONSTRAINT "RoleAssignment_serviceAccountId_fkey" FOREIGN KEY ("serviceAccountId") REFERENCES "ServiceAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessPolicy" ADD CONSTRAINT "AccessPolicy_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyCondition" ADD CONSTRAINT "PolicyCondition_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "AccessPolicy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordHistory" ADD CONSTRAINT "PasswordHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MfaMethod" ADD CONSTRAINT "MfaMethod_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryCode" ADD CONSTRAINT "RecoveryCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceAccount" ADD CONSTRAINT "ServiceAccount_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceAccount" ADD CONSTRAINT "ServiceAccount_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "Identity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceAccountCredential" ADD CONSTRAINT "ServiceAccountCredential_serviceAccountId_fkey" FOREIGN KEY ("serviceAccountId") REFERENCES "ServiceAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanEntitlement" ADD CONSTRAINT "PlanEntitlement_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionEntitlementOverride" ADD CONSTRAINT "SubscriptionEntitlementOverride_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotaUsage" ADD CONSTRAINT "QuotaUsage_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminDelegation" ADD CONSTRAINT "AdminDelegation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformDiagnostic" ADD CONSTRAINT "PlatformDiagnostic_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "PlatformService"("id") ON DELETE SET NULL ON UPDATE CASCADE;
