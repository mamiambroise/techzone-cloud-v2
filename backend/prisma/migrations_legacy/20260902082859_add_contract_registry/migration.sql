-- CreateEnum
CREATE TYPE "ContractHistoryAction" AS ENUM ('CREATED', 'VALIDATED', 'LOCKED', 'ACTIVATED', 'DEPRECATED', 'RETIRED', 'COMPATIBILITY_CHECKED');

-- CreateEnum
CREATE TYPE "ContractParticipantType" AS ENUM ('APPLICATION', 'PACK', 'SERVICE', 'TEAM', 'EXTERNAL');

-- AlterEnum
ALTER TYPE "ConfigurationStatus" ADD VALUE 'READY';

-- DropIndex
DROP INDEX "deployment_history_applicationId_idx";

-- DropIndex
DROP INDEX "deployment_history_createdAt_idx";

-- DropIndex
DROP INDEX "deployment_history_environmentId_idx";

-- DropIndex
DROP INDEX "integration_logs_connectorId_idx";

-- DropIndex
DROP INDEX "integration_logs_status_idx";

-- DropIndex
DROP INDEX "integration_logs_tenantId_idx";

-- DropIndex
DROP INDEX "integration_logs_traceId_idx";

-- AlterTable
ALTER TABLE "deployments" ALTER COLUMN "idempotencyKey" DROP NOT NULL;

-- CreateTable
CREATE TABLE "contract_history" (
    "id" UUID NOT NULL,
    "contractId" UUID NOT NULL,
    "action" "ContractHistoryAction" NOT NULL,
    "actor" VARCHAR(100),
    "changes" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_providers" (
    "id" UUID NOT NULL,
    "contractId" UUID NOT NULL,
    "providerCode" VARCHAR(100) NOT NULL,
    "providerType" "ContractParticipantType" NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_consumers" (
    "id" UUID NOT NULL,
    "contractId" UUID NOT NULL,
    "consumerCode" VARCHAR(100) NOT NULL,
    "consumerType" "ContractParticipantType" NOT NULL,
    "supportedVersion" VARCHAR(50),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_consumers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contract_history_contractId_idx" ON "contract_history"("contractId");

-- CreateIndex
CREATE INDEX "contract_history_action_idx" ON "contract_history"("action");

-- CreateIndex
CREATE INDEX "contract_history_createdAt_idx" ON "contract_history"("createdAt");

-- CreateIndex
CREATE INDEX "contract_providers_contractId_idx" ON "contract_providers"("contractId");

-- CreateIndex
CREATE INDEX "contract_providers_providerCode_idx" ON "contract_providers"("providerCode");

-- CreateIndex
CREATE UNIQUE INDEX "contract_providers_contractId_providerCode_key" ON "contract_providers"("contractId", "providerCode");

-- CreateIndex
CREATE INDEX "contract_consumers_contractId_idx" ON "contract_consumers"("contractId");

-- CreateIndex
CREATE INDEX "contract_consumers_consumerCode_idx" ON "contract_consumers"("consumerCode");

-- CreateIndex
CREATE UNIQUE INDEX "contract_consumers_contractId_consumerCode_key" ON "contract_consumers"("contractId", "consumerCode");

-- CreateIndex
CREATE INDEX "deployment_history_applicationId_environmentId_createdAt_idx" ON "deployment_history"("applicationId", "environmentId", "createdAt");

-- CreateIndex
CREATE INDEX "integration_logs_tenantId_createdAt_idx" ON "integration_logs"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "integration_logs_connectorId_status_idx" ON "integration_logs"("connectorId", "status");

-- AddForeignKey
ALTER TABLE "contract_history" ADD CONSTRAINT "contract_history_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_providers" ADD CONSTRAINT "contract_providers_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_consumers" ADD CONSTRAINT "contract_consumers_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
