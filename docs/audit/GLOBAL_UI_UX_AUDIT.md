# Techzone Cloud — Global UI/UX Audit

> **Purpose:** Audit of the frontend React/Vite application — navigation, routing, page coverage, component architecture, and state management.
> **Date:** 2026-09-28

## 1. Architecture

| Layer | Technology | File |
|---|---|---|
| Framework | React 19 | |
| Build tool | Vite 6.2 | `vite.config.ts` |
| Routing | React Router DOM 6 | `App.jsx`, `routes.js` |
| State management | Redux Toolkit | `store.js`, `store/` slices |
| HTTP client | Axios (2 instances) | `api/apiClient.js` |
| UI styling | Tailwind CSS | |
| Icons | lucide-react, heroicons | |
| HTTP port | 3000 | |

### API Client Architecture

`frontend/src/api/apiClient.js` creates two Axios instances:
- `api` — baseURL `/api` — general backend API (proxied to :3003)
- `authApi` — baseURL `/api/iam` — IAM/auth API

**Interceptors:**
- Request: injects `traceId` header (`X-Trace-Id`)
- Response: normalizes error envelope `{ success, message, data }`
- 401 auto-refresh via `refreshToken` against `/auth/refresh` (with `isRefreshing` lock + queue)

**Proxy configuration** (`vite.config.ts`):
- `/api/iam/*` → `http://localhost:3003`
- `/api/*` → `http://localhost:3003`

> **Finding:** The proxy correctly forwards both IAM and general API paths to the same backend port. This is documented in `AGENTS.md` but not in `docs/ARCHITECTURE.md`.

## 2. Layout & Navigation Structure

### Single Layout: TechzoneLayout

There is ONE root layout: `frontend/src/layouts/TechzoneLayout.jsx`. It provides:
- **Sidebar** — rendered from `navigationConfig.js`
- **Header** — user profile, notifications
- **SubNavBar** — context-aware sub-navigation
- **Outlet** — React Router DOM outlet for page content

`App.jsx` wraps everything in `<TechzoneLayout>` with `<BrowserRouter>`.

### 4-Level Navigation (`navigationConfig.js`)

Sources confirm a 4-level navigation hierarchy:

| Level | Component | File |
|---|---|---|
| Level 1 | Sections (Business Manager, Integration, Deployment, Automation, ERP, Administration) | `navigationConfig.js` |
| Level 2 | Groups (e.g., Applications, Versions, Environments, Contracts under Business Manager) | `navigationConfig.js` |
| Level 3 | Pages (e.g., Applications Catalog, Environments, Configuration) | `navigationConfig.js` |
| Level 4 | Sub-pages / Action routes | `navigationConfig.js` |

The navigation config contains:
- 92 route entries
- 28 legacy redirect mappings (from old `/platform/...` routes)
- `pageDefinitions` array with `permission`, `protected`, `classification` fields per page
- `resolveRoute()` and `activeNavigation()` functions

## 3. Page Inventory

### Business Manager Section

| Route | Component | Classification | Status | CDC |
|---|---|---|---|---|
| `/business/applications` | `ApplicationsView` | COMPLETE | Real backend integration | BM-CDC-01 |
| `/business/applications/catalog` | `ApplicationsCatalogView` | REAL | API calls work, but auth-blocked (anonymous only) | BM-CDC-01 |
| `/business/applications/create` | `CreateAppModal` | COMPLETE | Inline modal | BM-CDC-01 |
| `/business/versions` | `VersionsDetailView` | REAL | Partial tab wiring | BM-CDC-02 |
| `/business/environments` | `EnvironmentsView` | REAL | Real component | BM-CDC-05 |
| `/business/config` | `ConfigurationView` | REAL | Calls `platformConfigService` | BM-CDC-06 |
| `/business/contracts` | `ContractsView` | REAL | Real component, anonymous | BM-CDC-07 |
| `/business/contracts/:id` | `ContractDetailView` | REAL | | BM-CDC-07 |
| `/business/snapshots` | `SnapshotsView` | REAL | Real component | BM-CDC-07 |
| `/business/snapshots/create` | `CreateSnapshotModal` | REAL | Modal form | BM-CDC-07 |
| `/business/models` | `null` (placeholder) | MISSING | `component: null`, `NOT_IMPLEMENTED` | BM-CDC-03 |
| `/business/features` | `null` (placeholder) | MISSING | `component: null`, `NOT_IMPLEMENTED` | BM-CDC-04 |
| `/business/navigation` | `null` (placeholder) | MISSING | `component: null`, `NOT_IMPLEMENTED` | BM-CDC-05 |
| `/business/dashboard` | `CockpitView` | REAL | Dashboard view | BM-CDC-00 |
| `/business/activity` | `GeneralOverviewView` | REAL | Activity feed | BM-CDC-00 |
| `/business/workspace/:appId` | `WorkspaceConfigView` | PARTIAL | Only config tab wired; no data model/features/navigation tabs | BM-CDC-01/06 |

### Deployment Section

| Route | Component | Classification | Status | CDC |
|---|---|---|---|---|
| `/deployment/releases` | `ReleasesListView` | REAL | | BM-CDC-02 |
| `/deployment/deployments` | `DeploymentsListView` | REAL | | BM-CDC-02 |
| `/deployment/publish` | `DeploymentPublicationView` | REAL | | BM-CDC-02 |
| `/deployment/cockpit` | `DeploymentCockpitView` | REAL | | BM-CDC-02 |
| `/deployment/rollback/:id` | `RollbackDetailView` | REAL | | BM-CDC-02 |

### Integration Section

| Route | Component | Classification | Status | CDC |
|---|---|---|---|---|
| `/integration/cockpit` | `IntegrationCockpitView` | REAL | With API integration | BM-CDC-07 |
| `/integration/connectors` | `ConnectorManagerView` | REAL | | BM-CDC-07 |
| `/integration/apis` | `ApiManagerView` | REAL | | BM-CDC-07 |
| `/integration/webhooks` | `WebhookManagerView` | REAL | | BM-CDC-07 |
| `/integration/credentials` | `CredentialManagerView` | REAL | | BM-CDC-07 |
| `/integration/synchronizations` | `SynchronizationManagerView` | REAL | | BM-CDC-07 |
| `/integration/diagnostics` | `IntegrationDiagnosticsView` | REAL | | BM-CDC-07 |

### Automation Section

| Route | Component | Classification | Status |
|---|---|---|---|
| `/automation/rules` | `AutomationRulesView` | REAL |
| `/automation/workflows` | `WorkflowBuilderView` | REAL |
| `/automation/triggers` | `AutomationTriggersView` | REAL |
| `/automation/actions` | `AutomationActionsView` | REAL |

### ERP Section

| Route | Component | Classification | Status |
|---|---|---|---|
| `/erp/catalog` | `ErpCatalogView` | REAL |
| `/erp/dashboard` | `ErpDashboard` | REAL |
| `/erp/entities/:entity` | `EntityListView` | REAL |

### Data Runtime Section

| Route | Component | Classification | Status |
|---|---|---|---|
| `/data-runtime/query` | `DataRuntimeExplorerView` | REAL |
| `/data-runtime/execute` | `DataRuntimeExecuteView` | REAL |

### Validation Section

| Route | Component | Classification | Status | CDC |
|---|---|---|---|---|
| `/business/validation` | `PackValidationCockpit` | PLACEHOLDER | Backend engine missing (BM-CDC-08) | BM-CDC-08 |

### IAM / Auth Pages

| Route | Component | Classification | Status |
|---|---|---|---|
| `/login` | `LoginPage` | REAL | Auth flow |
| `/iam/users` | `IamUsersPage` | REAL | Admin only |
| `/iam/admin/tenants` | `IamTenantsPage` | REAL | Admin only |

### DEV_ONLY Pages (features/iam-demo/)

| Route | Component | Classification | Notes |
|---|---|---|---|
| `/iam-demo/*` | `DemoPage` + 212+ mock files | DEV_ONLY | Mock services, mockData, DemoPage. **Must verify not routable in production build.** |

## 4. Component Architecture

### AppShell (Single Shell)

```
App.jsx
  → BrowserRouter
    → TechzoneLayout (AppShell)
      → Sidebar (from navigationConfig)
      → Header
      → SubNavBar
      → Outlet (page content)
```

This is a clean single-shell architecture with route-based page rendering.

### State Management

Redux Toolkit store (`store.js`) with slices:
- `authSlice` — authentication state
- `applicationsSlice` — application catalog
- `environmentsSlice` — environments
- `configurationSlice` — configurations
- `deploymentSlice` — releases/deployments
- `erpSlice` — ERP entities
- `subscriptionSlice` / `billingFeaturesSlice` — billing (mock data)

## 5. Findings

| Finding | Severity | Description |
|---|---|---|
| **Auth not connected to navigation** | HIGH | Frontend pages are "anonymous-only (auth blocked)" per audit. Navigation renders but API calls are gated behind auth; the auth integration appears incomplete or in a stale state. |
| **Stale mock data in billing** | MEDIUM | `subscriptionSlice.js` and `billingFeaturesMockService.js` use mock data instead of calling `IAM_BILLING` API (which exists but is P0-exposed). |
| **`features/iam-demo/` (212+ files)** | MEDIUM | DEV_ONLY mock infrastructure. Must be excluded from production builds. Verify `routes.js` doesn't wire these in production. |
| **`features/erp-account/` (non-routed)** | LOW | Dead code — not referenced in `navigationConfig.js` or `routes.js`. |
| **`WorkspaceConfigView.jsx`** | MEDIUM | Only configuration tab is wired; data model, features, and navigation tabs are missing (BM-CDC-03/04/05). |
| **No frontend E2E tests** | HIGH | Only 8 unit test files (6 component tests + 2 nav logic). No Playwright/Cypress. No API service tests. No Redux slice tests. |
| **Test count discrepancy** | LOW | Existing `BM_CDC_IMPLEMENTATION_MATRIX.md` claims "Zero test files" — stale; 8 files now exist. |
| **404 fallback** | LOW | Verify `routes.js` handles unknown routes gracefully (not confirmed). |

## 6. Recommendations

1. **Connect auth to navigation** — verify `IamJwtGuard`-protected routes flow through `authService.js` refresh interceptor; confirm `navigationAccess.js` permission checks work end-to-end.
2. **Remove or gate `features/iam-demo/`** — ensure it is not bundled in production (`vite.config.ts` alias or route guard).
3. **Add frontend service tests** — at minimum test `platformApplicationsService`, `platformConfigService`, `authService` against mock API.
4. **Add Redux slice tests** — test auth slice token refresh, navigation visibility logic.
5. **Add E2E testing** — Cypress or Playwright for critical user journeys (login → navigation → CRUD).
6. **Complete WorkspaceConfigView** — wire data model, features, navigation tabs as BM-CDC-03/04/05 are implemented.
7. **Replace billing mock data** — `subscriptionSlice.js` should call the real `IAM_BILLING` endpoints (once P0 is fixed).
