# CAHIER DES CHARGES COMPLET ET DÉTAILLÉ — BUSINESS MANAGER

## BM-CDC-04 — Feature & Capability Manager

### Gestion des fonctionnalités, capacités, dépendances et activation par version

**Projet :** Techzone Cloud — Business Manager  
**Référence :** `BM-CDC-04`  
**Priorité :** 🔴 P0 — Core indispensable  
**Prérequis :** `BM-CDC-00 — Socle, Architecture & Contrats communs`, `BM-CDC-01 — Application Manager`, `BM-CDC-02 — Version & Lifecycle Manager`, `BM-CDC-03 — Data Model Manager`  
**Type de livrable :** Backend + Base de données + Frontend + Validation + Tests + Documentation  
**Objectif principal :** définir précisément ce qu’une version d’application sait faire  
**Consommateurs principaux :** `BM-CDC-05 — Menu Engine & Navigation Manager`, futurs Page/Form/Rule/Workflow/Automation Engines, Pack Runtime et Application Runtime  
**Statut :** Spécification fonctionnelle de référence

> **Nomenclature officielle :** ce CDC reprend le périmètre fonctionnel validé de l'ancien `BM-P0.3 — Feature & Capability Manager`, désormais reclassé en **BM-CDC-04**.  
> `BM-CDC-01` fournit l'Application, `BM-CDC-02` son ApplicationVersion et son cycle de vie, et `BM-CDC-03` son Data Model. BM-CDC-04 construit ensuite le **contrat fonctionnel versionné** de cette ApplicationVersion.

---

# 1. Contexte

Le Business Manager doit permettre de construire progressivement le contenu fonctionnel d’une application.

BM-CDC-01 / BM-CDC-02 gère principalement :

```text
APPLICATION
   ↓
APPLICATION VERSION
   ↓
VALIDATION
   ↓
PUBLICATION
```

BM-CDC-03 définit :

```text
DATA MODEL
   ↓
ENTITIES
   ↓
FIELDS
   ↓
RELATIONS
   ↓
CONSTRAINTS
```

BM-CDC-04 répond à la question :

> **Quelles fonctionnalités cette version de l’application possède-t-elle et quelles actions sait-elle réellement réaliser ?**

Exemple :

```text
Application : Boutique Mode & Chaussures
Version     : 1.1.0
```

Le Data Model peut contenir :

```text
Product
ProductVariant
Customer
Sale
SaleItem
Payment
StockMovement
```

BM-CDC-04 permet de déclarer :

```text
SALE
├── sale.read
├── sale.create
├── sale.discount
├── sale.credit
├── sale.cancel
├── sale.return
└── sale.refund
```

---

# 2. Objectif général

Le Feature & Capability Manager doit devenir le **contrat fonctionnel versionné d’une ApplicationVersion**.

```text
ApplicationVersion
       ↓
Features
       ↓
Capabilities
       ↓
Dependencies
       ↓
Data Requirements
       ↓
Version Configuration
       ↓
Validation
       ↓
Snapshot
```

À la fin de BM-CDC-04, Business Manager doit savoir exactement :

- quelles Features existent ;
- quelles Capabilities appartiennent à chaque Feature ;
- lesquelles sont disponibles globalement ;
- lesquelles sont activées dans une version précise ;
- quelles dépendances doivent être satisfaites ;
- quelles entités BM-CDC-03 sont requises ;
- quelles configurations sont valides ou invalides ;
- quelles modifications produiraient un impact fonctionnel.

---

# 3. Concepts principaux

## 3.1 Feature

Une Feature représente un **domaine fonctionnel principal**.

```text
PRODUCT
STOCK
SALE
CUSTOMER
PURCHASE
CASH
INVENTORY
RETURN
PROMOTION
REPORT
```

Une Feature n’est pas :

```text
Menu
Page
Permission IAM
Route
Formulaire
```

## 3.2 Capability

Une Capability représente une **action précise que l’application sait effectuer**.

```text
Feature SALE
│
├── sale.read
├── sale.create
├── sale.update
├── sale.discount
├── sale.credit
├── sale.cancel
├── sale.return
└── sale.refund
```

---

# 4. Exemple fonctionnel complet

```text
PRODUCT
├── product.read
├── product.create
├── product.update
├── product.archive
├── product.variant.read
└── product.variant.manage

STOCK
├── stock.read
├── stock.receive
├── stock.adjust
├── stock.inventory
└── stock.history

SALE
├── sale.read
├── sale.create
├── sale.discount
├── sale.credit
├── sale.cancel
├── sale.return
└── sale.refund

CUSTOMER
├── customer.read
├── customer.create
├── customer.update
├── customer.credit
└── customer.reservation

PURCHASE
├── purchase.read
├── purchase.create
├── purchase.receive
└── purchase.payment

CASH
├── cash.read
├── cash.open
├── cash.close
├── cash.expense
└── cash.adjust
```

---

# 5. Périmètre fonctionnel

BM-CDC-04 doit inclure :

1. Vue générale ;
2. Feature Catalog ;
3. Capability Catalog ;
4. Feature ↔ Capability Mapping ;
5. Capability Groups ;
6. Activation par version ;
7. Required / Optional Capabilities ;
8. Dependencies ;
9. Data Model Requirements ;
10. Impact Analysis ;
11. Feature / Capability Source ;
12. Tags ;
13. Completeness Score ;
14. Breaking Change indicator ;
15. Validation Engine ;
16. Snapshot ;
17. Activity / History ;
18. Search / filters / pagination ;
19. Protection des versions publiées ;
20. Optimistic locking.

---

# 6. Architecture fonctionnelle

```text
FEATURE & CAPABILITY MANAGER
│
├── Overview
├── Features
│   ├── Catalog
│   ├── Groups
│   ├── Versions
│   └── History
├── Capabilities
│   ├── Catalog
│   ├── Groups
│   ├── Dependencies
│   ├── Requirements
│   └── History
├── Version Configuration
│   ├── Version Features
│   └── Version Capabilities
├── Impact Analysis
├── Validation
├── Snapshot
└── History
```

---

# 7. Feature Catalog

Actions :

```text
Create
Read
Update
Search
Filter
Sort
Deprecate
Archive
View Capabilities
View Usage
View Versions
View History
```

Champs principaux :

```text
id
code
name
description
category
icon
status
sourceType
sortOrder
createdBy
createdAt
updatedAt
archivedAt
version
```

---

# 8. Statuts Feature

```text
DRAFT
ACTIVE
DEPRECATED
ARCHIVED
```

Une Feature utilisée par une version publiée ne doit pas être supprimée physiquement.

---

# 9. Source d’une Feature

```text
SYSTEM
PACK
CUSTOM
GENERATED
```

---

# 10. Capability Catalog

Champs principaux :

```text
id
code
name
description
category
group
type
riskLevel
status
sourceType
breakingChange
createdBy
createdAt
updatedAt
archivedAt
version
```

Actions :

```text
Create
Read
Update
Search
Filter
Deprecate
Archive
View Features
View Dependencies
View Requirements
View Usage
View Impact
View History
```

---

# 11. Convention de nommage

Convention obligatoire :

```text
domain.action
```

Exemples :

```text
product.read
product.create
product.update
sale.read
sale.create
sale.cancel
stock.read
stock.adjust
report.read
report.export
```

Le code doit être unique et stable.

---

# 12. Types de Capability

```text
READ
CREATE
UPDATE
DELETE
ACTION
EXECUTE
IMPORT
EXPORT
APPROVE
ADMIN
```

---

# 13. Niveau de risque

```text
LOW
MEDIUM
HIGH
CRITICAL
```

Le niveau de risque doit être exploitable par l’Impact Analysis et les futurs moteurs.

---

# 14. Source d’une Capability

```text
SYSTEM
PACK
CUSTOM
GENERATED
```

---

# 15. Groupes de Capabilities

Exemple :

```text
SALE
├── Lecture
│   ├── sale.read
│   └── sale.history
├── Opérations
│   ├── sale.create
│   ├── sale.update
│   └── sale.cancel
├── Paiement
│   ├── sale.credit
│   └── sale.refund
└── Remise
    └── sale.discount
```

Les groupes facilitent l’organisation et l’UX, sans remplacer la Feature.

---

# 16. Feature ↔ Capability

Relation N:N :

```text
Feature
   │
   └── FeatureCapability
            │
            └── Capability
```

Champs :

```text
id
featureId
capabilityId
required
sortOrder
createdAt
```

Contrainte :

```text
UNIQUE(featureId, capabilityId)
```

---

# 17. Required vs Optional

```text
SALE

sale.read      REQUIRED
sale.create    REQUIRED
sale.refund    OPTIONAL
```

Si une Capability requise est désactivée :

```text
ERROR
REQUIRED_CAPABILITY_DISABLED
```

---

# 18. Catalogue global vs configuration par version

```text
Capability.status
→ état global dans le catalogue

VersionCapability.enabled
→ état dans une ApplicationVersion précise
```

Ces deux notions ne doivent jamais être confondues.

---

# 19. Version Feature

Champs :

```text
id
applicationVersionId
featureId
state
configuration
createdBy
createdAt
updatedAt
version
```

Contrainte :

```text
UNIQUE(applicationVersionId, featureId)
```

---

# 20. État d’une Feature dans une version

```text
ENABLED
DISABLED
EXPERIMENTAL
```

---

# 21. Version Capability

Champs :

```text
id
applicationVersionId
capabilityId
enabled
configuration
createdBy
createdAt
updatedAt
version
```

Contrainte :

```text
UNIQUE(applicationVersionId, capabilityId)
```

---

# 22. Configuration spécifique

`VersionFeature.configuration` et `VersionCapability.configuration` peuvent utiliser du JSON.

Le contenu doit être limité aux paramètres déclarés et validés de la Feature/Capability.

Aucun code arbitraire n’est autorisé.

---

# 23. Capability Dependencies

Exemple :

```text
sale.refund
├── REQUIRES sale.read
├── REQUIRES payment.refund
└── REQUIRES stock.return
```

Table :

```text
capability_dependencies
```

Champs recommandés :

```text
id
capabilityId
dependencyCapabilityId
dependencyType
createdBy
createdAt
```

---

# 24. Types de dépendance

```text
REQUIRES
CONFLICTS_WITH
IMPLIES
```

---

# 25. Dépendance sur soi-même

Interdite :

```text
A REQUIRES A
```

Erreur :

```text
DEPENDENCY_SELF_REFERENCE
```

---

# 26. Cycles

Le backend doit détecter :

```text
A REQUIRES B
B REQUIRES C
C REQUIRES A
```

Erreur :

```text
DEPENDENCY_CYCLE
```

---

# 27. Conflits

Exemple :

```text
Capability A
CONFLICTS_WITH
Capability B
```

Si A et B sont simultanément activées :

```text
DEPENDENCY_CONFLICT
```

La configuration de version est invalide.

---

# 28. IMPLIES

Exemple :

```text
sale.refund
IMPLIES
sale.read
```

Le système peut proposer l’activation de la Capability impliquée.

Le comportement automatique doit rester contrôlé et explicite.

---

# 29. Capability Entity Requirements

Une Capability peut exiger des objets définis dans BM-CDC-03.

Table :

```text
capability_entity_requirements
```

Champs :

```text
id
capabilityId
dataEntityId
requirementType
createdAt
```

---

# 30. Validation BM-CDC-03 → BM-CDC-04

Si :

```text
sale.create
REQUIRES ENTITY SaleItem
```

et que `SaleItem` n’existe pas dans le Data Model de l’ApplicationVersion :

```text
ERROR
REQUIRED_ENTITY_MISSING
```

BM-CDC-04 doit consommer les IDs stables de BM-CDC-03.

---

# 31. Impact Analysis

Avant de désactiver, déprécier ou archiver une Feature/Capability, le système doit analyser :

```text
Capabilities dépendantes
Features concernées
Versions concernées
Required Capabilities
Data Requirements
Configuration invalide potentielle
Breaking changes
```

---

# 32. Breaking Changes

Champ :

```text
breakingChange Boolean
```

Une modification marquée breaking doit être visible dans :

```text
Impact Analysis
Validation
History
Snapshot metadata
```

---

# 33. Tags

Features et Capabilities peuvent être taggées :

```text
commerce
sales
finance
stock
critical
admin
```

Les tags servent notamment aux recherches et filtres.

---

# 34. Completeness Score

Exemple :

```text
SALE
Configuration : 85 %

Required capabilities    5 / 5
Dependencies            10 / 10
Data requirements        6 / 6
Optional capabilities    4 / 6
```

Le score ne remplace pas la validation.

Une configuration peut avoir un score élevé tout en restant `INVALID` si une erreur bloquante existe.

---

# 35. Capability Presets

Préparation future :

```text
SALE BASIC
├── sale.read
├── sale.create
└── sale.discount
```

```text
SALE ADVANCED
├── sale.read
├── sale.create
├── sale.cancel
├── sale.credit
├── sale.return
└── sale.refund
```

---

# 36. Validation globale BM-CDC-04

```text
Version Features
      ↓
Required Capabilities
      ↓
Version Capabilities
      ↓
Dependencies
      ↓
Conflicts
      ↓
Cycles
      ↓
Data Model Requirements
      ↓
Deprecated / Archived Usage
      ↓
Breaking Changes
      ↓
Validation Result
```

---

# 37. Niveaux de validation

```text
ERROR
WARNING
INFO
```

Une erreur bloque la validation de BM-CDC-04.

---

# 38. Erreurs principales

```text
FEATURE_NOT_FOUND
FEATURE_CODE_EXISTS
FEATURE_ARCHIVED

CAPABILITY_NOT_FOUND
CAPABILITY_CODE_EXISTS
CAPABILITY_ARCHIVED

FEATURE_CAPABILITY_EXISTS
REQUIRED_CAPABILITY_DISABLED

DEPENDENCY_EXISTS
DEPENDENCY_SELF_REFERENCE
DEPENDENCY_CYCLE
DEPENDENCY_MISSING
DEPENDENCY_CONFLICT

REQUIRED_ENTITY_MISSING

VERSION_NOT_FOUND
VERSION_NOT_EDITABLE
VERSION_FEATURE_NOT_ENABLED
VERSION_CAPABILITY_NOT_ENABLED
VERSION_CONFLICT

VALIDATION_FAILED
```

---

# 39. Validation en temps réel

Exemple UI :

```text
CONFIGURATION STATUS

✓ Feature valid
✓ Required capabilities
✗ Missing dependency
✓ Data requirements

Overall : INVALID
```

Chaque changement doit pouvoir déclencher une revalidation ciblée.

---

# 40. Snapshot

BM-CDC-04 doit produire une représentation déterministe de la configuration fonctionnelle.

Exemple :

```json
{
  "features": [
    {
      "code": "SALE",
      "state": "ENABLED",
      "capabilities": [
        "sale.read",
        "sale.create",
        "sale.cancel"
      ]
    }
  ]
}
```

Le snapshot complet doit pouvoir contenir :

```text
schemaVersion
applicationId
applicationVersionId
features
capabilities
dependencies
requirements
validationStatus
completeness
generatedAt
snapshotHash
```

---

# 41. Protection des versions publiées

Si :

```text
ApplicationVersion.status = PUBLISHED
```

BM-CDC-04 devient :

```text
READ ONLY
```

Toute mutation backend doit retourner :

```text
VERSION_NOT_EDITABLE
```

Le frontend seul ne constitue pas une protection suffisante.

---

# 42. Clonage de configuration

Lors de la création d’une nouvelle version :

```text
Version N
→ Clone
→ Version N+1 DRAFT
```

BM-CDC-04 doit pouvoir recopier :

```text
VersionFeatures
VersionCapabilities
Configurations
```

Les nouvelles lignes doivent appartenir exclusivement à la nouvelle ApplicationVersion.

---

# 43. Historique

Événements principaux :

```text
feature.created
feature.updated
feature.deprecated
feature.archived

capability.created
capability.updated
capability.deprecated
capability.archived

feature.capability.attached
feature.capability.detached

version.feature.enabled
version.feature.disabled
version.capability.enabled
version.capability.disabled

dependency.created
dependency.removed

validation.completed
snapshot.generated
```

---

# 44. ActivityEvent

Réutiliser le mécanisme transversal :

```text
applicationId
actorId
eventType
action
targetType
targetId
result
before
after
metadata
traceId
createdAt
```

---

# 45. Data Model BM-CDC-04

Tables principales :

```text
features
capabilities
feature_capabilities
version_features
version_capabilities
capability_dependencies
capability_entity_requirements
```

Tables optionnelles/futures :

```text
feature_tags
capability_tags
capability_presets
preset_capabilities
```

---

# 46. Relations

```text
Feature
   │
   └──< FeatureCapability >── Capability
                                │
                                ├──< CapabilityDependency
                                │
                                └──< CapabilityEntityRequirement

ApplicationVersion
   │
   ├──< VersionFeature >── Feature
   │
   └──< VersionCapability >── Capability
```

---

# 47. Contraintes DB essentielles

Au minimum :

```text
UNIQUE Feature.code
UNIQUE Capability.code

UNIQUE(featureId, capabilityId)

UNIQUE(applicationVersionId, featureId)
UNIQUE(applicationVersionId, capabilityId)

No self dependency
Valid foreign keys
Version fields for optimistic locking
```

Les suppressions physiques de ressources référencées doivent être évitées.

---

# 48. Optimistic locking

Tables principales modifiables :

```text
version Int default 1
```

Exemple :

```text
expectedVersion = 4
storedVersion   = 5

→ 409 VERSION_CONFLICT
```

Aucun écrasement silencieux.

---

# 49. Backend — Feature Service

```text
createFeature()
getFeature()
listFeatures()
updateFeature()
deprecateFeature()
archiveFeature()
attachCapability()
detachCapability()
getCapabilities()
getUsage()
getVersions()
```

---

# 50. Backend — Capability Service

```text
createCapability()
getCapability()
listCapabilities()
updateCapability()
deprecateCapability()
archiveCapability()
getFeatures()
getUsage()
addDependency()
removeDependency()
getDependencies()
addDataRequirement()
removeDataRequirement()
getDataRequirements()
```

---

# 51. Backend — Version Configuration Service

```text
enableFeature()
disableFeature()
setFeatureExperimental()

enableCapability()
disableCapability()

getVersionFeatures()
getVersionCapabilities()

cloneConfiguration()
```

---

# 52. Backend — Impact Service

```text
getDisableImpact()
getArchiveImpact()
getDependencyImpact()
getBreakingChangeImpact()
```

---

# 53. Backend — Validation Service

```text
validateFeatures()
validateCapabilities()
validateRequiredCapabilities()
validateDependencies()
detectCycles()
detectConflicts()
validateEntityRequirements()
validateDeprecatedUsage()
validateVersionConfiguration()
calculateCompleteness()
validateAll()
```

---

# 54. Backend — Snapshot Service

Responsabilités :

```text
buildSnapshot()
normalizeSnapshot()
calculateSnapshotHash()
getSnapshot()
compareSnapshot()
```

Le même état fonctionnel doit générer le même contenu normalisé.

---

# 55. API — base recommandée

Pour les catalogues :

```text
/api/v1/business-manager/features
/api/v1/business-manager/capabilities
```

Pour une version :

```text
/api/v1/business-manager/applications/:applicationId/versions/:versionId/features
```

---

# 56. API Features

```text
GET    /features
POST   /features
GET    /features/:id
PATCH  /features/:id

POST   /features/:id/deprecate
POST   /features/:id/archive

GET    /features/:id/capabilities
POST   /features/:id/capabilities
DELETE /features/:id/capabilities/:capabilityId

GET    /features/:id/usage
```

---

# 57. API Capabilities

```text
GET    /capabilities
POST   /capabilities
GET    /capabilities/:id
PATCH  /capabilities/:id

POST   /capabilities/:id/deprecate
POST   /capabilities/:id/archive

GET    /capabilities/:id/dependencies
POST   /capabilities/:id/dependencies
DELETE /capabilities/:id/dependencies/:dependencyId

GET    /capabilities/:id/requirements
POST   /capabilities/:id/requirements
DELETE /capabilities/:id/requirements/:requirementId

GET    /capabilities/:id/impact
```

---

# 58. API Configuration de version

```text
GET  /application-versions/:versionId/features

POST /application-versions/:versionId/features/:featureId/enable
POST /application-versions/:versionId/features/:featureId/disable
POST /application-versions/:versionId/features/:featureId/experimental

GET  /application-versions/:versionId/capabilities

POST /application-versions/:versionId/capabilities/:capabilityId/enable
POST /application-versions/:versionId/capabilities/:capabilityId/disable
```

---

# 59. API Validation

```text
POST /application-versions/:versionId/features/validate
```

Réponse fonctionnelle :

```json
{
  "valid": false,
  "completeness": 92,
  "errors": 2,
  "warnings": 1,
  "issues": [
    {
      "severity": "ERROR",
      "code": "DEPENDENCY_MISSING",
      "target": "sale.refund",
      "dependency": "payment.refund"
    }
  ]
}
```

---

# 60. API Snapshot

```text
GET /application-versions/:versionId/features/snapshot
```

---

# 61. API Impact Analysis

```text
GET /application-versions/:versionId/capabilities/:capabilityId/disable-impact
```

Exemple :

```json
{
  "affectedCapabilities": [
    "sale.refund",
    "sale.return"
  ],
  "affectedFeatures": [
    "SALE"
  ],
  "blocking": true
}
```

---

# 62. Contrat API

Les réponses doivent utiliser le contrat commun Business Manager.

Succès :

```json
{
  "success": true,
  "data": {},
  "error": null,
  "meta": {}
}
```

Erreur :

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "DEPENDENCY_MISSING",
    "message": "Required capability dependency is missing",
    "details": []
  },
  "meta": {
    "traceId": "..."
  }
}
```

---

# 63. Recherche et pagination

Features :

```text
search
status
category
sourceType
tags
page
limit
sort
```

Capabilities :

```text
search
status
type
riskLevel
feature
group
sourceType
tags
page
limit
sort
```

---

# 64. Interface principale

```text
FEATURE & CAPABILITY MANAGER

Application : Boutique Mode & Chaussures
Version     : 1.1.0
Status      : CONFIGURING

[ Vue générale ]
[ Features ]
[ Capabilities ]
[ Dépendances ]
[ Configuration version ]
[ Validation ]
[ Historique ]
```

---

# 65. Vue générale

Afficher notamment :

```text
Features                     12
Features actives             10
Capabilities                 64
Capabilities actives         57
Required Capabilities        31
Dependencies                 22
Errors                        2
Warnings                      4
Completeness                 94 %
```

Actions rapides :

```text
New Feature
New Capability
Configure Version
Validate
View Errors
```

---

# 66. Interface Features

```text
FEATURES

[Recherche____________] [Statut ▼] [Source ▼] [+ Nouvelle Feature]

Code      Nom       Capabilities    Usage    Statut
---------------------------------------------------
PRODUCT   Produits        8           4      ACTIVE
SALE      Ventes          9           5      ACTIVE
STOCK     Stock           7           5      ACTIVE
RETURN    Retours         5           0      DRAFT
```

---

# 67. Fiche Feature

Sous-onglets :

```text
[ Général ]
[ Capabilities ]
[ Versions ]
[ Impact ]
[ Historique ]
```

Exemple :

```text
SALE

✓ sale.read       REQUIRED
✓ sale.create     REQUIRED
✓ sale.discount   OPTIONAL
✓ sale.credit     OPTIONAL
○ sale.refund     OPTIONAL
```

---

# 68. Interface Capabilities

```text
CAPABILITIES

[Recherche_________] [Feature ▼] [Type ▼] [Risk ▼] [Status ▼]

sale.read
Lire les ventes
READ • LOW • ACTIVE

sale.create
Créer une vente
CREATE • MEDIUM • ACTIVE

sale.cancel
Annuler une vente
ACTION • HIGH • ACTIVE
```

---

# 69. Fiche Capability

Sous-onglets :

```text
[ Général ]
[ Features ]
[ Dependencies ]
[ Data Requirements ]
[ Versions ]
[ Impact ]
[ Historique ]
```

---

# 70. Interface Dépendances

```text
sale.refund

REQUIRES
├── sale.read
├── payment.refund
└── stock.return
```

L’interface doit permettre de voir les dépendances directes et inverses.

---

# 71. Configuration par version

```text
Application : Boutique
Version     : 1.1.0

SALE                                ENABLED
  ✓ sale.read             REQUIRED
  ✓ sale.create           REQUIRED
  ✓ sale.discount
  ✓ sale.credit
  ✗ sale.cancel
  ✗ sale.refund

STOCK                               ENABLED
  ✓ stock.read
  ✓ stock.adjust
  ✓ stock.return

PROMOTION                           EXPERIMENTAL
  ✓ promotion.read
  ✓ promotion.apply
```

---

# 72. UX d’activation d’une Capability

Si une dépendance manque :

```text
Impossible d’activer sale.refund.

Dépendances manquantes :
• payment.refund

[ Activer les dépendances ]
[ Annuler ]
```

L’activation automatique éventuelle des dépendances doit être explicitement confirmée.

---

# 73. Impact avant désactivation

```text
Impact détecté

sale.refund
sale.return

2 capabilities deviendront invalides.

[ Continuer ]
[ Annuler ]
```

Pour une conséquence bloquante, l’UI doit l’indiquer clairement.

---

# 74. Validation en temps réel

```text
CONFIGURATION STATUS

✓ Feature configuration
✓ Required capabilities
✗ Dependencies
✓ Data requirements

Completeness : 94%

Overall : INVALID
```

---

# 75. Onglet Validation

```text
VALIDATION — VERSION 1.1.0

Features                 ✓
Capabilities             ✓
Required Capabilities    ✓
Dependencies             ✗ 2 errors
Data Requirements        ⚠ 1 warning
Breaking Changes         ✓

Overall
INVALID
```

---

# 76. Navigation vers les erreurs

Chaque problème doit proposer un accès direct :

```text
ERROR
sale.refund
Missing dependency payment.refund

[ Voir Capability ]
```

---

# 77. Historique UI

Filtres :

```text
eventType
actor
target
result
date
```

Chaque événement doit permettre de comprendre :

```text
Who
What
Target
Before
After
When
Result
```

---

# 78. Sécurité

Toutes les mutations doivent utiliser le contexte IAM.

Le backend doit récupérer :

```text
actor
tenant
permissions
application
applicationVersion
```

depuis le contexte authentifié.

Ne jamais faire confiance à un `actorId` arbitraire envoyé par le client.

---

# 79. Isolation Tenant / Application / Version

Chaque requête liée à une configuration doit revalider :

```text
tenantId
applicationId
applicationVersionId
permission
version status
```

Une configuration d’une ApplicationVersion ne doit jamais être visible ou modifiable depuis une autre version non autorisée.

---

# 80. Version immuable

Une `ApplicationVersion` publiée est :

```text
Frontend → READ ONLY
Backend  → MUTATION DENIED
```

Erreur :

```text
VERSION_NOT_EDITABLE
```

---

# 81. Transactions

Toute opération multi-écriture doit être transactionnelle.

Exemple :

```text
Enable Feature
↓
Enable required capabilities
↓
Validate dependencies
↓
Create ActivityEvent
↓
COMMIT
```

En cas d’erreur :

```text
ROLLBACK
```

---

# 82. Seed de démonstration

Le seed doit fournir :

```text
SALE
STOCK
PAYMENT
```

avec :

```text
sale.read
sale.create
sale.cancel
sale.refund

stock.read
stock.adjust
stock.return

payment.read
payment.refund
```

et les dépendances de `sale.refund`.

---

# 83. Permissions recommandées

```text
business.feature.read
business.feature.create
business.feature.update
business.feature.archive

business.capability.read
business.capability.create
business.capability.update
business.capability.archive

business.feature.mapping.manage
business.capability.dependency.manage
business.capability.requirement.manage

business.version.feature.manage
business.version.capability.manage

business.feature.impact.read
business.feature.validation.run
business.feature.snapshot.read
```

---

# 84. Responsabilités Backend

Le Backend doit prendre en charge :

```text
Feature Domain
Capability Domain
FeatureCapability Mapping
Version Feature Configuration
Version Capability Configuration
Dependencies
Cycle Detection
Conflict Detection
Data Requirements
Impact Analysis
Validation
Completeness
Snapshot
History / Activity
Transactions
Optimistic Locking
Version Protection
IAM / Context
Tenant Isolation
API
Database migrations
Seed
Tests
```

---

# 85. Responsabilités Frontend

Le Frontend doit fournir :

```text
Overview
Feature Catalog
Feature Editor
Capability Catalog
Capability Editor
Feature ↔ Capability Mapping
Required / Optional UI
Dependency Manager
Data Requirements UI
Version Configuration
Impact Viewer
Validation Viewer
Completeness UI
History
Read-only published mode
Loading states
Empty states
Error states
Responsive
```

---

# 86. Tests Backend obligatoires

Tester au minimum :

```text
Feature create/update/deprecate/archive
Duplicate Feature code rejected

Capability create/update/archive
Duplicate Capability code rejected

FeatureCapability attach/detach
Required capability validation

Version Feature enable/disable
Version Capability enable/disable

Dependency create
Self dependency rejected
Cycle rejected
Conflict detected
Missing dependency detected

Entity requirement validation
Impact analysis

Published version mutation rejected
Optimistic locking
Tenant/version isolation

Completeness calculation
Snapshot generation
ActivityEvent generation

Transaction rollback
```

---

# 87. Tests Frontend obligatoires

Tester :

```text
Overview
Feature list
Capability list
Search
Filters
Pagination

Feature create/edit
Capability create/edit

Feature ↔ Capability mapping
Required / Optional
Dependencies
Data Requirements

Impact analysis
Version configuration

Validation live
Validation report
Navigation from error

History
Read-only published version

Loading
Error
Empty states
Responsive
```

---

# 88. Scénario de recette — Feature complète

```text
Créer SALE
      ↓
Créer sale.read
Créer sale.create
Créer sale.cancel
      ↓
Associer à SALE
      ↓
Marquer sale.read REQUIRED
      ↓
Activer SALE dans v1.1.0
      ↓
Activer ses capabilities
      ↓
VALIDATE
      ↓
SUCCESS
```

---

# 89. Scénario — Required Capability manquante

```text
SALE = ENABLED
sale.read = DISABLED
sale.read = REQUIRED

VALIDATE
↓
ERROR
REQUIRED_CAPABILITY_DISABLED
```

---

# 90. Scénario — dépendance manquante

```text
sale.refund = ENABLED
payment.refund = DISABLED

VALIDATE
↓
ERROR
DEPENDENCY_MISSING
```

---

# 91. Scénario — cycle

```text
A REQUIRES B
B REQUIRES C
C REQUIRES A

SAVE / VALIDATE
↓
ERROR
DEPENDENCY_CYCLE
```

---

# 92. Scénario — conflit

```text
Capability A = ENABLED
Capability B = ENABLED

A CONFLICTS_WITH B

VALIDATE
↓
ERROR
DEPENDENCY_CONFLICT
```

---

# 93. Scénario — Impact Analysis

```text
stock.return = ENABLED

sale.refund REQUIRES stock.return

Utilisateur désactive stock.return
↓
IMPACT ANALYSIS
↓
sale.refund affected
```

---

# 94. Scénario — Data Model incomplet

```text
sale.create
REQUIRES ENTITY SaleItem

BM-CDC-03 : SaleItem absent
↓
VALIDATE
↓
ERROR
REQUIRED_ENTITY_MISSING
```

---

# 95. Scénario — version publiée

```text
v1.0.0 PUBLISHED
↓
Enable PROMOTION
↓
DENIED
VERSION_NOT_EDITABLE
```

---

# 96. Scénario — Optimistic Locking

```text
Client expectedVersion = 3
Database version       = 4

PATCH
↓
409 VERSION_CONFLICT
```

---

# 97. Scénario E2E principal

```text
Application : Boutique
Version : 1.1.0 DRAFT
```

1. BM-CDC-03 contient `Sale`, `SaleItem`, `Payment`, `StockMovement`.
2. Créer Feature `SALE`.
3. Créer `sale.read`, `sale.create`, `sale.refund`.
4. Associer les trois Capabilities à SALE.
5. Marquer `sale.read` et `sale.create` REQUIRED.
6. Créer `payment.refund` et `stock.return`.
7. Définir :

```text
sale.refund REQUIRES payment.refund
sale.refund REQUIRES stock.return
```

8. Définir `sale.create` comme exigeant `SaleItem`.
9. Activer SALE.
10. Activer les Capabilities nécessaires.
11. Valider BM-CDC-04.
12. Générer le Snapshot.

Résultat :

```text
Features              VALID
Required Capabilities VALID
Dependencies          VALID
Conflicts             VALID
Data Requirements     VALID
Completeness          100%

STATUS
READY
```

---

# 98. Definition of Done Backend

Backend DONE lorsque :

```text
✓ DB + migrations
✓ Seed
✓ Feature Domain
✓ Capability Domain
✓ Feature ↔ Capability
✓ Required / Optional
✓ Version Features
✓ Version Capabilities
✓ Dependencies
✓ Cycle detection
✓ Conflicts
✓ Data Requirements
✓ Impact Analysis
✓ Validation
✓ Completeness Score
✓ Breaking Change support
✓ Snapshot
✓ ActivityEvent
✓ Optimistic locking
✓ Version protection
✓ Tenant isolation
✓ Transactions
✓ API
✓ Tests
```

---

# 99. Definition of Done Frontend

Frontend DONE lorsque :

```text
✓ Overview
✓ Feature Catalog
✓ Feature Editor
✓ Capability Catalog
✓ Capability Editor
✓ Mapping UI
✓ Required / Optional
✓ Dependency Manager
✓ Requirements UI
✓ Version Configuration
✓ Impact Viewer
✓ Validation live
✓ Validation report
✓ Completeness
✓ History
✓ Read-only published mode
✓ Loading / Error / Empty states
✓ Responsive
✓ Tests
```

---

# 100. Definition of Done globale

BM-CDC-04 est DONE lorsque :

```text
ApplicationVersion
→ Configure Features
→ Configure Capabilities
→ Required / Optional
→ Configure Dependencies
→ Configure Data Requirements
→ Analyze Impact
→ Validate
→ Completeness
→ Generate Snapshot
→ READY
```

fonctionne réellement depuis l’interface jusqu’à la base de données.

---

# 101. Livrables attendus

```text
Backend
├── Feature Domain
├── Capability Domain
├── Mapping Service
├── Version Configuration Service
├── Dependency Engine
├── Impact Service
├── Validation Service
├── Snapshot Service
├── Repositories
├── APIs
└── Tests

Frontend
├── Overview
├── Feature Manager
├── Capability Manager
├── Dependency Manager
├── Version Configuration
├── Impact Viewer
├── Validation Viewer
├── History
└── Tests

Database
├── Tables BM-CDC-04
├── Foreign keys
├── Unique constraints
├── Indexes
├── Migrations
└── Seed

Documentation
├── Architecture
├── API
├── Data contracts
├── Validation rules
├── Dependency rules
├── Error codes
└── Acceptance tests
```

---

# 102. Critères d’acceptation

BM-CDC-04 est accepté si l’utilisateur peut :

1. créer une Feature ;
2. modifier, déprécier et archiver une Feature ;
3. créer une Capability ;
4. associer plusieurs Capabilities à une Feature ;
5. définir Required / Optional ;
6. activer une Feature dans une ApplicationVersion ;
7. activer/désactiver ses Capabilities ;
8. définir des dépendances ;
9. empêcher une self-dependency ;
10. détecter un cycle ;
11. détecter un conflit ;
12. déclarer des exigences vers BM-CDC-03 ;
13. détecter une Entity requise manquante ;
14. analyser l’impact d’une désactivation ;
15. calculer la complétude ;
16. obtenir une validation détaillée ;
17. naviguer depuis une erreur vers la ressource concernée ;
18. générer un snapshot ;
19. consulter l’historique ;
20. empêcher toute mutation d’une version publiée ;
21. gérer les conflits d’édition ;
22. conserver l’isolation Tenant/Application/Version ;
23. réaliser le scénario E2E principal ;
24. fournir un contrat fonctionnel exploitable par BM-CDC-05.

---

# 103. Contrat avec BM-CDC-03

BM-CDC-04 consomme :

```text
ApplicationVersion
Data Model Snapshot
Entity IDs
Field IDs si nécessaire
Relations si nécessaire
```

BM-CDC-04 ne recrée jamais son propre Data Model.

```text
BM-CDC-03
Data Structure
      ↓
BM-CDC-04
Functional Capabilities
```

---

# 104. Contrat avec BM-CDC-05

BM-CDC-05 Menu Engine doit pouvoir utiliser les Capabilities de BM-CDC-04 comme exigences fonctionnelles.

Exemple :

```text
Menu Item : Nouvelle vente

requires:
  sale.create
```

BM-CDC-05 ne doit pas recréer un deuxième catalogue de Capabilities.

---

# 105. Contrats avec les futurs moteurs

BM-CDC-04 devient une source commune pour :

```text
Menu Engine
Page Builder
Form Builder
Rule Engine
Workflow Engine
Automation Engine
IAM / Authorization mapping
ERP Adapter
Runtime
AI Assistant
```

Les consommateurs doivent référencer les IDs stables BM-CDC-04.

---

# 106. Hors périmètre

BM-CDC-04 ne doit pas implémenter :

```text
Menu Engine complet
Page Builder
Form Builder
Workflow Engine
Automation Engine
IAM Permission Engine
ERP Adapter
Data Runtime
```

Il expose seulement le contrat fonctionnel nécessaire.

---

# 107. Répartition Team 3 — Avotra

## Avotra — Frontend fonctionnel

Responsabilités principales :

```text
Overview
Feature Catalog
Feature Create/Edit
Capability Catalog
Capability Create/Edit
Feature ↔ Capability Mapping
Required / Optional UI
Search / Filters / Pagination
Data Requirements UI
Validation report
History
Loading / Empty / Error
Responsive
API integration
```

---

# 108. Répartition Team 3 — Belardo

## Belardo — Frontend Architecture & UX complexe

Responsabilités principales :

```text
Frontend architecture BM-CDC-04
Feature/Capability Workspace
Dependency Manager
Dependency visualization
Version Configuration UI
Impact Analysis Viewer
Validation live architecture
Completeness visualization
Shared components
State management
Optimistic update handling
Conflict resolution
Read-only published mode
Frontend test foundation
Performance
```

---

# 109. Répartition Team 3 — Ranja

## Ranja — Backend

Responsabilités principales :

```text
Database schema
Migrations
Seed
Feature Domain
Capability Domain
FeatureCapability
VersionFeature
VersionCapability
Dependency Engine
Cycle Detection
Conflict Detection
Data Requirements
BM-CDC-03 integration
Impact Analysis
Validation Engine
Completeness calculation
Snapshot
ActivityEvent
Transactions
Optimistic locking
IAM / Context
Tenant isolation
Version protection
API
Backend tests
```

---

# 110. Coordination Frontend / Backend

Contrats à valider ensemble avant intégration :

```text
Feature DTO
Capability DTO
FeatureCapability DTO
VersionFeature DTO
VersionCapability DTO
Dependency DTO
Requirement DTO
ImpactResult
ValidationResult
Snapshot
Error codes
Pagination contract
Optimistic locking contract
```

Le frontend ne doit pas reproduire comme autorité les règles de dépendances, cycles, conflits ou validation.

Le backend reste l’autorité.

---

# 111. Architecture finale

```text
                        APPLICATION VERSION
                               │
                               ▼
                 FEATURE & CAPABILITY MANAGER
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
         FEATURES                            CAPABILITIES
            │                                     │
            └──────── FeatureCapability ──────────┘
                                                  │
                    ┌─────────────────────────────┼─────────────────────────────┐
                    ▼                             ▼                             ▼
              DEPENDENCIES                DATA REQUIREMENTS               RISK / TAGS
                    │                             │
                    ▼                             ▼
             CYCLE / CONFLICT                 BM-CDC-03 DATA MODEL
                    │                             │
                    └──────────────┬──────────────┘
                                   ▼
                         VERSION CONFIGURATION
                                   │
                       ┌───────────┴───────────┐
                       ▼                       ▼
                VERSION FEATURES       VERSION CAPABILITIES
                       │                       │
                       └───────────┬───────────┘
                                   ▼
                            IMPACT ANALYSIS
                                   │
                                   ▼
                              VALIDATION
                                   │
                                   ▼
                         COMPLETENESS SCORE
                                   │
                                   ▼
                               SNAPSHOT
                                   │
                ┌──────────────────┼──────────────────┐
                ▼                  ▼                  ▼
              BM-CDC-05             BUILDERS            RUNTIME
           MENU ENGINE
```

---

# 112. Règle finale d’architecture

> **BM-CDC-04 ne décrit pas l’interface d’une application. Il décrit son contrat fonctionnel versionné : les domaines fonctionnels disponibles, les actions possibles, leurs dépendances et les données nécessaires à leur fonctionnement.**

```text
BM-CDC-01 / BM-CDC-02
APPLICATION VERSION
       ↓
BM-CDC-03
WHAT DATA EXISTS?
       ↓
BM-CDC-04
WHAT CAN THE APPLICATION DO?
       ↓
BM-CDC-05+
HOW IS IT EXPOSED TO THE USER?
```

---

# 113. Résultat final attendu

À la fin de BM-CDC-04 :

```text
Application
Boutique Mode & Chaussures

Version
1.1.0

FEATURES

✓ PRODUCT
✓ SALE
✓ STOCK
✓ CUSTOMER
✓ PURCHASE
○ PROMOTION
```

Puis :

```text
SALE

Required
✓ sale.read
✓ sale.create

Optional
✓ sale.discount
✓ sale.credit
✗ sale.cancel
✗ sale.refund
```

Et :

```text
sale.refund
├── REQUIRES sale.read
├── REQUIRES payment.refund
└── REQUIRES stock.return
```

Validation finale :

```text
BM-CDC-04 VALIDATION

Features               ✓
Required Capabilities  ✓
Dependencies           ✓
Conflicts              ✓
Data Requirements      ✓
Breaking Changes       ✓
Completeness           100%

STATUS
READY
```

Le résultat est un **moteur de composition fonctionnelle versionné**, capable de décrire, contrôler et valider précisément ce que chaque version d’application sait faire avant que BM-CDC-05 Menu Engine et les modules suivants ne consomment ces informations.
