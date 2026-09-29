# PM-CDC-04 — Module Manager

**Projet :** Techzone Cloud  
**Module :** Pack Manager  
**Équipe :** Team 3 — Business Manager, Pack & UI Runtime  
**Référence :** PM-CDC-04  
**Version :** 1.0  
**Statut :** Cahier des charges fonctionnel et technique  
**Dépendances obligatoires :** PM-CDC-00 — Socle, Architecture & Contrats communs ; PM-CDC-03 — Pack Version Manager  
**Stack cible :** React · NestJS · Prisma · PostgreSQL

---

## 1. Objet

PM-CDC-04 définit le **Module Manager**, responsable de la structure modulaire d’une `PackVersion`.

Il répond à la question :

> **Quels modules composent une version de pack, dans quel ordre, avec quelle configuration et dans quel état ?**

Le Module Manager permet de créer, organiser, configurer, activer, désactiver, dupliquer et supprimer logiquement les modules d’une version de pack encore modifiable.

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
PACK
 ↓
PACK VERSION
 ↓
MODULES
 ↓
FEATURES / CAPABILITIES
 ↓
DEPENDENCIES
 ↓
RULES / CONDITIONS
```

---

## 3. Responsabilité fonctionnelle

PM-CDC-04 doit permettre de :

- afficher les modules d’une PackVersion ;
- créer un module ;
- modifier son identité ;
- définir son ordre ;
- activer/désactiver un module ;
- dupliquer un module ;
- archiver ou retirer un module d’une version mutable ;
- associer sa configuration ;
- consulter les features/capabilities liées ;
- consulter ses dépendances ;
- consulter ses règles ;
- détecter les incohérences ;
- exposer un résumé stable aux autres CDC.

---

## 4. Ce que PM-CDC-04 ne gère pas directement

Il ne doit pas :

- gérer les versions de pack ;
- définir le détail métier des features ;
- résoudre les dépendances finales ;
- exécuter les règles ;
- exécuter le module ;
- connaître les tables ERP ;
- gérer l’autorisation IAM complète.

Ces responsabilités appartiennent à PM-CDC-03, PM-CDC-05, PM-CDC-06, PM-CDC-07 et aux couches Runtime/IAM.

---

## 5. Modèle conceptuel PackModule

Champs recommandés :

```text
id
tenantId
packVersionId
code
name
shortName
description
moduleType
status
enabled
displayOrder
iconKey
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

## 6. Code du module

Exemples :

```text
products
inventory
warehouses
transfers
alerts
reports
```

Règles :

- obligatoire ;
- unique dans une PackVersion ;
- stable dans la version ;
- lowercase recommandé ;
- sans espace ;
- caractères sûrs uniquement.

Regex indicative :

```text
^[a-z][a-z0-9_-]{1,63}$
```

---

## 7. Nom du module

Exemple :

```text
code      = inventory
name      = Gestion des inventaires
shortName = Inventaire
```

Le nom est destiné à l’administration.

Le libellé final visible par l’utilisateur pourra être adapté par la couche UI Runtime.

---

## 8. Module Type

Types recommandés :

```text
BUSINESS
SUPPORT
CONFIGURATION
REPORTING
INTEGRATION
SYSTEM
```

### BUSINESS
Fonction métier principale.

### SUPPORT
Fonction complémentaire.

### CONFIGURATION
Paramétrage métier.

### REPORTING
Rapports et analyses.

### INTEGRATION
Pont fonctionnel vers une intégration.

### SYSTEM
Module interne nécessaire au pack.

---

## 9. Status

États recommandés :

```text
DRAFT
ACTIVE
DISABLED
DEPRECATED
ARCHIVED
```

Attention :

```text
status
```

et

```text
enabled
```

ne représentent pas exactement la même chose.

`status` décrit le lifecycle du module dans la définition.

`enabled` indique son activation dans cette version.

---

## 10. Activation

Un module peut être :

```text
enabled = true
enabled = false
```

L’activation peut être limitée par :

- règles ;
- dépendances ;
- features ;
- capabilities ;
- plan/tenant ;
- environnement.

Le Module Manager stocke l’intention de configuration. La décision runtime finale appartient au Pack Runtime.

---

## 11. Ordre des modules

Chaque module possède :

```text
displayOrder
```

L’ordre doit pouvoir être modifié par :

- drag & drop ;
- boutons monter/descendre ;
- édition numérique si nécessaire.

Le backend doit rester autoritaire et normaliser l’ordre.

---

## 12. Drag & Drop

Flux recommandé :

```text
Utilisateur déplace Module B
 ↓
Frontend calcule ordre souhaité
 ↓
PATCH reorder
 ↓
Backend valide
 ↓
Transaction
 ↓
Nouvel ordre retourné
```

Ne pas faire confiance uniquement aux index envoyés par React.

---

## 13. Création d’un module

Champs minimaux :

```text
code
name
moduleType
enabled
```

Champs optionnels :

```text
shortName
description
iconKey
configuration
metadata
```

Flux :

```text
Créer Module
 ↓
Valider identité
 ↓
Vérifier unicité
 ↓
Vérifier PackVersion mutable
 ↓
Créer
 ↓
Validation PackVersion → OUTDATED
 ↓
Audit / Outbox
```

---

## 14. Modification

Modification possible uniquement si la PackVersion est mutable.

Exemple :

```text
DRAFT
CONFIGURING
INVALID
```

Une PackVersion `PUBLISHED` est READ_ONLY.

---

## 15. Duplication

Le Module Manager peut dupliquer un module dans la même PackVersion.

Flux :

```text
Module source
 ↓
Dupliquer
 ↓
Nouveau code
 ↓
Nouveau nom
 ↓
Copier configuration autorisée
 ↓
Créer module
```

Les identifiants et liens internes doivent être recalculés.

---

## 16. Retrait / Archivage

Dans une version DRAFT, un module peut être retiré.

Avant retrait :

- vérifier features liées ;
- vérifier dependencies ;
- vérifier rules ;
- vérifier references internes ;
- afficher impact preview.

Le système ne doit jamais laisser des références orphelines silencieuses.

---

## 17. Analyse d’impact

Avant suppression logique ou désactivation importante :

```text
Module
 ↓
Features ?
 ↓
Capabilities ?
 ↓
Dependencies ?
 ↓
Rules ?
 ↓
References ?
 ↓
Impact Report
```

Rapport :

```text
blocking[]
warnings[]
infos[]
```

---

## 18. Configuration du module

Le champ `configuration` contient uniquement de la configuration déclarative.

Exemple :

```json
{
  "defaultView": "list",
  "allowExport": true,
  "pageSize": 25
}
```

Interdit :

- secrets ;
- credentials ;
- code exécutable ;
- SQL ;
- JavaScript arbitraire.

---

## 19. Configuration Schema

Chaque type de module peut référencer un schéma de configuration versionné.

Exemple :

```text
configurationSchemaRef
configurationSchemaVersion
```

Le backend valide la configuration avant sauvegarde.

---

## 20. Metadata

`metadata` permet d’ajouter des propriétés non structurantes.

Les metadata doivent :

- être namespacées si nécessaire ;
- avoir une taille limitée ;
- être validées ;
- ne pas contourner les champs structurés.

---

## 21. Liste des modules

Colonnes recommandées :

```text
Ordre
Nom
Code
Type
Statut
Enabled
Features
Capabilities
Dependencies
Dernière modification
Actions
```

---

## 22. Filtres

Filtres :

```text
moduleType
status
enabled
search
```

---

## 23. Recherche

Recherche par :

- code ;
- name ;
- shortName ;
- description.

---

## 24. Fiche Module

Sections :

```text
Résumé
Configuration
Features
Capabilities
Dépendances
Règles
Références
Historique
Audit
```

---

## 25. Features liées

PM-CDC-04 affiche un résumé provenant de PM-CDC-05.

Exemple :

```text
Features : 8
Enabled  : 6
Disabled : 2
```

PM-CDC-04 ne doit pas dupliquer la logique complète de PM-CDC-05.

---

## 26. Capabilities liées

Exemple :

```text
stock.product.read
stock.product.create
stock.inventory.execute
```

Le Module Manager permet de visualiser les capabilities attachées au module via le contrat PM-CDC-05.

---

## 27. Dependencies liées

Résumé provenant de PM-CDC-06 :

```text
Required   2
Optional   1
Conflicts  0
```

---

## 28. Rules liées

Résumé provenant de PM-CDC-07 :

```text
Activation Rules : 3
Valid            : 3
Invalid          : 0
```

---

## 29. API — Liste

```http
GET /api/pack-manager/versions/:versionId/modules
```

Query :

```text
search?
moduleType?
status?
enabled?
cursor?
limit?
sort?
```

---

## 30. API — Détail

```http
GET /api/pack-manager/modules/:id
```

---

## 31. API — Création

```http
POST /api/pack-manager/versions/:versionId/modules
```

Exemple :

```json
{
  "code": "inventory",
  "name": "Inventaire",
  "moduleType": "BUSINESS",
  "enabled": true,
  "iconKey": "boxes"
}
```

---

## 32. API — Modification

```http
PATCH /api/pack-manager/modules/:id
```

Inclure :

```text
rowVersion
```

---

## 33. API — Reorder

```http
POST /api/pack-manager/versions/:versionId/modules/reorder
```

Exemple :

```json
{
  "items": [
    {"moduleId": "mod_a", "displayOrder": 10},
    {"moduleId": "mod_b", "displayOrder": 20}
  ]
}
```

---

## 34. API — Duplicate

```http
POST /api/pack-manager/modules/:id/duplicate
```

---

## 35. API — Enable / Disable

```http
POST /api/pack-manager/modules/:id/enable
POST /api/pack-manager/modules/:id/disable
```

---

## 36. API — Impact

```http
GET /api/pack-manager/modules/:id/impact
```

À utiliser avant retrait/archivage.

---

## 37. API — Archive

```http
POST /api/pack-manager/modules/:id/archive
```

---

## 38. Permissions IAM

Permissions recommandées :

```text
pack.module.read
pack.module.create
pack.module.update
pack.module.reorder
pack.module.duplicate
pack.module.enable
pack.module.disable
pack.module.archive
```

---

## 39. Multi-tenant

Le module hérite du tenant de sa PackVersion.

Chaque requête doit vérifier la chaîne :

```text
Tenant
 ↓
Pack
 ↓
PackVersion
 ↓
Module
```

Aucune référence inter-tenant non autorisée.

---

## 40. PackVersion mutability guard

Avant toute écriture :

```text
PackVersion.status
```

doit être vérifié.

Pseudo-règle :

```text
if version.isImmutable():
    reject PACK_VERSION_IMMUTABLE
```

---

## 41. Optimistic Locking

Chaque module possède :

```text
rowVersion
```

En conflit :

```text
409 CONFLICT
PACK_MODULE_CONFLICT
```

---

## 42. Invalidation

Toute modification structurelle d’un module doit invalider :

```text
PackVersion.validationStatus → OUTDATED
PackVersion.manifestStatus   → OUTDATED
```

Si applicable :

```text
dependency resolution cache → invalidate
```

---

## 43. Audit

Événements :

```text
pack.module.created
pack.module.updated
pack.module.reordered
pack.module.duplicated
pack.module.enabled
pack.module.disabled
pack.module.archived
```

---

## 44. Outbox Events

Événements utiles :

```text
pack.module.created
pack.module.updated
pack.module.reordered
pack.module.enabled
pack.module.disabled
pack.module.archived
```

Consommateurs :

- PM-CDC-01 ;
- PM-CDC-03 ;
- PM-CDC-05 ;
- Pack Runtime.

---

## 45. Codes d’erreur

```text
PACK_MODULE_NOT_FOUND
PACK_MODULE_CODE_INVALID
PACK_MODULE_CODE_ALREADY_EXISTS
PACK_MODULE_CONFLICT
PACK_MODULE_INVALID_TYPE
PACK_MODULE_INVALID_STATE
PACK_MODULE_ARCHIVED
PACK_MODULE_OPERATION_FORBIDDEN
PACK_MODULE_REMOVE_BLOCKED
PACK_VERSION_IMMUTABLE
PACK_MODULE_CONFIG_INVALID
```

---

## 46. Frontend React

Organisation indicative :

```text
src/features/pack-manager/modules/
├── pages/
├── components/
├── forms/
├── hooks/
├── services/
├── types/
└── tests/
```

Composants :

```text
ModuleList
ModuleCard
ModuleForm
ModuleStatusBadge
ModuleTypeBadge
ModuleOrderEditor
ModuleConfigEditor
ModuleImpactDialog
ModuleDuplicateDialog
ModuleArchiveDialog
```

---

## 47. Maquette fonctionnelle

```text
PACK STOCK / VERSION 1.2.0
MODULES

┌────┬────────────────┬────────────┬─────────┬────────┐
│ #  │ Module         │ Type       │ Enabled │ Status │
├────┼────────────────┼────────────┼─────────┼────────┤
│ 10 │ Produits       │ BUSINESS   │ Yes     │ ACTIVE │
│ 20 │ Entrepôts      │ BUSINESS   │ Yes     │ ACTIVE │
│ 30 │ Inventaire     │ BUSINESS   │ Yes     │ ACTIVE │
│ 40 │ Alertes        │ SUPPORT    │ No      │ ACTIVE │
└────┴────────────────┴────────────┴─────────┴────────┘

[+ Ajouter module]
```

---

## 48. UX Drag & Drop

Le déplacement doit :

- afficher clairement la position cible ;
- être accessible au clavier ;
- afficher un état saving ;
- restaurer l’ancien ordre si erreur backend.

---

## 49. UX Désactivation

Avant désactivation :

```text
Ce module expose 4 features
2 capabilities
1 dépendance REQUIRED
```

Afficher l’impact et demander confirmation lorsque nécessaire.

---

## 50. États UI

```text
LOADING
READY
EMPTY
ERROR
FORBIDDEN
READ_ONLY
SAVING
REORDERING
CONFLICT
IMPACT_ANALYSIS
```

---

## 51. Backend NestJS

Structure indicative :

```text
src/pack-manager/modules/
├── modules.controller.ts
├── modules.service.ts
├── modules.repository.ts
├── module-order.service.ts
├── module-impact.service.ts
├── module-config-validator.service.ts
├── dto/
├── domain/
└── tests/
```

---

## 52. Prisma — Modèle conceptuel

```text
PackModule
├── id
├── tenantId
├── packVersionId
├── code
├── name
├── shortName
├── description
├── moduleType
├── status
├── enabled
├── displayOrder
├── iconKey
├── configuration
├── metadata
├── createdAt/by
├── updatedAt/by
├── archivedAt
└── rowVersion
```

Relations :

```text
PackVersion 1 ─── N PackModule
PackModule  1 ─── N ModuleFeature
PackModule  1 ─── N Dependency
PackModule  1 ─── N ActivationRule
```

---

## 53. Contraintes DB

Prévoir :

```text
UNIQUE(packVersionId, code)
INDEX(packVersionId, displayOrder)
INDEX(packVersionId, enabled)
INDEX(moduleType)
INDEX(status)
```

L’ordre peut être exprimé avec espacements :

```text
10, 20, 30, 40
```

pour réduire les réécritures lors de petits changements.

---

## 54. Validation Module

Contrôles :

- code valide ;
- nom présent ;
- type valide ;
- configuration valide ;
- ordre valide ;
- PackVersion mutable ;
- références existantes ;
- aucune référence inter-tenant ;
- aucune configuration secrète.

---

## 55. Validation globale

PM-CDC-03 doit pouvoir demander :

```text
validateModules(packVersionId)
```

Réponse contractuelle :

```json
{
  "status": "VALID",
  "errors": [],
  "warnings": [],
  "summary": {
    "modules": 5,
    "enabled": 4
  }
}
```

---

## 56. Contrat Module Summary

Contrat recommandé vers PM-CDC-03 :

```json
{
  "moduleId": "mod_inventory",
  "code": "inventory",
  "enabled": true,
  "status": "ACTIVE",
  "featureCount": 8,
  "capabilityCount": 5,
  "dependencyCount": 2,
  "ruleCount": 3,
  "valid": true
}
```

Versionner ce contrat.

---

## 57. Mock / Simulation

Le développement doit être possible avant PM-CDC-05/06/07.

Providers :

```text
ModuleFeatureSummaryProvider
ModuleDependencySummaryProvider
ModuleRuleSummaryProvider
```

Chaque provider :

```text
Contract v1 🔒
├── Mock
└── Real
```

---

## 58. Contract Tests

Tester :

- Module Summary Contract ;
- Feature Summary ;
- Dependency Summary ;
- Rule Summary ;
- enums ;
- errors ;
- tenant isolation ;
- version compatibility.

---

## 59. Tests unitaires

- validation code ;
- mutability guard ;
- reorder ;
- duplication ;
- config validation ;
- impact analysis ;
- invalidation ;
- optimistic locking.

---

## 60. Tests intégration

- Prisma ;
- unique code/version ;
- reorder transaction ;
- tenant isolation ;
- audit ;
- outbox ;
- archivage ;
- filters/search.

---

## 61. Tests E2E web

```text
Ouvrir Pack
→ Version DRAFT
→ Modules
→ Ajouter Produits
→ Ajouter Inventaire
→ Réordonner
→ Modifier Inventaire
→ Désactiver
→ Voir impact
→ Réactiver
→ Vérifier validation version OUTDATED
```

---

## 62. Critères d’acceptation

PM-CDC-04 est conforme si :

- liste modules fonctionnelle ;
- création/modification fonctionnelles ;
- code unique par PackVersion ;
- réordonnancement fiable ;
- activation/désactivation ;
- duplication ;
- impact preview ;
- PackVersion immuable protégée ;
- invalidation validation/manifest ;
- IAM ;
- tenant isolation ;
- audit/outbox ;
- Mock/Contract Tests ;
- tests E2E web passants.

---

## 63. Definition of Done

```text
PM-CDC-04 DONE
├── PackModule Model
├── Module List
├── Module Detail
├── Create
├── Edit
├── Reorder
├── Enable / Disable
├── Duplicate
├── Impact Analysis
├── Archive
├── Config Validation
├── Version Mutability Guard
├── Invalidation
├── IAM
├── Tenant Isolation
├── Optimistic Locking
├── Audit
├── Outbox
├── Mock Contracts
├── Contract Tests
├── Unit Tests
├── Integration Tests
└── E2E Web
```

---

## 64. Résultat attendu

À la fin de PM-CDC-04, chaque version de pack possède une structure modulaire explicite, ordonnée et contrôlée :

```text
PACK VERSION
    ↓
MODULE 1
MODULE 2
MODULE 3
    ↓
FEATURES / CAPABILITIES
    ↓
DEPENDENCIES
    ↓
RULES
```

> **PM-CDC-04 définit la structure modulaire d’une PackVersion sans exécuter les modules. Il prépare une base cohérente que PM-CDC-05, PM-CDC-06, PM-CDC-07 et le Pack Runtime peuvent consommer par contrat.**
