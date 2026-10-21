-- Low-volume Observability V3 state. Telemetry streams remain external/in-memory
-- adapters; this migration does not move existing audit or security-event data.
CREATE TABLE IF NOT EXISTS business_manager.observability_alert_rule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" uuid NULL,
  code varchar(120) NOT NULL,
  name varchar(255) NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  severity varchar(20) NOT NULL,
  condition jsonb NOT NULL,
  scope jsonb NULL,
  "cooldownSec" integer NOT NULL DEFAULT 300,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("tenantId", code)
);

CREATE TABLE IF NOT EXISTS business_manager.observability_alert (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "ruleId" uuid NULL REFERENCES business_manager.observability_alert_rule(id) ON DELETE SET NULL,
  "tenantId" uuid NULL,
  fingerprint varchar(255) NOT NULL,
  severity varchar(20) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'OPEN',
  summary varchar(500) NOT NULL,
  description text NULL,
  resource varchar(255) NULL,
  "traceId" varchar(128) NULL,
  "openedAt" timestamptz NOT NULL DEFAULT now(),
  "lastOccurredAt" timestamptz NOT NULL DEFAULT now(),
  occurrences integer NOT NULL DEFAULT 1,
  "acknowledgedAt" timestamptz NULL,
  "resolvedAt" timestamptz NULL,
  "assigneeId" text NULL,
  "resolutionNote" text NULL,
  metadata jsonb NULL,
  UNIQUE ("ruleId", "tenantId", fingerprint)
);

CREATE TABLE IF NOT EXISTS business_manager.observability_incident (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" uuid NULL,
  title varchar(255) NOT NULL,
  description text NULL,
  severity varchar(20) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'OPEN',
  "ownerId" text NULL,
  "openedAt" timestamptz NOT NULL DEFAULT now(),
  "resolvedAt" timestamptz NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS business_manager.observability_incident_alert (
  "incidentId" uuid NOT NULL REFERENCES business_manager.observability_incident(id) ON DELETE CASCADE,
  "alertId" uuid NOT NULL REFERENCES business_manager.observability_alert(id) ON DELETE RESTRICT,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("incidentId", "alertId")
);

CREATE TABLE IF NOT EXISTS business_manager.observability_incident_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "incidentId" uuid NOT NULL REFERENCES business_manager.observability_incident(id) ON DELETE CASCADE,
  type varchar(50) NOT NULL,
  message text NOT NULL,
  "actorId" text NULL,
  "traceId" varchar(128) NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS observability_alert_tenant_status_last_idx ON business_manager.observability_alert ("tenantId", status, "lastOccurredAt");
CREATE INDEX IF NOT EXISTS observability_alert_trace_idx ON business_manager.observability_alert ("traceId");
CREATE INDEX IF NOT EXISTS observability_incident_tenant_status_updated_idx ON business_manager.observability_incident ("tenantId", status, "updatedAt");
CREATE INDEX IF NOT EXISTS observability_incident_alert_alert_idx ON business_manager.observability_incident_alert ("alertId");
CREATE INDEX IF NOT EXISTS observability_incident_timeline_incident_created_idx ON business_manager.observability_incident_timeline ("incidentId", "createdAt");
