# MAQUETTES — ENVIRONMENT & DEPLOYMENT MANAGER

---

# M01 — Environment Overview

Cards :
- Total
- Ready
- Degraded
- Unavailable
- Active Deployments
- Recent Failures

Graph :
- deployment activity réelle.

---

# M02 — Environment List

Table :
- Name
- Type
- Status
- Application
- Active Pack
- Runtime
- Last Deployment
- Actions

---

# M03 — Create Environment

Form :
- Name
- Key
- Type
- Application optional
- Runtime target
- Policy
- Config refs

---

# M04 — Environment Detail

Header :
- Environment
- Type
- READY/DEGRADED...
- Tenant
- Actions

Tabs :
- Overview
- Deployments
- Configuration
- Capabilities
- Integrations
- Runtime
- Diagnostics
- History

---

# M05 — Environment Check

Checklist :
- Runtime
- Data Provider
- Integration
- Secrets availability
- Capabilities
- Config

---

# M06 — Deployment Overview

Cards :
- Queued
- Deploying
- Succeeded
- Failed
- Rollback

Table recent Deployments.

---

# M07 — Deployment List

Table :
- ID
- Environment
- App
- Pack
- Version
- Status
- Requested By
- Started
- Duration

---

# M08 — Deployment Wizard Step 1

Select Environment.

Show :
- type
- status
- protected badge
- last deployment.

---

# M09 — Deployment Wizard Step 2

Select Application.

---

# M10 — Deployment Wizard Step 3

Select only Published Pack Versions.

Badges :
- Published
- Manifest valid
- Compatible/unknown.

---

# M11 — Compatibility Check

Matrix :

| Requirement | Environment | Runtime | Registry | Result |

---

# M12 — Configuration Review

Display effective refs/overrides without secret values.

---

# M13 — Final Review

Summary :
- Tenant
- Environment
- Application
- Pack Version
- Strategy
- Warnings
- Policies

CTA Deploy.

---

# M14 — Protected Production Confirmation

Prominent warning.

Require explicit confirmation.

---

# M15 — Deployment Detail

Status header.

Summary cards.

Timeline.

Diagnostics section.

---

# M16 — Deployment Timeline

Steps :

```text
Requested
Validation
Preparation
Runtime Load
Resolution
Activation
Readiness
Completed
```

---

# M17 — Failed Deployment

Error banner :
- error code
- stage
- correlation ID

Actions if permitted :
- retry
- rollback
- diagnostics.

---

# M18 — Retry Modal

Show prior failure.

No history overwrite.

---

# M19 — Rollback Selector

List previous valid Releases.

Show :
- version
- date
- compatibility
- prior status.

---

# M20 — Rollback Confirmation

Strong confirmation.

Environment + version clearly shown.

---

# M21 — Diagnostics

Table:
- Stage
- Severity
- Code
- Message
- Resource
- Time
- Correlation ID

---

# M22 — Deployment History

Timeline/list:
- succeeded
- failed
- retried
- rolled back
- cancelled.

---

# M23 — Capabilities

Table :
- capability
- registered
- available
- provider
- last check.

---

# M24 — Runtime Panel

Display:
- Runtime target
- Context
- Health
- Readiness
- Active Pack.

Read-only where Runtime owns state.

---

# M25 — Mobile Deployment

Responsive cards:
- environment
- pack
- status
- main action
- timeline accordion.

---

# Visual Style

Techzone Cloud premium :

- dark navy sidebar ;
- bright workspace ;
- white rounded cards ;
- subtle shadows ;
- blue/indigo/violet accents ;
- green success ;
- amber warning ;
- red error ;
- Lucide icons ;
- clean tables ;
- responsive ;
- no fake metrics.
