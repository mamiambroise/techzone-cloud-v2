ALTER TABLE business_manager.observability_alert ADD COLUMN IF NOT EXISTS "scopeKey" varchar(100) NOT NULL DEFAULT 'PLATFORM';
ALTER TABLE business_manager.observability_alert DROP CONSTRAINT IF EXISTS observability_alert_ruleId_tenantId_fingerprint_key;
CREATE UNIQUE INDEX IF NOT EXISTS observability_alert_rule_scope_fingerprint_key ON business_manager.observability_alert ("ruleId", "scopeKey", fingerprint);

CREATE TABLE IF NOT EXISTS business_manager.observability_notification_route (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), "tenantId" uuid NULL, name varchar(255) NOT NULL,
  severity varchar(20) NULL, channel varchar(20) NOT NULL, recipients jsonb NOT NULL,
  enabled boolean NOT NULL DEFAULT true, "cooldownSec" integer NOT NULL DEFAULT 300,
  "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS observability_notification_route_scope_idx ON business_manager.observability_notification_route ("tenantId", enabled, severity);

CREATE TABLE IF NOT EXISTS business_manager.observability_notification_attempt (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), "alertId" uuid NOT NULL REFERENCES business_manager.observability_alert(id) ON DELETE CASCADE,
  "routeId" uuid NOT NULL REFERENCES business_manager.observability_notification_route(id) ON DELETE CASCADE,
  channel varchar(20) NOT NULL, recipient varchar(255) NOT NULL, status varchar(20) NOT NULL,
  attempt integer NOT NULL DEFAULT 1, "errorCode" varchar(100) NULL,
  "attemptedAt" timestamptz NOT NULL DEFAULT now(), "sentAt" timestamptz NULL
);
CREATE INDEX IF NOT EXISTS observability_notification_attempt_alert_route_idx ON business_manager.observability_notification_attempt ("alertId", "routeId", "attemptedAt");

CREATE TABLE IF NOT EXISTS business_manager.observability_retention_policy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), "tenantId" uuid NULL, "signalType" varchar(50) NOT NULL,
  "retentionDays" integer NOT NULL, enabled boolean NOT NULL DEFAULT true, archive boolean NOT NULL DEFAULT false,
  "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("tenantId", "signalType"), CHECK ("retentionDays" > 0)
);
CREATE INDEX IF NOT EXISTS observability_retention_policy_enabled_idx ON business_manager.observability_retention_policy (enabled);

CREATE TABLE IF NOT EXISTS business_manager.observability_retention_run (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), "policyId" uuid NOT NULL REFERENCES business_manager.observability_retention_policy(id) ON DELETE CASCADE,
  "dryRun" boolean NOT NULL DEFAULT true, status varchar(20) NOT NULL, affected integer NOT NULL DEFAULT 0,
  details jsonb NULL, "startedAt" timestamptz NOT NULL DEFAULT now(), "completedAt" timestamptz NULL
);
CREATE INDEX IF NOT EXISTS observability_retention_run_policy_started_idx ON business_manager.observability_retention_run ("policyId", "startedAt");
