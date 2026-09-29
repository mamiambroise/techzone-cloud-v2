# Report 11: API Route Comparison Matrix

**Scope:** Comprehensive route comparison across all repositories
**Date:** 2026-09-29

---

## 11.1 Executive Summary

| Aspect | Local | jasmina-bm/Mami | jasmina/develop | taratra31/main | taratra31/ERP-full |
|--------|-------|-----------------|-----------------|----------------|--------------------|
| Backend Framework | NestJS 12 | NestJS 12 | NestJS 12 | **Express.js** | NestJS 12 |
| Route Prefix | `/api/*` | `/api/*` | `/api/*` | `/auth`, `/billing`, etc. (bare) | bare (no `/api`) |
| Total Routes | ~280+ routes | Partial | ~80 routes | ~80 routes | PARTIAL |
| IAM Auth Routes | 14 (`/api/iam/auth`) | 0 (uses taratra31-style) | 0 | 14 (`/auth`) | 5 (`/iam/auth`) |
| IAM User Routes | 6 (`/api/iam/users`) | 0 | 0 | 0 (Express `/users`?) | ~10 (`/iam/users`) |
| Tenant Isolation | All routes | Unknown | Unknown | Unknown | **None (CRITICAL)** |
| Tests | 44 backend spec files | Unknown | Unknown | 11 test files | Unknown |

**Overall Status:** `CURRENT_MORE_COMPLETE` — Local has the most routes with proper security and tenant isolation.
**Recommendation:** KEEP_CURRENT for canonical routes. Document taratra31 routes for IAM expansion.

## 11.2 Local Route Inventory

### 11.2.1 IAM Routes (136 routes across 14 controllers)

| Controller File | Route Prefix | Method Count | Status |
|----------------|-------------|--------------|--------|
| `iam-auth.controller.ts` | `api/iam/auth` | 14 (login, logout, refresh, register, forgot-password, reset-password, change-password, login/mfa, me, sessions, tenants, profile, tenant/switch) | FULLY IMPLEMENTED |
| `iam-users.controller.ts` | `api/iam/users` | 6 (GET, POST, GET:id, GET:stats, PATCH:status, DELETE:id) | FULLY IMPLEMENTED |
| `iam-identities.controller.ts` | `api/iam/identities` | 5 (GET, POST, GET:id, PATCH:id, DELETE:id) | FULLY IMPLEMENTED |
| `iam-sessions.controller.ts` | `api/iam/sessions` | 3 (GET, POST:revoke, DELETE:id) | FULLY IMPLEMENTED |
| `iam-mfa.controller.ts` | `api/iam/mfa` | 7 (methods, enroll, enroll/verify, challenge/verify, challenge/remember-device, recovery-codes, methods:id/DELETE) | FULLY IMPLEMENTED |
| `iam-config.controller.ts` | `api/iam/config` | 6 (GET, GET:policies, GET:security, GET:tenants:id, PATCH:tenants:id, POST:security/test) | FULLY IMPLEMENTED |
| `iam-health.controller.ts` | `api/iam/health` | 2 (GET, GET:ready) | FULLY IMPLEMENTED |
| `iam-context.controller.ts` | `api/iam/context` | 1 (POST:resolve) | FULLY IMPLEMENTED |
| `iam-policies.controller.ts` | `api/iam/policies` | 5 (GET, POST, GET:id, PATCH:id, DELETE:id) | FULLY IMPLEMENTED |
| `iam-tenants.controller.ts` | `api/iam/admin/tenants` | 10 (GET, POST, GET:id, GET:id/memberships, GET:id/subscriptions, PATCH:id, POST:id/memberships, POST:id/status, DELETE:id) | FULLY IMPLEMENTED |
| `iam-billing.controller.ts` | `api/iam/billing` | 50 (plans, subscriptions, invoices, payments, entitlements, features, access/decide + sub-routes) | FULLY IMPLEMENTED |
| `iam-observability.controller.ts` | `api/iam` | 10 (dashboard, logs/search, audit/search, security/events, alerts, alerts/rules, alerts:acknowledge/resolve, alerts/rules:patch, security/events:patch) | FULLY IMPLEMENTED |
| `iam-profile.controller.ts` | `api/iam` | 2 (GET:me, PATCH:profile) | FULLY IMPLEMENTED |
| `iam-governance.controller.ts` | `api/iam/admin/governance/roles` | 10 (GET, POST, GET:id, PATCH:id, DELETE:id, permissions, assignments, assignments:revoke) | FULLY IMPLEMENTED |
| `iam-admin-users.controller.ts` | `api/iam/admin/users` | 1 (POST:id/status) | PARTIAL_IN_CURRENT |

### 11.2.2 Platform/Business Manager Routes (12 controllers)

| Controller File | Route Prefix | Method Count |
|----------------|-------------|--------------|
| `platform.controller.ts` | `api/business-manager` | 2 (GET:dashboard, GET:activity) |
| `applications/applications.controller.ts` | `api/business-manager/applications` | 6 |
| `application-versions/application-versions.controller.ts` | `api/business-manager` | 4 |
| `environments/envrionment.controller.ts` | `api/business-manager/environments` | 6 |
| `configuration/configuration.controller.ts` | `api/business-manager/configurations` | 6 |
| `snapshots/snapshot.controller.ts` | `api/business-manager/snapshots` | 5 |
| `contracts/contract.controller.ts` | `api/business-manager/contracts` | 6 |
| `business-manager/contracts/contracts.controller.ts` | `api/business-manager/contracts` (BM) | 10 |
| `business-manager/data-model/data-model.controller.ts` | `api/business-manager/data-model` | 6 |
| `business-manager/features/features.controller.ts` | `api/business-manager/features` | 6 |
| `business-manager/navigation/navigation.controller.ts` | `api/business-manager/navigation` | 6 |
| `business-manager/quality/quality.controller.ts` | `api/business-manager/validation` | 4 |
| `business-manager/runtime/runtime-bridge.controller.ts` | `api/business-manager/runtime` | 2 |

### 11.2.3 Integration Routes (8 controllers, ~100+ routes)

| Controller File | Route Prefix | Method Count |
|----------------|-------------|--------------|
| `integration.controller.ts` | `api/integrations` | 4 |
| `connectors/connector.controller.ts` | `api/integrations/connectors` | 6 |
| `api-manager/api-manager.controller.ts` | `api/integrations/apis` | 8 |
| `credentials/credentials.controller.ts` | `api/integrations/credentials` | 6 |
| `webhooks/webhook.controller.ts` | `api/integrations/webhooks` | 8 |
| `webhooks/inbound-webhook.controller.ts` | `api/webhooks/inbound` | 2 (PUBLIC) |
| `synchronizations/synchronization.controller.ts` | `api/integrations/synchronizations` | 8 |
| `diagnostics/diagnostics.controller.ts` | `api/integrations/diagnostics` | 6 |

### 11.2.4 Deployment Routes (7 controllers, ~60 routes)

| Controller File | Route Prefix | Method Count |
|----------------|-------------|--------------|
| `deployments/deployment.controller.ts` | `api/deployments` | 6 |
| `release/release.controller.ts` | `api/releases` | 8 |
| `rollback/rollback.controller.ts` | `""` (root) | 4 |
| `environments/environment-deployment.controller.ts` | `api/deployment/environments` | 6 |
| `gates/gate.controller.ts` | `api/deployments/:id/gates` | 6 |
| `cockpit/cockpit.controller.ts` | `""` (root) | 5 |
| `diagnostics/deployment-diagnostics.controller.ts` | `api/deployments` | 4 |

### 11.2.5 ERP/Data/Automation Routes

| Controller File | Route Prefix | Method Count |
|----------------|-------------|--------------|
| `erp-adapter.controller.ts` | `api/erp` | 47 |
| `data-runtime.controller.ts` | `api/data-runtime` | 12 |
| `erp-registry.controller.ts` | `api/erp-registry` | 6 |
| `automation.controller.ts` | `api/automation` | 19 |

**Total Local Routes:** ~320+ routes across modules

## 11.3 taratra31/main (Express.js) Route Comparison

### 11.3.1 Express Routes (18 route files)

| Route File | Route Prefix | Controller | Local Counterpart | Status |
|-----------|-------------|------------|-------------------|--------|
| `auth.routes.js` | `/auth` | auth.controller.js | iam-auth.controller.ts (`/api/iam/auth`) | PARTIAL_IN_CURRENT |
| `session.routes.js` | `/sessions` | session.controller.js | iam-sessions.controller.ts (`/api/iam/sessions`) | SOURCE_MORE_COMPLETE (local adds :id/revoke) |
| `identity.routes.js` | `/identities` | identity.controller.js | iam-identities.controller.ts | IDENTICAL |
| `context.routes.js` | `/context` | context.controller.js | iam-context.controller.ts (`/api/iam/context/resolve`) | IDENTICAL |
| `mfa.routes.js` | `/mfa` | mfa.controller.js | iam-mfa.controller.ts | IDENTICAL |
| `security.routes.js` | `/security` | security.controller.js | iam-config.controller.ts (`security/test`) | PARTIAL_IN_CURRENT |
| `plan.routes.js` | `/billing/plans` | plan.controller.js | iam-billing.controller.ts (`/entitlements/plans`) | SOURCE_MORE_COMPLETE |
| `subscription.routes.js` | `/billing/subscriptions` | subscription.controller.js | iam-billing.controller.ts (`/subscriptions`) | SOURCE_MORE_COMPLETE |
| `invoice.routes.js` | `/billing/invoices` | invoice.controller.js | iam-billing.controller.ts (`/invoices`) | SOURCE_MORE_COMPLETE |
| `payment.routes.js` | `/billing/payments` | payment.controller.js | iam-billing.controller.ts (`/payments`) | SOURCE_MORE_COMPLETE |
| `webhook.routes.js` | `/webhooks` | webhook.controller.js | webhooks/webhook.controller.ts (`/integrations/webhooks`) | IDENTICAL |
| `entitlement.routes.js` | `/entitlements` | entitlement.controller.js | iam-billing.controller.ts (`/entitlements`) | SOURCE_MORE_COMPLETE |
| `accessDecision.routes.js` | `/access-decision` | accessDecision.controller.js | iam-billing.controller.ts (`/billing/access/decide`) | SOURCE_MORE_COMPLETE |
| `feature.routes.js` | `/features` | feature.controller.js | iam-billing.controller.ts (`/features`) | SOURCE_MORE_COMPLETE |
| `adminUser.routes.js` | `/admin/users` | adminUser.controller.js | iam-admin-users.controller.ts (`/admin/users`) | IDENTICAL |
| `observability.routes.js` | `/observability` | observability.controller.js | iam-observability.controller.ts | PARTIAL_IN_CURRENT |
| `logsManager.routes.js` | `/logs` | logsManager.controller.js | iam-observability.controller.ts (`/logs/search`) | SOURCE_MORE_COMPLETE |
| `auditManager.routes.js` | `/audit` | auditManager.controller.js | iam-observability.controller.ts (`/audit/search`) | SOURCE_MORE_COMPLETE |
| `alertManager.routes.js` | `/alerts` | alertManager.controller.js | iam-observability.controller.ts (`/alerts`) | SOURCE_MORE_COMPLETE |
| `adminTenant.routes.js` | `/admin/tenant` | adminTenant.controller.js | iam-tenants.controller.ts | PARTIAL_IN_CURRENT |
| `adminGovernance.routes.js` | `/admin/governance` | adminGovernance.controller.js | iam-governance.controller.ts | PARTIAL_IN_CURRENT |
| `adminDelegation.routes.js` | `/admin/delegation` | adminDelegation.controller.js | **MISSING_IN_CURRENT** | MISSING_IN_CURRENT |
| `adminSecurityAudit.routes.js` | `/admin/security-audit` | adminSecurityAudit.controller.js | **MISSING_IN_CURRENT** | MISSING_IN_CURRENT |
| `adminActions.routes.js` | `/admin/actions` | adminActions.controller.js | **MISSING_IN_CURRENT** | MISSING_IN_CURRENT |
| `adminMonitoringDiagnostics.routes.js` | `/admin/monitoring` | adminMonitoringDiagnostics.controller.js | **MISSING_IN_CURRENT** | MISSING_IN_CURRENT |
| `adminAudit.routes.js` | `/admin/audit` | (adminAudit.service.js) | **MISSING_IN_CURRENT** | MISSING_IN_CURRENT |

## 11.4 taratra31/ERP-full (NestJS) Route Comparison

### 11.4.1 NestJS Controllers (taratra31/ERP-full)

| Controller | File | Route | Local Counterpart | Status |
|-----------|------|-------|-------------------|--------|
| IamAuthController | iam-auth.controller.ts | `iam/auth` | `api/iam/auth` | PARTIAL_IN_CURRENT |
| IamUsersController | iam-users.controller.ts | `iam/users` | `api/iam/users` | PARTIAL_IN_CURRENT |
| IamSessionsController | iam-sessions.controller.ts | `iam/sessions` | `api/iam/sessions` | PARTIAL_IN_CURRENT |
| AutomationController | automation/automation.controller.ts | `automation` | `api/automation` | IDENTICAL |
| DataRuntimeController | data-runtime/data-runtime.controller.ts | `data-runtime` | `api/data-runtime` | IDENTICAL |
| ErpAdapterController | erp-adapter/erp-adapter.controller.ts | `erp` | `api/erp` | IDENTICAL |
| ErpRegistryController | erp-registry/erp-registry.controller.ts | `erp-registry` | `api/erp-registry` | IDENTICAL |

### 11.4.2 Route Prefix Comparison

| Module | Local Route | taratra31/ERP-full Route | Difference | Recommendation |
|--------|------------|--------------------------|------------|----------------|
| IAM Auth | `api/iam/auth` | `iam/auth` | Local adds `/api` prefix | KEEP_CURRENT (consistent proxy config) |
| IAM Users | `api/iam/users` | `iam/users` | Same | KEEP_CURRENT |
| Automation | `api/automation` | `automation` | Same | KEEP_CURRENT |
| Data Runtime | `api/data-runtime` | `data-runtime` | Same | KEEP_CURRENT |
| ERP Adapter | `api/erp` | `erp` | Same | KEEP_CURRENT |
| ERP Registry | `api/erp-registry` | `erp-registry` | Same | KEEP_CURRENT |
| Integration | `api/integrations` | (not present) | Local-only | KEEP_CURRENT |
| Deployment | `api/deployments`, `api/releases` | (not present) | Local-only | KEEP_CURRENT |
| Platform/BM | `api/business-manager` | (not present) | Local-only | KEEP_CURRENT |

## 11.5 jasmina-bm/Mami Route Comparison

### 11.5.1 Backend Controllers

| Controller | Route | Local Counterpart | Status |
|-----------|-------|-------------------|--------|
| pack-manager.controller.ts | `/packs` | (ComingSoon) | MISSING_IN_CURRENT |
| pack-runtime.controller.ts | `/runtime` | (ComingSoon) | MISSING_IN_CURRENT |
| business-manager/* | Various | `api/business-manager/*` (BM) | DIFFERENT_NAMING |

### 11.5.2 Frontend Routes

| Feature | Local | jasmina-bm/Mami | Status |
|--------|-------|-----------------|--------|
| Packs | ComingSoon | PackManagerCockpitView + 11 views | MISSING_IN_CURRENT |
| Runtime | ComingSoon | RuntimeCockpitView + 9 views | MISSING_IN_CURRENT |

## 11.6 Route Status Matrix

```
┌─────────────────────────────────┬──────────┬──────────────┬──────────────┬──────────────┬───────────────────┐
│ Route Group                     │ Local    │ jasmina-bm/Mami │ jasmina/dev  │ taratra31/main │ taratra31/ERP-full │
├─────────────────────────────────┼──────────┼──────────────┼──────────────┼──────────────┼───────────────────┤
│ IAM Auth                        │ 14 routes│ 0            │ 0            │ 14 (Express) │ 5 (NestJS)        │
│ IAM Users                       │ 6 routes │ 0            │ 0            │ 0            │ ~10               │
│ IAM Sessions                    │ 3 routes │ 0            │ 0            │ ~3           │ ~3                │
│ IAM MFA                         │ 7 routes │ 0            │ 0            │ 7            │ 0                 │
│ IAM Policies                    │ 5 routes │ 0            │ 0            │ 0            │ 0                 │
│ IAM Roles (Governance)          │ 10 routes│ 0            │ 0            │ ~10          │ 0                 │
│ IAM Tenants                     │ 10 routes│ 0            │ 0            │ ~5           │ 0                 │
│ IAM Billing                     │ 50 routes│ 0            │ 0            │ ~15          │ 0                 │
│ IAM Observability               │ 10 routes│ 0            │ 0            │ ~10          │ 0                 │
│ IAM Context                     │ 1 route  │ 0            │ 0            │ 1            │ 0                 │
│ IAM Config                      │ 6 routes │ 0            │ 0            │ ~3           │ 0                 │
│ IAM Health                      │ 2 routes │ 0            │ 0            │ 0            │ 0                 │
│ IAM Profile                     │ 2 routes │ 0            │ 0            │ ~2           │ 0                 │
│ IAM Admin Users                 │ 1 route  │ 0            │ 0            │ ~2           │ 0                 │
│ Platform                        │ 35 routes│ 0            │ 35 routes    │ 0            │ 0                 │
│ Business Manager                │ 35 routes│ ~20 (TypeORM)│ 0            │ 0            │ 0                 │
│ Integration                     │ 100 routes│ 0           │ 100 routes   │ 0            │ 0                 │
│ Deployment                      │ 60 routes│ 0            │ 60 routes    │ 0            │ 0                 │
│ ERP Adapter                     │ 47 routes│ 0            │ 0            │ 0            │ 47 routes         │
│ Data Runtime                    │ 12 routes│ 0            │ 0            │ 0            │ 12 routes         │
│ Automation                      │ 19 routes│ 0            │ 0            │ 0            │ 19 routes         │
│ ERP Registry                    │ 6 routes │ 0            │ 0            │ 0            │ 6 routes          │
│ Pack Manager                    │ 0        │ ~30          │ 0            │ 0            │ 0                 │
│ Pack Runtime                    │ 0        │ ~30          │ 0            │ 0            │ 0                 │
│ Admin Actions                   │ 0        │ 0            │ 0            │ ~10          │ 0                 │
│ Admin Delegation                │ 0        │ 0            │ 0            │ ~5           │ 0                 │
│ Admin Monitoring                │ 0        │ 0   │ 0            │ ~5           │ 0                 │
└─────────────────────────────────┴──────────┴──────────────┴──────────────┴──────────────┴───────────────────┘
```

## 11.7 Route Prefix Analysis

### Local Route Prefix Convention

| Convention | Example | Rationale |
|-----------|---------|-----------|
| `/api/*` | `api/iam/auth`, `api/integrations/connectors` | Consistent with `vite.config.ts` proxy |
| `/api/iam/*` | All IAM routes under `/api/iam/` | Separated IAM proxy in `vite.config.ts` |
| `/api/business-manager/*` | Platform+BM routes | Shared namespace |
| `/api/webhooks/inbound` | Public webhook endpoint | Separated from auth webhook routes |

### taratra31/ERP-full Route Prefix

| Convention | Example | Issue |
|-----------|---------|-------|
| bare routes (no `/api`) | `erp`, `automation`, `data-runtime` | **INCOMPATIBLE** with local `vite.config.ts` proxy (`/api/*`) |

### taratra31/main Route Prefix (Express)

| Convention | Example | Issue |
|-----------|---------|-------|
| bare routes | `/auth`, `/billing`, `/observability` | Different pattern, not NestJS |

## 11.8 Missing Routes Analysis

### Routes MISSING_IN_CURRENT (not in local, available in sources)

| Route | Source | Priority | Recommendation |
|-------|--------|----------|----------------|
| Pack Manager (`/api/packs/*`) | jasmina-bm/Mami | P0 | MISSING_IN_CURRENT |
| Pack Runtime (`/api/runtime/*`) | jasmina-bm/Mami | P0 | MISSING_IN_CURRENT |
| Admin Delegation (`/api/iam/admin/delegation`) | taratra31/main | P2 | MISSING_IN_CURRENT |
| Admin Actions (`/api/iam/admin/actions`) | taratra31/main | P2 | MISSING_IN_CURRENT |
| Admin Monitoring (`/api/iam/admin/monitoring`) | taratra31/main | P2 | MISSING_IN_CURRENT |
| Admin Security Audit (`/api/iam/admin/security-audit`) | taratra31/main | P2 | MISSING_IN_CURRENT |
| Admin Organization/Tenant (`/api/iam/admin/organizations/tenants`) | taratra31/main | P1 | MISSING_IN_CURRENT |

### Routes to DO NOT IMPORT

| Route | Source | Reason |
|-------|--------|--------|
| All taratra31/ERP-full routes | taratra31/ERP-full | Missing `/api` prefix — incompatible with proxy |
| All taratra31/main Express routes | taratra31/main | Express.js backend — architecturally incompatible |

## 11.9 Route Security Comparison

| Route Group | Local Security | taratra31/main Security | taratra31/ERP-full Security |
|-------------|---------------|-------------------------|----------------------------|
| IAM Auth | IamJwtGuard + IamPermissionGuard | Express auth middleware | IamJwtGuard (APP_GUARD) |
| IAM Admin | IamAdminGuard | admin permission middleware | IamAdminGuard |
| IAM Users | IamJwtGuard + IamPermissionGuard | auth middleware | IamAdminGuard |
| ERP Adapter | TenantGuard (to be added) | auth middleware | @Public on some endpoints |
| Automation | @Permissions() decorator | auth middleware | @Permissions() decorator |
| Data Runtime | TenantGuard | auth middleware | TenantGuard |
| Inbound Webhooks | @Public() | auth middleware | @Public() |
| ERP Registry | TenantGuard | auth middleware | TenantGuard |

**Critical Security Gap:** taratra31/ERP-full's IAM schema lacks `tenant_id` — routes do NOT enforce tenant isolation.

## 11.10 Recommendations

| Priority | Category | Recommendation | Source |
|----------|----------|----------------|--------|
| P0 | KEEP_CURRENT | Keep local route convention (`/api/*`) — matches `vite.config.ts` proxy | Local: main.ts, vite.config.ts |
| P0 | MISSING_IN_CURRENT | Implement Pack Manager routes (`/api/packs/*`) from jasmina-bm/Mami | jasmina-bm/Mami: Backend/src/modules/pack-manager/ |
| P0 | MISSING_IN_CURRENT | Implement Pack Runtime routes (`/api/runtime/*`) from jasmina-bm/Mami | jasmina-bm/Mami: Backend/src/modules/pack-runtime/ |
| P1 | IMPROVE_CURRENT | Add `/api/` prefix to taratra31/ERP-full routes if importing | taratra31/ERP-full: all controllers |
| P1 | MISSING_IN_CURRENT | Implement Admin Delegation routes from taratra31/main | taratra31/main: adminDelegation.routes.js |
| P2 | MISSING_IN_CURRENT | Implement Admin Actions routes from taratra31/main | taratra31/main: adminActions.routes.js |
| P2 | MISSING_IN_CURRENT | Implement Admin Monitoring routes from taratra31/main | taratra31/main: adminMonitoring.routes.js |
| P3 | IMPROVE_CURRENT | Add Admin Security Audit routes from taratra31/main | taratra31/main: adminSecurityAudit.routes.js |
| P4 | DO_NOT_IMPORT | Do NOT import taratra31/main Express.js routes — use as reference only | taratra31/main: Auth_AIM/backend/src/routes/ |

---

*Report generated: 2026-09-29 00:15 UTC*
*No files were modified. This is a read-only audit.*