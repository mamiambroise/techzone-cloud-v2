-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'DISABLED');

-- CreateEnum
CREATE TYPE "ApplicationVersionStatus" AS ENUM ('DRAFT', 'CONFIGURING', 'VALIDATING', 'READY', 'ACTIVE', 'SUPERSEDED', 'DEPRECATED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "applications" (
    "id" UUID NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'ACTIVE',
    "tenantScope" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_versions" (
    "id" UUID NOT NULL,
    "applicationId" UUID NOT NULL,
    "version" VARCHAR(50) NOT NULL,
    "status" "ApplicationVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "releaseNotes" TEXT,
    "createdFrom" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "application_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "applications_code_key" ON "applications"("code");

-- CreateIndex
CREATE INDEX "applications_tenantScope_idx" ON "applications"("tenantScope");

-- CreateIndex
CREATE INDEX "applications_status_idx" ON "applications"("status");

-- CreateIndex
CREATE INDEX "application_versions_applicationId_idx" ON "application_versions"("applicationId");

-- CreateIndex
CREATE INDEX "application_versions_status_idx" ON "application_versions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "application_versions_applicationId_version_key" ON "application_versions"("applicationId", "version");

-- AddForeignKey
ALTER TABLE "application_versions" ADD CONSTRAINT "application_versions_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
