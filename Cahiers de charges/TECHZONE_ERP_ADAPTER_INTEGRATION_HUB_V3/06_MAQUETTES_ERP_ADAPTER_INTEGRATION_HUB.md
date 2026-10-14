# MAQUETTES — TECHZONE CLOUD ERP ADAPTER / INTEGRATION HUB

---

# M01 — Integration Overview

Cards:
- Instances
- Available
- Degraded
- Unavailable
- Sync Failures
- Webhook Failures

Recent activity.

---

# M02 — Connector Catalog

Cards:
- Dolibarr
- REST Connector
- Webhook
- Future providers

Show:
- version
- capabilities
- status.

---

# M03 — ERP Instances List

Table:
- Name
- Connector
- Environment
- Mode
- Status
- Capabilities
- Last Check
- Last Sync
- Actions

---

# M04 — Create ERP Instance

Wizard:
1 Connector
2 Name/Environment
3 Endpoint
4 Credential Reference
5 Test
6 Review

---

# M05 — Endpoint Configuration

Form:
- Base URL
- timeout
- approved options

Inline SSRF/security validation.

---

# M06 — Credential Reference

Select/create secure credential reference.

Show:
- name
- status
- rotated at

No value.

---

# M07 — Connectivity Test

Steps:
- URL Policy
- TLS
- Authentication
- Health
- API
- Latency
- Capabilities

---

# M08 — Instance Detail

Header:
- Name
- DOLIBARR
- REAL
- AVAILABLE

Tabs:
- Overview
- Capabilities
- Resources
- Mappings
- Sync
- Webhooks
- Diagnostics
- History

---

# M09 — REAL / MOCK Mode

Large environment badge.

Production warning if Mock.

---

# M10 — Capabilities Matrix

Rows resources.

Columns:
- READ
- CREATE
- UPDATE
- DELETE
- SEARCH
- PAGINATION
- SYNC
- WEBHOOK.

---

# M11 — Resources

Table:
- Canonical Resource
- External Resource
- Read Status
- Write Status
- Mapping
- Last Check.

---

# M12 — Resource Mapping

Two-panel editor:
Techzone ↔ Dolibarr.

---

# M13 — Field Mapping

Grid:
- Techzone field
- Dolibarr field
- types
- transform
- direction
- required.

---

# M14 — Mapping Validation

Summary:
- Valid
- Warnings
- Missing required
- Type mismatch.

---

# M15 — External Resource Links

Technical table:
- resource
- Techzone ID
- external ID
- last sync
- status.

---

# M16 — Query Tester

Select:
- Contract
- Resource
- filters
- pagination

Run safe query.

---

# M17 — Query Result

Canonical mapped table.

Show:
- duration
- provider
- source
- trace ID.

---

# M18 — Command Tester

Staging/admin only.

Strong mutation warning.

Select registered command.

---

# M19 — Command Result

Show:
- status
- external ref
- idempotency
- duration
- trace.

---

# M20 — Sync Overview

Cards:
- Running
- Success
- Failed
- Conflicts
- Last Checkpoint.

---

# M21 — Start Sync

Form:
- resource
- direction
- strategy
- conflict policy
- scope.

---

# M22 — Sync Runs

Table:
- Resource
- Direction
- Status
- Processed
- Success
- Failures
- Started
- Duration.

---

# M23 — Sync Detail

Timeline + counts + errors.

---

# M24 — Conflict Resolution

Compare:
- Techzone
- External
- selected policy/action.

---

# M25 — Webhooks List

Table:
- Event
- Endpoint
- Auth Type
- Status
- Last Event
- Failures.

---

# M26 — Webhook Detail

Cards:
- provider
- signature type
- dedup
- rate
- last accepted/rejected.

---

# M27 — Webhook Events

Table:
- event ID
- type
- received
- validation
- dedup
- result.

Payload sanitized.

---

# M28 — Diagnostics

Checklist:
- Config
- Credential
- URL/SSRF
- Connectivity
- Auth
- Capability
- Mapping
- Query
- Sync.

---

# M29 — Diagnostic Detail

Show:
- stage
- code
- severity
- message
- timestamp
- trace ID.

---

# M30 — Provider Unavailable

Controlled degraded/error state.

Actions:
- Recheck
- Diagnostics
- Disable.

---

# M31 — Mock Forbidden

Production blocking screen:

```text
MOCK PROVIDER NOT ALLOWED
```

---

# M32 — Credential Unavailable

No secret shown.

CTA:
- Manage credential reference.

---

# M33 — Audit History

Timeline:
- create
- config
- credential ref
- mapping
- query
- command
- sync
- webhook.

---

# M34 — Data Runtime Integration

Read-only flow/status:

```text
Data Runtime
→ Integration Hub
→ Dolibarr Adapter
→ Dolibarr
```

---

# M35 — Automation Integration

Read-only flow:

```text
Automation Action
→ Integration Contract
→ Hub
→ Adapter
```

---

# M36 — Deployment Preflight

Connector requirement:
- instance
- capability
- health
- environment
- result.

---

# M37 — Registry View

Show connector metadata:
- key
- version
- capabilities
- contract versions.

---

# M38 — Live Staging Certification

Checklist:
- Auth PASS
- Health PASS
- Safe Resource Read PASS
- Pagination PASS
- Mapping PASS
- Diagnostics PASS

Certification timestamp.

---

# M39 — Mobile Integration Cockpit

Cards:
- instance status
- sync
- diagnostics
- webhooks.

---

# M40 — Architecture Flow

Visual:

```text
Techzone Module
↓
Integration Contract
↓
Integration Hub
↓
Connector / Adapter
↓
External System
```

---

# Visual Direction

Techzone Cloud integrations:

- premium SaaS ;
- dark navy sidebar ;
- light background ;
- cyan/blue Integration accents ;
- Dolibarr connector badge ;
- green real health ;
- amber degraded ;
- red unavailable/blocked ;
- white rounded cards ;
- Lucide icons ;
- responsive ;
- no visible secrets ;
- no fake AVAILABLE.
