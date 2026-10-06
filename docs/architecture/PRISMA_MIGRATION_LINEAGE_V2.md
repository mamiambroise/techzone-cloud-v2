# Prisma lineage v2

Validated on 2026-10-04, exclusively on disposable PostgreSQL databases.

## Active history

`backend/prisma7.config.ts` selects `backend/prisma/migrations`:

1. `20261004000000_baseline_v2`: schema-only baseline of the read-only Phase 4
   source, including 132 existing tables. No application data or migration history.
2. `20261004001000_business_records`: generic JSONB persistence, entity FK,
   primary key, three B-tree indexes and one GIN index.

The 22 historical directories are preserved in `migrations_legacy`, including
the restored original Pack SQL and the billing SQL under its Prisma filename.
They are NOT an executable history: multiple historical generations and drift
prevent safe replay. Never reactivate or resolve all legacy migrations.

The baseline uses `CREATE SCHEMA IF NOT EXISTS business_manager` because Prisma
initializes its migration schema. SQL is UTF-8 without BOM or psql directives.
Business-record identifiers and FK targets are schema-qualified. The validated
SQL bytes are preserved by `.gitattributes` to avoid Windows checksum changes.

## Fresh installation

Using the locked backend dependencies, set a verified target DATABASE_URL and run
from `backend`:

```powershell
node node_modules/prisma/build/index.js migrate deploy --config prisma7.config.ts
node node_modules/prisma/build/index.js migrate status --config prisma7.config.ts
```

Both migrations must execute normally, with `applied_steps_count = 1`. Applying
SQL with psql alone is not sufficient proof of Prisma deployment.

## Existing-database adoption

This procedure is **not authorized on techzonecloud_local by Phase 6**.
Production requires a separate approved maintenance operation.

1. Verify the actual database name, schema, server, ownership and access controls.
2. Take a complete backup and demonstrate restoration to a separate database.
3. Stop application writes. Capture schema, constraints, indexes, enums, table
   counts and deterministic data hashes. Compare with the baseline/source.
4. Require no incompatible existing migration history and no business_records.
   If history already exists, stop for a separately reviewed history-transition
   procedure; do not delete it or blindly resolve more entries.
5. Only after equivalence has been reviewed, adopt the baseline without SQL:

```powershell
node node_modules/prisma/build/index.js migrate resolve --applied 20261004000000_baseline_v2 --config prisma7.config.ts
node node_modules/prisma/build/index.js migrate status --config prisma7.config.ts
```

6. Verify exactly one entry, zero executed baseline steps, unchanged business
   hashes, and business_records still absent.
7. Run migrate deploy. Never resolve business_records as applied.
8. Verify two completed entries, their checksums, no legacy entries, unchanged
   historical records, an empty new table, FK/PK/indexes and JSONB type.
9. Run validate, generate, build and scoped authenticated acceptance tests before
   enabling application traffic.

## Future migrations and known drift

This baseline captures the actual source database; it does **not** claim that
every preexisting model in schema.prisma matches that source. In particular
`pm_pack_versions.applicationVersionId` is absent. Pack publication is blocked
until a reviewed additive migration reconciles that contract. The archived SQL
is evidence, not permission to replay it. Other historical type/default drift
must be reviewed before any schema-generated migration.

Do not use `db push`, `migrate reset`, or an unreviewed generated diff on an
existing database. Build future additive migrations against disposable restored
copies, inspect every SQL statement, test fresh replay and populated adoption,
and verify no unintended drops/casts. Keep the two validated migrations immutable
after integration; new changes belong in a subsequent migration.

Rollback means restore the verified backup to a new database and switch the
application after reconciliation of any new writes, or apply a reviewed forward
fix. Dropping business_records after accepting writes is not a safe rollback.

## Reproducible local proof

The scripts accept credentials through `PH6_ENV_FILE` (not committed). The
database helper replaces the database name before connecting and verifies
`current_database()`. Only the two explicit disposable databases permit writes;
the Phase 4 source is read-only. The original database is never contacted.

```powershell
node scripts/ph6-database.cjs techzonecloud_baseline_v2_adoption_test verify
node scripts/ph6-database.cjs techzonecloud_baseline_v2_adoption_test verify-source-data
node scripts/ph6-runtime.cjs
```

Run the runtime recipe after backend generation/build and frontend npm ci. It
starts its own backend on 3106, authenticates through IAM, creates PH6 fixtures,
calls real BM/Data Runtime/UI APIs and runs the React renderer against that API.
It leaves fixtures in the disposable adoption database and stops only its own
backend process. Evidence/logs are ignored under `backend/.tmp`.

## Runtime guarantees and limits

- Tenant and user context come from IAM, never the request body.
- Records have application-level identity across versions; schemaVersion and
  entityId retain the creating definition. Resource versions are tenant-checked.
- Typed validation, uniqueness, relation target entity/tenant checks and archive
  use the generic provider; no Customer/Order-specific implementation.
- Writes serialize through a PostgreSQL transaction advisory lock per
  tenant/application. This protects application writes, not arbitrary external SQL.
- Filters/sorts/pagination execute in PostgreSQL with bound parameters;
  list/count share a repeatable-read snapshot. Relation expansion is explicitly
  unsupported rather than silently ignored.
- Declared active BM capabilities are checked within their application version.
  Without a declared capability, the global Data Runtime IAM permission applies.
- Idempotency is bounded, process-local and scoped to actor/resource/operation/
  payload; permission is rechecked before replay. Durable exactly-once delivery
  is not claimed. Atomic BM batches are rejected because rollback is not implemented.
- UI preview remains read-only. The shared renderer in runtime mode writes via
  Data Runtime. A complete published-Pack runtime is not yet certified.
