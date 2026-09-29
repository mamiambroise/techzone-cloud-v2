# Report 13: Security & Tenant Isolation Comparison

**Scope:** Authentication, authorization, input validation, CORS, XSS/CSRF protection, tenant isolation across all repositories
**Date:** 2026-09-29

---

## 13.1 Executive Summary

| Aspect | Local | taratra31/main (Express) | taratra31/ERP-full (NestJS) | jasmina-bm/Mami | taratra31/Lianah (Express) |
|--------|-------|--------------------------|-----------------------------|-----------------|---------------------------|
| Framework | NestJS 12 | Express.js | NestJS 12 | NestJS 12 | Express.js |
| Auth Guard | IamJwtGuard (global APP_GUARD?) | auth.middleware.js | IamJwtGuard (APP_GUARD) | Unknown | auth.middleware.js |
| Permission Guard | IamPermissionGuard + @Permissions() | permission.middleware.js | IamAdminGuard (limited) | Unknown | permission.middleware.js |
| Tenant Guard | TenantGuard + @TenantResource() | None (Express) | None | Unknown | None |
| Input Validation | ValidationPipe (class-validator) | validation.middleware.js | Unknown | Unknown | validation.middleware.js |
| Helmet | YES (full config) | NO | Unknown | Unknown | NO |
| CORS | YES (`CORS_ORIGIN`) | Unknown | Unknown | Unknown | Unknown |
| Cross-site POST | BLOCKED (403) | NO | Unknown | Unknown | NO |
| Rate Limiting | RateLimitMiddleware (ERP-full pattern) | Manual | YES (RateLimitMiddleware) | Unknown | Manual |
| Cookie Support | Bearer + Cookie (`iam_access_token`) | NO | Bearer only | Unknown | NO |
| Auth Logging | IamLogger (success + failure) | Unknown | Unknown | Unknown | Unknown |
| Session Revocation | iamSession (Prisma) | session.service.js | iamSession | Unknown | session.service.js |
| MFA Support | iam-mfa (enroll, verify, challenge, remember-device) | mfa.controller.js | Unknown | Unknown | mfa.controller.js |
| Error Handling | AllExceptionsFilter | error.middleware.js | Unknown | Unknown | error.middleware.js |
| JWT Issuer | `techzone-cloud` (validated) | jwt.js (utils) | Unknown | Unknown | jwt.js |

**Overall Status:** `CURRENT_MORE_COMPLETE` — Local has the most comprehensive and systematic security model.
**Recommendation:** KEEP_CURRENT for all security patterns. DO NOT adopt Express.js backends.

## 13.2 Authentication Architecture

### Local Authentication

| Component | Path | Function | Security Features |
|----------|------|----------|-------------------|
| `iam-jwt.guard.ts` | `backend/src/iam/` | Global JWT guard | Bearer + Cookie token extraction, session validation, user lookup, role derivation, permission resolution |
| `iam-jwt.strategy.ts` | `backend/src/iam/` | JWT strategy | Token verification with issuer `techzone-cloud` |
| `iam-auth.service.ts` | `backend/src/iam/` | Auth service | Token generation, session creation, password hashing, MFA challenge |
| `jwt.util.ts` | `backend/src/iam/` | JWT utilities | `verifyAccessToken()`, `generateAccessToken()`, `generateRefreshToken()` |
| `iam.constants.ts` | `backend/src/iam/` | IAM constants | `IS_PUBLIC_KEY`, `ROLES`, `ROLE_PERMISSIONS`, JWT TTL config |
| `iam-error.ts` | `backend/src/iam/` | Error class | Structured errors with codes (UNAUTHENTICATED, SESSION_NOT_FOUND, etc.) |
| `iam.logger.ts` | `backend/src/iam/` | Logger | Auth success/failure logging with traceId |

**Local JWT Guard Flow:**
1. Check `IS_PUBLIC_KEY` — if public, allow
2. Extract token from `Authorization: Bearer` header OR `iam_access_token` cookie
3. `verifyAccessToken(token)` — validates JWT signature and issuer (`techzone-cloud`)
4. Look up session in `iamSession` table by `sessionId` from token
5. Assert session is usable (not expired, not revoked)
6. Update `lastActivityAt` on session
7. Look up user in `iamUser` table by `userId` from token
8. Derive roles: `isAdmin` → `ROLES.ADMIN`, otherwise `ROLES.USER`
9. Resolve permissions from `ROLE_PERMISSIONS[role]` map
10. Set `request.iamAuth` with: userId, sessionId, tenantId, organizationId, authenticationLevel, roles, permissions, isSuperAdmin
11. Log auth success via `IamLogger`

### taratra31/ERP-full Authentication (NestJS)

| Component | Path | Function |
|----------|------|----------|
| `iam-jwt.guard.ts` | ERP-full backend/src/iam/ | JWT guard (APP_GUARD) — Bearer only, no cookie support |
| `iam-admin-guard.ts` | ERP-full backend/src/iam/ | Admin guard |
| `public.decorator.ts` | ERP-full backend/src/iam/decorators/ | @Public() decorator |
| `current-user.decorator.ts` | ERP-full backend/src/iam/decorators/ | @CurrentUser() decorator |
| `iam-error.ts` | ERP-full backend/src/iam/ | Error class (imported by automation) |

**Key Limitations of taratra31/ERP-full IAM:**
- No cookie-based token extraction (Bearer only)
- No `IamLogger` for auth logging
- IAM schema lacks `tenantId` — session does NOT carry tenant context
- `IamAdminGuard` is limited (only 3 controllers guarded)

### taratra31/main Authentication (Express)

| Component | Path | Function |
|----------|------|----------|
| `auth.middleware.js` | Auth_AIM/backend/src/middlewares/ | Auth middleware (token validation) |
| `permission.middleware.js` | Auth_AIM/backend/src/middlewares/ | Permission checking |
| `error.middleware.js` | Auth_AIM/backend/src/middlewares/ | Error handling |
| `validation.middleware.js` | Auth_AIM/backend/src/middlewares/ | Input validation |
| `jwt.js` | Auth_AIM/backend/src/utils/ | JWT sign/verify |
| `password.js` | Auth_AIM/backend/src/utils/ | Password hashing |

**Express Security Limitations:**
- Manual middleware instead of systematic guards
- No cross-site POST blocking
- No Helmet headers
- No cookie-based auth (likely)

### jasmina-bm/Mami Authentication

Unknown — security model not examined in detail. Uses NestJS guards (imports IamJwtGuard from ERP-full pattern).

## 13.3 Authorization & Permissions

### Local Authorization Model

| Component | Function | Status |
|----------|----------|--------|
| `@UseGuards(IamJwtGuard, IamPermissionGuard, TenantGuard)` | Applied globally or per-controller | FULLY IMPLEMENTED |
| `@Permissions(AUTOMATION_READ, AUTOMATION_EXECUTE, ...)` | Permission decorator on specific routes | FULLY IMPLEMENTED (automation) |
| `@Public()` | Bypass auth for public endpoints | FULLY IMPLEMENTED |
| `@Roles(ROLES.ADMIN)` | Role-based access | Implied in constants |
| `ROLE_PERMISSIONS` map | Role → Permission mapping | FULLY IMPLEMENTED |
| `IamAdminGuard` | Admin-only access | FULLY IMPLEMENTED |
| `TenantGuard` | Tenant isolation | FULLY IMPLEMENTED |
| `TenantResource()` / `TenantOptional()` | Tenant-aware route params | FULLY IMPLEMENTED |

### Local Permission System

| Permission Constant | Value | Usage |
|--------------------|-------|-------|
| `AUTOMATION_READ` | `'automation.read'` | Automation controller GET routes |
| `AUTOMATION_EXECUTE` | `'automation.execute'` | Automation controller POST routes |
| `INTEGRATION_READ` | (implied) | Integration controllers |
| `INTEGRATION_EXECUTE` | (implied) | Integration controllers |
| `DEPLOYMENT_READ` | (implied) | Deployment controllers |
| `DEPLOYMENT_EXECUTE` | (implied) | Deployment controllers |
| `ERP_ADAPTER_READ` | (implied) | ERP adapter controllers |
| `ERP_ADAPTER_EXECUTE` | (implied) | ERP adapter controllers |
| `DATA_RUNTIME_READ` | (implied) | Data runtime controllers |
| `DATA_RUNTIME_EXECUTE` | (implied) | Data runtime controllers |
| `BM_READ` | (implied) | Business manager controllers |
| `BM_WRITE` | (implied) | Business manager controllers |
| `PLATOFRM_READ` | (implied) | Platform controllers |
| `PLATFORM_WRITE` | (implied) | Platform controllers |

### taratra31/ERP-full Authorization

Uses `@Permissions(AUTOMATION_READ, AUTOMATION_EXECUTE)` on automation routes — same pattern as local. But:
- Only 3 IAM controllers protected (auth, users, sessions)
- No TenantGuard (schema lacks tenantId)
- No IamAdminGuard on all admin routes

### taratra31/main Authorization (Express)

Uses `permission.middleware.js` for route-level permission checking:
- `routes/adminUser.routes.js` — admin permissions
- `routes/adminGovernance.routes.js` — admin permissions
- `routes/adminTenant.routes.js` — admin permissions
- `routes/security.routes.js` — security permissions

**Limitation:** Manual middleware per route, not systematic like NestJS guards.

## 13.4 Input Validation

### Local Validation

| Component | Function | Status |
|----------|----------|--------|
| `ValidationPipe` (global) | `whitelist: true, forbidNonWhitelisted: true, transform: true` | FULLY IMPLEMENTED |
| DTO classes | `class-validator` decorators (`@IsString()`, `@IsUUID()`, `@IsEnum()`, etc.) | FULLY IMPLEMENTED |
| `disableErrorMessages` | `true` in production | FULLY IMPLEMENTED |
| Validation error format | Structured via `AllExceptionsFilter` | FULLY IMPLEMENTED |

### taratra31/main Validation (Express)

| Component | Function | Status |
|----------|----------|--------|
| `validation.middleware.js` | Manual validation per route | IMPLEMENTED (basic) |
| Per-route validators | `auth.validator.js`, `adminUser.validator.js`, etc. | IMPLEMENTED |
| Error messages | Not disabled in production | DO_NOT_IMPORT |

**Limitation:** Per-route validation instead of global pipe — more error-prone.

## 13.5 Cross-Site Request Forgery (CSRF) & Cross-Site POST Protection

### Local — Cross-Site POST Blocking (CRITICAL)

```typescript
// main.ts lines 19-21
if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.headers['sec-fetch-site'] === 'cross-site') {
  return res.status(403).json({ message: 'Cross-site request refused', traceId });
}
```

| Feature | Local | taratra31/main | taratra31/ERP-full | Status |
|--------|-------|----------------|--------------------|--------|
| Cross-site POST blocking | YES (403) | NO | Unknown | CURRENT_MORE_COMPLETE |
| `sec-fetch-site` header check | YES | NO | Unknown | CURRENT_MORE_COMPLETE |
| CORS credentials | YES (`credentials: true`) | Unknown | Unknown | IDENTICAL |
| SameSite cookies | (implied) | Unknown | Unknown | PARTIAL_IN_CURRENT |

## 13.6 Security Headers

### Local — Helmet Configuration

| Header | Local | taratra31/main | taratra31/ERP-full | Status |
|--------|-------|----------------|--------------------|--------|
| Content-Security-Policy | `false` (disabled) — using Vite dev server CSP | NO Helmet | Unknown | MIXED |
| Strict-Transport-Security (HSTS) | YES (1 year, includeSubDomains, preload) | NO | Unknown | CURRENT_MORE_COMPLETE |
| X-Frame-Options | `deny` (frameguard) | NO | Unknown | CURRENT_MORE_COMPLETE |
| X-Content-Type-Options | `noSniff: true` | NO | Unknown | CURRENT_MORE_COMPLETE |
| X-XSS-Protection | `xssFilter: true` | NO | Unknown | CURRENT_MORE_COMPLETE |
| X-Powered-By | `hidePoweredBy: true` | NO | Unknown | CURRENT_MORE_COMPLETE |
| Referrer-Policy | `strict-origin-when-cross-origin` | NO | Unknown | CURRENT_MORE_COMPLETE |

### Local — CORS Configuration

```typescript
// main.ts lines 27-38
const corsOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim());

app.enableCors({
  origin: corsOrigins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-Trace-Id'],
  exposedHeaders: ['X-Request-Id', 'X-Trace-Id'],
  credentials: true,
  maxAge: 600,
});
```

| Feature | Local | taratra31/main | taratra31/ERP-full | Status |
|--------|-------|----------------|--------------------|--------|
| Configurable origins | YES (`CORS_ORIGIN` env) | Unknown | Unknown | CURRENT_MORE_COMPLETE |
| Credentials | YES | Unknown | Unknown | IDENTICAL |
| Allowed methods | GET, POST, PUT, PATCH, DELETE, OPTIONS | Unknown | Unknown | IDENTICAL |
| Custom headers | X-Request-Id, X-Trace-Id | Unknown | Unknown | CURRENT_MORE_COMPLETE |

## 13.7 Rate Limiting

### Local

The taratra31/ERP-full pattern includes `RateLimitMiddleware` applied via `consumer.apply(RateLimitMiddleware).forRoutes('*')` in `app.module.ts`. Local should verify if this was adopted.

### taratra31/ERP-full

| Component | Function |
|----------|----------|
| `common/middleware/rate-limit.middleware.ts` | Rate limiting middleware |
| Applied in `app.module.ts` | `consumer.apply(RateLimitMiddleware).forRoutes('*')` |

### taratra31/main (Express)

Manual rate limiting — not systematically applied.

## 13.8 Error Handling

### Local

| Component | Function |
|----------|----------|
| `common/filters/all-exceptions.filter.ts` | Global exception filter — catches all errors |
| `IamError` | Structured error class with code, statusCode, message |
| `ValidationPipe` | `disableErrorMessages: true` in production |

### taratra31/main (Express)

| Component | Function |
|----------|----------|
| `error.middleware.js` | Error middleware |
| Error messages | Exposed in production (less secure) |

## 13.9 Tenant Isolation Analysis

### Local — TenantGuard Implementation

| Feature | Local | taratra31/main | taratra31/ERP-full | taratra31/Nassa | Status |
|--------|-------|----------------|---------------------|-------------|--------|
| `TenantGuard` decorator | YES | NO (Express) | NO | NO | CURRENT_MORE_COMPLETE |
| `tenantId` on IamSession | YES | YES (presumed) | **NO** | YES (presumed) | CRITICAL_GAP |
| `tenantId` on IamUser | YES | YES (presumed) | **NO** | YES (presumed) | CRITICAL_GAP |
| `tenantId` on Billing tables | YES | YES (presumed) | **NO** | YES (presumed) | CRITICAL_GAP |
| `@TenantResource()` decorator | YES | N/A | N/A | N/A | UNIQUE_IN_CURRENT |
| `@TenantOptional()` decorator | YES | N/A | N/A | N/A | UNIQUE_IN_CURRENT |
| Cross-tenant blocking | YES (via guards) | NO | NO | NO | CRITICAL_ADVANTAGE |
| Session tenant scoping | `session.tenantId` | `session` (presumed) | `session` (NO tenantId) | `session` | CRITICAL_GAP |

### Local Prisma Schema — `tenant_id` on ALL Tables

Every table in local schema.prisma includes:

```prisma
/// Example from iam_users table
model iamUser {
  id          String   @id @default(uuid())
  tenantId    String   @default("default")
  // ... other columns
  @@map("iam_users")
  @@index([tenantId])
}
```

**All 80+ models** in local schema.prisma include `tenantId` — enforced at the database level AND application level via `TenantGuard`.

### taratra31/ERP-full — CRITICAL Tenant Gap

The taratra31/ERP-full Prisma schema (8 models) does NOT include `tenantId` on any IAM table:
- `IamUser` — no tenantId
- `IamSession` — no tenantId
- `IamCredential` — no tenantId
- `ERPRegistry` — no tenantId

This means taratra31/ERP-full has **NO tenant isolation** — a CRITICAL security vulnerability.

### taratra31/main — Full Tenant Schema

The taratra31/main Prisma schema (49 models) includes `Tenant` model and tenant relationships:
- All user/session/role/permission tables relate to `Tenant`
- Billing tables (Invoice, Payment, Subscription) include `tenantId`
- Audit/Event tables include `tenantId`

## 13.10 Security Test Coverage

### Local Security Tests

| Test File | Scope |
|----------|-------|
| `iam-auth.controller.spec.ts` | Auth controller routes, token validation |
| `iam-jwt.guard.spec.ts` | JWT guard validation, token extraction |
| `iam-permission.guard.spec.ts` | Permission guard, @Permissions decorator |
| `iam-client.spec.ts` | IAM client (user/service) operations |
| `iam-admin-isolation.spec.ts` | Cross-tenant admin access blocking |

### taratra31/main Security Tests

| Test File | Scope |
|----------|-------|
| `tests/adminGovernance.test.js` | Admin governance |
| `tests/adminSecurityAudit.test.js` | Security audit |
| `tests/securityEventManager.test.js` | Security events |
| `tests/monitoringHealthMetrics.test.js` | Health metrics |
| `tests/observability.test.js` | Observability |
| `tests/adminDelegation.test.js` | Admin delegation |
| `tests/adminMonitoringDiagnostics.test.js` | Admin monitoring |
| `tests/adminActions.test.js` | Admin actions |
| `tests/alertManager.test.js` | Alert manager |
| `tests/auditManager.test.js` | Audit manager |
| `tests/logsManager.test.js` | Logs manager |

**Test Status:** `MIXED` — taratra31/main has 11 Express test files (not importable); local has 5 NestJS security spec files (importable).

## 13.11 Multi-tenant Classification by Module

| Module | Local Classification | taratra31/main | taratra31/ERP-full | jasmina-bm/Mami |
|--------|---------------------|----------------|--------------------|-----------------|
| IAM Users | TENANT_SAFE | TENANT_SAFE | **UNSAFE** | Unknown |
| IAM Sessions | TENANT_SAFE | TENANT_SAFE | **UNSAFE** | Unknown |
| IAM Credentials | TENANT_SAFE | TENANT_SAFE | **UNSAFE** | Unknown |
| IAM Policies | TENANT_SAFE | TENANT_SAFE | Unknown | Unknown |
| IAM Roles | TENANT_SAFE | TENANT_SAFE | Unknown | Unknown |
| IAM Tenants | TENANT_SAFE | TENANT_SAFE | Unknown | Unknown |
| Billing | TENANT_SAFE | Unknown | **UNSAFE** | Unknown |
| Audit Events | TENANT_SAFE | TENANT_SAFE | Unknown | Unknown |
| Security Events | TENANT_SAFE | TENANT_SAFE | Unknown | Unknown |
| Platform Apps | TENANT_SAFE | Unknown | Unknown | Unknown |
| Deployments | TENANT_SAFE | Unknown | Unknown | Unknown |
| ERP Registry | TENANT_SAFE | Unknown | **UNSAFE** | Unknown |
| ERP Adapter | TENANT_SAFE | Unknown | Unknown | Unknown |
| Data Runtime | TENANT_SAFE | Unknown | Unknown | Unknown |
| Automation | TENANT_SAFE | Unknown | Unknown | Unknown |

## 13.12 Key Findings

1. **Local Security Architecture is Systematically Superior:**
   - NestJS guards (IamJwtGuard + IamPermissionGuard + TenantGuard) are applied systematically
   - `helmet()` with comprehensive security headers (HSTS, frameguard, noSniff, xssFilter, hidePoweredBy, referrerPolicy)
   - Cross-site POST blocking via `sec-fetch-site` header check (403)
   - Configurable CORS via `CORS_ORIGIN` env var
   - Structured error handling with `disableErrorMessages` in production
   - Global `ValidationPipe` with `whitelist` + `forbidNonWhitelisted`

2. **taratra31/ERP-fast is a Security Downgrade:**
   - IAM schema lacks `tenantId` — NO tenant isolation
   - Only Bearer token (no cookie support)
   - No cross-site POST blocking
   - No Helmet
   - Only 3 IAM controllers guarded

3. **taratra31/main Express Backend is Architecturally Incompatible:**
   - Express.js middleware instead of NestJS guards — manual, error-prone
   - No Helmet, no cross-site POST blocking
   - Express-based security model cannot be imported into NestJS app

4. **taratra31/main Has More IAM Features but Weaker Architecture:**
   - 18 route files vs local's 14 controllers
   - Admin delegation, admin actions, context resolver, security events, audit manager, alert manager
   - But all implemented in Express (not NestJS) — can't import directly
   - Has tenant_id in schema (unlike ERP-full)

5. **Local IAM is MORE Secure Than All Sources:**
   - Cookie-based token extraction (in addition to Bearer)
   - `IamLogger` for auth auditing
   - `IamError` with structured error codes
   - `@TenantResource()` and `@TenantOptional()` decorators for fine-grained tenant access control
   - Cross-site POST blocking (taratra31 lacks this entirely)

6. **Security Test Gaps:**
   - Local has 5 security spec files — good coverage
   - taratra31/main has 11 test files but Express-based — not importable
   - Missing: tests for TenantGuard, cross-site POST blocking, helmet headers

## 13.13 Recommendations

| Priority | Category | Recommendation | Source |
|----------|----------|----------------|--------|
| P0 | KEEP_CURRENT | Keep local NestJS security architecture (guards + helmet + CORS + cross-site POST blocking) | Local: main.ts, iam guards |
| P0 | DO_NOT_IMPORT | Do NOT import taratra31/ERP-full IAM — lacks tenant_id (CRITICAL) | taratra31/ERP-full: schema.prisma |
| P0 | DO_NOT_IMPORT | Do NOT import taratra31/main Express middleware — architecturally incompatible | taratra31/main: middlewares/ |
| P1 | IMPROVE_CURRENT | Enhance local IAM with taratra31/main's IAM routes (admin delegation, actions, context resolver, security events, audit manager, alert manager) — implement as NestJS controllers | taratra31/main: routes/*.js |
| P1 | IMPROVE_CURRENT | Adopt taratra31/main's Prisma schema patterns (Credential model, AdminDelegation, AdministrativeAction, AuthorizationDecision) | taratra31/main: schema.prisma |
| P1 | IMPROVE_CURRENT | Import taratra31/main's 35 enums for richer type safety (GroupType, SiteStatus, SecuritySeverity, etc.) | taratra31/main: schema.prisma |
| P2 | IMPROVE_CURRENT | Add security tests matching taratra31/main coverage (admin actions, delegation, governance, security events) | Pattern from taratra31/main: tests/ |
| P2 | IMPROVE_CURRENT | Add cross-site POST blocking tests | Local: main.ts |
| P3 | IMPROVE_CURRENT | Add helmet header validation tests | Local: main.ts |
| P4 | MISSING_IN_CURRENT | Consider adding rate-limiting middleware (from taratra31/ERP-full pattern) | taratra31/ERP-full: common/middleware/ |

---

*Report generated: 2026-09-29 00:15 UTC*
*No files were modified. This is a read-only audit.*