# TECH — ADMINISTRATION PLATFORM

**Stack :** NestJS/legacy IAM services + Prisma/PostgreSQL + React/Vite

---

# 1. Audit First

Inspect:
```text
admin routes/services
IAM admin contracts
tenant services
governance/delegation services
frontend /admin pages
mock services
Prisma models
audit services
observability adapters
```

---

# 2. Existing Backend

Historical audit identifies real backend for:
```text
users
tenants
governance
delegation
admin actions
```

Preserve and adapt.

---

# 3. Frontend Migration

Replace:
```text
adminMonitoringMockService
adminUsersMockService
adminTenantsMockService
accessGovernanceMockService
delegationMockService
securityAuditMockService
```

with API clients.

---

# 4. Anti-Corruption Layer

If admin backend remains legacy Express while platform is NestJS:
- do not duplicate business logic ;
- add stable contract/gateway if needed ;
- progressively migrate owner services only with explicit plan.

---

# 5. Admin Principal

Trusted context:

```ts
type AdminPrincipal = {
  identityId: string
  tenantId?: string
  sessionId: string
  permissions: string[]
  roles: string[]
  authTime: string
  mfaLevel?: string
}
```

---

# 6. Permission Guards

Every admin route requires explicit permission.

Unknown/missing protected metadata => deny.

---

# 7. Re-auth Guard

Concept:
```text
RequireRecentAuth(maxAge)
RequireMfa(level)
```

for critical actions.

---

# 8. Admin Action Registry

Do not expose generic:
```http
POST /admin/action { "name": "anything" }
```

Use allowlisted action registry with schemas.

---

# 9. Action Contract

```ts
{
  key,
  riskLevel,
  permission,
  inputSchema,
  requiresReason,
  requiresRecentAuth,
  requiresMfa,
  handler
}
```

---

# 10. Tenant Actions

Call owner API/service.

Never direct ad hoc DB update if owner contract exists.

---

# 11. User Actions

Call IAM service:
- disable
- enable
- revoke sessions.

---

# 12. Delegation Persistence

Model:
- grantor
- grantee
- scope
- permissions
- start/end
- status
- reason.

Indexes:
- grantee/status/expiry
- tenant scope.

---

# 13. Delegation Resolver

Effective admin rights:
```text
base permissions
+
active delegation permissions
```

Never exceed delegator’s delegable authority.

---

# 14. Delegation Expiry

Server checks current time every authorization.

Scheduled cleanup is secondary.

---

# 15. Audit Service

Admin action:
```text
request
→ authorization
→ execute
→ result
→ audit
```

Prefer audit even on failure/denial for sensitive operations.

---

# 16. Feature Flag Service

If absent, persistent model + resolver.

Security-sensitive flags always evaluated server-side.

---

# 17. Settings Registry

Schema:
```text
key
owner
scope
type
sensitive
editable
validation
```

Sensitive values via secret refs.

---

# 18. Provider Registry

Reuse Registry/Integration configuration.

Admin only orchestrates.

---

# 19. Jobs

Persistent worker/job records.

No process-memory-only critical jobs.

---

# 20. Job Claiming

Multi-instance safe:
- row lock
- claim token
- queue
depending architecture.

---

# 21. Maintenance

Persist maintenance windows.

Modules query a canonical resolver or receive events.

---

# 22. Diagnostics Aggregator

Adapter per module:
```ts
AdminDiagnosticProvider
```

calls module diagnostic contract.

---

# 23. Monitoring

Consume Observability APIs.

Never hardcode metrics.

---

# 24. Secrets

Admin API returns:
```text
credentialRef
status
lastRotated
```
not value.

---

# 25. Error Codes

```text
ADMIN_PERMISSION_DENIED
ADMIN_RECENT_AUTH_REQUIRED
ADMIN_MFA_REQUIRED
ADMIN_TARGET_NOT_FOUND
ADMIN_TENANT_DENIED
ADMIN_DELEGATION_INVALID
ADMIN_DELEGATION_EXPIRED
ADMIN_ACTION_NOT_ALLOWED
ADMIN_ACTION_CONFIRMATION_REQUIRED
ADMIN_JOB_FAILED
ADMIN_PROVIDER_UNAVAILABLE
ADMIN_MAINTENANCE_CONFLICT
```

---

# 26. CSRF

Admin browser mutation endpoints need strong browser-session protections.

---

# 27. Rate Limits

Sensitive actions:
- login/reauth
- delegation create
- session revoke
- diagnostic expensive action.

---

# 28. Frontend API State

No local mock fallback on failed request in REAL.

Show ERROR.

---

# 29. Tests

Unit:
- action registry
- permission
- delegation
- reauth
- flags
- jobs.

Integration:
- IAM
- Tenant
- Billing
- Observability
- Registry.

---

# 30. Commit Plan

```text
fix(admin-ui): replace administration mock services with real api clients
fix(admin): enforce explicit administration permissions
feat(admin): require recent auth and mfa for critical actions
fix(admin): harden scoped delegation and expiry
feat(admin): add governed admin action registry
feat(admin): connect observability and module diagnostics
feat(admin): persist jobs and maintenance operations
test(admin): add privilege escalation and delegation security coverage
```

---

# 31. Technical DoD

- no mock REAL frontend
- explicit permissions
- owner contracts
- reauth/MFA
- safe delegation
- safe actions
- audit
- persistent jobs
- no secret
- tests/build green.
