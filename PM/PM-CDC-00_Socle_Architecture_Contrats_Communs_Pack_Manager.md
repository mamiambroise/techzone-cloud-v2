# PM-CDC-00 --- Socle, Architecture & Contrats communs du Pack Manager

**Projet :** Techzone Cloud\
**Module :** Pack Manager\
**Équipe :** Team 3 --- Business Manager, Pack & UI Runtime\
**Référence :** PM-CDC-00\
**Version :** 1.0\
**Statut :** Référence d'architecture\
**Stack :** React · NestJS · Prisma · PostgreSQL

------------------------------------------------------------------------

## 1. Objet

PM-CDC-00 définit le socle fonctionnel, technique et contractuel commun
à tout le **Pack Manager**. Il est obligatoire pour :

-   PM-CDC-01 --- Vue d'ensemble / Pack Manager Cockpit
-   PM-CDC-02 --- Pack Definition Manager
-   PM-CDC-03 --- Pack Version Manager
-   PM-CDC-04 --- Module Manager
-   PM-CDC-05 --- Feature & Capability Manager
-   PM-CDC-06 --- Dependency Manager
-   PM-CDC-07 --- Rules & Conditions Manager

PM-CDC-00 est transverse : il ne nécessite pas de menu supplémentaire
dans la sidebar.

## 2. Finalité

Le Pack Manager permet de **concevoir, structurer, versionner, valider
et préparer à l'exécution des packs modulaires** de Techzone Cloud.

``` text
PACK
 ↓
VERSION
 ↓
MODULES
 ↓
FEATURES / CAPABILITIES
 ↓
DEPENDENCIES
 ↓
RULES / CONDITIONS
 ↓
VALIDATION
 ↓
PACK MANIFEST CONTRACT 🔒
 ↓
PACK RUNTIME
```

Le Pack Manager est une couche **Design Time**. Le Pack Runtime est la
couche **Run Time**.

## 3. Position dans l'architecture

``` text
BUSINESS MANAGER
Applications / Versions
        ↓
PACK MANAGER
        ↓
PACK MANIFEST CONTRACT v1 🔒
        ↓
PACK RUNTIME
        ↓
APPLICATION / UI RUNTIME
```

Le Pack Runtime ne doit jamais dépendre directement des tables internes
du Pack Manager.

## 4. Concepts métier

### 4.1 Pack

Identité stable d'un pack : `id`, `tenantId`, `code`, `name`,
`description`, `category`, `iconKey`, `status`, `sourceType`,
`metadata`, audit, archivage et version technique.

Le `code` doit être stable et unique dans son périmètre.

### 4.2 PackVersion

Une évolution significative passe par une version. Une version publiée
devient immuable.

Champs principaux : `id`, `packId`, `versionNumber`, `label`,
`description`, `status`, `validationStatus`, `sourceVersionId`,
`snapshotHash`, audit et `publishedAt`.

### 4.3 Module

Un pack contient des modules activables, ordonnables et configurables.
Chaque module peut déclarer features, capabilities, dépendances et
règles.

### 4.4 Feature

Fonctionnalité activable, par exemple `stock.inventory`. Une Feature
n'est pas une permission IAM.

### 4.5 Capability

Capacité fonctionnelle/technique exposée, par exemple
`stock.product.read` ou `stock.inventory.execute`.

### 4.6 Dependency

Types recommandés : `REQUIRED`, `OPTIONAL`, `CONFLICTS_WITH`,
`RECOMMENDS`, `IMPLIES`.

Une dépendance peut viser un pack, module ou feature et porter une
contrainte de version.

### 4.7 Rule / Condition

Conditions déclaratives d'activation ou de disponibilité. Aucun `eval()`
ou code arbitraire stocké en base ne doit être exécuté.

## 5. Lifecycle

### Pack

``` text
DRAFT → ACTIVE → SUSPENDED → DEPRECATED → ARCHIVED
```

### PackVersion

``` text
DRAFT
 ↓
CONFIGURING
 ↓
VALIDATING
 ↓
READY
 ↓
PUBLISHED
 ↓
SUPERSEDED
 ↓
DEPRECATED
 ↓
ARCHIVED
```

États exceptionnels : `INVALID`, `ERROR`.

## 6. Immutabilité

Une version `PUBLISHED` est immuable. Toute modification nécessite :

``` text
PUBLISHED
 ↓ CLONE
Nouvelle version DRAFT
 ↓
Modification
 ↓
Validation
 ↓
Publication
```

## 7. Versioning et concurrence

Le système doit supporter version métier, version technique,
comparaison, clonage, snapshots, historique et compatibilité.

Semantic Versioning recommandé : `MAJOR.MINOR.PATCH`.

Toutes les ressources modifiables importantes utilisent l'**optimistic
locking**. Une écriture basée sur une ancienne version doit retourner
`409 CONFLICT`.

## 8. Architecture Backend

Backend : **NestJS**.

``` text
Controller / API
      ↓
Application Service
      ↓
Domain
      ↓
Repository
      ↓
Prisma
      ↓
PostgreSQL
```

Organisation indicative :

``` text
src/pack-manager/
├── common/
├── packs/
├── versions/
├── modules/
├── features/
├── capabilities/
├── dependencies/
├── rules/
├── validation/
├── manifests/
├── snapshots/
└── audit/
```

Les controllers ne portent pas la logique métier principale.

## 9. Architecture Frontend

Frontend : **React**.

``` text
Pack Manager
├── Vue d’ensemble
├── Packs
├── Versions de packs
├── Modules
├── Features
├── Dépendances
└── Règles & Conditions
```

Le frontend ne doit jamais : - accéder directement à PostgreSQL ; -
recalculer l'autorisation IAM ; - décider seul qu'un pack est valide ; -
modifier une version publiée ; - résoudre seul les dépendances
critiques.

## 10. Contexte et IAM

Chaque requête sensible doit être associée à un contexte fiable
comprenant au minimum `tenantId`, `actorId`, `traceId` et, selon le cas,
`applicationId`, `applicationVersionId`, `environment`.

Le backend reste autoritaire sur l'identité, le tenant et les
permissions.

Permissions indicatives :

``` text
pack.read
pack.create
pack.update
pack.archive
pack.version.read
pack.version.create
pack.version.publish
pack.module.manage
pack.feature.manage
pack.dependency.manage
pack.rule.manage
```

Masquer un bouton React n'est pas une mesure de sécurité. Les
permissions sont vérifiées côté NestJS.

## 11. Multi-tenant

Toute donnée tenant-scoped doit être isolée. Le `tenantId` ne doit pas
être accepté aveuglément depuis le navigateur.

Aucune requête d'un tenant ne doit pouvoir lire ou modifier les
ressources d'un autre tenant.

## 12. Relation avec Business Manager

``` text
APPLICATION
 ↓
APPLICATION VERSION
 ↓
PACK ASSIGNMENT
 ↓
PACK VERSION
```

Le Pack Manager ne duplique pas le modèle interne du Business Manager.
Les échanges passent par identifiants stables et contrats versionnés.

## 13. Relation avec ERP Adapter / Data Runtime

Le Pack Manager ne connaît pas les tables ERP, SQL ERP, classes internes
ERP, sessions ERP ou secrets ERP.

Un pack peut déclarer une capability requise :

``` text
stock.product.read
       ↓
Capability Contract
       ↓
Data Runtime
       ↓
ERP Adapter
       ↓
ERP
```

## 14. Pack Manifest Contract

Le **Pack Manifest** est le contrat officiel de sortie du Pack Manager
vers le Pack Runtime.

Il contient au minimum : - identité du pack ; - version ; - modules ; -
features ; - capabilities ; - dépendances ; - règles d'activation ; -
configuration publique ; - compatibilité ; - révision ; - hash ; -
version du contrat.

Exemple conceptuel :

``` json
{
  "contract": "techzone.pack-manifest",
  "contractVersion": "1.0",
  "pack": {
    "id": "pack_stock",
    "code": "stock",
    "name": "Gestion de stock",
    "version": "1.2.0"
  },
  "modules": [
    {"code": "inventory", "enabled": true}
  ],
  "features": ["stock.inventory"],
  "capabilities": ["stock.product.read", "stock.inventory.execute"],
  "dependencies": [
    {"pack": "catalog", "version": ">=1.0.0", "type": "REQUIRED"}
  ],
  "activationRules": [],
  "configuration": {},
  "revision": 18,
  "hash": "sha256:..."
}
```

## 15. Contrat LOCKÉ

``` text
PACK MANAGER
     ↓
Pack Manifest Contract v1 🔒
     ↓
PACK RUNTIME
```

**Règle : un consommateur dépend du contrat, pas de l'implémentation
interne du producteur.**

Un changement cassant impose une nouvelle version majeure du contrat.

## 16. Mock / Simulation

Dès que le contrat est validé et LOCKÉ, un Mock conforme doit être
disponible.

``` text
PackManifestContract
       ├── MockPackManifestProvider
       └── RealPackManifestProvider
```

Le passage `MOCK → RÉEL` ne doit pas imposer la réécriture du code
métier consommateur.

## 17. Contract Tests

Le Mock et l'implémentation réelle passent la même suite de Contract
Tests.

Vérifications minimales : - structure ; - champs obligatoires ; - types
; - enums ; - version du contrat ; - erreurs ; - compatibilité ; -
isolation tenant ; - stabilité des identifiants.

## 18. Validation

Avant `READY`, vérifier :

**Structure** - pack/version/modules valides ; - features et
capabilities valides.

**Dépendances** - dépendances présentes ; - versions compatibles ; -
absence de cycle interdit ; - absence de conflit bloquant.

**Rules** - syntaxe et opérateurs autorisés ; - références existantes
; - aucun code arbitraire.

**Sécurité** - permissions cohérentes ; - aucun secret dans le manifest
; - isolation tenant.

**Runtime** - manifest générable ; - hash calculable ; - contrat
compatible ; - dépendances résolvables.

Validation Status :

``` text
NOT_RUN
RUNNING
VALID
INVALID
OUTDATED
ERROR
```

Toute modification pertinente rend la validation précédente `OUTDATED`.

## 19. Publication

Publication autorisée uniquement si :

``` text
status = READY
AND validationStatus = VALID
AND validation fraîche
AND manifest existe
AND hash existe
AND dépendances résolues
AND permission accordée
```

La publication doit être transactionnelle autant que possible.

## 20. Snapshots

Avant publication, produire un snapshot déterministe permettant : -
comparaison ; - audit ; - rollback ; - diagnostic ; - reproduction.

Un même contenu logique doit produire le même hash.

## 21. Import / Export

Pipeline obligatoire :

``` text
INPUT
 ↓
PARSE
 ↓
VALIDATE
 ↓
PREVIEW
 ↓
IMPACT ANALYSIS
 ↓
CONFIRM
 ↓
APPLY
```

Aucun import ne doit écrire directement en base avant validation et
confirmation.

## 22. API communes

Routes indicatives :

``` text
/api/pack-manager/packs
/api/pack-manager/packs/:id
/api/pack-manager/packs/:id/versions
/api/pack-manager/versions/:id/modules
/api/pack-manager/versions/:id/features
/api/pack-manager/versions/:id/dependencies
/api/pack-manager/versions/:id/rules
/api/pack-manager/versions/:id/validate
/api/pack-manager/versions/:id/manifest
/api/pack-manager/versions/:id/publish
```

Envelope :

``` json
{
  "success": true,
  "data": {},
  "error": null,
  "meta": {"traceId": "trace_123"}
}
```

Codes HTTP minimaux : `200`, `201`, `204`, `400`, `401`, `403`, `404`,
`409`, `422`, `500`.

## 23. Idempotence et transactions

Les opérations sensibles comme publication, import, duplication,
génération de manifest et synchronisation doivent être idempotentes
lorsque nécessaire.

Exemple transaction de publication :

``` text
Vérifier validation
→ Générer snapshot
→ Générer manifest
→ Calculer hash
→ Changer status
→ Écrire audit
→ Produire Outbox Event
```

## 24. Audit et Outbox

Auditer au minimum : - création/modification/archivage pack ; -
création/clonage version ; - ajout/suppression module ; - activation
feature ; - modification dépendance/règle ; - validation ; - publication
; - import/export.

Ne jamais enregistrer en clair mot de passe, token brut, secret, API key
ou credential.

Événements Outbox indicatifs :

``` text
pack.created
pack.updated
pack.archived
pack.version.created
pack.version.ready
pack.version.published
pack.manifest.generated
pack.manifest.updated
```

## 25. Archivage

Préférer le soft delete / archivage à la suppression physique pour les
ressources historiques.

Une version publiée ne doit pas être supprimée physiquement par une
action utilisateur ordinaire.

## 26. Erreurs métier

Codes stables recommandés :

``` text
PACK_NOT_FOUND
PACK_CODE_ALREADY_EXISTS
PACK_VERSION_NOT_FOUND
PACK_VERSION_IMMUTABLE
PACK_VERSION_CONFLICT
PACK_VALIDATION_FAILED
PACK_VALIDATION_OUTDATED
PACK_DEPENDENCY_MISSING
PACK_DEPENDENCY_CONFLICT
PACK_DEPENDENCY_CYCLE
PACK_MANIFEST_INVALID
PACK_CONTRACT_INCOMPATIBLE
PACK_PUBLICATION_DENIED
```

## 27. Observabilité

Chaque opération importante est corrélable par `traceId`.

Métriques recommandées : - packs et versions ; - validations
réussies/échouées ; - temps de génération manifest ; - erreurs de
dépendance ; - conflits optimistic locking ; - publications ; - imports
; - erreurs contractuelles.

## 28. Sécurité

Principes obligatoires : - deny by default ; - permissions backend ; -
isolation tenant ; - validation stricte ; - aucun secret exposé ; -
aucun code arbitraire ; - rate limiting sur endpoints sensibles ; -
protection contre mass assignment ; - contrôle des références croisées
; - audit des opérations sensibles.

## 29. Performance et cache

Prévoir pagination, filtres backend, index PostgreSQL, prévention N+1 et
cache des manifests publiés.

Toute modification d'une version DRAFT invalide les calculs associés :

``` text
Modification
 ↓
Validation → OUTDATED
Manifest Draft → INVALIDATED
Dependency Resolution → INVALIDATED
```

Une version PUBLISHED étant immuable, son manifest peut être fortement
mis en cache.

## 30. États UI

``` text
LOADING
READY
EMPTY
ERROR
FORBIDDEN
READ_ONLY
CONFLICT
SAVING
SAVED
UNSAVED
VALIDATING
```

L'interface doit afficher clairement le pack, la version, le statut
DRAFT/PUBLISHED, les modifications non sauvegardées, conflits et erreurs
de dépendance.

## 31. Sidebar et CDC

``` text
PACK MANAGER
├── Vue d’ensemble        → PM-CDC-01
├── Packs                 → PM-CDC-02
├── Versions de packs     → PM-CDC-03
├── Modules               → PM-CDC-04
├── Features              → PM-CDC-05
├── Dépendances           → PM-CDC-06
└── Règles & Conditions   → PM-CDC-07

TRANSVERSE
└── PM-CDC-00 — Socle, Architecture & Contrats communs
```

## 32. Dépendance interne

``` text
PM-CDC-00 — SOCLE / CONTRACTS
 ↓
PM-CDC-02 — PACK
 ↓
PM-CDC-03 — PACK VERSION
 ↓
PM-CDC-04 — MODULES
 ↓
PM-CDC-05 — FEATURES / CAPABILITIES
 ↓
PM-CDC-06 — DEPENDENCIES
 ↓
PM-CDC-07 — RULES / CONDITIONS
 ↓
VALIDATION
 ↓
PACK MANIFEST v1 🔒
 ↓
PACK RUNTIME
```

PM-CDC-01 observe et synthétise l'ensemble.

## 33. Développement parallèle

``` text
DEFINE CONTRACT
 ↓
VALIDATE
 ↓
LOCK v1 🔒
 ↓
CREATE MOCK
 ↓
DEVELOP IN PARALLEL
 ↓
CONTRACT TEST
 ↓
MOCK → REAL
 ↓
E2E
```

**Règle d'or : on dépend d'un contrat LOCKÉ, pas de l'avancement interne
d'un autre pack ou d'une autre équipe.**

## 34. Base de données et Prisma

PostgreSQL + Prisma.

Concepts minimaux attendus :

``` text
Pack
PackVersion
PackModule
Feature
Capability
PackVersionFeature
ModuleFeature
Dependency
ActivationRule
RuleCondition
PackValidation
PackSnapshot
PackManifest
PackAuditEvent
PackOutboxEvent
```

Prévoir UUID, unicités par scope, index tenant/pack/version/status,
contraintes relationnelles, timestamps, version technique et archivage.

Lorsqu'une contrainte critique ne peut pas être exprimée proprement par
Prisma, utiliser une migration SQL contrôlée.

## 35. Tests obligatoires

**Unit Tests** - lifecycle ; - validation ; - versioning ; - dependency
resolver ; - rules ; - manifest builder ; - hash.

**Integration Tests** - Prisma ; - transactions ; - tenant isolation ; -
optimistic locking ; - import/export ; - outbox.

**Contract Tests** - Pack Manifest Contract ; - Mock Provider ; - Real
Provider ; - compatibilité.

**E2E web**

``` text
Créer Pack
→ créer version
→ ajouter modules
→ ajouter features
→ définir dépendances
→ définir règles
→ valider
→ générer manifest
→ publier
→ vérifier lecture Runtime
```

## 36. Critères de recette

PM-CDC-00 est conforme lorsque : - architecture
React/NestJS/Prisma/PostgreSQL en place ; - frontières de domaine
respectées ; - IAM consommé par contrat ; - isolation tenant appliquée
; - lifecycle et optimistic locking opérationnels ; - versions publiées
immuables ; - API et erreurs standardisées ; - audit et snapshots
définis ; - Pack Manifest Contract v1 défini et LOCKÉ ; - Mock conforme
disponible ; - Contract Tests disponibles ; - aucune dépendance directe
aux tables ERP ; - aucune exécution de code arbitraire ; - tests
passants ; - démonstration web possible.

## 37. Definition of Done

``` text
PM-CDC-00 DONE
├── Architecture
├── Domain boundaries
├── Modèle commun
├── Lifecycle
├── API conventions
├── IAM Contract
├── Multi-tenant
├── Optimistic locking
├── Audit
├── Snapshot
├── Pack Manifest Contract v1 🔒
├── Mock Pack Manifest
├── Contract Tests
├── Security baseline
├── Observability baseline
├── Tests
└── Documentation
```

## 38. Résultat attendu

À la fin de PM-CDC-00, les développeurs peuvent travailler sur PM-CDC-01
à PM-CDC-07 sans redéfinir l'architecture commune.

> **Le Pack Manager décrit et publie ce qu'est un pack. Le Pack Runtime
> décide comment ce pack est résolu et exécuté. Leur frontière est le
> Pack Manifest Contract versionné, validé et LOCKÉ.**
