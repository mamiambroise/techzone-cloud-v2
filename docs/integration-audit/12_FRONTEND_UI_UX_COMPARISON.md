# Report 12: Frontend UI/UX Comparison

**Scope:** Frontend architecture, navigation, UI components, pages, and UX patterns across all repositories
**Date:** 2026-09-29

---

## 12.1 Executive Summary

| Aspect | Local | jasmina-bm/Mami | taratra31/ERP-full | taratra31/Lianah |
|--------|-------|-----------------|-------------------|------------------|
| Framework | React 19 + Vite 6 | React 19 + Vite 6 | React + Vite | React + Vite |
| TailwindCSS | YES | YES | NO (CSS files) | NO (CSS files) |
| UI Library | Local `components/ui/` | Shared components | Basic | Basic |
| Nav Sections | 4 (Platform, Conception, ERP, LIVRAISON) | 6+ (design.bm, design.pm, runtime.pr) | 7 | 7 |
| Nav Groups | 11 | 7 | 7 | 8 |
| Total Pages | ~30+ | ~25 (PM+PR) | 4 | 35+ |
| Shared Components | Basic UI library | EmptyState, ErrorState, JsonViewer, StatusBadge, TechnicalDetails, PageHeader | Header, Layout, Sidebar | DonutChart, LineChart, observability components |
| Tests | 9 test files | Unknown | Unknown | Unknown |

**Overall Status:** `MIXED` — taratra31/Lianah has the richest frontend (35+ pages, charts); jasmina-bm/Mami has specialized PM/PR views; local has the most comprehensive architecture but uses mock data for IAM.
**Recommendation:** 
- **KEEP_CURRENT** for local navigation and architecture
- **IMPORT** from jasmina-bm/Mami: pack-manager/pack-runtime views, shared components
- **IMPORT** from taratra31/Lianah: observability components, charts, billing/admin/observability pages

## 12.2 Frontend Architecture Comparison

### Local Frontend Architecture

| File | Function | Status |
|------|----------|--------|
| `frontend/src/app/navigationConfig.js` | Navigation config — 4 sections, 11 groups | FULLY IMPLEMENTED |
| `frontend/src/app/routes.js` | Route definitions — 18 routes | FULLY IMPLEMENTED |
| `frontend/src/components/Sidebar.jsx` | Sidebar (navigationConfig-driven) | FULLY IMPLEMENTED |
| `frontend/src/components/ContextBar.jsx` | Environment + tenant selector | FULLY IMPLEMENTED |
| `frontend/src/services/apiClient.js` | Axios with `/api` and `/api/iam` base URLs | FULLY IMPLEMENTED |
| `frontend/src/components/AuthProvider.jsx` | Auth context (token, refresh) | FULLY IMPLEMENTED |
| `frontend/src/components/ui/` | Basic UI components (Button, Card, Table, etc.) | FULLY IMPLEMENTED |
| `frontend/src/features/iam-demo/` | IAM demo pages (10+ pages with mock data) | FULLY IMPLEMENTED |
| `frontend/src/components/business-manager/` | BM workspace + tests | FULLY IMPLEMENTED |
| `vite.config.ts` | Vite config with proxy (`/api/iam` and `/api` → :3003) | FULLY IMPLEMENTED |

### Local Navigation Structure

```
PLATFORM
├── Vue d'ensemble
├── Applications & Versions
├── Environnements
├── Contrats
└── Configuration

CONCEPTION
├── Business Manager
│   ├── Business Contracts
│   ├── Data Model
│   ├── Features
│   ├── Navigation
│   └── Runtime Validation
├── Pack Manager (ComingSoon)
│   └── (Packs, Versions, Modules, Features, etc. — PLANNED)
└── Pack Runtime (ComingSoon)
    └── (Runtime Cockpit, Feature Catalog, etc. — PLANNED)

ERP & RUNTIME
├── ERP Adapter
│   ├── ERP List
│   ├── ERP Create
│   └── ERP Edit
├── Data Runtime
│   ├── Query Builder
│   ├── Execution
│   └── History
└── ERP Registry

AUTOMATION
├── Rules & Workflows
│   ├── Rules Engine
│   ├── Workflows
│   ├── Triggers
│   └── History

LIVRAISON
├── Integrations
│   ├── API Manager
│   ├── Connectors
│   ├── Credentials
│   ├── Webhooks
│   └── Synchronizations
├── Deployments
│   ├── Deployments
│   ├── Releases
│   ├── Rollback
│   ├── Environments
│   ├── Gates
│   └── Cockpit
└── Diagnostics
    ├── Integration Diagnostics
    └── Deployment Diagnostics

IAM (iam-demo feature)
├── Auth (Login, Register, MFA)
├── Users, Tenants, Roles, Policies
└── Observability, Billing, Admin

SETTINGS
├── Configuration
├── Navigation
└── Activity
```

### jasmina-bm/Mami Frontend Architecture

| File | Function | Status |
|------|----------|--------|
| `Frontend/src/app/navigationConfig.js` | Module-based: `design.bm`, `design.pm`, `runtime.pr` | FULLY IMPLEMENTED |
| `Frontend/src/components/views/pack-manager/` | 12 Pack Manager views | FULLY IMPLEMENTED |
| `Frontend/src/components/views/pack-runtime/` | 10 Pack Runtime views | FULLY IMPLEMENTED |
| `Frontend/src/components/common/` | Shared components (EmptyState, ErrorState, JsonViewer, StatusBadge, TechnicalDetails, PageHeader, formatDateTime) | FULLY IMPLEMENTED |
| `Frontend/src/context/AppContext.jsx` | App context | FULLY IMPLEMENTED |
| `Frontend/src/lib/api.js` | API client | FULLY IMPLEMENTED |

### taratra31/ERP-full Frontend Architecture

| File | Function | Status |
|------|----------|--------|
| `new erp-adapter-platform/frontend/` | React + Vite | FULLY IMPLEMENTED (minimal) |
| Components | Header, Layout, Sidebar | FULLY IMPLEMENTED |
| Pages | Dashboard, ERPCreate, ERPEdit, ERPList | FULLY IMPLEMENTED (4 pages only) |

### taratra31/Lianah Frontend Architecture

| File | Function | Status |
|------|----------|--------|
| `Auth_AIM/frontend/src/components/Sidebar.jsx` | Sidebar with 7 sections | FULLY IMPLEMENTED |
| `Auth_AIM/frontend/src/components/Layout.jsx` | AdminLayout (drawer + overlay) | FULLY IMPLEMENTED |
| `Auth_AIM/frontend/src/components/Topbar.jsx` | Topbar | FULLY IMPLEMENTED |
| `Auth_AIM/frontend/src/components/Header.jsx` | Header | FULLY IMPLEMENTED |
| `Auth_AIM/frontend/src/components/UserDetailPanel.jsx` | User detail panel | FULLY IMPLEMENTED |
| `Auth_AIM/frontend/src/components/auth/` | LoginForm, ProtectedRoute | FULLY IMPLEMENTED |
| `Auth_AIM/frontend/src/components/observability/` | KpiCard, DataTable, StatusBadge, SeverityBadge, Timeline, etc. | FULLY IMPLEMENTED |
| `Auth_AIM/frontend/src/components/DonutChart.jsx` | Donut chart | FULLY IMPLEMENTED |
| `Auth_AIM/frontend/src/components/LineChart.jsx` | Line chart | FULLY IMPLEMENTED |
| `Auth_AIM/frontend/src/components/SectionIcon.jsx` | Section icon | FULLY IMPLEMENTED |

### taratra31/Lianah Navigation Structure

```
DASHBOARD
├── Dashboard
└── À faire (6 items)

PLATEFORME
├── Platform Foundation (disabled)
├── Auth + IAM + Context
│   ├── Vue d'ensemble
│   ├── Utilisateurs & Identités
│   │   ├── Utilisateurs
│   │   ├── Identités
│   │   ├── Liens Identité ERP
│   │   └── Groupes d'identités
│   ├── Organisations & Tenants
│   │   ├── Organisations
│   │   └── Tenants
│   ├── Rôles & Permissions
│   ├── Accès & Policies
│   ├── Sessions & Sécurité
│   └── Contextes
├── Platform Administration
│   ├── Vue d'ensemble
│   ├── Utilisateurs
│   ├── Organisations & Tenants
│   ├── Gouvernance des Accès
│   ├── Délégation
│   ├── Sécurité & Audit
│   ├── Monitoring & Diagnostics
│   └── Actions Administratives
├── Tenant / Subscription / Billing
│   ├── Vue d'ensemble
│   ├── Plans & Offres
│   ├── Abonnements
│   ├── Facturation
│   ├── Paiements
│   ├── Intégration & Webhooks
│   ├── Entitlements & Quotas
│   ├── Règles d'accès par plan
│   └── Gestion des Features
└── Observability & Security
    ├── Vue d'ensemble
    ├── Logs
    ├── Audit
    ├── Security Events
    ├── Monitoring
    └── Alert Manager

CONCEPTION
├── Business Manager (disabled)
└── Pack Manager (disabled)

ERP & RUNTIME
├── ERP Adapter (disabled)
└── Runtime (disabled)

AUTOMATION
└── Rules & Workflows (disabled)

LIVRAISON
└── Integrations (disabled)
```

## 12.3 Page Inventory Comparison

| Feature Area | Local Pages | jasmina-bm/Mami Pages | taratra31/ERP-full Pages | taratra31/Lianah Pages |
|-------------|-------------|----------------------|--------------------------|------------------------|
| Dashboard | 1 | 0 | 1 | 1 + À faire |
| IAM Auth | Login (iam-demo) | 0 | 0 | LoginPage |
| IAM Users | 1 (mock) | 0 | 0 | 1 (real) |
| IAM Identities | 1 (mock) | 0 | 0 | 1 (real) |
| IAM Identity Links | 0 | 0 | 0 | 1 |
| IAM Identity Groups | 0 | 0 | 0 | 1 |
| IAM Organizations | 1 (mock) | 0 | 0 | 1 |
| IAM Tenants | 1 (mock) | 0 | 0 | 1 |
| IAM Roles | 1 (mock) | 0 | 0 | 1 |
| IAM Policies | 1 (mock) | 0 | 0 | 1 |
| IAM Sessions | 1 (mock) | 0 | 0 | 1 |
| IAM MFA | 1 (mock) | 0 | 0 | 0 |
| IAM Context | 1 (mock) | 0 | 0 | 1 |
| IAM Invitation | 0 | 0 | 0 | 1 |
| IAM Overview | 1 | 0 | 0 | 1 |
| Admin Overview | 0 | 0 | 0 | 1 |
| Admin Users | 0 | 0 | 0 | 1 |
| Admin Org/Tenant | 0 | 0 | 0 | 1 |
| Admin Governance | 0 | 0 | 0 | 1 |
| Admin Delegation | 0 | 0 | 0 | 1 |
| Admin Security Audit | 0 | 0 | 0 | 1 |
| Admin Monitoring | 0 | 0 | 0 | 1 |
| Admin Actions | 0 | 0 | 0 | 1 |
| Billing Overview | 0 | 0 | 0 | 1 |
| Billing Plans | 0 | 0 | 0 | 1 |
| Billing Subscriptions | 0 | 0 | 0 | 1 |
| Billing Invoices | 0 | 0 | 0 | 1 |
| Billing Payments | 0 | 0 | 0 | 1 |
| Billing Webhooks | 0 | 0 | 0 | 1 |
| Billing Entitlements | 0 | 0 | 0 | 1 |
| Billing Access Rules | 0 | 0 | 0 | 1 |
| Billing Features | 0 | 0 | 0 | 1 |
| Observability Overview | 0 | 0 | 0 | 1 |
| Observability Logs | 0 | 0 | 0 | 1 |
| Observability Audit | 0 | 0 | 0 | 1 |
| Observability Security Events | 0 | 0 | 0 | 1 |
| Observability Monitoring | 0 | 0 | 0 | 1 |
| Observability Alert Manager | 0 | 0 | 0 | 1 |
| Pack Manager Cockpit | 0 | 1 | 0 | 0 |
| Pack List/Catalog | 0 | 1 | 0 | 0 |
| Pack Editor | 0 | 1 | 0 | 0 |
| Module Editor | 0 | 1 | 0 | 0 |
| Feature Editor | 0 | 1 | 0 | 0 |
| Capability Editor | 0 | 1 | 0 | 0 |
| Dependency Editor | 0 | 1 | 0 | 0 |
| Rule Editor | 0 | 1 | 0 | 0 |
| Validation Editor | 0 | 1 | 0 | 0 |
| Manifest View | 0 | 1 | 0 | 0 |
| Publish View | 0 | 1 | 0 | 0 |
| Snapshot View | 0 | 1 | 0 | 0 |
| Runtime Cockpit | 0 | 1 | 0 | 0 |
| Feature Catalog | 0 | 1 | 0 | 0 |
| Capabilities View | 0 | 1 | 0 | 0 |
| Module Catalog | 0 | 1 | 0 | 0 |
| Dependency Resolver | 0 | 1 | 0 | 0 |
| Manifest Inspection | 0 | 1 | 0 | 0 |
| Context Management | 0 | 1 | 0 | 0 |
| Diagnostics View | 0 | 1 | 0 | 0 |
| Cache Management | 0 | 1 | 0 | 0 |
| API Contracts View | 0 | 1 | 0 | 0 |
| ERP List | 1 | 0 | 1 | 0 |
| ERP Create | 1 | 0 | 1 | 0 |
| ERP Edit | 1 | 0 | 1 | 0 |
| Data Runtime Query | 1 | 0 | 0 | 0 |
| Data Runtime Execution | 1 | 0 | 0 | 0 |
| Data Runtime History | 1 | 0 | 0 | 0 |
| Automation Rules | 1 | 0 | 0 | 0 |
| Automation Workflows | 1 | 0 | 0 | 0 |
| Automation Diagnostics | 1 | 0 | 0 | 0 |
| Platform Dashboard | 1 | 0 | 0 | 0 |
| Applications | 1 | 0 | 0 | 0 |
| Environments | 1 | 0 | 0 | 0 |
| Platform Contracts | 1 | 0 | 0 | 0 |
| Platform Config | 1 | 0 | 0 | 0 |
| Integration API Manager | 1 | 0 | 0 | 0 |
| Integration Connectors | 1 | 0 | 0 | 0 |
| Integration Credentials | 1 | 0 | 0 | 0 |
| Integration Webhooks | 1 | 0 | 0 | 0 |
| Integration Sync | 1 | 0 | 0 | 0 |
| Integration Diagnostics | 1 | 0 | 0 | 0 |
| Deployment Overview | 1 | 0 | 0 | 0 |
| Deployments | 1 | 0 | 0 | 0 |
| Releases | 1 | 0 | 0 | 0 |
| Rollback | 1 | 0 | 0 | 0 |
| Environments | 1 | 0 | 0 | 0 |
| Gates | 1 | 0 | 0 | 0 |
| Deployment Cockpit | 1 | 0 | 0 | 0 |

**Total:** Local ~35 pages, jasmina-bm/Mami ~22 PM/PR pages, taratra31/ERP-full 4 pages, taratra31/Lianah 35+ pages

## 12.4 UI Component Comparison

### Local UI Components

| Component | Path | Status |
|----------|------|--------|
| Button | `components/ui/button.jsx` | FULLY IMPLEMENTED |
| Card | `components/ui/card.jsx` | FULLY IMPLEMENTED |
| Table | `components/ui/table.jsx` | FULLY IMPLEMENTED |
| Input | `components/ui/input.jsx` | FULLY IMPLEMENTED |
| Select | `components/ui/select.jsx` | FULLY IMPLEMENTED |
| Badge | `components/ui/badge.jsx` | FULLY IMPLEMENTED |
| Modal | `components/ui/modal.jsx` | FULLY IMPLEMENTED |
| StatusBadge | `components/ui/status-badge.jsx` | FULLY IMPLEMENTED |
| PageHeader | `components/ui/PageHeader.jsx` | FULLY IMPLEMENTED |
| Sidebar | `components/Sidebar.jsx` | FULLY IMPLEMENTED |
| ContextBar | `components/ContextBar.jsx` | FULLY IMPLEMENTED |
| AuthProvider | `components/AuthProvider.jsx` | FULLY IMPLEMENTED |

**Local tests:**
- `components/ui/Card.test.jsx`
- `components/ui/PageHeader.test.jsx`
- `components/ContextBar.test.jsx`
- `components/business-manager/BMWorkspaceRoute.test.jsx`
- `components/business-manager/businessManager.test.jsx`
- `app/navigationConfig.test.js`
- `tests/configuration-navigation.test.jsx`
- `tests/refresh.test.js`
- `tests/session-navigation.test.jsx`

### jasmina-bm/Mami Shared Components

| Component | Path | Status |
|----------|------|--------|
| EmptyState | `components/common/EmptyState.jsx` | FULLY IMPLEMENTED |
| ErrorState | `components/common/ErrorState.jsx` | FULLY IMPLEMENTED |
| JsonViewer | `components/common/JsonViewer.jsx` | FULLY IMPLEMENTED |
| StatusBadge | `components/common/StatusBadge.jsx` | FULLY IMPLEMENTED |
| TechnicalDetails | `components/common/TechnicalDetails.jsx` | FULLY IMPLEMENTED |
| PageHeader | `components/common/PageHeader.jsx` | FULLY IMPLEMENTED |
| formatDateTime | `lib/formatDateTime.js` | FULLY IMPLEMENTED |
| AppContext | `context/AppContext.jsx` | FULLY IMPLEMENTED |
| API Client | `lib/api.js` | FULLY IMPLEMENTED |

### taratra31/Lianah Shared Components

| Component | Path | Status |
|----------|------|--------|
| KpiCard | `components/observability/KpiCard.jsx` | FULLY IMPLEMENTED |
| DataTable | `components/observability/DataTable.jsx` | FULLY IMPLEMENTED |
| EmptyState | `components/observability/EmptyState.jsx` | FULLY IMPLEMENTED |
| ErrorState | `components/observability/ErrorState.jsx` | FULLY IMPLEMENTED |
| LoadingState | `components/observability/LoadingState.jsx` | FULLY IMPLEMENTED |
| SearchBar | `components/observability/SearchBar.jsx` | FULLY IMPLEMENTED |
| FilterBar | `components/observability/FilterBar.jsx` | FULLY IMPLEMENTED |
| StatusBadge | `components/observability/StatusBadge.jsx` | FULLY IMPLEMENTED |
| SeverityBadge | `components/observability/SeverityBadge.jsx` | FULLY IMPLEMENTED |
| Timeline | `components/observability/Timeline.jsx` | FULLY IMPLEMENTED |
| DetailPanel | `components/observability/DetailPanel.jsx` | FULLY IMPLEMENTED |
| ConfirmationModal | `components/observability/ConfirmationModal.jsx` | FULLY IMPLEMENTED |
| useToast | `components/observability/useToast.js` | FULLY IMPLEMENTED |
| DonutChart | `components/DonutChart.jsx` | FULLY IMPLEMENTED |
| LineChart | `components/LineChart.jsx` | FULLY IMPLEMENTED |
| SectionIcon | `components/SectionIcon.jsx` | FULLY IMPLEMENTED |
| AdminLayout | `components/Layout.jsx` | FULLY IMPLEMENTED |
| Topbar | `components/Topbar.jsx` | FULLY IMPLEMENTED |
| UserDetailPanel | `components/UserDetailPanel.jsx` | FULLY IMPLEMENTED |
| LoginForm | `components/auth/LoginForm.jsx` | FULLY IMPLEMENTED |
| ProtectedRoute | `components/auth/ProtectedRoute.jsx` | FULLY IMPLEMENTED |

### Component Comparison Matrix

| Component | Local | jasmina-bm/Mami | taratra31/Lianah | Import Priority |
|----------|-------|-----------------|------------------|----------------|
| StatusBadge | YES (ui) | YES (common) | YES (observability) | LOW (local exists) |
| EmptyState | (not found) | YES | YES | HIGH |
| ErrorState | (not found) | YES | YES | HIGH |
| LoadingState | (not found) | (not found) | YES | HIGH |
| KpiCard | (not found) | (not found) | YES | HIGH |
| DataTable | (not found) | (not found) | YES | HIGH |
| DonutChart | (not found) | (not found) | YES | MEDIUM |
| LineChart | (not found) | (not found) | YES | MEDIUM |
| PageHeader | YES | YES | YES (SectionIcon) | LOW (local exists) |
| JsonViewer | (not found) | YES | (not found) | MEDIUM (for diagnostics) |
| TechnicalDetails | (not found) | YES | (not found) | MEDIUM (for diagnostics) |
| ConfirmationModal | (not found) | (not found) | YES | HIGH |
| useToast | (not found) | (not found) | YES | HIGH |

## 12.5 UX Pattern Comparison

| UX Pattern | Local | jasmina-bm/Mami | taratra31/ERP-full | taratra31/Lianah |
|-----------|-------|-----------------|--------------------|------------------|
| Loading States | Basic spinner? | EmptyState, ErrorState, LoadingState | Basic | EmptyState, ErrorState, LoadingState |
| Empty States | Card.test.jsx | EmptyState.jsx | Basic | EmptyState.jsx |
| Error States | Basic? | ErrorState.jsx | Basic | ErrorState.jsx |
| Search | SearchBar (iam-demo?) | formatDateTime | Basic | SearchBar.jsx, FilterBar.jsx |
| Filtering | FilterBar (iam-demo?) | (not found) | Basic | FilterBar.jsx |
| Pagination | Table component | (not found) | Basic | DataTable.jsx |
| Status Badges | StatusBadge (ui) | StatusBadge (common) | Basic | StatusBadge, SeverityBadge |
| Breadcrumbs | Not found | (not found) | (not found) | (not found) |
| Action Dialogs | Modal (ui) | PageHeader actions | Basic | ConfirmationModal |
| Toast Notifications | Not found | (not found) | Basic | useToast.js |
| Responsive Layout | Drawer + overlay | Drawer + overlay | Basic | AdminLayout.jsx (drawer + overlay) |
| Mobile Menu | Sidebar (drawer) | Sidebar | Basic | Layout.jsx (drawer + overlay) |

## 12.6 Theme/Styling Comparison

| Aspect | Local | jasmina-bm/Mami | taratra31/ERP-full | taratra31/Lianah |
|--------|-------|-----------------|--------------------|------------------|
| CSS Framework | TailwindCSS | TailwindCSS | CSS files | CSS files |
| Component Isolation | CSS modules? | CSS files | CSS files | CSS files per page |
| Theme Variables | Tailwind config | Tailwind config | Custom CSS | Custom CSS |
| Dark Mode | ? | ? | ? | ? |

## 12.7 Key Findings

1. **taratra31/Lianah Has the Richest Frontend:** 35+ fully implemented pages with a comprehensive shared component library (KpiCard, DataTable, StatusBadge, SeverityBadge, Timeline, DonutChart, LineChart, ConfirmationModal, useToast, etc.) and a proper AdminLayout with drawer + overlay.

2. **jasmina-bm/Mami Has Specialized PM/PR Views:** 12 Pack Manager views + 10 Pack Runtime views with a sophisticated `RuntimeCockpitView` that has 8 modes (overview, context, resolver, manifest, status, cache, diagnostics, api). Shared components (EmptyState, ErrorState, JsonViewer, StatusBadge, TechnicalDetails, PageHeader) are reusable.

3. **taratra31/ERP-full Frontend is Minimal:** Only 4 pages (Dashboard, ERPCreate, ERPEdit, ERPList) — the richest content is in the Lianah branch.

4. **Local Frontend is Architecturally Complete but IAM is Mock:** Local has comprehensive navigation (11 groups, 4 sections), proper routing (18 routes), ContextBar, Sidebar, apiClient, and AuthProvider. But IAM pages in `iam-demo/` use **mock data** — not real API calls.

5. **Component Gap:** Local's `components/ui/` library is basic (Button, Card, Table, Input, Select, Badge, Modal, StatusBadge). Missing: KpiCard, DataTable, EmptyState, ErrorState, LoadingState, DonutChart, LineChart, ConfirmationModal, useToast, FilterBar, SearchBar, SeverityBadge.

6. **Navigation Gap:** Local's navigationConfig has Packs/Runtime as "ComingSoon" — jasmina-bm/Mami has fully implemented these sections.

7. **Tests:** Local has 9 frontend test files; taratra31 and jasmina-bm/Mami test coverage unknown.

## 12.8 Recommendations

| Priority | Category | Recommendation | Source |
|----------|----------|----------------|--------|
| P0 | MISSING_IN_CURRENT | Adopt jasmina-bm/Mami Pack Manager views (12 views) and Pack Runtime views (10 views) | jasmina-bm/Mami: Frontend/src/components/views/ |
| P0 | MISSING_IN_CURRENT | Adopt jasmina-bm/Mami shared components (EmptyState, ErrorState, JsonViewer, TechnicalDetails, PageHeader) | jasmina-bm/Mami: Frontend/src/components/common/ |
| P1 | MISSING_IN_CURRENT | Adopt taratra31/Lianah billing/admin/observability page patterns | taratra31/Lianah: Auth_AIM/frontend/src/pages/ |
| P1 | MISSING_IN_CURRENT | Import taratra31/Lianah observability components (KpiCard, DataTable, StatusBadge, SeverityBadge, Timeline, ConfirmationModal, useToast) | taratra31/Lianah: Auth_AIM/frontend/src/components/ |
| P2 | MISSING_IN_CURRENT | Import chart components (DonutChart, LineChart) from taratra31/Lianah | taratra31/Lianah: components/ |
| P2 | IMPROVE_CURRENT | Replace iam-demo mock data with real API calls to local IAM backend | Local: iam-demo/ → api/iam/* |
| P2 | MISSING_IN_CURRENT | Import AdminLayout (drawer + overlay) from taratra31/Lianah | taratra31/Lianah: components/Layout.jsx |
| P3 | IMPROVE_CURRENT | Add tests for new imported components | Pattern from local test files |

---

*Report generated: 2026-09-29 00:15 UTC*
*No files were modified. This is a read-only audit.*