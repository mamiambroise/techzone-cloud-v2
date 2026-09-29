# Tenant Isolation Review

## Overview

This review examines whether tenant isolation is properly enforced across the Techzone Cloud backend API, ensuring data from one tenant cannot be accessed or modified by another tenant's sessions.

## Scope

- Backend controllers: `ErpRegistryController`, `ErpAdapterController`, `DataRuntimeController`, `AutomationController`
- Guard chain: `IamJwtGuard` (authentication) → `TenantGuard` (tenant authorization) → `PermissionsGuard` (permission authorization)
- Prisma schema models: `Tenant`, `Membership`, `IamSession`, `ErpRegistry`

## Findings

### 1. IAM Guard Layer — FIXED

**Status:** Resolved

**Before:** `IamJwtGuard` read `tenantId` from the JWT payload (`decoded.tenantId`), which was `null` at creation time because `createSession` never auto-resolved a tenant.

**After:** `IamJwtGuard` now reads `tenantId` from the **live `IamSession` DB record** (`session.tenantId`), not from the JWT. This means:
- The JWT remains a valid credential; changing tenants does not invalidate the access token
- The session record is the single source of truth for which tenant the caller is acting as
- Each API request re-reads the session from the DB, so tenant changes take effect immediately

**File:** `backend/src/iam/iam-jwt.guard.ts:75`

### 2. Session Creation — FIXED

**Status:** Resolved

**Before:** `IamAuthService.createSession` stored `tenantId: null` when no explicit `tenantId` was passed (which was always, since the frontend login flow didn't send one).

**After:** `createSession` now auto-resolves the tenant via `resolveTenantId(userId)`:
1. First, checks `IamUser.defaultTenantId`
2. If not set, queries the `Membership` table for the first `ACTIVE` membership
3. If found, uses that `tenantId`
4. If neither, session is created with `tenantId: null` (user is prompted to select a tenant)

**File:** `backend/src/iam/iam-auth.service.ts:679-699` (resolveTenantId), `backend/src/iam/iam-auth.service.ts:700-706` (createSession)

### 3. Tenant Switching — NEW

**Status:** Implemented

New endpoint: `POST /api/iam/auth/tenant/switch`
- Validates tenant membership via `IamContextService.switchTenant` (requires `ACTIVE` membership)
- Updates `IamSession.tenantId` in the DB
- Issues a new access token with the resolved tenant
- Returns updated token pair via HttpOnly cookies

This ensures that after switching tenants, the `IamJwtGuard` (which reads from the session record) will return the correct `tenantId` for all subsequent requests.

**Files:** `backend/src/iam/iam-auth.service.ts:577-589`, `backend/src/iam/iam-auth.controller.ts:135-142`

### 4. ERP Registry Tenant Scoping — VERIFIED

**Status:** Secure

The `ErpRegistryService.requireTenant(ctx)` method throws `TENANT_REQUIRED` when `ctx.tenantId` is absent. All ERP registry queries use `where: { tenantId }` to scope results to the current tenant. No cross-tenant data leakage is possible as long as `principal.tenantId` is correctly populated (now guaranteed by fix #1 and #2).

**File:** `backend/src/erp-registry/erp-registry.service.ts:18-28`

### 5. ERP Adapter Tenant Scoping — VERIFIED

**Status:** Secure

The `ErpAdapterController.resolveErpFromTenant(principal)` method:
1. Extracts `tenantId` from `principal.tenantId`
2. Throws `TENANT_REQUIRED` if null
3. Queries `ErpRegistryService.getActiveForTenant({ tenantId })` — which scopes by tenant

The ERP registry's `getActiveForTenant` uses Prisma `where: { tenantId }` to ensure only the current tenant's ERP configuration is returned. Tenant A cannot resolve Tenant B's ERP adapter.

**File:** `backend/src/erp-adapter/erp-adapter.controller.ts:49-56`

### 6. Cross-Tenant Access Attempt Handling

The following scenarios were considered:

| Scenario | Before Fix | After Fix |
|----------|-----------|-----------|
| Session created without tenant | `tenantId: null` → all ERP calls throw `TENANT_REQUIRED` | `tenantId` auto-resolved from `defaultTenantId` or first `ACTIVE` membership |
| JWT carries stale tenant | Guard reads from JWT → stale tenant | Guard reads from DB session → always current |
| Tenant switch | Not possible — would require logout/login | New `/tenant/switch` endpoint updates session + issues new JWT |
| Cross-tenant resource access | Not possible — all queries are tenant-scoped | Not possible — all queries remain tenant-scoped |

## Attack Surface Analysis

### Could a user access another tenant's data?

No. Three layers of protection:

1. **Authentication** (`IamJwtGuard`): Validates JWT signature, checks session is active and not expired/revoked, reads `tenantId` from the DB session record.

2. **Tenant scoping** (controller level): All ERP/automation/data-runtime controllers extract `tenantId` from the principal and pass it to the service layer, which uses it in Prisma `WHERE` clauses.

3. **Resource-level validation** (`ErpRegistryService.getOne`): Even if a controller passes a resource ID, the service checks `erp.tenantId !== tenantId` and returns 404 — preventing ID-based cross-tenant access.

### Could a user switch to a tenant they don't belong to?

No. The `switchTenant` method calls `IamContextService.switchTenant(userId, tenantId)`, which queries:
```prisma
membership.findFirst({ where: { userId, tenantId, status: 'ACTIVE' } })
```
If no active membership exists, it throws `TENANT_ACCESS_DENIED`.

## Conclusion

Tenant isolation is properly enforced. The root cause of all `TENANT_REQUIRED` errors was a bug in the login flow where `tenantId` was never set on the session, not a security gap. The fix ensures:
- Tenant is auto-resolved at login
- The DB session record is the single source of truth for tenant context
- Tenant switching is available and secure
- All existing tenant-scoping in services/controllers remains intact
