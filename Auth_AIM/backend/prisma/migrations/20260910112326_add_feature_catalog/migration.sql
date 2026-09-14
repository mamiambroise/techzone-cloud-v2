-- CreateTable
CREATE TABLE "Feature" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "metered" BOOLEAN NOT NULL DEFAULT false,
    "quotaCode" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feature_pkey" PRIMARY KEY ("code")
);

-- CreateIndex
CREATE INDEX "Feature_status_idx" ON "Feature"("status");
