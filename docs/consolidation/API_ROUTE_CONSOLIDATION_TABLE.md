# API Route Consolidation Table

## Architecture Overview

| Component | Type | Port | Base Path | Source Location | Status |
|-----------|------|------|-----------|-----------------|--------|
| Auth_AIM Backend | Express (JS) | 5001 | `/api/iam/*` | `Auth_AIM/backend/` | IAM/Auth identity provider (kept as separate auth microservice) |
| Platform Backend | NestJS (TS) | 3003 | `/api/*` | `backend/` | Canonical backend — serves ALL routes (Platform, ERP, Data Runtime, Automation, IAM auth) |
| ERP Adapter Backend | NestJS (TS) | — | — | `new erp-adapter-platform/backend/` | MERGED into `backend/` (deleted) |
| team4 Backend | NestJS (TS) | N/A | `/api/*` | `team4-platform-api/backend/` | DUPLICATE — deleted |

## Frontend Proxy Mapping (vite.config.ts)

| Proxy Path | Target | Target Backend | Rationale |
|------------|--------|----------------|-----------|
| `/api/iam/auth/*` | `localhost:3003` | backend | Local auth endpoints (login, register, forgot/reset password) |
| `/api/iam/*` (non-auth) | `127.0.0.1:5001` | Auth_AIM | IAM admin/users/sessions/billing/observability |
| `/api/*` (catch-all) | `localhost:3003` | backend | Platform, ERP Adapter, Data Runtime, Automation, Config |

## API Endpoint Master Table

### IAM / Auth Endpoints (served by Auth_AIM backend at `/api/iam/*`)

| Method | Path | Frontend Service | Current Backend | Auth_AIM Route | Canonical Status |
|--------|------|------------------|-----------------|----------------|------------------|
| POST | `/auth/register` | `iamAuthService.register` | Auth_AIM | auth.routes.js | CONSUMED |
| POST | `/auth/login` | `iamAuthService.login` | Auth_AIM | auth.routes.js | CONSUMED |
| POST | `/auth/login/mfa` | `iamAuthService.verifyMfa` | Auth_AIM | auth.routes.js (`/login/mfa`) | CONSUMED |
| POST | `/auth/refresh` | `iamAuthService.refresh` | Auth_AIM | auth.routes.js | CONSUMED |
| POST | `/auth/logout` | `iamAuthService.logout` | Auth_AIM | auth.routes.js | CONSUMED |
| POST | `/auth/logout-all` | `iamAuthService.logoutAll` | Auth_AIM | auth.routes.js | CONSUMED |
| POST | `/auth/change-password` | `iamAuthService.changePassword` | Auth_AIM | auth.routes.js | CONSUMED |
| POST | `/auth/step-up` | (not in canonical) | Auth_AIM | auth.routes.js (`/step-up`) | MISSING in frontend |
| POST | `/auth/step-up/verify` | (not in canonical) | Auth_AIM | auth.routes.js | MISSING in frontend |
| GET | `/auth/me` | (canonical calls `/me`) | Auth_AIM | identity.routes.js (`/me`) | MISMATCH — frontend calls `/me`, not `/auth/me` |
| POST | `/auth/forgot-password` | `iamAuthService.forgotPassword` | Auth_AIM | auth.routes.js | MISMATCH — canonical frontend calls this but Auth_AIM backend doesn't have it |
| POST | `/auth/reset-password` | `iamAuthService.resetPassword` | Auth_AIM | auth.routes.js | MISMATCH — see above |
| GET | `/config/public` | `iamAuthService.getPublicConfig` | new-erp-adapter | config.controller.ts | MISMATCH — should be on canonical backend |

### IAM Admin Endpoints

| Method | Path | Frontend Service | Current Backend | Auth_AIM Route | Canonical Status |
|--------|------|------------------|-----------------|----------------|------------------|
| GET | `/users` | `iamAdminService.users` | Auth_AIM | identity.routes.js (`/users`) | CONSUMED |
| GET | `/users/:id` | `iamAdminService.user` | Auth_AIM | identity.routes.js (`/users/:id`) | CONSUMED |
| POST | `/users` | `iamAdminService.createUser` | Auth_AIM | identity.routes.js | CONSUMED |
| PATCH | `/users/:id` | (not in canonical) | Auth_AIM | identity.routes.js | MISSING in frontend |
| POST | `/users/:id/activate` | (not in canonical) | Auth_AIM | identity.routes.js | MISSING in frontend |
| POST | `/users/:id/suspend` | (not in canonical) | Auth_AIM | identity.routes.js | MISSING in frontend |
| POST | `/users/:id/lock` | (not in canonical) | Auth_AIM | identity.routes.js | MISSING in frontend |
| POST | `/users/:id/unlock` | (not in canonical) | Auth_AIM | identity.routes.js | MISSING in frontend |
| POST | `/users/:id/disable` | (not in canonical) | Auth_AIM | identity.routes.js | MISSING in frontend |
| POST | `/users/:id/archive` | (not in canonical) | Auth_AIM | identity.routes.js | MISSING in frontend |
| DELETE | `/users/:id` | `iamAdminService.deleteUser` | Auth_AIM | identity.routes.js (`/users/:id` with DELETE) | Need to verify |
| GET | `/admin/users` | `iamAdminService.search` (via `/users`) | Auth_AIM | adminUser.routes.js | CONSUMED |
| GET | `/admin/users/:id` | `iamAdminService.user` | Auth_AIM | adminUser.routes.js | CONSUMED |
| GET | `/admin/users/:id/memberships` | (not in canonical) | Auth_AIM | adminUser.routes.js | MISSING in frontend |
| GET | `/admin/users/:id/sessions` | `iamAdminService.sessions` (via `/sessions`) | Auth_AIM | adminUser.routes.js | CONSUMED |
| POST | `/admin/users/:id/status` | `iamAdminService.updateUserStatus` | Auth_AIM | adminUser.routes.js | CONSUMED |
| POST | `/admin/users/:id/sessions/revoke-all` | (not in canonical) | Auth_AIM | adminUser.routes.js | MISSING in frontend |

### IAM Sessions / Devices Endpoints (missing in canonical frontend)

| Method | Path | Auth_AIM Route | Canonical Frontend |
|--------|------|----------------|---------------------|
| GET | `/devices` | session.routes.js | MISSING — `devicesService` |
| GET | `/devices/:id` | session.routes.js | MISSING |
| POST | `/devices/:id/trust` | session.routes.js | MISSING |
| POST | `/devices/:id/untrust` | session.routes.js | MISSING |
| POST | `/devices/:id/block` | session.routes.js | MISSING |
| GET | `/sessions` | session.routes.js | `iamAdminService.sessions` |
| GET | `/sessions/:id` | session.routes.js | (not in canonical) |
| POST | `/sessions/:id/revoke` | session.routes.js | `iamAdminService.revokeSession` |
| POST | `/users/:userId/sessions/revoke-all` | session.routes.js | MISSING |
| POST | `/devices/:deviceId/sessions/revoke` | session.routes.js | MISSING |
| POST | `/sessions/:id/risk/recalculate` | session.routes.js | MISSING |
| POST | `/sessions/validate` | session.routes.js | (internal, not exposed to frontend) |
| GET | `/me/sessions` | session.routes.js | MISSING (not in canonical frontend) |
| POST | `/me/sessions/:id/revoke` | session.routes.js | MISSING |
| POST | `/me/sessions/revoke-others` | session.routes.js | MISSING |

### IAM Context Endpoints (missing in canonical frontend)

| Method | Path | Auth_AIM Route | Canonical Frontend |
|--------|------|----------------|---------------------|
| POST | `/context/resolve` | context.routes.js | MISSING — `contextService` needed |
| POST | `/context/switch-tenant` | context.routes.js | MISSING |
| GET | `/context/tenants` | context.routes.js | MISSING |
| POST | `/context/invalidate` | context.routes.js | MISSING |

### IAM Identities & Governance

| Method | Path | Frontend Service | Auth_AIM Route | Canonical Status |
|--------|------|------------------|----------------|------------------|
| GET | `/identities` | `iamAdminService.identities` | NOT EXPOSED | MISSING in backend |
| GET | `/identities/:id` | `iamAdminService.identity` | NOT EXPOSED | MISSING in backend |
| POST | `/identities` | `iamAdminService.createIdentity` | NOT EXPOSED | MISSING in backend |
| PATCH | `/identities/:id` | `iamAdminService.updateIdentity` | NOT EXPOSED | MISSING in backend |
| DELETE | `/identities/:id` | `iamAdminService.deleteIdentity` | NOT EXPOSED | MISSING in backend |
| GET | `/admin/governance/roles` | `iamAdminService.roles` | adminGovernance.routes.js | CONSUMED |
| GET | `/admin/governance/permissions` | (not in canonical) | adminGovernance.routes.js | MISSING in frontend |
| GET | `/admin/governance/assignments` | (not in canonical) | adminGovernance.routes.js | MISSING in frontend |
| GET | `/admin/governance/review` | (not in canonical) | adminGovernance.routes.js | MISSING in frontend |
| GET | `/admin/governance/critical-roles` | (not in canonical) | adminGovernance.routes.js | MISSING in frontend |
| GET | `/admin/governance/history` | (not in canonical) | adminGovernance.routes.js | MISSING in frontend |
| POST | `/admin/governance/assignments/:id/revoke` | (not in canonical) | adminGovernance.routes.js | MISSING in frontend |
| GET | `/policies` | `iamAdminService.policies` | NOT EXPOSED | MISSING in backend |
| GET | `/policies/:id` | `iamAdminService.policy` | NOT EXPOSED | MISSING in backend |
| POST | `/policies` | `iamAdminService.createPolicy` | NOT EXPOSED | MISSING in backend |
| PATCH | `/policies/:id` | `iamAdminService.updatePolicy` | NOT EXPOSED | MISSING in backend |
| DELETE | `/policies/:id` | `iamAdminService.deletePolicy` | NOT EXPOSED | MISSING in backend |

### IAM Billing Endpoints (Auth_AIM backend at `/api/iam/billing/*`)

| Method | Path | Frontend Service | Auth_AIM Route | Canonical Status |
|--------|------|------------------|----------------|------------------|
| GET | `/billing/plans` | `iamBillingService.plans` | plan.routes.js | CONSUMED |
| GET | `/billing/plans/:id` | `iamBillingService.plan` | plan.routes.js | CONSUMED |
| POST | `/billing/plans` | `iamBillingService.createPlan` | plan.routes.js | CONSUMED |
| PATCH | `/billing/plans/:id` | `iamBillingService.updatePlan` | plan.routes.js | CONSUMED |
| POST | `/billing/plans/:id/activate` | `iamBillingService.activatePlan` | plan.routes.js | CONSUMED |
| POST | `/billing/plans/:id/deprecate` | `iamBillingService.deprecatePlan` | plan.routes.js | CONSUMED |
| POST | `/billing/plans/:id/archive` | `iamBillingService.archivePlan` | plan.routes.js | CONSUMED |
| POST | `/billing/plans/:id/new-version` | `iamBillingService.newPlanVersion` | plan.routes.js | CONSUMED |
| POST | `/billing/plans/:id/entitlements` | `iamBillingService.addPlanEntitlement` | plan.routes.js | CONSUMED |
| DELETE | `/billing/plans/:id/entitlements/:eid` | `iamBillingService.removePlanEntitlement` | plan.routes.js | CONSUMED |
| GET | `/billing/subscriptions` | `iamBillingService.subscriptions` | subscription.routes.js | CONSUMED |
| GET | `/billing/subscriptions/:id` | `iamBillingService.subscription` | subscription.routes.js | CONSUMED |
| POST | `/billing/subscriptions` | `iamBillingService.createSubscription` | subscription.routes.js | CONSUMED |
| POST | `/billing/subscriptions/:id/activate` | `iamBillingService.activateSubscription` | subscription.routes.js | CONSUMED |
| POST | `/billing/subscriptions/:id/change-plan` | `iamBillingService.changeSubscriptionPlan` | subscription.routes.js | CONSUMED |
| POST | `/billing/subscriptions/:id/suspend` | `iamBillingService.suspendSubscription` | subscription.routes.js | CONSUMED |
| POST | `/billing/subscriptions/:id/resume` | `iamBillingService.resumeSubscription` | subscription.routes.js | CONSUMED |
| POST | `/billing/subscriptions/:id/cancel` | `iamBillingService.cancelSubscription` | subscription.routes.js | CONSUMED |
| POST | `/billing/subscriptions/:id/renew` | `iamBillingService.renewSubscription` | subscription.routes.js | CONSUMED |
| GET | `/billing/invoices` | `iamBillingService.invoices` | invoice.routes.js | CONSUMED |
| GET | `/billing/invoices/:id` | `iamBillingService.invoice` | invoice.routes.js | CONSUMED |
| POST | `/billing/invoices` | `iamBillingService.generateInvoice` | invoice.routes.js | CONSUMED |
| POST | `/billing/invoices/:id/issue` | `iamBillingService.issueInvoice` | invoice.routes.js | CONSUMED |
| POST | `/billing/invoices/:id/payments` | `iamBillingService.applyPaymentToInvoice` | invoice.routes.js | CONSUMED |
| POST | `/billing/invoices/:id/mark-overdue` | `iamBillingService.markInvoiceOverdue` | invoice.routes.js | CONSUMED |
| POST | `/billing/invoices/:id/void` | `iamBillingService.voidInvoice` | invoice.routes.js | CONSUMED |
| GET | `/billing/payments` | `iamBillingService.payments` | payment.routes.js | CONSUMED |
| GET | `/billing/payments/:id` | `iamBillingService.payment` | payment.routes.js | CONSUMED |
| GET | `/billing/payments/invoice/:invoiceId` | `iamBillingService.paymentsForInvoice` | payment.routes.js | CONSUMED |
| POST | `/billing/payments` | `iamBillingService.initiatePayment` | payment.routes.js | CONSUMED |
| POST | `/billing/payments/:id/processing` | `iamBillingService.markPaymentProcessing` | payment.routes.js | CONSUMED |
| POST | `/billing/payments/:id/succeed` | `iamBillingService.markPaymentSucceeded` | payment.routes.js | CONSUMED |
| POST | `/billing/payments/:id/fail` | `iamBillingService.markPaymentFailed` | payment.routes.js | CONSUMED |
| POST | `/billing/payments/:id/refund` | `iamBillingService.refundPayment` | payment.routes.js | CONSUMED |
| GET | `/billing/entitlements/:subscriptionId` | `iamBillingService.entitlements` | entitlement.routes.js | CONSUMED |
| GET | `/billing/entitlements/:sub/:feature` | `iamBillingService.entitlement` | entitlement.routes.js | CONSUMED |
| POST | `/billing/entitlements/:sub/:feature/override` | `iamBillingService.createEntitlementOverride` | entitlement.routes.js | CONSUMED |
| DELETE | `/billing/entitlements/:sub/:feature/override` | `iamBillingService.removeEntitlementOverride` | entitlement.routes.js | CONSUMED |
| GET | `/billing/entitlements/:sub/:feature/quota` | `iamBillingService.entitlementQuota` | entitlement.routes.js | CONSUMED |
| POST | `/billing/entitlements/:sub/:feature/quota/consume` | `iamBillingService.consumeEntitlementQuota` | entitlement.routes.js | CONSUMED |
| GET | `/billing/features` | `iamBillingService.features` | feature.routes.js | CONSUMED |
| GET | `/billing/features/:code` | `iamBillingService.feature` | feature.routes.js | CONSUMED |
| POST | `/billing/features` | `iamBillingService.createFeature` | feature.routes.js | CONSUMED |
| PATCH | `/billing/features/:code` | `iamBillingService.updateFeature` | feature.routes.js | CONSUMED |
| POST | `/billing/features/:code/deprecate` | `iamBillingService.deprecateFeature` | feature.routes.js | CONSUMED |
| POST | `/billing/access/decide` | `iamBillingService.checkAccess` | accessDecision.routes.js | CONSUMED |

### IAM Observability Endpoints

| Method | Path | Frontend Service | Auth_AIM Route | Canonical Status |
|--------|------|------------------|----------------|------------------|
| GET | `/security/events` | `iamObservabilityService.securityEvents` | security.routes.js | CONSUMED |
| PATCH | `/security/events/:id` | `iamObservabilityService.updateSecurityEvent` | security.routes.js | CONSUMED |
| GET | `/security/alerts` | (not in canonical) | security.routes.js | MISSING in frontend |
| GET | `/security/events/correlation` | (not in canonical) | security.routes.js | MISSING in frontend |
| GET | `/security/events/summary` | (not in canonical) | security.routes.js | MISSING in frontend |
| POST | `/security/alerts/:id/acknowledge` | (not in canonical) | security.routes.js | MISSING in frontend |
| POST | `/security/alerts/:id/resolve` | (not in canonical) | security.routes.js | MISSING in frontend |
| GET | `/observability/dashboard` | `iamObservabilityService.monitoring` | observability.routes.js | CONSUMED |
| GET | `/observability/health` | (not in canonical) | observability.routes.js | MISSING in frontend |
| GET | `/observability/component-health` | (not in canonical) | observability.routes.js | MISSING in frontend |
| GET | `/observability/metrics` | (not in canonical) | observability.routes.js | MISSING in frontend |
| GET | `/observability/activity` | (not in canonical) | observability.routes.js | MISSING in frontend |
| GET | `/observability/attention` | (not in canonical) | observability.routes.js | MISSING in frontend |
| GET | `/logs/search` | `iamObservabilityService.logs` | logsManager.routes.js | CONSUMED |
| GET | `/audit/search` | `iamObservabilityService.auditLogs` | auditManager.routes.js | CONSUMED |
| GET | `/alerts/rules` | `iamObservabilityService.alertRules` | alertManager.routes.js | CONSUMED |
| GET | `/alerts` | `iamObservabilityService.alertInstances` | alertManager.routes.js | CONSUMED |
| PATCH | `/alerts/rules/:id` | `iamObservabilityService.toggleAlertRule` | alertManager.routes.js | CONSUMED |
| POST | `/alerts/:id/acknowledge` | `iamObservabilityService.updateAlertInstance` | alertManager.routes.js | CONSUMED |
| POST | `/alerts/:id/resolve` | `iamObservabilityService.updateAlertInstance` | alertManager.routes.js | CONSUMED |

### IAM Admin Endpoints

| Method | Path | Frontend Service | Auth_AIM Route | Canonical Status |
|--------|------|------------------|----------------|------------------|
| GET | `/admin/tenants` | `iamAdminService.tenants` | adminTenant.routes.js | CONSUMED |
| GET | `/admin/tenants/:id` | `iamAdminService.tenant` | adminTenant.routes.js | CONSUMED |
| POST | `/admin/tenants` | `iamAdminService.createTenant` | adminTenant.routes.js | CONSUMED |
| POST | `/admin/tenants/:id/status` | `iamAdminService.updateTenant` | adminTenant.routes.js | CONSUMED |
| DELETE | `/admin/tenants/:id` | `iamAdminService.deleteTenant` | adminTenant.routes.js | CONSUMED |
| GET | `/admin/delegations` | (not in canonical) | adminDelegation.routes.js | MISSING in frontend |
| POST | `/admin/security/*` | (not in canonical) | adminSecurity.routes.js | MISSING in frontend |
| GET | `/admin/audit/*` | (not in canonical) | adminAudit.routes.js | MISSING in frontend |
| GET | `/admin/monitoring/*` | (not in canonical) | adminMonitoringDiagnostics.routes.js | MISSING in frontend |
| GET | `/admin/actions/*` | (not in canonical) | adminActions.routes.js | MISSING in frontend |

### ERP Adapter Endpoints (`/api/erp/*`)

All consumed by frontend services (clientService, productService, orderService, etc.). Now served by canonical backend on port 3003 (merged from new-erp-adapter-platform).

| Method | Path | Frontend Service | Current Backend | Canonical Status |
|--------|------|------------------|-----------------|------------------|
| GET | `/erp/adapters` | `erpService.adapters` | backend | CONSUMED |
| GET/POST/PUT/DELETE | `/erp/clients` | `clientService` | backend | CONSUMED |
| GET/POST/PUT/DELETE | `/erp/products` | `productService` | backend | CONSUMED |
| GET/POST/PUT/DELETE | `/erp/orders` | `orderService` | backend | CONSUMED |
| GET/POST/PUT/DELETE | `/erp/suppliers` | `supplierService` | backend | CONSUMED |
| GET/POST/PUT/DELETE | `/erp/quotes` | `quoteService` | backend | CONSUMED |
| GET/POST/PUT/DELETE | `/erp/invoices` | `invoiceService` | backend | CONSUMED |
| GET/POST | `/erp/payments` | `paymentService` | backend | CONSUMED |
| GET/POST/PUT/DELETE | `/erp/warehouses` | `warehouseService` | backend | CONSUMED |
| GET/POST/PUT/DELETE | `/erp/shipments` | `shipmentService` | backend | CONSUMED |
| GET/POST/DELETE | `/erp/documents` | `documentService` | backend | CONSUMED |
| GET/POST | `/erp/stock-movements` | `stockMovementService` | backend | CONSUMED |
| GET/POST/PUT/DELETE | `/erp/inventories` | `inventoryService` | backend | CONSUMED |
| GET/POST | `/erp/stock-alerts` | `stockAlertService` | backend | CONSUMED |
| GET/POST/PUT/DELETE | `/erp/returns` | `returnService` | backend | CONSUMED |
| GET/POST/PUT/DELETE | `/erp/promotions` | `promotionService` | backend | CONSUMED |
| GET/POST/PUT/DELETE | `/erp/cash-registers` | `cashRegisterService` | backend | CONSUMED |
| GET/POST/DELETE | `/erp/expenses` | `expenseService` | backend | CONSUMED |
| GET/POST/PUT/DELETE | `/erp/reservations` | `reservationService` | backend | CONSUMED |
| GET/POST/PUT/DELETE | `/erp/projects` | `projectService` | backend | CONSUMED |
| GET/POST | `/erp/agenda` | `agendaService` | backend | CONSUMED |
| GET/POST/PUT/DELETE | `/erp/services` | `serviceService` | backend | CONSUMED |
| GET/POST/PUT/DELETE | `/erp/product-variants` | `productVariantService` | backend | CONSUMED |
| GET/POST | `/erp/stock-transfers` | `stockTransferService` | backend | CONSUMED |
| GET | `/erp/stats` | `statsService.get` | backend | CONSUMED |
| GET | `/erp/health` | `erpHealthService.check` | backend | CONSUMED |
| GET | `/erp/users` | `erpUserService.getAll` | backend | CONSUMED |

### ERP Registry Endpoints (`/api/erp-registry/*`)

| Method | Path | Frontend Service | Current Backend | Canonical Status |
|--------|------|------------------|-----------------|------------------|
| POST | `/erp-registry` | `erpRegistryService.create` | backend | CONSUMED |
| GET | `/erp-registry` | `erpRegistryService.getAll` | backend | CONSUMED |
| GET | `/erp-registry/:id` | `erpRegistryService.getOne` | backend | CONSUMED |
| GET | `/erp-registry/code/:code` | `erpRegistryService.getByCode` | backend | CONSUMED |
| PUT | `/erp-registry/:id` | `erpRegistryService.update` | backend | CONSUMED |
| DELETE | `/erp-registry/:id` | `erpRegistryService.delete` | backend | CONSUMED |

### Data Runtime Endpoints (`/api/data-runtime/*`)

All served by canonical backend on port 3003 (merged from new-erp-adapter-platform).

| Method | Path | Frontend Service | Current Backend | Canonical Status |
|--------|------|------------------|-----------------|------------------|
| GET | `/data-runtime/contract` | `dataRuntimeService.contract` | backend | CONSUMED |
| GET | `/data-runtime/resources` | `dataRuntimeService.resources` | backend | CONSUMED |
| GET | `/data-runtime/resources/:resource` | `dataRuntimeService.listResource` | backend | CONSUMED |
| GET | `/data-runtime/resources/:resource/:id` | `dataRuntimeService.getResource` | backend | CONSUMED |
| POST | `/data-runtime/query` | `dataRuntimeService.query` | backend | CONSUMED |
| POST | `/data-runtime/execute` | `dataRuntimeService.execute` | backend | CONSUMED |
| POST | `/data-runtime/validate` | `dataRuntimeService.validate` | backend | CONSUMED |
| GET | `/data-runtime/history` | `dataRuntimeService.history` | backend | CONSUMED |
| GET | `/data-runtime/history/:traceId` | `dataRuntimeService.historyByTrace` | backend | CONSUMED |
| GET | `/data-runtime/metrics` | `dataRuntimeService.metrics` | backend | CONSUMED |
| POST | `/data-runtime/bindings/:id/resolve` | `dataRuntimeService.resolveBinding` | backend | CONSUMED |
| GET | `/data-runtime/bindings/:id/state` | `dataRuntimeService.bindingState` | backend | CONSUMED |

### Automation Endpoints (`/api/automation/*`)

All served by canonical backend on port 3003 (merged from new-erp-adapter-platform).

| Method | Path | Frontend Service | Current Backend | Canonical Status |
|--------|------|------------------|-----------------|------------------|
| GET | `/automation/cockpit` | `automationService.cockpit` | backend | CONSUMED |
| GET | `/automation/contract` | `automationService.contract` | backend | CONSUMED |
| GET | `/automation/rules` | `automationService.rules` | backend | CONSUMED |
| GET | `/automation/rules/active` | `automationService.activeRules` | backend | CONSUMED |
| GET | `/automation/rules/:code` | `automationService.rule` | backend | CONSUMED |
| POST | `/automation/rules/evaluate` | `automationService.evaluateRules` | backend | CONSUMED |
| POST | `/automation/rules/simulate` | `automationService.simulateRule` | backend | CONSUMED |
| GET | `/automation/workflows` | `automationService.workflows` | backend | CONSUMED |
| POST | `/automation/workflows/start` | `automationService.startWorkflow` | backend | CONSUMED |
| GET | `/automation/workflows/executions` | `automationService.executions` | backend | CONSUMED |
| GET | `/automation/triggers` | `automationService.triggers` | backend | CONSUMED |
| POST | `/automation/triggers/event` | `automationService.processEvent` | backend | CONSUMED |
| POST | `/automation/triggers/fire` | `automationService.fireTrigger` | backend | CONSUMED |
| POST | `/automation/conditions/evaluate` | `automationService.evaluateCondition` | backend | CONSUMED |
| POST | `/automation/conditions/simulate` | `automationService.simulateCondition` | backend | CONSUMED |
| GET | `/automation/history` | `automationService.history` | backend | CONSUMED |
| GET | `/automation/history/metrics` | `automationService.metrics` | backend | CONSUMED |

### Platform/Business Endpoints (canonical backend at port 3003)

These are already on the canonical backend. See existing frontend services: apiService, connectorsService, etc.

## Summary of Gaps and Resolutions

1. **`/config/public`** — Frontend calls `api.get('/config/public')` → `/api/config/public` → port 3003. Backend's `ConfigController` has `@Get('public')` at `api/config`. ✅ RESOLVED

2. **`/auth/forgot-password` and `/auth/reset-password`** — Frontend calls `authApi.post('/auth/forgot-password')` → `/api/iam/auth/forgot-password` → port 3003 (backend). Backend's `IamAuthController` has these endpoints. ✅ RESOLVED (backend serves them, not Auth_AIM)

3. **Missing frontend service wrappers** — Context, Devices, User Sessions, Admin Sessions APIs exist on Auth_AIM backend but lack service wrappers in canonical apiClient.js. ⚠️ PARTIAL — endpoints exist, wrappers in `iamAdminService` route to `authApi` (/api/iam); context/devices APIs still unwrapped.

4. **Identities & Policies** — Frontend references `/identities` and `/policies` via `iamAdminService` (routes to Auth_AIM). Auth_AIM routes not yet verified; need to confirm exposure. ⚠️ UNRESOLVED

5. **Platform endpoints** — Canonical backend uses `@Controller('api/...')` with `api/` prefix on all controllers. ✅ RESOLVED

6. **Proxy routing** — `/api/iam/auth/*` now routes to backend (3003) for local auth; `/api/iam/*` (admin) routes to Auth_AIM (5001). ✅ RESOLVED

## IAM Module Merge Plan

| File | backend/ | new-erp-adapter | Merge Strategy |
|------|----------|-----------------|----------------|
| `iam.constants.ts` | Has `IAM_ISSUER`, `IS_PUBLIC_KEY`, timeouts | Has permissions, roles, cookies, TTL | MERGE — combine both |
| `iam.module.ts` | Guards only | Guards + controllers + services | MERGE — add controllers/services |
| `iam-jwt.guard.ts` | Delegates to Auth_AIM | Handles both Auth_AIM and local JWT | USE new-erp-adapter version (more comprehensive) |
| `iam-error.ts` | Extends HttpException | Extends Error with toHttpBody() | USE new-erp-adapter version (more detailed) |
| `jwt.util.ts` | Minimal (verify only?) | Full implementation (sign, verify, hash) | USE new-erp-adapter version |
| `public.decorator.ts` | Exists | Exists | IDENTICAL — keep one |
| `iam.logger.ts` | Exists | Does not exist | KEEP backend version |
| `iam-client.ts` | External Auth_AIM client | Does not exist | KEEP (used by guard) |
| `iam-permission.guard.ts` | Exists | Exists (as iam-permissions.guard.ts) | MERGE into single guard |
| `permission.decorator.ts` | Has `Permissions` decorator | Has `Permissions` decorator | MERGE — keep both |
| `principal.decorator.ts` | `IamPrincipal` | `CurrentUser` | MERGE — keep both names |
| `tenant.guard.ts` | Exists | Does not exist | KEEP |
