# PR-CDC-05 — Rules & Context Resolver

**Projet :** Techzone Cloud  
**Pack :** Pack Runtime  
**Référence :** PR-CDC-05  
**Version :** 1.0  
**Statut :** Cahier des charges fonctionnel et technique  
**Dépendances :** PR-CDC-00, PR-CDC-02, PR-CDC-03, PR-CDC-04  
**Contrats amont :** Pack Manifest Contract · IAM Context Contract · Application Context Contract · Entitlement Contract · Capability/Dependency Resolution Contract  
**Contrats aval :** Module & Feature Resolution Contract · Effective Runtime Manifest Contract  
**Stack :** React · NestJS · Prisma · PostgreSQL

---

## 1. Objet

PR-CDC-05 définit le **Rules & Context Resolver**, responsable de construire un contexte Runtime fiable puis d’évaluer de manière déterministe les règles et conditions publiées dans le Pack Manifest.

Il répond à la question :

> **Dans ce contexte précis, quelles règles s’appliquent et quels effets doivent influencer la composition Runtime ?**

---

## 2. Position

```text
IAM / TENANT / APPLICATION / BILLING / ENVIRONMENT
                         ↓
                  RUNTIME CONTEXT
                         ↓
PACK MANIFEST ──→ PR-CDC-05 RULES & CONTEXT RESOLVER
                         ↓
                 RULE DECISIONS
                         ↓
              PR-CDC-03 / PR-CDC-06
```

---

## 3. Responsabilités

Le composant doit :

- agréger les contextes autorisés ;
- valider leur cohérence ;
- construire un contexte canonique ;
- charger les règles publiées ;
- valider la version du Rule Contract ;
- évaluer les conditions ;
- appliquer une politique de priorité ;
- détecter les conflits ;
- produire des décisions structurées ;
- expliquer chaque décision ;
- fournir les décisions aux autres resolvers ;
- tracer l’évaluation ;
- rester déterministe.

---

## 4. Hors périmètre

Il ne doit pas :

- créer ou modifier les règles ;
- devenir le Rules/Workflow/Automation Engine général ;
- exécuter des workflows métier ;
- exécuter du JavaScript arbitraire ;
- exécuter du SQL ;
- inventer des données de contexte ;
- contourner IAM, Billing ou les dépendances ;
- utiliser l’IA comme autorité de décision.

---

## 5. Distinction avec Team 2 Automation

```text
PACK RUNTIME RULES
→ composition
→ activation
→ visibilité
→ disponibilité
→ compatibilité
→ configuration

WORKFLOW / AUTOMATION
→ processus métier
→ triggers
→ actions
→ orchestration
→ historique métier
```

PR-CDC-05 reste limité aux **règles Runtime de composition**.

---

## 6. Sources de contexte

Le Runtime Context peut agréger :

```text
IAM Context
Tenant Context
Organization / Site Context
Application Context
Environment Context
Subscription / Entitlements
Permissions
Capabilities
Dependency State
Feature Flags
Locale / Timezone
```

Chaque donnée doit avoir une source contractuelle.

---

## 7. Contexte canonique

Exemple :

```json
{
  "tenant": {
    "id": "tenant_001"
  },
  "user": {
    "id": "user_001",
    "permissions": ["stock.read"]
  },
  "application": {
    "id": "app_stock",
    "version": "2.0"
  },
  "environment": {
    "code": "PROD"
  },
  "subscription": {
    "plan": "PRO",
    "status": "ACTIVE"
  },
  "entitlements": [
    "analytics.pro"
  ],
  "capabilities": [
    "stock.product.read"
  ]
}
```

---

## 8. Context Field Registry

Les règles ne doivent accéder qu’à des champs autorisés.

Exemple :

```text
tenant.id
application.id
application.version
environment.code
subscription.plan
subscription.status
entitlements
permissions
capabilities
featureFlags.*
locale
timezone
```

Toute référence hors registre est rejetée.

---

## 9. Interdictions de contexte

Ne jamais exposer au moteur :

```text
password
accessToken
refreshToken
API secret
private key
database credentials
raw session cookie
```

---

## 10. Validation de cohérence

Avant l’évaluation :

```text
tenant IAM = tenant request ?
application accessible ?
environment compatible ?
subscription belongs to tenant ?
context contract supported ?
```

Une incohérence critique bloque la résolution.

---

## 11. Context Revision

Le contexte doit disposer d’une révision ou empreinte :

```text
contextRevision
```

Elle sert au cache, diagnostic et déterminisme.

---

## 12. Context Snapshot

Le Runtime peut conserver un snapshot minimal des valeurs ayant réellement influencé les décisions.

Le snapshot doit être :

- minimal ;
- sans secret ;
- traçable ;
- lié au `resolutionId`.

---

## 13. Types de règles

Types issus du Pack Manager :

```text
ACTIVATION
ELIGIBILITY
VISIBILITY
AVAILABILITY
CONFIGURATION
COMPATIBILITY
```

---

## 14. Cibles

```text
PACK
MODULE
FEATURE
CAPABILITY
CONFIGURATION
```

---

## 15. Effets

```text
ALLOW
DENY
ENABLE
DISABLE
SHOW
HIDE
REQUIRE
SET_VALUE
```

---

## 16. Structure d’une règle

Exemple :

```json
{
  "code": "stock.analytics.plan_access",
  "type": "ACTIVATION",
  "targetType": "FEATURE",
  "targetRef": "stock.analytics",
  "priority": 100,
  "condition": {
    "field": "subscription.plan",
    "operator": "IN",
    "value": ["PRO", "PREMIUM"]
  },
  "effect": "ENABLE"
}
```

---

## 17. Conditions

Structure logique :

```text
GROUP
PREDICATE
NOT
```

Groupes :

```text
AND
OR
```

---

## 18. Opérateurs

Selon type :

```text
EQ
NEQ
IN
NOT_IN
GT
GTE
LT
LTE
CONTAINS
NOT_CONTAINS
EXISTS
NOT_EXISTS
STARTS_WITH
ENDS_WITH
```

Les opérateurs disponibles doivent être allowlistés.

---

## 19. Typage

Chaque champ du Context Field Registry doit définir son type :

```text
STRING
NUMBER
BOOLEAN
DATE
DATETIME
ENUM
ARRAY_STRING
ARRAY_ENUM
```

Le moteur refuse les comparaisons incohérentes.

---

## 20. Compilation

Les règles validées peuvent être compilées en représentation intermédiaire sûre :

```text
Published Rule
   ↓
Validation
   ↓
Safe AST / IR
   ↓
Evaluation
```

Aucun `eval()` ou code arbitraire.

---

## 21. Ordre d’évaluation

Ordre stable :

```text
priority DESC
then ruleCode ASC
```

Une autre politique est possible mais doit être versionnée et déterministe.

---

## 22. Rule Evaluation Result

```json
{
  "ruleCode": "stock.analytics.plan_access",
  "targetType": "FEATURE",
  "targetRef": "stock.analytics",
  "matched": true,
  "effect": "ENABLE",
  "priority": 100,
  "reasonCode": "CONDITION_MATCHED"
}
```

---

## 23. Non-match

```json
{
  "ruleCode": "stock.analytics.plan_access",
  "matched": false,
  "reasonCode": "CONDITION_NOT_MATCHED"
}
```

---

## 24. Decision Aggregation

Plusieurs règles peuvent viser la même cible.

```text
Rule A → ENABLE
Rule B → DISABLE
Rule C → HIDE
```

Le Runtime doit agréger ces résultats selon une politique explicite.

---

## 25. Politique de priorité

Principe recommandé :

```text
SECURITY BLOCK
    >
MANDATORY DEPENDENCY/CAPABILITY BLOCK
    >
DENY
    >
DISABLE
    >
HIDE
    >
REQUIRE
    >
ENABLE
    >
SHOW
    >
DEFAULT
```

La priorité numérique départage les règles de même niveau lorsque permis.

---

## 26. Security Wins

Une règle `ENABLE` ne peut jamais annuler :

```text
IAM DENY
tenant mismatch
mandatory dependency missing
required capability missing
security block
```

---

## 27. Conflit de règles

Un conflit existe lorsque deux décisions incompatibles restent valides après application de la politique.

Exemple :

```text
same priority
same target
ENABLE
DISABLE
```

Selon le type :

```text
deterministic winner
```

ou :

```text
BLOCKED / RULE_CONFLICT
```

La politique doit être documentée.

---

## 28. Configuration Rule

Exemple :

```text
IF subscription.plan = PREMIUM
THEN SET_VALUE
target = configuration.maxWarehouses
value = 50
```

Le champ de configuration doit être autorisé et typé.

---

## 29. SET_VALUE

`SET_VALUE` ne peut écrire que dans une configuration Runtime déclarative autorisée.

Interdit :

```text
SQL
filesystem
environment secret
external API side effect
```

---

## 30. REQUIRE

Exemple :

```text
IF feature stock.analytics active
THEN REQUIRE capability analytics.read
```

Cette décision doit être renvoyée à l’orchestration afin que PR-CDC-04 vérifie la capability.

---

## 31. Résolution itérative contrôlée

Certaines règles peuvent introduire de nouvelles exigences.

Flux :

```text
Initial Dependencies
       ↓
Rules Evaluation
       ↓
New REQUIRE?
       ↓ yes
Dependency Resolution
       ↓
Re-evaluate impacted rules
```

Le nombre d’itérations doit être limité.

---

## 32. Convergence

Le resolver doit garantir la convergence.

Configurer :

```text
maxResolutionIterations
```

Si dépassé :

```text
RUNTIME_RULE_RESOLUTION_NOT_CONVERGED
```

---

## 33. Boucles

Exemple problématique :

```text
Rule A enables Feature B
Feature B requires Capability C
Capability C causes Rule A to disable Feature B
```

Le moteur doit détecter l’instabilité.

---

## 34. Decision Trace

Chaque décision doit pouvoir être reconstruite.

```text
Target: stock.analytics
1. defaultEnabled = false
2. plan = PRO
3. rule plan_access matched
4. effect ENABLE
5. dependency state RESOLVED
6. security block none
Final = ACTIVE candidate
```

---

## 35. Explain Contract

Réponse structurée :

```json
{
  "targetRef": "stock.analytics",
  "decision": "ENABLE",
  "rules": [
    {
      "ruleCode": "stock.analytics.plan_access",
      "matched": true,
      "effect": "ENABLE"
    }
  ],
  "contextUsed": {
    "subscription.plan": "PRO"
  }
}
```

---

## 36. Context minimization

L’endpoint Explain ne doit retourner que les champs nécessaires à l’explication.

---

## 37. Rule Context Contract

Le contrat doit définir :

```text
schemaVersion
field registry version
contextRevision
values
source revisions
```

---

## 38. Rule Decision Contract

Le résultat vers PR-CDC-03/06 doit contenir :

```text
ruleCode
targetType
targetRef
matched
effect
priority
reasonCode
configurationChange?
requirements?
```

---

## 39. API interne

Interface conceptuelle :

```text
resolveRulesAndContext(
  manifest,
  baseRuntimeContext,
  capabilityState,
  dependencyState
)
```

---

## 40. API — Rule Decisions

```http
GET /api/runtime/resolutions/:id/rules
```

---

## 41. API — Context

```http
GET /api/runtime/resolutions/:id/context
```

La réponse doit être filtrée selon permissions.

---

## 42. API — Explain Rule

```http
GET /api/runtime/resolutions/:id/rules/:ruleCode/explain
```

---

## 43. API — Explain Target

```http
GET /api/runtime/resolutions/:id/targets/:targetRef/rule-decisions
```

---

## 44. Simulation

```http
POST /api/runtime/simulate/rules
```

Exemple :

```json
{
  "packCode": "stock",
  "packVersion": "1.2.0",
  "contextOverrides": {
    "subscription.plan": "BASIC"
  }
}
```

---

## 45. Simulation Guard

Les overrides ne sont autorisés qu’en :

```text
PREVIEW / TEST
```

ou pour une simulation administrative explicitement autorisée.

Ils ne modifient jamais le contexte réel.

---

## 46. Permissions IAM

```text
runtime.rule.read
runtime.rule.explain
runtime.context.read
runtime.context.sensitive_read
runtime.rule.simulate
```

`sensitive_read` reste limité même si aucun secret n’est exposé.

---

## 47. Multi-tenant

Le contexte tenant doit provenir d’une source de confiance.

Une simulation cross-tenant nécessite une permission plateforme spécifique et doit être auditée.

---

## 48. Error Codes

```text
RUNTIME_RULE_INVALID
RUNTIME_RULE_CONTRACT_UNSUPPORTED
RUNTIME_RULE_FIELD_NOT_ALLOWED
RUNTIME_RULE_OPERATOR_NOT_ALLOWED
RUNTIME_RULE_TYPE_MISMATCH
RUNTIME_RULE_TARGET_INVALID
RUNTIME_RULE_CONFLICT
RUNTIME_RULE_EVALUATION_FAILED
RUNTIME_RULE_RESOLUTION_NOT_CONVERGED
RUNTIME_CONTEXT_INVALID
RUNTIME_CONTEXT_FIELD_MISSING
RUNTIME_CONTEXT_SOURCE_UNAVAILABLE
RUNTIME_CONTEXT_TENANT_MISMATCH
RUNTIME_CONTEXT_OVERRIDE_FORBIDDEN
```

---

## 49. Cache

Peuvent être mis en cache :

```text
compiled rule AST
context-independent validation
field registry
rule decision result
```

Le résultat dépendant du contexte doit inclure `contextRevision`.

---

## 50. Cache Key

```text
manifestHash
ruleSetHash
contextRevision
capabilityRevision
dependencyRevision
policyVersion
```

---

## 51. Invalidation

Invalider si :

```text
manifest changes
rule set changes
context revision changes
entitlement changes
capability/dependency state changes
field registry changes
policy version changes
```

---

## 52. Performance

Optimisations :

- compiler une seule fois les règles ;
- indexer les règles par cible ;
- n’évaluer que les règles impactées ;
- batch context loading ;
- paralléliser les sources indépendantes ;
- limiter les re-évaluations.

---

## 53. Limits

Configurer :

```text
maxRulesPerManifest
maxConditionDepth
maxPredicatesPerRule
maxResolutionIterations
maxContextSize
maxExplainTraceSize
```

---

## 54. Timeout

```text
contextLoadTimeout
ruleEvaluationTimeout
globalRuleResolverTimeout
```

---

## 55. Observability

Spans :

```text
runtime.context.resolve
runtime.context.validate
runtime.rules.compile
runtime.rules.evaluate
runtime.rule.evaluate
runtime.rules.aggregate
runtime.rules.converge
```

---

## 56. Metrics

```text
runtime_rule_evaluated_total
runtime_rule_matched_total
runtime_rule_conflict_total
runtime_rule_error_total
runtime_rule_evaluation_duration_ms
runtime_context_resolution_duration_ms
runtime_rule_iteration_total
```

---

## 57. Logs

```json
{
  "event": "runtime.rule.evaluated",
  "resolutionId": "res_001",
  "ruleCode": "stock.analytics.plan_access",
  "matched": true,
  "effect": "ENABLE",
  "traceId": "trace_001"
}
```

Ne pas logger tout le contexte.

---

## 58. Audit

Auditer :

```text
runtime.rule.simulated
runtime.context.override.simulated
runtime.rule.explanation.exported
runtime.cross_tenant_simulation.requested
```

---

## 59. Frontend React

Structure indicative :

```text
src/features/pack-runtime/rules-context/
├── context/
├── rules/
├── explain/
├── simulation/
├── traces/
├── components/
├── hooks/
├── services/
└── tests/
```

---

## 60. Composants

```text
RuntimeContextSummary
RuntimeRuleList
RuleMatchBadge
RuleEffectBadge
RuleDecisionPanel
RuleDecisionTrace
RuleConflictPanel
RuleSimulationForm
ContextFieldViewer
```

---

## 61. Maquette

```text
RULES — STOCK 1.2.0

✓ stock.analytics.plan_access
  MATCHED → ENABLE
  subscription.plan = PRO

✕ stock.export.basic
  NOT MATCHED

⚠ stock.warehouse.limit
  MATCHED → SET_VALUE
  maxWarehouses = 10

CONTEXT
Tenant        tenant_001
Environment   PROD
Plan          PRO
Entitlements  analytics.pro
```

---

## 62. UX Explain

```text
Feature: stock.analytics
Decision: ENABLE

Rule:
stock.analytics.plan_access

Condition:
subscription.plan IN [PRO, PREMIUM]

Actual:
PRO

Result:
MATCHED

Effect:
ENABLE
```

---

## 63. UX Conflict

```text
RULE CONFLICT

Target:
stock.analytics

Rule A → ENABLE
Rule B → DISABLE

Priority:
same

Policy:
DENY/DISABLE wins

Final:
DISABLE
```

---

## 64. Backend NestJS

Structure indicative :

```text
src/pack-runtime/rules-context-resolver/
├── context-resolver.service.ts
├── context-validator.service.ts
├── context-field-registry.service.ts
├── rule-compiler.service.ts
├── rule-evaluator.service.ts
├── rule-aggregation.service.ts
├── rule-conflict.service.ts
├── convergence.service.ts
├── explain.service.ts
├── providers/
├── dto/
└── tests/
```

---

## 65. Prisma conceptuel

```text
RuntimeRuleDecision
├── id
├── resolutionId
├── ruleCode
├── targetType
├── targetRef
├── matched
├── effect
├── priority
├── reasonCode
├── details
└── createdAt
```

```text
RuntimeContextSnapshot
├── id
├── resolutionId
├── contextRevision
├── schemaVersion
├── safePayload
├── hash
└── createdAt
```

---

## 66. Indexes

```text
RuntimeRuleDecision(resolutionId, targetRef)
RuntimeRuleDecision(resolutionId, ruleCode)
RuntimeRuleDecision(matched, effect)
RuntimeContextSnapshot(resolutionId)
RuntimeContextSnapshot(contextRevision)
```

---

## 67. Persistence Policy

Ne persister que les informations nécessaires au diagnostic, à la reproductibilité et à l’audit.

Le contexte complet ne doit pas être copié sans nécessité.

---

## 68. Mock Providers

```text
MockIamContextProvider
MockApplicationContextProvider
MockEntitlementProvider
MockCapabilityStateProvider
MockDependencyStateProvider
MockFeatureFlagProvider
```

---

## 69. Contract Tests

```text
RuntimeContextContract
ContextFieldRegistryContract
RuleDefinitionContract
RuleDecisionContract
RuleExplainContract
ContextProviderContract
```

---

## 70. Unit Tests

Tester :

- AND / OR / NOT ;
- chaque opérateur ;
- types ;
- field allowlist ;
- matched/non-matched ;
- priorities ;
- DENY vs ENABLE ;
- SET_VALUE ;
- REQUIRE ;
- conflicts ;
- convergence ;
- max iterations ;
- missing context ;
- tenant mismatch ;
- deterministic ordering.

---

## 71. Integration Tests

Tester :

- providers ;
- orchestration PR-CDC-02 ;
- interaction PR-CDC-03/04 ;
- cache ;
- persistence ;
- tenant isolation ;
- permissions ;
- observability.

---

## 72. E2E — Plan PRO

```text
Plan = PRO
Rule requires PRO/PREMIUM
→ MATCHED
→ ENABLE stock.analytics
→ PR-CDC-03 receives ENABLE
→ Feature candidate ACTIVE
```

---

## 73. E2E — Plan BASIC

```text
Plan = BASIC
same rule
→ NOT MATCHED
→ no ENABLE
→ Feature remains INACTIVE
```

---

## 74. E2E — Security Priority

```text
Rule → ENABLE stock.admin
IAM → permission missing
→ Security wins
→ Feature not authorized
```

---

## 75. E2E — REQUIRE

```text
Rule matched
→ REQUIRE analytics.read
→ PR-CDC-04 checks capability
→ unavailable
→ target BLOCKED
```

---

## 76. Critères d’acceptation

PR-CDC-05 est conforme si :

- contexte canonique construit par contrats ;
- tenant coherence vérifiée ;
- Context Field Registry appliqué ;
- aucun secret exposé ;
- règles compilées sans code arbitraire ;
- conditions typées ;
- ordre déterministe ;
- conflits gérés ;
- Security Wins respecté ;
- REQUIRE réinjecté dans la résolution ;
- convergence garantie ;
- reasonCode et Explain disponibles ;
- cache/invalidation intégrés ;
- mocks et Contract Tests disponibles ;
- tests unitaires/intégration/E2E passants.

---

## 77. Definition of Done

```text
PR-CDC-05 DONE
├── Runtime Context Resolver
├── Context Validation
├── Context Field Registry
├── Context Revision
├── Safe Context Snapshot
├── Rule Types
├── Rule Targets
├── Rule Effects
├── Typed Conditions
├── Safe AST / IR
├── Rule Compiler
├── Rule Evaluator
├── Priority Policy
├── Security Wins
├── Conflict Resolution
├── SET_VALUE
├── REQUIRE
├── Iterative Resolution
├── Convergence Guard
├── Decision Trace
├── Explain
├── Simulation
├── Cache
├── Security Limits
├── IAM / Multi-tenant
├── Observability
├── Mock Providers
├── Contract Tests
├── Unit Tests
├── Integration Tests
└── E2E Web
```

---

## 78. Résultat attendu

```text
IAM + TENANT + APPLICATION + BILLING
              +
CAPABILITIES + DEPENDENCIES
              ↓
       RUNTIME CONTEXT
              ↓
        PACK RULES
              ↓
    RULES & CONTEXT RESOLVER
              ↓
┌─────────────┼─────────────┐
↓             ↓             ↓
ENABLE      DISABLE       REQUIRE
SHOW/HIDE   DENY          SET_VALUE
              ↓
       RULE DECISIONS
              ↓
 MODULE / FEATURE RESOLUTION
              ↓
 EFFECTIVE RUNTIME MANIFEST
```

> **PR-CDC-05 transforme les règles déclaratives publiées et les contextes provenant des contrats de la plateforme en décisions Runtime déterministes, explicables et sûres, sans exécuter de code arbitraire et sans contourner IAM, les dépendances ou les contraintes d’abonnement.**
