# MAQUETTES — TECHZONE CLOUD PACK RUNTIME

---

# M01 — Runtime Overview

Cards:
- Active Applications
- Active Contexts
- Executable Resolutions
- Blocked
- Degraded
- Cache Health

Recent activations.

---

# M02 — Runtime Applications

Table:
- Application
- App Version
- Pack Version
- Environment
- Status
- Readiness
- Activated At
- Actions

---

# M03 — Launch Runtime

Selector:
- Application
- Published PackVersion
- Environment

CTA:
`Résoudre`.

---

# M04 — Resolving

Progress:
- Pack
- Manifest
- Integrity
- Dependencies
- Capabilities
- Data
- Integrations
- Configuration

---

# M05 — Resolution Executable

Large green status:
`EXECUTABLE`

Show:
- Resolution ID
- AppVersion
- PackVersion
- Environment
- Requirements summary.

CTA:
`Activer`.

---

# M06 — Resolution Blocked

Large blocking status:
`BLOCKED`

No app preview.

List:
- blocking errors
- missing capabilities
- mismatches
- unavailable providers.

---

# M07 — Application Version Mismatch

Dedicated critical screen:
- Pack Version
- Expected AppVersion
- Received AppVersion
- resolution blocked.

---

# M08 — Effective Manifest Summary

Cards:
- Business
- UI
- Automation
- Config
- Data
- Integrations
- Integrity.

---

# M09 — Effective Manifest Detail

Tabs:
- Structured
- JSON sanitized
- Capabilities
- Requirements
- Integrity.

---

# M10 — Activation Progress

Timeline:

```text
Resolution
Runtime Context
Cache
Providers
Activation
Readiness
Active
```

---

# M11 — Active Runtime Context

Header:
`ACTIVE`

Show:
- Application
- AppVersion
- PackVersion
- Environment
- Context ID
- Resolution ID.

---

# M12 — Readiness

Checklist:
- UI Definition
- Data Provider
- Automation
- Mandatory Integrations
- Capabilities
- Effective Config.

---

# M13 — Published Application

Actual application renderer.

Visible only after gate passes.

Runtime badge optional in dev/admin mode.

---

# M14 — Runtime Blocked Application Route

Instead of renderer:
- blocked illustration/status
- diagnostic reason
- correlation ID.

---

# M15 — Resolution List

Table:
- ID
- App
- Pack
- Environment
- Status
- Created
- Expires
- Actions.

---

# M16 — Resolution Detail

Sections:
- identity
- inputs
- effective result
- diagnostics
- activation.

---

# M17 — Activation List

Table:
- Application
- Environment
- Pack
- Context
- Status
- Activated
- Actor.

---

# M18 — Activation Detail

Timeline + effective configuration metadata.

---

# M19 — Deactivate Confirmation

Show:
- App
- Environment
- current version
- impact.

CTA:
`Désactiver`.

---

# M20 — Deactivated Context

Read-only historical view.

---

# M21 — Cache Overview

Cards:
- L1 entries
- hit rate if real
- invalidations
- memory usage if available.

---

# M22 — Cache Entries

Admin table:
- key summary
- tenant
- PackVersion
- Environment
- age.

No sensitive values.

---

# M23 — Cache Invalidate

Scoped form:
- Application
- Environment
- PackVersion.

---

# M24 — Runtime Diagnostics

Table:
- Stage
- Severity
- Code
- Message
- Resource
- Timestamp
- Correlation ID.

---

# M25 — Dependency Diagnostics

Tree:
- dependency
- required
- resolution
- provider
- status.

---

# M26 — Capability Diagnostics

Matrix:
- Required
- Registered
- Available
- Executable
- Result.

---

# M27 — Data Runtime Binding

Admin view:
- resolution
- business definition
- provider
- allowed bindings
- health.

No business records.

---

# M28 — Integration Runtime Binding

Show required connectors and availability.

No credentials.

---

# M29 — Runtime History

Timeline:
- resolved
- blocked
- activated
- degraded
- deactivated.

---

# M30 — Mobile Runtime

Responsive:
- active cards
- blocked alert
- readiness accordion
- diagnostics.

---

# Visual Direction

Use Techzone Cloud Runtime identity:

- premium SaaS ;
- navy sidebar ;
- very light workspace ;
- white rounded cards ;
- green/turquoise Runtime accents ;
- blue/indigo support accents ;
- amber warning ;
- red blocked/error ;
- Lucide icons ;
- clean tables ;
- explicit execution states ;
- responsive ;
- no fake status.
