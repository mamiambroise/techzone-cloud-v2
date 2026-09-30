# CAHIER DES CHARGES --- TECHZONE CLOUD DATA PLATFORM / DATA RUNTIME

**Version :** 2.0 --- Consolidation et extension\
**Date :** Septembre 2026\
**Projet :** Techzone Cloud\
**Module :** Data Platform / Data Runtime\
**Statut :** Spécification fonctionnelle et technique consolidée\
**Principe :** Continuité de l'existant --- ne pas recréer le modèle
métier du Business Manager

------------------------------------------------------------------------

# 1. Objet

Data Platform / Data Runtime constitue la couche transversale d'accès,
de gouvernance et d'exécution des données de Techzone Cloud.

Le module ne redéfinit pas les entités métier. Le Business Manager reste
la source de vérité pour les entités, champs, relations, contraintes et
événements métier.

Data Platform définit les contrats et capacités Data. Data Runtime
exécute ces contrats dans le contexte d'un Pack publié.

La branche `main` reste canonique.

Avant toute modification :

``` text
EXISTANT + FONCTIONNEL → KEEP
EXISTANT + UI/UX FAIBLE → IMPROVE
PARTIEL → COMPLETE
ANCIEN MAIS RÉUTILISABLE → ADAPT
RÉELLEMENT ABSENT → IMPLEMENT
```

------------------------------------------------------------------------

# 2. Position dans l'architecture

``` text
BUSINESS MANAGER
Entities • Fields • Relations
Data Contracts
        │
        ▼
   DATA PLATFORM
Data Sources
Data Models Registry
Query Engine
CRUD Engine
Validation
Transactions
Tenant Isolation
Data Policies
        │
        ▼
    DATA RUNTIME
Runtime Data Context
Repository Resolution
Query Execution
Mutation Execution
Transactions
Cache
Diagnostics
        │
   ┌────┼──────────┐
   ▼    ▼          ▼
UI BUILDER    AUTOMATION    PACK RUNTIME
```

Principe :

> Business Manager définit ce qu'est la donnée métier. Data Platform
> définit comment elle peut être accédée et manipulée. Data Runtime
> exécute réellement ces opérations dans le contexte du Pack actif.

------------------------------------------------------------------------

# 3. Data Platform vs Data Runtime

## Data Platform

Partie configuration, gouvernance et contrats :

``` text
Data Sources
Data Contracts
Repository Registry
Query Definitions
Mutation Definitions
Data Policies
Validation
Schema Mapping
Data Access Rules
Data Capabilities
```

## Data Runtime

Partie exécution :

``` text
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

------------------------------------------------------------------------

# 4. Responsabilité du Business Manager

Business Manager reste propriétaire de :

``` text
Entity
Field
Relation
Business Constraints
Business Metadata
Business Events
```

Exemple :

``` text
Product
├── id
├── name
├── price
├── categoryId
└── stock
```

Data Platform ne recrée pas `Product`.

Elle expose les capacités autorisées, par exemple :

``` text
ProductRepository

findMany
findOne
create
update
delete
count
```

------------------------------------------------------------------------

# 5. Data Source Registry

Le système doit disposer d'un registre contrôlé des sources de données.

Types potentiels :

``` text
POSTGRESQL
ERP
REST_API
INTERNAL_SERVICE
EXTERNAL_CONNECTOR
```

Le MVP commence par les sources réellement utilisées :

``` text
PostgreSQL / Prisma
ERP Adapter / Dolibarr
Internal Techzone Cloud Services
```

------------------------------------------------------------------------

# 6. Data Source

Modèle conceptuel :

``` text
id
tenantId
key
name
type
provider
status
configurationRef
credentialRef
capabilities
createdAt
updatedAt
```

Les credentials ne sont jamais exposés directement au frontend.

------------------------------------------------------------------------

# 7. Data Source Capabilities

Capacités possibles :

``` text
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

Exemple :

``` text
PostgreSQL

READ          ✓
CREATE        ✓
UPDATE        ✓
DELETE        ✓
FILTER        ✓
SORT          ✓
PAGINATE      ✓
TRANSACTION   ✓
```

------------------------------------------------------------------------

# 8. Data Contract

Un Data Contract constitue l'interface stable entre le modèle métier et
Data Runtime.

Exemple :

``` json
{
  "entity": "product",
  "source": "primary",
  "operations": [
    "read",
    "create",
    "update",
    "delete"
  ]
}
```

Il peut également préciser :

``` text
fields
relations
filters
sorting
pagination
permissions
policies
```

------------------------------------------------------------------------

# 9. Repository Registry

Chaque Entity exploitable peut être associée à un Repository.

``` text
Entity
Product
     ↓
Product Repository
     ↓
Data Source
PostgreSQL
```

Le Registry répond notamment :

``` text
Repository exists?
Source?
Supported operations?
Transaction support?
Runtime availability?
```

------------------------------------------------------------------------

# 10. CRUD Engine

Le moteur standardise :

``` text
CREATE
READ
UPDATE
DELETE
```

uniquement lorsque l'opération est autorisée.

Pipeline :

``` text
UI Builder
    ↓
CREATE Product
    ↓
Data Runtime
    ↓
Authorization
    ↓
Validation
    ↓
Repository
    ↓
Transaction
    ↓
PostgreSQL
```

------------------------------------------------------------------------

# 11. Query Engine

Le Query Engine permet des requêtes structurées :

``` text
Entity
Fields
Filters
Relations
Sorting
Pagination
Aggregation
```

Exemple :

``` json
{
  "entity": "product",
  "select": ["id", "name", "price"],
  "filter": {
    "active": true
  },
  "sort": [
    {
      "field": "name",
      "direction": "ASC"
    }
  ],
  "page": 1,
  "pageSize": 25
}
```

Le moteur traduit cette définition contrôlée vers Prisma ou le provider
approprié.

Aucun SQL arbitraire fourni par le frontend n'est autorisé.

------------------------------------------------------------------------

# 12. Filtering

Opérateurs contrôlés :

``` text
EQ
NEQ
GT
GTE
LT
LTE
IN
NOT_IN
CONTAINS
STARTS_WITH
ENDS_WITH
IS_NULL
IS_NOT_NULL
```

Les opérateurs disponibles dépendent des capacités du provider.

------------------------------------------------------------------------

# 13. Combinaison des filtres

Support :

``` text
AND
OR
```

Exemple :

``` text
active = true
AND
price > 10000
```

La profondeur et la complexité doivent pouvoir être limitées.

------------------------------------------------------------------------

# 14. Sorting

``` text
ASC
DESC
```

Exemple :

``` text
createdAt DESC
name ASC
```

Seuls les champs autorisés sont utilisables.

------------------------------------------------------------------------

# 15. Pagination

Support minimum :

``` text
page
pageSize
total
totalPages
```

Cursor pagination peut être ajoutée ultérieurement si nécessaire.

------------------------------------------------------------------------

# 16. Relations

Data Runtime exploite les relations provenant de Business Manager.

Exemple :

``` text
Product
   ↓
Category
```

Une requête peut demander :

``` text
Product
+
Category.name
```

Data Platform ne redéfinit pas la relation.

------------------------------------------------------------------------

# 17. Relation Loading

Prévoir de façon contrôlée :

``` text
include
select
```

Limiter les profondeurs excessives de relations.

------------------------------------------------------------------------

# 18. Aggregation

Pour dashboards et rapports :

``` text
COUNT
SUM
AVG
MIN
MAX
```

Exemple :

``` text
SUM Order.total
GROUP BY status
```

------------------------------------------------------------------------

# 19. DataTable Integration

UI Builder DataTable utilise Data Platform :

``` text
DataTable
     ↓
Query Definition
     ↓
Data Runtime
     ↓
Query Engine
     ↓
Repository
```

UI Builder ne doit pas créer son propre moteur Data.

------------------------------------------------------------------------

# 20. Forms Integration

``` text
UI Form
   ↓
Mutation Definition
   ↓
Data Runtime
   ↓
Validation
   ↓
Mutation Engine
   ↓
Repository
```

------------------------------------------------------------------------

# 21. Mutation Engine

Types minimum :

``` text
CREATE
UPDATE
DELETE
```

`UPSERT` seulement si explicitement supporté.

------------------------------------------------------------------------

# 22. Mutation Pipeline

``` text
Request
  ↓
Authentication
  ↓
Tenant Context
  ↓
Authorization
  ↓
Contract Validation
  ↓
Business Validation
  ↓
Data Validation
  ↓
Transaction
  ↓
Repository
  ↓
Business Event
  ↓
Audit
```

------------------------------------------------------------------------

# 23. Validation

Trois niveaux restent distincts.

## Structure

``` text
string
number
date
boolean
required
nullable
```

## Métier

Exemple :

``` text
price >= 0
```

## Autorisation

Exemple :

``` text
user may update Product
```

Data Runtime ne remplace pas IAM.

------------------------------------------------------------------------

# 24. Transactions

Le Transaction Manager gère les opérations atomiques.

Exemple :

``` text
Create Order
     +
Create Order Items
     +
Update Stock
```

En cas d'échec critique :

``` text
ROLLBACK
```

pour les opérations participant à la même transaction.

------------------------------------------------------------------------

# 25. Transactions distribuées

Pour :

``` text
PostgreSQL
+
ERP
+
External API
```

ne pas simuler une transaction ACID globale.

Utiliser lorsque nécessaire et supporté :

``` text
Saga
Compensation
Retry
Idempotency
```

------------------------------------------------------------------------

# 26. Idempotency

Particulièrement importante pour :

``` text
Automation
ERP
Payment
Webhook
Retry
```

Exemple :

``` text
idempotencyKey
```

------------------------------------------------------------------------

# 27. Tenant Isolation

Toute opération Data Runtime est tenant-scoped.

Tenant A ne doit jamais accéder aux données de Tenant B, même en
envoyant un identifiant arbitraire.

Le backend construit le contexte tenant officiel.

------------------------------------------------------------------------

# 28. Tenant-aware Repository

Conceptuellement :

``` text
repository.findMany({
  tenantContext,
  ...
})
```

et non :

``` text
repository.findMany({
  tenantId: frontendValue
})
```

------------------------------------------------------------------------

# 29. Data Policies

Data Platform peut définir des politiques pour :

``` text
READ
CREATE
UPDATE
DELETE
```

selon :

``` text
Permission
Role
Feature
Capability
Entity
Operation
```

IAM reste l'autorité des identités et permissions.

------------------------------------------------------------------------

# 30. Field-level Access

Préparer la possibilité de rendre une Entity lisible tout en masquant
certains champs sensibles.

Exemple :

``` text
Product readable
internalCost hidden
```

Le MVP peut rester plus simple si cette granularité n'existe pas encore.

------------------------------------------------------------------------

# 31. Row-level Access

Exemple :

``` text
Sales Agent
→ Orders assigned to current user
```

Les filtres de sécurité sont construits côté backend et ne sont pas
inventés par le frontend.

------------------------------------------------------------------------

# 32. Runtime Data Context

Contexte d'exécution :

``` text
Tenant
Application
Pack Version
Environment
User
Permissions
Data Source
```

Pack Runtime peut fournir une partie de ces informations.

------------------------------------------------------------------------

# 33. Repository Resolver

Pipeline :

``` text
Entity
  ↓
Data Contract
  ↓
Repository Resolver
  ↓
Provider
  ↓
Data Source
```

Exemple :

``` text
Product
  ↓
ProductRepository
  ↓
Prisma Provider
  ↓
PostgreSQL
```

------------------------------------------------------------------------

# 34. Provider Abstraction

Interfaces conceptuelles :

``` text
findMany()
findOne()
create()
update()
delete()
count()
aggregate()
transaction()
```

Chaque opération dépend des capacités réelles du provider.

------------------------------------------------------------------------

# 35. Prisma Provider

``` text
Data Runtime
     ↓
Prisma Provider
     ↓
Prisma Client
     ↓
PostgreSQL
```

Le frontend n'accède jamais directement à Prisma.

------------------------------------------------------------------------

# 36. ERP Provider

``` text
Data Runtime
     ↓
ERP Data Provider
     ↓
ERP Adapter
     ↓
Dolibarr
```

Data Runtime ne contourne pas ERP Adapter.

------------------------------------------------------------------------

# 37. External API Provider

``` text
Data Runtime
     ↓
Connector
     ↓
External API
```

Prévoir :

``` text
timeout
authentication
retry policy
rate limit awareness
error mapping
```

------------------------------------------------------------------------

# 38. Query Limits

Limiter :

``` text
max page size
max relation depth
max selected fields
max filters
max aggregation complexity
timeout
```

Les limites exactes doivent être configurables.

------------------------------------------------------------------------

# 39. Query Cost

Une estimation de coût peut être ajoutée ultérieurement :

``` text
LOW
MEDIUM
HIGH
```

Elle n'est pas obligatoire pour le MVP.

------------------------------------------------------------------------

# 40. Search

Prévoir la capacité :

``` text
SEARCH
```

Exemple :

``` text
Product
search = "ordinateur"
```

Le provider peut utiliser PostgreSQL ou un moteur spécialisé
ultérieurement.

------------------------------------------------------------------------

# 41. Cache

Caches potentiels :

``` text
Query Cache
Entity Cache
Metadata Cache
Repository Registry Cache
Data Contract Cache
```

Réutiliser l'infrastructure existante.

------------------------------------------------------------------------

# 42. Cache Key

La clé doit inclure le contexte nécessaire :

``` text
tenant
application
packVersion
entity
query
```

afin d'éviter les collisions inter-tenant.

------------------------------------------------------------------------

# 43. Cache Invalidation

Exemple :

``` text
UPDATE Product
```

peut invalider :

``` text
Product Query Cache
Product Detail Cache
Dependent Aggregations
```

selon l'architecture retenue.

------------------------------------------------------------------------

# 44. Data Events

Après mutation réussie :

``` text
ProductCreated
ProductUpdated
ProductDeleted
```

peuvent être émis.

Les Business Events restent définis par Business Manager.

Data Runtime les publie conformément au contrat.

------------------------------------------------------------------------

# 45. Automation Integration

``` text
Data Runtime
     ↓
Business Event
     ↓
Automation
```

Exemple :

``` text
OrderCreated
      ↓
Automation Workflow
```

------------------------------------------------------------------------

# 46. UI Builder Integration

UI Builder consomme :

``` text
Entities
Fields
Relations
Data Contracts
Query Capabilities
Mutation Capabilities
```

pour construire :

``` text
DataTable
Forms
Selectors
Detail Views
Dashboards
```

------------------------------------------------------------------------

# 47. Pack Manager Integration

Pack Manager peut inclure dans le Manifest :

``` text
Data Requirements
Data Contract Versions
Required Providers
Required Capabilities
```

Exemple conceptuel :

``` json
{
  "data": {
    "schemaVersion": "1.0",
    "providers": ["primary"],
    "capabilities": [
      "query",
      "mutation",
      "transaction"
    ]
  }
}
```

------------------------------------------------------------------------

# 48. Pack Runtime Integration

``` text
Pack Runtime
     ↓
Runtime Context
     ↓
Data Runtime
```

Pack Runtime fournit notamment :

``` text
tenant
application
packVersion
environment
capabilities
configuration
```

------------------------------------------------------------------------

# 49. Data Platform Registry

Le Registry expose :

``` text
Data Sources
Providers
Repositories
Contracts
Capabilities
Schema Versions
```

Exemple :

``` text
Product
Repository: prisma.product
Provider: PostgreSQL
READ ✓
CREATE ✓
UPDATE ✓
DELETE ✓
```

------------------------------------------------------------------------

# 50. Diagnostics

Cockpit :

``` text
Data Runtime

Sources               3 / 3 available
Repositories          24
Contracts             24
Queries               Healthy
Transactions          Healthy
Cache                 Ready

Errors                0
Warnings              1
```

Tous les états doivent provenir de contrôles réels.

------------------------------------------------------------------------

# 51. Data Source Diagnostics

Exemple :

``` text
Primary PostgreSQL
AVAILABLE

Latency
18 ms

Capabilities
READ
WRITE
TRANSACTION
```

ERP :

``` text
ERP Adapter
DEGRADED

Reason:
timeout rate elevated
```

------------------------------------------------------------------------

# 52. Query Diagnostics

Informations possibles :

``` text
traceId
tenant
entity
operation
provider
duration
rowCount
cacheHit
status
```

Ne jamais exposer de données sensibles.

------------------------------------------------------------------------

# 53. Error Model

Exemple :

``` json
{
  "code": "DATA_QUERY_FAILED",
  "message": "Unable to execute query",
  "traceId": "...",
  "context": {
    "entity": "product"
  }
}
```

------------------------------------------------------------------------

# 54. Codes d'erreur

``` text
DATA_SOURCE_UNAVAILABLE
DATA_CONTRACT_INVALID
DATA_ENTITY_UNKNOWN
DATA_FIELD_UNKNOWN
DATA_RELATION_UNKNOWN

DATA_QUERY_INVALID
DATA_QUERY_FORBIDDEN
DATA_QUERY_TIMEOUT
DATA_QUERY_FAILED

DATA_MUTATION_INVALID
DATA_MUTATION_FORBIDDEN
DATA_MUTATION_FAILED

DATA_TRANSACTION_FAILED

DATA_PROVIDER_UNAVAILABLE
DATA_CAPABILITY_UNSUPPORTED
```

------------------------------------------------------------------------

# 55. Observability

Inclure :

``` text
requestId
traceId
tenantId
userId
applicationId
packVersionId
entity
operation
provider
duration
status
```

------------------------------------------------------------------------

# 56. Metrics

Si l'infrastructure le permet :

``` text
data_queries_total
data_mutations_total
query_duration
mutation_duration
query_errors
mutation_errors
transaction_rollbacks
cache_hit_ratio
provider_errors
```

Réutiliser la plateforme d'observabilité existante.

------------------------------------------------------------------------

# 57. Audit

Auditer principalement :

``` text
CREATE
UPDATE
DELETE
sensitive operations
policy changes
data source changes
```

Les lectures ordinaires ne nécessitent pas forcément un audit
individuel.

------------------------------------------------------------------------

# 58. API

Préfixe conceptuel :

``` text
/api/data
```

Queries :

``` http
POST /query
```

Mutations :

``` http
POST /mutation
```

Des routes REST explicites ou générées peuvent être utilisées selon
l'architecture existante.

------------------------------------------------------------------------

# 59. Registry API

``` http
GET /registry/entities
GET /registry/entities/:key
GET /registry/providers
GET /registry/capabilities
```

Les endpoints sont sécurisés et tenant-aware lorsque nécessaire.

------------------------------------------------------------------------

# 60. Diagnostics API

``` http
GET /diagnostics
GET /sources
GET /repositories
```

Les détails sensibles nécessitent des permissions adaptées.

------------------------------------------------------------------------

# 61. Navigation Data Platform

Navigation proposée :

``` text
Données
├── Vue d'ensemble
├── Sources
├── Modèles & Contrats
├── Requêtes
├── Politiques
└── Diagnostics
```

Data Runtime n'a pas besoin d'un second menu séparé.

------------------------------------------------------------------------

# 62. Data Source Screen

``` text
Sources de données

Primary PostgreSQL     AVAILABLE
ERP / Dolibarr         AVAILABLE
External API           DEGRADED
```

Afficher :

``` text
Status
Provider
Capabilities
Environment
Last Check
Diagnostics
```

------------------------------------------------------------------------

# 63. Contracts Screen

``` text
Data Contracts

Product
Customer
Order
Invoice
Payment
```

Exemple :

``` text
Product

Source
Primary PostgreSQL

Operations
READ
CREATE
UPDATE
DELETE

Fields
12

Relations
3
```

------------------------------------------------------------------------

# 64. Query Explorer

Outil technique :

``` text
Entity: Product

Fields
☑ id
☑ name
☑ price

Filter
active = true

Sort
name ASC

Limit
25

[Run]
```

Il utilise le même Query Engine que Runtime.

------------------------------------------------------------------------

# 65. Query Explorer Security

Interdire :

``` text
raw SQL
arbitrary Prisma
arbitrary JavaScript
```

L'accès nécessite une permission appropriée.

------------------------------------------------------------------------

# 66. Data Policies UI

Exemple :

``` text
Product

READ
product.read

CREATE
product.create

UPDATE
product.update

DELETE
product.delete
```

Les permissions proviennent d'IAM.

------------------------------------------------------------------------

# 67. UI/UX

Design system Techzone Cloud :

``` text
light slate canvas
white surfaces
Techzone blue
thin borders
10–12 px radius
subtle shadows
professional density
consistent icons
```

Le module doit ressembler à un cockpit Data et non à un outil DBA
complexe.

------------------------------------------------------------------------

# 68. Règles de gestion

-   **RG-DATA-001** --- Toute opération est tenant-scoped.
-   **RG-DATA-002** --- Business Manager reste propriétaire du modèle
    métier.
-   **RG-DATA-003** --- Data Platform ne duplique pas les Entities.
-   **RG-DATA-004** --- Toute Query respecte un Data Contract.
-   **RG-DATA-005** --- Toute Mutation respecte un Data Contract.
-   **RG-DATA-006** --- Une opération non autorisée est rejetée côté
    backend.
-   **RG-DATA-007** --- Le frontend ne constitue jamais l'autorité
    tenant.
-   **RG-DATA-008** --- Aucun SQL arbitraire venant du frontend.
-   **RG-DATA-009** --- Aucun JavaScript arbitraire dans les queries.
-   **RG-DATA-010** --- Les relations utilisées doivent exister dans
    Business Manager.
-   **RG-DATA-011** --- Les champs utilisés doivent exister.
-   **RG-DATA-012** --- Les opérations respectent les capacités du
    Provider.
-   **RG-DATA-013** --- Les transactions utilisent les capacités réelles
    du Provider.
-   **RG-DATA-014** --- Aucune transaction ACID distribuée ne doit être
    simulée.
-   **RG-DATA-015** --- Les secrets ne sont jamais exposés au frontend.
-   **RG-DATA-016** --- Les clés cache doivent empêcher les collisions
    inter-tenant.
-   **RG-DATA-017** --- Les Business Events ne sont émis qu'après
    mutation réussie.
-   **RG-DATA-018** --- ERP passe par ERP Adapter.
-   **RG-DATA-019** --- Les queries complexes doivent être limitées.
-   **RG-DATA-020** --- Les erreurs doivent être structurées.
-   **RG-DATA-021** --- Les mutations significatives sont auditables.
-   **RG-DATA-022** --- UI Builder utilise Data Runtime plutôt qu'un
    moteur Data parallèle.
-   **RG-DATA-023** --- Automation utilise les contrats Data officiels.
-   **RG-DATA-024** --- Pack Runtime fournit le contexte publié.
-   **RG-DATA-025** --- Pack Manager déclare les Data Requirements
    nécessaires.
-   **RG-DATA-026** --- Une Capability non supportée est explicitement
    rejetée.
-   **RG-DATA-027** --- Les valeurs sensibles sont masquées dans
    diagnostics et logs.
-   **RG-DATA-028** --- Une définition DRAFT ne remplace pas
    silencieusement une définition publiée active.
-   **RG-DATA-029** --- Les Data Providers sont enregistrés dans un
    Registry contrôlé.
-   **RG-DATA-030** --- Aucun mock silencieux en mode REAL.

------------------------------------------------------------------------

# 69. Modèle conceptuel

Concepts possibles :

``` text
DataSource
DataProvider
DataContract
DataRepository
DataCapability
DataPolicy
DataQueryDefinition
DataMutationDefinition
DataRuntimeContext
DataDiagnostic
```

Ne pas créer automatiquement toutes ces tables.

Certaines structures peuvent rester :

``` text
configuration
registry
runtime structure
derived definition
```

L'audit Prisma précède toute migration.

------------------------------------------------------------------------

# 70. Tests unitaires

Tester :

``` text
Query Parser
Query Validator
Filter Validator
Sort Validator
Pagination
Relation Resolver
Repository Resolver
Capability Resolver
Mutation Validator
Transaction Manager
Policy Resolver
Cache Key Builder
```

------------------------------------------------------------------------

# 71. Tests d'intégration

``` text
Business Manager
      ↓
Data Platform
      ↓
Data Runtime
      ↓
PostgreSQL
```

Et :

``` text
UI Builder → Data Runtime
Automation → Data Runtime
Pack Runtime → Data Runtime
Data Runtime → ERP Adapter
```

------------------------------------------------------------------------

# 72. Tests sécurité

Tester :

``` text
Cross-tenant READ
Cross-tenant CREATE
Cross-tenant UPDATE
Cross-tenant DELETE

Unauthorized Entity Access
Unauthorized Field Access

Invalid Filter
Invalid Relation
Invalid Sort

Query Depth Attack
Huge Page Size

Raw SQL Injection
Provider Injection

Secret Leakage
```

------------------------------------------------------------------------

# 73. E2E de référence

``` text
LOGIN
 ↓
Business Manager
 ↓
Create / use Entity Product
 ↓
Fields / Relations
 ↓
Data Contract
 ↓
Pack Manager
 ↓
Publish
 ↓
Pack Runtime
 ↓
Runtime Context
 ↓
Data Runtime
 ↓
Repository Resolver
 ↓
Query Product
 ↓
Create Product
 ↓
Update Product
 ↓
Business Event
 ↓
Automation
 ↓
UI Refresh
```

------------------------------------------------------------------------

# 74. MVP recommandé

Ordre :

``` text
1. Audit Data existant
2. Gap Matrix
3. Data Source Registry
4. Data Contract
5. Repository Registry
6. Prisma Provider
7. Query Engine
8. Filtering
9. Sorting
10. Pagination
11. Relations
12. Mutation Engine
13. Validation
14. Tenant Isolation
15. Data Policies
16. Transaction Manager
17. Business Events
18. UI Builder Integration
19. Automation Integration
20. Pack Manager Integration
21. Pack Runtime Integration
22. ERP Adapter Integration
23. Cache
24. Diagnostics
25. Security Tests
26. E2E
```

------------------------------------------------------------------------

# 75. Gap Matrix obligatoire

  Fonction              Existant    Backend   Frontend   Tests   Décision
  --------------------- ----------- --------- ---------- ------- ----------
  Data Sources          À auditer   ---       ---        ---     AUDIT
  Data Contracts        À auditer   ---       ---        ---     AUDIT
  Repository Registry   À auditer   ---       ---        ---     AUDIT
  Prisma Provider       À auditer   ---       N/A        ---     AUDIT
  Query Engine          À auditer   ---       ---        ---     AUDIT
  Mutation Engine       À auditer   ---       ---        ---     AUDIT
  Transactions          À auditer   ---       N/A        ---     AUDIT
  Data Policies         À auditer   ---       ---        ---     AUDIT
  Cache                 À auditer   ---       ---        ---     AUDIT
  Diagnostics           À auditer   ---       ---        ---     AUDIT
  ERP Provider          À auditer   ---       ---        ---     AUDIT

Ne jamais conclure `MISSING` avant recherche réelle dans le dépôt.

------------------------------------------------------------------------

# 76. Instructions Codex / Freebuff / IA

Avant de coder :

``` text
1. Considérer main comme canonique.

2. Lire tous les CDC Data existants.

3. Rechercher Data Platform / Data Runtime.

4. Rechercher Prisma Services.

5. Rechercher Repositories.

6. Rechercher Query Builders.

7. Rechercher Filtering / Sorting / Pagination.

8. Rechercher Transaction Services.

9. Rechercher Cache.

10. Rechercher Business Events.

11. Examiner Business Manager.

12. Examiner UI Builder.

13. Examiner Automation.

14. Examiner Pack Manager.

15. Examiner Pack Runtime.

16. Examiner ERP Adapter.

17. Examiner IAM.

18. Examiner Tenant Context.

19. Examiner schema.prisma.

20. Examiner les tests.

21. Produire la Gap Matrix.

22. Seulement ensuite coder.
```

------------------------------------------------------------------------

# 77. Intégration du code historique

Ne jamais faire de merge aveugle.

Pipeline :

``` text
READ
  ↓
UNDERSTAND
  ↓
COMPARE
  ↓
EXTRACT
  ↓
ADAPT
  ↓
TEST
```

Ne pas importer aveuglément :

``` text
ancien IAM
ancien Tenant Context
ancien Prisma Schema
anciens Guards
ancien Cache
ancien Query Engine
ancienne navigation
```

------------------------------------------------------------------------

# 78. Définition de DONE

Data Platform / Data Runtime v2 est DONE lorsque :

``` text
✓ Data Source Registry réel
✓ Data Contracts réels
✓ Repository Registry fonctionnel

✓ Prisma Provider fonctionnel
✓ ERP Provider via ERP Adapter si requis

✓ Query Engine fonctionnel
✓ Filtering fonctionnel
✓ Sorting fonctionnel
✓ Pagination fonctionnelle
✓ Relations fonctionnelles
✓ Aggregation MVP fonctionnelle si retenue

✓ Mutation Engine fonctionnel

✓ Validation fonctionnelle
✓ Transactions fonctionnelles

✓ Tenant Isolation vérifiée
✓ Data Policies fonctionnelles
✓ IAM intégré

✓ Business Events intégrés

✓ UI Builder intégré
✓ Automation intégré
✓ Pack Manager intégré
✓ Pack Runtime intégré

✓ Cache tenant-safe
✓ Diagnostics réels
✓ Audit fonctionnel

✓ Aucun raw SQL frontend
✓ Aucun secret exposé
✓ Aucun mock silencieux en REAL mode

✓ Prisma validate PASS
✓ Prisma generate PASS
✓ Backend build PASS
✓ Frontend build PASS

✓ Tests Data PASS
✓ Tests Tenant PASS
✓ Tests Security PASS
✓ E2E PASS
```

------------------------------------------------------------------------

# 79. Architecture cible consolidée

``` text
             BUSINESS MANAGER
             Modèle métier
                  │
          ┌───────┼────────┐
          ▼       ▼        ▼
     UI BUILDER  DATA   AUTOMATION
                  │
                  ▼
            DATA RUNTIME
                  │
          ┌───────┼─────────┐
          ▼       ▼         ▼
     PostgreSQL  ERP    Connectors

BUSINESS + UI + AUTOMATION + DATA
                  │
                  ▼
            PACK MANAGER
                  │
                  ▼
             PACK RUNTIME
                  │
                  ▼
         APPLICATION ACTIVE
```

Data Platform et Data Runtime restent dans un même domaine cohérent :

``` text
DATA PLATFORM
→ définit les contrats, sources, repositories, policies et capacités

DATA RUNTIME
→ résout et exécute les requêtes, mutations, transactions et accès réels
```

Cela évite la duplication entre Business Manager, UI Builder, Automation
et Pack Runtime.

------------------------------------------------------------------------

# FIN DU CAHIER DES CHARGES

**Techzone Cloud --- Data Platform / Data Runtime v2.0**\
**Consolidation et extension de l'existant**
