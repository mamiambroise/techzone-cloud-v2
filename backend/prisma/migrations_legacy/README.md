# Historical migrations — NOT ACTIVE

This directory preserves the 22 historical migration directories. Prisma must
only use `../migrations`, configured in `prisma7.config.ts`. Never deploy this
archive or mark its entries applied to a lineage-v2 database.

Restored historical sources:

- `20260929120000_pack_manager_runtime/migration.sql`: commit
  `99203301917e709002c12c121e225415646f4695` (original migration path).
- `20261003120000_cdc15_subscription_billing/migration.sql`: original
  `subscription_billing.sql` from commit
  `4d20657ec2ecb4728717b71144f898a10e13f921`; original filename also retained.

The archive includes conflicting generations, divergent schema assumptions and
changes absent from the source database. Archiving does not claim all historical
SQL was applied. In particular the Pack application-version source column is
not present in the source baseline; its reconciliation requires a reviewed
future additive migration, not replaying this archive.
