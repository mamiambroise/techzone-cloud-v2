-- Fail on existing duplicates rather than deleting or rewriting user pages.
CREATE UNIQUE INDEX "ui_pages_tenantId_applicationVersionId_route_key"
ON "business_manager"."ui_pages"("tenantId", "applicationVersionId", "route");
