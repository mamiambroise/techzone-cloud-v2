# CAHIER DES CHARGES — TECHZONE CLOUD BUSINESS MANAGER
## Étape 1 — Cible fonctionnelle et architecturale

**Projet :** Techzone Cloud  
**Module :** Business Manager  
**Version cible :** 3.0  
**Statut :** Spécification cible  
**Principe :** consolider le Business Manager existant sans réécriture globale.

---

# 1. Objet

Business Manager est le moteur de définition métier de Techzone Cloud.

Il répond à :

```text
QU'EST-CE QUE L'APPLICATION GÈRE ?
ET
QUELLES CAPACITÉS MÉTIER POSSÈDE-T-ELLE ?
```

Il définit :

- Application ;
- Application Version ;
- Business Definition ;
- Entities ;
- Fields ;
- Relations ;
- Features ;
- Capabilities ;
- Business Events ;
- Business Navigation ;
- Configuration ;
- Metadata ;
- Permission References ;
- Contracts ;
- Validation ;
- Revisions / Snapshots.

---

# 2. Position dans l’architecture

```text
BUSINESS MANAGER
Applications
Versions
Entities
Fields
Relations
Features
Capabilities
Business Events
Configuration
Contracts
Validation
        │
        ├──────────────────┐
        ▼                  ▼
   UI BUILDER          AUTOMATION
 Pages                 Workflows
 Components            Triggers
 Bindings              Conditions
 Forms                 Actions
        │                  │
        └─────────┬────────┘
                  ▼
            PACK MANAGER
                  ↓
              Manifest
             Publication
                  ↓
             PACK RUNTIME
                  ↓
         APPLICATION RUNTIME
```

---

# 3. Responsabilités

Business Manager possède :

- définition métier ;
- versioning métier ;
- schéma métier ;
- entités ;
- champs ;
- relations ;
- features ;
- capabilities ;
- business events ;
- navigation métier ;
- configuration métier ;
- metadata ;
- références IAM ;
- contrats inter-modules ;
- validation de cohérence ;
- snapshots/revisions de définition.

---

# 4. Hors périmètre

Business Manager ne possède pas :

## UI Builder
- canvas ;
- composants visuels ;
- layouts ;
- formulaire visuel ;
- responsive ;
- preview UI.

## Automation
- workflows ;
- triggers opérationnels ;
- conditions ;
- schedules ;
- executions.

## Pack Manager
- packaging ;
- manifest global ;
- validation globale Pack ;
- publication.

## Runtime
- load Pack ;
- resolution ;
- runtime cache ;
- runtime execution ;
- runtime diagnostics.

---

# 5. Principe de continuité

```text
KEEP       → fonctionnel
IMPROVE    → fonctionnel mais améliorable
FIX        → incorrect/vulnérable
COMPLETE   → partiel
ADAPT      → réutilisable
IMPLEMENT  → absent
```

Ne jamais reconstruire une fonctionnalité déjà saine.

---

# 6. Architecture fonctionnelle

```text
Business Manager
├── Vue d’ensemble
├── Applications
├── Versions
├── Modèles de données
│   ├── Entités
│   ├── Champs
│   └── Relations
├── Fonctionnalités
│   ├── Features
│   ├── Capabilities
│   └── Business Events
├── Navigation
├── Configuration
├── Métadonnées
├── Permissions
├── Contrats
└── Validation & publication
```

---

# 7. Navigation principale

Sidebar cible :

```text
CONSTRUCTION
└── Business Manager
    ├── Vue d’ensemble
    ├── Applications
    ├── Modèles de données
    ├── Fonctionnalités
    ├── Navigation
    ├── Configuration
    └── Validation & publication
```

Versions accessibles via :
- Application detail ;
- Context Bar.

---

# 8. Contexte

Toute opération BM s’effectue dans :

```text
Tenant
↓
Application
↓
Application Version
↓
Business Definition
```

Context Bar :

```text
TechBoutique / v1.2.0 / DRAFT
```

Un changement Application/Version recharge complètement le contexte.

---

# 9. Vue d’ensemble

Afficher uniquement des métriques réelles :

- Entities ;
- Fields ;
- Relations ;
- Features ;
- Capabilities ;
- Business Events ;
- Errors ;
- Warnings.

Afficher également :

- progression de configuration ;
- version active ;
- version en préparation ;
- dernière modification ;
- éléments incomplets ;
- validation status.

CTA :

```text
Continuer la configuration
```

---

# 10. Application

Modèle conceptuel :

```text
BusinessApplication
├── id
├── tenantId
├── key
├── name
├── description
├── status
├── category
├── icon
├── metadata
├── createdBy
├── createdAt
└── updatedAt
```

Actions :

- Create ;
- Update ;
- Duplicate ;
- Archive ;
- Restore ;
- Open ;
- Create Version.

---

# 11. Application Version

Une Application possède plusieurs versions.

Exemple :

```text
TechBoutique

v1.0.0  PUBLISHED
v1.1.0  PUBLISHED
v1.2.0  DRAFT
```

Chaque version isole totalement sa définition.

---

# 12. Version Lifecycle

Concept :

```text
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

Aligner avec les statuts existants.

Une version publiée est immutable.

---

# 13. Data Model

Business Manager construit la structure métier.

Exemple :

```text
Product
Category
Customer
Order
OrderItem
Invoice
Payment
```

---

# 14. Entity

Une Entity possède :

- stable key ;
- label ;
- description ;
- metadata ;
- lifecycle/version scope.

Règles :
- unique key dans le scope défini ;
- tenant/version scoped ;
- reference integrity.

---

# 15. Field

Types possibles selon architecture :

```text
STRING
TEXT
INTEGER
DECIMAL
BOOLEAN
DATE
DATETIME
UUID
ENUM
JSON
RELATION_REFERENCE
```

Chaque champ possède :
- key ;
- type ;
- required ;
- nullable ;
- default ;
- validation ;
- metadata.

---

# 16. Relation

Support minimum :

```text
ONE_TO_ONE
ONE_TO_MANY
MANY_TO_ONE
MANY_TO_MANY
```

Une Relation référence uniquement des Entities valides de la même Business Definition autorisée.

---

# 17. Feature Registry

Une Feature décrit une fonctionnalité métier stable.

Exemples :

```text
catalog.manage
order.create
order.validate
invoice.generate
```

Chaque Feature possède une clé stable.

---

# 18. Capability Registry

Une Capability décrit une capacité consommable par d’autres modules.

Exemples :

```text
catalog.product.read
catalog.product.write
order.workflow
inventory.stock
```

Une Capability doit être déclarée avant consommation.

---

# 19. Business Events

Exemples :

```text
product.created
order.created
order.validated
invoice.generated
```

Chaque Event possède :
- key ;
- payload contract ;
- version ;
- source ;
- metadata.

---

# 20. Navigation métier

Business Manager définit la structure fonctionnelle métier, pas l’UI finale.

Exemple :

```text
Catalogue
├── Produits
├── Catégories
└── Marques
```

UI Builder détermine le rendu visuel.

---

# 21. Configuration

Scopes possibles selon support réel :

```text
PLATFORM
TENANT
APPLICATION
APPLICATION_VERSION
ENVIRONMENT
```

Résolution conceptuelle :

```text
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

Le Runtime consomme une configuration résolue de façon déterministe.

---

# 22. Configuration Snapshot

Une version READY/PUBLISHED doit pouvoir référencer une configuration déterministe.

Objectif :

```text
same Pack
+
same context
=
same expected configuration
```

---

# 23. Metadata

Exemples :

- description ;
- category ;
- tags ;
- documentation ;
- display hints ;
- integration hints.

Interdit :
- JSON libre non gouverné utilisé comme substitut de modèle métier.

---

# 24. Permission References

Business Manager ne recrée pas IAM.

Il référence les permissions IAM.

Exemple :

```text
catalog.product.read
catalog.product.write
order.validate
```

Permission inconnue = validation error/warning selon contrat, jamais autorisation implicite.

---

# 25. Contracts

Contracts stables :

```text
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

---

# 26. Consumer Contracts

Consommateurs :

- UI Builder ;
- Automation ;
- Pack Manager ;
- Runtime ;
- AI Assistant.

Ils consomment des contrats propres et stables, pas les détails internes Prisma.

---

# 27. UI Builder Integration

UI Builder consomme :

- Application ;
- Version ;
- Entities ;
- Fields ;
- Relations ;
- Features ;
- Capabilities ;
- Permissions ;
- Configuration metadata.

Il ne recrée pas les Entities.

---

# 28. Automation Integration

Automation consomme :

- Entities ;
- Fields ;
- Relations ;
- Business Events ;
- Features ;
- Capabilities ;
- Permissions.

---

# 29. Pack Manager Integration

Pack Manager reçoit une Business Definition validée.

```text
ApplicationVersion
├── Business Definition
├── UI Definition
├── Automation Definition
└── Configuration
        ↓
       PACK
```

Business Manager ne publie pas le Pack global.

---

# 30. Runtime Integration

Runtime consomme uniquement :
- versions validées ;
- contrats compatibles ;
- snapshots/refs déterministes.

---

# 31. Business Definition

Structure indicative :

```json
{
  "schemaVersion": "3.0",
  "application": {},
  "version": {},
  "entities": [],
  "relations": [],
  "features": [],
  "capabilities": [],
  "events": [],
  "navigation": [],
  "configuration": {},
  "metadata": {}
}
```

---

# 32. Validation Engine

Contrôles :

```text
Application valid
Version valid
Entity valid
Field valid
Relation valid
Feature valid
Capability valid
Event valid
Permission reference valid
Configuration valid
No duplicate key
No invalid relation
No broken reference
Contract compatibility
```

---

# 33. Validation Levels

```text
ERROR
WARNING
INFO
```

ERROR bloque READY.

---

# 34. Validation Cockpit

Exemple :

```text
✓ Application valide
✓ 12 Entities
✓ 84 Fields
✓ 18 Relations
✓ 9 Features
✓ 23 Capabilities
⚠ 2 Warnings
✕ 1 Error
```

Chaque problème doit ouvrir l’élément concerné.

---

# 35. Validation vs Publication

```text
Business Manager
→ valide Business Definition

Pack Manager
→ valide Pack complet
→ publie Pack
```

Pas de publication globale concurrente dans BM.

---

# 36. Revisions / Snapshots

Toute modification significative doit pouvoir être tracée.

Une version publiée reste immutable.

Une version DRAFT peut produire :
- revisions ;
- diff ;
- snapshots.

---

# 37. AI Assistant

L’IA propose, elle ne modifie pas silencieusement.

Pipeline :

```text
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

---

# 38. Tenant Isolation

Chaque ressource BM est tenant-scoped :

- Application ;
- Version ;
- Entity ;
- Field ;
- Relation ;
- Feature ;
- Capability ;
- Event ;
- Navigation ;
- Configuration ;
- Contract ;
- Validation.

Frontend `tenantId` n’est jamais autorité.

---

# 39. Permissions backend

Permissions conceptuelles :

```text
bm.read
bm.write
bm.application.create
bm.application.update
bm.version.create
bm.model.read
bm.model.write
bm.feature.read
bm.feature.write
bm.config.read
bm.config.write
bm.contract.read
bm.contract.write
bm.validate
```

Réutiliser le Permission Registry réel.

---

# 40. Audit Fields

Server-owned :

```text
createdBy
updatedBy
validatedBy
archivedBy
```

Source :
- IAM principal.

Jamais body frontend.

---

# 41. API conceptuelle

Applications :

```http
GET    /applications
POST   /applications
GET    /applications/:id
PATCH  /applications/:id
```

Versions :

```http
GET  /applications/:id/versions
POST /applications/:id/versions
GET  /versions/:id
PATCH /versions/:id
```

Entities :

```http
GET    /versions/:id/entities
POST   /versions/:id/entities
GET    /entities/:id
PATCH  /entities/:id
DELETE /entities/:id
```

Fields :

```http
GET    /entities/:id/fields
POST   /entities/:id/fields
PATCH  /fields/:id
DELETE /fields/:id
```

Relations :

```http
GET    /versions/:id/relations
POST   /versions/:id/relations
PATCH  /relations/:id
DELETE /relations/:id
```

Validation :

```http
POST /versions/:id/validate
GET  /versions/:id/validation
```

Adapter aux routes existantes.

---

# 42. Consumer API

Exemples :

```http
GET /versions/:id/business-definition
GET /versions/:id/entity-registry
GET /versions/:id/feature-registry
GET /versions/:id/capability-registry
GET /versions/:id/event-registry
GET /versions/:id/configuration-schema
```

Ne créer que si absence d’équivalent stable.

---

# 43. Prisma

Avant modification :

1. lire schema.prisma ;
2. mapper modèles existants ;
3. réutiliser ;
4. compléter uniquement nécessaire ;
5. respecter UUID ;
6. respecter tenantId ;
7. respecter FK/composite FK ;
8. indexes ;
9. unique constraints ;
10. migration additive contrôlée.

---

# 44. Règles critiques

1. Toute Application appartient à un Tenant.
2. Toute Version appartient à une Application.
3. Toute ressource est tenant-scoped.
4. Entity key stable.
5. Field key unique dans son Entity.
6. Relation références valides.
7. Feature key stable.
8. Capability déclarée avant consommation.
9. Event contract valide.
10. Permissions référencées via IAM.
11. ERROR bloque READY.
12. PUBLISHED immutable.
13. DRAFT n’altère jamais PUBLISHED.
14. UI Builder ne duplique pas le modèle.
15. Automation ne redéfinit pas Entities.
16. Pack Manager reste propriétaire publication.
17. frontend ne décide jamais Tenant.
18. changements significatifs auditables.
19. aucun mock silencieux en REAL.

---

# 45. Tests

Unit :
- Entity ;
- Field ;
- Relation ;
- Feature ;
- Capability ;
- Event ;
- Config ;
- references ;
- lifecycle ;
- serialization.

Integration :
- IAM → BM ;
- BM → UI Builder ;
- BM → Automation ;
- BM → Pack Manager ;
- Pack Manager → Runtime.

Security :
- cross-tenant ;
- unauthorized write ;
- contracts ;
- invalid permission reference ;
- malformed definition.

---

# 46. E2E

```text
Login
↓
Business Manager
↓
Create Application
↓
Create Version
↓
Create Entity
↓
Fields
↓
Relations
↓
Features
↓
Capabilities
↓
Business Events
↓
Configuration
↓
Validate
↓
UI Builder
↓
Automation
↓
Pack Manager
↓
Publish
↓
Runtime
```

---

# 47. Definition of Done

Business Manager est DONE si :

- fonctionnalités existantes préservées ;
- tenant isolation complète ;
- permissions backend ;
- contracts sécurisés ;
- Application/Version stables ;
- registries cohérents ;
- validation réelle ;
- PUBLISHED immutable ;
- consumer contracts stables ;
- cross-tenant tests verts ;
- Prisma/build/tests verts ;
- UI complète ;
- aucune publication globale concurrente ;
- aucun mock silencieux.
