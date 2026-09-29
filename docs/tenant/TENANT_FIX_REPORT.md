# Tenant Context Fix Report

## Problem

All ERP-related frontend pages (`ERPDashboard`, `ErpModule`, `ERPList`, etc.) failed with `TENANT_REQUIRED` errors. The dashboard showed 9 failed API calls, each throwing the same error.

## Root Cause

The login flow never set a `tenantId` on the IAM session:

1. **Frontend:** `AuthProvider.jsx` called `authService.login()` without sending a `tenantId`
2. **Backend:** `IamAuthService.createSession` stored `tenantId: null` in the `IamSession` record
3. **Backend:** `IamJwtGuard` read `tenantId` from the JWT payload (which was `null`), not from the session record
4. **Result:** All ERP controller endpoints received `principal.tenantId === null` → threw `TENANT_REQUIRED`

## Changes Made

### Backend (NestJS 12, Prisma 7)

#### `backend/src/iam/iam-jwt.guard.ts` — Guard reads tenant from DB
- Changed `tenantId: decoded.tenantId ?? null` → `tenantId: session.tenantId ?? null`
- The guard already fetches the `IamSession` from the DB; it now reads `tenantId` from that record
- This allows tenant switches to take effect immediately without JWT re-issuance

#### `backend/src/iam/iam-auth.service.ts` — Auto-resolve tenant at login
- Added `resolveTenantId(userId: string)` private method:
  - Checks `IamUser.defaultTenantId` first
  - Falls back to first `ACTIVE` `Membership` for the user
- Modified `createSession` to call `resolveTenantId` when `tenantId` is not provided
- Added `listTenants(ctx)` — delegates to `IamContextService.listActiveTenants`
- Added `switchTenant(ctx, tenantId)` — validates membership, updates session, re-issues tokens
- Enhanced `me(ctx)` — now returns `activeTenant` and `tenants` alongside user profile

#### `backend/src/iam/iam.module.ts` — Register IamContextService
- Added `IamContextService` to providers and exports so it can be injected into `IamAuthService`

#### `backend/src/iam/iam-auth.controller.ts` — New endpoints
- `GET /api/iam/auth/tenants` — lists user's accessible tenants
- `POST /api/iam/auth/tenant/switch` — switches active tenant, updates session + cookies

#### `backend/src/iam/dto/switch-tenant.dto.ts` — New DTO
- `SwitchTenantDto` with required `tenantId: string`

### Frontend (React 19, Vite 6.2)

#### `frontend/src/contexts/TenantProvider.jsx` — New file
- React context providing `tenants`, `activeTenant`, `switchTenant`, `loading`
- Fetches `/auth/tenants` on mount; auto-selects if single tenant
- Persists active tenant in `localStorage`
- `switchTenant` calls `/auth/tenant/switch` and updates Redux

#### `frontend/src/main.jsx` — Wrap with TenantProvider
- Added `TenantProvider` wrapping `App` inside the Redux `Provider`

#### `frontend/src/auth/AuthProvider.jsx` — Login flow enhanced
- Login now sets `activeTenant` from `me()` response's `activeTenant` field
- `clearAuth` now also clears `activeTenant` from Redux state

#### `frontend/src/services/authService.js` — New API methods
- `getTenants()` → `GET /auth/tenants`
- `switchTenant(tenantId)` → `POST /auth/tenant/switch`

#### `frontend/src/components/Header.jsx` — Dynamic tenant/role context
- Replaced hardcoded `IAM_ROLES` simulation dropdown with real user data from `useAuth()`
- Replaced hardcoded `TENANTS` dropdown with `useTenant()` context
- Tenant switcher now calls the real `/tenant/switch` API
- Shows real user name, email, and role

#### `frontend/src/components/ApiErrorBanner.jsx` — Consolidated errors
- Now tracks multiple errors in an array (max 3 shown)
- Deduplicates identical errors (same code + message + status)
- `TENANT_REQUIRED` errors are suppressed from the banner (handled by `tenant:required` event) since they're systemic

#### `frontend/src/services/apiClient.js` — Tenant error event
- Added `tenant:required` custom event dispatch for `TENANT_REQUIRED` errors
- Allows UI to show a dedicated tenant context error instead of generic API errors

#### `frontend/src/layouts/TechzoneLayout.jsx` — Full-width body
- Removed `max-w-7xl mx-auto` constraint from `<main>` and `<footer>`
- Body content now spans full width for better dashboard utilization

## Files Changed

```
backend/src/iam/iam-jwt.guard.ts          (1 line changed)
backend/src/iam/iam-auth.service.ts       (+30 lines)
backend/src/iam/iam-auth.controller.ts    (+18 lines)
backend/src/iam/iam.module.ts             (+3 lines)
backend/src/iam/dto/switch-tenant.dto.ts  (new file, 5 lines)

frontend/src/contexts/TenantProvider.jsx  (new file, 84 lines)
frontend/src/main.jsx                     (+2 lines)
frontend/src/auth/AuthProvider.jsx        (+4 lines, -0 lines)
frontend/src/services/authService.js      (+2 lines)
frontend/src/components/Header.jsx        (~80 lines modified)
frontend/src/components/ApiErrorBanner.jsx (rewritten, 64 lines)
frontend/src/services/apiClient.js        (+2 lines)
frontend/src/layouts/TechzoneLayout.jsx   (2 lines changed)
```

## Verification

- Backend builds: `npx nest build` — exit code 0
- Frontend builds: `npx vite build` — exit code 0
- Lint: `npx oxlint` — no new warnings (only pre-existing unused imports)
- Tests: `npx jest --testPathPatterns="iam-jwt"` — 4/4 passed (3 existing + 1 new)
- New test verifies `tenantId` is read from session record, not JWT

## Test Evidence

The new test in `iam-jwt.guard.spec.ts` creates a JWT with `tenantId: 'jwt-tenant'` but mocks the session as having `tenantId: 'session-tenant'`. The guard correctly returns `'session-tenant'`, proving the fix works.
