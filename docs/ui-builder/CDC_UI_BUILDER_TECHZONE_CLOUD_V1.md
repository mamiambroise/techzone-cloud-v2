# CDC — UI BUILDER TECHZONE CLOUD — V1

> Statut : ACTIF (2026-09-30) · Branche de travail : PC2
> Source : mission UI Builder PC2 + conventions vérifiées du dépôt (AGENTS.md, contrats BM / PM / PR / Automation / Data Runtime / IAM).
> Ce CDC est la source de vérité du module UI Builder. En cas d'écart, ce document fait foi.

---

## 1. Positionnement

Le UI Builder transforme les définitions métier du Business Manager en interfaces fonctionnelles, persistantes, validables et exécutables :

```
BUSINESS MANAGER (Applications, Versions, Entities, Fields, Features)
        ↓
UI BUILDER (Pages, Layouts, Components, Bindings, Forms, UI Actions, Navigation, Theme)
        ↓
AUTOMATION (Workflows — référencés, jamais réimplémentés)
        ↓
PACK MANAGER (composition → validation → manifest → publication)
        ↓
PACK RUNTIME (chargement + résolution)
```

## 2. Responsabilités (frontières strictes)

UI Builder possède UNIQUEMENT :
- **Pages** (CRUD, ordre, route, title, description, type, layout, visibility, permissions, metadata, validation)
- **Component Registry** (catalogue contrôlé des composants rendables)
- **Canvas / Visual Editor** (composition, nesting, réordonnancement)
- **Inspector** (édition des propriétés depuis les propertiesSchema du registry)
- **Bindings** (références typées vers Business Entities/Fields, contexte, variables)
- **Forms** (composition de champs Business Manager, jamais de second modèle métier)
- **UI Actions** (NAVIGATE, REFRESH, TRIGGER_AUTOMATION, OPEN_MODAL, CLOSE_MODAL, SET_VARIABLE, SHOW_NOTIFICATION, CALL_API)
- **Navigation** (présentation : ordre visuel, icône, visibilité — la structure fonctionnelle reste BM)
- **Theme** (design tokens : colors, typography, spacing, radius, shadow, breakpoints)
- **Responsive** (DESKTOP / TABLET / MOBILE — propriétés structurées, sérialisables)
- **Preview** (même moteur de rendu que le Runtime — Shared Renderer)
- **UI Definition** (document déclaratif, versionné, lié à une Application Version)
- **UI Validation** (ERROR / WARNING / INFO)

UI Builder NE possède PAS : Entities/Fields (BM), Workflows (Automation), Packs (Pack Manager), exécution data (Data Runtime), accès ERP direct (ERP Adapter), IAM (IAM), publication (Pack Manager).

## 3. Contexte et hiérarchie

```
Tenant → Application → Application Version → UiDefinition (1 par version) → Pages → Components
```

- Toute opération porte `applicationVersionId` résolu **dans le tenant du principal** (isolation systématique, comme `BmEntity`).
- Aucune fuite cross-tenant : read, write, delete, preview.

## 4. UI Definition (contrat v1)

```json
{
  "schemaVersion": "1.0",
  "applicationId": "uuid",
  "applicationVersionId": "uuid",
  "theme": { "colors": {...}, "typography": {...}, "spacing": {...}, "radius": {...}, "shadow": {...}, "breakpoints": {...} },
  "navigation": { "items": [ { "id", "label", "icon", "pageKey", "order", "visibility" } ] },
  "metadata": { "pageCount": 0, "updatedBy": "..." },
  "revision": 3
}
```

Page (table `ui_pages`, hybride relationnel + JSON) :

```json
{
  "id": "uuid", "key": "customers", "route": "/customers", "title": "Clients",
  "description": "", "type": "LIST|DETAIL|FORM|DASHBOARD|CUSTOM",
  "layout": "SIDEBAR|FULL_WIDTH|CENTERED",
  "order": 1, "visibility": "ALWAYS|TENANT_ADMIN_ONLY|HIDDEN",
  "permissions": [], "components": { "root": "c-root", "nodes": { "...": {} } },
  "metadata": {}
}
```

Component (nœud sérialisé dans `components.nodes`) :

```json
{ "id": "c-1", "type": "Card", "props": { "padding": "md" },
  "bindings": { "title": { "kind": "ENTITY_FIELD", "entity": "customer", "field": "name" } },
  "actions": [ { "type": "NAVIGATE", "config": { "route": "/customers" } } ],
  "children": ["c-2"] }
```

## 5. Component Registry (contrôle)

Chaque composant déclare : `key, version, category, label, icon, allowedChildren, propertiesSchema, bindingCapabilities, supportedActions, status`. Le rendu passe exclusivement par le **Shared Renderer** (builder preview = runtime). Aucun composant n'est annoncé utilisable si le renderer ne le rend pas. Registre : `frontend/src/features/ui-builder/registry/componentRegistry.js`.

Catégories : LAYOUT (Container, Section, Grid, Stack, Card), TYPOGRAPHY (Heading, Text), INPUTS/FORMS (Input, Textarea, Select, Checkbox, DatePicker, FormField), DATA DISPLAY (DataTable, Badge, Alert, Image, Link), NAVIGATION (Tabs), FEEDBACK (Spinner), ACTIONS (Button).

## 6. Bindings

Types : `STATIC`, `ENTITY_FIELD`, `ENTITY_LIST`, `CONTEXT`, `VARIABLE` (COMPUTED/Q UERY réserves v2 — non annoncées tant que Data Runtime ne les expose pas).
Exemples valides : `Customer.name` → `{kind:"ENTITY_FIELD", entity:"customer", field:"email"}` ; `CurrentUser.name` → CONTEXT ; `CurrentTenant.name` → CONTEXT.
Validation : entity inconnue (BM), field inconnu, type incompatible avec le composant, référence cassée → ERROR. BM reste propriétaire d'Entity/Field (tables `bm_entities`/`bm_fields`).

## 7. Expressions et sécurité

INTERDIT : `eval()`, `new Function()`, JavaScript arbitraire, injection de script, CSS arbitraire non tokenisé, URL `javascript:`. Les expressions sont des structures déclaratives typées. Toute sortie de renderer est échappée par React (pas de dangerouslySetInnerHTML). Les URLs d'action NAVIGATE/CALL_API sont validées (schéma relatif ou https).

## 8. UI Actions supportées v1

| Type | Configuration | Permission/capability |
|---|---|---|
| NAVIGATE | route (interne validée) | — |
| REFRESH | — | — |
| SET_VARIABLE | name, value (statique) | — |
| SHOW_NOTIFICATION | level, message | — |
| OPEN_MODAL / CLOSE_MODAL | target | — |
| TRIGGER_AUTOMATION | workflowCode | le workflow doit exister côté Automation |
| CALL_API | resource (Data Runtime), method GET/POST | data-runtime:query |

Aucun autre type n'est accepté par la validation (fail-closed).

## 9. Form Builder

Un Form associe des **Business Fields** (BM) à des composants de saisie : label, placeholder, required, readonly, defaultValue, validation (BM), binding, position. Le submit référence une UI Action (CREATE/UPDATE via Data Runtime dans une v2 ; v1 : validation structurelle + références).

## 10. Persistence, statuts, versioning

- Table `ui_pages` (PostgreSQL) + `UiThemeSetting` (tokens par applicationVersion). Révisions : champ `revision` incrémental + snapshots JSON.
- Save states UI : CLEAN → DIRTY → SAVING → SAVED / ERROR. « Enregistré » n'est affiché qu'après confirmation backend (200).
- Une Application Version `ACTIVE`/`PUBLISHED` refuse les écritures UI Builder (HTTP 409 `UI_VERSION_LOCKED`) ; l'édition exige DRAFT/CONFIGURING/VALIDATING.
- Undo/Redo client (ADD_COMPONENT, MOVE_COMPONENT, UPDATE_PROPS, DELETE_COMPONENT, UPDATE_BINDING, UPDATE_ACTION).

## 11. Validation Engine

Niveaux ERROR / WARNING / INFO. Détecte : route absente, route dupliquée, key dupliquée, component inconnu, binding cassé (entity/field inconnus), action inconnue, workflow TRIGGER_AUTOMATION inexistant, propriété requise absente, permission non reconnue, version locked. Cockpit Validation cliquable : erreur → page → composant → Inspector.

## 12. Navigation métier

BM Menu Engine reste propriétaire de la structure. UI Builder présente : ordre, icône, visibilité, pageKey cible (référence à une page UI Builder, jamais un doublon de structure BM).

## 13. IAM / Tenant / Audit

- Backend : `IamJwtGuard` (APP_GUARD global) + `TenantGuard` + `BmTenantGuard` + permissions `ui-builder.*` (deny by default, même mécanique `RequirePermission`).
- Frontend : `ProtectedRoute` + `canAccess` existants, aucune seconde Sidebar, aucune seconde navigation globale.
- Audit : `AuditEvent` (table existante) pour page.created/deleted, uidefinition.updated, theme.changed, navigation.changed, validation.run.

## 14. Data / ERP

Flux unique : UI Definition → Shared Renderer → Data Runtime (API `/api/data-runtime/*`) → Repository → Source. Interdit : UI → PostgreSQL direct ; UI → Dolibarr direct (toujours Integration Hub / ERP Adapter).

## 15. IA

Aucune infrastructure IA réelle n'existe dans le dépôt (aucun service IA branché côté backend). Conformément au principe « pas de fausse IA », aucun mode IA n'est annoncé. (`@google/genai` est présent côté frontend mais non branché — hors périmètre v1.)

## 16. Performance

Arbres de composants mémoïsés, state normalisé (nodes by id), sauvegarde manuelle + debounce sur autosave optionnel, validation locale instantanée, validation BM (entities/fields) requêtée à la demande. Pas de POST par frappe.

## 17. Critères d'acceptation

Voir mission PC2 §57 : builds PASS, tests unitaires/sécurité PASS, tenant isolation prouvée par tests, recette navigateur Overview → Pages → Visual Editor → Bindings → Preview → Validation → Save fonctionnelle, non-régression Dashboard/BM/Automation/Packs/Data/ERP OK.

## 18. Gap Matrix de référence (audit PC2 du 2026-09-30)

| Élément | CDC | Existant | Frontend | Backend | DB | API | Tests | Décision |
|---|---|---|---|---|---|---|---|---|
| Navigation UI Builder | 8 entrées sous groupe `ui` | `ComingSoon` ×7 | ❌ | — | — | — | — | IMPLEMENT |
| UI Builder Overview | réels, sans faux compteur | absent | ❌ | — | — | — | — | IMPLEMENT |
| Pages CRUD + validation | persistant, routes validées | absent | ❌ | ❌ | ❌ | ❌ | ❌ | IMPLEMENT |
| Visual Editor (Canvas/Inspector) | 3 panneaux | absent | ❌ | ❌ | ❌ | — | ❌ | IMPLEMENT |
| Component Library | catalogue structuré | absent | ❌ | — | — | — | — | IMPLEMENT |
| Component Registry | schéma contrôlé | absent | ❌ | — | — | — | ❌ | IMPLEMENT |
| Data Binding | ENTITY/CONTEXT/VARIABLE | absent | ❌ | ❌ | — | ❌ | ❌ | IMPLEMENT |
| Forms | via BM Fields | absent | ❌ | ❌ | — | ❌ | ❌ | IMPLEMENT |
| UI Actions | allowlist stricte | absent | ❌ | ❌ | — | ❌ | ❌ | IMPLEMENT |
| Theme Builder | tokens | absent | ❌ | ❌ | ❌ | ❌ | ❌ | IMPLEMENT |
| Responsive | 3 viewports | absent | ❌ | — | — | — | ❌ | IMPLEMENT |
| Preview | shared renderer | absent | ❌ | — | — | — | ❌ | IMPLEMENT |
| Validation Engine | E/W/I | absent | ❌ | ❌ | — | ❌ | ❌ | IMPLEMENT |
| UI Definition | déclaratif | absent | ❌ | ❌ | ❌ | ❌ | ❌ | IMPLEMENT |
| Undo/Redo | ops typées | absent | ❌ | — | — | — | ❌ | IMPLEMENT |
| Persistence | réelle, dirty/saving/saved | absent | ❌ | ❌ | ❌ | ❌ | ❌ | IMPLEMENT |
| BM integration | entities/fields | ✅ BM-CDC-03 complet | — | ✅ | ✅ | ✅ | ✅ | REUSE |
| Automation integration | TRIGGER_AUTOMATION | ✅ workflows en mémoire | — | ✅ | — | ✅ | ✅ | REUSE |
| Data integration | via Data Runtime | ✅ /api/data-runtime | ✅ | ✅ | — | ✅ | ✅ | REUSE |
| Pack Manager integration | UI Definition fournie au pack | ✅ manifest PM | — | ✅ | ✅ | ✅ | ✅ | ADAPT (sur demande PM) |
| Pack Runtime integration | consomme manifest publié | ✅ resolver PR | — | ✅ | ✅ | ✅ | ✅ | KEEP |
| Registry Platform | découverte UI | ❌ module registry absent du dépôt | — | — | — | — | — | DEFER (catalogue UI Builder = source v1) |
| IAM | guards existants | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | REUSE |
| Tenant isolation | stricte | ✅ pattern BM | — | ✅ (pattern réutilisé) | ✅ | ✅ | ⚠️ à ajouter | IMPROVE |
| Audit | AuditEvent existant | ✅ table | — | ⚠️ peu utilisé hors PM | ✅ | — | ❌ | IMPROVE |
| XSS / expressions | interdits | — | — | ✅ validation | — | — | ⚠️ à ajouter | IMPLEMENT |
| Tests UI Builder | couverture | ❌ | ❌ | ❌ | — | — | ❌ | IMPLEMENT |

Décisions : KEEP (Pack Runtime, BM, IAM, Data Runtime) · REUSE (contracts, guards, AuditEvent) · IMPROVE (tenant isolation tests, audit usage) · IMPLEMENT (tout le module UI Builder : DB, API, frontend, tests) · DEFER (Registry Platform — module absent ; IA — aucune infrastructure réelle).
