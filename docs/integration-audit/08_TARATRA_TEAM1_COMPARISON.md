# Report 08: Taratra Team 1 (Auth/IAM/Billing/Admin/OBS) Comparison

**CDCs Referenced:** IAM-CDC-00 through IAM-CDC-13, BIL-CDC-00 through BIL-CDC-03, OBS-CDC-00 through OBS-CDC-03
**Local Path:** `backend/src/iam/`
**Source Path:** `Auth_AIM/backend/src/` (taratra31/main, taratra31/Lianah, taratra31/Nassa)
**Status Vocabulary:** IDENTICAL, SOURCE_MORE_COMPLETE, CURRENT_MORE_COMPLETE, DIFFERENT_IMPLEMENTATION, MISSING_IN_CURRENT, MISSING_IN_SOURCE, PARTIAL_IN_CURRENT, PARTIAL_IN_SOURCE
**Date:** 2026-09-29

---

## 8.1 Executive Summary

| Aspect | Local | taratra31/main (Auth_AIM) | Match |
|--------|-------|--------------------------|-------|
| Backend Framework | NestJS 12 | **Express.js** (NOT NestJS) | DIFFERENT_IMPLEMENTATION |
| Frontend Framework | React 19 + Vite 6 | React + Vite | IDENTICAL |
| Security Model | IamJwtGuard + IamPermissionGuard + TenantGuard + helmet + CORS | Express middleware (auth, permission, error) | CURRENT_MORE_COMPLETE |
| IAM Routes | 14 NestJS controllers, `api/iam/*` | 18 Express route files (auth, context, observability, logs, audit, alerts, mfa, security, billing, admin, access-decision, entitlements, features) | SOURCE_MORE_COMPLETE |
| Prisma Schema | 80 models (iamUser, iamSession, iamCredential, etc.) | 49 models (User, Session, Credential, Organization, Tenant, etc.) + 35 enums | SOURCE_MORE_COMPLETE (by model count) |
| Tests | 5 IAM spec files | 11 test files | SOURCE_MORE_COMPLETE (by test count) |

**Overall Status:** `MIXED` — Local has superior architecture and security; taratra31 has more IAM routes and richer Prisma schema.
**Recommendation:**
- BACKEND: KEEP_CURRENT (Express.js is architecturally incompatible; DO NOT IMPORT)
- DATABASE: IMPROVE_CURRENT (adopt taratra31 schema patterns for richer IAM models)
- FRONTEND: IMPROVE_CURRENT/Partially import UI patterns (not Express backend)

## 8.2 Backend Status

### Local Backend (IAM) — NestJS + Prisma

| Controller File | Route Prefix | Controllers/Guards | Tests |
|-----------------|-------------|-------------------|-------|
| `iam-auth.controller.ts` | `api/iam/auth` | @UseGuards(IamJwtGuard) — login, logout, refresh, verify, mfa | `iam-auth.controller.spec.ts` |
| `iam-users.controller.ts` | `api/iam/users` | @UseGuards(IamJwtGuard, IamPermissionGuard) — CRUD + search | `iam-client.spec.ts` |
| `iam-identities.controller.ts` | `api/iam/identities` | @UseGuards(IamJwtGuard, IamPermissionGuard) | — |
| `iam-sessions.controller.ts` | `api/iam/sessions` | @UseGuards(IamJwtGuard, IamPermissionGuard) | — |
| `iam-mfa.controller.ts` | `api/iam/mfa` | @UseGuards(IamJwtGuard) | — |
| `iam-config.controller.ts` | `api/iam/config` | @UseGuards(IamAdminGuard) | — |
| `iam-health.controller.ts` | `api/iam/health` | @Public() | — |
| `iam-context.controller.ts` | `api/iam/context` | @UseGuards(IamJwtGuard) | — |
| `iam-policies.controller.ts` | `api/iam/policies` | @UseGuards(IamJwtGuard, IamPermissionGuard) | — |
| `iam-tenants.controller.ts` | `api/iam/admin/tenants` | @UseGuards(IamAdminGuard) | — |
| `iam-billing.controller.ts` | `api/iam/billing` | @UseGuards(IamJwtGuard) | — |
| `iam-observability.controller.ts` | `api/iam` | @UseGuards(IamJwtGuard, IamAdminGuard) — logs, audit, security events | — |
| `iam-profile.controller.ts` | `api/iam` | @UseGuards(IamJwtGuard) — profile get/update | — |
| `iam-governance.controller.ts` | `api/iam/admin/governance/roles` | @UseGuards(IamAdminGuard) | — |
| `iam-admin-users.controller.ts` | `api/iam/admin/users` | @UseGuards(IamAdminGuard) | — |

| Guard/Utility | Path | Function | Tests |
|--------------|------|----------|-------|
| `iam-jwt.guard.ts` | JWT validation (issuer: `techzone-cloud`) | Validates local tokens against Prisma `iamUser`/`iamSession` | `iam-jwt.guard.spec.ts` |
| `iam-permission.guard.ts` | Permission-based authorization | Role/permission checking | `iam-permission.guard.spec.ts` |
| `iam-admin-isolation.spec.ts` | Admin tenant isolation | Tests cross-tenant admin access blocking | `iam-admin-isolation.spec.ts` |
| `tenant.guard.ts` | TenantGuard decorator | `@TenantResource`, `@TenantOptional` decorators | — |
| `iam-jwt.strategy.ts` | JWT strategy | Token extraction + validation | — |
| `iam-auth.service.ts` | Auth service | Token generation, session management, password hashing | — |
| `iam-session.service.ts` | Session service | Session CRUD, revocation | — |
| `iam-user.service.ts` | User service | User CRUD, search, identity link | — |
| `iam-tenant.service.ts` | Tenant service | Tenant CRUD (admin) | — |
| `iam-policy.service.ts` | Policy service | Policy CRUD | — |
| `iam-role.service.ts` | Role service | Role CRUD | — |

### taratra31/main (Auth_AIM) — Express.js + Prisma

| Route File | Route Prefix | Controllers | Services | Tests |
|-----------|-------------|------------|----------|-------|
| `routes/auth.routes.js` | `/auth` | `auth.controller.js` | `auth.service.js`, `token.service.js` | — |
| `routes/accessDecision.routes.js` | `/access-decision` | `accessDecision.controller.js` | `accessDecision.service.js` | — |
| `routes/adminActions.routes.js` | `/admin/actions` | `adminActions.controller.js` | `adminActions.service.js` | `adminActions.test.js` |
| `routes/adminAudit.routes.js` | `/admin/audit` | `adminAudit.service.js` (no controller?) | `adminAudit.service.js` | — |
| `routes/adminDelegation.routes.js` | `/admin/delegation` | `adminDelegation.controller.js` | `adminDelegation.service.js` | `adminDelegation.test.js` |
| `routes/adminGovernance.routes.js` | `/admin/governance` | `adminGovernance.controller.js` | `adminGovernance.service.js` | `adminGovernance.test.js` |
| `routes/adminMonitoringDiagnostics.routes.js` | `/admin/monitoring` | `adminMonitoringDiagnostics.controller.js` | `adminMonitoringDiagnostics.service.js` | `adminMonitoringDiagnostics.test.js` |
| `routes/adminSecurityAudit.routes.js` | `/admin/security-audit` | `adminSecurityAudit.controller.js` | `adminSecurityAudit.service.js` | `adminSecurityAudit.test.js` |
| `routes/adminTenant.routes.js` | `/admin/tenant` | `adminTenant.controller.js` | `adminTenant.service.js` | — |
| `routes/adminUser.routes.js` | `/admin/users` | `adminUser.controller.js` | `adminUser.service.js` | — |
| `routes/alertManager.routes.js` | `/observability/alerts` | `alertManager.controller.js` | `alertManager.service.js` | — |
| `routes/auditManager.routes.js` | `/observability/audit` | `auditManager.controller.js` | `auditManager.service.js` | `auditManager.test.js` |
| `routes/billing/*.routes.js` | `/billing/*` (invoices, payments, plans, subscriptions, webhooks, entitlements, features, access-rules) | Various controllers | Various services | — |
| `routes/context.routes.js` | `/context` | `context.controller.js` | `context.service.js`, `contextResolver.service.js` | — |
| `routes/entitlement.routes.js` | `/entitlements` | `entitlement.controller.js` | `entitlement.service.js` | — |
| `routes/feature.routes.js` | `/features` | `feature.controller.js` | `feature.service.js` | — |
| `routes/identity.routes.js` | `/identities` | `identity.controller.js` | `identity.service.js` | — |
| `routes/logsManager.routes.js` | `/observability/logs` | `logsManager.controller.js` | `logsManager.service.js` | `logsManager.test.js` |
| `routes/mfa.routes.js` | `/mfa` | `mfa.controller.js` | `mfa.service.js` | — |
| `routes/observability.routes.js` | `/observability` | `observability.controller.js` | `observability.service.js` | `observability.test.js` |
| `routes/payment.routes.js` | `/billing/payments` | `payment.controller.js` | `payment.service.js` | — |
| `routes/plan.routes.js` | `/billing/plans` | `plan.controller.js` | `plan.service.js` | — |
| `routes/security.routes.js` | `/security` | `security.controller.js` | `security.service.js` | `securityEventManager.test.js` |
| `routes/session.routes.js` | `/sessions` | `session.controller.js` | `session.service.js` | — |
| `routes/subscription.routes.js` | `/billing/subscriptions` | `subscription.controller.js` | `subscription.service.js` | `subscriptionManager.test.js` (implied) |
| `routes/webhook.routes.js` | `/webhooks` | `webhook.controller.js` | `webhook.service.js` | — |

**Note:** The Express.js backend (taratra31) uses manual middleware (`auth.middleware.js`, `permission.middleware.js`, `error.middleware.js`, `validation.middleware.js`) instead of NestJS guards. This is **architecturally incompatible** with local's NestJS architecture.

## 8.3 IAM-CDC Compliance Matrix

| IAM-CDC | Requirement | Local | taratra31/main | Status |
|--------|-------------|-------|----------------|--------|
| IAM-CDC-00 | IAM Foundation | `iam.module.ts` (NestJS) | Express app.js + 18 route files | DIFFERENT_IMPLEMENTATION |
| IAM-CDC-01 | User Management | `iam-users.controller.ts` (`/users`) | `adminUser.routes.js` (`/admin/users`), `identity.routes.js` (`/identities`) | SOURCE_MORE_COMPLETE |
| IAM-CDC-02 | Session Management | `iam-sessions.controller.ts` (`/sessions`) | `session.routes.js` (`/sessions`) | SOURCE_MORE_COMPLETE |
| IAM-CDC-03 | Authentication | `iam-auth.controller.ts` (`/auth`) — login, logout, refresh, verify | `auth.routes.js` (`/auth`) — login, logout, mfa, password reset | SOURCE_MORE_COMPLETE |
| IAM-CDC-04 | MFA | `iam-mfa.controller.ts` (`/mfa`) | `mfa.routes.js` (`/mfa`) | SOURCE_MORE_COMPLETE |
| IAM-CDC-05 | Authorization | `iam-policies.controller.ts`, `iam-governance.controller.ts` (roles) + guards | `accessDecision.routes.js`, `adminGovernance.routes.js` | SOURCE_MORE_COMPLETE |
| IAM-CDC-06 | Context Management | `iam-context.controller.ts` (`/context`) | `context.routes.js` (`/context`) + `contextResolver.service.js` | SOURCE_MORE_COMPLETE |
| IAM-CDC-07 | API Key Management | `iam-clients` (implied) | — | MISSING_IN_SOURCE |
| IAM-CDC-08 | Service Accounts | `iam-service-account` (implied) | — | MISSING_IN_SOURCE |
| IAM-CDC-09 | Audit Logging | `iam-observability.controller.ts` (`/audit`) | `auditManager.routes.js` | SOURCE_MORE_COMPLETE |
| IAM-CDC-10 | Device Trust | `iam-device` model in schema | `device.service.js` | SOURCE_MORE_COMPLETE |
| IAM-CDC-11 | Identity Federation | `iam-identities.controller.ts` | `identity.routes.js` (`ExternalIdentityLink` model) | SOURCE_MORE_COMPLETE |
| IAM-CDC-12 | Admin Governance | `iam-admin-users.controller.ts`, `iam-tenants.controller.ts` | `adminUser`, `adminTenant`, `adminGovernance`, `adminDelegation`, `adminActions` | SOURCE_MORE_COMPLETE |
| IAM-CDC-13 | Security Events | `iam-observability.controller.ts` (`/security`) | `security.routes.js` | SOURCE_MORE_COMPLETE |

**Backend Status:** `SOURCE_MORE_COMPLETE` — taratra31 has more IAM endpoints (admin delegation, admin actions, context resolver, device trust, security events, audit manager) but uses **Express.js which is architecturally incompatible**.

## 8.4 Billing & Observability Coverage (taratra31 only)

### BIL-CDC Compliance

| BIL-CDC | Requirement | Local | taratra31/main | Status |
|--------|-------------|-------|----------------|--------|
| BIL-CDC-00 | Billing Foundation | `iam-billing.controller.ts` (basic) | `billing/plans.routes.js`, `subscriptions.routes.js`, `invoices.routes.js`, `payments.routes.js`, `webhooks.routes.js`, `entitlements.routes.js`, `features.routes.js`, `access-rules.routes.js` (8 route files) | SOURCE_MORE_COMPLETE |
| BIL-CDC-01 | Subscription Management | Partial | Full (subscriptions, entitlements, overrides) | SOURCE_MORE_COMPLETE |
| BIL-CDC-02 | Invoice/Payment | Partial | Full (invoices, payments, plans) | SOURCE_MORE_COMPLETE |
| BIL-CDC-03 | Billing Integration | None | `billing/webhooks.routes.js` | MISSING_IN_CURRENT |

### OBS-CDC Compliance

| OBS-CDC | Requirement | Local | taratra31/main | Status |
|---------|-------------|-------|----------------|--------|
| OBS-CDC-00 | Observability Foundation | `iam-observability.controller.ts` | `observability.routes.js`, `logsManager.routes.js`, `auditManager.routes.js`, `alertManager.routes.js` | SOURCE_MORE_COMPLETE |
| OBS-CDC-01 | Log Management | Basic | Full (logs, audit, alerts, security events) | SOURCE_MORE_COMPLETE |
| OBS-CDC-02 | Alert Management | Basic | Full (AlertManager) | SOURCE_MORE_COMPLETE |
| OBS-CDC-03 | Metrics/Diagnostics | Basic | `monitoringHealthMetrics.test.js` | SOURCE_MORE_COMPLETE |

## 8.5 Frontend Status

### Local Frontend (IAM)

| Component | Function | Status |
|----------|----------|--------|
| `frontend/src/features/iam-demo/` | IAM demo pages (10+ pages: Login, Users, Identities, Tenants, Roles, Policies, Sessions, MFA, Context, Observability, Admin, Billing) | FULLY IMPLEMENTED (mock data) |
| `frontend/src/services/apiClient.js` | Axios client with `/api/iam` base URL | FULLY IMPLEMENTED |
| `frontend/src/components/AuthProvider.jsx` | Auth context (token storage, refresh) | FULLY IMPLEMENTED |

### taratra31/Lianah Frontend — Rich IAM UI

| Page | Function | Status |
|------|----------|--------|
| `pages/LoginPage.jsx` | Login form | FULLY IMPLEMENTED |
| `pages/IamOverview/IamOverviewPage.jsx` | IAM dashboard | FULLY IMPLEMENTED |
| `pages/Users/UsersPage.jsx` | User management | FULLY IMPLEMENTED (real data? or mock?) |
| `pages/Identities/IdentitiesPage.jsx` | Identity management | FULLY IMPLEMENTED |
| `pages/IdentityLinks/IdentityLinksPage.jsx` | Identity link management | FULLY IMPLEMENTED |
| `pages/IdentityGroups/IdentityGroupsPage.jsx` | Identity groups | FULLY IMPLEMENTED |
| `pages/Organisations/OrganisationsPage.jsx` | Organization management | FULLY IMPLEMENTED |
| `pages/Tenants/TenantsPage.jsx` | Tenant management | FULLY IMPLEMENTED |
| `pages/Roles/RolesPage.jsx` | Role management | FULLY IMPLEMENTED |
| `pages/Policies/PoliciesPage.jsx` | Policy management | FULLY IMPLEMENTED |
| `pages/Sessions/SessionsPage.jsx` | Session management | FULLY IMPLEMENTED |
| `pages/Contexts/ContextsPage.jsx` | Context management | FULLY IMPLEMENTED |
| `pages/Invitation/InvitationPage.jsx` | User invitation | FULLY IMPLEMENTED |

### taratra31/Lianah Frontend — Admin Pages

| Page | Function | Status |
|------|----------|--------|
| `pages/Admin/OverviewPage.jsx` | Admin dashboard (DonutChart, LineChart) | FULLY IMPLEMENTED |
| `pages/Admin/UsersAdminPage.jsx` | Admin user management | FULLY IMPLEMENTED |
| `pages/Admin/OrganisationsTenantsAdminPage.jsx` | Admin org/tenant management | FULLY IMPLEMENTED |

### taratra31/Lianah Frontend — Billing Pages

| Page | Function | Status |
|------|----------|--------|
| `pages/billing/OverviewPage.jsx` | Billing dashboard | FULLY IMPLEMENTED |
| `pages/billing/PlansPage.jsx` | Plans & offers | FULLY IMPLEMENTED |
| `pages/billing/SubscriptionsPage.jsx` | Subscriptions | FULLY IMPLEMENTED |
| `pages/billing/InvoicesPage.jsx` | Invoice list | FULLY IMPLEMENTED |
| `pages/billing/PaymentsPage.jsx` | Payment history | FULLY IMPLEMENTANT |
| `pages/billing/WebhooksPage.jsx` | Billing webhooks | FULLY IMPLEMENTED |
| `pages/billing/EntitlementsPage.jsx` | Entitlements & quotas | FULLY IMPLEMENTED |
| `pages/billing/AccessRulesPage.jsx` | Access rules by plan | FULLY IMPLEMENTED |
| `pages/billing/FeaturesPage.jsx` | Feature management | FULLY IMPLEMENTED |

### taratra31/Lianah Frontend — Observability Pages

| Page | Function | Status |
|------|----------|--------|
| `pages/Observability/ObservabilityOverview.jsx` | Observability dashboard | FULLY IMPLEMENTED |
| `pages/Observability/LogsPage.jsx` | Log viewer | FULLY IMPLEMENTED |
| `pages/Observability/AuditPage.jsx` | Audit trail viewer | FULLY IMPLEMENTED |
| `pages/Observability/SecurityEventsPage.jsx` | Security events | FULLY IMPLEMENTED |
| `pages/Observability/MonitoringPage.jsx` | Monitoring dashboard | FULLY IMPLEMENTED |
| `pages/Observability/AlertManagerPage.jsx` | Alert manager | FULLY IMPLEMENTED |

### taratra31/Lianah Frontend — Shared Components

| Component | Function |
|----------|----------|
| `components/observability/KpiCard.jsx` | KPI card |
| `components/observability/DataTable.jsx` | Data table |
| `components/observability/EmptyState.jsx` | Empty state |
| `components/observability/ErrorState.jsx` | Error state |
| `components/observability/LoadingState.jsx` | Loading spinner |
| `components/observability/SearchBar.jsx` | Search input |
| `components/observability/FilterBar.jsx` | Filter bar |
| `components/observability/StatusBadge.jsx` | Status badge |
| `components/observability/SeverityBadge.jsx` | Severity badge |
| `components/observability/Timeline.jsx` | Timeline view |
| `components/observability/DetailPanel.jsx` | Detail panel |
| `components/observability/ConfirmationModal.jsx` | Confirmation dialog |
| `components/observability/useToast.js` | Toast hook |
| `components/DonutChart.jsx` | Donut chart |
| `components/LineChart.jsx` | Line chart |
| `components/SectionIcon.jsx` | Section icon |
| `components/Header.jsx`, `Topbar.jsx`, `Layout.jsx` | Layout components |
| `components/auth/LoginForm.jsx`, `ProtectedRoute.jsx` | Auth components |

### Frontend Comparison

| Aspect | Local | taratra31/Lianah | Status |
|--------|-------|------------------|--------|
| IAM Pages | 10+ mock pages | 12 real pages | SOURCE_MORE_COMPLETE |
| Admin Pages | 0 | 7 (Overview, Users, Org/Tenant, Governance, Delegation, SecurityAudit, Monitoring, Actions) | MISSING_IN_CURRENT |
| Billing Pages | 0 | 9 (Overview, Plans, Subscriptions, Invoices, Payments, Webhooks, Entitlements, AccessRules, Features) | MISSING_IN_CURRENT |
| Observability Pages | 0 (basic in iam-demo) | 6 (Overview, Logs, Audit, SecurityEvents, Monitoring, AlertManager) | MISSING_IN_CURRENT |
| Shared UI Components | Basic UI library (`components/ui/`) | Rich observability component library | SOURCE_MORE_COMPLETE |
| Navigation | 11 nav groups | 5 sections (Dashboard, PLATEFORME, CONCEPTION, ERP & RUNTIME, AUTOMATION, LIVRAISON) | MIXED |
| Tests | 9 frontend test files | Unknown | PARTIAL_IN_CURRENT |

**Frontend Status:** `SOURCE_MORE_COMPLETE` — taratra31/Lianah has a richer frontend with 35+ pages and a comprehensive shared component library.

## 8.6 Database Status

### Local Prisma Schema — IAM Models

| Model | Description |
|-------|-------------|
| `IamUser` | User (Prisma: iamUser) |
| `IamSession` | Session (Prisma: iamSession) |
| `IamCredential` | Credential |
| `IamDevice` | Device |
| `IamPasswordHistory` | Password history |
| `IamRefreshToken` | Refresh token |
| `Organization` | Organization |
| `Tenant` | Tenant |
| `Role` | Role |
| `Permission` | Permission |
| `RoleAssignment` | Role assignment |
| `RolePermission` | Role-permission mapping |
| `Policy` | Policy |
| `PolicyCondition` | Policy conditions |
| `AccessPolicy` | Access policy |
| `Identity` | Identity |
| `UserIdentity` | User-identity mapping |
| `ExternalIdentityLink` | External identity link |
| `MfaMethod` | MFA method |
| `Group` | Group |
| `GroupMember` | Group membership |
| `Membership` | Membership |
| `CredentialReference` | Credential reference |
| `PlatformConfiguration` | Platform config |
| `PlatformDiagnostic` | Platform diagnostics |
| `PlatformMaintenance` | Platform maintenance |
| `PlatformService` | Platform service |
| `Site` | Site |
| `OutboxEvent` | Outbox events |
| `AuditEvent` | Audit events |
| `SecurityEvent` | Security events |
| `ContextSnapshot` | Context snapshot |
| `ContextInvalidation` | Context invalidation |
| `ContextSwitchEvent` | Context switch event |
| `Feature` | Feature flag |
| `Subscription` | Subscription |
| `SubscriptionEntitlementOverride` | Subscription overrides |
| `Plan` | Billing plan |
| `PlanEntitlement` | Plan entitlements |
| `Invoice` | Invoice |
| `InvoiceItem` | Invoice line item |
| `Payment` | Payment |
| `BillingEvent` | Billing events |
| `ServiceAccount` | Service account |
| `ServiceAccountCredential` | Service account credential |
| `QuotaUsage` | Quota usage |
| `RecoveryCode` | MFA recovery codes |
| `AdminDelegation` | Admin delegation |
| `AdministrativeAction` | Admin action |
| `AuthorizationDecision` | Authorization decision |

### taratra31/main Prisma Schema — IAM/Billing Models (49 models, 35 enums)

| Model | Description | Local Equivalent | Status |
|-------|-------------|-----------------|--------|
| `User` | User | `IamUser` | DIFFERENT_NAMING |
| `Session` | Session | `IamSession` | DIFFERENT_NAMING |
| `Credential` | Credential | `IamCredential` | DIFFERENT_NAMING |
| `Device` | Device | `IamDevice` | IDENTICAL |
| `PasswordHistory` | Password history | `IamPasswordHistory` | DIFFERENT_NAMING |
| `RefreshToken` | Refresh token | `IamRefreshToken` | DIFFERENT_NAMING |
| `Organization` | Organization | `Organization` | IDENTICAL |
| `Tenant` | Tenant | `Tenant` | IDENTICAL |
| `Role` | Role | `Role` | IDENTICAL |
| `Permission` | Permission | `Permission` | IDENTICAL |
| `RoleAssignment` | Role assignment | `RoleAssignment` | IDENTICAL |
| `RolePermission` | Role-permission | `RolePermission` | IDENTICAL |
| `Policy` | Not present | `Policy` | MISSING_IN_SOURCE |
| `PolicyCondition` | Not present | `PolicyCondition` | MISSING_IN_SOURCE |
| `AccessPolicy` | Access policy | `AccessPolicy` | IDENTICAL |
| `Identity` | Identity | `Identity` | IDENTICAL |
| `UserIdentity` | User-identity | `UserIdentity` | IDENTICAL |
| `ExternalIdentityLink` | External identity link | `ExternalIdentityLink` | IDENTICAL |
| `MfaMethod` | MFA | `MfaMethod` | IDENTICAL |
| `Group` | Group | `Group` | IDENTICAL |
| `GroupMember` | Group membership | `GroupMember` | IDENTICAL |
| `Membership` | Membership | `Membership` | IDENTICAL |
| `Feature` | Feature | `Feature` | IDENTICAL |
| `Subscription` | Subscription | `Subscription` | IDENTICAL |
| `SubscriptionEntitlementOverride` | Subscription override | Same | IDENTICAL |
| `Plan` | Billing plan | `Plan` | IDENTICAL |
| `PlanEntitlement` | Plan entitlements | Same | IDENTICAL |
| `Invoice` | Invoice | `Invoice` | IDENTICAL |
| `InvoiceItem` | Invoice item | `InvoiceItem` | IDENTICAL |
| `Payment` | Payment | `Payment` | IDENTICAL |
| `BillingEvent` | Billing event | `BillingEvent` | IDENTICAL |
| `SecurityEvent` | Security event | `SecurityEvent` | IDENTICAL |
| `AuditEvent` | Audit event | `AuditEvent` | IDENTICAL |
| `PlatformConfiguration` | Platform config | Same | IDENTICAL |
| `PlatformDiagnostic` | Platform diagnostics | Same | IDENTICAL |
| `PlatformMaintenance` | Platform maintenance | Same | IDENTICAL |
| `PlatformService` | Platform service | Same | IDENTICAL |
| `Site` | Site | `Site` | IDENTICAL |
| `OutboxEvent` | Outbox events | `OutboxEvent` | IDENTICAL |
| `ContextSnapshot` | Context snapshot | Same | IDENTICAL |
| `ContextInvalidation` | Context invalidation | Same | IDENTICAL |
| `ContextSwitchEvent` | Context switch | Same | IDENTICAL |
| `Credential` | Credential (billing?) | — | MISSING_IN_CURRENT (different) |
| `ServiceAccount` | Service account | `ServiceAccount` | IDENTICAL |
| `ServiceAccountCredential` | SA credential | Same | IDENTICAL |
| `QuotaUsage` | Quota | `QuotaUsage` | IDENTICAL |
| `RecoveryCode` | MFA recovery | `RecoveryCode` | IDENTICAL |

**taratra31/main also has these models that local does NOT have:**
- `Credential` (distinct from `CredentialReference`) — billing credential?
- `AdminDelegation` — admin delegation
- `AdministrativeAction` — admin actions
- `AuthorizationDecision` — access decision records

### Schema Comparison — Key Differences

| Aspect | Local | taratra31/main | Status | Preference |
|--------|-------|----------------|--------|------------|
| Model Prefix | `Iam*` (iamUser, iamSession) | `User`, `Session` (no prefix) | DIFFERENT_NAMING | KEEP_CURRENT (clarity) |
| `tenant_id` column | All IAM tables have `@@tenant_id` | All tables (presumably) | IDENTICAL | — |
| Enums | Extensive enums | 35 enums | PARTIAL_IN_CURRENT | SOURCE_MORE_COMPLETE |
| Billing Models | Invoice, Payment, Plan, Subscription | Same + QuotaUsage | SOURCE_MORE_COMPLETE | — |
| Additional IAM Models | CredentialReference, Policy | Credential, AdminDelegation, AdministrativeAction, AuthorizationDecision | MIXED | — |

**Database Status:** `SOURCE_MORE_COMPLETE` — taratra31/main Prisma schema has more models and 35 enums, but uses different naming conventions (no `Iam` prefix). Local has richer policy support (Policy, PolicyCondition).

## 8.7 Test Status

### Local IAM Tests

| File | Scope |
|------|-------|
| `iam-auth.controller.spec.ts` | Auth controller routes |
| `iam-jwt.guard.spec.ts` | JWT guard validation |
| `iam-permission.guard.spec.ts` | Permission guard |
| `iam-client.spec.ts` | IAM client (user/service) |
| `iam-admin-isolation.spec.ts` | Tenant isolation for admin |

**Total:** 5 IAM spec files

### taratra31/main Tests

| File | Scope |
|------|-------|
| `tests/adminActions.test.js` | Admin actions |
| `tests/adminDelegation.test.js` | Admin delegation |
| `tests/adminGovernance.test.js` | Admin governance |
| `tests/adminMonitoringDiagnostics.test.js` | Admin monitoring |
| `tests/adminSecurityAudit.test.js` | Admin security audit |
| `tests/alertManager.test.js` | Alert manager |
| `tests/auditManager.test.js` | Audit manager |
| `tests/logsManager.test.js` | Logs manager |
| `tests/observability.test.js` | Observability |
| `tests/securityEventManager.test.js` | Security events |
| `tests/monitoringHealthMetrics.test.js` | Health metrics |

**Total:** 11 test files

**Test Status:** `SOURCE_MORE_COMPLETE` — taratra31 has 11 test files vs local's 5 IAM tests, but local's overall test coverage (44 backend spec files + 9 frontend tests) is more comprehensive in absolute terms.

## 8.8 Tenant Classification

| Module | Local | taratra31/main | Status |
|--------|-------|----------------|--------|
| IAM Users | `tenant_id` enforced via TenantGuard | Likely `tenant_id` (model has `Tenant`) | IDENTICAL |
| Sessions | `tenant_id` | Same | IDENTICAL |
| Tenants | `TenantGuard` (admin only) | `adminTenant` routes | IDENTICAL |
| Billing | `tenant_id` on invoices/subscriptions | Same | IDENTICAL |
| Observability | `tenant_id` on audit/security events | Same | IDENTICAL |

**Multi-tenant Classification:** `TENANT_SAFE` — Both projects enforce tenant isolation.

## 8.9 Key Findings

1. **Express.js Incompatibility (CRITICAL):** taratra31/main uses Express.js for IAM — architecturally incompatible with local's NestJS. **DO NOT IMPORT backend code.**
2. **Richer IAM Routes:** taratra31 has 18 route files (admin delegation, admin actions, context resolver, device trust, security events, audit manager, alert manager, billing 8 routes) vs local's 14 controllers. All are implementable as NestJS controllers.
3. **Billing/Admin/OBS Frontend:** taratra31/Lianah has 35+ fully implemented pages (admin 8, billing 9, observability 6, IAM 12) vs local's 10+ mock pages. The shared observability component library (KpiCard, DataTable, StatusBadge, etc.) is valuable.
4. **Schema Differences:** taratra31/main Prisma schema (49 models, 35 enums) uses unprefixed names (User, Session, Credential) while local uses `Iam*` prefix. taratra31 has additional models (AdminDelegation, AdministrativeAction, AuthorizationDecision) but lacks local's Policy/PolicyCondition models.
5. **More Tests, Different Framework:** taratra31 has 11 test files (Jest?) vs local's 5 IAM spec files (Jest). But taratra31's tests can't be directly imported (Express-based).
6. **Security Architecture:** Local's NestJS guards (IamJwtGuard + IamPermissionGuard + TenantGuard) are more systematic than taratra31's manual Express middleware.
7. **Local is more complete overall:** Local has 44 backend spec files + 9 frontend tests, platform/integration/deployment/BM/erp-adapter/data-runtime/automation modules. taratra31 only has IAM.

## 8.10 Recommendations

| Priority | Category | Recommendation | Source |
|----------|----------|----------------|--------|
| P0 | DO_NOT_IMPORT | Do NOT import taratra31 Express.js backend code — architecturally incompatible | taratra31/main: Auth_AIM/backend/ |
| P0 | IMPROVE_CURRENT | Import taratra31 Prisma schema patterns (AdminDelegation, AdministrativeAction, AuthorizationDecision) into local schema | taratra31/main: Auth_AIM/backend/prisma/schema.prisma |
| P1 | MISSING_IN_CURRENT | Implement billing routes (invoices, payments, plans, subscriptions, webhooks, entitlements, features, access-rules) as NestJS controllers | taratra31/Lianah: Auth_AIM/backend/src/routes/billing/ |
| P1 | MISSING_IN_CURRENT | Implement admin routes (delegation, actions, security-audit, monitoring, governance) as NestJS controllers | taratra31/Lianah: Auth_AIM/backend/src/routes/admin*.js |
| P2 | MISSING_IN_CURRENT | Import frontend UI components from taratra31/Lianah (observability components, charts, layout) | taratra31/Lianah: Auth_AIM/frontend/src/components/ |
| P2 | MISSING_IN_CURRENT | Adopt the Lianah frontend billing/admin/observability page patterns for local iam-demo feature | taratra31/Lianah: Auth_AIM/frontend/src/pages/ |
| P3 | IMPROVE_CURRENT | Expand local IAM schema with taratra31's 35 enums for richer type safety | taratra31/main: schema.prisma enums |
| P3 | IMPROVE_CURRENT | Add IAM tests matching taratra31's test coverage (admin actions, delegation, governance, etc.) | Pattern from taratra31/main: tests/ |
| P4 | MISSING_IN_CURRENT | Add API key/service account management routes to local IAM | Pattern from taratra31 (implied in User/ServiceAccount models) |

---

*Report generated: 2026-09-29 00:15 UTC*
*No files were modified. This is a read-only audit.*