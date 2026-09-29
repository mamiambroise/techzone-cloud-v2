# Techzone Cloud — Master Audit Report

> **Date:** 2026-09-28
> **Scope:** `backend/` (NestJS), `frontend/` (React/Vite), `techzone/` (Dolibarr legacy), `docs/`, `scripts/`, root config
> **Standard:** All findings classified COMPLETE / IMPLEMENTED_REAL / IMPLEMENTED_PARTIAL / STUB / MOCK / BROKEN / MISSING / DUPLICATE / NOT_APPLICABLE

---

## 1. Executive Summary

Techzone Cloud is a consolidated cloud platform with a single NestJS backend (port 3003), single React/Vite frontend (port 3000), and legacy Dolibarr ERP kept external (port 8080). The consolidation is structurally complete — no standalone Express backends remain, no secrets are committed to git, and the frontend has no PostgreSQL credentials.

However, **three critical issues** require immediate attention:

1. **P0 Security Vulnerability** — `IamAdminGuard` (backend/src/iam/iam-admin-guard.ts:16-18) returns `true` (grants access) when no `@Permissions()` is declared on a route guarded by it. All ~72 IAM admin routes are exposed to any authenticated user.
2. **Broken Multi-Tenant Isolation** — `tenantId` is nullable on all platform Prisma models; queries are not consistently scoped; `TenantGuard` is non-functional for platform resources.
3. **Stale Documentation** — Audit docs in `docs/business-manager/` reference `/api/platform/*` paths that no longer exist (renamed to `/api/business-manager/*`).

**Verdict:** Structurally consolidated. Not production-safe. P0 + tenant isolation must be fixed before go-live.

---

## 2. Repository Structure

| Path | Type | Tracked? |
|---|---|---|
| `backend/` | NestJS 12 app | Yes |
| `frontend/` | React 19 + Vite 6.2 | Yes |
| `techzone/` | Dolibarr PHP (legacy) | Yes (14999 files) |
| `docs/` | Documentation | Yes |
| `scripts/` | Orchestration | Yes |
| `bm/` | 8 BM-CDC specifications | **No (not in git)** |
| `package.json` (root) | Orchestrator | **No** |
| `.kilo/`, `.claude-dev-helper/`, `logs/`, `node_modules/` | Tooling/runtime | No (ignored) |

---

## 3. Architecture Overview

```
Client (port 3000) → /api/* → Backend API (port 3003, NestJS)
                   → /api/iam/* → Backend IAM (same port 3003)
                   → /api/erp/* → Backend → ERP Adapter → Dolibarr (port 8080)
```

- **Frontend** → **Backend**: Axios via `apiClient.js`; Vite proxy maps `/api/*` and `/api/iam/*` → `localhost:3003`
- **Backend** → **Dolibarr**: `ERP_ADAPTER` service calls `DOLIBARR_URL` (8080) via HTTP
- **Backend** → **IAM**: Internal calls via `IAM_API_URL` env var
- **DB**: PostgreSQL 16, schema `business_manager`

---

## 4. Development Environment

| Command | Location | Description |
|---|---|---|
| `npm run dev` | root | Start frontend + backend + Dolibarr (`scripts/dev-all.mjs`) |
| `npm run stop` | root | Stop all services (`scripts/stop.mjs`) |
| `npm run status` | root | Show running services (`scripts/status.mjs`) |
| `npm run dev:rebuild` | root | Rebuild backend, then start |
| `cd backend && npx nest build` | backend | Compile TypeScript → `dist/` |
| `cd backend && npm test` | backend | Jest unit tests (29 spec files) |
| `cd frontend && npx vite build` | frontend | Production build |
| `cd frontend && npm test` | frontend | Vitest unit tests (8 files) |
| `npx oxlint` | both | Lint (warnings only) |
| `npx prisma db push` | backend | Push schema to DB (dev) |

PID management: `logs/.dev-pids.json` (gitignored).

---

## 5. Security Posture

| Control | Status | Evidence |
|---|---|---|
| Helmet | IMPLEMENTED | `main.ts` |
| Cookie parser | IMPLEMENTED | `main.ts` |
| CORS | IMPLEMENTED | `CORS_ORIGIN` env var; comma-separated; not wildcard |
| Rate limiting | IMPLEMENTED_PARTIAL | Mentioned; verify config |
| HttpOnly cookies | IMPLEMENTED | Access + refresh tokens |
| SameSite | PARTIAL | `lax` (should be `strict` in production) |
| CSRF token | NOT_IMPLEMENTED | No CSRF library; relies on SameSite only |
| JWT validation | IMPLEMENTED | `IamJwtGuard` + `iam-jwt.guard.spec.ts` |
| Secret hygiene | IMPLEMENTED | `.env` gitignored; `.env.example` tracked with placeholders |
| Frontend secret exposure | SAFE | Frontend only has `VITE_API_BASE_URL`; no DB creds |
| **Admin authorization** | **BROKEN (P0)** | See §12 |

---

## 6. IAM Foundation

| Component | Status | Notes |
|---|---|---|
| JWT auth | IMPLEMENTED_REAL | `iam-auth.controller.ts` (`api/iam/auth`) — register, login, login/mfa, refresh, logout, logout-all, change/forgot/reset password |
| JWT guard | IMPLEMENTED_REAL | `iam-jwt.guard.ts` — validates tokens (issuer: `techzone-cloud-iam`) |
| Token refresh | IMPLEMENTED_REAL | Auto-refresh on 401 via `apiClient.js` interceptor |
| MFA | IMPLEMENTED_REAL | `iam-mfa.controller.ts` (`api/iam/mfa`) — enroll, verify, recovery codes, challenge |
| Sessions | IMPLEMENTED_REAL | `iam-sessions.controller.ts` (`api/iam/sessions`) — list, revoke, delete |
| MFA tests | IMPLEMENTED | `iam-jwt.guard.spec.ts`, `iam-permission.guard.spec.ts` |
| Roles | IMPLEMENTED_REAL | `iam.constants.ts` — `ROLES = { ADMIN, USER }` |
| Permissions | IMPLEMENTED_PARTIAL | 9 permissions defined (`PERMISSIONS`); `ROLE_PERMISSIONS` maps roles → permissions. Only `admin` and `user` roles exist (no fine-grained BM roles) |
| Tenant model | IMPLEMENTED_REAL | `Tenant` model in schema (1:1 with IamUser via `defaultTenantId`) |
| **Admin guard** | **BROKEN (P0)** | See §12 |

---

## 7. BM-CDC-01 — Application Manager

| Aspect | Status | Evidence |
|---|---|---|
| Purpose | Manage applications (code, name, description, status) | Core platform entity |
| Backend controller | `modules/platform/applications/applications.controller.ts` | `@Controller('api/business-manager/applications')` |
| Backend service | `applications.service.ts` | Full CRUD |
| DTOs | `CreateApplicationDto`, `UpdateApplicationDto` | |
| Prisma model | `Application` (schema.prisma:65) | status, tenantId, tenantScope |
| Frontend | `ApplicationsView.jsx`, `ApplicationsCatalogView.jsx`, `CreateAppModal` | Real components calling `platformApplicationsService` |
| Frontend tests | 0 | |
| Backend tests | 1 (`applications.service.spec.ts`) | Service-level only |
| **Tenant scoping** | **BROKEN** | `tenantScope: String` field on model (not `tenantId`); no WHERE clause; `TenantGuard` non-functional (see §22) |
| **Publication bridge** | MISSING | No API to trigger contract/manifest generation for BM-CDC-07 |
| Overall | IMPLEMENTED_PARTIAL | Core CRUD works; tenant isolation broken |

---

## 8. BM-CDC-02 — Version Lifecycle Manager

| Aspect | Status | Evidence |
|---|---|---|
| Purpose | Application version lifecycle (DRAFT→CONFIGURING→VALIDATING→READY→ACTIVE→SUPERSEDED→DEPRECATED→ARCHIVED) | `ApplicationVersionStatus` enum |
| Backend controller | `application-versions.controller.ts` | `@Controller('api/business-manager')` |
| Backend service | `application-versions.service.ts` | Lifecycle state machine, clone, status transition |
| Lifecycle util | `version-lifecycle.util.ts` | `canTransitionVersion()` state machine |
| Frontend | `VersionsDetailView.jsx`, `PublicationView.jsx` | |
| **PublicationView** | **PLACEHOLDER (NO_OP)** | Launch handler has no API call — documented as NO_OP in prior audit |
| **Quality gate integration** | MISSING | No BM-CDC-08 gate before publish |
| **Runtime readiness check** | MISSING | No check before publication |
| Backend tests | 1 (`application-versions.service.spec.ts`) | |
| Overall | IMPLEMENTED_PARTIAL | Lifecycle state machine works; publication pipeline incomplete |

---

## 9. BM-CDC-03 — Data Model Manager

| Aspect | Status | Evidence |
|---|---|---|
| Purpose | Define entity/fields, schema versioning, diff/migration plan | |
| Backend model | **MISSING** | No `DataModel` model in Prisma schema |
| Backend controller/service | **MISSING** | No CRUD layer |
| Frontend page | `/business/models` → `component: null` | `navigationConfig.js:81` — `NOT_IMPLEMENTED` |
| Data loss risk detection | MISSING | CDC requires `DATA_LOSS_RISK` flag |
| Tests | 0 | |
| Overall | **MISSING** | Completely unstarted |

---

## 10. BM-CDC-04 — Feature & Capability Manager

| Aspect | Status | Evidence |
|---|---|---|
| Purpose | Feature entity, capability definitions, subscription plan features | |
| Backend model | `Feature` exists (bare model) | `schema.prisma` — `code`, `name`, `description`, `status`, `metered`, `quotaCode` only |
| Backend CRUD | **MISSING** | No controller/service/DTO for Feature |
| `Capability` model | **MISSING** | Not in schema |
| Feature/Capability contract | MISSING | No contract generation |
| Frontend page | `/business/features` → `component: null` | `navigationConfig.js:82` — `NOT_IMPLEMENTED` |
| Billing features | MOCK | `subscriptionSlice.js` + `billingFeaturesMockService.js` use mock data |
| Tests | 0 | |
| Overall | **MISSING** | Bare model only; no logic |

---

## 11. BM-CDC-05 — Menu Engine & Navigation Manager

| Aspect | Status | Evidence |
|---|---|---|
| Purpose | Navigation registry, page definitions, route resolution, legacy redirects | |
| Backend | **MISSING** | No backend persistence or API for navigation |
| Navigation config | `frontend/src/app/navigationConfig.js` | 92 entries, 28 redirects, `pageDefinitions` with permission fields |
| Route resolution | `navigationConfig.js:273-276` | `resolveRoute()`, `activeNavigation()` |
| Sidebar rendering | `Sidebar.jsx` | Uses navigationConfig |
| Navigation contract | MISSING | No backend `NavigationContract` model; no manifest generation |
| Route validation | MISSING | CDC requires validation for quality gate — not implemented |
| Frontend tests | 3 (`navigationConfig.test.js`, `session-navigation.test.jsx`, `configuration-navigation.test.jsx`) | |
| Overall | IMPLEMENTED_PARTIAL | Comprehensive frontend-only config; no backend |

---

## 12. P0 Vulnerability — IamAdminGuard Authorization Bypass

**File:** `backend/src/iam/iam-admin-guard.ts:16-18`

```typescript
if (!requiredPermissions || requiredPermissions.length === 0) {
  return true;  // BUG: grants access to ALL authenticated users
}
```

### Root Cause

The `IamAdminGuard` is designed to enforce `@Permissions()` decorators on admin routes. When a controller is decorated with `@UseGuards(IamAdminGuard)` but individual routes do NOT have `@Permissions(...)`, the guard returns `true` (grants access) instead of denying.

### Blast Radius

**10 controllers, ~72 routes** — ALL exposed to any authenticated user (including `user` role):

| Controller | Prefix | Routes | `@Permissions()` Count |
|---|---|---|---|
| `IamUsersController` | `/api/iam/users` | 6 | 0 |
| `IamTenantsController` | `/api/iam/admin/tenants` | 9 | 0 |
| `IamBillingController` | `/api/iam/billing` | 26 | 0 |
| `IamSessionsController` | `/api/iam/sessions` | 2 | 0 |
| `IamIdentitiesController` | `/api/iam/identities` | 4 | 0 |
| `IamPoliciesController` | `/api/iam/policies` | 4 | 0 |
| `IamGovernanceController` | `/api/iam/admin/governance/roles` | 11 | 0 |
| `IamObservabilityController` | `/api/iam` | 9 (method-level guard) | 0 |
| `IamAdminUsersController` | `/api/iam/admin/users` | 1 | 0 |
| `IamConfigController` | `/api/iam/config` | 4 (method-level guard) | 0 |

### Contrast — ERP Adapter is Correctly Protected

`erp-adapter.controller.ts` decorates **every** route with `@Permissions(ERP_READ)` or `@Permissions(ERP_WRITE)`. The permission system works when used.

### Impact

An authenticated `user`-role attacker can:
- Enumerate/list all IAM users, tenants, sessions
- Create/modify/delete IAM users and tenants
- Access all billing data (subscriptions, invoices, payments)
- Modify billing (activate, suspend, cancel subscriptions, change plans)
- Override entitlement quotas
- Call the access-decision engine (`/api/iam/billing/access/decide`)
- Search security events, logs, audit trails, alerts
- Grant/revoke arbitrary role permissions

### Fix

```typescript
// iam-admin-guard.ts:16-18 — CHANGE FROM:
if (!requiredPermissions || requiredPermissions.length === 0) {
  return true;
}
// TO:
if (!requiredPermissions || requiredPermissions.length === 0) {
  throw new ForbiddenException({
    success: false,
    message: 'Accès refusé',
    statusCode: 403,
  });
}
```

After this fix, add `@Permissions(IAM_ADMIN)` to all exposed IAM admin routes (or introduce a `@Roles(ROLES.ADMIN)` decorator for admin-only routes). **The guard must NOT be "fixed" without adding permissions** — otherwise all routes become 403.

### Test Required

Add `iam-admin-guard.spec.ts`:
- Assert that routes without `@Permissions()` throw `ForbiddenException`
- Assert that routes with `@Permissions(IAM_ADMIN)` pass for admin role

---

## 13. BM-CDC-06 — Configuration & Metadata Manager

| Aspect | Status | Evidence |
|---|---|---|
| Purpose | Configuration CRUD, effective config resolution, metadata management | |
| Backend controller | `modules/platform/configuration/configuration.controller.ts` | `@Controller('api/business-manager/configurations')` |
| Backend service | `configuration.service.ts` (31KB) | Effective resolution, history |
| Prisma model | `Configuration`, `ConfigurationHistory` | Scopes: PLATFORM/APPLICATION/APPLICATION_VERSION/ENVIRONMENT/TENANT |
| Frontend | `ConfigurationView.jsx`, `WorkspaceConfigView.jsx` | Real components calling `platformConfigService` |
| **Broken duplicate** | **BROKEN** | `src/platform/configuration/configuration.controller.ts` (2026-09-21) — references `./configuration.service` which does NOT exist in that directory |
| **Tenant scoping** | BROKEN | No tenant WHERE clause |
| Metadata entity | MISSING | No dedicated metadata model |
| Backend tests | 0 | |
| Overall | IMPLEMENTED_PARTIAL | Strong CRUD + effective resolution; broken duplicate + no scoping |

---

## 14. BM-CDC-07 — Integration, Contracts & Runtime Bridge

### Contract Registry

| Aspect | Status | Evidence |
|---|---|---|
| Purpose | Contract entity with hash, lifecycle, provider/consumer refs, compatibility | |
| Prisma model | `Contract`, `ContractHistory`, `ContractProvider`, `ContractConsumer` | Hash via SHA-256 |
| Backend controller | `contract.controller.ts` | `@Controller('api/business-manager/contracts')` |
| Backend service | `contract.service.ts` | Hash computation, validation, compatibility |
| Contract statuses | DRAFT→VALIDATING→LOCKED→ACTIVE→DEPRECATED→RETIRED | Enum in schema |
| Compatibility check | `getCompatibility()` in contract.service | Detects breaking changes |
| **Contributor registry** | MISSING | CDC requires contributor isolation |
| **Runtime Manifest** | MISSING | No `RuntimeManifest` entity or generation |
| **Runtime Resolver** | MISSING | No version/environment/channel resolution |
| **Manifest Assembler** | MISSING | No assembly of Application+Version+DataModel+Features+Capabilities+Navigation+Configuration+Metadata |
| **Runtime Readiness** | MISSING | No readiness aggregation |
| **Immutable Snapshot** | PARTIAL | `Snapshot` model exists with hash+contracts+config, but no manifest assembly |
| **Integration Binding** | MISSING | No binding model; no adapter selection |
| **SSRF protection** | MISSING | No URL allowlist for integration endpoints |
| Cache + invalidation | MISSING | No ETag/HTTP cache |
| Event contracts | MISSING | No versioned events with correlation |

### Integration Layer

| Aspect | Status | Evidence |
|---|---|---|
| Integration controller | `integration.controller.ts` | `@Controller('api/integrations')` — dashboard, activity, health, attention |
| Connectors | `connector.controller.ts` | CRUD + validate + health + activate + disable + archive |
| API Manager | `api-manager.controller.ts` | API definitions CRUD + versioning |
| Webhooks | `webhook.controller.ts` | CRUD + transition |
| Inbound Webhooks | `inbound-webhook.controller.ts` | `@Controller('api/webhooks/inbound')` |
| Credentials | `credentials.controller.ts` | CRUD + rotate + test + associate + disable + archive |
| Synchronizations | `synchronization.controller.ts` | CRUD + run + resume + pause + cancel |
| Diagnostics | `diagnostics.controller.ts` | Logs, metrics, timeline |
| **Integration Binding** | MISSING | No binding to runtime manifest |

### ERP Adapter

| Aspect | Status | Evidence |
|---|---|---|
| ERP Registry | `erp-registry.controller.ts` | `@Controller('api/erp-registry')` — register, list, lookup |
| ERP Adapter | `erp-adapter.controller.ts` | `@Controller('api/erp')` — 42 routes (clients, products, orders, stock, suppliers, quotes, invoices, payments, warehouses, shipments, documents, purchases, projects, agenda, product-variants, services, stock-transfers, inventories, stock-alerts, returns, promotions, cash-registers, expenses, reservations) |
| Permissions | IMPLEMENTED_REAL | Every ERP adapter route has `@Permissions(ERP_READ)` or `@Permissions(ERP_WRITE)` |
| Dolibarr adapter | `dolibarr.adapter.ts` | Real Dolibarr HTTP integration |
| Mock adapter | `mock.adapter.ts` | Mock for dev/test |
| Tests | 3 (`dolibarr.adapter.spec.ts`, `mock.adapter.spec.ts`, `erp-adapter.service.spec.ts`) | |

### Data Runtime

| Aspect | Status | Evidence |
|---|---|---|
| Controller | `data-runtime.controller.ts` | `@Controller('api/data-runtime')` |
| Endpoints | 11 | contract, resources, query, execute, validate, history, metrics, bindings |
| Tests | 4 | query-engine, execution-engine, validation, erp-adapter.provider |

### Frontend

| Component | Status | Notes |
|---|---|---|
| `IntegrationCockpitView.jsx` | IMPLEMENTED_PARTIAL | Real; anonymous-only (auth blocked) |
| `ContractsView.jsx` | IMPLEMENTED_PARTIAL | Real; anonymous |
| `IntegrationContractsV1View.jsx` | IMPLEMENTED_PARTIAL | Real; no contributor registration |
| `SnapshotsView.jsx` | IMPLEMENTED_PARTIAL | Real |
| `CreateSnapshotModal.jsx` | IMPLEMENTED_PARTIAL | Real |
| Manifest Viewer | MISSING | No UI |
| Binding Wizard | MISSING | No UI |

**Overall BM-CDC-07: IMPLEMENTED_PARTIAL** — Contract registry + integration layer real and substantial; **entire Runtime Bridge (contributors, manifest, resolver, readiness, binding, cache, SSRF, events) missing.**

---

## 15. BM-CDC-08 — Validation, Tests & Quality Manager

| Aspect | Status | Evidence |
|---|---|---|
| Purpose | Quality gate engine: validators, orchestrator, campaigns, rules, issues, scores | |
| QualityValidatorRegistry | MISSING | No service or model |
| QualityOrchestrator | MISSING | No campaign engine |
| Validation Campaign model | MISSING | No CRUD |
| QualityRule / RuleSet / Profile | MISSING | No rule engine |
| QualityIssue (severity, blocking) | MISSING | No issue model |
| QualityScore | MISSING | No score engine |
| QualityGate (PASS/PASS_WITH_WARNINGs/FAIL) | MISSING | No gate service |
| Publication gate integration | MISSING | CDC-08 requires gate before BM-CDC-02 publish — absent |
| Runtime Readiness aggregation | MISSING | CDC-08 requires aggregation from BM-CDC-07 — absent |
| Smoke tests | MISSING | No automated smoke suite |
| Integration tests | MISSING | No integration campaigns |
| Regression tests | MISSING | No baseline comparison |
| Contract tests | MISSING | No contract validation at quality level |
| Security tests | MISSING | No security validation |
| Waivers | MISSING | No waiver model/service |
| Approvals | MISSING | No approval workflow |
| Quality metrics / dashboard | MISSING | No metrics collection |
| Frontend — `PackValidationCockpitView.jsx` | PLACEHOLDER | Route `/business/validation` exists; backend engine missing |
| Backend tests | 0 | No quality spec files |
| Overall | **MISSING** | Entire quality engine absent; only a frontend stub |

---

## 16. Data Runtime Domain

| Aspect | Status | Evidence |
|---|---|---|
| Controller | `data-runtime.controller.ts` | `@Controller('api/data-runtime')` |
| Endpoints | 11 | `contract`, `resources`, `query`, `execute`, `validate`, `history`, `metrics`, `bindings/:id/resolve`, `bindings/:id/state` |
| Runtime bridge connection | MISSING | Cannot resolve to runtime manifest (BM-CDC-07 missing) |
| Tests | 4 | query-engine, execution-engine, validation, erp-adapter.provider |

---

## 17. Automation Domain

| Aspect | Status | Evidence |
|---|---|---|
| Controller | `automation.controller.ts` | `@Controller('api/automation')` |
| Engines | Rules, Conditions, Triggers, Actions, Workflow | Full implementation |
| Contract binding | MISSING | Not bound to versioned deployments |
| Quality gate integration | MISSING | No BM-CDC-08 gate |
| Tests | 6 | All engines tested |
| Overall | IMPLEMENTED_PARTIAL | Engine complete; not bound to CDC lifecycle |

---

## 18. Deployment Domain

| Aspect | Status | Evidence |
|---|---|---|
| Controller: Release | `release.controller.ts` | `@Controller('api/releases')` |
| Controller: Deployment | `deployment.controller.ts` | `@Controller('api/deployments')` |
| Controller: EnvironmentDeployment | `environment-deployment.controller.ts` | `@Controller('api/deployment/environments')` |
| Controller: Gate | `gate.controller.ts` | `@Controller('api/deployments/:id/gates')` |
| Controller: Rollback | `rollback.controller.ts` | `@Controller()` — full path in `@Get('api/rollbacks')` **INCONSISTENT** |
| Controller: Cockpit | `cockpit.controller.ts` | `@Controller()` — full path in `@Get('api/deployment/dashboard')` **INCONSISTENT** |
| Controller: DeploymentDiagnostics | `deployment-diagnostics.controller.ts` | `@Controller('api/deployments')` |
| Tests | 6 | All deployment services tested |
| Overall | IMPLEMENTED_PARTIAL | Complete but with inconsistent controller pattern (2 files use root `@Controller()`) |

---

## 19. Frontend Architecture

| Layer | Technology | File |
|---|---|---|
| Framework | React 19 | |
| Build | Vite 6.2 | `vite.config.ts` |
| Routing | React Router DOM 6 | `App.jsx`, `routes.js` |
| State | Redux Toolkit | `store.js` + `store/` slices |
| HTTP | Axios (2 instances) | `api/apiClient.js` |
| Styling | Tailwind CSS | |
| Icons | lucide-react, heroicons | |
| Port | 3000 | |

### Layout: TechzoneLayout (single shell)

`App.jsx` → `BrowserRouter` → `TechzoneLayout` (Sidebar + Header + SubNavBar + Outlet)

### API Client

- `api` instance — baseURL `/api` (general API)
- `authApi` instance — baseURL `/api/iam` (auth API)
- Request interceptor: injects `X-Trace-Id`
- Response interceptor: normalizes `{ success, message, data }`
- 401 auto-refresh with `isRefreshing` lock + queue

### DEV_ONLY Infrastructure

`features/iam-demo/` — 212+ files of mock services, mockData, DemoPage. **Must verify this is excluded from production builds.**

---

## 20. Test Coverage Analysis

### Backend — 29 spec files (Jest)

| Tier | Modules | Files | Coverage |
|---|---|---|---|
| High | Automation | 6 | Comprehensive engine tests |
| High | Integration | 7 | Connector, API manager, webhook, credentials, sync, diagnostics, contracts |
| High | Deployment | 6 | Release, deployment, gates, rollback, environments, cockpit |
| High | Data Runtime | 4 | Query engine, execution, validation, erp-provider |
| High | ERP Adapter | 3 | Dolibarr, mock, service |
| Medium | IAM | 5 | Guards, auth controller, service, client |
| Low | Platform | 3 | applications.service, application-versions.service, contract.service |

**Critical backend test gaps:**
- 0 tests for `ConfigurationController`/`ConfigurationService`
- 0 tests for `SnapshotController`/`SnapshotService`
- 0 tests for `EnvironmentController`
- 0 tests for `ApplicationsController`, `ContractController` (service-level only)
- 0 tests for `ErpRegistryController`
- 0 tests for tenant scoping enforcement

### Frontend — 8 test files (Vitest)

| Files | Coverage |
|---|---|
| `navigationConfig.test.js`, `configuration-navigation.test.jsx`, `session-navigation.test.jsx` | Navigation config + route resolution |
| `ContextBar.test.jsx`, `businessManager.test.jsx`, `Card.test.jsx`, `PageHeader.test.jsx` | UI component rendering |
| `refresh.test.js` | Token refresh logic |

**Critical frontend test gaps:**
- 0 service tests (no `platformApplicationsService`, `platformConfigService`, `authService` tests)
- 0 Redux slice tests
- 0 page/view tests
- 0 E2E tests

---

## 21. Code Quality Findings

| Issue | Location | Severity |
|---|---|---|
| Duplicate broken config module | `src/platform/configuration/` (2026-09-21) vs `src/modules/platform/configuration/` (2026-09-14) | HIGH |
| Inconsistent `@Controller()` usage | `rollback.controller.ts`, `cockpit.controller.ts` use root `@Controller()` with full path in `@Get()` | MEDIUM |
| Root-level modules not under `modules/` | `erp-adapter/`, `erp-registry/`, `data-runtime/`, `automation/`, `config/` are at `src/` root | LOW |
| Dead code: `features/erp-account/` | Non-routed legacy feature | LOW |
| DEV_ONLY infrastructure in source tree | `features/iam-demo/` (212+ files) | MEDIUM |
| No optimistic locking | All models lack `@version` column | MEDIUM |
| French/English mixed OperationContext | IAM controllers use French `@ApiOperation` summaries | LOW |

---

## 22. Tenant Isolation Audit

| Model | Has `tenantId`? | Nullable? | WHERE clause enforced? |
|---|---|---|---|
| `Application` | Yes | `String?` | No (manual `principal.tenantId` in controller only) |
| `ApplicationVersion` | Yes | `String?` | No |
| `Environment` | Yes | `String?` | No |
| `EnvironmentHistory` | Yes | `String?` | No |
| `Contract` | Yes | `String?` | No |
| `ContractHistory` | Yes | `String?` | No |
| `Configuration` | Yes | `String?` | No |
| `ConfigurationHistory` | Yes | `String?` | No |
| `Snapshot` | Yes | `String?` | No |
| `SnapshotHistory` | Yes | `String?` | No |
| `Release` | Yes | `String?` | No |
| `Deployment` | Yes | `String?` | No |
| `EnvironmentDeployment` | Yes | `String?` | No |
| `DeploymentHistory` | Yes | `String?` | No |
| `ERPRegistry` | Yes | `String` (non-null) | No |
| `EntityMapping` | Yes | `String` | No |
| `IntegrationLog` | Yes | `String?` (`@db.VarChar(100)`) | No |
| `Connector` | No | — | N/A (platform-global) |
| `ApiDefinition` | No | — | N/A |
| `Webhook` | No | — | N/A |
| `CredentialReference` | No | — | N/A |
| `Synchronization` | No | — | N/A |

**Finding:** `TenantGuard` (`iam/tenant.guard.ts`) exists and is applied via `@TenantResource` decorator on `ApplicationsController`. However:

1. `tenantId` is nullable (`String?`) on 14 platform models — a Prisma schema allows NULL, and queries without `WHERE tenantId` return ALL tenants' data.
2. `TenantGuard` reads `request.params.tenantId`, but platform API routes do NOT include `tenantId` in the path — tenants are resolved from the JWT principal. The guard is structurally misaligned with the platform routing model.
3. Only `ApplicationsController` passes `principal.tenantId` to the service — other platform controllers (contracts, configurations, snapshots, environments, versions) have NOT been verified for tenant scoping in their services.

**Recommendation:** Make `tenantId` non-nullable; enforce `WHERE tenantId = :principal.tenantId` in all platform services; refactor `TenantGuard` to use principal context, not path params.

---

## 23. Environment & Secrets Verification

| Check | Result |
|---|---|
| `.env` files tracked in git | **No** — `backend/.gitignore` ignores `/.env` and `/.env.local`; `frontend/.gitignore` ignores `.env*` |
| `.env.example` tracked | **Yes** — both backend and frontend |
| Real secrets in tracked files | **No** — `.env.example` uses `change_me_*` placeholders only |
| PostgreSQL credentials in frontend | **No** — frontend only has `VITE_API_BASE_URL` |
| Secrets in `docs/`, `scripts/`, `*.mjs` | None found |

**Recommendation:** Add `!.env.example` negation pattern to `frontend/.gitignore` for explicitness.

---

## 24. Express Usage Verification — COMPLIANT

| Check | Command | Result |
|---|---|---|
| `express()` calls | `grep -rn "express()" backend/src/` | 0 matches |
| `require('express')` | `grep -rn "require('express')" backend/src/` | 0 matches |
| `Router()` direct | `grep -rn "Router()" backend/src/` | 0 matches |
| `app.listen()` outside Nest | `grep -rn "app.listen" backend/src/` | 0 matches |
| Type-only express imports | `grep -rn "import type.*express" backend/src/` | Found — `Request`, `Response`, `NextFunction` type imports (legitimate) |
| NestJS platform-express | `grep -rn "@nestjs/platform-express" backend/` | Found — legitimate NestJS integration |

**Verdict:** No standalone Express application. All express usage is through NestJS's `@nestjs/platform-express`. ✓

---

## 25. Stale Documentation Detection

| Document | Issue | Status |
|---|---|---|
| `docs/business-manager/BM_CDC_IMPLEMENTATION_MATRIX.md` | References `/api/platform/applications`, `/api/platform/config`, `/api/platform/envs`, `/api/platform/contracts`, `/api/platform/snapshots` — **DO NOT EXIST** | STALE |
| `docs/business-manager/BM_CDC_IMPLEMENTATION_MATRIX.md` | Claims "Zero test files in `frontend/src/`" — **8 test files now exist** | STALE |
| `docs/business-manager/BM_CDC_IMPLEMENTATION_MATRIX.md` | References `schema.prisma:2544` for `Feature` model — verify line number | STALE |
| `docs/business-manager/BM_API_ROUTE_MATRIX.md` | References `/api/platform/*` paths | STALE |
| `docs/FINAL_REPOSITORY_REPORT.md` | Claims consolidation "complete" — must be reconciled with 2026-09-28 working tree | STALE |
| `docs/code-consolidation/iam-demo-migration.json` | May reference iam-demo status — verify | UNKNOWN |

**Recommendation:** Reconcile all `docs/business-manager/*` audit documents with current code paths (`/api/business-manager/*`).

---

## 26. BM-CDC Dependency Chain

```
BM-CDC-01 (Application Manager)
    └── BM-CDC-02 (Version Lifecycle)
            ├── BM-CDC-07 (Runtime Bridge: manifest from app+version)
            └── BM-CDC-08 (Quality Gate before publish)
                    └── depends on BM-CDC-07 runtime readiness
BM-CDC-03 (Data Model) ──────┐
BM-CDC-04 (Features/Caps) ───┤
BM-CDC-05 (Navigation) ──────┼──→ BM-CDC-07 aggregates all as RuntimeManifest
BM-CDC-06 (Configuration) ───┤
                            └──→ BM-CDC-02 uses QualityGate result

BM-CDC-07 (Integration/Runtime)
    └── BM-CDC-08 validates runtime readiness
```

**Critical path:** BM-CDC-03, 04, 08 are MISSING. BM-CDC-07 Runtime Bridge is MISSING. Without these, BM-CDC-02 publication cannot include quality gates or runtime readiness checks.

---

## 27. Summary Classification

| Domain | Backend | Frontend | Tests | Overall |
|---|---|---|---|---|
| IAM Foundation | IMPLEMENTED_REAL | IMPLEMENTED_REAL | IMPLEMENTED_PARTIAL | IMPLEMENTED_PARTIAL |
| BM-CDC-01 (Applications) | IMPLEMENTED_PARTIAL | IMPLEMENTED_PARTIAL | PARTIAL | IMPLEMENTED_PARTIAL |
| BM-CDC-02 (Versions) | IMPLEMENTED_PARTIAL | IMPLEMENTED_PARTIAL | PARTIAL | IMPLEMENTED_PARTIAL |
| BM-CDC-03 (Data Model) | MISSING | MISSING | MISSING | **MISSING** |
| BM-CDC-04 (Features/Caps) | IMPLEMENTED_PARTIAL (bare model) | MISSING | MISSING | **MISSING** |
| BM-CDC-05 (Navigation) | MISSING | IMPLEMENTED_PARTIAL | PARTIAL | IMPLEMENTED_PARTIAL |
| BM-CDC-06 (Config/Metadata) | IMPLEMENTED_REAL | IMPLEMENTED_PARTIAL | MISSING | IMPLEMENTED_PARTIAL |
| BM-CDC-07 (Integration/Runtime) | IMPLEMENTED_PARTIAL | IMPLEMENTED_PARTIAL | IMPLEMENTED_REAL | IMPLEMENTED_PARTIAL |
| BM-CDC-07 (ERP Adapter) | IMPLEMENTED_REAL | IMPLEMENTED_PARTIAL | IMPLEMENTED_REAL | IMPLEMENTED_PARTIAL |
| BM-CDC-07 (Data Runtime) | IMPLEMENTED_REAL | IMPLEMENTED_REAL | IMPLEMENTED_REAL | IMPLEMENTED_REAL |
| BM-CDC-08 (Quality) | MISSING | PLACEHOLDER | MISSING | **MISSING** |
| Deployment | IMPLEMENTED_REAL | IMPLEMENTED_PARTIAL | IMPLEMENTED_REAL | IMPLEMENTED_PARTIAL |
| Automation | IMPLEMENTED_REAL | IMPLEMENTED_PARTIAL | IMPLEMENTED_REAL | IMPLEMENTED_PARTIAL |

---

## 28. Recommendations — Prioritized

### P0 — Security (Immediate)
1. **Fix `IamAdminGuard`** (`iam-admin-guard.ts:16-18`): deny-by-default when no `@Permissions()` declared.
2. **Add `@Permissions(IAM_ADMIN)`** to all routes in the 10 exposed IAM controllers (~72 routes).
3. **Add `iam-admin-guard.spec.ts`**: test deny-by-default behavior.
4. **Run `npm test` (backend)** to ensure no regressions.
5. **Verify** with `grep -rn "@UseGuards(IamAdminGuard)" backend/src | grep -v "@Permissions"` → should return 0.

### P1 — Tenant Isolation (Week 1-2)
6. **Make `tenantId` non-nullable** on all platform models in `schema.prisma` + add migration.
7. **Enforce `WHERE tenantId`** in all platform service queries.
8. **Refactor `TenantGuard`** to use principal context, not `request.params.tenantId`.
9. **Add tenant scoping tests**.

### P2 — Code Hygiene (Week 2)
10. **Delete** `backend/src/platform/` directory (broken duplicate).
11. **Reconcile stale docs**: update `docs/business-manager/BM_CDC_IMPLEMENTATION_MATRIX.md` and `BM_API_ROUTE_MATRIX.md` to use `/api/business-manager/*`.
12. **Archive `bm/` CDC specs** → `docs/business-manager/cdc/` + track in git.
13. **Fix `RollbackController` + `CockpitController`** to use proper `@Controller('api/...')` prefix pattern.

### P3 — Test Infrastructure (Week 2-3)
14. **Add backend tests** for configurations, snapshots, environments, applications controller.
15. **Add frontend service tests** for all API clients.
16. **Add frontend E2E tests** (Playwright/Cypress) for login → CRUD flows.

### P4 — Missing Features (Week 3+)
17. **BM-CDC-03**: Implement Data Model Manager (model, CRUD, diff, migration plan)
18. **BM-CDC-04**: Implement Feature & Capability Manager (CRUD, Capability model)
19. **BM-CDC-08**: Implement Quality Engine (validator registry, orchestrator, gate, campaigns, waivers)
20. **BM-CDC-07**: Implement Runtime Bridge (contributors, manifest, resolver, readiness, immutable snapshot, binding, cache, SSRF protection, events)

---

## Verification Checklist

```bash
# P0 verification
grep -rn "@UseGuards(IamAdminGuard)" backend/src | grep -v "@Permissions"
# Expected: 0 results after fix

# Secrets verification
git ls-files | grep -iE 'env'     # only .env.example files
npx nest build                    # clean compile
npm test                          # all 29 + 5 IAM tests pass
npx vite build                    # clean frontend build
```

---

*Companion documents: `GLOBAL_PROJECT_INVENTORY.md`, `GLOBAL_IMPLEMENTATION_MATRIX.md`, `GLOBAL_API_MATRIX.md`, `ENVIRONMENT_CONFIGURATION_AUDIT.md`, `CODE_QUALITY_AUDIT.md`, `GLOBAL_UI_UX_AUDIT.md`, `TECHZONE_CLOUD_FINALIZATION_PLAN.md`, `TECHZONE_CLOUD_SYNTHESIS.md`*
