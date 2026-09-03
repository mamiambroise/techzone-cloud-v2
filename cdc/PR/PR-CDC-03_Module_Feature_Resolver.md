# PR-CDC-03 — Module & Feature Resolver

**Projet :** Techzone Cloud  
**Pack :** Pack Runtime  
**Référence :** PR-CDC-03  
**Version :** 1.0  
**Statut :** Cahier des charges fonctionnel et technique  
**Dépendances obligatoires :** PR-CDC-00 — Socle, Architecture & Runtime Contracts ; PR-CDC-02 — Manifest Loader & Runtime Resolver  
**Contrats amont :** Pack Manifest Contract ; Runtime Context Contract  
**Contrats aval :** Effective Runtime Manifest Contract  
**Stack :** React · NestJS · Prisma · PostgreSQL

---

## 1. Objet

PR-CDC-03 définit le **Module & Feature Resolver**, responsable de déterminer quels modules et quelles features d’un Pack Manifest sont réellement actifs, inactifs, bloqués ou dégradés dans un contexte Runtime donné.

Il répond à la question :

> **Parmi tout ce qui a été publié dans le pack, qu’est-ce qui est effectivement activé pour ce tenant, cette application, cet environnement et ce contexte ?**

---

## 2. Position dans le Pack Runtime

```text
PACK MANIFEST
     ↓
PR-CDC-02
Manifest Loader & Runtime Resolver
     ↓
PR-CDC-03
MODULE & FEATURE RESOLVER
     ↓
PR-CDC-04
Capability & Dependency Resolver
     ↓
PR-CDC-05
Rules & Context Resolver
     ↓
PR-CDC-06
Effective Runtime Manifest
```

PR-CDC-03 ne modifie jamais les définitions publiées. Il produit uniquement un **état effectif de résolution**.

---

## 3. Responsabilités

PR-CDC-03 doit permettre de :

- charger les modules déclarés dans le Pack Manifest ;
- charger les features rattachées ;
- vérifier leur intégrité ;
- déterminer leur état initial ;
- prendre en compte l’état `enabled/defaultEnabled` publié ;
- prendre en compte le contexte Runtime ;
- intégrer les décisions de règles ;
- intégrer l’état des capabilities/dépendances ;
- résoudre les activations finales ;
- produire les raisons de chaque décision ;
- générer un résumé déterministe ;
- alimenter l’Effective Runtime Manifest ;
- exposer des diagnostics lisibles.

---

## 4. Hors périmètre

PR-CDC-03 ne doit pas :

- créer un module ;
- créer une feature ;
- modifier les définitions PM-CDC-04/05 ;
- décider seul qu’une capability externe existe ;
- résoudre intégralement les dépendances ;
- recalculer les droits IAM ;
- modifier un abonnement ;
- exécuter une feature.

---

## 5. Principe fondamental

```text
DEFINITION PUBLIEE
      +
CONTEXTE RUNTIME
      +
DEPENDENCIES/CAPABILITIES
      +
RULE DECISIONS
      =
ETAT EFFECTIF
```

---

## 6. États effectifs Module

États recommandés :

```text
ACTIVE
INACTIVE
BLOCKED
DEGRADED
HIDDEN
UNAVAILABLE
ERROR
```

---

## 7. États effectifs Feature

```text
ACTIVE
INACTIVE
BLOCKED
DEGRADED
HIDDEN
UNAVAILABLE
ERROR
```

Le vocabulaire est volontairement harmonisé entre Module et Feature.

---

## 8. Raison de résolution

Chaque état doit être accompagné d’un `reasonCode`.

Exemples :

```text
DECLARED_ENABLED
DECLARED_DISABLED
RULE_MATCHED
RULE_NOT_MATCHED
DEPENDENCY_MISSING
CAPABILITY_MISSING
ENTITLEMENT_MISSING
PERMISSION_MISSING
MODULE_INACTIVE
ENVIRONMENT_NOT_ALLOWED
FEATURE_NOT_AVAILABLE
CONFLICT
RUNTIME_ERROR
```

---

## 9. Résultat explicable

Exemple :

```json
{
  "code": "stock.analytics",
  "state": "INACTIVE",
  "reasonCode": "ENTITLEMENT_MISSING",
  "details": {
    "requiredEntitlement": "analytics.pro"
  }
}
```

Le Runtime ne doit jamais renvoyer simplement `false` sans explication lorsque la décision est administrativement importante.

---

## 10. Ordre de résolution recommandé

```text
1. Validate declaration
2. Check parent Module state
3. Check declared enabled/defaultEnabled
4. Check environment constraints
5. Check entitlement constraints
6. Check capability/dependency state
7. Apply rule decisions
8. Apply conflict policy
9. Determine final state
10. Generate explanation
```

L’ordre exact doit rester contractuel et déterministe.

---

## 11. Module initial state

À partir du Pack Manifest :

```text
enabled = true
→ initial candidate ACTIVE

enabled = false
→ initial candidate INACTIVE
```

Une règle, dépendance ou capability peut ensuite changer le résultat effectif selon la politique publiée.

---

## 12. Feature initial state

Le resolver considère :

```text
enabled
defaultEnabled
status
visibility
module state
```

Une feature appartenant à un module `BLOCKED` ne peut pas devenir `ACTIVE`.

---

## 13. Parent-Child Propagation

Règle :

```text
Module BLOCKED
    ↓
Features du module
    ↓
BLOCKED ou UNAVAILABLE
```

Sauf exception explicitement définie par contrat, une feature ne peut pas être active si son module parent ne l’est pas.

---

## 14. Propagation contrôlée

Ne pas utiliser de propagation implicite non documentée.

Chaque propagation doit avoir :

```text
sourceState
targetState
reasonCode
policyVersion
```

---

## 15. Module sans Feature

Un module peut être structurel ou technique et ne pas exposer de Feature.

Il peut rester `ACTIVE` si sa définition l’autorise.

---

## 16. Feature sans Capability

Une feature peut ne pas exiger de capability externe.

Elle peut être résolue localement selon sa configuration et ses règles.

---

## 17. Feature avec Capabilities requises

Exemple :

```text
Feature stock.low_stock_alert

REQUIRES
├── stock.product.read
└── stock.inventory.read
```

Si une capability REQUIRED est absente :

```text
Feature → BLOCKED
```

sauf politique de mode dégradé publiée.

---

## 18. Feature avec Capability optionnelle

Exemple :

```text
OPTIONAL
analytics.export
```

Si absente :

```text
Feature → ACTIVE ou DEGRADED
```

selon le manifest.

---

## 19. Module avec dépendances

Un module peut dépendre :

- d’un autre module ;
- d’une feature ;
- d’un pack ;
- d’une capability.

Le résultat de PR-CDC-04 doit être consommé par contrat.

---

## 20. Interaction avec Rules

PR-CDC-03 ne réévalue pas les Rules métier de manière indépendante.

Il consomme des décisions structurées provenant de PR-CDC-05.

Exemple :

```json
{
  "targetType": "FEATURE",
  "targetRef": "stock.analytics",
  "effect": "DISABLE",
  "matched": true,
  "ruleCode": "stock.analytics.plan_access"
}
```

---

## 21. Priorité des décisions

Proposition contractuelle :

```text
1. SECURITY / TENANT BLOCK
2. MANDATORY DEPENDENCY BLOCK
3. REQUIRED CAPABILITY BLOCK
4. EXPLICIT DENY/DISABLE RULE
5. REQUIRED ENTITLEMENT BLOCK
6. DECLARED DISABLED
7. ENABLE RULE
8. DEFAULT ENABLED
```

Cette hiérarchie doit être centralisée dans une `ResolutionPolicy`.

---

## 22. Security overrides

Une règle d’activation ne peut pas contourner :

```text
tenant isolation
permission denied
security block
contract incompatibility
mandatory dependency missing
```

---

## 23. Entitlement Resolution

Exemple :

```text
Feature analytics
requires entitlement analytics.pro
```

Si :

```text
tenant plan = BASIC
```

alors :

```text
INACTIVE
reason = ENTITLEMENT_MISSING
```

---

## 24. Permission Resolution

Certaines features peuvent nécessiter une permission IAM.

Exemple :

```text
requiredPermission = stock.inventory.execute
```

Si l’utilisateur n’a pas la permission :

```text
HIDDEN
```

ou :

```text
INACTIVE
```

selon la politique de visibilité publiée.

---

## 25. Feature Visibility

Valeurs publiées possibles :

```text
PUBLIC
ADMIN
INTERNAL
HIDDEN
```

Le Runtime doit transformer cette information en état effectif selon le contexte utilisateur.

---

## 26. Visibility ≠ Authorization

Important :

```text
HIDDEN
≠
FORBIDDEN
```

Une feature non visible dans l’UI peut néanmoins exister pour un usage interne autorisé.

La décision d’autorisation reste sous gouvernance IAM.

---

## 27. Environment Constraints

Exemples :

```text
TEST_ONLY
PROD_ALLOWED
NON_PROD
ALL
```

Une feature expérimentale peut être :

```text
ACTIVE en TEST
INACTIVE en PROD
```

---

## 28. Runtime Feature Flags

Les feature flags peuvent influencer la résolution.

Exemple :

```text
context.flags.aiForecast = false
```

Mais ils ne remplacent pas les Features définies par le Pack Manager.

---

## 29. Configuration effective

Le resolver peut produire une configuration par module/feature.

Exemple :

```json
{
  "code": "inventory",
  "state": "ACTIVE",
  "configuration": {
    "defaultView": "list",
    "allowExport": true
  }
}
```

La configuration finale consolidée appartient à PR-CDC-06.

---

## 30. Module Resolution Result

Structure conceptuelle :

```json
{
  "moduleRef": "inventory",
  "state": "ACTIVE",
  "reasonCode": "DECLARED_ENABLED",
  "features": 4,
  "activeFeatures": 3,
  "blockedFeatures": 1,
  "diagnostics": []
}
```

---

## 31. Feature Resolution Result

```json
{
  "featureRef": "stock.analytics",
  "moduleRef": "inventory",
  "state": "INACTIVE",
  "reasonCode": "ENTITLEMENT_MISSING",
  "ruleDecisions": [],
  "dependencyState": "RESOLVED",
  "capabilityState": "RESOLVED"
}
```

---

## 32. Resolution Summary

```json
{
  "modules": {
    "total": 5,
    "active": 4,
    "blocked": 1
  },
  "features": {
    "total": 18,
    "active": 14,
    "inactive": 2,
    "blocked": 2
  }
}
```

---

## 33. Batch Resolution

Le resolver doit traiter l’ensemble des modules/features en batch.

Éviter :

```text
1 HTTP call par Feature
```

Préférer :

```text
1 capability batch
1 entitlement batch
1 rule decision batch
```

---

## 34. Dependency Graph Awareness

Le resolver doit respecter l’ordre topologique lorsque des modules/features dépendent les uns des autres.

Exemple :

```text
Catalog
  ↓
Inventory
  ↓
Analytics
```

Résoudre le parent requis avant le consommateur.

---

## 35. Cycle Runtime

Normalement, les cycles doivent avoir été empêchés avant publication.

Si un cycle est malgré tout rencontré :

```text
BLOCKED
RUNTIME_DEPENDENCY_CYCLE
```

et diagnostic critique.

---

## 36. Missing Definition

Si une règle ou dépendance pointe vers une Feature absente du manifest :

```text
RUNTIME_FEATURE_REFERENCE_INVALID
```

---

## 37. Duplicate Definition

Deux modules ou features avec le même code contractuel doivent bloquer la résolution du manifest.

---

## 38. Deterministic Ordering

Les résultats doivent être ordonnés de façon stable.

Exemple :

```text
displayOrder
then code ASC
```

Cela facilite :

- hash ;
- cache ;
- diff ;
- tests ;
- reproductibilité.

---

## 39. Hash du résultat partiel

Option recommandée :

```text
moduleFeatureResolutionHash
```

Utilisable dans :

- cache ;
- diagnostic ;
- Effective Manifest hash.

---

## 40. Cache

Le résultat Modules/Features peut être caché selon :

```text
manifestHash
tenantId
applicationId
contextRevision
entitlementRevision
capabilityRevision
ruleRevision
```

---

## 41. Cache Invalidation

Invalider notamment si :

```text
context change
entitlement change
capability availability change
rule context change
manifest change
```

---

## 42. API interne

PR-CDC-03 est principalement un service interne.

Interface conceptuelle :

```text
resolveModulesAndFeatures(
  manifest,
  runtimeContext,
  capabilityState,
  dependencyState,
  ruleDecisions
)
```

---

## 43. API diagnostic

Endpoint possible :

```http
GET /api/runtime/resolutions/:id/modules
GET /api/runtime/resolutions/:id/features
```

---

## 44. API Explain

```http
GET /api/runtime/resolutions/:id/features/:featureRef/explain
```

Réponse :

```json
{
  "state": "INACTIVE",
  "reasonCode": "ENTITLEMENT_MISSING",
  "explanation": {
    "required": "analytics.pro",
    "actualPlan": "BASIC"
  }
}
```

---

## 45. Simulation ciblée

Pour diagnostic ou administration :

```http
POST /api/runtime/simulate/module-feature
```

Uniquement avec permission spécifique.

---

## 46. Permissions IAM

```text
runtime.module.read
runtime.feature.read
runtime.feature.explain
runtime.module.explain
runtime.resolution.simulate
```

---

## 47. Multi-tenant

Tout résultat doit être lié au `tenantId` du RuntimeResolution.

Aucune feature d’un autre tenant ne doit être incorporée par erreur.

---

## 48. Error Codes

```text
RUNTIME_MODULE_NOT_FOUND
RUNTIME_FEATURE_NOT_FOUND
RUNTIME_MODULE_REFERENCE_INVALID
RUNTIME_FEATURE_REFERENCE_INVALID
RUNTIME_MODULE_DUPLICATE
RUNTIME_FEATURE_DUPLICATE
RUNTIME_MODULE_BLOCKED
RUNTIME_FEATURE_BLOCKED
RUNTIME_MODULE_DEPENDENCY_MISSING
RUNTIME_FEATURE_DEPENDENCY_MISSING
RUNTIME_FEATURE_CAPABILITY_MISSING
RUNTIME_FEATURE_ENTITLEMENT_MISSING
RUNTIME_FEATURE_PERMISSION_MISSING
RUNTIME_FEATURE_ENVIRONMENT_BLOCKED
RUNTIME_FEATURE_RULE_CONFLICT
RUNTIME_MODULE_FEATURE_RESOLUTION_ERROR
```

---

## 49. Observability

Spans recommandés :

```text
runtime.modules.resolve
runtime.module.resolve
runtime.features.resolve
runtime.feature.resolve
runtime.feature.explain
```

---

## 50. Metrics

```text
runtime_module_resolved_total
runtime_module_blocked_total
runtime_feature_resolved_total
runtime_feature_active_total
runtime_feature_inactive_total
runtime_feature_blocked_total
runtime_feature_degraded_total
runtime_module_feature_resolution_duration_ms
```

---

## 51. Logs

Exemple :

```json
{
  "event": "runtime.feature.resolved",
  "resolutionId": "res_001",
  "featureRef": "stock.analytics",
  "state": "INACTIVE",
  "reasonCode": "ENTITLEMENT_MISSING",
  "traceId": "trace_001"
}
```

---

## 52. Audit

Les décisions Runtime normales ne nécessitent pas toutes un audit métier.

Auditer plutôt :

```text
runtime.module_feature.simulated
runtime.feature.explanation.exported
runtime.admin_override.attempted
```

Un admin override de décision ne doit pas être autorisé sauf mécanisme explicitement conçu.

---

## 53. Aucun Override silencieux

Le Cockpit ne doit pas offrir :

```text
[Force Enable]
```

pour contourner une dépendance obligatoire, un entitlement ou IAM.

Toute capacité de test doit rester en mode Simulation/Preview.

---

## 54. Frontend React

Structure indicative :

```text
src/features/pack-runtime/module-feature/
├── modules/
├── features/
├── explain/
├── simulation/
├── components/
├── hooks/
├── services/
├── types/
└── tests/
```

---

## 55. Composants

```text
RuntimeModuleList
RuntimeModuleCard
RuntimeModuleStateBadge
RuntimeFeatureList
RuntimeFeatureStateBadge
RuntimeFeatureExplainPanel
ModuleFeatureSummary
ResolutionReasonBadge
ResolutionDecisionTimeline
```

---

## 56. Maquette fonctionnelle

```text
PACK STOCK 1.2.0 — TENANT A

MODULES
✓ Products       ACTIVE
✓ Inventory      ACTIVE
✓ Warehouses     ACTIVE
⚠ Reporting      DEGRADED

FEATURES
✓ stock.inventory          ACTIVE
✓ stock.multi_warehouse    ACTIVE
✕ stock.analytics          INACTIVE
  → entitlement analytics.pro missing
⚠ stock.export             DEGRADED
  → optional capability unavailable
```

---

## 57. UX Explain

Cliquer sur une Feature :

```text
stock.analytics
State: INACTIVE

Why?
1. Module Inventory = ACTIVE
2. Declared enabled = TRUE
3. Dependencies = RESOLVED
4. Rules = MATCHED
5. Entitlement analytics.pro = MISSING

Final decision:
INACTIVE
```

---

## 58. États UI

```text
LOADING
READY
EMPTY
ERROR
FORBIDDEN
ACTIVE
INACTIVE
BLOCKED
DEGRADED
HIDDEN
UNAVAILABLE
```

---

## 59. Backend NestJS

Structure indicative :

```text
src/pack-runtime/module-feature-resolver/
├── module-feature-resolver.service.ts
├── module-resolver.service.ts
├── feature-resolver.service.ts
├── resolution-policy.service.ts
├── resolution-reason.service.ts
├── parent-state-propagation.service.ts
├── explain.service.ts
├── dto/
└── tests/
```

---

## 60. Prisma conceptuel

Le Runtime peut persister uniquement les résumés si nécessaire.

```text
RuntimeModuleResolution
├── id
├── resolutionId
├── moduleRef
├── state
├── reasonCode
├── details
└── createdAt
```

```text
RuntimeFeatureResolution
├── id
├── resolutionId
├── moduleRef
├── featureRef
├── state
├── reasonCode
├── details
└── createdAt
```

La persistance complète peut être évitée si l’Effective Manifest Snapshot suffit.

---

## 61. Indexes

```text
RuntimeModuleResolution(resolutionId, moduleRef)
RuntimeFeatureResolution(resolutionId, featureRef)
RuntimeFeatureResolution(state)
```

---

## 62. Mock / Simulation

Mocks :

```text
MockCapabilityStateProvider
MockDependencyStateProvider
MockRuleDecisionProvider
MockEntitlementProvider
MockPermissionProvider
```

Le resolver doit fonctionner sans services réels.

---

## 63. Contract Tests

Tester :

```text
ModuleResolutionContract
FeatureResolutionContract
ResolutionReasonContract
RuleDecisionInputContract
DependencyStateInputContract
CapabilityStateInputContract
```

---

## 64. Unit Tests

Tester :

- declared enabled/disabled ;
- parent propagation ;
- capability missing ;
- dependency missing ;
- entitlement missing ;
- permission missing ;
- environment constraint ;
- rule enable ;
- rule disable ;
- conflicts ;
- degraded mode ;
- deterministic ordering ;
- reason codes.

---

## 65. Integration Tests

Tester :

- orchestration avec PR-CDC-02 ;
- providers ;
- tenant isolation ;
- cache ;
- persistence summary ;
- explain endpoint ;
- observability.

---

## 66. E2E — Tenant PRO

```text
Pack Stock 1.2
→ Module Inventory enabled
→ Feature Analytics enabled
→ entitlement analytics.pro present
→ capabilities available
→ rules matched
→ Feature Analytics ACTIVE
```

---

## 67. E2E — Tenant BASIC

```text
Same Pack Manifest
→ same Module
→ same Feature
→ entitlement analytics.pro missing
→ Feature Analytics INACTIVE
→ reason ENTITLEMENT_MISSING
```

Ce scénario valide le principe central du Pack Runtime.

---

## 68. E2E — Capability Missing

```text
Feature Low Stock Alert
→ required capability stock.product.read missing
→ BLOCKED
→ diagnostic explicit
```

---

## 69. Critères d’acceptation

PR-CDC-03 est conforme si :

- tous les modules du manifest sont résolus ;
- toutes les features sont résolues ;
- aucun état n’est décidé sans reasonCode ;
- parent/child propagation est déterministe ;
- IAM, entitlements, dependencies, capabilities et rules sont consommés par contrats ;
- les security blocks sont prioritaires ;
- le Runtime ne modifie aucune définition publiée ;
- modes ACTIVE/INACTIVE/BLOCKED/DEGRADED sont cohérents ;
- explain est disponible ;
- cache/invalidation sont prévus ;
- tests unitaires, intégration et E2E passent.

---

## 70. Definition of Done

```text
PR-CDC-03 DONE
├── Module Resolver
├── Feature Resolver
├── Effective States
├── Reason Codes
├── Initial State
├── Parent Propagation
├── Entitlement Resolution
├── Permission Resolution
├── Environment Constraints
├── Capability Input
├── Dependency Input
├── Rule Decision Input
├── Resolution Priority Policy
├── Security Overrides
├── Degraded Mode
├── Deterministic Ordering
├── Explain
├── Resolution Summary
├── Runtime API Diagnostics
├── Cache
├── Multi-tenant Guard
├── Observability
├── Mock Providers
├── Contract Tests
├── Unit Tests
├── Integration Tests
└── E2E Web
```

---

## 71. Résultat attendu

```text
PACK MANIFEST
   │
   ├── Modules
   └── Features
        ↓
RUNTIME CONTEXT
        +
ENTITLEMENTS
        +
CAPABILITIES
        +
DEPENDENCIES
        +
RULE DECISIONS
        ↓
MODULE & FEATURE RESOLVER
        ↓
ACTIVE / INACTIVE / BLOCKED / DEGRADED
        ↓
EFFECTIVE RUNTIME MANIFEST
```

> **PR-CDC-03 transforme les Modules et Features publiés en états effectifs explicables et déterministes, sans modifier leur définition et sans contourner IAM, les entitlements, les dépendances ou les capabilities requises.**
