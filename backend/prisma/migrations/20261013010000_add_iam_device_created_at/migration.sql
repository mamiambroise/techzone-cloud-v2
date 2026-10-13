-- Existing Device rows receive the migration time; future rows use Prisma's
-- expected creation timestamp default.
ALTER TABLE business_manager.iam_device
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
