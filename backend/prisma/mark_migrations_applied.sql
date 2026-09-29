-- Mark remaining pending migrations as applied in _prisma_migrations
-- This script inserts records for migrations that were already executed externally

BEGIN;

-- Mark webhook_event migration as applied
INSERT INTO "business_manager"."_prisma_migrations" ("id", "checksum", "creation_name", "created_at", "applied", "hash", "root_migration_id")
VALUES ('20260911053236_add_webhook_event', 'df0261bc10bd3f02901f0e6e1a2db07d895b801f98d59777724f0c3dd376b86d', '20260911053236_add_webhook_event', NOW(), TRUE, NULL, NULL)
ON CONFLICT ("id") DO UPDATE SET "applied" = TRUE;

-- Mark tenant_isolation migration as applied
INSERT INTO "business_manager"."_prisma_migrations" ("id", "checksum", "creation_name", "created_at", "applied", "hash", "root_migration_id")
VALUES ('20260919000000_add_tenant_isolation', '6683ac6b5a1b09293f84d49437c3d7a014a724c21464b69b7b918e5a948dd91b', '20260919000000_add_tenant_isolation', NOW(), TRUE, NULL, NULL)
ON CONFLICT ("id") DO UPDATE SET "applied" = TRUE;

-- Mark reconcile_iam_table_mappings migration as applied
INSERT INTO "business_manager"."_prisma_migrations" ("id", "checksum", "creation_name", "created_at", "applied", "hash", "root_migration_id")
VALUES ('20260927000000_reconcile_iam_table_mappings', '81693f2e6d6a608140bf9dc1e83f0fc9208b81e31fa3043a31c007dc54cdc472', '20260927000000_reconcile_iam_table_mappings', NOW(), TRUE, NULL, NULL)
ON CONFLICT ("id") DO UPDATE SET "applied" = TRUE;

COMMIT;
