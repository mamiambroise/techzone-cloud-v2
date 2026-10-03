# CAHIER DES CHARGES --- TECHZONE CLOUD OBSERVABILITY & DIAGNOSTICS

**Version :** 2.0 --- Consolidation et extension\
**Date :** Septembre 2026\
**Projet :** Techzone Cloud\
**Module :** Observability & Diagnostics\
**Statut :** Spécification fonctionnelle et technique consolidée\
**Principe :** fournir une visibilité transversale réelle sur la santé,
les erreurs, les performances et les événements de Techzone Cloud sans
devenir propriétaire des données métier ni du fonctionnement des modules
observés.

------------------------------------------------------------------------

# 1. Objet

Observability & Diagnostics est la couche transversale permettant de
comprendre :

-   ce qui fonctionne ;
-   ce qui est dégradé ;
-   ce qui est indisponible ;
-   ce qui a échoué ;
-   où l'erreur s'est produite ;
-   quand elle s'est produite ;
-   pour quel Tenant, Application, Pack, Deployment ou Runtime Context ;
-   quelle en est la cause technique connue ;
-   quels éléments permettent son diagnostic.

Le module doit couvrir :

``` text
HEALTH
LOGS
METRICS
TRACES / CORRELATION
EVENTS
ERRORS
ALERTS
DIAGNOSTICS
INCIDENT CONTEXT
AUDIT LINKS
```

Il ne doit pas créer un second système métier pour les modules observés.

------------------------------------------------------------------------

# 2. Position dans l'architecture

``` text
BUSINESS MANAGER ─────────────┐
UI BUILDER ───────────────────┤
AUTOMATION ───────────────────┤
PACK MANAGER ─────────────────┤
PACK RUNTIME ─────────────────┤
DATA RUNTIME ─────────────────┤
INTEGRATION HUB / ERP ────────┤
REGISTRY ─────────────────────┤
ENVIRONMENT / DEPLOYMENT ─────┤
IAM / PLATFORM ────────────────┤
                              ↓
                 OBSERVABILITY & DIAGNOSTICS
                 Logs • Metrics • Health
                 Errors • Correlation • Alerts
                              ↓
                    DASHBOARD / OPERATIONS
```

Observability reçoit des signaux des modules mais ne prend pas leur
responsabilité fonctionnelle.

------------------------------------------------------------------------

# 3. Principe de continuité

Avant toute implémentation :

``` text
EXISTANT + FONCTIONNEL       → KEEP
EXISTANT + FAIBLE            → IMPROVE
EXISTANT + BUG               → FIX
PARTIEL                      → COMPLETE
ANCIEN MAIS RÉUTILISABLE     → ADAPT
RÉELLEMENT ABSENT            → IMPLEMENT
```

Auditer avant de créer :

-   logger existant ;
-   NestJS interceptors/filters ;
-   audit ;
-   health endpoints ;
-   diagnostics Runtime ;
-   logs Automation ;
-   Integration executions ;
-   Deployment diagnostics ;
-   frontend error handling ;
-   métriques ;
-   correlation IDs ;
-   tracing éventuel ;
-   stockage des événements.

Ne jamais créer une seconde infrastructure si une capacité équivalente
existe déjà.

------------------------------------------------------------------------

# 4. Responsabilités

Observability & Diagnostics possède ou coordonne :

-   Platform Health ;
-   Service Health ;
-   dependency health ;
-   collecte/normalisation des logs techniques ;
-   métriques techniques ;
-   corrélation des requêtes et opérations ;
-   traces si l'infrastructure le permet ;
-   diagnostics transversaux ;
-   alertes opérationnelles ;
-   historique d'incidents techniques ;
-   vues de diagnostic ;
-   agrégation des signaux ;
-   liens vers les ressources propriétaires.

Il ne possède pas :

-   les Business Events métier du Business Manager ;
-   l'Audit fonctionnel de sécurité ;
-   les Workflow Executions d'Automation ;
-   les Deployment records ;
-   les Runtime Contexts ;
-   les Integration Executions ;
-   les Data Queries métier.

Ces systèmes restent propriétaires de leurs données. Observability les
référence ou agrège.

------------------------------------------------------------------------

# 5. Distinction Audit / Logs / Events / Metrics / Traces

## Audit

Répond à :

``` text
QUI a fait QUOI, sur QUELLE ressource, QUAND, avec QUEL résultat ?
```

Exemple :

``` text
User 42 published Pack 1.4.0
```

## Log

Répond à :

``` text
QUE s’est-il passé techniquement pendant l’exécution ?
```

Exemple :

``` text
Runtime manifest validation failed: missing capability
```

## Event

Signale un changement ou événement structuré :

``` text
deployment.failed
workflow.execution.failed
runtime.context.degraded
```

## Metric

Mesure une valeur dans le temps :

``` text
request_duration
error_count
deployment_duration
workflow_failure_count
```

## Trace / Correlation

Relie plusieurs opérations appartenant au même parcours :

``` text
Frontend Request
→ API
→ Data Runtime
→ Integration Hub
→ ERP Adapter
```

Ces concepts ne doivent pas être fusionnés dans une table générique sans
justification.

------------------------------------------------------------------------

# 6. Architecture fonctionnelle

``` text
Observabilité
├── Vue d’ensemble
├── Santé
├── Logs
├── Métriques
├── Erreurs
├── Alertes
├── Diagnostics
└── Incidents
```

Selon l'implémentation réelle, certaines vues peuvent être regroupées.

La Sidebar globale peut rester compacte :

``` text
PLATEFORME
└── Observabilité
```

Les sous-vues sont accessibles dans le workspace Observabilité.

------------------------------------------------------------------------

# 7. Contexte d'observabilité

Tout signal doit être enrichi autant que possible avec :

``` text
tenantId
userId?
applicationId?
applicationVersionId?
packId?
packVersionId?
environmentId?
deploymentId?
runtimeContextId?
workflowId?
workflowExecutionId?
connectorId?
requestId
correlationId
traceId?
timestamp
service
module
environment
```

Tous les champs ne sont pas obligatoires pour tous les événements.

------------------------------------------------------------------------

# 8. Correlation ID

Chaque requête/opération importante doit pouvoir recevoir un
`correlationId`.

Exemple :

``` text
Browser
correlationId = corr-123
      ↓
API Gateway / Backend
      ↓
Pack Runtime
      ↓
Data Runtime
      ↓
Integration Hub
      ↓
Dolibarr
```

Les logs produits pendant ce parcours doivent pouvoir être recherchés
avec le même identifiant lorsque techniquement possible.

Ne jamais utiliser le correlationId comme mécanisme d'autorisation.

------------------------------------------------------------------------

# 9. Request ID

Chaque requête HTTP doit pouvoir disposer d'un identifiant unique :

``` text
requestId
```

Différence :

-   `requestId` = une requête ;
-   `correlationId` = un parcours pouvant contenir plusieurs
    requêtes/opérations ;
-   `traceId` = identifiant de tracing distribué lorsque
    l'infrastructure le supporte.

------------------------------------------------------------------------

# 10. Health Model

Distinguer plusieurs niveaux.

``` text
Platform Health
Service Health
Dependency Health
Environment Health
Runtime Health
Context Health
Connector Health
Data Provider Health
```

Ne jamais résumer toute la plateforme avec un unique booléen `healthy`.

------------------------------------------------------------------------

# 11. États de santé

États conceptuels :

``` text
UNKNOWN
CHECKING
HEALTHY
DEGRADED
UNHEALTHY
UNAVAILABLE
DISABLED
```

Adapter aux enums existants.

Règles :

-   `HEALTHY` doit provenir d'un contrôle réel ;
-   `UNKNOWN` est préférable à un faux `HEALTHY` ;
-   `DEGRADED` signifie service partiellement utilisable ;
-   `UNAVAILABLE` signifie que la dépendance ne peut pas être
    atteinte/utilisée ;
-   `DISABLED` est volontaire.

------------------------------------------------------------------------

# 12. Health Checks

Exemples :

``` text
Backend Process
Database
Pack Runtime
Registry
Data Provider
Integration Hub
Dolibarr Connector
Scheduler
Queue
Storage
Deployment Runtime
```

Chaque check peut retourner :

``` text
status
checkedAt
latency?
message?
details?
```

Les détails exposés au frontend doivent être filtrés.

------------------------------------------------------------------------

# 13. Liveness et Readiness

Distinguer :

``` text
LIVENESS
Le processus est-il vivant ?

READINESS
Peut-il réellement servir les requêtes attendues ?
```

Exemple :

``` text
Backend process = HEALTHY
Database        = UNAVAILABLE
Readiness       = UNHEALTHY
```

Un process vivant ne signifie pas que l'application est prête.

------------------------------------------------------------------------

# 14. Logs structurés

Les logs backend doivent privilégier un format structuré.

Champs conceptuels :

``` text
timestamp
level
service
module
message
tenantId?
userId?
requestId?
correlationId?
traceId?
resourceType?
resourceId?
operation?
durationMs?
status?
errorCode?
metadata?
```

Niveaux :

``` text
DEBUG
INFO
WARN
ERROR
FATAL
```

Le niveau DEBUG ne doit pas produire une fuite massive d'informations en
production.

------------------------------------------------------------------------

# 15. Données interdites dans les logs

Ne jamais journaliser en clair :

-   mots de passe ;
-   API keys ;
-   tokens ;
-   cookies de session ;
-   Authorization headers ;
-   secrets ;
-   credentials ERP ;
-   données sensibles inutiles ;
-   corps complets de requêtes contenant des secrets.

Prévoir redaction/masking.

Exemple :

``` text
Authorization: [REDACTED]
apiKey: [REDACTED]
password: [REDACTED]
```

------------------------------------------------------------------------

# 16. Error Model

Normaliser les erreurs techniques.

Structure conceptuelle :

``` text
code
category
severity
message
service
module
operation
resource
requestId
correlationId
timestamp
retryable
details
```

Catégories possibles :

``` text
VALIDATION
AUTHENTICATION
AUTHORIZATION
TENANT
DATABASE
RUNTIME
DATA
AUTOMATION
INTEGRATION
DEPLOYMENT
REGISTRY
NETWORK
TIMEOUT
CONFIGURATION
INTERNAL
```

------------------------------------------------------------------------

# 17. Erreurs frontend

Le frontend doit :

-   afficher un message utile ;
-   conserver si possible un Trace/Correlation ID ;
-   ne pas afficher une stack trace brute ;
-   permettre de copier l'identifiant de diagnostic ;
-   distinguer 401, 403, 404, 409, 422, 429, 5xx ;
-   gérer les erreurs partielles par widget/module.

Exemple UX :

``` text
Impossible de charger les déploiements.

Code : DEPLOYMENT_SERVICE_UNAVAILABLE
Trace : corr-8F32A
```

------------------------------------------------------------------------

# 18. Exception Handling backend

Réutiliser ou mettre en place un traitement cohérent :

``` text
Exception
↓
Exception Filter
↓
Structured Error
↓
Log
↓
Correlation
↓
Safe API Response
```

Ne pas convertir toutes les exceptions en HTTP 500 générique si leur
catégorie est connue.

Ne pas exposer les détails internes au client.

------------------------------------------------------------------------

# 19. Metrics

Métriques techniques possibles :

## API

``` text
request_count
request_duration
request_error_count
active_requests
```

## Runtime

``` text
runtime_context_count
runtime_activation_count
runtime_activation_failure_count
runtime_resolution_duration
```

## Automation

``` text
workflow_execution_count
workflow_success_count
workflow_failure_count
workflow_duration
```

## Deployment

``` text
deployment_count
deployment_success_count
deployment_failure_count
deployment_duration
rollback_count
```

## Integration

``` text
integration_request_count
integration_failure_count
integration_duration
connector_unavailable_count
```

## Data

``` text
data_query_count
data_mutation_count
data_error_count
data_query_duration
```

N'implémenter que les métriques supportées par l'infrastructure réelle.

------------------------------------------------------------------------

# 20. Cardinalité des métriques

Éviter les labels à très forte cardinalité.

Ne pas utiliser systématiquement :

``` text
userId
resourceId
email
requestId
```

comme labels de métriques.

Ces valeurs appartiennent plutôt aux logs/traces.

Les labels doivent rester contrôlés :

``` text
service
module
status
operation
environment
```

------------------------------------------------------------------------

# 21. Tracing

Si une infrastructure de tracing existe ou est introduite :

``` text
HTTP Request
  ↓
Controller
  ↓
Service
  ↓
Data Runtime
  ↓
Integration Hub
  ↓
External System
```

Créer des spans cohérents.

Chaque span peut inclure :

``` text
traceId
spanId
parentSpanId
service
operation
start
duration
status
attributes
```

Ne pas inventer un tracing distribué complet si aucune infrastructure ne
le supporte encore.

Dans ce cas, correlationId reste le MVP.

------------------------------------------------------------------------

# 22. Events

Observability peut consommer des événements tels que :

``` text
pack.published
runtime.activation.failed
workflow.execution.failed
deployment.failed
deployment.rollback.failed
integration.connector.degraded
registry.compatibility.failed
data.provider.unavailable
```

Il ne devient pas propriétaire de leur logique métier.

------------------------------------------------------------------------

# 23. Alertes

Une Alert représente un signal nécessitant l'attention.

Modèle conceptuel :

``` text
id
tenantId?
source
category
severity
title
message
resourceType
resourceId
status
firstSeenAt
lastSeenAt
occurrenceCount
correlationId?
metadata
```

États possibles :

``` text
OPEN
ACKNOWLEDGED
RESOLVED
SUPPRESSED
```

N'introduire `ACKNOWLEDGED`/`SUPPRESSED` que si réellement nécessaire.

------------------------------------------------------------------------

# 24. Sévérités

Utiliser une nomenclature cohérente :

``` text
CRITICAL
ERROR
WARNING
INFO
```

Exemples :

-   CRITICAL : Runtime principal indisponible ;
-   ERROR : Deployment échoué ;
-   WARNING : connecteur optionnel dégradé ;
-   INFO : maintenance planifiée ou événement informatif.

La sévérité doit être déterminée par une règle, pas uniquement par la
couleur UI.

------------------------------------------------------------------------

# 25. Alert Rules

Une règle peut être basée sur :

``` text
health status
error count
failure rate
duration
repeated event
dependency unavailable
deployment failure
workflow failure
connector degradation
```

Exemple conceptuel :

``` text
IF deployment_failure_count >= threshold
THEN ALERT
```

Ne pas construire un moteur complexe de règles si l'infrastructure ne le
justifie pas.

MVP : règles explicites et déterministes.

------------------------------------------------------------------------

# 26. Déduplication d'alertes

Éviter de créer 500 alertes identiques pour le même problème.

Clé conceptuelle :

``` text
source
category
resource
errorCode
tenant
```

Une alerte existante peut incrémenter :

``` text
occurrenceCount
lastSeenAt
```

------------------------------------------------------------------------

# 27. Diagnostics

Diagnostics fournit une vue exploitable d'un problème.

Exemple :

``` text
Deployment #42
FAILED

Cause
RUNTIME_INCOMPATIBLE

Context
Tenant        Techzone
Application   TechBoutique
Environment   Production
Pack          1.4.0
Runtime       2.1.0

Correlation
corr-123

Related signals
- Manifest validation
- Runtime compatibility check
- Deployment log
- Registry capability result
```

Le diagnostic agrège ; il ne copie pas inutilement toutes les données.

------------------------------------------------------------------------

# 28. Diagnostic Bundle

Pour faciliter le support, le système peut construire un bundle
structuré non sensible :

``` text
diagnosticId
timestamp
platformVersion
moduleVersions
tenantRef
resourceRefs
healthSummary
errorCodes
correlationIds
recentRelevantLogs
configurationSummary
```

Aucun secret.

L'export éventuel doit respecter IAM et les politiques de données.

------------------------------------------------------------------------

# 29. Incident

Un Incident peut regrouper plusieurs signaux liés.

Exemple :

``` text
INCIDENT
ERP unavailable
├── Connector health failure
├── 34 integration errors
├── 6 workflow failures
└── 2 deployment warnings
```

Le modèle Incident peut être différé si le MVP ne nécessite que Health +
Errors + Alerts + Diagnostics.

Ne pas créer une plateforme ITSM complète.

------------------------------------------------------------------------

# 30. Diagnostics par module

## Business Manager

Observer :

-   validation failures ;
-   broken references ;
-   configuration errors.

## UI Builder

Observer :

-   invalid UI Definition ;
-   unknown component/action ;
-   broken bindings ;
-   renderer failures.

## Automation

Observer :

-   workflow failures ;
-   retries ;
-   timeouts ;
-   invalid nodes ;
-   trigger errors.

## Pack Manager

Observer :

-   validation errors ;
-   Manifest build failures ;
-   publication failures.

## Pack Runtime

Observer :

-   load failures ;
-   resolution failures ;
-   missing capabilities ;
-   activation failures ;
-   degraded contexts.

## Data Runtime

Observer :

-   provider unavailable ;
-   query/mutation errors ;
-   transaction failures ;
-   timeouts.

## Integration Hub / ERP

Observer :

-   connector unavailable ;
-   auth failures ;
-   mapping failures ;
-   ERP timeouts ;
-   retries ;
-   webhook failures.

## Registry

Observer :

-   incompatible versions ;
-   unavailable capabilities ;
-   registration failures.

## Deployment

Observer :

-   pre-check failures ;
-   deployment failures ;
-   readiness failures ;
-   rollback failures.

------------------------------------------------------------------------

# 31. Dashboard Observability

Route indicative :

``` text
/observability
```

Afficher uniquement des données réelles :

``` text
Platform Health
Open Critical Alerts
Errors
Degraded Services
Failed Deployments
Failed Workflows
Unavailable Connectors
Runtime Contexts
```

N'afficher un KPI que si la donnée est disponible.

------------------------------------------------------------------------

# 32. Vue Santé

Présentation recommandée :

``` text
PLATFORM
Backend             HEALTHY
Database            HEALTHY
Registry            HEALTHY

EXECUTION
Pack Runtime         DEGRADED
Runtime Contexts     3 ACTIVE / 1 DEGRADED

DATA & INTEGRATION
Data Runtime         HEALTHY
Dolibarr             UNAVAILABLE

AUTOMATION
Worker               HEALTHY
Scheduler            HEALTHY
```

Chaque ligne doit permettre d'ouvrir les diagnostics correspondants.

------------------------------------------------------------------------

# 33. Vue Logs

Fonctions :

-   recherche ;
-   filtres ;
-   période ;
-   niveau ;
-   service ;
-   module ;
-   tenant si autorisé ;
-   correlationId ;
-   requestId ;
-   resource ;
-   pagination/stream contrôlé ;
-   détail.

Éviter de charger tous les logs dans le navigateur.

------------------------------------------------------------------------

# 34. Vue Erreurs

Regrouper les erreurs pour éviter le bruit :

``` text
Error Code
Module
Count
First Seen
Last Seen
Affected Resources
Status
```

Click :

``` text
Error Group
→ occurrences
→ correlation
→ related logs
→ related resource
→ diagnostics
```

------------------------------------------------------------------------

# 35. Vue Métriques

MVP :

-   requêtes ;
-   erreurs ;
-   latence ;
-   Runtime ;
-   Automation ;
-   Deployment ;
-   Integration.

Ne pas construire un outil BI.

Les graphiques doivent avoir une source réelle.

Aucune série aléatoire ou hardcodée.

------------------------------------------------------------------------

# 36. Vue Alertes

Colonnes :

``` text
Severity
Alert
Source
Resource
Occurrences
First Seen
Last Seen
Status
```

Actions selon architecture :

``` text
Open
Acknowledge
Resolve
View diagnostics
Open source module
```

------------------------------------------------------------------------

# 37. Deep Links

Observability doit renvoyer vers le propriétaire réel :

``` text
Deployment error
→ Deployment #42

Workflow error
→ Workflow Execution

Runtime error
→ Runtime Context

Connector error
→ Integration Hub Connector

Pack validation
→ Pack Manager

UI validation
→ UI Builder
```

Observability ne doit pas devenir le seul endroit où les erreurs peuvent
être comprises.

------------------------------------------------------------------------

# 38. Dashboard global Techzone Cloud

Le Dashboard global peut consommer :

``` text
criticalAlerts
warningCount
platformHealth
failedDeployments
failedWorkflows
degradedConnectors
```

Mais il ne possède pas ces données.

Chaque alerte doit deep-linker vers Observability ou vers le module
propriétaire.

------------------------------------------------------------------------

# 39. Sidebar

Conformément à la navigation globale :

``` text
PLATEFORME
├── Registry
├── Environnements
├── Déploiements
├── Sécurité & IAM
├── Observabilité
├── Abonnements
└── Administration
```

Ne pas dupliquer Observability sous chaque module.

Les modules peuvent exposer leurs diagnostics locaux, tandis
qu'Observability fournit la vue transversale.

------------------------------------------------------------------------

# 40. Tenant Isolation

Les données d'observabilité peuvent contenir des informations sensibles.

Règles :

-   Tenant A ne lit jamais les logs/erreurs/alertes de Tenant B ;
-   un opérateur plateforme cross-tenant nécessite une permission
    explicite ;
-   le filtrage frontend ne suffit pas ;
-   la requête backend doit être scoped ;
-   les exports respectent le scope.

Les logs plateforme non tenant-scoped doivent avoir une politique
d'accès spécifique.

------------------------------------------------------------------------

# 41. IAM

Permissions conceptuelles :

``` text
observability.read
observability.health.read
observability.logs.read
observability.metrics.read
observability.errors.read
observability.alerts.read
observability.alerts.manage
observability.diagnostics.read
observability.export
```

Réutiliser la nomenclature IAM réelle avant d'en créer de nouvelles.

------------------------------------------------------------------------

# 42. Rétention

Définir des politiques distinctes pour :

``` text
logs
metrics
traces
alerts
diagnostics
```

La durée dépend de l'infrastructure, des coûts et des exigences du
projet.

Ne pas hardcoder une rétention arbitraire dans le CDC d'implémentation.

Le système doit permettre une configuration contrôlée si nécessaire.

------------------------------------------------------------------------

# 43. Recherche et pagination

Les logs et erreurs peuvent devenir volumineux.

Obligatoire :

-   pagination/cursor ;
-   filtre temporel ;
-   index adaptés ;
-   limites serveur ;
-   tri contrôlé.

Interdire les endpoints renvoyant des millions d'entrées.

------------------------------------------------------------------------

# 44. Streaming / Live Tail

Une vue Live Logs peut être ajoutée uniquement si l'infrastructure la
supporte.

Sinon :

-   refresh manuel ;
-   polling raisonnable.

Ne pas simuler du temps réel avec un polling agressif.

------------------------------------------------------------------------

# 45. Stockage

Le CDC n'impose pas un fournisseur particulier.

Selon l'existant :

``` text
PostgreSQL
log backend
metrics backend
trace backend
external observability provider
```

peuvent être utilisés.

Ne pas stocker automatiquement tous les logs volumineux dans PostgreSQL
si cela compromet la plateforme.

------------------------------------------------------------------------

# 46. Provider Abstraction

Si plusieurs backends sont envisagés, prévoir une abstraction contrôlée
:

``` text
Observability Provider
├── Health Provider
├── Log Provider
├── Metrics Provider
└── Trace Provider
```

Mais ne pas sur-ingénierer si un seul provider existe.

------------------------------------------------------------------------

# 47. Frontend Error Boundary

Mettre en place/réutiliser des Error Boundaries aux frontières
pertinentes.

Un crash d'un widget ne doit pas faire disparaître tout le Dashboard.

Un crash d'un module doit produire :

``` text
ERROR STATE
Reference / Correlation ID
Retry
```

et être enregistré lorsque possible.

------------------------------------------------------------------------

# 48. Frontend Telemetry

La télémétrie frontend peut capturer :

-   erreurs React ;
-   failed API requests ;
-   performance de navigation ;
-   erreurs critiques UI.

Respecter confidentialité, volume et consentement/configuration
applicable.

Ne jamais capturer des champs sensibles de formulaires.

------------------------------------------------------------------------

# 49. API conceptuelle

Adapter aux conventions existantes :

``` http
GET /api/observability/overview
GET /api/observability/health
GET /api/observability/logs
GET /api/observability/errors
GET /api/observability/metrics
GET /api/observability/alerts
GET /api/observability/alerts/:id
GET /api/observability/diagnostics/:resourceType/:resourceId
```

Actions éventuelles :

``` http
POST /api/observability/alerts/:id/acknowledge
POST /api/observability/alerts/:id/resolve
```

Ne pas créer d'API dupliquée si les services existants couvrent déjà ces
besoins.

------------------------------------------------------------------------

# 50. Health API

Endpoints techniques possibles :

``` http
GET /health/live
GET /health/ready
```

et une vue plateforme authentifiée :

``` http
GET /api/observability/health
```

Les endpoints publics éventuels doivent exposer le strict minimum.

Ne jamais exposer la topologie interne ou des secrets sans
authentification.

------------------------------------------------------------------------

# 51. Alerting externe

Si la plateforme dispose de canaux de notification :

``` text
email
notification center
webhook
```

Observability peut publier une alerte vers le service transversal.

Il ne doit pas recréer un moteur Email/WhatsApp/SMS.

------------------------------------------------------------------------

# 52. SLO / SLA / Error Budget

Le modèle peut préparer des concepts :

``` text
SLI
SLO
Error Budget
```

mais ils sont hors MVP sauf si une infrastructure et des objectifs réels
existent.

Ne pas afficher de faux SLA/SLO.

------------------------------------------------------------------------

# 53. UX

Direction :

**Techzone Cloud --- Operations Console 2026**

Principes :

-   forte lisibilité ;
-   densité professionnelle ;
-   hiérarchie par sévérité ;
-   filtres persistants raisonnables ;
-   statuts textuels + couleur ;
-   tableaux efficaces ;
-   graphiques simples ;
-   diagnostics orientés action ;
-   responsive ;
-   accessible.

Éviter les écrans remplis de jauges décoratives.

------------------------------------------------------------------------

# 54. États UI

Chaque widget/vue :

``` text
LOADING
LOADED
EMPTY
ERROR
FORBIDDEN
UNAVAILABLE
```

Health checks :

``` text
CHECKING
HEALTHY
DEGRADED
UNHEALTHY
UNKNOWN
```

Une absence de données ne doit pas être présentée comme `HEALTHY`.

------------------------------------------------------------------------

# 55. Performance UI

Utiliser :

-   pagination ;
-   virtualisation si nécessaire ;
-   lazy loading des détails ;
-   debounce recherche ;
-   time range limité ;
-   cache raisonnable ;
-   polling uniquement sur écrans actifs.

------------------------------------------------------------------------

# 56. Accessibilité

Prévoir :

-   navigation clavier ;
-   focus visible ;
-   aria-label ;
-   labels de sévérité ;
-   contraste ;
-   graphiques accompagnés de valeurs textuelles ;
-   tables accessibles ;
-   modales accessibles.

Ne jamais communiquer un statut uniquement par couleur.

------------------------------------------------------------------------

# 57. Sécurité

Tester :

-   cross-tenant log access ;
-   cross-tenant diagnostics ;
-   unauthorized metrics ;
-   secrets in logs ;
-   tokens in logs ;
-   stack trace leakage ;
-   malicious search filters ;
-   injection dans query/filter ;
-   oversized requests ;
-   log injection ;
-   export permissions.

Les entrées utilisateur doivent être encodées/normalisées avant
journalisation si nécessaire.

------------------------------------------------------------------------

# 58. Resilience

Observability ne doit pas devenir un single point of failure.

Exemples :

-   si Metrics backend est indisponible, l'API métier peut continuer ;
-   si Log shipping échoue, éviter de bloquer une transaction métier ;
-   si Alerting échoue, enregistrer l'échec sans transformer
    automatiquement l'opération métier en échec.

Exceptions : les exigences de sécurité/audit obligatoires peuvent
imposer des comportements plus stricts selon la plateforme.

------------------------------------------------------------------------

# 59. Sampling

Pour les traces/logs très volumineux, une stratégie de sampling peut
être utilisée.

Toujours conserver prioritairement :

-   ERROR ;
-   FATAL ;
-   opérations critiques ;
-   Deployment failures ;
-   Runtime failures ;
-   security events selon politique.

Ne pas appliquer un sampling qui masque les erreurs critiques.

------------------------------------------------------------------------

# 60. Business Rules

**RG-OBS-001** --- Aucun état HEALTHY ne doit être inventé.\
**RG-OBS-002** --- UNKNOWN est préférable à une information non
vérifiée.\
**RG-OBS-003** --- Observability ne devient pas propriétaire des
ressources observées.\
**RG-OBS-004** --- Audit, Logs, Metrics, Events et Traces restent des
concepts distincts.\
**RG-OBS-005** --- Chaque signal doit être corrélable autant que
possible.\
**RG-OBS-006** --- Les secrets ne doivent jamais apparaître dans les
logs ou diagnostics.\
**RG-OBS-007** --- Les stack traces internes ne sont pas exposées aux
utilisateurs non autorisés.\
**RG-OBS-008** --- Tenant isolation s'applique aux données
d'observabilité.\
**RG-OBS-009** --- Les accès cross-tenant exigent une permission
plateforme explicite.\
**RG-OBS-010** --- Le frontend ne constitue jamais la frontière de
sécurité.\
**RG-OBS-011** --- Les logs doivent être structurés lorsque possible.\
**RG-OBS-012** --- Chaque requête doit pouvoir disposer d'un requestId.\
**RG-OBS-013** --- Les opérations distribuées importantes doivent
pouvoir être corrélées.\
**RG-OBS-014** --- Liveness et Readiness sont distinctes.\
**RG-OBS-015** --- Une dépendance indisponible doit être visible comme
telle.\
**RG-OBS-016** --- Une erreur connue utilise un code structuré stable.\
**RG-OBS-017** --- Les métriques évitent les labels à cardinalité
incontrôlée.\
**RG-OBS-018** --- Aucun graphique ne doit utiliser des données fictives
en mode REAL.\
**RG-OBS-019** --- Les alertes répétitives doivent être dédupliquées
lorsque possible.\
**RG-OBS-020** --- Chaque alerte conserve sa source et sa ressource
propriétaire.\
**RG-OBS-021** --- Les diagnostics agrègent des références sans
dupliquer inutilement les données sources.\
**RG-OBS-022** --- Les exports de diagnostics ne contiennent aucun
secret.\
**RG-OBS-023** --- Observability ne doit pas bloquer inutilement les
opérations métier.\
**RG-OBS-024** --- Les erreurs critiques ne doivent pas être supprimées
par sampling.\
**RG-OBS-025** --- Les endpoints de logs utilisent pagination et limites
serveur.\
**RG-OBS-026** --- Le Dashboard global consomme Observability sans
devenir propriétaire des alertes.\
**RG-OBS-027** --- Les diagnostics locaux des modules restent
disponibles lorsque pertinents.\
**RG-OBS-028** --- Observability fournit la vue transversale et les
corrélations.\
**RG-OBS-029** --- Aucun fallback silencieux vers des mocks en mode
REAL.\
**RG-OBS-030** --- Toute implémentation commence par l'audit des
capacités existantes.

------------------------------------------------------------------------

# 61. Modèles conceptuels

Selon l'existant :

``` text
ObservabilityAlert
ObservabilityDiagnostic
HealthSnapshot?
ErrorGroup?
Incident?
```

Ne pas créer automatiquement :

``` text
Log
Metric
Trace
```

comme tables Prisma si un backend spécialisé existe ou est préférable.

Avant migration :

``` text
AUDIT
→ IDENTIFY PROVIDERS
→ REUSE EXISTING INFRASTRUCTURE
→ MINIMAL PERSISTENCE
```

------------------------------------------------------------------------

# 62. Tests unitaires

Tester :

-   error normalization ;
-   redaction ;
-   correlation propagation ;
-   health aggregation ;
-   severity mapping ;
-   alert deduplication ;
-   tenant scoping ;
-   filters ;
-   pagination ;
-   metric label validation ;
-   safe diagnostic export.

------------------------------------------------------------------------

# 63. Tests d'intégration

``` text
HTTP Request
→ requestId/correlationId
→ Service
→ Log
→ Error response
```

``` text
Deployment failure
→ Event
→ Observability
→ Alert
→ Dashboard
→ Deep link Deployment
```

``` text
Integration failure
→ Connector diagnostics
→ Observability
→ Alert
```

``` text
Runtime degradation
→ Health
→ Observability
→ Dashboard
```

------------------------------------------------------------------------

# 64. Tests sécurité

Vérifier :

-   Tenant A vs Tenant B ;
-   logs sans permission ;
-   diagnostics sans permission ;
-   secret redaction ;
-   Authorization header redaction ;
-   malicious log payload ;
-   filter injection ;
-   export cross-tenant ;
-   stack trace leakage ;
-   platform logs restricted.

------------------------------------------------------------------------

# 65. E2E principal

``` text
LOGIN
↓
TENANT
↓
DASHBOARD
↓
OBSERVABILITY
↓
PLATFORM HEALTH
↓
OPEN ALERT
↓
DIAGNOSTIC
↓
CORRELATION ID
↓
RELATED LOGS
↓
SOURCE RESOURCE
↓
DEEP LINK MODULE
```

Scénario Runtime :

``` text
DEPLOYMENT
↓
RUNTIME ACTIVATION FAILURE
↓
STRUCTURED ERROR
↓
LOG + CORRELATION
↓
OBSERVABILITY ALERT
↓
DIAGNOSTIC
↓
DEPLOYMENT / RUNTIME DEEP LINK
```

Scénario ERP :

``` text
DOLIBARR UNAVAILABLE
↓
INTEGRATION HUB HEALTH
↓
DEGRADED / UNAVAILABLE
↓
OBSERVABILITY
↓
ALERT
↓
DASHBOARD
```

------------------------------------------------------------------------

# 66. Recette navigateur

Tester :

-   Overview ;
-   Health ;
-   Logs ;
-   Errors ;
-   Metrics ;
-   Alerts ;
-   Diagnostics ;
-   filtres ;
-   période ;
-   correlationId ;
-   deep links ;
-   permission denied ;
-   empty states ;
-   unavailable provider ;
-   partial failures ;
-   Desktop / Tablet / Mobile.

Vérifier console frontend et requêtes réseau.

------------------------------------------------------------------------

# 67. Gap Matrix obligatoire

  Domaine       Exigence CDC         Existant   État   Décision   Tests
  ------------- -------------------- ---------- ------ ---------- -------
  Core          Structured logging   ...        ...    KEEP/...   ...
  Core          Request ID           ...        ...    ...        ...
  Core          Correlation ID       ...        ...    ...        ...
  Health        Liveness             ...        ...    ...        ...
  Health        Readiness            ...        ...    ...        ...
  Health        Dependencies         ...        ...    ...        ...
  Errors        Normalization        ...        ...    ...        ...
  Logs          Search/filter        ...        ...    ...        ...
  Metrics       API/runtime/etc.     ...        ...    ...        ...
  Alerts        Rules/dedup          ...        ...    ...        ...
  Diagnostics   Aggregation          ...        ...    ...        ...
  Security      Redaction            ...        ...    ...        ...
  Security      Tenant/IAM           ...        ...    ...        ...
  Integration   Dashboard            ...        ...    ...        ...
  Integration   Deployment           ...        ...    ...        ...
  Integration   Runtime              ...        ...    ...        ...
  Integration   Automation           ...        ...    ...        ...
  Integration   Data/ERP             ...        ...    ...        ...

Ne jamais déclarer `IMPLEMENT` avant une recherche réelle.

------------------------------------------------------------------------

# 68. Plan d'implémentation recommandé

## Phase 0 --- Audit

Logger, filters, interceptors, health, audit, Runtime diagnostics,
Automation executions, Deployment diagnostics, Integration executions,
frontend errors, providers.

## Phase 1 --- Foundations

requestId, correlationId, structured error model, redaction, log
context.

## Phase 2 --- Health

liveness, readiness, dependency checks, health aggregation.

## Phase 3 --- Logs & Errors

provider, search/filter, error grouping, safe frontend.

## Phase 4 --- Metrics

métriques réellement utiles et supportées.

## Phase 5 --- Alerts

rules minimales, deduplication, lifecycle.

## Phase 6 --- Diagnostics

resource diagnostics, correlation, deep links.

## Phase 7 --- UI

Overview, Health, Logs, Errors, Metrics, Alerts, Diagnostics.

## Phase 8 --- Integrations

Dashboard, Runtime, Deployment, Automation, Data, ERP, Registry.

## Phase 9 --- Security & Performance

IAM, tenant, redaction, retention, pagination, sampling.

## Phase 10 --- Tests

unit, integration, security, E2E, browser recipe.

------------------------------------------------------------------------

# 69. Definition of Done

Le module est DONE uniquement si :

-   l'existant a été audité ;
-   Gap Matrix réalisée ;
-   requestId disponible ;
-   correlationId propagé sur les parcours importants ;
-   erreurs structurées ;
-   secrets redacted ;
-   liveness/readiness distinctes ;
-   health réel ;
-   logs exploitables ;
-   recherche/pagination contrôlées ;
-   métriques réelles uniquement ;
-   alertes réelles et reliées à leurs sources ;
-   diagnostics avec deep links ;
-   Tenant isolation ;
-   IAM ;
-   aucun faux HEALTHY ;
-   aucun faux KPI ;
-   aucun mock silencieux ;
-   erreurs frontend propres ;
-   Dashboard global intégré ;
-   Runtime/Deployment/Automation/Data/ERP/Registry intégrés selon
    capacités réelles ;
-   Observability n'est pas un single point of failure inutile ;
-   frontend/backend builds passent ;
-   tests applicables passent ;
-   recette navigateur réalisée.

------------------------------------------------------------------------

# 70. Principe final

``` text
MODULES
produisent leurs états, événements et erreurs
        ↓
OBSERVABILITY
collecte • corrèle • mesure • détecte • explique
        ↓
DIAGNOSTICS
donne le contexte exploitable
        ↓
OPERATIONS / DASHBOARD
permettent d’identifier et d’ouvrir la vraie source
```

Observability ne doit jamais devenir :

``` text
un second Audit
un second Runtime
un second Deployment Manager
un second Automation Engine
un second Integration Hub
```

La règle reste :

``` text
AUDIT
→ REUSE
→ NORMALIZE
→ CORRELATE
→ OBSERVE
→ DIAGNOSE
→ ALERT
→ TEST
```
