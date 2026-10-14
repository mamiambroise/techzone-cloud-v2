# CAHIER DES CHARGES — TECHZONE CLOUD API & INTEGRATION MANAGER
## Étape 1 — Cible fonctionnelle et architecturale

**Projet :** Techzone Cloud  
**Module :** API & Integration Manager  
**Version cible :** 3.0  
**Statut :** Spécification cible

---

# 1. Objet

API & Integration Manager gouverne l’exposition et la consommation contrôlée des APIs Techzone Cloud.

Il répond à :

```text
Quelles APIs sont exposées ?
À quels consommateurs ?
Avec quelle version ?
Avec quels scopes ?
Avec quel client technique ?
Avec quelles limites ?
Avec quel niveau de disponibilité ?
Avec quelle documentation ?
Avec quels webhooks sortants ?
```

---

# 2. Position dans Techzone Cloud

```text
BUSINESS MANAGER
UI BUILDER
AUTOMATION
PACK MANAGER
PACK RUNTIME
DATA RUNTIME
ERP / INTEGRATION HUB
REGISTRY
ENVIRONMENT / DEPLOYMENT
        ↓
INTERNAL STABLE API CONTRACTS
        ↓
API & INTEGRATION MANAGER
        ↓
AUTHN / AUTHZ
CLIENTS / SCOPES
VERSIONING
RATE LIMITS / QUOTAS
USAGE / WEBHOOKS
        ↓
INTERNAL / PARTNER / EXTERNAL CONSUMERS
        ↓
OBSERVABILITY / AUDIT
```

---

# 3. Frontière avec Integration Hub

```text
API MANAGER ≠ INTEGRATION HUB
```

## API Manager possède

- API Catalog ;
- API Contracts ;
- API Versions ;
- API Clients ;
- Machine-to-Machine access ;
- API credentials ;
- scopes ;
- access policies ;
- rate limiting ;
- quotas ;
- usage metering ;
- outbound webhooks ;
- webhook subscriptions ;
- API documentation ;
- Developer Portal ;
- deprecation ;
- API diagnostics.

## Integration Hub possède

- ERP connectors ;
- Dolibarr Adapter ;
- external mappings ;
- synchronization ;
- External Resource Links ;
- external provider commands/queries ;
- inbound provider webhooks.

---

# 4. Principe de continuité

```text
KEEP
IMPROVE
FIX
COMPLETE
ADAPT
IMPLEMENT
```

Toujours auditer avant de recréer.

---

# 5. Navigation

```text
DONNÉES & INTÉGRATIONS
├── Données
├── ERP
└── API
```

Workspace API :

```text
Vue d’ensemble
Catalogue API
Clients API
Accès & Scopes
Webhooks
Usage & Limites
Documentation
Diagnostics
```

---

# 6. API Catalog

Chaque API exposable possède :

```text
ApiDefinition
├── id
├── key
├── name
├── ownerModule
├── visibility
├── status
├── currentVersion
├── basePath
├── documentationRef
├── tags
├── metadata
└── createdAt/updatedAt
```

---

# 7. Visibility

```text
INTERNAL
TENANT
PARTNER
PUBLIC
```

La visibilité ne remplace jamais l’autorisation.

---

# 8. API Status

```text
DRAFT
ACTIVE
DEPRECATED
SUNSET
DISABLED
```

---

# 9. API Version

```text
ApiVersion
├── id
├── apiId
├── version
├── schemaVersion
├── status
├── openApiRef
├── compatibility
├── releasedAt
├── deprecatedAt?
└── sunsetAt?
```

---

# 10. Versioning

Politique :

```text
/v1
/v2
```

ou convention existante.

Breaking change => nouvelle version majeure.

---

# 11. API Contract

Le contrat contient :

- operations ;
- request schema ;
- response schema ;
- error contract ;
- scopes ;
- rate limits ;
- security schemes ;
- examples ;
- compatibility metadata.

---

# 12. OpenAPI

OpenAPI est la source documentaire d’exposition lorsque disponible.

Doit refléter :
- routes réelles ;
- auth ;
- scopes ;
- errors ;
- schemas ;
- version.

Pas de documentation fictive.

---

# 13. API Client

Modèle conceptuel :

```text
ApiClient
├── id
├── tenantId?
├── applicationId?
├── name
├── clientType
├── status
├── owner
├── allowedApis
├── allowedScopes
├── quotaPolicy
├── rateLimitPolicy
├── createdAt
└── updatedAt
```

---

# 14. Client Types

```text
INTERNAL
SERVICE
PARTNER
EXTERNAL
```

---

# 15. Machine-to-Machine

Flux cible :

```text
Client Identity
↓
Credential Validation
↓
Client Status
↓
Tenant / Application Scope
↓
API Scope
↓
Access Policy
↓
Rate Limit / Quota
↓
API Contract
↓
Target Internal API
```

---

# 16. Credentials

Support selon architecture :

```text
API Key
Client Secret
OAuth2 Client Credentials
Signed Token
```

Ne pas implémenter plusieurs mécanismes sans besoin réel.

---

# 17. Credential Rules

- secret montré une seule fois si génération locale ;
- hash/secure storage ;
- rotation ;
- revocation ;
- expiration ;
- last used ;
- audit ;
- no logs.

---

# 18. API Keys

Une API key ne doit jamais être stockée en clair si une comparaison par hash suffit.

Prefix/public identifier possible :

```text
tz_live_xxx
```

mais la valeur secrète reste backend-only.

---

# 19. Service Identity

Les clients techniques doivent être représentés comme service identities ou principal technique compatible IAM.

Ils ne doivent pas contourner IAM.

---

# 20. Scopes

Exemples :

```text
catalog.read
catalog.write
orders.read
orders.write
automation.execute
```

Scopes ≠ rôles utilisateurs.

---

# 21. Scopes vs IAM Permissions

Une requête M2M doit satisfaire :

```text
Client allowed scope
+
API required scope
+
Tenant/Application policy
```

Pour les appels avec utilisateur :
IAM utilisateur reste applicable.

---

# 22. Access Policies

Une policy peut dépendre de :

- client ;
- tenant ;
- application ;
- API ;
- version ;
- environment ;
- scope ;
- entitlement ;
- source network if supported.

---

# 23. Rate Limiting

Dimensions possibles :

```text
per client
per tenant
per API
per route
per time window
```

Le limiteur doit être réellement appliqué côté serveur/gateway.

---

# 24. Quotas

Différence :

```text
Rate Limit
→ vitesse

Quota
→ volume sur période
```

Exemple :
- 100 req/minute ;
- 1M req/month.

---

# 25. Usage Metering

Tracer au minimum :

```text
client
tenant
api
version
route
status
duration
timestamp
request units if used
```

Éviter payload métier sensible.

---

# 26. Billing Bridge

Usage peut alimenter Subscription/Billing.

API Manager ne calcule pas directement la facture si Billing possède cette responsabilité.

---

# 27. Outbound Webhooks

API Manager gère les webhooks sortants Techzone vers abonnés autorisés.

Exemple :

```text
order.created
invoice.paid
deployment.succeeded
```

---

# 28. Webhook Subscription

```text
WebhookSubscription
├── id
├── tenantId
├── clientId?
├── eventKey
├── endpoint
├── status
├── signingSecretRef
├── retryPolicy
├── filters?
├── createdAt
└── updatedAt
```

---

# 29. Webhook Delivery

```text
Business Event
↓
Subscription Resolution
↓
Payload Contract
↓
Sign
↓
SSRF / Endpoint Policy
↓
Deliver
↓
Record Result
↓
Retry / Failed Delivery
```

---

# 30. Webhook Signing

Support recommandé :

```text
HMAC-SHA256
```

avec :
- timestamp ;
- event ID ;
- signature.

---

# 31. Webhook Retry

Persisted attempts :

```text
PENDING
DELIVERED
FAILED
RETRYING
DEAD
```

Backoff borné.

---

# 32. Webhook SSRF

Outbound endpoint validation obligatoire :
- scheme ;
- host/IP ;
- redirects ;
- private network policy ;
- DNS rebinding protections pragmatiques.

---

# 33. Developer Portal

Portal en lecture/gestion contrôlée :

- APIs disponibles ;
- versions ;
- docs ;
- auth ;
- scopes ;
- examples ;
- errors ;
- changelog ;
- deprecation ;
- clients/keys selon permission.

---

# 34. Documentation

Pour chaque API :

```text
Overview
Authentication
Scopes
Base URL
Versions
Endpoints
Request/Response
Errors
Rate Limits
Examples
Changelog
Deprecation
```

---

# 35. Deprecation

Lifecycle :

```text
ACTIVE
↓
DEPRECATED
↓
SUNSET
↓
DISABLED
```

Avec dates explicites.

---

# 36. Compatibility

Registry/API Manager doit indiquer :
- supported versions ;
- compatibility ;
- replacement version ;
- sunset date.

---

# 37. API Gateway Concept

Si aucun gateway dédié n’existe, les responsabilités peuvent rester dans NestJS.

Ne pas introduire une infrastructure gateway externe uniquement pour satisfaire le CDC.

Fonctions requises :
- auth ;
- scopes ;
- rate limit ;
- quota ;
- trace ;
- metrics ;
- version routing.

---

# 38. CORS

CORS dépend du type de consommateur.

Browser clients :
- origins allowlist ;
- credentials policy ;
- methods/headers contrôlés.

M2M :
- CORS non pertinent.

---

# 39. CSRF

CSRF concerne les flux browser basés cookies/session.

API key/Bearer M2M ne doit pas être mélangé à une protection CSRF inadaptée.

---

# 40. Payload Validation

ValidationPipe / DTO / schemas :
- unknown fields ;
- size ;
- types ;
- enum ;
- nested depth.

---

# 41. Request Limits

Limiter :
- body size ;
- query params ;
- headers ;
- pagination ;
- batch size.

---

# 42. Error Contract

Exemples :

```text
API_NOT_FOUND
API_VERSION_NOT_SUPPORTED
API_CLIENT_INVALID
API_CLIENT_DISABLED
API_CREDENTIAL_INVALID
API_SCOPE_DENIED
API_POLICY_DENIED
API_RATE_LIMITED
API_QUOTA_EXCEEDED
API_PAYLOAD_INVALID
API_WEBHOOK_INVALID
API_WEBHOOK_DELIVERY_FAILED
API_VERSION_DEPRECATED
```

---

# 43. Trace / Correlation

Chaque requête expose/reçoit un `traceId` cohérent avec Observability.

Pas de génération concurrente incompatible dans les couches internes.

---

# 44. Tenant Isolation

Tenant A ne peut jamais :
- gérer client B ;
- lire credentials B ;
- lire usage B ;
- modifier webhook B ;
- accéder API tenant B sans policy.

---

# 45. IAM

Permissions de gestion :

```text
api.read
api.manage
api.client.read
api.client.manage
api.credential.rotate
api.scope.manage
api.policy.manage
api.usage.read
api.webhook.read
api.webhook.manage
api.docs.manage
api.diagnostics
```

---

# 46. Registry Integration

Registry fournit/consomme :
- APIs ;
- versions ;
- schemas ;
- capabilities ;
- owners ;
- compatibility.

Éviter double Registry concurrent.

---

# 47. Observability

Metrics :

```text
api_requests_total
api_request_duration
api_errors_total
api_rate_limited_total
api_quota_denied_total
webhook_deliveries_total
webhook_failures_total
```

---

# 48. Audit

Auditer :
- client create/update ;
- credential create/rotate/revoke ;
- scopes ;
- policies ;
- rate limit/quota ;
- webhook subscription ;
- deprecation.

---

# 49. Mock Provider

MockIntegrationProvider peut être utilisé pour tests/DEV.

En mode REAL/production :
- jamais de fallback silencieux ;
- état explicitement réel.

---

# 50. API conceptuelle

Catalog :

```http
GET  /api/api-manager/apis
GET  /api/api-manager/apis/:id
POST /api/api-manager/apis
PATCH /api/api-manager/apis/:id
```

Versions :

```http
GET  /api/api-manager/apis/:id/versions
POST /api/api-manager/apis/:id/versions
POST /api/api-manager/versions/:id/deprecate
```

Clients :

```http
GET    /api/api-manager/clients
POST   /api/api-manager/clients
GET    /api/api-manager/clients/:id
PATCH  /api/api-manager/clients/:id
POST   /api/api-manager/clients/:id/rotate-secret
POST   /api/api-manager/clients/:id/revoke
```

Webhooks :

```http
GET    /api/api-manager/webhooks
POST   /api/api-manager/webhooks
PATCH  /api/api-manager/webhooks/:id
DELETE /api/api-manager/webhooks/:id
GET    /api/api-manager/webhooks/:id/deliveries
```

Usage :

```http
GET /api/api-manager/usage
GET /api/api-manager/diagnostics
```

Adapter aux routes réelles.

---

# 51. Security Boundary

Pipeline API exposée :

```text
Request
↓
Trace
↓
Authentication
↓
Client/User Principal
↓
Tenant Resolution
↓
API Version
↓
Scopes
↓
Access Policy
↓
Rate Limit
↓
Quota
↓
DTO Validation
↓
Internal Contract
↓
Target Module
↓
Audit/Metrics
```

---

# 52. API Client Lifecycle

```text
DRAFT
ACTIVE
SUSPENDED
REVOKED
EXPIRED
```

---

# 53. Credential Rotation

Rotation sûre :
- old + new overlap facultatif ;
- grace period ;
- revoke old ;
- audit.

---

# 54. Webhook Delivery Persistence

Les deliveries doivent être persistées.

Un restart ne doit pas effacer :
- failed attempts ;
- retry schedule ;
- delivery history.

---

# 55. Outbox

Pour événements fiables, utiliser outbox/event infrastructure si existante.

Ne pas créer un second event bus.

---

# 56. Usage Retention

Définir retention/aggregation pour éviter stockage illimité de chaque requête.

---

# 57. Privacy

Usage/audit ne doit pas stocker inutilement :
- request bodies ;
- personal data ;
- auth tokens.

---

# 58. UI Overview

Afficher :
- Active APIs ;
- API Clients ;
- Requests ;
- Error Rate ;
- Rate-limited requests ;
- Webhook failures.

Données réelles uniquement.

---

# 59. Catalogue UI

Table :
- API ;
- Owner ;
- Visibility ;
- Version ;
- Status ;
- Consumers ;
- Docs ;
- Actions.

---

# 60. Client UI

Afficher :
- client ;
- type ;
- tenant/application ;
- status ;
- scopes ;
- last used ;
- quota ;
- actions.

---

# 61. Credential UI

Jamais afficher le secret après création.

Afficher :
- prefix ;
- created ;
- expires ;
- last used ;
- status.

---

# 62. Usage UI

Charts/tables :
- requests ;
- errors ;
- latency ;
- top APIs ;
- top clients ;
- quota usage.

---

# 63. Webhook UI

Table :
- event ;
- endpoint host ;
- status ;
- success rate ;
- last delivery ;
- failures.

---

# 64. Diagnostics UI

Checks :
- auth ;
- scopes ;
- Registry ;
- limiter ;
- usage sink ;
- webhook delivery ;
- docs/OpenAPI ;
- provider mode.

---

# 65. Tests

Unit :
- client lifecycle ;
- credentials ;
- scopes ;
- policies ;
- limiter ;
- quota ;
- webhook signing ;
- SSRF ;
- deprecation.

Integration :
- IAM ;
- Registry ;
- Observability ;
- Billing ;
- target module contracts.

Security :
- key leakage ;
- cross-tenant ;
- scope bypass ;
- replay ;
- webhook SSRF ;
- quota bypass ;
- revoked client.

---

# 66. E2E

```text
Create API Client
↓
Assign Scopes
↓
Issue Credential
↓
Call API v1
↓
Authenticate
↓
Authorize
↓
Rate Limit / Quota
↓
Target Module
↓
Usage recorded
```

Webhook :

```text
Business Event
↓
Webhook Subscription
↓
Signed Delivery
↓
Retry if needed
↓
History
```

---

# 67. Definition of Done

API & Integration Manager est DONE si :

- API Manager distinct de Integration Hub ;
- catalogue réel ;
- contracts/versioning réels ;
- clients M2M réels ;
- credentials protégés ;
- rotation/revocation ;
- scopes/policies backend ;
- rate limits réellement appliqués ;
- quotas réellement appliqués si annoncés ;
- usage réel ;
- outbound webhooks persistés/signés ;
- SSRF traité ;
- Developer Portal basé sur APIs réelles ;
- deprecation/versioning ;
- tenant isolation ;
- no mock silent production ;
- security/E2E/build/CI verts.
