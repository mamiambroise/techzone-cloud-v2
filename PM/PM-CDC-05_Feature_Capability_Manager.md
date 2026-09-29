# PM-CDC-05 — Feature & Capability Manager

**Projet :** Techzone Cloud  
**Module :** Pack Manager  
**Équipe :** Team 3 — Business Manager, Pack & UI Runtime  
**Référence :** PM-CDC-05  
**Version :** 1.0  
**Statut :** Cahier des charges fonctionnel et technique  
**Dépendances obligatoires :** PM-CDC-00 — Socle, Architecture & Contrats communs ; PM-CDC-03 — Pack Version Manager ; PM-CDC-04 — Module Manager  
**Stack cible :** React · NestJS · Prisma · PostgreSQL

---

## 1. Objet

PM-CDC-05 définit le **Feature & Capability Manager**, responsable du registre des fonctionnalités et capacités exposées par une version de pack et ses modules.

Il répond à deux questions distinctes :

> **Quelles fonctionnalités le pack sait-il proposer ?**

et :

> **Quelles capacités fonctionnelles ou techniques expose-t-il aux autres composants de Techzone Cloud ?**

Une `Feature` décrit une fonctionnalité activable du produit.

Une `Capability` décrit une capacité exploitable par un runtime, une intégration, une automatisation ou un autre pack.

---

## 2. Position dans le Pack Manager

```text
PACK MANAGER
│
├── Vue d’ensemble        → PM-CDC-01
├── Packs                 → PM-CDC-02
├── Versions de packs     → PM-CDC-03
├── Modules               → PM-CDC-04
├── Features              → PM-CDC-05
├── Dépendances           → PM-CDC-06
└── Règles & Conditions   → PM-CDC-07
```

Dépendance interne :

```text
PACK VERSION
     ↓
MODULES
     ↓
FEATURES
     ↓
CAPABILITIES
     ↓
DEPENDENCIES / RULES
     ↓
PACK MANIFEST
```

---

## 3. Principes fondamentaux

### Feature

Une Feature représente une fonctionnalité disponible ou activable.

Exemples :

```text
stock.inventory
stock.multi_warehouse
stock.low_stock_alert
stock.transfer
sales.discount
sales.invoice
```

### Capability

Une Capability représente une capacité structurée et réutilisable.

Exemples :

```text
stock.product.read
stock.product.create
stock.inventory.execute
stock.transfer.create
sales.invoice.read
sales.invoice.create
```

---

## 4. Feature ≠ Permission IAM

Cette séparation est obligatoire.

```text
FEATURE
= ce que le produit sait proposer

CAPABILITY
= ce que le pack sait exposer ou demander

IAM PERMISSION
= qui peut faire quoi
```

Exemple :

```text
Feature
stock.inventory

Capability
stock.inventory.execute

Permission IAM
pack.stock.inventory.execute
```

Le Pack Manager ne doit pas recalculer l'autorisation IAM.

---

## 5. Feature ≠ Capability

Une Feature peut dépendre de plusieurs Capabilities.

```text
Feature : stock.multi_warehouse
     ↓
Capabilities
├── stock.warehouse.read
├── stock.warehouse.create
├── stock.transfer.read
└── stock.transfer.create
```

Une même Capability peut également être utilisée par plusieurs Features.

---

## 6. Responsabilité fonctionnelle

PM-CDC-05 doit permettre de :

- lister les Features d’une PackVersion ;
- créer une Feature ;
- modifier une Feature ;
- activer/désactiver une Feature ;
- affecter une Feature à un module ;
- définir les Capabilities associées ;
- définir si une Capability est fournie ou requise ;
- réutiliser des Capabilities du registry ;
- analyser les usages ;
- détecter les références orphelines ;
- détecter les doublons ;
- vérifier la compatibilité ;
- afficher l’impact d’une suppression/désactivation ;
- exposer des contrats stables vers PM-CDC-03, PM-CDC-06 et le Runtime.

---

## 7. Ce que PM-CDC-05 ne gère pas directement

Il ne doit pas :

- exécuter une Capability ;
- accéder directement à l’ERP ;
- définir les permissions utilisateur IAM ;
- résoudre complètement les dépendances entre packs ;
- exécuter les règles d’activation ;
- exécuter les Features dans l’UI.

---

# 8. Modèle Feature

Champs recommandés :

```text
id
tenantId
packVersionId
moduleId
code
name
shortName
description
featureType
status
enabled
defaultEnabled
visibility
configuration
metadata
createdAt
createdBy
updatedAt
updatedBy
archivedAt
rowVersion
```

---

## 9. Code Feature

Le code doit être stable dans la version.

Convention recommandée :

```text
<domain>.<feature>
```

Exemples :

```text
stock.inventory
stock.multi_warehouse
sales.invoice
restaurant.table_management
```

Règles :

- obligatoire ;
- unique dans la PackVersion ;
- lowercase ;
- pas d’espace ;
- format contrôlé.

Regex indicative :

```text
^[a-z][a-z0-9_-]*(\.[a-z][a-z0-9_-]*)+$
```

---

## 10. Feature Type

Types recommandés :

```text
CORE
OPTIONAL
PREMIUM
EXPERIMENTAL
INTERNAL
INTEGRATION
```

### CORE
Fonction centrale du pack.

### OPTIONAL
Fonction activable.

### PREMIUM
Fonction éventuellement conditionnée par plan/entitlement.

### EXPERIMENTAL
Fonction non stabilisée.

### INTERNAL
Fonction technique non destinée à l’activation utilisateur.

### INTEGRATION
Fonction dépendant d’une intégration externe.

---

## 11. Feature Status

États recommandés :

```text
DRAFT
ACTIVE
DISABLED
DEPRECATED
ARCHIVED
```

---

## 12. Enabled et Default Enabled

### enabled
Indique si la Feature est incluse dans la PackVersion.

### defaultEnabled
Indique l’intention d’activation par défaut lorsque le Runtime résout le pack.

La décision finale peut dépendre :

- du tenant ;
- du plan ;
- des entitlements ;
- des dépendances ;
- des règles ;
- de l’environnement ;
- du contexte IAM.

---

## 13. Visibility

Valeurs recommandées :

```text
PUBLIC
ADMIN
INTERNAL
HIDDEN
```

La visibilité UI ne remplace pas IAM.

---

# 14. Modèle Capability

Champs recommandés :

```text
id
tenantId?
code
name
description
capabilityType
scope
status
contractRef
contractVersion
metadata
createdAt
updatedAt
```

Les capabilities système globales peuvent ne pas être tenant-scoped selon l’architecture retenue.

---

## 15. Code Capability

Convention :

```text
<domain>.<resource>.<operation>
```

Exemples :

```text
stock.product.read
stock.product.create
stock.product.update
stock.inventory.execute
stock.transfer.create
sales.invoice.read
```

Le code est contractuel et doit rester stable.

---

## 16. Capability Type

Types recommandés :

```text
DATA
ACTION
UI
WORKFLOW
INTEGRATION
SYSTEM
```

### DATA
Lecture/recherche de données.

### ACTION
Commande métier.

### UI
Capacité consommable par UI Runtime.

### WORKFLOW
Capacité utilisable par Workflow/Automation.

### INTEGRATION
Capacité fournie par une intégration.

### SYSTEM
Capacité interne de plateforme.

---

## 17. Scope

Exemples :

```text
GLOBAL
TENANT
APPLICATION
PACK
MODULE
RESOURCE
```

Le scope clarifie où la Capability peut être résolue.

---

## 18. Capability Status

```text
DRAFT
ACTIVE
DEPRECATED
DISABLED
ARCHIVED
```

---

# 19. Relation Feature ↔ Capability

Relation many-to-many.

Champs de liaison possibles :

```text
featureId
capabilityId
relationType
required
configuration
```

`relationType` :

```text
PROVIDES
REQUIRES
USES
```

---

## 20. PROVIDES

La Feature fournit/expose la Capability.

Exemple :

```text
Feature stock.inventory
PROVIDES
stock.inventory.execute
```

---

## 21. REQUIRES

La Feature nécessite une Capability pour fonctionner.

Exemple :

```text
Feature stock.low_stock_alert
REQUIRES
stock.product.read
```

La capability requise peut être fournie par :

- le même module ;
- un autre module ;
- un autre pack ;
- Data Runtime ;
- ERP Adapter ;
- Integration Layer.

La résolution finale appartient à PM-CDC-06 / Runtime.

---

## 22. USES

La Feature utilise une Capability sans la déclarer comme dépendance bloquante stricte.

---

# 23. Capability Registry

Le système doit disposer d’un registre consultable.

Le registry permet de :

- rechercher une Capability existante ;
- afficher son code ;
- afficher son type ;
- afficher son contrat ;
- connaître ses producteurs ;
- connaître ses consommateurs ;
- voir son statut ;
- éviter les doublons sémantiques.

---

## 24. Création de Capability

Selon gouvernance, deux modes :

```text
SELECT EXISTING
CREATE NEW
```

La création d’une nouvelle Capability doit être contrôlée.

Avant création :

```text
Search similar
 ↓
Check code uniqueness
 ↓
Check namespace
 ↓
Define contract
 ↓
Create
```

---

## 25. Namespace Governance

Exemples de namespaces :

```text
stock.*
sales.*
restaurant.*
school.*
platform.*
integration.*
```

Les namespaces réservés doivent être protégés.

Exemple :

```text
platform.*
```

ne doit pas être librement utilisé par n’importe quel pack.

---

## 26. Capability Contract

Une Capability peut référencer un contrat.

Exemple :

```text
contractRef = data-runtime.resource-action
contractVersion = 1.0
```

Le Pack Manager ne définit pas nécessairement tout le payload technique, mais doit enregistrer la référence contractuelle nécessaire.

---

# 27. Liste Features

Colonnes recommandées :

```text
Feature
Code
Module
Type
Status
Enabled
Default
Capabilities
Dependencies
Rules
Dernière modification
Actions
```

---

## 28. Filtres Features

```text
moduleId
featureType
status
enabled
defaultEnabled
visibility
search
```

---

## 29. Recherche Features

Recherche par :

- code ;
- nom ;
- description ;
- module.

---

## 30. Fiche Feature

Sections :

```text
Résumé
Configuration
Module
Capabilities fournies
Capabilities requises
Dépendances
Règles
Usages
Historique
Audit
```

---

# 31. Liste Capabilities

Colonnes :

```text
Code
Nom
Type
Scope
Status
Contract
Providers
Consumers
Actions
```

---

## 32. Filtres Capabilities

```text
capabilityType
scope
status
namespace
search
```

---

# 33. Création Feature

Flux :

```text
Créer Feature
 ↓
Choisir Module
 ↓
Code / Nom / Type
 ↓
Configuration
 ↓
Capabilities
 ↓
Valider
 ↓
Créer
 ↓
PackVersion validation → OUTDATED
```

---

## 34. Modification Feature

Uniquement si PackVersion mutable.

Toute modification structurante invalide :

```text
validationStatus
manifestStatus
dependency resolution
```

---

## 35. Activation / Désactivation

Avant désactivation :

```text
Feature
 ↓
Qui l’utilise ?
 ↓
Capabilities impactées ?
 ↓
Dependencies ?
 ↓
Rules ?
 ↓
Impact Preview
```

Si une autre Feature REQUIRE une Capability fournie uniquement par cette Feature, la désactivation peut être bloquée.

---

## 36. Suppression / Archivage

Suppression physique interdite par défaut.

Flux :

```text
Impact Analysis
 ↓
Blocking references ?
 ├── Yes → reject
 └── No  → archive/remove from version
```

---

# 37. Analyse d’usage

Pour une Capability :

```text
Capability
├── Providers
├── Required by
├── Used by
├── Packs
├── Modules
├── Features
└── Contracts
```

Cela permet d’évaluer un changement cassant.

---

## 38. Détection des doublons

Le système doit signaler :

```text
stock.product.read
stock.products.read
inventory.product.read
```

comme potentiellement similaires, sans les fusionner automatiquement.

---

## 39. Suggestions avec IA

Une assistance IA peut être proposée pour :

- suggérer un code Feature ;
- détecter des doublons probables ;
- proposer des capabilities nécessaires ;
- détecter des incohérences de nommage ;
- suggérer une documentation ;
- proposer des regroupements.

Règle :

> L’IA propose. Le backend valide. L’utilisateur autorisé confirme.

Aucune création contractuelle critique ne doit être faite silencieusement par l’IA.

---

## 40. Fonctionnement sans IA

Toutes les fonctions essentielles doivent fonctionner sans IA :

- création ;
- modification ;
- recherche ;
- registry ;
- validation ;
- analyse d’impact ;
- contrat ;
- publication.

---

# 41. API — Features List

```http
GET /api/pack-manager/versions/:versionId/features
```

Query :

```text
moduleId?
featureType?
status?
enabled?
search?
cursor?
limit?
```

---

## 42. API — Feature Detail

```http
GET /api/pack-manager/features/:id
```

---

## 43. API — Create Feature

```http
POST /api/pack-manager/versions/:versionId/features
```

Exemple :

```json
{
  "moduleId": "mod_inventory",
  "code": "stock.multi_warehouse",
  "name": "Multi-entrepôts",
  "featureType": "OPTIONAL",
  "enabled": true,
  "defaultEnabled": false
}
```

---

## 44. API — Update Feature

```http
PATCH /api/pack-manager/features/:id
```

Avec :

```text
rowVersion
```

---

## 45. API — Enable / Disable Feature

```http
POST /api/pack-manager/features/:id/enable
POST /api/pack-manager/features/:id/disable
```

---

## 46. API — Feature Impact

```http
GET /api/pack-manager/features/:id/impact
```

---

# 47. API — Capability Registry

```http
GET /api/pack-manager/capabilities
```

Filtres :

```text
search?
namespace?
type?
scope?
status?
```

---

## 48. API — Capability Detail

```http
GET /api/pack-manager/capabilities/:id
```

---

## 49. API — Create Capability

```http
POST /api/pack-manager/capabilities
```

Exemple :

```json
{
  "code": "stock.inventory.execute",
  "name": "Exécuter un inventaire",
  "capabilityType": "ACTION",
  "scope": "RESOURCE",
  "contractRef": "data-runtime.action",
  "contractVersion": "1.0"
}
```

---

## 50. API — Attach Capability

```http
POST /api/pack-manager/features/:featureId/capabilities
```

Exemple :

```json
{
  "capabilityId": "cap_001",
  "relationType": "REQUIRES",
  "required": true
}
```

---

## 51. API — Detach Capability

```http
DELETE /api/pack-manager/features/:featureId/capabilities/:capabilityId
```

Doit exécuter Impact Analysis.

---

# 52. Permissions IAM

Permissions recommandées :

```text
pack.feature.read
pack.feature.create
pack.feature.update
pack.feature.enable
pack.feature.disable
pack.feature.archive

pack.capability.read
pack.capability.create
pack.capability.update
pack.capability.attach
pack.capability.detach
```

Les namespaces réservés peuvent utiliser des permissions supplémentaires :

```text
pack.capability.manage_reserved_namespace
```

---

# 53. Multi-tenant

Feature :

```text
Tenant
 ↓
Pack
 ↓
PackVersion
 ↓
Module
 ↓
Feature
```

Le backend vérifie toute la chaîne.

Les capabilities globales doivent être clairement séparées des capabilities tenant-scoped.

---

# 54. PackVersion Mutability Guard

Avant toute modification de Feature ou liaison :

```text
PackVersion mutable ?
```

Sinon :

```text
PACK_VERSION_IMMUTABLE
```

---

# 55. Optimistic Locking

Features et objets modifiables utilisent `rowVersion`.

Conflit :

```text
409 CONFLICT
PACK_FEATURE_CONFLICT
```

---

# 56. Invalidation

Modification de :

- Feature ;
- Capability relation ;
- capability requirement ;
- activation ;
- configuration structurante ;

doit invalider :

```text
PackVersion.validationStatus → OUTDATED
PackVersion.manifestStatus   → OUTDATED
Dependency cache             → INVALIDATED
```

---

# 57. Validation Feature

Vérifier :

- code valide ;
- code unique ;
- module existant ;
- PackVersion mutable ;
- type valide ;
- configuration valide ;
- relations Capability valides ;
- absence de secret ;
- namespace conforme ;
- aucune référence inter-tenant interdite.

---

# 58. Validation Capability

Vérifier :

- code unique dans le registry ;
- namespace autorisé ;
- type valide ;
- scope valide ;
- contractRef valide si requis ;
- contractVersion supportée ;
- statut compatible.

---

# 59. Validation globale PM-CDC-03

Contrat attendu :

```text
validateFeatures(packVersionId)
```

Réponse :

```json
{
  "status": "VALID",
  "errors": [],
  "warnings": [],
  "summary": {
    "features": 14,
    "enabled": 12,
    "capabilities": 21,
    "requiredCapabilities": 8
  }
}
```

---

# 60. Feature Summary Contract

Vers PM-CDC-03 / PM-CDC-04 :

```json
{
  "featureId": "feat_multiwarehouse",
  "code": "stock.multi_warehouse",
  "moduleId": "mod_inventory",
  "enabled": true,
  "status": "ACTIVE",
  "provides": [
    "stock.warehouse.read"
  ],
  "requires": [
    "stock.transfer.create"
  ],
  "valid": true
}
```

Versionner ce contrat.

---

# 61. Pack Manifest Contribution

PM-CDC-05 contribue au manifest :

```json
{
  "features": [
    "stock.inventory",
    "stock.multi_warehouse"
  ],
  "capabilities": {
    "provides": [
      "stock.inventory.execute"
    ],
    "requires": [
      "stock.product.read"
    ]
  }
}
```

Le format final est gouverné par PM-CDC-00.

---

# 62. Audit

Événements :

```text
pack.feature.created
pack.feature.updated
pack.feature.enabled
pack.feature.disabled
pack.feature.archived

pack.capability.created
pack.capability.updated
pack.capability.attached
pack.capability.detached
```

---

# 63. Outbox Events

```text
pack.feature.created
pack.feature.updated
pack.feature.enabled
pack.feature.disabled
pack.capability.created
pack.capability.updated
pack.capability.attached
pack.capability.detached
```

Consommateurs possibles :

- PM-CDC-01 ;
- PM-CDC-03 ;
- PM-CDC-06 ;
- Pack Runtime ;
- Data Runtime ;
- Rules / Workflow.

---

# 64. Codes d’erreur

```text
PACK_FEATURE_NOT_FOUND
PACK_FEATURE_CODE_INVALID
PACK_FEATURE_CODE_ALREADY_EXISTS
PACK_FEATURE_CONFLICT
PACK_FEATURE_INVALID_STATE
PACK_FEATURE_DISABLE_BLOCKED
PACK_FEATURE_ARCHIVE_BLOCKED

PACK_CAPABILITY_NOT_FOUND
PACK_CAPABILITY_CODE_INVALID
PACK_CAPABILITY_CODE_ALREADY_EXISTS
PACK_CAPABILITY_NAMESPACE_FORBIDDEN
PACK_CAPABILITY_CONTRACT_INVALID
PACK_CAPABILITY_DETACH_BLOCKED

PACK_VERSION_IMMUTABLE
```

---

# 65. Frontend React

Structure indicative :

```text
src/features/pack-manager/features/
├── pages/
├── components/
├── forms/
├── capabilities/
├── impact/
├── hooks/
├── services/
├── types/
└── tests/
```

Composants :

```text
FeatureList
FeatureForm
FeatureDetail
FeatureStatusBadge
FeatureTypeBadge
CapabilityPicker
CapabilityRegistry
CapabilityDetail
CapabilityRelationEditor
FeatureImpactDialog
CapabilityUsagePanel
```

---

# 66. Maquette fonctionnelle — Features

```text
PACK STOCK / VERSION 1.2.0
FEATURES

┌────────────────────────┬────────────┬─────────┬──────────────┐
│ Feature                │ Module     │ Enabled │ Capabilities │
├────────────────────────┼────────────┼─────────┼──────────────┤
│ stock.inventory        │ Inventory  │ Yes     │ 4            │
│ stock.multi_warehouse  │ Warehouse  │ Yes     │ 5            │
│ stock.low_stock_alert  │ Alerts     │ No      │ 2            │
└────────────────────────┴────────────┴─────────┴──────────────┘
```

---

# 67. Maquette — Feature Detail

```text
stock.multi_warehouse

Module        Warehouse
Type          OPTIONAL
Status        ACTIVE
Enabled       YES
Default       NO

PROVIDES
✓ stock.warehouse.read
✓ stock.warehouse.create

REQUIRES
✓ stock.product.read
✓ stock.transfer.create

[Edit] [Impact] [Disable]
```

---

# 68. États UI

```text
LOADING
READY
EMPTY
ERROR
FORBIDDEN
READ_ONLY
SAVING
CONFLICT
IMPACT_ANALYSIS
VALIDATING
```

---

# 69. Backend NestJS

Structure indicative :

```text
src/pack-manager/features/
├── features.controller.ts
├── features.service.ts
├── features.repository.ts
├── feature-impact.service.ts
├── feature-validation.service.ts
├── dto/
└── tests/

src/pack-manager/capabilities/
├── capabilities.controller.ts
├── capabilities.service.ts
├── capabilities.repository.ts
├── capability-registry.service.ts
├── capability-namespace.service.ts
├── capability-validation.service.ts
├── dto/
└── tests/
```

---

# 70. Prisma — Modèles conceptuels

```text
Feature
├── id
├── tenantId
├── packVersionId
├── moduleId
├── code
├── name
├── shortName
├── description
├── featureType
├── status
├── enabled
├── defaultEnabled
├── visibility
├── configuration
├── metadata
├── createdAt/by
├── updatedAt/by
├── archivedAt
└── rowVersion
```

```text
Capability
├── id
├── tenantId?
├── code
├── name
├── description
├── capabilityType
├── scope
├── status
├── contractRef
├── contractVersion
├── metadata
├── createdAt
└── updatedAt
```

```text
FeatureCapability
├── featureId
├── capabilityId
├── relationType
├── required
└── configuration
```

---

# 71. Contraintes DB

Prévoir :

```text
UNIQUE(packVersionId, feature.code)
UNIQUE(capability.scope, capability.code)
INDEX(moduleId)
INDEX(packVersionId, enabled)
INDEX(featureType)
INDEX(capabilityType)
INDEX(capability.code)
```

La contrainte de Capability peut évoluer selon le scope global/tenant.

---

# 72. Performance

Prévoir :

- pagination ;
- recherche indexée ;
- filtrage backend ;
- compteurs agrégés ;
- chargement lazy des usages ;
- pas de N+1 ;
- cache du Capability Registry si pertinent.

---

# 73. Mock / Simulation

PM-CDC-05 doit fonctionner même si les fournisseurs réels de Capability ne sont pas prêts.

Exemple :

```text
CapabilityRegistryContract v1 🔒
├── MockCapabilityRegistry
└── RealCapabilityRegistry
```

De même :

```text
CapabilityAvailabilityProvider
├── Mock
└── Real
```

---

# 74. Contract Tests

Tester :

- Feature Summary Contract ;
- Capability Registry Contract ;
- Capability relation ;
- providers Mock/Réel ;
- version de contrat ;
- enums ;
- tenant isolation ;
- namespaces ;
- erreurs.

---

# 75. Tests unitaires

- validation codes ;
- feature lifecycle ;
- attach/detach capability ;
- namespace governance ;
- impact analysis ;
- duplicate detection ;
- mutability guard ;
- invalidation ;
- optimistic locking.

---

# 76. Tests intégration

- Prisma ;
- unique Feature code ;
- unique Capability ;
- relations ;
- tenant isolation ;
- audit ;
- outbox ;
- filtres ;
- recherche.

---

# 77. Tests E2E web

```text
Ouvrir Pack Version DRAFT
→ Features
→ Ajouter Feature stock.inventory
→ Associer Module Inventory
→ Ajouter Capability stock.inventory.execute
→ Ajouter requirement stock.product.read
→ Sauvegarder
→ Voir usages
→ Désactiver
→ Voir Impact
→ Réactiver
→ Vérifier PackVersion OUTDATED
```

---

# 78. Critères d’acceptation

PM-CDC-05 est conforme si :

- Features gérables par PackVersion ;
- association Module fonctionnelle ;
- Capability Registry disponible ;
- Provides/Requires/Uses supportés ;
- codes uniques ;
- namespace governance ;
- analyse d’impact ;
- PackVersion immutable protégée ;
- invalidation validation/manifest ;
- IAM appliqué ;
- tenant isolation ;
- audit/outbox ;
- Mock/Contract Tests ;
- tests E2E web passants.

---

# 79. Definition of Done

```text
PM-CDC-05 DONE
├── Feature Model
├── Capability Model
├── Feature List
├── Feature Detail
├── Create / Edit
├── Enable / Disable
├── Capability Registry
├── Provides / Requires / Uses
├── Capability Attach / Detach
├── Usage Analysis
├── Impact Analysis
├── Namespace Governance
├── Validation
├── Pack Manifest Contribution
├── Version Mutability Guard
├── Invalidation
├── IAM
├── Tenant Isolation
├── Audit
├── Outbox
├── AI Suggestions optional
├── No-AI full workflow
├── Mock Contracts
├── Contract Tests
├── Unit Tests
├── Integration Tests
└── E2E Web
```

---

# 80. Résultat attendu

À la fin de PM-CDC-05, une PackVersion possède un registre fonctionnel explicite :

```text
MODULE
 ↓
FEATURE
 ↓
PROVIDES / REQUIRES / USES
 ↓
CAPABILITY
 ↓
DEPENDENCY RESOLUTION
 ↓
PACK MANIFEST
```

> **PM-CDC-05 sépare clairement les fonctionnalités proposées par le produit, les capacités exposées par le pack et les permissions IAM. Cette séparation permet au Pack Runtime, au Data Runtime et aux automatisations de consommer des contrats stables sans dépendre de l’implémentation interne du Pack Manager.**
