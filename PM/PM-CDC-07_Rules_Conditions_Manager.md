# PM-CDC-07 — Rules & Conditions Manager

**Projet :** Techzone Cloud  
**Module :** Pack Manager  
**Équipe :** Team 3 — Business Manager, Pack & UI Runtime  
**Référence :** PM-CDC-07  
**Version :** 1.0  
**Statut :** Cahier des charges fonctionnel et technique  
**Dépendances obligatoires :** PM-CDC-00, PM-CDC-03, PM-CDC-04, PM-CDC-05, PM-CDC-06  
**Stack cible :** React · NestJS · Prisma · PostgreSQL

---

## 1. Objet

PM-CDC-07 définit le **Rules & Conditions Manager**, responsable de la déclaration, validation, simulation et publication des règles conditionnelles qui pilotent l’activation ou l’éligibilité d’un pack, d’un module, d’une feature ou d’une capability.

Il répond à la question :

> **Dans quelles conditions un pack, module, feature ou comportement doit-il être disponible ou activé ?**

PM-CDC-07 ne doit pas devenir un moteur d’automatisation général. Il gère les règles déclaratives du Pack Manager destinées à être consommées par le Pack Runtime ou les couches autorisées.

---

## 2. Position dans le Pack Manager

```text
PACK VERSION
     ↓
MODULES
     ↓
FEATURES / CAPABILITIES
     ↓
DEPENDENCIES
     ↓
RULES & CONDITIONS        ← PM-CDC-07
     ↓
VALIDATION
     ↓
PACK MANIFEST
     ↓
PACK RUNTIME
```

---

## 3. Responsabilités

PM-CDC-07 doit permettre de :

- créer une règle ;
- modifier une règle ;
- activer/désactiver une règle ;
- associer une règle à une cible ;
- construire des conditions ;
- combiner des conditions avec AND/OR/NOT ;
- définir la priorité ;
- simuler une règle ;
- tester une règle avec des contextes fictifs ;
- valider la syntaxe et la sémantique ;
- détecter les règles contradictoires ;
- détecter les références invalides ;
- gérer le lifecycle ;
- produire une représentation déterministe ;
- contribuer au Pack Manifest ;
- exposer des contrats stables au Pack Runtime.

---

## 4. Ce que PM-CDC-07 ne doit pas faire

PM-CDC-07 ne doit pas :

- exécuter des workflows métier complets ;
- déclencher des emails, webhooks ou traitements externes ;
- remplacer le Rules / Workflow / Automation Engine ;
- accéder directement aux tables ERP ;
- recalculer les permissions IAM ;
- autoriser du JavaScript arbitraire ;
- accepter du SQL libre ;
- exécuter du code utilisateur.

La frontière est essentielle :

```text
Pack Manager Rules
= règles déclaratives de composition / éligibilité / activation

Automation Engine
= règles d’exécution et workflows métier
```

---

## 5. Exemples de règles

### Pack par plan

```text
IF subscription.plan IN ["PRO", "PREMIUM"]
THEN enable feature "stock.analytics"
```

### Feature selon capability

```text
IF capability("stock.product.read") == AVAILABLE
THEN enable feature "stock.low_stock_alert"
```

### Module selon pays

```text
IF tenant.country == "MG"
THEN enable module "local_tax"
```

### Feature expérimentale

```text
IF environment == "TEST"
AND context.flags.beta == true
THEN enable feature "stock.ai_forecast"
```

---

## 6. Modèle Rule

Champs recommandés :

```text
id
tenantId
packVersionId
code
name
description
ruleType
targetType
targetId
effect
priority
status
enabled
expressionVersion
metadata
createdAt
createdBy
updatedAt
updatedBy
archivedAt
rowVersion
```

---

## 7. Code Rule

Convention recommandée :

```text
<domain>.<target>.<purpose>
```

Exemples :

```text
stock.analytics.plan_access
stock.alert.capability_required
restaurant.tables.mobile_enabled
```

Règles :

- obligatoire ;
- unique dans la PackVersion ;
- stable ;
- lowercase ;
- format contrôlé.

---

## 8. Rule Type

Types recommandés :

```text
ACTIVATION
ELIGIBILITY
VISIBILITY
AVAILABILITY
CONFIGURATION
COMPATIBILITY
```

### ACTIVATION
Décide si un élément peut être activé.

### ELIGIBILITY
Décide si le contexte est éligible.

### VISIBILITY
Décide si un élément doit être exposé.

### AVAILABILITY
Décide si la fonctionnalité est disponible.

### CONFIGURATION
Sélectionne ou influence une configuration déclarative.

### COMPATIBILITY
Vérifie une contrainte de compatibilité.

---

## 9. Target Type

Une règle peut cibler :

```text
PACK
MODULE
FEATURE
CAPABILITY
CONFIGURATION
```

Le target doit appartenir à la PackVersion ou être référencé par contrat autorisé.

---

## 10. Effect

Effets recommandés :

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

`SET_VALUE` doit rester strictement limité à des valeurs déclaratives validées.

---

## 11. Priorité

Champ :

```text
priority
```

Convention :

```text
100 = très prioritaire
50  = normal
10  = faible
```

L’ordre d’évaluation doit être explicite et déterministe.

---

## 12. Statut Rule

```text
DRAFT
ACTIVE
DISABLED
DEPRECATED
ARCHIVED
```

---

# 13. Modèle Condition

Champs conceptuels :

```text
id
ruleId
parentConditionId
nodeType
fieldRef
operator
value
valueType
order
metadata
```

---

## 14. Node Types

```text
GROUP
PREDICATE
NOT
```

Un `GROUP` contient plusieurs conditions.

---

## 15. Logical Operators

Groupes :

```text
AND
OR
```

`NOT` est un nœud spécifique appliqué à un sous-ensemble.

---

## 16. Operators

Opérateurs recommandés :

```text
EQ
NEQ
GT
GTE
LT
LTE
IN
NOT_IN
CONTAINS
NOT_CONTAINS
STARTS_WITH
ENDS_WITH
EXISTS
NOT_EXISTS
MATCHES
```

Pour dates :

```text
BEFORE
AFTER
BETWEEN
```

Pour versions :

```text
VERSION_EQ
VERSION_GT
VERSION_GTE
VERSION_LT
VERSION_LTE
VERSION_SATISFIES
```

---

## 17. Value Types

```text
STRING
NUMBER
BOOLEAN
DATE
DATETIME
ENUM
ARRAY
VERSION
REFERENCE
NULL
```

---

## 18. Field References

Les règles ne doivent pas accéder librement à n’importe quelle donnée.

Elles utilisent un registre de champs autorisés.

Exemples :

```text
tenant.id
tenant.country
tenant.type

subscription.plan
subscription.status

application.id
application.version

environment.name

context.flags.beta

capability.stock.product.read

pack.code
pack.version
```

---

## 19. Rule Context Contract

Le Runtime doit recevoir un contexte contractuel.

Exemple :

```json
{
  "tenant": {
    "id": "tenant_001",
    "country": "MG"
  },
  "subscription": {
    "plan": "PRO",
    "status": "ACTIVE"
  },
  "environment": {
    "name": "PROD"
  },
  "capabilities": {
    "stock.product.read": "AVAILABLE"
  }
}
```

Le Pack Manager ne doit pas dépendre de l’implémentation interne des producteurs de contexte.

---

## 20. Registry des Fields

Le système doit disposer d’un `Rule Field Registry`.

Chaque entrée décrit :

```text
fieldRef
label
dataType
sourceContract
allowedOperators
nullable
enumValues?
description
status
```

---

## 21. Source Contracts

Exemples :

```text
IAM Context Contract
Subscription / Entitlement Contract
Application Context Contract
Capability Availability Contract
Environment Contract
Pack Context Contract
```

---

## 22. Condition Builder

Le frontend doit proposer un éditeur visuel.

Exemple :

```text
ALL conditions
├── subscription.plan IN [PRO, PREMIUM]
├── tenant.country EQ MG
└── ANY
    ├── environment.name EQ TEST
    └── context.flags.beta EQ true
```

L’utilisateur ne doit pas écrire de code.

---

## 23. JSON Canonique d’une règle

Exemple :

```json
{
  "contract": "pack-rule",
  "version": "1.0",
  "type": "ACTIVATION",
  "target": {
    "type": "FEATURE",
    "ref": "stock.analytics"
  },
  "effect": "ENABLE",
  "priority": 50,
  "when": {
    "all": [
      {
        "field": "subscription.plan",
        "operator": "IN",
        "value": ["PRO", "PREMIUM"]
      },
      {
        "field": "tenant.country",
        "operator": "EQ",
        "value": "MG"
      }
    ]
  }
}
```

La forme canonique utilisée pour le manifest doit être déterministe.

---

# 24. Création Rule

Flux :

```text
Créer Rule
 ↓
Choisir Type
 ↓
Choisir Target
 ↓
Choisir Effect
 ↓
Construire Conditions
 ↓
Définir Priorité
 ↓
Validate
 ↓
Simulate
 ↓
Save
```

---

## 25. Modification

Toute modification structurelle :

```text
validationStatus → OUTDATED
manifestStatus   → OUTDATED
rule cache       → INVALIDATED
```

Une version publiée est immutable.

---

## 26. Activation / Désactivation

L’activation d’une Rule est différente de son effet.

Exemple :

```text
Rule enabled = false
```

signifie que la règle elle-même n’est pas considérée.

---

# 27. Simulation

La simulation est obligatoire.

L’utilisateur doit pouvoir fournir un contexte de test :

```json
{
  "subscription.plan": "PRO",
  "tenant.country": "MG",
  "environment.name": "TEST"
}
```

Résultat :

```text
MATCHED = true
EFFECT = ENABLE
TARGET = stock.analytics
```

---

## 28. Simulation Report

Le rapport doit expliquer l’évaluation.

Exemple :

```text
Rule: stock.analytics.plan_access

✓ subscription.plan IN [PRO, PREMIUM]
  actual = PRO

✓ tenant.country EQ MG
  actual = MG

Result:
MATCHED

Effect:
ENABLE stock.analytics
```

---

## 29. Trace d’évaluation

Pour diagnostic :

```text
conditionId
field
operator
expected
actual
result
duration?
```

Les données sensibles doivent être masquées.

---

## 30. Test Cases

Chaque Rule peut avoir des scénarios de test.

Exemple :

```text
Case 1
Plan = PRO
Country = MG
Expected = MATCHED

Case 2
Plan = FREE
Country = MG
Expected = NOT_MATCHED
```

---

## 31. Modèle RuleTestCase

```text
id
ruleId
name
inputContext
expectedMatch
expectedEffect
status
lastRunAt
lastResult
```

---

## 32. Exécution des tests

Action :

```http
POST /api/pack-manager/rules/:id/test
```

Le backend exécute tous les cas de test avec le moteur déterministe.

---

# 33. Validation syntaxique

Vérifier :

- structure valide ;
- groupements valides ;
- opérateurs valides ;
- value type compatible ;
- aucune condition vide invalide ;
- profondeur maximale ;
- nombre maximum de nœuds.

---

## 34. Validation sémantique

Vérifier :

- target existe ;
- fieldRef existe ;
- opérateur autorisé ;
- enum valide ;
- référence autorisée ;
- capability connue ;
- contrat supporté ;
- PackVersion mutable si édition.

---

## 35. Validation métier

Vérifier :

- contradictions évidentes ;
- règles dupliquées ;
- effets incompatibles ;
- priorité ambiguë ;
- règles toujours vraies ou toujours fausses si détectables ;
- dépendances manquantes.

---

## 36. Contradictions

Exemple :

```text
Rule A priority 50
ENABLE Feature X
IF plan = PRO

Rule B priority 50
DISABLE Feature X
IF plan = PRO
```

Résultat :

```text
RULE_CONFLICT
```

si aucune politique de résolution ne permet de départager.

---

## 37. Politique de résolution

La plateforme doit définir une politique déterministe.

Proposition :

```text
1. Priority DESC
2. DENY/DISABLE peut être prioritaire sur ALLOW/ENABLE à priorité égale
3. Specificity DESC
4. Stable rule code ASC
```

Cette politique doit être documentée et contractuelle.

---

## 38. Specificity

Une règle plus spécifique peut avoir davantage de conditions pertinentes.

Exemple :

```text
Rule A: plan = PRO
Rule B: plan = PRO AND country = MG
```

À priorité égale, la politique peut considérer B plus spécifique.

Il faut éviter un algorithme opaque.

---

## 39. Detect Always True / False

Le validator peut détecter certaines incohérences simples.

Exemple :

```text
x EQ 1 AND x EQ 2
```

→ probablement toujours faux.

L’analyse avancée peut être limitée à des cas déterministes sûrs.

---

# 40. Liste Rules

Colonnes recommandées :

```text
Nom
Code
Type
Target
Effect
Priority
Status
Enabled
Validation
Tests
Updated At
Actions
```

---

## 41. Filtres

```text
ruleType
targetType
effect
status
enabled
validationStatus
search
```

---

## 42. Fiche Rule

Sections :

```text
Résumé
Target
Conditions
Effect
Priority
Simulation
Test Cases
Validation
Dependencies
References
Historique
Audit
```

---

# 43. API — Liste

```http
GET /api/pack-manager/versions/:versionId/rules
```

---

## 44. API — Détail

```http
GET /api/pack-manager/rules/:id
```

---

## 45. API — Création

```http
POST /api/pack-manager/versions/:versionId/rules
```

---

## 46. API — Modification

```http
PATCH /api/pack-manager/rules/:id
```

avec `rowVersion`.

---

## 47. API — Enable / Disable

```http
POST /api/pack-manager/rules/:id/enable
POST /api/pack-manager/rules/:id/disable
```

---

## 48. API — Validate Rule

```http
POST /api/pack-manager/rules/:id/validate
```

---

## 49. API — Simulate

```http
POST /api/pack-manager/rules/:id/simulate
```

Exemple :

```json
{
  "context": {
    "subscription.plan": "PRO",
    "tenant.country": "MG"
  }
}
```

---

## 50. API — Test Cases

```http
GET  /api/pack-manager/rules/:id/tests
POST /api/pack-manager/rules/:id/tests
POST /api/pack-manager/rules/:id/test
```

---

## 51. API — Impact

```http
GET /api/pack-manager/rules/:id/impact
```

---

## 52. API — Archive

```http
POST /api/pack-manager/rules/:id/archive
```

---

# 53. Rule Evaluation Contract

Contrat vers Pack Runtime :

```text
evaluate(rule, context)
```

Résultat conceptuel :

```json
{
  "matched": true,
  "effect": "ENABLE",
  "target": {
    "type": "FEATURE",
    "ref": "stock.analytics"
  },
  "ruleCode": "stock.analytics.plan_access",
  "ruleVersion": "1.0"
}
```

---

## 54. Pack Runtime

Le Pack Runtime consomme les règles publiées dans le Pack Manifest.

Il ne doit pas lire directement les tables du Pack Manager.

```text
Pack Manager
 ↓
Pack Manifest Contract v1 🔒
 ↓
Pack Runtime
```

---

# 55. Contribution au Pack Manifest

Exemple :

```json
{
  "activationRules": [
    {
      "code": "stock.analytics.plan_access",
      "type": "ACTIVATION",
      "target": {
        "type": "FEATURE",
        "ref": "stock.analytics"
      },
      "effect": "ENABLE",
      "priority": 50,
      "when": {
        "field": "subscription.plan",
        "operator": "IN",
        "value": ["PRO", "PREMIUM"]
      }
    }
  ]
}
```

---

# 56. Permissions IAM

Permissions recommandées :

```text
pack.rule.read
pack.rule.create
pack.rule.update
pack.rule.enable
pack.rule.disable
pack.rule.validate
pack.rule.simulate
pack.rule.manage_tests
pack.rule.archive
```

---

# 57. Multi-tenant

Les rules d’une PackVersion sont tenant-scoped.

Les contextes de simulation ne doivent pas permettre de lire des données réelles d’un autre tenant.

---

# 58. Mutability Guard

Avant écriture :

```text
PackVersion mutable ?
```

Sinon :

```text
PACK_VERSION_IMMUTABLE
```

---

# 59. Optimistic Locking

Utiliser :

```text
rowVersion
```

Conflit :

```text
409
PACK_RULE_CONFLICT
```

---

# 60. Invalidation

Toute modification d’une Rule ou Condition invalide :

```text
PackVersion.validationStatus → OUTDATED
PackVersion.manifestStatus   → OUTDATED
Rule compilation cache       → INVALIDATED
```

---

# 61. Compilation

Les rules peuvent être transformées en représentation interne optimisée.

Flux :

```text
Rule DSL / JSON
 ↓
Validate
 ↓
Normalize
 ↓
Compile
 ↓
Rule AST / IR
 ↓
Hash
```

Aucun code arbitraire généré ne doit être exécuté.

---

## 62. Rule Hash

Chaque représentation canonique peut avoir :

```text
ruleHash
```

pour :

- cache ;
- détection de changement ;
- reproductibilité ;
- manifest.

---

# 63. Cache

Le Pack Runtime peut mettre en cache une règle publiée avec clé :

```text
manifestHash
ruleCode
ruleHash
```

La gestion runtime du cache ne relève pas directement de PM-CDC-07, mais les artefacts nécessaires doivent être produits.

---

# 64. Audit

Événements :

```text
pack.rule.created
pack.rule.updated
pack.rule.enabled
pack.rule.disabled
pack.rule.validated
pack.rule.simulated
pack.rule.tested
pack.rule.archived
pack.rule.conflict_detected
```

Les simulations contenant des données sensibles doivent être masquées dans l’audit.

---

# 65. Outbox Events

```text
pack.rule.created
pack.rule.updated
pack.rule.enabled
pack.rule.disabled
pack.rule.archived
pack.rule.validation_changed
```

Consommateurs :

- PM-CDC-01 ;
- PM-CDC-03 ;
- Pack Runtime ;
- Observability.

---

# 66. Codes d’erreur

```text
PACK_RULE_NOT_FOUND
PACK_RULE_CODE_INVALID
PACK_RULE_CODE_ALREADY_EXISTS
PACK_RULE_INVALID_TYPE
PACK_RULE_INVALID_TARGET
PACK_RULE_INVALID_EFFECT
PACK_RULE_FIELD_NOT_FOUND
PACK_RULE_OPERATOR_INVALID
PACK_RULE_VALUE_INVALID
PACK_RULE_CONFLICT
PACK_RULE_TOO_COMPLEX
PACK_RULE_SIMULATION_INVALID
PACK_RULE_TEST_FAILED
PACK_RULE_ARCHIVE_BLOCKED
PACK_VERSION_IMMUTABLE
```

---

# 67. Limites de complexité

Pour éviter abus ou ralentissements :

```text
maxDepth
maxConditionsPerRule
maxRulesPerVersion
maxArrayValues
maxStringLength
maxSimulationPayload
```

Ces limites doivent être configurables côté plateforme.

---

# 68. Sécurité

Interdire explicitement :

- `eval()` ;
- code JavaScript libre ;
- SQL ;
- expressions système ;
- lecture de fichiers ;
- appels réseau arbitraires ;
- secrets ;
- credentials ;
- accès direct DB.

La rule language doit être déclarative et allowlistée.

---

# 69. Frontend React

Structure indicative :

```text
src/features/pack-manager/rules/
├── pages/
├── components/
├── builder/
├── simulation/
├── tests/
├── impact/
├── hooks/
├── services/
├── types/
└── utils/
```

Composants :

```text
RuleList
RuleForm
RuleBuilder
ConditionGroup
ConditionRow
FieldPicker
OperatorPicker
ValueEditor
RulePriorityEditor
RuleSimulator
RuleTestCases
RuleValidationReport
RuleImpactDialog
```

---

# 70. Maquette fonctionnelle

```text
RULE: Analytics access

Target
FEATURE → stock.analytics

Effect
ENABLE

Priority
50

WHEN ALL
├── subscription.plan IN [PRO, PREMIUM]
└── tenant.country EQ MG

Validation
✓ VALID

Tests
✓ 4 / 4 passed

[Simulate] [Edit] [Disable]
```

---

# 71. UX Rule Builder

Le builder doit :

- être visuel ;
- empêcher les combinaisons invalides ;
- adapter l’éditeur au type de valeur ;
- proposer les enums ;
- permettre groupes AND/OR ;
- permettre NOT ;
- afficher la complexité ;
- afficher en permanence la cible et l’effet.

---

# 72. UX Simulation

Vue recommandée :

```text
TEST CONTEXT
Plan       [PRO]
Country    [MG]
Environment[TEST]

[Run Simulation]

RESULT
✓ MATCHED
Effect: ENABLE
Target: stock.analytics

TRACE
✓ plan IN [PRO, PREMIUM]
✓ country EQ MG
```

---

# 73. États UI

```text
LOADING
READY
EMPTY
ERROR
FORBIDDEN
READ_ONLY
SAVING
VALIDATING
SIMULATING
TESTING
CONFLICT
```

---

# 74. Backend NestJS

Structure indicative :

```text
src/pack-manager/rules/
├── rules.controller.ts
├── rules.service.ts
├── rules.repository.ts
├── rule-validator.service.ts
├── rule-normalizer.service.ts
├── rule-compiler.service.ts
├── rule-evaluator.service.ts
├── rule-conflict.service.ts
├── rule-impact.service.ts
├── rule-test.service.ts
├── field-registry/
├── dto/
├── domain/
└── tests/
```

---

# 75. Prisma — Modèles conceptuels

```text
ActivationRule
├── id
├── tenantId
├── packVersionId
├── code
├── name
├── description
├── ruleType
├── targetType
├── targetId
├── effect
├── priority
├── status
├── enabled
├── expressionVersion
├── ruleHash
├── metadata
├── createdAt/by
├── updatedAt/by
├── archivedAt
└── rowVersion
```

```text
RuleCondition
├── id
├── ruleId
├── parentConditionId
├── nodeType
├── logicalOperator
├── fieldRef
├── operator
├── value
├── valueType
└── displayOrder
```

```text
RuleTestCase
├── id
├── ruleId
├── name
├── inputContext
├── expectedMatch
├── expectedEffect
├── lastRunAt
└── lastResult
```

---

# 76. Contraintes DB

Prévoir :

```text
UNIQUE(packVersionId, rule.code)
INDEX(packVersionId)
INDEX(targetType, targetId)
INDEX(status)
INDEX(enabled)
INDEX(priority)
INDEX(ruleId, parentConditionId)
```

---

# 77. Validation globale PM-CDC-03

Contrat :

```text
validateRules(packVersionId)
```

Réponse :

```json
{
  "status": "VALID",
  "errors": [],
  "warnings": [],
  "summary": {
    "rules": 12,
    "enabled": 10,
    "testCases": 28,
    "failedTests": 0
  }
}
```

---

# 78. Mock / Simulation de contexte

Les producteurs de contexte réels ne doivent pas bloquer le développement.

Exemple :

```text
RuleContextProvider Contract v1 🔒
├── MockRuleContextProvider
└── RealRuleContextProvider
```

Providers possibles :

```text
IAM Context Provider
Subscription Context Provider
Capability Context Provider
Environment Context Provider
```

---

# 79. Contract Tests

Tester :

- Rule Context Contract ;
- Field Registry Contract ;
- Pack Manifest Rule Contract ;
- Mock vs Real providers ;
- enums ;
- opérateurs ;
- errors ;
- version compatibility.

---

# 80. Assistance IA

L’IA peut aider à :

- transformer une phrase en proposition de règle ;
- expliquer une règle ;
- détecter une contradiction probable ;
- suggérer des test cases ;
- simplifier une règle ;
- détecter des doublons.

Exemple :

```text
Utilisateur :
"Activer Analytics seulement pour PRO à Madagascar"

IA propose :
subscription.plan = PRO
AND tenant.country = MG
→ ENABLE stock.analytics
```

Puis :

```text
VALIDATION DÉTERMINISTE
+
CONFIRMATION UTILISATEUR
```

---

# 81. Fonctionnement sans IA

Toutes les fonctionnalités essentielles doivent être disponibles sans IA :

- Rule Builder ;
- validation ;
- simulation ;
- tests ;
- conflits ;
- compilation ;
- manifest ;
- publication.

---

# 82. Tests unitaires

Tester :

- operators ;
- AND ;
- OR ;
- NOT ;
- priority ;
- specificity ;
- conflicts ;
- type validation ;
- field registry ;
- evaluator ;
- compiler ;
- hash ;
- limits.

---

# 83. Tests intégration

Tester :

- Prisma ;
- arbre conditions ;
- tenant isolation ;
- mutability ;
- audit ;
- outbox ;
- test cases ;
- context providers.

---

# 84. Tests E2E Web

```text
Pack Version DRAFT
→ Rules & Conditions
→ Créer Rule
→ Target Feature stock.analytics
→ Effect ENABLE
→ Condition plan IN [PRO, PREMIUM]
→ Ajouter country = MG
→ Validate
→ Ajouter Test Cases
→ Run Tests
→ Simulate
→ Voir MATCHED
→ Sauvegarder
→ Vérifier PackVersion OUTDATED
→ Valider PackVersion
→ Générer Manifest
```

---

# 85. Critères d’acceptation

PM-CDC-07 est conforme si :

- Rule CRUD disponible ;
- Condition Builder disponible ;
- AND/OR/NOT supportés ;
- field registry allowlisté ;
- opérateurs typés ;
- simulation déterministe ;
- tests de règles ;
- validation syntaxique/sémantique/métier ;
- contradictions détectées ;
- priorité déterministe ;
- contribution au Pack Manifest ;
- Pack Runtime Contract disponible ;
- aucune exécution de code arbitraire ;
- PackVersion immutable protégée ;
- IAM/multi-tenant appliqués ;
- Mock/Contract Tests disponibles ;
- E2E web passant.

---

# 86. Definition of Done

```text
PM-CDC-07 DONE
├── Rule Model
├── Condition Model
├── Rule List
├── Rule Detail
├── Create / Edit
├── Rule Builder
├── AND / OR / NOT
├── Field Registry
├── Typed Operators
├── Priority
├── Resolution Policy
├── Validation
├── Conflict Detection
├── Simulation
├── Evaluation Trace
├── Test Cases
├── Compiler / Normalizer
├── Rule Hash
├── Impact Analysis
├── Pack Manifest Contribution
├── Runtime Contract
├── Mutability Guard
├── Invalidation
├── IAM
├── Tenant Isolation
├── Security Limits
├── Audit
├── Outbox
├── AI Assistance optional
├── No-AI full workflow
├── Mock Providers
├── Contract Tests
├── Unit Tests
├── Integration Tests
└── E2E Web
```

---

# 87. Résultat attendu

À la fin de PM-CDC-07 :

```text
PACK VERSION
     ↓
MODULE / FEATURE / CAPABILITY
     ↓
RULES & CONDITIONS
     ↓
VALIDATION
     ↓
SIMULATION / TESTS
     ↓
CANONICAL RULES
     ↓
PACK MANIFEST
     ↓
PACK RUNTIME
```

> **PM-CDC-07 clôture le Pack Manager en fournissant des règles déclaratives, déterministes, testables, sécurisées et versionnées. Le Pack Manager décrit les conditions ; le Pack Runtime applique ces règles à partir du Pack Manifest, sans accès direct aux tables internes du Pack Manager.**
