# PR-CDC-01 — Vue d’ensemble / Runtime Cockpit

**Projet :** Techzone Cloud  
**Pack :** Pack Runtime  
**Référence :** PR-CDC-01  
**Version :** 1.0  
**Statut :** Cahier des charges fonctionnel et technique  
**Dépendance obligatoire :** PR-CDC-00 — Socle, Architecture & Runtime Contracts  
**Stack :** React · NestJS · Prisma · PostgreSQL

---

## 1. Objet

PR-CDC-01 définit le **Runtime Cockpit**, écran principal d’observation, diagnostic et pilotage opérationnel du Pack Runtime.

Il répond à la question :

> **Que se passe-t-il actuellement dans le Runtime, quels packs sont résolus, lesquels sont bloqués et pourquoi ?**

Le Cockpit observe et agrège les informations des autres composants Runtime. Il ne doit pas réimplémenter leur logique métier.

---

## 2. Position

```text
PR-CDC-00  Architecture & Contracts
     ↓
PR-CDC-01  RUNTIME COCKPIT
     │
     ├── observe PR-CDC-02 Manifest Loader
     ├── observe PR-CDC-03 Module/Feature Resolver
     ├── observe PR-CDC-04 Capability/Dependency Resolver
     ├── observe PR-CDC-05 Rules/Context Resolver
     ├── observe PR-CDC-06 Effective Manifest
     └── observe PR-CDC-07 Cache/Diagnostics/Resilience
```

---

## 3. Responsabilités

Le cockpit doit fournir :

- état global du Runtime ;
- nombre de résolutions ;
- taux de réussite ;
- résolutions bloquées ;
- résolutions dégradées ;
- erreurs récentes ;
- packs/applications actifs ;
- état des providers ;
- état des manifests ;
- état des capabilities/dépendances ;
- décisions de règles ;
- état du cache ;
- latence et performance ;
- diagnostics ;
- activité récente ;
- actions administratives autorisées.

---

## 4. Ce que le Cockpit ne fait pas

Il ne doit pas :

- éditer le Pack Manifest ;
- modifier un pack publié ;
- modifier les règles du Pack Manager ;
- contourner IAM ;
- modifier directement Billing, ERP ou Data Runtime ;
- exécuter une capability métier ;
- devenir la source de vérité des résolutions.

---

## 5. Structure de l’écran

```text
RUNTIME COCKPIT

[ Contexte : Tenant | Application | Environment | Period ]

┌────────────┬────────────┬────────────┬────────────┐
│ Resolved   │ Blocked    │ Degraded   │ Errors     │
└────────────┴────────────┴────────────┴────────────┘

┌─────────────────────────┬─────────────────────────┐
│ Runtime Health          │ Provider Health         │
├─────────────────────────┼─────────────────────────┤
│ Recent Resolutions      │ Attention Required      │
├─────────────────────────┼─────────────────────────┤
│ Performance             │ Cache                   │
└─────────────────────────┴─────────────────────────┘

[ Recent Activity / Diagnostics ]
```

---

## 6. Sélecteur de contexte

Le cockpit doit permettre de filtrer par :

```text
tenant
application
pack
packVersion
environment
resolutionStatus
period
provider
```

Le tenant visible doit toujours respecter IAM.

---

## 7. KPIs principaux

KPIs recommandés :

```text
Total Resolutions
Resolved
Partially Resolved
Blocked
Degraded
Errors
Average Resolution Time
Cache Hit Rate
Provider Availability
```

---

## 8. Runtime Health

États :

```text
HEALTHY
WARNING
CRITICAL
UNKNOWN
```

### HEALTHY
Pas de problème bloquant significatif.

### WARNING
Dégradations ou anomalies non bloquantes.

### CRITICAL
Pannes ou résolutions bloquées importantes.

### UNKNOWN
Informations insuffisantes.

---

## 9. Calcul du Health

Le health doit être calculé de manière déterministe à partir de signaux mesurables :

```text
resolution failures
provider failures
blocked ratio
latency
cache failures
contract incompatibilities
critical diagnostics
```

L’IA ne détermine pas le statut Health.

---

## 10. Carte Resolutions

Afficher les dernières résolutions :

```text
Time
Application
Pack
Version
Tenant
Environment
Status
Duration
Manifest Hash
Trace ID
```

Actions :

```text
View
Diagnose
Retry
Compare
```

selon permissions.

---

## 11. Resolution Detail

La fiche d’une résolution doit afficher :

```text
Summary
Source Manifest
Context
Modules
Features
Capabilities
Dependencies
Rules
Effective Manifest
Diagnostics
Timeline
Trace
```

---

## 12. Timeline de résolution

Exemple :

```text
09:42:10.010  Manifest loaded
09:42:10.015  Manifest validated
09:42:10.022  IAM context resolved
09:42:10.028  Entitlements resolved
09:42:10.041  Capabilities resolved
09:42:10.052  Dependencies resolved
09:42:10.061  Rules evaluated
09:42:10.072  Effective manifest built
09:42:10.080  RESOLVED
```

---

## 13. Attention Required

Le cockpit doit prioriser les problèmes.

Sévérités :

```text
CRITICAL
ERROR
WARNING
INFO
```

Exemples :

```text
Required capability missing
Manifest contract unsupported
Provider unavailable
Dependency conflict
Rule evaluation failure
Cache stale
High latency
```

---

## 14. Provider Health

Providers à surveiller :

```text
Pack Manifest Provider
IAM Context Provider
Application Context Provider
Entitlement Provider
Capability Provider
Dependency Provider
Observability Provider
```

Pour chacun :

```text
status
latency
lastSuccess
lastFailure
errorRate
circuitBreakerState
```

---

## 15. États Provider

```text
UP
DEGRADED
DOWN
UNKNOWN
CIRCUIT_OPEN
```

---

## 16. Manifest Health

Afficher :

```text
manifest contract version
pack version
manifest hash
validation state
last loaded
cache state
compatibility
```

Alertes :

```text
HASH_INVALID
CONTRACT_UNSUPPORTED
MANIFEST_NOT_FOUND
MANIFEST_STALE
```

---

## 17. Capabilities & Dependencies

Résumé :

```text
Capabilities Required
Capabilities Available
Capabilities Missing

Dependencies Total
Dependencies Resolved
Dependencies Missing
Dependencies Conflicting
```

Le détail provient des contrats de PR-CDC-04.

---

## 18. Rules Summary

Afficher :

```text
Rules evaluated
Matched
Not matched
Failed
Average evaluation time
```

Le cockpit ne modifie pas les rules publiées.

---

## 19. Effective Manifest Summary

Pour chaque résolution :

```text
Active Modules
Inactive Modules
Active Features
Inactive Features
Available Capabilities
Restrictions
Effective Manifest Hash
```

---

## 20. Cache Dashboard

Indicateurs :

```text
Hit Rate
Miss Rate
Entries
Stale Entries
Invalidations
Average TTL
Memory/Store Health
```

Actions autorisées :

```text
Invalidate selected
Invalidate application
Invalidate pack
Invalidate tenant
```

Toute invalidation administrative doit être auditée.

---

## 21. Performance

Afficher :

```text
p50
p95
p99
average
slowest resolutions
provider latency
rule evaluation latency
dependency resolution latency
```

Les seuils doivent être configurables.

---

## 22. Graphiques

Graphiques utiles :

```text
Resolutions over time
Success vs Blocked
Latency over time
Provider failures
Cache hit rate
Top runtime errors
```

Les graphiques sont informatifs ; les données tabulaires doivent rester accessibles.

---

## 23. Activité récente

Événements :

```text
runtime.resolution.completed
runtime.resolution.blocked
runtime.provider.failed
runtime.provider.recovered
runtime.cache.invalidated
runtime.contract.unsupported
runtime.retry.requested
```

---

## 24. Recherche

Recherche par :

```text
resolutionId
traceId
applicationId
packCode
packVersion
tenantId
manifestHash
errorCode
```

Les champs sensibles ne doivent pas être indexés/exposés inutilement.

---

## 25. Filtres

```text
status
severity
environment
application
pack
tenant
provider
date range
duration threshold
```

---

## 26. Actions administratives

Actions possibles selon IAM :

```text
Resolve again
Retry
Invalidate cache
Open diagnostics
Compare effective manifests
Copy trace ID
Export diagnostic summary
```

Aucune action ne doit modifier le Pack Manifest publié.

---

## 27. Retry

Le bouton Retry doit créer une nouvelle tentative ou exécution traçable.

Il ne doit pas réécrire l’historique.

```text
Resolution A
 ↓ Retry
Resolution B
```

avec lien :

```text
retryOf = Resolution A
```

---

## 28. Compare

Le cockpit peut comparer deux Effective Runtime Manifests.

Exemple :

```text
Tenant A / PRO
vs
Tenant B / BASIC
```

Diff :

```text
Module inventory        ACTIVE / ACTIVE
Feature analytics       ACTIVE / INACTIVE
Capability export       AVAILABLE / MISSING
```

---

## 29. Diagnostics

Une vue diagnostic doit expliquer :

```text
WHAT happened?
WHERE?
WHY?
WHICH contract/provider?
WHAT is blocked?
WHAT can an administrator do?
```

Sans exposer de secrets.

---

## 30. Diagnostic Explain

Une explication déterministe doit exister sans IA.

Exemple :

```text
Feature stock.analytics is inactive.

Reason:
RULE_NOT_MATCHED

Rule:
stock.analytics.plan_access

Expected:
subscription.plan IN [PRO, PREMIUM]

Actual:
BASIC
```

---

## 31. Assistance IA optionnelle

L’IA peut transformer les diagnostics techniques en explication lisible :

```text
"La fonctionnalité Analytics est inactive car le tenant
utilise le plan BASIC, alors que la règle publiée exige
PRO ou PREMIUM."
```

Elle peut suggérer des pistes de vérification.

Elle ne doit pas changer la décision Runtime.

---

## 32. Frontend React

Structure indicative :

```text
src/features/pack-runtime/cockpit/
├── pages/
├── components/
├── charts/
├── resolutions/
├── providers/
├── diagnostics/
├── cache/
├── hooks/
├── services/
├── types/
└── tests/
```

---

## 33. Composants React

```text
RuntimeCockpitPage
RuntimeKpiCards
RuntimeHealthCard
ResolutionTable
ResolutionDetailDrawer
ResolutionTimeline
ProviderHealthGrid
AttentionList
CapabilitySummary
DependencySummary
RuleSummary
EffectiveManifestSummary
RuntimePerformanceCharts
CacheDashboard
DiagnosticPanel
RuntimeFilters
```

---

## 34. États UI

```text
LOADING
READY
EMPTY
ERROR
FORBIDDEN
PARTIAL
REFRESHING
STALE
```

Un provider indisponible ne doit pas nécessairement empêcher tout le cockpit de s’afficher.

---

## 35. Responsive

Desktop :
- dashboard multi-colonnes ;
- tableaux détaillés ;
- diagnostics latéraux.

Mobile/tablette :
- cartes empilées ;
- filtres condensés ;
- tableaux transformés en listes ;
- actions prioritaires accessibles.

---

## 36. Accessibilité

Prévoir :

- navigation clavier ;
- labels explicites ;
- focus visible ;
- contrastes suffisants ;
- statut non communiqué uniquement par couleur ;
- tableaux accessibles ;
- messages d’erreur compréhensibles.

---

## 37. Backend NestJS

Structure indicative :

```text
src/pack-runtime/cockpit/
├── cockpit.controller.ts
├── cockpit.service.ts
├── runtime-health.service.ts
├── runtime-kpi.service.ts
├── runtime-activity.service.ts
├── runtime-attention.service.ts
├── runtime-performance.service.ts
├── dto/
└── tests/
```

---

## 38. API Dashboard

```http
GET /api/runtime/dashboard
```

Retour :

```text
context
health
kpis
attention
providerHealth
performance
cache
recentResolutions
recentActivity
```

---

## 39. API Resolutions

```http
GET /api/runtime/resolutions
GET /api/runtime/resolutions/:id
GET /api/runtime/resolutions/:id/timeline
GET /api/runtime/resolutions/:id/diagnostics
```

---

## 40. API Attention

```http
GET /api/runtime/dashboard/attention
```

Filtres :

```text
severity
provider
pack
application
tenant
```

---

## 41. API Activity

```http
GET /api/runtime/dashboard/activity
```

---

## 42. API Providers

```http
GET /api/runtime/providers/health
```

---

## 43. API Performance

```http
GET /api/runtime/metrics/performance
```

---

## 44. API Compare

```http
GET /api/runtime/effective-manifests/compare?left=:idA&right=:idB
```

---

## 45. API Retry

```http
POST /api/runtime/resolutions/:id/retry
```

Doit respecter les règles de PR-CDC-00.

---

## 46. API Cache Invalidation

```http
POST /api/runtime/cache/invalidate
```

Exemple :

```json
{
  "scope": "PACK",
  "packCode": "stock",
  "reason": "Administrative refresh"
}
```

---

## 47. Permissions IAM

```text
runtime.dashboard.read
runtime.resolution.read
runtime.resolution.retry
runtime.diagnostic.read
runtime.provider.read
runtime.performance.read
runtime.cache.read
runtime.cache.invalidate
runtime.manifest.compare
```

---

## 48. Multi-tenant

Par défaut, un administrateur tenant ne voit que son tenant.

Les vues cross-tenant nécessitent une permission plateforme spécifique.

Le backend impose le scope ; React ne constitue jamais la barrière de sécurité.

---

## 49. Audit

Auditer notamment :

```text
runtime.retry.requested
runtime.cache.invalidated
runtime.diagnostic.exported
runtime.cross_tenant_view.requested
```

---

## 50. Observability

Le cockpit doit lui-même être observable :

```text
dashboard_request_duration
dashboard_error_total
dashboard_partial_response_total
diagnostic_query_duration
```

---

## 51. Performance Backend

Utiliser :

- agrégations ;
- pagination ;
- cache court pour KPIs ;
- batch queries ;
- indexes ;
- time-series store/observability provider si disponible.

Ne pas charger toutes les résolutions en mémoire.

---

## 52. Pagination

Les listes doivent utiliser pagination cursor ou pagination stable.

Exemple :

```text
limit
cursor
sort
filters
```

---

## 53. Données partielles

Si Observability est indisponible mais les résolutions sont accessibles :

```text
dashboardStatus = PARTIAL
```

Le cockpit doit indiquer précisément quelle source manque.

---

## 54. Codes d’erreur

```text
RUNTIME_DASHBOARD_FORBIDDEN
RUNTIME_DASHBOARD_PARTIAL
RUNTIME_RESOLUTION_NOT_FOUND
RUNTIME_DIAGNOSTIC_NOT_FOUND
RUNTIME_RETRY_NOT_ALLOWED
RUNTIME_CACHE_INVALIDATION_FORBIDDEN
RUNTIME_PROVIDER_STATUS_UNAVAILABLE
RUNTIME_COMPARE_NOT_ALLOWED
```

---

## 55. Prisma conceptuel

PR-CDC-01 réutilise principalement les modèles du socle :

```text
RuntimeResolution
RuntimeResolutionIssue
RuntimeDiagnosticEvent
EffectiveManifestSnapshot
RuntimeCacheEntry
```

Modèle éventuel supplémentaire :

```text
RuntimeAdminAction
├── id
├── tenantId?
├── actorId
├── actionType
├── targetType
├── targetId
├── reason
├── traceId
└── createdAt
```

---

## 56. Indexes

Prévoir notamment :

```text
RuntimeResolution(tenantId, createdAt)
RuntimeResolution(applicationId, createdAt)
RuntimeResolution(packCode, packVersion)
RuntimeResolution(status, createdAt)
RuntimeResolution(traceId)
RuntimeResolution(sourceManifestHash)
RuntimeResolutionIssue(resolutionId, severity)
```

---

## 57. Mock / Simulation

Le cockpit doit pouvoir fonctionner avec :

```text
MockResolutionQueryProvider
MockProviderHealthProvider
MockMetricsProvider
MockDiagnosticProvider
MockCacheAdminProvider
```

Chaque Mock respecte le même contrat que le provider réel.

---

## 58. Contract Tests

Tester :

```text
RuntimeDashboardContract
ResolutionSummaryContract
ProviderHealthContract
RuntimeDiagnosticContract
EffectiveManifestSummaryContract
CacheStatusContract
```

---

## 59. Tests unitaires

Tester :

- calcul Health ;
- KPI aggregation ;
- attention prioritization ;
- filter mapping ;
- permission mapping ;
- partial data handling ;
- retry eligibility ;
- cache invalidation scope.

---

## 60. Tests intégration

Tester :

- endpoints NestJS ;
- Prisma queries ;
- tenant isolation ;
- provider aggregation ;
- pagination ;
- audit ;
- cache ;
- erreurs partielles.

---

## 61. Tests E2E Web

Scénario :

```text
Login Admin
→ Runtime
→ Vue d’ensemble
→ Voir KPIs
→ Filtrer Pack Stock
→ Ouvrir résolution BLOCKED
→ Voir diagnostic
→ Identifier capability manquante
→ Copier traceId
→ Retry si autorisé
→ Voir nouvelle résolution
```

---

## 62. Critères d’acceptation Frontend

- cockpit clair et responsive ;
- KPIs visibles ;
- filtres fonctionnels ;
- résolutions consultables ;
- diagnostics lisibles ;
- Provider Health visible ;
- cache visible ;
- états PARTIAL/ERROR gérés ;
- actions protégées ;
- accessibilité minimale respectée.

---

## 63. Critères d’acceptation Backend

- agrégations fiables ;
- endpoints documentés ;
- tenant isolation ;
- IAM appliqué ;
- aucune modification du Pack Manifest ;
- retry traçable ;
- cache invalidation auditée ;
- erreurs normalisées ;
- pagination ;
- performance mesurée ;
- providers abstraits.

---

## 64. Definition of Done

```text
PR-CDC-01 DONE
├── Runtime Cockpit
├── Context Filters
├── KPI Cards
├── Runtime Health
├── Resolution List
├── Resolution Detail
├── Timeline
├── Attention Required
├── Provider Health
├── Manifest Health
├── Capability Summary
├── Dependency Summary
├── Rule Summary
├── Effective Manifest Summary
├── Cache Dashboard
├── Performance
├── Recent Activity
├── Diagnostics
├── Retry
├── Compare
├── IAM
├── Tenant Isolation
├── Audit
├── Observability
├── Mock Providers
├── Contract Tests
├── Unit Tests
├── Integration Tests
└── E2E Web
```

---

## 65. Résultat attendu

```text
                  RUNTIME COCKPIT
                        │
       ┌────────────────┼────────────────┐
       ↓                ↓                ↓
   HEALTH/KPI      RESOLUTIONS       PROVIDERS
       │                │                │
       └────────────────┼────────────────┘
                        ↓
                   DIAGNOSTICS
                        ↓
               ACTIONS AUTORISÉES
```

> **PR-CDC-01 rend le Pack Runtime observable et administrable sans devenir le moteur de résolution lui-même : il synthétise l’état, explique les problèmes et donne accès aux actions opérationnelles autorisées.**
