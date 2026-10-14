# MAQUETTES — ADMINISTRATION PLATFORM

# M01 — Administration Overview
Cards:
- Active Tenants
- Suspended Tenants
- Active Users
- Critical Alerts
- Delegations
- Failed Jobs
- Degraded Modules
- Maintenance

# M02 — Users List
User/status/tenants/roles/MFA/last login/actions.

# M03 — User Detail
Profile/Memberships/Roles/Permissions/Sessions/Security/Audit.

# M04 — Disable User
Critical confirmation + reason.

# M05 — Revoke Sessions
User/session count/re-auth/confirm.

# M06 — Tenants List
Tenant/status/subscription/users/apps/environments/alerts.

# M07 — Tenant Detail
Overview/Users/Subscription/Apps/Environments/Limits/Diagnostics/Audit.

# M08 — Suspend Tenant
Risk panel + reason + impact + MFA/re-auth.

# M09 — Suspended Tenant
Status + impact + preserved data notice.

# M10 — Reactivate Tenant
Billing/access checks + confirmation.

# M11 — Governance Overview
Roles/Permissions/Privileged/Delegations/Stale Rights.

# M12 — Roles List
Role/scope/permissions/users/risk/status.

# M13 — Role Detail
Permissions/assignments/history.

# M14 — Permission Registry
Permission/module/roles/users/status.

# M15 — Privileged Access
User/role/scope/grant/last used/risk.

# M16 — Delegations List
Grantee/grantor/scope/permissions/expires/status.

# M17 — Create Delegation
Person → scope → permissions → duration → reason → review.

# M18 — Delegation Detail
Effective rights + timeline + revoke.

# M19 — Security Audit
Filters + events table.

# M20 — Audit Detail
Actor/action/target/result/reason/trace/before-after.

# M21 — Modules List
Module/version/status/health/capabilities/owner.

# M22 — Module Detail
Overview/config/capabilities/dependencies/diagnostics/history.

# M23 — Providers List
Provider/type/env/mode/status/health/credential ref.

# M24 — Provider Detail
Config refs/capabilities/health/diagnostics.

# M25 — Feature Flags
Key/scope/value/overrides/status/expiry.

# M26 — Feature Flag Editor
Scope/target/value/expiry/reason.

# M27 — Platform Settings
Owner-grouped settings registry.

# M28 — Setting Detail
Effective value/source/scope/schema/history.

# M29 — Jobs List
Job/scope/status/progress/requested/duration.

# M30 — Job Detail
Timeline/steps/log refs/diagnostics.

# M31 — Run Job
Action/risk/target/dry-run/confirm.

# M32 — Maintenance Calendar
Scope/window/status/impact.

# M33 — Schedule Maintenance
Scope/time/message/impact/review.

# M34 — Admin Actions Catalog
Cards by risk level.

# M35 — Execute Admin Action
Target/reason/re-auth/MFA/dry-run/confirm.

# M36 — Dry Run Result
Affected resources/warnings/no-effect badge.

# M37 — Diagnostics Matrix
IAM/Billing/Runtime/Data/Integrations/Deployment/API/DB.

# M38 — Diagnostic Detail
Module/stage/code/severity/message/trace.

# M39 — System Information
Version/commit/env/runtime/DB schema/module versions.

# M40 — Re-auth Required
Recent auth/MFA modal.

# M41 — Permission Denied
Admin 403 state.

# M42 — Mock Warning
DEV/TEST mock-data banner.

# M43 — Mobile Admin Overview
Critical cards + alerts + tenant lookup.

# M44 — Mobile Tenant Admin
Tenant summary/actions/diagnostics.

# M45 — Architecture Flow

```text
Admin UI
↓
Administration Contracts
↓
IAM / Billing / Registry / Runtime / Observability
↓
Owner Modules
↓
Audit
```

---

# Visual Direction

- premium Techzone Cloud
- dark navy sidebar
- gray-blue Platform accent
- bright workspace
- white rounded cards
- red only for critical/destructive
- amber warning
- green healthy
- Lucide icons
- dense admin tables
- explicit risk/re-auth indicators
- responsive
- no fake monitoring/admin data
