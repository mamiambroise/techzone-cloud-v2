# TECH — API & INTEGRATION MANAGER

**Stack :** NestJS + Prisma/PostgreSQL + React/Vite

---

# 1. Audit First

Search:
```text
backend/src/integration/
backend/src/modules/api*
Swagger/OpenAPI config
credential services
webhooks
rate limiting
Prisma models
frontend API pages
```

---

# 2. Reuse

Prefer existing:
- IAM ;
- Credential Provider ;
- Registry ;
- Observability ;
- throttler ;
- trace middleware ;
- webhook infrastructure.

---

# 3. API Catalog Model

Concept:
```text
ApiDefinition
ApiVersion
ApiOperation
ApiScopeRequirement
```

Only add if absent.

---

# 4. API Client Model

```text
ApiClient
ApiClientCredential
ApiClientScope
ApiClientApiGrant
```

Tenant/application scoped.

---

# 5. Credential Storage

Store hash/secure ref.

Never store plaintext secret after issuance.

---

# 6. Authentication Guard

M2M authentication resolves:
```text
credential
→ client
→ status
→ tenant/app context
→ service principal
```

---

# 7. Scope Guard

Each exposed operation declares required scopes.

Unknown/missing metadata for protected external API should deny.

---

# 8. Policy Engine

Evaluate:
- client ;
- tenant ;
- API ;
- version ;
- scope ;
- entitlement ;
- environment if relevant.

---

# 9. Rate Limiter Key

Use:
```text
clientId + apiId/route
```
with tenant dimension as required.

Do not key only by IP.

---

# 10. Quota

Persistent/aggregated counters.

Atomic increment strategy.

---

# 11. Usage

Prefer event/metric aggregation over huge raw payload logging.

---

# 12. OpenAPI

Generate from Nest real routes where possible.

Merge governance metadata:
- visibility ;
- scopes ;
- version ;
- deprecation.

---

# 13. Version Routing

Do not duplicate controller implementations unnecessarily.

Support explicit version metadata.

---

# 14. Webhook Persistence

Models:
```text
WebhookSubscription
WebhookDelivery
WebhookDeliveryAttempt
```

---

# 15. Webhook Signing

Canonical payload + timestamp + HMAC.

Rotate signing secret refs.

---

# 16. SSRF

Reuse secure URL validator from Integration Hub if available.

Avoid duplicate inconsistent validator.

---

# 17. Retry Worker

Persist nextAttemptAt/attempt count.

Idempotent worker.

---

# 18. Trace

Reuse request.traceId through downstream calls.

No competing trace generation.

---

# 19. CORS / CSRF

Separate:
- browser session endpoints ;
- M2M endpoints.

---

# 20. Mock Isolation

Mock provider enabled only DEV/TEST.

---

# 21. Errors

Stable error contract.

No stack trace/secrets.

---

# 22. Audit Actors

Client actions use:
- human IAM principal ;
- service identity principal.

No `createdBy` from request body.

---

# 23. Tests

Unit:
- key hashing ;
- scope ;
- policy ;
- limiter ;
- quota ;
- webhook sign.

Integration:
- client auth ;
- registry ;
- usage ;
- webhook worker.

Security:
- tenant ;
- revoked key ;
- replay ;
- SSRF ;
- brute force.

---

# 24. Commit Plan

```text
feat(api-manager): register governed api catalog
feat(api-manager): add tenant scoped api clients
feat(api-manager): issue rotate and revoke client credentials
feat(api-manager): enforce scopes and access policies
feat(api-manager): enforce client rate limits and quotas
feat(api-manager): persist signed outbound webhooks
feat(api-manager): publish openapi developer documentation
test(api-manager): add m2m security and webhook coverage
```

---

# 25. Technical DoD

- real catalog ;
- clients/credentials secure ;
- server scopes ;
- limiter/quota ;
- usage ;
- webhook persistence/signing ;
- SSRF ;
- OpenAPI sync ;
- tenant isolation ;
- tests/build green.
