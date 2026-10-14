# CAHIER DES CHARGES — API & INTEGRATION MANAGER
## Étape 2 — État réel, Gap Matrix et plan de consolidation

**Audit :** octobre 2026  
**État :** à consolider à partir du repository réel.

---

# 1. Verdict actuel

```text
🟡/🔴 PARTIEL — Integration Module réel,
mais maturité spécifique API Manager à auditer précisément.
```

Ne pas inventer de PASS.

---

# 2. KEEP confirmé

Audit général :
- modules enregistrés ;
- ValidationPipe ;
- Helmet ;
- CORS configurable ;
- trace IDs ;
- CRUD/services Integration présents ;
- définitions/credentials/synchronisations existent.

---

# 3. À auditer

État réel à confirmer pour :

```text
API Catalog
API Versions
OpenAPI Registry
API Clients
API Keys / Client Secrets
Scopes
Policies
Rate Limits per client/API
Quotas
Usage Metering
Outbound Webhooks
Developer Portal
Deprecation
```

---

# 4. P2 connu — MockIntegrationProvider

Mock provider branché dans certains connecteurs/synchronisations.

Pour API Manager :
- vérifier qu’il ne produit jamais de faux succès en REAL ;
- isoler DEV/TEST.

---

# 5. CSRF

Audit global indique que la protection CSRF actuelle mérite durcissement.

Distinguer :
- browser cookie flows ;
- M2M bearer/key flows.

---

# 6. Gap Matrix initiale

| Domaine | Cible | Existant | Décision | Priorité |
|---|---|---|---|---|
| Catalog | Registry réel | À auditer | AUDIT | P1 |
| Contracts | OpenAPI/schema | À auditer | AUDIT | P1 |
| Versioning | versions + deprecation | À auditer | AUDIT | P1 |
| Clients | M2M clients | À auditer | AUDIT | P1 |
| Credentials | secure keys/secrets | Integration credentials existent | ADAPT/AUDIT | P1 |
| Scopes | backend | À auditer | AUDIT | P1 |
| Policies | backend | À auditer | AUDIT | P1 |
| Rate Limit | client/API | global partiel | COMPLETE | P1 |
| Quotas | usage limits | À auditer | AUDIT | P2 |
| Usage | metering | À auditer | AUDIT | P2 |
| Webhooks outbound | persistent/signé | À auditer | AUDIT | P1 |
| SSRF | outbound | Integration security base | COMPLETE | P1 |
| Docs | OpenAPI/Portal | À auditer | AUDIT | P2 |
| Mock | dev/test only | présent | FIX | P2 |
| Tenant | strict | Integration partiel | TEST/FIX | P1 |

---

# 7. LOT API-0 — Inventory

Rechercher :
- module API Manager ;
- controllers ;
- Prisma models ;
- frontend ;
- Swagger ;
- keys/clients ;
- webhooks ;
- usage ;
- rate limiter.

---

# 8. LOT API-1 — Catalog

Créer/adapter Registry API :
- owners ;
- paths ;
- visibility ;
- versions ;
- status ;
- docs.

---

# 9. LOT API-2 — API Versions

Version metadata + deprecation/sunset.

---

# 10. LOT API-3 — API Clients

Client lifecycle tenant/application-scoped.

---

# 11. LOT API-4 — Credentials

Réutiliser credential infrastructure si adaptée.

Ajouter :
- hash ;
- one-time reveal ;
- rotate ;
- revoke ;
- expiry.

---

# 12. LOT API-5 — Scopes

Relier :
- API operation ;
- required scopes ;
- client scopes.

---

# 13. LOT API-6 — Policies

Policy evaluation server-side.

---

# 14. LOT API-7 — Rate Limits

Enforcement réel par :
- client ;
- API ;
- route.

---

# 15. LOT API-8 — Quotas

Persisted usage counters/aggregates.

Fail closed selon policy.

---

# 16. LOT API-9 — Usage

Metrics/aggregation + retention.

---

# 17. LOT API-10 — Outbound Webhooks

Implement/verify :
- subscriptions ;
- signing ;
- persistence ;
- retry ;
- dedup ;
- SSRF.

---

# 18. LOT API-11 — OpenAPI / Docs

Generate/serve docs from real contracts.

---

# 19. LOT API-12 — Developer Portal

Catalog + client management + docs.

---

# 20. LOT API-13 — Security

Cross-tenant, scope bypass, revoked key, rate bypass, webhook SSRF.

---

# 21. LOT API-14 — Integration

Registry, Observability, Billing, Administration, Integration Hub boundary.

---

# 22. LOT API-15 — CI/E2E

M2M call full flow + webhook delivery.

---

# 23. Production blockers

Do not declare ready if :
- credentials logged/plain ;
- client can use other tenant API ;
- scopes only frontend ;
- limiter UI-only ;
- webhook destination arbitrary ;
- revoked key still valid ;
- mock can silently answer REAL ;
- docs differ from real endpoints.

---

# 24. Order

```text
API-0 Inventory
↓
API-1 Catalog
↓
API-2 Versions
↓
API-3 Clients
↓
API-4 Credentials
↓
API-5 Scopes
↓
API-6 Policies
↓
API-7 Rate Limits
↓
API-8 Quotas
↓
API-9 Usage
↓
API-10 Webhooks
↓
API-11 Docs
↓
API-12 Portal
↓
API-13 Security
↓
API-14 Integration
↓
API-15 CI/E2E
```
