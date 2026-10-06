-- CreateEnum
CREATE TYPE "EnvironmentHistoryAction" AS ENUM ('CREATED', 'UPDATED', 'STATUS_CHANGED', 'CONFIGURATION_CHANGED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "environment_history" (
    "id" UUID NOT NULL,
    "environmentId" UUID NOT NULL,
    "action" "EnvironmentHistoryAction" NOT NULL,
    "actor" VARCHAR(100),
    "changes" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "environment_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "environment_history_environmentId_idx" ON "environment_history"("environmentId");

-- CreateIndex
CREATE INDEX "environment_history_action_idx" ON "environment_history"("action");

-- CreateIndex
CREATE INDEX "environment_history_createdAt_idx" ON "environment_history"("createdAt");

-- AddForeignKey
ALTER TABLE "environment_history" ADD CONSTRAINT "environment_history_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "environments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
