# SPEC UI — ADMINISTRATION PLATFORM

---

# 1. Visual Identity

- dark navy sidebar ;
- very light workspace ;
- gray-blue platform accent ;
- white cards ;
- high-risk red/amber treatment ;
- Lucide icons ;
- professional dense admin tables ;
- responsive.

---

# 2. Navigation

```text
Administration
├── Vue d’ensemble
├── Utilisateurs
├── Organisations & Tenants
├── Gouvernance des accès
├── Délégation
├── Sécurité & Audit
├── Modules & Providers
├── Feature Flags
├── Paramètres plateforme
├── Jobs & Maintenance
├── Actions administratives
├── Diagnostics
└── Informations système
```

---

# 3. Overview

Cards:
- Active Tenants
- Suspended Tenants
- Active Users
- Critical Alerts
- Active Delegations
- Failed Jobs
- Degraded Modules
- Maintenance.

Real data only.

---

# 4. Users

Table:
- User
- Status
- Tenants
- Roles
- MFA
- Last Sign-in
- Sessions
- Actions.

---

# 5. User Detail

Tabs:
- Profile
- Memberships
- Roles
- Permissions
- Sessions
- Security Events
- Audit.

---

# 6. User Critical Actions

Actions:
- Disable
- Enable
- Revoke Sessions

Display:
- reason required
- re-auth requirement if applicable.

---

# 7. Tenants

Table:
- Tenant
- Status
- Subscription
- Users
- Applications
- Environments
- Last Activity
- Alerts.

---

# 8. Tenant Detail

Tabs:
- Overview
- Users
- Subscription
- Applications
- Environments
- Limits
- Diagnostics
- Audit.

---

# 9. Suspend Tenant

Critical modal:
- tenant
- reason
- impact summary
- required re-auth/MFA status
- confirmation.

---

# 10. Reactivate Tenant

Show:
- current status
- billing state
- blocked reason if any
- confirmation.

---

# 11. Governance Overview

Cards:
- Roles
- Permissions
- Privileged Users
- Stale Privileges
- Active Delegations.

---

# 12. Roles

Table:
- Role
- Scope
- Permissions
- Users
- Risk
- Status.

---

# 13. Permission Registry

Search:
- Permission
- Module
- Description
- Roles
- Users
- Status.

---

# 14. Privileged Access

List:
- User
- Role
- Scope
- Tenant
- Granted By
- Last Used
- Risk.

---

# 15. Delegations

Table:
- Grantee
- Grantor
- Scope
- Permissions
- Starts
- Expires
- Status.

---

# 16. Create Delegation

Wizard:
1 Person
2 Scope
3 Permissions
4 Duration
5 Reason/Ticket
6 Review.

---

# 17. Delegation Detail

Timeline + effective permissions.

Actions:
- revoke
- extend only if policy.

---

# 18. Security & Audit

Filters:
- Severity
- Actor
- Action
- Tenant
- Target
- Date.

---

# 19. Audit Event Detail

Show:
- actor
- principal
- action
- target
- result
- reason
- trace ID
- before/after safe summary.

---

# 20. Modules

Table:
- Module
- Version
- Status
- Health
- Capabilities
- Owner
- Last Check.

---

# 21. Module Detail

Tabs:
- Overview
- Configuration
- Capabilities
- Dependencies
- Health
- Diagnostics
- History.

---

# 22. Providers

Table:
- Provider
- Type
- Environment
- Mode REAL/MOCK/SANDBOX
- Status
- Health
- Credential Ref.

---

# 23. Provider Detail

No secret.

Show:
- config refs
- capability
- diagnostics
- owner module.

---

# 24. Feature Flags

Table:
- Key
- Scope
- Default
- Overrides
- Status
- Owner
- Expires.

---

# 25. Feature Flag Editor

Fields:
- key
- scope
- value
- tenant/environment target
- expiry
- reason.

---

# 26. Platform Settings

Group by owner module.

Show:
- key
- effective value
- source
- scope
- sensitive flag
- editable.

---

# 27. Jobs

Table:
- Job
- Scope
- Status
- Progress
- Requested By
- Started
- Duration.

---

# 28. Job Detail

Timeline:
- queued
- started
- steps
- completed/failed.

Diagnostics + trace.

---

# 29. Maintenance

Calendar/table:
- Scope
- Start
- End
- Status
- Impact
- Message
- Actor.

---

# 30. Enable Maintenance

Wizard:
- scope
- start/end
- impact
- message
- review.

---

# 31. Admin Actions

Catalog cards:
- action
- target type
- risk
- required permission
- re-auth indicator.

---

# 32. Execute Admin Action

Risk banner:
- target
- reason
- dry-run if available
- effect summary
- confirmation.

---

# 33. Dry Run Result

Show:
- proposed operations
- affected resources
- warnings
- no-effect badge.

---

# 34. Diagnostics

Matrix:
- IAM
- Billing
- Runtime
- Data
- Integrations
- Deployment
- API
- Database.

---

# 35. Diagnostic Detail

- module
- stage
- severity
- code
- message
- traceId
- timestamp.

---

# 36. System Information

Cards:
- Platform Version
- Build/Commit
- Environment
- Node Runtime
- DB Schema
- Module Versions
- Maintenance Status.

---

# 37. Permission Denied

403 admin workspace.

No target data leak.

---

# 38. Re-auth Required

Dedicated modal:
- password/reauth flow
- MFA if required
- operation context.

---

# 39. Mock Warning

If DEV/TEST:
```text
MOCK ADMIN DATA
```

In REAL this state must never appear silently.

---

# 40. Responsive

Mobile:
- overview
- tenant/user lookup
- audit
- jobs
- critical actions with controlled forms.

---

# 41. UI DoD

- real API data
- mocks clearly excluded from REAL
- permissions reflected
- critical actions visibly protected
- reasons/audit shown
- no secrets
- responsive.
