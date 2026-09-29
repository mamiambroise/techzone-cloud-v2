# Report 01: Repository & Branch Inventory

**Audit Scope:** Comparative audit of local project vs 3 external repos
**Status:** COMPLETE
**Date:** 2026-09-29

---

## 1.1 Local Project

| Property | Value |
|----------|-------|
| Repository | `https://github.com/mamiambroise/techzone-cloud-v2` |
| Local Path | `D:\wifi zone\ERP\techcloud\techcloud` |
| Architecture | Single NestJS backend + Single React frontend (consolidated) |
| Backend Port | 3003 (`/api/*`) |
| Frontend Port | 3000 (proxies `/api/iam` and `/api` → :3003) |
| Database | PostgreSQL, schema `business_manager` |
| ORM | Prisma 7 |
| Framework | NestJS 12, TypeScript 6 |
| Frontend | React 19, Vite 6.2, TailwindCSS |
| Latest Commit | `e59c073f` — chore: consolidate Techzone Cloud into React + NestJS architecture (2026-09-27) |
| Security Model | IamJwtGuard + IamPermissionGuard + IamPermissionsGuard + TenantGuard; helmet; CORS via `CORS_ORIGIN`; no cross-site POST permitted |
| Proxy | `vite.config.ts` maps `/api/iam` and `/api` → `http://localhost:3003` |

### Local Directory Structure

| Path | Description |
|------|-------------|
| `backend/` | Canonical NestJS backend |
| `backend/src/app.module.ts` | Root module — registers: iam, platform, business-manager, integration, deployment, erp-registry, erp-adapter, data-runtime, automation |
| `backend/src/main.ts` | Security bootstrap (helmet, CORS, body-parser, IamJwtGuard, TenantGuard) |
| `backend/src/iam/` | IAM module — 14 controllers (auth, users, identities, sessions, mfa, config, health, context, policies, tenants, billing, observability, profile, governance, admin-users) |
| `backend/prisma/schema.prisma` | Canonical Prisma schema — 3416 lines, ~90+ models |
| `frontend/` | Canonical React frontend |
| `frontend/src/app/navigationConfig.js` | 4 sections (Platform, Conception, ERP & RUNTIME, LIVRAISON), 11 nav groups, Packs marked ComingSoon |
| `frontend/src/app/routes.js` | 18 route definitions (bm, ui, automation, packs, erp, billing, iam, observability, settings, dashboard) |
| `frontend/src/services/apiClient.js` | Axios client — base URLs `/api` and `/api/iam` |
| `frontend/src/components/Sidebar.jsx` | Driven by navigationConfig |
| `frontend/src/components/ContextBar.jsx` | Context bar (environment + tenant selector) |
| `frontend/src/features/iam-demo/` | IAM demo pages using mock data |
| `bm/` | BM-CDC documents (BM-CDC-00 through BM-CDC-08) |
| `PM/` | Pack Manager documentation |
| `PR/` | Pack Runtime documentation |
| `techzone/` | Legacy PHP/Dolibarr ERP — DO NOT MODIFY |
| `docs/` | Existing documentation and audit reports |
| `scripts/` | Orchestration and diagnostic scripts |

### Local Backend Modules (in `backend/src/`)

| Module | Path | Status |
|--------|------|--------|
| IAM | `iam/` | FULLY IMPLEMENTED — 14 controllers, all with NestJS guards |
| Platform | `modules/platform/` | FULLY IMPLEMENTED — applications, versions, environments, contracts, config, snapshots |
| Business Manager | `modules/business-manager/` | FULLY IMPLEMENTED — contracts, data-model, features, navigation, quality, runtime |
| Integration | `modules/integration/` | FULLY IMPLEMENTED — api-manager, contracts, credentials, diagnostics, synchronizations, webhooks |
| Deployment | `modules/deployment/` | FULLY IMPLEMENTED — cockpit, deployments, environments, gates, release, rollback |
| ERP Registry | `erp-registry/` | FULLY IMPLEMENTED |
| ERP Adapter | `erp-adapter/` | FULLY IMPLEMENTED — Dolibarr adapter + mock adapter |
| Data Runtime | `data-runtime/` | FULLY IMPLEMENTED — query-engine, execution-engine, validation, erp-adapter-provider |
| Automation | `automation/` | FULLY IMPLEMENTED — action, conditions, rules, trigger, workflow engines |

### Local Test Coverage

| Location | Test Files | Framework |
|----------|-----------|-----------|
| `backend/src/` | 39 `.spec.ts` files | Jest |
| `frontend/src/` | 9 test files (`.test.js`, `.test.jsx`) | Vitest + happy-dom |

### Local IAM Controller Routes (15 controllers)

| Controller File | Route Prefix | Method Summary |
|-----------------|-------------|----------------|
| `iam-auth.controller.ts` | `api/iam/auth` | login, logout, refresh, verify, password reset, mfa verify |
| `iam-users.controller.ts` | `api/iam/users` | CRUD users, search, status |
| `iam-identities.controller.ts` | `api/iam/identities` | CRUD identities |
| `iam-sessions.controller.ts` | `api/iam/sessions` | CRUD sessions, revoke |
| `iam-mfa.controller.ts` | `api/iam/mfa` | setup, verify, disable |
| `iam-config.controller.ts` | `api/iam/config` | get/set config |
| `iam-health.controller.ts` | `api/iam/health` | health check |
| `iam-context.controller.ts` | `api/iam/context` | resolve context |
| `iam-policies.controller.ts` | `api/iam/policies` | CRUD policies |
| `iam-tenants.controller.ts` | `api/iam/admin/tenants` | CRUD tenants (admin) |
| `iam-billing.controller.ts` | `api/iam/billing` | billing info |
| `iam-observability.controller.ts` | `api/iam` | logs, audit, security events, metrics |
| `iam-profile.controller.ts` | `api/iam` | profile get/update |
| `iam-governance.controller.ts` | `api/iam/admin/governance/roles` | role CRUD (admin) |
| `iam-admin-users.controller.ts` | `api/iam/admin/users` | admin user management |

---

## 1.2 jasmina-bm Remote (`https://github.com/Jasmina123-ask/business-manager.git`)

| Branch | Last Commit | Date | Description |
|--------|------------|------|-------------|
| `main` | `0e7df3f7` | 2026-09-09 | Basic Business Manager only — no pack-manager, no pack-runtime |
| `develop` | `4007b49d` | 2026-09-13 | Includes pack-manager and pack-runtime modules |
| `Mami` | `91865b40` | 2026-09-04 | **MOST COMPLETE** — Backend + Frontend with pack-manager, pack-runtime, TypeORM entities, Prisma pack models |
| `avosoa` | `4ddae5b3` | — | CDC 06 et 07 |
| `avotra` | — | — | Mid-stage |
| `belhardo` | `92fd71c7` | — | Enlevement des emojis |

### jasmina-bm/Mami Structure

**Backend (`Backend/`):**
- NestJS + TypeORM entities (`erp/` directory with business-manager entities)
- Prisma schema with pack-manager models (pm_packs, pm_pack_versions, etc.)
- Modules: `pack-manager` (PackManagerController, pack CRUD, versions, modules, features, capabilities, dependencies, rules, validation, manifest, publish), `pack-runtime` (Manifest Loader, Runtime Resolver, Effective Manifest, Context, cache, diagnostics, resilience)
- **Uses BOTH TypeORM and Prisma** — TypeORM for business-manager ERP entities, Prisma for pack models

**Frontend (`Frontend/`):**
- React 19 + Vite 6
- `navigationConfig.js` — module-based: `design.bm`, `design.pm`, `runtime.pr`, etc.
- `pack-manager` views: PackManagerCockpitView, PackList/CatalogView, PackEditorView, ModuleEditorView, FeatureEditorView, CapabilityEditorView, DependencyEditorView, RuleEditorView, ValidationEditorView, ManifestView, PublishView, SnapshotView
- `pack-runtime` views: RuntimeCockpitView (8 modes: overview, context, resolver, manifest, status, cache, diagnostics, api), FeatureCatalogView, CapabilitiesView, ModuleCatalogView, DependencyResolverView, ManifestInspectionView, ContextManagementView, DiagnosticsView, CacheManagementView, ApiContractsView
- **Full implementation** of all pack-manager and pack-runtime features

### jasmina-bm/develop Structure (earlier than Mami)
- Same modules but without pack-manager and pack-runtime
- Basic business-manager backend and frontend only

---

## 1.3 jasmina Remote (`https://github.com/Jasmina123-ask/team4-platform-api-deployment.git`)

| Branch | Last Commit | Date | Description |
|--------|------------|------|-------------|
| `main` | `e70949c9` | 2026-09-01 | Skeleton only — "chore: initialize team 4 project" |
| `develop` | `7cd8ffaebb` | 2026-09-13 | Team 4 codebase — platform, integration, deployment modules + Prisma |
| `avotra` | — | — | Branch |
| `orion` | — | — | Billing Tenant, OBS |
| `Belhardo` | — | — | Branch |

### jasmina/develop Structure

**Backend:**
- NestJS + Prisma
- Modules: platform, integration, deployment ONLY
- NO IAM module, NO business-manager core, NO data-runtime, NO erp-adapter, NO automation

**Frontend:**
- React 19 + Vite
- Similar structure to local but simpler navigation

---

## 1.4 taratra31 Remote (`https://github.com/taratra31/techcloud.git`)

| Branch | Last Commit | Date | Description |
|--------|------------|------|-------------|
| `main` | `e80363ed` | 2026-09-12 | Auth_AIM — Express.js backend + React frontend; IAM/Billing/Admin/OBS complete |
| `ERP-full` | `33f78908` | 2026-09-08 | Auth_AIM + new erp-adapter-platform (NestJS); automation, data-runtime, erp-adapter |
| `Lianah` | `ef8b1e4f` | 2026-09-13 | Auth_AIM with more complete Express frontend — Admin/Billing/OBS/IAM pages with CSS |
| `Back_ERP` | — | — | Legacy Express backend only |
| `Front_Auth` | — | — | Legacy Express frontend only |
| `back_Auth` | — | — | Legacy Express backend auth only |
| `Nassa` | — | 2026-09-27 | Full IAM/Billing/Admin/OBS with additional billing features |

### taratra31/main (Auth_AIM) — Express.js Legacy

**Backend:**
- Express.js (NOT NestJS) — **legacy technology**
- 18 route files: `/auth`, `/context`, `/observability`, `/logs`, `/audit`, `/alerts`, `/mfa`, `/security`, `/billing/*`, `/admin/*`, `/access-decision`, `/entitlements`, `/features`
- Full IAM Prisma schema (iamUsers, iamIdentities, iamSessions, iamOrganizations, iamTenants, iamPolicies, iamRoles, iamPermissions, iamAuditLogs, iamSecurityEvents, iamMfa, iamApiKeys, iamServiceAccounts, iamServiceAccountKeys, billingPlans, billingSubscriptions, billingInvoices, billingPayments, etc.)

**Frontend:**
- React + Vite
- `main` branch App.jsx: `function App() { return <h1>Hello React</h1> }` — **skeleton only**

### taratra31/Lianah — Auth_AIM Express + Rich Frontend

**Backend:** Same Express.js Auth_AIM backend
**Frontend:** Most complete frontend with:
- Components: Header, Layout (AdminLayout), Topbar, UserDetailPanel, DonutChart, LineChart, SectionIcon
- Auth: LoginForm, ProtectedRoute
- Observability components: ConfirmationModal, DataTable, DetailPanel, EmptyState, ErrorState, FilterBar, KpiCard, LoadingState, SearchBar, SeverityBadge, StatusBadge, Timeline, useToast
- Pages (35+): Dashboard, Login, IAM Overview, Users, Identities, IdentityLinks, IdentityGroups, Organisations, Tenants, Roles, Policies, Sessions, Contexts, Invitation
- Admin pages (8): Overview, Users, OrganisationsTenants, AccessGovernance, Delegation, SecurityAudit, Monitoring, AdminActions
- Billing pages (8): Overview, Plans, Subscriptions, Invoices, Payments, Webhooks, Entitlements, AccessRules, Features
- Observability pages (6): Overview, Logs, Audit, SecurityEvents, Monitoring, AlertManager
- **Uses mock data services** (`adminActionsMockService`, `adminMonitoringMockService`)

### taratra31/Nassa — Auth_AIM + Billing enhancements

**Backend:** Same Express.js Auth_AIM backend with additional billing commits
**Frontend:** Same as Lianah (same files), possibly with minor billing additions

### taratra31/ERP-full — NestJS erp-adapter-platform

**Backend (NestJS):**
- Located at `new erp-adapter-platform/`
- Automation controller (`@Controller('automation')`)
- Data-runtime module
- ERP registry + adapters
- Simpler IAM Prisma schema (IamUser, IamCredential, IamSession, ERPRegistry/IamSession without tenantId) — **NO tenant isolation**

**Frontend (React + Vite):**
- Components: Header, Layout, Sidebar
- Pages: Dashboard, ERPCreate, ERPEdit, ERPList — **simpler** than Lianah
- 18 routes in App.jsx

---

## 1.5 Local Backend Module Matrix (all in single NestJS app)

| Module | Path | Controllers | Services | Prisma Models | Tests |
|--------|------|------------|----------|---------------|-------|
| IAM | `iam/` | 14 | 10+ | iamUser, iamSession, iamCredential, iamOrganization, iamTenant, iamRole, iamPermission, iamPolicy, iamMfa, iamApiKey, iamServiceAccount | 5 spec files |
| Platform | `modules/platform/` | 5 | 6+ | PlatformApplication, Environment, etc. | 4 spec files |
| Business Manager | `modules/business-manager/` | 5 | 8+ | bm_*, contracts | 7 spec files |
| Integration | `modules/integration/` | 6 | 8+ | integration_*, connector_*, webhook_* | 7 spec files |
| Deployment | `modules/deployment/` | 6 | 8+ | deployment_*, release_*, rollback_*, gate_*, environment_*, cockpit_* | 6 spec files |
| ERP Registry | `erp-registry/` | 1 | 1 | erp_registry | 0 |
| ERP Adapter | `erp-adapter/` | 1 | 1 | — | 2 spec files |
| Data Runtime | `data-runtime/` | 3 | 5+ | — | 4 spec files |
| Automation | `automation/` | 1 | 5+ | automation_*, rule_*, workflow_*, trigger_*, condition_*, action_* | 5 spec files |

---

## 1.6 Key Branch Timeline

```
2026-09-01: jasmina/main — skeleton init
2026-09-04: jasmina-bm/Mami — most complete BM+PM+PR (frozen)
2026-09-08: taratra31/ERP-full — NestJS ERP adapter (last activity)
2026-09-09: jasmina-bm/main — basic BM merge
2026-09-12: taratra31/main — Express.js IAM complete
2026-09-13: jasmina-bm/develop — BM+PM+PR merge
2026-09-13: jasmina/develop — Team 4 platform complete
2026-09-13: taratra31/Lianah — rich Express frontend complete
2026-09-27: LOCAL main — consolidation complete
```

## 1.7 Remote Git Configuration

| Remote Name | URL | Purpose |
|-------------|-----|---------|
| `origin` | `https://github.com/mamiambroise/techcloud-cloud-v2` (local) | Canonical project |
| `jasmina-bm` | `https://github.com/Jasmina123-ask/business-manager.git` | Business Manager + Pack Manager + Pack Runtime (Team 3+4) |
| `jasmina` | `https://github.com/Jasmina123-ask/team4-platform-api-deployment.git` | Platform + Integration + Deployment (Team 4) |
| `taratra31` | `https://github.com/taratra31/techcloud.git` | IAM/Billing/Admin/OBS + ERP/Data/Automation (Team 1+2) |

## 1.8 Local Branch Inventory

| Branch | Last Commit | Description |
|--------|------------|-------------|
| `main` | `e59c073f` | CURRENT — full consolidation (2026-09-27) |
| `ERP-full` | — | Remote tracking from taratra31 |
| `Back_ERP` | — | Remote tracking from taratra31 |
| `Front_Auth` | — | Remote tracking from taratra31 |
| `Nassa` | — | Remote tracking from taratra31 |
| `Lianah` | — | Remote tracking from taratra31 |
| `back_Auth` | — | Remote tracking from taratra31 |
| `backup/pre-consolidation-20260926` | `b83cd79` | Pre-consolidation snapshot |
| `early-circle` | — | Auxiliary |
| `pentagonal-appendix` | — | Auxiliary |
| `quick-rudbeckia` | — | Auxiliary |

## 1.9 Summary Assessment

| Repository/Branch | Architecture | Security | Completeness | Recommendation |
|-------------------|-------------|----------|--------------|----------------|
| **Local `main`** | NestJS + React (canonical) | IamJwtGuard + TenantGuard + helmet + CORS | ALL 9 modules fully implemented | **CANONICAL — SOURCE OF TRUTH** |
| `jasmina-bm/Mami` | NestJS + TypeORM + Prisma + React | Unknown | BM + PM + PR fully implemented | PM/PR modules: IMPROVE_CURRENT |
| `jasmina/develop` | NestJS + Prisma + React | Unknown | Platform/Integration/Deployment only | Code consolidated (already in local) |
| `taratra31/Lianah` | Express.js + React | Express-based (less secure) | IAM/Billing/Admin/OBS rich frontend | UI components: KEEP_CURRENT reference |
| `taratra31/ERP-full` | NestJS + React | Simpler IAM (no tenant) | ERP adapter + automation + data-runtime | Architecture reference only |
| `taratra31/main` | Express.js + React | Express-based (less secure) | IAM complete, frontend is skeleton | DO NOT IMPORT (Express backend) |

---

*Report generated: 2026-09-29 00:15 UTC*
*No files were modified. This is a read-only audit.*