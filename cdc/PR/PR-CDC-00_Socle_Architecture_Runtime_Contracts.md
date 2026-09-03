# PR-CDC-00 — Socle, Architecture & Runtime Contracts

**Projet :** Techzone Cloud  
**Pack :** Pack Runtime  
**Référence :** PR-CDC-00  
**Version :** 1.0  
**Statut :** CDC socle transverse à PR-CDC-01 à PR-CDC-07  
**Stack :** React · NestJS · Prisma · PostgreSQL  
**Entrée principale :** Pack Manifest Contract versionné  
**Sortie principale :** Effective Runtime Manifest Contract

## 1. Objet
PR-CDC-00 définit l’architecture, les frontières, les contrats et les règles techniques communes du Pack Runtime.

```text
PACK MANAGER
   ↓ Pack Manifest Contract
PACK RUNTIME
   ↓ Effective Runtime Manifest
APPLICATION / UI RUNTIME
```

Le Pack Runtime transforme une définition publiée et immuable en une composition réellement applicable à un contexte d’exécution.

## 2. Mission
Le Runtime doit :
- charger et valider le Pack Manifest ;
- résoudre tenant, application, environnement et contexte IAM ;
- prendre en compte abonnement, entitlements et quotas ;
- déterminer modules et features actifs ;
- vérifier capabilities et dépendances ;
- évaluer les Rules & Conditions publiées ;
- construire une configuration effective déterministe ;
- exposer un Effective Runtime Manifest ;
- assurer cache, diagnostic, traçabilité et résilience.

## 3. Hors périmètre
Il ne doit pas créer/modifier les packs, éditer les règles publiées, gérer l’authentification, calculer la facturation, accéder directement aux tables ERP ou aux bases internes des autres packs, ni remplacer Data Runtime ou Workflow/Automation Engine.

## 4. Frontière Design Time / Runtime
```text
DESIGN TIME
Business Manager → Pack Manager → Validation → Publication → Pack Manifest immutable

RUNTIME
Pack Manifest → Pack Runtime → Context Resolution → Resolution → Effective Manifest → Application
```

## 5. Relations inter-packs
### Business Manager
Fournit par contrat l’application, sa version, ses besoins/capabilities attendues et son contexte global.

### Pack Manager
Produit Pack, PackVersion, Modules, Features, Capabilities, Dependencies, Rules et Pack Manifest.

### Auth + IAM + Context
Fournit identité, tenant, organisation/site, permissions et contexte de sécurité via IAM Context Contract.

### Tenant / Subscription / Billing
Fournit plan, abonnement, entitlements et quotas. Le Runtime ne lit jamais directement les tables Billing.

### ERP Adapter / Data Runtime
Fournissent les capabilities de données/actions par contrat. Le Runtime vérifie leur disponibilité mais ne réimplémente pas leur exécution.

### Rules / Workflow / Automation
Le Runtime évalue les règles de composition publiées par PM. Les workflows métier restent dans le moteur Automation.

### Observability & Security
Reçoit logs, metrics, traces, diagnostics et événements de sécurité.

## 6. Architecture
```text
                   PACK MANAGER
                        │
                 Pack Manifest v1
                        ▼
               ┌─────────────────┐
               │  PACK RUNTIME   │
               └────────┬────────┘
                        │
        ┌───────────────┼────────────────┐
        ▼               ▼                ▼
    IAM Context     Entitlements     App Context
        └───────────────┼────────────────┘
                        ▼
                 Context Resolver
                        ↓
                 Manifest Resolver
                        ↓
              Module/Feature Resolver
                        ↓
          Capability/Dependency Resolver
                        ↓
                  Rule Evaluator
                        ↓
             Effective Configuration
                        ↓
          EFFECTIVE RUNTIME MANIFEST
                        ↓
                APPLICATION / UI
```

## 7. Découpage
- PR-CDC-00 — Socle, Architecture & Runtime Contracts
- PR-CDC-01 — Vue d’ensemble / Runtime Cockpit
- PR-CDC-02 — Manifest Loader & Runtime Resolver
- PR-CDC-03 — Module & Feature Resolver
- PR-CDC-04 — Capability & Dependency Resolver
- PR-CDC-05 — Rules & Context Resolver
- PR-CDC-06 — Runtime Configuration & Effective Manifest
- PR-CDC-07 — Runtime Cache, Diagnostics & Resilience

## 8. Pack Manifest entrant
Le manifest doit être versionné, validé, immutable, hashé, reproductible et associé à une version de contrat.

```json
{
  "contract": "techzone.pack-manifest",
  "contractVersion": "1.0",
  "pack": {"code": "stock", "version": "1.2.0"},
  "modules": [],
  "features": [],
  "capabilities": {},
  "dependencies": [],
  "rules": [],
  "manifestHash": "sha256:..."
}
```

Avant résolution :
```text
Load → Contract compatible ? → Hash valide ? → Structure valide ?
→ Références cohérentes ? → ACCEPT / REJECT
```

## 9. Effective Runtime Manifest
Il représente ce qui est réellement actif pour un contexte donné.

```json
{
  "contract": "techzone.effective-runtime-manifest",
  "contractVersion": "1.0",
  "sourceManifest": {
    "packCode": "stock",
    "packVersion": "1.2.0",
    "manifestHash": "sha256:..."
  },
  "context": {
    "tenantId": "tenant_001",
    "applicationId": "app_stock",
    "environment": "PROD"
  },
  "modules": [{"code": "inventory", "active": true}],
  "features": [{"code": "stock.analytics", "active": true, "reason": "RULE_MATCHED"}],
  "capabilities": {"available": ["stock.product.read", "stock.inventory.execute"]},
  "resolution": {"status": "RESOLVED"},
  "effectiveManifestHash": "sha256:..."
}
```

**Pack Manifest = définition publiée.**  
**Effective Runtime Manifest = résultat contextualisé de cette définition.**

## 10. Runtime Context
Contexte possible :
```text
tenantId
applicationId
applicationVersion
userId
organizationId
siteId
environment
subscriptionPlan
entitlements[]
permissions[]
capabilities[]
featureFlags
locale
timezone
```
Aucun password, token, secret ou credential ne doit être copié dans le manifest.

## 11. Déterminisme
```text
Manifest identique
+ Context identique
+ Providers/Contracts identiques
= Effective Runtime Manifest identique
```

## 12. Ordre canonique de résolution
```text
1 Load Manifest
2 Validate Manifest
3 Resolve Application Context
4 Resolve IAM/Tenant Context
5 Resolve Subscription/Entitlements
6 Resolve external Capabilities
7 Resolve Dependencies
8 Evaluate Rules
9 Resolve Modules
10 Resolve Features
11 Build Effective Configuration
12 Validate final composition
13 Hash Effective Manifest
14 Cache / expose
```

## 13. États
```text
NOT_RESOLVED
RESOLVING
RESOLVED
PARTIALLY_RESOLVED
BLOCKED
DEGRADED
ERROR
```
Une dépendance obligatoire absente, un entitlement requis absent ou un contrat non supporté doit produire `BLOCKED`, jamais une exécution silencieuse.

## 14. Contrats obligatoires
```text
Pack Manifest Contract
Effective Runtime Manifest Contract
Application Context Contract
IAM Context Contract
Entitlement Contract
Capability Availability Contract
Dependency Resolution Contract
Rule Context Contract
Error Contract
Observability Contract
```

Chaque contrat possède nom, version, schéma, exemples, erreurs, compatibilité, changelog et Contract Tests.

## 15. Règle d’intégration
```text
CONTRAT v1 LOCKÉ 🔒
        +
MOCK CONFORME
        =
DÉVELOPPEMENT EN PARALLÈLE
```
Aucun accès direct aux tables internes des autres packs.

## 16. Provider Pattern
```text
IamContextProvider
├── MockIamContextProvider
└── RealIamContextProvider

EntitlementProvider
├── MockEntitlementProvider
└── RealEntitlementProvider

CapabilityProvider
├── MockCapabilityProvider
└── RealCapabilityProvider
```
Même principe pour Application Context, Dependency et Observability.

## 17. Architecture NestJS
```text
src/pack-runtime/
├── core/
│   ├── domain/
│   ├── contracts/
│   ├── errors/
│   └── types/
├── manifest/
├── context/
├── modules/
├── features/
├── capabilities/
├── dependencies/
├── rules/
├── effective-manifest/
├── cache/
├── diagnostics/
├── providers/
├── audit/
└── tests/
```
Le domaine doit être testable sans PostgreSQL, Redis, HTTP, ERP ou IAM réel.

## 18. Frontend React
React sert principalement au cockpit, diagnostic et simulation administrative. La logique autoritaire de résolution reste dans NestJS.

## 19. Persistance conceptuelle
Modèles possibles :
```text
RuntimeResolution
RuntimeResolutionIssue
RuntimeContextSnapshot
EffectiveManifestSnapshot
RuntimeDiagnosticEvent
RuntimeCacheEntry
```
Ne pas dupliquer inutilement les données des autres domaines.

## 20. RuntimeResolution
```text
id
tenantId
applicationId
packCode
packVersion
sourceManifestHash
effectiveManifestHash
status
startedAt
completedAt
durationMs
traceId
createdAt
```

## 21. Multi-tenant
```text
tenant requête
= tenant contexte IAM
= tenant autorisé pour application
```
Toute incohérence bloque la résolution.

## 22. Sécurité
- authentification et autorisation ;
- tenant isolation ;
- validation stricte ;
- allowlists contractuelles ;
- limitation des payloads ;
- aucun code arbitraire ;
- aucun SQL libre ;
- aucun secret dans manifest/logs ;
- providers contrôlés.

Permissions proposées :
```text
runtime.read
runtime.resolve
runtime.diagnose
runtime.view_context
runtime.view_rules
runtime.invalidate_cache
runtime.retry
```

## 23. Error Contract
```json
{
  "error": {
    "code": "RUNTIME_DEPENDENCY_MISSING",
    "message": "A required dependency is unavailable.",
    "traceId": "trace_...",
    "details": {}
  }
}
```

Codes socle :
```text
RUNTIME_MANIFEST_NOT_FOUND
RUNTIME_MANIFEST_INVALID
RUNTIME_MANIFEST_HASH_INVALID
RUNTIME_CONTRACT_UNSUPPORTED
RUNTIME_CONTEXT_INVALID
RUNTIME_TENANT_MISMATCH
RUNTIME_ENTITLEMENT_MISSING
RUNTIME_CAPABILITY_MISSING
RUNTIME_DEPENDENCY_MISSING
RUNTIME_DEPENDENCY_CONFLICT
RUNTIME_RULE_EVALUATION_FAILED
RUNTIME_RESOLUTION_BLOCKED
RUNTIME_PROVIDER_UNAVAILABLE
RUNTIME_TIMEOUT
RUNTIME_INTERNAL_ERROR
```

## 24. Résilience
Chaque provider externe prévoit selon besoin :
```text
timeout
retry
circuit breaker
fallback contractuel
```
Pas de retry automatique sur permission denied, contrat invalide, entitlement absent ou dépendance métier absente.

## 25. Cache
Peut couvrir manifest, contexte non sensible, capabilities, dépendances, règles compilées et Effective Manifest.

Clé conceptuelle :
```text
tenantId
applicationId
packCode
packVersion
manifestHash
contextRevision
entitlementRevision
capabilityRevision
```
Le cache n’est jamais la source de vérité.

## 26. Observability
Chaque résolution possède au minimum un `traceId`, idéalement un `resolutionId` et `correlationId`.

Étapes tracées :
```text
manifest.load
manifest.validate
context.resolve
entitlement.resolve
capability.resolve
dependency.resolve
rules.evaluate
effective_manifest.build
effective_manifest.validate
```

Metrics :
```text
runtime_resolution_total
runtime_resolution_duration_ms
runtime_resolution_blocked_total
runtime_resolution_error_total
runtime_cache_hit_total
runtime_cache_miss_total
runtime_provider_error_total
```

## 27. IA
L’IA peut expliquer une résolution, résumer un diagnostic ou suggérer une correction.

Elle ne décide jamais :
```text
ALLOW / DENY
ENABLE / DISABLE
permission granted
entitlement valid
dependency resolved
```
**IA = assistance ; moteur déterministe = décision.**

## 28. API socle
```http
POST /api/runtime/resolve
GET  /api/runtime/resolutions/:id
GET  /api/runtime/resolutions/:id/diagnostics
GET  /api/runtime/effective-manifests/:id
POST /api/runtime/cache/invalidate
```

## 29. Tests
Contract Tests :
```text
PackManifestContractTest
EffectiveRuntimeManifestContractTest
IamContextContractTest
ApplicationContextContractTest
EntitlementContractTest
CapabilityContractTest
ErrorContractTest
```

Prévoir également tests unitaires, intégration et E2E.

Scénario positif :
```text
Manifest → Tenant PRO → IAM OK → Capabilities OK
→ Dependencies OK → Rules → Effective Manifest → RESOLVED
```

Scénario négatif :
```text
Required Capability missing
→ BLOCKED
→ diagnostic explicite
→ aucune exécution silencieuse
```

## 30. Livrables
```text
Pack Runtime Architecture
Runtime Contract Registry
Pack Manifest Consumer Contract
Effective Runtime Manifest Contract v1
Runtime Context Contract
Error Contract
Provider Interfaces
Mock Providers
Contract Test Harness
NestJS Runtime Skeleton
Prisma Runtime Foundation
Observability conventions
Security conventions
Architecture documentation
```

## 31. Critères d’acceptation
PR-CDC-00 est accepté si :
- frontière Pack Manager / Runtime claire ;
- Pack Manifest consommable et immutable ;
- Effective Runtime Manifest Contract v1 défini ;
- providers externes abstraits ;
- aucun accès direct aux DB externes ;
- IAM, tenant, entitlement et capabilities intégrés par contrats ;
- résolution déterministe ;
- erreurs normalisées ;
- mocks disponibles ;
- Contract Tests disponibles ;
- sécurité, cache, résilience et observability définis.

## 32. Definition of Done
```text
PR-CDC-00 DONE
├── Runtime Architecture
├── Design Time / Runtime Boundary
├── Pack Manifest Input Contract
├── Effective Runtime Manifest Contract v1
├── Runtime Context Contract
├── IAM / Entitlement / Capability Contracts
├── Error Contract
├── Provider Pattern
├── Mock Providers
├── Contract Registry
├── Resolution States
├── Multi-tenant Guard
├── Security
├── Cache & Resilience Principles
├── Observability
├── Prisma Foundation
├── NestJS Skeleton
├── Contract Tests
├── Unit / Integration Test Foundation
└── Documentation
```

## 33. Règle d’or
```text
PACK MANAGER
décrit et publie
      ↓
PACK MANIFEST 🔒
      ↓
PACK RUNTIME
résout sans modifier
      ↓
EFFECTIVE RUNTIME MANIFEST 🔒
      ↓
APPLICATION
consomme
```

> **Le Pack Runtime n’invente pas la composition et ne modifie pas la définition publiée : il transforme de manière déterministe un Pack Manifest immuable en une configuration effective, contextualisée, sécurisée, traçable et consommable par l’application.**
