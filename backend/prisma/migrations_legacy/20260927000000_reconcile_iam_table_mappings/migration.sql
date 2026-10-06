-- Reconcile IAM table mappings
-- Drop auth_aim schema (PascalCase tables + enums) after schema has been
-- recreated in business_manager (snake_case) via prisma db push
-- This migration is followed by: npx prisma db push --accept-data-loss

BEGIN;

-- Drop auth_aim schema including all tables, types, and indexes
DROP SCHEMA IF EXISTS auth_aim CASCADE;

COMMIT;
