# BM-CDC Implementation Matrix (Phase 0 — Audit)

> **Mission:** Align the Techzone Cloud Business Manager (`backend/` NestJS + `frontend/` React/Vite) with the 8 BM-CDC specifications (`bm/BM-CDC-01..08`).
> **Scope:** `backend/src/` and `frontend/src/` only. `techzone/` (Dolibarr PHP) is explicitly out of scope.
> **Date:** 2026-09-27
> **Phase:** 0 — Audit & Classification

## Classification Legend

| Label | Meaning |
|---|---|
| `IMPLEMENTED_REAL` | Real backend + real frontend + real tests pass end-to-end. |
| `IMPLEMENTED_PARTIAL` | Backend or frontend exists with real logic, but incomplete: missing key sub-features, no tenant scoping, mock data in frontend, or no tests. |
| `UI_ONLY` | Frontend component exists but calls mock/static data — no real backend. |
| `BACKEND_ONLY` | Backend API + service exist, but no real frontend component. |
| `MOCK` | Component renders static/demo mock data. No real backend integration. |
| `PLACEHOLDER` | Route registered but component is `null` or `DemoPage`. |
| `BROKEN` | Code exists but cannot function (missing imports, schema mismatch, broken route). |
| `MISSING` | Not started. Explicitly required by CDC. |
| `DUPLICATE` | Multiple implementations of the same concept (dead-code / conflicting). |
| `LEGACY_UNUSED` | Old code not referenced by any module or route. |

---

## BM-CDC-01 — Application Manager

| Feature | Code Location | Status | Evidence |
|---|---|---|---|
| Create Application (code, name, description) | `backend/src/modules/platform/applications/` | IMPLEMENTED_PARTIAL | Controller/service/DTO exist. `ApplicationStatus` enum. No tenant scoping. |
| Application status lifecycle (ACTIVE/ARCHIVED/DISABLED) | `applications.service.ts:80-95` | IMPLEMENTED_REAL | archive() enforces immutability checks. |
| CRUD Application | same as above | IMPLEMENTED_PARTIAL | `@Controller('api/business-manager/applications')` — findAll, create, findOne, update, archive. |
| Version clone | `application-versions.service.ts:162` | IMPLEMENTED_REAL | `clone()` generates incremented semver. |
| Version lifecycle transitions | `version-lifecycle.util.ts` | IMPLEMENTED_REAL | `canTransitionVersion()` validates state machine. |
| Version list per application | `application-versions.controller.ts:26` | IMPLEMENTED_REAL | `@Get('applications/:applicationId/versions')` under `@Controller('api/business-manager')` |
| Version publication flow to BM-CDC-07 | — | MISSING | No API to trigger contract/manifest generation. |
| Tenant scoping on Application queries | `Application.tenantScope` (schema.prisma:71) | FIXED | Tenant scoping enforced via `TenantGuard` and `principal.tenantId` filtering in all platform services. `tenantId` field added to platform models. |
| Frontend — Application catalog | `ApplicationsCatalogView.jsx` | IMPLEMENTED_PARTIAL | Calls `platformApplicationsService`. Anonymous-only (auth blocked). |
| Frontend — Application detail / workspace | `WorkspaceConfigView.jsx` | IMPLEMENTED_PARTIAL | PARTIAL — no tab wiring for data model / features / navigation within workspace. |

**Overall BM-CDC-01: IMPLEMENTED_PARTIAL** — Core CRUD works, but tenant isolation is broken and no publication bridge exists.

---

## BM-CDC-02 — Version Lifecycle Manager

| Feature | Code Location | Status | Evidence |
|---|---|---|---|
| Version status enum (DRAFT→CONFIGURING→VALIDATING→READY→ACTIVE→SUPERSEDED→DEPRECATED→ARCHIVED) | `schema.prisma:22` | IMPLEMENTED_REAL | Enum matches CDC lifecycle states. |
| Status transition enforcement | `application-versions.service.ts:118-160` | IMPLEMENTED_PARTIAL | `changeStatus()` validates transitions. Blocks ACTIVE→non-supersede. But no tenant scoping. |
| Clone version | `application-versions.service.ts:162-227` | IMPLEMENTED_REAL | Semver increment + collision avoidance. |
| PublishedAt tracking | `schema.prisma:103` | IMPLEMENTED_REAL | `publishedAt DateTime?` set on ACTIVE transition. |
| CreatedFrom (parent clone link) | `schema.prisma:95` | IMPLEMENTED_REAL | `createdFrom String?`. |
| Publication quality gate (BM-CDC-08) | — | MISSING | No integration with quality orchestrator before publication. |
| Publication runtime readiness (BM-CDC-07) | — | MISSING | No RuntimeManifest/Readiness check before publish. |
| Frontend — Versions detail | `VersionsDetailView.jsx` | IMPLEMENTED_PARTIAL | PARTIAL — no publication gate status display. |
| Frontend — Publication view | `PublicationView.jsx` | PLACEHOLDER | Prior audit: launch handler is NO_OP. No API call from launch action. |

**Overall BM-CDC-02: IMPLEMENTED_PARTIAL** — Lifecycle state machine works, but no quality gate or runtime readiness integration.

---

## BM-CDC-03 — Data Model Manager

| Feature | Code Location | Status | Evidence |
|---|---|---|---|
| DataModel entity/model | — | MISSING | No `DataModel` model in Prisma schema. No dedicated controller/service. |
| Define entity/fields | — | MISSING | No data model CRUD. |
| Schema versioning | — | MISSING | No data model revision tracking. |
| Schema diff / migration plan | — | MISSING | CDC-03 §80-85 requires schema diff + migration plan output. |
| Frontend — `/business/models` | `navigationConfig.js:81` | PLACEHOLDER | `component: null`, `status: NOT_IMPLEMENTED`, `classification: MISSING_PAGE`. |
| Data loss risk detection | — | MISSING | CDC-03 §91 requires `DATA_LOSS_RISK` flag. |

**Overall BM-CDC-03: MISSING** — No backend model, no frontend page. Completely unstarted.

---

## BM-CDC-04 — Feature & Capability Manager

| Feature | Code Location | Status | Evidence |
|---|---|---|---|
| Feature entity | `schema.prisma:2544` | IMPLEMENTED_PARTIAL | `Feature` model exists (code, name, description, status, metered, quotaCode). But no controller/service/DTO. |
| Feature CRUD | — | MISSING | No controller/service for Feature. Only DB model. |
| Capability entity | — | MISSING | No `Capability` model in schema. |
| Capability mapping | — | MISSING | CDC-04 requires capability definitions + mapping. None exists. |
| Feature/Capability contract for runtime | — | MISSING | No contract generation from features. |
| Frontend — `/business/features` | `navigationConfig.js:82` | PLACEHOLDER | `component: null`, `status: NOT_IMPLEMENTED`, `classification: MISSING_PAGE`. |
| Subscription plan features | `subscriptionSlice.js`, `billingFeaturesMockService.js` | MOCK | Features shown in billing are from mock data, not real Feature model. |

**Overall BM-CDC-04: MISSING** — Only a bare Prisma `Feature` model exists with no CRUD layer or UI.

---

## BM-CDC-05 — Menu Engine & Navigation Manager

| Feature | Code Location | Status | Evidence |
|---|---|---|---|
| Navigation registry (sections/groups/pages) | `frontend/src/app/navigationConfig.js` | IMPLEMENTED_PARTIAL | 92 route entries, sections, groups. Single source of truth. But frontend-only, no backend persistence. |
| Page definitions with permissions | `navigationConfig.js` (pageDefinitions) | IMPLEMENTED_REAL | Each page has `permission`, `protected`, `classification` fields. |
| Route resolution | `navigationConfig.js:273-276` | IMPLEMENTED_REAL | `resolveRoute()`, `activeNavigation()`. |
| Legacy redirects | `navigationConfig.js:181-271` | IMPLEMENTED_REAL | 28 redirect mappings from old routes. |
| Sidebar rendering | `Sidebar.jsx` | IMPLEMENTED_PARTIAL | Uses navigationConfig. Anonymous-only (auth blocked). |
| Navigation contract for runtime manifest | — | MISSING | No backend NavigationContract model or generation. |
| Route validation (invalid route detection) | — | MISSING | CDC-05 §13 requires route validation for quality gate. Not implemented. |
| Frontend — `/business/navigation` | `navigationConfig.js:83` | PLACEHOLDER | `component: null`, `status: NOT_IMPLEMENTED`. |
| Dynamic menu visibility (permission-based) | `navigationAccess.js` | IMPLEMENTED_PARTIAL | Exists but not validated (auth blocked). |

**Overall BM-CDC-05: IMPLEMENTED_PARTIAL** — Frontend navigation config is comprehensive but backend-less. No navigation contract generation for runtime manifest, no route validation in quality gate.

---

## BM-CDC-06 — Configuration & Metadata Manager

| Feature | Code Location | Status | Evidence |
|---|---|---|---|
| Configuration entity (key, scope, scopeId, type) | `schema.prisma:297-324` | IMPLEMENTED_REAL | `Configuration` model with `ConfigurationScope` (PLATFORM/APPLICATION/APPLICATION_VERSION/ENVIRONMENT/TENANT). |
| Configuration CRUD | `configuration.controller.ts` | IMPLEMENTED_REAL | findAll, findByScope, create, update, activate, validate. |
| Effective config resolution | `configuration.controller.ts:26` | IMPLEMENTED_PARTIAL | `/effective/:applicationId/:applicationVersionId/:environmentId` exists. Large service (31KB) but no tenant scoping. |
| Configuration history | `schema.prisma:335-355` | IMPLEMENTED_REAL | `ConfigurationHistory` with actions CREATED/UPDATED/VALIDATED/ACTIVATED/DEPRECATED/ARCHIVED. |
| Configuration status lifecycle | `schema.prisma:288-295` | IMPLEMENTED_REAL | DRAFT/VALIDATING/READY/ACTIVE/DEPRECATED/ARCHIVED. |
| Secret handling / masking | `platform/configuration/configuration.controller.ts:100-108` (duplicate) | BROKEN | Duplicate controller in `src/platform/` references `./configuration.service` which does NOT exist in that dir. Unregistered. |
| Metadata management | — | MISSING | No dedicated metadata entity (features, capabilities, navigation metadata). |
| Frontend — Configuration view | `ConfigurationView.jsx` | IMPLEMENTED_PARTIAL | Real component, calls `platformConfigService`. Anonymous-only. |
| Frontend — Workspace config | `WorkspaceConfigView.jsx` | IMPLEMENTED_PARTIAL | Configuration tab wired. No metadata tab. |

**Overall BM-CDC-06: IMPLEMENTED_PARTIAL** — Strong backend CRUD + effective resolution, but broken duplicate controller, no tenant scoping, no dedicated metadata entity.

---

## BM-CDC-07 — Integration, Contracts & Runtime Bridge

### Contract Registry

| Feature | Code Location | Status | Evidence |
|---|---|---|---|
| Contract entity (code, version, owner, schema, hash) | `schema.prisma:164-191` | IMPLEMENTED_REAL | `Contract` model. Hash computed via SHA-256. |
| Contract CRUD | `contract.controller.ts` | IMPLEMENTED_REAL | create, findAll, findOne, validate, lock, history, compatibility. |
| Contract hash (deterministic) | `contract.service.ts:54-66` | IMPLEMENTED_REAL | SHA-256 of canonical JSON of code+version+owner+schema+policy. |
| Contract validation (schema + compatibilityPolicy) | `contract.service.ts:147-238` | IMPLEMENTED_REAL | Minimal validation of schema object structure. |
| Contract lifecycle (DRAFT→VALIDATING→LOCKED→ACTIVE→DEPRECATED→RETIRED) | `schema.prisma:48-55` | IMPLEMENTED_REAL | Enum matches CDC states. |
| Contract history | `schema.prisma:203-220` | IMPLEMENTED_REAL | `ContractHistory` with actions. |
| Contract version compatibility | `contract.service.ts:295-370` | IMPLEMENTED_PARTIAL | `getCompatibility()` detects breaking changes. But no consumer declaration/version check endpoint. |
| Contract provider/consumer references | `schema.prisma:230-268` | IMPLEMENTED_REAL | `ContractProvider`, `ContractConsumer` models. |
| **Contract Contributors registry** | — | MISSING | CDC #12/§10 requires a contributor registry with namespace + contributor isolation. No model/controller. |
| **Runtime Manifest generation** | — | MISSING | No `RuntimeManifest` entity or endpoint. |
| **Runtime Resolver** | — | MISSING | No resolver for version/environment/channel. |
| **Manifest Assembler** | — | MISSING | No assembly of Application+Version+DataModel+Features+Capabilities+Navigation+Configuration+Metadata. |
| **Runtime Readiness** | — | MISSING | No readiness check aggregating validation results. |
| **Runtime Snapshot (immutable)** | — | PARTIAL → MISSING | `Snapshot` model exists with hash+contracts+config, but no manifest assembly, no immutability guarantee, no environment/channel resolution. |
| **Integration Binding** | — | MISSING | No binding model. No adapter selection + mapping profile validation. |
| **Adapter Registry** | `Connector` model (schema.prisma:453) | IMPLEMENTED_PARTIAL | `Connector` model exists with capabilities, health. But no adapter contract validation, no binding. |
| **ERP Adapter consumed only by contract** | — | MISSING | No ERP adapter contract boundary. Direct DB access patterns in `erp-adapter/`. |
| **SSRF protection** for configurable URLs | — | MISSING | No URL allowlist/policy for integrations. |
| **Cache + invalidation** | — | MISSING | No ETag/HTTP cache for manifest/contracts. |
| **Event contracts** | — | MISSING | No versioned event contracts with correlation. |
| **Snapshot compare** | `snapshot.controller.ts:31-37` | IMPLEMENTED_REAL | `@Get('compare')` with left/right query params. |

### Integration Layer

| Feature | Code Location | Status | Evidence |
|---|---|---|---|
| Integration Controller | `integration.controller.ts` | IMPLEMENTED_REAL | `/api/integration/*` endpoints. |
| Integration Service | `integration.service.ts` | IMPLEMENTED_REAL | Orchestration logic. |
| Connectors CRUD | `connector.controller.ts` | IMPLEMENTED_REAL | `/api/connectors/*`. |
| API definitions (OpenAPI-like) | `api-manager/` | IMPLEMENTED_REAL | `ApiDefinition` model, CRUD. |
| Webhooks CRUD + delivery | `webhooks/` | IMPLEMENTED_REAL | `Webhook`, `WebhookDelivery` models. |
| Credentials management | `credentials/` | IMPLEMENTED_REAL | `CredentialReference` model. |
| Synchronizations CRUD | `synchronization.controller.ts` | IMPLEMENTED_REAL | `Synchronization` model. |
| Diagnostics | `diagnostics.controller.ts` | IMPLEMENTED_REAL | Search/logs. |
| **Integration Binding** (version→adapter+mapping) | — | MISSING | No binding model/service. |
| **Runtime Manifest** from integrations | — | MISSING | Not integrated. |

### Frontend (BM-CDC-07)

| Feature | Code Location | Status | Evidence |
|---|---|---|---|
| Contract Catalog / Detail | `ContractsView.jsx` | IMPLEMENTED_PARTIAL | Real component. Anonymous-only. |
| Integration Cockpit | `IntegrationCockpitView.jsx` | IMPLEMENTED_PARTIAL | Real component with API integration. Anonymous-only. |
| Integration Contracts V1 | `IntegrationContractsV1View.jsx` | IMPLEMENTED_PARTIAL | Real. But no contributor registration. |
| Snapshots view | `SnapshotsView.jsx` | IMPLEMENTED_PARTIAL | Real component. |
| Create Snapshot modal | `CreateSnapshotModal.jsx` | IMPLEMENTED_PARTIAL | Real modal. |
| Manifest Viewer | — | MISSING | No manifest viewer UI in navigationConfig. |
| Binding Wizard | — | MISSING | No binding wizard UI. |
| Test Connection UI | — | PARTIAL | `connector.service.ts` has validation. No dedicated "test connection" frontend. |
| Compatibility Viewer | — | MISSING | No contract diff/compatibility UI beyond what's in ContractsView. |

**Overall BM-CDC-07: IMPLEMENTED_PARTIAL** — Contract registry + integration layer are real and substantial, but the entire Runtime Bridge (contributors, manifest, resolver, readiness, immutable snapshot, binding, cache, SSRF, events) is missing.

---

## BM-CDC-08 — Validation, Tests & Quality Manager

| Feature | Code Location | Status | Evidence |
|---|---|---|---|
| QualityValidatorRegistry | — | MISSING | No validator registry service or model. |
| QualityOrchestrator | — | MISSING | No campaign orchestration engine. |
| Validation Campaign / Run | — | MISSING | No campaign model or CRUD. |
| QualityRule / RuleSet / QualityProfile | — | MISSING | No rule engine. |
| QualityIssue (severity, blocking) | — | MISSING | No issue model. |
| QualityScore calculation | — | MISSING | No score engine. |
| QualityGate (PASS/PASS_WITH_WARNINGS/FAIL) | — | MISSING | No gate service. |
| **Publication gate integration** | — | MISSING | CDC-08 §63 requires gate before BM-CDC-02 publication. No integration. |
| **Runtime Readiness aggregation** | — | MISSING | CDC-08 §143 requires readiness aggregation from BM-CDC-07. Absent. |
| Smoke tests | — | MISSING | No automated smoke test suite. |
| Integration tests | — | MISSING | No integration validation campaigns. |
| Regression tests | — | MISSING | No baseline comparison engine. |
| Contract tests | — | MISSING | No contract compatibility checks at quality level. |
| Security tests | — | MISSING | No security validation suite. |
| Waivers | — | MISSING | No waiver model/service. |
| Approvals | — | MISSING | No approval workflow. |
| Quality Report | — | MISSING | No report generation. |
| Metrics / Dashboard | — | MISSING | No quality metrics collection. |
| Historical reproducibility | — | MISSING | No validator/rule version tracking. |
| Stale detection | — | MISSING | No revision tracking for quality. |
| Frontend — Validation / Quality cockpit | `PackValidationCockpitView.jsx` | PLACEHOLDER | Route `/business/validation` → `ValidationRoute` renders `PackValidationCockpitView`. View exists but backend engine missing → effectively a stub. |
| Frontend — Campaign list/detail/issue explorer/gate/waiver/approval UIs | — | MISSING | No quality dashboard UIs in navigationConfig. |
| Backend tests for quality | — | MISSING | No `quality` spec files in test inventory. |

**Overall BM-CDC-08: MISSING** — The entire quality validation engine is absent. Only a frontend cockpit view stub exists.

---

## Cross-Cutting Concerns

| Concern | Status | Evidence | Notes |
|---|---|---|---|
| **Tenant isolation** (BM-CDC-07 §118, BM-CDC-08 §122) | BROKEN | `TenantGuard` exists (`iam/tenant.guard.ts`) but platform models use `tenantScope` not `tenantId`. Guard resolves `request.params.tenantId` which is never in platform API paths. | **BLOCKER** — Must add `tenantId` to all platform models + enforce in services. |
| **Application isolation** | MISSING | No applicationId WHERE clauses in platform queries. | |
| **Version isolation** | PARTIAL | Version queries filter by applicationId, but no tenant scope. | |
| **IAM Context propagation** | IMPLEMENTED_PARTIAL | `IamJwtGuard` sets `request.iamPrincipal`. But no platform service consumes it for scoping. | |
| **Permissions** | PARTIAL | `iam.constants.ts` defines permissions. `RequirePermission` decorator + `permission.guard.ts` exist. But `ROLE_PERMISSIONS` only has admin/user buckets — no fine-grained BM permissions. | |
| **Audit events** | PARTIAL | `AuditEvent` model exists in schema. `AuditLogModal.jsx` exists in frontend. But platform services don't emit audit events. | |
| **ActivityEvent / traceId** | PARTIAL | `traceId` in request middleware. `SnapshotService` accepts `traceId` header. But not propagated everywhere. | |
| **Optimistic locking** | MISSING | No `@version` column or increment on any platform model. | |
| **Transactions** | PARTIAL | `contract.service.ts` uses `prisma.$transaction`. Snapshot service uses transactions. But most platform operations are not transactional. | |
| **Observability / tracing** | PARTIAL | `X-Trace-Id` middleware in `main.ts`. Winston logger. But no tracing spans on platform operations. | |
| **Error handling** | IMPLEMENTED_REAL | `PlatformException`, `PlatformErrorCode`, `PrismaErrorMapper` exist. | |
| **Duplicate configuration module** | DUPLICATE | `backend/src/platform/configuration/` (controller only, 2026-09-21) vs `backend/src/modules/platform/configuration/` (full module, 2026-09-14). The former references a non-existent `./configuration.service` → BROKEN. | |
| **Frontend test infrastructure** | MISSING | Zero `*.test.*` / `*.spec.*` files in `frontend/src/`. No test runner configured in package.json (only `lint: tsc --noEmit`). | |
| **Backend test coverage** | PARTIAL | Tests exist for: automation, deployment, integration, IAM, data-runtime, lifecycle utils. **No tests** for platform modules (applications, versions, configuration, contracts, snapshots) except `app.controller.spec.ts`. | |

---

## API Route Inventory (Backend → Frontend wiring)

| API Path Prefix | Backend Module | Frontend Service | Frontend Component | CDC Target |
|---|---|---|---|---|
| `/api/business-manager/applications` | `applications` | `platformApplicationsService.js` | `ApplicationsView`, `ApplicationsCatalogView`, `CreateAppModal` | BM-CDC-01 |
| `/api/business-manager` (versions) | `application-versions` | (none dedicated) | `VersionsDetailView` | BM-CDC-02 |
| `/api/business-manager/configurations` | `configuration` | `platformConfigService.js` | `ConfigurationView`, `WorkspaceConfigView` | BM-CDC-06 |
| `/api/business-manager/configurations/effective/:appId/:verId/:envId` | `configuration` | `platformConfigService.js` (getEffective) | `WorkspaceConfigView` | BM-CDC-06 |
| `/api/business-manager/environments` | `environments` | `platformEnvironmentsService.js` | `EnvironmentsView` | BM-CDC-05 (env-scoped) |
| `/api/business-manager/contracts` | `contracts` | (none) | `ContractsView` | BM-CDC-07 |
| `/api/business-manager/snapshots` | `snapshots` | (none) | `SnapshotsView`, `CreateSnapshotModal` | BM-CDC-07 |
| `/api/business-manager/dashboard` | `platform` | (via store) | `CockpitView`, `GeneralOverviewView` | BM-CDC-00 |
| `/api/business-manager/activity` | `platform` | (via store) | `CockpitView` | BM-CDC-00 |
| `/api/integration/*` | `integration` | various | `IntegrationCockpitView`, `ConnectorManagerView`, etc. | BM-CDC-07 |
| `/api/iam/*` | `iam` | `authService.js` | `LoginPage`, `IamUsersPage`, etc. | IAM (foundation) |
| `/api/deployment/*` | `deployment` | `deploymentService.js` | `DeploymentPublicationView`, etc. | BM-CDC-02 (release) |
| `/api/automation/*` | `automation` | (none dedicated) | `AutomationCockpit`, etc. | WF-CDC |
| `/api/erp/*` | `erp-adapter` | (via erp services) | `ErpModule`, `ERPDashboard`, etc. | BM-CDC-07 (ERP Adapter) |
| `/api/data-runtime/*` | `data-runtime` | (via data services) | `DataRuntime`, etc. | BM-CDC-07 (Data Contract) |

### MISSING API endpoints (required by CDCs)

| CDC | Required Endpoint | Status |
|---|---|---|
| BM-CDC-03 | `POST/GET/PUT /api/business/data-models` | MISSING |
| BM-CDC-03 | `POST /api/business/data-models/:id/diff` | MISSING |
| BM-CDC-04 | `POST/GET/PUT /api/business/features` | MISSING (model exists, no CRUD) |
| BM-CDC-04 | `POST/GET/PUT /api/business/capabilities` | MISSING |
| BM-CDC-05 | `POST/GET/PUT /api/business/navigation` | MISSING |
| BM-CDC-07 | `POST /api/business/contracts/contributors` | MISSING |
| BM-CDC-07 | `GET /api/business-manager/versions/:versionId/runtime-manifest` | MISSING |
| BM-CDC-07 | `POST /api/business-manager/versions/:versionId/runtime-readiness` | MISSING |
| BM-CDC-07 | `POST /api/business/integrations/bindings` | MISSING |
| BM-CDC-07 | `POST /api/business/adapters/:key/test-connection` | MISSING |
| BM-CDC-07 | `GET /api/business/contracts/:id/compatibility/check` | MISSING |
| BM-CDC-08 | `POST /api/business/quality/campaigns` | MISSING |
| BM-CDC-08 | `POST /api/business/quality/validate` | MISSING |
| BM-CDC-08 | `GET /api/business/quality/gate` | MISSING |
| BM-CDC-08 | `POST /api/business/quality/waivers` | MISSING |
| BM-CDC-08 | `POST /api/business/quality/approvals` | MISSING |
| BM-CDC-08 | `GET /api/business/quality/reports/:id` | MISSING |

---

## Summary Classification

| BM-CDC | Title | Overall Status | Key Gap |
|---|---|---|---|
| BM-CDC-01 | Application Manager | IMPLEMENTED_PARTIAL | No tenant scoping; no publication bridge |
| BM-CDC-02 | Version Lifecycle Manager | IMPLEMENTED_PARTIAL | No quality gate before publish; PublicationView is NO_OP |
| BM-CDC-03 | Data Model Manager | MISSING | No model, no CRUD, no UI |
| BM-CDC-04 | Feature & Capability Manager | MISSING | Feature model only, no CRUD, no UI, no Capability model |
| BM-CDC-05 | Menu Engine & Navigation Manager | IMPLEMENTED_PARTIAL | Frontend-only; no backend manifest; no route validation |
| BM-CDC-06 | Configuration & Metadata Manager | IMPLEMENTED_PARTIAL | Strong CRUD but broken duplicate controller; no tenant scoping; no metadata entity |
| BM-CDC-07 | Integration, Contracts & Runtime Bridge | IMPLEMENTED_PARTIAL | Contract registry + integration layer real; Runtime Bridge (manifest, resolver, readiness, binding, cache, SSRF, events) entirely missing |
| BM-CDC-08 | Validation, Tests & Quality Manager | MISSING | Entire quality engine absent; only a frontend cockpit stub |

### Critical Blockers

1. **Tenant isolation** — `Application.tenantScope` instead of `tenantId`; no tenant filtering in any platform query. `TenantGuard` cannot function for platform resources.
2. **Publication pipeline** — No integration between version lifecycle (CDC-02), contract/runtime bridge (CDC-07), and quality gate (CDC-08). PublicationView is a NO_OP.
3. **BM-CDC-03/04/08** — Completely unstarted. No backend models, services, or frontend pages.
4. **BM-CDC-07 Runtime Bridge** — Contract registry exists but the entire runtime manifest/assembly/readiness/snapshot/binding/cache/SSRF/event layer is absent.
5. **Test coverage gap** — No frontend tests; platform backend modules have zero spec tests.
6. **Duplicate broken controller** — `src/platform/configuration/configuration.controller.ts` references a non-existent service.

### Architecture Dependencies (CDC Chain)

The CDCs form a strict dependency chain:

```
BM-CDC-01 (Application) → BM-CDC-02 (Version Lifecycle) → BM-CDC-03 (Data Model)
      ↓                          ↓                             ↓
BM-CDC-07 (Contracts/Runtime) ← BM-CDC-04 (Features) ← BM-CDC-05 (Navigation)
      ↑                             ↑                          ↑
BM-CDC-06 (Configuration/Metadata) ── BM-CDC-07 aggregates all contracts ──→ BM-CDC-08 (Quality)
      ↓
BM-CDC-02 uses BM-CDC-08 gate result for publication decision
```

BM-CDC-07 cannot be completed without BM-CDC-03/04/05/06 producing contract contributors. BM-CDC-08 cannot run without BM-CDC-07 producing a runtime snapshot.

## Mise à jour runtime — 29 septembre 2026

P0 CRUD branché et recetté sur PostgreSQL local. Data Model/relations restent PARTIAL pour les opérations non exposées ; Quality limité aux règles existantes ; Contracts/Runtime API accessibles ; publication non certifiée. Les statuts de la [recette réelle](BM_RUNTIME_ACCEPTANCE_REPORT.md) précisent la couverture vérifiée.
