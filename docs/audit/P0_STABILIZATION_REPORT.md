# P0 Stabilization Report

**Date**: 2026-09-28
**Phase**: P0 — Security Hardening & Stabilization
**Status**: Complete

---

## Summary

This report documents the P0 stabilization work performed on the Techzone Cloud backend. Three critical security vulnerabilities were identified and fixed:

| ID | Vulnerability | Severity | Status |
|---|---|---|---|
| P0-01 | `IamAdminGuard` security bypass via `adminPerms` check | P0 | **Fixed** |
| P0-02 | `contract.service.ts` `getHistory` missing tenant scoping | P0 | **Fixed** |
| P0-03 | `iam-health.controller.ts` fake `/ready` endpoint | P0 | **Fixed** |

---

## P0-01: IamAdminGuard Security Bypass

### Issue
`IamAdminGuard` (used on all IAM admin routes) had a logic flaw that granted admin access to non-admin users. The guard checked:

1. ADMIN role → allow (correct)
2. Role permissions match required → allow (correct)
3. User's explicit permissions match required → allow (correct)
4. **`adminPerms.some(p => requiredPermissions.includes(p))` → allow** (VULNERABLE)

The `adminPerms` variable was computed from `ROLE_PERMISSIONS[ROLES.ADMIN]`, which includes ALL permissions including `IAM_ADMIN`. Since the IAM admin routes require `IAM_ADMIN` permission, step 4 would always return `true` for ANY authenticated user — even those with only `ROLES.USER` or no permissions at all.

### Root Cause
**File**: `backend/src/iam/iam-admin-guard.ts` (lines 39, 55-57)

The `adminPerms` check was intended as a fallback for super-admins, but the ADMIN role is already handled explicitly at the first check in the loop. The `adminPerms` check was both redundant for true admins and a critical vulnerability for non-admins.

### Fix
Removed the `adminPerms` variable and the associated conditional check. ADMIN role access is already handled by the `role === ROLES.ADMIN` check earlier in the guard.

### Test Coverage
- `backend/src/iam/iam-admin-guard.spec.ts` — 11 tests covering:
  - Deny-by-default when no `@Permissions()` declared
  - Grants access to user with `IAM_ADMIN` permission
  - Grants access for super-admin with ADMIN role
  - Denies USER role without IAM_ADMIN
  - Denies anonymous requests
  - Metadata key isolation (reads `PERMISSIONS_KEY`, not `IAM_PERMISSIONS_KEY`)
  - Role permission mapping verification

- `backend/src/iam/iam-admin-isolation.spec.ts` — 10 cross-tenant isolation tests

### Verification
```
Test Suites: 2 passed, 2 total
Tests:       21 passed, 21 total
```

---

## P0-02: Contract History Tenant Isolation Gap

### Issue
`ContractsService.getHistory()` verified that the contract belongs to the tenant (via `findOne(id, tenantId)`), but then fetched the `contractHistory` records without including the `tenantId` filter in the Prisma query. While the initial `findOne` check prevented cross-tenant access to non-existent contracts, the absence of a `tenantId` filter on the history query was a defense-in-depth gap.

### Fix
**File**: `backend/src/modules/platform/contracts/contract.service.ts` (line 369)

Added `tenantId: tenantId ?? undefined` to the `contractHistory.findMany()` WHERE clause.

### Test Updated
Updated `contract.service.spec.ts` to verify the `tenantId` filter is present in the query.

---

## P0-03: Fake Readiness Endpoint

### Issue
1. `IamHealthController.getReady()` returned `{ status: 'ready' }` without checking PostgreSQL connectivity — it always passed regardless of database availability.
2. No root-level `/ready` endpoint existed for infrastructure load balancers / orchestrators.

### Fix
1. **`backend/src/iam/iam-health.controller.ts`**: Added PostgreSQL `$queryRaw` check to the `/ready` endpoint, returning `{ status: 'not_ready' }` on failure.
2. **`backend/src/app.controller.ts`**: Added `@Get('ready')` route.
3. **`backend/src/app.service.ts`**: Added `getReady()` method that checks PostgreSQL connectivity via `$queryRaw` and throws `ServiceUnavailableException` on failure.

### Health Endpoint Summary

| Endpoint | Route | DB Check | Auth |
|---|---|---|---|
| Health | `GET /health` | No | Public |
| Readiness | `GET /ready` | Yes (`$queryRaw SELECT 1`) | Public |
| IAM Health | `GET /api/iam/health` | Yes (`$queryRaw SELECT 1`) | Public |
| IAM Ready | `GET /api/iam/health/ready` | Yes (`$queryRaw SELECT 1`) | Public |

---

## IAM Admin Route Protection Matrix

All IAM admin routes are now protected by `@Permissions(IAM_ADMIN)` (`iam:admin`):

| Controller | Routes | Protection |
|---|---|---|
| `IamUsersController` | 8 routes | `@Permissions(IAM_ADMIN)` at class level |
| `IamTenantsController` | 5 routes | `@Permissions(IAM_ADMIN)` at class level |
| `IamSessionsController` | 4 routes | `@Permissions(IAM_ADMIN)` at class level |
| `IamPoliciesController` | 5 routes | `@Permissions(IAM_ADMIN)` at class level |
| `IamBillingController` | 3 routes | `@Permissions(IAM_ADMIN)` at class level |
| `IamIdentitiesController` | 5 routes | `@Permissions(IAM_ADMIN)` at class level |
| `IamGovernanceController` | 3 routes | `@Permissions(IAM_ADMIN)` at class level |
| `IamAdminUsersController` | 3 routes | `@Permissions(IAM_ADMIN)` at class level |
| `IamObservabilityController` | 4 admin routes | `@Permissions(IAM_ADMIN)` at method level |
| `IamConfigController` | 4 routes | `@Permissions(IAM_ADMIN)` at method level |
| `IamHealthController` | 2 routes | Public (health checks) |

**Total protected routes**: 49 admin routes + 2 public health routes = 51 IAM routes

Full route-level detail in `docs/security/IAM_ADMIN_PERMISSION_MATRIX.md`.

---

## Known Issues / Blocked Items

### PostgreSQL Unavailable (Blocked)
- No running PostgreSQL instance available for live database integration testing
- Cross-tenant DB-level verification cannot be performed against real data
- **Mitigation**: All cross-tenant tests use mocked Prisma to verify query filters are applied correctly

### Duplicate Configuration Controller (P0-03 Residual)
- `backend/src/platform/configuration/configuration.controller.ts` is a broken duplicate
- This file was identified in the audit but NOT removed — it references a non-existent `./configuration.service`
- **Status**: Documented as DUPLICATE/BROKEN; requires explicit removal instruction

---

## Build & Test Results

```
npx nest build          ✅ Passed (no errors)
npx oxlint             ✅ Passed (no warnings on modified files)
jest (iam-admin tests) ✅ 21/21 tests passed
```

---

## Files Modified

| File | Change |
|---|---|
| `backend/src/iam/iam-admin-guard.ts` | Removed vulnerable `adminPerms` check; fixed role permission flattening |
| `backend/src/modules/platform/contracts/contract.service.ts` | Added `tenantId` filter to `getHistory` |
| `backend/src/iam/iam-health.controller.ts` | Fixed fake `/ready` endpoint with real DB check |
| `backend/src/app.controller.ts` | Added `/ready` route |
| `backend/src/app.service.ts` | Added `getReady()` with DB connectivity check |
| `backend/src/modules/platform/contracts/contract.service.spec.ts` | Updated to verify `tenantId` in history query |

## Files Created

| File | Purpose |
|---|---|
| `backend/src/iam/iam-admin-guard.spec.ts` | Unit tests for IamAdminGuard (11 tests) |
| `backend/src/iam/iam-admin-isolation.spec.ts` | Cross-tenant isolation tests (10 tests) |
| `docs/security/IAM_ADMIN_PERMISSION_MATRIX.md` | Full IAM admin permission matrix |
| `docs/audit/P0_STABILIZATION_REPORT.md` | This report |

---

## Next Steps (Beyond P0)

1. Remove broken duplicate `backend/src/platform/configuration/configuration.controller.ts`
2. Enforce non-null `tenantId` constraint in Prisma schema for all platform models
3. Add tenant scoping tests to all platform service specs
4. Set up CI pipeline to run tests against a live PostgreSQL container
