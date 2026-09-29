-- Comprehensive IAM schema reconciliation script
-- Can be run with: npx prisma db execute --file backend/prisma/reconcile_iam.sql

BEGIN;

-- Step 1: Ensure business_manager schema exists
CREATE SCHEMA IF NOT EXISTS business_manager;

-- Step 2: Drop auth_aim schema (if it exists) - cleanup old PascalCase tables
DROP SCHEMA IF EXISTS auth_aim CASCADE;

-- Step 3: Create IAM enum types in business_manager (skip if exist)
DO $$
DECLARE
    enum_name TEXT;
    enum_values TEXT;
BEGIN
    -- IamCredentialType
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'IamCredentialType' AND n.nspname = 'business_manager') THEN
        CREATE TYPE business_manager."IamCredentialType" AS ENUM ('PASSWORD', 'PASSKEY', 'API_KEY', 'EXTERNAL', 'RECOVERY');
    END IF;

    -- IamCredentialStatus
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'IamCredentialStatus' AND n.nspname = 'business_manager') THEN
        CREATE TYPE business_manager."IamCredentialStatus" AS ENUM ('ACTIVE', 'DISABLED', 'REVOKED', 'EXPIRED');
    END IF;

    -- IamEnvironment
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'IamEnvironment' AND n.nspname = 'business_manager') THEN
        CREATE TYPE business_manager."IamEnvironment" AS ENUM ('DEVELOPMENT', 'TEST', 'STAGING', 'PRODUCTION');
    END IF;

    -- UserStatus
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'UserStatus' AND n.nspname = 'business_manager') THEN
        CREATE TYPE business_manager."UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'LOCKED', 'DISABLED', 'ARCHIVED');
    END IF;

    -- IdentityType
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'IdentityType' AND n.nspname = 'business_manager') THEN
        CREATE TYPE business_manager."IdentityType" AS ENUM ('HUMAN', 'SERVICE_ACCOUNT', 'APPLICATION', 'DEVICE', 'SYSTEM', 'EXTERNAL_IDENTITY', 'API_CLIENT', 'AUTOMATION', 'AGENT');
    END IF;

    -- IdentityStatus
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'IdentityStatus' AND n.nspname = 'business_manager') THEN
        CREATE TYPE business_manager."IdentityStatus" AS ENUM ('PENDING', 'VERIFIED', 'ACTIVE', 'SUSPENDED', 'ARCHIVED');
    END IF;

    -- TenantStatus
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'TenantStatus' AND n.nspname = 'business_manager') THEN
        CREATE TYPE business_manager."TenantStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'DISABLED', 'ARCHIVED');
    END IF;

    -- OrganizationStatus
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'OrganizationStatus' AND n.nspname = 'business_manager') THEN
        CREATE TYPE business_manager."OrganizationStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'ARCHIVED');
    END IF;

    -- SiteStatus
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'SiteStatus' AND n.nspname = 'business_manager') THEN
        CREATE TYPE business_manager."SiteStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'ARCHIVED');
    END IF;

    -- MembershipStatus
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'MembershipStatus' AND n.nspname = 'business_manager') THEN
        CREATE TYPE business_manager."MembershipStatus" AS ENUM ('INVITED', 'PENDING', 'ACTIVE', 'SUSPENDED', 'REVOKED', 'EXPIRED');
    END IF;

    -- GroupType
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'GroupType' AND n.nspname = 'business_manager') THEN
        CREATE TYPE business_manager."GroupType" AS ENUM ('SYSTEM', 'STATIC', 'DYNAMIC');
    END IF;

    -- RoleStatus
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'RoleStatus' AND n.nspname = 'business_manager') THEN
        CREATE TYPE business_manager."RoleStatus" AS ENUM ('ACTIVE', 'DISABLED', 'ARCHIVED');
    END IF;

    -- PolicyEffect
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'PolicyEffect' AND n.nspname = 'business_manager') THEN
        CREATE TYPE business_manager."PolicyEffect" AS ENUM ('ALLOW', 'DENY', 'STEP_UP', 'APPROVAL_REQUIRED');
    END IF;

    -- PolicyStatus
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'PolicyStatus' AND n.nspname = 'business_manager') THEN
        CREATE TYPE business_manager."PolicyStatus" AS ENUM ('DRAFT', 'ACTIVE', 'DISABLED', 'SUPERSEDED', 'ARCHIVED');
    END IF;

    -- AuthorizationResult
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'AuthorizationResult' AND n.nspname = 'business_manager') THEN
        CREATE TYPE business_manager."AuthorizationResult" AS ENUM ('ALLOW', 'DENY', 'STEP_UP_REQUIRED', 'APPROVAL_REQUIRED');
    END IF;

    -- SessionStatus
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'SessionStatus' AND n.nspname = 'business_manager') THEN
        CREATE TYPE business_manager."SessionStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');
    END IF;

    -- TokenStatus
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'TokenStatus' AND n.nspname = 'business_manager') THEN
        CREATE TYPE business_manager."TokenStatus" AS ENUM ('ACTIVE', 'ROTATED', 'REVOKED', 'EXPIRED', 'REUSED');
    END IF;

    -- MfaType
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'MfaType' AND n.nspname = 'business_manager') THEN
        CREATE TYPE business_manager."MfaType" AS ENUM ('TOTP', 'EMAIL_OTP', 'SMS_OTP', 'PASSKEY');
    END IF;

    -- DeviceTrustLevel
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'DeviceTrustLevel' AND n.nspname = 'business_manager') THEN
        CREATE TYPE business_manager."DeviceTrustLevel" AS ENUM ('UNKNOWN', 'UNTRUSTED', 'TRUSTED', 'PRIVILEGED');
    END IF;

    -- RiskLevel
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'RiskLevel' AND n.nspname = 'business_manager') THEN
        CREATE TYPE business_manager."RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
    END IF;

    -- ServiceAccountStatus
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'ServiceAccountStatus' AND n.nspname = 'business_manager') THEN
        CREATE TYPE business_manager."ServiceAccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DISABLED', 'ARCHIVED');
    END IF;

    -- SecuritySeverity
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'SecuritySeverity' AND n.nspname = 'business_manager') THEN
        CREATE TYPE business_manager."SecuritySeverity" AS ENUM ('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
    END IF;

    -- PlanStatus
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'PlanStatus' AND n.nspname = 'business_manager') THEN
        CREATE TYPE business_manager."PlanStatus" AS ENUM ('DRAFT', 'ACTIVE', 'DISABLED', 'ARCHIVED');
    END IF;

    -- SubscriptionStatus
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'SubscriptionStatus' AND n.nspname = 'business_manager') THEN
        CREATE TYPE business_manager."SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELLED', 'EXPIRED');
    END IF;

    -- BillingInterval
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'BillingInterval' AND n.nspname = 'business_manager') THEN
        CREATE TYPE business_manager."BillingInterval" AS ENUM ('MONTHLY', 'QUARTERLY', 'SEMESTER', 'YEARLY', 'CUSTOM');
    END IF;

    -- InvoiceStatus
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'InvoiceStatus' AND n.nspname = 'business_manager') THEN
        CREATE TYPE business_manager."InvoiceStatus" AS ENUM ('DRAFT', 'OPEN', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'VOID', 'CANCELLED');
    END IF;

    -- PaymentStatus
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'PaymentStatus' AND n.nspname = 'business_manager') THEN
        CREATE TYPE business_manager."PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNED');
    END IF;

    -- EntitlementValueType
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'EntitlementValueType' AND n.nspname = 'business_manager') THEN
        CREATE TYPE business_manager."EntitlementValueType" AS ENUM ('BOOLEAN', 'INTEGER', 'DECIMAL', 'STRING', 'JSON');
    END IF;

    -- AdminActionStatus
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'AdminActionStatus' AND n.nspname = 'business_manager') THEN
        CREATE TYPE business_manager."AdminActionStatus" AS ENUM ('REQUESTED', 'PENDING_APPROVAL', 'APPROVED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');
    END IF;

    -- DiagnosticStatus
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'DiagnosticStatus' AND n.nspname = 'business_manager') THEN
        CREATE TYPE business_manager."DiagnosticStatus" AS ENUM ('HEALTHY', 'DEGRADED', 'WARNING', 'CRITICAL', 'UNAVAILABLE', 'UNKNOWN');
    END IF;

    -- PlatformServiceStatus
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'PlatformServiceStatus' AND n.nspname = 'business_manager') THEN
        CREATE TYPE business_manager."PlatformServiceStatus" AS ENUM ('STARTING', 'HEALTHY', 'DEGRADED', 'UNAVAILABLE', 'MAINTENANCE');
    END IF;

    -- DelegationStatus
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'DelegationStatus' AND n.nspname = 'business_manager') THEN
        CREATE TYPE business_manager."DelegationStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'REVOKED', 'EXPIRED');
    END IF;
END $$;

-- Step 4: Create IAM tables (use IF NOT EXISTS for idempotency)
CREATE TABLE IF NOT EXISTS business_manager.iam_user (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "primaryEmail" TEXT NOT NULL,
    "phone" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "displayName" TEXT,
    "avatarRef" TEXT,
    "locale" TEXT,
    "timezone" TEXT,
    "status" business_manager."UserStatus" NOT NULL DEFAULT 'PENDING',
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "defaultTenantId" TEXT,
    "metadata" JSONB,
    "statusChangedAt" TIMESTAMP(3),
    "statusChangedBy" TEXT,
    "statusChangedReason" TEXT,
    "passwordResetToken" TEXT,
    "passwordResetExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,
    "archivedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "iam_user_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS business_manager.identity (
    "id" TEXT NOT NULL,
    "type" business_manager."IdentityType",
    "status" business_manager."IdentityStatus" NOT NULL DEFAULT 'PENDING',
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,
    "archivedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "identity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS business_manager.user_identity (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "identityId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "linkedBy" TEXT,
    "unlinkedAt" TIMESTAMP(3),
    "unlinkedBy" TEXT,
    CONSTRAINT "user_identity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS business_manager.external_identity_link (
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "external_identity_link_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS business_manager.tenant (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" business_manager."TenantStatus" NOT NULL DEFAULT 'PENDING',
    "locale" TEXT,
    "timezone" TEXT,
    "metadata" JSONB,
    "statusChangedAt" TIMESTAMP(3),
    "statusChangedBy" TEXT,
    "statusChangedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,
    "archivedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "tenant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS business_manager.organization (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" business_manager."OrganizationStatus" NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB,
    "statusChangedAt" TIMESTAMP(3),
    "statusChangedBy" TEXT,
    "statusChangedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,
    "archivedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "organization_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS business_manager.site (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" business_manager."SiteStatus" NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB,
    "statusChangedAt" TIMESTAMP(3),
    "statusChangedBy" TEXT,
    "statusChangedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archivedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "site_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS business_manager.membership (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "organizationId" TEXT,
    "siteId" TEXT,
    "status" business_manager."MembershipStatus" NOT NULL DEFAULT 'INVITED',
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "joinedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "revokedBy" TEXT,
    "revokeReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "membership_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS business_manager.groups (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "organizationId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" business_manager."GroupType" NOT NULL DEFAULT 'STATIC',
    "dynamicRule" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,
    "archivedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS business_manager.group_member (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "removedAt" TIMESTAMP(3),
    "removedBy" TEXT,
    CONSTRAINT "group_member_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS business_manager.permission (
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,
    CONSTRAINT "permission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS business_manager.role (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" business_manager."RoleStatus" NOT NULL DEFAULT 'ACTIVE',
    "system" BOOLEAN NOT NULL DEFAULT false,
    "privileged" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "statusChangedAt" TIMESTAMP(3),
    "statusChangedBy" TEXT,
    "statusChangedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,
    "archivedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "role_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS business_manager.role_permission (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grantedBy" TEXT,
    "revokedAt" TIMESTAMP(3),
    "revokedBy" TEXT,
    CONSTRAINT "role_permission_pkey" PRIMARY KEY ("roleId", "permissionId")
);

CREATE TABLE IF NOT EXISTS business_manager.role_assignment (
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
    CONSTRAINT "role_assignment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS business_manager.access_policy (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" business_manager."PolicyStatus" NOT NULL DEFAULT 'DRAFT',
    "effect" business_manager."PolicyEffect" NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,
    "archivedAt" TIMESTAMP(3),
    CONSTRAINT "access_policy_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS business_manager.policy_condition (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "attribute" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "value" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    CONSTRAINT "policy_condition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS business_manager.authorization_decision (
    "id" TEXT NOT NULL,
    "traceId" TEXT NOT NULL,
    "userId" TEXT,
    "identityId" TEXT,
    "tenantId" TEXT,
    "organizationId" TEXT,
    "siteId" TEXT,
    "applicationId" TEXT,
    "environment" business_manager."IamEnvironment",
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "result" business_manager."AuthorizationResult" NOT NULL,
    "matchedRoleIds" JSONB,
    "matchedPermissionIds" JSONB,
    "matchedPolicyIds" JSONB,
    "reason" JSONB,
    "riskLevel" business_manager."RiskLevel",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "authorization_decision_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS business_manager.iam_credential (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" business_manager."IamCredentialType" NOT NULL,
    "status" business_manager."IamCredentialStatus" NOT NULL DEFAULT 'ACTIVE',
    "secretHash" TEXT,
    "secretRef" TEXT,
    "identifier" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "revokedBy" TEXT,
    "revokeReason" TEXT,
    "lastUsedAt" TIMESTAMP(3),
    "metadata" JSONB,
    CONSTRAINT "iam_credential_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS business_manager.iam_password_history (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "iam_password_history_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS business_manager.iam_device (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fingerprintHash" TEXT,
    "name" TEXT,
    "deviceType" TEXT,
    "trustLevel" business_manager."DeviceTrustLevel" NOT NULL DEFAULT 'UNKNOWN',
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trustedAt" TIMESTAMP(3),
    "trustedBy" TEXT,
    "revokedAt" TIMESTAMP(3),
    "revokedBy" TEXT,
    "revokeReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "iam_device_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS business_manager.iam_session (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT,
    "organizationId" TEXT,
    "siteId" TEXT,
    "applicationId" TEXT,
    "environment" business_manager."IamEnvironment",
    "deviceId" TEXT,
    "status" business_manager."SessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "authenticationLevel" TEXT,
    "riskLevel" business_manager."RiskLevel" NOT NULL DEFAULT 'LOW',
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
    CONSTRAINT "iam_session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS business_manager.iam_refresh_token (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "status" business_manager."TokenStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "rotatedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "revokeReason" TEXT,
    "replacedByTokenId" TEXT,
    CONSTRAINT "iam_refresh_token_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS business_manager.mfa_method (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" business_manager."MfaType" NOT NULL,
    "label" TEXT,
    "secretRef" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "disabledAt" TIMESTAMP(3),
    "metadata" JSONB,
    CONSTRAINT "mfa_method_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS business_manager.recovery_code (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "usedAt" TIMESTAMP(3),
    CONSTRAINT "recovery_code_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS business_manager.service_account (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "identityId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" business_manager."ServiceAccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB,
    "statusChangedAt" TIMESTAMP(3),
    "statusChangedBy" TEXT,
    "statusChangedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,
    "archivedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "service_account_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS business_manager.service_account_credential (
    "id" TEXT NOT NULL,
    "serviceAccountId" TEXT NOT NULL,
    "keyId" TEXT NOT NULL,
    "secretHash" TEXT,
    "secretRef" TEXT,
    "status" business_manager."IamCredentialStatus" NOT NULL DEFAULT 'ACTIVE',
    "scopes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "revokedBy" TEXT,
    "revokeReason" TEXT,
    CONSTRAINT "service_account_credential_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS business_manager.security_event (
    "id" TEXT NOT NULL,
    "traceId" TEXT,
    "type" TEXT NOT NULL,
    "severity" business_manager."SecuritySeverity" NOT NULL,
    "userId" TEXT,
    "identityId" TEXT,
    "tenantId" TEXT,
    "organizationId" TEXT,
    "siteId" TEXT,
    "sessionId" TEXT,
    "deviceId" TEXT,
    "riskLevel" business_manager."RiskLevel",
    "source" TEXT,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "security_event_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS business_manager.context_snapshot (
    "id" TEXT NOT NULL,
    "traceId" TEXT,
    "userId" TEXT NOT NULL,
    "identityId" TEXT,
    "tenantId" TEXT,
    "organizationId" TEXT,
    "siteId" TEXT,
    "applicationId" TEXT,
    "environment" business_manager."IamEnvironment",
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
    CONSTRAINT "context_snapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS business_manager.context_switch_event (
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
    CONSTRAINT "context_switch_event_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS business_manager.context_invalidation (
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
    CONSTRAINT "context_invalidation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS business_manager.audit_event (
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
    CONSTRAINT "audit_event_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS business_manager.outbox_event (
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
    CONSTRAINT "outbox_event_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS business_manager.plan (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" business_manager."PlanStatus" NOT NULL DEFAULT 'DRAFT',
    "billingInterval" business_manager."BillingInterval" NOT NULL DEFAULT 'MONTHLY',
    "price" DECIMAL(18,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'MGA',
    "trialDays" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,
    "archivedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "plan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS business_manager.plan_entitlement (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "featureCode" TEXT NOT NULL,
    "valueType" business_manager."EntitlementValueType" NOT NULL DEFAULT 'BOOLEAN',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "integerValue" INTEGER,
    "decimalValue" DECIMAL(18,4),
    "stringValue" TEXT,
    "jsonValue" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "plan_entitlement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS business_manager.subscription (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "applicationCode" TEXT,
    "status" business_manager."SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "subscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS business_manager.subscription_entitlement_override (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "featureCode" TEXT NOT NULL,
    "valueType" business_manager."EntitlementValueType" NOT NULL DEFAULT 'BOOLEAN',
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
    CONSTRAINT "subscription_entitlement_override_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS business_manager.quota_usage (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "featureCode" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "usedValue" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "limitValue" DECIMAL(18,4),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "quota_usage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS business_manager.invoice (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "invoiceNumber" TEXT NOT NULL,
    "status" business_manager."InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "invoice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS business_manager.invoice_item (
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
    CONSTRAINT "invoice_item_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS business_manager.payment (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "status" business_manager."PaymentStatus" NOT NULL DEFAULT 'PENDING',
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
    CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS business_manager.billing_event (
    "id" TEXT NOT NULL,
    "traceId" TEXT,
    "tenantId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "invoiceId" TEXT,
    "paymentId" TEXT,
    "eventType" TEXT NOT NULL,
    "payload" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "billing_event_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS business_manager.admin_delegation (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "grantorUserId" TEXT NOT NULL,
    "granteeUserId" TEXT NOT NULL,
    "scopeType" TEXT NOT NULL,
    "scopeId" TEXT,
    "permissions" JSONB NOT NULL,
    "status" business_manager."DelegationStatus" NOT NULL DEFAULT 'ACTIVE',
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "revokedAt" TIMESTAMP(3),
    "revokedBy" TEXT,
    CONSTRAINT "admin_delegation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS business_manager.administrative_action (
    "id" TEXT NOT NULL,
    "traceId" TEXT,
    "actorId" TEXT NOT NULL,
    "tenantId" TEXT,
    "actionType" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "status" business_manager."AdminActionStatus" NOT NULL DEFAULT 'REQUESTED',
    "reason" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "executedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "metadata" JSONB,
    CONSTRAINT "administrative_action_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS business_manager.platform_service (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" business_manager."PlatformServiceStatus" NOT NULL DEFAULT 'STARTING',
    "version" TEXT,
    "baseUrl" TEXT,
    "environment" business_manager."IamEnvironment",
    "metadata" JSONB,
    "lastHealthCheckAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "platform_service_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS business_manager.platform_diagnostic (
    "id" TEXT NOT NULL,
    "serviceId" TEXT,
    "component" TEXT NOT NULL,
    "status" business_manager."DiagnosticStatus" NOT NULL DEFAULT 'UNKNOWN',
    "severity" business_manager."SecuritySeverity",
    "message" TEXT,
    "details" JSONB,
    "traceId" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    CONSTRAINT "platform_diagnostic_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS business_manager.platform_maintenance (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "component" TEXT,
    "environment" business_manager."IamEnvironment",
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    CONSTRAINT "platform_maintenance_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS business_manager.feature (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "metered" BOOLEAN NOT NULL DEFAULT false,
    "quotaCode" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "feature_pkey" PRIMARY KEY ("code")
);

CREATE TABLE IF NOT EXISTS business_manager.webhook_event (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerEventId" TEXT NOT NULL,
    "signatureValid" BOOLEAN NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "payload" JSONB NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "webhook_event_pkey" PRIMARY KEY ("id")
);

-- Step 5: Create foreign key constraints
ALTER TABLE business_manager.user_identity 
    ADD CONSTRAINT "user_identity_userId_fkey" FOREIGN KEY ("userId") REFERENCES business_manager.iam_user("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE business_manager.user_identity 
    ADD CONSTRAINT "user_identity_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES business_manager.identity("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE business_manager.external_identity_link 
    ADD CONSTRAINT "external_identity_link_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES business_manager.identity("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE business_manager.organization 
    ADD CONSTRAINT "organization_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES business_manager.tenant("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE business_manager.site 
    ADD CONSTRAINT "site_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES business_manager.organization("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE business_manager.membership 
    ADD CONSTRAINT "membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES business_manager.iam_user("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE business_manager.membership 
    ADD CONSTRAINT "membership_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES business_manager.tenant("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE business_manager.membership 
    ADD CONSTRAINT "membership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES business_manager.organization("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE business_manager.membership 
    ADD CONSTRAINT "membership_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES business_manager.site("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE business_manager.groups 
    ADD CONSTRAINT "groups_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES business_manager.tenant("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE business_manager.groups 
    ADD CONSTRAINT "groups_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES business_manager.organization("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE business_manager.group_member 
    ADD CONSTRAINT "group_member_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES business_manager.groups("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE business_manager.group_member 
    ADD CONSTRAINT "group_member_userId_fkey" FOREIGN KEY ("userId") REFERENCES business_manager.iam_user("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE business_manager.role 
    ADD CONSTRAINT "role_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES business_manager.tenant("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE business_manager.role_permission 
    ADD CONSTRAINT "role_permission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES business_manager.role("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE business_manager.role_permission 
    ADD CONSTRAINT "role_permission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES business_manager.permission("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE business_manager.role_assignment 
    ADD CONSTRAINT "role_assignment_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES business_manager.role("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE business_manager.role_assignment 
    ADD CONSTRAINT "role_assignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES business_manager.iam_user("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE business_manager.role_assignment 
    ADD CONSTRAINT "role_assignment_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES business_manager.groups("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE business_manager.role_assignment 
    ADD CONSTRAINT "role_assignment_serviceAccountId_fkey" FOREIGN KEY ("serviceAccountId") REFERENCES business_manager.service_account("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE business_manager.access_policy 
    ADD CONSTRAINT "access_policy_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES business_manager.tenant("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE business_manager.policy_condition 
    ADD CONSTRAINT "policy_condition_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES business_manager.access_policy("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE business_manager.iam_credential 
    ADD CONSTRAINT "iam_credential_userId_fkey" FOREIGN KEY ("userId") REFERENCES business_manager.iam_user("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE business_manager.iam_password_history 
    ADD CONSTRAINT "iam_password_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES business_manager.iam_user("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE business_manager.iam_device 
    ADD CONSTRAINT "iam_device_userId_fkey" FOREIGN KEY ("userId") REFERENCES business_manager.iam_user("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE business_manager.iam_session 
    ADD CONSTRAINT "iam_session_userId_fkey" FOREIGN KEY ("userId") REFERENCES business_manager.iam_user("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE business_manager.iam_session 
    ADD CONSTRAINT "iam_session_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES business_manager.iam_device("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE business_manager.iam_refresh_token 
    ADD CONSTRAINT "iam_refresh_token_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES business_manager.iam_session("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE business_manager.mfa_method 
    ADD CONSTRAINT "mfa_method_userId_fkey" FOREIGN KEY ("userId") REFERENCES business_manager.iam_user("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE business_manager.recovery_code 
    ADD CONSTRAINT "recovery_code_userId_fkey" FOREIGN KEY ("userId") REFERENCES business_manager.iam_user("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE business_manager.service_account 
    ADD CONSTRAINT "service_account_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES business_manager.tenant("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE business_manager.service_account 
    ADD CONSTRAINT "service_account_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES business_manager.identity("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE business_manager.service_account_credential 
    ADD CONSTRAINT "service_account_credential_serviceAccountId_fkey" FOREIGN KEY ("serviceAccountId") REFERENCES business_manager.service_account("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE business_manager.plan_entitlement 
    ADD CONSTRAINT "plan_entitlement_planId_fkey" FOREIGN KEY ("planId") REFERENCES business_manager.plan("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE business_manager.subscription 
    ADD CONSTRAINT "subscription_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES business_manager.tenant("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE business_manager.subscription 
    ADD CONSTRAINT "subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES business_manager.plan("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE business_manager.subscription_entitlement_override 
    ADD CONSTRAINT "subscription_entitlement_override_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES business_manager.subscription("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE business_manager.quota_usage 
    ADD CONSTRAINT "quota_usage_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES business_manager.subscription("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE business_manager.invoice 
    ADD CONSTRAINT "invoice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES business_manager.tenant("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE business_manager.invoice 
    ADD CONSTRAINT "invoice_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES business_manager.subscription("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE business_manager.invoice_item 
    ADD CONSTRAINT "invoice_item_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES business_manager.invoice("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE business_manager.payment 
    ADD CONSTRAINT "payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES business_manager.invoice("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE business_manager.platform_diagnostic 
    ADD CONSTRAINT "platform_diagnostic_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES business_manager.platform_service("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 6: Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS "iam_user_username_key" ON business_manager.iam_user("username");
CREATE UNIQUE INDEX IF NOT EXISTS "iam_user_primaryEmail_key" ON business_manager.iam_user("primaryEmail");
CREATE INDEX IF NOT EXISTS "iam_user_status_idx" ON business_manager.iam_user("status");
CREATE INDEX IF NOT EXISTS "iam_user_defaultTenantId_idx" ON business_manager.iam_user("defaultTenantId");

CREATE INDEX IF NOT EXISTS "identity_type_idx" ON business_manager.identity("type");
CREATE INDEX IF NOT EXISTS "identity_status_idx" ON business_manager.identity("status");
CREATE INDEX IF NOT EXISTS "identity_email_idx" ON business_manager.identity("email");
CREATE INDEX IF NOT EXISTS "identity_phone_idx" ON business_manager.identity("phone");
CREATE UNIQUE INDEX IF NOT EXISTS "identity_provider_subject_key" ON business_manager.identity("provider", "subject");

CREATE INDEX IF NOT EXISTS "user_identity_userId_idx" ON business_manager.user_identity("userId");
CREATE INDEX IF NOT EXISTS "user_identity_identityId_idx" ON business_manager.user_identity("identityId");
CREATE UNIQUE INDEX IF NOT EXISTS "user_identity_userId_identityId_key" ON business_manager.user_identity("userId", "identityId");

CREATE INDEX IF NOT EXISTS "external_identity_link_identityId_idx" ON business_manager.external_identity_link("identityId");
CREATE UNIQUE INDEX IF NOT EXISTS "external_identity_link_providerType_providerInstanceId_extern_key" ON business_manager.external_identity_link("providerType", "providerInstanceId", "externalSubjectId");

CREATE UNIQUE INDEX IF NOT EXISTS "tenant_code_key" ON business_manager.tenant("code");
CREATE INDEX IF NOT EXISTS "tenant_status_idx" ON business_manager.tenant("status");

CREATE INDEX IF NOT EXISTS "organization_tenantId_idx" ON business_manager.organization("tenantId");
CREATE INDEX IF NOT EXISTS "organization_status_idx" ON business_manager.organization("status");
CREATE UNIQUE INDEX IF NOT EXISTS "organization_tenantId_code_key" ON business_manager.organization("tenantId", "code");

CREATE INDEX IF NOT EXISTS "site_organizationId_idx" ON business_manager.site("organizationId");
CREATE INDEX IF NOT EXISTS "site_status_idx" ON business_manager.site("status");
CREATE UNIQUE INDEX IF NOT EXISTS "site_organizationId_code_key" ON business_manager.site("organizationId", "code");

CREATE INDEX IF NOT EXISTS "membership_userId_idx" ON business_manager.membership("userId");
CREATE INDEX IF NOT EXISTS "membership_tenantId_idx" ON business_manager.membership("tenantId");
CREATE INDEX IF NOT EXISTS "membership_status_idx" ON business_manager.membership("status");
CREATE INDEX IF NOT EXISTS "membership_tenantId_status_idx" ON business_manager.membership("tenantId", "status");

CREATE INDEX IF NOT EXISTS "groups_tenantId_idx" ON business_manager.groups("tenantId");
CREATE UNIQUE INDEX IF NOT EXISTS "groups_tenantId_code_key" ON business_manager.groups("tenantId", "code");

CREATE INDEX IF NOT EXISTS "group_member_groupId_idx" ON business_manager.group_member("groupId");
CREATE INDEX IF NOT EXISTS "group_member_userId_idx" ON business_manager.group_member("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "group_member_groupId_userId_key" ON business_manager.group_member("groupId", "userId");

CREATE UNIQUE INDEX IF NOT EXISTS "permission_code_key" ON business_manager.permission("code");
CREATE INDEX IF NOT EXISTS "permission_resource_action_idx" ON business_manager.permission("resource", "action");
CREATE INDEX IF NOT EXISTS "permission_active_idx" ON business_manager.permission("active");

CREATE INDEX IF NOT EXISTS "role_tenantId_idx" ON business_manager.role("tenantId");
CREATE INDEX IF NOT EXISTS "role_status_idx" ON business_manager.role("status");
CREATE UNIQUE INDEX IF NOT EXISTS "role_tenantId_code_key" ON business_manager.role("tenantId", "code");

CREATE INDEX IF NOT EXISTS "role_permission_permissionId_idx" ON business_manager.role_permission("permissionId");

CREATE INDEX IF NOT EXISTS "role_assignment_roleId_idx" ON business_manager.role_assignment("roleId");
CREATE INDEX IF NOT EXISTS "role_assignment_userId_idx" ON business_manager.role_assignment("userId");
CREATE INDEX IF NOT EXISTS "role_assignment_groupId_idx" ON business_manager.role_assignment("groupId");

CREATE INDEX IF NOT EXISTS "access_policy_tenantId_idx" ON business_manager.access_policy("tenantId");
CREATE INDEX IF NOT EXISTS "access_policy_status_idx" ON business_manager.access_policy("status");
CREATE UNIQUE INDEX IF NOT EXISTS "access_policy_tenantId_code_version_key" ON business_manager.access_policy("tenantId", "code", "version");

CREATE INDEX IF NOT EXISTS "policy_condition_policyId_idx" ON business_manager.policy_condition("policyId");

CREATE INDEX IF NOT EXISTS "iam_credential_userId_idx" ON business_manager.iam_credential("userId");
CREATE INDEX IF NOT EXISTS "iam_credential_type_idx" ON business_manager.iam_credential("type");
CREATE INDEX IF NOT EXISTS "iam_credential_status_idx" ON business_manager.iam_credential("status");

CREATE INDEX IF NOT EXISTS "iam_device_userId_idx" ON business_manager.iam_device("userId");
CREATE INDEX IF NOT EXISTS "iam_session_userId_idx" ON business_manager.iam_session("userId");
CREATE INDEX IF NOT EXISTS "iam_session_status_idx" ON business_manager.iam_session("status");

CREATE INDEX IF NOT EXISTS "service_account_tenantId_idx" ON business_manager.service_account("tenantId");
CREATE UNIQUE INDEX IF NOT EXISTS "service_account_identityId_key" ON business_manager.service_account("identityId");
CREATE UNIQUE INDEX IF NOT EXISTS "service_account_tenantId_code_key" ON business_manager.service_account("tenantId", "code");

CREATE INDEX IF NOT EXISTS "platform_service_status_idx" ON business_manager.platform_service("status");

COMMIT;
