# PR-CDC-04 — Capability & Dependency Resolver

**Projet :** Techzone Cloud  
**Pack :** Pack Runtime  
**Référence :** PR-CDC-04  
**Version :** 1.0  
**Statut :** Cahier des charges fonctionnel et technique  
**Dépendances obligatoires :** PR-CDC-00 — Socle, Architecture & Runtime Contracts ; PR-CDC-02 — Manifest Loader & Runtime Resolver ; PR-CDC-03 — Module & Feature Resolver  
**Contrats amont :** Pack Manifest Contract ; Runtime Context Contract ; Capability Registry Contract ; Dependency Contract  
**Contrats aval :** Module & Feature Resolution Contract ; Effective Runtime Manifest Contract  
**Stack :** React · NestJS · Prisma · PostgreSQL

---

## 1. Objet

PR-CDC-04 définit le **Capability & Dependency Resolver**, responsable de déterminer quelles capabilities requises par un pack sont réellement disponibles dans le contexte Runtime et si toutes les dépendances obligatoires peuvent être satisfaites.

Il répond à la question :

> **Les capacités et dépendances nécessaires à cette composition sont-elles réellement disponibles ici et maintenant ?**

---

## 2. Position

```text
PACK MANIFEST
     ↓
PR-CDC-02
Manifest Loader
     ↓
PR-CDC-04
CAPABILITY & DEPENDENCY RESOLVER
     ↓
PR-CDC-03
Module & Feature Resolver
     ↓
PR-CDC-05
Rules & Context Resolver
     ↓
PR-CDC-06
Effective Runtime Manifest
```

Dans l’orchestration réelle, PR-CDC-04 peut être exécuté avant ou en parallèle de certaines parties de PR-CDC-03 selon les dépendances du plan de résolution.

---

## 3. Responsabilités

PR-CDC-04 doit :

- lire les capabilities `PROVIDES`, `REQUIRES`, `USES` du manifest ;
- identifier les providers disponibles ;
- vérifier la disponibilité réelle des capabilities requises ;
- résoudre les dépendances directes ;
- résoudre les dépendances transitives ;
- vérifier les contraintes de versions ;
- détecter les dépendances manquantes ;
- détecter les incompatibilités ;
- détecter les conflits ;
- détecter les cycles Runtime inattendus ;
- classifier REQUIRED vs OPTIONAL ;
- produire un état de résolution explicable ;
- fournir un graphe runtime ;
- exposer un rapport de diagnostic ;
- alimenter PR-CDC-03 et PR-CDC-06.

---

## 4. Hors périmètre

PR-CDC-04 ne doit pas :

- créer une Capability ;
- modifier le Capability Registry ;
- modifier les dépendances du Pack Manager ;
- exécuter les capabilities métier ;
- accéder directement aux tables ERP ;
- remplacer Data Runtime ;
- résoudre des workflows métier ;
- contourner un provider indisponible par une décision arbitraire.

---

## 5. Principe fondamental

```text
DECLARATION
(REQUIRES / OPTIONAL / CONFLICTS)
          +
PROVIDERS RUNTIME
          +
VERSION / CONTEXT
          =
RESOLUTION EFFECTIVE
```

---

## 6. Types de relation

Types attendus :

```text
REQUIRED
OPTIONAL
CONFLICTS_WITH
RECOMMENDS
IMPLIES
```

---

## 7. Capability Relations

Pour une Feature :

```text
PROVIDES
REQUIRES
USES
```

Exemple :

```text
Feature stock.low_stock_alert
REQUIRES stock.product.read
REQUIRES stock.inventory.read
USES analytics.export
```

---

## 8. Capability State

États recommandés :

```text
AVAILABLE
UNAVAILABLE
DEGRADED
UNKNOWN
BLOCKED
ERROR
```

---

## 9. Dependency State

```text
RESOLVED
MISSING
INCOMPATIBLE
CONFLICT
CYCLE
OPTIONAL_MISSING
DEGRADED
ERROR
```

---

## 10. Required Capability

Si une capability REQUIRED est absente :

```text
Capability → UNAVAILABLE
Dependency → MISSING
Consumer → BLOCKED
```

---

## 11. Optional Capability

Si une capability optionnelle est absente :

```text
Capability → UNAVAILABLE
Consumer → ACTIVE ou DEGRADED
```

selon la politique publiée.

---

## 12. Capability Provider

Une capability peut être fournie par :

```text
same Pack
another Pack
ERP Adapter
Data Runtime
Integration Layer
Platform Service
```

Le Runtime consomme le provider par contrat.

---

## 13. Provider Contract

Interface conceptuelle :

```text
CapabilityAvailabilityProvider
```

Méthodes :

```text
resolveCapabilities(codes[], context)
getCapabilityMetadata(code)
getProviderRevision()
```

---

## 14. Batch Resolution

Le Runtime doit résoudre les capabilities par lot.

Préférer :

```text
resolveCapabilities([
  stock.product.read,
  stock.inventory.read,
  stock.inventory.execute
])
```

et non un appel réseau par capability.

---

## 15. Capability Availability Result

Exemple :

```json
{
  "code": "stock.product.read",
  "state": "AVAILABLE",
  "provider": "data-runtime",
  "contractVersion": "1.0",
  "providerRevision": "rev_42"
}
```

---

## 16. Capability Unavailable Result

```json
{
  "code": "stock.analytics.export",
  "state": "UNAVAILABLE",
  "reasonCode": "PROVIDER_CAPABILITY_NOT_EXPOSED",
  "provider": "data-runtime"
}
```

---

## 17. Capability Contract Compatibility

Une capability peut nécessiter :

```text
contractRef
contractVersionRange
```

Le Runtime doit vérifier que le provider expose une version compatible.

---

## 18. Version Compatibility

Exemple :

```text
Requires:
data.action >=1.2 <2.0

Provider:
data.action 1.4

→ compatible
```

---

## 19. Provider Unavailable

Si le provider est indisponible :

```text
UNKNOWN
```

ou :

```text
ERROR
```

selon le contrat.

Le Runtime ne doit pas confondre :

```text
capability absent
```

avec :

```text
provider inaccessible
```

---

## 20. Degraded Provider

Un provider peut répondre :

```text
state = DEGRADED
```

Exemple :

```text
lecture possible
écriture indisponible
```

Le Runtime doit appliquer la politique de consommation correspondante.

---

## 21. Dependency Source

Une dépendance peut partir de :

```text
PACK
MODULE
FEATURE
CAPABILITY
```

---

## 22. Dependency Target

Une cible peut être :

```text
PACK
MODULE
FEATURE
CAPABILITY
CONTRACT
```

---

## 23. Direct Dependency

```text
Feature A
REQUIRED
Capability B
```

C’est une dépendance directe.

---

## 24. Transitive Dependency

```text
Feature A
 ↓ requires
Module B
 ↓ requires
Capability C
```

A dépend transitivement de C.

---

## 25. Graph Runtime

Le resolver doit construire un graphe :

```text
Pack
 ├── Module A
 │    ├── Feature A1
 │    │    └── Capability X
 │    └── Feature A2
 │
 └── Module B
      └── Dependency Pack Y
```

---

## 26. Topological Resolution

Pour les dépendances acycliques :

```text
resolve provider/root nodes first
then consumers
```

Cela garantit une résolution stable.

---

## 27. Cycle Detection

Si un cycle survient :

```text
A → B → C → A
```

alors :

```text
RUNTIME_DEPENDENCY_CYCLE
```

Le chemin complet doit être diagnostiqué.

---

## 28. Cycle unexpected

Les cycles devraient avoir été bloqués au Pack Manager.

En Runtime, leur présence est considérée comme une anomalie critique de publication/compatibilité.

---

## 29. Missing Dependency

Exemple :

```text
Required Pack Catalog >=1.0
not available
```

Résultat :

```text
MISSING
```

---

## 30. Incompatible Dependency

Exemple :

```text
Requires Catalog >=2.0
Available Catalog 1.8
```

Résultat :

```text
INCOMPATIBLE
```

---

## 31. Conflict

Exemple :

```text
Pack A
CONFLICTS_WITH
Pack B
```

Si les deux sont présents dans le contexte :

```text
CONFLICT
```

---

## 32. Optional Missing

Une dépendance optionnelle absente donne :

```text
OPTIONAL_MISSING
```

Elle ne bloque pas nécessairement le pack.

---

## 33. Runtime Dependency Context

La résolution peut dépendre de :

```text
tenant
application
environment
available packs
active packs
capabilities
contract versions
deployment state
```

---

## 34. Pack Availability Provider

Interface :

```text
PackAvailabilityProvider
```

Résout :

```text
pack code
available versions
deployment state
environment
tenant scope
```

---

## 35. Contract Availability Provider

Interface :

```text
ContractAvailabilityProvider
```

Permet de résoudre les dépendances à des contrats plateforme.

---

## 36. Dependency Resolution Result

```json
{
  "dependencyId": "dep_001",
  "sourceRef": "stock.analytics",
  "type": "REQUIRED",
  "targetType": "CAPABILITY",
  "targetRef": "stock.product.read",
  "state": "RESOLVED",
  "resolvedProvider": "data-runtime"
}
```

---

## 37. Missing Result

```json
{
  "dependencyId": "dep_002",
  "state": "MISSING",
  "reasonCode": "CAPABILITY_NOT_AVAILABLE",
  "blocking": true
}
```

---

## 38. Resolution Summary

```json
{
  "capabilities": {
    "required": 12,
    "available": 11,
    "missing": 1,
    "degraded": 0
  },
  "dependencies": {
    "total": 10,
    "resolved": 8,
    "missing": 1,
    "optionalMissing": 1,
    "conflicts": 0,
    "cycles": 0
  }
}
```

---

## 39. Blocking Policy

Bloquants par défaut :

```text
REQUIRED missing
version incompatible
conflict
cycle
mandatory provider error
```

Non bloquants par défaut :

```text
OPTIONAL missing
RECOMMENDS missing
diagnostic provider unavailable
```

---

## 40. Policy Version

La politique de résolution doit être versionnée :

```text
dependencyResolutionPolicyVersion
```

---

## 41. Reason Codes

Capabilities :

```text
CAPABILITY_AVAILABLE
CAPABILITY_NOT_EXPOSED
CAPABILITY_PROVIDER_DOWN
CAPABILITY_CONTRACT_INCOMPATIBLE
CAPABILITY_CONTEXT_FORBIDDEN
CAPABILITY_DEGRADED
```

Dependencies :

```text
DEPENDENCY_RESOLVED
DEPENDENCY_TARGET_MISSING
DEPENDENCY_VERSION_INCOMPATIBLE
DEPENDENCY_CONFLICT
DEPENDENCY_CYCLE
DEPENDENCY_OPTIONAL_MISSING
```

---

## 42. Explain

Chaque résultat doit pouvoir être expliqué.

Exemple :

```text
Feature stock.low_stock_alert is BLOCKED

Required capability:
stock.product.read

Provider:
Data Runtime

Provider response:
Capability not exposed for this tenant

Final:
BLOCKED
```

---

## 43. Diagnostics Graph

Le cockpit peut afficher :

```text
Feature Alert
   ↓ REQUIRED
Capability product.read
   ↓ provider
Data Runtime
   ✕ unavailable
```

---

## 44. API interne

Interface conceptuelle :

```text
resolveCapabilitiesAndDependencies(
  manifest,
  runtimeContext
)
```

---

## 45. API — Resolution Detail

```http
GET /api/runtime/resolutions/:id/capabilities
GET /api/runtime/resolutions/:id/dependencies
```

---

## 46. API — Graph

```http
GET /api/runtime/resolutions/:id/dependency-graph
```

---

## 47. API — Explain

```http
GET /api/runtime/resolutions/:id/dependencies/:dependencyId/explain
```

---

## 48. API — Capability Explain

```http
GET /api/runtime/resolutions/:id/capabilities/:code/explain
```

---

## 49. Simulation

Pour diagnostic :

```http
POST /api/runtime/simulate/capabilities-dependencies
```

Exemple :

```json
{
  "packCode": "stock",
  "packVersion": "1.2.0",
  "contextOverrides": {
    "environment": "TEST"
  }
}
```

Simulation uniquement pour utilisateurs autorisés.

---

## 50. Permissions IAM

```text
runtime.capability.read
runtime.capability.explain
runtime.dependency.read
runtime.dependency.explain
runtime.dependency.view_graph
runtime.resolution.simulate
```

---

## 51. Multi-tenant

Les providers doivent recevoir le tenant dans un contexte sécurisé.

Interdit :

```text
resolve capability globally
then forget tenant scope
```

---

## 52. Security

Le resolver doit :

- utiliser allowlists ;
- valider les codes ;
- valider les versions ;
- empêcher les références arbitraires ;
- refuser les URLs/providers injectés depuis le manifest ;
- masquer les détails sensibles ;
- protéger contre les graphes trop volumineux.

---

## 53. Graph Limits

Configurer :

```text
maxNodes
maxEdges
maxDepth
maxTransitiveExpansion
```

En dépassement :

```text
RUNTIME_DEPENDENCY_GRAPH_TOO_LARGE
```

---

## 54. Timeout

La résolution doit avoir :

```text
capabilityProviderTimeout
dependencyProviderTimeout
graphResolutionTimeout
```

---

## 55. Retry

Retry uniquement en cas de panne transitoire provider.

Pas de retry automatique si :

```text
capability genuinely missing
version incompatible
conflict
cycle
```

---

## 56. Circuit Breaker

Chaque provider externe doit être protégé selon PR-CDC-00.

---

## 57. Cache

Le Runtime peut cacher :

```text
capability availability
pack availability
contract availability
dependency resolution
```

---

## 58. Cache Key

Exemple :

```text
tenantId
environment
manifestHash
capabilityRevision
packDeploymentRevision
contractRegistryRevision
```

---

## 59. Cache Invalidation

Invalider si :

```text
deployment change
capability provider revision
contract registry revision
tenant entitlement/context changes if relevant
manifest changes
```

---

## 60. Observability

Spans :

```text
runtime.capabilities.resolve
runtime.capability.provider
runtime.dependencies.resolve
runtime.dependency.graph
runtime.dependency.cycle_check
```

---

## 61. Metrics

```text
runtime_capability_required_total
runtime_capability_available_total
runtime_capability_missing_total
runtime_capability_degraded_total
runtime_dependency_resolved_total
runtime_dependency_missing_total
runtime_dependency_conflict_total
runtime_dependency_cycle_total
runtime_dependency_resolution_duration_ms
```

---

## 62. Logs

```json
{
  "event": "runtime.dependency.resolved",
  "resolutionId": "res_001",
  "sourceRef": "stock.alert",
  "targetRef": "stock.product.read",
  "state": "RESOLVED",
  "traceId": "trace_001"
}
```

---

## 63. Audit

Auditer surtout les actions administratives :

```text
runtime.capability.simulated
runtime.dependency.simulated
runtime.dependency.graph.exported
```

Les résolutions techniques ordinaires restent principalement des logs/traces.

---

## 64. Frontend React

Structure indicative :

```text
src/features/pack-runtime/capability-dependency/
├── capabilities/
├── dependencies/
├── graph/
├── explain/
├── simulation/
├── components/
├── hooks/
├── services/
└── tests/
```

---

## 65. Composants

```text
RuntimeCapabilityList
CapabilityStateBadge
CapabilityProviderBadge
RuntimeDependencyList
DependencyStateBadge
DependencyGraph
DependencyPathViewer
CapabilityExplainPanel
DependencyExplainPanel
CapabilityDependencySummary
```

---

## 66. Maquette

```text
CAPABILITIES

✓ stock.product.read       AVAILABLE  Data Runtime
✓ stock.inventory.execute AVAILABLE  Data Runtime
⚠ analytics.export        DEGRADED   Integration
✕ payment.execute         UNAVAILABLE

DEPENDENCIES

✓ Catalog >=1.0           RESOLVED
✓ product.read            RESOLVED
⚠ analytics.export        OPTIONAL_MISSING
✕ payment.execute         MISSING / BLOCKING
```

---

## 67. UX Explain

```text
payment.execute
State: UNAVAILABLE

Required by:
Feature payment.checkout

Provider:
Integration Runtime

Reason:
CAPABILITY_NOT_EXPOSED

Dependency:
REQUIRED

Final impact:
Feature payment.checkout → BLOCKED
```

---

## 68. Backend NestJS

Structure indicative :

```text
src/pack-runtime/capability-dependency-resolver/
├── capability-resolver.service.ts
├── dependency-resolver.service.ts
├── dependency-graph.service.ts
├── cycle-detector.service.ts
├── version-compatibility.service.ts
├── dependency-policy.service.ts
├── explain.service.ts
├── providers/
├── dto/
└── tests/
```

---

## 69. Prisma conceptuel

```text
RuntimeCapabilityResolution
├── id
├── resolutionId
├── capabilityCode
├── state
├── providerRef
├── contractVersion
├── reasonCode
├── details
└── createdAt
```

```text
RuntimeDependencyResolution
├── id
├── resolutionId
├── dependencyRef
├── sourceRef
├── targetRef
├── state
├── blocking
├── reasonCode
├── details
└── createdAt
```

---

## 70. Indexes

```text
RuntimeCapabilityResolution(resolutionId, capabilityCode)
RuntimeCapabilityResolution(state)
RuntimeDependencyResolution(resolutionId, state)
RuntimeDependencyResolution(sourceRef, targetRef)
```

---

## 71. Persistence Policy

La persistance détaillée peut être configurable.

Option A :
- persister tous les résultats.

Option B :
- persister uniquement summary/issues ;
- conserver le détail dans Effective Manifest Snapshot / logs.

Le choix dépendra du volume et des besoins d’audit.

---

## 72. Mock Providers

```text
MockCapabilityAvailabilityProvider
MockPackAvailabilityProvider
MockContractAvailabilityProvider
MockDependencyProvider
```

---

## 73. Contract Tests

Tester :

```text
CapabilityAvailabilityContract
PackAvailabilityContract
ContractAvailabilityContract
DependencyResolutionContract
CapabilityResolutionResultContract
DependencyResolutionResultContract
```

---

## 74. Unit Tests

Tester :

- required capability available ;
- required capability missing ;
- optional capability missing ;
- provider down ;
- provider degraded ;
- version compatible ;
- version incompatible ;
- direct dependency ;
- transitive dependency ;
- conflict ;
- cycle ;
- blocking policy ;
- deterministic graph ordering.

---

## 75. Integration Tests

Tester :

- orchestration avec PR-CDC-02 ;
- interaction PR-CDC-03 ;
- providers réels/mocks ;
- tenant isolation ;
- cache ;
- circuit breaker ;
- observability ;
- persistence.

---

## 76. E2E — Success

```text
Pack Stock
→ requires stock.product.read
→ Data Runtime provides capability
→ dependency RESOLVED
→ feature candidate ACTIVE
```

---

## 77. E2E — Missing Required Capability

```text
Checkout
→ requires payment.execute
→ provider does not expose payment.execute
→ MISSING
→ blocking = true
→ Feature Checkout BLOCKED
```

---

## 78. E2E — Optional Missing

```text
Reporting
→ optional analytics.export
→ capability unavailable
→ OPTIONAL_MISSING
→ Reporting DEGRADED
→ Pack continues
```

---

## 79. E2E — Conflict

```text
Pack Legacy
CONFLICTS_WITH Pack NewStock
→ both active
→ CONFLICT
→ Runtime BLOCKED
```

---

## 80. Critères d’acceptation

PR-CDC-04 est conforme si :

- toutes les capabilities requises sont résolues ;
- REQUIRED et OPTIONAL sont distingués ;
- providers abstraits par contrat ;
- résolution batch disponible ;
- versions compatibles vérifiées ;
- dépendances directes/transitives résolues ;
- conflits détectés ;
- cycles détectés ;
- reasonCode systématique ;
- impact bloquant/non bloquant explicite ;
- graph/explain disponibles ;
- tenant isolation appliquée ;
- cache/resilience intégrés ;
- tests unitaires/intégration/E2E passants.

---

## 81. Definition of Done

```text
PR-CDC-04 DONE
├── Capability Resolver
├── Dependency Resolver
├── Capability States
├── Dependency States
├── Required / Optional
├── Capability Providers
├── Batch Resolution
├── Contract Compatibility
├── Version Compatibility
├── Direct Dependencies
├── Transitive Dependencies
├── Graph Builder
├── Topological Resolution
├── Cycle Detection
├── Conflict Detection
├── Blocking Policy
├── Reason Codes
├── Explain
├── Diagnostics Graph
├── Cache
├── Timeout / Retry / Circuit Breaker
├── Security Limits
├── IAM / Tenant Isolation
├── Observability
├── Mock Providers
├── Contract Tests
├── Unit Tests
├── Integration Tests
└── E2E Web
```

---

## 82. Résultat attendu

```text
PACK / MODULE / FEATURE
          ↓
     CAPABILITIES
          +
     DEPENDENCIES
          ↓
CAPABILITY & DEPENDENCY RESOLVER
          ↓
┌─────────┼───────────┬────────────┐
↓         ↓           ↓            ↓
RESOLVED  MISSING  INCOMPATIBLE  CONFLICT
          ↓
   BLOCK / DEGRADE
          ↓
MODULE & FEATURE RESOLUTION
          ↓
EFFECTIVE RUNTIME MANIFEST
```

> **PR-CDC-04 garantit que le Pack Runtime n’active jamais silencieusement une fonctionnalité dont les capacités ou dépendances obligatoires ne sont pas réellement disponibles et compatibles dans le contexte d’exécution.**
