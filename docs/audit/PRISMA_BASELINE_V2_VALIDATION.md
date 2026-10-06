# Phase 6 validation — 2026-10-04

## Environment

npm 10.9.3; Node 22.19.0; Prisma CLI/client 7.10.0; PostgreSQL 18.1.
`npm ci --no-audit --no-fund` completed separately in backend and frontend using
their existing lockfiles. No upgrades or copied node_modules. Nest toolchain
Node engine warnings did not prevent build/tests. Frontend Vite chunk-size
warning remains non-blocking.

## Prisma Fresh / Adoption: PASS

Fresh database: `techzonecloud_baseline_v2_empty_test`.
Adoption database: `techzonecloud_baseline_v2_adoption_test`.
Read-only source: `techzonecloud_baseline_phase4`.

The earlier psql-only Fresh proof had no _prisma_migrations. A real Prisma deploy
exposed a UTF-8 BOM syntax error (P3018/42601); removing it and making schema
creation compatible with Prisma fixed fresh deployment. Only temporary databases
were recreated. Adoption was restored and replayed with the final SQL checksums.

| Migration | Fresh executed steps | Adoption executed steps |
| --- | ---: | ---: |
| 20261004000000_baseline_v2 | 1 | 0 (resolve only) |
| 20261004001000_business_records | 1 | 1 (deploy) |

Exactly these two successful migrations exist; no legacy entries or failed rows.
Both targets use identical, locally verified SHA-256 checksums:

- baseline: `c4690903d4120bc6397b532e24f3dbfdd1d792c60580590475153427f0b18e9e`
- records: `97c64bf114dbbe5072b99748c89cfea2c93ddf7fe076a080df46bba3ef92444c`

Source/adoption column structures and original data hashes matched before adoption.
On the first adoption run all 132 business-table hashes stayed identical after
resolve and deploy; the new records table was empty. Following final restoration
and PH6 fixtures, every one of the 3,210 original rows across 132 source tables
was still present byte-equivalently as canonical JSON in adoption. New PH6 rows
are additional and must not be confused with the pre-fixture totals.

| Existing population | Before | After adoption / migration, before fixtures |
| --- | ---: | ---: |
| Tenants | 5 | 5 |
| IAM users | 4 | 4 |
| Applications | 19 | 19 |
| Application versions | 19 | 19 |
| BM entities | 73 | 73 |
| BM fields | 371 | 371 |
| BM field validations | 259 | 259 |
| UI pages | 3 | 3 |
| UI theme settings | 1 | 1 |
| Pack versions | 5 | 5 |
| Billing tables | 0 | 0 |

UI projects are assembled by ApplicationVersion, not stored in a separate table.
business_records: JSONB data, UUID PK, FK to business_manager.bm_entities,
three B-tree indexes plus GIN (in addition to the PK index). Prisma model now
maps the physical truncated index name and database-generated UUID default.
Prisma validate, generate and migrate status passed.

## Real Data Runtime and tenant recipe: PASS

`backend/scripts/ph6-runtime.cjs` uses real IAM login cookies, a dedicated backend,
real PostgreSQL and PH6 tenants/applications. BM entities, fields, validations,
relations and UI pages are created via real APIs. The existing entity lifecycle
has no activation endpoint: only these PH6 fixture definitions are promoted to
ACTIVE with Prisma. This is not claimed as a tested BM activation workflow.

PASS: CREATE + PostgreSQL proof; QUERY; UPDATE + PostgreSQL proof; duplicate
UNIQUE refusal; REQUIRED; TYPE; UNKNOWN FIELD; valid/invalid ENUM; valid RELATION;
ARCHIVE + physical archivedAt; FILTER; SORT; PAGINATION; cross-tenant QUERY,
UPDATE and RELATION; wrong target entity; spoofed context rejection.

Six simultaneous creates with the same unique value yield exactly one successful
record. Global IAM permissions: non-admin refused (403), admin accepted. No
operation-specific active capability is automatically created by this fixture;
that fallback is documented, not presented as a separately granted BM permission.

## UI / Pack / Runtime

- UI definition creation and validation: PASS.
- Shared React Form + DataTable: PASS against real backend and PostgreSQL,
  including checkbox boolean serialization, successful CREATE envelope and
  list refresh showing the stored PH6 record. No API mock or demo fallback.
- Test environment is happy-dom, not a full browser visual/accessibility audit.
  Existing styling retained; frontend skill guided typed input/error-state work.
- Pack creation succeeds, but version creation fails: Prisma P2022 reports
  `pm_pack_versions.applicationVersionId` absent. It is also absent from the
  baseline source; the archived additive migration was not applied there.
- PACK: PARTIAL/BLOCKED for publication. RUNTIME: PARTIAL. Published immutable
  snapshot/Form/List end-to-end proof could not be reached. Unit tests of Pack
  snapshot/runtime contracts pass but do not replace that missing database proof.
- Repair requires a separately reviewed additive migration beyond the explicitly
  mandated two-entry lineage, not silently changing the adopted baseline.

## Tests

Backend targeted run: 17 suites, 124 tests passed (Data Runtime, BM, UI Builder,
Pack Manager, Pack Runtime), including new query-safety regression tests.
Frontend UI Builder run: 48 passed; opt-in PostgreSQL renderer test skipped in
ordinary unit runs and passed separately during the real recipe. Backend and
frontend production builds passed. See Git history for any final rerun updates.

## Corrections made

1. Installed missing locked dependencies and used the local Prisma 7 config/CLI.
2. Removed baseline BOM; schema creation is Prisma-compatible; records SQL uses
   explicit schema qualification; protected migration bytes from CRLF conversion.
3. Removed body-supplied query/binding authority, fixing real Query DTO failures.
4. Implemented database-side filters/sorts/count/pagination and dynamic metadata.
5. Serialized generic writes, scoped relation targets and capability declarations,
   checked email/finite numeric values and rejected unsupported atomic batches.
6. Scoped idempotency replay and rechecked permission before cached responses.
7. Resolved UI entity codes with explicit version context, serialized typed fields,
   preserved Execute envelopes, flattened stored data for tables and surfaced errors.

## Safety and decision

## Integration verification

Technical commits `b537c12f`, `dbb5814f`, `cc2eb453` were fast-forwarded into
`mami`. The complete preexisting unstaged diff hash and porcelain status were
identical before/after integration; unrelated missing assets, legacy files and
user source edits were not staged, restored or discarded.

Post-integration Prisma validate/generate and Nest build passed. Data Runtime
rerun: 5 suites, 47 tests passed. Both temporary databases report exactly two
migrations and schema up to date; committed SQL checksums still match. A leftover
empty historical Pack migration directory in the main checkout initially appeared
as a third pending migration. Its exact path and emptiness were verified before
removing only that empty directory. No file/data was lost; status then passed.

Latest real recipe: 23 PASS, one explicitly PARTIAL Pack publication check.
The historical-row preservation check was rerun after integration: all 3,210
source rows in all 132 tables remain unchanged in adoption.

## Database safety

`techzonecloud_local = UNCHANGED` by this mission: no command connected to or
mutated it, and no PH6 fixture was sent there. This is a command-scope guarantee,
not a fresh live scan of the forbidden original database. Only the two disposable
databases were recreated; their previous temporary contents were replaced from
the source backup/replay. No demonstration reset was executed.

PRISMA LINEAGE V2 + DATA RUNTIME : GO

RESET 10 DEMOS + 2 BOUTIQUES : GO

GO authorizes preparing the next BM/Data Runtime phase, not deleting demos now,
not migrating production now, and not claiming published Pack runtime readiness.
