# Techzone Cloud — Finalization Plan

> **Purpose:** Actionable roadmap to finalize the Techzone Cloud master audit and move to implementation.
> **Date:** 2026-09-28
> **Depends on:** TECHZONE_CLOUD_MASTER_AUDIT.md

## 1. Immediate Priority — Security (P0)

### 1.1 Fix IamAdminGuard Deny-By-Default (BLOCKER)

**File:** `backend/src/iam/iam-admin-guard.ts:16-18`

**Current (vulnerable):**
```typescript
if (!requiredPermissions || requiredPermissions.length === 0) {
  return true;  // ← P0: grants access to ALL authenticated users
}
```

**Fix (deny by default):**
```typescript
if (!requiredPermissions || requiredPermissions.length === 0) {
  throw new ForbiddenException({
    success: false,
    message: 'Aucune permission exigée déclarée sur cette route — accès refusé par défaut',
    statusCode: 403,
  });
}
```

**Blast radius (all exposed routes to any authenticated user):**

| Controller | Prefix | Routes Exposed | @Permissions? |
|---|---|---|---|
| `IamUsersController` | `/api/iam/users` | 6 | No |
| `IamTenantsController` | `/api/iam/admin/tenants` | 9 | No |
| `IamBillingController` | `/api/iam/billing` | 26 | No |
| `IamSessionsController` | `/api/iam/sessions` | 2 | No |
| `IamIdentitiesController` | `/api/iam/identities` | 4 | No |
| `IamPoliciesController` | `/api/iam/policies` | 4 | No |
| `IamGovernanceController` | `/api/iam/admin/governance/roles` | 11 | No |
| `IamObservabilityController` | `/api/iam` | 9 (method-level) | No |
| `IamAdminUsersController` | `/api/iam/admin/users` | 1 | No |
| `IamConfigController` | `/api/iam/config` | 4 (method-level) | No |

**Total: ~72 routes exposed.** After fixing the guard, these controllers will need `@Permissions()` decorators added to each route (or use role-based `@Roles()` decorator). **Do NOT fix the guard without adding permissions** — otherwise all IAM admin routes become inaccessible.

**Suggested permissions to add:**
- All `iam:*` admin routes → `@Permissions(IAM_ADMIN)` 
- Billing routes → `@Permissions(IAM_ADMIN)` (or introduce `billing:manage`)

### 1.2 Add test for the guard fix

Add to `iam-permission.guard.spec.ts` or a new `iam-admin-guard.spec.ts`:
- Test that routes without `@Permissions()` are denied (expect 403)
- Test that routes with `@Permissions(IAM_ADMIN)` pass for admin role

## 2. High Priority — Tenant Isolation

### 2.1 Fix nullable tenantId

**File:** `backend/prisma/schema.prisma`

Change `tenantId String?` → `tenantId String` (non-null) on all platform models. Then add a migration.

### 2.2 Enforce tenant scoping in services

**Files:** All platform services (`applications.service.ts`, `application-versions.service.ts`, `contract.service.ts`, `configuration.service.ts`, `snapshot.service.ts`, `environment-deployment.service.ts`)

Add `WHERE tenantId = :currentTenantId` to every Prisma query. The `ApplicationsController` already passes `principal.tenantId` — verify all services consume it consistently.

### 2.3 Remove broken duplicate

**File:** `backend/src/platform/configuration/configuration.controller.ts` (2026-09-21)

Delete this directory — it references a non-existent `./configuration.service`. The real module is at `backend/src/modules/platform/configuration/`.

## 3. Medium Priority — Route Prefix Reconciliation

### 3.1 Reconcile stale documentation

The existing audit docs in `docs/business-manager/` reference `/api/platform/*` paths. Update:
- `docs/business-manager/BM_CDC_IMPLEMENTATION_MATRIX.md` — line 30, 47, 247-262: change `/api/platform/*` → `/api/business-manager/*`
- `docs/business-manager/BM_API_ROUTE_MATRIX.md` — update all platform paths
- Cross-reference with `GLOBAL_API_MATRIX.md` (this audit)

### 3.2 Reconcile the `Feature` model

`docs/business-manager/BM_CDC_IMPLEMENTATION_MATRIX.md` line 81 references `schema.prisma:2544` — but the current schema's Feature model is at a different location. Verify and update references.

## 4. Medium Priority — Frontend Test Infrastructure

### 4.1 Add service tests

Create tests for:
- `platformApplicationsService.js`
- `platformConfigService.js`
- `authService.js`
- `erpService.js`

### 4.2 Add Redux slice tests

Test auth slice (token refresh, logout) and navigation slices.

### 4.3 Add E2E testing

Introduce Playwright or Cypress for critical journeys:
1. Login → dashboard render
2. Application CRUD flow
3. Deployment publication flow

## 5. Low Priority — Structural Cleanup

| Task | File(s) | Effort |
|---|---|---|
| Move root-level modules to `modules/` | `erp-adapter/`, `erp-registry/`, `data-runtime/`, `automation/`, `config/` → `modules/` | Medium |
| Remove dead `features/erp-account/` | Verify non-routed, then delete | Low |
| Remove/gate `features/iam-demo/` | Verify not in production build | Low |
| Consolidate `RollbackController` + `CockpitController` | Move to proper prefix pattern | Low |
| Add `Feature` CRUD for BM-CDC-04 | New module: `modules/platform/features/` | Medium |

## 6. Missing Features (CDC Gaps)

| CDC | Missing Feature | Implementation Effort |
|---|---|---|
| BM-CDC-03 | Data Model Manager (model, CRUD, diff, migration plan) | High |
| BM-CDC-04 | Feature & Capability Manager (CRUD, Capability model) | High |
| BM-CDC-07 | Runtime Bridge: contributors, manifest, resolver, readiness, immutable snapshot, binding, cache, SSRF, events | Very High |
| BM-CDC-08 | Quality Engine (validator registry, orchestrator, gate, campaigns, waivers, approvals) | Very High |
| BM-CDC-07 | Manifest Viewer UI, Binding Wizard UI | Medium |
| BM-CDC-08 | Quality cockpit UI (beyond stub) | Medium |

## 7. Recommended Sequencing

```
Phase 1 (Week 1-2): Security P0 fix + tests
  → Fix IamAdminGuard deny-by-default
  → Add @Permissions() to all IAM admin routes
  → Add guard spec tests
  → Remove broken duplicate config module

Phase 2 (Week 2-3): Tenant isolation hardening
  → Make tenantId non-nullable in schema
  → Enforce tenant WHERE clauses in all services
  → Add TenantGuard test coverage

Phase 3 (Week 3-4): Documentation reconciliation + test infrastructure
  → Update stale docs (platform → business-manager paths)
  → Add frontend service/slice tests
  → Add E2E test scaffold

Phase 4 (Week 4+): Missing features (CDC-03/04/08 + Runtime Bridge)
  → Data Model Manager
  → Feature & Capability Manager
  → Quality Engine
  → Runtime Bridge (manifest, resolver, readiness, binding)
```

## 8. Verification Commands

```bash
# Backend
cd backend && npx nest build          # Must compile clean
cd backend && npx oxlint             # Warnings only
cd backend && npm test                # 29 spec files must pass
cd backend && npx prisma validate     # Schema validation

# Frontend
cd frontend && npx vite build         # Must build clean
cd frontend && npx oxlint             # Warnings only
cd frontend && npm test               # 8 spec files must pass

# Security verification
grep -rn "@UseGuards(IamAdminGuard)" backend/src | grep -v "@Permissions"
# Should return 0 results after Phase 1
```
