# SPEC UI — TECHZONE CLOUD ERP ADAPTER / INTEGRATION HUB

---

# 1. Design

Integration identity:

- dark navy sidebar ;
- light workspace ;
- cyan/blue accents ;
- connector-specific badges ;
- white cards ;
- real health states ;
- Lucide icons ;
- responsive.

---

# 2. Navigation

```text
DONNÉES & INTÉGRATIONS
├── Données
├── ERP
└── API
```

ERP workspace:
- Overview
- Instances
- Contracts
- Mappings
- Synchronizations
- Webhooks
- Diagnostics
- History

---

# 3. Overview

Cards:
- Integration Instances
- Available
- Degraded
- Unavailable
- Sync Failures
- Webhook Failures

No fake availability.

---

# 4. Instances List

Columns:

```text
Name
Connector
Environment
Mode
Status
Capabilities
Last Check
Last Sync
Actions
```

---

# 5. Create Instance

Steps:

```text
1 Connector
2 General
3 Endpoint
4 Credential Reference
5 Test
6 Capabilities
7 Review
```

---

# 6. Mode Badge

Always show:

```text
REAL
MOCK
SANDBOX
```

Production REAL must be visually explicit.

---

# 7. Endpoint Config

Fields:
- Base URL
- Environment
- timeout
- optional approved settings.

Security feedback if endpoint blocked.

---

# 8. Credentials

UI only:
- credential reference/name ;
- status ;
- last rotation.

Never secret value.

---

# 9. Connectivity Test

Results:
- DNS/URL validation
- TLS
- Authentication
- API health
- latency
- capabilities.

---

# 10. Instance Detail

Tabs:

```text
Overview
Capabilities
Resources
Mappings
Sync
Webhooks
Diagnostics
History
```

---

# 11. Capabilities

Matrix:
- Resource
- READ
- CREATE
- UPDATE
- DELETE
- SEARCH
- PAGINATE
- WEBHOOK
- SYNC.

---

# 12. Resources

Table:
- Techzone Resource
- External Resource
- Read
- Write
- Mapping
- Status.

---

# 13. Mapping Overview

Cards/tables:
- mapped resources
- fields
- broken mappings
- unmapped required fields.

---

# 14. Resource Mapping Editor

Two columns:

```text
Techzone
↔
Dolibarr
```

Select resource and direction.

---

# 15. Field Mapping

Rows:
- Techzone field
- external field
- type
- transform
- required
- direction
- status.

---

# 16. External Links

Technical table:
- Techzone ID
- external ID
- resource
- status
- last sync.

Tenant implicit.

---

# 17. Query Tester

Safe technical tool:
- Contract
- Resource
- Filters
- Pagination
- Run.

No raw URL.

---

# 18. Command Tester

Staging/admin only.

Strong warning:
- may modify external system.

Select registered command only.

---

# 19. Sync Overview

Cards:
- Running
- Succeeded
- Failed
- Conflicts
- Last Checkpoint.

---

# 20. Sync Runs

Table:
- Resource
- Direction
- Status
- Started
- Processed
- Succeeded
- Failed
- Checkpoint.

---

# 21. Sync Detail

Timeline + errors/conflicts.

---

# 22. Conflict Resolution

Show:
- local value
- remote value
- policy
- action.

No silent overwrite.

---

# 23. Webhooks List

Columns:
- Endpoint
- Event
- Auth Type
- Status
- Last Event
- Failures.

---

# 24. Webhook Detail

Show:
- contract
- signature mode
- dedup window
- last events
- diagnostics.

No secret.

---

# 25. Diagnostics

Checks:
- config
- credentials available
- SSRF policy
- connectivity
- auth
- capability
- mapping
- query
- sync.

---

# 26. Diagnostic Result

Table:
- Stage
- Severity
- Code
- Message
- Timestamp
- Trace ID.

---

# 27. History

Timeline:
- create
- config update
- credential ref changed
- mapping
- check
- sync
- command
- webhook.

---

# 28. Error States

- invalid endpoint
- credential unavailable
- auth denied
- provider timeout
- mapping broken
- mock forbidden
- cross-tenant denied.

---

# 29. Responsive

Desktop:
- tables/detail.

Tablet:
- cards/drawers.

Mobile:
- health and diagnostics primary ;
- mapping simplified.

---

# 30. UI DoD

- mode visible ;
- no secret ;
- real health ;
- safe endpoint test ;
- mapping clear ;
- sync traceable ;
- diagnostics actionable ;
- responsive.
