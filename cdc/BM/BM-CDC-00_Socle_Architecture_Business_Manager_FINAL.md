# BM-CDC-00 — Socle & Architecture Business Manager

## 1. Identification

**Projet :** Techzone Cloud  
**Module :** Business Manager  
**Référence :** `BM-CDC-00`  
**Nom :** Socle, Architecture & Contrats communs  
**Priorité :** 🔴 P0 — bloquant  
**Type :** Transversal  
**Position :**

```text
BM-CDC-00
   ↓
BM-P0.1 Application / Version Manager
   ↓
BM-P0.2 Data Model Manager
   ↓
BM-P0.3 Feature & Capability Manager
   ↓
BM-P0.4 Menu Engine
   ↓
BM-P0.x suivants
```

---

## 2. Finalité

BM-CDC-00 ne doit développer **aucune fonctionnalité métier spécifique** comme les Features, Menus ou Pages.

Il doit construire le **socle commun** permettant à tous les moteurs Business Manager de fonctionner de manière homogène :

```text
BUSINESS MANAGER
        │
        ▼
     BM-CDC-00
        │
 ┌──────┼────────────┐
 ▼      ▼            ▼
UI    BACKEND      CONTRACTS
 │      │            │
 └──────┼────────────┘
        ▼
COMMON PLATFORM BEHAVIOUR
        │
        ├─ Validation
        ├─ Errors
        ├─ Versioning
        ├─ IAM Context
        ├─ Audit
        ├─ Activity Events
        ├─ Transactions
        ├─ Snapshots
        └─ Tests
```

---

## 3. Objectif général

BM-CDC-00 doit répondre à :

> **Quelles règles, contrats, services et conventions tous les moteurs du Business Manager doivent-ils respecter pour rester cohérents, sécurisés, versionnés, testables et intégrables ?**

Le Business Manager est conçu comme un ensemble de moteurs : Application Manager, Data Model Manager, Feature/Capability Manager, Menu Engine, Page Builder, Form Engine, Rule Engine, Workflow Engine, etc.

Chaque moteur doit disposer de :

```text
Fonctions
Configurations
Validations
Écrans Frontend
Services Backend
API
Tests
Documentation
```

---

## 4. Périmètre BM-CDC-00

Le socle doit couvrir au minimum :

```text
01. Architecture commune
02. Module boundaries
03. Frontend shell
04. Backend foundation
05. API contracts
06. Error contract
07. Validation contract
08. IAM / Context integration
09. Multi-tenant isolation
10. ActivityEvent
11. Audit
12. Versioning
13. Published-version protection
14. Optimistic locking
15. Transactions
16. Snapshot contract
17. Snapshot hash
18. Search / filters / pagination
19. Health / readiness
20. Logging / traceId
21. Common UI states
22. Import / export conventions
23. Testing foundation
24. Seed / demo conventions
25. Documentation conventions
```

---

## 5. Architecture fonctionnelle cible

```text
BUSINESS MANAGER CORE
│
├── Shared Frontend
│   ├── App Shell
│   ├── Navigation
│   ├── Layout
│   ├── Shared Components
│   ├── Forms
│   ├── Tables
│   ├── Filters
│   ├── Modals
│   ├── Drawers
│   ├── Error States
│   └── API Client
│
├── Shared Backend
│   ├── Application Context
│   ├── Validation
│   ├── Error Handling
│   ├── Transactions
│   ├── Activity Events
│   ├── Audit
│   ├── Snapshot
│   ├── Version Guard
│   ├── Search/Pagination
│   └── Health
│
└── Business Engines
    ├── P0.1 Application / Version
    ├── P0.2 Data Model
    ├── P0.3 Feature / Capability
    ├── P0.4 Menu Engine
    └── ...
```

---

## 6. Principe de séparation

BM-CDC-00 doit imposer :

```text
Shared
≠
Business-specific
```

### Shared

```text
Pagination
Validation Result
Error Response
ActivityEvent
Version Guard
Snapshot
Audit
IAM Context
```

### Spécifique

```text
Feature
Capability
Menu
Entity
Field
Page
Workflow
```

Ainsi, chaque P0.x réutilise le socle au lieu de réimplémenter les mêmes comportements.

---

## 7. Contrat ApplicationVersion commun

La plupart des moteurs Business Manager travaillent sur une `ApplicationVersion`.

Le socle doit donc exposer un contrat commun :

```text
BusinessApplicationContext
│
├── applicationId
├── applicationVersionId
├── versionStatus
├── tenantId
├── environmentId
├── actorId
├── traceId
└── editable
```

---

## 8. Version Guard

Créer un service/guard commun :

```text
VersionEditabilityGuard
```

Responsabilité :

```text
ApplicationVersion
        ↓
Status ?
        │
 ┌──────┴───────┐
 ▼              ▼
EDITABLE      PUBLISHED
 │              │
ALLOW           DENY
                │
                ▼
VERSION_NOT_EDITABLE
```

---

## 9. États de version

Le socle doit permettre aux moteurs P0.x d’interroger au minimum :

```text
DRAFT
CONFIGURING
VALIDATING
READY
PUBLISHED
DEPRECATED
ARCHIVED
```

Les statuts finaux exacts restent définis dans P0.1, mais BM-CDC-00 doit fournir le mécanisme commun de contrôle.

---

## 10. Error Contract commun

Tous les moteurs doivent utiliser une enveloppe d’erreur identique.

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "BUSINESS_VALIDATION_FAILED",
    "message": "Validation failed",
    "details": []
  }
}
```

BM-CDC-00 doit définir :

```text
BusinessError
│
├── code
├── message
├── details
├── fieldErrors[]
├── traceId
└── timestamp
```

---

## 11. Success Contract

Format commun :

```json
{
  "success": true,
  "data": {},
  "error": null,
  "meta": {}
}
```

---

## 12. Codes d’erreur communs

BM-CDC-00 doit réserver au minimum :

```text
BUSINESS_VALIDATION_FAILED
BUSINESS_NOT_FOUND
BUSINESS_PERMISSION_DENIED

APPLICATION_NOT_FOUND
VERSION_NOT_FOUND
VERSION_NOT_EDITABLE
VERSION_CONFLICT

INVALID_ARGUMENT
INVALID_STATE
DEPENDENCY_MISSING

TRANSACTION_FAILED
SNAPSHOT_FAILED

CONTEXT_INVALID
TENANT_MISMATCH
```

Les moteurs P0.x ajoutent ensuite leurs codes spécialisés.

---

## 13. Validation Contract

Créer une structure commune :

```text
ValidationResult
│
├── valid
├── errors
├── warnings
├── infos
├── completeness
├── issues[]
└── traceId
```

Chaque issue :

```text
ValidationIssue
│
├── severity
├── code
├── targetType
├── targetId
├── field
├── message
└── metadata
```

---

## 14. Validation Severity

Standard :

```text
ERROR
WARNING
INFO
```

Règle :

```text
ERROR
→ bloque publication / validation finale

WARNING
→ autorise éventuellement mais doit être visible

INFO
→ informatif
```

---

## 15. IAM / Context Integration

Toutes les mutations doivent récupérer l’acteur depuis le contexte IAM authentifié, et non depuis un `userId` envoyé librement par le frontend.

Contrat attendu :

```text
BusinessRequestContext
│
├── actorId
├── identityId
├── tenantId
├── applicationId
├── applicationVersionId
├── environmentId
├── permissions[]
├── contextId
└── traceId
```

---

## 16. No Trust on Client

Interdire :

```text
frontend actorId → trusted
frontend tenantId → trusted
frontend permission → trusted
```

Le backend doit revalider :

```text
Actor
Tenant
Application
ApplicationVersion
Permission
Context
```

---

## 17. Multi-Tenant Isolation

Toute ressource Business Manager doit être reliée directement ou indirectement à un tenant/application autorisé.

```text
Tenant A
   │
   └── Application A
         └── Version A1
               └── resources

Tenant B
   │
   └── Application B
         └── Version B1
               └── resources
```

Une requête Tenant A ne doit jamais retourner les ressources Tenant B.

---

## 18. ActivityEvent commun

BM-CDC-00 doit fournir ce modèle une seule fois pour tous les P0.x.

```text
ActivityEvent
│
├── applicationId
├── actorId
├── eventType
├── action
├── targetType
├── targetId
├── result
├── before
├── after
├── metadata
├── traceId
└── createdAt
```

---

## 19. Event Naming Convention

Convention :

```text
<domain>.<resource>.<action>
```

Exemples :

```text
application.created
version.published

feature.created
feature.updated

menu.created
menu_item.moved

validation.completed
snapshot.generated
```

---

## 20. Audit

Différence :

```text
ActivityEvent
→ activité fonctionnelle

Audit
→ traçabilité sécurité / administration
```

Audit commun :

```text
AuditEntry
│
├── auditId
├── actorId
├── tenantId
├── applicationId
├── action
├── targetType
├── targetId
├── result
├── before
├── after
├── reason
├── traceId
└── createdAt
```

---

## 21. Optimistic Locking

Toutes les ressources fortement modifiables doivent pouvoir posséder :

```text
version Int
```

Exemple :

```text
Client version = 5
DB version     = 6

PATCH
↓
409 VERSION_CONFLICT
```

---

## 22. Transactions

Toutes les opérations multi-écriture doivent être transactionnelles.

```text
BEGIN
  ↓
Validate
  ↓
Write A
  ↓
Write B
  ↓
ActivityEvent
  ↓
COMMIT
```

En cas d’échec :

```text
ROLLBACK
```

---

## 23. Snapshot Contract

Créer un service transversal :

```text
SnapshotService
```

Contrat :

```text
BusinessSnapshot
│
├── snapshotId
├── applicationId
├── applicationVersionId
├── domain
├── schemaVersion
├── payload
├── snapshotHash
├── generatedAt
└── generatedBy
```

---

## 24. Snapshot Hash

Objectif :

```text
same logical configuration
→ same logical hash
```

Permet :

```text
compare
detect change
publication validation
cache
rollback analysis
```

---

## 25. Snapshot global ApplicationVersion

BM-CDC-00 doit permettre :

```text
ApplicationVersionSnapshot
│
├── P0.1 Application
├── P0.2 Data Model
├── P0.3 Features / Capabilities
├── P0.4 Navigation
└── P0.x ...
```

Chaque moteur fournit son fragment.

---

## 26. Search Contract

Toutes les listes doivent accepter une convention homogène :

```text
search
page
limit
sort
direction
```

plus les filtres propres au domaine.

---

## 27. Pagination Contract

Réponse :

```text
meta:
  page
  limit
  total
  totalPages
```

---

## 28. Filter Contract

Le socle doit définir la manière standard d’envoyer :

```text
status
sourceType
applicationVersionId
createdBy
createdFrom
createdTo
```

Les P0.x peuvent enrichir.

---

## 29. Frontend Shell

BM-CDC-00 doit fournir le shell général :

```text
BUSINESS MANAGER
├── Sidebar
├── Header
├── Application Selector
├── Version Selector
├── Environment
├── Breadcrumb
└── Workspace
```

---

## 30. Frontend Common Components

Minimum :

```text
DataTable
SearchInput
FilterBar
StatusBadge
EmptyState
ErrorState
LoadingState

Modal
Drawer
ConfirmDialog

FormField
Select
MultiSelect
Tags
Tabs

ImpactDialog
ValidationPanel
HistoryTimeline
```

---

## 31. États UI obligatoires

Chaque écran doit gérer :

```text
LOADING
EMPTY
ERROR
READY
READ_ONLY
NO_PERMISSION
STALE
CONFLICT
```

---

## 32. Published Version UI

Lorsque la version est publiée :

```text
Frontend
→ READ ONLY

Backend
→ mutation denied
```

Le frontend ne doit pas seulement masquer les boutons ; le backend reste autoritaire.

---

## 33. API Client commun

Le frontend architecture doit fournir un client commun capable de gérer :

```text
GET
POST
PATCH
DELETE

success envelope
error envelope
401
403
404
409
422
500

traceId
pagination
retry controlled
```

---

## 34. API Namespace

Recommandation :

```text
/api/business-manager/...
```

ou convention équivalente déjà utilisée par l’application.

Le point essentiel est que tous les modules suivent la même structure.

---

## 35. Backend Services communs

BM-CDC-00 doit préparer :

```text
BusinessContextService
VersionGuardService
ValidationResultBuilder
ActivityEventService
AuditService
SnapshotService
TransactionHelper
PaginationService
SearchService
HealthService
```

---

## 36. Dependency Contract

Tous les modules doivent déclarer explicitement :

```text
Prerequisites
Dependencies
Consumers
```

Exemple :

```text
P0.4
requires
P0.1
P0.3

and indirectly
P0.2
```

---

## 37. No Duplicate Engines

Règle importante :

```text
P0.x
ne recrée jamais
un moteur déjà fourni ailleurs.
```

Exemple : P0.4 consomme Features/Capabilities de P0.3 et ne recrée pas son propre système de Capabilities.

---

## 38. Contract Registry

Prévoir un registre documentaire :

```text
BusinessContractRegistry
```

Exemples :

```text
ApplicationContract
ApplicationVersionContract
DataModelContract
FeatureContract
CapabilityContract
NavigationContract
ValidationContract
SnapshotContract
ActivityEventContract
```

---

## 39. Schema Version

Chaque contrat sérialisable important doit pouvoir porter :

```text
schemaVersion
```

pour permettre l’évolution sans casser les consommateurs.

---

## 40. Backward Compatibility

Une évolution non breaking :

```text
v1 → v1.1
```

peut rester compatible.

Breaking change :

```text
requires schema version change
+
migration / adapter
```

---

## 41. Health

Endpoint commun recommandé :

```text
GET /business-manager/health
```

Doit vérifier :

```text
DB
Core services
Activity Event
Snapshot
IAM Context integration
```

---

## 42. Readiness

Différent de Health :

```text
Health
= le moteur tourne

Readiness
= le Business Manager est correctement configuré
```

---

## 43. Logging

Chaque requête importante doit transporter :

```text
traceId
```

et les logs doivent pouvoir corréler :

```text
request
service
DB
event
audit
error
```

---

## 44. Données interdites dans les logs

Ne jamais écrire :

```text
password
token
secret
credential
private key
sensitive IAM data
```

---

## 45. Import / Export Convention

Prévoir une structure commune pour les moteurs compatibles :

```text
export:
  schemaVersion
  domain
  applicationVersion
  generatedAt
  data
```

---

## 46. Preview Contract

Tous les futurs builders pouvant fournir une preview doivent utiliser un contrat commun :

```text
PreviewResult
│
├── valid
├── rendered
├── warnings[]
├── errors[]
├── snapshotHash
└── traceId
```

---

## 47. Tests transversaux

BM-CDC-00 doit fournir une base de tests pour :

```text
Error contract
Version guard
Optimistic locking
Transactions
ActivityEvent
Audit
IAM context
Tenant isolation
Snapshot determinism
Pagination
Search
Read-only version
Permission denied
```

---

## 48. Test universel Business Manager

Le socle doit permettre de créer au moins deux applications métier très différentes avec le même Core sans le modifier.

```text
Application A
Boutique

Application B
Gestion d'inscriptions

Core Business Manager
UNCHANGED
```

---

## 49. Seed minimal

BM-CDC-00 doit préparer :

```text
Demo Tenant
Demo Application
Demo ApplicationVersion
Demo Actor
```

Les P0.x complètent ensuite avec leurs données spécifiques.

---

## 50. Documentation obligatoire

Chaque module doit documenter :

```text
Purpose
Dependencies
Data model
Services
APIs
Errors
Events
Permissions
Tests
Definition of Done
```

---

## 51. Répartition Team 3 — BM-CDC-00

### Avotra — Frontend fonctionnel

```text
App shell functional screens
List / Detail patterns
Common CRUD forms
Loading / Empty / Error
Validation display
Impact dialog
History display
API integration
Responsive behaviour
```

### Belardo — Frontend Architecture

```text
Frontend architecture
Routing
Layout
Shared component library
Design system
API client
State management
Error handling
Version read-only handling
Frontend test foundation
```

### Ranja — Backend

```text
Backend architecture
Shared contracts
Context service
Version guard
Validation foundation
Error contract
Transaction foundation
ActivityEvent
Audit
Snapshot
Optimistic locking
Pagination / search
Health
Backend tests
```

---

## 52. Responsabilités communes

Les trois doivent valider ensemble :

```text
Frontend ↔ API contract
Error formats
Validation format
Published-version behaviour
Traceability
Integration tests
Documentation
```

---

## 53. Livrables BM-CDC-00

```text
✓ Architecture Frontend
✓ Architecture Backend
✓ Shared Contracts
✓ App Shell
✓ Shared UI Components
✓ API Client
✓ Error Contract
✓ Success Contract
✓ Validation Contract
✓ IAM Context integration
✓ Tenant isolation foundation
✓ Version Guard
✓ Optimistic Locking
✓ Transaction foundation
✓ ActivityEvent
✓ Audit
✓ Snapshot
✓ Snapshot Hash
✓ Pagination
✓ Search
✓ Health
✓ Readiness
✓ Logging / traceId
✓ Testing foundation
✓ Documentation
```

---

## 54. Critères d’acceptation

BM-CDC-00 est acceptable lorsque :

```text
✓ Un nouveau P0.x peut être ajouté sans recréer le socle
✓ Toutes les APIs utilisent le même format de réponse
✓ Toutes les erreurs utilisent un code normalisé
✓ L'acteur vient du contexte IAM
✓ Tenant isolation est appliquée
✓ Une version PUBLISHED ne peut pas être modifiée
✓ 409 VERSION_CONFLICT fonctionne
✓ Les opérations multi-écriture peuvent être transactionnelles
✓ ActivityEvent est disponible
✓ Audit est disponible
✓ Snapshot peut être généré
✓ SnapshotHash est déterministe
✓ Pagination et recherche sont réutilisables
✓ Loading / Empty / Error sont standardisés
✓ Frontend et Backend partagent les mêmes contrats
✓ Les tests transversaux passent
```

---

## 55. Definition of Done — BM-CDC-00

```text
BM-CDC-00 DONE

Architecture             ✓
Frontend Shell           ✓
Shared Components        ✓
Backend Foundation       ✓
API Contract             ✓
Error Contract           ✓
Validation Contract      ✓
IAM Context              ✓
Tenant Isolation         ✓
Version Guard            ✓
Optimistic Locking       ✓
Transactions             ✓
ActivityEvent            ✓
Audit                    ✓
Snapshot                 ✓
Snapshot Hash            ✓
Pagination               ✓
Search                   ✓
Health                   ✓
Readiness                ✓
Logging / Trace          ✓
Frontend Tests           ✓
Backend Tests            ✓
Integration Tests        ✓
Documentation            ✓

STATUS
READY FOR BM-P0.1+
```

---

## 56. Architecture finale

```text
                         BM-CDC-00
                    SOCLE BUSINESS MANAGER
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
    FRONTEND                BACKEND              CONTRACTS
        │                     │                     │
 App Shell              Context Service       Error Contract
 Components             Version Guard         Validation Contract
 API Client             Transactions          Snapshot Contract
 UI States              ActivityEvent         Event Contract
 Routing                 Audit                 API Contract
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              ▼
                     COMMON BUSINESS CORE
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
       BM-P0.1             BM-P0.2             BM-P0.3
   App / Version          Data Model       Feature/Capability
                                                  │
                                                  ▼
                                               BM-P0.4
                                             Menu Engine
                                                  │
                                                  ▼
                                              BM-P0.x
```

---

## 57. Principe final

**BM-CDC-00 ne doit pas devenir un nouveau gros module métier.**

Sa fonction est de faire en sorte que tous les `BM-P0.x` partagent :

```text
Architecture
Sécurité
Versioning
Contrats
Validation
Événements
Erreurs
Transactions
Snapshots
Tests
Documentation
```

Le résultat attendu est un **socle Business Manager stable, générique, réutilisable et extensible**, prêt à accueillir les moteurs fonctionnels successifs sans duplication ni réécriture des fondations communes.
