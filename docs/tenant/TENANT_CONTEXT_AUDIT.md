# Tenant Context Audit

## Summary

The frontend `ERPDashboard.jsx` (and all other ERP-registry / ERP-adapter / data-runtime / automation pages) fails with `TENANT_REQUIRED` because the `tenantId` is `null` in the request principal on every API call. The root cause is a broken login flow: the frontend never sends a `tenantId`, and the backend creates sessions and JWTs with `tenantId: null`.

## Affected Components

| Layer | File | Issue |
|-------|------|-------|
| Frontend | `src/auth/AuthProvider.jsx` | Login call omits `tenantId` |
| Frontend | `src/services/authService.js` | `login()` does not accept or send tenant |
| Frontend | `src/store/platformSlice.js` | Hardcoded demo `TENANTS` / `IAM_ROLES`, `activeTenant: 'all'` |
| Frontend | `src/Header.jsx` | Reads `TENANTS` / `IAM_ROLES` from Redux, not from real API |
| Backend | `backend/src/iam/iam-auth.service.ts` | `createSession` uses `dto.tenantId` (undefined at login) → `null` |
| Backend | `backend/src/iam/iam-jwt.guard.ts` | Reads `tenantId` from JWT `decoded.tenantId` only, never refreshes from DB |
| Backend | `backend/src/iam/iam-auth.controller.ts` | No `/tenants` or `/tenant/switch` endpoint |
| Backend | `backend/src/erp-registry/erp-registry.controller.ts` | `toTenantContext(principal)` maps `principal.tenantId` → `null` |
| Backend | `backend/src/erp-adapter/erp-adapter.service.ts` | `resolveErpFromTenant` throws `TENANT_REQUIRED` when `principal.tenantId` is null |

## Data Model Trace

### USER_MODEL
- Prisma model: `IamUser`
- Fields: `id`, `identifier`, `email`, `passwordHash`, `displayName`, `status`, `defaultTenantId` (FK → `Tenant`)
- Relation: `IamUser.defaultTenant → Tenant`

### TENANT_MODEL
- Prisma model: `Tenant`
- Fields: `id`, `name`, `slug`, `status`, `createdAt`, `updatedAt`
- Identifier: `slug` is used as the tenant key

### USER_TENANT_RELATION
- Prisma model: `Membership`
- Fields: `id`, `userId` (FK → `IamUser`), `tenantId` (FK → `Tenant`), `status` (enum: `ACTIVE`, `INVITED`, `SUSPENDED`), `roles` (String[])
- A user accesses a tenant through a `Membership` record; `defaultTenantId` on `IamUser` points to the default tenant

### SESSION_MODEL
- Prisma model: `IamSession`
- Fields: `id`, `userId` (FK), `tenantId` (FK → `Tenant`), `refreshTokenHash`, `expiresAt`, `createdAt`, `lastSeenAt`, `userAgent`, `ipAddress`, `deviceInfo`, `isActive`
- **The session is tenant-scoped**: `tenantId` lives on the session record and should be the source of truth for which tenant the user is acting as

### JWT_CONTENT
- Built by `IamAuthService.buildAccessToken(session)`
- Payload: `sub` (session.id), `userId` (session.userId), `tenantId` (session.tenantId), `role` (first role from session), `isSuperAdmin` (`"admin"` in `IAM_ROLES`), `iat`, `exp`
- **Because `session.tenantId` is `null` at creation time, the JWT carries `tenantId: null`**

### PRINCIPAL_STRUCTURE
- Interface: `IamPrincipal` (defined in `backend/src/iam/principal.decorator.ts`)
- Fields: `userId: string`, `tenantId: string | null`, `tenantSlug: string | null`, `role: string`, `isSuperAdmin: boolean`, `sessionId: string`, `permissions: string[]`
- Constructed in `IamJwtGuard` from `decoded` JWT payload + DB lookup via `IamContextService.resolveContext()`
- `decoded.tenantId ?? null` → **null because JWT was signed with `tenantId: null`**

### TENANT_RESOLUTION_CURRENT
1. Request arrives with `Authorization: Bearer <jwt>`
2. `IamJwtGuard` extracts `tenantId` from the **JWT payload** (`decoded.tenantId ?? null`)
3. `IamContextService.resolveContext(session.tenantId)` is called to load `TenantContext` from the session record — but only to populate `tenantSlug`, `isSuperAdmin`, `permissions`. **`tenantId` itself is NOT taken from this lookup.**
4. Controller methods receive `@Principal() principal` with `principal.tenantId = null`
5. `ErpAdapterService.resolveErpFromTenant(principal)` sees `principal.tenantId === null` → throws `TENANT_REQUIRED`

### TENANT_RESOLUTION_EXPECTED
1. Request arrives with `Authorization: Bearer <jwt>`
2. `IamJwtGuard` validates JWT signature & expiry
3. Guard looks up the **live `IamSession`** from the DB by `session.id` (the `sub` claim)
4. Guard reads `tenantId` from **`session.tenantId`** (the DB record), not from the JWT payload
5. Guard calls `IamContextService.resolveContext(session.tenantId)` to populate `TenantContext` (tenant slug, permissions, role)
6. Principal is constructed with `tenantId = session.tenantId` (the live value from DB)
7. Controllers receive a principal with a non-null `tenantId`

### Login Flow — Expected vs Current

#### Current (broken)
1. `AuthProvider.jsx` calls `authService.login({ identifier, password, deviceFingerprint, deviceName, deviceType })`
2. `IamAuthService.login()` → `createSession(dto)` where `dto.tenantId` is `undefined`
3. `createSession` creates `IamSession` with `tenantId: null`
4. JWT signed with `tenantId: null`
5. All subsequent API calls: `principal.tenantId = null` → `TENANT_REQUIRED`

#### Expected (fixed)
1. `AuthProvider.jsx` calls `authService.login({ identifier, password, ... })`
2. `IamAuthService.login()` → `createSession(dto)` where `dto.tenantId` is `undefined`
3. `createSession` auto-resolves: if `user.defaultTenantId` exists → use it; else query `Membership` table for first `ACTIVE` membership → use that tenantId
4. JWT signed with the resolved `tenantId`
5. `/auth/me` response includes the list of accessible tenants
6. Frontend `TenantProvider` fetches tenants, stores active tenant in context
7. All subsequent API calls: `principal.tenantId` = resolved tenant → works

### ROOT_CAUSE

**The login flow never resolves a tenant.** Two compounding bugs:

1. **Backend `createSession`** (`iam-auth.service.ts`): Creates `IamSession` with `tenantId: dto.tenantId` — when `dto.tenantId` is `undefined` (which is always, since the frontend never sends it), the session is stored with `tenantId: NULL`.

2. **Backend `IamJwtGuard`** (`iam-jwt.guard.ts`): Constructs the principal using `tenantId: decoded.tenantId ?? null` — reads from the JWT payload, not from the live session record. This means even if a user switches tenants (via a future `/tenant/switch` endpoint), the guard would still serve stale tenant data from the JWT.

**Consequence**: `resolveErpFromTenant(principal)` in `erp-adapter.service.ts:1-150` always sees `principal.tenantId === null` and throws `ErpError.tenantRequired()`.

### Fix Strategy

1. **Guard**: Read `tenantId` from the live `IamSession.tenantId` DB record, not from the JWT payload. (JWT `sub` claim already carries `sessionId` for this lookup.)
2. **CreateSession**: Auto-resolve tenant at login from `IamUser.defaultTenantId` or first active `Membership`.
3. **Endpoints**: Add `/auth/tenants` (list) and `/auth/tenant/switch` (update session + re-issue JWT).
4. **Frontend**: Create `TenantProvider` context; update `AuthProvider` to resolve tenants post-login; update `Header.jsx` to use real tenant context.
