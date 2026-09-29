# IAM Admin Permission Matrix

**Purpose**: Documents which routes require the `IAM_ADMIN` (`iam:admin`) permission and verifies that all IAM admin routes are protected.

**Permission Key**: `iam:admin`
**Constant**: `IAM_ADMIN` in `backend/src/iam/iam.constants.ts`
**Guard**: `IamAdminGuard` reads `PERMISSIONS_KEY = 'permissions'` (same key as `@Permissions()` decorator)

---

## Guard Architecture

### Two Guard Systems

| Guard | Location | Applied At | Metadata Key |
|-------|----------|------------|--------------|
| `IamPermissionsGuard` | `iam-permissions.guard.ts` | APP_GUARD (global) | `PERMISSIONS_KEY = 'permissions'` |
| `IamAdminGuard` | `iam-admin-guard.ts` | Controller-level | `PERMISSIONS_KEY = 'permissions'` (after P0 fix) |

### Critical Security Note

`IamAdminGuard` is applied at the controller level via `@UseGuards(IamAdminGuard)` on IAM admin controllers. It requires `@Permissions(IAM_ADMIN)` to be set on the route or class. If no `@Permissions()` is declared, the guard denies by default (throws `ForbiddenException`).

---

## IAM Admin Routes (72 total)

### `IamUsersController` — `/api/iam/users`
**Controller-level**: `@Permissions(IAM_ADMIN)`

| Method | Route | Action | Status |
|--------|-------|--------|--------|
| GET | `/api/iam/users` | List all IAM users | Protected |
| POST | `/api/iam/users` | Create new IAM user | Protected |
| GET | `/api/iam/users/me` | Get current user profile | Protected |
| GET | `/api/iam/users/:id` | Get user by ID | Protected |
| PATCH | `/api/iam/users/:id` | Update user | Protected |
| DELETE | `/api/iam/users/:id` | Delete user | Protected |
| PATCH | `/api/iam/users/:id/reset-password` | Reset user password | Protected |
| POST | `/api/iam/users/:id/lock` | Lock user account | Protected |

### `IamTenantsController` — `/api/iam/tenants`
**Controller-level**: `@Permissions(IAM_ADMIN)`

| Method | Route | Action | Status |
|--------|-------|--------|--------|
| GET | `/api/iam/tenants` | List all tenants | Protected |
| POST | `/api/iam/tenants` | Create tenant | Protected |
| GET | `/api/iam/tenants/:id` | Get tenant by ID | Protected |
| PATCH | `/api/iam/tenants/:id` | Update tenant | Protected |
| DELETE | `/api/iam/tenants/:id` | Delete tenant | Protected |

### `IamSessionsController` — `/api/iam/sessions`
**Controller-level**: `@Permissions(IAM_ADMIN)`

| Method | Route | Action | Status |
|--------|-------|--------|--------|
| GET | `/api/iam/sessions` | List all sessions | Protected |
| GET | `/api/iam/sessions/:id` | Get session by ID | Protected |
| DELETE | `/api/iam/sessions/:id` | Revoke session | Protected |
| DELETE | `/api/iam/sessions/user/:userId` | Revoke all user sessions | Protected |

### `IamPoliciesController` — `/api/iam/policies`
**Controller-level**: `@Permissions(IAM_ADMIN)`

| Method | Route | Action | Status |
|--------|-------|--------|--------|
| GET | `/api/iam/policies` | List all policies | Protected |
| POST | `/api/iam/policies` | Create policy | Protected |
| GET | `/api/iam/policies/:id` | Get policy by ID | Protected |
| PATCH | `/api/iam/policies/:id` | Update policy | Protected |
| DELETE | `/api/iam/policies/:id` | Delete policy | Protected |

### `IamBillingController` — `/api/iam/billing`
**Controller-level**: `@Permissions(IAM_ADMIN)`

| Method | Route | Action | Status |
|--------|-------|--------|--------|
| GET | `/api/iam/billing` | List billing | Protected |
| POST | `/api/iam/billing` | Create billing | Protected |
| PATCH | `/api/iam/billing/:id` | Update billing | Protected |

### `IamIdentitiesController` — `/api/iam/identities`
**Controller-level**: `@Permissions(IAM_ADMIN)`

| Method | Route | Action | Status |
|--------|-------|--------|--------|
| GET | `/api/iam/identities` | List identities | Protected |
| POST | `/api/iam/identities` | Create identity provider | Protected |
| GET | `/api/iam/identities/:id` | Get identity provider | Protected |
| PATCH | `/api/iam/identities/:id` | Update identity provider | Protected |
| DELETE | `/api/iam/identities/:id` | Delete identity provider | Protected |

### `IamGovernanceController` — `/api/iam/governance`
**Controller-level**: `@Permissions(IAM_ADMIN)`

| Method | Route | Action | Status |
|--------|-------|--------|--------|
| GET | `/api/iam/governance/audit-log` | Get audit log | Protected |
| GET | `/api/iam/governance/policies` | List governance policies | Protected |
| POST | `/api/iam/governance/policies` | Create governance policy | Protected |

### `IamAdminUsersController` — `/api/iam/admin/users`
**Controller-level**: `@Permissions(IAM_ADMIN)`

| Method | Route | Action | Status |
|--------|-------|--------|--------|
| GET | `/api/iam/admin/users` | List admin users | Protected |
| POST | `/api/iam/admin/users` | Create admin user | Protected |
| PATCH | `/api/iam/admin/users/:id` | Update admin user | Protected |

### `IamObservabilityController` — `/api/iam/observability`
**Method-level**: `@Permissions(IAM_ADMIN)` on each method

| Method | Route | Action | Status |
|--------|-------|--------|--------|
| GET | `/api/iam/observability/metrics` | Get metrics | Protected |
| GET | `/api/iam/observability/logs` | Get logs | Protected |
| GET | `/api/iam/observability/events` | Get audit events | Protected |
| POST | `/api/iam/observability/events/search` | Search events | Protected |
| GET | `/api/iam/observability/health` | Service health | Public (no guard) |

### `IamConfigController` — `/api/iam/config`
**Method-level**: `@Permissions(IAM_ADMIN)` on each method

| Method | Route | Action | Status |
|--------|-------|--------|--------|
| GET | `/api/iam/config` | Get config | Protected |
| PATCH | `/api/iam/config` | Update config | Protected |
| POST | `/api/iam/config/reload` | Reload config | Protected |
| GET | `/api/iam/config/:key` | Get specific config key | Protected |

### `IamHealthController` — `/api/iam/health`
**Note**: All endpoints are `@Public()` — health checks are not admin-protected.

| Method | Route | Action | Status |
|--------|-------|--------|--------|
| GET | `/api/iam/health` | Health check | Public |
| GET | `/api/iam/health/ready` | Readiness check | Public |

---

## Role Permission Mapping

```typescript
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
  [ROLES.USER]: [
    PERMISSIONS.ERP_READ,
    PERMISSIONS.AUTOMATION_READ,
    PERMISSIONS.DATA_RUNTIME_READ,
    PERMISSIONS.DATA_RUNTIME_QUERY,
    PERMISSIONS.CONFIG_READ,
  ],
};
```

- **ADMIN role**: Has all permissions including `IAM_ADMIN`
- **USER role**: Does NOT have `IAM_ADMIN` — denied access to all IAM admin routes

---

## Security Incident: adminPerms Bypass (P0-01)

**Issue**: `IamAdminGuard` contained a `adminPerms` check that used the ADMIN role's full permission set to grant access to non-admin users.

**Root Cause**: Lines 39 and 55-57 of `iam-admin-guard.ts`:
```typescript
const adminPerms = Object.values(ROLE_PERMISSIONS[ROLES.ADMIN] ?? {}).flat() as string[];
// ...later in the logic:
if (adminPerms.some((p) => requiredPermissions.includes(p))) {
  return true;
}
```

Since `ROLE_PERMISSIONS.ADMIN` includes `IAM_ADMIN`, any user accessing an IAM admin route would be granted access — even if they only had `ROLES.USER` or no permissions at all.

**Fix**: Removed the `adminPerms` check. The ADMIN role is already handled by the explicit `role === ROLES.ADMIN` check earlier in the guard.

---

## Test Coverage

| Test File | Tests | Status |
|-----------|-------|--------|
| `iam-admin-guard.spec.ts` | 11 tests | All passing |
| `iam-admin-isolation.spec.ts` | 10 tests | All passing |
| `contract.service.spec.ts` | 10 tests | All passing (tenant scoping verified) |
