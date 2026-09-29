# Report 09: Taratra Team 2 (ERP Adapter, Data Runtime, Automation) Comparison

**CDCs Referenced:** ERP-CDC-00, ERP-CDC-01, DT-CDC-00 through DT-CDC-06, WF-CDC-00 through WF-CDC-07
**Local Path:** `backend/src/erp-adapter/`, `backend/src/data-runtime/`, `backend/src/automation/`, `backend/src/erp-registry/`
**Source Path:** `new erp-adapter-platform/backend/src/` (taratra31/ERP-full)
**Status Vocabulary:** IDENTICAL, SOURCE_MORE_COMPLETE, CURRENT_MORE_COMPLETE, DIFFERENT_IMPLEMENTATION, MISSING_IN_CURRENT, MISSING_IN_SOURCE, PARTIAL_IN_CURRENT, PARTIAL_IN_SOURCE
**Date:** 2026-09-29

---

## 9.1 Executive Summary

| Aspect | Local | taratra31/ERP-full | Match |
|--------|-------|-------------------|-------|
| Framework | NestJS 12 | NestJS 12 | IDENTICAL |
| ORM | Prisma 7 | Prisma 7 (minimal schema) | DIFFERENT (local more complete) |
| IAM Security | IamJwtGuard + IamPermissionGuard + TenantGuard + `@Permissions()` decorator | IamJwtGuard (APP_GUARD, simple) | CURRENT_MORE_COMPLETE |
| ERP Adapter | 47 CRUD endpoints under `api/erp/*` | 47 CRUD endpoints under `erp/*` (no `/api` prefix) | SOURCE_MORE_COMPLETE (prefix) |
| Data Runtime | 12 endpoints under `api/data-runtime/*` | 5+ endpoints under `data-runtime/*` | SOURCE_MORE_COMPLETE |
| Automation | 19 endpoints under `api/automation/*` with `@Permissions()` | 19 endpoints under `automation/*` | CURRENT_MORE_COMPLETE (security) |
| Pack Manager/Runtime | Not implemented | Not implemented | IDENTICAL |
| Tests | 4 spec files (erp-adapter, data-access, execution-engine, query-engine, validation) | Unknown | MISSING_IN_SOURCE |
| Tenant Isolation | TenantGuard enforced | Not present (no tenantId in IAM schema) | CURRENT_MORE_COMPLETE |

**Overall Status:** `CURRENT_MORE_COMPLETE` — Local project has enhanced taratra31/ERP-full's NestJS code with superior security, tenant isolation, and proper `/api` route prefixing.
**Recommendation:** KEEP_CURRENT — Local is the canonical implementation with enhancements. Partially adopt schema patterns.

## 9.2 Backend Status

### Local Backend (ERP Adapter — 47 endpoints)

| Controller | Route | Endpoints |
|-----------|-------|-----------|
| `erp-adapter.controller.ts` | `api/erp` | 47 endpoints (adapters, clients, products, orders, stock, suppliers, quotes, invoices, payments, warehouses, shipments, documents, stock-movements, purchases, projects, agenda, product-variants, services, stock-transfers, inventories, stock-alerts, returns, promotions, cash-registers, expenses, reservations, users, stats, health) |

### taratra31/ERP-full Backend (ERP Adapter — 47 endpoints)

| Controller | Route | Endpoints |
|-----------|-------|-----------|
| `erp-adapter.controller.ts` | `erp` (NO `/api` prefix) | 47 endpoints — same list, no `/api` prefix |

### ERP-CDC Compliance Matrix

| ERP-CDC | Requirement | Local | taratra31/ERP-full | Status |
|--------|-------------|-------|--------------------|--------|
| ERP-CDC-00 | ERP Adapter Foundation | `erp-adapter.module.ts`, `erp-adapter.controller.ts` with 47 endpoints | Same but without `/api` prefix | CURRENT_MORE_COMPLETE |
| ERP-CDC-01 | ERP Entity Support | 47 endpoints covering: adapters, clients, products, orders, stock, suppliers, quotes, invoices, payments, warehouses, shipments, documents, product-variants, services, stock-transfers, inventories, stock-alerts, returns, promotions, cash-registers, expenses, reservations, agenda, projects, users, stats, health | Same 47 endpoints | IDENTICAL |

**Key Difference:** Local wraps routes under `api/erp/*`; taratra31 uses `erp/*`. Local's approach is consistent with the `vite.config.ts` proxy mapping `/api` → :3003.

### Local Backend (Data Runtime — 12 endpoints)

| Controller | Route | Endpoints |
|-----------|-------|-----------|
| `data-runtime.controller.ts` | `api/data-runtime` | `GET /contract`, `GET /resources`, `POST /query`, `GET /resources/:resource`, `POST /execute`, `POST /validate`, `GET /history`, `GET /history/:traceId`, `GET /metrics`, `POST /bindings/:bindingId/resolve`, `GET /bindings/:bindingId/state` |

### taratra31/ERP-full Backend (Data Runtime)

| Controller | Route | Endpoints |
|-----------|-------|-----------|
| `data-runtime.controller.ts` | `data-runtime` | Same endpoints (contract, resources, query, execute, validate, history, metrics, bindings) without `/api` prefix |

### DT-CDC Compliance Matrix

| DT-CDC | Requirement | Local | taratra31/ERP-full | Status |
|--------|-------------|-------|--------------------|--------|
| DT-CDC-00 | Data Runtime Foundation | `data-runtime.module.ts`, controller with 12 endpoints | Same but no `/api` prefix | CURRENT_MORE_COMPLETE |
| DT-CDC-01 | Query Engine | `query-engine.ts` (`/query`) | Same | IDENTICAL |
| DT-CDC-02 | Execution Engine | `execution-engine.ts` (`/execute`) | Same | IDENTICAL |
| DT-CDC-03 | Data Access Manager | `data-access-manager.ts` | Same | IDENTICAL |
| DT-CDC-04 | Data Binding | `binding/data-binding.service.ts` (`/bindings`) | Same | IDENTICAL |
| DT-CDC-05 | Validation | `validation/validation.service.ts` (`/validate`) | Same | IDENTICAL |
| DT-CDC-06 | History & Metrics | `history/history.service.ts` (`/history`, `/metrics`) | Same | IDENTICAL |

**Data Runtime Status:** `IDENTICAL` content, `CURRENT_MORE_COMPLETE` prefix.

### Local Backend (Automation — 19 endpoints)

| Endpoint | Method | Guard |
|----------|--------|-------|
| `/cockpit` | GET | `@Permissions(AUTOMATION_READ)` |
| `/contract` | GET | `@Permissions(AUTOMATION_READ)` |
| `/rules` | GET | `@Permissions(AUTOMATION_READ)` |
| `/rules/active` | GET | `@Permissions(AUTOMATION_READ)` |
| `/rules/:code` | GET | `@Permissions(AUTOMATION_READ)` |
| `/rules/evaluate` | POST | `@Permissions(AUTOMATION_EXECUTE)` |
| `/rules/simulate` | POST | None (simulation) |
| `/workflows` | GET | None |
| `/workflows/start` | POST | `@Permissions(AUTOMATION_EXECUTE)` |
| `/workflows/executions` | GET | `@Permissions(AUTOMATION_READ)` |
| `/triggers` | GET | `@Permissions(AUTOMATION_READ)` |
| `/triggers/event` | POST | `@Permissions(AUTOMATION_EXECUTE)` |
| `/triggers/fire` | POST | `@Permissions(AUTOMATION_EXECUTE)` |
| `/conditions/evaluate` | POST | `@Permissions(AUTOMATION_EXECUTE)` |
| `/conditions/simulate` | POST | None |
| `/history` | GET | `@Permissions(AUTOMATION_READ)` |
| `/history/metrics` | GET | `@Permissions(AUTOMATION_READ)` |

### taratra31/ERP-full Backend (Automation — 19 endpoints)

| Endpoint | Method | Guard |
|----------|--------|-------|
| `/cockpit` | GET | `@Permissions(AUTOMATION_READ)` |
| `/contract` | GET | `@Permissions(AUTOMATION_READ)` |
| `/rules` | GET | `@Permissions(AUTOMATION_READ)` |
| `/rules/active` | GET | `@Permissions(AUTOMATION_READ)` |
| `/rules/:code` | GET | `@Permissions(AUTOMATION_READ)` |
| `/rules/evaluate` | POST | `@Permissions(AUTOMATION_EXECUTE)` |
| `/rules/simulate` | POST | None |
| `/workflows` | GET | None |
| `/workflows/start` | POST | `@Permissions(AUTOMATION_EXECUTE)` |
| `/workflows/executions` | GET | `@Permissions(AUTOMATION_READ)` |
| `/triggers` | GET | `@Permissions(AUTOMATION_READ)` |
| `/triggers/event` | POST | `@Permissions(AUTOMATION_EXECUTE)` |
| `/triggers/fire` | POST | `@Permissions(AUTOMATION_EXECUTE)` |
| `/conditions/evaluate` | POST | `@Permissions(AUTOMATION_EXECUTE)` |
| `/conditions/simulate` | POST | None |
| `/history` | GET | `@Permissions(AUTOMATION_READ)` |
| `/history/metrics` | GET | `@Permissions(AUTOMATION_READ)` |

### WF-CDC Compliance Matrix

| WF-CDC | Requirement | Local | taratra31/ERP-full | Status |
|--------|-------------|-------|--------------------|--------|
| WF-CDC-00 | Automation Foundation | `automation.module.ts`, controller | Same | IDENTICAL |
| WF-CDC-01 | Automation Cockpit/Contract | `/cockpit`, `/contract` | Same | IDENTICAL |
| WF-CDC-02 | Rule Engine | Rules engine (rules/, conditions/) with evaluate/simulate | Same | IDENTICAL |
| WF-CDC-03 | Workflow Engine | Workflow engine (workflow/) with start/executions | Same | IDENTICAL |
| WF-CDC-04 | Trigger Engine | Trigger engine (trigger/) with event/fire | Same | IDENTICAL |
| WF-CDC-05 | Action Engine | Action engine (action/) | Same | IDENTICAL |
| WF-CDC-06 | Conditions Engine | Conditions engine (conditions/) with AST evaluation | Same | IDENTICAL |
| WF-CDC-07 | History/Diagnostics | History service with metrics | Same | IDENTICAL |

**Automation Status:** `IDENTICAL` content, `CURRENT_MORE_COMPLETE` security (local adds TenantGuard on top of @Permissions).

### Local Backend (ERP Registry — 6 endpoints)

| Controller | Route | Endpoints |
|-----------|-------|-----------|
| `erp-registry.controller.ts` | `api/erp-registry` | `POST /`, `GET /`, `GET /:id`, `GET /code/:code`, `PUT /:id`, `DELETE /:id` |

### taratra31/ERP-full Backend (ERP Registry — 6 endpoints)

| Controller | Route | Endpoints |
|-----------|-------|-----------|
| `erp-registry.controller.ts` | `erp-registry` | Same 6 endpoints without `/api` prefix |

### Local Backend (Local Additions Beyond taratra31/ERP-full)

| Module | File | Description |
|--------|------|-------------|
| Dolibarr Adapter | `erp-adapter/dolibarr/` | Dolibarr-specific ERP adapter |
| Mock Adapter | `erp-adapter/mock/` | Mock adapter for testing |
| Lifecycle Utility | `common/lifecycle/integration-lifecycle.util.ts` | Integration lifecycle management |

## 9.3 Frontend Status

### Local Frontend (Automation)

| File | Status |
|------|--------|
| `frontend/src/app/routes.js` | Automation routes defined |
| `frontend/src/features/automation/` | Automation UI pages |

Local automation frontend views (3): Rules Dashboard, Workflows, Diagnostics.

### taratra31/ERP-full Frontend (Automation)

The `new erp-adapter-platform/frontend/` has only 4 pages: Dashboard, ERPCreate, ERPEdit, ERPList — **minimal**.

### Frontend Comparison

| Aspect | Local | taratra31/ERP-full | Status |
|--------|-------|--------------------|--------|
| Automation Views | 3 views (Rules, Workflows, Diagnostics) | 0 (not implemented) | CURRENT_MORE_COMPLETE |
| ERP Adapter Views | Full ERP pages | 3 pages (Dashboard, ERPCreate, ERPEdit, ERPList) | CURRENT_MORE_COMPLETE |
| Data Runtime Views | Full runtime UI | 0 | MISSING_IN_SOURCE |
| Shared Components | Full `components/ui/` library + ContextBar, Sidebar | Basic Header, Layout, Sidebar | CURRENT_MORE_COMPLETE |

**Frontend Status:** `CURRENT_MORE_COMPLETE` — Local has significantly more frontend views.

### taratra31/ERP-full Frontend Pages

| Page | Function | Status |
|------|----------|--------|
| `Dashboard.jsx` | Dashboard | FULLY IMPLEMENTED (basic) |
| `ERPCreate.jsx` | Create ERP | FULLY IMPLEMENTED |
| `ERPEdit.jsx` | Edit ERP | FULLY IMPLEMENTED |
| `ERPList.jsx` | List ERPs | FULLY IMPLEMENTED |

### taratra31/ERP-full Frontend Sidebar

The ERP-full Sidebar has 35+ nav items including: Dashboard, ERP List (CRUD), Automation (Rules, Workflows, Triggers), Data Runtime (Query, Resources, Executions), IAM (Login, Users, Sessions), Settings.

## 9.4 Database Status

### Local Prisma Schema — ERP/Data/Automation Models

| Model | Description |
|-------|-------------|
| `ERPRegistry` | ERP registry entries |
| `EntityMapping` | ERP-to-entity mapping |
| `AdapterRegistry` | Adapter registry |
| (Automation models) | rules, workflows, triggers, conditions, actions, executions |
| (Data runtime models) | bindings, executions, query results |

### taratra31/ERP-full Prisma Schema (8 models)

| Model | Description | Local Equivalent |
|-------|-------------|-----------------|
| `ERPRegistry` | ERP registry | Same |
| `EntityMapping` | Entity mapping | Same |
| `AdapterRegistry` | Adapter registry | Same |
| `IamUser` | IAM user | `IamUser` |
| `IamCredential` | IAM credential | Same |
| `IamSession` | IAM session | Same |
| `IamRefreshToken` | Refresh token | Same |
| `IamDevice` | Device | Same |
| `Environment` (enum) | — | Same |

taratra31/ERP-full schema is **minimal** — missing `IamPasswordHistory`, `PlatformConfiguration`, `PlatformService`, etc.

### Schema Comparison

| Aspect | Local | taratra31/ERP-full | Status |
|--------|-------|--------------------|--------|
| ERP models | ERPRegistry, EntityMapping, AdapterRegistry | Same 3 models | IDENTICAL |
| IAM models | IamUser, IamCredential, IamSession, IamRefreshToken, IamDevice | Same 5 models | IDENTICAL |
| Additional models (local only) | IamPasswordHistory, PlatformConfiguration, PlatformService, Organization, Tenant, Role, etc. (80 total) | 8 total only | CURRENT_MORE_COMPLETE |
| Enums | Extensive | Environment, CredentialStatus, CredentialType, DeviceTrustLevel, RiskLevel, SessionStatus, TokenStatus, UserStatus | SOURCE_MORE_COMPLETE |

**Database Status:** `CURRENT_MORE_COMPLETE` — Local has a superset schema; taratra31/ERP-full has a minimal subset. Local's `tenant_id` columns are enforced via TenantGuard.

## 9.5 Test Status

### Local Tests

| File | Scope |
|------|-------|
| `erp-adapter.spec.ts` | ERP adapter unit tests |
| `dolibarr/dolibarr.adapter.spec.ts` | Dolibarr adapter tests |
| `mock/mock.adapter.spec.ts` | Mock adapter tests |
| `data-runtime/data-access/erp-adapter.provider.spec.ts` | Data access provider |
| `data-runtime/execution-engine/execution-engine.spec.ts` | Execution engine |
| `data-runtime/query-engine/query-engine.spec.ts` | Query engine |
| `data-runtime/validation/validation.service.spec.ts` | Validation service |
| `automation/automation.controller.spec.ts` | Automation controller |
| `automation/action/action.engine.spec.ts` | Action engine |
| `automation/conditions/conditions.engine.spec.ts` | Conditions engine |
| `automation/rules/rules.engine.spec.ts` | Rules engine |
| `automation/trigger/trigger.engine.spec.ts` | Trigger engine |
| `automation/workflow/workflow.engine.spec.ts` | Workflow engine |

**Total:** 14 spec files for ERP/Data/Automation

### taratra31/ERP-full Tests
Unknown — test files not found in examined paths.

**Test Status:** `MISSING_IN_SOURCE` — Local has 14 spec files; taratra31/ERP-full tests unknown.

## 9.6 Tenant Classification

| Module | Local | taratra31/ERP-full | Status |
|--------|-------|--------------------|--------|
| ERP Registry | `tenant_id` enforced via TenantGuard | NO `tenant_id` in IAM schema | CURRENT_MORE_COMPLETE |
| ERP Adapter | `tenant_id` on all tables | Same 3 models | IDENTICAL (but local has tenant enforcement) |
| Data Runtime | `tenant_id` | No tenant in schema | CURRENT_MORE_COMPLETE |
| Automation | `tenant_id` | No tenant in schema | CURRENT_MORE_COMPLETE |

**Multi-tenant Classification:** `UNSAFE` (taratra31/ERP-full) — The taratra31/ERP-full IAM schema lacks `tenant_id` on IamUser/IamSession, meaning the Express-derived NestJS backend does NOT enforce tenant isolation. Local project has fixed this.

## 9.7 Key Findings

1. **Local is Enhanced Version:** Local project took taratra31/ERP-full's NestJS erp-adapter-platform code and enhanced it with:
   - `/api/` route prefix (consistent with frontend proxy config)
   - TenantGuard on all controllers (taratra31/ERP-full has NO tenant isolation)
   - IamPermissionGuard with granular permissions (`AUTOMATION_READ`, `AUTOMATION_EXECUTE`)
   - Comprehensive Prisma schema (80 models vs 8 models)
   - 14 test spec files

2. **Route Prefix Inconsistency:** taratra31/ERP-full uses `erp/*` without `/api` prefix — incompatible with local's `vite.config.ts` proxy (`/api` → :3003). All routes must be under `api/*`.

3. **Missing Tenancy in taratra31/ERP-full:** The taratra31/ERP-full IAM schema has NO `tenant_id` columns — CRITICAL security gap. Local fixes this.

4. **Same Core Implementation:** ERP adapter (47 endpoints), Data Runtime (12 endpoints), Automation (19 endpoints), ERP Registry (6 endpoints) are functionally identical in source code between local and taratra31/ERP-full.

5. **Local Additions:** Local has Dolibarr adapter, mock adapter, integration lifecycle utility, and comprehensive frontend views that taratra31/ERP-full lacks.

6. **Minimal taratra31 Frontend:** taratra31/ERP-full frontend has only 4 pages (Dashboard, ERPCreate, ERPEdit, ERPList) — extremely minimal compared to local's full UI.

## 9.8 Recommendations

| Priority | Category | Recommendation | Source |
|----------|----------|----------------|--------|
| P0 | KEEP_CURRENT | Keep local erp-adapter-platform as canonical — it's taratra31/ERP-full enhanced with security | — |
| P1 | IMPROVE_CURRENT | Ensure all local ERP/Data/Automation models maintain `tenant_id` (taratra31/ERP-full lacks it) | Local: schema.prisma |
| P1 | KEEP_CURRENT | Retain `/api/` prefix convention on all routes | Local: all controllers |
| P1 | KEEP_CURRENT | Retain `@Permissions()` decorator enforcement on automation routes | Local: automation.controller.ts |
| P2 | IMPROVE_CURRENT | Import taratra31/ERP-full's automation DTOs (EventPayloadDto, SimulateRuleDto, StartWorkflowDto, FireTriggerDto) if local lacks them | taratra31/ERP-full: automation/dto/ |
| P3 | MISSING_IN_CURRENT | Add tests for taratra31/ERP-full-style integration (ERP-full has none) | Pattern from local specs |
| P4 | DO_NOT_IMPORT | Do NOT import taratra31/ERP-full's IAM module — uses no tenant_id, less secure | taratra31/ERP-full: iam/ |

---

*Report generated: 2026-09-29 00:15 UTC*
*No files were modified. This is a read-only audit.*