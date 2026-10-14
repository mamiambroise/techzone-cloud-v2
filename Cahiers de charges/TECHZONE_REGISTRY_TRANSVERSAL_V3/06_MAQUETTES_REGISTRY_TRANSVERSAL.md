# MAQUETTES — REGISTRY TRANSVERSAL

# M01 — Registry Overview
Cards:
- Entries
- Available
- Deprecated
- Unavailable
- Disabled
- Conflicts
- Providers
- Schemas

# M02 — Registry Sources
Business/UI/Automation/Data/Integration/Runtime/API status.

# M03 — Entries List
Key/namespace/version/owner/provider/scope/status/availability.

# M04 — Entry Detail
Overview/Versions/Capabilities/Schemas/Compatibility/Availability/References/Diagnostics.

# M05 — Versions
Version/status/provider/schema/availability/used by.

# M06 — Capability Explorer
Search/filter capability.

# M07 — Capability Detail
Providers/versions/environments/consumers.

# M08 — Providers List
Provider/owner/type/entries/status/health.

# M09 — Provider Detail
Capabilities/entries/versions/health.

# M10 — Schemas List
Schema/version/owner/support/status.

# M11 — Schema Detail
Runtime support/consumers/compatibility.

# M12 — Compatibility Explorer
Requirement/version/schema/capability/provider/environment.

# M13 — Compatible Result
Selected candidate + reasons.

# M14 — Incompatible Result
Rejected candidates + error codes.

# M15 — Resolution Diagnostics
Full candidate evaluation.

# M16 — Availability Matrix
Entries × environments.

# M17 — Availability Detail
Registered/configured/health/effective status.

# M18 — Namespace Governance
Namespace/owner/writers/scope.

# M19 — Registration Form
Technical controlled registration.

# M20 — Registration Review
Stable key/version/owner/provider/capabilities.

# M21 — Duplicate Conflict
Conflicting owners/providers.

# M22 — Deprecate Entry
Replacement + removal target.

# M23 — Deprecated Entry
Banner + consumers + replacement.

# M24 — Disable Entry
Impact review.

# M25 — Remove Entry
Critical removal safety.

# M26 — References
PackVersions/RuntimeContexts/Deployments.

# M27 — Business Registry
Features/capabilities/events.

# M28 — UI Registry
Components/actions/templates.

# M29 — Automation Registry
Nodes/triggers/actions.

# M30 — Data Registry
Providers/repositories/contracts.

# M31 — Integration Registry
Connectors/contracts/capabilities.

# M32 — Runtime Registry
Runtime capabilities/schema support.

# M33 — API Registry
API contracts/versions/scopes.

# M34 — Cache Diagnostics
Hit ratio/entries/invalidation.

# M35 — Registry Diagnostics
Source-by-source status.

# M36 — Registry Audit
Registration/update/deprecation/disable/conflict.

# M37 — Missing Capability
Controlled error screen.

# M38 — Unsupported Schema
Compatibility error.

# M39 — Environment Mismatch
DEV available / PROD unavailable.

# M40 — Namespace Denied
403 technical state.

# M41 — Batch Resolution
Multiple requirements and outcomes.

# M42 — Published Locked References
Exact versions from Pack Manifest.

# M43 — Runtime Compatibility
Locked refs vs runtime support.

# M44 — Deployment Preflight
Requirements vs environment availability.

# M45 — Mobile Registry
Entry cards/capability search/diagnostics.

# M46 — Architecture Flow

```text
OWNER MODULES
↓
REGISTRY SOURCES
↓
REGISTRY CORE
↓
DISCOVERY / COMPATIBILITY / AVAILABILITY
↓
PACK MANAGER / PACK RUNTIME / DEPLOYMENT
```

---

# Visual Direction

- premium Techzone Cloud
- dark navy sidebar
- very light workspace
- blue/violet Registry accent
- white rounded cards
- green AVAILABLE
- amber DEPRECATED/DEGRADED
- red UNAVAILABLE/CONFLICT
- professional tables
- Lucide icons
- responsive
- no fake Registry entries/status
