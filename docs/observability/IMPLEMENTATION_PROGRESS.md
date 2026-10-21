# Observability & Diagnostics V3 — Progress

Last updated: 2026-10-21

## Continuation — database and operations

### Continuation — durable telemetry and tenant RBAC

- Inspected repository providers: no Loki, Tempo, Prometheus, ClickHouse,
  Elasticsearch or OpenTelemetry exporter is configured. PostgreSQL is the only
  existing durable provider, so `OBSERVABILITY_TELEMETRY_PROVIDER=postgres`
  is an explicit, bounded default rather than an implied high-volume solution.
- Added durable `observability_log` and `observability_metric` stores with
  tenant/time/trace indexes. Trace summaries are now re-derived from persisted
  logs after a restart; reads return `OBS_SOURCE_UNAVAILABLE` rather than
  in-memory fallback data when the provider is unavailable.
- Kept request telemetry non-blocking: durable writes are fire-and-forget and
  failures are isolated from the completed business response. Retention now
  covers logs, metrics and derived traces.
- Applied migration `20261021002000_observability_telemetry_persistence` to
  `techzone_test` only. Its integration proof writes, reads, paginates,
  tenant-filters, reconnects and removes uniquely-scoped test telemetry.
- Added all Observability permissions to the canonical RBAC seed and assigned
  them by least privilege: tenant user gets overview/metrics; application
  manager gets operational reads; tenant admin alone gets sensitive tenant
  management, audit/security and redacted export. No tenant role gets
  `iam:admin`.
- Corrected RBAC seed summary accounting so reruns report actual new grants,
  then verified seed idempotence and grants on `techzone_test`.

### Continuation — trace and settings delivery

- Added a dedicated, tenant-scoped `/api/observability/traces` endpoint. It
  groups real correlated request logs by trace ID and deliberately labels this
  as request-level correlation rather than fabricated distributed spans.
- Updated Trace Explorer to expose each real summary’s services, event/error
  counts, maximum observed duration, status and last activity.
- Added the `/observability/settings` React page and API-client bindings for
  persisted notification routes and retention policies. It has loading, error,
  empty and confirmed-save states; it does not show a delivery as successful
  before the server records it.
- Added the explicit `PURGE` confirmation requirement to the protected
  destructive retention endpoint. The settings UI only creates policies and
  never initiates a purge.
- Fixed tenant isolation in metric alert evaluation: a tenant rule now sees
  only metric points labelled for that tenant. Database outages during alert
  creation now surface rather than being falsely reported as deduplication.
- Added unit coverage for trace tenant isolation, metric-rule isolation,
  persistence-outage propagation and the destructive retention guard.
- Added permission-gated, redacted and tenant-scoped JSON exports for logs and
  audit events. Every successful export writes an `OBSERVABILITY_EXPORT` audit
  record; the UI only downloads the server response after authorization.

- Applied and verified both Observability migrations on the guarded
  `techzone_test` PostgreSQL database. The local development database remains
  untouched; no production migration was attempted.
- Added real rule evaluation over collected metrics or persisted security
  events, unique deduplication per rule/scope/fingerprint, cooldown handling,
  persisted alert state and optional scheduler (`OBSERVABILITY_SCHEDULER_ENABLED=true`).
- Added persistent notification routes/attempt history. Email is dispatched
  only when both `OBSERVABILITY_NOTIFICATIONS_ENABLED=true` and an SMTP host
  are configured; other/unconfigured channels are recorded as `SKIPPED`, never
  claimed successful.
- Added retention policy and execution history. Scheduled runs are dry-run;
  destructive execution must be explicitly requested through the protected API.
- Added granular IAM permission constants and tenant-scoped endpoint guards.
  Platform administration remains behind `iam:admin` and `IamAdminGuard`.
- Added real PostgreSQL persistence integration coverage:
  `npm run test:integration:observability` (creates then removes uniquely named
  test data in `techzone_test`).

## OBS-0 — Inventory

The canonical backend previously exposed an IAM-bound observability service:
security events, audit events, platform service/diagnostic records, and trace
headers existed, while logs and alerts were process-local arrays. The canonical
React pages were calling those routes, but the overview was non-functional and
historical mock files still informed several controls.

| Decision | Area | Evidence |
|---|---|---|
| KEEP / CONNECT | Audit and security events | `AuditEvent`, `SecurityEvent` Prisma models |
| KEEP / EXTEND | Platform health and diagnostics | `PlatformService`, `PlatformDiagnostic` |
| EXTEND | Trace context | application middleware now validates and propagates distinct identifiers |
| CREATE | Contracts, redaction, metrics recorder, persistent alert/incident state | `backend/src/observability` |
| REMOVE MOCK | Canonical observability pages | no canonical page imports `mockData.js` |

## Delivered in this iteration

- Versioned observability contracts; recursive secret redaction; metric
  cardinality protection; validated trace/request/correlation IDs.
- Non-blocking HTTP telemetry: structured request logs and actual in-process
  request/error/duration metrics. A telemetry failure is isolated from the
  request response.
- `/api/observability/*` for overview, health, logs, metrics, audit, security
  events, alerts, incidents and diagnostics. All list APIs enforce bounded
  pagination; log range is capped to 31 days.
- Persistent alert rules, alerts, incidents and timeline migration:
  `20261021000000_observability_v3`.
- Canonical UI uses the real APIs; overview, health, metrics, trace correlation
  view, incidents and diagnostics provide loading, empty and error states.

## Validation executed

| Command | Result |
|---|---|
| `backend/npx prisma generate` | PASS |
| `backend/npx prisma validate` | PASS |
| `backend/npm run prisma:test:migrate` | PASS — `techzone_test` only, 15 migrations applied |
| `backend/npm run prisma:test:status` | PASS — `techzone_test` schema up to date |
| `backend/npm run test:integration:observability` | PASS |
| `backend/npm run test:integration:observability-rbac` | PASS |
| `backend/npx nest build` | PASS |
| `backend/npm test -- --runInBand src/observability` | PASS (5 suites, 15 tests) |
| `backend/npm test -- --runInBand src/iam/iam-tenant-roles.spec.ts src/prisma/iam-rbac-seed.spec.ts` | PASS (2 suites, 26 tests) |
| `frontend/npx vite build` | PASS |
| Browser E2E | NOT RUN — no authenticated browser session available |
| Browser responsive validation | NOT RUN — no browser session available |

## Current matrix

| Lot | Backend | Frontend | Données réelles | UI/UX | Sécurité | Tests | Statut |
|---|---|---|---|---|---|---|---|
| OBS-0 Inventory | done | done | done | — | — | — | DONE |
| OBS-1 Contracts | done | — | — | — | schema boundaries | unit | DONE |
| OBS-2 Trace context | done | done | durable correlated logs | done | validated headers + tenant scope | unit + PostgreSQL integration | DONE (TEST) |
| OBS-3/4 Logging & redaction | done | done | durable PostgreSQL provider | done | redaction + unavailable provider handling | unit + PostgreSQL integration | DONE (TEST) |
| OBS-5/6 Metrics & health | done | done | durable PostgreSQL provider | done | cardinality + tenant scope | unit + PostgreSQL integration | DONE (TEST) |
| OBS-7/8 Audit & security events | connected | done | persisted source tables | done | server scope | integration pending | PARTIAL |
| OBS-9/10 Alerts & incidents | done | partial | persistent after migration | partial | tenant ownership checks | unit + PostgreSQL integration | PARTIAL |
| OBS-11 Diagnostics | connected | done | persisted/platform health | partial | redacted | integration pending | PARTIAL |
| OBS-12 Retention | done | done | persisted policy/run state | done | dry-run + explicit `PURGE` token | unit + PostgreSQL integration | PARTIAL |
| OBS-13/14 UI & tenant security | done | done | real APIs | done | RBAC seed + tenant guards | unit + PostgreSQL integration + build | DONE (TEST) |
| OBS-15 E2E | — | — | — | — | — | — | BLOCKED: no Observability browser fixture |

## Explicit limitations / next work

- PostgreSQL is the verified bounded provider. High-volume production requires
  capacity sizing or a configured specialised provider before activation.
- Browser E2E/responsive certification remains blocked: Edge is installed, but
  no authenticated Observability browser fixture, controlled frontend/backend
  pair or visual test script currently exists. A Vite build is not E2E proof.
- Production deployment still requires explicit authorization to apply all
  migrations, set the provider configuration and run the RBAC seed; none was
  performed in production.
