# CAHIER DES CHARGES — TECHZONE CLOUD PACK MANAGER
## Étape 1 — Cible fonctionnelle et architecturale

**Projet :** Techzone Cloud  
**Module :** Pack Manager  
**Version cible :** 3.0  
**Statut :** Spécification cible  
**Principe :** assembler, valider, figer et publier une version complète et cohérente d’une application Techzone Cloud, sans dupliquer Business Manager, UI Builder, Automation ou Pack Runtime.

---

# 1. Objet

Pack Manager répond à :

```text
QUELLE VERSION COMPLÈTE DE L’APPLICATION
EST COHÉRENTE, VALIDÉE ET PUBLIABLE ?
```

Il agrège les définitions produites par les modules de construction.

---

# 2. Position dans Techzone Cloud

```text
BUSINESS MANAGER
Business Definition
        │
UI BUILDER
UI Definition
        │
AUTOMATION
Automation Definition
        │
CONFIGURATION
Configuration Snapshot
        │
        ▼
PACK MANAGER
Composition
Validation
Snapshot
Manifest
Publication
        │
        ▼
ENVIRONMENT & DEPLOYMENT
        │
        ▼
PACK RUNTIME
Load
Resolve
Activate
Execute
```

---

# 3. Responsabilités

Pack Manager possède :

- Pack ;
- Pack Version ;
- composition ;
- lien vers Application Version ;
- références Business/UI/Automation ;
- dependencies ;
- requirements ;
- capabilities ;
- validation globale ;
- snapshot immuable ;
- manifest ;
- hash/intégrité ;
- publication ;
- historique ;
- compatibility metadata.

---

# 4. Hors périmètre

Pack Manager ne possède pas :

## Business Manager
- Entity/Field/Relation ;
- Feature ;
- Business Event ;
- Business Definition authoring.

## UI Builder
- pages ;
- composants ;
- forms ;
- layouts ;
- preview.

## Automation
- workflow builder ;
- execution engine ;
- schedules.

## Deployment
- Environment ;
- Deployment ;
- rollback runtime.

## Pack Runtime
- load ;
- resolution effective ;
- activation ;
- execution ;
- runtime cache.

---

# 5. Continuité

```text
KEEP       → fonctionnel
IMPROVE    → fonctionnel mais améliorable
FIX        → incorrect
COMPLETE   → partiel
ADAPT      → réutilisable
IMPLEMENT  → absent
```

Ne pas réécrire le backend Pack Manager s’il fonctionne déjà.

---

# 6. Navigation

Dans `CONSTRUCTION` :

```text
Pack Manager
├── Vue d’ensemble
├── Packs
├── Versions
├── Validation
├── Manifest
├── Publications
└── Historique
```

Les sous-sections peuvent rester contextuelles pour éviter de surcharger la Sidebar.

---

# 7. Contexte

Toute opération :

```text
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

`applicationVersionId` est obligatoire pour une PackVersion si cette contrainte existe dans le modèle canonique.

---

# 8. Pack

Modèle conceptuel :

```text
Pack
├── id
├── tenantId
├── applicationId
├── key
├── name
├── description
├── status
├── metadata
├── createdBy
├── createdAt
└── updatedAt
```

---

# 9. Pack Version

Modèle conceptuel :

```text
PackVersion
├── id
├── tenantId
├── packId
├── applicationVersionId
├── versionNumber
├── label
├── releaseNotes
├── status
├── businessDefinitionRef
├── uiDefinitionRef
├── automationDefinitionRef
├── configurationSnapshotRef
├── manifestRef?
├── snapshotHash?
├── publishedAt?
├── createdBy
├── createdAt
└── updatedAt
```

---

# 10. Lien Application Version

Chaque PackVersion doit être liée à une ApplicationVersion valide.

Flux :

```text
Application
↓
ApplicationVersion
↓
Pack
↓
PackVersion
```

Règles :

- même Tenant ;
- même Application logique ;
- ApplicationVersion existante ;
- statut compatible ;
- pas de référence cross-tenant.

---

# 11. Composition

Une PackVersion référence :

```text
Business Definition
UI Definition
Automation Definition
Configuration Snapshot
Dependencies
Requirements
Compatibility Metadata
```

Ne pas recopier des structures si des snapshots/références immuables existent déjà.

---

# 12. Snapshot

Avant publication, le Pack Manager produit ou référence un snapshot immuable.

Le snapshot doit être :

- déterministe ;
- versionné ;
- hashable ;
- non mutable après publication ;
- traçable.

---

# 13. UI Snapshot

Le snapshot UI doit correspondre à la même ApplicationVersion que la PackVersion.

Règle :

```text
PackVersion.applicationVersionId
==
UiSnapshot.applicationVersionId
```

ou relation équivalente selon modèle réel.

---

# 14. Validation globale

Validation minimum :

```text
ApplicationVersion valid
Business Definition valid
UI Definition valid
Automation Definition valid or explicitly absent
Configuration valid
Dependencies resolved
Capabilities declared
Permissions references valid
Manifest constructible
No broken reference
No cross-version mismatch
No cross-tenant reference
```

---

# 15. Niveaux

```text
ERROR
WARNING
INFO
```

ERROR bloque publication.

---

# 16. Validation Result

Structure conceptuelle :

```text
stage
code
severity
message
resourceType
resourceId?
path?
details?
```

---

# 17. Manifest

Le Manifest est le contrat global de la version publiée.

Contenu indicatif :

```json
{
  "schemaVersion": "x",
  "pack": {},
  "packVersion": {},
  "application": {},
  "applicationVersion": {},
  "business": {},
  "ui": {},
  "automation": {},
  "configuration": {},
  "dependencies": [],
  "requirements": [],
  "capabilities": [],
  "compatibility": {},
  "integrity": {}
}
```

---

# 18. Manifest Rules

Le Manifest doit :

- être généré côté backend ;
- être déterministe ;
- être validé ;
- référencer uniquement des ressources autorisées ;
- ne contenir aucun secret ;
- inclure version/schema compatibility ;
- être hashé si architecture le prévoit.

---

# 19. Hash / Integrity

Avant publication :

```text
Snapshot
↓
Canonical Serialization
↓
Hash
↓
Persist
```

Après publication, la vérification d’intégrité doit détecter une mutation inattendue.

---

# 20. Dependencies

Une PackVersion peut avoir :

- internal dependencies ;
- runtime requirements ;
- capabilities ;
- connector requirements ;
- data requirements ;
- schema requirements.

Chaque dépendance doit être résolue ou explicitement validée.

---

# 21. Compatibility

Comparer :

```text
Pack Requirements
vs
Registry
vs
Runtime capabilities
vs
Environment capabilities later
```

Pack Manager prépare les metadata ; Deployment/Runtime font les validations contextuelles finales.

---

# 22. Publication

Flux :

```text
DRAFT
↓
VALIDATE
↓
SNAPSHOT
↓
GENERATE MANIFEST
↓
CHECK HASH / INTEGRITY
↓
PUBLISH
↓
IMMUTABLE
```

---

# 23. Publication Rules

Publication uniquement si :

- validation = PASS ;
- aucune ERROR ;
- snapshot complet ;
- Manifest valide ;
- dependencies résolues ;
- `applicationVersionId` valide ;
- integrity OK ;
- permissions OK.

---

# 24. Immutabilité

Une PackVersion publiée :

```text
PUBLISHED = READ ONLY
```

Toute modification requiert une nouvelle PackVersion.

---

# 25. Version Lifecycle

Concept :

```text
DRAFT
↓
VALIDATING
↓
READY
↓
PUBLISHED
↓
ARCHIVED
```

Adapter aux statuts réels.

---

# 26. Clone

Une nouvelle version peut être créée depuis une version précédente.

Le clonage doit :

- créer une nouvelle PackVersion ;
- conserver la source ;
- sélectionner explicitement l’ApplicationVersion cible ;
- ne pas modifier la source.

---

# 27. Audit

Tracer :

- Pack create/update/archive ;
- PackVersion create/clone ;
- ApplicationVersion selection ;
- validation ;
- snapshot ;
- Manifest generation ;
- publication ;
- archive.

---

# 28. IAM

Permissions conceptuelles :

```text
pack.read
pack.create
pack.update
pack.version.create
pack.version.update
pack.validate
pack.manifest.read
pack.publish
pack.archive
```

Adapter au Registry réel.

---

# 29. Tenant Isolation

Tenant A ne peut jamais :

- lire Pack B ;
- créer PackVersion sur ApplicationVersion B ;
- valider B ;
- générer Manifest B ;
- publier B ;
- lire snapshot B.

---

# 30. API conceptuelle

```http
GET    /api/packs
POST   /api/packs
GET    /api/packs/:id
PATCH  /api/packs/:id

GET    /api/packs/:id/versions
POST   /api/packs/:id/versions
GET    /api/pack-versions/:id
PATCH  /api/pack-versions/:id

POST   /api/pack-versions/:id/validate
GET    /api/pack-versions/:id/validation

POST   /api/pack-versions/:id/snapshot
GET    /api/pack-versions/:id/manifest
POST   /api/pack-versions/:id/publish
```

Adapter à l’existant.

---

# 31. UI Create Version

Le formulaire doit demander au minimum :

```text
Application Version *
Version Number *
Label
Release Notes
```

L’ApplicationVersion doit provenir d’une liste backend réelle et filtrée par Tenant/Application.

---

# 32. Version Selector

Afficher :

- version ;
- status ;
- validation ;
- last updated ;
- source if cloned.

Ne proposer que les versions admissibles.

---

# 33. Pack Overview

Métriques réelles :

- Packs ;
- Draft Versions ;
- Ready ;
- Published ;
- Validation Errors ;
- Recent Publications.

---

# 34. Pack Detail

Tabs :

```text
Overview
Versions
Dependencies
Requirements
Validation
Manifest
Publications
History
```

---

# 35. Validation Cockpit

Afficher par source :

```text
Business
UI
Automation
Configuration
Dependencies
Requirements
Integrity
```

---

# 36. Manifest Viewer

Read-only.

Fonctions :
- structured tree ;
- raw JSON ;
- schema version ;
- hash ;
- copy/download if supported.

Jamais de secrets.

---

# 37. Publication Confirmation

Afficher :

- Pack ;
- PackVersion ;
- ApplicationVersion ;
- validation status ;
- Manifest status ;
- hash ;
- warnings ;
- target next step = Deployment.

---

# 38. Intégration Business Manager

Business Manager fournit une ApplicationVersion et Business Definition validables.

Pack Manager ne les modifie pas.

---

# 39. Intégration UI Builder

UI Builder fournit la UI Definition/Snapshot pour l’ApplicationVersion.

---

# 40. Intégration Automation

Automation fournit une Automation Definition/Snapshot si utilisée.

---

# 41. Intégration Deployment

Deployment consomme uniquement PackVersion publiée + Manifest valide.

---

# 42. Intégration Pack Runtime

Runtime consomme la publication et la résout.

Pack Manager n’exécute rien.

---

# 43. Prisma

Avant modification :

- auditer modèles existants ;
- réutiliser ;
- respecter `applicationVersionId` ;
- tenantId ;
- FK ;
- indexes ;
- unique constraints ;
- migrations additives.

---

# 44. Tests

Unit :
- Pack ;
- Version ;
- validation ;
- snapshot ;
- manifest ;
- hash ;
- dependencies ;
- publication ;
- immutability.

Integration :
- BM → Pack Manager ;
- UI Builder → Pack Manager ;
- Automation → Pack Manager ;
- Pack Manager → Deployment ;
- Pack Manager → Runtime.

Security :
- cross-tenant ;
- forged ApplicationVersion ;
- unauthorized publish ;
- manifest tampering ;
- published mutation.

---

# 45. E2E

```text
Login
↓
Tenant
↓
Business Manager Application
↓
Application Version
↓
UI Builder Definition
↓
Automation Definition
↓
Pack Manager
↓
Create Pack
↓
Create PackVersion + applicationVersionId
↓
Validate
↓
Snapshot
↓
Manifest
↓
Publish
↓
Deployment
↓
Pack Runtime
```

---

# 46. Definition of Done

Pack Manager est DONE si :

- backend existant préservé ;
- UI création PackVersion fonctionnelle ;
- `applicationVersionId` obligatoire et sélectionnable ;
- acceptance script mis à jour ;
- validation réelle ;
- snapshot immuable ;
- Manifest déterministe ;
- hash vérifié ;
- publication sûre ;
- PUBLISHED immutable ;
- tenant isolation ;
- IAM ;
- tests cross-tenant ;
- E2E vert ;
- build vert.
