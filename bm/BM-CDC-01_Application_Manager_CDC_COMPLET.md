# BM-CDC-01 — Application Manager

**Projet :** Techzone Cloud  
**Module :** Business Manager  
**Référence :** `BM-CDC-01`  
**Nom :** Application Manager  
**Priorité :** 🔴 P0 — Fonction cœur  
**Type :** Fonctionnel — Frontend + Backend + Base de données + API + Tests  
**Prérequis :** `BM-CDC-00 — Socle, Architecture & Contrats communs`  
**Consommateurs :** `BM-CDC-02` à `BM-CDC-08`

---

## 1. Finalité

BM-CDC-01 doit permettre de créer et administrer le **conteneur racine d’une application métier** dans Techzone Cloud.

Une Application représente par exemple :

```text
Boutique
Restaurant
Garage
École
Pharmacie
Salon de beauté
Gestion d'événements
Gestion immobilière
```

Mais l’Application Manager ne connaît pas directement les métiers.

Il connaît uniquement :

```text
Application
Identity
Metadata
Ownership
Classification
Settings
Workspace
Clone
Archive
Context
```

Le principe est :

```text
                    APPLICATION
                         │
       ┌─────────────────┼─────────────────┐
       ▼                 ▼                 ▼
    Identity          Metadata          Settings
       │                 │                 │
       └─────────────────┼─────────────────┘
                         ▼
                      Workspace
                         │
       ┌─────────────────┼─────────────────┐
       ▼                 ▼                 ▼
    CDC-02            CDC-03            CDC-04...
 Versions/Lifecycle  Data Model       Features
```

---

## 2. Objectif principal

BM-CDC-01 doit répondre à :

> **Quelle application métier est administrée, à quel tenant appartient-elle, quelles sont ses informations générales et quels moteurs Business Manager sont disponibles dans son Workspace ?**

À la fin de BM-CDC-01, un utilisateur autorisé doit pouvoir :

```text
Créer une application
      ↓
Configurer son identité
      ↓
Configurer ses informations générales
      ↓
Classer l'application
      ↓
Ouvrir son Workspace
      ↓
Modifier
      ↓
Dupliquer / Cloner
      ↓
Archiver
      ↓
Consulter son activité
```

---

## 3. Ce qui appartient à BM-CDC-01

BM-CDC-01 gère :

```text
Application Catalog
Application Creation
Application Identity
Application Metadata
Application Settings
Application Classification
Application Ownership
Application Workspace
Application Overview
Application Clone
Application Duplicate
Application Archive
Application Restore
Search
Filters
Pagination
Activity
Audit
Permissions
Tenant Isolation
Application Context
```

---

## 4. Ce qui n’appartient PAS à BM-CDC-01

### BM-CDC-02

```text
ApplicationVersion
Version Number
Lifecycle détaillé
Draft
Ready
Published
Publication
Rollback
Version History
```

### BM-CDC-03

```text
Entity
Field
Relation
Constraint
Data Model
```

### BM-CDC-04

```text
Feature
Capability
Functional Dependency
```

### BM-CDC-05

```text
Menu
MenuItem
Navigation
Routes
```

### BM-CDC-06

```text
Configuration avancée
Metadata Engine
Catégories globales
Tags globaux
Configuration schemas
```

BM-CDC-01 peut **consommer** ces fonctions mais ne doit pas les recréer.

---

## 5. Position dans l’architecture

```text
BM-CDC-00
SOCLE COMMUN
     │
     ▼
BM-CDC-01
APPLICATION MANAGER
     │
     ├──────────────► BM-CDC-02
     │                Version & Lifecycle
     │
     ├──────────────► BM-CDC-03
     │                Data Model
     │
     ├──────────────► BM-CDC-04
     │                Feature & Capability
     │
     ├──────────────► BM-CDC-05
     │                Menu Engine
     │
     ├──────────────► BM-CDC-06
     │                Configuration
     │
     ├──────────────► BM-CDC-07
     │                Integration / Runtime
     │
     └──────────────► BM-CDC-08
                      Validation / Quality
```

---

## 6. Concept Application

Une `Application` est le **conteneur fonctionnel racine**.

Exemple :

```text
Application
Boutique Fianarantsoa
```

Elle pourra ensuite contenir :

```text
Versions
Data Model
Features
Capabilities
Menus
Pages
Forms
Rules
Workflows
Automations
Runtime configuration
```

Mais ces éléments sont fournis par les CDC suivants.

---

## 7. Modèle Application

Structure recommandée :

```text
Application
│
├── id
├── tenantId
├── code
├── name
├── shortName
├── description
├── categoryId
├── iconKey
├── logoRef
├── defaultLocale
├── timezone
├── status
├── sourceType
├── metadata
├── createdBy
├── createdAt
├── updatedBy
├── updatedAt
├── archivedAt
└── version
```

---

## 8. Identifiant technique

`id` doit être :

```text
stable
unique
non réutilisable
non dépendant du nom
```

Le changement de nom d’une Application ne doit jamais changer son identifiant.

---

## 9. Application Code

Exemples :

```text
boutique
restaurant
garage
school
pharmacy
beauty
```

Contraintes :

```text
obligatoire
unique dans le tenant
normalisé
stable
compatible avec les URLs/identifiants
```

Recommandation :

```text
lowercase
[a-z0-9-_]
```

Exemple :

```text
mode-chaussures
garage-central
school-manager
```

---

## 10. Nom et nom court

Exemple :

```text
name:
Boutique Mode & Chaussures

shortName:
Boutique
```

Le nom est destiné à l’affichage.

Le code reste l’identifiant fonctionnel stable.

---

## 11. Description

Doit pouvoir contenir une description métier générale :

```text
Application de gestion d'une boutique de vêtements,
chaussures, ventes, stock et clientèle.
```

La description ne doit pas être utilisée comme source de logique métier.

---

## 12. Icône et logo

Prévoir :

```text
iconKey
logoRef
```

`iconKey` :

```text
shopping-bag
school
car
hospital
restaurant
```

Éviter de stocker du HTML/SVG arbitraire directement en base.

---

## 13. Locale

Prévoir :

```text
defaultLocale
```

Exemples :

```text
fr
mg
en
```

Cela prépare l’internationalisation future.

---

## 14. Timezone

Prévoir :

```text
timezone
```

Exemple :

```text
Indian/Antananarivo
```

Cette information pourra être consommée par :

```text
Runtime
Reports
Automation
Workflow
Scheduling
Audit
```

---

## 15. Source Type

Prévoir :

```text
SYSTEM
TEMPLATE
CUSTOM
IMPORTED
CLONED
GENERATED
```

Cela permet de savoir comment l’Application a été créée.

---

## 16. Application Status

BM-CDC-01 doit rester simple.

Statuts administratifs recommandés :

```text
ACTIVE
SUSPENDED
ARCHIVED
```

Les états de construction/publication détaillés :

```text
DRAFT
CONFIGURING
VALIDATING
READY
PUBLISHED
```

appartiennent à **BM-CDC-02**, car ils concernent principalement `ApplicationVersion`.

---

## 17. Pourquoi séparer Application Status et Version Status

Exemple :

```text
Application Boutique
Status = ACTIVE

├── Version 1.0
│   PUBLISHED
│
└── Version 1.1
    DRAFT
```

L’Application peut être active alors qu’une nouvelle version est encore en préparation.

```text
Application.status
≠
ApplicationVersion.status
```

---

## 18. Application Catalog

Écran principal :

```text
APPLICATIONS

[ Recherche________________ ] [ Catégorie ▼ ] [ Statut ▼ ]

                                       [+ Nouvelle application]

Boutique
Commerce
ACTIVE

Restaurant
Restauration
ACTIVE

Garage Manager
Automobile
SUSPENDED
```

---

## 19. Fonctions du catalogue

L’utilisateur doit pouvoir :

```text
Lister
Rechercher
Filtrer
Trier
Paginer
Créer
Ouvrir
Dupliquer
Cloner
Archiver
Restaurer
```

---

## 20. Recherche

Recherche minimale sur :

```text
name
shortName
code
description
```

Exemple :

```text
GET /applications?search=boutique
```

---

## 21. Filtres

Prévoir :

```text
status
category
sourceType
createdBy
createdFrom
createdTo
updatedFrom
updatedTo
```

---

## 22. Tri

Exemples :

```text
name ASC
createdAt DESC
updatedAt DESC
```

---

## 23. Pagination

Réutiliser le contrat BM-CDC-00 :

```text
page
limit
total
totalPages
```

---

## 24. Création d’Application

Flux :

```text
Nouvelle Application
        ↓
Choisir méthode
        ↓
Informations générales
        ↓
Classification
        ↓
Personnalisation
        ↓
Résumé
        ↓
Créer
        ↓
Workspace
```

---

## 25. Méthodes de création

Prévoir :

```text
EMPTY
FROM_TEMPLATE
DUPLICATE
CLONE
IMPORT
AI_ASSISTED
```

### Obligatoire initialement

```text
EMPTY
FROM_TEMPLATE
DUPLICATE / CLONE
```

### Préparation future

```text
IMPORT
AI_ASSISTED
```

---

## 26. Création vide

```text
Create Empty Application
        ↓
Application créée
        ↓
Workspace disponible
        ↓
CDC-02 peut créer sa première version
```

BM-CDC-01 ne doit pas obligatoirement implémenter lui-même la logique détaillée de création de Version.

---

## 27. Création depuis Template

Un Template peut préremplir :

```text
name suggestions
category
icon
metadata
configuration defaults
```

Puis les autres moteurs peuvent fournir leurs propres parties :

```text
CDC-03 → Data Model template
CDC-04 → Feature template
CDC-05 → Navigation template
```

---

## 28. Assistant de création

### Étape 1 — Mode

```text
Créer de zéro
Utiliser un modèle
Dupliquer une application
```

### Étape 2 — Identité

```text
Nom
Nom court
Code
Description
```

### Étape 3 — Classification

```text
Catégorie
Tags
```

### Étape 4 — Apparence

```text
Icône
Logo
Locale
Timezone
```

### Étape 5 — Confirmation

```text
Résumé complet
```

Boutons :

```text
[ Retour ]
[ Créer l'application ]
```

---

## 29. Validation de création

Le backend doit contrôler :

```text
tenant valide
actor valide
permission
name obligatoire
code obligatoire
code unique
code valide
category valide
locale valide
timezone valide
```

---

## 30. Duplicate Application

Une duplication crée une **nouvelle Application indépendante**.

```text
Application A
      ↓
Duplicate
      ↓
Application B
```

Elle reçoit :

```text
new id
new code
new audit history
new creation metadata
```

---

## 31. Clone Application

`Clone` peut être plus complet que `Duplicate`.

```text
DUPLICATE
→ copie les informations générales

CLONE
→ copie l'application
  + contributions des autres moteurs
```

---

## 32. Clone Contributors

Prévoir :

```text
ApplicationCloneContributor
```

Les futurs CDC pourront enregistrer :

```text
CDC-02 → clone versions/configuration éligible
CDC-03 → clone Data Model
CDC-04 → clone Features
CDC-05 → clone Navigation
CDC-06 → clone Metadata
```

---

## 33. Clone Flow

```text
Application source
       ↓
Check permissions
       ↓
Impact / options
       ↓
Create new Application
       ↓
Run registered contributors
       ↓
Validate
       ↓
Audit
       ↓
Return new Application
```

---

## 34. Transaction de clone

```text
BEGIN
 ↓
Create Application
 ↓
Clone metadata
 ↓
Run contributors
 ↓
Audit
 ↓
COMMIT
```

En cas d’échec critique :

```text
ROLLBACK
```

---

## 35. Archive Application

Action principale :

```text
ARCHIVE
```

Effets :

```text
Application masquée des listes normales
Conservation historique
Conservation IDs
Conservation audit
Conservation références
```

---

## 36. Confirmation archivage

```text
Archiver cette application ?

Boutique Mode & Chaussures

Cette action la retirera des applications actives.

[ Annuler ]
[ Archiver ]
```

---

## 37. Impact avant archivage

Afficher si disponible :

```text
Versions
Data Models
Features
Menus
Runtime usage
Integrations
```

---

## 38. Restore Application

```text
ARCHIVED
   ↓
RESTORE
   ↓
ACTIVE / previous administrative state
```

---

## 39. Suppression physique

Interdite par défaut si :

```text
versions exist
activity exists
integration exists
runtime usage exists
dependencies exist
```

---

## 40. Application Workspace

Exemple :

```text
Boutique Mode & Chaussures
──────────────────────────

Overview
Versions
Data
Features
Menus
Configuration
Integration
Validation
Settings
```

BM-CDC-01 fournit le **conteneur Workspace**.

---

## 41. Workspace Extension Registry

Créer :

```text
BusinessWorkspaceRegistry
```

Chaque CDC déclare :

```text
key
label
icon
route
order
permission
availability
```

Exemple :

```text
CDC-02
key = versions

CDC-03
key = data

CDC-04
key = features

CDC-05
key = navigation
```

---

## 42. Avantage

BM-CDC-01 ne doit jamais coder en dur :

```text
if Data Model installed...
if Menu Engine installed...
```

Les moteurs s’enregistrent dans le Workspace.

---

## 43. Application Overview

```text
APPLICATION OVERVIEW

Boutique Mode & Chaussures
Commerce

Status
ACTIVE

Code
boutique-mode

Created
25/08/2026

Last updated
27/08/2026
```

Puis :

```text
Versions          → fourni CDC-02
Data Model        → fourni CDC-03
Features          → fourni CDC-04
Navigation        → fourni CDC-05
Validation        → fourni CDC-08
```

---

## 44. Overview Cards

Contrat possible :

```text
ApplicationOverviewContributor
```

Exemples :

```text
Versions
3 versions
1 publiée

Data Model
12 entities

Features
8 actives

Navigation
24 items
```

---

## 45. Paramètres généraux

BM-CDC-01 gère uniquement :

```text
name
shortName
description
icon
logo
locale
timezone
administrative status
```

La configuration métier étendue appartient à BM-CDC-06.

---

## 46. Classification

BM-CDC-01 doit pouvoir rattacher l’Application à :

```text
category
tags
```

Si BM-CDC-06 devient le gestionnaire central, CDC-01 consomme son catalogue.

---

## 47. Application Context

```text
ApplicationContext
├── applicationId
├── tenantId
├── code
├── name
├── status
└── permissions
```

---

## 48. Current Application

Exemple header :

```text
Application
[Boutique Mode & Chaussures ▼]
```

Changer d’Application doit :

```text
mettre à jour le contexte
vider les données contextuelles obsolètes
recharger le Workspace
revalider les permissions
```

---

## 49. Deep Link

```text
/business-manager/applications/:applicationId
```

Sous-moteurs :

```text
/business-manager/applications/:applicationId/data
/business-manager/applications/:applicationId/features
...
```

---

## 50. Backend Architecture

```text
ApplicationController
      ↓
ApplicationService
      ↓
ApplicationDomain
      ↓
ApplicationRepository
      ↓
Database
```

---

## 51. Application Domain

```text
Application
ApplicationId
ApplicationCode
ApplicationStatus
ApplicationSourceType
ApplicationMetadata
```

---

## 52. Application Service

```text
createApplication()
getApplication()
listApplications()
searchApplications()
updateApplication()
archiveApplication()
restoreApplication()
duplicateApplication()
cloneApplication()

getApplicationOverview()
getApplicationWorkspace()
getApplicationActivity()
```

---

## 53. Repository

```text
create()
findById()
findByCode()
existsByCode()
list()
search()
update()
archive()
restore()
```

---

## 54. Clone Service

```text
duplicateApplication()
cloneApplication()
registerContributor()
executeContributors()
```

---

## 55. Workspace Service

```text
getWorkspace()
registerWorkspaceModule()
getAvailableModules()
getOverviewContributions()
```

---

## 56. Database

Table principale :

```text
bm_applications
```

Champs :

```text
id
tenant_id
code
name
short_name
description
category_id
icon_key
logo_ref
default_locale
timezone
status
source_type
metadata
created_by
created_at
updated_by
updated_at
archived_at
version
```

---

## 57. Contraintes DB

```text
UNIQUE(tenant_id, code)
```

```text
tenant_id NOT NULL
code NOT NULL
name NOT NULL
status NOT NULL
```

---

## 58. Indexes

Prévoir :

```text
tenant_id
status
category_id
source_type
created_at
updated_at
```

---

## 59. Optimistic Locking

Utiliser :

```text
version
```

```text
Client version = 3
DB version     = 4

PATCH
↓
409 VERSION_CONFLICT
```

---

## 60. API — Applications

```text
GET    /applications
POST   /applications

GET    /applications/:id
PATCH  /applications/:id

POST   /applications/:id/archive
POST   /applications/:id/restore

POST   /applications/:id/duplicate
POST   /applications/:id/clone
```

---

## 61. API — Overview / Workspace

```text
GET /applications/:id/overview
GET /applications/:id/workspace
GET /applications/:id/activity
```

---

## 62. API — Search

Query :

```text
search
status
category
sourceType
page
limit
sort
direction
```

---

## 63. API — Create

```json
{
  "code": "boutique-mode",
  "name": "Boutique Mode & Chaussures",
  "shortName": "Boutique",
  "description": "Application de gestion de boutique",
  "categoryId": "commerce",
  "iconKey": "shopping-bag",
  "defaultLocale": "fr",
  "timezone": "Indian/Antananarivo"
}
```

---

## 64. API — Update

Exemple :

```text
PATCH
name
shortName
description
categoryId
iconKey
logoRef
defaultLocale
timezone
```

Les champs système ne sont pas éditables librement.

---

## 65. API Contract

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
    "code": "APPLICATION_CODE_EXISTS",
    "message": "Application code already exists",
    "details": []
  },
  "meta": {
    "traceId": "..."
  }
}
```

---

## 66. Error Codes

```text
APPLICATION_NOT_FOUND
APPLICATION_CODE_EXISTS
APPLICATION_NAME_REQUIRED
APPLICATION_CODE_REQUIRED
APPLICATION_CODE_INVALID

APPLICATION_ARCHIVED
APPLICATION_ALREADY_ARCHIVED
APPLICATION_NOT_ARCHIVED

APPLICATION_CLONE_FAILED
APPLICATION_DUPLICATE_FAILED

APPLICATION_HAS_DEPENDENCIES

INVALID_APPLICATION_STATUS

TENANT_MISMATCH
PERMISSION_DENIED
VERSION_CONFLICT
VALIDATION_FAILED
```

---

## 67. IAM Context

L’acteur doit toujours provenir du contexte authentifié.

Ne pas accepter librement :

```text
createdBy
tenantId
permission
```

---

## 68. Permissions

```text
business.application.read
business.application.create
business.application.update
business.application.clone
business.application.archive
business.application.restore
business.application.activity.read
```

---

## 69. Tenant Isolation

```text
Tenant A
├── Application A1
└── Application A2

Tenant B
├── Application B1
└── Application B2
```

Un utilisateur Tenant A ne doit jamais accéder aux Applications Tenant B sauf autorisation explicite.

---

## 70. Audit Events

```text
application.created
application.updated
application.duplicated
application.cloned
application.archived
application.restored
application.opened
```

---

## 71. ActivityEvent

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

## 72. Historique

L’utilisateur doit pouvoir voir :

```text
Application créée
Nom modifié
Logo modifié
Application dupliquée
Application clonée
Application archivée
Application restaurée
```

---

## 73. Interface — Sidebar

```text
BUSINESS MANAGER
├── Vue générale
└── Applications
```

Après ouverture :

```text
Application Workspace
├── Aperçu
├── Versions
├── Données
├── Features
├── Navigation
├── Configuration
├── Intégration
├── Validation
└── Paramètres
```

---

## 74. Écran Applications

Colonnes :

```text
Nom
Code
Catégorie
Statut
Source
Dernière modification
Actions
```

---

## 75. Actions ligne

```text
Ouvrir
Modifier
Dupliquer
Cloner
Archiver
```

---

## 76. Empty State

```text
Aucune application

Créez votre première application pour commencer.

[ + Nouvelle application ]
```

---

## 77. Loading State

Afficher un skeleton/loading cohérent avec BM-CDC-00.

---

## 78. Error State

```text
Impossible de charger les applications.

[ Réessayer ]
```

---

## 79. No Permission

```text
Vous n'avez pas l'autorisation d'accéder aux applications.
```

---

## 80. Archive View

Prévoir :

```text
Afficher archivées
```

et l’action :

```text
Restore
```

---

## 81. Responsive

Desktop :

```text
DataTable
```

Mobile :

```text
Cards / compact list
```

---

## 82. Validation Frontend

Validation UX immédiate :

```text
name required
code required
code syntax
description length
locale
timezone
```

Le backend reste l’autorité.

---

## 83. Autosave

Pour Settings, l’autosave peut être prévu.

Pour le Wizard de création, un état local peut suffire initialement.

---

## 84. Templates

Contrat :

```text
ApplicationTemplateSummary
├── id
├── code
├── name
├── description
├── category
├── icon
└── contributors[]
```

---

## 85. Application Creation Hooks

Prévoir :

```text
beforeApplicationCreate
afterApplicationCreate
```

et éventuellement :

```text
ApplicationProvisioningContributor
```

---

## 86. Éviter les dépendances fortes

Ne pas faire :

```text
ApplicationService
→ directement DataModelService
→ directement FeatureService
→ directement MenuService
```

Préférer :

```text
ApplicationService
        ↓
Extension Registry
        ↓
Contributors
```

---

## 87. Application Overview Contributors

```text
ApplicationOverview
        ↓
Contributor Registry
        │
        ├── CDC-02 Version summary
        ├── CDC-03 Data summary
        ├── CDC-04 Feature summary
        └── CDC-05 Menu summary
```

---

## 88. Tests Backend obligatoires

```text
Create Application
Create with valid code
Duplicate code rejected

Get Application
List Applications
Search
Filter
Sort
Pagination

Update Application
Optimistic locking conflict

Archive
Archive twice rejected
Restore
Restore non-archived rejected

Duplicate
Clone

Tenant isolation
Permission checks

Audit creation
Activity events

Workspace retrieval
Overview retrieval

Transaction rollback on clone failure
```

---

## 89. Tests Frontend obligatoires

```text
Application list
Search
Filters
Sort
Pagination

Create Wizard
Validation
Application detail

Overview
Settings
Workspace

Duplicate
Clone
Archive confirmation
Restore

Loading
Empty
Error
Forbidden
Conflict
Responsive
```

---

## 90. Tests d’intégration

```text
Frontend
   ↓
API
   ↓
ApplicationService
   ↓
Repository
   ↓
Database
   ↓
Activity / Audit
```

---

## 91. Scénario recette 1 — Création

```text
Admin
  ↓
Nouvelle Application
  ↓
Mode EMPTY
  ↓
Nom = Boutique
Code = boutique
  ↓
Créer
  ↓
APPLICATION CREATED
  ↓
Workspace
```

---

## 92. Scénario recette 2 — Code dupliqué

```text
Application existante
code = boutique
```

Puis :

```text
Créer nouvelle
code = boutique
```

Résultat :

```text
DENIED
APPLICATION_CODE_EXISTS
```

---

## 93. Scénario recette 3 — Modification

```text
Boutique
↓
Settings
↓
Modifier nom
↓
Save
↓
SUCCESS
```

---

## 94. Scénario recette 4 — Archivage

```text
Application ACTIVE
↓
Archive
↓
Impact
↓
Confirm
↓
ARCHIVED
```

---

## 95. Scénario recette 5 — Restore

```text
Application ARCHIVED
↓
Restore
↓
SUCCESS
```

---

## 96. Scénario recette 6 — Clone

```text
Application Boutique
↓
Clone
↓
Code = boutique-2
↓
Run contributors
↓
New Application
```

---

## 97. Scénario recette 7 — Isolation Tenant

```text
Tenant A
Application A

Tenant B
Application B

Context = Tenant A
↓
GET Application B
↓
DENIED
TENANT_MISMATCH
```

---

## 98. Scénario recette 8 — Concurrence

```text
Client expected version = 4
Database version        = 5

PATCH
↓
409 VERSION_CONFLICT
```

---

## 99. Scénario E2E principal

```text
Login
↓
Business Manager
↓
Applications
↓
Créer "Boutique"
↓
Ouvrir Workspace
↓
Modifier informations
↓
Afficher Overview
↓
Dupliquer
↓
Archiver clone
↓
Consulter historique
```

---

## 100. Performance

Objectifs indicatifs :

```text
Applications list     < 500 ms
Application detail    < 300 ms
Overview              < 500 ms
Workspace             < 500 ms
```

---

## 101. Cache

Pas obligatoire au départ.

Préparer :

```text
tenantId
applicationId
```

---

## 102. Automatisation sans IA

BM-CDC-01 peut automatiser :

```text
Code suggestion from name
Default icon suggestion by category
Default locale from tenant
Default timezone from tenant
Audit metadata
Workspace registration
Clone contributors
```

---

## 103. Assistance IA future

L’IA peut proposer :

```text
nom
description
catégorie
tags
template
type d'application
```

Règle :

```text
AI PROPOSES
USER CONFIRMS
SYSTEM CREATES
```

---

## 104. Observabilité

Chaque mutation importante doit générer :

```text
traceId
actorId
tenantId
applicationId
action
duration
result
```

---

## 105. Documentation obligatoire

Livrer :

```text
Application Domain
Database schema
API endpoints
Permissions
Error codes
Clone rules
Archive rules
Workspace extension contract
Overview extension contract
Tests
Definition of Done
```

---

## 106. Répartition Team 3 — Avotra

### Frontend fonctionnel

```text
Application Catalog
Create Wizard
Application Overview
Application Settings
Search
Filters
Pagination
Archive UI
Restore UI
Duplicate UI
History UI
Forms
Validation UX
Loading / Empty / Error
Responsive
API Integration
```

---

## 107. Répartition Team 3 — Belardo

### Frontend Architecture

```text
Application Workspace architecture
Routes
Workspace Registry
Overview Contributor UI
Shared layout
Context handling
Application Selector
State management
API client integration
Optimistic locking UI
Clone workflow UI
Responsive architecture
Frontend test foundation
```

---

## 108. Répartition Team 3 — Ranja

### Backend

```text
Application Domain
Application Repository
Application Service
Create
Update
Archive
Restore
Duplicate
Clone
Clone Contributor Registry
Workspace Registry backend
Overview Contributors
DB migrations
API
Permissions
IAM Context
Tenant isolation
Optimistic locking
Transactions
ActivityEvent
Audit
Backend tests
```

---

## 109. Livrables Backend

```text
✓ bm_applications
✓ migration DB
✓ indexes
✓ Application Domain
✓ Application Repository
✓ ApplicationService
✓ CloneService
✓ WorkspaceService
✓ Overview aggregation
✓ APIs
✓ IAM integration
✓ Tenant isolation
✓ Permissions
✓ Optimistic locking
✓ Transactions
✓ ActivityEvent
✓ Audit
✓ Backend tests
✓ API documentation
```

---

## 110. Livrables Frontend

```text
✓ Applications page
✓ Search / filters
✓ Create Wizard
✓ Application detail
✓ Application Overview
✓ Workspace
✓ Settings
✓ Duplicate
✓ Clone
✓ Archive
✓ Restore
✓ Activity
✓ Application selector
✓ Loading / Empty / Error
✓ Forbidden
✓ Conflict
✓ Responsive
✓ Frontend tests
```

---

## 111. Critères d’acceptation

BM-CDC-01 est acceptable lorsque :

```text
✓ Une Application peut être créée
✓ Son code est unique dans le Tenant
✓ Elle peut être retrouvée par recherche
✓ Les listes sont filtrables et paginées

✓ Une Application peut être ouverte
✓ Son Overview fonctionne
✓ Son Workspace fonctionne
✓ Les futurs modules peuvent s'y enregistrer

✓ Une Application peut être modifiée
✓ Les conflits d'édition sont détectés

✓ Une Application peut être dupliquée
✓ Une Application peut être clonée
✓ Le clone possède un nouvel ID

✓ Une Application peut être archivée
✓ Elle peut être restaurée
✓ L'historique est conservé

✓ L'acteur vient d'IAM
✓ L'isolation Tenant fonctionne
✓ Les permissions sont respectées

✓ ActivityEvent fonctionne
✓ Audit fonctionne
✓ Les opérations complexes sont transactionnelles

✓ Frontend PASS
✓ Backend PASS
✓ Tests intégration PASS

✓ BM-CDC-02 peut utiliser applicationId sans reconstruire Application
✓ BM-CDC-03 peut utiliser applicationId
✓ BM-CDC-04 peut utiliser applicationId
✓ BM-CDC-05 peut utiliser applicationId
```

---

## 112. Definition of Done — BM-CDC-01

```text
BM-CDC-01 — APPLICATION MANAGER

Application Model             ✓
Database                      ✓
Migration                     ✓
Application CRUD              ✓
Application Catalog           ✓
Search                        ✓
Filters                       ✓
Pagination                    ✓

Create Wizard                 ✓
Identity                      ✓
Metadata                      ✓
General Settings              ✓
Classification                ✓

Overview                      ✓
Workspace                     ✓
Workspace Registry            ✓
Overview Contributors         ✓

Duplicate                     ✓
Clone                         ✓
Clone Contributors            ✓

Archive                       ✓
Restore                       ✓

Application Context           ✓
Application Selector          ✓

Permissions                   ✓
IAM Context                   ✓
Tenant Isolation              ✓

Optimistic Locking            ✓
Transactions                  ✓
ActivityEvent                 ✓
Audit                         ✓

Frontend                      ✓
Backend                       ✓
API                           ✓

Loading / Empty / Error       ✓
Forbidden                     ✓
Conflict                      ✓
Responsive                    ✓

Frontend Tests                ✓
Backend Tests                 ✓
Integration Tests             ✓
Documentation                 ✓
Demo                          ✓

STATUS
READY FOR BM-CDC-02+
```

---

## 113. Architecture finale

```text
                         USER
                          │
                          ▼
                 BUSINESS MANAGER
                          │
                          ▼
                   APPLICATIONS
                          │
           ┌──────────────┼──────────────┐
           ▼              ▼              ▼
        CREATE          CATALOG        SEARCH
           │              │              │
           └──────────────┼──────────────┘
                          ▼
                   APPLICATION
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
     OVERVIEW          SETTINGS          ACTIVITY
        │
        ▼
     WORKSPACE
        │
   ┌────┼────────┬─────────┬─────────┬─────────┐
   ▼    ▼        ▼         ▼         ▼         ▼
 CDC-02 CDC-03  CDC-04    CDC-05    CDC-06    CDC-07
 Version Data   Feature    Menu      Config   Integration
```

---

## 114. Règle finale

> **BM-CDC-01 gère l’existence et l’identité de l’Application. Il ne gère pas le contenu détaillé de ses Versions, Data Models, Features ou Menus.**

```text
BM-CDC-00
Comment tous les moteurs doivent fonctionner ?
        ↓
BM-CDC-01
Quelle Application existe ?
        ↓
BM-CDC-02
Quelles Versions possède-t-elle ?
        ↓
BM-CDC-03
Quelles données possède chaque Version ?
        ↓
BM-CDC-04
Que sait faire chaque Version ?
        ↓
BM-CDC-05
Comment l'utilisateur y accède ?
```
