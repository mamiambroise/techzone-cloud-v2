CREATE TABLE business_manager."automation_workflows" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenantId" TEXT NOT NULL,
  "code" VARCHAR(100) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "version" VARCHAR(50) NOT NULL DEFAULT '1.0',
  "lifecycle" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  "steps" JSONB NOT NULL,
  "maxSteps" INTEGER NOT NULL DEFAULT 20,
  "createdBy" TEXT NOT NULL,
  "updatedBy" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "automation_workflows_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "automation_workflows_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES business_manager."tenant"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "automation_workflows_maxSteps_check" CHECK ("maxSteps" BETWEEN 1 AND 100)
);

CREATE UNIQUE INDEX "automation_workflows_tenantId_code_key"
  ON business_manager."automation_workflows"("tenantId", "code");
CREATE UNIQUE INDEX "automation_workflows_id_tenantId_key"
  ON business_manager."automation_workflows"("id", "tenantId");
CREATE INDEX "automation_workflows_tenantId_lifecycle_updatedAt_idx"
  ON business_manager."automation_workflows"("tenantId", "lifecycle", "updatedAt");

CREATE TABLE business_manager."automation_schedules" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenantId" TEXT NOT NULL,
  "workflowId" UUID NOT NULL,
  "frequencyMinutes" INTEGER NOT NULL,
  "timezone" VARCHAR(100) NOT NULL DEFAULT 'UTC',
  "enabled" BOOLEAN NOT NULL DEFAULT TRUE,
  "nextRunAt" TIMESTAMPTZ(6) NOT NULL,
  "lastRunAt" TIMESTAMPTZ(6),
  "lastRunStatus" VARCHAR(20),
  "lastRunError" TEXT,
  "lastExecutionId" VARCHAR(100),
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "automation_schedules_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "automation_schedules_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES business_manager."tenant"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "automation_schedules_workflowId_tenantId_fkey"
    FOREIGN KEY ("workflowId", "tenantId")
    REFERENCES business_manager."automation_workflows"("id", "tenantId")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "automation_schedules_frequencyMinutes_check" CHECK ("frequencyMinutes" BETWEEN 1 AND 10080)
);

CREATE INDEX "automation_schedules_tenantId_enabled_nextRunAt_idx"
  ON business_manager."automation_schedules"("tenantId", "enabled", "nextRunAt");
CREATE INDEX "automation_schedules_workflowId_tenantId_idx"
  ON business_manager."automation_schedules"("workflowId", "tenantId");
