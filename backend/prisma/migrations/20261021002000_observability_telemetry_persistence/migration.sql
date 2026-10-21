-- Durable, bounded PostgreSQL telemetry provider. High-volume deployments may
-- use a specialised provider through the same service boundary.
CREATE TABLE "observability_log" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "tenantId" UUID,
  "traceId" VARCHAR(128) NOT NULL,
  "requestId" VARCHAR(128),
  "correlationId" VARCHAR(128),
  "module" VARCHAR(100) NOT NULL,
  "service" VARCHAR(100) NOT NULL,
  "operation" VARCHAR(255),
  "severity" VARCHAR(20) NOT NULL,
  "status" VARCHAR(32),
  "durationMs" INTEGER,
  "category" VARCHAR(32) NOT NULL,
  "event" VARCHAR(160) NOT NULL,
  "message" TEXT NOT NULL,
  "attributes" JSONB,
  CONSTRAINT "observability_log_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "observability_log_tenantId_timestamp_idx" ON "observability_log"("tenantId", "timestamp");
CREATE INDEX "observability_log_tenantId_traceId_timestamp_idx" ON "observability_log"("tenantId", "traceId", "timestamp");
CREATE INDEX "observability_log_traceId_timestamp_idx" ON "observability_log"("traceId", "timestamp");
CREATE INDEX "observability_log_severity_timestamp_idx" ON "observability_log"("severity", "timestamp");

CREATE TABLE "observability_metric" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "tenantId" UUID,
  "name" VARCHAR(160) NOT NULL,
  "type" VARCHAR(20) NOT NULL,
  "value" DOUBLE PRECISION NOT NULL,
  "labels" JSONB NOT NULL,
  CONSTRAINT "observability_metric_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "observability_metric_tenantId_name_timestamp_idx" ON "observability_metric"("tenantId", "name", "timestamp");
CREATE INDEX "observability_metric_name_timestamp_idx" ON "observability_metric"("name", "timestamp");
