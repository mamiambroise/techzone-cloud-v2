# Techzone Cloud — Global Project Inventory

> **Purpose:** Folder-by-folder inventory of the repository `D:\wifi zone\ERP\techcloud\techcloud` as of 2026-09-28.
> **Track status via:** `git ls-files` (tracked) vs. `Get-ChildItem` (working tree).

## Repository Overview

| Attribute | Value |
|---|---|
| Working dir | `D:\wifi zone\ERP\techcloud\techcloud` |
| Git repository | Yes (root = techcloud) |
| Latest commit | `e59c073` (main) |
| Backend port | 3003 (`/api/*`) |
| Frontend port | 3000 |
| Dolibarr (legacy) port | 8080 |
| DB schema | `business_manager` (PostgreSQL 16) |
| Backend framework | NestJS 12, Prisma 7, TypeScript 6 |
| Frontend framework | React 19, Vite 6.2 |

## Top-Level Structure

| Path | Tracked? | Purpose | Notes |
|---|---|---|---|
| `backend/` | Yes | NestJS backend (single API) | Canonical backend, port 3003 |
| `frontend/` | Yes | React/Vite frontend | Canonical frontend, port 3000 |
| `techzone/` | Yes | Dolibarr PHP legacy | **DO NOT MODIFY** — external system |
| `docs/` | Yes | Project documentation | Extensive pre-existing audit docs |
| `scripts/` | Yes | Orchestration & diagnostic scripts | `dev-all.mjs`, `stop.mjs`, `status.mjs` |
| `bm/` | **No** | 8 BM-CDC specifications | 2316–3661 lines each; NOT tracked by Git |
| `package.json` | **No** | Root orchestrator | Non-tracked; delegates to `scripts/` |
| `AGENTS.md` | Yes | Build/test/dev commands | Project conventions |
| `.gitignore` | Yes | Ignore rules | Excludes `node_modules`, `.env`, etc. |
| `.kilo/` | **No** | Kilo agent config | Ignored by Git |
| `.claude-dev-helper/` | **No** | Claude helper | Ignored by Git |
| `logs/` | **No** | Runtime/PID logs | Ignored by Git; PID file `.dev-pids.json` |
| `node_modules/` | **No** | Dependencies | Ignored by Git |

### Untracked / Non-Application Directories

| Directory | Purpose | Tracked? |
|---|---|---|
| `bm/` | Business Manager CDC specs (BM-CDC-01..08) | No — NOT in git |
| `.kilo/` | Kilo CLI configuration & worktrees | No — ignored |
| `.claude-dev-helper/` | Claude dev workflow helper | No |
| `logs/` | Process logs + PID files | No |
| `node_modules/` | npm dependencies | No |

> **Note:** `bm/` contains the authoritative CDC specifications but is NOT tracked by Git and NOT present on disk in a way that survives git operations. If `bm/` is lost, the CDC source of truth is gone. **Recommendation:** archive `bm/*.md` into `docs/business-manager/cdc/` and track them.

## Backend (`backend/`)

### Source Structure

```
backend/src/
├── iam/                          Authentication, JWT, MFA, IAM entities
│   ├── decorators/               @CurrentUser, @Permissions, @Public
│   ├── guards/                   IamJwtGuard, IamAdminGuard, TenantGuard
│   ├── iam-auth.controller.ts    /api/iam/* auth endpoints
│   ├── iam-jwt.guard.ts          JWT validation
│   ├── iam-jwt.guard.spec.ts     (test)
│   ├── iam-admin-guard.ts        Permission enforcement guard (HAS BUG)
│   ├── iam-permission.guard.spec.ts (test)
│   ├── iam.module.ts             IAM module
│   ├── iam.service.ts            IAM business logic
│   ├── iam.service.spec.ts       (test)
│   └── iam.constants.ts          Roles, permissions, cookie config
├── modules/                      Feature domain modules
│   ├── platform/                 Applications, versions, environments,
│   │   │                         contracts, snapshots, configurations
│   │   ├── applications/         applications.controller/service.spec.ts
│   │   ├── application-versions/ application-versions.controller/service
│   │   ├── contracts/            contract.controller/service.spec.ts
│   │   ├── configurations/       configuration.controller/service
│   │   ├── environments/         environment-deployment.controller/service
│   │   ├── snapshots/            snapshot.controller/service
│   │   └── platform.module.ts
│   ├── integration/              Connectors, API manager, webhooks,
│   │   │                         credentials, synchronizations, diagnostics
│   │   ├── connectors/           connector.controller/service
│   │   ├── api-manager/          api-manager.service.spec.ts
│   │   ├── webhooks/             webhook-signature.service.spec.ts
│   │   ├── credentials/          credentials.service.spec.ts
│   │   ├── synchronizations/     synchronization.service.spec.ts
│   │   ├── diagnostics/          diagnostics.service.spec.ts
│   │   └── integration.module.ts
│   └── deployment/               Releases, deployments, gates, rollback,
│       │                         environment-deployments, cockpit, history
│       ├── releases/             release.service.spec.ts
│       ├── deployments/          deployment.service.spec.ts
│       ├── gates/                gate.service.spec.ts
│       ├── rollback/             rollback.service.spec.ts
│       ├── environments/         environment-deployment.service.spec.ts
│       ├── cockpit/              cockpit.service.spec.ts
│       └── deployment.module.ts
├── erp-adapter/                  ERP adapter (Dolibarr + mock)
│   ├── dolibarr/                 dolibarr.adapter.spec.ts
│   ├── mock/                     mock.adapter.spec.ts
│   ├── erp-adapter.controller.ts @Controller('api/erp')
│   ├── erp-adapter.service.ts    erp-adapter.service.spec.ts
│   └── erp-adapter.module.ts
├── erp-registry/                 ERP registry
│   ├── erp-registry.controller.ts @Controller('api/erp-registry')
│   └── erp-registry.module.ts
├── data-runtime/                 Query engine, binding, execution
│   ├── query-engine/             query-engine.spec.ts
│   ├── execution-engine/         execution-engine.spec.ts
│   ├── data-access/              erp-adapter.provider.spec.ts
│   ├── validation/               validation.service.spec.ts
│   └── data-runtime.module.ts
├── automation/                   Rules, conditions, triggers, workflow
│   ├── rules/                    rules.engine.spec.ts
│   ├── conditions/               conditions.engine.spec.ts
│   ├── trigger/                  trigger.engine.spec.ts
│   ├── action/                   action.engine.spec.ts
│   ├── workflow/                 workflow.engine.spec.ts
│   ├── automation.controller.ts  @Controller('api/automation')
│   └── automation.module.ts
├── common/                       Shared: errors, lifecycle, mail, types
│   ├── lifecycle/                integration-lifecycle.util.spec.ts
└── config/                       Global configuration
│   ├── config.controller.ts      @Controller('api/config')
├── main.ts                       Bootstrap: CORS, Helmet, rate-limit, ValidationPipe
├── app.module.ts                 Root module (imports all above)
├── app.controller.ts             Root controller
└── app.controller.spec.ts        (test)
```

### Prisma Schema (`backend/prisma/schema.prisma`)

| Section | Models |
|---|---|
| **Platform models** | `Application`, `ApplicationVersion`, `Environment`, `EnvironmentHistory`, `Contract`, `ContractHistory`, `ContractProvider`, `ContractConsumer`, `Configuration`, `ConfigurationHistory`, `Snapshot`, `SnapshotHistory` |
| **Integration models** | `Connector`, `ApiDefinition`, `Webhook`, `WebhookDelivery`, `CredentialReference`, `Synchronization`, `IntegrationLog` |
| **Deployment models** | `Release`, `Deployment`, `EnvironmentDeployment`, `DeploymentGate`, `Rollback`, `DeploymentHistory` |
| **ERP Adapter models** | `ERPRegistry`, `AdapterRegistry`, `EntityMapping` |
| **IAM models** | `IamUser`, `IamCredential`, `IamPasswordHistory`, `IamDevice`, `IamSession`, `IamRefreshToken`, `Identity`, `UserIdentity`, `ExternalIdentityLink`, `Tenant`, `Organization`, `Site`, `Membership`, `Group`, `GroupMember`, `Permission`, `Role`, `RolePermission`, `RoleAssignment`, `AccessPolicy`, `PolicyCondition`, `AuthorizationDecision`, `ServiceAccount`, `Subscription`, `Invoice`, `AdminDelegation`, `Feature` (bare model only) |

> **Tenant isolation note:** All platform/deployment/ERP-registry models have `tenantId String?` (nullable). Integration models (`Connector`, `Webhook`, etc.) do NOT have tenantId — they are platform-global. The nullability is a risk: queries without `WHERE tenantId = X` are NOT scoped.

### Test Inventory (backend)

**29 spec files** across:

| Domain | Files | Counts |
|---|---|---|
| IAM | `iam-jwt.guard.spec.ts`, `iam-permission.guard.spec.ts`, `iam.service.spec.ts`, `iam-auth.controller.spec.ts`, `iam-client.spec.ts` | 5 |
| Platform | `applications.service.spec.ts`, `contract.service.spec.ts`, `application-versions.service.spec.ts` | 3 |
| Integration | `webhook-signature.service.spec.ts`, `api-manager.service.spec.ts`, `credentials.service.spec.ts`, `synchronization.service.spec.ts`, `diagnostics.service.spec.ts`, `integration-provider.contract.spec.ts`, `integration-contract.spec.ts` | 7 |
| ERP Adapter | `mock.adapter.spec.ts`, `dolibarr.adapter.spec.ts`, `erp-adapter.service.spec.ts` | 3 |
| Deployment | `release.service.spec.ts`, `deployment.service.spec.ts`, `gate.service.spec.ts`, `rollback.service.spec.ts`, `environment-deployment.service.spec.ts`, `cockpit.service.spec.ts` | 6 |
| Data Runtime | `validation.service.spec.ts`, `query-engine.spec.ts`, `execution-engine.spec.ts`, `erp-adapter.provider.spec.ts` | 4 |
| Automation | `rules.engine.spec.ts`, `conditions.engine.spec.ts`, `trigger.engine.spec.ts`, `action.engine.spec.ts`, `workflow.engine.spec.ts`, `automation.controller.spec.ts` | 6 |
| Common / App | `integration-lifecycle.util.spec.ts`, `app.controller.spec.ts` | 2 |

> **Gap:** No tests for `configuration` (ConfigurationManager), `snapshots`, `applications.controller`, `environment-deployment.controller`, or `erp-registry`. No controller-level tests except automation.

### Configuration / Environment

| File | Tracked? | Purpose |
|---|---|---|
| `backend/.env.example` | **Yes** | Template with placeholder values (`change_me_*`) |
| `backend/.env` | No (gitignored) | Real secrets — never committed |
| `backend/.env.local` | No (gitignored) | Local overrides — never committed |
| `backend/prisma7.config.ts` | Yes | Prisma 7 datasource + seed entrypoint |
| `backend/.gitignore` | Yes | Ignores `/dist`, `/.env`, `/.env.local`, `/src/generated/prisma` |

Required environment variables (from `.env.example`):

| Variable | Default / Example | Purpose |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres:change_me@...` | PostgreSQL connection |
| `JWT_ACCESS_SECRET` | `change_me_*` | JWT signing |
| `JWT_REFRESH_SECRET` | `change_me_*` | Refresh token signing |
| `CORS_ORIGIN` | `http://localhost:3000` | CORS allowlist |
| `NODE_ENV` | `development` | `production` enables Secure cookies |
| `IAM_API_URL` | `http://localhost:3003` | Internal IAM API |
| `DOLIBARR_URL` | `http://localhost:8080` | Dolibarr ERP |
| `SMTP_HOST/PORT/USER/PASS` | — | Mail |
| `REDIS_URL` | — | Cache/queue |

## Frontend (`frontend/`)

### Source Structure

```
frontend/src/
├── api/
│   ├── apiClient.js            Axios instance + interceptors + error normalization
├── services/
│   └── api/                    API service modules (one per domain)
│       ├── authService.js      /api/iam/* authentication
│       ├── platformApplicationsService.js  /business-manager/applications
│       ├── platformConfigService.js         /business-manager/configurations
│       ├── platformEnvironmentsService.js   /business-manager/environments
│       ├── deploymentService.js            /api/deployment/*
│       ├── integrationService.js           /api/integration/*
│       └── erpService.js                   /api/erp/*
├── app/
│   ├── navigationConfig.js      92 route entries, sections, groups (single source of truth)
│   ├── routes.js                Route mapping (path → component)
│   ├── store.js                 Redux Toolkit store
│   └── App.jsx                  Router + layout wiring
├── layouts/
│   └── TechzoneLayout.jsx       AppShell: Sidebar + Header + SubNavBar + Outlet
├── features/
│   ├── iam-demo/                DEV_ONLY: 212+ files, mock services, mockData, DemoPage
│   ├── erp-account/             Legacy (non-routed)
│   ├── platform/                Applications, configurations, environments, contracts, snapshots
│   ├── integration/             Cockpit, connectors, APIs, webhooks, credentials, synchronizations
│   ├── deployment/              Releases, deployments, cockpit, rollback
│   ├── automation/              Rules, triggers, actions, workflows
│   ├── data-runtime/            Query engine, binding, execution
│   └── erp-adapter/             ERP catalog, dashboard, entity mappings
├── pages/                       Page-level components
│   ├── LoginPage.jsx            Auth login
│   ├── ApplicationsView.jsx
│   ├── ConfigurationView.jsx
│   ├── ContractsView.jsx
│   ├── IntegrationCockpitView.jsx
│   ├── DeploymentPublicationView.jsx
│   ├── ErpCatalogView.jsx
│   ├── DataRuntimeView.jsx
│   └── ...
├── components/                  Shared UI components
├── store/                       Redux slices (auth, applications, configurations, etc.)
└── index.jsx                    Entry point
```

### Frontend Test Inventory

| File | Notes |
|---|---|
| `navigationConfig.test.js` | Navigation config unit test |
| `ContextBar.test.jsx` | ContextBar component |
| `businessManager.test.jsx` | BusinessManager component |
| `Card.test.jsx` | Card component |
| `PageHeader.test.jsx` | PageHeader component |
| `configuration-navigation.test.jsx` | Config navigation |
| `refresh.test.js` | Token refresh logic |
| `session-navigation.test.jsx` | Session nav |

> 8 test files, all Vitest + React Testing Library. Tests cover navigation config + a few UI components. **No tests** for API services, Redux slices, pages, or domain features.

### Frontend Configuration

| File | Purpose | Tracked? |
|---|---|---|
| `frontend/vite.config.ts` | Vite config; `/api/iam` → :3003, `/api` → :3003 | Yes |
| `frontend/.gitignore` | Ignores `.env*` except `.env.example` | Yes |
| `frontend/.env.example` | Template for env vars | Yes (if exists) |

## Legacy Dolibarr (`techzone/`)

| Attribute | Value |
|---|---|
| Tracked? | Yes (14999 files) |
| Language | PHP |
| Purpose | Legacy Dolibarr ERP system |
| Modification policy | **NEVER MODIFY** unless a specific ERP task |
| Local availability | Requires MySQL/MariaDB — intermittently unavailable |
| Health classification | `DATABASE_UNAVAILABLE` when MySQL/MariaDB is down |

## Scripts (`scripts/`)

| File | Purpose |
|---|---|
| `scripts/dev-all.mjs` | Orchestrator: starts frontend (3000) + backend (3003) + Dolibarr (8080) |
| `scripts/status.mjs` | Show running services |
| `scripts/stop.mjs` | Stop all services |
| Root `package.json` (untracked) | Delegates to `scripts/dev-all.mjs` via `dev`/`stop`/`status`/`dev:rebuild` |

## Existing Documentation (`docs/`)

| File/Dir | Domain | Notes |
|---|---|---|
| `docs/ARCHITECTURE.md` | Architecture | High-level; some path inaccuracies (minor) |
| `docs/DEVELOPMENT.md` | Dev workflow | Build/test instructions |
| `docs/API.md` | API reference | Endpoints summary |
| `docs/FINAL_REPOSITORY_REPORT.md` | Consolidation | 2026-09-27; claims consolidation done — must be reconciled with working tree |
| `docs/CONSOLIDATION_FINAL.md` | Consolidation | Final consolidation status |
| `docs/TECHZONE_CLOUD_CONSOLIDATION_REPORT.md` | Consolidation | Detailed report |
| `docs/PROJECT_IMPLEMENTATION_MATRIX.md` | Implementation | Feature matrix |
| `docs/business-manager/BM_CDC_IMPLEMENTATION_MATRIX.md` | Audit | Phase 0; **STALE** (references `/api/platform/*` paths) |
| `docs/business-manager/BM_API_ROUTE_MATRIX.md` | Audit | API routes per CDC |
| `docs/business-manager/BM_CDC_FEATURE_CHECKLIST.md` | Audit | Feature checklist per CDC |
| `docs/business-manager/BM_PHASE_1_REPORT.md` | Audit | Phase 1 report |
| `docs/business-manager/runtime/` | Runtime | Build logs, http.json, screenshots |
| `docs/consolidation/` | Consolidation | Multiple audit JSON files |
| `docs/full-runtime-review/` | Runtime review | Business journeys, contracts, security, mocks |
| `docs/code-consolidation/` | Code quality | Feature matrix, inventory, iam-demo |
| `docs/tenant/` | Tenant isolation | Context audit, fix report, isolation review |
| `docs/navigation/` | Navigation | 4-level nav, audit, route matrix |
| `docs/IAM_ACCESS_CORRECTION_REPORT.md` | IAM | Access correction |
| `docs/LOCAL_POSTGRESQL.md` | DB | Local PostgreSQL setup |
| `docs/POSTGRESQL_STABILITY_REPORT.md` | DB stability | Stability analysis |
| `docs/NAVIGATION_ARCHITECTURE.md` | Navigation | Nav architecture |
| `docs/NAVIGATION_ROUTE_MATRIX.md` | Navigation | Route matrix |

> **Critical finding:** The existing `docs/business-manager/BM_CDC_IMPLEMENTATION_MATRIX.md` and `docs/business-manager/BM_API_ROUTE_MATRIX.md` reference API paths `/api/platform/*` which **DO NOT EXIST** in the current code. The actual controllers use `/api/business-manager/*`. These documents are **stale** relative to the current working tree (uncommitted rename from `platform` → `business-manager`).
