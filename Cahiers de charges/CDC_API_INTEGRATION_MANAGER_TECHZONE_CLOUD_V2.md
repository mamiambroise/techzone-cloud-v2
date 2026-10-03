# CAHIER DES CHARGES --- TECHZONE CLOUD API & INTEGRATION MANAGER

**Version :** 2.0 --- Consolidation et extension\
**Date :** Septembre 2026\
**Projet :** Techzone Cloud\
**Module :** API & Integration Manager\
**Statut :** Spécification fonctionnelle et technique consolidée\
**Principe :** gérer l'exposition, la consommation et la gouvernance des
APIs Techzone Cloud sans dupliquer l'ERP Adapter / Integration Hub,
l'IAM, le Registry, l'Automation ou l'Observability.

------------------------------------------------------------------------

# 1. Objet

API & Integration Manager est la couche de **gouvernance et d'exposition
contrôlée des APIs de Techzone Cloud**.

Il répond notamment aux questions :

``` text
Quelles APIs Techzone Cloud sont disponibles ?
Qui peut les consommer ?
Avec quelles permissions ?
Avec quel client ou credential ?
Quelle version d’API est utilisée ?
Quels quotas et limites s’appliquent ?
Quels webhooks sortants sont configurés ?
Comment suivre l’usage, les erreurs et la compatibilité ?
```

Architecture de référence :

``` text
TECHZONE CLOUD MODULES
        ↓
APPLICATION / API CONTRACTS
        ↓
API & INTEGRATION MANAGER
        ↓
AUTHENTICATION • AUTHORIZATION
VERSIONING • CLIENTS • SCOPES
RATE LIMITS • WEBHOOKS • USAGE
        ↓
INTERNAL / PARTNER / EXTERNAL CONSUMERS
```

------------------------------------------------------------------------

# 2. Distinction avec ERP Adapter / Integration Hub

Cette frontière est obligatoire.

## API & Integration Manager

Gère principalement :

-   exposition des APIs Techzone Cloud ;
-   API Catalog ;
-   API Contracts ;
-   API Clients ;
-   credentials techniques ;
-   scopes ;
-   versioning ;
-   API access policies ;
-   quotas ;
-   rate limiting ;
-   API usage ;
-   outbound webhooks ;
-   webhook subscriptions ;
-   Developer/API Portal ;
-   documentation ;
-   API diagnostics.

## ERP Adapter / Integration Hub

Gère principalement :

``` text
Techzone Cloud
→ Integration Contract
→ Integration Hub
→ Adapter
→ External System
```

notamment :

-   Dolibarr ;
-   autres ERP ;
-   connecteurs externes ;
-   mappings ;
-   synchronisations ;
-   External Resource Links ;
-   commandes/queries vers systèmes externes ;
-   webhooks entrants des fournisseurs.

Règle :

``` text
API MANAGER ≠ INTEGRATION HUB
```

Ils peuvent partager Registry, IAM, Observability et conventions de
sécurité, mais ne doivent pas dupliquer leurs responsabilités.

------------------------------------------------------------------------

# 3. Position dans l'architecture globale

``` text
BUSINESS MANAGER
UI BUILDER
AUTOMATION
PACK MANAGER
PACK RUNTIME
DATA RUNTIME
ERP / INTEGRATION HUB
REGISTRY
ENVIRONMENT / DEPLOYMENT
        ↓
APIs INTERNES STABLES
        ↓
API & INTEGRATION MANAGER
        ↓
┌──────────────────────────────┐
│ Internal Clients             │
│ Techzone Applications        │
│ Partner Applications         │
│ Authorized External Clients  │
│ Webhook Subscribers          │
└──────────────────────────────┘
        ↓
OBSERVABILITY & AUDIT
```

------------------------------------------------------------------------

# 4. Principe de continuité

Avant toute création :

``` text
EXISTANT + FONCTIONNEL       → KEEP
EXISTANT + FAIBLE            → IMPROVE
EXISTANT + BUG               → FIX
PARTIEL                      → COMPLETE
ANCIEN MAIS RÉUTILISABLE     → ADAPT
RÉELLEMENT ABSENT            → IMPLEMENT
```

Auditer notamment :

-   routes NestJS ;
-   Swagger/OpenAPI ;
-   guards ;
-   IAM ;
-   API keys éventuelles ;
-   tokens ;
-   OAuth/OIDC éventuel ;
-   CORS ;
-   CSRF ;
-   throttling ;
-   rate limiting ;
-   webhooks ;
-   Registry ;
-   audit ;
-   logs ;
-   correlation IDs ;
-   frontend API clients ;
-   Developer Portal éventuel.

Ne jamais créer un second mécanisme lorsque l'existant est adapté.

------------------------------------------------------------------------

# 5. Responsabilités

API & Integration Manager possède ou coordonne :

``` text
API Catalog
API Definition Metadata
API Version Registry
API Client Management
Machine-to-Machine Access
Scopes
API Access Policies
Rate Limits
Quotas
Usage Metering
Outbound Webhooks
Webhook Subscriptions
API Documentation
Developer Portal
API Diagnostics
API Deprecation
```

Il ne possède pas :

-   les utilisateurs et rôles IAM ;
-   les modèles métier BM ;
-   les workflows Automation ;
-   les connecteurs ERP ;
-   les logs transversaux ;
-   les Packs ;
-   les Runtime Contexts.

------------------------------------------------------------------------

# 6. Navigation

Navigation UX recommandée :

``` text
API & Intégrations
├── Vue d’ensemble
├── Catalogue API
├── Clients API
├── Accès & Scopes
├── Webhooks
├── Usage & Limites
├── Documentation
└── Diagnostics
```

Dans la Sidebar globale :

``` text
DONNÉES & INTÉGRATIONS
├── Données
├── ERP / Dolibarr
└── API & Intégrations
```

Éviter de placer tous les sous-écrans directement dans la Sidebar
globale.

------------------------------------------------------------------------

# 7. Contextes

Les ressources doivent être explicitement scoped.

Exemple :

``` text
Platform
→ Tenant
→ Application
→ API
→ API Version
→ API Client
```

Certaines APIs peuvent être :

``` text
PLATFORM
TENANT
APPLICATION
PUBLIC
INTERNAL
PARTNER
```

La visibilité ne remplace jamais l'autorisation.

------------------------------------------------------------------------

# 8. API Catalog

Le catalogue décrit les APIs réellement disponibles.

Entrée conceptuelle :

``` text
id
key
name
description
ownerModule
basePath
visibility
status
currentVersion
documentationRef
schemaRef
requiredPermissions
requiredScopes
metadata
```

Le catalogue peut s'appuyer sur Registry Platform.

Ne pas créer deux catalogues concurrents.

------------------------------------------------------------------------

# 9. Ownership des APIs

Chaque API doit avoir un propriétaire fonctionnel/technique.

Exemples :

``` text
Business Manager API → Business Manager
Pack API             → Pack Manager
Runtime API          → Pack Runtime
Deployment API       → Deployment Manager
Integration API      → Integration Hub
```

API & Integration Manager gouverne l'exposition mais ne devient pas
propriétaire du comportement métier.

------------------------------------------------------------------------

# 10. API Visibility

Valeurs conceptuelles :

``` text
INTERNAL
TENANT
PARTNER
PUBLIC
```

`PUBLIC` ne signifie pas forcément anonyme.

Exemple :

``` text
PUBLIC + AUTHENTICATED
```

est possible.

------------------------------------------------------------------------

# 11. API Lifecycle

États conceptuels :

``` text
DRAFT
ACTIVE
DEPRECATED
SUNSET
DISABLED
```

Adapter aux conventions existantes.

Une API `DRAFT` ne doit pas être exposée comme stable.

------------------------------------------------------------------------

# 12. Versioning API

Versionner les changements incompatibles.

Exemple :

``` text
/api/v1/...
/api/v2/...
```

ou un mécanisme déjà retenu par le projet.

Principes :

-   version stable ;
-   contrat documenté ;
-   compatibilité contrôlée ;
-   période de dépréciation ;
-   migration explicite ;
-   pas de rupture silencieuse.

------------------------------------------------------------------------

# 13. API Contract

Chaque API exposée doit avoir un contrat clair :

``` text
method
path
version
authentication
authorization
scopes
requestSchema
responseSchema
errorSchema
rateLimitPolicy
owner
```

OpenAPI peut être utilisé lorsque déjà disponible.

------------------------------------------------------------------------

# 14. OpenAPI / Swagger

Techzone Cloud utilisant NestJS, le module doit réutiliser la
documentation OpenAPI/Swagger existante lorsque possible.

Objectifs :

-   endpoints réels ;
-   DTO réels ;
-   paramètres ;
-   réponses ;
-   erreurs ;
-   authentification ;
-   version.

La documentation ne doit pas annoncer des endpoints non implémentés.

------------------------------------------------------------------------

# 15. API Client

Un API Client représente une application/service autorisé à consommer
une API.

Modèle conceptuel :

``` text
id
tenantId?
applicationId?
name
description
clientType
status
credentialType
scopes
allowedApis
allowedOrigins?
rateLimitPolicyId?
expiresAt?
lastUsedAt?
createdBy
createdAt
updatedAt
```

------------------------------------------------------------------------

# 16. Types de clients

Exemples :

``` text
INTERNAL_SERVICE
TENANT_APPLICATION
PARTNER
EXTERNAL_APPLICATION
DEVELOPER
```

N'implémenter que les types réellement nécessaires.

------------------------------------------------------------------------

# 17. Client Status

États conceptuels :

``` text
ACTIVE
DISABLED
EXPIRED
REVOKED
```

Un client révoqué ne doit plus pouvoir s'authentifier.

------------------------------------------------------------------------

# 18. Credentials

Selon l'IAM et l'architecture réelle :

``` text
API_KEY
CLIENT_SECRET
SIGNED_TOKEN
OAUTH_CLIENT
SERVICE_IDENTITY
```

Ne pas imposer OAuth si l'infrastructure ne le supporte pas encore.

Principe :

``` text
USE EXISTING IAM / AUTH FOUNDATION FIRST
```

------------------------------------------------------------------------

# 19. API Keys

Si les API Keys sont supportées :

-   générées de manière cryptographiquement sûre ;
-   affichées en clair uniquement au moment approprié ;
-   stockées sous forme non réversible lorsque possible ;
-   préfixe/identifiant visible ;
-   révocables ;
-   rotatables ;
-   expiration possible ;
-   scopes ;
-   audit.

Exemple UI :

``` text
tz_live_7H3K••••••••••9F
```

Ne jamais permettre de relire la clé complète après création si le
mécanisme choisi ne le nécessite pas.

------------------------------------------------------------------------

# 20. Client Secret

Même principe :

``` text
generate
→ display once
→ hash/store securely
→ rotate
→ revoke
```

Aucun secret en clair dans :

-   logs ;
-   frontend state persistant ;
-   diagnostics ;
-   audit ;
-   export.

------------------------------------------------------------------------

# 21. Rotation

Le système doit permettre, selon credential type :

``` text
Create new credential
→ Grace period if supported
→ Migrate consumer
→ Revoke old credential
```

La rotation ne doit pas nécessiter de supprimer l'API Client.

------------------------------------------------------------------------

# 22. Scopes

Les scopes définissent les capacités techniques accordées à un client.

Exemples :

``` text
business.read
business.write
pack.read
deployment.read
deployment.execute
runtime.read
data.read
integration.execute
```

Réutiliser les permissions/capabilities existantes lorsque pertinent.

Éviter un second vocabulaire IAM incohérent.

------------------------------------------------------------------------

# 23. Permissions vs Scopes

Distinction :

``` text
IAM Permission
→ ce qu’une identité utilisateur/service peut faire dans Techzone Cloud

API Scope
→ ce qu’un credential/client peut demander via l’API
```

L'autorisation effective peut nécessiter :

``` text
Identity Permission
AND
Client Scope
AND
Tenant Context
AND
Resource Policy
```

selon le type d'authentification.

------------------------------------------------------------------------

# 24. Least Privilege

Par défaut :

``` text
NO ACCESS
```

Puis accorder uniquement les scopes nécessaires.

Interdire :

``` text
scope = *
```

comme solution générale, sauf rôle plateforme strictement contrôlé si
réellement nécessaire.

------------------------------------------------------------------------

# 25. Machine-to-Machine

Flux conceptuel :

``` text
SERVICE
↓
CLIENT AUTHENTICATION
↓
CLIENT RESOLUTION
↓
TENANT / APPLICATION CONTEXT
↓
SCOPE CHECK
↓
API POLICY
↓
TARGET API
```

Une identité technique ne doit pas automatiquement disposer des droits
d'un administrateur humain.

------------------------------------------------------------------------

# 26. User Delegated Access

Si un mécanisme délégué existe :

``` text
USER
+
CLIENT
+
SCOPES
+
TENANT
```

doivent être évalués.

Ne pas implémenter un pseudo-OAuth artisanal si aucun besoin ne le
justifie.

------------------------------------------------------------------------

# 27. Authentication

Réutiliser les mécanismes Auth/IAM existants.

Le CDC n'impose pas un protocole unique.

Possibilités selon architecture réelle :

``` text
session
JWT
API key
service credential
OAuth/OIDC
```

Chaque endpoint doit déclarer son mode d'accès.

------------------------------------------------------------------------

# 28. Authorization

Pipeline :

``` text
REQUEST
↓
AUTHENTICATION
↓
CLIENT / IDENTITY
↓
TENANT CONTEXT
↓
API VERSION
↓
SCOPE
↓
IAM / POLICY
↓
RESOURCE AUTHORIZATION
↓
CONTROLLER
```

Le frontend n'est jamais l'autorité.

------------------------------------------------------------------------

# 29. Tenant Isolation

Tenant A ne peut jamais utiliser son credential pour :

-   lire les ressources de Tenant B ;
-   appeler une API scoped Tenant B ;
-   utiliser le Client B ;
-   voir son usage ;
-   voir ses webhooks ;
-   voir ses secrets.

Les IDs fournis par le client doivent être revalidés côté serveur.

------------------------------------------------------------------------

# 30. CORS

CORS doit être explicite.

Pour les clients navigateur :

``` text
allowedOrigins
allowedMethods
allowedHeaders
credentials policy
```

Éviter :

``` text
Access-Control-Allow-Origin: *
```

avec credentials sensibles.

Ne pas confondre CORS et autorisation.

------------------------------------------------------------------------

# 31. CSRF

Les APIs utilisant une authentification basée sur cookies/session
doivent respecter les protections CSRF existantes.

Les APIs M2M avec header credential ne suivent pas nécessairement le
même mécanisme.

Adapter selon Auth/IAM.

------------------------------------------------------------------------

# 32. Rate Limiting

Le système doit pouvoir limiter l'usage.

Dimensions possibles :

``` text
client
tenant
API
route
IP
```

Politique conceptuelle :

``` text
requests
window
burst?
```

Exemple :

``` text
1000 requests / 15 min
```

Les valeurs réelles doivent être configurées, non inventées.

------------------------------------------------------------------------

# 33. Rate Limit Response

En cas de limite atteinte :

``` text
HTTP 429
```

avec informations contrôlées :

``` text
code
message
retryAfter?
requestId
correlationId
```

Ne jamais contourner silencieusement une limite.

------------------------------------------------------------------------

# 34. Quotas

Différence :

``` text
Rate Limit
→ vitesse d’utilisation

Quota
→ volume autorisé sur une période
```

Exemples possibles :

``` text
requests/day
requests/month
webhook deliveries/month
```

Ne mettre en place les quotas que si un besoin produit/billing réel
existe.

------------------------------------------------------------------------

# 35. Usage Metering

Capturer de manière contrôlée :

``` text
tenant
client
API
version
operation
status
timestamp
duration
```

Pour agrégation :

``` text
requestCount
successCount
errorCount
rateLimitedCount
averageDuration
```

Ne pas stocker inutilement les payloads métier.

------------------------------------------------------------------------

# 36. Usage & Billing

API Usage peut alimenter Subscription & Billing lorsque le modèle
commercial le prévoit.

Flux :

``` text
API Usage
↓
Usage Aggregation
↓
Billing Meter
↓
Subscription & Billing
```

API Manager ne calcule pas automatiquement les factures si Billing
possède cette responsabilité.

------------------------------------------------------------------------

# 37. Outbound Webhooks

API & Integration Manager gère les **webhooks sortants Techzone Cloud →
consommateurs autorisés**.

Exemple :

``` text
Techzone Event
↓
Webhook Subscription
↓
Delivery
↓
Partner Endpoint
```

À distinguer des webhooks entrants d'un ERP gérés par Integration Hub.

------------------------------------------------------------------------

# 38. Webhook Subscription

Modèle conceptuel :

``` text
id
tenantId
clientId?
name
endpoint
status
eventTypes
secretRef
headersRef?
retryPolicy
createdAt
updatedAt
```

------------------------------------------------------------------------

# 39. Webhook Events

Les événements disponibles doivent provenir des catalogues officiels.

Exemples :

``` text
pack.published
deployment.succeeded
deployment.failed
workflow.execution.failed
```

Ne pas permettre de s'abonner à un événement inexistant.

Registry/Business Event contracts peuvent servir de source.

------------------------------------------------------------------------

# 40. Webhook Delivery

Pipeline :

``` text
EVENT
↓
SUBSCRIPTION RESOLUTION
↓
PAYLOAD BUILD
↓
SIGNATURE
↓
HTTP DELIVERY
↓
RESULT
↓
RETRY IF ELIGIBLE
↓
AUDIT / OBSERVABILITY
```

------------------------------------------------------------------------

# 41. Webhook Signature

Les webhooks sortants doivent pouvoir être signés.

Concept :

``` text
timestamp
payload
secret
signature
```

Le consommateur peut vérifier l'origine et l'intégrité.

Le secret n'est jamais affiché après création selon le mécanisme retenu.

------------------------------------------------------------------------

# 42. Webhook Replay Protection

Inclure si possible :

``` text
eventId
timestamp
deliveryId
```

Le consommateur peut dédupliquer les événements.

------------------------------------------------------------------------

# 43. Webhook Retry

Retry uniquement pour erreurs adaptées :

``` text
timeout
network error
429
selected 5xx
```

Ne pas retry indéfiniment.

Conserver :

``` text
attempt
status
nextAttemptAt
lastError
```

------------------------------------------------------------------------

# 44. Dead Letter / Failed Delivery

Après épuisement des retries :

``` text
FAILED
```

Le système doit permettre le diagnostic.

Un replay manuel contrôlé peut être proposé.

Il doit respecter IAM et idempotence.

------------------------------------------------------------------------

# 45. Webhook Endpoint Security

Pour éviter SSRF :

-   HTTPS recommandé/obligatoire selon environnement ;
-   destination validée ;
-   schéma contrôlé ;
-   host policy ;
-   protection réseau interne ;
-   redirects contrôlés ;
-   DNS/IP validation selon infrastructure.

Un utilisateur ne doit pas transformer Webhooks en proxy arbitraire.

------------------------------------------------------------------------

# 46. API Deprecation

Une API peut devenir :

``` text
DEPRECATED
```

La documentation doit indiquer :

``` text
replacementVersion
deprecatedAt
sunsetAt?
migrationGuide?
```

Ne pas supprimer brutalement une API stable sans stratégie explicite.

------------------------------------------------------------------------

# 47. Sunset

Lorsqu'une version atteint son sunset :

``` text
ACTIVE
→ DEPRECATED
→ SUNSET
→ DISABLED
```

Les dates doivent être réelles et gérées.

Ne pas afficher une date fictive.

------------------------------------------------------------------------

# 48. Compatibility

API Manager doit pouvoir vérifier :

``` text
Client Requirement
vs
API Version
vs
Scope
vs
Environment
vs
Runtime Capability
```

Registry peut fournir les métadonnées de version/capabilities.

------------------------------------------------------------------------

# 49. Registry Integration

Registry peut indexer :

``` text
API Definitions
API Versions
API Capabilities
Webhook Event Types
Schemas
```

API Manager reste propriétaire de l'exposition et des clients.

Règle :

``` text
REGISTERED ≠ ACTIVE
ACTIVE ≠ AUTHORIZED
```

------------------------------------------------------------------------

# 50. Pack Manager Integration

Un Pack peut déclarer une API requirement ou une capability nécessaire.

Pack Manager ne crée pas les API Clients.

Le Manifest peut contenir des références contrôlées si nécessaire.

------------------------------------------------------------------------

# 51. Pack Runtime Integration

Runtime peut exposer certaines capabilities utilisées par une API.

API Manager ne doit pas contourner Runtime pour exécuter une opération
qui lui appartient.

------------------------------------------------------------------------

# 52. Automation Integration

Automation peut :

-   consommer une API interne via contrat officiel ;
-   produire des événements pour webhooks ;
-   éventuellement déclencher un webhook via une action enregistrée.

Mais API Manager ne devient pas un workflow engine.

------------------------------------------------------------------------

# 53. Integration Hub Integration

Pour appeler un système externe :

``` text
API Request
↓
Business / Data / Automation Service
↓
Integration Contract
↓
Integration Hub
↓
External System
```

API Manager ne doit pas embarquer la logique Dolibarr.

------------------------------------------------------------------------

# 54. Data Platform / Runtime Integration

Les APIs Data doivent passer par les contrats et politiques Data.

Interdit :

``` text
External API
→ arbitrary SQL
```

Flux :

``` text
API
→ Data Contract
→ Data Runtime
→ Provider
```

------------------------------------------------------------------------

# 55. Environment & Deployment

La disponibilité d'une API peut dépendre :

``` text
Environment
Deployment
Runtime
Version
Capabilities
```

Un endpoint ne doit pas être annoncé ACTIVE si sa dépendance obligatoire
n'est pas réellement disponible.

------------------------------------------------------------------------

# 56. Observability

Chaque requête API importante doit pouvoir être observée :

``` text
requestId
correlationId
tenantId?
clientId?
apiKeyPrefix?
api
version
operation
status
duration
errorCode?
```

Ne jamais logger la clé complète ou le secret.

------------------------------------------------------------------------

# 57. API Metrics

Métriques possibles :

``` text
api_request_count
api_success_count
api_error_count
api_request_duration
api_rate_limited_count
api_auth_failure_count
webhook_delivery_count
webhook_failure_count
```

Éviter les labels de haute cardinalité non maîtrisés.

------------------------------------------------------------------------

# 58. Audit

Auditer au minimum :

``` text
API client created
API client updated
API client disabled
credential generated
credential rotated
credential revoked
scope changed
webhook created
webhook updated
webhook disabled
webhook replay requested
API policy changed
```

Ne jamais stocker le secret dans Audit.

------------------------------------------------------------------------

# 59. Diagnostics

Diagnostic API conceptuel :

``` text
API
Version
Client
Authentication
Scope
Tenant
Policy
Rate Limit
Dependency
Result
Request ID
Correlation ID
Error Code
```

Exemple :

``` text
API                deployment.execute
Version            v1
Client             Partner App
Authentication     PASS
Scope              PASS
Tenant             PASS
Rate Limit         PASS
Runtime Dependency UNAVAILABLE
Result             FAILED
```

------------------------------------------------------------------------

# 60. Error Model

Réutiliser le modèle d'erreur plateforme.

Codes possibles :

``` text
API_NOT_FOUND
API_VERSION_UNSUPPORTED
API_DISABLED
API_DEPRECATED
CLIENT_NOT_FOUND
CLIENT_DISABLED
CLIENT_EXPIRED
CREDENTIAL_INVALID
CREDENTIAL_REVOKED
SCOPE_REQUIRED
API_ACCESS_DENIED
TENANT_ACCESS_DENIED
RATE_LIMIT_EXCEEDED
QUOTA_EXCEEDED
WEBHOOK_INVALID
WEBHOOK_DELIVERY_FAILED
WEBHOOK_SIGNATURE_ERROR
DEPENDENCY_UNAVAILABLE
```

------------------------------------------------------------------------

# 61. API Overview UI

Afficher données réelles :

``` text
Active APIs
Deprecated APIs
API Clients
Requests
Error Rate
Rate Limited Requests
Active Webhooks
Failed Deliveries
```

Ne pas afficher un KPI si aucune source réelle n'existe.

------------------------------------------------------------------------

# 62. API Catalog UI

Liste :

``` text
API
Owner
Version
Visibility
Status
Authentication
Documentation
Updated
```

Détail :

``` text
Overview
Endpoints
Schemas
Authentication
Scopes
Versions
Usage
Diagnostics
```

------------------------------------------------------------------------

# 63. API Clients UI

Liste :

``` text
Client
Type
Tenant/Application
Status
Scopes
Last Used
Expires
Actions
```

Workspace :

``` text
Overview
Credentials
Scopes
Allowed APIs
Rate Limits
Usage
Webhooks
Audit
```

------------------------------------------------------------------------

# 64. Credential UI

Lors de la création :

``` text
Credential created successfully.

Copy it now.
It will not be displayed again.
```

Prévoir :

``` text
Copy
Done
```

Puis afficher seulement :

``` text
prefix
createdAt
lastUsedAt
expiresAt
status
```

------------------------------------------------------------------------

# 65. Scope Management UI

Interface claire :

``` text
Business
☑ read
☐ write

Pack
☑ read
☐ publish

Deployment
☑ read
☐ execute
```

Les scopes affichés doivent provenir du catalogue réel.

------------------------------------------------------------------------

# 66. Webhooks UI

Liste :

``` text
Webhook
Endpoint
Events
Status
Last Delivery
Success Rate
Failures
```

Workspace :

``` text
Configuration
Events
Signing
Deliveries
Retries
Diagnostics
```

Le secret complet n'est jamais réaffiché.

------------------------------------------------------------------------

# 67. Usage & Limits UI

Afficher :

``` text
Requests
Success
Errors
Rate Limited
Latency
Quota Usage
```

Filtres :

``` text
Period
API
Version
Client
Status
```

Graphiques uniquement avec données réelles.

------------------------------------------------------------------------

# 68. Documentation / Developer Portal

Le portail développeur peut fournir :

-   API Catalog ;
-   OpenAPI ;
-   endpoints ;
-   exemples de requêtes ;
-   authentification ;
-   scopes ;
-   erreurs ;
-   rate limits ;
-   webhook verification ;
-   versioning ;
-   changelog ;
-   migration guide.

Il ne doit pas afficher les APIs auxquelles le consommateur n'a pas
accès, sauf documentation publique explicitement prévue.

------------------------------------------------------------------------

# 69. Code Examples

Les exemples générés doivent utiliser :

``` text
placeholder
```

pour credentials.

Jamais de vraie clé dans la documentation.

Exemple :

``` text
Authorization: Bearer <YOUR_TOKEN>
```

------------------------------------------------------------------------

# 70. Search

Developer Portal peut rechercher :

``` text
API
endpoint
scope
schema
event
error code
```

Les résultats respectent visibilité et IAM.

------------------------------------------------------------------------

# 71. Dashboard Global Integration

Le Dashboard Techzone Cloud peut agréger :

``` text
API Clients
API Errors
Rate Limited Requests
Failed Webhooks
```

si disponibles.

Chaque widget deep-link vers API & Integration Manager.

------------------------------------------------------------------------

# 72. Sidebar Integration

Navigation globale :

``` text
DONNÉES & INTÉGRATIONS
├── Données
├── ERP / Dolibarr
└── API & Intégrations
```

Éviter :

``` text
API Manager
Integration Manager
Webhook Manager
Developer Portal
```

comme quatre modules globaux séparés si un workspace unique suffit.

------------------------------------------------------------------------

# 73. Security Headers

Réutiliser les protections plateforme pertinentes :

-   HTTPS ;
-   HSTS selon déploiement ;
-   Content-Type correct ;
-   no-sniff ;
-   CORS contrôlé ;
-   cache policy ;
-   CSP pour portail web si applicable.

Adapter à l'infrastructure réelle.

------------------------------------------------------------------------

# 74. Input Validation

Toutes les APIs doivent valider :

``` text
path params
query params
headers
body
content type
payload size
```

Réutiliser DTO/pipes NestJS.

Ne pas accepter des champs inconnus sensibles sans politique explicite.

------------------------------------------------------------------------

# 75. Output Safety

Éviter de retourner :

-   secrets ;
-   password hashes ;
-   internal stack traces ;
-   private connector config ;
-   internal DB fields inutiles.

Les DTO de réponse doivent être contrôlés.

------------------------------------------------------------------------

# 76. Payload Limits

Définir des limites adaptées pour prévenir :

-   mémoire excessive ;
-   upload abusif ;
-   DoS applicatif.

Les uploads importants doivent suivre les mécanismes dédiés de la
plateforme.

------------------------------------------------------------------------

# 77. Pagination

Les endpoints de liste doivent utiliser :

``` text
page/limit
```

ou :

``` text
cursor
```

selon les conventions existantes.

Imposer des limites maximum.

------------------------------------------------------------------------

# 78. Filtering & Sorting

Autoriser uniquement :

``` text
known filters
known sort fields
known operators
```

Ne pas transformer directement une query utilisateur en requête DB
arbitraire.

------------------------------------------------------------------------

# 79. Idempotency

Pour certaines APIs de mutation :

``` text
POST /payments
POST /orders
POST /deployments
```

un mécanisme d'idempotence peut être requis.

Réutiliser les conventions plateforme.

Ne pas appliquer aveuglément l'idempotence à tous les endpoints.

------------------------------------------------------------------------

# 80. Replay Protection

Pour credentials/tokens signés ou webhooks, utiliser les mécanismes
appropriés :

``` text
nonce
timestamp
eventId
token expiry
```

selon protocole.

------------------------------------------------------------------------

# 81. Abuse Protection

Prévoir :

-   rate limits ;
-   auth failure limits ;
-   payload limits ;
-   endpoint-specific limits ;
-   monitoring ;
-   revocation.

Ne pas exposer une API publique sans protections adaptées.

------------------------------------------------------------------------

# 82. API Client Search / Filtering

Permettre :

``` text
status
type
tenant
application
scope
lastUsed
expiration
```

selon permissions.

------------------------------------------------------------------------

# 83. Expiration

Les credentials peuvent avoir :

``` text
expiresAt
```

selon politique.

Un credential expiré :

``` text
→ authentication denied
→ structured error
→ audit/observability
```

------------------------------------------------------------------------

# 84. Revocation

La révocation doit être effective côté backend.

Un credential révoqué ne doit pas continuer à fonctionner à cause d'un
cache obsolète.

Prévoir invalidation.

------------------------------------------------------------------------

# 85. Caching

Cache possible pour :

-   API metadata ;
-   scope definitions ;
-   policy definitions.

Ne pas cacher dangereusement :

-   revocation state ;
-   tenant membership ;
-   critical authorization result

sans invalidation fiable.

------------------------------------------------------------------------

# 86. Developer Self-Service

Selon modèle produit, un utilisateur autorisé peut :

``` text
Create API Client
Select scopes
Generate credential
Read docs
Configure webhook
View usage
Rotate credential
Revoke credential
```

Chaque action respecte permissions et plan d'abonnement éventuel.

------------------------------------------------------------------------

# 87. Subscription & Billing Integration

Le plan peut limiter :

``` text
number of API clients
available scopes/features
monthly API requests
webhooks
retention
```

Mais Subscription & Billing reste propriétaire des plans/entitlements.

API Manager consomme :

``` text
effective entitlements
```

et applique les limites correspondantes.

------------------------------------------------------------------------

# 88. Administration Integration

Administration Platform peut gérer :

-   global API policies ;
-   public API availability ;
-   default rate limits ;
-   credential policies ;
-   webhook security policies.

Administration ne doit pas accéder aux secrets en clair.

------------------------------------------------------------------------

# 89. Persistence conceptuelle

Selon l'existant :

``` text
ApiDefinition
ApiVersion
ApiClient
ApiCredential
ApiClientScope
ApiAccessPolicy
ApiRateLimitPolicy
ApiUsageAggregate
WebhookSubscription
WebhookDelivery
ApiDiagnostic
```

Ne pas créer toutes ces tables automatiquement.

Procédure obligatoire :

``` text
AUDIT
→ MAP EXISTING MODELS
→ REUSE
→ IDENTIFY REAL GAPS
→ MINIMAL SCHEMA CHANGE
```

------------------------------------------------------------------------

# 90. API Credential Storage

Pour une API Key :

``` text
id
clientId
prefix
secretHash
status
createdAt
expiresAt
lastUsedAt
revokedAt
```

Éviter :

``` text
secret = plaintext
```

------------------------------------------------------------------------

# 91. Usage Storage

Éviter de créer une ligne SQL lourde pour chaque requête si
l'infrastructure Observability/Metrics peut gérer ce volume.

Architecture possible :

``` text
Request Metrics
→ Observability
→ Aggregation
→ API Usage Summary
```

Choisir selon volume réel.

------------------------------------------------------------------------

# 92. Webhook Delivery Storage

Conserver ce qui est nécessaire :

``` text
deliveryId
subscriptionId
eventId
status
attempt
responseCode
duration
createdAt
completedAt
errorCode
```

Ne pas stocker des payloads sensibles inutilement.

------------------------------------------------------------------------

# 93. Business Rules

**RG-API-001** --- Toute API exposée possède un owner identifiable.\
**RG-API-002** --- API Manager gouverne l'exposition mais ne prend pas
la logique métier aux modules propriétaires.\
**RG-API-003** --- Integration Hub reste propriétaire des connecteurs
vers systèmes externes.\
**RG-API-004** --- Une API DRAFT n'est pas présentée comme stable.\
**RG-API-005** --- Toute rupture de contrat nécessite une stratégie de
versioning.\
**RG-API-006** --- Une API dépréciée doit être identifiable.\
**RG-API-007** --- Toute API protégée vérifie l'authentification côté
backend.\
**RG-API-008** --- L'autorisation effective respecte scopes, IAM, Tenant
et policies applicables.\
**RG-API-009** --- Le frontend n'est jamais une frontière de sécurité.\
**RG-API-010** --- Les credentials ne sont jamais stockés en clair sans
nécessité cryptographique justifiée.\
**RG-API-011** --- Les credentials complets ne sont jamais écrits dans
les logs.\
**RG-API-012** --- Les credentials sont révocables.\
**RG-API-013** --- La rotation doit être supportée pour les credentials
concernés.\
**RG-API-014** --- Un client DISABLED/REVOKED ne peut plus accéder aux
APIs.\
**RG-API-015** --- Toute ressource Tenant reste strictement
tenant-scoped.\
**RG-API-016** --- CORS ne remplace pas IAM.\
**RG-API-017** --- Les APIs session/cookie respectent les protections
CSRF applicables.\
**RG-API-018** --- Les rate limits sont appliqués côté serveur.\
**RG-API-019** --- Un dépassement de rate limit retourne une erreur
explicite.\
**RG-API-020** --- Les quotas ne sont introduits que s'ils correspondent
à un besoin réel.\
**RG-API-021** --- Les métriques d'usage ne stockent pas inutilement les
données métier.\
**RG-API-022** --- Les webhooks sortants sont signés lorsque la
politique le requiert.\
**RG-API-023** --- Les endpoints webhook sont validés contre SSRF.\
**RG-API-024** --- Les retries webhook sont bornés.\
**RG-API-025** --- Les failed deliveries restent diagnostiquables.\
**RG-API-026** --- Un événement webhook possède un identifiant
permettant la déduplication lorsque possible.\
**RG-API-027** --- Les scopes utilisent un catalogue contrôlé.\
**RG-API-028** --- Les permissions/scopes inconnus sont refusés.\
**RG-API-029** --- Registry peut indexer les APIs sans devenir
propriétaire de leur comportement.\
**RG-API-030** --- OpenAPI/documentation doit refléter les endpoints
réellement disponibles.\
**RG-API-031** --- Les exemples de documentation ne contiennent jamais
de vrais secrets.\
**RG-API-032** --- Les erreurs API sont structurées et corrélables.\
**RG-API-033** --- Les stack traces internes ne sont pas exposées aux
consommateurs non autorisés.\
**RG-API-034** --- Les payloads sont limités et validés.\
**RG-API-035** --- Les listes volumineuses sont paginées.\
**RG-API-036** --- Les filtres et tris utilisent une liste contrôlée.\
**RG-API-037** --- Les mutations sensibles utilisent l'idempotence
lorsque nécessaire.\
**RG-API-038** --- La révocation invalide les caches d'autorisation
concernés.\
**RG-API-039** --- Aucun KPI, usage ou statut n'est inventé en mode
REAL.\
**RG-API-040** --- Aucun fallback silencieux vers mocks en mode REAL.

------------------------------------------------------------------------

# 94. Tests unitaires

Tester :

``` text
API definition validation
API version resolution
client creation
client status
credential generation
credential hash verification
credential revocation
credential expiration
credential rotation
scope validation
authorization
tenant isolation
rate limiting
quota evaluation
usage aggregation
webhook signature
webhook retry
webhook SSRF validation
error normalization
```

------------------------------------------------------------------------

# 95. Tests d'intégration

Scénarios :

``` text
API Client
→ Authentication
→ Scope
→ Tenant
→ Business API
```

``` text
API Client
→ Rate Limit
→ 429
→ Observability
```

``` text
Platform Event
→ Webhook Subscription
→ Signed Delivery
→ Result
```

``` text
API Catalog
→ Registry
→ Documentation
```

``` text
API Request
→ Data Runtime
```

``` text
API Request
→ Integration Hub
→ Dolibarr
```

sans bypass de l'Integration Hub.

------------------------------------------------------------------------

# 96. Tests sécurité

Tester :

-   anonymous access ;
-   invalid key ;
-   expired key ;
-   revoked key ;
-   wrong scope ;
-   wrong Tenant ;
-   forged clientId ;
-   credential brute force protections selon mécanisme ;
-   cross-tenant usage access ;
-   cross-tenant webhook ;
-   SSRF ;
-   localhost/private-network webhook target selon politique ;
-   redirect SSRF ;
-   CORS ;
-   CSRF ;
-   oversized payload ;
-   malicious filters ;
-   secret leakage ;
-   stack trace leakage ;
-   rate limit bypass ;
-   stale credential cache.

------------------------------------------------------------------------

# 97. E2E --- API Client

``` text
LOGIN
↓
TENANT
↓
API & INTÉGRATIONS
↓
CLIENTS API
↓
CREATE CLIENT
↓
SELECT SCOPES
↓
GENERATE CREDENTIAL
↓
COPY ONCE
↓
CALL AUTHORIZED API
↓
AUTHENTICATION
↓
SCOPE CHECK
↓
TENANT CHECK
↓
SUCCESS
↓
USAGE / OBSERVABILITY
```

------------------------------------------------------------------------

# 98. E2E --- Revocation

``` text
ACTIVE CREDENTIAL
↓
API CALL SUCCESS
↓
REVOKE
↓
CACHE INVALIDATION
↓
API CALL
↓
DENIED
↓
AUDIT / OBSERVABILITY
```

------------------------------------------------------------------------

# 99. E2E --- Webhook

``` text
CREATE SUBSCRIPTION
↓
SELECT EVENT
↓
GENERATE SIGNING SECRET
↓
PLATFORM EVENT
↓
SIGNED DELIVERY
↓
REMOTE RESPONSE
↓
DELIVERY HISTORY
↓
OBSERVABILITY
```

Tester aussi timeout → retry → failure.

------------------------------------------------------------------------

# 100. E2E --- Versioning

``` text
CLIENT USES API v1
↓
v2 AVAILABLE
↓
v1 DEPRECATED
↓
DOCUMENTATION / WARNING
↓
CLIENT MIGRATION
↓
v1 SUNSET
```

sans casser silencieusement le client avant la politique prévue.

------------------------------------------------------------------------

# 101. Recette navigateur

Tester :

-   Overview ;
-   API Catalog ;
-   API Detail ;
-   Versions ;
-   API Clients ;
-   Client Detail ;
-   Credential generation ;
-   Credential rotation/revocation ;
-   Scopes ;
-   Rate Limits ;
-   Usage ;
-   Webhooks ;
-   Delivery history ;
-   Documentation ;
-   Diagnostics ;
-   empty states ;
-   permission denied ;
-   unavailable dependency ;
-   responsive Desktop/Tablet/Mobile.

Vérifier console et network.

------------------------------------------------------------------------

# 102. UI/UX

Direction :

**Techzone Cloud Developer & Integration Console 2026**

Principes :

-   interface SaaS B2B professionnelle ;
-   forte lisibilité ;
-   cards compactes ;
-   tables filtrables ;
-   workspaces ;
-   code snippets lisibles ;
-   secrets clairement différenciés ;
-   actions critiques confirmées ;
-   statuts textuels ;
-   Techzone Blue ;
-   fond slate clair ;
-   surfaces blanches ;
-   bordures fines ;
-   radius 10--12px ;
-   ombres discrètes ;
-   responsive ;
-   accessible.

------------------------------------------------------------------------

# 103. États UI

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
GENERATING
ROTATING
REVOKING
CHECKING
DELIVERING
RETRYING
```

Ne jamais simuler une réussite.

------------------------------------------------------------------------

# 104. Accessibilité

Prévoir :

-   clavier ;
-   focus visible ;
-   aria-label ;
-   contrastes ;
-   modales accessibles ;
-   tableaux accessibles ;
-   boutons Copy accessibles ;
-   statut non communiqué uniquement par couleur.

------------------------------------------------------------------------

# 105. Performance

Éviter :

-   rechargement global ;
-   polling permanent ;
-   logs massifs dans UI ;
-   requêtes usage sans agrégation ;
-   chargement de tous les webhooks/deliveries ;
-   N+1.

Utiliser :

-   pagination ;
-   agrégation backend ;
-   lazy details ;
-   debounce ;
-   cache metadata ;
-   invalidation fiable.

------------------------------------------------------------------------

# 106. Gap Matrix obligatoire

  Domaine       Exigence CDC       Existant   État   Décision   Tests
  ------------- ------------------ ---------- ------ ---------- -------
  Catalog       API Registry       ...        ...    KEEP/...   ...
  Contract      OpenAPI/Schema     ...        ...    ...        ...
  Versioning    API versions       ...        ...    ...        ...
  Clients       API Clients        ...        ...    ...        ...
  Credentials   Keys/Secrets       ...        ...    ...        ...
  Security      Scopes             ...        ...    ...        ...
  Security      IAM/Tenant         ...        ...    ...        ...
  Security      CORS/CSRF          ...        ...    ...        ...
  Limits        Rate Limit         ...        ...    ...        ...
  Limits        Quotas             ...        ...    ...        ...
  Usage         Metering           ...        ...    ...        ...
  Webhooks      Subscriptions      ...        ...    ...        ...
  Webhooks      Signing            ...        ...    ...        ...
  Webhooks      Retry              ...        ...    ...        ...
  Webhooks      SSRF               ...        ...    ...        ...
  Docs          Developer Portal   ...        ...    ...        ...
  Integration   Registry           ...        ...    ...        ...
  Integration   Observability      ...        ...    ...        ...
  Integration   Billing            ...        ...    ...        ...
  Integration   Integration Hub    ...        ...    ...        ...

Ne jamais déclarer `IMPLEMENT` avant recherche réelle.

------------------------------------------------------------------------

# 107. Plan d'implémentation recommandé

## Phase 0 --- Audit

Rechercher :

-   APIs existantes ;
-   Swagger/OpenAPI ;
-   guards ;
-   auth ;
-   API key/client mechanisms ;
-   rate limiter ;
-   CORS/CSRF ;
-   Registry ;
-   webhooks ;
-   Observability ;
-   usage/billing ;
-   Prisma ;
-   frontend.

## Phase 1 --- API Catalog

-   ownership ;
-   visibility ;
-   status ;
-   versioning ;
-   documentation metadata ;
-   Registry integration.

## Phase 2 --- API Clients

-   client lifecycle ;
-   Tenant/Application scope ;
-   credentials ;
-   secure storage ;
-   rotation ;
-   revocation.

## Phase 3 --- Authorization

-   scopes ;
-   IAM integration ;
-   Tenant ;
-   API policies ;
-   service identities.

## Phase 4 --- Protection

-   CORS ;
-   CSRF ;
-   payload limits ;
-   rate limiting ;
-   abuse protection.

## Phase 5 --- Usage

-   request metering ;
-   aggregation ;
-   diagnostics ;
-   optional Billing bridge.

## Phase 6 --- Outbound Webhooks

-   subscriptions ;
-   event catalog ;
-   signing ;
-   delivery ;
-   retry ;
-   failed delivery ;
-   SSRF protection.

## Phase 7 --- Documentation

-   OpenAPI ;
-   API Catalog ;
-   auth/scopes ;
-   examples ;
-   errors ;
-   versioning ;
-   Developer Portal.

## Phase 8 --- Platform Integration

-   Registry ;
-   Dashboard ;
-   Observability ;
-   Subscription/Billing ;
-   Administration ;
-   Integration Hub boundary.

## Phase 9 --- UI/UX

-   Overview ;
-   APIs ;
-   Clients ;
-   Credentials ;
-   Scopes ;
-   Webhooks ;
-   Usage ;
-   Documentation ;
-   Diagnostics.

## Phase 10 --- Tests

-   unit ;
-   integration ;
-   security ;
-   E2E ;
-   browser recipe ;
-   non-regression.

------------------------------------------------------------------------

# 108. Non-régression

Vérifier au minimum :

``` text
Authentication
IAM
Tenant Context
Dashboard
Sidebar
Business Manager
UI Builder
Automation
Pack Manager
Pack Runtime
Data Runtime
ERP / Integration Hub
Registry
Environment / Deployment
Observability
```

La mise en place d'API credentials ne doit pas casser l'authentification
utilisateur existante.

------------------------------------------------------------------------

# 109. Definition of Done

Le module est DONE uniquement si :

-   les CDC voisins ont été consultés ;
-   l'existant a été audité ;
-   Gap Matrix réalisée ;
-   API Catalog réel ;
-   ownership défini ;
-   versioning cohérent ;
-   documentation reflète les APIs réelles ;
-   API Clients fonctionnels ;
-   credentials sécurisés ;
-   aucune clé/secrète en clair dans logs ou réponses ultérieures ;
-   rotation/révocation fonctionnelles selon credential type ;
-   scopes contrôlés ;
-   IAM/Tenant appliqués ;
-   CORS/CSRF cohérents ;
-   rate limiting réel ;
-   quotas uniquement s'ils existent réellement ;
-   usage réel ;
-   webhooks sortants sécurisés ;
-   signature/retry/diagnostics réels ;
-   SSRF traité ;
-   Registry intégré ;
-   Observability intégré ;
-   Dashboard intégré lorsque pertinent ;
-   Billing bridge uniquement si supporté ;
-   aucune duplication de l'Integration Hub ;
-   aucun appel Dolibarr direct introduit ;
-   aucun faux KPI ;
-   aucun faux statut ;
-   aucun mock silencieux en REAL ;
-   builds backend/frontend passent ;
-   Prisma validate/generate passent si schéma modifié ;
-   tests applicables passent ;
-   tests sécurité passent ;
-   E2E principal passe ;
-   recette navigateur réalisée.

------------------------------------------------------------------------

# 110. Principe final

La séparation de responsabilité cible est :

``` text
IAM
Qui est l’identité et que peut-elle faire ?
        ↓
API & INTEGRATION MANAGER
Quelles APIs Techzone Cloud peut-elle consommer,
avec quel client, credential, scope et limite ?
        ↓
MODULE PROPRIÉTAIRE
Quelle opération métier est réellement exécutée ?
```

Pour les systèmes externes :

``` text
API CONSUMER
      ↓
TECHZONE CLOUD API
      ↓
BUSINESS / DATA / AUTOMATION
      ↓
INTEGRATION CONTRACT
      ↓
INTEGRATION HUB
      ↓
ERP ADAPTER
      ↓
DOLIBARR
```

Pour les événements sortants :

``` text
TECHZONE CLOUD EVENT
      ↓
API & INTEGRATION MANAGER
      ↓
WEBHOOK SUBSCRIPTION
      ↓
SIGNED DELIVERY
      ↓
AUTHORIZED CONSUMER
```

Règle de développement :

``` text
AUDIT
→ KEEP WHAT WORKS
→ FIX WHAT IS BROKEN
→ COMPLETE WHAT IS PARTIAL
→ IMPLEMENT ONLY WHAT IS MISSING
→ SECURE
→ DOCUMENT
→ OBSERVE
→ TEST
```
