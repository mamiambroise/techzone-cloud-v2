-- CreateEnum
CREATE TYPE "ConfigurationHistoryAction" AS ENUM ('CREATED', 'UPDATED', 'VALIDATED', 'ACTIVATED', 'DEPRECATED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "configuration_history" (
    "id" UUID NOT NULL,
    "configurationId" UUID NOT NULL,
    "action" "ConfigurationHistoryAction" NOT NULL,
    "actor" VARCHAR(100),
    "changes" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "configuration_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "configuration_history_configurationId_idx" ON "configuration_history"("configurationId");

-- CreateIndex
CREATE INDEX "configuration_history_action_idx" ON "configuration_history"("action");

-- CreateIndex
CREATE INDEX "configuration_history_createdAt_idx" ON "configuration_history"("createdAt");

-- AddForeignKey
ALTER TABLE "configuration_history" ADD CONSTRAINT "configuration_history_configurationId_fkey" FOREIGN KEY ("configurationId") REFERENCES "configurations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
