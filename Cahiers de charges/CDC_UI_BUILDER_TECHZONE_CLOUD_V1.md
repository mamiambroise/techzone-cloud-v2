# CAHIER DES CHARGES --- TECHZONE CLOUD UI BUILDER

**Version :** 1.0\
**Date :** Septembre 2026\
**Projet :** Techzone Cloud\
**Module :** UI Builder\
**Statut :** Spécification fonctionnelle et technique

------------------------------------------------------------------------

# 1. Présentation

## 1.1 Vision

Le **UI Builder** est le moteur de construction visuelle des interfaces
des applications métier de Techzone Cloud.

Il permet de transformer les objets et fonctionnalités définis dans
**Business Manager** en interfaces utilisateur fonctionnelles sans
devoir développer manuellement chaque écran React.

Le UI Builder ne doit pas être un simple éditeur graphique.

Il doit produire une **définition déclarative, structurée, versionnable,
validable et exécutable par le Runtime**.

Architecture générale :

``` text
BUSINESS MANAGER
Entités • Champs • Features • Permissions
              │
              ▼
UI BUILDER
Pages • Layout • Composants • Binding • Formulaires • Actions
              │
              ▼
AUTOMATION
Workflows • Triggers • Conditions • Actions
              │
              ▼
PACK MANAGER
Version • Validation • Manifest • Publication
              │
              ▼
PACK RUNTIME
Résolution • Configuration effective • Exécution
```

------------------------------------------------------------------------

# 2. Objectifs

Le UI Builder doit permettre de :

-   construire visuellement une application ;
-   créer et organiser ses pages ;
-   utiliser des composants réutilisables ;
-   connecter les composants aux modèles Business Manager ;
-   générer des formulaires automatiquement ;
-   construire des tableaux et listes ;
-   configurer les interactions utilisateur ;
-   gérer la navigation ;
-   gérer la visibilité des composants ;
-   exploiter les permissions IAM ;
-   personnaliser le thème ;
-   gérer Desktop / Tablet / Mobile ;
-   prévisualiser l'application ;
-   tester les interfaces ;
-   valider la configuration UI ;
-   versionner les définitions ;
-   transmettre la définition UI au Pack Manager ;
-   permettre au Runtime de rendre l'interface publiée ;
-   préparer la génération assistée par IA.

------------------------------------------------------------------------

# 3. Principes architecturaux

## 3.1 Définition déclarative

Le UI Builder ne doit pas enregistrer les pages sous forme de fichiers
React générés arbitrairement.

Une page est représentée sous forme de configuration structurée.

``` json
{
  "page": {
    "id": "products-list",
    "name": "Produits",
    "route": "/products",
    "layout": "standard",
    "components": [
      {
        "type": "DataTable",
        "binding": {
          "entity": "Product"
        }
      }
    ]
  }
}
```

Pipeline :

``` text
UI Definition → Validation → Pack Manager → Manifest → Publication → Runtime Renderer
```

------------------------------------------------------------------------

# 4. Responsabilités

## Business Manager

Définit les applications, versions, entités, champs, relations,
fonctionnalités, permissions et configuration métier.

## UI Builder

Définit les pages, layouts, composants, formulaires, bindings, actions
UI, navigation visuelle, thème, responsive et expérience utilisateur.

## Automation

Définit les workflows, triggers, conditions, actions automatiques,
planifications et exécutions.

## Pack Manager

Gère packaging, versions, dépendances, validation, manifest et
publication.

## Pack Runtime

Charge et exécute la définition métier, la définition UI, la
configuration, le manifest et les automatisations publiées.

------------------------------------------------------------------------

# 5. Architecture fonctionnelle UI Builder

  Domaine          Responsabilité
  ---------------- ------------------------------
  Dashboard        Vue générale du projet UI
  Pages            Gestion des écrans
  Visual Builder   Construction visuelle
  Components       Bibliothèque de composants
  Data Binding     Connexion aux données
  Forms            Construction des formulaires
  Actions          Interactions utilisateur
  Navigation       Navigation applicative
  Theme            Design System
  Responsive       Desktop / Tablet / Mobile
  Preview          Aperçu interactif
  Validation       Contrôle avant publication
  Revisions        Historique des versions UI
  AI Assistant     Génération assistée

------------------------------------------------------------------------

# 6. Navigation

``` text
UI Builder
├── Vue d'ensemble
├── Pages
├── Éditeur visuel
├── Composants
├── Formulaires
├── Navigation
├── Thème
└── Aperçu & Test
```

Les fonctions Data Binding, Actions, Visibility, Responsive, Properties
et Advanced sont principalement accessibles depuis l'éditeur.

------------------------------------------------------------------------

# 7. Contexte

``` text
Tenant → Application → Application Version → UI Project → Page
```

Exemple de Context Bar :

``` text
TechBoutique | Version 1.2.0 | DRAFT | Page : Produits | Desktop / Tablet / Mobile
```

Les données de tenants ou versions différentes ne doivent jamais être
mélangées.

------------------------------------------------------------------------

# 8. Dashboard

Route indicative : `/ui-builder`

Afficher notamment : - nombre de pages ; - composants ; - formulaires
; - erreurs ; - avertissements ; - dernière modification ; - pages
récemment modifiées ; - pages incomplètes ; - progression ; - activité
récente.

CTA principal : **Continuer la conception**.

------------------------------------------------------------------------

# 9. Gestion des pages

Une page possède notamment :

``` text
id
tenantId
uiProjectId
applicationVersionId
name
title
slug
route
pageType
layout
status
isHome
order
settings
createdAt
updatedAt
```

Types : `DASHBOARD`, `LIST`, `DETAIL`, `CREATE`, `EDIT`, `FORM`,
`SETTINGS`, `CUSTOM`.

Actions : créer, modifier, dupliquer, réordonner, définir comme accueil,
archiver, restaurer, prévisualiser.

------------------------------------------------------------------------

# 10. Éditeur visuel

Interface cible :

``` text
┌──────────────────────────────────────────────────────────────────┐
│ ← Produits   DRAFT      Desktop Tablet Mobile      Preview Save │
├──────────────┬─────────────────────────────────┬─────────────────┤
│ COMPONENTS   │            CANVAS               │ PROPERTIES      │
│ Layout       │                                 │ Content         │
│ Text         │  Produits                       │ Data            │
│ Button       │  Search          + Ajouter      │ Style           │
│ Input        │  Product Table                  │ Actions         │
│ Form         │                                 │ Visibility      │
│ Table        │                                 │ Responsive      │
│ Card / KPI   │                                 │ Advanced        │
└──────────────┴─────────────────────────────────┴─────────────────┘
```

Le Canvas supporte drag & drop, sélection, déplacement, duplication,
suppression, imbrication, zones de dépôt et aperçu.

------------------------------------------------------------------------

# 11. Component Tree

``` text
Page
└── Container
    ├── PageHeader
    ├── KPIGrid
    │   ├── KPI
    │   └── KPI
    └── DataTable
```

Actions : sélectionner, déplacer, imbriquer, verrouiller, masquer,
dupliquer, supprimer.

------------------------------------------------------------------------

# 12. Bibliothèque de composants

## Layout

Container, Section, Grid, Row, Column, Stack, Divider, Spacer, Tabs,
Accordion.

## Contenu

Text, Heading, Paragraph, Icon, Image, Badge, Avatar.

## Données

DataTable, List, CardList, KPI, Statistic, Timeline, Progress, Chart.

## Formulaires

TextInput, Textarea, NumberInput, Select, MultiSelect, Checkbox, Radio,
Switch, DatePicker, DateTimePicker, FileUpload.

## Actions

Button, IconButton, DropdownButton, Link, ActionMenu.

## Feedback

Alert, Toast, EmptyState, Loading, Skeleton, Progress.

## Overlay

Modal, Drawer, Popover, Tooltip, ConfirmDialog.

------------------------------------------------------------------------

# 13. Modèle générique d'un composant

``` json
{
  "id": "cmp_123",
  "type": "TextInput",
  "name": "Product Name",
  "parentId": "section_1",
  "order": 1,
  "properties": {},
  "binding": {},
  "style": {},
  "actions": [],
  "visibility": {},
  "responsive": {}
}
```

------------------------------------------------------------------------

# 14. Component Registry

Le registre central définit les composants autorisés et leurs capacités.

``` json
{
  "type": "TextInput",
  "category": "form",
  "label": "Champ texte",
  "icon": "Type",
  "supportsBinding": true,
  "supportsActions": true,
  "supportsResponsive": true
}
```

Il sert à la validation, au rendu Runtime, aux extensions et à
l'intégration IA.

------------------------------------------------------------------------

# 15. Data Binding

Le UI Builder exploite les modèles Business Manager.

Exemple : `Product` avec `id`, `name`, `price`, `stock`, `category`,
`active`.

``` json
{
  "source": "entity",
  "entity": "Product",
  "field": "name"
}
```

Types : `STATIC`, `ENTITY`, `FIELD`, `QUERY`, `CONTEXT`, `VARIABLE`,
`COMPUTED`.

Aucun JavaScript arbitraire.

------------------------------------------------------------------------

# 16. Data Sources

Une page peut déclarer plusieurs sources : Products, Categories,
CurrentUser, Orders.

``` json
{
  "id": "products",
  "type": "entity",
  "entity": "Product",
  "operation": "list"
}
```

Permissions et isolation tenant sont appliquées côté backend.

------------------------------------------------------------------------

# 17. Form Builder

Génération automatique depuis une entité Business Manager.

Exemple : - `name` → TextInput - `price` → NumberInput - `stock` →
NumberInput - `active` → Switch - `categoryId` → Select

Configuration : label, placeholder, help text, required, read-only,
disabled, hidden, default value, validation, visibility, width,
responsive.

Validations : required, min, max, minLength, maxLength, pattern, email,
business constraint.

Le backend reste l'autorité métier.

------------------------------------------------------------------------

# 18. DataTable Builder

Configuration : - Data source ; - Columns ; - Search ; - Filters ; -
Sorting ; - Pagination ; - Selection ; - Row actions ; - Bulk actions
; - Empty state.

Chaque colonne peut définir Field, Label, Type, Width, Sortable,
Filterable, Visible, Formatter.

------------------------------------------------------------------------

# 19. Actions

Types prévus :

``` text
NAVIGATE
CREATE_RECORD
UPDATE_RECORD
DELETE_RECORD
OPEN_MODAL
OPEN_DRAWER
CLOSE_MODAL
SET_VARIABLE
REFRESH_DATA
CALL_API
TRIGGER_AUTOMATION
DOWNLOAD
SHOW_NOTIFICATION
```

Exemple :

``` text
Enregistrer → Validate Form → Create Product → Refresh → Notification → Navigate
```

------------------------------------------------------------------------

# 20. Events

Support progressif : `onClick`, `onChange`, `onSubmit`, `onSelect`,
`onOpen`, `onClose`, `onLoad`.

Les scripts JavaScript utilisateur arbitraires sont interdits.

------------------------------------------------------------------------

# 21. Intégration Automation

Une interface peut déclencher une Automation publiée :

``` text
Button → onClick → TRIGGER_AUTOMATION → Workflow
```

UI Builder configure le workflow, l'input mapping, le comportement
succès et erreur.

Automation reste propriétaire du workflow.

------------------------------------------------------------------------

# 22. Navigation Builder

Exemple :

``` text
Dashboard

Catalogue
├── Produits
└── Catégories

Ventes
├── Commandes
└── Clients

Paramètres
```

Chaque entrée : label, icon, page, route, order, parent, visibility,
permission.

------------------------------------------------------------------------

# 23. Permissions et visibilité

Une règle UI peut afficher un bouton si `permission = product.delete`.

Masquer un composant n'est jamais une mesure de sécurité : le backend
vérifie toujours les permissions.

Conditions possibles : Permission, Role, Feature, Environment, Field
value, Application state.

------------------------------------------------------------------------

# 24. Theme Builder

Design Tokens : - Logo ; - Primary Color ; - Secondary Color ; - Font
Family ; - Font Size ; - Font Weight ; - Radius ; - Spacing ; - Density
; - styles Buttons, Inputs, Cards, Tables, Modals, Navigation.

Éviter le CSS arbitraire dans le MVP.

------------------------------------------------------------------------

# 25. Responsive Builder

Breakpoints principaux : Desktop, Tablet, Mobile.

Propriétés : Visible, Columns, Width, Direction, Alignment, Gap, Order.

Le responsive automatique est la valeur par défaut, avec overrides
manuels uniquement lorsque nécessaire.

------------------------------------------------------------------------

# 26. Preview

Modes : `DESIGN` et `PREVIEW`.

Le Preview permet de tester navigation, formulaires, tableaux, actions,
responsive, permissions et données.

Tailles indicatives : Desktop 1440, Laptop 1280, Tablet 768, Mobile 390.

------------------------------------------------------------------------

# 27. Undo / Redo et Autosave

Supporter Undo/Redo pour ajout, suppression, déplacement, duplication,
propriétés et layout.

Autosave avec états : Editing, Saving, Saved, Error saving.

Utiliser un debounce.

Prévoir `updatedAt` et `revision` pour éviter les écrasements
silencieux.

------------------------------------------------------------------------

# 28. Lifecycle UI

Lifecycle indicatif :

``` text
DRAFT → CONFIGURING → VALIDATION → READY → PUBLISHED → ARCHIVED
```

Aligner avec les lifecycles existants du projet.

------------------------------------------------------------------------

# 29. Validation Engine

Niveaux : `ERROR`, `WARNING`, `INFO`.

Erreurs possibles : - route dupliquée ; - page sans route ; - binding
inexistant ; - entité inexistante ; - champ supprimé ; - action invalide
; - permission inconnue ; - composant inconnu.

Warnings : - page vide ; - composant sans binding ; - Empty State absent
; - responsive non vérifié.

Cliquer sur un problème doit idéalement ouvrir l'élément concerné.

------------------------------------------------------------------------

# 30. Relation Pack Manager

``` text
UI Builder → UI Definition → Validation → READY → Pack Manager
```

Pack Manager reste responsable de la publication globale.

Manifest UI indicatif :

``` json
{
  "ui": {
    "definitionVersion": "1.0",
    "pages": [],
    "navigation": {},
    "theme": {},
    "components": []
  }
}
```

------------------------------------------------------------------------

# 31. Runtime Renderer

Architecture :

``` text
JSON Definition → Runtime Renderer → Component Registry → React Components
```

Le Runtime interprète PageDefinition, ComponentDefinition,
BindingDefinition, ActionDefinition, ThemeDefinition et
NavigationDefinition.

`eval()` et JavaScript arbitraire sont interdits.

------------------------------------------------------------------------

# 32. Modèle de données conceptuel

``` text
UiProject
UiPage
UiComponent
UiDataSource
UiBinding
UiAction
UiNavigation
UiNavigationItem
UiTheme
UiValidation
UiRevision
```

Relations :

``` text
ApplicationVersion
       └── UiProject
              ├── UiPage
              │      └── UiComponent
              │             ├── UiBinding
              │             └── UiAction
              ├── UiNavigation
              │      └── UiNavigationItem
              ├── UiTheme
              ├── UiValidation
              └── UiRevision
```

------------------------------------------------------------------------

# 33. Prisma indicatif

À adapter au schéma existant, sans jamais remplacer `schema.prisma`.

``` prisma
model UiProject {
  id                   String   @id @default(uuid())
  tenantId             String
  applicationVersionId String
  name                 String
  status               String
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
}
```

Respecter UUID, tenantId, relations, FK, indexes, contraintes uniques et
conventions actuelles.

------------------------------------------------------------------------

# 34. API indicative

Préfixe possible : `/api/ui-builder`

## Projects

``` http
GET    /projects
GET    /projects/:id
POST   /projects
PATCH  /projects/:id
```

## Pages

``` http
GET    /projects/:id/pages
POST   /projects/:id/pages
GET    /pages/:id
PATCH  /pages/:id
DELETE /pages/:id
POST   /pages/:id/duplicate
POST   /pages/:id/archive
```

## Components

``` http
GET    /pages/:id/components
POST   /pages/:id/components
PATCH  /components/:id
DELETE /components/:id
POST   /components/:id/duplicate
POST   /components/reorder
```

## Validation / Preview / Revisions

``` http
POST /projects/:id/validate
GET  /projects/:id/validation
GET  /projects/:id/preview
GET  /projects/:id/revisions
POST /projects/:id/revisions
```

Adapter aux conventions API actuelles.

------------------------------------------------------------------------

# 35. Sécurité

Toutes les routes respectent : - Authentication ; - Tenant Context ; -
Permissions ; - DTO Validation ; - Audit.

Ne jamais faire confiance à `tenantId`, `userId` ou permissions fournis
par le frontend.

Permissions indicatives :

``` text
ui.read
ui.create
ui.update
ui.delete
ui.page.create
ui.page.update
ui.page.delete
ui.theme.update
ui.preview
ui.validate
ui.publish
```

Réutiliser IAM existant.

------------------------------------------------------------------------

# 36. Isolation Multi-Tenant

Toutes les ressources sont isolées par tenant.

Tester lecture, création, modification, suppression, preview, validation
et révisions cross-tenant.

------------------------------------------------------------------------

# 37. Intégration Business Manager

Business Manager fournit Application, Application Version, Entities,
Fields, Relations, Features, Permissions et Configuration.

UI Builder consomme ces définitions sans créer une seconde source de
vérité métier.

Si `Product.oldPrice` est supprimé dans Business Manager alors qu'une UI
le référence, produire `BROKEN_BINDING` et signaler l'erreur en
validation.

------------------------------------------------------------------------

# 38. Intégration Automation, Pack Manager et Runtime

``` text
Application Version
├── Business Definition
├── UI Definition
├── Automation Definition
└── Configuration
             ↓
            PACK
             ↓
           Runtime
```

Une modification DRAFT du UI Builder ne modifie jamais silencieusement
l'interface publiée.

------------------------------------------------------------------------

# 39. AI UI Assistant

Exemples : - « Crée une page de gestion des produits. » - « Ajoute
quatre KPI en haut. » - « Ajoute un tableau des commandes impayées. » -
« Transforme le formulaire en deux colonnes. » - « Crée un Dashboard à
partir des données disponibles. »

L'IA ne génère pas arbitrairement React, JavaScript exécutable ou SQL.

Elle génère des opérations UI structurées et validées.

Workflow :

``` text
Prompt → AI Proposal → Structured UI Operations → Validation → Preview Diff → Accept/Reject → UI Document
```

Contexte IA : Application, Version, Entities, Fields, Relations,
Features, Permissions, Current Page, Components, Component Registry,
Theme.

------------------------------------------------------------------------

# 40. Templates

Templates de base : - Dashboard ; - CRUD List ; - CRUD Detail ; - Create
Form ; - Edit Form ; - Settings ; - Master / Detail.

Templates métier futurs possibles : Boutique, Restaurant, CRM, Stock,
Facturation, Formation, WISP.

------------------------------------------------------------------------

# 41. États UX

Tous les écrans gèrent : - Loading ; - Loaded ; - Empty ; - Error ; -
Unauthorized ; - Forbidden ; - Saving ; - Saved ; - Save Error ; -
Validation Error.

Aucun écran blanc silencieux.

------------------------------------------------------------------------

# 42. UI/UX

Identité Techzone Cloud : - sidebar claire ; - fond slate/bleu très
léger ; - surfaces blanches ; - bleu Techzone ; - bordures fines ; -
radius 10--12px ; - ombres discrètes ; - typographie professionnelle ; -
icônes cohérentes ; - densité maîtrisée.

Micro-animations : Drag, Drop, Selection, Panels, Drawer, Modal, Tabs,
Save indicator, Validation result, Preview transition.

Durée recommandée : 120--250 ms.

Respecter `prefers-reduced-motion`.

------------------------------------------------------------------------

# 43. Raccourcis clavier

``` text
Ctrl/Cmd + Z          Undo
Ctrl/Cmd + Shift + Z  Redo
Ctrl/Cmd + S          Save
Ctrl/Cmd + D          Duplicate
Delete                Delete
Escape                Deselect / Close
```

Respecter le contexte du focus.

------------------------------------------------------------------------

# 44. Performance

Priorités : - interaction fluide ; - drag & drop fluide ; - autosave
debounced ; - lazy loading ; - pagination ; - limitation des rerenders
; - memoization pertinente ; - chargement progressif.

------------------------------------------------------------------------

# 45. Audit et observabilité

Événements significatifs :

``` text
UI_PROJECT_CREATED
PAGE_CREATED
PAGE_UPDATED
PAGE_ARCHIVED
COMPONENT_ADDED
THEME_UPDATED
UI_VALIDATED
UI_READY
```

Observabilité lorsque pertinent : requestId, traceId, tenantId, userId,
projectId, pageId.

------------------------------------------------------------------------

# 46. MVP

Priorités : 1. UI Project 2. Pages 3. Canvas 4. Component Registry 5.
Layout 6. Form Components 7. DataTable 8. Business Manager Binding 9.
Form Builder 10. Actions 11. Navigation 12. Theme 13. Responsive 14.
Preview 15. Validation 16. Pack Manager Integration 17. Runtime Renderer

Le MVP ne cherche pas à reproduire Figma ou Webflow intégralement.

------------------------------------------------------------------------

# 47. Phase 2

-   Undo / Redo avancé ;
-   Templates avancés ;
-   Revision History ;
-   Reusable Components ;
-   Conditional Visibility avancée ;
-   Charts avancés ;
-   AI Generation.

------------------------------------------------------------------------

# 48. Phase 3

-   Marketplace de composants ;
-   Custom Components sécurisés ;
-   Collaborative Editing ;
-   Comments ;
-   AI Multi-Page Generation ;
-   AI UX Audit ;
-   Internationalisation avancée.

------------------------------------------------------------------------

# 49. Règles de gestion

-   **RG-UI-001** --- Un UiProject appartient à une ApplicationVersion.
-   **RG-UI-002** --- Toutes les ressources UI sont isolées par tenant.
-   **RG-UI-003** --- Une route active doit être unique dans une
    Application Version.
-   **RG-UI-004** --- Tout composant doit appartenir à une page valide.
-   **RG-UI-005** --- Un binding doit référencer une source existante et
    autorisée.
-   **RG-UI-006** --- Une action doit être supportée par le Runtime.
-   **RG-UI-007** --- Une permission UI ne remplace jamais une
    permission backend.
-   **RG-UI-008** --- Une définition avec erreur bloquante ne peut pas
    devenir READY.
-   **RG-UI-009** --- Seule une définition validée peut intégrer un Pack
    publiable.
-   **RG-UI-010** --- Une modification DRAFT ne modifie jamais
    automatiquement l'interface publiée.
-   **RG-UI-011** --- Aucun JavaScript utilisateur arbitraire n'est
    exécuté.
-   **RG-UI-012** --- L'IA utilise uniquement les composants et
    capacités autorisés.
-   **RG-UI-013** --- Toute configuration publiée est versionnée.
-   **RG-UI-014** --- Une référence Business Manager supprimée produit
    un problème de validation.
-   **RG-UI-015** --- Runtime refuse proprement une définition
    incompatible.
-   **RG-UI-016** --- UI Builder ne duplique pas les modèles métier du
    Business Manager.
-   **RG-UI-017** --- UI Builder n'implémente pas les workflows
    appartenant à Automation.
-   **RG-UI-018** --- Pack Manager reste responsable de la préparation
    et publication du Pack.

------------------------------------------------------------------------

# 50. Tests

## Unitaires

Tester : - Component Registry ; - Binding Resolver ; - Action Validation
; - Page Validation ; - Route Validation ; - Responsive Configuration
; - Visibility Rules ; - UI Definition Validation.

## Intégration

Tester :

``` text
Business Manager → UI Builder
UI Builder → Automation
UI Builder → Pack Manager
Pack Manager → Runtime
```

## Sécurité

Tester : - Tenant Isolation ; - Permissions ; - Invalid Binding ; -
Invalid Component ; - Unauthorized Action ; - Malformed UI Definition
; - Cross-Tenant Access ; - Unauthorized Preview ; - Unauthorized
Modification.

## E2E

``` text
Business Manager
→ Create Application
→ Create Version
→ Create Entity Product
→ UI Builder
→ Create Page
→ Add Form
→ Bind Product
→ Add DataTable
→ Configure Actions
→ Save
→ Preview
→ Validate
→ READY
→ Pack Manager
→ Manifest
→ Publish
→ Runtime
→ Render UI
```

------------------------------------------------------------------------

# 51. Organisation technique indicative

L'IA doit d'abord analyser l'architecture existante.

Backend possible :

``` text
backend/src/modules/ui-builder/
├── ui-builder.module.ts
├── projects/
├── pages/
├── components/
├── bindings/
├── actions/
├── navigation/
├── themes/
├── validation/
├── revisions/
└── preview/
```

Frontend possible :

``` text
frontend/src/components/ui-builder/
├── dashboard/
├── pages/
├── builder/
├── canvas/
├── component-library/
├── component-tree/
├── inspector/
├── bindings/
├── actions/
├── navigation/
├── theme/
├── preview/
└── validation/
```

Ne pas créer cette structure si une organisation équivalente existe
déjà.

------------------------------------------------------------------------

# 52. UI Document Specification

``` json
{
  "schemaVersion": "1.0",
  "projectId": "...",
  "applicationVersionId": "...",
  "pages": [],
  "navigation": {},
  "theme": {},
  "metadata": {}
}
```

Runtime contrôle `schemaVersion`, `runtimeVersion` et
`component compatibility`.

Une définition incompatible produit une erreur contrôlée, jamais un
crash silencieux.

------------------------------------------------------------------------

# 53. Critères d'acceptation

Le UI Builder est fonctionnel lorsqu'un utilisateur peut :

1.  ouvrir une application Business Manager ;
2.  sélectionner une version ;
3.  ouvrir UI Builder ;
4.  créer une page ;
5.  ajouter un layout ;
6.  ajouter des composants ;
7.  connecter les composants aux entités Business Manager ;
8.  générer un formulaire ;
9.  configurer un DataTable ;
10. ajouter des actions ;
11. construire la navigation ;
12. personnaliser le thème ;
13. tester Desktop / Tablet / Mobile ;
14. prévisualiser l'application ;
15. lancer la validation ;
16. corriger les erreurs ;
17. passer la définition à READY ;
18. intégrer la définition au Pack Manager ;
19. générer le Manifest ;
20. publier le Pack ;
21. charger la définition dans Runtime ;
22. afficher réellement l'application générée.

------------------------------------------------------------------------

# 54. Instruction pour l'IA de développement

Avant toute implémentation :

1.  analyser le repository actuel ;
2.  rechercher les fonctions UI Builder déjà présentes ;
3.  lire les CDC Business Manager, Pack Manager et Pack Runtime ;
4.  analyser les modèles Prisma actuels ;
5.  analyser IAM et le contexte multi-tenant ;
6.  analyser le design system existant ;
7.  analyser les conventions API ;
8.  analyser navigation et routing ;
9.  identifier les composants réutilisables ;
10. produire une matrice `EXISTANT / PARTIEL / MANQUANT`.

Règle :

``` text
SI EXISTANT ET FONCTIONNEL
→ CONSERVER.

SI EXISTANT MAIS UI FAIBLE
→ AMÉLIORER UI/UX.

SI PARTIEL
→ COMPLÉTER.

SI MANQUANT
→ DÉVELOPPER CONFORMÉMENT AU CDC.
```

Ne jamais réécrire inutilement une fonction existante.

------------------------------------------------------------------------

# 55. Définition de DONE

Le UI Builder est DONE lorsque :

-   backend fonctionnel ;
-   frontend fonctionnel ;
-   vraies données utilisées ;
-   Canvas fonctionnel ;
-   Component Registry fonctionnel ;
-   Pages fonctionnelles ;
-   bindings Business Manager fonctionnels ;
-   Form Builder fonctionnel ;
-   DataTable fonctionnel ;
-   actions fonctionnelles ;
-   navigation fonctionnelle ;
-   thème fonctionnel ;
-   responsive fonctionnel ;
-   Preview fonctionnel ;
-   Validation Engine fonctionnel ;
-   isolation multi-tenant testée ;
-   IAM respecté ;
-   Pack Manager récupère la définition UI ;
-   Runtime interprète la définition publiée ;
-   aucun mock silencieux en REAL mode ;
-   tests passent ;
-   builds passent ;
-   recette navigateur réalisée.

------------------------------------------------------------------------

# 56. Principe produit final

**Business Manager**

> Qu'est-ce que mon application gère ?

**UI Builder**

> Comment l'utilisateur voit et utilise cette application ?

**Automation**

> Que doit faire automatiquement le système ?

**Pack Manager**

> Quelle version complète peut être validée et publiée ?

**Pack Runtime**

> Comment cette version publiée est-elle résolue et exécutée ?

------------------------------------------------------------------------

# FIN DU CAHIER DES CHARGES

**Techzone Cloud --- UI Builder v1.0**
