# CAHIER DES CHARGES --- TECHZONE CLOUD PACK MANAGER

**Version :** 2.0 --- Consolidation et extension\
**Date :** Septembre 2026\
**Projet :** Techzone Cloud\
**Module :** Pack Manager\
**Statut :** Spécification fonctionnelle et technique consolidée\
**Principe :** Continuité du Pack Manager existant --- pas de
reconstruction globale

------------------------------------------------------------------------

# 1. Objet

Le présent cahier des charges consolide et étend le **Pack Manager**
existant de Techzone Cloud.

Il ne demande pas une réécriture globale. La branche `main` et
l'architecture actuelle restent la base canonique.

Avant toute modification :

``` text
EXISTANT + FONCTIONNEL → KEEP
EXISTANT + UI/UX FAIBLE → IMPROVE
PARTIEL → COMPLETE
ANCIEN MAIS RÉUTILISABLE → ADAPT
RÉELLEMENT ABSENT → IMPLEMENT
```

------------------------------------------------------------------------

# 2. Vision

Pack Manager est le moteur de **composition, versionnement, validation,
génération du Manifest et publication** des applications Techzone Cloud.

Il assemble les définitions produites par les modules de construction.

``` text
BUSINESS MANAGER
Business Definition
        │
UI BUILDER
UI Definition
        │
AUTOMATION
Automation Definition
        │
        ▼
PACK MANAGER
Composition
Versions
Modules
Features
Capabilities
Dependencies
Rules
Compatibility
Validation
Manifest
Publication
        │
        ▼
PACK RUNTIME
```

Principe central :

``` text
DÉFINITIONS
     ↓
COMPOSITION
     ↓
VALIDATION
     ↓
MANIFEST
     ↓
PUBLICATION
     ↓
RUNTIME
```

------------------------------------------------------------------------

# 3. Responsabilités

Pack Manager possède :

-   Packs ;
-   Pack Versions ;
-   Composition ;
-   Modules ;
-   inclusion des Features ;
-   Capabilities requises/exposées ;
-   Dependencies ;
-   Rules ;
-   Compatibility ;
-   Validation globale ;
-   Manifest ;
-   Publication ;
-   Publication History.

Pack Manager ne possède pas :

``` text
Entités / Champs / Relations → Business Manager
Pages / Components / Theme → UI Builder
Workflows / Triggers → Automation
IAM → IAM
Exécution du Pack → Pack Runtime
```

------------------------------------------------------------------------

# 4. Architecture fonctionnelle

  Domaine                 Responsabilité
  ----------------------- ----------------------------------
  Vue d'ensemble          Cockpit Pack Manager
  Packs                   Gestion des Packs
  Versions                Versionnement / SemVer
  Composition             Assemblage des définitions
  Modules                 Modules inclus
  Fonctionnalités         Features incluses
  Capacités               Capabilities
  Dépendances             Résolution des dépendances
  Règles                  Contraintes de composition
  Compatibilité           Runtime / connecteurs / versions
  Validation & Manifest   Contrôle et génération
  Publication             Publication vers Runtime
  Historique              Publications précédentes

Navigation cible :

``` text
Pack Manager
├── Vue d'ensemble
├── Packs
├── Versions
├── Modules
├── Fonctionnalités
├── Capacités
├── Dépendances
├── Règles
├── Validation & Manifest
└── Publication
```

Runtime reste uniquement sous :

``` text
EXÉCUTION
└── Runtime
```

------------------------------------------------------------------------

# 5. Contexte

``` text
Tenant
   ↓
Application
   ↓
Application Version
   ↓
Pack
   ↓
Pack Version
```

Context Bar :

``` text
TechBoutique / Application v1.4.0 / Pack v1.4.0 / DRAFT
```

Aucune donnée ne doit être mélangée entre tenants, applications ou
versions.

------------------------------------------------------------------------

# 6. Vue d'ensemble

Le cockpit affiche des données réelles :

``` text
Pack                    TechBoutique
Version                 1.4.0
Status                  DRAFT

Modules                 7
Features                18
Capabilities            34
Dependencies             6

Errors                   2
Warnings                 4
```

Afficher également :

-   dernière validation ;
-   dernière publication ;
-   version publiée actuelle ;
-   version en préparation ;
-   Runtime compatibility ;
-   Business Definition status ;
-   UI Definition status ;
-   Automation Definition status.

Pipeline :

``` text
Business      UI       Automation
   ✓          ✓            ✓
   │          │            │
   └──────────┼────────────┘
              ▼
          Composition
              ✓
              ↓
          Validation
           2 errors
              ↓
           Manifest
              —
              ↓
          Publication
           BLOCKED
```

------------------------------------------------------------------------

# 7. Pack

Un Pack représente l'unité logique de distribution d'une application.

Champs conceptuels :

``` text
id
tenantId
applicationId
key
name
description
status
metadata
createdBy
createdAt
updatedAt
```

Actions :

``` text
Créer
Modifier
Ouvrir
Archiver
Restaurer
Créer une version
```

------------------------------------------------------------------------

# 8. Pack Version

Une Pack Version représente une composition précise et reproductible.

``` text
TechBoutique

1.0.0   PUBLISHED
1.1.0   PUBLISHED
1.2.0   ARCHIVED
1.3.0   PUBLISHED
1.4.0   DRAFT
```

Elle peut référencer :

``` text
Business Definition Version
UI Definition Version
Automation Definition Version
Modules
Features
Capabilities
Dependencies
Rules
Configuration
Runtime Requirements
```

------------------------------------------------------------------------

# 9. SemVer

Format :

``` text
MAJOR.MINOR.PATCH
```

Exemples :

``` text
1.0.0
1.1.0
1.1.1
2.0.0
```

Principe :

``` text
PATCH → correction compatible
MINOR → ajout compatible
MAJOR → modification potentiellement incompatible
```

Le système peut conseiller, mais ne doit pas imposer automatiquement un
changement MAJOR sans règle explicite.

------------------------------------------------------------------------

# 10. Lifecycle

Lifecycle indicatif :

``` text
DRAFT
  ↓
CONFIGURING
  ↓
VALIDATING
  ↓
READY
  ↓
PUBLISHED
  ↓
ARCHIVED
```

`DEPRECATED` peut être ajouté si les conventions existantes le
nécessitent.

Auditer les enums existants avant toute modification Prisma.

------------------------------------------------------------------------

# 11. Immutabilité

Une Pack Version publiée est immuable.

``` text
v1.3.0 PUBLISHED
→ READ ONLY
```

Toute évolution crée une nouvelle version :

``` text
v1.3.0 PUBLISHED
      ↓
v1.4.0 DRAFT
```

------------------------------------------------------------------------

# 12. Composition

Une Pack Version assemble :

``` text
Pack Version
├── Business Definition
├── UI Definition
├── Automation Definition
├── Modules
├── Features
├── Capabilities
├── Dependencies
├── Rules
├── Configuration
└── Runtime Requirements
```

La composition doit être déterministe et versionnée.

------------------------------------------------------------------------

# 13. Business Definition

Business Manager fournit notamment :

``` text
Application
Application Version
Entities
Fields
Relations
Features
Capabilities
Business Events
Configuration Schema
Metadata
Permission references
```

Pack Manager vérifie que la définition est compatible avec la
publication.

------------------------------------------------------------------------

# 14. UI Definition

UI Builder fournit notamment :

``` text
Pages
Component Definitions
Bindings
UI Actions
Navigation
Theme
Responsive Configuration
```

Pack Manager vérifie :

``` text
Definition disponible
Schema compatible
Bindings valides
Components supportés
Version compatible
Validation UI réussie
```

Il ne modifie pas le Canvas UI.

------------------------------------------------------------------------

# 15. Automation Definition

Automation fournit :

``` text
Workflows
Triggers
Conditions
Actions
Variables
Schedules
Connector Requirements
```

Pack Manager vérifie notamment :

``` text
Workflow schema compatible
Nodes supportés
Actions supportées
Connectors disponibles
Secret references valides
Automation validation réussie
```

------------------------------------------------------------------------

# 16. Modules

Exemple :

``` text
Catalog
Inventory
Customers
Orders
Invoicing
Payments
Reports
```

Un module possède conceptuellement :

``` text
key
name
description
version
status
features
capabilities
dependencies
configuration
```

Réutiliser les modèles existants.

------------------------------------------------------------------------

# 17. Module Registry

Exemple :

``` json
{
  "key": "inventory",
  "name": "Gestion de stock",
  "version": "1.2.0",
  "features": ["stock-management"],
  "capabilities": [
    "stock.read",
    "stock.adjust"
  ]
}
```

------------------------------------------------------------------------

# 18. Features

Business Manager définit les Features.

Pack Manager gère leur inclusion dans la Pack Version.

``` text
catalog             INCLUDED
inventory           INCLUDED
payments            INCLUDED
advanced-reports    EXCLUDED
```

Règle :

``` text
Business Manager → définit la Feature
Pack Manager → compose la Feature dans une version
```

------------------------------------------------------------------------

# 19. Capabilities

Exemples :

``` text
order.create
order.validate
invoice.generate
stock.adjust
```

Pack Manager gère les capacités requises et exposées.

Types :

``` text
PROVIDED
REQUIRED
OPTIONAL
```

Exemple :

``` text
Module Invoicing

PROVIDES
invoice.generate

REQUIRES
customer.read
order.read
```

------------------------------------------------------------------------

# 20. Dépendances

Types possibles :

``` text
Module → Module
Feature → Feature
Capability → Capability
Pack → Runtime Capability
Pack → Connector
Pack → ERP Adapter
Automation → Connector
```

Exemple :

``` json
{
  "source": "invoicing",
  "target": "customers",
  "type": "MODULE",
  "versionRange": ">=1.0.0",
  "required": true
}
```

------------------------------------------------------------------------

# 21. Dependency Resolver

Exemple :

``` text
Invoicing
├── requires Customers
└── requires Orders

Orders
└── requires Catalog
```

Résolution :

``` text
Catalog
Customers
Orders
Invoicing
```

Détecter :

``` text
MISSING_DEPENDENCY
INVALID_VERSION
CIRCULAR_DEPENDENCY
CONFLICTING_DEPENDENCY
UNSUPPORTED_CAPABILITY
```

------------------------------------------------------------------------

# 22. Dependency Graph

Visualisation possible :

``` text
Catalog
   ▲
   │
Orders ─────► Customers
   ▲
   │
Invoicing
   │
   ▼
Payments
```

Le graphique est une représentation UI ; le resolver backend reste
l'autorité.

------------------------------------------------------------------------

# 23. Cycles

``` text
Module A
→ Module B
→ Module C
→ Module A
```

Résultat :

``` text
CIRCULAR_DEPENDENCY
```

Un cycle interdit bloque la publication.

------------------------------------------------------------------------

# 24. Version Constraints

Si réellement supportées :

``` text
>=1.0.0
^1.2.0
~1.4.0
```

Ne pas introduire une syntaxe que le backend ne sait pas résoudre.

------------------------------------------------------------------------

# 25. Rules

Le moteur de règles contrôle la composition.

Exemples :

``` text
IF invoicing enabled
THEN customers required

IF automation contains ERP_ACTION
THEN ERP Adapter capability required

IF UI uses DataTable
THEN Runtime DataTable capability required
```

Types possibles :

``` text
REQUIRES
CONFLICTS_WITH
REQUIRES_CAPABILITY
REQUIRES_FEATURE
REQUIRES_CONNECTOR
REQUIRES_RUNTIME
VERSION_CONSTRAINT
```

------------------------------------------------------------------------

# 26. Rule Engine

Exemple :

``` json
{
  "type": "REQUIRES",
  "source": "invoicing",
  "target": "customers"
}
```

Résultats :

``` text
PASS
WARNING
ERROR
```

------------------------------------------------------------------------

# 27. Runtime Compatibility

Le Pack peut déclarer :

``` json
{
  "runtime": {
    "minVersion": "1.3.0",
    "capabilities": [
      "ui.definition.v1",
      "automation.workflow.v1",
      "business.definition.v2"
    ]
  }
}
```

Runtime doit pouvoir refuser proprement un Pack incompatible.

------------------------------------------------------------------------

# 28. Runtime Capabilities

Exemples conceptuels :

``` text
business.definition.v2
ui.definition.v1
automation.workflow.v1
datatable.v1
workflow.delay.v1
erp.adapter.v1
```

Le nommage final doit suivre le Runtime Registry réel.

------------------------------------------------------------------------

# 29. Connector Requirements

Un Pack peut nécessiter :

``` text
ERP Adapter
Email Provider
SMS Provider
Payment Gateway
Storage Provider
```

Exemple :

``` json
{
  "connector": "erp-adapter",
  "required": true
}
```

Pack Manager stocke la dépendance, jamais le secret.

------------------------------------------------------------------------

# 30. Configuration

Pack Manager compose les requirements de configuration :

``` text
currency
tax
stock
erp
notifications
payment
```

Il ne doit pas créer une seconde architecture de configuration
concurrente.

------------------------------------------------------------------------

# 31. Validation Engine

Avant publication, vérifier :

``` text
Pack Metadata
Pack Version
SemVer

Business Definition
UI Definition
Automation Definition

Modules
Features
Capabilities

Dependencies
Rules

Configuration Requirements
Connectors
Runtime Compatibility
Manifest
```

Niveaux :

``` text
ERROR
WARNING
INFO
```

Une erreur bloquante interdit `READY` et `PUBLISH`.

------------------------------------------------------------------------

# 32. Validation Cockpit

``` text
Validation — TechBoutique v1.4.0

COMPOSITION
✓ Business Definition
✓ UI Definition
✓ Automation Definition

MODULES
✓ 7 modules

FEATURES
✓ 18 features

CAPABILITIES
✓ 34 capabilities

DEPENDENCIES
✕ 1 missing dependency

RULES
✓ 14 rules

RUNTIME
⚠ Runtime version warning

MANIFEST
— Not generated

1 Error
1 Warning
```

Un clic sur une erreur doit idéalement ouvrir la section concernée.

------------------------------------------------------------------------

# 33. Manifest

Le Manifest est le contrat entre Pack Manager et Pack Runtime.

``` text
Pack Manager
      ↓
Manifest
      ↓
Pack Runtime
```

Structure conceptuelle :

``` json
{
  "manifestVersion": "1.0",
  "pack": {
    "key": "techboutique",
    "version": "1.4.0"
  },
  "application": {
    "id": "...",
    "version": "1.4.0"
  },
  "business": {
    "schemaVersion": "2.0"
  },
  "ui": {
    "schemaVersion": "1.0"
  },
  "automation": {
    "schemaVersion": "1.0"
  },
  "modules": [],
  "features": [],
  "capabilities": [],
  "dependencies": [],
  "configuration": {},
  "runtime": {
    "minVersion": "1.0.0"
  }
}
```

La structure finale doit respecter les conventions PM/PR réellement
implémentées.

------------------------------------------------------------------------

# 34. Manifest immuable

Une publication doit former une unité reproductible :

``` text
Pack Version
+
Manifest
+
Definitions
```

Le Manifest publié ne doit pas changer silencieusement.

Une empreinte `manifestHash` peut être ajoutée si l'architecture le
justifie.

------------------------------------------------------------------------

# 35. Publication

Workflow :

``` text
DRAFT
  ↓
CONFIGURATION
  ↓
VALIDATION
  ↓
READY
  ↓
GENERATE MANIFEST
  ↓
PUBLISH
  ↓
PUBLISHED
  ↓
RUNTIME
```

------------------------------------------------------------------------

# 36. Pre-publication Checks

Avant `PUBLISH` :

``` text
Pack Version READY
Business Definition READY
UI Definition READY
Automation Definition READY
Dependencies resolved
Rules passed
Runtime compatible
Manifest valid
```

Une définition optionnelle absente ne doit pas rendre le Pack invalide
si elle n'est pas requise.

------------------------------------------------------------------------

# 37. Publication transactionnelle

Pipeline conceptuel :

``` text
Validate
   ↓
Build Manifest
   ↓
Persist Published Snapshot
   ↓
Activate Publication
   ↓
Notify Runtime / Registry
```

En cas d'échec :

``` text
PUBLICATION_FAILED
```

avec diagnostic et Trace ID.

------------------------------------------------------------------------

# 38. Publication History

Conserver :

``` text
Version
Published At
Published By
Manifest
Status
Runtime Status
```

Exemple :

``` text
1.2.0   12/09/2026   User A   PUBLISHED
1.3.0   20/09/2026   User B   PUBLISHED
1.4.0   —            —        DRAFT
```

------------------------------------------------------------------------

# 39. Rollback

Un rollback ne modifie pas une ancienne version publiée.

Il sélectionne une version publiée compatible comme cible.

``` text
Current
1.4.0

Rollback target
1.3.0
```

Vérifier lorsque nécessaire :

``` text
Runtime Compatibility
Configuration Compatibility
Data Migration Implications
Dependency Availability
Connector Availability
```

Ne jamais promettre un rollback automatique des données métier sans
infrastructure dédiée.

------------------------------------------------------------------------

# 40. Runtime Bridge

Flux :

``` text
Pack Manager
      ↓
Published Pack
      ↓
Pack Registry
      ↓
Pack Runtime
      ├── Manifest Loader
      ├── Dependency Resolver
      ├── Rule Resolver
      ├── Configuration Resolver
      └── Runtime Context
```

Si l'architecture le permet, distinguer :

``` text
PUBLISHED
```

de :

``` text
RUNTIME_ACTIVE
```

------------------------------------------------------------------------

# 41. Environnements

Préparer le modèle pour :

``` text
Development
Staging
Production
```

sans imposer l'implémentation complète dans le MVP.

Une publication pourra être associée à :

``` text
Pack Version
Environment
Deployment
```

si le système de déploiement le prévoit.

------------------------------------------------------------------------

# 42. Modèle conceptuel

``` text
Pack
PackVersion
PackModule
PackFeature
PackCapability
PackDependency
PackRule
PackRuntimeRequirement
PackConnectorRequirement
PackValidation
PackManifest
PackPublication
PackPublicationHistory
```

Relations :

``` text
Application
   └── Pack
        └── PackVersion
              ├── Business Definition Ref
              ├── UI Definition Ref
              ├── Automation Definition Ref
              ├── Modules
              ├── Features
              ├── Capabilities
              ├── Dependencies
              ├── Rules
              ├── Runtime Requirements
              ├── Validation
              ├── Manifest
              └── Publication
```

------------------------------------------------------------------------

# 43. Prisma

Avant toute migration :

1.  lire `schema.prisma` ;
2.  rechercher Pack / PackVersion ;
3.  rechercher Module / Feature / Capability ;
4.  rechercher Dependency / Rule ;
5.  rechercher Manifest / Publication ;
6.  réutiliser les modèles existants ;
7.  compléter seulement ce qui manque ;
8.  respecter UUID, tenantId, FK composites, indexes, uniques et
    timestamps ;
9.  produire une migration additive et contrôlée.

Ne jamais remplacer aveuglément le schéma actuel.

------------------------------------------------------------------------

# 44. API indicative

Préfixe conceptuel :

``` text
/api/pack-manager
```

## Packs

``` http
GET    /packs
POST   /packs
GET    /packs/:id
PATCH  /packs/:id
POST   /packs/:id/archive
```

## Versions

``` http
GET  /packs/:id/versions
POST /packs/:id/versions
GET   /versions/:id
PATCH /versions/:id
```

## Modules

``` http
GET  /versions/:id/modules
POST /versions/:id/modules
```

## Features / Capabilities

``` http
GET /versions/:id/features
GET /versions/:id/capabilities
```

Selon le modèle réel, elles peuvent être calculées plutôt que créées.

------------------------------------------------------------------------

# 45. Dependencies API

``` http
GET    /versions/:id/dependencies
POST   /versions/:id/dependencies
PATCH  /dependencies/:id
DELETE /dependencies/:id

POST /versions/:id/resolve-dependencies
```

------------------------------------------------------------------------

# 46. Rules API

``` http
GET  /versions/:id/rules
POST /versions/:id/evaluate-rules
```

Si les règles sont administrables, prévoir les opérations CRUD adaptées.

------------------------------------------------------------------------

# 47. Validation API

``` http
POST /versions/:id/validate
GET  /versions/:id/validation
```

Réponse conceptuelle :

``` json
{
  "valid": false,
  "errors": 1,
  "warnings": 2,
  "issues": []
}
```

------------------------------------------------------------------------

# 48. Manifest API

``` http
POST /versions/:id/manifest
GET  /versions/:id/manifest
```

Le backend est l'autorité de génération.

------------------------------------------------------------------------

# 49. Publication API

``` http
POST /versions/:id/publish
GET  /packs/:id/publications
```

Pour rollback/réactivation, utiliser une route conforme à l'architecture
réelle.

------------------------------------------------------------------------

# 50. Permissions

Permissions indicatives :

``` text
pack.read
pack.create
pack.update
pack.archive

pack.version.create
pack.version.update

pack.module.manage
pack.dependency.manage
pack.rule.manage

pack.validate
pack.manifest.generate
pack.publish

pack.publication.read
pack.rollback
```

Réutiliser IAM existant.

------------------------------------------------------------------------

# 51. Sécurité

Pipeline :

``` text
Authentication
      ↓
Tenant Context
      ↓
Authorization
      ↓
DTO Validation
      ↓
Business Validation
      ↓
Audit
```

Le `tenantId` envoyé par le frontend ne constitue jamais l'autorité.

------------------------------------------------------------------------

# 52. Multi-tenant

Tester explicitement :

``` text
Pack
PackVersion
Module
Feature
Capability
Dependency
Rule
Manifest
Publication
```

Tenant B ne doit jamais pouvoir lire, modifier, valider ou publier un
Pack de Tenant A.

------------------------------------------------------------------------

# 53. Audit

Événements possibles :

``` text
PACK_CREATED
PACK_VERSION_CREATED
PACK_VERSION_UPDATED
MODULE_ADDED
MODULE_REMOVED
DEPENDENCY_ADDED
DEPENDENCY_REMOVED
PACK_VALIDATED
MANIFEST_GENERATED
PACK_PUBLISHED
PACK_ACTIVATED
PACK_ROLLBACK_REQUESTED
PACK_ARCHIVED
```

------------------------------------------------------------------------

# 54. Observabilité

Inclure lorsque pertinent :

``` text
requestId
traceId
tenantId
applicationId
packId
packVersionId
publicationId
userId
```

------------------------------------------------------------------------

# 55. UI/UX

Design system Techzone Cloud :

-   canvas clair slate ;
-   surfaces blanches ;
-   bleu Techzone ;
-   bordures fines ;
-   radius 10--12 px ;
-   ombres discrètes ;
-   densité professionnelle ;
-   icônes cohérentes.

Pack Manager doit ressembler à un **cockpit de packaging et
publication**, pas à Business Manager renommé.

------------------------------------------------------------------------

# 56. Pack Workspace

``` text
TechBoutique / Pack 1.4.0 / DRAFT

Overview
Composition
Modules
Features
Capabilities
Dependencies
Rules
Validation
Manifest
Publication
```

La navigation globale reste dans la sidebar.

------------------------------------------------------------------------

# 57. Composition Screen

``` text
COMPOSITION

Business Manager
Business Definition v1.4
✓ READY

UI Builder
UI Definition v1.4
✓ READY

Automation
Automation Definition v1.4
✓ READY

Modules       7
Features     18
Capabilities 34

[Validate Composition]
```

------------------------------------------------------------------------

# 58. Dependencies Screen

``` text
Dependencies

✓ Orders → Catalog
✓ Invoicing → Orders
✓ Invoicing → Customers
✕ Payments → payment.gateway

1 dependency missing

[Resolve]
[View details]
```

------------------------------------------------------------------------

# 59. Rules Screen

``` text
Composition Rules

✓ Invoicing requires Customers
✓ Orders requires Catalog
✓ ERP workflow requires ERP Adapter
⚠ Advanced reports require runtime >= 1.4
```

------------------------------------------------------------------------

# 60. Manifest Screen

Afficher :

``` text
Manifest Version
Generated At
Hash
Status
```

Sections :

``` text
Pack
Application
Business
UI
Automation
Modules
Features
Capabilities
Dependencies
Runtime
Configuration
Connectors
```

Permettre une vue JSON technique secondaire.

------------------------------------------------------------------------

# 61. Publication Screen

``` text
Publish TechBoutique 1.4.0

Pre-publication checks

✓ Business Definition
✓ UI Definition
✓ Automation Definition
✓ Dependencies
✓ Rules
✓ Runtime Compatibility
✓ Manifest

Ready to publish

[PUBLISH]
```

Une confirmation explicite est nécessaire.

------------------------------------------------------------------------

# 62. États UX

``` text
Loading
Loaded
Empty
Error
Unauthorized
Forbidden
Saving
Saved
Validating
Validation Failed
Publishing
Publication Failed
Published
```

------------------------------------------------------------------------

# 63. Micro-interactions

Animations légères :

``` text
150–220 ms
```

pour tabs, drawers, validation, dépendances, sections Manifest et
progression de publication.

Respecter `prefers-reduced-motion`.

------------------------------------------------------------------------

# 64. Responsive

Desktop : Sidebar + Workspace.

Laptop : Sidebar compacte + Workspace.

Tablet : Workspace + drawers contextuels.

Mobile : priorité à :

``` text
Status
Validation
Manifest consultation
Publication history
Diagnostics
```

Les modifications complexes restent Desktop-first.

------------------------------------------------------------------------

# 65. Performance

Selon l'architecture :

``` text
Cached Registry
Incremental Validation
Memoization
Pagination
Lazy Loading
Debounced Changes
```

La validation finale avant publication reste authoritative côté backend.

------------------------------------------------------------------------

# 66. AI Pack Assistant

Exemples :

> Pourquoi ce Pack n'est-il pas publiable ?

> Quelles dépendances manquent ?

> Compare v1.3.0 et v1.4.0.

> Explique les warnings Runtime.

L'IA explique et propose ; elle ne publie jamais silencieusement.

------------------------------------------------------------------------

# 67. AI Composition Operations

Opérations structurées possibles :

``` text
ADD_MODULE
REMOVE_MODULE
ADD_DEPENDENCY
CHANGE_VERSION
RESOLVE_WARNING
```

Exemple :

``` json
{
  "operation": "ADD_DEPENDENCY",
  "source": "invoicing",
  "target": "customers"
}
```

Pipeline :

``` text
Proposal
   ↓
Validation
   ↓
Preview Diff
   ↓
User Accept / Reject
```

------------------------------------------------------------------------

# 68. Règles de gestion

-   **RG-PM-001** --- Un Pack appartient à un tenant.
-   **RG-PM-002** --- Un Pack appartient à une application.
-   **RG-PM-003** --- Une Pack Version appartient à un Pack.
-   **RG-PM-004** --- Une Pack Version publiée est immuable.
-   **RG-PM-005** --- Toute ressource Pack est tenant-scoped.
-   **RG-PM-006** --- Une Pack Version doit avoir une version valide.
-   **RG-PM-007** --- Les dépendances requises doivent être résolues
    avant publication.
-   **RG-PM-008** --- Un cycle interdit bloque la publication.
-   **RG-PM-009** --- Une Capability requise doit être disponible.
-   **RG-PM-010** --- Une Feature incluse doit être compatible avec la
    composition.
-   **RG-PM-011** --- Une erreur de validation bloque READY.
-   **RG-PM-012** --- Une erreur de validation bloque PUBLISH.
-   **RG-PM-013** --- Le Manifest final est généré côté backend.
-   **RG-PM-014** --- Un Manifest publié est immuable.
-   **RG-PM-015** --- Une publication conserve la Pack Version exacte.
-   **RG-PM-016** --- Une publication conserve les références exactes
    des définitions.
-   **RG-PM-017** --- Business Manager reste propriétaire de la Business
    Definition.
-   **RG-PM-018** --- UI Builder reste propriétaire de la UI Definition.
-   **RG-PM-019** --- Automation reste propriétaire de la Automation
    Definition.
-   **RG-PM-020** --- Pack Manager possède la composition globale.
-   **RG-PM-021** --- Runtime reste propriétaire de l'exécution.
-   **RG-PM-022** --- Un Pack incompatible avec Runtime ne doit pas être
    activé silencieusement.
-   **RG-PM-023** --- Les secrets ne sont jamais intégrés directement au
    Manifest.
-   **RG-PM-024** --- Les permissions sont contrôlées côté backend.
-   **RG-PM-025** --- Le tenant ne peut pas être déterminé uniquement
    par le frontend.
-   **RG-PM-026** --- Une ancienne version publiée n'est pas modifiée
    pour un rollback.
-   **RG-PM-027** --- Un rollback cible une version publiée compatible.
-   **RG-PM-028** --- Une publication est auditée.
-   **RG-PM-029** --- Une dépendance cassée est explicitement signalée.
-   **RG-PM-030** --- Aucune donnée fictive n'est présentée comme réelle
    en mode REAL.

------------------------------------------------------------------------

# 69. MVP v2

Ordre recommandé :

1.  Audit PM actuel
2.  Gap Matrix
3.  Pack
4.  Pack Version
5.  SemVer
6.  Composition
7.  Modules
8.  Features
9.  Capabilities
10. Dependency Resolver
11. Rule Engine
12. Business Definition Integration
13. UI Definition Integration
14. Automation Definition Integration
15. Runtime Requirements
16. Validation Engine
17. Manifest Generator
18. Publication
19. Publication History
20. Runtime Bridge
21. Security Tests
22. E2E

------------------------------------------------------------------------

# 70. Phase 2

``` text
Dependency Graph avancé
Pack Comparison
Manifest Diff
Rollback assisté
Environment Publication
Compatibility Matrix
Publication Approval Workflow
Pack Templates
AI Pack Assistant
```

------------------------------------------------------------------------

# 71. Phase 3

``` text
Pack Marketplace
External Pack Registry
Signed Manifest
Advanced Supply Chain Security
Collaborative Pack Review
Cross-Pack Dependencies
Advanced Deployment Strategies
Canary / Staged Rollout
```

------------------------------------------------------------------------

# 72. Tests unitaires

Tester :

``` text
SemVer Parser
Version Validation
Dependency Resolver
Cycle Detection
Rule Engine
Capability Resolver
Feature Resolver
Runtime Compatibility
Manifest Builder
Manifest Validator
Publication Validator
```

------------------------------------------------------------------------

# 73. Tests d'intégration

``` text
Business Manager → Pack Manager
UI Builder → Pack Manager
Automation → Pack Manager

Business Manager
      +
UI Builder
      +
Automation
      ↓
Pack Manager
      ↓
Manifest
      ↓
Runtime
```

------------------------------------------------------------------------

# 74. Tests sécurité

Tester :

``` text
Cross-Tenant Pack Read
Cross-Tenant Pack Update
Cross-Tenant Dependency Modification
Cross-Tenant Manifest Read
Cross-Tenant Publication

Unauthorized Pack Creation
Unauthorized Validation
Unauthorized Manifest Generation
Unauthorized Publication
Unauthorized Rollback
```

------------------------------------------------------------------------

# 75. E2E principal

``` text
LOGIN
  ↓
BUSINESS MANAGER
  ↓
Application
  ↓
Application Version
  ↓
Business Definition READY
  ↓
UI BUILDER
  ↓
UI Definition READY
  ↓
AUTOMATION
  ↓
Automation Definition READY
  ↓
PACK MANAGER
  ↓
Open Pack
  ↓
Pack Version
  ↓
Composition
  ↓
Modules
  ↓
Features
  ↓
Capabilities
  ↓
Dependencies
  ↓
Rules
  ↓
Validate
  ↓
Manifest
  ↓
Publish
  ↓
PACK RUNTIME
  ↓
Manifest Loader
  ↓
Resolver
  ↓
Effective Configuration
  ↓
Runtime Context
  ↓
Application Active
```

------------------------------------------------------------------------

# 76. Organisation technique indicative

Backend :

``` text
backend/src/modules/pack-manager/
├── packs/
├── versions/
├── composition/
├── modules/
├── features/
├── capabilities/
├── dependencies/
├── rules/
├── validation/
├── manifest/
├── publication/
└── runtime-bridge/
```

Frontend :

``` text
frontend/src/components/pack-manager/
├── dashboard/
├── packs/
├── versions/
├── composition/
├── modules/
├── features/
├── capabilities/
├── dependencies/
├── rules/
├── validation/
├── manifest/
└── publication/
```

Cette organisation est indicative. Réutiliser les services, composants
et structures existants.

------------------------------------------------------------------------

# 77. Gap Matrix obligatoire

  Fonction         Existant    Backend   Frontend   Tests   Décision
  ---------------- ----------- --------- ---------- ------- ----------
  Pack             À auditer   ---       ---        ---     AUDIT
  Pack Version     À auditer   ---       ---        ---     AUDIT
  Modules          À auditer   ---       ---        ---     AUDIT
  Features         À auditer   ---       ---        ---     AUDIT
  Capabilities     À auditer   ---       ---        ---     AUDIT
  Dependencies     À auditer   ---       ---        ---     AUDIT
  Rules            À auditer   ---       ---        ---     AUDIT
  Manifest         À auditer   ---       ---        ---     AUDIT
  Publication      À auditer   ---       ---        ---     AUDIT
  Runtime Bridge   À auditer   ---       ---        ---     AUDIT

Ne jamais classer une fonction comme `MISSING` avant recherche réelle.

------------------------------------------------------------------------

# 78. Instructions Codex / Freebuff / IA

Avant de coder :

1.  se placer sur `main` ;
2.  vérifier l'état du workspace ;
3.  lire tous les CDC Pack Manager existants ;
4.  lire tous les CDC Pack Runtime ;
5.  lire le CDC Business Manager v2 ;
6.  lire le CDC UI Builder ;
7.  lire le CDC Automation ;
8.  rechercher toutes les implémentations Pack Manager ;
9.  rechercher PackVersion dans Prisma ;
10. rechercher Module, Feature, Capability ;
11. rechercher Dependency Resolver ;
12. rechercher Rule Engine ;
13. rechercher Manifest ;
14. rechercher Publication ;
15. rechercher Runtime Bridge ;
16. examiner IAM ;
17. examiner tenant isolation ;
18. examiner navigation/routing ;
19. examiner le design system ;
20. examiner les tests ;
21. produire la Gap Matrix ;
22. seulement ensuite modifier le code.

------------------------------------------------------------------------

# 79. Intégration du code historique

Ne jamais faire un merge aveugle d'une ancienne branche.

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
Ancient Guards
Ancient IAM
Ancient Tenant Handling
Ancient Prisma Schema
Ancient Backend Structure
Ancient Navigation
```

------------------------------------------------------------------------

# 80. Définition de DONE

Pack Manager v2 est DONE lorsque :

``` text
✓ Pack réel
✓ Pack Version réelle
✓ SemVer fonctionnel
✓ Composition fonctionnelle

✓ Business Definition intégrée
✓ UI Definition intégrée
✓ Automation Definition intégrée

✓ Modules fonctionnels
✓ Features fonctionnelles
✓ Capabilities fonctionnelles

✓ Dependencies fonctionnelles
✓ Dependency Resolver fonctionnel

✓ Rules fonctionnelles
✓ Rule Engine fonctionnel

✓ Runtime Compatibility vérifiée

✓ Validation Engine fonctionnel
✓ Validation Cockpit réel

✓ Manifest réel
✓ Manifest généré backend

✓ Publication réelle
✓ Publication History réelle

✓ Runtime Bridge fonctionnel

✓ Versions publiées immuables

✓ Tenant Isolation vérifiée
✓ IAM vérifié
✓ Audit vérifié

✓ Aucun faux statut Healthy
✓ Aucun mock silencieux en REAL mode

✓ Prisma validate PASS
✓ Prisma generate PASS
✓ Backend build PASS
✓ Frontend build PASS
✓ Tests PM PASS
✓ Tests Runtime Bridge PASS
✓ Tests Tenant PASS
✓ Recette navigateur PASS
```

------------------------------------------------------------------------

# 81. Principe produit final

``` text
BUSINESS MANAGER
      │
      │ définit le métier
      ▼
 UI BUILDER ───────── AUTOMATION
      │                   │
      │ expérience        │ processus
      │ utilisateur       │ automatiques
      └─────────┬─────────┘
                ▼
          PACK MANAGER
                │
                │ compose
                │ valide
                │ versionne
                │ manifeste
                │ publie
                ▼
           PACK RUNTIME
                │
                │ résout
                │ charge
                │ exécute
                ▼
       APPLICATION ACTIVE
```

Pack Manager n'est ni un second Business Manager ni le Runtime.

Il est le **gestionnaire de la version distribuable de l'application
Techzone Cloud**.

Il reçoit les artefacts validés des modules de construction, contrôle
leur composition, leurs dépendances et leur compatibilité, produit un
Manifest déterministe et publie cette composition vers Pack Runtime.

------------------------------------------------------------------------

# FIN DU CAHIER DES CHARGES

**Techzone Cloud --- Pack Manager v2.0**\
**Consolidation et extension de l'existant**
