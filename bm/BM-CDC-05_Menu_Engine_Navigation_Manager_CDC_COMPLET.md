# CAHIER DES CHARGES — BUSINESS MANAGER
## BM-CDC-05 — Menu Engine & Navigation Manager
### Gestion versionnée des menus, de la navigation, des routes, de la visibilité et des exigences fonctionnelles

**Projet :** Techzone Cloud — Business Manager  
**Référence :** `BM-CDC-05`  
**Priorité :** P0  
**Prérequis :** BM-CDC-01 / BM-CDC-02 Application/Version Manager, BM-CDC-04 Feature & Capability Manager  
**Dépendance indirecte :** BM-CDC-03 Data Model Manager  
**Livrable :** Base de données + Backend + Frontend + Navigation Resolver + Validation + Preview + Tests + Documentation

---

## 1. Contexte

Après BM-CDC-01 / BM-CDC-02, BM-CDC-03 et BM-CDC-04, Business Manager connaît :

```text
BM-CDC-01 / BM-CDC-02
Application
└── ApplicationVersion

BM-CDC-03
Data Model
├── Entities
├── Fields
└── Relations

BM-CDC-04
Features
└── Capabilities
```

Exemple :

```text
Application : Boutique Mode & Chaussures
Version     : 1.1.0

Features :
PRODUCT
SALE
STOCK
CUSTOMER

Capabilities :
product.read
product.create
sale.read
sale.create
sale.refund
stock.read
stock.adjust
customer.read
customer.create
```

Il manque maintenant la manière dont l'utilisateur accède à ces fonctionnalités.

C'est le rôle de **BM-CDC-05 Menu Engine**.

---

## 2. Objectif général

BM-CDC-05 doit répondre à :

> **Quelle navigation une version d'application expose-t-elle, où est-elle affichée, dans quel ordre, vers quelle destination et sous quelles conditions fonctionnelles ?**

La chaîne devient :

```text
ApplicationVersion
        ↓
Features / Capabilities
        ↓
Menu Configuration
        ↓
Navigation Structure
        ↓
Validation
        ↓
Navigation Resolver
        ↓
Resolved Navigation
        ↓
Web / Mobile / APK
```

---

## 3. Principe architectural

BM-CDC-05 ne doit pas devenir un simple CRUD :

```text
Menu
MenuItem
```

Il doit devenir un véritable **moteur de navigation versionné**.

Il doit être capable de transformer :

```text
ApplicationVersion
+
Features
+
Capabilities
+
Menu Configuration
```

en :

```text
Navigation réellement exploitable
```

---

## 4. Position de BM-CDC-05

```text
BM-CDC-01 / BM-CDC-02 — Application / Version
                ↓
BM-CDC-03 — Data Model
                ↓
BM-CDC-04 — Feature & Capability
                ↓
BM-CDC-05 — Menu Engine
                ↓
Navigation Resolver
                ↓
Web / Mobile / APK
```

BM-CDC-05 **consomme** les Features et Capabilities BM-CDC-04.

Il ne doit pas recréer son propre système de Capabilities.

---

## 5. Exemple concret

BM-CDC-04 définit :

```text
SALE

sale.read
sale.create
sale.cancel
sale.refund
```

BM-CDC-05 définit :

```text
Ventes
│
├── Nouvelle vente
│   ├── /sales/new
│   └── requires sale.create
│
├── Historique
│   ├── /sales
│   └── requires sale.read
│
├── Annulations
│   ├── /sales/cancelled
│   └── requires sale.cancel
│
└── Retours
    ├── /sales/returns
    └── requires sale.refund
```

---

## 6. Périmètre fonctionnel

BM-CDC-05 doit gérer au minimum :

1. Menu Catalog
2. Menu Locations
3. Menu Items
4. Hiérarchie Parent/Child
5. Ordre d'affichage
6. Drag & Drop
7. Navigation Targets
8. Routes
9. Icônes
10. Feature Requirements
11. Capability Requirements
12. ANY / ALL Requirements
13. Activation par `ApplicationVersion`
14. États Visible / Disabled / Hidden
15. Parents vides
16. Validation de hiérarchie
17. Validation des routes
18. Validation BM-CDC-04
19. Impact Analysis
20. Clone/Duplicate
21. Preview Desktop/Mobile
22. Navigation Resolver
23. Snapshot
24. Snapshot Hash
25. ActivityEvent
26. Optimistic locking
27. Protection des versions publiées
28. Recherche, filtres et pagination
29. Tests Backend
30. Tests Frontend

---

## 7. Concepts fondamentaux

### 7.1 Menu

Un `Menu` représente un ensemble de navigation.

Exemples :

```text
MAIN_NAVIGATION
ADMIN_NAVIGATION
MOBILE_NAVIGATION
USER_NAVIGATION
```

Un Menu contient plusieurs `MenuItem`.

---

## 8. Menu Location

Un Menu peut être destiné à différentes zones.

```prisma
enum MenuLocation {
  SIDEBAR
  TOPBAR
  BOTTOM_NAV
  USER_MENU
  CONTEXT_MENU
  QUICK_ACTIONS
}
```

### SIDEBAR
Navigation principale desktop.

### TOPBAR
Navigation horizontale supérieure.

### BOTTOM_NAV
Navigation mobile inférieure.

### USER_MENU
Menu utilisateur/profil.

### CONTEXT_MENU
Navigation contextuelle.

### QUICK_ACTIONS
Actions rapides.

---

## 9. Exemple Desktop

```text
SIDEBAR

Dashboard
Produits
Ventes
Stock
Clients
Achats
Rapports
Paramètres
```

---

## 10. Exemple Mobile/APK

```text
BOTTOM_NAV

Accueil
Ventes
Produits
Stock
Plus
```

BM-CDC-05 peut donc alimenter plusieurs interfaces à partir du même moteur.

---

## 11. MenuItem

Un `MenuItem` représente un élément de navigation.

Exemples :

```text
Produits
Nouvelle vente
Historique
Stock
Inventaire
Rapports
```

Un MenuItem peut :

- ouvrir une route ;
- ouvrir une URL ;
- déclencher une action ;
- servir uniquement de parent.

---

## 12. MenuItem ≠ Page

Il est important de ne pas imposer :

```text
MenuItem = Page
```

Exemple :

```text
Ventes
├── Nouvelle vente
├── Historique
└── Retours
```

`Ventes` peut être un simple parent sans route propre.

---

## 13. Navigation Target

Chaque MenuItem possède un type de destination.

```prisma
enum NavigationTargetType {
  ROUTE
  EXTERNAL_URL
  ACTION
  NONE
}
```

---

## 14. ROUTE

Exemple :

```text
label  = Produits
target = ROUTE
route  = /products
```

---

## 15. EXTERNAL_URL

Exemple :

```text
Documentation
→ EXTERNAL_URL
```

Une URL externe doit être validée côté backend.

---

## 16. ACTION

Exemple :

```text
Déconnexion
→ ACTION
→ logout
```

ou :

```text
Synchroniser
→ ACTION
→ sync
```

Les actions disponibles doivent idéalement provenir d'un catalogue autorisé.

---

## 17. NONE

Utilisé pour un élément parent.

```text
Ventes
→ NONE

├── Nouvelle vente
└── Historique
```

---

## 18. Mode d'ouverture

Prévoir :

```prisma
enum NavigationOpenMode {
  SAME_VIEW
  NEW_TAB
  MODAL
  DRAWER
}
```

Exemple :

```text
Produits
→ SAME_VIEW

Documentation
→ NEW_TAB

Nouvelle vente rapide
→ MODAL
```

---

## 19. Menu Catalog

L'utilisateur doit pouvoir :

- créer un Menu ;
- modifier ;
- consulter ;
- rechercher ;
- filtrer ;
- dupliquer ;
- archiver ;
- voir les versions qui l'utilisent ;
- voir son historique.

---

## 20. Champs Menu

Structure recommandée :

```text
id
code
name
description
location
status
sourceType
createdBy
createdAt
updatedAt
archivedAt
version
```

---

## 21. Menu Status

```prisma
enum MenuStatus {
  DRAFT
  ACTIVE
  DEPRECATED
  ARCHIVED
}
```

---

## 22. Menu Source

```prisma
enum MenuSourceType {
  SYSTEM
  PACK
  CUSTOM
  GENERATED
}
```

---

## 23. Menu Items — données

Structure recommandée :

```text
id
menuId
parentId
code
label
labelKey
description
iconKey
targetType
route
externalUrl
actionKey
openMode
state
sortOrder
hideWhenEmpty
createdBy
createdAt
updatedAt
archivedAt
version
```

---

## 24. Hiérarchie

`MenuItem.parentId` permet une relation récursive.

```text
Commerce
│
├── Produits
│   ├── Liste
│   └── Nouveau produit
│
├── Ventes
│   ├── Nouvelle vente
│   └── Historique
│
└── Stock
    ├── État
    └── Inventaire
```

---

## 25. Profondeur maximale

Recommandation :

```text
maxDepth = 3
```

Exemple acceptable :

```text
Commerce              niveau 1
└── Ventes            niveau 2
    └── Retours       niveau 3
```

Erreur :

```text
MAX_DEPTH_EXCEEDED
```

---

## 26. Self Parent interdit

Interdit :

```text
A.parentId = A.id
```

Erreur :

```text
MENU_ITEM_SELF_PARENT
```

---

## 27. Cycle interdit

Interdit :

```text
A
└── B
    └── C
        └── A
```

Erreur :

```text
MENU_HIERARCHY_CYCLE
```

---

## 28. Élément orphelin

Le système doit détecter un `parentId` inexistant ou appartenant à un autre Menu.

Erreur :

```text
ORPHAN_MENU_ITEM
```

---

## 29. Ordre

Chaque MenuItem possède :

```text
sortOrder
```

Exemple :

```text
10 Dashboard
20 Produits
30 Ventes
40 Stock
50 Clients
```

---

## 30. Drag & Drop

Le frontend doit permettre de :

- réordonner ;
- déplacer sous un autre parent ;
- remonter au niveau racine.

Après déplacement, le backend doit revalider :

```text
parent
depth
cycle
sortOrder
version editability
```

---

## 31. Icônes

Utiliser :

```text
iconKey
```

Exemples :

```text
shopping-cart
package
users
warehouse
settings
chart-bar
```

Éviter le HTML/SVG arbitraire en base.

---

## 32. États MenuItem

```prisma
enum MenuItemState {
  ENABLED
  DISABLED
  HIDDEN
}
```

### ENABLED
Visible et utilisable.

### DISABLED
Visible mais non utilisable.

### HIDDEN
Non affiché dans la navigation résolue.

---

## 33. `hideWhenEmpty`

Un parent peut avoir :

```text
hideWhenEmpty = true
```

Si aucun enfant n'est disponible, il disparaît automatiquement.

---

## 34. Relation avec BM-CDC-04

BM-CDC-05 ne crée pas de Feature ou Capability.

Il référence celles de BM-CDC-04.

---

## 35. Feature Requirement

Un MenuItem peut dépendre d'une Feature.

Exemple :

```text
Ventes

requiresFeature:
SALE
```

Si `SALE` n'est pas active dans `ApplicationVersion`, l'item devient indisponible.

---

## 36. Capability Requirement

Exemple :

```text
Nouvelle vente

requires:
sale.create
```

BM-CDC-05 doit vérifier :

```text
Capability existe ?
        ↓
ACTIVE globalement ?
        ↓
Active dans ApplicationVersion ?
```

---

## 37. Plusieurs Capabilities

Un MenuItem peut exiger plusieurs Capabilities.

Exemple :

```text
Rapports financiers

report.read
finance.read
```

---

## 38. Requirement Mode

```prisma
enum RequirementMode {
  ALL
  ANY
}
```

### ALL

Toutes les Capabilities sont nécessaires.

### ANY

Au moins une est nécessaire.

---

## 39. Frontière avec IAM

```text
BM-CDC-04
Cette version possède-t-elle sale.create ?
        ↓
BM-CDC-05
Ce MenuItem nécessite-t-il sale.create ?
        ↓
IAM
Cet utilisateur a-t-il accès à sale.create ?
```

BM-CDC-05 décrit les exigences. IAM détermine l'autorisation utilisateur.

---

## 40. Résolution future avec IAM

À terme :

```text
MenuItem
      ↓
Feature Requirement
      ↓
Capability Requirement
      ↓
ApplicationVersion
      ↓
IAM User Context
      ↓
VISIBLE / DISABLED / HIDDEN
```

---

## 41. Version Menu

Table recommandée :

```text
version_menus
```

Champs :

```text
id
applicationVersionId
menuId
enabled
configuration
createdBy
createdAt
updatedAt
version
```

Contrainte :

```text
UNIQUE(applicationVersionId, menuId)
```

---

## 42. Pourquoi versionner l'affectation

Une nouvelle version peut ajouter ou retirer des éléments sans modifier la version publiée précédente.

---

## 43. Version MenuItem

Table recommandée :

```text
version_menu_items
```

Elle permet de modifier pour une version :

```text
state
sortOrder
configuration
```

sans modifier le catalogue global.

---

## 44. Pourquoi `VersionMenuItem`

```text
MenuItem
= définition globale

VersionMenuItem
= configuration dans ApplicationVersion
```

---

## 45. Modèle de données recommandé

Tables principales :

```text
menus
menu_items
version_menus
version_menu_items
menu_item_feature_requirements
menu_item_capability_requirements
```

BM-CDC-05 consomme également :

```text
applications
application_versions
features
capabilities
version_features
version_capabilities
activity_events
```

---

## 46. Relations principales

```text
ApplicationVersion
        │
        └── VersionMenu
                │
                └── Menu
                     │
                     └── MenuItem
                          │
                          ├── children
                          ├── FeatureRequirement
                          └── CapabilityRequirement
```

---

## 47. Contraintes DB

Minimum :

```text
Menu.code UNIQUE

MenuItem:
UNIQUE(menuId, code)

VersionMenu:
UNIQUE(applicationVersionId, menuId)

VersionMenuItem:
UNIQUE(applicationVersionId, menuItemId)

FeatureRequirement:
UNIQUE(menuItemId, featureId)

CapabilityRequirement:
UNIQUE(menuItemId, capabilityId)
```

---

## 48. Intégrité référentielle

Les suppressions physiques doivent rester limitées. Pour les éléments déjà utilisés par des versions publiées, privilégier l'archivage et `Restrict`.

---

## 49. Validation du Menu

Contrôler :

```text
Menu existe
Code valide
Status compatible
Location valide
ApplicationVersion modifiable
```

---

## 50. Validation MenuItem

Contrôler :

```text
Menu existe
Code unique dans Menu
Parent valide
Parent dans même Menu
Pas self-parent
Pas cycle
Max depth respecté
Target valide
Route valide
Action valide
Feature requirements valides
Capability requirements valides
```

---

## 51. Validation Route

Pour :

```text
targetType = ROUTE
```

`route` devient obligatoire.

Erreurs :

```text
ROUTE_REQUIRED
ROUTE_INVALID
```

---

## 52. Validation External URL

Pour `EXTERNAL_URL`, `externalUrl` doit être valide et utiliser un protocole autorisé.

---

## 53. Validation ACTION

Pour `ACTION`, `actionKey` doit exister dans un catalogue d'actions autorisées.

---

## 54. Détection de routes dupliquées

Code :

```text
DUPLICATE_ROUTE
```

Peut produire `WARNING` ou `ERROR` selon le contexte.

---

## 55. Validation Feature

Si une Feature requise n'est pas disponible dans BM-CDC-04 :

```text
MENU_FEATURE_NOT_AVAILABLE
```

---

## 56. Validation Capability

Si une Capability requise n'est pas active dans la version :

```text
MENU_CAPABILITY_NOT_AVAILABLE
```

---

## 57. Validation ALL

```text
RequirementMode = ALL

A ✓
B ✓
C ✗
```

Résultat :

```text
NOT SATISFIED
```

---

## 58. Validation ANY

```text
RequirementMode = ANY

A ✗
B ✓
C ✗
```

Résultat :

```text
SATISFIED
```

---

## 59. Validation globale

```text
ApplicationVersion
        ↓
Validate VersionMenu
        ↓
Validate Menus
        ↓
Validate MenuItems
        ↓
Validate Hierarchy
        ↓
Validate Depth
        ↓
Validate Targets
        ↓
Validate Routes
        ↓
Validate Features
        ↓
Validate Capabilities
        ↓
Validate Requirement Modes
        ↓
Detect Empty Parents
        ↓
Generate Result
```

---

## 60. Niveaux de validation

```text
ERROR
WARNING
INFO
```

---

## 61. Codes d'erreur

```text
MENU_NOT_FOUND
MENU_CODE_EXISTS
MENU_ARCHIVED
MENU_ITEM_NOT_FOUND
MENU_ITEM_CODE_EXISTS
MENU_ITEM_ARCHIVED
MENU_ITEM_SELF_PARENT
INVALID_PARENT
ORPHAN_MENU_ITEM
MENU_HIERARCHY_CYCLE
MAX_DEPTH_EXCEEDED
ROUTE_REQUIRED
ROUTE_INVALID
DUPLICATE_ROUTE
EXTERNAL_URL_REQUIRED
EXTERNAL_URL_INVALID
ACTION_REQUIRED
ACTION_NOT_ALLOWED
FEATURE_NOT_FOUND
MENU_FEATURE_NOT_AVAILABLE
CAPABILITY_NOT_FOUND
MENU_CAPABILITY_NOT_AVAILABLE
INVALID_REQUIREMENT_MODE
VERSION_NOT_FOUND
VERSION_NOT_EDITABLE
VERSION_MENU_NOT_FOUND
VERSION_CONFLICT
VALIDATION_FAILED
```

---

## 62. Impact Analysis

Avant une modification destructive, BM-CDC-05 doit calculer son impact.

Exemple :

```text
Archive MenuItem
Ventes
```

Impact :

```text
5 enfants
7 capability mappings
1 feature requirement
3 versions
```

---

## 63. Impact d'une Capability BM-CDC-04

Si `sale.refund` est dépréciée, BM-CDC-05 doit afficher où elle est utilisée.

---

## 64. Backend Impact Service

```text
MenuImpactService
```

Fonctions :

```text
getMenuImpact()
getMenuItemImpact()
getCapabilityImpact()
getFeatureImpact()
getRouteImpact()
```

---

## 65. Clonage Menu

Le clone doit recopier :

```text
Menu
MenuItems
Hierarchy
Order
Targets
Feature requirements
Capability requirements
Configuration
```

avec de nouveaux IDs.

---

## 66. Clonage de version

Lors de la création d'une nouvelle version, BM-CDC-05 doit pouvoir recopier :

```text
VersionMenus
VersionMenuItems
```

sans modifier la version publiée précédente.

---

## 67. Preview

Le module doit fournir :

```text
[ Desktop ]
[ Mobile ]
```

et éventuellement Tablet plus tard.

---

## 68. Preview Desktop

La preview doit représenter fidèlement la hiérarchie, l'ordre et les états des items.

---

## 69. Preview Mobile

La preview mobile doit refléter notamment `BOTTOM_NAV` et `QUICK_ACTIONS`.

---

## 70. Preview selon configuration

La Preview doit refléter :

```text
Menu Location
MenuItem state
Hierarchy
sortOrder
Feature requirements
Capability requirements
hideWhenEmpty
```

---

## 71. Navigation Resolver

Service central :

```text
NavigationResolver
```

Entrée :

```text
ApplicationVersion
MenuLocation
Feature configuration
Capability configuration
```

Sortie :

```text
ResolvedNavigation
```

---

## 72. Fonctionnement du Resolver

```text
ApplicationVersion
        ↓
Load active Menu
        ↓
Load MenuItems
        ↓
Apply VersionMenuItem configuration
        ↓
Resolve Features
        ↓
Resolve Capabilities
        ↓
Apply state
        ↓
Remove hidden items
        ↓
Remove empty parents
        ↓
Sort items
        ↓
Build tree
        ↓
Resolved Navigation
```

---

## 73. Exemple de navigation résolue

Configuration :

```text
SALE ✓
sale.read   ✓
sale.create ✓
sale.refund ✗
```

Menu :

```text
Ventes
├── Nouvelle vente → sale.create
├── Historique     → sale.read
└── Retours        → sale.refund
```

Résultat :

```text
Ventes
├── Nouvelle vente
└── Historique
```

---

## 74. Parent vide

Si tous les enfants sont indisponibles et `hideWhenEmpty = true`, le parent est retiré du résultat.

---

## 75. Resolved Navigation JSON

```json
{
  "location": "SIDEBAR",
  "items": [
    {
      "code": "sales",
      "label": "Ventes",
      "iconKey": "shopping-cart",
      "children": [
        {
          "code": "sales.new",
          "label": "Nouvelle vente",
          "targetType": "ROUTE",
          "route": "/sales/new",
          "openMode": "SAME_VIEW"
        }
      ]
    }
  ]
}
```

---

## 76. API Runtime Navigation

```text
GET /runtime/navigation
```

Paramètre possible :

```text
location=SIDEBAR
```

---

## 77. API Preview Navigation

```text
GET /application-versions/:versionId/navigation/preview
```

Paramètres :

```text
location
device
```

---

## 78. Snapshot

BM-CDC-05 doit générer un snapshot déterministe de la navigation.

---

## 79. Snapshot Hash

Ajouter :

```text
snapshotHash
```

Deux configurations identiques doivent produire le même hash logique.

---

## 80. Snapshot et BM-CDC-01 / BM-CDC-02

BM-CDC-05 contribue au snapshot global de `ApplicationVersion`.

```text
ApplicationVersion Snapshot
├── BM-CDC-03 Data Model
├── BM-CDC-04 Features & Capabilities
└── BM-CDC-05 Navigation
```

---

## 81. Version publiée

Si :

```text
ApplicationVersion.status = PUBLISHED
```

BM-CDC-05 devient :

```text
READ ONLY
```

Erreur backend :

```text
VERSION_NOT_EDITABLE
```

---

## 82. Optimistic Locking

Les ressources modifiables importantes utilisent :

```text
version Int @default(1)
```

Un conflit retourne :

```text
409 VERSION_CONFLICT
```

---

## 83. Transactions

Les opérations complexes doivent être transactionnelles.

Exemple Drag & Drop :

```text
BEGIN
 ↓
Validate parent
 ↓
Validate hierarchy
 ↓
Update parent
 ↓
Update sort orders
 ↓
Create ActivityEvent
 ↓
COMMIT
```

Sinon :

```text
ROLLBACK
```

---

## 84. ActivityEvent

Réutiliser le système BM-CDC-01 / BM-CDC-02.

Événements :

```text
menu.created
menu.updated
menu.cloned
menu.archived
menu_item.created
menu_item.updated
menu_item.moved
menu_item.archived
menu.feature_requirement.added
menu.feature_requirement.removed
menu.capability_requirement.added
menu.capability_requirement.removed
version.menu.enabled
version.menu.disabled
navigation.validated
navigation.snapshot.generated
```

---

## 85. Backend — MenuService

```text
createMenu()
getMenu()
listMenus()
updateMenu()
archiveMenu()
cloneMenu()
getUsage()
getVersions()
```

---

## 86. Backend — MenuItemService

```text
createMenuItem()
getMenuItem()
listMenuItems()
updateMenuItem()
archiveMenuItem()
moveMenuItem()
reorderMenuItems()
getChildren()
getAncestors()
getDescendants()
```

---

## 87. Backend — RequirementService

```text
addFeatureRequirement()
removeFeatureRequirement()
addCapabilityRequirement()
removeCapabilityRequirement()
setRequirementMode()
validateRequirements()
```

---

## 88. Backend — VersionMenuService

```text
enableMenu()
disableMenu()
configureMenuItem()
cloneVersionNavigation()
getVersionMenus()
getVersionMenuItems()
```

---

## 89. Backend — ValidationService

```text
validateMenu()
validateMenuItems()
validateHierarchy()
detectCycles()
validateDepth()
validateTargets()
validateRoutes()
detectDuplicateRoutes()
validateFeatures()
validateCapabilities()
validateRequirements()
validateAll()
```

---

## 90. Backend — NavigationResolver

```text
resolveNavigation()
resolveMenu()
resolveMenuItem()
evaluateFeatureRequirements()
evaluateCapabilityRequirements()
removeHiddenItems()
removeEmptyParents()
sortTree()
buildTree()
```

---

## 91. Backend — SnapshotService

```text
generateNavigationSnapshot()
calculateSnapshotHash()
compareSnapshot()
```

---

## 92. API Menu

```text
GET    /menus
POST   /menus
GET    /menus/:id
PATCH  /menus/:id
POST   /menus/:id/clone
POST   /menus/:id/archive
GET    /menus/:id/usage
```

---

## 93. API Menu Items

```text
GET    /menus/:menuId/items
POST   /menus/:menuId/items
GET    /menu-items/:id
PATCH  /menu-items/:id
POST   /menu-items/:id/move
POST   /menu-items/:id/archive
```

---

## 94. API Reorder

```text
POST /menus/:menuId/items/reorder
```

Exemple :

```json
{
  "items": [
    {
      "id": "item-1",
      "parentId": null,
      "sortOrder": 10
    },
    {
      "id": "item-2",
      "parentId": "item-1",
      "sortOrder": 10
    }
  ]
}
```

---

## 95. API Requirements

Features :

```text
GET    /menu-items/:id/features
POST   /menu-items/:id/features
DELETE /menu-items/:id/features/:featureId
```

Capabilities :

```text
GET    /menu-items/:id/capabilities
POST   /menu-items/:id/capabilities
DELETE /menu-items/:id/capabilities/:capabilityId
```

---

## 96. API Version Menus

```text
GET  /application-versions/:versionId/menus
POST /application-versions/:versionId/menus/:menuId/enable
POST /application-versions/:versionId/menus/:menuId/disable
```

---

## 97. API Validation

```text
POST /application-versions/:versionId/navigation/validate
```

Réponse conceptuelle :

```json
{
  "valid": false,
  "errors": 2,
  "warnings": 1,
  "issues": [
    {
      "severity": "ERROR",
      "code": "MENU_CAPABILITY_NOT_AVAILABLE",
      "menuItem": "sales.refund",
      "capability": "sale.refund"
    }
  ]
}
```

---

## 98. API Impact

```text
GET /menu-items/:id/impact
GET /menus/:id/impact
```

---

## 99. API Snapshot

```text
GET /application-versions/:versionId/navigation/snapshot
```

---

## 100. Interface principale

```text
BUSINESS MANAGER
└── Menu Engine

Application : Boutique Mode & Chaussures
Version     : 1.1.0
Status      : CONFIGURING

[ Vue générale ]
[ Menus ]
[ Arborescence ]
[ Exigences ]
[ Preview ]
[ Validation ]
[ Historique ]
```

---

## 101. Onglet Vue générale

Afficher :

```text
MENUS                       3
MENU ITEMS                 27
ROUTES                     19
FEATURE REQUIREMENTS        6
CAPABILITY REQUIREMENTS    14
HIDDEN ITEMS                3
ERRORS                      2
WARNINGS                    1
```

Puis :

```text
Navigation Status

Hierarchy        ✓
Routes           ✓
Features         ✓
Capabilities     ✗
Snapshot         Outdated

Overall
NOT READY
```

---

## 102. Onglet Menus

```text
MENUS

[ Recherche____________ ] [Location ▼] [Status ▼] [+ Nouveau Menu]

MAIN
Navigation principale
SIDEBAR
ACTIVE
18 items

MOBILE
Navigation mobile
BOTTOM_NAV
ACTIVE
5 items

USER
Menu utilisateur
USER_MENU
ACTIVE
4 items
```

---

## 103. Fiche Menu

Sous-onglets :

```text
[ Général ]
[ Items ]
[ Versions ]
[ Impact ]
[ Historique ]
```

---

## 104. Onglet Arborescence

```text
NAVIGATION PRINCIPALE

☰ Dashboard

☰ Produits
   ├── ☰ Liste
   ├── ☰ Nouveau produit
   └── ☰ Catégories

☰ Ventes
   ├── ☰ Nouvelle vente
   ├── ☰ Historique
   └── ☰ Retours

☰ Stock
   ├── ☰ État du stock
   └── ☰ Inventaire

☰ Clients
```

---

## 105. Panneau MenuItem

```text
MENU ITEM

Label
Nouvelle vente

Code
sales.new

Icon
plus-circle

Target
ROUTE

Route
/sales/new

Open Mode
SAME_VIEW

State
ENABLED

Hide when empty
No
```

---

## 106. Panneau Exigences

```text
FUNCTIONAL REQUIREMENTS

Feature
SALE

Capabilities
Mode
ALL

✓ sale.create
```

---

## 107. Feedback BM-CDC-04

Afficher clairement si une Capability est disponible ou non dans la version sélectionnée.

---

## 108. Drag & Drop UX

Après déplacement, le frontend attend la validation serveur et restaure la position précédente en cas d'erreur.

---

## 109. Preview

```text
PREVIEW

Location:
[ Sidebar ▼ ]

Device:
[ Desktop ] [ Mobile ]

Mode:
[ Configuration ] [ Resolved ]
```

---

## 110. Configuration vs Resolved

### Configuration
Montre tous les items configurés.

### Resolved
Montre uniquement la navigation réellement disponible après résolution.

---

## 111. Onglet Validation

```text
NAVIGATION VALIDATION
Version 1.1.0

Menus
✓ 3/3

Hierarchy
✓

Routes
⚠ 1 warning

Features
✓

Capabilities
✗ 2 errors

Empty Parents
✓

Snapshot
OUTDATED

Overall
INVALID
```

---

## 112. Détails erreur

Chaque erreur doit proposer un accès direct à l'item ou à la Capability concernée.

---

## 113. Historique

Filtres :

```text
Actor
Event
Target
Menu
Result
Date
```

---

## 114. Recherche

Menus :

```text
search
status
location
sourceType
```

MenuItems :

```text
search
state
targetType
parent
capability
feature
```

---

## 115. Pagination

Le catalogue Menu est paginé côté serveur.  
L'arborescence peut être récupérée comme arbre complet si sa taille reste raisonnable.

---

## 116. Sécurité

Toutes les mutations utilisent le contexte IAM.

---

## 117. Protection des actions

`actionKey` doit référencer une action connue et ne doit jamais permettre l'exécution de code arbitraire.

---

## 118. Performance

Le `NavigationResolver` doit être conçu pour être appelé fréquemment.

---

## 119. Cache futur

Préparer conceptuellement une clé de cache basée sur :

```text
applicationVersionId
+
menuLocation
+
navigationSnapshotHash
```

L'implémentation Redis n'est pas obligatoire.

---

## 120. i18n — préparation

Prévoir :

```text
label
labelKey
```

Exemple :

```text
labelKey = menu.sales
```

---

## 121. Badges — extension future

Préparer éventuellement :

```text
badgeType
badgeSource
badgeConfig
```

mais les badges dynamiques ne sont pas obligatoires en BM-CDC-05 initial.

---

## 122. Quick Actions

Grâce à :

```text
MenuLocation = QUICK_ACTIONS
```

le même moteur peut gérer :

```text
+ Nouvelle vente
+ Nouveau client
+ Ajouter produit
```

---

## 123. Seed obligatoire

Créer au minimum :

```text
MAIN
location = SIDEBAR

MOBILE
location = BOTTOM_NAV
```

---

## 124. Seed Requirements

Exemples :

```text
Produits
requiresFeature PRODUCT

Liste produits
requires product.read

Nouveau produit
requires product.create

Ventes
requiresFeature SALE

Nouvelle vente
requires sale.create

Historique
requires sale.read

Retours
requires sale.refund

Stock
requiresFeature STOCK

État
requires stock.read

Inventaire
requires stock.inventory
```

---

## 125. Tests Backend — Menu

```text
Create Menu
Update Menu
Duplicate code rejected
Archive Menu
Clone Menu
List/Search/Filter
```

---

## 126. Tests Backend — MenuItem

```text
Create root item
Create child item
Update item
Archive item
Self parent rejected
Invalid parent rejected
Cross-menu parent rejected
Cycle rejected
Max depth rejected
Reorder
Move
```

---

## 127. Tests Backend — Navigation Targets

```text
ROUTE valid
ROUTE missing rejected
Invalid route rejected
EXTERNAL_URL valid
Missing URL rejected
ACTION valid
Unknown action rejected
NONE accepted
```

---

## 128. Tests Backend — Requirements

```text
Feature requirement
Capability requirement
ALL success
ALL failure
ANY success
ANY failure
Unavailable Feature detected
Unavailable Capability detected
```

---

## 129. Tests Backend — Resolver

```text
Enabled item returned
Hidden item removed
Disabled item handled correctly
Unavailable Capability item removed
Unavailable Feature item removed
Empty parent removed
Items sorted
Tree correctly built
```

---

## 130. Tests Backend — Version

```text
Enable Menu
Disable Menu
Version MenuItem override
Clone version navigation
Published version mutation rejected
Optimistic locking
```

---

## 131. Tests Backend — Snapshot

```text
Generate snapshot
Same config → same hash
Changed config → different hash
ActivityEvent generated
```

---

## 132. Tests Frontend

Tester :

```text
Overview
Menu list
Create Menu
Edit Menu
Clone Menu
Tree rendering
Create MenuItem
Edit MenuItem
Drag & Drop
Reorder
Change parent
Feature selector
Capability selector
ALL / ANY
Desktop Preview
Mobile Preview
Configuration Preview
Resolved Preview
Validation report
Navigate to error
Impact dialog
History
Read-only published version
```

---

## 133. États UX obligatoires

```text
Loading
Empty
Error
Success
Disabled
Read Only
```

---

## 134. Scénario recette 1 — création simple

```text
Créer MAIN
       ↓
Location SIDEBAR
       ↓
Ajouter Ventes
       ↓
Ajouter Nouvelle vente
       ↓
Route /sales/new
       ↓
Requirement sale.create
       ↓
Validate
       ↓
SUCCESS
```

---

## 135. Scénario recette 2 — Capability indisponible

```text
Retours
requires sale.refund

sale.refund
DISABLED dans v1.1
       ↓
VALIDATE
       ↓
ERROR
MENU_CAPABILITY_NOT_AVAILABLE
```

---

## 136. Scénario recette 3 — résolution

Configuration :

```text
Ventes
├── Nouvelle vente → sale.create ✓
├── Historique     → sale.read ✓
└── Retours        → sale.refund ✗
```

Resolved :

```text
Ventes
├── Nouvelle vente
└── Historique
```

---

## 137. Scénario recette 4 — Parent vide

```text
Rapports
├── Finance → unavailable
└── Stock   → unavailable

hideWhenEmpty = true
```

Résultat :

```text
Rapports
→ absent
```

---

## 138. Scénario recette 5 — Cycle

```text
A
└── B
    └── C
```

Puis :

```text
A.parent = C
```

Résultat :

```text
DENIED
MENU_HIERARCHY_CYCLE
```

---

## 139. Scénario recette 6 — profondeur

```text
A
└── B
    └── C
        └── D
```

avec :

```text
maxDepth = 3
```

Résultat :

```text
MAX_DEPTH_EXCEEDED
```

---

## 140. Scénario recette 7 — nouvelle version

Une nouvelle version clone la navigation précédente, puis peut être modifiée sans toucher à la version publiée.

---

## 141. Scénario recette 8 — version publiée

Toute mutation sur une version `PUBLISHED` doit retourner :

```text
VERSION_NOT_EDITABLE
```

---

## 142. Scénario recette 9 — ALL

```text
Rapports financiers

ALL
├── report.read ✓
└── finance.read ✗
```

Résultat :

```text
NOT AVAILABLE
```

---

## 143. Scénario recette 10 — ANY

```text
Administration rapports

ANY
├── report.admin ✗
└── system.admin ✓
```

Résultat :

```text
AVAILABLE
```

---

## 144. Critères de DONE

BM-CDC-05 est DONE lorsque :

```text
✓ DB + migrations
✓ Seed
✓ Menu Catalog
✓ Menu Locations
✓ MenuItem CRUD
✓ Parent/Child
✓ Max Depth
✓ Cycle Detection
✓ Ordering
✓ Drag & Drop
✓ Navigation Targets
✓ ROUTE
✓ EXTERNAL_URL
✓ ACTION
✓ NONE
✓ Open Mode
✓ Icons
✓ Feature Requirements
✓ Capability Requirements
✓ ALL / ANY
✓ VersionMenu
✓ VersionMenuItem
✓ Visibility states
✓ hideWhenEmpty
✓ Impact Analysis
✓ Navigation Validation
✓ Route Validation
✓ BM-CDC-04 Validation
✓ Navigation Resolver
✓ Desktop Preview
✓ Mobile Preview
✓ Resolved Preview
✓ Snapshot
✓ SnapshotHash
✓ ActivityEvent
✓ Optimistic locking
✓ Published version protection
✓ Backend complet
✓ Frontend complet
✓ Loading / Empty / Error states
✓ Tests Backend
✓ Tests Frontend
✓ Build PASS
✓ Démonstration fonctionnelle
```

---

## 145. Éléments préparés mais non obligatoires BM-CDC-05

```text
Dynamic badges avancés
Full i18n
User simulation IAM avancée
Rules Engine complexe
Redis
Context menus avancés
AI-generated menus
Analytics de navigation
```

---

## 146. Résultat final attendu

Pour une `ApplicationVersion`, BM-CDC-05 doit pouvoir configurer, valider et résoudre automatiquement une navigation Web/Mobile cohérente avec BM-CDC-04.

---

## 147. Validation finale BM-CDC-05

```text
BM-CDC-05 — MENU ENGINE

Menu Definition           ✓
Hierarchy                 ✓
Routes                    ✓
Navigation Targets        ✓
Features                  ✓
Capabilities              ✓
Requirements              ✓
Version Configuration     ✓
Navigation Resolver       ✓
Preview                   ✓
Snapshot                  ✓

Errors                    0
Warnings                  0

STATUS
READY
```

---

## 148. Définition finale de BM-CDC-05

Le **Menu Engine BM-CDC-05** n'est pas simplement un gestionnaire de menus.

Il constitue :

```text
               ApplicationVersion
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
            BM-CDC-04                BM-CDC-05
     Features/Capabilities    Menu Definition
             │                   │
             └─────────┬─────────┘
                       ▼
              Navigation Resolver
                       │
                 IAM Context
                  (ultérieur)
                       │
                       ▼
               Resolved Navigation
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
            WEB                 APK
         Sidebar             Bottom Nav
         Topbar              Quick Actions
```

**BM-CDC-05 est terminé lorsque Business Manager peut configurer, valider, prévisualiser, versionner et résoudre automatiquement la navigation réelle d'une `ApplicationVersion`, en fonction du contrat fonctionnel défini par BM-CDC-04.**
---

# 149. Répartition Team 3 — Avotra

## Avotra — Frontend fonctionnel

Responsabilités principales :

```text
Vue générale Menu Engine
Menu Catalog
Création / modification Menu
MenuItem CRUD
Formulaires MenuItem
Feature selector
Capability selector
ALL / ANY Requirements
Recherche / filtres / pagination
Panneau exigences
Validation report
Historique
Loading / Empty / Error states
Responsive
Intégration API
```

Livrables attendus :

```text
✓ Écrans utilisables depuis l'interface Web
✓ Formulaires avec validation
✓ Connexion aux API BM-CDC-05
✓ Gestion des erreurs backend
✓ Navigation vers les erreurs de validation
✓ États UX complets
✓ Tests frontend du périmètre
```

---

# 150. Répartition Team 3 — Belardo

## Belardo — Frontend Architecture & UX complexe

Responsabilités principales :

```text
Architecture frontend BM-CDC-05
Arborescence Menu
Drag & Drop
Reorder
Change Parent
Visualisation hiérarchique
Panneau MenuItem
Preview Desktop
Preview Mobile
Configuration Preview
Resolved Preview
Impact Analysis UI
Gestion optimistic updates
Rollback visuel après erreur serveur
Read-only Published Version
Composants partagés
State management
Performance frontend
Tests UX complexes
```

Point critique :

```text
Drag & Drop
      ↓
Optimistic UI
      ↓
Server Validation
      ├── SUCCESS → conserver
      └── ERROR   → rollback
```

Le frontend ne doit jamais considérer le déplacement comme valide avant confirmation du backend.

---

# 151. Répartition Team 3 — Ranja

## Ranja — Backend

Responsabilités principales :

```text
Schéma DB BM-CDC-05
Migrations
Seed
Menu Domain
MenuItem Domain
Parent / Child
Depth Validation
Cycle Detection
Ordering
Reorder / Move
Navigation Targets
Route Validation
External URL Validation
Action Catalog Validation
Feature Requirements
Capability Requirements
ALL / ANY
VersionMenu
VersionMenuItem
Impact Analysis
Navigation Validation
Navigation Resolver
Snapshot
Snapshot Hash
ActivityEvent
Transactions
Optimistic Locking
Protection Published Version
IAM / Context
Isolation Tenant/Application/Version
API
Tests Backend
```

Le backend reste l'autorité pour :

```text
Hierarchy validity
Cycle detection
Max depth
Requirements
Route validity
Version editability
Impact
Resolved Navigation
Snapshot
```

---

# 152. Coordination Frontend / Backend

Les contrats suivants doivent être stabilisés entre Avotra, Belardo et Ranja :

```text
Menu DTO
MenuItem DTO
VersionMenu DTO
VersionMenuItem DTO
FeatureRequirement DTO
CapabilityRequirement DTO
NavigationTarget DTO
ImpactResult
NavigationValidationResult
ResolvedNavigation
NavigationSnapshot
Error Contract
Pagination Contract
Optimistic Locking Contract
```

Règle :

> Le frontend présente, édite et prévisualise la navigation. Le backend reste l'autorité sur la validité structurelle et fonctionnelle de la navigation.

---

# 153. Contrat BM-CDC-04 → BM-CDC-05

BM-CDC-05 consomme les identifiants stables définis par BM-CDC-04 :

```text
Feature.id
Feature.code
Capability.id
Capability.code
VersionFeature
VersionCapability
```

BM-CDC-05 ne doit jamais :

```text
recréer Feature
recréer Capability
dupliquer le catalogue BM-CDC-04
inventer une Capability locale
```

Exemple :

```text
BM-CDC-04
sale.create = ACTIVE

        ↓ référence

BM-CDC-05
MenuItem sales.new
requires sale.create
```

---

# 154. Contrat avec IAM

BM-CDC-05 décrit :

```text
Ce MenuItem exige sale.create
```

IAM répond :

```text
Cet utilisateur possède-t-il le droit correspondant ?
```

La séparation doit rester :

```text
BM-CDC-04 → capacité disponible dans l'application
BM-CDC-05 → capacité exigée pour la navigation
IAM  → autorisation effective de l'utilisateur
```

BM-CDC-05 ne doit pas devenir un moteur IAM.

---

# 155. Contrat Runtime

Le Runtime doit pouvoir demander :

```text
ApplicationVersion
+
MenuLocation
+
Contexte fonctionnel
```

et recevoir :

```text
ResolvedNavigation
```

Exemple :

```text
GET /runtime/navigation?location=SIDEBAR
```

Résultat :

```text
Navigation déjà filtrée
Hiérarchie valide
Items triés
Parents vides retirés
Targets exploitables
```

---

# 156. Sécurité multi-tenant

Chaque opération BM-CDC-05 doit revalider le contexte :

```text
tenantId
applicationId
applicationVersionId
actorId
permissions
versionStatus
```

Interdictions :

```text
Cross-tenant Menu access
Cross-application VersionMenu mutation
Cross-version unauthorized mutation
Client-supplied actor trusted blindly
Published version mutation
```

---

# 157. Règles de sécurité Navigation Target

## ROUTE

Autoriser uniquement une route conforme au format attendu.

## EXTERNAL_URL

Contrôler :

```text
Protocol
URL format
Allowed schemes
No javascript:
No data: arbitraire
```

## ACTION

`actionKey` doit provenir d'un catalogue d'actions autorisées.

Jamais :

```text
eval()
script arbitraire
commande système
code dynamique fourni par l'utilisateur
```

---

# 158. Performance du Navigation Resolver

Le Resolver étant appelé fréquemment, éviter :

```text
N+1 queries
résolution récursive non bornée
recalcul inutile
chargement de données non nécessaires
```

Prévoir :

```text
indexes DB
batch loading
tree building en mémoire
snapshotHash
future cache key
```

Clé conceptuelle :

```text
applicationVersionId
+
menuLocation
+
navigationSnapshotHash
```

---

# 159. Indexes DB recommandés

Prévoir au minimum des index adaptés sur :

```text
menus.code
menus.location
menus.status

menu_items.menuId
menu_items.parentId
menu_items.code
menu_items.sortOrder
menu_items.targetType

version_menus.applicationVersionId
version_menu_items.applicationVersionId

menu_item_feature_requirements.menuItemId
menu_item_feature_requirements.featureId

menu_item_capability_requirements.menuItemId
menu_item_capability_requirements.capabilityId
```

---

# 160. Scénario E2E principal

```text
Application : Boutique Mode & Chaussures
Version     : 1.1.0 DRAFT
```

Étapes :

1. BM-CDC-04 expose `SALE`, `sale.read`, `sale.create`, `sale.refund`.
2. Créer Menu `MAIN`, location `SIDEBAR`.
3. Ajouter parent `Ventes`.
4. Ajouter `Nouvelle vente` → `/sales/new`.
5. Exiger `sale.create`.
6. Ajouter `Historique` → `/sales`.
7. Exiger `sale.read`.
8. Ajouter `Retours` → `/sales/returns`.
9. Exiger `sale.refund`.
10. Désactiver `sale.refund` dans la version.
11. Valider la navigation.
12. Ouvrir la Preview Configuration.
13. Ouvrir la Preview Resolved.
14. Générer le Snapshot.

Résultat attendu :

```text
Configuration
Ventes
├── Nouvelle vente
├── Historique
└── Retours

Resolved
Ventes
├── Nouvelle vente
└── Historique
```

Puis :

```text
Hierarchy             VALID
Routes                VALID
Feature Requirements  VALID
Capability Rules      VALID
Resolver              VALID
Snapshot              GENERATED
```

---

# 161. Definition of Done Backend

Backend DONE lorsque :

```text
✓ DB + migrations
✓ Seed
✓ Menu Domain
✓ MenuItem Domain
✓ Parent / Child
✓ Self Parent validation
✓ Cycle Detection
✓ Max Depth
✓ Ordering
✓ Move / Reorder
✓ ROUTE
✓ EXTERNAL_URL
✓ ACTION
✓ NONE
✓ Feature Requirements
✓ Capability Requirements
✓ ALL / ANY
✓ VersionMenu
✓ VersionMenuItem
✓ Impact Analysis
✓ Navigation Validation
✓ Navigation Resolver
✓ Snapshot
✓ SnapshotHash
✓ ActivityEvent
✓ Transactions
✓ Optimistic locking
✓ Version protection
✓ Tenant isolation
✓ API
✓ Backend tests
```

---

# 162. Definition of Done Frontend

Frontend DONE lorsque :

```text
✓ Overview
✓ Menu Catalog
✓ Menu Editor
✓ MenuItem Editor
✓ Tree
✓ Drag & Drop
✓ Reorder
✓ Change Parent
✓ Requirements UI
✓ Feature selector
✓ Capability selector
✓ ALL / ANY
✓ Impact Viewer
✓ Desktop Preview
✓ Mobile Preview
✓ Configuration Preview
✓ Resolved Preview
✓ Validation
✓ Error navigation
✓ History
✓ Published read-only
✓ Loading
✓ Empty
✓ Error
✓ Responsive
✓ Frontend tests
```

---

# 163. Definition of Done globale

BM-CDC-05 est fonctionnel lorsque le flux suivant fonctionne réellement :

```text
ApplicationVersion
       ↓
Select/Create Menu
       ↓
Build Navigation Tree
       ↓
Configure Targets
       ↓
Attach BM-CDC-04 Requirements
       ↓
Configure Version
       ↓
Validate
       ↓
Preview Configuration
       ↓
Resolve Navigation
       ↓
Preview Resolved
       ↓
Generate Snapshot
       ↓
READY
```

Le flux doit fonctionner depuis l'interface jusqu'à la base de données et revenir jusqu'à l'interface sans manipulation manuelle hors application.

---

# 164. Livrables attendus

```text
Backend
├── MenuService
├── MenuItemService
├── RequirementService
├── VersionMenuService
├── MenuImpactService
├── ValidationService
├── NavigationResolver
├── SnapshotService
├── API
└── Tests

Frontend
├── Overview
├── Menu Catalog
├── Menu Workspace
├── Tree Editor
├── MenuItem Panel
├── Requirement Panel
├── Impact Viewer
├── Preview Desktop/Mobile
├── Validation Viewer
├── History
└── Tests

Database
├── Tables BM-CDC-05
├── Foreign Keys
├── Constraints
├── Indexes
├── Migrations
└── Seed

Documentation
├── Architecture
├── API Contract
├── Navigation Contract
├── Requirement Rules
├── Resolver Rules
├── Error Codes
├── Snapshot Contract
└── Acceptance Tests
```

---

# 165. Critères d'acceptation complémentaires

Le module est accepté si :

1. un Menu peut être créé et configuré ;
2. plusieurs Menu Locations sont supportées ;
3. un arbre Parent/Child peut être construit ;
4. le Drag & Drop fonctionne avec validation serveur ;
5. les cycles sont refusés ;
6. la profondeur maximale est respectée ;
7. les MenuItems peuvent cibler ROUTE, EXTERNAL_URL, ACTION ou NONE ;
8. les exigences BM-CDC-04 sont sélectionnables ;
9. ALL et ANY fonctionnent ;
10. une Capability indisponible est détectée ;
11. la configuration peut varier selon ApplicationVersion ;
12. une version publiée reste immuable ;
13. l'Impact Analysis fonctionne ;
14. la Preview Desktop fonctionne ;
15. la Preview Mobile fonctionne ;
16. Configuration et Resolved sont distingués ;
17. le Resolver retire les items indisponibles ;
18. `hideWhenEmpty` retire les parents vides ;
19. le Snapshot est déterministe ;
20. le même état produit le même hash ;
21. l'historique est consultable ;
22. les conflits d'édition sont détectés ;
23. l'isolation Tenant/Application/Version est respectée ;
24. les tests Backend et Frontend passent ;
25. le scénario E2E principal est démontrable.

---

# 166. Hors périmètre BM-CDC-05 initial

Les éléments suivants peuvent être préparés architecturalement mais ne doivent pas bloquer BM-CDC-05 :

```text
Dynamic badges avancés
Full i18n
User simulation IAM avancée
Rules Engine complexe
Redis
Context menus avancés
AI-generated menus
Analytics de navigation
```

---

# 167. Architecture finale

```text
                     APPLICATION VERSION
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
            BM-CDC-04                        BM-CDC-05
   FEATURES / CAPABILITIES          MENU DEFINITION
              │                           │
              │                 ┌─────────┴─────────┐
              │                 ▼                   ▼
              │               MENUS              MENU ITEMS
              │                                     │
              │                          ┌──────────┼──────────┐
              │                          ▼          ▼          ▼
              │                       TARGETS   HIERARCHY  REQUIREMENTS
              │                                                │
              └───────────────────────────────┬────────────────┘
                                              ▼
                                      VERSION CONFIGURATION
                                              │
                                              ▼
                                         VALIDATION
                                              │
                                              ▼
                                     NAVIGATION RESOLVER
                                              │
                               ┌──────────────┴──────────────┐
                               ▼                             ▼
                       CONFIGURATION                    RESOLVED
                          PREVIEW                       NAVIGATION
                                                             │
                                      ┌──────────────────────┼──────────────────────┐
                                      ▼                      ▼                      ▼
                                  SIDEBAR                 TOPBAR              BOTTOM_NAV
                                                             │
                                                             ▼
                                                          RUNTIME
```

---

# 168. Règle finale d'architecture

> **BM-CDC-05 ne doit pas seulement enregistrer des menus. Il doit produire une navigation versionnée, validée et résolue à partir du contrat fonctionnel BM-CDC-04.**

```text
BM-CDC-01 / BM-CDC-02
WHICH APPLICATION VERSION?
       ↓
BM-CDC-03
WHAT DATA EXISTS?
       ↓
BM-CDC-04
WHAT CAN THE APPLICATION DO?
       ↓
BM-CDC-05
HOW DOES THE USER NAVIGATE TO IT?
       ↓
RUNTIME
WHAT NAVIGATION IS ACTUALLY EXPOSED?
```

La navigation finale doit être exploitable par Web, Mobile et APK sans recréer manuellement les règles de menu dans chaque client.
