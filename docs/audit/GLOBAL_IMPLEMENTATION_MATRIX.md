# Techzone Cloud — Global Implementation Matrix

> **Purpose:** Domain-by-domain implementation status aligned to the 8 BM-CDC specifications and IAM foundation.
> **Date:** 2026-09-28
> **Classification Legend:** `IMPLEMENTED_REAL` / `IMPLEMENTED_PARTIAL` / `STUB` / `MOCK` / `BROKEN` / `MISSING` / `DUPLICATE` / `NOT_APPLICABLE`

## Matrix

| Domain | Backend | Frontend | Tests | CDC | Status | Critical Gap |
|---|---|---|---|---|---|---|
| **IAM Foundation** (auth, JWT, users, tenants, sessions, MFA) | `backend/src/iam/` — full auth controller, JWT, refresh, MFA, sessions, tenant switch | `LoginPage.jsx`, `authService.js`, session store | 5 spec files (`iam-jwt.guard`, `iam-permission.guard`, `iam.service`, `iam-auth.controller`, `iam-client`) | IAM | IMPLEMENTED_PARTIAL | P0: `IamAdminGuard` returns `true` when no `@Permissions()` — all IAM admin/billing/users/sessions/identities/policies/governance/observability routes exposed to any authenticated user |
| **Applications** (BM-CDC-01) | `modules/platform/applications/` — full CRUD, `@TenantResource` decorator | `ApplicationsView.jsx`, `ApplicationsCatalogView.jsx`, `CreateAppModal` | 1 spec (`applications.service.spec.ts`) | BM-CDC-01 | IMPLEMENTED_PARTIAL | Tenant scoping broken (see below); frontend blocked by auth (anonymous-only pages) |
| **Application Versions** (BM-CDC-02) | `modules/platform/application-versions/` — lifecycle state machine, clone, status transition | `VersionsDetailView.jsx`, `WorkspaceConfigView.jsx` | 1 spec (`application-versions.service.spec.ts`) | BM-CDC-02 | IMPLEMENTED_PARTIAL | PublicationView is NO_OP — no API call on launch; no quality gate before publish; no runtime readiness check |
| **Data Model Manager** (BM-CDC-03) | No `DataModel` model in schema; no controller/service/DTO | `navigationConfig.js:81` → `component: null`, `status: NOT_IMPLEMENTED` | None | BM-CDC-03 | MISSING | Entirely unstarted |
| **Feature & Capability Manager** (BM-CDC-04) | Bare `Feature` Prisma model only — no CRUD controller/service/DTO; no `Capability` model | `navigationConfig.js:82` → `component: null`, `status: NOT_IMPLEMENTED` | None | BM-CDC-04 | MISSING | Model exists but no logic; Capability missing |
| **Menu Engine & Navigation** (BM-CDC-05) | No backend persistence | `navigationConfig.js` (92 entries), `Sidebar.jsx`, `SubNavBar.jsx`, `routes.js` | 3 nav test files | BM-CDC-05 | IMPLEMENTED_PARTIAL | Frontend-only; no navigation contract/API; no route validation in quality gate |
| **Configuration & Metadata** (BM-CDC-06) | `modules/platform/configuration/` — full CRUD + effective resolution (31KB service) | `ConfigurationView.jsx`, `WorkspaceConfigView.jsx` (config tab) | None | BM-CDC-06 | IMPLEMENTED_PARTIAL | **BROKEN**: `src/platform/configuration/configuration.controller.ts` (duplicate) references non-existent `./configuration.service`; no tenant scoping; no metadata entity |
| **Integration / Contracts / Runtime Bridge** (BM-CDC-07) | `modules/integration/` (connectors, API manager, webhooks, credentials, synchronizations, diagnostics) + `modules/platform/contracts/`, `modules/platform/snapshots/`, `erp-registry/`, `erp-adapter/`, `data-runtime/` | `IntegrationCockpitView.jsx`, `ContractsView.jsx`, `SnapshotsView.jsx`, `CreateSnapshotModal.jsx`, `ConnectorManagerView` | 7 spec files (integration) + 3 (erp-adapter) + 4 (data-runtime) | BM-CDC-07 | IMPLEMENTED_PARTIAL | Contract registry + integration layer real; **entire Runtime Bridge missing**: contributors registry, runtime manifest, resolver, readiness, immutable snapshot assembly, binding, cache/invalidation, SSRF protection, event contracts, manifest viewer UI, binding wizard |
| **Deployment / Releases** (BM-CDC-02) | `modules/deployment/` (releases, deployments, gates, rollback, environments, cockpit, diagnostics) | `DeploymentPublicationView.jsx` | 6 spec files | BM-CDC-02 | IMPLEMENTED_PARTIAL | No frontend coverage documented; rollback/cockpit controllers use root `@Controller()` with full path in decorator (inconsistent pattern) |
| **Automation** (WF-CDC) | `automation/` — rules, conditions, triggers, actions, workflow engines + controller | `AutomationCockpit`, `RuleBuilder`, `WorkflowBuilder` | 6 spec files | WF-CDC | IMPLEMENTED_PARTIAL | Engine exists but no contract binding to versioned deployments; no quality gate integration |
| **Data Runtime Query** (BM-CDC-07) | `data-runtime/data-runtime.controller.ts` — query, execute, validate, bindings | `DataRuntimeView.jsx` | 4 spec files | BM-CDC-07 | IMPLEMENTED_REAL | Core query/execute engine functions; **MISSING**: binding resolution to runtime manifest, readiness aggregation |
| **ERP Adapter** (BM-CDC-07) | `erp-adapter/` — Dolibarr + mock adapters, 42 routes with `@Permissions()` | `ErpCatalogView.jsx`, `ERPDashboard`, `ErpModule` | 3 spec files | BM-CDC-07 | IMPLEMENTED_PARTIAL | ERP adapter is well-protected (all routes have `@Permissions`); but no binding to runtime manifest; direct DB access patterns flagged |
| **Validation, Tests & Quality** (BM-CDC-08) | No QualityValidatorRegistry, QualityOrchestrator, QualityGate, campaign model | `PackValidationCockpitView.jsx` (stub — backend missing) | None | BM-CDC-08 | MISSING | Entire quality engine absent; no publication gate; no quality dashboard UIs beyond stub |
| **Tenant Isolation** | `iam/tenant.guard.ts` exists; `TenantResource` decorator on platform controllers | N/A | None | Cross-cutting | BROKEN | `tenantId` is `String?` (nullable) on all models; `TenantGuard` reads `request.params.tenantId` which is NEVER in platform API path parameters; platform controllers DO pass `principal.tenantId` manually — but this is inconsistent and unverified for all models |

## Cross-Cutting Concerns

| Concern | Status | Evidence / Notes |
|---|---|---|
| **Authentication** | IMPLEMENTED_REAL | `IamJwtGuard` validates JWT; `iam-jwt.guard.spec.ts` tests it |
| **Authorization** | IMPLEMENTED_PARTIAL | `@Permissions()` decorator + `IamAdminGuard`; only ERP adapter uses it correctly |
| **Tenant scoping** | BROKEN | See above — nullable tenantId, no DB-enforced tenant filter on most queries |
| **API response format** | IMPLEMENTED_REAL | `{ success, message, data }` envelope via `apiClient.js` normalization |
| **Validation** | IMPLEMENTED_REAL | `ValidationPipe` (class-validator) in `main.ts` |
| **Security headers** | IMPLEMENTED_REAL | `Helmet`, cookie-parser in `main.ts` |
| **Rate limiting** | IMPLEMENTED_PARTIAL | `express-rate-limit` mentioned in ARCHITECTURE.md; verify in `main.ts` |
| **CORS** | IMPLEMENTED_REAL | `CORS_ORIGIN` env var, comma-separated, not wildcard |
| **Tracing** | IMPLEMENTED_PARTIAL | `X-Trace-Id` middleware; `traceId` in DB models |
| **Audit logging** | IMPLEMENTED_PARTIAL | `AuditEvent` model in schema; no platform service emits audit events |
| **Observability** | PARTIAL | Winston logger; observability dashboard endpoint exists but is P0-exposed |
| **Optimistic locking** | MISSING | No `@version` column on any Platform model |
| **Soft delete** | PARTIAL | `status` enums support ARCHIVED; but hard DELETE may still be used |
| **Transactional integrity** | PARTIAL | Used in `contract.service.ts`, `snapshot.service.ts`; not universal |
| **Error handling** | IMPLEMENTED_REAL | `PlatformException`, `PlatformErrorCode`, `PrismaErrorMapper` |
| **Frontend test infrastructure** | MISSING (improvement needed) | 8 test files only cover nav config + 6 UI components; no service/slice/page tests |
| **Backend test coverage** | PARTIAL (improvement needed) | 29 spec files — strong in integration/deployment/data-runtime; **zero** for configuration, snapshots, environments, applications controller |
| **Duplicate broken module** | DUPLICATE/BROKEN | `src/platform/configuration/` (controller-only, 2026-09-21) vs `src/modules/platform/configuration/` (full, 2026-09-14) |

## Test Coverage Heatmap

| Module | Spec Files | Coverage Quality |
|---|---|---|
| IAM | 5 | Good — guards, auth, service, client tested |
| Automation | 6 | Good — all engines tested |
| Integration | 7 | Good — connector, API manager, webhook, credentials, synchronization, diagnostics |
| Deployment | 6 | Good — release, deployment, gates, rollback, environments, cockpit |
| Data Runtime | 4 | Good — query engine, execution, validation, erp-adapter provider |
| ERP Adapter | 3 | Good — dolibarr, mock, service |
| Platform (Applications) | 1 | Service-only; controller untested |
| Platform (Application Versions) | 1 | Service-only |
| Platform (Contracts) | 1 | Service-only |
| Platform (Configurations) | 0 | No tests at all |
| Platform (Snapshots) | 0 | No tests at all |
| Platform (Environments) | 0 | No tests at all |

## Missing API Endpoints (CDC-Required)

| CDC | Required | Status |
|---|---|---|
| BM-CDC-03 | `POST/GET/PUT /business-manager/data-models` | MISSING |
| BM-CDC-03 | `POST /business-manager/data-models/:id/diff` | MISSING |
| BM-CDC-04 | `POST/GET/PUT /business-manager/features` | MISSING (model exists, no CRUD) |
| BM-CDC-04 | `POST/GET/PUT /business-manager/capabilities` | MISSING |
| BM-CDC-05 | `POST/GET/PUT /business-manager/navigation` | MISSING |
| BM-CDC-07 | `POST /business-manager/contracts/contributors` | MISSING |
| BM-CDC-07 | `GET /business-manager/versions/:versionId/runtime-manifest` | MISSING |
| BM-CDC-07 | `POST /business-manager/versions/:versionId/runtime-readiness` | MISSING |
| BM-CDC-07 | `POST /business/integrations/bindings` | MISSING |
| BM-CDC-07 | `POST /business/adapters/:key/test-connection` | MISSING |
| BM-CDC-07 | `GET /business-manager/contracts/:id/compatibility/check` | PARTIAL (compatibility exists, no dedicated check) |
| BM-CDC-08 | `POST /business/quality/campaigns` | MISSING |
| BM-CDC-08 | `POST /business/quality/validate` | MISSING |
| BM-CDC-08 | `GET /business/quality/gate` | MISSING |
| BM-CDC-08 | `POST /business/quality/waivers` | MISSING |
| BM-CDC-08 | `POST /business/quality/approvals` | MISSING |
| BM-CDC-08 | `GET /business/quality/reports/:id` | MISSING |
