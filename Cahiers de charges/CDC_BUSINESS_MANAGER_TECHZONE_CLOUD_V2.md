# CAHIER DES CHARGES --- TECHZONE CLOUD BUSINESS MANAGER

**Version :** 2.0 --- Consolidation et extension\
**Date :** Septembre 2026\
**Projet :** Techzone Cloud\
**Module :** Business Manager\
**Statut :** Spécification fonctionnelle et technique consolidée\
**Principe :** Continuité du Business Manager existant --- pas de
réécriture globale

------------------------------------------------------------------------

# 1. Objet du document

Le présent cahier des charges constitue une **mise à jour, une
consolidation et une extension** du Business Manager existant de
Techzone Cloud.

Il ne remplace pas l'implémentation actuelle.

La branche `main` et l'architecture fonctionnelle déjà opérationnelle
restent la **base canonique**.

Avant toute modification, l'équipe ou l'IA de développement doit auditer
l'existant et classer chaque exigence :

``` text
KEEP       → existant et fonctionnel : conserver
IMPROVE    → existant mais améliorable : améliorer
COMPLETE   → existant partiellement : compléter
ADAPT      → ancien code utile : adapter à l'architecture actuelle
IMPLEMENT  → réellement absent : développer
```

Aucune fonctionnalité fonctionnelle ne doit être réécrite simplement
parce que le présent CDC propose une organisation indicative différente.

------------------------------------------------------------------------

# 2. Vision

Business Manager est le **moteur de définition métier** de Techzone
Cloud.

Il permet de définir ce qu'une application métier contient et comprend :

-   application ;
-   versions ;
-   entités ;
-   champs ;
-   relations ;
-   fonctionnalités ;
-   capacités ;
-   permissions métier ;
-   configuration ;
-   métadonnées ;
-   événements métier ;
-   contrats d'intégration ;
-   règles de cohérence ;
-   validation.

Business Manager ne doit pas devenir un éditeur d'interface ou un moteur
de workflow.

------------------------------------------------------------------------

# 3. Position dans Techzone Cloud

``` text
BUSINESS MANAGER
Applications
Versions
Entités
Champs
Relations
Features
Capabilities
Configuration
Permissions
Business Events
Contracts
        │
        ├──────────────────────┐
        ▼                      ▼
   UI BUILDER              AUTOMATION
Pages                     Workflows
Components                Triggers
Bindings                  Conditions
Forms                     Actions
Actions UI                Schedules
        │                      │
        └──────────┬───────────┘
                   ▼
             PACK MANAGER
                   │
               Validation
               Manifest
               Publication
                   │
                   ▼
             PACK RUNTIME
                   │
                   ▼
          Application Runtime
```

------------------------------------------------------------------------

# 4. Répartition des responsabilités

## Business Manager

Répond à la question :

> Qu'est-ce que l'application gère et quelles capacités métier
> possède-t-elle ?

## UI Builder

Répond à :

> Comment l'utilisateur voit et utilise l'application ?

## Automation

Répond à :

> Que doit faire automatiquement le système lorsqu'un événement survient
> ?

## Pack Manager

Répond à :

> Quelle version complète de l'application est validée et publiable ?

## Pack Runtime

Répond à :

> Comment la version publiée est-elle chargée, résolue et exécutée ?

------------------------------------------------------------------------

# 5. Objectifs Business Manager

Business Manager doit permettre de :

-   créer une application métier ;
-   gérer son identité ;
-   créer et gérer ses versions ;
-   définir les modèles de données ;
-   créer les entités ;
-   définir les champs ;
-   créer les relations ;
-   définir les fonctionnalités ;
-   déclarer les capacités ;
-   déclarer les événements métier ;
-   référencer les permissions ;
-   gérer les configurations ;
-   gérer les métadonnées ;
-   exposer des contrats stables aux autres modules ;
-   valider la cohérence de la définition métier ;
-   détecter les références cassées ;
-   fournir une définition métier exploitable par UI Builder ;
-   fournir des événements et capacités à Automation ;
-   transmettre une définition validée au Pack Manager ;
-   fournir les informations nécessaires au Runtime ;
-   respecter IAM et l'isolation multi-tenant ;
-   conserver une traçabilité des changements significatifs.

------------------------------------------------------------------------

# 6. Périmètre conservé

Les domaines déjà développés doivent être conservés lorsqu'ils sont
fonctionnels :

``` text
Applications
Versions
Modèles de données
Entités
Champs
Relations
Fonctionnalités
Configuration
Permissions
Navigation métier existante
Validation
Audit
Tenant isolation
```

La v2 renforce principalement :

``` text
Application Version
Entity Registry
Field Registry
Relation Registry
Feature Registry
Capability Registry
Business Events
Metadata
Contracts
Reference Validation
Snapshots
Integration avec UI Builder
Integration avec Automation
Integration avec Pack Manager
Integration avec Runtime
```

------------------------------------------------------------------------

# 7. Ce qui ne relève plus du Business Manager

Business Manager ne doit pas reconstruire les responsabilités des autres
modules.

## UI Builder possède

``` text
Canvas
Pages visuelles
Layouts
Composants UI
Formulaires visuels
DataTable visuel
Theme
Responsive
Preview UI
Actions UI
```

## Automation possède

``` text
Workflow Builder
Triggers opérationnels
Conditions
Branches
Actions automatisées
Schedules
Execution History
Workflow Diagnostics
```

## Pack Manager possède

``` text
Packaging
Dependencies du Pack
Manifest global
Validation globale du Pack
Publication
```

## Runtime possède

``` text
Chargement du Pack publié
Résolution
Configuration effective
Caches Runtime
Exécution
Diagnostics Runtime
```

------------------------------------------------------------------------

# 8. Architecture fonctionnelle

Le Business Manager v2 est organisé autour des domaines suivants :

  Domaine              Responsabilité
  -------------------- --------------------------------
  Vue d'ensemble       Cockpit de l'application
  Applications         Identité des applications
  Versions             Versions de travail
  Modèles de données   Structure métier
  Entités              Objets métier
  Champs               Propriétés des entités
  Relations            Liens entre entités
  Fonctionnalités      Fonctions exposées
  Capacités            Capacités consommables
  Événements métier    Événements déclarés
  Navigation métier    Structure fonctionnelle
  Configuration        Paramètres métier
  Métadonnées          Description structurée
  Permissions          Références IAM
  Validation           Cohérence de la définition
  Contrats             Interfaces vers autres modules

------------------------------------------------------------------------

# 9. Navigation Business Manager

Navigation cible :

``` text
Business Manager
├── Vue d'ensemble
├── Applications
├── Modèles de données
├── Fonctionnalités
├── Navigation
├── Configuration
└── Validation & publication
```

Les versions peuvent être accessibles depuis l'application et le Context
Bar plutôt que de surcharger la navigation.

Les sous-écrans Entités, Champs, Relations, Events et Capabilities
peuvent être intégrés dans des workspaces contextuels.

------------------------------------------------------------------------

# 10. Contexte

Toute opération Business Manager s'effectue dans :

``` text
Tenant
   ↓
Application
   ↓
Application Version
   ↓
Business Definition
```

Context Bar recommandé :

``` text
TechBoutique / v1.2.0 / DRAFT
```

Le changement d'application ou de version doit recharger le contexte
sans mélanger les données.

------------------------------------------------------------------------

# 11. Vue d'ensemble

Le Dashboard Business Manager doit afficher des métriques réelles :

``` text
Entités
Champs
Relations
Fonctionnalités
Capacités
Événements
Erreurs
Warnings
```

Afficher également :

-   progression de la configuration ;
-   dernière modification ;
-   activité récente ;
-   éléments incomplets ;
-   problèmes de validation ;
-   version active ;
-   version en préparation.

CTA principal :

``` text
Continuer la configuration
```

------------------------------------------------------------------------

# 12. Applications

Une application représente une solution métier construite dans Techzone
Cloud.

Données principales :

``` text
id
tenantId
key
name
description
status
category
icon
metadata
createdBy
createdAt
updatedAt
```

Actions :

``` text
Créer
Modifier
Dupliquer
Archiver
Restaurer
Ouvrir
Créer une version
```

------------------------------------------------------------------------

# 13. Application Version

Une application peut avoir plusieurs versions.

Exemple :

``` text
TechBoutique

v1.0.0   PUBLISHED
v1.1.0   PUBLISHED
v1.2.0   DRAFT
```

Chaque version doit isoler sa définition.

Une modification de `v1.2.0` ne doit jamais modifier silencieusement
`v1.1.0`.

------------------------------------------------------------------------

# 14. Lifecycle des versions

Lifecycle indicatif :

``` text
DRAFT
  ↓
CONFIGURING
  ↓
VALIDATION
  ↓
READY
  ↓
PUBLISHED
  ↓
ARCHIVED
```

Aligner les valeurs finales sur les statuts déjà existants.

------------------------------------------------------------------------

# 15. Modèles de données

Business Manager doit permettre de construire le modèle métier.

Exemple :

``` text
Product
Category
Customer
Order
OrderItem
Invoice
Payment
```

Le modèle de données est la source de vérité consommée par UI Builder et
Automation.

------------------------------------------------------------------------

# 16. Entités

Une entité représente un objet métier.

Exemple :

``` text
Product
```

Propriétés indicatives :

``` text
id
tenantId
applicationVersionId

key
name
label
pluralLabel
description

status

metadata

createdAt
updatedAt
```

Une clé stable doit permettre aux autres modules de référencer l'entité.

------------------------------------------------------------------------

# 17. Entity Registry

Business Manager doit fournir un registre des entités disponibles.

Exemple :

``` json
{
  "key": "Product",
  "label": "Produit",
  "status": "ACTIVE",
  "capabilities": [
    "CREATE",
    "READ",
    "UPDATE",
    "DELETE"
  ]
}
```

Le Registry permet notamment :

-   UI Builder binding ;
-   Automation binding ;
-   validation ;
-   Runtime resolution ;
-   génération assistée par IA.

------------------------------------------------------------------------

# 18. Champs

Une entité possède des champs.

Exemple :

``` text
Product

id
name
description
price
stock
categoryId
active
createdAt
```

Types possibles selon le moteur réel :

``` text
STRING
TEXT
INTEGER
DECIMAL
BOOLEAN
DATE
DATETIME
ENUM
UUID
RELATION
JSON
```

------------------------------------------------------------------------

# 19. Field Registry

Chaque champ expose notamment :

``` text
key
label
type
required
nullable
unique
defaultValue
readOnly
metadata
```

Exemple :

``` json
{
  "entity": "Product",
  "key": "price",
  "label": "Prix",
  "type": "DECIMAL",
  "required": true
}
```

------------------------------------------------------------------------

# 20. Contraintes de champs

Selon les capacités réellement supportées :

``` text
required
nullable
unique
min
max
minLength
maxLength
pattern
default
enum
```

Les contraintes backend restent l'autorité.

UI Builder peut les exploiter pour améliorer l'expérience utilisateur.

------------------------------------------------------------------------

# 21. Relations

Relations possibles :

``` text
ONE_TO_ONE
ONE_TO_MANY
MANY_TO_ONE
MANY_TO_MANY
```

Exemple :

``` text
Category
   │
   └── Products

Order
   │
   └── OrderItems
```

Chaque relation doit avoir une identité stable et être validable.

------------------------------------------------------------------------

# 22. Relation Registry

Exemple :

``` json
{
  "key": "product.category",
  "source": "Product",
  "target": "Category",
  "type": "MANY_TO_ONE",
  "required": true
}
```

UI Builder et Automation doivent pouvoir découvrir les relations sans
les redéfinir.

------------------------------------------------------------------------

# 23. Fonctionnalités

Une Feature représente une fonctionnalité métier activable ou
disponible.

Exemples :

``` text
catalog
inventory
orders
customers
invoicing
payments
```

Une feature peut regrouper plusieurs capacités.

------------------------------------------------------------------------

# 24. Feature Registry

Exemple :

``` json
{
  "key": "inventory",
  "name": "Gestion du stock",
  "status": "ENABLED",
  "capabilities": [
    "stock.read",
    "stock.adjust"
  ]
}
```

Le registre doit être consommable par :

``` text
UI Builder
Automation
Pack Manager
Runtime
```

------------------------------------------------------------------------

# 25. Capabilities

Une Capability décrit une capacité technique ou métier offerte par
l'application.

Exemples :

``` text
product.create
product.update
product.archive

order.validate

invoice.generate

stock.adjust
```

Une Capability n'est pas nécessairement une permission utilisateur.

Elle indique ce que l'application ou un module est capable d'effectuer.

------------------------------------------------------------------------

# 26. Capability Registry

Exemple :

``` json
{
  "key": "order.validate",
  "feature": "orders",
  "entity": "Order",
  "type": "COMMAND"
}
```

Automation peut utiliser ces capacités pour déterminer les actions
disponibles.

------------------------------------------------------------------------

# 27. Permissions

Business Manager référence les permissions IAM.

Exemples :

``` text
product.read
product.create
product.update
product.delete

order.read
order.validate
```

Business Manager ne doit pas créer un second système IAM.

IAM reste l'autorité pour :

``` text
Identités
Utilisateurs
Rôles
Permissions
Accès
Contexte tenant
```

------------------------------------------------------------------------

# 28. Business Events

La v2 introduit ou formalise un **Business Event Registry**.

Un Business Event représente un événement métier que d'autres modules
peuvent consommer.

Exemples :

``` text
ProductCreated
ProductUpdated

OrderCreated
OrderUpdated
OrderStatusChanged
OrderValidated

InvoiceCreated
PaymentReceived
```

------------------------------------------------------------------------

# 29. Event Registry

Exemple :

``` json
{
  "key": "order.created",
  "name": "Commande créée",
  "entity": "Order",
  "type": "ENTITY_EVENT",
  "payloadSchema": {
    "orderId": "UUID"
  }
}
```

Automation peut alors proposer :

``` text
Trigger
→ Order Created
```

sans recréer la définition de l'événement.

------------------------------------------------------------------------

# 30. Event Payload Contract

Chaque événement doit exposer un contrat.

Exemple :

``` json
{
  "event": "order.created",
  "payload": {
    "id": "uuid",
    "status": "string",
    "total": "decimal"
  }
}
```

Le contrat doit être versionnable lorsque nécessaire.

------------------------------------------------------------------------

# 31. Navigation métier

Business Manager peut définir la **structure fonctionnelle** de
navigation.

Exemple :

``` text
Catalogue
├── Produits
└── Catégories

Ventes
├── Commandes
└── Clients
```

Business Manager définit principalement :

``` text
key
label
feature
permission
parent
businessTarget
```

UI Builder définit principalement :

``` text
presentation
icon
layout
page
visual order
responsive behavior
```

Il ne doit pas y avoir deux sources de vérité concurrentes.

------------------------------------------------------------------------

# 32. Configuration

Business Manager gère les paramètres métier de l'application.

Exemples :

``` text
Currency
Tax behavior
Order numbering
Stock behavior
Invoice settings
Business thresholds
Feature settings
```

------------------------------------------------------------------------

# 33. Chaîne de configuration

La configuration suit le pipeline :

``` text
Definition
    ↓
Schema
    ↓
Scope
    ↓
Values
    ↓
Inheritance / Override
    ↓
Validation
    ↓
Resolution
    ↓
Snapshot
    ↓
Runtime Consumption
```

------------------------------------------------------------------------

# 34. Configuration Definition

Décrit le paramètre.

Exemple :

``` json
{
  "key": "currency",
  "type": "STRING",
  "default": "MGA",
  "required": true
}
```

------------------------------------------------------------------------

# 35. Configuration Scope

Prévoir uniquement les scopes réellement supportés.

Conceptuellement :

``` text
PLATFORM
TENANT
APPLICATION
APPLICATION_VERSION
ENVIRONMENT
```

Les règles d'héritage doivent être déterministes.

------------------------------------------------------------------------

# 36. Configuration Resolution

Exemple conceptuel :

``` text
Platform Default
       ↓
Tenant Override
       ↓
Application Override
       ↓
Version Override
       ↓
Environment Override
       ↓
Effective Configuration
```

Le Runtime consomme la configuration effective, pas une combinaison
improvisée côté frontend.

------------------------------------------------------------------------

# 37. Configuration Snapshot

Lorsqu'une version devient publiable, la configuration nécessaire doit
pouvoir être figée ou référencée de façon déterministe.

Objectif :

``` text
Même Pack
+ même contexte
= même configuration attendue
```

selon les règles de Runtime définies.

------------------------------------------------------------------------

# 38. Metadata Manager

Les métadonnées permettent de décrire les éléments métier sans
multiplier les colonnes spécifiques.

Exemples :

``` text
description
category
tags
documentation
display hints
integration hints
```

Les métadonnées ne doivent pas devenir un stockage JSON non gouverné.

Chaque usage important doit avoir un contrat.

------------------------------------------------------------------------

# 39. Contrats

Business Manager doit exposer des contrats stables aux modules
consommateurs.

Principaux contrats :

``` text
Application Contract
Application Version Contract

Entity Contract
Field Contract
Relation Contract

Feature Contract
Capability Contract

Business Event Contract

Configuration Contract

Permission Reference Contract
```

------------------------------------------------------------------------

# 40. Consumer Contracts

Consommateurs principaux :

``` text
UI Builder
Automation
Pack Manager
Runtime
AI Assistant
```

Chaque consommateur doit pouvoir demander la définition sans accéder
directement à des structures internes non garanties.

------------------------------------------------------------------------

# 41. Intégration UI Builder

UI Builder consomme notamment :

``` text
Application
Application Version

Entities
Fields
Relations

Features
Capabilities

Permissions

Configuration Metadata
```

Exemple :

``` text
Business Manager

Product
├── name
├── price
├── stock
└── category

        ↓

UI Builder

Product Form
Product DataTable
Product Detail
```

UI Builder ne redéfinit pas `Product`.

------------------------------------------------------------------------

# 42. Intégration Automation

Automation consomme :

``` text
Entities
Fields
Relations

Business Events

Features
Capabilities

Permissions
```

Exemple :

``` text
Business Manager

Event:
order.created

        ↓

Automation

Trigger:
Order Created

        ↓

Condition:
total > 500000

        ↓

Action:
order.validate
```

------------------------------------------------------------------------

# 43. Intégration Pack Manager

Pack Manager reçoit une définition métier validée.

Exemple conceptuel :

``` text
Application Version
├── Business Definition
├── UI Definition
├── Automation Definition
└── Configuration
          ↓
         PACK
```

Business Manager ne remplace pas Pack Manager.

------------------------------------------------------------------------

# 44. Business Definition

Structure indicative :

``` json
{
  "schemaVersion": "2.0",
  "application": {},
  "version": {},
  "entities": [],
  "relations": [],
  "features": [],
  "capabilities": [],
  "events": [],
  "configuration": {},
  "metadata": {}
}
```

La structure finale doit respecter les conventions réellement
implémentées.

------------------------------------------------------------------------

# 45. Intégration Runtime

Runtime doit pouvoir exploiter une définition publiée sans dépendre d'un
état DRAFT du Business Manager.

``` text
Published Pack
      ↓
Business Definition
      ↓
Runtime Registry
      ↓
Runtime Context
```

------------------------------------------------------------------------

# 46. Immutabilité

Une version publiée ne doit pas être modifiée directement.

``` text
v1.0 PUBLISHED
       │
       └── immutable

v1.1 DRAFT
       │
       └── editable
```

Pour modifier une version publiée, créer une nouvelle version selon le
workflow projet.

------------------------------------------------------------------------

# 47. Références cassées

Exemple :

UI Builder référence :

``` text
Product.oldPrice
```

puis Business Manager supprime le champ.

Le système ne doit pas supprimer silencieusement la référence.

Il doit produire :

``` text
BROKEN_REFERENCE
```

ou un code équivalent.

Même règle pour :

``` text
Automation
Navigation
Feature
Capability
Event
Configuration
```

------------------------------------------------------------------------

# 48. Dependency Impact Analysis

Avant une modification destructrice, Business Manager doit idéalement
pouvoir indiquer :

``` text
Supprimer Product.price ?

Utilisé par :

UI Builder
  ProductForm
  ProductTable

Automation
  PriceValidation

Configuration
  pricing.default

[Annuler] [Voir les dépendances]
```

Pour le MVP, cette capacité peut commencer par une validation
post-modification si l'analyse préventive complète est trop coûteuse.

------------------------------------------------------------------------

# 49. Validation Engine

Business Manager doit disposer d'un moteur de validation.

Contrôles principaux :

``` text
Application valide
Version valide

Entity valide
Field valide
Relation valide

Feature valide
Capability valide

Event valide

Permission reference valide

Configuration valide

No duplicate key
No invalid relation
No broken reference
```

------------------------------------------------------------------------

# 50. Niveaux de validation

``` text
ERROR
WARNING
INFO
```

Une erreur bloquante empêche le passage à `READY`.

------------------------------------------------------------------------

# 51. Validation Cockpit

Exemple :

``` text
Validation Business Manager

✓ Application valide
✓ 12 entités valides
✓ 84 champs valides
✓ 18 relations valides
✓ 9 features valides
✓ 23 capabilities valides

⚠ 2 warnings
✕ 1 error
```

Chaque problème doit idéalement ouvrir l'élément concerné.

------------------------------------------------------------------------

# 52. Publication

Le menu historique peut rester nommé :

``` text
Validation & publication
```

si cela correspond à l'UX actuelle.

Cependant, il faut distinguer :

``` text
Business Manager
→ valide sa Business Definition

Pack Manager
→ valide et publie le Pack complet
```

Business Manager ne doit pas créer une seconde chaîne de publication
globale concurrente.

------------------------------------------------------------------------

# 53. Modèle de données conceptuel

``` text
BusinessApplication

ApplicationVersion

BusinessEntity
BusinessField
BusinessRelation

BusinessFeature
BusinessCapability

BusinessEvent

BusinessNavigationItem

ConfigurationDefinition
ConfigurationValue

BusinessMetadata

BusinessValidation
BusinessRevision
```

Les noms finaux doivent réutiliser les modèles existants lorsqu'ils sont
déjà présents.

------------------------------------------------------------------------

# 54. Relations conceptuelles

``` text
Tenant
  │
  └── Application
        │
        └── ApplicationVersion
              │
              ├── Entity
              │    ├── Field
              │    └── Relation
              │
              ├── Feature
              │    └── Capability
              │
              ├── BusinessEvent
              │
              ├── Navigation
              │
              ├── Configuration
              │
              ├── Validation
              │
              └── Revision
```

------------------------------------------------------------------------

# 55. Prisma

Le schéma ci-dessus est **conceptuel**.

Avant toute migration :

``` text
1. lire schema.prisma actuel ;
2. identifier les modèles existants ;
3. réutiliser les modèles compatibles ;
4. compléter uniquement les champs/relations nécessaires ;
5. respecter les conventions UUID ;
6. respecter tenantId ;
7. respecter les FK composites existantes ;
8. respecter indexes et contraintes uniques ;
9. créer une migration additive contrôlée.
```

Ne jamais remplacer aveuglément le schéma Prisma existant.

------------------------------------------------------------------------

# 56. API indicative

Le préfixe réel doit suivre l'architecture existante.

Exemples conceptuels :

## Applications

``` http
GET    /applications
POST   /applications
GET    /applications/:id
PATCH  /applications/:id
```

## Versions

``` http
GET  /applications/:id/versions
POST /applications/:id/versions
GET  /versions/:id
PATCH /versions/:id
```

## Entities

``` http
GET    /versions/:id/entities
POST   /versions/:id/entities
GET    /entities/:id
PATCH  /entities/:id
DELETE /entities/:id
```

## Fields

``` http
GET    /entities/:id/fields
POST   /entities/:id/fields
PATCH  /fields/:id
DELETE /fields/:id
```

## Relations

``` http
GET  /versions/:id/relations
POST /versions/:id/relations
PATCH /relations/:id
DELETE /relations/:id
```

## Features / Capabilities / Events

``` http
GET /versions/:id/features
GET /versions/:id/capabilities
GET /versions/:id/events
```

## Validation

``` http
POST /versions/:id/validate
GET  /versions/:id/validation
```

------------------------------------------------------------------------

# 57. API Contracts pour consommateurs

Prévoir des endpoints/services permettant aux modules de récupérer des
définitions propres.

Exemples conceptuels :

``` http
GET /versions/:id/business-definition

GET /versions/:id/entity-registry

GET /versions/:id/feature-registry

GET /versions/:id/capability-registry

GET /versions/:id/event-registry

GET /versions/:id/configuration-schema
```

Ne créer ces routes que si elles s'intègrent aux conventions existantes.

------------------------------------------------------------------------

# 58. Sécurité

Toutes les opérations doivent respecter :

``` text
Authentication
Tenant Context
Permissions
DTO Validation
Audit
```

Le frontend ne constitue jamais l'autorité de sécurité.

------------------------------------------------------------------------

# 59. Isolation tenant

Chaque ressource doit être correctement scopée.

Tester au minimum :

``` text
Application
Version
Entity
Field
Relation
Feature
Capability
Event
Configuration
Validation
```

Un utilisateur du Tenant B ne doit pas accéder aux ressources du Tenant
A.

------------------------------------------------------------------------

# 60. Permissions indicatives

Réutiliser IAM.

Exemples :

``` text
business.read
business.create
business.update
business.delete

business.application.create
business.application.update

business.entity.create
business.entity.update
business.entity.delete

business.configuration.update

business.validate
```

Les permissions finales doivent s'aligner sur celles déjà présentes dans
le projet.

------------------------------------------------------------------------

# 61. Audit

Événements significatifs possibles :

``` text
APPLICATION_CREATED
APPLICATION_UPDATED

VERSION_CREATED
VERSION_STATUS_CHANGED

ENTITY_CREATED
ENTITY_UPDATED
ENTITY_DELETED

FIELD_CREATED
FIELD_UPDATED
FIELD_DELETED

RELATION_CREATED
RELATION_DELETED

FEATURE_UPDATED
CAPABILITY_UPDATED

BUSINESS_EVENT_CREATED

CONFIGURATION_UPDATED

BUSINESS_VALIDATED
BUSINESS_READY
```

Ne pas auditer chaque interaction visuelle mineure.

------------------------------------------------------------------------

# 62. Révisions

Prévoir ou renforcer un mécanisme permettant de retracer les
modifications importantes d'une Business Definition.

Conceptuellement :

``` text
Revision
Snapshot
Author
Date
Description
```

La stratégie réelle doit tenir compte du système de versionnement déjà
présent.

------------------------------------------------------------------------

# 63. UI/UX

Le Business Manager conserve l'identité visuelle Techzone Cloud :

-   fond clair slate/bleu ;
-   surfaces blanches ;
-   bleu Techzone comme couleur primaire ;
-   texte slate ;
-   bordures fines ;
-   radius 10--12 px ;
-   ombres très discrètes ;
-   densité professionnelle ;
-   icônes cohérentes ;
-   états vides explicites ;
-   erreurs visibles ;
-   CTA clairs.

------------------------------------------------------------------------

# 64. Workspace

Les écrans détaillés doivent privilégier un workspace cohérent.

Exemple :

``` text
TechBoutique / v1.2.0 / DRAFT

Product

Overview
Fields
Relations
Features
Events
Dependencies
```

Éviter une succession de pages sans contexte.

------------------------------------------------------------------------

# 65. États UX

Tous les écrans doivent gérer :

``` text
Loading
Loaded
Empty
Error
Unauthorized
Forbidden
Saving
Saved
Validation Error
```

Pas d'écran blanc silencieux.

------------------------------------------------------------------------

# 66. Micro-interactions

Utiliser des animations légères :

``` text
120–250 ms
```

Pour :

-   tabs ;
-   drawers ;
-   modals ;
-   menus ;
-   sélection ;
-   save indicator ;
-   validation ;
-   changement de workspace.

Respecter `prefers-reduced-motion`.

------------------------------------------------------------------------

# 67. Responsive

Desktop : workspace complet.

Laptop : panneaux compacts.

Tablet : navigation secondaire rétractable.

Mobile : priorité à la consultation et aux modifications simples.

Les opérations complexes de modélisation n'ont pas besoin d'être aussi
confortables sur smartphone que sur Desktop.

------------------------------------------------------------------------

# 68. Performance

Priorités :

``` text
Pagination
Debounced search
Lazy loading
Avoid unnecessary rerenders
Efficient registry loading
Efficient dependency checks
Efficient validation
```

Les grands modèles métier ne doivent pas bloquer l'interface.

------------------------------------------------------------------------

# 69. Observabilité

Lorsque pertinent :

``` text
requestId
traceId
tenantId
userId
applicationId
applicationVersionId
entityId
```

Les erreurs doivent être traçables entre frontend, backend et services
d'intégration.

------------------------------------------------------------------------

# 70. Assistant IA Business Manager

Le Business Manager doit être préparé pour une assistance IA contrôlée.

Exemples :

> Crée un modèle de gestion des produits avec catégories et stock.

> Ajoute une relation entre Commande et Client.

> Propose les champs nécessaires pour une facture.

L'IA produit des **propositions structurées**, pas des modifications
silencieuses.

------------------------------------------------------------------------

# 71. AI Operations

Exemple :

``` json
{
  "operation": "CREATE_ENTITY",
  "entity": {
    "key": "Product",
    "label": "Produit"
  }
}
```

Pipeline :

``` text
Prompt
  ↓
AI Proposal
  ↓
Structured Operations
  ↓
Validation
  ↓
Preview Diff
  ↓
Accept / Reject
  ↓
Business Definition
```

------------------------------------------------------------------------

# 72. Contexte IA

L'IA peut recevoir :

``` text
Application
Version

Existing Entities
Fields
Relations

Features
Capabilities
Events

Configuration

Permissions

Validation results
```

Elle ne doit pas inventer silencieusement des capacités inexistantes
dans Runtime.

------------------------------------------------------------------------

# 73. Règles de gestion

-   **RG-BM-001** --- Toute application appartient à un tenant.
-   **RG-BM-002** --- Toute Application Version appartient à une
    application.
-   **RG-BM-003** --- Les ressources Business Manager sont isolées par
    tenant.
-   **RG-BM-004** --- Une clé d'entité est unique dans le scope défini
    par l'architecture.
-   **RG-BM-005** --- Une clé de champ est unique dans son entité.
-   **RG-BM-006** --- Une relation référence uniquement des entités
    valides.
-   **RG-BM-007** --- Une Feature possède une clé stable.
-   **RG-BM-008** --- Une Capability doit être déclarée avant d'être
    consommée lorsqu'un registre de capacités est utilisé.
-   **RG-BM-009** --- Un Business Event possède une clé stable et un
    contrat valide.
-   **RG-BM-010** --- Les permissions sont référencées depuis IAM et non
    recréées dans Business Manager.
-   **RG-BM-011** --- Une erreur bloquante empêche le passage à READY.
-   **RG-BM-012** --- Une version publiée ne doit pas être modifiée
    directement.
-   **RG-BM-013** --- Une modification DRAFT ne modifie pas une version
    publiée.
-   **RG-BM-014** --- Les suppressions produisant des références cassées
    doivent être détectables.
-   **RG-BM-015** --- UI Builder consomme les modèles BM sans les
    dupliquer.
-   **RG-BM-016** --- Automation consomme les Events et Capabilities BM
    sans redéfinir la structure métier.
-   **RG-BM-017** --- Business Manager ne possède pas les workflows
    Automation.
-   **RG-BM-018** --- Business Manager ne possède pas les composants
    visuels UI Builder.
-   **RG-BM-019** --- Pack Manager reste responsable de la publication
    globale du Pack.
-   **RG-BM-020** --- Runtime consomme uniquement des définitions
    compatibles avec la version publiée.
-   **RG-BM-021** --- Les configurations doivent être validées avant
    consommation Runtime.
-   **RG-BM-022** --- Les clés utilisées comme contrats inter-modules
    doivent rester stables ou suivre une migration explicite.
-   **RG-BM-023** --- Les données envoyées par le frontend ne
    déterminent jamais seules le tenant autorisé.
-   **RG-BM-024** --- Les modifications importantes sont auditables.
-   **RG-BM-025** --- Aucun mock silencieux ne doit remplacer des
    données métier réelles en mode REAL.

------------------------------------------------------------------------

# 74. MVP de consolidation v2

La priorité n'est pas de reconstruire Business Manager.

Ordre recommandé :

``` text
1. Audit du BM actuel
2. Gap Matrix
3. Stabilisation Applications
4. Stabilisation Versions
5. Stabilisation Entity/Field/Relation Registry
6. Feature Registry
7. Capability Registry
8. Business Event Registry
9. Configuration Contracts
10. Reference Validation
11. UI Builder Contract
12. Automation Contract
13. Pack Manager Contract
14. Runtime Contract
15. Validation Cockpit
16. Tests E2E
```

------------------------------------------------------------------------

# 75. Évolutions ultérieures

Après consolidation :

``` text
Dependency Impact Analysis avancé

Schema Diff

Version Comparison

Migration Assistant

AI Data Modeling

AI Validation Assistant

Reusable Business Templates

Business Definition Marketplace

Advanced Metadata Governance
```

------------------------------------------------------------------------

# 76. Tests unitaires

Tester notamment :

``` text
Entity Validation
Field Validation
Relation Validation

Feature Registry
Capability Registry

Business Event Validation

Configuration Resolution

Reference Validation

Version Lifecycle

Business Definition Serialization
```

------------------------------------------------------------------------

# 77. Tests d'intégration

Tester :

``` text
IAM → Business Manager

Business Manager → UI Builder

Business Manager → Automation

Business Manager → Pack Manager

Pack Manager → Runtime
```

------------------------------------------------------------------------

# 78. Tests sécurité

Tester :

``` text
Cross-Tenant Application Access
Cross-Tenant Version Access
Cross-Tenant Entity Access

Unauthorized Entity Modification

Unauthorized Configuration Update

Unauthorized Validation

Invalid Permission Reference

Malformed Business Definition
```

------------------------------------------------------------------------

# 79. Parcours E2E

``` text
Login
  ↓
Business Manager
  ↓
Créer Application
  ↓
Créer Version
  ↓
Créer Entity Product
  ↓
Créer Fields
  ↓
Créer Category
  ↓
Créer Relation
  ↓
Créer Feature Catalog
  ↓
Créer Capabilities
  ↓
Déclarer Business Events
  ↓
Configurer
  ↓
Valider Business Definition
  ↓
UI Builder
  ↓
Construire UI
  ↓
Automation
  ↓
Construire Workflow
  ↓
Pack Manager
  ↓
Validation
  ↓
Manifest
  ↓
Publication
  ↓
Runtime
```

------------------------------------------------------------------------

# 80. Critères d'acceptation

La consolidation Business Manager v2 est fonctionnelle lorsqu'un
utilisateur peut :

1.  ouvrir une application existante ;
2.  conserver les données et fonctions BM déjà développées ;
3.  créer une nouvelle version ;
4.  définir des entités ;
5.  définir des champs ;
6.  définir des relations ;
7.  gérer les fonctionnalités ;
8.  déclarer des capacités ;
9.  déclarer des événements métier ;
10. gérer la configuration ;
11. référencer les permissions IAM ;
12. détecter les références invalides ;
13. valider la Business Definition ;
14. fournir les modèles à UI Builder ;
15. fournir Events et Capabilities à Automation ;
16. transmettre une définition valide au Pack Manager ;
17. permettre au Runtime de consommer la définition publiée ;
18. préserver l'isolation tenant ;
19. préserver IAM ;
20. préserver l'audit ;
21. passer les tests backend/frontend ;
22. réussir la recette navigateur.

------------------------------------------------------------------------

# 81. Instruction impérative pour Codex / Freebuff / IA

Avant toute modification :

``` text
1. Considérer `main` comme base canonique.

2. Lire tous les CDC Business Manager présents dans le repository.

3. Auditer le code Business Manager actuel.

4. Auditer les routes frontend existantes.

5. Auditer les APIs backend existantes.

6. Auditer Prisma.

7. Auditer IAM et Tenant Context.

8. Auditer les tests.

9. Auditer les intégrations déjà présentes.

10. Comparer l'existant au présent CDC.

11. Produire une Gap Matrix.

12. Seulement ensuite commencer l'implémentation.
```

------------------------------------------------------------------------

# 82. Gap Matrix obligatoire

Format :

  Fonction          Existant    État                  Décision
  ----------------- ----------- --------------------- ----------
  Applications      Oui         Fonctionnel           KEEP
  Versions          Oui         Partiel               COMPLETE
  Entités           Oui         Fonctionnel           KEEP
  Champs            Oui         Fonctionnel           KEEP
  Relations         Oui         Partiel               COMPLETE
  Features          Oui         Fonctionnel           KEEP
  Capabilities      À auditer   ---                   AUDIT
  Business Events   À auditer   ---                   AUDIT
  Configuration     Oui         Partiel/Fonctionnel   AUDIT
  Validation        Oui         À renforcer           IMPROVE

Ne jamais conclure `MANQUANT` avant d'avoir recherché l'implémentation
réelle.

------------------------------------------------------------------------

# 83. Règle de continuité

Le présent CDC est une **continuation**.

Il ne faut pas :

``` text
supprimer le BM actuel ;
reconstruire toutes les pages ;
remplacer les APIs fonctionnelles ;
remplacer les modèles Prisma existants ;
changer arbitrairement les routes ;
recréer IAM ;
recréer le tenant context ;
dupliquer Pack Manager ;
dupliquer UI Builder ;
dupliquer Automation.
```

Il faut :

``` text
CONSERVER
      ↓
STABILISER
      ↓
COMPLÉTER
      ↓
CONNECTER
      ↓
VALIDER
```

------------------------------------------------------------------------

# 84. Définition de DONE

Business Manager v2 est DONE lorsque :

``` text
✓ Existant préservé
✓ Applications fonctionnelles
✓ Versions fonctionnelles
✓ Entités fonctionnelles
✓ Champs fonctionnels
✓ Relations fonctionnelles
✓ Features fonctionnelles
✓ Capabilities disponibles
✓ Business Events disponibles
✓ Configuration fonctionnelle
✓ Permissions IAM intégrées
✓ Business Definition validable
✓ Références cassées détectables
✓ UI Builder connecté
✓ Automation connecté
✓ Pack Manager connecté
✓ Runtime compatible
✓ Multi-tenant testé
✓ Audit fonctionnel
✓ Aucun mock silencieux en REAL mode
✓ Backend build PASS
✓ Frontend build PASS
✓ Tests PASS
✓ Recette navigateur PASS
```

------------------------------------------------------------------------

# 85. Principe produit final

Business Manager doit rester le **socle métier** de Techzone Cloud.

``` text
BUSINESS MANAGER
      │
      │ définit le métier
      │
      ├───────────────┐
      ▼               ▼
 UI BUILDER       AUTOMATION
      │               │
      │ expérience    │ processus
      │ utilisateur   │ automatiques
      └───────┬───────┘
              ▼
        PACK MANAGER
              │
              ▼
           RUNTIME
```

La v2 ne remplace donc pas le Business Manager existant.

Elle le transforme progressivement en une **source de vérité métier
stable, versionnée et consommable par l'ensemble de la plateforme
Techzone Cloud**, tout en préservant les fonctionnalités déjà
développées.

------------------------------------------------------------------------

# FIN DU CAHIER DES CHARGES

**Techzone Cloud --- Business Manager v2.0**\
**Consolidation et extension de l'existant**
