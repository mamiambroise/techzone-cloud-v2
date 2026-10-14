# TECH — TECHZONE CLOUD ERP ADAPTER / INTEGRATION HUB

**Stack :** NestJS + Prisma/PostgreSQL + Axios/HTTP + React/Vite

---

# 1. Existing Code to Preserve

Audit confirms:
- real DolibarrAdapter ;
- ERP Registry ;
- ERP permissions ;
- tenant context ;
- resource/command controllers ;
- adapter tests.

Do not rewrite.

---

# 2. Known paths

Inspect:

```text
backend/src/erp-adapter/
backend/src/erp-adapter/dolibarr/
backend/src/erp-registry/
backend/src/integration/
backend/prisma/schema.prisma
frontend ERP/integration views
```

---

# 3. Adapter Factory

Avoid:

```text
singleton adapter
+
mutable configure(tenant config)
```

Preferred:

```ts
adapterFactory.create({
  connector,
  baseUrl,
  credentialRef,
  config
})
```

or safe cached client keyed by immutable integration instance.

---

# 4. Client Configuration

HTTP client must be created/configured with:
- validated baseURL ;
- auth headers ;
- timeout ;
- TLS config ;
- redirect rules.

Changing config must actually update client state.

---

# 5. Tenant Provider Resolver

Concept:

```ts
resolveIntegration({
  tenantId,
  integrationId,
  requiredCapability
})
```

Returns trusted instance/config refs.

---

# 6. Provider Selection

Never trust:

```text
?erp=DOLIBARR
```

as authority.

Provider from registered tenant integration.

---

# 7. REAL/MOCK Wiring

Use environment/config startup validation.

Concept:

```text
ALLOW_MOCK_INTEGRATIONS=false in production
```

If production instance connector points to MOCK:
- fail config/action.

---

# 8. Credentials

Service:

```text
CredentialResolver
```

returns secret server-side just-in-time.

Never return resolved secret to controller DTO.

---

# 9. URL Validation

Before persisting endpoint:
- parse URL ;
- allowed scheme ;
- host validation ;
- resolved IP validation ;
- redirect policy.

---

# 10. SSRF Defense

Check initial host and redirects.

Disallow local/private metadata targets unless explicit platform allowlist.

---

# 11. ERPRegistry Model

Audit:
- tenantId type ;
- connector ;
- status ;
- config refs ;
- credential refs ;
- capabilities ;
- timestamps.

Align tenantId with canonical UUID/type.

---

# 12. Integration Contract Models

Prefer stable models for:
- contract key ;
- version ;
- input schema ;
- output schema ;
- errors ;
- capability.

---

# 13. Mapping Models

Concept:

```text
ResourceMapping
FieldMapping
ExternalResourceLink
```

All tenant/integration scoped.

---

# 14. ExternalResourceLink

Unique constraints should avoid duplicate links per tenant/integration/resource.

---

# 15. Query Engine

Hub query:
1. IAM ;
2. tenant ;
3. contract ;
4. integration ;
5. capability ;
6. adapter ;
7. map input ;
8. request ;
9. map output ;
10. sanitize.

---

# 16. Command Engine

Adds:
- idempotency ;
- audit ;
- mutation permission ;
- retry classification.

---

# 17. Pagination

Normalize external pagination into canonical contract.

Do not load all records then paginate in memory if provider supports remote paging.

---

# 18. Filtering

Translate controlled filters to provider syntax.

No arbitrary external query expression.

---

# 19. Error Mapping

Dolibarr errors → canonical Integration errors.

Do not expose remote stack/details containing sensitive data.

---

# 20. Timeout / Retry

HTTP client + command layer:
- timeout ;
- retry 429/transient 5xx ;
- Retry-After support ;
- max attempts.

---

# 21. Idempotency

Persist if operations can duplicate external effects.

---

# 22. Sync Engine

Persist:
- runs ;
- checkpoint ;
- counts ;
- conflicts ;
- trace.

---

# 23. Webhook Endpoint

Resolve integration safely by endpoint key/token mapping.

Validate signature before processing.

---

# 24. Webhook Dedup

Persist:
- provider event ID ;
- integration ;
- timestamp ;
- payload hash.

---

# 25. Pack Runtime

Expose health/capability state to runtime resolver.

---

# 26. Data Runtime

ERP Provider should call Hub contract, not direct Adapter if possible.

---

# 27. Automation

Action executor calls registered Integration Contract.

---

# 28. Observability

Log:
- integrationId ;
- connector ;
- operation ;
- duration ;
- status ;
- traceId.

No secret/body by default.

---

# 29. Health Test

Use safe endpoint.

Result:
- AVAILABLE only on successful real call in REAL mode.

---

# 30. Staging Contract Tests

Config via environment secret in CI/staging.

Tests:
- auth ;
- safe list ;
- get fixture ;
- pagination ;
- mapping.

Never run destructive production test.

---

# 31. Prisma Migration

Coordinate with Tenant Foundation.

For tenantId drift:
- inventory type ;
- backfill/cast safely ;
- FK ;
- fresh DB ;
- upgrade DB.

No blind DROP.

---

# 32. Frontend API

UI never receives provider credentials.

Use standard error contract.

---

# 33. Commit Plan

```text
fix(erp): align registry tenant id with canonical tenant type
fix(integration): resolve adapters per tenant integration instance
fix(integration): disable mock fallback in real mode
fix(integration): harden external endpoint ssrf validation
feat(integration): persist mappings and external resource links safely
feat(integration): add controlled retry and idempotency
test(erp): add non destructive dolibarr staging contract tests
test(integration): add cross tenant and webhook security coverage
```

---

# 34. Technical DoD

- provider tenant-safe ;
- no mutable singleton leak ;
- REAL/MOCK safe ;
- credential server-only ;
- SSRF defended ;
- registry type coherent ;
- live test ;
- mappings ;
- Data/Automation via hub ;
- tests/build green.
