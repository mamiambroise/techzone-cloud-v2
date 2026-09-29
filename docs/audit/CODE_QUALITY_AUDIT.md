# Techzone Cloud — Code Quality Audit

> **Purpose:** Audit of code quality, test coverage, architecture compliance, and technical debt.
> **Date:** 2026-09-28

## 1. Build & Lint

| Component | Command | Result | Notes |
|---|---|---|---|
| Backend build | `cd backend && npx nest build` | Should compile to `dist/` | TypeScript 6; check for errors |
| Frontend build | `cd frontend && npx vite build` | Should build to `dist/` | Vite 6.2 |
| Backend lint | `cd backend && npx oxlint` | Warnings only | Oxlint (Rust-based, fast) |
| Frontend lint | `cd frontend && npx oxlint` | Warnings only | |
| Backend typecheck | `cd backend && npx tsc --noEmit` | — | Recommended; AGENTS.md uses `npx nest build` |
| Frontend typecheck | `cd frontend && npx tsc --noEmit` or `npx vite build` | — | Vite build includes type checking |

## 2. Test Coverage

### Backend (Jest) — 29 spec files

| Tier | Modules | Spec Count | Verdict |
|---|---|---|---|
| **High** — Automation | `rules`, `conditions`, `trigger`, `action`, `workflow`, `automation.controller` | 6 | Comprehensive engine tests |
| **High** — Integration | `api-manager`, `credentials`, `synchronization`, `diagnostics`, `webhook-signature`, `integration-provider.contract`, `integration-contract` | 7 | Good coverage of integration layer |
| **High** — Deployment | `release`, `deployment`, `gate`, `rollback`, `environment-deployment`, `cockpit` | 6 | Good coverage |
| **High** — Data Runtime | `query-engine`, `execution-engine`, `validation`, `erp-adapter.provider` | 4 | Good coverage |
| **High** — ERP Adapter | `dolibarr.adapter`, `mock.adapter`, `erp-adapter.service` | 3 | Good coverage |
| **Medium** — IAM | `iam-jwt.guard`, `iam-permission.guard`, `iam.service`, `iam-auth.controller`, `iam-client` | 5 | Guards and auth tested |
| **Low** — Platform | `applications.service`, `application-versions.service`, `contract.service` | 3 | Service-level only; **NO controller tests**, **NO configuration/snapshot/environment tests** |

**Backend test gaps (critical):**
- Zero tests for `ConfigurationController`, `ConfigurationService`
- Zero tests for `SnapshotController`, `SnapshotService`
- Zero tests for `EnvironmentController`
- Zero tests for `ApplicationsController`, `ContractController` (service only)
- Zero tests for `ErpRegistryController`
- Zero tests for `DeploymentDiagnosticsController`, `CockpitController`, `RollbackController`
- Zero tests for tenant scoping enforcement

### Frontend (Vitest) — 8 test files

| File | Component | Coverage |
|---|---|---|
| `navigationConfig.test.js` | Navigation config | Unit tests for route resolution |
| `ContextBar.test.jsx` | ContextBar | Component render test |
| `businessManager.test.jsx` | BusinessManager | Component test |
| `Card.test.jsx` | Card | Component test |
| `PageHeader.test.jsx` | PageHeader | Component test |
| `configuration-navigation.test.jsx` | Config navigation | Navigation test |
| `refresh.test.js` | Token refresh | Auth refresh logic |
| `session-navigation.test.jsx` | Session nav | Navigation test |

**Frontend test gaps (critical):**
- Zero tests for API services (`platformApplicationsService`, `platformConfigService`, `authService`, etc.)
- Zero tests for Redux slices
- Zero tests for pages/views (`ApplicationsView`, `ConfigurationView`, `ContractsView`, etc.)
- Zero tests for ERP adapter services
- Test coverage is entirely UI-component-level; no integration or E2E tests
- The existing `docs/business-manager/BM_CDC_IMPLEMENTATION_MATRIX.md` claims "Zero `*.test.*` files in `frontend/src/`" — this is **stale/incorrect**. 8 test files exist.

## 3. Architecture Compliance

### Express Usage — VERIFIED COMPLIANT

- **No standalone Express application.** Zero occurrences of `express()`, `require('express')`, `Router()`, `app.listen()` outside NestJS.
- All `express` references in `backend/src/` are type-only imports (`import type { Request, Response, NextFunction } from 'express'`) or NestJS-internal (`@nestjs/platform-express`).
- Framework is NestJS 12 with Express 5 as the underlying platform (via `@nestjs/platform-express`), as documented in `main.ts`.
- **Verification command:** `grep -rn "express()" backend/src/` → 0 matches; `grep -rn "require('express')" backend/src/` → 0 matches.

### NestJS Module Structure

| Module | Imported in AppModule? | Notes |
|---|---|---|
| `ConfigModule` | Yes (isGlobal) | |
| `PrismaModule` | Yes | |
| `MailModule` | Yes | |
| `IamModule` | Yes | |
| `PlatformModule` | Yes | |
| `IntegrationModule` | Yes | |
| `DeploymentModule` | Yes | |
| `ErpAdapterModule` | Yes | |
| `DataRuntimeModule` | Yes | |
| `AutomationModule` | Yes | |
| `ErpRegistryModule` | Yes | |
| Global guards | No | `app.module.ts` does NOT register `APP_GUARD` for `IamAdminGuard` or `TenantGuard`. Guards are applied per-controller via `@UseGuards()`. |

### Controller Guard Patterns

| Guard Applied | @Permissions Used? | Controllers | Risk |
|---|---|---|---|
| `TenantGuard` | N/A (resource-based) | `ApplicationsController` (via `@TenantResource`) | Medium — tenantId nullable, manual principal injection |
| `IamAdminGuard` | No | `IamUsersController`, `IamTenantsController`, `IamSessionsController`, `IamIdentitiesController`, `IamPoliciesController`, `IamGovernanceController`, `IamBillingController`, `IamAdminUsersController`, `IamObservabilityController` (methods) | **CRITICAL** — all exposed to any authenticated user |
| `IamAdminGuard` | Yes | `ErpAdapterController` (all 42 routes) | Safe — permissions checked |

## 4. Technical Debt

| Issue | Location | Severity | Notes |
|---|---|---|---|
| Duplicate configuration module | `src/platform/configuration/` vs `src/modules/platform/configuration/` | HIGH | Old controller-only dir (2026-09-21) references non-existent `./configuration.service`. **BROKEN.** Root controller only, 1 method. |
| Inconsistent root-level controllers | `RollbackController`, `CockpitController` use `@Controller()` with full path in `@Get('api/...')` | MEDIUM | Inconsistent with all other controllers which use prefix in `@Controller()` |
| Nullable tenantId | All platform models in `schema.prisma` | HIGH | `tenantId String?` — nullable means queries without WHERE clause return cross-tenant data |
| No global guard registration | `app.module.ts` | MEDIUM | Each controller must manually add `@UseGuards()` — easy to miss |
| Frontend: `features/iam-demo/` | 212+ files (DEV_ONLY) | MEDIUM | Mock services, mock data, DemoPage. Must verify if still routed; potential secret/PII exposure in mocks |
| Frontend: `features/erp-account/` | Non-routed | LOW | Dead code — verify removal |
| Backend: `AppController` + `ConfigController` at root | `app.controller.ts`, `config.controller.ts` | LOW | Not under `modules/` — architectural inconsistency |

## 5. Code Smells

| Smell | Location | Count |
|---|---|---|
| `@Controller()` with no prefix (full paths in decorators) | `RollbackController`, `CockpitController` | 2 |
| Controller in wrong directory (non-`modules/` hierarchy) | `erp-adapter/`, `erp-registry/`, `data-runtime/`, `automation/`, `config/` | ~6 modules at `src/` root instead of `src/modules/` |
| Mixed French/English in API operation descriptions | `@ApiOperation({ summary: 'Lister les utilisateurs IAM (admin)' })` (French) vs others English | Widespread in IAM controllers |
| Bare `@Controller()` on AppController | `app.controller.ts:6` | 1 |

## 6. Security Posture

| Control | Status | Notes |
|---|---|---|
| Helmet | IMPLEMENTED | In `main.ts` |
| Cookie parser | IMPLEMENTED | In `main.ts` |
| CORS config | IMPLEMENTED | `CORS_ORIGIN` env var, not wildcard |
| Rate limiting | IMPLEMENTED_PARTIAL | Mentioned; verify config in `main.ts` |
| JWT HttpOnly cookies | IMPLEMENTED | Access + refresh tokens |
| CSRF protection | PARTIAL | SameSite=Lax (should be Strict); no CSRF token library |
| Secret scanning | — | Verify no secrets in tracked files |
| **Admin authorization** | **BROKEN (P0)** | See P0 vulnerability |
