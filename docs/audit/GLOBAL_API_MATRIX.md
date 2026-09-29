# Techzone Cloud — Global API Route Matrix

> **Purpose:** Complete inventory of all backend API routes, grouped by module, with frontend service wiring and CDC traceability.
> **Date:** 2026-09-28
> **Source:** `@Controller` and `@(Get|Post|Patch|Put|Delete)` decorators across `backend/src/`

## Summary

| Domain | Controller | Prefix | Routes | Frontend Service | CDC |
|---|---|---|---|---|---|
| App | `AppController` | (root) | 1 | — | — |
| Config | `ConfigController` | `api/config` | 2 | — | — |
| IAM Auth | `IamAuthController` | `api/iam/auth` | 12 | `authService.js` | IAM foundation |
| IAM Users | `IamUsersController` | `api/iam/users` | 6 | — | IAM |
| IAM Tenants | `IamTenantsController` | `api/iam/admin/tenants` | 9 | — | IAM |
| IAM Sessions | `IamSessionsController` | `api/iam/sessions` | 2 | — | IAM |
| IAM MFA | `IamMfaController` | `api/iam/mfa` | 6 | — | IAM |
| IAM Identities | `IamIdentitiesController` | `api/iam/identities` | 4 | — | IAM |
| IAM Policies | `IamPoliciesController` | `api/iam/policies` | 4 | — | IAM |
| IAM Governance | `IamGovernanceController` | `api/iam/admin/governance/roles` | 11 | — | IAM |
| IAM Health | `IamHealthController` | `api/iam/health` | 2 | — | IAM |
| IAM Context | `IamContextController` | `api/iam/context` | 1 | — | IAM |
| IAM Profile | `IamProfileController` | `api/iam` | 2 | — | IAM |
| IAM Billing | `IamBillingController` | `api/iam/billing` | 26 | — | IAM/Billing |
| IAM Observability | `IamObservabilityController` | `api/iam` | 9 | — | IAM |
| IAM Admin Users | `IamAdminUsersController` | `api/iam/admin/users` | 1 | — | IAM |
| IAM Config | `IamConfigController` | `api/iam/config` | 6 | — | IAM |
| Platform | `PlatformController` | `api/business-manager` | 2 | — | BM-CDC-05 |
| Applications | `ApplicationsController` | `api/business-manager/applications` | 5 | `platformApplicationsService.js` | BM-CDC-01 |
| Application Versions | `ApplicationVersionsController` | `api/business-manager` | 7 | — | BM-CDC-02 |
| Configurations | `ConfigurationController` | `api/business-manager/configurations` | 7 | `platformConfigService.js` | BM-CDC-06 |
| Contracts | `ContractController` | `api/business-manager/contracts` | 5 | — | BM-CDC-07 |
| Snapshots | `SnapshotController` | `api/business-manager/snapshots` | 6 | — | BM-CDC-07 |
| Environments | `EnvironmentController` | `api/business-manager/environments` | 4 | `platformEnvironmentsService.js` | BM-CDC-05 |
| Integration | `IntegrationController` | `api/integrations` | 4 | — | BM-CDC-07 |
| Connectors | `ConnectorController` | `api/integrations/connectors` | 7 | — | BM-CDC-07 |
| API Manager | `ApiManagerController` | `api/integrations/apis` | 6 | — | BM-CDC-07 |
| Webhooks | `WebhookController` | `api/integrations/webhooks` | 4 | — | BM-CDC-07 |
| Inbound Webhooks | `InboundWebhookController` | `api/webhooks/inbound` | 3 | — | BM-CDC-07 |
| Credentials | `CredentialsController` | `api/integrations/credentials` | 9 | — | BM-CDC-07 |
| Synchronizations | `SynchronizationController` | `api/integrations/synchronizations` | 8 | — | BM-CDC-07 |
| Diagnostics | `DiagnosticsController` | `api/integrations/diagnostics` | 3 | — | BM-CDC-07 |
| ERP Registry | `ErpRegistryController` | `api/erp-registry` | 5 | — | BM-CDC-07 |
| ERP Adapter | `ErpAdapterController` | `api/erp` | 42 | `erpService.js` | BM-CDC-07 |
| Data Runtime | `DataRuntimeController` | `api/data-runtime` | 11 | — | BM-CDC-07 |
| Automation | `AutomationController` | `api/automation` | 1 | — | WF-CDC |
| Releases | `ReleaseController` | `api/releases` | 9 | `deploymentService.js` | BM-CDC-02 (release) |
| Deployments | `DeploymentController` | `api/deployments` | 6 | `deploymentService.js` | BM-CDC-02 (deploy) |
| Deployment Environments | `EnvironmentDeploymentController` | `api/deployment/environments` | 6 | — | BM-CDC-02 |
| Deployment Gates | `GateController` | `api/deployments/:id/gates` | 3 | — | BM-CDC-02 |
| Rollbacks | `RollbackController` | `@Controller()` (root) | 4 | — | BM-CDC-02 |
| Cockpit | `CockpitController` | `@Controller()` (root) | 6 | — | BM-CDC-00 |
| Deployment Diagnostics | `DeploymentDiagnosticsController` | `api/deployments` | 4 | — | BM-CDC-02 |

**Total route handlers:** ~250+ individual endpoints.

---

## Detailed Route Inventory

### App

| Method | Path | Notes |
|---|---|---|
| GET | `/` | Root |

### Health

| Method | Path | Notes |
|---|---|---|
| GET | `/health` | AppController — basic liveness |

### Config (`api/config`)

| Method | Path | Notes |
|---|---|---|
| GET | `/api/config/public` | Public configuration |

### IAM Auth (`api/iam/auth`)

| Method | Path | Notes |
|---|---|---|
| POST | `/api/iam/auth/register` | Register new user |
| POST | `/api/iam/auth/login` | Login (password) |
| POST | `/api/iam/auth/login/mfa` | MFA login verification |
| POST | `/api/iam/auth/refresh` | Refresh access token |
| POST | `/api/iam/auth/logout` | Logout (single session) |
| POST | `/api/iam/auth/logout-all` | Logout all sessions |
| POST | `/api/iam/auth/change-password` | Change password |
| POST | `/api/iam/auth/forgot-password` | Forgot password |
| POST | `/api/iam/auth/reset-password` | Reset password |
| GET | `/api/iam/auth/me` | Current user profile |
| GET | `/api/iam/auth/tenants` | User's tenants |
| POST | `/api/iam/auth/tenant/switch` | Switch tenant |
| PATCH | `/api/iam/auth/profile` | Update profile |
| GET | `/api/iam/auth/sessions` | List sessions |

### IAM Users (`api/iam/users`)

| Method | Path | `@Permissions`? | Notes |
|---|---|---|---|
| GET | `/api/iam/users` | No | P0 — exposed to any authenticated user |
| POST | `/api/iam/users` | No | P0 |
| GET | `/api/iam/users/stats` | No | P0 |
| GET | `/api/iam/users/:id` | No | P0 |
| PATCH | `/api/iam/users/:id/status` | No | P0 |
| DELETE | `/api/iam/users/:id` | No | P0 |

### IAM Tenants (`api/iam/admin/tenants`)

| Method | Path | `@Permissions`? | Notes |
|---|---|---|---|
| GET | `/api/iam/admin/tenants` | No | P0 |
| POST | `/api/iam/admin/tenants` | No | P0 |
| GET | `/api/iam/admin/tenants/:id` | No | P0 |
| PATCH | `/api/iam/admin/tenants/:id` | No | P0 |
| POST | `/api/iam/admin/tenants/:id/status` | No | P0 |
| GET | `/api/iam/admin/tenants/:id/memberships` | No | P0 |
| POST | `/api/iam/admin/tenants/:id/memberships` | No | P0 |
| GET | `/api/iam/admin/tenants/:id/subscriptions` | No | P0 |
| DELETE | `/api/iam/admin/tenants/:id` | No | P0 |

### IAM Billing (`api/iam/billing`)

| Method | Path | `@Permissions`? | Notes |
|---|---|---|---|
| GET | `/api/iam/billing/plans` | No | P0 |
| POST | `/api/iam/billing/plans` | No | P0 |
| GET | `/api/iam/billing/plans/:id` | No | P0 |
| PATCH | `/api/iam/billing/plans/:id` | No | P0 |
| POST | `/api/iam/billing/plans/:id/activate` | No | P0 |
| POST | `/api/iam/billing/plans/:id/deprecate` | No | P0 |
| POST | `/api/iam/billing/plans/:id/archive` | No | P0 |
| POST | `/api/iam/billing/plans/:id/new-version` | No | P0 |
| POST | `/api/iam/billing/plans/:id/entitlements` | No | P0 |
| DELETE | `/api/iam/billing/plans/:planId/entitlements/:entitlementId` | No | P0 |
| GET | `/api/iam/billing/subscriptions` | No | P0 |
| POST | `/api/iam/business/subscriptions` | No | P0 |
| GET | `/api/iam/billing/subscriptions/:id` | No | P0 |
| POST | `/api/iam/billing/subscriptions/:id/activate` | No | P0 |
| POST | `/api/iam/billing/subscriptions/:id/change-plan` | No | P0 |
| POST | `/api/iam/billing/subscriptions/:id/suspend` | No | P0 |
| POST | `/api/iam/billing/subscriptions/:id/resume` | No | P0 |
| POST | `/api/iam/billing/subscriptions/:id/cancel` | No | P0 |
| POST | `/api/iam/billing/subscriptions/:id/renew` | No | P0 |
| GET | `/api/iam/billing/invoices` | No | P0 |
| GET | `/api/iam/billing/invoices/:id` | No | P0 |
| POST | `/api/iam/billing/invoices` | No | P0 |
| POST | `/api/iam/billing/invoices/:id/issue` | No | P0 |
| POST | `/api/iam/billing/invoices/:id/payments` | No | P0 |
| POST | `/api/iam/billing/invoices/:id/mark-overdue` | No | P0 |
| POST | `/api/iam/billing/invoices/:id/void` | No | P0 |
| GET | `/api/iam/billing/payments` | No | P0 |
| GET | `/api/iam/billing/payments/:id` | No | P0 |
| GET | `/api/iam/billing/payments/invoice/:invoiceId` | No | P0 |
| POST | `/api/iam/billing/payments` | No | P0 |
| POST | `/api/iam/billing/payments/:id/processing` | No | P0 |
| POST | `/api/iam/billing/payments/:id/succeed` | No | P0 |
| POST | `/api/iam/billing/payments/:id/fail` | No | P0 |
| POST | `/api/iam/billing/payments/:id/refund` | No | P0 |
| GET | `/api/iam/billing/entitlements/:subscriptionId` | No | P0 |
| GET | `/api/iam/billing/entitlements/:subscriptionId/:featureCode` | No | P0 |
| POST | `/api/iam/billing/entitlements/:subscriptionId/:featureCode/override` | No | P0 |
| DELETE | `/api/iam/billing/entitlements/:subscriptionId/:featureCode/override` | No | P0 |
| GET | `/api/iam/billing/entitlements/:subscriptionId/:featureCode/quota` | No | P0 |
| POST | `/api/iam/billing/entitlements/:subscriptionId/:featureCode/quota/consume` | No | P0 |
| GET | `/api/iam/billing/features` | No | P0 |
| GET | `/api/iam/billing/features/:code` | No | P0 |
| POST | `/api/iam/billing/features` | No | P0 |
| PATCH | `/api/iam/billing/features/:code` | No | P0 |
| POST | `/api/iam/billing/features/:code/deprecate` | No | P0 |
| POST | `/api/iam/billing/access/decide` | No | P0 |

> **P0 vulnerability:** All 26 IAM billing routes above are exposed to any authenticated user (not just admins). An attacker with a standard `user` role can enumerate subscriptions, invoices, payments, modify entitlements, activate/suspend/billing actions, and call the access-decision engine.

### IAM Observability (`api/iam`)

| Method | Path | `@Permissions`? | Notes |
|---|---|---|---|
| GET | `/api/iam/security/events` | No | P0 |
| PATCH | `/api/iam/security/events/:id` | No | P0 |
| GET | `/api/iam/observability/dashboard` | No | P0 |
| GET | `/api/iam/logs/search` | No | P0 |
| GET | `/api/iam/audit/search` | No | P0 |
| GET | `/api/iam/alerts/rules` | No | P0 |
| PATCH | `/api/iam/alerts/rules/:id` | No | P0 |
| GET | `/api/iam/alerts` | No | P0 |
| POST | `/api/iam/alerts/:id/acknowledge` | No | P0 |
| POST | `/api/iam/alerts/:id/resolve` | No | P0 |

### IAM Sessions (`api/iam/sessions`)

| Method | Path | `@Permissions`? | Notes |
|---|---|---|---|
| GET | `/api/iam/sessions` | No | P0 |
| DELETE | `/api/iam/sessions/:id` | No | P0 — can revoke any user's session |
| POST | `/api/iam/sessions/:id/revoke` | No | P0 |

### IAM Governance (`api/iam/admin/governance/roles`)

| Method | Path | `@Permissions`? | Notes |
|---|---|---|---|
| GET | `/api/iam/admin/governance/roles` | No | P0 |
| POST | `/api/iam/admin/governance/roles` | No | P0 |
| GET | `/api/iam/admin/governance/roles/:id` | No | P0 |
| PATCH | `/api/iam/admin/governance/roles/:id` | No | P0 |
| POST | `/api/iam/admin/governance/roles/:id/permissions/:permissionId` | No | P0 — grant arbitrary permissions |
| DELETE | `/api/iam/admin/governance/roles/:id/permissions/:permissionId` | No | P0 — revoke arbitrary permissions |
| POST | `/api/iam/admin/governance/roles/assignments/:id/revoke` | No | P0 |
| DELETE | `/api/iam/admin/governance/roles/:id` | No | P0 |

### Platform Business Manager (`api/business-manager`)

| Method | Path | Controller | Notes |
|---|---|---|---|
| GET | `/api/business-manager/dashboard` | PlatformController | Dashboard data |
| GET | `/api/business-manager/activity` | PlatformController | Activity feed |
| GET | `/api/business-manager/applications` | ApplicationsController | `findAll` — tenant scoped |
| POST | `/api/business-manager/applications` | ApplicationsController | `create` — tenant scoped |
| GET | `/api/business-manager/applications/:id` | ApplicationsController | `findOne` |
| PATCH | `/api/business-manager/applications/:id` | ApplicationsController | `update` |
| POST | `/api/business-manager/applications/:id/archive` | ApplicationsController | `archive` |
| GET | `/api/business-manager/applications/:applicationId/versions` | ApplicationVersionsController | Versions by app |
| POST | `/api/business-manager/applications/:applicationId/versions` | ApplicationVersionsController | Create version |
| GET | `/api/business-manager/versions` | ApplicationVersionsController | All versions |
| GET | `/api/business-manager/versions/:id` | ApplicationVersionsController | Version detail |
| PATCH | `/api/business-manager/versions/:id` | ApplicationVersionsController | Update version |
| POST | `/api/business-manager/versions/:id/clone` | ApplicationVersionsController | Clone version |
| POST | `/api/business-manager/versions/:id/status/:status` | ApplicationVersionsController | Status transition |
| GET | `/api/business-manager/configurations` | ConfigurationController | `findAll` |
| POST | `/api/business-manager/configurations` | ConfigurationController | `create` |
| GET | `/api/business-manager/configurations/effective/:applicationId/:applicationVersionId/:environmentId` | ConfigurationController | Effective config resolution |
| GET | `/api/business-manager/configurations/:id/history` | ConfigurationController | History |
| GET | `/api/business-manager/configurations/:scope/:scopeId` | ConfigurationController | By scope |
| PATCH | `/api/business-manager/configurations/:id` | ConfigurationController | Update |
| POST | `/api/business-manager/configurations/:id/activate` | ConfigurationController | Activate |
| POST | `/api/business-manager/configurations/:id/validate` | ConfigurationController | Validate |
| GET | `/api/business-manager/environments` | EnvironmentController | `findAll` |
| POST | `/api/business-manager/environments` | EnvironmentController | `create` |
| GET | `/api/business-manager/environments/:id` | EnvironmentController | `findOne` |
| PATCH | `/api/business-manager/environments/:id` | EnvironmentController | `update` |
| GET | `/api/business-manager/environments/:id/history` | EnvironmentController | History |
| POST | `/api/business-manager/contracts` | ContractController | Create contract |
| GET | `/api/business-manager/contracts` | ContractController | List contracts |
| GET | `/api/business-manager/contracts/:id` | ContractController | Contract detail |
| POST | `/api/business-manager/contracts/:id/validate` | ContractController | Validate |
| POST | `/api/business-manager/contracts/:id/lock` | ContractController | Lock |
| GET | `/api/business-manager/contracts/:id/history` | ContractController | History |
| GET | `/api/business-manager/contracts/:id/compatibility` | ContractController | Compatibility |
| POST | `/api/business-manager/snapshots` | SnapshotController | Create snapshot |
| GET | `/api/business-manager/snapshots` | SnapshotController | List snapshots |
| GET | `/api/business-manager/snapshots/compare` | SnapshotController | Compare snapshots |
| GET | `/api/business-manager/snapshots/:id/history` | SnapshotController | History |
| GET | `/api/business-manager/snapshots/:id` | SnapshotController | Detail |
| POST | `/api/business-manager/snapshots/:id/validate` | SnapshotController | Validate |
| POST | `/api/business-manager/snapshots/:id/activate` | SnapshotController | Activate |
| POST | `/api/business-manager/snapshots/:id/archive` | SnapshotController | Archive |

### Integration (`api/integrations`)

| Method | Path | Controller | Notes |
|---|---|---|---|
| GET | `/api/integrations/dashboard` | IntegrationController | |
| GET | `/api/integrations/activity` | IntegrationController | |
| GET | `/api/integrations/health` | IntegrationController | |
| GET | `/api/integrations/attention` | IntegrationController | |
| GET | `/api/integrations/connectors` | ConnectorController | List connectors |
| POST | `/api/integrations/connectors` | ConnectorController | Create connector |
| GET | `/api/integrations/connectors/:id` | ConnectorController | |
| PATCH | `/api/integrations/connectors/:id` | ConnectorController | |
| POST | `/api/integrations/connectors/:id/validate` | ConnectorController | |
| POST | `/api/integrations/connectors/:id/health` | ConnectorController | |
| POST | `/api/integrations/connectors/:id/activate` | ConnectorController | |
| POST | `/api/integrations/connectors/:id/disable` | ConnectorController | |
| POST | `/api/integrations/connectors/:id/archive` | ConnectorController | |
| POST | `/api/integrations/apis` | ApiManagerController | Create API def |
| GET | `/api/integrations/apis` | ApiManagerController | List API defs |
| GET | `/api/integrations/apis/:id` | ApiManagerController | |
| PATCH | `/api/integrations/apis/:id` | ApiManagerController | |
| POST | `/api/integrations/apis/:id/transition` | ApiManagerController | |
| DELETE | `/api/integrations/apis/:id` | ApiManagerController | |
| POST | `/api/integrations/apis/versions` | ApiManagerController | Create version |
| GET | `/api/integrations/apis/code/:apiCode/version/:version` | ApiManagerController | |
| GET | `/api/integrations/webhooks` | WebhookController | List |
| POST | `/api/integrations/webhooks` | WebhookController | Create |
| GET | `/api/integrations/webhooks/:id` | WebhookController | |
| PATCH | `/api/integrations/webhooks/:id` | WebhookController | |
| POST | `/api/integrations/webhooks/:id/transition` | WebhookController | |
| DELETE | `/api/integrations/webhooks/:id` | WebhookController | |
| POST | `/api/webhooks/inbound/:code` | InboundWebhookController | Receive webhook |
| POST | `/api/webhooks/inbound/:code/outbound` | InboundWebhookController | |
| GET | `/api/webhooks/inbound/:code/deliveries` | InboundWebhookController | |
| POST | `/api/integrations/credentials` | CredentialsController | Create |
| GET | `/api/integrations/credentials` | CredentialsController | List |
| GET | `/api/integrations/credentials/:id` | CredentialsController | |
| PATCH | `/api/integrations/credentials/:id` | CredentialsController | |
| POST | `/api/integrations/credentials/:id/rotate` | CredentialsController | |
| POST | `/api/integrations/credentials/:id/disable` | CredentialsController | |
| POST | `/api/integrations/credentials/:id/archive` | CredentialsController | |
| POST | `/api/integrations/credentials/:id/test` | CredentialsController | |
| POST | `/api/integrations/credentials/:id/associate/:connectorId` | CredentialsController | |
| DELETE | `/api/integrations/credentials/:id` | CredentialsController | |
| POST | `/api/integrations/synchronizations` | SynchronizationController | Create |
| GET | `/api/integrations/synchronizations` | SynchronizationController | List |
| GET | `/api/integrations/synchronizations/:id` | SynchronizationController | |
| GET | `/api/integrations/synchronizations/:id/checkpoint` | SynchronizationController | |
| PATCH | `/api/integrations/synchronizations/:id` | SynchronizationController | |
| POST | `/api/integrations/synchronizations/:id/run` | SynchronizationController | |
| POST | `/api/integrations/synchronizations/:id/resume` | SynchronizationController | |
| POST | `/api/integrations/synchronizations/:id/pause` | SynchronizationController | |
| POST | `/api/integrations/synchronizations/:id/cancel` | SynchronizationController | |
| DELETE | `/api/integrations/synchronizations/:id` | SynchronizationController | |
| GET | `/api/integrations/diagnostics/logs` | DiagnosticsController | |
| GET | `/api/integrations/diagnostics/metrics` | DiagnosticsController | |
| GET | `/api/integrations/diagnostics/timeline/:traceId` | DiagnosticsController | |
| POST | `/api/erp-registry` | ErpRegistryController | Register ERP |
| GET | `/api/erp-registry` | ErpRegistryController | List ERPs |
| GET | `/api/erp-registry/:id` | ErpRegistryController | |
| PUT | `/api/erp-registry/:id` | ErpRegistryController | Update |
| DELETE | `/api/erp-registry/:id` | ErpRegistryController | |
| GET | `/api/erp-registry/code/:code` | ErpRegistryController | Lookup by code |

### ERP Adapter (`api/erp`)

42 routes covering ERP entities: adapters, clients, products, orders, stock, suppliers, quotes, invoices, payments, warehouses, shipments, documents, stock-movements, purchases, projects, agenda, product-variants, services, stock-transfers, inventories, stock-alerts, returns, promotions, cash-registers, expenses, reservations.

Every route has `@Permissions(ERP_READ)` (GET) or `@Permissions(ERP_WRITE)` (POST/PUT/DELETE). **These are correctly protected.**

### Data Runtime (`api/data-runtime`)

| Method | Path | Notes |
|---|---|---|
| GET | `/api/data-runtime/contract` | |
| GET | `/api/data-runtime/resources` | |
| POST | `/api/data-runtime/query` | |
| GET | `/api/data-runtime/resources/:resource` | |
| POST | `/api/data-runtime/execute` | |
| POST | `/api/data-runtime/validate` | |
| GET | `/api/data-runtime/history` | |
| GET | `/api/data-runtime/history/:traceId` | |
| GET | `/api/data-runtime/metrics` | |
| POST | `/api/data-runtime/bindings/:bindingId/resolve` | |
| GET | `/api/data-runtime/bindings/:bindingId/state` | |

### Automation (`api/automation`)

| Method | Path | Notes |
|---|---|---|
| GET | `/api/automation` | Automation dashboard |

### Deployment (`api/releases`, `api/deployments`, `api/deployment/environments`)

**Releases (`api/releases`):**

| Method | Path | Notes |
|---|---|---|
| POST | `/api/releases` | Create release |
| GET | `/api/releases` | List |
| GET | `/api/releases/:id` | Detail |
| POST | `/api/releases/:id/assemble` | Assemble |
| POST | `/api/releases/:id/validate` | Validate |
| POST | `/api/releases/:id/approve` | Approve |
| POST | `/api/releases/:id/publish` | Publish |
| POST | `/api/releases/:id/archive` | Archive |
| GET | `/api/releases/:id/history` | History |
| GET | `/api/releases/compare/:id1/:id2` | Compare |

**Deployments (`api/deployments`):**

| Method | Path | Notes |
|---|---|---|
| POST | `/api/deployments` | Create |
| GET | `/api/deployments` | List |
| GET | `/api/deployments/:id` | Detail |
| POST | `/api/deployments/:id/verify` | Verify |
| POST | `/api/deployments/:id/cancel` | Cancel |
| POST | `/api/deployments/:id/retry` | Retry |

**Deployment Environments (`api/deployment/environments`):**

| Method | Path | Notes |
|---|---|---|
| GET | `/api/deployment/environments` | List |
| POST | `/api/deployment/environments/promote` | Promote |
| GET | `/api/deployment/environments/:environmentId/status` | Status |
| POST | `/api/deployment/environments/:environmentId/lock` | Lock |
| POST | `/api/deployment/environments/:environmentId/unlock` | Unlock |
| GET | `/api/deployment/environments/:environmentId/drift` | Drift |

**Rollbacks (`@Controller()` root — uses full path in decorator):**

| Method | Path | Notes |
|---|---|---|
| GET | `/api/rollbacks` | List |
| GET | `/api/rollbacks/:id` | Detail |
| POST | `/api/deployments/:id/rollback` | Rollback deployment |
| POST | `/api/deployment/environments/:environmentId/rollback` | Rollback environment |

**Cockpit (`@Controller()` root — uses full path in decorator):**

| Method | Path | Notes |
|---|---|---|
| GET | `/api/deployment/dashboard` | |
| GET | `/api/deployment/cockpit` | |
| GET | `/api/releases/recent` | |
| GET | `/api/deployments/running` | |
| GET | `/api/deployments/activity` | |
| GET | `/api/deployment/health` | |

**Deployment Diagnostics (`api/deployments`):**

| Method | Path | Notes |
|---|---|---|
| GET | `/api/deployments/history` | |
| GET | `/api/deployments/history/timeline/:deploymentId` | |
| GET | `/api/deployments/diagnostics` | |
| GET | `/api/deployments/diagnostics/:deploymentId` | |

**Gates (`api/deployments/:id/gates`):**

| Method | Path | Notes |
|---|---|---|
| GET | `/api/deployments/:id/gates` | List gates |
| POST | `/api/deployments/:id/gates/evaluate` | Evaluate |
| POST | `/api/deployments/:id/gates/:gateId/approve` | Approve gate |
| POST | `/api/deployments/:id/gates/:gateId/bypass` | Bypass gate |

---

## Frontend Service → API Wiring

| Frontend Service | API Base | Endpoints Called |
|---|---|---|
| `authService.js` | `authApi` (`/api/iam`) | login, refresh, me, logout, register |
| `platformApplicationsService.js` | `api` (`/api`) | `/business-manager/applications[/:id][/archive]` |
| `platformConfigService.js` | `api` (`/api`) | `/business-manager/configurations[...]`, `/effective/:appId/:verId/:envId` |
| `platformEnvironmentsService.js` | `api` (`/api`) | `/business-manager/environments[...]` |
| `deploymentService.js` | `api` (`/api`) | `/releases[...]`, `/deployments[...]` |
| `erpService.js` | `api` (`/api`) | `/erp/adapters`, `/erp/clients`, `/erp/products`, `/erp/orders`, `/erp/stock`+`/:productId`, `/erp/invoices`, `/erp/payments`, `/erp/warehouses`, `/erp/shipments`, `/erp/documents`, `/erp/purchases`, `/erp/projects`, `/erp/agenda`, `/erp/product-variants`, `/erp/services`, `/erp/inventories`, `/erp/stock-alerts`, `/erp/returns`, `/erp/promotions`, `/erp/cash-registers`, `/erp/expenses`, `/erp/reservations` |

## Stale Documentation Notice

The existing `docs/business-manager/BM_API_ROUTE_MATRIX.md` and `docs/business-manager/BM_CDC_IMPLEMENTATION_MATRIX.md` reference API paths under `/api/platform/*` (e.g., `/api/platform/applications`, `/api/platform/config`, `/api/platform/envs`, `/api/platform/contracts`, `/api/platform/snapshots`). **These paths DO NOT EXIST in the current codebase.** The actual controllers use `/api/business-manager/*`. These audit documents are **stale** and must be updated to reflect the consolidated route scheme.

## CDC Traceability

| CDC | Required Endpoints (from BM_CDC_IMPLEMENTATION_MATRIX) | Status |
|---|---|---|
| BM-CDC-01 | `/business-manager/applications` | IMPLEMENTED (prefix renamed from `/platform`) |
| BM-CDC-02 | `/business-manager/versions`, `/business-manager/applications/:id/versions` | IMPLEMENTED (prefix renamed) |
| BM-CDC-03 | `/business/data-models` | MISSING |
| BM-CDC-04 | `/business/features`, `/business/capabilities` | MISSING |
| BM-CDC-05 | `/business/navigation` | MISSING |
| BM-CDC-06 | `/business-manager/configurations` | IMPLEMENTED (prefix renamed) |
| BM-CDC-07 | `/business-manager/contracts`, `/business-manager/snapshots`, `/business/integrations/bindings`, `/business/contracts/contributors`, `/business/adapters/:key/test-connection` | Partial — contracts/snapshots exist; contributors, bindings, manifest, resolvers MISSING |
| BM-CDC-08 | `/business/quality/campaigns`, `/business/quality/validate`, `/business/quality/gate` | MISSING |
