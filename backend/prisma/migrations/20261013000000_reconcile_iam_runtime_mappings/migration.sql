-- Preserve existing IAM data while aligning legacy table names with the
-- canonical Prisma mappings used by the application.
BEGIN;
SET LOCAL search_path TO business_manager, public;

DO $$
DECLARE
  mapping RECORD;
  old_table REGCLASS;
  new_table REGCLASS;
BEGIN
  FOR mapping IN
    SELECT * FROM (VALUES
      ('AccessPolicy', 'access_policy'),
      ('AdminDelegation', 'admin_delegation'),
      ('AdministrativeAction', 'administrative_action'),
      ('AuditEvent', 'audit_event'),
      ('AuthorizationDecision', 'authorization_decision'),
      ('BillingEvent', 'billing_event'),
      ('ContextInvalidation', 'context_invalidation'),
      ('ContextSnapshot', 'context_snapshot'),
      ('ContextSwitchEvent', 'context_switch_event'),
      ('Credential', 'iam_credential'),
      ('Device', 'iam_device'),
      ('ExternalIdentityLink', 'external_identity_link'),
      ('Feature', 'feature'),
      ('Group', 'groups'),
      ('GroupMember', 'group_member'),
      ('Identity', 'identity'),
      ('Invoice', 'invoice'),
      ('InvoiceItem', 'invoice_item'),
      ('Membership', 'membership'),
      ('MfaMethod', 'mfa_method'),
      ('Organization', 'organization'),
      ('OutboxEvent', 'outbox_event'),
      ('PasswordHistory', 'iam_password_history'),
      ('Payment', 'payment'),
      ('Permission', 'permission'),
      ('Plan', 'plan'),
      ('PlanEntitlement', 'plan_entitlement'),
      ('PlatformDiagnostic', 'platform_diagnostic'),
      ('PlatformMaintenance', 'platform_maintenance'),
      ('PlatformService', 'platform_service'),
      ('PolicyCondition', 'policy_condition'),
      ('QuotaUsage', 'quota_usage'),
      ('RecoveryCode', 'recovery_code'),
      ('RefreshToken', 'iam_refresh_token'),
      ('Role', 'role'),
      ('RoleAssignment', 'role_assignment'),
      ('RolePermission', 'role_permission'),
      ('SecurityEvent', 'security_event'),
      ('ServiceAccount', 'service_account'),
      ('ServiceAccountCredential', 'service_account_credential'),
      ('Session', 'iam_session'),
      ('Site', 'site'),
      ('Subscription', 'subscription'),
      ('SubscriptionEntitlementOverride', 'subscription_entitlement_override'),
      ('Tenant', 'tenant'),
      ('User', 'iam_user'),
      ('UserIdentity', 'user_identity'),
      ('WebhookEvent', 'webhook_event')
    ) AS mappings(old_name, new_name)
  LOOP
    old_table := to_regclass(format('%I.%I', current_schema(), mapping.old_name));
    new_table := to_regclass(format('%I.%I', current_schema(), mapping.new_name));

    IF old_table IS NOT NULL AND new_table IS NOT NULL THEN
      RAISE EXCEPTION
        'Cannot reconcile IAM table %.%: both legacy and canonical tables exist',
        current_schema(), mapping.old_name;
    ELSIF old_table IS NOT NULL THEN
      EXECUTE format(
        'ALTER TABLE %I.%I RENAME TO %I',
        current_schema(), mapping.old_name, mapping.new_name
      );
    END IF;
  END LOOP;
END $$;

ALTER TABLE IF EXISTS iam_user
  ADD COLUMN IF NOT EXISTS "isAdmin" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "passwordResetToken" TEXT,
  ADD COLUMN IF NOT EXISTS "passwordResetExpiresAt" TIMESTAMP(3);

ALTER TABLE IF EXISTS iam_device
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

DO $$
BEGIN
  IF to_regtype(format('%I.%I', current_schema(), 'IamCredentialType')) IS NULL THEN
    CREATE TYPE "IamCredentialType" AS ENUM ('PASSWORD', 'PASSKEY', 'API_KEY', 'EXTERNAL', 'RECOVERY');
  END IF;
  IF to_regtype(format('%I.%I', current_schema(), 'IamCredentialStatus')) IS NULL THEN
    CREATE TYPE "IamCredentialStatus" AS ENUM ('ACTIVE', 'DISABLED', 'REVOKED', 'EXPIRED');
  END IF;
  IF to_regtype(format('%I.%I', current_schema(), 'IamEnvironment')) IS NULL THEN
    CREATE TYPE "IamEnvironment" AS ENUM ('DEVELOPMENT', 'TEST', 'STAGING', 'PRODUCTION');
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass(format('%I.%I', current_schema(), 'iam_credential')) IS NOT NULL THEN
    ALTER TABLE iam_credential ALTER COLUMN "status" DROP DEFAULT;
    ALTER TABLE iam_credential
      ALTER COLUMN "type" TYPE "IamCredentialType"
        USING ("type"::TEXT::"IamCredentialType"),
      ALTER COLUMN "status" TYPE "IamCredentialStatus"
        USING ("status"::TEXT::"IamCredentialStatus");
    ALTER TABLE iam_credential ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
  END IF;

  IF to_regclass(format('%I.%I', current_schema(), 'iam_session')) IS NOT NULL THEN
    ALTER TABLE iam_session ALTER COLUMN "environment" DROP DEFAULT;
    ALTER TABLE iam_session
      ALTER COLUMN "environment" TYPE "IamEnvironment"
        USING ("environment"::TEXT::"IamEnvironment");
  END IF;
END $$;

COMMIT;
