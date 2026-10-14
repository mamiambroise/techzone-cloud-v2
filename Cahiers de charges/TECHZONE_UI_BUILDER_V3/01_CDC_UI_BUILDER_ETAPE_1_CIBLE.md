# CAHIER DES CHARGES — TECHZONE CLOUD UI BUILDER
## Étape 1 — Cible fonctionnelle et architecturale

**Projet :** Techzone Cloud  
**Module :** UI Builder  
**Version cible :** 3.0  
**Statut :** Spécification cible  
**Principe :** UI Builder transforme une Business Definition en UI Definition déclarative, versionnée, validable, responsive et exécutable par le Shared Renderer, sans générer arbitrairement du code React.

---

# 1. Objet

UI Builder répond à :

```text
COMMENT L’UTILISATEUR
VOIT ET UTILISE
L’APPLICATION MÉTIER ?
```

Il définit :

- Pages ;
- Layouts ;
- Components ;
- Component Registry ;
- Visual Editor ;
- Inspector ;
- Bindings ;
- Forms ;
- UI Actions ;
- Navigation visuelle ;
- Theme ;
- Responsive ;
- Preview ;
- UI Validation ;
- UI Definition ;
- Revisions.

---

# 2. Position dans Techzone Cloud

```text
BUSINESS MANAGER
Application / Version
Entities / Fields / Relations
Features / Capabilities / Permissions
        ↓
UI BUILDER
Pages
Components
Bindings
Forms
Actions
Navigation
Theme
Responsive
Validation
UI Definition
        ↓
PACK MANAGER
Composition
Snapshot UI
Manifest
Publication
        ↓
PACK RUNTIME
Effective Manifest
Shared Renderer
        ↓
DATA RUNTIME
AUTOMATION
```

---

# 3. Frontières de responsabilité

## UI Builder possède

- pages ;
- layouts ;
- composants ;
- component registry ;
- canvas ;
- inspector ;
- bindings ;
- forms ;
- UI actions ;
- navigation visuelle ;
- thème ;
- responsive ;
- preview ;
- validation UI ;
- UI Definition ;
- revisions UI.

## UI Builder ne possède pas

### Business Manager
- Entity ;
- Field ;
- Relation ;
- Business Definition ;
- Feature Registry.

### Automation
- workflows ;
- triggers ;
- execution engine.

### Data Runtime
- query engine ;
- mutation engine ;
- repositories.

### Pack Manager
- Pack ;
- Manifest global ;
- publication.

### Pack Runtime
- resolution ;
- activation ;
- Runtime Context ;
- execution gate.

### IAM
- identité ;
- rôle ;
- permissions.

---

# 4. Principe déclaratif

Interdit comme architecture principale :

```text
UI Builder
→ générer arbitrairement des fichiers React
→ compiler
→ exécuter
```

Cible :

```text
UI Definition
→ Validation
→ Snapshot
→ Pack Manager
→ Pack Runtime
→ Shared Renderer
```

Exemple :

```json
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

---

# 5. Contexte obligatoire

```text
Tenant
↓
Application
↓
Application Version
↓
UI Definition
↓
Page
↓
Component
```

Toute opération UI Builder doit rester dans la même ApplicationVersion.

---

# 6. UI Definition

Structure conceptuelle :

```text
UiDefinition
├── id
├── tenantId
├── applicationId
├── applicationVersionId
├── schemaVersion
├── status
├── pages
├── navigation
├── theme
├── metadata
├── validationStatus
├── revision
├── createdAt
└── updatedAt
```

Une seule UI Definition active par ApplicationVersion, sauf architecture existante différente.

---

# 7. UI Definition lifecycle

Concept :

```text
DRAFT
↓
EDITING
↓
VALIDATING
↓
READY
↓
SNAPSHOT
```

La publication globale reste Pack Manager.

---

# 8. Pages

Une Page possède :

- id ;
- stable key ;
- name ;
- title ;
- description ;
- route ;
- page type ;
- layout ;
- visibility ;
- permission references ;
- metadata ;
- components ;
- responsive config ;
- validation state.

---

# 9. Route

Règles :

- route unique dans UI Definition ;
- format valide ;
- pas de collision ;
- pas de route système réservée ;
- deep-link valide ;
- page réellement existante.

---

# 10. Page sélectionnée

L’éditeur visuel ne doit jamais rester dans un état incohérent.

À l’ouverture :

```text
Selected page in URL/state exists?
YES → open page
NO
↓
First valid page exists?
YES → select/redirect
NO → Empty State "Créer une page"
```

Ne pas ouvrir un éditeur inutilisable avec seulement « Aucune page sélectionnée » si des pages existent.

---

# 11. Deep Links

Cible :

```text
/ui/builder
/ui/builder/pages
/ui/builder/editor/:pageId
```

ou routes existantes équivalentes.

Un deep-link vers une page inexistante :
- 404/empty controlled ;
- redirect possible vers première page valide ;
- jamais crash.

---

# 12. Layouts

Layouts structurés :

```text
standard
split
sidebar
dashboard
form
detail
custom declarative
```

Les types exacts doivent provenir du Registry réel.

---

# 13. Component Registry

Le Registry décrit chaque composant rendable :

```text
type
version
label
category
propertiesSchema
bindingSchema
actions
slots
responsive capabilities
runtime compatibility
```

Un composant non enregistré ne doit pas être rendu silencieusement.

---

# 14. Component Instance

Exemple :

```json
{
  "id": "cmp_1",
  "type": "DataTable",
  "props": {},
  "binding": {},
  "actions": [],
  "responsive": {},
  "children": []
}
```

---

# 15. Visual Editor

Le Visual Editor permet :

- sélectionner ;
- ajouter ;
- déplacer ;
- réordonner ;
- imbriquer ;
- dupliquer ;
- supprimer ;
- configurer ;
- preview.

Il manipule une définition structurée.

---

# 16. Canvas

Le Canvas :

- affiche le même modèle que le Runtime ;
- respecte layout et responsive ;
- sélectionne composant/page ;
- ne détient pas une source de vérité parallèle.

---

# 17. Inspector

L’Inspector est généré à partir du `propertiesSchema` du Component Registry.

Il doit gérer :

- text ;
- number ;
- boolean ;
- select ;
- multi-select ;
- color ;
- spacing ;
- binding ;
- action ;
- visibility ;
- responsive.

---

# 18. Contrat des callbacks UI

Règle obligatoire :

Tous les composants partagés (`BmSelect`, `BmSearchInput`, inputs, selectors) utilisent un contrat cohérent.

Choix recommandé :

```text
onChange(value)
```

pour les composants abstraits Techzone.

Puis tous les consommateurs reçoivent directement la valeur.

Interdit :

```text
Component A → value
Consumer A → event.target.value
```

Le contrat doit être uniforme et testé.

---

# 19. Search Input

Même principe :

```text
onChange(searchValue)
```

Aucun consumer ne doit supposer un événement DOM si le composant émet une chaîne.

---

# 20. Data Binding

Bindings vers Business Manager/Data Runtime.

Exemple :

```json
{
  "entity": "Product",
  "operation": "read",
  "fields": ["id", "name", "price"]
}
```

UI Builder référence les contrats, il n’invente pas SQL/Prisma.

---

# 21. Binding Validation

Vérifier :

- Entity existe ;
- Field existe ;
- relation existe ;
- operation autorisée ;
- capability disponible ;
- Data Contract compatible ;
- permission reference valide.

---

# 22. Forms

Forms composent les Fields Business Manager.

Un Form ne recrée pas un second modèle métier.

Exemple :

```text
ProductForm
├── name → Product.name
├── price → Product.price
└── category → Product.categoryId
```

---

# 23. Form Validation

Validation UI :
- required ;
- min/max ;
- format ;
- visibility.

Validation métier reste Business/Data Runtime.

Frontend validation ne remplace jamais backend validation.

---

# 24. UI Actions

Types possibles :

```text
NAVIGATE
REFRESH
TRIGGER_AUTOMATION
OPEN_MODAL
CLOSE_MODAL
SET_VARIABLE
SHOW_NOTIFICATION
CALL_API
```

Mais `CALL_API` doit passer par contrats autorisés, pas URL arbitraire.

---

# 25. Automation Actions

`TRIGGER_AUTOMATION` référence un workflow enregistré.

UI Builder ne contient pas son moteur.

---

# 26. Navigation visuelle

Business Manager définit la structure fonctionnelle.

UI Builder contrôle :
- icône ;
- ordre ;
- label visuel ;
- visibility ;
- presentation ;
- mobile behavior.

---

# 27. Theme

Design tokens :

```text
colors
typography
spacing
radius
shadow
breakpoints
surface
border
```

Pas de CSS arbitraire non gouverné comme modèle principal.

---

# 28. Responsive

Scopes :

```text
DESKTOP
TABLET
MOBILE
```

Props structurées, sérialisables et renderer-compatible.

---

# 29. Visibility

Un composant/page peut référencer :
- permission ;
- feature ;
- capability ;
- expression déclarative contrôlée.

Aucune logique JavaScript arbitraire du frontend.

---

# 30. Permissions

Le frontend peut masquer/désactiver.

Le backend/Data Runtime/IAM reste autorité.

---

# 31. Preview

Preview utilise le même Shared Renderer que Pack Runtime autant que possible.

```text
UI Builder Preview
≈
Published Runtime Rendering
```

Éviter deux moteurs divergents.

---

# 32. Preview Context

Preview peut utiliser un contexte contrôlé :
- tenant ;
- applicationVersion ;
- sample/test data ;
- permissions simulées explicitement en mode design.

Ne jamais mélanger avec un contexte runtime production.

---

# 33. Shared Renderer

Le Renderer reçoit une UI Definition structurée.

Il doit :
- valider schema ;
- résoudre components ;
- appliquer bindings/actions ;
- gérer unsupported component ;
- gérer responsive ;
- ne pas exécuter code arbitraire.

---

# 34. Runtime Rendering

Pack Runtime doit rendre un snapshot UI provenant de la même ApplicationVersion.

Règle :

```text
PackVersion.applicationVersionId
==
UiDefinition.applicationVersionId
```

---

# 35. Validation Engine

Valider :

```text
Pages
Routes
Layouts
Components
Registry references
Bindings
Forms
Actions
Navigation
Theme
Responsive
Permissions
Runtime compatibility
ApplicationVersion consistency
```

---

# 36. Validation Levels

```text
ERROR
WARNING
INFO
```

ERROR bloque UI READY/snapshot.

---

# 37. Validation Codes

Exemples :

```text
UI_PAGE_ROUTE_DUPLICATE
UI_PAGE_ROUTE_INVALID
UI_COMPONENT_UNKNOWN
UI_COMPONENT_SCHEMA_INVALID
UI_BINDING_ENTITY_UNKNOWN
UI_BINDING_FIELD_UNKNOWN
UI_ACTION_INVALID
UI_AUTOMATION_REFERENCE_UNKNOWN
UI_PERMISSION_REFERENCE_UNKNOWN
UI_THEME_INVALID
UI_RUNTIME_INCOMPATIBLE
UI_APPLICATION_VERSION_MISMATCH
```

---

# 38. Snapshot UI

Avant Pack Manager :

```text
UI Definition
↓
Validation
↓
Canonical serialization
↓
Immutable UI Snapshot
↓
Pack Manager
```

---

# 39. Snapshot Integrity

Le snapshot doit :
- être immuable ;
- contenir/porter ApplicationVersion ;
- être hashable ;
- être reproductible.

---

# 40. Revisions

DRAFT :
- revisions ;
- autosave contrôlé ;
- history ;
- optional diff.

Snapshot publié/packagé :
- immutable.

---

# 41. Autosave

Si autosave existe :

- debounce ;
- conflict handling ;
- visible state `Saving/Saved/Error` ;
- no silent overwrite.

---

# 42. Concurrency

Deux éditeurs ne doivent pas écraser silencieusement leurs modifications.

Prévoir si support réel :
- revision/version ;
- updatedAt ;
- conflict response.

---

# 43. AI Assistant

Pipeline :

```text
Prompt
↓
Proposal
↓
Structured UI Operations
↓
Validation
↓
Diff Preview
↓
Accept/Reject
```

Jamais modification silencieuse.

---

# 44. Tenant Isolation

Tenant A ne peut jamais :
- ouvrir UI Definition B ;
- éditer Page B ;
- lire Theme B ;
- cloner Form B ;
- utiliser snapshot B ;
- preview B.

---

# 45. IAM

Permissions conceptuelles :

```text
ui.read
ui.write
ui.page.create
ui.page.update
ui.component.edit
ui.form.edit
ui.theme.edit
ui.preview
ui.validate
```

Adapter au Permission Registry réel.

---

# 46. API conceptuelle

```http
GET    /api/ui-builder/definitions/:applicationVersionId
PATCH  /api/ui-builder/definitions/:id

GET    /api/ui-builder/pages
POST   /api/ui-builder/pages
GET    /api/ui-builder/pages/:id
PATCH  /api/ui-builder/pages/:id
DELETE /api/ui-builder/pages/:id

GET    /api/ui-builder/components/registry
POST   /api/ui-builder/validate
POST   /api/ui-builder/snapshot
```

Adapter aux routes réelles.

---

# 47. UI Overview

Afficher :
- Pages ;
- Components ;
- Forms ;
- Errors ;
- Warnings ;
- Recently modified ;
- Completion.

CTA :
`Continuer la conception`.

---

# 48. Pages Manager

Table/cards :
- page ;
- route ;
- layout ;
- status ;
- validation ;
- updated ;
- actions.

---

# 49. Editor Layout

```text
Top Context Bar
├── Application
├── Version
├── Page
└── Device

Left Panel
├── Pages
├── Components
└── Tree

Center
└── Canvas

Right Panel
└── Inspector
```

---

# 50. Forms Builder

Sections :
- forms ;
- field mappings ;
- submit action ;
- validation ;
- preview.

---

# 51. Theme Editor

Tabs :
- Colors ;
- Typography ;
- Spacing ;
- Radius ;
- Shadows ;
- Breakpoints.

---

# 52. Preview & Test

Support :
- Desktop ;
- Tablet ;
- Mobile ;
- route navigation ;
- interactions ;
- validation errors.

---

# 53. Tests unitaires

Tester :
- page routes ;
- component schema ;
- callback contracts ;
- binding validation ;
- actions ;
- theme ;
- responsive ;
- serialization.

---

# 54. Tests intégration

```text
Business Manager → UI Builder
UI Builder → Data Contracts
UI Builder → Automation references
UI Builder → Pack Manager
Pack Manager → Pack Runtime
Runtime → Shared Renderer
```

---

# 55. Tests E2E

```text
Login
↓
Application Version
↓
UI Builder
↓
Create Page
↓
Add Components
↓
Bind Product
↓
Create Form
↓
Theme
↓
Responsive
↓
Preview
↓
Validate
↓
Pack Manager
↓
Snapshot
↓
Publish
↓
Pack Runtime
↓
Render
```

---

# 56. Definition of Done

UI Builder est DONE si :

- APIs réelles préservées ;
- callbacks cohérents ;
- aucune erreur `event.target.value` liée aux composants abstraits ;
- éditeur ouvre une page valide ;
- deep links fiables ;
- UI Definition tenant/ApplicationVersion scoped ;
- bindings validés ;
- Shared Renderer commun ;
- preview/runtime cohérents ;
- snapshot immuable ;
- Pack Manager consomme UI Snapshot correct ;
- Runtime rend la même version ;
- tests frontend/backend/E2E verts ;
- aucun secret/code arbitraire.
