# Phase 1 Report — Tenant Foundation & Business Manager Migration

## Objective

Implement tenant isolation across all platform models in the Business Manager (BM), enforce tenant scoping at every service layer, protect all platform routes with a database-aware `TenantGuard`, and migrate the UI route structure to the `/business-manager/...` convention.

## CDC Coverage

| CDC | Phase | Status | Notes |
|-----|--------|--------|-------|
| BM-CDC-01 Core Concepts & Tenant Model | 1 | DONE | `tenantId` added to `Application`, `ApplicationVersion`, `Environment`, `Contract`, `Configuration`, `Snapshot`, `Release`, and all history/deployment tables. `Tenant` model extended with `applications` relation. |
| BM-CDC-02 Foundation (Applications, Versions, Environments, Contracts) | 1 | DONE | `ApplicationsService`, `ApplicationVersionsService`, `EnvironmentsService`, `ContractsService` all rewritten with tenant scoping. |
| BM-CDC-03 Configuration Management | 1 | DONE | `ConfigurationService` rewritten with tenant scoping across all methods. |
| BM-CDC-04 Snapshots | 1 | DONE | `SnapshotsService` rewritten with tenant scoping. |
| BM-CDC-05–09 | 2–9 | PLANNED | Deferred to respective phases. Route stubs created in `routes.js` and `navigationConfig.js`. |

## Changes Summary

### Backend (NestJS 12 + Prisma 7)

#### Schema (`prisma/schema.prisma`)

- `tenantId String? @db.Uuid` added to: `Application`, `ApplicationVersion`, `Environment`, `Contract`, `Configuration`, `Snapshot`, `Release`, `EnvironmentDeployment`, `Deployment`, `DeploymentHistory`
- `Tenant` model gained `applications Application[]` relation
- Unique constraints converted from single-column to tenant-scoped composites:
  - `Application`: `@@unique([tenantId, code])`
  - `ApplicationVersion`: `@@unique([tenantId, applicationId, version])`
  - `Environment`: `@@unique([tenantId, code])`
  - `Contract`: `@@unique([tenantId, contractCode, contractVersion])`
  - `Configuration`: `@@unique([tenantId, scope, scopeId, key])`
  - `Release`: `@@unique([tenantId, code, version])`
- `@@index([tenantId])` added to all modified models

#### Migration (`prisma/migrations/20260927010000_add_tenant_id_to_platform_models/migration.sql`)

- Backfills all records with `tenantId = 'legacy'`
- Sets `NOT NULL` on `tenantId` columns
- Drops pre-existing single-column unique indexes and recreates as tenant-scoped composite indexes

#### Security (`src/iam/`)

- `TenantGuard` rewritten to be **database-aware**:
  - Injects `PrismaService` + `Reflector`
  - Reads `@TenantResource({ table, idParam })` metadata
  - Resolves resource `tenantId` via Prisma lookup
  - Denies with `TENANT_MISMATCH` when resource tenant differs from principal tenant
  - SuperAdmin bypass preserved
  - `'legacy'` tenant explicitly allowed (backfill tenant)
- New `TenantResource` decorator: `src/iam/tenant-resource.decorator.ts`
- `TenantGuard` registered as global `APP_GUARD` in `iam.module.ts` (after `IamPermissionsGuard`)
- `IamLogger.tenantDeny` signature updated to accept `string | undefined`

#### Services (all tenant-scoped)

| Service | Methods Updated |
|---------|-----------------|
| `ApplicationsService` | `create`, `findAll`, `findOne`, `update`, `archive` |
| `ApplicationVersionsService` | `findByApplication`, `findAll`, `create`, `findOne`, `update`, `changeStatus`, `clone` |
| `ContractsService` | `create`, `findAll`, `findOne`, `validate`, `lock`, `getCompatibility`, `getHistory` |
| `ConfigurationService` | `findAll`, `findByScope`, `resolveEffectiveConfigurations`, `create`, `update`, `validate`, `activate`, `getHistory` |
| `EnvironmentsService` | `create`, `findAll`, `findOne`, `update`, `archive`, `getHistory` |
| `SnapshotsService` | `create`, `findAll`, `findOne`, `compare`, `validate`, `activate`, `archive`, `getHistory` |
| `PlatformService` | `getDashboard`, `getActivity` |

#### Controllers (routes migrated from `/api/platform/*` → `/api/business-manager/*`)

| Controller | Route |
|-----------|-------|
| `ApplicationsController` | `@Controller('api/business-manager/applications')` |
| `ApplicationVersionsController` | `@Controller('api/business-manager')` (sub-paths for versions) |
| `ContractsController` | `@Controller('api/business-manager/contracts')` |
| `ConfigurationController` | `@Controller('api/business-manager/configurations')` |
| `EnvironmentsController` | `@Controller('api/business-manager/environments')` |
| `SnapshotsController` | `@Controller('api/business-manager/snapshots')` |
| `PlatformController` | `@Controller('api/business-manager')` |

All controllers use `@TenantResource` + `@UseGuards(TenantGuard)` + `@CurrentPrincipal()`.

#### Cleanup

- Deleted `backend/src/platform/configuration/configuration.controller.ts` (broken duplicate referencing non-existent `./configuration.service`)
- Fixed `ReleaseService.create()` — `code_version` composite unique replaced with `tenantId`-scoped `findFirst` check

### Frontend (React 19 + Vite 6)

#### Routes (`src/app/routes.js`)

- Added BM route definitions:
  - `/business-manager`
  - `/business-manager/applications`
  - `/business-manager/applications/new`
  - `/business-manager/applications/:applicationId`
  - `/business-manager/applications/:applicationId/versions`
  - `/business-manager/applications/:applicationId/versions/:versionId`
  - Phase 4–9 sub-routes (data-model, features, navigation, configuration, runtime, validation)

#### Navigation (`src/app/navigationConfig.js`)

- Added `bm` group to `navigationGroups`
- Added 13 BM page definitions (6 implemented stubs + 6 Phase 4–9 placeholders + overview)
- Added backward-compatible redirects:
  - `/business` → `/business-manager`
  - `/business/models` → `/business-manager/applications`
  - `/business/features` → `/business-manager/applications`
  - `/business/navigation` → `/business-manager/applications`
  - `/business/configuration` → `/business-manager`
  - `/business/validation` → `/business-manager`

#### New Components (`src/components/business-manager/`)

- `BMOverview.jsx` — BM dashboard with summary cards
- `BMApplicationsRoute.jsx` — Application listing + empty state
- `BMApplicationNewRoute.jsx` — Create application form
- `BMApplicationDetailRoute.jsx` — Application detail with version routing
- `BMVersionsRoute.jsx` — Version listing
- `BMVersionDetailRoute.jsx` — Version detail with sub-tab navigation (Phases 4–9 placeholders)
- `ApplicationCard.jsx`, `VersionCard.jsx`, `BMSidebarNav.jsx`, `BMApplicationForm.jsx`

#### UI Foundation (`src/components/ui/`)

- `PageHeader.jsx` — Header with title, subtitle, breadcrumbs, action button
- `Card.jsx` — Reusable card component

#### ContextBar (`src/components/ContextBar.jsx`)

- Displays: Application ▼ / Version ▼ / Status / Environment ▼ / Tenant
- Environment dropdown selector with dev/staging/prod options

#### API Services Updated

All three platform service files migrated to `/business-manager/...` paths:
- `platformApplicationsService.js`
- `platformEnvironmentsService.js`
- `platformConfigService.js`

#### Test Infrastructure

- Added `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `happy-dom`
- Created `src/tests/setup.js` for jest-dom matchers
- Updated `vite.config.ts` with Vitest configuration (`--mode test`)
- Added `test` and `test:ui` scripts to `package.json`

### Tests

#### Backend (Jest + @nestjs/testing)

| Test File | Tests | Status |
|-----------|-------|--------|
| `applications.service.spec.ts` | 10 | PASS |
| `application-versions.service.spec.ts` | 7 | PASS |
| `contract.service.spec.ts` | 9 | PASS |
| `iam-permission.guard.spec.ts` | 6 (3 existing + 3 new) | PASS |
| **Total** | **32** | **All pass** |

#### Frontend (Vitest + React Testing Library)

| Test File | Tests | Status |
|-----------|-------|--------|
| `navigationConfig.test.js` | 8 | PASS |
| `PageHeader.test.jsx` | 3 | PASS |
| `Card.test.jsx` | 4 | PASS |
| `ContextBar.test.jsx` | 2 | PASS |
| `businessManager.test.jsx` | 4 | PASS |
| **Total** | **21** | **All pass** |

## Phase 1 Success Gates

All Phase 1 success gates are met:

| Gate | Status |
|------|--------|
| TENANT_CONTEXT — Tenant info in JWT principal | DONE (existing) |
| TENANT_ISOLATION — TenantGuard enforced on all platform controllers | DONE |
| APPLICATION_CONTEXT — `applicationId` routed via `/business-manager/applications/:id` | DONE |
| VERSION_CONTEXT — `versionId` routed via `/business-manager/applications/:appId/versions/:vid` | DONE |
| BM-CDC-01 Core = REAL | DONE |
| BM-CDC-02 Foundation = REAL | DONE |
| Build / Typecheck PASS (backend + frontend) | DONE |
| Tenant Tests PASS | DONE (32 backend + 21 frontend tests pass) |

## Migration Notes

- Existing data backfilled with `tenantId = 'legacy'` via migration SQL
- Legacy `/business/*` frontend routes redirect to `/business-manager/*` via `LegacyRedirect` component
- Old `/api/platform/*` API routes no longer exist — frontend services updated to use `/api/business-manager/*`
- `Tenant` model now has a one-to-many relation to `Application`
- SuperAdmin users bypass all tenant checks
- The `'legacy'` tenant (backfill value) is explicitly allowed in `TenantGuard`

## Remaining Work (Phase 2+)

- Phase 2: Deployment modules (releases, deployments, gates) need tenant-scoped query updates
- Phase 4-9: Data Model, Features, Navigation, Runtime, Validation page implementations
- Add tenant-aware middleware for backward-compatible API redirects at the gateway level
