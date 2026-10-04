-- UI Builder (UI-BUILDER CDC V1) : pages + theme tokens, isolation tenant.
CREATE TYPE "UiPageType" AS ENUM ('LIST', 'DETAIL', 'FORM', 'DASHBOARD', 'CUSTOM');
CREATE TYPE "UiPageLayout" AS ENUM ('SIDEBAR', 'FULL_WIDTH', 'CENTERED');
CREATE TYPE "UiPageVisibility" AS ENUM ('ALWAYS', 'TENANT_ADMIN_ONLY', 'HIDDEN');
CREATE TYPE "UiThemeStatus" AS ENUM ('DRAFT', 'READY');

-- CreateTable
CREATE TABLE "ui_pages" (
    "id" UUID NOT NULL,
    "applicationId" UUID NOT NULL,
    "applicationVersionId" UUID NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "route" VARCHAR(200) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "type" "UiPageType" NOT NULL DEFAULT 'CUSTOM',
    "layout" "UiPageLayout" NOT NULL DEFAULT 'SIDEBAR',
    "visibility" "UiPageVisibility" NOT NULL DEFAULT 'ALWAYS',
    "order" INTEGER NOT NULL DEFAULT 0,
    "permissions" JSONB,
    "components" JSONB,
    "metadata" JSONB,
    "status" "UiThemeStatus" NOT NULL DEFAULT 'DRAFT',
    "tenantId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ui_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ui_theme_settings" (
    "id" UUID NOT NULL,
    "applicationId" UUID NOT NULL,
    "applicationVersionId" UUID NOT NULL,
    "tokens" JSONB NOT NULL,
    "status" "UiThemeStatus" NOT NULL DEFAULT 'DRAFT',
    "revision" INTEGER NOT NULL DEFAULT 1,
    "tenantId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ui_theme_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ui_pages_tenantId_applicationVersionId_key_key" ON "ui_pages"("tenantId", "applicationVersionId", "key");
CREATE INDEX "ui_pages_applicationVersionId_idx" ON "ui_pages"("applicationVersionId");
CREATE INDEX "ui_pages_tenantId_idx" ON "ui_pages"("tenantId");
CREATE INDEX "ui_pages_route_idx" ON "ui_pages"("route");

CREATE UNIQUE INDEX "ui_theme_settings_applicationVersionId_key" ON "ui_theme_settings"("applicationVersionId");
CREATE INDEX "ui_theme_settings_tenantId_idx" ON "ui_theme_settings"("tenantId");
