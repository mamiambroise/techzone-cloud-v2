# PR-CDC-02 — Manifest Loader & Runtime Resolver

**Projet :** Techzone Cloud  
**Pack :** Pack Runtime  
**Référence :** PR-CDC-02  
**Version :** 1.0  
**Statut :** Cahier des charges fonctionnel et technique  
**Dépendances obligatoires :** PR-CDC-00 — Socle, Architecture & Runtime Contracts ; PR-CDC-01 — Runtime Cockpit  
**Stack :** React · NestJS · Prisma · PostgreSQL

---

## 1. Objet

PR-CDC-02 définit le **Manifest Loader & Runtime Resolver**, responsable de charger un Pack Manifest publié, d’en vérifier l’intégrité, de préparer son contexte d’exécution et d’orchestrer le processus de résolution jusqu’à l’obtention d’un résultat exploitable.

Il répond à la question :

> **Comment transformer un Pack Manifest publié en une résolution Runtime fiable, traçable et déterministe ?**

---

## 2. Position dans le Pack Runtime

```text
PACK MANAGER
     ↓
PACK MANIFEST
     ↓
PR-CDC-02
MANIFEST LOADER & RUNTIME RESOLVER
     ↓
PR-CDC-03 Module & Feature Resolver
     ↓
PR-CDC-04 Capability & Dependency Resolver
     ↓
PR-CDC-05 Rules & Context Resolver
     ↓
PR-CDC-06 Effective Runtime Manifest
```

PR-CDC-02 est l’orchestrateur principal du cycle de résolution.

---

## 3. Responsabilités

PR-CDC-02 doit permettre de :

- recevoir une demande de résolution ;
- identifier le Pack Manifest cible ;
- charger le manifest ;
- vérifier sa version de contrat ;
- vérifier son hash ;
- vérifier sa structure ;
- vérifier son statut de publication ;
- normaliser le manifest ;
- charger les providers nécessaires ;
- créer un Runtime Resolution Context ;
- orchestrer les resolvers spécialisés ;
- gérer les erreurs ;
- produire un statut final ;
- déclencher la génération de l’Effective Runtime Manifest ;
- enregistrer la trace de résolution.

---

## 4. Ce que PR-CDC-02 ne fait pas directement

Il ne doit pas :

- déterminer lui-même toutes les règles d’activation ;
- implémenter la logique de capabilities ;
- recalculer les dépendances détaillées ;
- construire toute la configuration finale ;
- modifier le Pack Manifest ;
- accéder directement aux tables du Pack Manager ;
- appeler directement l’ERP natif.

Il orchestre les composants spécialisés.

---

## 5. Flux principal

```text
Resolve Request
     ↓
Identify Manifest
     ↓
Load Manifest
     ↓
Validate Contract
     ↓
Validate Hash
     ↓
Validate Structure
     ↓
Create Resolution
     ↓
Resolve Context
     ↓
Call Specialized Resolvers
     ↓
Aggregate Results
     ↓
Determine Final Status
     ↓
Generate Effective Manifest
     ↓
Persist Summary
     ↓
Return Response
```

---

## 6. Resolve Request

Entrée minimale :

```json
{
  "applicationId": "app_stock",
  "packCode": "stock",
  "packVersion": "1.2.0",
  "environment": "PROD"
}
```

Le tenant et l’identité utilisateur doivent provenir prioritairement du contexte authentifié.

---

## 7. Sélection du Manifest

Le Runtime doit pouvoir identifier un manifest par :

```text
applicationId
packCode
packVersion
environment
```

ou par :

```text
manifestId
manifestHash
```

selon les cas autorisés.

---

## 8. Manifest Provider

Interface recommandée :

```text
PackManifestProvider
```

Méthodes conceptuelles :

```text
getPublishedManifest(...)
getManifestByHash(...)
getManifestMetadata(...)
```

Implémentations :

```text
MockPackManifestProvider
RealPackManifestProvider
```

---

## 9. Source du Manifest

Sources possibles :

```text
Pack Manager API
Publication Artifact Store
Deployment Artifact Store
Runtime Cache
```

Le Runtime ne doit pas lire les tables internes du Pack Manager.

---

## 10. Validation Contract Version

Le manifest doit déclarer :

```text
contract
contractVersion
```

Exemple :

```text
techzone.pack-manifest
1.0
```

Le Runtime vérifie :

```text
supported?
deprecated?
blocked?
```

---

## 11. Contract Registry

Le loader doit interroger un registre interne ou partagé :

```text
PackManifest 1.0 → SUPPORTED
PackManifest 1.1 → SUPPORTED
PackManifest 2.0 → UNSUPPORTED
```

---

## 12. Validation du hash

Le hash doit être recalculé sur la représentation canonique.

```text
canonicalize(manifest)
 ↓
SHA-256
 ↓
compare
```

En cas d’écart :

```text
RUNTIME_MANIFEST_HASH_INVALID
```

La résolution est bloquée.

---

## 13. Validation structurelle

Le manifest doit respecter :

- JSON Schema ;
- types attendus ;
- champs obligatoires ;
- enums ;
- références ;
- tailles maximales ;
- format des versions.

---

## 14. Validation sémantique

Vérifier notamment :

```text
pack code coherent
pack version coherent
modules uniques
features uniques
capabilities référencées
dependencies valides
rules référencées
contract refs valides
```

---

## 15. Publication Guard

Un manifest doit être lié à une PackVersion publiée.

États acceptés selon architecture :

```text
PUBLISHED
SUPERSEDED
DEPRECATED
```

Un `DRAFT` ne doit pas être exécuté en production.

---

## 16. Preview / Simulation Mode

Un mode contrôlé peut permettre l’exécution d’un manifest non publié :

```text
mode = PREVIEW
```

Uniquement pour :

- environnement TEST ;
- utilisateur autorisé ;
- audit obligatoire.

---

## 17. Runtime Resolution

À chaque résolution, créer un objet logique :

```text
RuntimeResolution
```

Champs :

```text
id
tenantId
applicationId
packCode
packVersion
environment
sourceManifestHash
status
startedAt
completedAt
durationMs
traceId
retryOf?
```

---

## 18. Resolution Status

```text
NOT_RESOLVED
RESOLVING
RESOLVED
PARTIALLY_RESOLVED
BLOCKED
DEGRADED
ERROR
```

---

## 19. Runtime Resolution Context

Structure conceptuelle :

```text
resolutionId
traceId
tenantId
userId
applicationId
packCode
packVersion
environment
manifest
iamContext
applicationContext
entitlements
capabilities
dependencyState
ruleContext
```

---

## 20. Context Enrichment

Le resolver enrichit progressivement le contexte :

```text
Base Context
 ↓
IAM Context
 ↓
Application Context
 ↓
Tenant Context
 ↓
Subscription / Entitlements
 ↓
Capability Availability
 ↓
Dependency State
 ↓
Rule Context
```

---

## 21. Orchestration

PR-CDC-02 orchestre les services :

```text
ManifestLoader
ContextLoader
ModuleFeatureResolver
CapabilityDependencyResolver
RulesContextResolver
EffectiveManifestBuilder
```

---

## 22. Orchestration séquentielle vs parallèle

Les opérations indépendantes peuvent être parallélisées.

Exemple :

```text
IAM Context ─────┐
App Context ─────┼─ parallel
Entitlements ────┘
```

Mais les étapes dépendantes doivent respecter leur ordre logique.

---

## 23. Plan de résolution

Le resolver doit produire un plan interne.

Exemple :

```text
STEP 1 Manifest
STEP 2 Context
STEP 3 Capabilities
STEP 4 Dependencies
STEP 5 Rules
STEP 6 Modules/Features
STEP 7 Effective Manifest
```

---

## 24. Resolution Step

Modèle conceptuel :

```text
id
resolutionId
stepType
status
startedAt
completedAt
durationMs
errorCode?
metadata?
```

---

## 25. Step Status

```text
PENDING
RUNNING
SUCCESS
WARNING
SKIPPED
FAILED
```

---

## 26. Fail Fast

Certaines erreurs doivent arrêter immédiatement :

```text
manifest hash invalid
contract unsupported
tenant mismatch
critical provider failure
invalid manifest structure
```

---

## 27. Continue with Warning

Certaines erreurs optionnelles permettent de continuer :

```text
optional capability missing
optional dependency missing
non-critical diagnostics provider unavailable
```

---

## 28. Resolution Policy

Le comportement doit être déterminé par des règles explicites :

```text
CRITICAL → BLOCK
ERROR    → BLOCK or ERROR
WARNING  → CONTINUE
INFO     → CONTINUE
```

Les exceptions doivent être contractuelles.

---

## 29. Idempotence

Deux requêtes identiques doivent produire le même résultat fonctionnel tant que :

```text
manifest
context
provider revisions
```

restent identiques.

---

## 30. Deduplication

Le Runtime peut dédupliquer temporairement des demandes identiques.

Clé conceptuelle :

```text
tenantId
applicationId
packCode
packVersion
manifestHash
contextRevision
```

---

## 31. Timeout global

La résolution doit avoir un timeout global configurable.

Exemple conceptuel :

```text
globalTimeoutMs
```

Si dépassé :

```text
RUNTIME_TIMEOUT
```

---

## 32. Timeouts par étape

Chaque provider doit disposer de son timeout.

Exemple :

```text
iamContextTimeout
entitlementTimeout
capabilityTimeout
dependencyTimeout
```

---

## 33. Retry interne

Les retries sont autorisés seulement pour erreurs transitoires.

```text
network timeout
temporary unavailable
```

Pas pour :

```text
contract invalid
permission denied
dependency missing
entitlement missing
```

---

## 34. Circuit Breaker

Le loader doit respecter l’état des circuits des providers.

```text
CLOSED
OPEN
HALF_OPEN
```

Un circuit ouvert doit être visible dans le diagnostic.

---

## 35. Fallback

Fallback uniquement si prévu.

Exemple :

```text
Metrics Provider unavailable
→ continue without extended metrics
```

Pas pour une capability métier obligatoire.

---

## 36. Manifest Cache

Le manifest publié peut être mis en cache.

Clé :

```text
packCode
packVersion
manifestHash
contractVersion
```

---

## 37. Cache Validation

Un cache hit doit toujours respecter :

```text
manifestHash
contractVersion
publication state
```

---

## 38. Stale Manifest

Si la source est inaccessible mais qu’un cache valide existe :

```text
STALE_ALLOWED?
```

Cette politique doit être explicitement configurée.

Par défaut, pour un manifest critique :

```text
stale use = forbidden
```

sauf contrat prévu.

---

## 39. API — Resolve

```http
POST /api/runtime/resolve
```

Réponse :

```json
{
  "resolutionId": "res_001",
  "status": "RESOLVED",
  "traceId": "trace_001",
  "effectiveManifestId": "erm_001"
}
```

---

## 40. API — Async Resolve

Pour résolutions longues :

```http
POST /api/runtime/resolutions
```

Réponse :

```json
{
  "resolutionId": "res_001",
  "status": "RESOLVING"
}
```

Puis :

```http
GET /api/runtime/resolutions/:id
```

---

## 41. API — Cancel

Si supporté :

```http
POST /api/runtime/resolutions/:id/cancel
```

Uniquement si aucune action irréversible n’a eu lieu.

---

## 42. API — Retry

```http
POST /api/runtime/resolutions/:id/retry
```

Crée une nouvelle résolution avec `retryOf`.

---

## 43. API — Resolution Steps

```http
GET /api/runtime/resolutions/:id/steps
```

---

## 44. API — Manifest Metadata

```http
GET /api/runtime/manifests/:hash/metadata
```

---

## 45. Permissions IAM

```text
runtime.resolve
runtime.resolve.preview
runtime.resolution.read
runtime.resolution.retry
runtime.resolution.cancel
runtime.manifest.read
```

---

## 46. Multi-tenant Guard

Avant résolution :

```text
authenticatedTenantId
=
requested application tenant
=
manifest allowed tenant scope
```

Sinon :

```text
RUNTIME_TENANT_MISMATCH
```

---

## 47. Environment Guard

Un manifest publié pour TEST ne doit pas être utilisé silencieusement en PROD.

Vérifier :

```text
environment compatibility
```

---

## 48. Security

Le loader doit protéger contre :

- manifest surdimensionné ;
- profondeur JSON excessive ;
- références invalides ;
- injection de contenu ;
- chemins arbitraires ;
- URLs non autorisées ;
- code exécutable ;
- secrets dans payload.

---

## 49. Signature du manifest

Option recommandée pour artefacts distribués :

```text
manifestSignature
keyId
signatureAlgorithm
```

Le Runtime peut vérifier la signature avant exécution.

---

## 50. Error Contract

Codes principaux :

```text
RUNTIME_MANIFEST_NOT_FOUND
RUNTIME_MANIFEST_INVALID
RUNTIME_MANIFEST_HASH_INVALID
RUNTIME_MANIFEST_SIGNATURE_INVALID
RUNTIME_CONTRACT_UNSUPPORTED
RUNTIME_PACK_NOT_PUBLISHED
RUNTIME_PREVIEW_FORBIDDEN
RUNTIME_CONTEXT_INVALID
RUNTIME_TENANT_MISMATCH
RUNTIME_ENVIRONMENT_MISMATCH
RUNTIME_RESOLUTION_TIMEOUT
RUNTIME_RESOLUTION_CANCELLED
RUNTIME_PROVIDER_UNAVAILABLE
RUNTIME_RESOLUTION_BLOCKED
```

---

## 51. Observability

Chaque résolution doit générer :

```text
traceId
resolutionId
```

Spans :

```text
runtime.resolve
runtime.manifest.load
runtime.manifest.validate
runtime.context.load
runtime.resolver.invoke
runtime.effective_manifest.build
```

---

## 52. Metrics

```text
runtime_manifest_load_total
runtime_manifest_load_duration_ms
runtime_manifest_invalid_total
runtime_resolution_started_total
runtime_resolution_completed_total
runtime_resolution_blocked_total
runtime_resolution_duration_ms
runtime_resolution_timeout_total
```

---

## 53. Logs structurés

Exemple :

```json
{
  "event": "runtime.manifest.loaded",
  "resolutionId": "res_001",
  "traceId": "trace_001",
  "packCode": "stock",
  "packVersion": "1.2.0",
  "manifestHash": "sha256:...",
  "durationMs": 14
}
```

---

## 54. Audit

Auditer :

```text
runtime.resolve.requested
runtime.preview.requested
runtime.retry.requested
runtime.cancel.requested
runtime.manifest.rejected
```

---

## 55. Frontend React

Le frontend PR-CDC-02 sert à :

- lancer une résolution manuelle autorisée ;
- afficher le plan ;
- afficher les étapes ;
- suivre le statut ;
- voir les erreurs ;
- relancer ;
- visualiser le manifest source.

---

## 56. Composants React

```text
RuntimeResolveForm
ManifestSummaryCard
ResolutionProgress
ResolutionStepList
ResolutionStatusBadge
ResolutionErrorPanel
RetryResolutionDialog
PreviewModeBanner
ManifestContractBadge
```

---

## 57. UX Resolve

```text
Choisir Application
 ↓
Choisir Pack / Version
 ↓
Environment
 ↓
[Resolve]
 ↓
Progress
 ↓
Result
```

---

## 58. UX Preview

Le mode Preview doit être clairement marqué :

```text
PREVIEW MODE
NOT PRODUCTION
```

et afficher que le résultat n’est pas un artefact publié.

---

## 59. États UI

```text
IDLE
LOADING_MANIFEST
VALIDATING
RESOLVING
RESOLVED
PARTIAL
BLOCKED
ERROR
CANCELLED
```

---

## 60. Backend NestJS

Structure indicative :

```text
src/pack-runtime/manifest-resolver/
├── runtime-resolver.controller.ts
├── runtime-resolver.service.ts
├── manifest-loader.service.ts
├── manifest-validator.service.ts
├── manifest-hash.service.ts
├── resolution-orchestrator.service.ts
├── resolution-policy.service.ts
├── resolution-step.service.ts
├── providers/
├── dto/
└── tests/
```

---

## 61. Prisma conceptuel

```text
RuntimeResolution
RuntimeResolutionStep
RuntimeManifestReference
```

### RuntimeResolutionStep

```text
id
resolutionId
stepType
status
startedAt
completedAt
durationMs
errorCode
details
createdAt
```

### RuntimeManifestReference

```text
id
packCode
packVersion
manifestHash
contractVersion
sourceRef
publicationStatus
lastLoadedAt
createdAt
```

---

## 62. Indexes

```text
RuntimeResolution(status, createdAt)
RuntimeResolution(tenantId, applicationId, createdAt)
RuntimeResolution(traceId)
RuntimeResolution(sourceManifestHash)

RuntimeResolutionStep(resolutionId, stepType)
RuntimeManifestReference(manifestHash)
RuntimeManifestReference(packCode, packVersion)
```

---

## 63. Mock / Simulation

Mocks nécessaires :

```text
MockPackManifestProvider
MockApplicationContextProvider
MockIamContextProvider
MockEntitlementProvider
MockCapabilityProvider
```

---

## 64. Contract Tests

Tester :

```text
PackManifestProviderContract
PackManifestContract
RuntimeResolutionContract
RuntimeResolutionStepContract
ErrorContract
PreviewModeContract
```

---

## 65. Unit Tests

Tester :

- manifest loading ;
- hash validation ;
- contract version ;
- publication guard ;
- environment guard ;
- fail-fast policy ;
- warning continuation ;
- timeout ;
- retry eligibility ;
- idempotence key ;
- cancellation.

---

## 66. Integration Tests

Tester :

- NestJS controller/service ;
- Prisma ;
- provider failure ;
- cache ;
- audit ;
- traces ;
- tenant isolation ;
- preview authorization.

---

## 67. E2E Web

Scénario positif :

```text
Runtime → Resolve
→ sélectionner Stock 1.2.0
→ PROD
→ Load Manifest
→ Contract OK
→ Hash OK
→ Context OK
→ Specialized Resolvers OK
→ Effective Manifest
→ RESOLVED
```

Scénario négatif :

```text
Manifest hash invalid
→ BLOCKED
→ RUNTIME_MANIFEST_HASH_INVALID
→ aucun resolver métier appelé
```

---

## 68. Critères d’acceptation

PR-CDC-02 est conforme si :

- manifest chargé exclusivement par provider/contrat ;
- contract version vérifiée ;
- hash vérifié ;
- publication guard appliqué ;
- tenant/environment guards appliqués ;
- RuntimeResolution créée ;
- étapes tracées ;
- orchestration déterministe ;
- fail-fast fonctionnel ;
- warnings non bloquants gérés ;
- timeout/retry/circuit breaker prévus ;
- aucune modification du manifest ;
- frontend de suivi disponible ;
- tests unitaires/intégration/E2E passants.

---

## 69. Definition of Done

```text
PR-CDC-02 DONE
├── Resolve Request
├── Pack Manifest Provider
├── Manifest Loader
├── Contract Version Validation
├── Hash Validation
├── Structural Validation
├── Semantic Validation
├── Publication Guard
├── Preview Mode
├── RuntimeResolution
├── Resolution Steps
├── Context Enrichment
├── Orchestrator
├── Resolution Policy
├── Fail Fast
├── Timeout
├── Retry
├── Circuit Breaker
├── Manifest Cache
├── Tenant Guard
├── Environment Guard
├── Security Validation
├── Audit
├── Observability
├── React Progress UI
├── Mock Providers
├── Contract Tests
├── Unit Tests
├── Integration Tests
└── E2E Web
```

---

## 70. Résultat attendu

```text
PACK MANIFEST
      ↓
   LOADER
      ↓
  VALIDATOR
      ↓
RUNTIME RESOLUTION
      ↓
 ORCHESTRATOR
      ↓
SPECIALIZED RESOLVERS
      ↓
FINAL STATUS
      ↓
EFFECTIVE MANIFEST
```

> **PR-CDC-02 est la porte d’entrée du Pack Runtime : il garantit qu’aucune composition n’est résolue avant que son manifest, son contrat, son contexte et ses invariants de sécurité aient été vérifiés, puis orchestre de manière traçable tous les resolvers spécialisés.**
