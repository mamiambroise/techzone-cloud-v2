# 4-Level Navigation Architecture

## Overview

The Techzone Cloud frontend implements a 4-level navigation hierarchy:

1. **Sidebar** — Top-level domains (11 groups)
2. **Body Tabs** — Mid-level groupings within each domain
3. **Subtabs** — Individual pages within each tab group
4. **Page** — The actual content/route

## Architecture

```
Sidebar (Domain)
  └─ Body Tabs (Tab Group)
     └─ Subtabs (Individual Pages)
        └─ Page Content (Route)
```

## Level 1: Sidebar Domains (11)

| # | ID | Label | Icon | Description |
|---|-----|-------|------|-------------|
| 1 | `platform` | Platform | `LayoutDashboard` | Platform overview, cockpit, applications |
| 2 | `integration` | Intégration | `AppWindow` | Integration lifecycle, deployments |
| 3 | `deployment` | Déploiement | `BriefcaseBusiness` | Environment deployment, releases |
| 4 | `erp` | ERP | `Package` | ERP registry, adapter, modules |
| 5 | `automation` | Automatisation | `Workflow` | Rules, workflows, automation engine |
| 6 | `data-runtime` | Data Runtime | `Database` | MCP resources, data contracts |
| 7 | `iam` | IAM | `ShieldCheck` | Users, sessions, roles, policies |
| 8 | `billing` | Facturation | `CreditCard` | Subscriptions, invoices, plans |
| 9 | `observability` | Observabilité | `Activity` | Logs, audit, monitoring, alerts |
| 10 | `admin` | Administration | `Settings` | Configuration, governance |
| 11 | `tech` | Tech Docs | `Layers` | Documentation, diagnostics |

## Level 2: Body Tabs

Each domain has 1-4 body tabs that represent functional groupings:

### Platform
- **Cockpit** (`/`) — Overview dashboard
- **Applications** (`/applications`) — App catalog and workspace
- **Publications** (`/publications`) — Release publication pipeline
- **History** (`/history`) — Rollback and history
- **Validation** (`/validation`) — Pack validation
- **Environments** (`/environments`) — Environment management
- **Contracts** (`/contracts`) — Integration contracts
- **Configuration** (`/configuration`) — System configuration
- **Snapshots** (`/snapshots`) — State snapshots
- **Platform Contract** (`/platform-contract`) — Schema/contract
- **Integrations** (`/integrations`) — Integration management
- **Deployment Publication** (`/deployment-publication`) — Deployment publishing

### ERP
- **Dashboard** (`/erp-dashboard`) — ERP metrics and KPIs
- **ERP Registry** (`/erps`) — ERP instance registry
- **ERP Adapter** (`/erp/*`) — CRUD operations for each ERP entity

### IAM
- **Users** (`/iam/users`) — User management
- **Sessions** (`/iam/sessions`) — Active sessions
- **Identities** (`/iam/identities`) — Identity providers
- **Roles** (`/iam/roles`) — Role management
- **Policies** (`/iam/policies`) — Policy management
- **Tenants** (`/iam/tenants`) — Tenant management

### Automation
- **Cockpit** (`/automation`) — Automation overview
- **Conditions** (`/automation/conditions`) — Condition engine
- **Rules** (`/automation/rules`) — Business rules
- **Triggers** (`/automation/triggers`) — Event triggers
- **Workflows** (`/automation/workflows`) — Workflow engine
- **History** (`/automation/history`) — Execution history

### Data Runtime
- **Resources** (`/data-runtime`) — MCP resource browser
- **History** (`/data-runtime/history`) — Query/execution history

## Level 3: Subtabs

Subtabs are individual routes within a tab group. They are defined in `frontend/src/app/navigationConfig.js` as `pageDefinitions` entries and filtered by `groupEntries()` for the SubNavBar.

Example for the ERP domain:
```
ERP Dashboard  →  /erp-dashboard
ERP Registry   →  /erps
Clients        →  /erp/clients
Products       →  /erp/products
Orders         →  /erp/orders
...
```

## Level 4: Page

Each subtab renders a dedicated page component (lazy-loaded) via the `<Outlet />` in `TechzoneLayout`.

## Navigation Flow

1. **Sidebar** selection navigates to the domain's default route
2. **SubNavBar** (body tabs) provides secondary navigation within the domain
3. **Page content** fills the main area below the SubNavBar

The URL is the single source of truth (React Router `BrowserRouter`). `RouteToTabSync.jsx` syncs URL changes to Redux `platformSlice` state for backward compatibility with components that read from Redux.

## Key Files

| File | Responsibility |
|------|---------------|
| `frontend/src/app/navigationConfig.js` | Domain definitions, page definitions, route resolution |
| `frontend/src/app/routes.js` | Canonical route path constants |
| `frontend/src/app/navigationAccess.js` | `canAccess()` permission check |
| `frontend/src/app/RouteToTabSync.jsx` | URL → Redux tab state sync |
| `frontend/src/components/Sidebar.jsx` | Level 1 sidebar rendering |
| `frontend/src/components/SubNavBar.jsx` | Level 2/3 subtab rendering |
| `frontend/src/App.jsx` | Route matching and component resolution |
| `frontend/src/layouts/TechzoneLayout.jsx` | Layout wrapper (Header + Sidebar + SubNavBar + main) |
