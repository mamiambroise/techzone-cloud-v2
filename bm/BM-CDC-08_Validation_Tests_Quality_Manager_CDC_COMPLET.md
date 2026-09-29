# CAHIER DES CHARGES COMPLET ET DÉTAILLÉ — BUSINESS MANAGER

## BM-CDC-08 — Validation, Tests & Quality Manager

### Validation globale, Quality Gate, tests d’intégration, conformité, readiness et critères d’acceptation du Business Manager

**Projet :** Techzone Cloud  
**Module :** Business Manager  
**Référence :** `BM-CDC-08`  
**Nom :** Validation, Tests & Quality Manager  
**Priorité :** 🔴 P0 — Qualité et blocage publication  
**Type :** Transversal — Backend + Frontend + Tests + Quality Gate + Rapports + Documentation  
**Prérequis :** `BM-CDC-00` à `BM-CDC-07`  
**Consommateurs :** `BM-CDC-02 — Version & Lifecycle Manager`, Publication/Release Layer, Pack Manager, Pack Runtime, Application Runtime, Observability/Security  
**Statut :** Spécification fonctionnelle de référence

---

# 1. Finalité

BM-CDC-08 constitue le **moteur de validation globale et de qualité** du Business Manager.

Les CDC précédents construisent une ApplicationVersion fonctionnelle :

```text
BM-CDC-01 → Application
BM-CDC-02 → Version & Lifecycle
BM-CDC-03 → Data Model
BM-CDC-04 → Features & Capabilities
BM-CDC-05 → Menu & Navigation
BM-CDC-06 → Configuration & Metadata
BM-CDC-07 → Contracts & Runtime Bridge
```

BM-CDC-08 répond ensuite à la question :

> **Cette ApplicationVersion est-elle suffisamment complète, cohérente, sûre, compatible, testée et prête à être publiée ou consommée par les Runtime ?**

---

# 2. Principe fondamental

BM-CDC-08 ne doit pas recréer les validateurs métier des autres CDC.

Il doit :

```text
collecter
orchestrer
agréger
prioriser
classer
bloquer si nécessaire
rapporter
historiser
```

les résultats de validation.

Principe :

```text
CDC-03 Validator
CDC-04 Validator
CDC-05 Validator
CDC-06 Validator
CDC-07 Validator
        ↓
BM-CDC-08
Quality Orchestrator
        ↓
Quality Report
        ↓
Quality Gate
        ↓
PASS / WARNING / FAIL
```

---

# 3. Objectifs principaux

BM-CDC-08 doit fournir :

```text
Quality Validator Registry
Quality Orchestrator
Validation Campaign
Validation Scope
Quality Rules
Quality Profiles
Quality Gate
Readiness Gate
Compliance Checks
Security Checks
Integration Tests
Regression Tests
Smoke Tests
Contract Tests
Snapshot Consistency Tests
Data Integrity Tests
Compatibility Tests
Runtime Readiness Tests
Performance Checks
Accessibility Checks
Frontend Quality Checks
Backend Quality Checks
Quality Report
Issue Tracking
Issue Severity
Blocking Rules
Waiver / Exception
Approval
History
Audit
Metrics
Dashboards
CI-ready execution
Publication Gate
```

---

# 4. Hors périmètre

BM-CDC-08 ne doit pas devenir :

```text
un moteur de Data Model              → BM-CDC-03
un moteur de Feature                 → BM-CDC-04
un moteur de Menu                    → BM-CDC-05
un moteur de Configuration           → BM-CDC-06
un Runtime Bridge                    → BM-CDC-07
un système IAM                       → IAM
un système de monitoring production  → Observability
un outil CI/CD complet               → Publication / Deployment
```

BM-CDC-08 orchestre la qualité du périmètre Business Manager.

---

# 5. Position dans l’architecture

```text
BM-CDC-01
Application
    │
BM-CDC-02
Version & Lifecycle
    │
BM-CDC-03
Data Model
    │
BM-CDC-04
Features & Capabilities
    │
BM-CDC-05
Menu & Navigation
    │
BM-CDC-06
Configuration & Metadata
    │
BM-CDC-07
Contracts & Runtime Bridge
    │
    ▼
BM-CDC-08
VALIDATION, TESTS & QUALITY
    │
    ├── Quality Report
    ├── Quality Gate
    ├── Publication Readiness
    └── Runtime Readiness
```

---

# 6. Concepts principaux

BM-CDC-08 doit introduire :

```text
QualityRule
QualityRuleSet
QualityProfile
QualityValidator
ValidationCampaign
ValidationRun
ValidationResult
QualityIssue
QualityScore
QualityGate
QualityWaiver
QualityApproval
QualityReport
QualityMetric
TestSuite
TestCase
TestRun
TestResult
```

---

# 7. QualityValidator Registry

Créer :

```text
QualityValidatorRegistry
```

Fonctions :

```text
register()
unregister()
list()
get()
resolveByScope()
execute()
```

---

# 8. Validator Contract

Interface conceptuelle :

```text
QualityValidator
├── key
├── name
├── domain
├── severityPolicy
├── supportedScopes[]
├── order
├── timeout
└── validate(context)
```

---

# 9. Validators fournis par les CDC

Exemples :

```text
BM-CDC-03
DataModelQualityValidator

BM-CDC-04
FeatureCapabilityQualityValidator

BM-CDC-05
NavigationQualityValidator

BM-CDC-06
ConfigurationQualityValidator

BM-CDC-07
ContractRuntimeQualityValidator
```

---

# 10. Quality Context

Entrée commune :

```text
QualityContext
├── tenantId
├── applicationId
├── applicationVersionId
├── environment
├── actorId
├── permissions
├── validationMode
├── profileId
├── traceId
└── metadata
```

---

# 11. Validation Modes

Prévoir :

```text
QUICK
STANDARD
FULL
PUBLICATION
RUNTIME
SECURITY
REGRESSION
CUSTOM
```

---

# 12. QUICK

Objectif :

```text
retour rapide
contrôles essentiels
pas de tests lourds
```

---

# 13. STANDARD

Inclut :

```text
validators métier
cohérence
complétude
contrats
navigation
configuration
```

---

# 14. FULL

Inclut :

```text
STANDARD
+
integration tests
+
contract tests
+
snapshot consistency
+
performance checks
+
security checks
```

---

# 15. PUBLICATION

Mode strict utilisé avant publication.

Tout problème bloquant interdit le passage.

---

# 16. RUNTIME

Vérifie :

```text
RuntimeManifest
RuntimeSnapshot
compatibility
required integrations
runtime-exposed configuration
```

---

# 17. SECURITY

Vérifie notamment :

```text
permissions
tenant isolation
cross-app isolation
cross-version isolation
secret exposure
unsafe URLs
invalid scopes
published mutation protection
```

---

# 18. REGRESSION

Compare une nouvelle version à une version de référence.

---

# 19. ValidationCampaign

Une campagne groupe plusieurs validations/tests.

```text
ValidationCampaign
├── id
├── applicationId
├── applicationVersionId
├── mode
├── profileId
├── status
├── triggeredBy
├── startedAt
├── completedAt
└── metadata
```

---

# 20. Campaign Status

```text
PENDING
RUNNING
PASS
PASS_WITH_WARNINGS
FAIL
CANCELLED
ERROR
```

---

# 21. ValidationRun

Chaque Validator produit un run individuel.

```text
ValidationRun
├── id
├── campaignId
├── validatorKey
├── status
├── startedAt
├── completedAt
├── duration
├── issueCount
├── score
└── metadata
```

---

# 22. QualityIssue

Structure :

```text
QualityIssue
├── id
├── campaignId
├── validatorKey
├── severity
├── code
├── message
├── targetType
├── targetId
├── field
├── blocking
├── category
├── suggestedAction
├── metadata
├── createdAt
└── resolvedAt
```

---

# 23. Severity

Niveaux :

```text
INFO
WARNING
ERROR
CRITICAL
```

---

# 24. Blocking

Une issue peut être :

```text
blocking = true
```

indépendamment de sa sévérité si la politique l’exige.

---

# 25. Catégories d’issues

Exemples :

```text
DATA_MODEL
FEATURE
CAPABILITY
NAVIGATION
CONFIGURATION
CONTRACT
RUNTIME
SECURITY
PERFORMANCE
ACCESSIBILITY
INTEGRATION
COMPATIBILITY
DOCUMENTATION
TEST
```

---

# 26. Quality Score

Score global recommandé :

```text
0 → 100
```

Mais règle :

```text
Score élevé
≠
publication autorisée
```

Une seule issue critique bloquante suffit à refuser la publication.

---

# 27. Calcul du score

Exemple pondéré :

```text
Data Model              20%
Features                 15%
Navigation               10%
Configuration            15%
Contracts                15%
Runtime Readiness        10%
Security                 10%
Tests                     5%
```

Les poids doivent être configurables via `QualityProfile`.

---

# 28. QualityProfile

Définit :

```text
validators actifs
poids
seuils
blocking policies
timeouts
required suites
allowed waivers
```

---

# 29. Profils minimaux

Prévoir :

```text
DEVELOPMENT
TEST
STAGING
PRODUCTION
PUBLICATION_STRICT
```

---

# 30. QualityRule

Une règle peut être :

```text
built-in
declarative
validator-backed
```

Aucun code arbitraire utilisateur ne doit être exécuté.

---

# 31. Rule Model

```text
QualityRule
├── id
├── code
├── name
├── category
├── description
├── severity
├── blocking
├── validatorKey
├── scope
├── condition
├── enabled
└── metadata
```

---

# 32. RuleSet

```text
QualityRuleSet
├── id
├── name
├── code
├── rules[]
├── environment
├── version
└── active
```

---

# 33. Quality Gate

Créer :

```text
QualityGateService
```

Responsabilités :

```text
evaluate()
getBlockingIssues()
getWarnings()
checkMinimumScore()
checkRequiredValidators()
checkRequiredSuites()
checkWaivers()
decide()
```

---

# 34. Gate Decision

Résultat :

```text
PASS
PASS_WITH_WARNINGS
FAIL
```

---

# 35. GateResult

```text
QualityGateResult
├── decision
├── score
├── blockingIssues[]
├── warnings[]
├── failedRules[]
├── waivers[]
├── approvals[]
├── campaignId
└── metadata
```

---

# 36. Publication Gate

Avant publication :

```text
BM-CDC-02
      ↓
Request Publication
      ↓
BM-CDC-08
Publication Quality Gate
      ↓
PASS ?
  ├── YES → BM-CDC-07 Runtime Readiness / Snapshot
  └── NO  → Publication denied
```

---

# 37. Relation avec BM-CDC-02

BM-CDC-02 reste propriétaire de :

```text
READY
PUBLISHED
publication transaction
rollback
```

BM-CDC-08 fournit :

```text
QualityGateResult
```

---

# 38. Relation avec BM-CDC-07

BM-CDC-07 fournit :

```text
RuntimeReadiness
ContractValidation
Compatibility
RuntimeSnapshot status
```

BM-CDC-08 les agrège.

---

# 39. Readiness finale

Exemple :

```text
Business Quality      PASS
Runtime Readiness     PASS
Security              PASS
Integration Tests     PASS
Snapshot              CURRENT
        ↓
PUBLICATION READY
```

---

# 40. Test Suite

Modèle :

```text
TestSuite
├── id
├── code
├── name
├── type
├── required
├── order
├── timeout
└── metadata
```

---

# 41. Types de Test Suite

```text
SMOKE
INTEGRATION
REGRESSION
CONTRACT
SECURITY
PERFORMANCE
ACCESSIBILITY
E2E
CUSTOM
```

---

# 42. TestCase

```text
TestCase
├── id
├── suiteId
├── code
├── name
├── description
├── preconditions
├── expectedResult
├── blocking
└── metadata
```

---

# 43. TestRun

```text
TestRun
├── id
├── campaignId
├── suiteId
├── status
├── startedAt
├── completedAt
├── duration
├── passCount
├── failCount
├── skippedCount
└── metadata
```

---

# 44. TestResult

```text
TestResult
├── testCaseId
├── status
├── message
├── duration
├── evidenceRef
├── traceId
└── metadata
```

---

# 45. Test Status

```text
PASS
FAIL
SKIPPED
BLOCKED
ERROR
```

---

# 46. Smoke Tests

Minimum :

```text
Application accessible
Version accessible
Workspace accessible
Data Model accessible
Features accessible
Navigation accessible
Configuration accessible
Runtime Manifest generated
```

---

# 47. Data Model Quality Checks

Exemples :

```text
entity code unique
field code unique
relation valid
no cycle invalid
required field valid
formula valid
index consistency
migration plan valid
snapshot deterministic
```

---

# 48. Feature Quality Checks

```text
feature valid
capabilities valid
dependencies satisfied
conflicts absent
required entities exist
required fields exist
version activation coherent
```

---

# 49. Navigation Quality Checks

```text
no hierarchy cycle
max depth respected
routes valid
actions valid
required capabilities exist
no orphan item
resolved navigation non-empty if required
mobile/desktop compatibility
```

---

# 50. Configuration Quality Checks

```text
required config present
value types valid
cross-validation pass
no secret exposure
runtime-exposed keys valid
no invalid override
snapshot deterministic
```

---

# 51. Contract Quality Checks

```text
contract schema valid
contract version supported
hash deterministic
no secret exposed
compatibility known
no breaking change unhandled
```

---

# 52. Runtime Quality Checks

```text
manifest complete
required sections present
snapshot current
required integrations valid
consumer compatibility valid
```

---

# 53. Tenant Isolation Tests

Test obligatoire :

```text
Tenant A
Application A

Tenant B
Application B

Context Tenant A
↓
attempt resource B
↓
DENIED
```

---

# 54. Application Isolation Tests

```text
Application A Version A1
Application B Version B1

Context A
↓
Access B1
↓
DENIED
```

---

# 55. Version Isolation Tests

Une ressource versionnée ne doit jamais être lue/mutée depuis une autre version sans contrat prévu.

---

# 56. Published Immutability Tests

Tester toutes mutations principales :

```text
Data Model
Feature
Navigation
Configuration
Integration Binding
```

sur version publiée.

Résultat attendu :

```text
VERSION_NOT_EDITABLE
```

---

# 57. Permission Tests

Tester au minimum :

```text
READ
CREATE
UPDATE
ARCHIVE
VALIDATE
PUBLISH
ROLLBACK
SNAPSHOT
INTEGRATION
QUALITY
```

---

# 58. Contract Tests

Vérifier les contrats entre :

```text
Frontend ↔ Backend
Business Manager ↔ ERP Adapter
Business Manager ↔ Runtime
Business Manager ↔ Pack Runtime
Business Manager ↔ API Layer
```

---

# 59. API Contract Tests

Valider :

```text
success envelope
error envelope
HTTP codes
traceId
pagination
validation errors
forbidden
conflict
not found
```

---

# 60. Snapshot Consistency Tests

Tester :

```text
same logical state → same hash
changed state → changed hash
published snapshot immutable
secret excluded
contributors deterministic
```

---

# 61. Regression Tests

Comparer :

```text
Reference Version
vs
Candidate Version
```

Dimensions :

```text
Data Model
Features
Capabilities
Navigation
Configuration
Contracts
Runtime Manifest
```

---

# 62. Regression Result

```text
NO_REGRESSION
EXPECTED_CHANGE
WARNING
BREAKING_REGRESSION
```

---

# 63. Breaking Regression

Exemples :

```text
capability removed
required entity removed
route removed
configuration key removed
contract field removed
```

---

# 64. Compatibility Tests

Vérifier :

```text
Manifest version
Contract versions
Adapter versions
Consumer versions
ERP target compatibility
```

---

# 65. Integration Tests

Flux :

```text
Frontend
↓
API
↓
Application Service
↓
Domain
↓
Repository
↓
DB
↓
Audit
↓
Snapshot / Contracts
```

---

# 66. E2E Tests

Parcours obligatoire :

```text
Login
↓
Select Tenant
↓
Open Business Manager
↓
Create Application
↓
Create Version
↓
Create Data Model
↓
Configure Features
↓
Configure Navigation
↓
Configure Settings
↓
Validate
↓
Generate Runtime Manifest
↓
Quality Gate
↓
Publish
```

---

# 67. E2E Rollback

```text
Version 1.2.0 PUBLISHED
↓
Select 1.1.0
↓
Quality / Compatibility check
↓
Rollback
↓
Runtime Snapshot restored
↓
History preserved
```

---

# 68. Performance Checks

Indicateurs possibles :

```text
API response time
manifest generation
validation duration
snapshot generation
list loading
resolver performance
```

---

# 69. Performance Thresholds

Exemple :

```text
API detail             < 500 ms
List                    < 1000 ms
Validation STANDARD     < 5 s
Manifest generation     < 2 s
Snapshot generation     < 3 s
```

Hors appels externes lourds.

---

# 70. Performance Severity

Un dépassement peut être :

```text
WARNING
BLOCKING
```

selon profil.

---

# 71. Frontend Quality Checks

Minimum :

```text
loading state
empty state
error state
forbidden state
read-only state
conflict state
responsive
keyboard navigation
focus
forms validation
```

---

# 72. Accessibility Checks

Minimum :

```text
labels
focus visible
keyboard
contrast
error association
semantic headings
table accessibility
non-color-only status
```

---

# 73. Backend Quality Checks

```text
domain separation
validation server-side
transactions
optimistic locking
audit
traceId
tenant isolation
version guard
no direct forbidden coupling
```

---

# 74. Security Checks

```text
authentication required
authorization
tenant isolation
application isolation
version isolation
CSRF where applicable
CORS policy
secret handling
SSRF protection
input validation
output encoding
no arbitrary eval
no arbitrary SQL
no direct ERP DB coupling
```

---

# 75. Secret Leak Test

Chercher dans :

```text
API payloads
logs
audit
snapshots
manifest
error details
frontend state
```

Toute fuite critique :

```text
CRITICAL
BLOCKING
```

---

# 76. Quality Waiver

Une exception contrôlée peut être créée.

```text
QualityWaiver
├── id
├── issueCode
├── applicationVersionId
├── reason
├── scope
├── approvedBy
├── approvedAt
├── expiresAt
├── status
└── metadata
```

---

# 77. Waiver Rules

Interdire un waiver pour certains cas :

```text
tenant isolation breach
secret leak
authentication bypass
critical data corruption
invalid published snapshot
```

---

# 78. Waiver Status

```text
REQUESTED
APPROVED
REJECTED
EXPIRED
REVOKED
```

---

# 79. Waiver Expiration

Un waiver doit avoir une durée si possible.

Il ne doit pas devenir une suppression permanente silencieuse de règle.

---

# 80. Quality Approval

Prévoir :

```text
QualityApproval
```

pour certains profils publication.

---

# 81. Approval Flow

```text
Campaign PASS
↓
Approval Required
↓
Reviewer
↓
Approve / Reject
```

---

# 82. Approval ≠ Validation

Une validation automatique et une approbation humaine sont distinctes.

---

# 83. Quality Report

Structure :

```text
QualityReport
├── campaign
├── application
├── version
├── profile
├── score
├── decision
├── validatorResults[]
├── testResults[]
├── issues[]
├── waivers[]
├── approvals[]
├── runtimeReadiness
├── compatibility
├── generatedAt
└── reportHash
```

---

# 84. Report Formats

Prévoir :

```text
JSON
HTML
PDF-ready data
```

Le PDF final peut être produit plus tard par un Document/Report Engine.

---

# 85. Report Summary

Exemple :

```text
Application: Boutique
Version: 1.2.0

Score: 94/100

Data Model          PASS
Features            PASS
Navigation          WARNING
Configuration       PASS
Contracts           PASS
Runtime             PASS
Security            PASS
Tests               PASS

Decision:
PASS WITH WARNINGS
```

---

# 86. Validation Dashboard

Frontend :

```text
QUALITY DASHBOARD

Current Status
Score
Blocking Issues
Warnings
Last Campaign
Runtime Readiness
Test Pass Rate
Security Status
Compatibility
```

---

# 87. Campaign List

Colonnes :

```text
Date
Mode
Profile
Triggered By
Status
Score
Issues
Duration
Actions
```

---

# 88. Campaign Detail

Onglets :

```text
Summary
Validators
Issues
Tests
Security
Compatibility
Readiness
Waivers
Approvals
Report
Activity
```

---

# 89. Issue Viewer

Fonctions :

```text
filter severity
filter category
filter blocking
search
group by validator
open target resource
mark resolved when applicable
request waiver
```

---

# 90. Deep Link vers ressource

Chaque issue doit autant que possible fournir :

```text
targetType
targetId
route
```

Exemple :

```text
Issue:
NAVIGATION_ROUTE_INVALID

[ Ouvrir MenuItem ]
```

---

# 91. Suggested Action

Exemple :

```text
Add required capability sale.read
```

ou :

```text
Configure stock.low_threshold
```

---

# 92. Run Validation Button

Actions :

```text
Quick Validation
Standard Validation
Full Validation
Publication Validation
```

selon permission.

---

# 93. Run Status UI

Afficher :

```text
PENDING
RUNNING
PASS
PASS_WITH_WARNINGS
FAIL
ERROR
```

avec progression si disponible.

---

# 94. Progress

Exemple :

```text
Data Model      ✓
Features        ✓
Navigation      running
Configuration   pending
Contracts       pending
```

---

# 95. Cancellation

Une campagne non publication peut être annulée si le backend le permet.

Une validation critique déjà engagée dans une transaction de publication ne doit pas être abandonnée de manière incohérente.

---

# 96. Async Execution

Les validations lourdes peuvent être asynchrones.

Prévoir :

```text
jobId
status polling
event update
```

sans bloquer une requête HTTP trop longtemps.

---

# 97. Timeout

Chaque Validator doit avoir un timeout.

Un timeout doit produire :

```text
VALIDATOR_TIMEOUT
```

et être classé selon politique.

---

# 98. Validator Isolation

Un Validator en erreur ne doit pas empêcher l’enregistrement du résultat des autres.

---

# 99. Required Validator

Un Validator peut être :

```text
required = true
```

Son absence ou crash peut bloquer le Gate.

---

# 100. CI-ready Execution

Prévoir une API permettant à une pipeline de demander :

```text
run validation
poll result
read gate decision
```

---

# 101. API — Campaigns

```text
GET  /application-versions/:versionId/quality/campaigns
POST /application-versions/:versionId/quality/campaigns
```

Payload :

```json
{
  "mode": "PUBLICATION",
  "profileId": "publication-strict"
}
```

---

# 102. API — Campaign Detail

```text
GET /quality/campaigns/:campaignId
```

---

# 103. API — Run Status

```text
GET /quality/campaigns/:campaignId/status
```

---

# 104. API — Issues

```text
GET /quality/campaigns/:campaignId/issues
```

Filtres :

```text
severity
category
blocking
validator
status
```

---

# 105. API — Quality Gate

```text
GET  /quality/campaigns/:campaignId/gate
POST /application-versions/:versionId/quality/gate/evaluate
```

---

# 106. API — Report

```text
GET /quality/campaigns/:campaignId/report
```

---

# 107. API — Waivers

```text
POST /quality/issues/:issueId/waivers
GET  /application-versions/:versionId/quality/waivers
POST /quality/waivers/:id/approve
POST /quality/waivers/:id/reject
POST /quality/waivers/:id/revoke
```

---

# 108. API — Approvals

```text
POST /quality/campaigns/:campaignId/approvals
POST /quality/approvals/:id/approve
POST /quality/approvals/:id/reject
```

---

# 109. API — Test Suites

```text
GET /quality/test-suites
GET /quality/test-suites/:id
```

---

# 110. API — Test Runs

```text
POST /application-versions/:versionId/quality/test-runs
GET  /quality/test-runs/:id
```

---

# 111. Error Codes

Prévoir :

```text
QUALITY_CAMPAIGN_NOT_FOUND
QUALITY_CAMPAIGN_ALREADY_RUNNING
QUALITY_PROFILE_NOT_FOUND
QUALITY_VALIDATOR_NOT_FOUND
QUALITY_VALIDATOR_FAILED
QUALITY_VALIDATOR_TIMEOUT

QUALITY_GATE_FAILED
QUALITY_GATE_NOT_READY
QUALITY_SCORE_TOO_LOW
QUALITY_BLOCKING_ISSUES

QUALITY_WAIVER_NOT_ALLOWED
QUALITY_WAIVER_EXPIRED
QUALITY_APPROVAL_REQUIRED
QUALITY_APPROVAL_REJECTED

TEST_SUITE_NOT_FOUND
TEST_RUN_FAILED
TEST_CASE_FAILED

SECURITY_VALIDATION_FAILED
COMPATIBILITY_FAILED
RUNTIME_READINESS_FAILED

VERSION_NOT_FOUND
VERSION_NOT_EDITABLE
TENANT_MISMATCH
PERMISSION_DENIED
VERSION_CONFLICT
```

---

# 112. Database — Campaigns

Table :

```text
bm_quality_campaigns
```

Champs :

```text
id
tenant_id
application_id
application_version_id
mode
profile_id
status
score
decision
triggered_by
started_at
completed_at
metadata
```

---

# 113. Database — Validation Runs

```text
bm_quality_validation_runs
```

---

# 114. Database — Issues

```text
bm_quality_issues
```

Champs :

```text
id
campaign_id
validator_key
severity
code
message
target_type
target_id
field
blocking
category
suggested_action
metadata
created_at
resolved_at
```

---

# 115. Database — Waivers

```text
bm_quality_waivers
```

---

# 116. Database — Approvals

```text
bm_quality_approvals
```

---

# 117. Database — Test Runs

```text
bm_quality_test_runs
```

---

# 118. Database — Test Results

```text
bm_quality_test_results
```

---

# 119. Indexes

Prévoir :

```text
tenant_id
application_id
application_version_id
campaign_id
status
severity
blocking
category
validator_key
created_at
```

---

# 120. Permissions

Exemples :

```text
business.quality.read
business.quality.run
business.quality.run.full
business.quality.run.publication

business.quality.issue.read

business.quality.waiver.request
business.quality.waiver.approve
business.quality.waiver.revoke

business.quality.approval.approve

business.quality.report.read
business.quality.test.run
```

---

# 121. IAM Context

Réutiliser :

```text
tenantId
actorId
applicationId
applicationVersionId
permissions
traceId
environment
```

---

# 122. Tenant Isolation

Toutes les campagnes et issues sont tenant-scoped.

---

# 123. Application Isolation

Impossible de consulter une campagne d’une autre Application.

---

# 124. Version Isolation

Chaque campagne est rattachée à une seule `ApplicationVersion`.

---

# 125. Optimistic Locking

Nécessaire sur :

```text
waivers
approvals
issue resolution metadata
quality profiles
```

---

# 126. Transactions

Obligatoires pour :

```text
gate decision persistence
waiver approval
approval decision
campaign finalization
```

---

# 127. Audit Events

Événements :

```text
quality.campaign.started
quality.campaign.completed
quality.campaign.failed

quality.issue.created
quality.issue.resolved

quality.gate.evaluated
quality.gate.failed
quality.gate.passed

quality.waiver.requested
quality.waiver.approved
quality.waiver.rejected
quality.waiver.revoked

quality.approval.approved
quality.approval.rejected

quality.test.started
quality.test.completed
```

---

# 128. Observability

Tracer :

```text
campaignId
validatorKey
suiteId
duration
issueCount
score
decision
timeout
errorCode
traceId
```

---

# 129. Quality Metrics

Exemples :

```text
validation pass rate
average score
blocking issue count
warnings count
average validation duration
test pass rate
security failure count
waiver count
publication rejection count
```

---

# 130. Quality Dashboard historique

Graphiques possibles :

```text
Score par version
Issues par catégorie
Issues par sévérité
Validation duration
Pass rate
Waivers
Publication readiness
```

---

# 131. Baseline

Une version peut servir de baseline :

```text
baselineVersionId
```

pour regression.

---

# 132. Baseline Protection

Une baseline publiée ne doit pas être modifiée.

---

# 133. Compare Campaigns

Comparer :

```text
Campaign A
vs
Campaign B
```

pour voir :

```text
new issues
resolved issues
regressions
score delta
test delta
```

---

# 134. Quality Trend

Exemple :

```text
1.0.0 → 82
1.1.0 → 91
1.2.0 → 95
```

---

# 135. Documentation Quality

BM-CDC-08 peut vérifier la présence des documents requis :

```text
API docs
error codes
architecture
test plan
migration notes
release notes
```

selon profil.

---

# 136. Release Notes Readiness

Prévoir un check :

```text
breaking changes documented
migration notes available
known issues listed
```

pour publication importante.

---

# 137. Migration Readiness

Consomme les résultats BM-CDC-03 :

```text
Schema Diff
Migration Plan
Data Loss Risk
```

et peut bloquer si migration non préparée.

---

# 138. Data Loss Risk

Si :

```text
DATA_LOSS_RISK
```

la politique Publication Strict doit exiger une confirmation/approval spécifique.

---

# 139. Navigation Breaking Change

Exemple :

```text
route removed
menu path removed
required capability removed
```

doit apparaître dans le Quality Report.

---

# 140. Configuration Breaking Change

Exemple :

```text
required key removed
type changed
scope changed
secret handling changed
```

---

# 141. Contract Breaking Change

Tout contrat incompatible doit être visible dans :

```text
Compatibility section
```

---

# 142. Runtime Consumer Compatibility

Vérifier au minimum les consommateurs déclarés :

```text
Pack Runtime
Application Runtime
API Layer
ERP Adapter
```

si disponibles.

---

# 143. Quality Gate Rules Example

```text
CRITICAL issue
→ FAIL

blocking ERROR
→ FAIL

required validator ERROR
→ FAIL

security FAIL
→ FAIL

required integration invalid
→ FAIL

score < 80
→ FAIL

warnings only
→ PASS_WITH_WARNINGS
```

---

# 144. Publication Strict Example

```text
Minimum score = 90

Required:
Data Model validator
Feature validator
Navigation validator
Configuration validator
Runtime validator
Security suite
Contract suite
Smoke E2E

Allowed:
Warnings

Forbidden:
Critical issue
Blocking issue
Expired waiver
Unapproved breaking change
```

---

# 145. Frontend — Quality Workspace

Dans le Workspace :

```text
Validation & Quality
├── Vue générale
├── Campagnes
├── Issues
├── Tests
├── Sécurité
├── Compatibilité
├── Quality Gate
├── Waivers
├── Approvals
├── Rapports
└── Historique
```

---

# 146. Quality Overview UI

Cards :

```text
Current Score
Gate Decision
Blocking Issues
Warnings
Tests Pass Rate
Runtime Readiness
Security Status
Last Validation
```

---

# 147. Gate Panel

Afficher :

```text
Decision
Score
Blocking Issues
Warnings
Required Validators
Required Suites
Waivers
Approvals
```

---

# 148. Issue Detail UI

Afficher :

```text
Severity
Blocking
Code
Message
Category
Validator
Target
Suggested Action
Created At
Waiver Status
```

---

# 149. Test Dashboard

Afficher :

```text
Suites
Passed
Failed
Skipped
Duration
Last Run
```

---

# 150. Security Dashboard

Afficher :

```text
Authentication
Authorization
Tenant Isolation
Secret Handling
SSRF
Published Protection
Contract Security
```

---

# 151. Compatibility Dashboard

Afficher :

```text
Manifest Version
Contract Versions
Runtime Consumers
Adapter Compatibility
Breaking Changes
```

---

# 152. Waiver UI

Flux :

```text
Issue
↓
Request Waiver
↓
Reason
Scope
Expiration
↓
Submit
↓
Reviewer
```

---

# 153. Approval UI

Flux :

```text
Campaign
↓
Approval required
↓
Reviewer decision
↓
Approve / Reject
```

---

# 154. Read-only Published Quality History

Les campagnes historiques restent consultables.

Une publication passée ne doit pas être recalculée comme si elle avait utilisé les validateurs actuels.

---

# 155. Validator Version

Chaque Validator doit exposer :

```text
validatorVersion
```

pour reproduire l’historique.

---

# 156. Rule Version

Chaque QualityRule doit avoir une version ou révision.

---

# 157. Historical Reproducibility

Un QualityReport historique doit conserver :

```text
validator versions
rule versions
profile revision
contract versions
snapshot hashes
```

---

# 158. No Silent Re-evaluation

Ne pas modifier rétroactivement le statut d’une ancienne campagne quand une règle change.

---

# 159. Stale Validation

Si la version change après campagne :

```text
Quality Status
→ OUTDATED
```

---

# 160. Outdated Reasons

Exemples :

```text
Data Model changed
Feature changed
Navigation changed
Configuration changed
Integration Binding changed
Contract version changed
```

---

# 161. Publication must use current validation

Une campagne Publication ne doit pas être acceptée si :

```text
campaignRevision != currentVersionRevision
```

ou mécanisme équivalent.

---

# 162. Quality Revision

Prévoir :

```text
validatedRevision
```

associée à la campagne.

---

# 163. Test Evidence

Un TestResult peut référencer :

```text
log
screenshot
response excerpt
trace
artifact
```

sans exposer de secret.

---

# 164. Evidence Retention

La durée de conservation doit être configurable selon politique.

---

# 165. Failure Reproduction

Une issue test doit idéalement fournir :

```text
testCase
inputs safe
expected
actual
traceId
```

---

# 166. Suggested Fix

Une suggestion peut être automatique.

Elle n’est jamais appliquée silencieusement.

---

# 167. AI Assistance future

L’IA peut aider à :

```text
résumer les erreurs
regrouper les issues similaires
proposer une correction
expliquer un échec
générer un plan de test
```

Mais l’IA ne doit pas :

```text
changer seule le Gate
approuver un waiver
publier
modifier une permission
ignorer une issue critique
```

---

# 168. Automation sans IA

Automatiser :

```text
campaign scheduling
issue aggregation
score calculation
stale detection
report generation
snapshot hash check
contract compatibility check
```

---

# 169. Tests Backend obligatoires

Tester :

```text
Validator registration
Validator execution
Required validator missing
Validator timeout
Validator failure isolation

Campaign create
Campaign run
Campaign complete
Campaign outdated

Issue creation
Severity
Blocking policy

Score calculation
Gate PASS
Gate PASS_WITH_WARNINGS
Gate FAIL

Waiver request
Waiver approve
Waiver forbidden
Waiver expiration

Approval approve
Approval reject

Tenant isolation
Application isolation
Version isolation
Permissions

Audit
Transactions
Optimistic locking
```

---

# 170. Tests Frontend obligatoires

Tester :

```text
Quality Overview
Campaign List
Campaign Detail
Run Validation
Progress
Issue filters
Issue Detail
Deep Link

Test Dashboard
Security Dashboard
Compatibility Dashboard

Gate Panel
Waiver flow
Approval flow
Report

Loading
Empty
Error
Forbidden
Conflict
Responsive
```

---

# 171. Tests d’intégration

```text
BM-CDC-03 validator
        ↓
BM-CDC-08

BM-CDC-04 validator
        ↓
BM-CDC-08

BM-CDC-05 validator
        ↓
BM-CDC-08

BM-CDC-06 validator
        ↓
BM-CDC-08

BM-CDC-07 readiness
        ↓
BM-CDC-08
        ↓
BM-CDC-02 publication
```

---

# 172. Scénario E2E — Validation réussie

```text
Version READY candidate
↓
Run PUBLICATION validation
↓
All validators PASS
↓
Security PASS
↓
Runtime Readiness PASS
↓
Score 96
↓
Gate PASS
↓
Publication allowed
```

---

# 173. Scénario E2E — Navigation invalide

```text
Invalid route
↓
Navigation Validator FAIL
↓
Blocking Issue
↓
Quality Gate FAIL
↓
Publication denied
```

---

# 174. Scénario E2E — Configuration manquante

```text
Required configuration missing
↓
Configuration Validator
ERROR
↓
Gate FAIL
```

---

# 175. Scénario E2E — Warning seulement

```text
Optional integration unavailable
↓
WARNING
↓
No blocking issue
↓
Score 92
↓
PASS_WITH_WARNINGS
```

---

# 176. Scénario E2E — Waiver

```text
Non-critical blocking rule
↓
Request Waiver
↓
Authorized reviewer approves
↓
Gate reevaluation
↓
PASS_WITH_WARNINGS
```

si la politique autorise ce waiver.

---

# 177. Scénario E2E — Waiver interdit

```text
Secret leak
↓
CRITICAL
↓
Request Waiver
↓
DENIED
QUALITY_WAIVER_NOT_ALLOWED
```

---

# 178. Scénario E2E — Stale Campaign

```text
Campaign PASS
↓
Configuration modified
↓
Version revision changes
↓
Campaign OUTDATED
↓
Publish
↓
DENIED
new validation required
```

---

# 179. Scénario E2E — Regression

```text
1.1.0 baseline
↓
1.2.0 candidate
↓
Capability sale.refund removed
↓
Regression Test
BREAKING_REGRESSION
↓
Gate FAIL / approval required
```

---

# 180. Scénario E2E — Runtime Compatibility

```text
Runtime supports Manifest v2
Candidate uses Manifest v3
↓
Compatibility FAIL
↓
Gate FAIL
```

---

# 181. Performance cible

Indicatif :

```text
Quick Validation        < 2 s
Standard Validation     < 5 s
Gate Evaluation         < 1 s
Campaign detail         < 500 ms
Issues list             < 500 ms
Report summary          < 1 s
```

Les campagnes FULL peuvent être asynchrones et plus longues.

---

# 182. Répartition Team 3 — Avotra

### Frontend fonctionnel

```text
Quality Overview
Campaign List
Campaign Detail
Run Validation flow
Issue List
Issue Detail
Filters
Deep Links
Quality Gate
Waiver UI
Approval UI
Test Dashboard
Security Dashboard
Compatibility Dashboard
Report UI
Loading / Empty / Error
Responsive
API integration
```

---

# 183. Répartition Team 3 — Belardo

### Frontend architecture

```text
Quality workspace architecture
Campaign state management
Progress architecture
Issue grouping components
Gate components
Test result components
Compatibility viewer
Report viewer
Historical comparison
Conflict handling
Frontend test foundation
Performance
```

---

# 184. Répartition Team 3 — Ranja

### Backend

```text
Quality Domain
Validator Registry
Quality Orchestrator
Campaign Service
QualityRule
RuleSet
QualityProfile
Issue Engine
Score Engine
Quality Gate Service
Waiver Service
Approval Service
Test Suite Registry
Test Runner
Regression Service
Compatibility Aggregator
Runtime Readiness integration
Report Service
Stale detection
Revision tracking
Database
APIs
Permissions
IAM Context
Isolation
Transactions
Optimistic locking
Audit
ActivityEvent
Observability
Backend tests
```

---

# 185. Livrables Backend

```text
✓ QualityValidatorRegistry
✓ QualityOrchestrator
✓ QualityContext
✓ ValidationCampaign
✓ ValidationRun

✓ QualityRule
✓ RuleSet
✓ QualityProfile

✓ QualityIssue
✓ Severity
✓ Blocking policy

✓ QualityScore
✓ QualityGate
✓ GateResult

✓ QualityWaiver
✓ QualityApproval

✓ TestSuite
✓ TestCase
✓ TestRun
✓ TestResult

✓ Smoke tests
✓ Integration tests
✓ Regression tests
✓ Contract tests
✓ Security tests
✓ Compatibility tests

✓ Runtime Readiness aggregation
✓ Stale detection
✓ Revision tracking

✓ QualityReport
✓ Metrics

✓ APIs
✓ Permissions
✓ IAM Context
✓ Isolation
✓ Transactions
✓ Optimistic locking
✓ Audit
✓ ActivityEvent
✓ Observability
✓ Tests
✓ Documentation
```

---

# 186. Livrables Frontend

```text
✓ Quality Overview
✓ Campaign Catalog
✓ Campaign Detail
✓ Run Validation
✓ Progress
✓ Issue Explorer
✓ Issue Detail
✓ Filters
✓ Deep Links

✓ Test Dashboard
✓ Security Dashboard
✓ Compatibility Dashboard

✓ Quality Gate Panel
✓ Waiver Flow
✓ Approval Flow

✓ Report Viewer
✓ History
✓ Compare Campaigns

✓ Loading
✓ Empty
✓ Error
✓ Forbidden
✓ Conflict
✓ Responsive

✓ Frontend Tests
```

---

# 187. Critères d’acceptation

BM-CDC-08 est accepté lorsque :

```text
✓ Les validateurs des CDC précédents peuvent être enregistrés
✓ Une campagne de validation peut être lancée
✓ Chaque Validator produit un résultat indépendant
✓ Les erreurs d’un Validator sont isolées
✓ Les timeouts sont gérés

✓ Les issues sont centralisées
✓ Les severities fonctionnent
✓ Les blocking policies fonctionnent
✓ Le score est calculé
✓ Les Quality Profiles fonctionnent

✓ Quality Gate retourne PASS / PASS_WITH_WARNINGS / FAIL
✓ Une issue critique bloque la publication
✓ Une campagne obsolète bloque la publication
✓ Une validation Publication utilise la revision courante

✓ Les Smoke Tests fonctionnent
✓ Les Integration Tests fonctionnent
✓ Les Contract Tests fonctionnent
✓ Les Regression Tests fonctionnent
✓ Les Security Tests fonctionnent
✓ Les Compatibility Tests fonctionnent

✓ Runtime Readiness BM-CDC-07 est agrégé
✓ Contract Compatibility est agrégée
✓ Snapshot consistency est vérifiée

✓ Les Waivers sont contrôlés
✓ Les Waivers critiques interdits sont rejetés
✓ Les expirations fonctionnent
✓ Les Approvals fonctionnent

✓ Les Quality Reports sont générés
✓ Les historiques restent reproductibles
✓ Les versions de Validators/Rules sont conservées

✓ Tenant isolation fonctionne
✓ Application isolation fonctionne
✓ Version isolation fonctionne
✓ Permissions fonctionnent
✓ Audit fonctionne
✓ Observabilité fonctionne

✓ Frontend PASS
✓ Backend PASS
✓ Integration Tests PASS
✓ E2E PASS
✓ Documentation complète
```

---

# 188. Definition of Done — BM-CDC-08

```text
BM-CDC-08 — VALIDATION, TESTS & QUALITY MANAGER

Validator Registry                 ✓
Quality Orchestrator               ✓
Quality Context                    ✓

Validation Campaign                ✓
Validation Runs                    ✓
Async-ready                        ✓
Timeouts                           ✓
Isolation                          ✓

Quality Rules                      ✓
Rule Sets                          ✓
Quality Profiles                   ✓

Quality Issues                     ✓
Severity                           ✓
Blocking                           ✓
Suggested Action                   ✓

Quality Score                      ✓
Quality Gate                       ✓
Publication Gate                   ✓
Runtime Readiness Gate             ✓

Smoke Tests                        ✓
Integration Tests                  ✓
Regression Tests                   ✓
Contract Tests                     ✓
Security Tests                     ✓
Compatibility Tests                ✓
Snapshot Tests                     ✓
E2E Tests                          ✓

Waivers                            ✓
Waiver Policies                    ✓
Waiver Expiration                  ✓
Approvals                          ✓

Quality Report                     ✓
Report Hash                        ✓
History                            ✓
Validator Versions                 ✓
Rule Versions                      ✓
Historical Reproducibility         ✓

Stale Validation                   ✓
Revision Tracking                  ✓

Metrics                            ✓
Observability                      ✓
Audit                              ✓
ActivityEvent                      ✓

Permissions                        ✓
IAM Context                        ✓
Tenant Isolation                   ✓
Application Isolation              ✓
Version Isolation                  ✓

Optimistic Locking                 ✓
Transactions                       ✓

Frontend                           ✓
Backend                            ✓
Database                           ✓
API                                ✓

Loading / Empty / Error            ✓
Forbidden                          ✓
Conflict                           ✓
Responsive                         ✓

Frontend Tests                     ✓
Backend Tests                      ✓
Integration Tests                  ✓
E2E Tests                          ✓
Documentation                      ✓
Demo                               ✓

STATUS
BUSINESS MANAGER QUALITY GATE READY
```

---

# 189. Architecture finale

```text
               BUSINESS MANAGER VERSION

Application
   │
Version
   │
Data Model
   │
Features / Capabilities
   │
Navigation
   │
Configuration
   │
Contracts / Runtime
   │
   ▼
VALIDATOR CONTRIBUTORS
   │
   ▼
BM-CDC-08
QUALITY ORCHESTRATOR
   │
   ├── Validation Runs
   ├── Test Suites
   ├── Security Checks
   ├── Compatibility
   ├── Runtime Readiness
   └── Regression
   │
   ▼
QUALITY ISSUES
   │
   ▼
QUALITY SCORE
   │
   ▼
QUALITY GATE
   │
   ├── PASS
   ├── PASS WITH WARNINGS
   └── FAIL
   │
   ▼
BM-CDC-02
PUBLICATION DECISION
```

---

# 190. Architecture Business Manager complète

```text
BM-CDC-00
Socle, Architecture & Contrats communs
        ↓
BM-CDC-01
Application Manager
        ↓
BM-CDC-02
Version & Lifecycle Manager
        ↓
BM-CDC-03
Data Model Manager
        ↓
BM-CDC-04
Feature & Capability Manager
        ↓
BM-CDC-05
Menu Engine & Navigation Manager
        ↓
BM-CDC-06
Configuration & Metadata Manager
        ↓
BM-CDC-07
Integration, Contracts & Runtime Bridge
        ↓
BM-CDC-08
Validation, Tests & Quality Manager
```

---

# 191. Règle finale

> **BM-CDC-08 est l’autorité de qualité du Business Manager, mais pas l’autorité de publication.**

BM-CDC-08 produit :

```text
Quality Report
+
Quality Gate Result
+
Test Results
+
Security Result
+
Compatibility Result
+
Runtime Readiness Result
```

Puis BM-CDC-02 utilise ce résultat pour autoriser ou refuser la publication.

La chaîne finale devient :

```text
BUILD
↓
VALIDATE
↓
TEST
↓
QUALITY GATE
↓
RUNTIME READINESS
↓
PUBLISH
```

---

# 192. Résultat final du Business Manager

À la fin de BM-CDC-00 à BM-CDC-08, Techzone Cloud doit être capable de :

```text
Créer une Application
↓
Créer une Version
↓
Définir ses données
↓
Définir ses fonctionnalités
↓
Définir sa navigation
↓
Définir sa configuration
↓
Générer ses contrats Runtime
↓
Valider sa qualité
↓
Tester
↓
Contrôler la compatibilité
↓
Générer un Quality Report
↓
Passer le Quality Gate
↓
Publier une version sûre et immuable
```
