# CAHIER DES CHARGES — TECHZONE CLOUD DATA PLATFORM / DATA RUNTIME
## Étape 1 — Cible fonctionnelle et architecturale

**Projet :** Techzone Cloud  
**Module :** Data Platform / Data Runtime  
**Version cible :** 3.0  
**Statut :** Spécification cible  
**Principe :** consolider la couche Data existante sans recréer le modèle métier du Business Manager. Data Runtime exécute uniquement des opérations autorisées dans un contexte tenant, IAM et Pack Runtime valide.

---

# 1. Objet

Data Platform / Data Runtime constitue la couche transversale :

```text
GOUVERNER
→ Data Sources
→ Contracts
→ Repositories
→ Policies
→ Capabilities

EXÉCUTER
→ Query
→ Read
→ Create
→ Update
→ Delete
→ Transaction
→ Aggregate
→ Diagnostics
```

Business Manager reste propriétaire de la définition métier.

---

# 2. Position dans Techzone Cloud

```text
BUSINESS MANAGER
Entities • Fields • Relations • Constraints
        ↓
DATA PLATFORM
Sources • Contracts • Repositories • Policies
        ↓
PACK MANAGER
Data Requirements
        ↓
PACK RUNTIME
Executable Resolution / Runtime Context
        ↓
DATA RUNTIME
Query • Mutation • Transaction • Diagnostics
        ↓
Providers
├── Prisma / PostgreSQL
├── ERP Provider
├── Internal Service
└── External Connector
```

---

# 3. Data Platform vs Data Runtime

## Data Platform

Configuration, gouvernance et contrats :

```text
Data Sources
Data Contracts
Repository Registry
Query Definitions
Mutation Definitions
Data Policies
Schema Mapping
Data Access Rules
Data Capabilities
Diagnostics
```

## Data Runtime

Exécution :

```text
Runtime Data Context
Repository Resolver
Query Executor
Mutation Executor
Transaction Manager
Pagination
Filtering
Sorting
Aggregation
Cache
Connection Management
Error Handling
Diagnostics
```

---

# 4. Responsabilité Business Manager

Business Manager possède :

```text
Entity
Field
Relation
Business Constraints
Business Metadata
Business Events
```

Data Platform ne recrée jamais ces objets.

---

# 5. Data Source Registry

Sources possibles :

```text
POSTGRESQL
ERP
REST_API
INTERNAL_SERVICE
EXTERNAL_CONNECTOR
```

MVP réel :

```text
PostgreSQL / Prisma
ERP Adapter / Dolibarr
Internal Techzone Cloud Services
```

---

# 6. Data Source

Modèle conceptuel :

```text
DataSource
├── id
├── tenantId
├── key
├── name
├── type
├── provider
├── status
├── configurationRef
├── credentialRef
├── capabilities
├── environment?
├── createdAt
└── updatedAt
```

Aucun credential en clair côté frontend.

---

# 7. Data Source Status

États :

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

`AVAILABLE` doit provenir d’un contrôle réel.

---

# 8. Data Source Capabilities

Exemples :

```text
READ
CREATE
UPDATE
DELETE
FILTER
SORT
PAGINATE
AGGREGATE
TRANSACTION
SEARCH
```

Une capability déclarée mais non supportée ne doit pas être exposée comme disponible.

---

# 9. Data Contract

Interface stable entre modèle métier et runtime.

Exemple :

```json
{
  "entity": "product",
  "source": "primary",
  "operations": ["read", "create", "update", "delete"],
  "permissions": {},
  "policies": {}
}
```

Peut préciser :

- fields ;
- relations ;
- filters ;
- sorting ;
- pagination ;
- permissions ;
- policies ;
- provider requirements ;
- runtime requirements.

---

# 10. Contract Versioning

Chaque contrat important doit être :

- stable ;
- versionnable ;
- tenant-aware ;
- compatible avec ApplicationVersion/PackVersion ;
- référencé depuis Pack Manager si nécessaire.

---

# 11. Repository Registry

Pipeline :

```text
Entity
↓
Data Contract
↓
Repository
↓
Provider
↓
Data Source
```

Le Registry répond :

```text
Repository exists?
Source available?
Supported operation?
Transaction support?
Runtime availability?
```

---

# 12. Repository Contract

Interface conceptuelle :

```text
findMany
findOne
count
aggregate
create
update
delete
transaction
```

Chaque opération dépend réellement des capacités du provider.

---

# 13. Query Engine

Pipeline :

```text
REQUEST
↓
IAM CONTEXT
↓
TENANT CONTEXT
↓
PACK RUNTIME RESOLUTION
↓
DATA CONTRACT
↓
DATA POLICY
↓
REPOSITORY RESOLUTION
↓
PROVIDER
↓
QUERY EXECUTION
↓
SANITIZE RESULT
↓
RESPONSE
```

---

# 14. Mutation Engine

Pipeline :

```text
REQUEST
↓
IAM
↓
TENANT
↓
EXECUTABLE RUNTIME RESOLUTION
↓
CONTRACT
↓
OPERATION PERMISSION
↓
VALIDATION
↓
POLICY
↓
REPOSITORY
↓
TRANSACTION
↓
PROVIDER
↓
AUDIT / EVENT
↓
RESULT
```

---

# 15. Execution Gate

Nouvelle règle centrale :

```text
PUBLISHED APPLICATION DATA CALL
WITHOUT EXECUTABLE PACK RUNTIME RESOLUTION
=
DENY
```

Un `resolutionId` ou un contexte serveur équivalent doit être vérifié.

---

# 16. Runtime Data Context

Contexte cible :

```text
Tenant
Application
ApplicationVersion
PackVersion
Environment
ResolutionId
RuntimeContextId
User / Identity
Permissions
Entity
Data Contract
Repository
Provider
Data Source
```

Le backend construit ce contexte.

---

# 17. resolutionId

Pour une application publiée :

```text
resolutionId
↓
Pack Runtime verification
↓
status = EXECUTABLE
↓
Tenant matches
↓
ApplicationVersion matches
↓
PackVersion matches
↓
Environment matches
↓
Data capability allowed
↓
continue
```

Le navigateur ne décide jamais du résultat.

---

# 18. IAM

IAM reste l’autorité :

```text
Identity
Role
Permission
Tenant
Membership
```

Une résolution Pack Runtime valide ne donne jamais automatiquement une permission métier.

---

# 19. Data Policies

Policies pour :

```text
READ
CREATE
UPDATE
DELETE
AGGREGATE
EXECUTE
```

Peuvent dépendre de :

```text
Permission
Role
Feature
Capability
Entity
Operation
Runtime Context
```

---

# 20. Field-Level Access

Prévoir :

```text
Entity readable
Field sensitive hidden
```

Exemple :

```text
Product readable
internalCost hidden
```

MVP peut rester simple si aucune granularité field-level réelle n’existe encore.

---

# 21. Row-Level Access

Exemple :

```text
Sales Agent
→ Orders assigned to current user
```

Les filtres de sécurité sont construits côté backend.

---

# 22. Tenant Isolation

Toute opération est tenant-scoped.

Interdit :

```text
tenantId = frontendValue as authority
```

Le Tenant vient du contexte IAM / Runtime validé.

---

# 23. Prisma Provider

```text
Data Runtime
↓
Prisma Provider
↓
Prisma Client
↓
PostgreSQL
```

Frontend n’accède jamais directement à Prisma.

---

# 24. ERP Provider

```text
Data Runtime
↓
ERP Provider
↓
Integration Contract
↓
Integration Hub
↓
ERP Adapter
↓
Dolibarr
```

Data Runtime ne crée pas son propre client Dolibarr.

---

# 25. Internal Service Provider

Les services internes utilisent des contrats explicites.

Pas d’accès arbitraire inter-module.

---

# 26. Query Definitions

Une Query Definition peut définir :

```text
entity
fields
filters allowed
sorting allowed
pagination
aggregation
permission
policy
```

---

# 27. Mutation Definitions

Une Mutation Definition peut définir :

```text
entity
operation
input schema
allowed fields
permission
policy
transaction behavior
idempotency
events
```

---

# 28. Input Validation

Valider :

- entity ;
- fields ;
- filters ;
- sort ;
- pagination ;
- mutation body ;
- IDs ;
- enums ;
- unknown fields ;
- protected fields.

Interdire mass assignment.

---

# 29. Filtering

Le frontend peut demander uniquement des filtres autorisés.

Interdit :

- filtre SQL brut ;
- expression Prisma brute ;
- JavaScript ;
- arbitrary provider syntax.

---

# 30. Sorting

Whitelist par contrat.

---

# 31. Pagination

Support :

```text
page/limit
ou
cursor
```

selon architecture.

Imposer des limites maximales.

---

# 32. Aggregation

Uniquement si provider/capability l’autorise.

Exemples :

```text
COUNT
SUM
AVG
MIN
MAX
```

---

# 33. Search

Search est une capability distincte.

Pas d’injection SQL/full-text arbitraire.

---

# 34. Transactions

Transaction Manager pour opérations atomiques locales.

Exemple :

```text
Create Order
+
Create Order Items
+
Update Stock
↓
COMMIT / ROLLBACK
```

---

# 35. Transactions distribuées

Ne jamais simuler une ACID globale entre :

```text
PostgreSQL
ERP
External API
```

Utiliser si nécessaire :

```text
Saga
Compensation
Retry
Idempotency
```

---

# 36. Idempotency

Requise selon opération :

- Automation ;
- ERP ;
- Payment ;
- Webhook ;
- Retry ;
- mutation externe sensible.

---

# 37. Optimistic Concurrency

Pour ressources sensibles/versionnées, utiliser une stratégie réelle si nécessaire :

```text
version
updatedAt
ETag
```

Ne pas écraser silencieusement une modification concurrente.

---

# 38. Data Validation

Trois niveaux :

## Structure
- string ;
- number ;
- date ;
- boolean ;
- required ;
- nullable.

## Métier
Exemple :
`price >= 0`

## Autorisation
Exemple :
`user may update Product`

---

# 39. Data Events

Les mutations significatives peuvent produire des Business Events définis dans Business Manager.

Data Runtime ne crée pas arbitrairement des event contracts.

---

# 40. Cache

Cache possible pour :
- registry ;
- contracts ;
- query results contrôlés ;
- provider metadata.

Cache key tenant-aware.

---

# 41. Cache Invalidation

Invalider selon :
- mutation ;
- contract/version change ;
- Pack Runtime resolution/config change ;
- provider change.

---

# 42. Data Source Availability

`REGISTERED ≠ AVAILABLE`.

Health réel requis.

---

# 43. Diagnostics

Contrat :

```text
stage
code
severity
message
entity?
repository?
provider?
source?
timestamp
correlationId
```

Aucun secret.

---

# 44. Error Contract

Codes possibles :

```text
DATA_ENTITY_UNKNOWN
DATA_CONTRACT_NOT_FOUND
DATA_OPERATION_NOT_ALLOWED
DATA_PERMISSION_DENIED
DATA_POLICY_DENIED
DATA_RUNTIME_RESOLUTION_REQUIRED
DATA_RUNTIME_RESOLUTION_BLOCKED
DATA_TENANT_MISMATCH
DATA_REPOSITORY_NOT_FOUND
DATA_PROVIDER_UNAVAILABLE
DATA_SOURCE_UNAVAILABLE
DATA_VALIDATION_FAILED
DATA_FILTER_NOT_ALLOWED
DATA_SORT_NOT_ALLOWED
DATA_TRANSACTION_FAILED
DATA_CONFLICT
DATA_TIMEOUT
```

---

# 45. API conceptuelle

Préfixe :

```text
/api/data
```

Query :

```http
POST /api/data/query
```

Mutation :

```http
POST /api/data/mutation
```

Read/execute existants peuvent rester si stables.

---

# 46. Registry API

```http
GET /api/data/registry/entities
GET /api/data/registry/entities/:key
GET /api/data/registry/providers
GET /api/data/registry/capabilities
```

---

# 47. Diagnostics API

```http
GET /api/data/diagnostics
GET /api/data/sources
GET /api/data/repositories
```

Permissions adaptées.

---

# 48. Query Request conceptuel

```json
{
  "resolutionId": "...",
  "entity": "product",
  "fields": ["id", "name", "price"],
  "filters": [],
  "sort": [],
  "pagination": {}
}
```

Le Tenant n’est pas fourni comme autorité.

---

# 49. Mutation Request conceptuel

```json
{
  "resolutionId": "...",
  "entity": "product",
  "operation": "update",
  "id": "...",
  "data": {}
}
```

Protected fields server-controlled.

---

# 50. Pack Manager Integration

Pack Manager déclare :

- Data requirements ;
- required repositories ;
- required capabilities ;
- contract versions.

---

# 51. Pack Runtime Integration

Pack Runtime fournit/valide :

- resolutionId ;
- ApplicationVersion ;
- PackVersion ;
- effective Data bindings ;
- Environment ;
- executable status.

---

# 52. UI Builder Integration

UI Builder lie les composants UI à des Data Contracts / operations.

Il ne contient pas de SQL/Prisma brut.

---

# 53. Automation Integration

Automation utilise les mêmes contracts/policies que UI Runtime.

Une workflow action ne contourne pas IAM/Tenant/Data Policies.

---

# 54. ERP Integration

Data Runtime utilise ERP Provider → Integration Hub.

Jamais de credentials ERP dans UI.

---

# 55. Navigation

```text
DONNÉES & INTÉGRATIONS
└── Données
    ├── Vue d’ensemble
    ├── Sources
    ├── Modèles & Contrats
    ├── Requêtes
    ├── Politiques
    └── Diagnostics
```

Data Runtime n’a pas besoin d’un second menu utilisateur.

---

# 56. Data Overview

Métriques réelles :

- Sources ;
- Available/Degraded ;
- Contracts ;
- Repositories ;
- Query volume if observable ;
- Mutation errors ;
- blocked requests.

---

# 57. Query Explorer

Outil technique contrôlé.

Permet :
- entity ;
- fields ;
- filters ;
- sort ;
- limit ;
- run.

Interdit :
- raw SQL ;
- arbitrary Prisma ;
- arbitrary JavaScript.

---

# 58. Mutation Tester

Admin/dev seulement si prévu.

Doit demander confirmation pour writes.

Ne jamais devenir un DBA console.

---

# 59. Policies UI

Exemple :

```text
Product
READ   → product.read
CREATE → product.create
UPDATE → product.update
DELETE → product.delete
```

IAM fournit les permissions.

---

# 60. Security

Defense-in-depth :

```text
IAM
+
Tenant Context
+
Pack Runtime executable resolution
+
Data Contract
+
Data Policy
+
Repository tenant filter
+
PostgreSQL RLS where applicable
```

---

# 61. RLS

Pour les données Techzone tenant-scoped PostgreSQL, RLS peut fournir une seconde ligne de défense selon Tenant Foundation.

Data Runtime ne doit pas supposer que RLS remplace les filtres applicatifs.

---

# 62. Audit

Auditer principalement :

```text
CREATE
UPDATE
DELETE
Sensitive operations
Policy changes
Data source changes
```

---

# 63. Metrics

Exemples :

```text
data_queries_total
data_mutations_total
query_duration
mutation_duration
query_errors
mutation_errors
transaction_rollbacks
cache_hit_ratio
provider_errors
runtime_resolution_denied_total
```

---

# 64. Performance

- pagination obligatoire ;
- avoid N+1 ;
- bounded queries ;
- indexes ;
- timeouts ;
- query complexity limits ;
- aggregation controls.

---

# 65. Rate / Abuse Controls

Pour query explorer, APIs exposées ou opérations coûteuses :
- rate limit ;
- max page size ;
- max filters ;
- max nested depth ;
- timeout.

---

# 66. Secrets

Jamais dans :
- response ;
- frontend ;
- logs ;
- diagnostics ;
- audit.

---

# 67. Tests

Unit :
- contracts ;
- resolver ;
- query/mutation ;
- policies ;
- validation ;
- filters ;
- transactions ;
- idempotency.

Integration :
- BM → Data ;
- Pack Runtime → Data ;
- Prisma ;
- ERP Provider ;
- Automation.

Security :
- cross-tenant ;
- unauthorized operation ;
- blocked resolution ;
- mass assignment ;
- injection ;
- field/row policy ;
- RLS if enabled.

---

# 68. E2E

Positive :

```text
Login
↓
Published Application
↓
Pack Runtime EXECUTABLE
↓
Render UI
↓
Data Runtime Query
↓
Prisma Provider
↓
Tenant data only
↓
Mutation
↓
Audit/Event
```

Negative :

```text
Pack Runtime BLOCKED
↓
Data query/mutation
↓
DENY
```

---

# 69. Definition of Done

Data Platform / Data Runtime est DONE si :

- modèle métier non dupliqué ;
- sources/contracts/repositories cohérents ;
- query/mutation réels ;
- tenant scope serveur ;
- IAM réel ;
- Pack Runtime `EXECUTABLE` obligatoire pour runtime published path ;
- Data Policies appliquées ;
- filters/sort/pagination contrôlés ;
- transactions locales sûres ;
- ERP via Integration Hub ;
- aucune raw query frontend ;
- cross-tenant tests verts ;
- blocked-resolution tests verts ;
- PostgreSQL tests exécutés ;
- E2E UI → Pack Runtime → Data Runtime vert ;
- build/Prisma/CI verts.
