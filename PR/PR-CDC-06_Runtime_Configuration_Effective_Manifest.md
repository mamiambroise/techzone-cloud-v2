# PR-CDC-06 — Runtime Configuration & Effective Manifest

**Projet :** Techzone Cloud  
**Pack :** Pack Runtime  
**Référence :** PR-CDC-06  
**Version :** 1.0  
**Statut :** Cahier des charges fonctionnel et technique  
**Dépendances :** PR-CDC-00, PR-CDC-02, PR-CDC-03, PR-CDC-04, PR-CDC-05  
**Contrats amont :** Pack Manifest Contract · Runtime Context Contract · Module/Feature Resolution Contract · Capability/Dependency Resolution Contract · Rule Decision Contract  
**Contrat aval principal :** Effective Runtime Manifest Contract v1  
**Stack :** React · NestJS · Prisma · PostgreSQL

---

## 1. Objet

PR-CDC-06 définit le **Runtime Configuration & Effective Manifest Builder**, responsable d’agréger tous les résultats de résolution du Pack Runtime et de produire la configuration finale réellement consommable par l’Application / UI Runtime.

Il répond à la question :

> **Après résolution du contexte, des modules, des features, des capabilities, des dépendances et des règles, quelle configuration exacte l’application doit-elle utiliser ?**

---

## 2. Position

```text
PACK MANIFEST
     ↓
PR-CDC-02 Loader / Orchestrator
     ↓
PR-CDC-03 Modules & Features
     ↓
PR-CDC-04 Capabilities & Dependencies
     ↓
PR-CDC-05 Rules & Context
     ↓
PR-CDC-06
RUNTIME CONFIGURATION
& EFFECTIVE MANIFEST
     ↓
APPLICATION / UI RUNTIME
```

---

## 3. Mission

PR-CDC-06 doit :

- agréger les résultats de tous les resolvers ;
- vérifier leur cohérence finale ;
- construire la configuration Runtime effective ;
- déterminer les modules réellement exposés ;
- déterminer les features réellement exposées ;
- intégrer les capabilities disponibles ;
- intégrer les restrictions ;
- intégrer les décisions de règles ;
- intégrer les valeurs de configuration calculées ;
- produire un Effective Runtime Manifest canonique ;
- calculer un hash déterministe ;
- versionner le contrat de sortie ;
- exposer le résultat aux consommateurs ;
- conserver si nécessaire un snapshot ;
- permettre comparaison, diagnostic et invalidation.

---

## 4. Ce que PR-CDC-06 ne fait pas

Il ne doit pas :

- modifier le Pack Manifest source ;
- recalculer les règles ;
- recalculer les droits IAM ;
- exécuter les capabilities ;
- éditer les modules/features ;
- devenir UI Runtime ;
- générer directement des écrans React ;
- modifier Billing ou ERP.

Il assemble et publie la **vue effective** du Runtime.

---

## 5. Principe central

```text
PACK MANIFEST
        +
RUNTIME CONTEXT
        +
MODULE / FEATURE STATES
        +
CAPABILITY / DEPENDENCY STATES
        +
RULE DECISIONS
        =
EFFECTIVE RUNTIME MANIFEST
```

---

## 6. Effective Runtime Manifest

L’Effective Runtime Manifest est le contrat de sortie principal du Pack Runtime.

Il décrit :

```text
ce qui est actif
ce qui est inactif
ce qui est bloqué
ce qui est disponible
ce qui est restreint
ce qui est configuré
pour quel contexte
à partir de quelle version publiée
```

---

## 7. Différence avec Pack Manifest

```text
PACK MANIFEST
= définition publiée et immuable

EFFECTIVE RUNTIME MANIFEST
= interprétation contextualisée et déterministe
```

Le Pack Manifest est source de vérité de définition.

L’Effective Manifest est source de vérité de **résolution Runtime**.

---

## 8. Consommateurs

Consommateurs possibles :

```text
Application / UI Runtime
API Runtime
Navigation Runtime
Component Runtime
Data Binding Runtime
Permission Bridge
Workflow Trigger Bridge
Diagnostics / Cockpit
```

Chaque consommateur doit utiliser le contrat, jamais les tables internes du Pack Runtime.

---

## 9. Structure globale recommandée

```json
{
  "contract": "techzone.effective-runtime-manifest",
  "contractVersion": "1.0",
  "identity": {},
  "source": {},
  "context": {},
  "resolution": {},
  "modules": [],
  "features": [],
  "capabilities": {},
  "dependencies": {},
  "permissions": {},
  "configuration": {},
  "restrictions": [],
  "diagnostics": {},
  "integrity": {}
}
```

---

## 10. Identity

```json
{
  "identity": {
    "effectiveManifestId": "erm_001",
    "resolutionId": "res_001",
    "generatedAt": "2026-08-30T10:00:00Z"
  }
}
```

---

## 11. Source

```json
{
  "source": {
    "packCode": "stock",
    "packVersion": "1.2.0",
    "packManifestContractVersion": "1.0",
    "packManifestHash": "sha256:..."
  }
}
```

---

## 12. Context

Ne conserver que le contexte nécessaire au consommateur.

```json
{
  "context": {
    "tenantId": "tenant_001",
    "applicationId": "app_stock",
    "environment": "PROD",
    "locale": "fr-MG",
    "timezone": "Indian/Antananarivo"
  }
}
```

---

## 13. Context Safety

Ne jamais inclure :

```text
password
access token
refresh token
secret
private key
raw session
database credentials
```

---

## 14. Resolution

```json
{
  "resolution": {
    "status": "RESOLVED",
    "policyVersion": "1.0",
    "contextRevision": "ctx_42",
    "durationMs": 81
  }
}
```

---

## 15. Modules

Exemple :

```json
{
  "modules": [
    {
      "code": "inventory",
      "state": "ACTIVE",
      "reasonCode": "DECLARED_ENABLED",
      "order": 20
    }
  ]
}
```

---

## 16. Features

```json
{
  "features": [
    {
      "code": "stock.analytics",
      "module": "inventory",
      "state": "ACTIVE",
      "reasonCode": "RULE_MATCHED"
    }
  ]
}
```

---

## 17. Capabilities

Structure recommandée :

```json
{
  "capabilities": {
    "available": [
      "stock.product.read",
      "stock.inventory.execute"
    ],
    "degraded": [],
    "unavailable": []
  }
}
```

---

## 18. Capability Metadata

Lorsque nécessaire :

```json
{
  "code": "stock.inventory.execute",
  "state": "AVAILABLE",
  "provider": "data-runtime",
  "contractVersion": "1.0"
}
```

Éviter de surcharger le manifest avec des métadonnées inutiles.

---

## 19. Dependencies

```json
{
  "dependencies": {
    "resolved": [
      {
        "source": "stock.analytics",
        "target": "stock.product.read"
      }
    ],
    "optionalMissing": [],
    "blocking": []
  }
}
```

---

## 20. Permissions

Le Runtime peut exposer une vue dérivée minimale :

```json
{
  "permissions": {
    "granted": [
      "stock.read",
      "stock.inventory.execute"
    ]
  }
}
```

Cette vue ne remplace jamais IAM.

---

## 21. Permission Minimization

Ne pas recopier toute la matrice IAM si l’application n’en a pas besoin.

Préférer :

```text
permissions nécessaires à la composition effective
```

---

## 22. Configuration Effective

Exemple :

```json
{
  "configuration": {
    "inventory": {
      "defaultView": "list",
      "maxWarehouses": 10,
      "allowExport": false
    }
  }
}
```

Elle résulte de :

```text
default config
+ tenant config
+ environment config
+ rule SET_VALUE
+ runtime constraints
```

---

## 23. Ordre de fusion Configuration

Politique recommandée :

```text
1. Platform defaults
2. Pack defaults
3. PackVersion defaults
4. Module / Feature config
5. Tenant allowed overrides
6. Environment overrides
7. Rule SET_VALUE
8. Security restrictions
```

Les niveaux doivent être allowlistés.

---

## 24. No Arbitrary Override

Un tenant ne peut pas écraser une propriété non déclarée comme configurable.

---

## 25. Configuration Schema

Chaque configuration doit être validée contre un schéma versionné.

Exemple :

```text
stock.inventory.config@1.0
```

---

## 26. Restrictions

Exemple :

```json
{
  "restrictions": [
    {
      "type": "FEATURE",
      "target": "stock.analytics",
      "reasonCode": "ENTITLEMENT_MISSING"
    }
  ]
}
```

---

## 27. Diagnostics Summary

Le manifest peut contenir un résumé non sensible :

```json
{
  "diagnostics": {
    "warnings": 1,
    "errors": 0,
    "blockedItems": 0
  }
}
```

Les diagnostics détaillés restent accessibles par API dédiée.

---

## 28. Integrity

```json
{
  "integrity": {
    "effectiveManifestHash": "sha256:...",
    "canonicalizationVersion": "1.0"
  }
}
```

---

## 29. Canonicalization

Avant hash :

```text
stable property handling
stable arrays
stable ordering
normalized values
no volatile fields in hash payload
```

Les champs tels que `generatedAt` peuvent être exclus du hash fonctionnel si nécessaire.

---

## 30. Effective Manifest Hash

Objectifs :

- détection de changement ;
- cache ;
- comparaison ;
- audit ;
- reproductibilité ;
- ETag.

---

## 31. Functional Hash vs Snapshot Hash

Option recommandée :

```text
effectiveConfigHash
= contenu fonctionnel

snapshotHash
= document complet
```

Cela évite qu’un timestamp modifie artificiellement la configuration fonctionnelle.

---

## 32. Immutabilité

Une fois un Effective Manifest produit pour une `resolutionId`, il doit être immutable.

Une nouvelle résolution crée un nouvel Effective Manifest.

---

## 33. Versioning

Contrat :

```text
techzone.effective-runtime-manifest
```

Version :

```text
1.0
```

Breaking change :

```text
2.0
```

---

## 34. Compatibilité

Le consommateur doit annoncer les versions supportées.

Exemple :

```text
Application UI Runtime supports:
1.0
1.1
```

Le Pack Runtime sélectionne une version compatible ou bloque explicitement.

---

## 35. Contract Negotiation

Option :

```http
Accept-Contract-Version: 1.0
```

ou paramètre contractuel équivalent.

---

## 36. Validation Finale

Avant publication interne du résultat :

```text
Modules coherent?
Features coherent?
Capabilities coherent?
No blocking dependency?
Rule decisions consistent?
Configuration schema valid?
Tenant scope valid?
Contract valid?
Hash generated?
```

---

## 37. Final Status

États :

```text
RESOLVED
PARTIALLY_RESOLVED
DEGRADED
BLOCKED
ERROR
```

Un manifest `BLOCKED` peut être conservé pour diagnostic mais ne doit pas être servi comme configuration exécutable normale.

---

## 38. Executable Flag

Exemple :

```json
{
  "resolution": {
    "status": "BLOCKED",
    "executable": false
  }
}
```

---

## 39. Effective Module

Champs possibles :

```text
code
state
order
configurationRef?
features[]
reasonCode
```

---

## 40. Effective Feature

```text
code
moduleCode
state
visibility
configuration
requiredPermissions[]
requiredCapabilities[]
reasonCode
```

---

## 41. Inclusion Policy

Recommandation :

Les éléments `HIDDEN` ou `INACTIVE` peuvent être :

```text
included with state
```

dans le manifest administratif complet.

Pour un manifest optimisé destiné à l’UI :

```text
active-only projection
```

peut être exposée.

---

## 42. Projections

PR-CDC-06 peut produire plusieurs projections à partir du même Effective Manifest canonique.

```text
FULL
UI
API
DIAGNOSTIC
```

---

## 43. FULL Projection

Contient les états nécessaires au diagnostic et à l’orchestration.

---

## 44. UI Projection

Contient uniquement ce qui est nécessaire à Application/UI Runtime.

Exemple :

```text
active modules
visible features
UI config
permissions refs
action refs
```

---

## 45. API Projection

Peut exposer :

```text
available runtime operations
capabilities
restrictions
contract refs
```

---

## 46. DIAGNOSTIC Projection

Ajoute :

```text
reasonCodes
resolution paths
provider refs
rule refs
```

selon permissions.

---

## 47. Projection Security

Une projection ne doit jamais rendre visible plus d’informations que le consommateur n’est autorisé à voir.

---

## 48. API — Effective Manifest

```http
GET /api/runtime/resolutions/:id/effective-manifest
```

---

## 49. API — Current

```http
GET /api/runtime/applications/:applicationId/packs/:packCode/effective-manifest
```

Retourne la dernière résolution valide correspondant au contexte authentifié.

---

## 50. API — Projection

```http
GET /api/runtime/resolutions/:id/effective-manifest?projection=UI
```

---

## 51. API — Compare

```http
GET /api/runtime/effective-manifests/compare?left=:idA&right=:idB
```

---

## 52. API — Validate

Endpoint interne/admin :

```http
POST /api/runtime/effective-manifests/validate
```

---

## 53. ETag

Le `effectiveConfigHash` peut être utilisé comme :

```text
ETag
```

pour éviter des transferts inutiles.

---

## 54. Conditional GET

Support recommandé :

```text
If-None-Match
```

Réponse possible :

```text
304 Not Modified
```

---

## 55. Snapshot Persistence

Selon besoin, persister :

```text
effectiveManifestId
resolutionId
contractVersion
effectiveConfigHash
snapshotHash
payload
createdAt
expiresAt?
```

---

## 56. Current Pointer

Il peut exister un pointeur logique :

```text
tenant + application + pack + environment
→ currentEffectiveManifestId
```

Ce pointeur est mutable ; le snapshot ne l’est pas.

---

## 57. Atomic Switch

Lorsqu’une nouvelle résolution valide devient courante :

```text
build new manifest
validate
persist snapshot
atomic pointer switch
```

Ne jamais publier un manifest partiellement construit.

---

## 58. Rollback Runtime

Le Runtime ne modifie pas l’historique.

Pour revenir à une configuration précédente :

```text
select previous immutable valid Effective Manifest
```

si le contexte et les contrats le permettent encore.

---

## 59. Revalidation Before Rollback

Avant réactivation :

```text
dependencies still valid?
capabilities still available?
tenant context compatible?
contract still supported?
```

Un ancien snapshot n’est pas automatiquement réutilisable.

---

## 60. Cache

Cache possible :

```text
FULL manifest
UI projection
API projection
configuration fragments
```

---

## 61. Cache Key

```text
tenantId
applicationId
packCode
packVersion
sourceManifestHash
contextRevision
effectiveConfigHash
projection
contractVersion
```

---

## 62. Invalidation

Invalider si :

```text
new RuntimeResolution
contextRevision changes
entitlements change
capabilities change
dependencies change
rules context changes
provider revision change
manual invalidation
```

---

## 63. Runtime Config Diff

Le système doit comparer deux configurations.

Types de changement :

```text
MODULE_ACTIVATED
MODULE_DEACTIVATED
FEATURE_ACTIVATED
FEATURE_DEACTIVATED
CAPABILITY_ADDED
CAPABILITY_REMOVED
CONFIG_CHANGED
RESTRICTION_ADDED
RESTRICTION_REMOVED
```

---

## 64. Diff Example

```text
Tenant BASIC → PRO

+ Feature stock.analytics ACTIVE
+ Capability analytics.read
~ maxWarehouses 5 → 20
- Restriction analytics.pro missing
```

---

## 65. Change Impact

Le diff peut alimenter :

```text
UI refresh
runtime reload
cache invalidation
observability
diagnostic
```

---

## 66. Consumer Contract

L’Application/UI Runtime doit dépendre uniquement de :

```text
Effective Runtime Manifest Contract
```

et non de :

```text
Pack Manager DB
Pack Runtime DB
IAM DB
Billing DB
ERP DB
```

---

## 67. UI Runtime Handoff

Exemple :

```text
Effective Runtime Manifest
  ↓
UI Runtime
  ├── Navigation
  ├── Pages
  ├── Components
  ├── Data Bindings
  ├── Actions
  └── Permissions Bridge
```

---

## 68. Refresh Strategy

Lorsqu’une configuration change :

```text
PUSH notification
or
POLL revision
or
ETag revalidation
```

Le mécanisme exact est contractuel.

---

## 69. Event

Événement recommandé :

```text
runtime.effective_manifest.updated
```

Payload minimal :

```json
{
  "tenantId": "tenant_001",
  "applicationId": "app_stock",
  "packCode": "stock",
  "effectiveConfigHash": "sha256:..."
}
```

---

## 70. Outbox

Si les événements sont persistants, utiliser le pattern Outbox selon les conventions plateforme.

---

## 71. Permissions IAM

```text
runtime.effective_manifest.read
runtime.effective_manifest.read_full
runtime.effective_manifest.compare
runtime.effective_manifest.validate
runtime.effective_manifest.rollback
```

---

## 72. Multi-tenant

Une résolution effective est strictement scoppée.

```text
tenant A
≠
tenant B
```

Même Pack Manifest, résultats différents autorisés.

---

## 73. Error Codes

```text
RUNTIME_EFFECTIVE_MANIFEST_BUILD_FAILED
RUNTIME_EFFECTIVE_MANIFEST_INVALID
RUNTIME_EFFECTIVE_MANIFEST_BLOCKED
RUNTIME_EFFECTIVE_MANIFEST_NOT_FOUND
RUNTIME_EFFECTIVE_MANIFEST_CONTRACT_UNSUPPORTED
RUNTIME_EFFECTIVE_MANIFEST_HASH_MISMATCH
RUNTIME_CONFIGURATION_SCHEMA_INVALID
RUNTIME_CONFIGURATION_OVERRIDE_FORBIDDEN
RUNTIME_PROJECTION_FORBIDDEN
RUNTIME_ROLLBACK_NOT_COMPATIBLE
```

---

## 74. Observability

Spans :

```text
runtime.effective_manifest.build
runtime.effective_manifest.validate
runtime.effective_manifest.hash
runtime.effective_manifest.persist
runtime.effective_manifest.project
runtime.effective_manifest.compare
```

---

## 75. Metrics

```text
runtime_effective_manifest_generated_total
runtime_effective_manifest_build_duration_ms
runtime_effective_manifest_invalid_total
runtime_effective_manifest_blocked_total
runtime_effective_manifest_cache_hit_total
runtime_effective_manifest_change_total
```

---

## 76. Logs

Exemple :

```json
{
  "event": "runtime.effective_manifest.generated",
  "resolutionId": "res_001",
  "effectiveManifestId": "erm_001",
  "effectiveConfigHash": "sha256:...",
  "status": "RESOLVED",
  "traceId": "trace_001"
}
```

---

## 77. Audit

Auditer :

```text
runtime.effective_manifest.rollback_requested
runtime.effective_manifest.full_exported
runtime.effective_manifest.validated_manually
runtime.current_manifest.switched
```

---

## 78. Frontend React

PR-CDC-06 fournit principalement des écrans d’administration/diagnostic.

Structure :

```text
src/features/pack-runtime/effective-manifest/
├── viewer/
├── configuration/
├── diff/
├── projections/
├── validation/
├── history/
├── components/
├── hooks/
├── services/
└── tests/
```

---

## 79. Composants

```text
EffectiveManifestViewer
EffectiveManifestSummary
EffectiveModuleList
EffectiveFeatureList
RuntimeConfigurationViewer
ManifestIntegrityCard
ManifestProjectionSelector
EffectiveManifestDiff
EffectiveManifestHistory
ManifestValidationPanel
```

---

## 80. Maquette

```text
EFFECTIVE MANIFEST — STOCK

Status            RESOLVED
Pack              stock 1.2.0
Tenant            tenant_001
Environment       PROD
Config Hash       a92f...

MODULES
✓ Products
✓ Inventory
✓ Warehouses
✓ Reporting

FEATURES
✓ stock.inventory
✓ stock.multi_warehouse
✓ stock.analytics

CAPABILITIES
✓ product.read
✓ inventory.execute

RESTRICTIONS
None
```

---

## 81. UX Diff

```text
VERSION A                     VERSION B

Analytics     INACTIVE   →   ACTIVE
Export        DEGRADED   →   ACTIVE
WarehouseMax  5          →   20
```

---

## 82. Backend NestJS

Structure indicative :

```text
src/pack-runtime/effective-manifest/
├── effective-manifest-builder.service.ts
├── effective-config.service.ts
├── configuration-merge.service.ts
├── effective-manifest-validator.service.ts
├── canonicalization.service.ts
├── effective-manifest-hash.service.ts
├── projection.service.ts
├── diff.service.ts
├── current-manifest.service.ts
├── history.service.ts
├── dto/
└── tests/
```

---

## 83. Prisma conceptuel

```text
EffectiveManifestSnapshot
├── id
├── resolutionId
├── tenantId
├── applicationId
├── packCode
├── packVersion
├── contractVersion
├── sourceManifestHash
├── effectiveConfigHash
├── snapshotHash
├── status
├── payload
└── createdAt
```

```text
CurrentEffectiveManifest
├── id
├── tenantId
├── applicationId
├── packCode
├── environment
├── effectiveManifestId
├── updatedAt
└── version
```

---

## 84. Indexes

```text
EffectiveManifestSnapshot(resolutionId)
EffectiveManifestSnapshot(effectiveConfigHash)
EffectiveManifestSnapshot(tenantId, applicationId, packCode, createdAt)
CurrentEffectiveManifest(tenantId, applicationId, packCode, environment) UNIQUE
```

---

## 85. Optimistic Concurrency

Le `CurrentEffectiveManifest` peut utiliser :

```text
version
```

pour éviter l’écrasement concurrent du pointeur courant.

---

## 86. Atomicity

Construction :

```text
BEGIN
  validate resolution
  generate manifest
  validate manifest
  persist immutable snapshot
  update current pointer
  write outbox event
COMMIT
```

Selon l’architecture, le payload lourd peut être externalisé mais l’état logique doit rester cohérent.

---

## 87. Payload Size

Le contrat doit définir :

```text
max manifest size
max modules
max features
max config size
max diagnostics summary
```

---

## 88. Compression

Pour les gros manifests :

```text
HTTP compression
artifact compression
```

possible sans changer la sémantique contractuelle.

---

## 89. Mock Inputs

PR-CDC-06 doit pouvoir fonctionner avec :

```text
MockModuleFeatureResolution
MockCapabilityDependencyResolution
MockRuleDecisions
MockRuntimeContext
```

---

## 90. Contract Tests

Tester :

```text
EffectiveRuntimeManifestContract
EffectiveModuleContract
EffectiveFeatureContract
EffectiveConfigurationContract
EffectiveManifestProjectionContract
EffectiveManifestDiffContract
```

---

## 91. Unit Tests

Tester :

- aggregation ;
- merge order ;
- forbidden override ;
- configuration schema ;
- state inclusion ;
- canonicalization ;
- functional hash ;
- snapshot hash ;
- projection ;
- diff ;
- executable flag ;
- current pointer switch.

---

## 92. Integration Tests

Tester :

- PR-CDC-02 orchestration ;
- inputs PR-CDC-03/04/05 ;
- Prisma ;
- snapshots ;
- cache ;
- outbox ;
- tenant isolation ;
- API contract ;
- ETag.

---

## 93. E2E — PRO

```text
Pack Stock 1.2.0
+ Tenant PRO
+ all capabilities
+ rules matched
↓
Effective Manifest
Modules active = 4
Features active = 8
Analytics = ACTIVE
status = RESOLVED
executable = true
```

---

## 94. E2E — BASIC

```text
Same source Pack Manifest
+ Tenant BASIC
↓
Analytics entitlement missing
↓
Effective Manifest
Analytics = INACTIVE
Restriction recorded
status = RESOLVED
```

---

## 95. E2E — Blocking Dependency

```text
Required payment.execute missing
↓
Feature Checkout BLOCKED
↓
Pack resolution BLOCKED
↓
Effective Manifest diagnostic snapshot
executable = false
```

---

## 96. Critères d’acceptation

PR-CDC-06 est conforme si :

- tous les résultats amont sont agrégés ;
- configuration effective validée ;
- merge order déterministe ;
- aucun override arbitraire ;
- contrat Effective Runtime Manifest v1 stable ;
- hash canonique produit ;
- snapshot immutable ;
- current pointer atomique ;
- projections FULL/UI/API/DIAGNOSTIC disponibles selon besoin ;
- diff fonctionnel ;
- tenant isolation ;
- résultat bloqué non exécutable ;
- API consommable sans accès DB interne ;
- Contract Tests et E2E passants.

---

## 97. Definition of Done

```text
PR-CDC-06 DONE
├── Effective Manifest Contract v1
├── Runtime Configuration Builder
├── Configuration Merge Policy
├── Configuration Schemas
├── Effective Modules
├── Effective Features
├── Effective Capabilities
├── Dependencies Summary
├── Permissions Projection
├── Restrictions
├── Diagnostics Summary
├── Canonicalization
├── Effective Config Hash
├── Snapshot Hash
├── Immutable Snapshot
├── Current Pointer
├── Atomic Switch
├── Contract Versioning
├── Projection FULL
├── Projection UI
├── Projection API
├── Projection DIAGNOSTIC
├── Compare / Diff
├── ETag
├── Cache
├── Outbox Event
├── IAM
├── Multi-tenant
├── Observability
├── Mock Inputs
├── Contract Tests
├── Unit Tests
├── Integration Tests
└── E2E Web
```

---

## 98. Résultat attendu

```text
PACK MANIFEST
      +
RUNTIME CONTEXT
      +
MODULE / FEATURE RESOLUTION
      +
CAPABILITY / DEPENDENCY RESOLUTION
      +
RULE DECISIONS
      ↓
RUNTIME CONFIGURATION BUILDER
      ↓
FINAL VALIDATION
      ↓
CANONICALIZATION + HASH
      ↓
EFFECTIVE RUNTIME MANIFEST v1 🔒
      ↓
APPLICATION / UI RUNTIME
```

> **PR-CDC-06 matérialise le résultat final du Pack Runtime : une configuration effective immuable, versionnée, contextualisée, déterministe et directement consommable par les couches d’exécution de l’application.**
