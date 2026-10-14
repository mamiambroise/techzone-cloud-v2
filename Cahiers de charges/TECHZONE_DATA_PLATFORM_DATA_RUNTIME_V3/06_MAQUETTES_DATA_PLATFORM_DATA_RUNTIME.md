# MAQUETTES — TECHZONE CLOUD DATA PLATFORM / DATA RUNTIME

---

# M01 — Data Overview

Cards:
- Sources
- Available
- Degraded
- Contracts
- Repositories
- Queries
- Mutation Errors
- Runtime Denials

---

# M02 — Sources List

Table:
- Source
- Type
- Provider
- Status
- Capabilities
- Environment
- Last Check
- Actions

---

# M03 — Source Detail

Header:
- Source
- Provider
- AVAILABLE/DEGRADED

Tabs:
- Overview
- Capabilities
- Configuration
- Contracts
- Health
- Diagnostics
- History

---

# M04 — Add Data Source

Form:
- Name
- Key
- Type
- Provider
- Environment
- Configuration reference
- Credential reference

No raw secret.

---

# M05 — Source Capabilities

Matrix:
- READ
- CREATE
- UPDATE
- DELETE
- FILTER
- SORT
- PAGINATE
- AGGREGATE
- TRANSACTION
- SEARCH

---

# M06 — Data Contracts List

Table:
- Entity
- Source
- Repository
- Operations
- Permission
- Version
- Status

---

# M07 — Data Contract Detail

Sections:
- Entity
- Fields
- Relations
- Operations
- Filters
- Sorting
- Pagination
- Permissions
- Policies
- Runtime Requirements

---

# M08 — Repository Registry

Table:
- Entity
- Repository
- Provider
- Source
- Operations
- Transaction
- Availability

---

# M09 — Repository Detail

Show:
- Contract
- Provider
- Capabilities
- runtime status
- health
- diagnostics.

---

# M10 — Query Explorer

Controls:
- Entity
- Fields
- Filter Builder
- Sort
- Limit
- Run

No SQL editor.

---

# M11 — Filter Builder

Rows:
- Field
- Operator
- Value
- AND/OR if supported.

Only allowed fields/operators.

---

# M12 — Query Result

Grid:
- returned fields
- rows
- count
- duration
- provider
- pagination.

---

# M13 — Query Security Summary

Admin panel:
- Tenant
- Permission
- Data Contract
- Policies
- Runtime Resolution
- Repository

PASS/FAIL badges.

---

# M14 — Mutation Tester

Technical screen:
- Entity
- Operation
- Record ID
- allowed fields
- payload

Confirmation before execute.

---

# M15 — Mutation Result

Show:
- Success/Failure
- Record ref
- duration
- audit ID
- correlation ID.

---

# M16 — Policies Matrix

Table:
- Entity
- READ
- CREATE
- UPDATE
- DELETE

Each cell shows permission/policy.

---

# M17 — Policy Detail

Sections:
- Operation
- IAM permission
- Feature/Capability
- Row restriction
- Field restriction
- status.

No arbitrary code.

---

# M18 — Field Access

Table:
- Field
- Read
- Write
- Mask
- Sensitive
- Policy.

---

# M19 — Runtime Data Context

Read-only cards:
- Tenant
- Application
- AppVersion
- PackVersion
- Environment
- ResolutionId
- RuntimeContext
- User.

---

# M20 — Runtime Resolution Blocked

Red panel:
`DATA ACCESS BLOCKED`

Reason:
- Pack Runtime resolution not executable
- correlation ID.

---

# M21 — Provider Health

Cards:
- Prisma
- ERP
- Internal Services

with real health states.

---

# M22 — Prisma Provider

Show:
- source
- status
- supported operations
- pool health metadata if available
- RLS status if safe to display.

---

# M23 — ERP Provider

Show:
- Integration Hub binding
- connector status
- capabilities
- last health check.

No credential.

---

# M24 — Transactions

List:
- transaction
- type
- status
- operations
- duration
- rollback.

---

# M25 — Transaction Detail

Timeline:
- begin
- operation 1
- operation 2
- failure/commit
- rollback if any.

---

# M26 — Diagnostics

Table:
- Stage
- Severity
- Code
- Entity
- Provider
- Message
- Time
- Correlation ID.

---

# M27 — Audit

Timeline:
- Source changed
- Policy changed
- CREATE
- UPDATE
- DELETE
- Sensitive operation.

---

# M28 — Query Limits

Admin configuration/read-only summary:
- max page size
- timeout
- filter limit
- relation depth
- aggregate limits.

---

# M29 — Empty States

Variants:
- No sources
- No contracts
- No repositories
- No results
- No diagnostics.

---

# M30 — Mobile Data Cockpit

Responsive:
- source cards
- contract cards
- query builder compact
- diagnostics accordion.

---

# Visual Direction

Use Techzone Cloud Data identity:

- premium SaaS ;
- dark navy sidebar ;
- very light canvas ;
- cyan / blue accents ;
- white rounded cards ;
- subtle shadows ;
- status green/amber/red ;
- Lucide icons ;
- professional data tables ;
- responsive ;
- no raw SQL console ;
- no fake health status.
