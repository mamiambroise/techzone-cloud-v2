# PM-CDC-06 — Dependency Manager

**Projet :** Techzone Cloud  
**Module :** Pack Manager  
**Équipe :** Team 3 — Business Manager, Pack & UI Runtime  
**Référence :** PM-CDC-06  
**Version :** 1.0  
**Statut :** Cahier des charges fonctionnel et technique  
**Dépendances obligatoires :** PM-CDC-00, PM-CDC-03, PM-CDC-04, PM-CDC-05  
**Stack cible :** React · NestJS · Prisma · PostgreSQL

---

## 1. Objet

PM-CDC-06 définit le **Dependency Manager**, responsable de la déclaration, validation, analyse et résolution des dépendances entre les éléments d’une version de pack et les capacités externes nécessaires à son fonctionnement.

Il répond à la question :

> **De quoi ce pack, ce module ou cette feature dépend-il pour être valide et exécutable ?**

Le Dependency Manager doit empêcher qu’une PackVersion soit publiée avec des dépendances obligatoires absentes, incompatibles, cycliques ou conflictuelles.

---

## 2. Position dans le Pack Manager

```text
PACK VERSION
     ↓
MODULES
     ↓
FEATURES / CAPABILITIES
     ↓
DEPENDENCIES          ← PM-CDC-06
     ↓
RULES / CONDITIONS
     ↓
VALIDATION
     ↓
PACK MANIFEST
```

PM-CDC-06 consomme principalement les définitions produites par PM-CDC-04 et PM-CDC-05 et fournit ses résultats à PM-CDC-03, PM-CDC-07 et au Pack Runtime.

---

## 3. Responsabilités

PM-CDC-06 doit permettre de :

- créer une dépendance ;
- modifier une dépendance ;
- retirer/archiver une dépendance ;
- déclarer une dépendance obligatoire ou optionnelle ;
- déclarer une incompatibilité ;
- définir une plage de versions ;
- cibler un pack, module, feature ou capability ;
- analyser les dépendances transitives ;
- détecter les dépendances manquantes ;
- détecter les incompatibilités ;
- détecter les cycles ;
- produire un graphe de dépendances ;
- calculer un état de résolution ;
- produire un rapport d’impact ;
- contribuer à la validation et au Pack Manifest.

---

## 4. Types de dépendances

Types obligatoires :

```text
REQUIRED
OPTIONAL
CONFLICTS_WITH
RECOMMENDS
IMPLIES
```

### REQUIRED
La cible doit être disponible.

### OPTIONAL
La cible améliore le fonctionnement mais son absence ne bloque pas nécessairement.

### CONFLICTS_WITH
La source et la cible ne doivent pas coexister dans le contexte défini.

### RECOMMENDS
Dépendance recommandée, non bloquante.

### IMPLIES
L’activation de la source implique logiquement l’activation ou la disponibilité de la cible.

---

## 5. Niveaux de dépendance

Une dépendance peut partir de :

```text
PACK
MODULE
FEATURE
CAPABILITY
```

et cibler :

```text
PACK
MODULE
FEATURE
CAPABILITY
```

Exemples :

```text
Pack Stock
REQUIRED → Pack Catalog

Module Inventory
REQUIRED → Feature stock.product

Feature stock.low_stock_alert
REQUIRES → Capability stock.product.read

Pack Legacy
CONFLICTS_WITH → Pack NewStock
```

---

## 6. Modèle conceptuel Dependency

Champs recommandés :

```text
id
tenantId
packVersionId
sourceType
sourceId
dependencyType
targetType
targetRef
targetVersionRange
required
conditionRef
reason
status
resolutionStatus
metadata
createdAt
createdBy
updatedAt
updatedBy
archivedAt
rowVersion
```

---

## 7. Source Type

```text
PACK
MODULE
FEATURE
CAPABILITY
```

`sourceId` doit appartenir au contexte de la PackVersion concernée, sauf cas contractuel explicitement autorisé.

---

## 8. Target Type

```text
PACK
MODULE
FEATURE
CAPABILITY
CONTRACT
```

Le type `CONTRACT` permet éventuellement de déclarer une dépendance à une version contractuelle de plateforme.

---

## 9. Target Reference

La cible doit être référencée par un identifiant ou code stable.

Exemples :

```text
catalog
catalog.products
stock.product.read
techzone.pack-manifest
```

Ne jamais dépendre d’un ID temporaire ou d’une table interne d’un ERP externe.

---

## 10. Version Range

Pour les cibles versionnées, supporter des contraintes telles que :

```text
1.2.0
>=1.2.0
>=1.0.0 <2.0.0
^1.4.0
~1.4.2
```

La syntaxe exacte doit être normalisée côté backend.

---

## 11. Version Range Validation

Le backend doit :

- parser la contrainte ;
- la normaliser ;
- refuser les expressions invalides ;
- vérifier la compatibilité avec les versions connues ;
- conserver la forme canonique.

---

## 12. Resolution Status

États recommandés :

```text
NOT_RESOLVED
RESOLVING
RESOLVED
MISSING
INCOMPATIBLE
CONFLICT
CYCLE
ERROR
OUTDATED
```

---

## 13. Résolution

Le resolver doit répondre :

```text
Dependency
 ↓
Target exists ?
 ↓
Version compatible ?
 ↓
Target active ?
 ↓
Required capabilities available ?
 ↓
Conflict ?
 ↓
Cycle ?
 ↓
RESOLVED / ERROR STATE
```

---

## 14. Résolution locale et externe

Deux catégories :

### Local
Cible située dans la même PackVersion.

### Externe
Cible fournie par :

- autre pack ;
- Data Runtime ;
- ERP Adapter ;
- Integration Layer ;
- Platform Contract ;
- autre registry autorisé.

Les dépendances externes sont résolues exclusivement par contrat.

---

## 15. Capability Dependency

Cas important :

```text
Feature
 ↓ REQUIRES
Capability
 ↓
Capability Registry
 ↓
Provider disponible ?
```

PM-CDC-06 ne doit pas connaître l’implémentation du provider.

---

## 16. Graphe de dépendances

Le système doit construire un graphe orienté.

```text
Pack A
 ├── REQUIRED → Pack B
 │                 └── REQUIRED → Pack C
 └── OPTIONAL → Pack D
```

Le graphe doit permettre :

- navigation ;
- diagnostic ;
- détection de cycle ;
- impact analysis ;
- visualisation.

---

## 17. Dépendances transitives

Exemple :

```text
A → B
B → C
```

Alors A possède une dépendance transitive vers C.

Le système doit distinguer :

```text
DIRECT
TRANSITIVE
```

---

## 18. Détection de cycles

Exemple interdit :

```text
A → B
B → C
C → A
```

Résultat :

```text
CYCLE
```

Le rapport doit fournir le chemin :

```text
A → B → C → A
```

Un cycle bloquant empêche la validation de la version.

---

## 19. Conflits

Exemple :

```text
Pack A
CONFLICTS_WITH
Pack B
```

Si A et B sont sélectionnés dans le même contexte :

```text
resolutionStatus = CONFLICT
```

Le rapport doit indiquer les deux sources et la raison.

---

## 20. Dépendance manquante

Une dépendance REQUIRED non trouvée :

```text
MISSING
```

Elle bloque :

```text
VALID
READY
PUBLISHED
```

---

## 21. Dépendance optionnelle manquante

Une dépendance OPTIONAL absente produit généralement :

```text
WARNING
```

et non une erreur bloquante.

---

## 22. Incompatibilité de version

Exemple :

```text
Required: Catalog >=2.0.0
Available: Catalog 1.8.0
```

Résultat :

```text
INCOMPATIBLE
```

---

## 23. Impact Analysis

Avant modification ou retrait d’une dépendance :

```text
Dependency
 ↓
Consumers ?
 ↓
Transitive impact ?
 ↓
Capabilities ?
 ↓
Features ?
 ↓
Rules ?
 ↓
Versions ?
 ↓
Impact Report
```

Le rapport contient :

```text
blocking[]
warnings[]
infos[]
```

---

## 24. Liste des dépendances

Colonnes recommandées :

```text
Source
Type
Target
Version Range
Resolution
Direct/Transitive
Reason
Updated At
Actions
```

---

## 25. Filtres

```text
dependencyType
sourceType
targetType
resolutionStatus
required
search
```

---

## 26. Fiche Dependency

Sections :

```text
Résumé
Source
Cible
Version Constraint
Resolution
Providers
Impact
Transitive Dependencies
Rules associées
Historique
Audit
```

---

## 27. Visualisation Graphe

Vue optionnelle mais fortement recommandée.

Fonctions :

- zoom ;
- navigation ;
- filtre par type ;
- couleur/forme par état ;
- sélection d’un nœud ;
- affichage du chemin problématique.

L’état ne doit jamais être communiqué uniquement par couleur.

---

## 28. Création

Flux :

```text
Ajouter Dependency
 ↓
Choisir Source
 ↓
Choisir Type
 ↓
Choisir Target Type
 ↓
Rechercher Target
 ↓
Version Range
 ↓
Reason
 ↓
Preview Resolution
 ↓
Créer
```

---

## 29. Preview Resolution

Avant sauvegarde, le backend peut simuler :

```http
POST /api/pack-manager/dependencies/preview
```

Résultat :

```text
RESOLVED
WARNING
BLOCKED
```

avec explication.

---

## 30. Modification

Uniquement si la PackVersion est mutable.

Toute modification structurelle invalide :

```text
validationStatus
manifestStatus
dependency resolution cache
```

---

## 31. Suppression / Archivage

Avant retrait :

- vérifier consommateurs ;
- analyser transitivité ;
- vérifier rules ;
- vérifier capabilities ;
- afficher impact.

Suppression physique interdite par défaut.

---

## 32. API — Liste

```http
GET /api/pack-manager/versions/:versionId/dependencies
```

---

## 33. API — Détail

```http
GET /api/pack-manager/dependencies/:id
```

---

## 34. API — Création

```http
POST /api/pack-manager/versions/:versionId/dependencies
```

Exemple :

```json
{
  "sourceType": "FEATURE",
  "sourceId": "feat_alert",
  "dependencyType": "REQUIRED",
  "targetType": "CAPABILITY",
  "targetRef": "stock.product.read",
  "required": true,
  "reason": "Lecture des produits nécessaire aux alertes"
}
```

---

## 35. API — Modification

```http
PATCH /api/pack-manager/dependencies/:id
```

Avec `rowVersion`.

---

## 36. API — Resolve

```http
POST /api/pack-manager/versions/:versionId/dependencies/resolve
```

Retourne un rapport global.

---

## 37. API — Graph

```http
GET /api/pack-manager/versions/:versionId/dependencies/graph
```

---

## 38. API — Impact

```http
GET /api/pack-manager/dependencies/:id/impact
```

---

## 39. API — Archive

```http
POST /api/pack-manager/dependencies/:id/archive
```

---

## 40. Resolution Report

Structure conceptuelle :

```json
{
  "status": "INVALID",
  "summary": {
    "total": 12,
    "resolved": 9,
    "missing": 1,
    "incompatible": 1,
    "conflicts": 0,
    "cycles": 1
  },
  "issues": [
    {
      "code": "PACK_DEPENDENCY_MISSING",
      "severity": "ERROR",
      "path": "feature:stock.alert -> capability:stock.product.read"
    }
  ]
}
```

---

## 41. Permissions IAM

```text
pack.dependency.read
pack.dependency.create
pack.dependency.update
pack.dependency.resolve
pack.dependency.archive
pack.dependency.view_graph
```

---

## 42. Multi-tenant

Le resolver doit respecter le tenant.

Une cible d’un autre tenant ne doit jamais être considérée disponible sauf contrat inter-tenant explicitement prévu par la plateforme.

---

## 43. PackVersion Mutability Guard

Toute écriture :

```text
PackVersion mutable ?
```

Sinon :

```text
PACK_VERSION_IMMUTABLE
```

---

## 44. Optimistic Locking

Chaque Dependency modifiable utilise :

```text
rowVersion
```

Conflit :

```text
409
PACK_DEPENDENCY_CONCURRENT_MODIFICATION
```

---

## 45. Invalidation

Toute modification :

```text
validationStatus → OUTDATED
manifestStatus   → OUTDATED
resolution cache → INVALIDATED
```

---

## 46. Cache de résolution

Un résultat de résolution peut être mis en cache selon :

```text
tenantId
packVersionId
dependencyRevision
contextRevision
```

Le cache doit être invalidé lorsqu’un fournisseur, une capability ou une dépendance pertinente change.

---

## 47. Audit

Événements :

```text
pack.dependency.created
pack.dependency.updated
pack.dependency.archived
pack.dependency.resolved
pack.dependency.conflict_detected
pack.dependency.cycle_detected
```

---

## 48. Outbox Events

```text
pack.dependency.created
pack.dependency.updated
pack.dependency.archived
pack.dependency.resolution_changed
```

Consommateurs :

- PM-CDC-01 ;
- PM-CDC-03 ;
- PM-CDC-07 ;
- Pack Runtime ;
- Observability.

---

## 49. Codes d’erreur

```text
PACK_DEPENDENCY_NOT_FOUND
PACK_DEPENDENCY_INVALID_TYPE
PACK_DEPENDENCY_TARGET_NOT_FOUND
PACK_DEPENDENCY_MISSING
PACK_DEPENDENCY_INCOMPATIBLE
PACK_DEPENDENCY_CONFLICT
PACK_DEPENDENCY_CYCLE
PACK_DEPENDENCY_VERSION_RANGE_INVALID
PACK_DEPENDENCY_REMOVE_BLOCKED
PACK_DEPENDENCY_CONCURRENT_MODIFICATION
PACK_VERSION_IMMUTABLE
```

---

## 50. Backend NestJS

Structure indicative :

```text
src/pack-manager/dependencies/
├── dependencies.controller.ts
├── dependencies.service.ts
├── dependencies.repository.ts
├── dependency-resolver.service.ts
├── dependency-graph.service.ts
├── dependency-cycle-detector.service.ts
├── dependency-impact.service.ts
├── version-range.service.ts
├── providers/
├── dto/
└── tests/
```

---

## 51. Providers externes

Interfaces recommandées :

```text
PackRegistryProvider
CapabilityRegistryProvider
ContractRegistryProvider
RuntimeAvailabilityProvider
```

Chaque provider dépend d’un contrat versionné.

---

## 52. Mock / Simulation

```text
CapabilityRegistryContract v1 🔒
├── MockCapabilityRegistry
└── RealCapabilityRegistry

PackRegistryContract v1 🔒
├── MockPackRegistry
└── RealPackRegistry
```

Ainsi, le Dependency Manager peut être développé sans attendre tous les producteurs réels.

---

## 53. Contract Tests

Tester :

- Pack Registry Contract ;
- Capability Registry Contract ;
- Contract Registry ;
- Mock/Real providers ;
- version range ;
- états de résolution ;
- erreurs ;
- tenant isolation.

---

## 54. Frontend React

Structure indicative :

```text
src/features/pack-manager/dependencies/
├── pages/
├── components/
├── graph/
├── forms/
├── impact/
├── hooks/
├── services/
├── types/
└── tests/
```

Composants :

```text
DependencyList
DependencyForm
DependencyStatusBadge
DependencyGraph
DependencyPathViewer
DependencyImpactDialog
ResolutionReport
VersionRangeEditor
TargetPicker
```

---

## 55. Maquette fonctionnelle

```text
DEPENDENCIES — STOCK 1.2.0

┌──────────────┬──────────┬──────────────────────┬──────────────┐
│ Source       │ Type     │ Target               │ Resolution   │
├──────────────┼──────────┼──────────────────────┼──────────────┤
│ Inventory    │ REQUIRED │ catalog >=1.0        │ ✓ RESOLVED   │
│ Alert        │ REQUIRED │ stock.product.read   │ ✕ MISSING    │
│ Reports      │ OPTIONAL │ analytics.export     │ ⚠ MISSING    │
│ Legacy       │ CONFLICT │ new-stock            │ ✕ CONFLICT   │
└──────────────┴──────────┴──────────────────────┴──────────────┘
```

---

## 56. États UI

```text
LOADING
READY
EMPTY
ERROR
FORBIDDEN
READ_ONLY
RESOLVING
RESOLVED
CONFLICT
IMPACT_ANALYSIS
```

---

## 57. Prisma — Modèle conceptuel

```text
Dependency
├── id
├── tenantId
├── packVersionId
├── sourceType
├── sourceId
├── dependencyType
├── targetType
├── targetRef
├── targetVersionRange
├── required
├── conditionRef
├── reason
├── status
├── resolutionStatus
├── metadata
├── createdAt/by
├── updatedAt/by
├── archivedAt
└── rowVersion
```

Un modèle complémentaire peut conserver les résultats de résolution :

```text
DependencyResolution
├── id
├── dependencyId
├── status
├── resolvedTargetRef
├── resolvedVersion
├── details
├── resolvedAt
└── revision
```

---

## 58. Contraintes DB

Prévoir :

```text
INDEX(packVersionId)
INDEX(sourceType, sourceId)
INDEX(targetType, targetRef)
INDEX(resolutionStatus)
INDEX(dependencyType)
```

Les doublons exacts doivent être empêchés selon la combinaison métier retenue.

---

## 59. Contribution au Pack Manifest

Exemple :

```json
{
  "dependencies": [
    {
      "type": "REQUIRED",
      "targetType": "PACK",
      "target": "catalog",
      "version": ">=1.0.0"
    },
    {
      "type": "REQUIRED",
      "targetType": "CAPABILITY",
      "target": "stock.product.read"
    }
  ]
}
```

Le format final reste gouverné par PM-CDC-00.

---

## 60. Validation globale PM-CDC-03

Contrat :

```text
validateDependencies(packVersionId)
```

Réponse :

```json
{
  "status": "INVALID",
  "errors": [],
  "warnings": [],
  "summary": {
    "total": 12,
    "resolved": 10,
    "blocking": 2
  }
}
```

---

## 61. Suggestions avec IA

L’IA peut aider à :

- détecter une dépendance probablement oubliée ;
- suggérer une version compatible ;
- expliquer un conflit complexe ;
- résumer un graphe ;
- suggérer une correction ;
- repérer des dépendances redondantes.

Mais :

```text
IA = ASSISTANCE
RESOLVER DÉTERMINISTE = AUTORITÉ
```

L’IA ne décide jamais seule qu’une dépendance critique est résolue.

---

## 62. Fonctionnement sans IA

La résolution, les cycles, les versions, les conflits, la validation et la publication doivent fonctionner intégralement sans IA.

---

## 63. Tests unitaires

Tester :

- parsing version range ;
- compatibilité ;
- REQUIRED/OPTIONAL ;
- conflits ;
- cycles ;
- transitivité ;
- impact ;
- cache invalidation ;
- mutability guard.

---

## 64. Tests intégration

Tester :

- Prisma ;
- graph persistence ;
- tenant isolation ;
- providers ;
- audit ;
- outbox ;
- résolution ;
- concurrence.

---

## 65. Tests E2E Web

```text
Pack Version DRAFT
→ Dépendances
→ Ajouter REQUIRED Catalog >=1.0
→ Résoudre
→ Ajouter capability manquante
→ Voir erreur
→ Corriger provider
→ Résoudre à nouveau
→ Voir RESOLVED
→ Ajouter cycle
→ Détecter cycle
→ Corriger
→ Valider PackVersion
```

---

## 66. Critères d’acceptation

PM-CDC-06 est conforme si :

- dépendances CRUD contrôlées ;
- REQUIRED/OPTIONAL/CONFLICTS/RECOMMENDS/IMPLIES disponibles ;
- contraintes de versions validées ;
- dépendances transitives analysées ;
- cycles détectés ;
- conflits détectés ;
- graphe disponible ;
- analyse d’impact disponible ;
- résolution externe par contrat ;
- aucune dépendance directe à l’ERP ;
- PackVersion immutable protégée ;
- invalidation automatique ;
- IAM et multi-tenant appliqués ;
- Mock et Contract Tests disponibles ;
- E2E web passant.

---

## 67. Definition of Done

```text
PM-CDC-06 DONE
├── Dependency Model
├── Dependency List
├── Create / Edit
├── Dependency Types
├── Version Range
├── Target Resolution
├── Direct / Transitive
├── Cycle Detection
├── Conflict Detection
├── Missing Detection
├── Graph
├── Impact Analysis
├── Resolution Report
├── Pack Manifest Contribution
├── Validation Contract
├── Version Mutability Guard
├── Invalidation
├── IAM
├── Tenant Isolation
├── Audit
├── Outbox
├── AI Assistance optional
├── No-AI deterministic resolver
├── Mock Providers
├── Contract Tests
├── Unit Tests
├── Integration Tests
└── E2E Web
```

---

## 68. Résultat attendu

À la fin de PM-CDC-06 :

```text
PACK / MODULE / FEATURE
          ↓
      DEPENDENCY
          ↓
   TARGET + VERSION
          ↓
       RESOLVER
          ↓
 ┌────────┼───────────────┐
 ↓        ↓               ↓
RESOLVED  MISSING     INCOMPATIBLE
          ↓               ↓
       BLOCK / WARNING / FIX
```

> **PM-CDC-06 garantit qu’une PackVersion ne peut être considérée comme prête tant que ses dépendances obligatoires ne sont pas résolues de manière déterministe, versionnée, traçable et compatible avec les contrats de la plateforme.**
