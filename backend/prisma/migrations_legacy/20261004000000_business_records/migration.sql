CREATE TABLE "business_records" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL,
  "applicationId" UUID NOT NULL,
  "entityId" UUID NOT NULL,
  "entityCode" VARCHAR(100) NOT NULL,
  "schemaVersion" VARCHAR(50) NOT NULL,
  "data" JSONB NOT NULL,
  "createdBy" TEXT,
  "updatedBy" TEXT,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "business_records_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "business_records_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "bm_entities"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "business_records_tenantId_applicationId_entityCode_archivedAt_idx" ON "business_records"("tenantId", "applicationId", "entityCode", "archivedAt");
CREATE INDEX "business_records_tenantId_entityId_archivedAt_idx" ON "business_records"("tenantId", "entityId", "archivedAt");
CREATE INDEX "business_records_applicationId_entityCode_idx" ON "business_records"("applicationId", "entityCode");
CREATE INDEX "business_records_data_gin_idx" ON "business_records" USING GIN ("data");
