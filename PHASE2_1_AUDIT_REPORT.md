# Phase 2.1 — Frontend Architecture Audit & Migration Plan

**Status**: Complete
**Scope**: Frontend-only (backends frozen per Phase 1B.5 validation)
**Date**: 2026-09-23
**Canonical Target**: `frontend/` (root)

---

## 0. Executive Summary

4 separate React frontend applications exist in this monorepo, creating:
- 4 independent dev servers (5181/3007/3100/5180 + 3001)
- 3 separate authentication systems (all storing tokens in localStorage)
- 3 separate sidebars with duplicate menu entries
- 3 separate router systems (Redux tabs, React Router v6, React Router v7)
- 1 critical security vulnerability: ERP tokens passed via URL query params in iframe
- Dependency fragmentation (React 18/19, Router v6/v7, 2 Heroicons versions, Tailwind v3/v4)

**Recommendation**: Consolidate all capabilities into the canonical `frontend/` project (React 19 + Vite + Redux Toolkit + Tailwind v4). Migrate ERP + IAM pages as routed sections. Implement single HttpOnly-cookie auth with withCredentials. Eliminate iframe entirely.

---

## 1. Canonical Frontend: `frontend/`

| Property | Value |
|----------|-------|
| Path | `frontend/` |
| Package name | `react-example` |
| Port | 3001 (`vite --port=3001`) |
| Git status | Tracked (commits: "testd", "correction page blanc", "correction db") |
| Framework | React 19.0.1 + Vite 6 + Redux Toolkit 2 + TailwindCSS v4 + lucide-react |
| Router | None — Redux `activeTab`-based tab navigation |
| Auth | **NONE** — no auth.js, no AuthContext, no LoginPage, no AuthGate |
| API layer | `api/` (16 modules) + `utils/api.js` (minimal health check) |
| Sidebar | `components/Sidebar.jsx` — 3-layer (PF/API/DEP) with PF_SUBSECTIONS, API_SUBSECTIONS, DEP_SUBSECTIONS |
| Layout | Header + Sidebar + SubNavBar + ToastContainer (footer commented out) |
| Store slices | 9: platform, applications, environments, contracts, config, snapshots, audit, integration, deployment |

### 1.1 Capabilities (27 components + 18 subdirectory views)

**Platform Foundation (module '01')**:
- GeneralOverviewView (overview tab)
- ApplicationsCatalogView (applications tab)
- WorkspaceConfigView (workspace tab)
- VersionsDetailView (versions tab)
- PackValidationCockpitView (validation tab)
- PublicationView (publication tab)
- HistoryRollbackView (history tab)
- SpecificationsView (specifications tab)
- CockpitView (cockpit tab)
- EnvironmentsView (environments tab)
- ContractsView (contracts tab)
- ConfigurationView (config tab)
- SnapshotsView (snapshots tab)
- PlatformContractView (platform-contract / contract-v1 tab)

**API Integration Layer (module 'api-layer')**:
- IntegrationsView (integrations tab, renders IntegrationCockpitView, ConnectorManagerView, ApiManagerView, CredentialsManagerView, WebhookManagerView, SyncManagerView)

**Deployment Layer (module 'dep-layer')**:
- DeploymentPublicationView (deployment tab)
- Full sub-components: DeploymentCockpitView, DeploymentContractsV1View, DeploymentDiagnosticsView, DeploymentPublicationView, PipelinesManagerView, PromotionGatewaysView, ReleaseManagerView, RollbackRecoveryView

**Common/Modal**:
- Header, GlobalSearch, CreateAppModal, CreateSnapshotModal, AuditLogModal, StaleDataBanner

### 1.2 API modules (16 files in `api/`)
```
api/client.js                — base fetch client
api/apisApi.js               — exposed API management
api/connectorsApi.js         — external connectors
api/credentialsApi.js        — credentials & secrets
api/diagnosticsApi.js        — logs & diagnostics
api/synchronizationsApi.js   — sync management
api/webhooksApi.js           — webhook management
api/platform/applicationsApi.js
api/platform/configApi.js
api/platform/environmentsApi.js
api/deployment/deploymentApi.js
api/deployment/deploymentDiagnosticsApi.js
api/deployment/deploymentsApi.js
api/deployment/environmentDeploymentApi.js
api/deployment/gatesApi.js
api/deployment/rollbackApi.js
```
**MISSING**: No auth/IAM API endpoints, no ERP API endpoints.

---

## 2. Source Frontend A: `team4-platform-api/frontend/` (Submodule)

| Property | Value |
|----------|-------|
| Path | `team4-platform-api/frontend/` |
| Git status | Git submodule (commit 804bb4d401a98b4a6999f7980e66ce77798824ea) |
| Port | 3007 (active BUSINESS shell per `dev-all.mjs`) |
| Framework | React 19 + Vite + Redux Toolkit + TailwindCSS v4 + lucide-react |
| Router | None — Redux tab navigation (identical structure to canonical) |
| Auth | `auth.js` — localStorage(`iam_token`, `iam_refresh_token`, `iam_user`) |
| API | `utils/api.js` — fetch + Bearer token from localStorage |
| Sidebar | Identical 3-layer (PF/API/DEP) + **ERP section** (`erp`, `erp-runtime` tabs) |
| Components | Platform cockpit views + `ErpEmbedView.jsx` (iframe) |

### 2.1 Unique Capabilities to Migrate
1. **Auth system** (`auth.js`): `iamLogin`, `iamForgotPassword`, `iamLogout`, `importTokenFromUrl`, `isAuthenticated`, `clearSession`
   - ⚠️ Stores JWT access + refresh tokens in **localStorage** — violates target constraint
2. **AuthGate in main.jsx**: wraps App with login gate, calls `importTokenFromUrl()` to extract tokens from URL
   - ⚠️ `importTokenFromUrl` reads `iam_token` from URL query params — vulnerability to migrate
3. **LoginPage.jsx**: login + forgot password UI
4. **ErpEmbedView.jsx**: renders `<iframe src="http://localhost:3100?...">` passing tokens via URL
   - ⚠️ **Critical vulnerability**: token leak via URL query params + iframe to separate origin
   - This is the ERP console integration to be **replaced** with native routes

### 2.2 What NOT to migrate
- The iframe-based ERP integration (replace with native routes from ERP Console)
- The localStorage JWT token storage (replace with HttpOnly cookies)
- The `importTokenFromUrl` mechanism (remove token-in-URL pattern)

---

## 3. Source Frontend B: `new erp-adapter-platform/frontend/` (ERP Console)

| Property | Value |
|----------|-------|
| Path | `new erp-adapter-platform/frontend/` |
| Git status | Tracked |
| Port | 3100 (ERP Console per `dev-all.mjs`) |
| Framework | React 18.2 + CRA (react-scripts) + TailwindCSS v3 + @heroicons/react v2 |
| Router | React Router DOM v6 (BrowserRouter) |
| Auth | `auth/AuthContext.jsx` + `auth/ProtectedRoute.jsx` — axios withCredentials, localStorage for `iam_user` + `iam_device_fingerprint` only |
| API | `services/api.js` — axios + withCredentials, 2 axios instances (ERP API :3002, IAM API :5001), normalizeError with ERP-specific error types |
| Sidebar | `components/Sidebar.jsx` — router-based, dark mode |
| Theme | `ThemeContext.jsx` — dark/light mode |
| Layout | `components/Layout.jsx` — Sidebar + Header + Footer, responsive drawer |

### 3.1 Auth System to Migrate (Adapt)
- `iamTokenStore`: `access()` returns null (tokens via HttpOnly cookies), `getUser()` reads from localStorage (user profile only, not tokens), `setUser/clear` for user profile
- `AuthContext.jsx`: boots via `iamAuthService.me()` (HttpOnly cookie), listens for `iam:unauthorized` event
- `ProtectedRoute.jsx`: checks `user` state, redirects to `/login` if unauthenticated, shows spinner during loading
- ⚠️ Still stores `iam_user` (user profile) in localStorage — should migrate to HttpOnly cookie-backed session
- ✅ Already uses `withCredentials: true` — preserves for canonical

### 3.2 API Client to Migrate (Adapt)
Full `services/api.js` (353 lines) with:
- 2 axios instances: `api` (ERP API `:3002/api`, withCredentials), `authAimApi` (IAM API `:5001/api`, withCredentials)
- `normalizeError()`: maps HTTP errors to structured types (UNAUTHORIZED, FORBIDDEN, ERP_NOT_CONFIGURED, ERP_UNAVAILABLE, ERP_PROVIDER_REQUIRED, ERP_PROVIDER_UNSUPPORTED, ERROR) — extracts `x-trace-id` header
- Services: `iamAuthService` (login, register, refresh, logout, logoutAll, changePassword, forgotPassword, resetPassword, me, updateProfile, sessions, getPublicConfig), `iamAdminService`, `erpRegistryService`, `clientService`, `productService`, `orderService`, `stockService`, `supplierService`, `quoteService`, `invoiceService`, `paymentService`, `warehouseService`, `shipmentService`, `documentService`, `stockMovementService`, `purchaseService`, `productVariantService`, `serviceService`, `stockTransferService`, `inventoryService`, `stockAlertService`, `returnService`, `promotionService`, `cashRegisterService`, `expenseService`, `reservationService`, `projectService`, `agendaService`, `statsService`, `healthService`, `userService`, `dataRuntimeService`, `automationService` (cockpit, contract, rules, activeRules, evaluateRules, simulateRule, workflows, startWorkflow, executions, triggers, processEvent, fireTrigger, evaluateCondition, simulateCondition, history, metrics)

### 3.3 ERP Pages (23 routes)

| Route | Page | Capability |
|-------|------|-----------|
| `/login` | Login | Login form (uses `iamAuthService.login`) |
| `/reset-password` | ResetPassword | Password reset via token in URL (?token=) |
| `/` | Dashboard | ERP overview with stats, health, quick actions |
| `/erps` | ERPList | ERP registry list with provider selection |
| `/erps/create` | ERPCreate | Create new ERP instance |
| `/erps/edit/:id` | ERPEdit | Edit ERP instance |
| `/data-runtime` | DataRuntime | Runtime query, validate, execute |
| `/data-runtime/history` | DataRuntimeHistory | Trace history with traceId lookup + metrics |
| `/automation` | AutomationCockpit | Automation dashboard (cockpit + contract) |
| `/automation/rules` | AutomationRules | Rules list + evaluation simulator |
| `/automation/workflows` | AutomationWorkflows | Workflows list + execution |
| `/automation/triggers` | AutomationTriggers | Triggers list + fire + event simulation |
| `/automation/conditions` | AutomationConditions | Condition evaluator + simulator |
| `/automation/history` | AutomationHistory | Execution history + metrics |
| `/erp/:moduleKey` | ErpModule | Generic CRUD for 24 modules (param-driven) |
| `/mapping` | Mapping | Field mapping matrix (bidirectional sync config) |
| `/adapters` | Adapters | Adapter health + stats + ERP registry |
| `/settings` | Settings | Theme (dark/light), user preferences |
| `/iam` | IamOverview | IAM overview |
| `/iam/users` | IamUsers | IAM users list |
| `/iam/sessions` | IamSessions | IAM sessions list |
| `/iam/profile` | IamProfile | IAM profile |

### 3.4 ERP Modules (24 in `modulesConfig.js`)

| Key | Title | Service | CRUD |
|-----|-------|---------|------|
| clients | Clients | clientService | ✅ create |
| products | Produits | productService | ✅ create |
| product-variants | Variantes | productVariantService | ✅ create |
| services | Services | serviceService | ✅ create |
| orders | Commandes | orderService | ✅ create, lines |
| quotes | Devis | quoteService | ✅ create, lines |
| invoices | Factures | invoiceService | ✅ create, lines |
| payments | Paiements | paymentService | ❌ read-only (Dolibarr API limitation) |
| suppliers | Fournisseurs | supplierService | ✅ create |
| warehouses | Entrepots | warehouseService | ✅ create |
| shipments | Expéditions | shipmentService | ✅ create |
| documents | Documents | documentService | ✅ create |
| purchases | Achats | purchaseService | ✅ create, lines |
| stock-movements | Mouvements de stock | stockMovementService | ✅ create |
| stock-transfers | Transferts | stockTransferService | ✅ create |
| inventories | Inventaires | inventoryService | ✅ create |
| stock-alerts | Alertes stock | stockAlertService | ✅ create |
| returns | Retours | returnService | ✅ create |
| promotions | Promotions | promotionService | ✅ create |
| cash-registers | Caisses | cashRegisterService | ✅ create |
| expenses | Dépenses | expenseService | ✅ create |
| reservations | Réservations | reservationService | ✅ create |
| projects | Projets | projectService | ✅ create |
| agenda | Agenda | agendaService | ✅ create |

Each module config includes: `title`, `subtitle`, `icon` (Heroicons), `gradient` (Tailwind), `service`, `columns` (table display), `create` (boolean), `fields` (form schema with types: text/number/select/date/datetime-local), `lines` (sub-table support), `notice` (read-only warnings).

**Key capability**: The `ErpModule.jsx` page is a **generic CRUD renderer** driven entirely by `modulesConfig.js` — no per-module page code needed. This is the pattern to migrate.

### 3.5 Components to Migrate
- `components/Loaders.jsx` — ModernSpinner, TableSkeleton (shared loading states)
- `components/ui/ToastProvider.jsx` — React Context-based toast system (success/error/info) with `useToast()` hook
- `components/Header.jsx` — router-aware top header (portrait/landscape, dark mode toggle)
- `components/Sidebar.jsx` — router-based sidebar with collapse, responsive drawer
- `auth/AuthContext.jsx`, `auth/ProtectedRoute.jsx` — auth context (adapt for HttpOnly)
- `erp/modulesConfig.js` — the single most valuable artifact (24 module definitions)
- `ThemeContext.jsx` — dark/light mode toggle

---

## 4. Source Frontend C: `Auth_AIM/frontend/` (IAM Console)

| Property | Value |
|----------|-------|
| Path | `Auth_AIM/frontend/` |
| Git status | Tracked |
| Port | 5180 (IAM Console per `dev-all.mjs`) |
| Framework | React 19 + Vite + CSS Modules (Sidebar.css, AdminLayout.css, LoginPage.css) |
| Router | React Router DOM v7 |
| Auth | `context/AuthContext.jsx` — localStorage(`iam_auth_session`), accessToken + refreshToken + session |
| API | `api/client.js` — fetch, `credentials: 'omit'`, Bearer from localStorage; `api/auth.js` — full auth lifecycle |
| Layout | `layouts/AdminLayout.jsx` — Sidebar + Topbar + Footer (live clock) |
| Sidebar | `components/Sidebar.jsx` — static `menuSections` array, CSS modules, 6 top-level sections |

### 4.1 Auth System (More complete than ERP Console)
- `AuthContext.jsx`: full session state with `user`, `accessToken`, `refreshToken`, `session`, `isAuthenticated`, `loading`, `mfaRequired`, `challengeToken`
- MFA support: `verifyMfaChallenge(challengeToken, mfaMethodId, code)`
- Session expiry check on every read (client-side)
- `useAuth()` hook with context validation
- ⚠️ Stores `accessToken` + `refreshToken` in **localStorage** — violates target constraint

### 4.2 API Client
- `api/client.js`: `apiRequest(path, options)` — fetch with `credentials: 'omit'`, Bearer from localStorage, structured error with `status`, `code`, `details`, `data`
- 401 handling: redirects to `/login` for `TOKEN_REUSE_DETECTED`, `SESSION_REVOKED`, `SESSION_EXPIRED`, `SESSION_IDLE_EXPIRED`, `UNAUTHENTICATED`
- `api/auth.js`: `login` (with device fingerprint), `refreshToken` (localStorage-based), `logout` (with session ID), `logoutAll`, `changePassword`, `getSession`, `verifyMfaChallenge`
- `api/client.js` + `api/auth.js` are the **most complete auth implementation** — use as reference for canonical auth

### 4.3 IAM Pages (26 routes from App.jsx)

| Route | Page | Capability |
|-------|------|-----------|
| `/login` | LoginPage | Login form |
| `/invitation/:token` | InvitationPage | Invitation-based registration |
| `/dashboard` | Dashboard | IAM dashboard |
| `/iam/overview` | IamOverviewPage | IAM overview |
| `/users` | UsersPage | User management |
| `/users/:userId` | Placeholder | User detail (placeholder) |
| `/identities` | IdentitiesPage | Identity providers |
| `/identity-links` | IdentityLinksPage | ERP identity linking |
| `/identity-groups` | IdentityGroupsPage | Identity groups |
| `/organisations` | OrganisationsPage | Organisation management |
| `/organisations/:orgId` | Placeholder | Org detail (placeholder) |
| `/tenants` | TenantsPage | Tenant management |
| `/roles` | RolesPage | Role management |
| `/policies` | PoliciesPage | Policy management |
| `/sessions` | SessionsPage | Session management |
| `/contexts` | ContextsPage | Context management |
| `/audit` | Placeholder | Audit & Logs (placeholder) |
| `/observability` | ObservabilityOverview | Observability dashboard |
| `/observability/logs` | LogsPage | Log viewer |
| `/observability/audit` | AuditPage | Audit trail |
| `/observability/security-events` | SecurityEventsPage | Security events |
| `/observability/monitoring` | MonitoringPage | Monitoring dashboard |
| `/observability/alerts` | AlertManagerPage | Alert manager |
| `/admin/overview` | OverviewPage | Admin overview |
| `/admin/users` | UsersAdminPage | Admin user management |
| `/admin/organisations-tenants` | OrganisationsTenantsAdminPage | Admin org/tenant management |
| `/admin/access-governance` | AccessGovernancePage | Access governance |
| `/admin/delegation` | DelegationPage | Delegation management |
| `/admin/security-audit` | SecurityAuditPage | Security audit |
| `/admin/monitoring` | AdminMonitoringPage | Admin monitoring |
| `/admin/actions` | AdminActionsPage | Admin actions |
| `/billing/overview` | BillingOverviewPage | Billing overview |
| `/billing/plans` | PlansPage | Plans management |
| `/billing/subscriptions` | SubscriptionsPage | Subscription management |
| `/billing/invoices` | InvoicesPage | Invoice management |
| `/billing/payments` | PaymentsPage | Payment management |
| `/billing/webhooks` | WebhooksPage | Billing webhooks |
| `/billing/entitlements` | EntitlementsPage | Entitlement management |
| `/billing/access-rules` | AccessRulesPage | Plan access rules |
| `/billing/features` | FeaturesPage | Feature management |

### 4.4 Sidebar (6 top-level sections)
1. **DASHBOARD** — Dashboard, À faire (badge: 6)
2. **PLATEFORME** — Platform Foundation (disabled), Auth + IAM + Context (live), Platform Administration (disabled), Tenant/Billing (disabled), Observability & Security (live)
3. **CONCEPTION** — Business Manager (disabled), Pack Manager (disabled)
4. **ERP & RUNTIME** — ERP Adapter (disabled), Runtime (disabled)
5. **AUTOMATION** — Rules & Workflows (disabled)
6. **LIVRAISON** — Integrations (disabled), Publication & Deployment (disabled)

**Note**: Most sidebar items are **disabled** (placeholder). The sidebar structure is a comprehensive roadmap but most features are not yet implemented. The live routes (Users, Identities, IdentityLinks, etc.) provide the IAM management functionality.

---

## 5. Non-React Frontend: `techzone/` (Dolibarr)

| Property | Value |
|----------|-------|
| Path | `techzone/` |
| Type | **PHP** (Dolibarr ERP 23.0.3) — NOT a React frontend |
| Port | 8080 |
| package.json | browser-sync dev server only (not an app framework) |
| Role | Backend ERP system (database, PHP modules, SQL schema) |

---

## 6. Backend Services

| Service | Port | Path | Role |
|---------|------|------|------|
| JASMINA (Platform API) | 3003 | `backend/` | Platform cockpit API (health, apps, envs, contracts, config, snapshots) |
| ERP Adapter API | 3002 | `new erp-adapter-platform/backend/` | ERP adapter API (Dolibarr proxy, data-runtime, automation) |
| AUTH-AIM | 5001 | `Auth_AIM/backend/` | IAM authentication & authorization |
| ERP Console Frontend | 3100 | `new erp-adapter-platform/frontend/` | ⚠️ This is a FRONTEND port (see note) |
| Dolibarr | 8080 | `techzone/` | ERP backend (PHP) |
| Platform Cockpit Frontend | 3001 | `frontend/` | Canonical frontend |
| Business Shell Frontend | 3007 | `team4-platform-api/frontend/` | Submodule (deprecated) |
| IAM Console Frontend | 5180 | `Auth_AIM/frontend/` | IAM console app |

**dev-all.mjs spawns**: AUTH_AIM(5180/5001), ERP-API(3002), ERP-CONSOLE(3100), BUSINESS(3007), JASMINA(3003), Dolibarr(8080).

The canonical `frontend/` (port 3001) is NOT spawned by dev-all.mjs — must be added.

---

## 7. Current Integration: ERP via IFRAME

### 7.1 The Problem
`team4-platform-api/frontend/src/components/ErpEmbedView.jsx`:
```jsx
<iframe src={`http://localhost:3100${initialPath}?token=${getToken()}&user=${encodeURIComponent(JSON.stringify(getUser()))}&refresh=${getRefreshToken()}`} />
```

**Vulnerabilities**:
1. JWT access token in URL query string — exposed in browser history, server logs, Referer headers
2. JWT refresh token in URL query string — same exposure, can be used for session hijacking
3. User object serialized in URL — exposes PII
4. iframe cross-origin — communication risks
5. Token injection via URL — replayable tokens

### 7.2 The Fix
Replace iframe with native routing in canonical `frontend/`:
- ERP pages become routes under `/erp/*` in the canonical app
- Authentication via shared HttpOnly cookies (both apps served from same domain)
- No token in URLs — cookies handle auth transparently
- ErpModule generic CRUD renderer imported directly (no iframe boundary)

---

## 8. Authentication Audit

| Frontend | Storage | Token in localStorage | Token in URL | HttpOnly | withCredentials | MFA Support | Device Fingerprint |
|----------|---------|----------------------|--------------|----------|-----------------|-------------|-------------------|
| `frontend/` (canonical) | NONE | N/A | N/A | N/A | N/A | N/A | N/A |
| team4-platform-api | localStorage | ✅ `iam_token`, `iam_refresh_token` | ✅ `importTokenFromUrl()` reads from URL | ❌ | ❌ | ❌ | ✅ `iam_device_fp` |
| ERP Console | localStorage (user only) + HttpOnly cookies | ❌ (access:()→null, tokens via HttpOnly) | ❌ | ✅ (via backend) | ✅ axios | ❌ | ✅ `iam_device_fingerprint` |
| IAM Console | localStorage | ✅ `iam_auth_session` (full session incl. tokens) | ❌ | ❌ | ❌ | ✅ (verifyMfaChallenge) | ✅ `iam_device_fingerprint` |

**Canonical auth design**:
- Follow ERP Console pattern: HttpOnly cookies for tokens, `withCredentials: true`
- Add MFA support from IAM Console
- Add device fingerprint from both
- Remove localStorage token storage entirely
- Session recovery via `iamAuthService.me()` (no token needed — cookie-based)

---

## 9. API Client Audit

| Frontend | Method | withCredentials | Error Handling | Trace ID | Auth Services | ERP Services |
|----------|--------|-----------------|----------------|----------|---------------|---------------|
| `frontend/` (canonical) | fetch | ❌ | Basic (status + text) | ❌ | None | Partial (health only) |
| team4-platform-api | fetch | ❌ | Basic (401 → reload) | ❌ | login/forgot/logout | None |
| ERP Console | axios | ✅ | ✅ `normalizeError()` (ERP-specific types, traceId) | ✅ | ✅ (iamAuthService, iamAdminService) | ✅ (30+ services) |
| IAM Console | fetch | ❌ (credentials: 'omit') | ✅ Structured (status/code/details) | ❌ | ✅ (login/refresh/logout/MFA) | None |

**Canonical API design**:
- Adopt axios with `withCredentials: true` (from ERP Console)
- Merge `normalizeError()` structured error handling with traceId support
- Merge all service functions from ERP Console (`services/api.js`)
- Migrate auth lifecycle from IAM Console (`api/auth.js`) — MFA, refresh, changePassword
- Migrate platform API modules from canonical (`api/` directory) — applicationsApi, connectorsApi, etc.
- Add `iam:unauthorized` event dispatch (from ERP Console) for cross-component auth state changes

---

## 10. Sidebar Audit

| Frontend | Navigation Authority | Router | ERP Section | IAM Section | Collapsible |
|----------|---------------------|--------|-------------|-------------|-------------|
| `frontend/` (canonical) | Redux (platformSlice) | None | ❌ | ❌ | ✅ (sidebarCollapsed) |
| team4-platform-api | Redux (platformSlice) | None | ✅ (iframe) | ❌ | ✅ |
| ERP Console | React Router v6 | v6 | ✅ (native routes) | Partial (iam/*) | ✅ |
| IAM Console | React Router v7 | v7 | Disabled (placeholder) | ✅ (full) | ✅ |

**Sidebar consolidation plan**:
- Use canonical `frontend/` Sidebar.jsx as base (3-layer PF/API/DEP structure)
- Add ERP layer section (from ERP Console modulesConfig.js — dynamic)
- Add IAM section (from Auth_AIM sidebar — Users, Identities, Sessions, etc.)
- Add Observability section (from Auth_AIM sidebar)
- Add Billing section (from Auth_AIM sidebar)
- Merge Admin section (from Auth_AIM sidebar)
- Keep existing collapse behavior + SubNavBar for sub-sections

---

## 11. Dependency Matrix

| Dependency | frontend/ (canonical) | team4-platform-api | ERP Console | IAM Console |
|------------|----------------------|-------------------|-------------|-------------|
| React | 19.0.1 | 19 | 18.2 | 19 |
| React DOM | 19.0.1 | 19 | 18.2 | 19 |
| Vite | 6 | Vite | CRA (react-scripts) | Vite |
| react-redux | 9.3 | 9 | ❌ | ❌ |
| @reduxjs/toolkit | 2.12 | 2 | ❌ | ❌ |
| react-router-dom | ❌ | ❌ | 6 | 7 |
| axios | ❌ | ❌ | ✅ | ❌ |
| recharts | ❌ | ❌ | ✅ | ❌ |
| tailwindcss | v4 | v4 | v3 | v3 |
| @heroicons/react | ❌ | ❌ | v2 (24/outline) | ❌ |
| lucide-react | 0.546 | ✅ | ❌ | ❌ |
| CSS approach | Tailwind utility | Tailwind utility | Tailwind utility | CSS Modules |

**Conflicts to resolve**:
1. React 18→19 upgrade needed for ERP Console pages (React 19 compatibility)
2. CRA→Vite migration for ERP Console pages (unify build system)
3. React Router version: standardize on v6 (2 sources use v6, 1 uses v7)
4. Icon library: standardize — keep `lucide-react` (canonical) + `@heroicons/react/24/outline` (ERP Console)
5. Tailwind: upgrade ERP Console + IAM Console to v4 (canonical version)
6. Remove axios dependency conflict — install axios in canonical for API client

---

## 12. Component Library Matrix

| Component | Canonical (frontend/) | ErpConsole | IamConsole |
|-----------|----------------------|------------|------------|
| Sidebar | Redux-driven, 3-layer expandable | Router-driven, collapsible, dark mode | Router-driven, CSS modules, sections |
| Header | Header.jsx (Redux + platform state) | Header.jsx (router-aware, dark toggle) | Topbar.jsx (live clock, user menu) |
| Footer | Commented out | Layout footer (version info) | AdminLayout footer (clock + copyright) |
| Toast | ToastContainer.jsx (Redux? or component) | ToastProvider.jsx (Context API + useToast) | None visible |
| Loading | Unknown | Loaders.jsx (ModernSpinner, TableSkeleton) | None visible |
| Modal | CreateAppModal, CreateSnapshotModal, AuditLogModal | None | None |
| Theme/Dark mode | None | ThemeContext.jsx (dark/light) | None (CSS modules) |
| Form fields | Unknown | Unknown | Unknown |
| Table components | View-specific | View-specific | View-specific |

---

## 13. Duplicate/Overlapping Capabilities Matrix

| Capability | Canonical (`frontend/`) | team4 (submodule) | ERP Console | IAM Console |
|------------|------------------------|--------------------|-------------|-------------|
| Platform Cockpit | ✅ Full (3-layer, 14 views) | ✅ Same (14 views) | ❌ | ⚠️ (disabled placeholders) |
| Auth (login/logout) | ❌ | ✅ (localStorage JWT) | ✅ (HttpContext) | ✅ (localStorage session) |
| MFA | ❌ | ❌ | ❌ | ✅ (verifyMfaChallenge) |
| Auth Gate | ❌ | ✅ (AuthGate component) | ✅ (ProtectedRoute) | ✅ (ProtectedRoute) |
| Device Fingerprint | ❌ | ✅ | ✅ | ✅ |
| ERP Modules (24 CRUD) | ❌ | ❌ | ✅ (modulesConfig) | ❌ (disabled) |
| ERP CRUD Generic View | ❌ | ❌ | ✅ (ErpModule.jsx) | ❌ |
| Data Runtime | ❌ | ❌ | ✅ (query/validate/execute) | ❌ |
| Data Runtime History | ❌ | ❌ | ✅ (traceId, metrics) | ❌ |
| Automation Cockpit | ❌ | ❌ | ✅ | ⚠️ (disabled) |
| Automation Rules | ❌ | ❌ | ✅ (simulator) | ⚠️ (disabled) |
| Automation Workflows | ❌ | ❌ | ✅ (start/execute) | ⚠️ (disabled) |
| Automation Triggers | ❌ | ❌ | ✅ (fire/test event) | ⚠️ (disabled) |
| Automation Conditions | ❌ | ❌ | ✅ (evaluator) | ⚠️ (disabled) |
| Automation History | ❌ | ❌ | ✅ (metrics) | ⚠️ (disabled) |
| ERP Registry | ❌ | ❌ | ✅ | ❌ |
| ERP Adapters | ❌ | ❌ | ✅ | ⚠️ (disabled) |
| Field Mapping | ❌ | ❌ | ✅ | ⚠️ (disabled) |
| Users Mgmt | ❌ | ❌ | Partial (IamUsers) | ✅ Full (UsersPage) |
| Identities Mgmt | ❌ | ❌ | Partial | ✅ Full |
| Organisations/Tenants | ❌ | ❌ | ❌ | ✅ Full |
| Roles/Policies | ❌ | ❌ | ❌ | ✅ Full |
| Sessions Mgmt | ❌ | ❌ | ❌ | ✅ Full |
| Observability | ❌ | ❌ | ❌ | ✅ Full |
| Billing/Tenant | ❌ | ❌ | ❌ | ✅ Full (9 pages) |
| Platform Admin | ❌ | ❌ | ❌ | ✅ Full (8 pages) |
| ERP via Iframe | ❌ | ✅ (VULNERABLE) | N/A (native) | ❌ |
| Global Search | ✅ | ✅ | ❌ | ❌ |
| Global Layout | ✅ | ✅ | ✅ (Layout) | ✅ (AdminLayout) |

**Summary**: All 3 source frontends contain unique capabilities not present in canonical. No single source is a superset — all must contribute.

---

## 14. API Endpoint Coverage

### 14.1 Canonical frontend API modules
- `/health` (health check)
- `/apps/*` (applications API)
- `/connectors/*` (external connectors)
- `/credentials/*` (credentials & secrets)
- `/diagnostics/*` (logs & diagnostics)
- `/sync/*` (synchronizations)
- `/webhooks/*` (webhooks)
- `/deployment/*` (6 deployment endpoints)
- `/platform/envs/*` (environments)
- `/platform/config/*` (config)

### 14.2 ERP Console API services (from `services/api.js`)
Auth group (`/iam/auth/*`):
- `/iam/auth/login`, `/iam/auth/register`, `/iam/auth/refresh`, `/iam/auth/logout`, `/iam/auth/logout-all`, `/iam/auth/change-password`, `/iam/auth/forgot-password`, `/iam/auth/reset-password`, `/iam/auth/me`, `/iam/auth/profile`, `/iam/auth/sessions`

IAM admin (`/iam/*`):
- `/iam/users`, `/iam/users/{id}`, `/iam/users/{id}/status`, `/iam/users/stats`, `/iam/sessions`, `/iam/sessions/{id}`

ERP (`/:org` tenant-scoped via backend, frontend proxy):
- `/erp-registry`, `/erp/clients`, `/erp/products`, `/erp/orders`, `/erp/quotes`, `/erp/invoices`, `/erp/payments`, `/erp/suppliers`, `/erp/warehouses`, `/erp/shipments`, `/erp/documents`, `/erp/purchases`, `/erp/stock-movements`, `/erp/product-variants`, `/erp/services`, `/erp/stock-transfers`, `/erp/inventories`, `/erp/stock-alerts`, `/erp/returns`, `/erp/promotions`, `/erp/cash-registers`, `/erp/expenses`, `/erp/reservations`, `/erp/projects`, `/erp/agenda`

Data Runtime:
- `/data-runtime/contract`, `/data-runtime/resources`, `/data-runtime/resources/{resource}`, `/data-runtime/resources/{resource}/{id}`, `/data-runtime/query`, `/data-runtime/execute`, `/data-runtime/validate`, `/data-runtime/history`, `/data-runtime/history/{traceId}`, `/data-runtime/metrics`, `/data-runtime/bindings/{binding}/resolve`, `/data-runtime/bindings/{binding}/state`

Automation:
- `/automation/cockpit`, `/automation/contract`, `/automation/rules`, `/automation/rules/active`, `/automation/rules/{code}`, `/automation/rules/evaluate`, `/automation/rules/simulate`, `/automation/workflows`, `/automation/workflows/start`, `/automation/workflows/executions`, `/automation/triggers`, `/automation/triggers/event`, `/automation/triggers/fire`, `/automation/conditions/evaluate`, `/automation/conditions/simulate`, `/automation/history`, `/automation/history/metrics`

Config:
- `/config/public` (public configuration — likely tenant resolution, provider list)

### 14.3 IAM Console API services
- `/api/iam/auth/login`, `/api/iam/auth/refresh`, `/api/iam/auth/logout`, `/api/iam/auth/logout-all`, `/api/iam/auth/change-password`, `/api/iam/auth/forgot-password`, `/api/iam/auth/register`, `/api/iam/auth/me`, `/api/iam/auth/sessions`
- Full IAM admin: `/api/iam/users`, `/api/iam/identities`, `/api/iam/identity-links`, `/api/iam/identity-groups`, `/api/iam/organisations`, `/api/iam/tenants`, `/api/iam/roles`, `/api/iam/policies`, `/api/iam/sessions`, `/api/iam/contexts`
- Observability: `/api/iam/logs`, `/api/iam/audit`, `/api/iam/security-events`, `/api/iam/monitoring`, `/api/iam/alerts`
- Billing: `/api/iam/billing/*` (overview, plans, subscriptions, invoices, payments, webhooks, entitlements, access-rules, features)
- Admin: `/api/iam/admin/*` (overview, users, organisations-tenants, access-governance, delegation, security-audit, monitoring, actions)

**Note**: IAM Console API base is `/api/iam/` — same as ERP Console's `authAimApi` base URL (`http://localhost:5001/api`). The IAM console uses relative URLs (`/api/iam/auth/login`) while the ERP console uses absolute (`http://localhost:5001/api/iam/auth/login`). Both target the same IAM backend.

---

## 15. CSS/Styling Systems Audit

| Frontend | Tailwind | Dark Mode | CSS Approach | Component Library |
|----------|----------|-----------|--------------|-------------------|
| `frontend/` (canonical) | v4 | None | Tailwind utility classes (slate-900 palette) | Custom components (CockpitView, etc.) |
| team4-platform-api | v4 | None | Tailwind utility classes | Same as canonical (identical components) |
| ERP Console | v3 | ✅ ThemeContext (dark/light) | Tailwind utility + LoginPage.css | Custom + Heroicons v2 |
| IAM Console | v3 | None | CSS Modules (Sidebar.css, AdminLayout.css, LoginPage.css) | Custom + inline SVG icons |

**Styling consolidation**:
- Standardize on Tailwind v4 (canonical version)
- Adopt ThemeContext dark mode from ERP Console
- Convert IAM Console CSS Modules to Tailwind utility classes (or keep as-is in migrated components)
- Unify color palette (canonical uses `#F8FAFC` bg + slate-900 text; ERP Console uses `bg-[#F8FAFC] dark:bg-slate-950`)

---

## 16. Routing Strategy Audit

### Canonical (`frontend/`): Redux tab navigation
```
Redux: activeModuleId ('01' | 'api-layer' | 'dep-layer')
       activeTab ('cockpit' | 'applications' | 'integrations' | 'deployment' | ... 14 tabs)
       activeIntegrationTab (sub-tabs within integrations)
       activeDeploymentTab (sub-tabs within deployment)
```
No URL routing — state is in Redux store. Deep linking impossible.

### ERP Console (v6): Standard router
```
/login, /reset-password (public)
/ (protected, Layout)
  /, /erps, /erps/create, /erps/edit/:id
  /data-runtime, /data-runtime/history
  /automation, /automation/rules, /automation/workflows, /automation/triggers, /automation/conditions, /automation/history
  /erp/:moduleKey
  /mapping, /adapters, /settings
  /iam, /iam/users, /iam/sessions, /iam/profile
```

### IAM Console (v7): Standard router
```
/login, /invitation/:token (public)
/dashboard, /iam/overview, /users, /identities, /roles, /sessions, /contexts
/observability/*, /admin/*, /billing/*
/erps, /mapping, /adapters, /settings (placeholders)
```

**Routing consolidation strategy**:
- Adopt React Router DOM v6 (2 sources use v6, 1 uses v7 — v7 migration is trivial since v6→v7 is additive)
- Platform cockpit stays as Redux tabs under `/` (or `/platform/*`)
- ERP routes move under `/erp/*` (Dashboard, Registry, Modules, DataRuntime, Automation)
- IAM routes move under `/iam/*` (Users, Identities, Sessions, Roles, etc.)
- Auth routes (`/login`, `/invitation/:token`, `/reset-password`) at root level
- Protected by single `ProtectedRoute` + `AuthProvider` wrapper

---

## 17. Data Flow & State Management

| Frontend | State Management | Global State | Local State | Data Fetching |
|----------|-----------------|--------------|-------------|---------------|
| `frontend/` (canonical) | Redux Toolkit (9 slices) | platform, applications, environments, contracts, config, snapshots, audit, integration, deployment | useState + useEffect | apiRequest (fetch) |
| team4-platform-api | Redux Toolkit (3 slices) | platform, integration, deployment | useState + useEffect | apiRequest (fetch + Bearer) |
| ERP Console | React state + Context | AuthContext, ThemeContext, ToastContext | useState + useEffect | axios + withCredentials |
| IAM Console | React Context | AuthContext, IamContext | useState + useEffect | apiRequest (fetch) |

**State management consolidation**:
- Keep Redux Toolkit (canonical has 9 slices — most comprehensive)
- Add `authSlice` to Redux store (merge from ERP Console AuthContext + IAM Console AuthContext)
- Add `iamSlice` for IAM data (from IAM Console pages)
- Add `erpSlice` for ERP data (from ERP Console pages)
- Replace Context-based auth with Redux-managed auth (single source of truth)
- Keep ToastProvider from ERP Console (better than canonical ToastContainer)

---

## 18. Security Vulnerabilities Found

| # | Vulnerability | Location | Severity | Fix |
|---|--------------|----------|----------|-----|
| 1 | JWT access token in URL query params | `team4-platform-api/frontend/ErpEmbedView.jsx:iframe src` + `auth.js:importTokenFromUrl()` | **CRITICAL** | Remove iframe. Use HttpOnly cookies. Remove importTokenFromUrl |
| 2 | JWT refresh token in URL query params | Same as #1 | **CRITICAL** | Same fix |
| 3 | Full user object in URL | ErpEmbedView passes `user=${encodeURIComponent(JSON.stringify(getUser()))}` | HIGH | Remove URL token passing; use cookie-based session |
| 4 | Access token in localStorage | team4-platform-api (`iam_token`), IAM Console (`iam_auth_session.accessToken`) | HIGH | Migrate to HttpOnly cookies |
| 5 | Refresh token in localStorage | team4-platform-api (`iam_refresh_token`), IAM Console (`iam_auth_session.refreshToken`) | HIGH | Migrate to HttpOnly cookies |
| 6 | No CSRF protection | All frontends (fetch/axios without CSRF tokens) | HIGH | Add CSRF token header support (double-submit cookie pattern) |
| 7 | Hardcoded localhost URLs | ErpEmbedView (`http://localhost:3100`), ERP Console (`process.env.REACT_APP_API_URL || 'http://localhost:3002/api'`) | MEDIUM | Environment-based config |
| 8 | Iframe cross-origin | ErpEmbedView iframe to :3100 from :3007 | MEDIUM | Eliminate iframe — native routes |
| 9 | clientSide session expiry check only | IAM Console `getSession` checks localStorage expiry client-side | MEDIUM | Server-side session validation |
| 10 | Credentials omitted on API calls | IAM Console `client.js` uses `credentials: 'omit'` | MEDIUM | Use `withCredentials: true` for authenticated requests |

---

## 19. Backend Contract (Frozen — Do NOT Modify)

The canonical frontend must conform to these backend contracts (validated in Phase 1B.5):

| Endpoint Pattern | Source | Auth Method | Notes |
|-----------------|--------|-------------|-------|
| `/api/*` | JASMINA (3003) | Bearer token (currently) → **should be HttpOnly cookie** | Platform cockpit APIs |
| `/api/iam/auth/*` | AUTH-AIM (5001) | No auth (login/register) → HttpOnly cookie session | Auth lifecycle |
| `/api/iam/*` | AUTH-AIM (5001) | HttpOnly cookie (withCredentials) | IAM admin APIs |
| `/api/erp-registry` | ERP Adapter API (3002) | HttpOnly cookie (withCredentials) | ERP instance registry |
| `/api/erp/*` | ERP Adapter API (3002) | HttpOnly cookie (withCredentials) | Tenant-resolved ERP (Dolibarr proxy) |
| `/api/data-runtime/*` | ERP Adapter API (3002) | HttpOnly cookie (withCredentials) | Data runtime |
| `/api/automation/*` | ERP Adapter API (3002) | HttpOnly cookie (withCredentials) | Automation engine |
| `/api/config/public` | ERP Adapter API (3002) | No auth | Public config (tenant, provider) |

**Key backend contract points**:
1. Auth tokens are HttpOnly cookies (backend sets `Set-Cookie` on login/refresh)
2. Frontend must use `withCredentials: true` on all API requests
3. On 401, frontend must call `/iam/auth/refresh` to silently refresh, then retry
4. ERP endpoints are tenant-resolved server-side — frontend must NOT handle tenant switching
5. `x-trace-id` header present on all responses for error tracing
6. Structured error responses: `{ code: "ERP_XXX", message: "...", details?: {...} }`

---

## 20. ERP Page Matrix (Complete)

All ERP pages from `new erp-adapter-platform/frontend/src/pages/`:

| Page | API Services Used | External Components Used | Description |
|------|-------------------|------------------------|-------------|
| Dashboard.jsx | healthService, statsService, erpRegistryService | — | ERP overview: health, stats, quick actions |
| ERPList.jsx | erpRegistryService | — | ERP registry: list + provider selection |
| ERPCreate.jsx | erpRegistryService | — | Create new ERP instance |
| ERPEdit.jsx | erpRegistryService | — | Edit ERP instance |
| ErpModule.jsx | Dynamic (from MODULES) | modulesConfig | Generic CRUD: list/create/edit/delete for 24 modules |
| DataRuntime.jsx | dataRuntimeService | Loaders | Runtime: query, validate, execute, resource browsing |
| DataRuntimeHistory.jsx | dataRuntimeService | Loaders | Trace history: timeline, metrics, trace lookup |
| AutomationCockpit.jsx | automationService | Loaders | Automation overview: cockpit + contract |
| AutomationRules.jsx | automationService | Loaders | Rules: list, evaluate simulator, test context editor |
| AutomationWorkflows.jsx | automationService | Loaders | Workflows: list, start with variables, executions |
| AutomationTriggers.jsx | automationService | Loaders | Triggers: list, fire with code/vars, event simulation |
| AutomationConditions.jsx | automationService | — | Conditions: JSON editor, evaluate, simulate |
| AutomationHistory.jsx | automationService, Loaders | — | History: execution records, metrics |
| Mapping.jsx | — | MODULES import | Field mapping matrix: bidirectional sync config |
| Adapters.jsx | healthService, statsService, erpRegistryService | Loaders, MODULES | Adapters: health, stats, registry |
| Settings.jsx | — | ThemeContext | Theme toggle (dark/light), user preferences |
| Login.jsx | iamAuthService | — | Login form (uses iamTokenStore.getUser()) |
| ResetPassword.jsx | iamAuthService | Login.css | Password reset: ?token= in URL, 10-char min validation |
| IamOverview.jsx | — | — | IAM overview page |
| IamUsers.jsx | — | — | IAM users list |
| IamSessions.jsx | — | — | IAM sessions list |
| IamProfile.jsx | — | — | IAM profile page |

**Supporting components**:
- `components/Loaders.jsx` — ModernSpinner, TableSkeleton
- `components/ui/ToastProvider.jsx` — Toast system with useToast hook
- `components/Sidebar.jsx` — Router-based, collapsible, dark mode
- `components/Header.jsx` — Router-aware, dark mode toggle
- `auth/AuthContext.jsx` — Auth context with me() boot, unauthorized event listener
- `auth/ProtectedRoute.jsx` — Route guard with loading spinner
- `erp/modulesConfig.js` — 24 module configs (the single most valuable artifact)
- `ThemeContext.jsx` — Dark/light mode context

---

## 21. IAM Page Matrix (Complete)

All IAM pages from `Auth_AIM/frontend/src/pages/`:

| Page | Capability | Route |
|------|-----------|-------|
| LoginPage | Login form + MFA challenge | `/login` |
| Dashboard | IAM dashboard overview | `/dashboard` |
| InvitationPage | Token-based registration | `/invitation/:token` |
| IamOverviewPage | IAM system overview | `/iam/overview` |
| UsersPage | User management (CRUD) | `/users` |
| IdentitiesPage | Identity providers management | `/identities` |
| IdentityLinksPage | ERP identity linking | `/identity-links` |
| IdentityGroupsPage | Identity groups management | `/identity-groups` |
| OrganisationsPage | Organisation management | `/organisations` |
| TenantsPage | Tenant management | `/tenants` |
| RolesPage | Role & permission management | `/roles` |
| PoliciesPage | Access policy management | `/policies` |
| SessionsPage | Session monitoring & revocation | `/sessions` |
| ContextsPage | Access context management | `/contexts` |
| ObservabilityOverview | Observability dashboard | `/observability` |
| LogsPage | Log viewer/search | `/observability/logs` |
| AuditPage | Audit trail | `/observability/audit` |
| SecurityEventsPage | Security event monitoring | `/observability/security-events` |
| MonitoringPage | System monitoring | `/observability/monitoring` |
| AlertManagerPage | Alert management | `/observability/alerts` |
| OverviewPage | Admin overview | `/admin/overview` |
| UsersAdminPage | Admin user management | `/admin/users` |
| OrganisationsTenantsAdminPage | Admin org/tenant management | `/admin/organisations-tenants` |
| AccessGovernancePage | Access governance | `/admin/access-governance` |
| DelegationPage | Access delegation | `/admin/delegation` |
| SecurityAuditPage | Security audit | `/admin/security-audit` |
| AdminMonitoringPage | Admin monitoring | `/admin/monitoring` |
| AdminActionsPage | Admin action log | `/admin/actions` |
| BillingOverviewPage | Billing overview | `/billing/overview` |
| PlansPage | Subscription plans | `/billing/plans` |
| SubscriptionsPage | Subscription management | `/billing/subscriptions` |
| InvoicesPage | Invoice management | `/billing/invoices` |
| PaymentsPage | Payment management | `/billing/payments` |
| WebhooksPage | Billing webhooks | `/billing/webhooks` |
| EntitlementsPage | Entitlement management | `/billing/entitlements` |
| AccessRulesPage | Plan access rules | `/billing/access-rules` |
| FeaturesPage | Feature management | `/billing/features` |

**Supporting infrastructure**:
- `context/IamContext.jsx` — IAM context (purpose: tenant/organisation context)
- `components/auth/ProtectedRoute.jsx` — Auth-gated route wrapper
- `components/Topbar.jsx` — Top navigation with user menu
- `components/Sidebar.jsx` — 6-section navigation (CSS modules)
- `layouts/AdminLayout.jsx` — Layout with Sidebar + Topbar + Footer
- `api/client.js` — Base API client with structured errors, auto-redirect on 401
- `api/auth.js` — Full auth lifecycle with MFA, device fingerprinting

---

## 22. Migration Plan (Phase 2.2–2.9)

### Phase 2.2 — Canonical Setup & Router Migration
**Goal**: Establish routing authority in canonical `frontend/`

1. **Add React Router DOM v6** to canonical `frontend/` (unify all routers on v6)
2. **Add axios** to canonical `frontend/` (replace fetch-based API client)
3. **Wrap App in BrowserRouter** — convert Redux tab navigation to router + Redux hybrid:
   - Platform cockpit views: stay as Redux tabs under route `/` (or `/platform`)
   - ERP views: new routes under `/erp/*`
   - IAM views: new routes under `/iam/*`
   - Auth views: routes `/login`, `/invitation/:token`, `/reset-password`
4. **Add ProtectedRoute** (from ERP Console pattern — spinner + redirect to `/login`)

**Do NOT modify**: team4-platform-api, erp-adapter-platform, Auth_AIM (migration sources are read-only references)

### Phase 2.3 — Authentication Authority
**Goal**: Single auth system using HttpOnly cookies

1. **Create `src/auth/AuthContext.jsx`** in canonical (based on ERP Console + IAM Console patterns):
   - Boot: `iamAuthService.me()` (cookie-based, no token in localStorage)
   - Login: POST to `/api/iam/auth/login` (withCredentials, device fingerprint)
   - Refresh: POST to `/api/iam/auth/refresh` (withCredentials, silent retry on 401)
   - Logout: POST to `/api/iam/auth/logout` (withCredentials, then clear session state)
   - MFA: `verifyMfaChallenge` (from IAM Console)
   - Session: server-side validated (no client-side expiry trust)
2. **Create `src/auth/ProtectedRoute.jsx`** — spinner during loading, redirect to `/login` if unauthenticated
3. **Migrate LoginPage** from ERP Console (adapt for unified auth)
4. **Migrate ResetPassword** from ERP Console (adapt: token via cookie, not URL)
5. **Migrate InvitationPage** from IAM Console
6. **Remove** all localStorage token storage — NO JWT in localStorage

### Phase 2.4 — API Infrastructure
**Goal**: Single axios-based API client with withCredentials + structured errors

1. **Create `src/api/client.js`** in canonical (based on ERP Console `services/api.js`):
   - 2 axios instances: `api` (ERP:3002) + `authApi` (IAM:5001), both `withCredentials: true`
   - `normalizeError()` with traceId, ERP-specific error types
   - `iam:unauthorized` event dispatch on 401 (cross-component auth state)
   - Keep all 30+ service functions from ERP Console
2. **Merge platform API modules** from canonical `api/` directory into the new client
3. **Migrate IAM admin services** from IAM Console (users, identities, sessions, roles, etc.)
4. **Migrate billing services** from IAM Console
5. **Migrate observability services** from IAM Console
6. **Configure interceptors** for automatic token refresh on 401

### Phase 2.5 — ERP Module Migration (Native Routes, No Iframe)
**Goal**: Replace iframe with native routed ERP pages

1. **Copy `modulesConfig.js`** from ERP Console → `src/erp/modulesConfig.js`
   - Update imports: `@heroicons/react/24/outline` → keep Heroicons (add to deps)
   - Update service imports to use new `api/client.js`
2. **Copy `ErpModule.jsx`** — generic CRUD renderer (no changes needed to logic, adapt API client)
3. **Copy ERP pages**: Dashboard, ERPList, ERPCreate, ERPEdit, DataRuntime, DataRuntimeHistory, AutomationCockpit, AutomationRules, AutomationWorkflows, AutomationTriggers, AutomationConditions, AutomationHistory, Mapping, Adapters, Settings
4. **Copy auth pages**: Login, ResetPassword (adapted)
5. **Add routes** to App.jsx router: `/erp/*`, `/data-runtime/*`, `/automation/*`
6. **Remove ErpEmbedView.jsx** — no iframe
7. **Copy supporting components**: Loaders.jsx, ToastProvider.jsx, ThemeContext.jsx, Header.jsx (from ERP Console), Sidebar.jsx (from ERP Console, adapted)
8. **Upgrade dependency**: React 18→19 (for ERP Console pages, if needed)

### Phase 2.6 — IAM Module Migration
**Goal**: Migrate full IAM console into canonical as routed section

1. **Copy IAM pages** (26 pages) from Auth_AIM → `src/iam/pages/`
2. **Migrate IamContext** from Auth_AIM → `src/iam/context/`
3. **Migrate ProtectedRoute** (unify with existing one)
4. **Migrate API services** for IAM admin (users, identities, roles, policies, sessions, contexts, observability, billing, admin) into `api/client.js`
5. **Migrate IAM sidebar sections** into canonical Sidebar (IAM, Observability, Billing, Admin groups)
6. **Migrate AdminLayout** components (Topbar → integrate with canonical Header)
7. **Migrate CSS modules** — convert to Tailwind utility classes OR keep as imported CSS
8. **Migrate auth pages** (LoginPage, InvitationPage) — use canonical auth, not local
9. **Add routes**: `/iam/*`, `/users`, `/identities`, `/roles`, `/sessions`, `/observability/*`, `/admin/*`, `/billing/*`

### Phase 2.7 — Global Layout & Sidebar Unification
**Goal**: Single global layout with unified sidebar

1. **Refactor canonical Sidebar.jsx** to include ALL sections:
   - Platform Foundation (PF-00 to PF-06) — existing
   - API Integration Layer (API-00 to API-07) — existing
   - DEP Publication (DEP-00 to DEP-06) — existing
   - ERP Adapter (modules from modulesConfig.js) — NEW (dynamic)
   - Data Runtime — NEW
   - Automation — NEW
   - IAM — NEW (from Auth_AIM sidebar)
   - Observability — NEW
   - Billing — NEW
   - Administration — NEW
2. **Migrate ERP Sidebar** from ERP Console → integrate into canonical Sidebar as a section
3. **Migrate IAM Sidebar menuSections** → integrate as groups in canonical Sidebar
4. **Unify Header** — merge canonical Header + ERP Console Header (dark mode toggle) + IAM Topbar (clock, user menu)
5. **Unify Footer** — use commented-out footer from canonical, add version + clock from IAM
6. **Migrate ToastProvider** from ERP Console → replace canonical ToastContainer
7. **Migrate ThemeContext** from ERP Console → add to canonical root

### Phase 2.8 — State Management Consolidation
**Goal**: Single Redux store with all slices

1. **Add `authSlice`** — user state, isAuthenticated, loading, mfaRequired
2. **Add `iamSlice`** — IAM entities (users, sessions, roles, policies, tenants, organisations)
3. **Add `erpSlice`** — ERP registry, selected ERP, modules list
4. **Add `automationSlice`** — automation rules, workflows, history
5. **Keep existing 9 slices** — platform, applications, environments, contracts, config, snapshots, audit, integration, deployment
6. **Add `uiSlice`** — theme (dark/light), sidebar collapsed, mobile menu state
7. **Migrate auth context** from React Context to Redux (single source of truth)
8. **Replace `importTokenFromUrl`** — remove token-from-URL logic

### Phase 2.9 — Dev Orchestration & Dependency Resolution
**Goal**: Single dev server for consolidated frontend

1. **Update `scripts/dev-all.mjs`**:
   - Replace BUSINESS(3007) + ERP_CONSOLE(3100) + AUTH_AIM(5180) with single CANONICAL_FRONTEND
   - New canonical frontend port: 3000 (standard) or reuse 3007
2. **Update canonical `package.json`**:
   - Port: standard `vite --port=3000`
   - Add dependencies: `axios`, `react-router-dom@6`, `@heroicons/react`, `recharts`, `react-router-dom`
   - Remove: `@google/genai`, `express`, `esbuild`, `dotenv` (not needed in frontend)
3. **Add `.env`** files:
   ```env
   VITE_API_URL=http://localhost:3002
   VITE_AUTH_AIM_URL=http://localhost:5001
   VITE_APP_NAME=Techzone Cloud
   ```
4. **Update proxy config** (vite.config.js): proxy `/api` → ERP Adapter (3002), proxy `/api/iam` → AUTH-AIM (5001)
5. **Delete migration sources**: `team4-platform-api/frontend/`, `new erp-adapter-platform/frontend/`, `Auth_AIM/frontend/` (after full verification)
6. **Update root `package.json`**: remove references to deleted services

### Phase 2.10 — Verification Checklist

| Constraint | Status | How Verified |
|------------|--------|-------------|
| 1 React app | ✅ | Single `frontend/` directory, single package.json |
| 1 global layout | ✅ | Single Layout/Header/Footer in App.jsx |
| 1 global sidebar | ✅ | Single Sidebar.jsx with all sections |
| 1 navigation authority | ✅ | React Router v6 + Redux (platform tabs) |
| 1 authentication authority | ✅ | AuthProvider + authSlice + ProtectedRoute |
| 1 API infrastructure | ✅ | api/client.js with axios + withCredentials |
| 0 iframe | ✅ | No iframe in any page |
| 0 nested SPA | ✅ | No iframe, no micro-frontend |
| 0 JWT URL | ✅ | No token in URL params |
| 0 JWT localStorage | ✅ | HttpOnly cookies only |

---

## 23. File Migration Map

### Files TO KEEP in canonical `frontend/`:
```
src/main.jsx (adapt: add BrowserRouter, AuthProvider)
src/App.jsx (adapt: add Routes, ProtectedRoute, new sections)
src/store/index.js (add authSlice, iamSlice, erpSlice, automationSlice, uiSlice)
src/store/platformSlice.js (keep)
src/components/Sidebar.jsx (extend with ERP/IAM/Automation sections)
src/components/Header.jsx (keep, extend with dark mode + user menu)
src/components/SubNavBar.jsx (keep)
src/components/ToastContainer.jsx (replace with ToastProvider)
src/components/GlobalSearch.jsx (keep)
src/components/CreateAppModal.jsx (keep)
src/components/CreateSnapshotModal.jsx (keep)
src/components/AuditLogModal.jsx (keep)
src/components/common/* (keep)
src/components/integration/* (keep)
src/components/deployment/* (keep)
src/components/{all 27 views} (keep)
src/utils/api.js (replace with api/client.js)
src/api/*.js (merge into api/client.js)
src/index.css, src/App.css (keep)
```

### Files TO MIGRATE (copy, adapt, delete source):
| From | To | Notes |
|------|-----|-------|
| erp-adapter/src/erp/modulesConfig.js | frontend/src/erp/modulesConfig.js | Update service imports |
| erp-adapter/src/pages/ErpModule.jsx | frontend/src/erp/ErpModule.jsx | Adapt API client |
| erp-adapter/src/pages/*.jsx (15 pages) | frontend/src/erp/pages/ | Adapt imports, remove axios import |
| erp-adapter/src/services/api.js | frontend/src/api/client.js | Full replacement |
| erp-adapter/src/auth/* | frontend/src/auth/ | Adapt for HttpOnly (remove iamTokenStore localStorage) |
| erp-adapter/src/components/Loaders.jsx | frontend/src/components/Loaders.jsx | Copy |
| erp-adapter/src/components/ui/ToastProvider.jsx | frontend/src/components/ui/ToastProvider.jsx | Copy |
| erp-adapter/src/ThemeContext.jsx | frontend/src/ThemeContext.jsx | Copy |
| Auth_AIM/src/pages/** | frontend/src/iam/pages/ | 26 pages, adapt imports |
| Auth_AIM/src/api/** | Merge into frontend/src/api/client.js | IAM admin services |
| Auth_AIM/src/layouts/AdminLayout.jsx | frontend/src/layouts/ | Adapt (integrate with canonical layout) |
| Auth_AIM/src/IamContext.jsx | frontend/src/iam/context/ | Adapt |
| team4-platform/src/auth.js | DELETE | Replaced by canonical auth system |
| team4-platform/src/components/ErpEmbedView.jsx | DELETE | Replaced by native routes |

### Files TO CREATE (new):
```
src/auth/AuthContext.jsx      — unified auth context
src/auth/ProtectedRoute.jsx   — route guard
src/pages/LoginPage.jsx       — login page
src/pages/ResetPassword.jsx   — password reset
src/pages/InvitationPage.jsx  — invitation
src/components/Header.jsx     — extended header
src/components/Footer.jsx     — footer (uncomment from App.jsx)
src/routes/AppRoutes.jsx      — route definitions
```

---

## 24. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| DataRuntime/DataHistory pages are tightly coupled to ERP Console structure | Medium | High | Test API response compatibility before migration |
| Auth_AIM CSS modules conflict with Tailwind v4 | High | Medium | Convert CSS modules to Tailwind or use CSS module scoping |
| React 18→19 compatibility for ERP Console pages | Low | Medium | Test thoroughly; most v18 code works in v19 |
| CRA→Vite build differences (dotenv, process.env) | Medium | Medium | Map `process.env.REACT_APP_*` → `import.meta.env.VITE_*` |
| Sidebar complexity (3-layer + ERP + IAM = 5+ layers) | High | Medium | Keep existing Redux structure, add layers as sections |
| Loss of team4-platform-api auth features (invitation links via URL) | Medium | High | Implement server-side invitation (cookie-based) |
| IAM Console has many disabled placeholders | Low | Low | Migrate only live routes, keep placeholder structure |
| dev-all.mjs orchestration changes break other services | Medium | High | Test all services after port/route changes |
