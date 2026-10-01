# CAHIER DES CHARGES --- TECHZONE CLOUD ERP ADAPTER / INTEGRATION HUB

**Version :** 2.0 --- Consolidation et extension\
**Date :** Septembre 2026\
**Projet :** Techzone Cloud\
**Module :** ERP Adapter / Integration Hub\
**Statut :** Spécification fonctionnelle et technique consolidée\
**Principe :** fournir une frontière d'intégration stable, sécurisée,
multi-tenant et observable entre Techzone Cloud et les systèmes
externes, notamment Dolibarr, sans permettre aux modules internes de
contourner l'Integration Hub.

------------------------------------------------------------------------

# 1. Objet

ERP Adapter / Integration Hub constitue la couche d'intégration externe
de Techzone Cloud.

Architecture de référence :

``` text
TECHZONE CLOUD MODULE
        ↓
INTEGRATION CONTRACT
        ↓
INTEGRATION HUB
        ↓
ERP ADAPTER
        ↓
DOLIBARR / EXTERNAL SYSTEM
```

Les modules internes ne doivent pas dépendre directement des détails
techniques de Dolibarr.

L'Integration Hub fournit des contrats stables, des connecteurs, des
mappings, des mécanismes de synchronisation, des commandes, des queries,
des webhooks, de l'idempotence, des retries, des diagnostics et de
l'observabilité.

------------------------------------------------------------------------

# 2. Objectifs

Le module doit permettre de :

-   enregistrer et configurer des connecteurs externes ;
-   intégrer Dolibarr de manière contrôlée ;
-   exposer des capacités d'intégration stables aux modules internes ;
-   définir des Integration Contracts versionnés ;
-   centraliser les mappings entre modèles Techzone Cloud et systèmes
    externes ;
-   exécuter des commandes et queries ;
-   gérer les identifiants locaux/externes ;
-   synchroniser les ressources ;
-   recevoir et traiter des webhooks ;
-   assurer l'idempotence des opérations sensibles ;
-   gérer timeout et retry ;
-   exposer la disponibilité réelle des connecteurs ;
-   produire des diagnostics structurés ;
-   respecter IAM et Tenant Context ;
-   protéger les credentials ;
-   alimenter Audit et Observability ;
-   déclarer les capabilities nécessaires à Pack Manager et Runtime.

------------------------------------------------------------------------

# 3. Principes architecturaux

## 3.1 Frontière obligatoire

Flux autorisé :

``` text
Business Manager / UI Builder / Automation / Data Runtime
                    ↓
          Integration Contract
                    ↓
            Integration Hub
                    ↓
              ERP Adapter
                    ↓
               Dolibarr
```

Flux interdits :

``` text
UI Builder → Dolibarr direct
Automation → Dolibarr direct
Business Manager → Dolibarr direct
Frontend → Dolibarr direct
Data Runtime → Dolibarr direct sans Provider/Integration Contract
```

## 3.2 Pas de duplication métier

L'Integration Hub ne redéfinit pas :

-   les Entities du Business Manager ;
-   les workflows d'Automation ;
-   les UI Actions du UI Builder ;
-   les Packs ;
-   les permissions IAM.

Il fournit la couche de communication et de traduction vers les systèmes
externes.

------------------------------------------------------------------------

# 4. Responsabilités

## Integration Hub

Possède/coordon­ne :

-   Connector Registry ;
-   Integration Contracts ;
-   Connector Capabilities ;
-   mappings ;
-   command/query execution ;
-   External Resource Links ;
-   synchronisation ;
-   webhooks ;
-   idempotence ;
-   retry ;
-   timeout ;
-   health ;
-   diagnostics ;
-   execution history ;
-   observability ;
-   credential references.

## ERP Adapter

Spécialisation pour les ERP, notamment Dolibarr :

-   authentification ERP ;
-   appels API ERP ;
-   mapping ERP ;
-   traduction des erreurs ;
-   capacités ERP ;
-   ressources ERP ;
-   compatibilité/version ERP.

## Business Manager

Reste propriétaire des modèles et événements métier.

## Automation

Reste propriétaire des workflows.

## Data Runtime

Reste propriétaire de l'exécution Data et peut utiliser un ERP Data
Provider reposant sur l'Integration Hub.

------------------------------------------------------------------------

# 5. Architecture fonctionnelle

``` text
API & Intégrations
├── Vue d’ensemble
├── Connecteurs
├── ERP / Dolibarr
├── Synchronisations
├── Webhooks
└── Diagnostics
```

Dans la navigation globale consolidée, on peut séparer UX :

``` text
DONNÉES & INTÉGRATIONS
├── Données
├── ERP / Dolibarr
└── API & Intégrations
```

Éviter de dupliquer les mêmes connecteurs dans plusieurs modules.

------------------------------------------------------------------------

# 6. Connector Registry

Un Connector représente une intégration configurée.

Modèle conceptuel :

``` text
id
tenantId
key
name
type
provider
version
status
capabilities
configurationRef
credentialRef
environment
metadata
createdAt
updatedAt
```

Les champs exacts doivent être adaptés au modèle existant.

------------------------------------------------------------------------

# 7. Types de connecteurs

Exemples conceptuels :

``` text
ERP
CRM
PAYMENT
EMAIL
STORAGE
WEBHOOK
CUSTOM_API
```

Le MVP ERP cible notamment :

``` text
ERP
provider = dolibarr
```

Ne pas annoncer un provider comme supporté sans implémentation réelle.

------------------------------------------------------------------------

# 8. États du connecteur

États conceptuels :

``` text
UNCONFIGURED
CONFIGURED
CHECKING
AVAILABLE
DEGRADED
UNAVAILABLE
DISABLED
ERROR
```

Règles :

-   CONFIGURED ≠ AVAILABLE ;
-   AVAILABLE nécessite une vérification réelle ;
-   aucun badge Healthy/Available ne doit être hardcodé ;
-   DISABLED correspond à un choix explicite.

------------------------------------------------------------------------

# 9. Connector Capabilities

Un connecteur expose des capacités stables.

Exemples Dolibarr :

``` text
customer.read
customer.create
customer.update

product.read
product.create
product.update

order.read
order.create
order.update

invoice.read
invoice.create
invoice.update

payment.read
payment.create

user.read
```

La liste effective doit correspondre aux opérations réellement
supportées.

------------------------------------------------------------------------

# 10. Integration Contract

Un Integration Contract décrit une opération stable consommable par
Techzone Cloud.

Exemple conceptuel :

``` text
key: customer.create
version: 1
connectorType: ERP
provider: dolibarr
inputSchema: ...
outputSchema: ...
requiredCapabilities:
  - customer.create
```

Le contrat doit être :

-   stable ;
-   versionnable ;
-   validable ;
-   découvrable ;
-   indépendant autant que possible des détails internes du fournisseur.

------------------------------------------------------------------------

# 11. Versioning des contrats

Une modification incompatible doit conduire à une nouvelle version du
contrat.

Exemple :

``` text
customer.create@1
customer.create@2
```

Pack Manager/Registry peuvent référencer une version ou une contrainte
compatible selon les règles de la plateforme.

Runtime doit pouvoir résoudre une version exacte publiée.

------------------------------------------------------------------------

# 12. Resource Mapping

Exemples :

``` text
Techzone Customer → Dolibarr ThirdParty
Techzone Product  → Dolibarr Product
Techzone Order    → Dolibarr Customer Order
Techzone Invoice  → Dolibarr Customer Invoice
Techzone Payment  → Dolibarr Payment
Techzone User     → Dolibarr User
```

Le mapping doit être centralisé, versionnable et testable.

------------------------------------------------------------------------

# 13. Field Mapping

Exemple conceptuel :

``` text
Techzone                 Dolibarr
-----------------------------------------
customer.name         → name
customer.email        → email
customer.phone        → phone
customer.address      → address
customer.externalRef  → ref_ext
```

Support possible :

``` text
sourceField
targetField
required
defaultValue
transform
direction
```

Les transformations doivent être contrôlées.

INTERDIT :

``` text
eval()
new Function()
arbitrary JavaScript
```

------------------------------------------------------------------------

# 14. Mapping Direction

Directions possibles :

``` text
LOCAL_TO_EXTERNAL
EXTERNAL_TO_LOCAL
BIDIRECTIONAL
```

Une ressource peut utiliser des mappings distincts selon la direction.

------------------------------------------------------------------------

# 15. External Resource Link

Le système doit conserver la correspondance :

``` text
Local Resource
↔
External Resource
```

Modèle conceptuel :

``` text
id
tenantId
connectorId
resourceType
localId
externalId
externalRef?
lastSyncedAt?
metadata?
```

Une ressource d'un Tenant ne doit jamais être liée au connecteur d'un
autre Tenant.

------------------------------------------------------------------------

# 16. Commands

Une Command modifie potentiellement le système externe.

Exemples :

``` text
customer.create
customer.update
product.create
order.create
invoice.create
payment.create
```

Pipeline :

``` text
AUTH
↓
TENANT
↓
AUTHORIZATION
↓
CONTRACT VALIDATION
↓
CONNECTOR RESOLUTION
↓
CAPABILITY CHECK
↓
INPUT VALIDATION
↓
MAPPING
↓
IDEMPOTENCY
↓
ERP REQUEST
↓
RESPONSE MAPPING
↓
RESOURCE LINK
↓
EVENT / AUDIT / OBSERVABILITY
```

------------------------------------------------------------------------

# 17. Queries

Une Query lit le système externe.

Exemples :

``` text
customer.get
customer.list
product.get
product.list
invoice.get
invoice.list
```

Pipeline :

``` text
AUTH
↓
TENANT
↓
AUTHORIZATION
↓
CONTRACT
↓
CONNECTOR
↓
CAPABILITY
↓
MAPPING
↓
ERP REQUEST
↓
NORMALIZED RESPONSE
```

------------------------------------------------------------------------

# 18. Validation

Avant appel externe :

-   contrat valide ;
-   connector existant ;
-   tenant correct ;
-   connector disponible ;
-   capability disponible ;
-   input conforme ;
-   mapping valide ;
-   credentialRef valide ;
-   destination autorisée.

Les erreurs doivent être détectées le plus tôt possible.

------------------------------------------------------------------------

# 19. Credentials

Les credentials doivent être référencés :

``` text
credentialRef
secretRef
```

Ne jamais stocker/exposer dans :

-   frontend ;
-   Manifest public ;
-   logs ;
-   diagnostics ;
-   audit ;
-   API responses.

Le frontend peut connaître :

``` text
Configured
Missing
Invalid
Unavailable
```

mais jamais la valeur secrète.

------------------------------------------------------------------------

# 20. Dolibarr Adapter

Le Dolibarr Adapter encapsule :

-   base URL enregistrée ;
-   authentification ;
-   headers ;
-   endpoints ;
-   sérialisation ;
-   pagination ;
-   erreurs ;
-   timeouts ;
-   compatibilité ;
-   ressources supportées.

Aucun autre module ne doit connaître les détails techniques de l'API
Dolibarr si le contrat Integration Hub suffit.

------------------------------------------------------------------------

# 21. SSRF Protection

Le backend ne doit pas accepter arbitrairement une URL externe envoyée
par le frontend pour exécuter une requête serveur.

Utiliser uniquement :

``` text
registered connector
→ validated destination
→ controlled adapter
```

Valider :

-   scheme ;
-   host ;
-   destination ;
-   redirects si nécessaire ;
-   réseau privé selon politique.

------------------------------------------------------------------------

# 22. Timeout

Toute requête externe doit avoir un timeout.

Une intégration ne doit jamais bloquer indéfiniment une requête ou un
worker.

Erreur structurée :

``` text
INTEGRATION_TIMEOUT
```

------------------------------------------------------------------------

# 23. Retry

Retry uniquement pour les erreurs potentiellement transitoires :

``` text
timeout
temporary network error
429
selected 5xx
```

Éviter retry automatique pour :

``` text
400
401
403
validation error
business rejection
```

Les règles dépendent du fournisseur et du contrat.

------------------------------------------------------------------------

# 24. Backoff

Lorsque retry est utilisé :

``` text
attempt 1
↓
delay
↓
attempt 2
↓
increased delay
```

Prévoir backoff contrôlé.

Ne pas provoquer une surcharge du système externe.

------------------------------------------------------------------------

# 25. Circuit Breaker

Peut être utilisé si l'infrastructure le justifie.

États conceptuels :

``` text
CLOSED
OPEN
HALF_OPEN
```

Ne pas introduire un circuit breaker complexe si aucun besoin réel n'est
démontré.

------------------------------------------------------------------------

# 26. Idempotence

Obligatoire pour les opérations sensibles/rejouables.

Exemple :

``` text
invoice.create
payment.create
order.create
```

Une même clé d'idempotence ne doit pas créer plusieurs ressources
externes.

Concept :

``` text
tenantId
connectorId
contract
idempotencyKey
requestHash
resultRef
status
```

------------------------------------------------------------------------

# 27. Synchronisation

Modes possibles :

``` text
ON_DEMAND
EVENT_DRIVEN
SCHEDULED
```

Directions :

``` text
PUSH
PULL
BIDIRECTIONAL
```

L'orchestration planifiée appartient à Automation/Scheduler.

Integration Hub fournit les opérations de synchronisation.

------------------------------------------------------------------------

# 28. Sync Job

Conceptuellement :

``` text
id
tenantId
connectorId
resourceType
direction
status
startedAt
completedAt
processed
created
updated
skipped
failed
cursor?
error?
```

Ne pas créer une nouvelle table si Automation/Execution infrastructure
couvre déjà ce besoin.

------------------------------------------------------------------------

# 29. Synchronisation incrémentale

Lorsque l'ERP le permet, privilégier :

``` text
updatedSince
cursor
lastExternalId
lastSyncAt
```

Éviter de recharger systématiquement toutes les ressources.

------------------------------------------------------------------------

# 30. Conflict Detection

Détecter les cas :

``` text
LOCAL_CHANGED
EXTERNAL_CHANGED
BOTH_CHANGED
```

Le conflit ne doit pas être résolu silencieusement.

------------------------------------------------------------------------

# 31. Conflict Strategy

Stratégies possibles, explicites :

``` text
LOCAL_WINS
EXTERNAL_WINS
MANUAL
LATEST_WINS
REJECT
```

La stratégie doit dépendre du type de ressource et de la règle métier.

Éviter `LATEST_WINS` si les horloges/sources ne permettent pas une
décision fiable.

------------------------------------------------------------------------

# 32. Webhooks entrants

Pipeline :

``` text
EXTERNAL SYSTEM
↓
WEBHOOK ENDPOINT
↓
AUTH / SIGNATURE
↓
VALIDATION
↓
DEDUPLICATION
↓
MAPPING
↓
RESOURCE LINK
↓
BUSINESS / PLATFORM EVENT
↓
AUTOMATION
```

Un webhook externe ne doit pas déclencher directement du code
arbitraire.

------------------------------------------------------------------------

# 33. Webhook Security

Prévoir selon fournisseur :

-   signature ;
-   shared secret ;
-   token ;
-   timestamp ;
-   replay protection ;
-   IP policy si applicable.

Ne jamais considérer un webhook valide uniquement parce que son URL est
difficile à deviner.

------------------------------------------------------------------------

# 34. Webhook Deduplication

Conserver si possible :

``` text
providerEventId
connectorId
receivedAt
processedAt
status
```

Un événement rejoué ne doit pas produire plusieurs mutations identiques.

------------------------------------------------------------------------

# 35. Business Events

Business Manager reste propriétaire du contrat des événements métier.

Integration Hub peut produire un événement après une opération externe
réussie.

Exemple :

``` text
integration.customer.synced
```

ou un événement métier enregistré si le contrat Business Manager le
prévoit.

Ne pas inventer deux catalogues concurrents.

------------------------------------------------------------------------

# 36. Automation Integration

Automation utilise des actions enregistrées.

Exemple :

``` text
ERP_CREATE_CUSTOMER
ERP_CREATE_INVOICE
ERP_SYNC_PRODUCT
```

ou les stable keys définies dans Registry.

Workflow :

``` text
Trigger
↓
Automation Action
↓
Integration Contract
↓
Integration Hub
↓
ERP Adapter
```

Aucune logique Dolibarr directe dans le workflow.

------------------------------------------------------------------------

# 37. UI Builder Integration

UI Builder peut configurer une action utilisant une API/Automation
autorisée.

Il ne doit jamais stocker :

-   API token Dolibarr ;
-   URL arbitraire serveur ;
-   credentials ERP.

Flux recommandé :

``` text
UI Action
↓
Official API / Automation
↓
Integration Hub
↓
ERP
```

------------------------------------------------------------------------

# 38. Data Runtime Integration

Pour les données ERP :

``` text
Data Runtime
↓
ERP Data Provider
↓
Integration Contract
↓
Integration Hub
↓
ERP Adapter
↓
Dolibarr
```

Data Runtime ne doit pas connaître les détails Dolibarr.

------------------------------------------------------------------------

# 39. Pack Manager Integration

Pack Manager peut déclarer :

``` text
Connector Requirements
Integration Capabilities
Contract Requirements
```

Exemple :

``` text
integration.connector.dolibarr >= 2
integration.capability.customer.read
integration.capability.invoice.create
```

Ces exigences doivent entrer dans la validation/Manifest.

------------------------------------------------------------------------

# 40. Pack Runtime Integration

À l'activation :

``` text
Pack Runtime
↓
Integration Requirements
↓
Registry / Integration Hub
↓
Compatibility + Availability Check
```

Une capability obligatoire indisponible peut empêcher l'activation ou
dégrader le contexte selon la règle du Pack.

------------------------------------------------------------------------

# 41. Registry Integration

Registry peut indexer :

``` text
Connector Types
Connector Providers
Integration Contracts
Integration Capabilities
Mapping Schemas
Adapter Versions
```

Integration Hub reste propriétaire de leurs implémentations.

Règle :

``` text
REGISTERED ≠ AVAILABLE
```

------------------------------------------------------------------------

# 42. Environment / Deployment Integration

Un Environment peut exposer les connecteurs disponibles.

Avant Deployment :

``` text
Pack Integration Requirements
vs
Environment Connectors
vs
Connector Capabilities
vs
Connector Availability
```

Une dépendance ERP obligatoire indisponible doit être détectée avant
activation lorsque possible.

------------------------------------------------------------------------

# 43. Health

Health doit distinguer :

``` text
Configuration
Credentials
Reachability
Authentication
Provider API
Required Capabilities
```

Exemple :

``` text
Connector          DEGRADED
Configuration      OK
Credentials        OK
Reachability       OK
Authentication     OK
invoice.create     UNAVAILABLE
```

Ne pas réduire cela à un faux badge vert.

------------------------------------------------------------------------

# 44. Diagnostics

Diagnostic structuré :

``` text
connectorId
provider
operation
contract
stage
status
errorCode
message
attempt
duration
correlationId
timestamp
```

Ne jamais exposer credential/token/request secret.

------------------------------------------------------------------------

# 45. Error Model

Catégories :

``` text
CONNECTOR_NOT_FOUND
CONNECTOR_DISABLED
CONNECTOR_UNAVAILABLE
CONNECTOR_AUTH_FAILED
CAPABILITY_UNAVAILABLE
CONTRACT_NOT_FOUND
CONTRACT_INVALID
MAPPING_ERROR
VALIDATION_ERROR
ERP_REQUEST_FAILED
ERP_TIMEOUT
ERP_RATE_LIMITED
ERP_UNAUTHORIZED
ERP_FORBIDDEN
SYNC_ERROR
SYNC_CONFLICT
WEBHOOK_INVALID
WEBHOOK_DUPLICATE
INTEGRATION_INTERNAL_ERROR
```

Adapter aux conventions globales d'erreur.

------------------------------------------------------------------------

# 46. Observability

Chaque opération doit être corrélable avec :

``` text
tenantId
connectorId
contract
operation
resourceType?
localId?
externalId?
requestId
correlationId
duration
status
errorCode?
```

Metrics possibles :

``` text
integration_request_count
integration_success_count
integration_failure_count
integration_duration
integration_retry_count
connector_unavailable_count
webhook_count
webhook_failure_count
```

N'implémenter que si l'infrastructure le supporte.

------------------------------------------------------------------------

# 47. Audit

Auditer les opérations sensibles :

-   connector created ;
-   connector updated ;
-   connector disabled ;
-   credential reference changed ;
-   mapping changed ;
-   manual sync requested ;
-   command executed si pertinent ;
-   webhook configuration changed.

Réutiliser l'Audit existant.

------------------------------------------------------------------------

# 48. IAM

Permissions conceptuelles :

``` text
integration.read
integration.connector.read
integration.connector.create
integration.connector.update
integration.connector.disable
integration.contract.read
integration.mapping.read
integration.mapping.update
integration.execute
integration.sync
integration.webhook.read
integration.webhook.manage
integration.diagnostics.read
```

Réutiliser les permissions existantes avant d'en créer.

------------------------------------------------------------------------

# 49. Multi-Tenant

Isolation stricte.

Tenant A ne peut jamais :

-   lire Connector B ;
-   exécuter une commande via Connector B ;
-   lire ses mappings ;
-   lire ses External Resource Links ;
-   déclencher sa synchronisation ;
-   consulter ses diagnostics ;
-   recevoir ses credentials ;
-   utiliser ses webhooks.

Toutes les références doivent être revalidées côté backend.

------------------------------------------------------------------------

# 50. API conceptuelle

Adapter aux routes existantes.

``` http
GET    /api/integrations
GET    /api/integrations/connectors
POST   /api/integrations/connectors
GET    /api/integrations/connectors/:id
PATCH  /api/integrations/connectors/:id

POST   /api/integrations/connectors/:id/check
GET    /api/integrations/connectors/:id/capabilities

GET    /api/integrations/contracts
GET    /api/integrations/contracts/:key

POST   /api/integrations/commands/:contract
POST   /api/integrations/queries/:contract

GET    /api/integrations/mappings
PATCH  /api/integrations/mappings/:id

POST   /api/integrations/sync
GET    /api/integrations/sync/:id

POST   /api/integrations/webhooks/:connectorKey
GET    /api/integrations/diagnostics
```

Ne pas créer des endpoints en double si une API stable existe déjà.

------------------------------------------------------------------------

# 51. ERP / Dolibarr UI

Vue d'ensemble possible :

``` text
Dolibarr
Status           AVAILABLE
Version          ...
Last check       ...
Capabilities     12 / 13 available
Last sync        ...
Errors           ...
```

Sections :

``` text
Vue d’ensemble
Ressources
Mappings
Synchronisations
Diagnostics
```

Aucun statut fictif.

------------------------------------------------------------------------

# 52. Connectors UI

Liste :

``` text
Connector
Provider
Type
Environment
Status
Capabilities
Last Check
Last Activity
Actions
```

Actions selon permissions :

``` text
Open
Check
Configure
Disable
Diagnostics
```

------------------------------------------------------------------------

# 53. Mapping UI

Permettre :

-   voir source/target ;
-   identifier les champs obligatoires ;
-   configurer mappings autorisés ;
-   valider ;
-   tester avec données non sensibles/contrôlées si infrastructure
    prévue ;
-   versionner si nécessaire.

Ne pas permettre d'exécuter du JavaScript arbitraire.

------------------------------------------------------------------------

# 54. Synchronisation UI

Afficher :

``` text
Resource
Direction
Status
Processed
Created
Updated
Skipped
Failed
Started
Duration
```

Drill-down sur les erreurs.

------------------------------------------------------------------------

# 55. Webhook UI

Afficher :

``` text
Connector
Event
Status
Last Received
Last Success
Failures
```

Ne jamais afficher le secret de signature.

------------------------------------------------------------------------

# 56. Diagnostics UI

Permettre filtres :

``` text
Connector
Provider
Operation
Contract
Status
Error Code
Period
Correlation ID
```

Chaque diagnostic peut deep-linker vers Connector/Sync/Resource
concerné.

------------------------------------------------------------------------

# 57. Dashboard global

Le Dashboard Techzone Cloud peut afficher :

``` text
Connectors
Available
Degraded
Unavailable
Integration errors
Recent synchronization
```

Données réelles uniquement.

Le Dashboard deep-link vers ERP / Integration Hub.

------------------------------------------------------------------------

# 58. UI/UX

Direction :

**Techzone Cloud SaaS B2B 2026**

Principes :

-   interface claire ;
-   cards compactes ;
-   statuts textuels ;
-   tables filtrables ;
-   détails en workspace ;
-   Techzone Blue ;
-   slate clair ;
-   bordures fines ;
-   radius 10--12px ;
-   shadows légères ;
-   responsive ;
-   accessible.

------------------------------------------------------------------------

# 59. États UI

Chaque écran :

``` text
LOADING
LOADED
EMPTY
ERROR
FORBIDDEN
UNAVAILABLE
```

Opérations :

``` text
CHECKING
SYNCING
EXECUTING
RETRYING
```

Ne jamais remplacer une erreur par un mock.

------------------------------------------------------------------------

# 60. Performance

Prévoir :

-   pagination ;
-   cursor sync ;
-   timeout ;
-   connection reuse si supporté ;
-   batch raisonnable ;
-   rate limit awareness ;
-   cache uniquement pour lectures adaptées ;
-   éviter N+1 appels externes.

------------------------------------------------------------------------

# 61. Rate Limits

Respecter les limites du fournisseur externe.

Si 429 :

-   détecter ;
-   ne pas marteler l'API ;
-   retry contrôlé si autorisé ;
-   produire diagnostic.

Ne pas contourner les limites imposées par le fournisseur.

------------------------------------------------------------------------

# 62. Sécurité

Tester :

-   SSRF ;
-   credential exposure ;
-   cross-tenant connector ID ;
-   arbitrary URL ;
-   webhook replay ;
-   invalid signature ;
-   injection mapping ;
-   unauthorized command ;
-   secret in logs ;
-   malicious external payload ;
-   oversized payload ;
-   redirect vers destination non autorisée.

------------------------------------------------------------------------

# 63. Modèles conceptuels

Selon l'existant :

``` text
IntegrationConnector
ConnectorCapability
IntegrationContract
IntegrationMapping
ExternalResourceLink
IntegrationExecution
IntegrationSync
IntegrationWebhookEvent
IntegrationDiagnostic
```

Ne pas créer toutes ces tables automatiquement.

Procédure :

``` text
AUDIT
→ REUSE
→ IDENTIFY GAPS
→ MINIMAL PERSISTENCE
```

------------------------------------------------------------------------

# 64. Business Rules

**RG-INT-001** --- Tout Connector appartient à un Tenant.\
**RG-INT-002** --- Un module interne ne contacte pas directement
Dolibarr lorsque l'Integration Hub couvre l'opération.\
**RG-INT-003** --- CONFIGURED ne signifie pas AVAILABLE.\
**RG-INT-004** --- AVAILABLE doit provenir d'une vérification réelle.\
**RG-INT-005** --- Les credentials ne sont jamais exposés au frontend.\
**RG-INT-006** --- Les destinations externes doivent être enregistrées
et validées.\
**RG-INT-007** --- Le frontend ne fournit pas librement l'URL serveur
d'une requête externe.\
**RG-INT-008** --- Toute opération respecte Tenant Context.\
**RG-INT-009** --- Toute opération sensible respecte IAM.\
**RG-INT-010** --- Les Integration Contracts sont stables et
versionnés.\
**RG-INT-011** --- Les mappings sont centralisés et contrôlés.\
**RG-INT-012** --- Aucun JavaScript arbitraire dans les mappings.\
**RG-INT-013** --- Les commandes sensibles sont idempotentes lorsque
nécessaire.\
**RG-INT-014** --- Les requêtes externes ont un timeout.\
**RG-INT-015** --- Retry ne s'applique qu'aux erreurs adaptées.\
**RG-INT-016** --- Les retries sont bornés.\
**RG-INT-017** --- Les erreurs ERP sont traduites en erreurs
structurées.\
**RG-INT-018** --- Les External Resource Links sont tenant-scoped.\
**RG-INT-019** --- Les conflits de synchronisation ne sont pas résolus
silencieusement.\
**RG-INT-020** --- Les webhooks sont authentifiés/validés selon les
capacités du fournisseur.\
**RG-INT-021** --- Les webhooks rejoués sont dédupliqués lorsque
possible.\
**RG-INT-022** --- Automation passe par les actions/contrats
enregistrés.\
**RG-INT-023** --- Data Runtime utilise un Provider/Contract officiel
pour l'ERP.\
**RG-INT-024** --- Pack Manager peut déclarer des Integration
Requirements sans posséder les connecteurs.\
**RG-INT-025** --- Runtime vérifie les requirements/capabilities au
moment approprié.\
**RG-INT-026** --- Registry référence les capacités mais Integration Hub
reste propriétaire de leur implémentation.\
**RG-INT-027** --- Les logs et diagnostics ne contiennent aucun secret.\
**RG-INT-028** --- Aucun faux statut AVAILABLE n'est autorisé.\
**RG-INT-029** --- Aucun fallback silencieux vers mocks en mode REAL.\
**RG-INT-030** --- Toute évolution commence par un audit de
l'intégration existante.

------------------------------------------------------------------------

# 65. Tests unitaires

Tester :

-   Connector validation ;
-   tenant scope ;
-   status transitions ;
-   capability resolution ;
-   contract validation ;
-   input/output validation ;
-   mapping ;
-   mapping direction ;
-   External Resource Link ;
-   idempotence ;
-   retry ;
-   timeout ;
-   error translation ;
-   webhook validation ;
-   webhook deduplication ;
-   conflict strategy ;
-   credential redaction.

------------------------------------------------------------------------

# 66. Tests d'intégration

``` text
Business/Data/Automation
→ Integration Contract
→ Integration Hub
→ Dolibarr Adapter
```

Tester :

``` text
customer.read
customer.create
product.read
order.create
invoice.create
```

selon capacités réellement implémentées.

Tester aussi :

``` text
Pack Manager
→ Integration Requirements

Deployment
→ Connector availability

Runtime
→ Capability resolution

Registry
→ Connector discovery
```

------------------------------------------------------------------------

# 67. Tests sécurité

Tester :

-   anonymous ;
-   unauthorized ;
-   wrong tenant ;
-   forged connectorId ;
-   forged externalId ;
-   arbitrary destination ;
-   SSRF ;
-   invalid webhook signature ;
-   webhook replay ;
-   credential leakage ;
-   secret leakage logs ;
-   malicious mapping ;
-   malicious ERP payload.

------------------------------------------------------------------------

# 68. E2E principal

``` text
LOGIN
↓
TENANT
↓
ERP / DOLIBARR
↓
SELECT CONNECTOR
↓
CHECK CONNECTION
↓
RESOLVE CAPABILITIES
↓
EXECUTE CONTRACT
↓
MAP REQUEST
↓
DOLIBARR
↓
MAP RESPONSE
↓
RESOURCE LINK
↓
AUDIT / OBSERVABILITY
```

Automation :

``` text
BUSINESS EVENT
↓
WORKFLOW
↓
ERP ACTION
↓
INTEGRATION CONTRACT
↓
DOLIBARR
↓
SUCCESS
```

Data :

``` text
UI
↓
DATA RUNTIME
↓
ERP PROVIDER
↓
INTEGRATION HUB
↓
DOLIBARR
```

------------------------------------------------------------------------

# 69. Recette navigateur

Tester :

-   Integration Overview ;
-   Connectors ;
-   Dolibarr Overview ;
-   Resources ;
-   Mappings ;
-   Synchronisations ;
-   Webhooks ;
-   Diagnostics ;
-   permission denied ;
-   connector unavailable ;
-   invalid credentials ;
-   timeout ;
-   retry ;
-   responsive Desktop/Tablet/Mobile.

Vérifier console et network.

------------------------------------------------------------------------

# 70. Gap Matrix obligatoire

Avant implémentation :

  Domaine       Exigence CDC             Existant   État   Décision   Tests
  ------------- ------------------------ ---------- ------ ---------- -------
  Connector     Registry                 ...        ...    KEEP/...   ...
  Connector     Health                   ...        ...    ...        ...
  Connector     Capabilities             ...        ...    ...        ...
  Contract      Versioning               ...        ...    ...        ...
  Mapping       Resource/Field           ...        ...    ...        ...
  Execution     Commands                 ...        ...    ...        ...
  Execution     Queries                  ...        ...    ...        ...
  Reliability   Timeout/Retry            ...        ...    ...        ...
  Reliability   Idempotency              ...        ...    ...        ...
  Sync          Push/Pull                ...        ...    ...        ...
  Webhooks      Security/Dedup           ...        ...    ...        ...
  Security      SSRF/Credentials         ...        ...    ...        ...
  Integration   Automation               ...        ...    ...        ...
  Integration   Data Runtime             ...        ...    ...        ...
  Integration   Pack/Runtime             ...        ...    ...        ...
  Platform      Registry/Observability   ...        ...    ...        ...
  Security      IAM/Tenant               ...        ...    ...        ...

Ne jamais déclarer `IMPLEMENT` avant une recherche réelle.

------------------------------------------------------------------------

# 71. Plan d'implémentation recommandé

## Phase 0 --- Audit

Connecteurs, APIs Dolibarr, credentials, mappings, services, tests,
health, routes, Prisma.

## Phase 1 --- Connector Core

Registry, tenant, status, credentials, capabilities.

## Phase 2 --- Contracts

Integration Contracts, schemas, validation, versioning.

## Phase 3 --- Dolibarr Adapter

Client contrôlé, resources, pagination, errors, timeout.

## Phase 4 --- Mapping

Resource Mapping, Field Mapping, External Resource Links.

## Phase 5 --- Execution

Commands, Queries, IAM, idempotence, retries.

## Phase 6 --- Synchronization

Push/Pull, incremental sync, conflicts.

## Phase 7 --- Webhooks

Security, validation, deduplication, events.

## Phase 8 --- Integrations

Automation, Data Runtime, Pack Manager, Runtime, Registry, Deployment.

## Phase 9 --- UI

Overview, Connectors, ERP, Mappings, Sync, Webhooks, Diagnostics.

## Phase 10 --- Security & Tests

SSRF, tenant, credentials, builds, E2E, browser recipe.

------------------------------------------------------------------------

# 72. Definition of Done

Le module est DONE uniquement si :

-   l'existant a été audité ;
-   Gap Matrix produite ;
-   Connector Registry réel ;
-   Tenant isolation appliquée ;
-   IAM appliqué ;
-   credentials protégés ;
-   aucune URL externe arbitraire ;
-   SSRF traité ;
-   Dolibarr encapsulé derrière Adapter ;
-   Integration Contracts fonctionnels ;
-   capabilities réelles ;
-   mappings contrôlés ;
-   commands/queries fonctionnelles selon périmètre réel ;
-   External Resource Links cohérents ;
-   timeout réel ;
-   retry contrôlé ;
-   idempotence sur opérations nécessaires ;
-   synchronisation traçable ;
-   conflits non silencieux ;
-   webhooks validés/dédupliqués ;
-   Automation utilise les contrats/actions officiels ;
-   Data Runtime utilise le Provider/Hub officiel ;
-   Pack/Runtime/Registry intégrés ;
-   health/diagnostics réels ;
-   Audit/Observability intégrés ;
-   aucun secret dans logs/API ;
-   aucun faux AVAILABLE ;
-   aucun mock silencieux ;
-   frontend/backend builds passent ;
-   Prisma validate/generate passent si Prisma modifié ;
-   tests applicables passent ;
-   E2E et recette navigateur réalisés.

------------------------------------------------------------------------

# 73. Principe final

``` text
MODULE TECHZONE CLOUD
        ↓
CONTRAT STABLE
        ↓
INTEGRATION HUB
        ↓
ADAPTER FOURNISSEUR
        ↓
SYSTÈME EXTERNE
```

Pour Dolibarr :

``` text
TECHZONE CLOUD
      ↓
INTEGRATION CONTRACT
      ↓
INTEGRATION HUB
      ↓
DOLIBARR ADAPTER
      ↓
DOLIBARR
```

La règle de développement reste :

``` text
AUDIT
→ KEEP
→ FIX
→ COMPLETE
→ ADAPT
→ IMPLEMENT ONLY WHAT IS MISSING
→ SECURE
→ INTEGRATE
→ TEST
```
