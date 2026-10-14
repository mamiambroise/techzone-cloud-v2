# SECURITY TEST — TECHZONE CLOUD DATA PLATFORM / DATA RUNTIME

**Priority :** P1

---

# 1. Runtime Resolution

## SEC-DATA-001
Published runtime query without `resolutionId`.

Expected:
- DENY.

## SEC-DATA-002
Published runtime mutation without `resolutionId`.

DENY.

## SEC-DATA-003
Use BLOCKED resolution.

Query/mutation:
- DENY.

## SEC-DATA-004
Use expired resolution.

DENY.

## SEC-DATA-005
Use resolution from another Tenant.

DENY.

---

# 2. Tenant Isolation

## SEC-DATA-010
Tenant A query record B by arbitrary ID.

Expected:
- no B data.

## SEC-DATA-011
Tenant A update B record.

DENY/no update.

## SEC-DATA-012
Tenant A delete B record.

DENY/no delete.

## SEC-DATA-013
Tenant A aggregate B.

No cross-tenant leakage.

---

# 3. IAM Permissions

## SEC-DATA-020
User lacks READ permission.

Query:
- 403/policy deny.

## SEC-DATA-021
Read permission but no UPDATE.

Mutation:
- deny.

---

# 4. Data Contract

## SEC-DATA-030
Unknown Entity.

Controlled error.

## SEC-DATA-031
Operation not declared.

DENY.

## SEC-DATA-032
Field not allowed.

Rejected/masked according contract.

---

# 5. Injection

## SEC-DATA-040
SQL string in filter.

Must never execute as SQL.

## SEC-DATA-041
Prisma operator object injection.

Reject if not part controlled AST.

## SEC-DATA-042
JavaScript/expression payload.

Reject.

---

# 6. Mass Assignment

## SEC-DATA-050
Mutation sends `tenantId=B`.

Reject/ignore server field.

## SEC-DATA-051
Mutation sends `createdBy=admin`.

Server controls field.

## SEC-DATA-052
Mutation changes privileged status without permission.

DENY.

---

# 7. Filters

## SEC-DATA-060
Filter on non-whitelisted field.

Reject.

## SEC-DATA-061
Unsupported operator.

Reject.

---

# 8. Sorting / Pagination

## SEC-DATA-070
Sort by hidden/sensitive field.

Reject.

## SEC-DATA-071
Limit > max.

Clamp/reject according contract.

---

# 9. Field-Level Security

## SEC-DATA-080
User can read Product but not internalCost.

Expected:
- internalCost absent/masked if feature implemented.

---

# 10. Row-Level Policy

## SEC-DATA-090
Agent requests Order assigned to another agent.

Expected:
- hidden/denied according policy if row policy implemented.

---

# 11. Transactions

## SEC-DATA-100
Second operation fails.

Expected:
- local DB transaction rollback.

## SEC-DATA-101
External ERP failure.

Expected:
- no claim of global ACID ;
- compensation/status according contract.

---

# 12. Idempotency

## SEC-DATA-110
Replay same idempotency key.

Expected:
- no duplicate sensitive mutation.

---

# 13. Provider Isolation

## SEC-DATA-120
Forged provider/source ID from another Tenant.

DENY.

---

# 14. ERP

## SEC-DATA-130
Try bypass Integration Hub.

No direct ERP credential/path accepted.

---

# 15. Secret Leakage

## SEC-DATA-140
Inspect source API.

No credential value.

## SEC-DATA-141
Inspect diagnostics/logs.

No DB password/API token.

---

# 16. PostgreSQL / RLS

If RLS enabled:

## SEC-DATA-150
DB context Tenant A SELECT Tenant B.

Invisible/denied.

## SEC-DATA-151
UPDATE/DELETE B.

Denied.

## SEC-DATA-152
Concurrent A/B transactions.

No tenant context leakage.

---

# 17. Query Explorer

## SEC-DATA-160
User without technical permission accesses explorer.

403.

## SEC-DATA-161
Attempt raw SQL.

Rejected.

---

# 18. Pack Runtime + IAM

## SEC-DATA-170
Valid EXECUTABLE resolution, but user lacks data permission.

Expected:
- DENY.

Runtime resolution never overrides IAM.

---

# 19. E2E Positive

```text
Login Tenant A
→ Pack Runtime EXECUTABLE
→ Published UI
→ Query Product
→ Tenant A rows
→ Update allowed record
→ Audit
```

---

# 20. E2E Negative

```text
Pack Runtime BLOCKED
→ Published UI/Data call
→ DENY
```

---

# 21. CI Blocking

At minimum:

```text
SEC-DATA-001..005
SEC-DATA-010..013
SEC-DATA-020..021
SEC-DATA-030..032
SEC-DATA-040..042
SEC-DATA-050..052
SEC-DATA-060..071
SEC-DATA-100
SEC-DATA-120
SEC-DATA-140..141
SEC-DATA-170
```

Plus RLS suite where enabled.

---

# 22. Security DoD

- runtime resolution mandatory ;
- BLOCKED no data ;
- tenant isolation ;
- IAM preserved ;
- no injection ;
- no mass assignment ;
- providers scoped ;
- no secrets ;
- Postgres tests green.
