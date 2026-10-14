# CAHIER DES CHARGES — TECHZONE CLOUD ERP ADAPTER / INTEGRATION HUB
## Étape 1 — Cible fonctionnelle et architecturale

**Projet :** Techzone Cloud  
**Module :** ERP Adapter / Integration Hub  
**Version cible :** 3.0  
**Statut :** Spécification cible  
**Principe :** centraliser les intégrations externes derrière des contrats stables, tenant-scoped et sécurisés. Dolibarr reste encapsulé derrière un Adapter fournisseur ; aucun module Techzone Cloud ne doit dépendre directement de son API.

---

# 1. Objet

ERP Adapter / Integration Hub répond à :

```text
COMMENT TECHZONE CLOUD
SE CONNECTE À DES SYSTÈMES EXTERNES
DE MANIÈRE STABLE, SÉCURISÉE ET MULTI-TENANT ?
```

---

# 2. Architecture cible

```text
MODULE TECHZONE CLOUD
        ↓
INTEGRATION CONTRACT
        ↓
INTEGRATION HUB
        ↓
CONNECTOR / ADAPTER
        ↓
EXTERNAL SYSTEM
```

Pour Dolibarr :

```text
TECHZONE CLOUD
      ↓
INTEGRATION CONTRACT
      ↓
INTEGRATION HUB
      ↓
DOLIBARR ADAPTER
      ↓
DOLIBARR API
```

---

# 3. Responsabilités

Integration Hub possède :

- Connector Registry ;
- Integration Registry ;
- Integration Contracts ;
- Credentials references ;
- Capabilities ;
- Resource mappings ;
- Field mappings ;
- External Resource Links ;
- Commands ;
- Queries ;
- Synchronization ;
- Webhooks ;
- Retry ;
- Idempotency ;
- Diagnostics ;
- Audit ;
- provider availability.

ERP Adapter possède :

- traduction contrat Techzone ↔ API ERP ;
- pagination ERP ;
- mapping fournisseur ;
- erreurs fournisseur ;
- timeouts ;
- retry adapté ;
- health check ;
- capabilities réelles.

---

# 4. Hors périmètre

Integration Hub ne doit pas :

- recréer Data Runtime ;
- recréer Automation ;
- stocker de secrets frontend ;
- permettre des URLs arbitraires ;
- contourner IAM ;
- contourner tenant context ;
- exposer l’API Dolibarr brute aux modules ;
- inventer des données de fallback en mode REAL.

---

# 5. Continuité

```text
KEEP       → fonctionnel
IMPROVE    → fonctionnel mais améliorable
FIX        → incorrect/dangereux
COMPLETE   → partiel
ADAPT      → réutilisable
IMPLEMENT  → absent
```

Conserver le `DolibarrAdapter` réel existant.

---

# 6. Navigation

```text
DONNÉES & INTÉGRATIONS
├── Données
├── ERP
└── API
```

Workspace ERP / Integrations :

```text
Vue d’ensemble
Connecteurs
ERP Instances
Contracts
Mappings
Synchronisations
Webhooks
Diagnostics
Historique
```

---

# 7. Tenant Context

Toute Integration/ERP instance appartient à un Tenant.

Contexte :

```text
Tenant
↓
Integration Instance
↓
Connector
↓
Contract
↓
Operation
```

Aucun provider global mutable partagé entre tenants.

---

# 8. Connector Registry

Registry conceptuel :

```text
ConnectorDefinition
├── key
├── type
├── provider
├── version
├── capabilities
├── supportedResources
├── configurationSchema
├── credentialSchema
└── runtimeCompatibility
```

Exemples :

```text
DOLIBARR
REST
WEBHOOK
INTERNAL_SERVICE
```

---

# 9. Integration Instance

```text
IntegrationInstance
├── id
├── tenantId
├── connectorKey
├── name
├── status
├── baseUrl
├── configurationRef
├── credentialRef
├── environment
├── capabilities
├── lastHealthCheck
├── createdAt
└── updatedAt
```

---

# 10. Status

```text
UNCONFIGURED
CONFIGURED
CHECKING
AVAILABLE
DEGRADED
UNAVAILABLE
DISABLED
ERROR
```

`AVAILABLE` = health check réel réussi.

---

# 11. REAL vs MOCK

Modes explicites :

```text
REAL
MOCK
SANDBOX
```

Règle :

```text
PRODUCTION + REAL
→ aucun fallback Mock
```

Mock uniquement DEV/TEST/SANDBOX explicite.

---

# 12. Provider Resolution

Le provider est résolu par :

```text
tenant
integration instance
connector key
environment
```

Jamais par query parameter arbitraire envoyé par client.

---

# 13. Adapter Isolation

Un Adapter ne doit pas conserver une configuration tenant mutable partagée globalement.

Cible :

```text
AdapterFactory / Request-scoped config / immutable client per instance
```

ou mécanisme équivalent sûr.

---

# 14. Dolibarr Adapter

Doit gérer :

- base URL contrôlée ;
- auth/token sécurisé ;
- API paths ;
- pagination ;
- query params allowlist ;
- mapping ;
- errors ;
- rate limits ;
- timeout ;
- retries ;
- health check.

---

# 15. Credentials

Jamais :
- frontend ;
- response ;
- logs ;
- diagnostics ;
- audit payload.

Stockage :
- secret store / encrypted storage / credentialRef.

---

# 16. Base URL

Validation obligatoire :
- HTTPS en production selon politique ;
- hostname allowlisted/validated ;
- pas de localhost/private network non autorisé ;
- pas de file:// ;
- pas de metadata endpoint cloud ;
- pas d’URL fournie librement à chaque requête.

---

# 17. SSRF

Bloquer :
- loopback ;
- link-local ;
- private ranges si non explicitement autorisés ;
- redirects vers zone interdite ;
- DNS rebinding autant que possible ;
- alternate IP notations.

---

# 18. Integration Contracts

Contrats stables :

```text
Resource Contract
Query Contract
Command Contract
Sync Contract
Webhook Contract
Error Contract
Capability Contract
```

---

# 19. Contract Versioning

Chaque contrat :
- version ;
- schema ;
- input ;
- output ;
- errors ;
- capability requirements.

---

# 20. Resource Contract

Exemple :

```text
Product
Customer
Order
Invoice
Payment
Supplier
Warehouse
StockMovement
```

Le nom canonique Techzone n’est pas forcément le nom Dolibarr.

---

# 21. Resource Mapping

```text
Techzone Resource
↔
External Resource
```

Exemple :

```text
Customer
↔
thirdparty
```

---

# 22. Field Mapping

```text
Techzone Field
↔
External Field
```

Support :
- direct ;
- conversion ;
- enum mapping ;
- formatting ;
- null handling ;
- read-only.

Pas de code arbitraire.

---

# 23. External Resource Link

Mappe :

```text
tenant
integration instance
Techzone resource ID
external resource ID
resource type
```

Tenant validation obligatoire à l’écriture.

---

# 24. Queries

Exemples :
- list ;
- get ;
- search ;
- paginate.

Pipeline :

```text
IAM
↓
Tenant
↓
Integration Contract
↓
Capability Check
↓
Provider Resolution
↓
Adapter Query
↓
Map Response
↓
Sanitize
```

---

# 25. Commands

Exemples :
- create ;
- update ;
- validate ;
- cancel ;
- post payment ;
- stock movement.

Pipeline identique + idempotency/audit.

---

# 26. Capability Check

Distinction :

```text
DECLARED
REGISTERED
AVAILABLE
SUPPORTED BY INSTANCE
```

Une capability n’est réelle que si le provider/instance la supporte.

---

# 27. Idempotency

Pour commandes sensibles :

```text
tenant
integration instance
operation
business key
idempotency key
```

Éviter double création ERP.

---

# 28. Retry

Retry uniquement erreurs retryables :
- timeout ;
- 429 ;
- transient 5xx.

Pas retry aveugle sur validation/4xx métier.

---

# 29. Timeout

Chaque appel externe a :
- connect timeout ;
- request timeout ;
- upper bound.

---

# 30. Circuit Breaker

Si architecture le permet :
- failure threshold ;
- open duration ;
- half-open.

Sinon au minimum health + backoff.

---

# 31. Synchronization

Types :

```text
PULL
PUSH
BIDIRECTIONAL
```

Ne retenir que les modes réels.

---

# 32. Incremental Sync

Utiliser :
- cursor ;
- updatedSince ;
- checkpoint ;
- page cursor.

Checkpoint tenant-scoped.

---

# 33. Sync Run

```text
SyncRun
├── id
├── tenantId
├── integrationId
├── direction
├── resourceType
├── status
├── startedAt
├── completedAt
├── processed
├── succeeded
├── failed
├── checkpoint
├── errorCode
└── traceId
```

---

# 34. Conflicts

Aucun conflit silencieux.

Strategies possibles :

```text
SOURCE_WINS
TARGET_WINS
MANUAL
VERSION_CHECK
```

Doivent être explicites.

---

# 35. Webhooks

Pipeline :

```text
External Provider
↓
Webhook Endpoint
↓
Signature/Auth Validation
↓
Tenant/Integration Resolution
↓
Schema Validation
↓
Deduplication
↓
Event Mapping
↓
Business Event / Automation
```

---

# 36. Webhook Security

- signature/HMAC/token selon provider ;
- timestamp tolerance ;
- replay protection ;
- idempotency/dedup ;
- body size ;
- rate limit.

---

# 37. Data Runtime Integration

Data Runtime utilise :

```text
ERP Provider
↓
Integration Hub
↓
ERP Adapter
```

Pas d’appel Dolibarr direct.

---

# 38. Automation Integration

Automation exécute les actions externes via Integration Contracts.

---

# 39. Pack Manager Integration

Pack peut déclarer :
- connector requirements ;
- capabilities ;
- contract versions.

---

# 40. Pack Runtime Integration

Runtime vérifie disponibilité effective des connecteurs requis.

---

# 41. Environment / Deployment

Une intégration peut varier par Environment.

Deployment preflight vérifie :
- instance configurée ;
- credentials disponibles ;
- capability ;
- health.

---

# 42. Registry Platform

Integration Hub publie :
- connectors ;
- capabilities ;
- contract versions ;
- health metadata.

---

# 43. IAM

Permissions conceptuelles :

```text
integration.read
integration.create
integration.update
integration.disable
integration.credentials.manage
integration.mapping.read
integration.mapping.write
integration.execute.query
integration.execute.command
integration.sync.manage
integration.webhook.manage
integration.diagnostics
```

---

# 44. Tenant Isolation

Tenant A ne peut jamais :
- lire ERP instance B ;
- tester credentials B ;
- exécuter command B ;
- lire mapping B ;
- utiliser ExternalResourceLink B ;
- lire sync history B.

---

# 45. Audit

Auditer :
- connector create/update ;
- credentials rotation/ref update ;
- mappings ;
- command mutations ;
- sync ;
- webhook config ;
- provider mode change.

Jamais la valeur du secret.

---

# 46. Diagnostics

Structure :

```text
stage
code
severity
message
connector
integrationId
resource?
operation?
timestamp
traceId
```

---

# 47. Error Contract

```text
INTEGRATION_NOT_FOUND
INTEGRATION_TENANT_DENIED
INTEGRATION_PERMISSION_DENIED
INTEGRATION_CONFIG_INVALID
INTEGRATION_CREDENTIAL_UNAVAILABLE
INTEGRATION_PROVIDER_UNAVAILABLE
INTEGRATION_CAPABILITY_UNSUPPORTED
INTEGRATION_TIMEOUT
INTEGRATION_RATE_LIMITED
INTEGRATION_REMOTE_VALIDATION_FAILED
INTEGRATION_MAPPING_INVALID
INTEGRATION_IDEMPOTENCY_CONFLICT
INTEGRATION_SSRF_BLOCKED
INTEGRATION_WEBHOOK_INVALID
INTEGRATION_SYNC_CONFLICT
```

---

# 48. ERP Registry

Le Registry doit être cohérent avec Prisma.

`tenantId` doit avoir exactement le même type canonique que Tenant.

Aucune dérive UUID/varchar.

---

# 49. Prisma

Avant migration :
- vérifier type Tenant.id ;
- vérifier ERPRegistry.tenantId ;
- FK ;
- indexes ;
- existing data ;
- fresh DB ;
- upgrade DB.

Migration non destructive.

---

# 50. API conceptuelle

```http
GET    /api/integrations
POST   /api/integrations
GET    /api/integrations/:id
PATCH  /api/integrations/:id
POST   /api/integrations/:id/check
POST   /api/integrations/:id/disable

GET    /api/integrations/:id/resources
POST   /api/integrations/:id/query
POST   /api/integrations/:id/commands/:command

GET    /api/integrations/:id/mappings
POST   /api/integrations/:id/mappings

POST   /api/integrations/:id/sync
GET    /api/integrations/:id/sync-runs

POST   /api/integrations/webhooks/:endpointKey
```

Adapter à l’existant.

---

# 51. Health Check

Health non destructif :
- authentication ;
- lightweight endpoint ;
- latency ;
- capability probe safe.

Ne jamais créer/supprimer de données en health check.

---

# 52. Live Integration Certification

Pour Dolibarr recette :

```text
authenticate
↓
GET safe resource
↓
pagination
↓
mapping
↓
capability
↓
diagnostics
```

Command writes seulement sur fixture dédiée et si demandé par test.

---

# 53. UI Overview

KPIs réels :
- integrations ;
- available ;
- degraded ;
- unavailable ;
- sync errors ;
- webhook errors.

---

# 54. Connectors

Catalogue :
- Dolibarr ;
- future connectors.

Afficher :
- capability ;
- version ;
- status.

---

# 55. ERP Instances

Table :
- Name ;
- Connector ;
- Environment ;
- Status ;
- Capabilities ;
- Last Check ;
- Last Sync ;
- Actions.

---

# 56. Mapping UI

Matrix :
- Techzone resource ;
- external resource ;
- fields ;
- direction ;
- validation.

---

# 57. Sync UI

Afficher :
- direction ;
- resource ;
- checkpoint ;
- progress ;
- result ;
- failures.

---

# 58. Webhook UI

Afficher :
- endpoint ;
- provider ;
- auth type ;
- last event ;
- errors ;
- dedup status.

Jamais secret.

---

# 59. Diagnostics UI

Tests contrôlés :
- connectivity ;
- auth ;
- capability ;
- resource query ;
- mapping.

---

# 60. REAL/MOCK UI

Badge visible :

```text
REAL
MOCK
SANDBOX
```

Production ne doit jamais afficher REAL alors que provider réel n’a pas été vérifié.

---

# 61. Tests unitaires

- registry ;
- provider resolver ;
- URL validator ;
- mappings ;
- idempotency ;
- retry ;
- webhook validation ;
- sync conflict.

---

# 62. Tests intégration

- live Dolibarr safe read ;
- tenant instance resolution ;
- Data Runtime provider ;
- Automation action ;
- webhook signature ;
- Prisma Registry.

---

# 63. Security Tests

- SSRF ;
- secret leakage ;
- cross-tenant ;
- mock in prod ;
- forged provider ;
- arbitrary URL ;
- replay webhook ;
- idempotency ;
- mapping cross-tenant.

---

# 64. E2E

```text
Login
↓
Create/Select Integration
↓
Configure Dolibarr
↓
Health Check
↓
Map Product
↓
Data Runtime Query
↓
Integration Hub
↓
Dolibarr Adapter
↓
Dolibarr
↓
Mapped Result
```

Automation :

```text
Business Event
↓
Automation
↓
Integration Contract
↓
Hub
↓
Dolibarr command
↓
Persistent Execution/Audit
```

---

# 65. Definition of Done

ERP Adapter / Integration Hub est DONE si :

- DolibarrAdapter réel préservé ;
- provider tenant-safe ;
- no shared mutable config leakage ;
- connector Registry réel ;
- Integration Contracts versionnés ;
- credentials protégés ;
- SSRF bloqué ;
- capabilities réelles ;
- mappings persistés ;
- ExternalResourceLink tenant-safe ;
- timeout/retry/idempotency ;
- sync traçable ;
- webhooks sécurisés ;
- REAL/MOCK strict ;
- live Dolibarr read test vert ;
- `ERPRegistry.tenantId` cohérent ;
- fresh/upgrade DB verts ;
- Data Runtime/Automation passent par Hub ;
- tests/build/CI verts.
