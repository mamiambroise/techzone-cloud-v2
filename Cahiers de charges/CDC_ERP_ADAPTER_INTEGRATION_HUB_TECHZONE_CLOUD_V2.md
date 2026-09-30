# CAHIER DES CHARGES --- TECHZONE CLOUD ERP ADAPTER / INTEGRATION HUB

**Version :** 2.0 --- Consolidation et extension\
**Date :** Septembre 2026\
**Projet :** Techzone Cloud\
**Module :** ERP Adapter / Integration Hub\
**Statut :** Spécification fonctionnelle et technique consolidée\
**Principe :** Continuité de l'intégration ERP existante --- aucune
réécriture globale sans audit préalable

------------------------------------------------------------------------

# 1. Objet

ERP Adapter / Integration Hub constitue la frontière contrôlée entre
Techzone Cloud et les systèmes métier externes, notamment Dolibarr. Les
modules internes consomment des contrats d'intégration stables sans
dépendre directement de l'implémentation de l'ERP.

La branche `main` reste canonique. Avant modification : `KEEP`,
`IMPROVE`, `COMPLETE`, `ADAPT` ou `IMPLEMENT`, après audit réel.

# 2. Position dans l'architecture

``` text
Business Manager / UI Builder / Automation / Data Platform
                         ↓
                    Pack Manager
                         ↓
                    Pack Runtime
                         ↓
                  Integration Hub
              ┌──────────┼──────────┐
              ↓          ↓          ↓
         ERP Adapter   APIs     Connectors
              ↓
           Dolibarr
```

**ERP Adapter** est le connecteur spécialisé ERP. **Integration Hub**
fournit les mécanismes génériques de connecteurs, contrats, credentials,
exécution, webhooks, retry, idempotence, erreurs, health et diagnostics.

# 3. Responsabilités

Le module couvre : Connector Registry, Integration Contracts, ERP
Resource/Field Mapping, commandes et requêtes ERP, synchronisation,
webhooks, external IDs, idempotence, retry, timeout, health,
diagnostics, observabilité, audit, sécurité des credentials, traduction
des erreurs et compatibilité des capacités.

Il ne possède pas les Entity Definitions du Business Manager, les pages
du UI Builder, les workflows Automation, la composition des Packs, le
Runtime Context global ni IAM.

# 4. Isolation obligatoire

``` text
Module Techzone
      ↓
Integration Contract
      ↓
Integration Hub
      ↓
ERP Adapter
      ↓
Dolibarr
```

Business Manager, UI Builder, Automation, Data Runtime et Pack Runtime
ne doivent pas créer chacun leur propre client Dolibarr.

# 5. Connector Registry

Connecteurs possibles : `dolibarr`, `email`, `sms`, `payment`,
`storage`, `external-api`.

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
createdAt
updatedAt
```

États proposés : `UNCONFIGURED`, `CONFIGURED`, `CHECKING`, `AVAILABLE`,
`DEGRADED`, `UNAVAILABLE`, `DISABLED`, `ERROR`. Auditer les enums
existants avant ajout.

# 6. Connector Capabilities

Exemples ERP :

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
payment.read
payment.create
user.read
```

Une capability annoncée doit être réellement implémentée.

# 7. Integration Contracts

Exemple :

``` json
{
  "operation": "customer.create",
  "inputSchema": "customer.create.v1",
  "outputSchema": "customer.v1",
  "connector": "dolibarr"
}
```

Les contrats sont stables et versionnables (`customer.create.v1`,
`invoice.create.v1`, etc.) et ne doivent pas exposer inutilement les
détails internes de Dolibarr.

# 8. Resource Mapping

Exemples conceptuels :

``` text
Techzone Cloud       Dolibarr
Customer          ↔  ThirdParty
Product           ↔  Product
Order             ↔  Customer Order
Invoice           ↔  Customer Invoice
Payment           ↔  Payment
User              ↔  User
```

Les correspondances exactes doivent être validées contre l'ERP
réellement utilisé.

# 9. Field Mapping

Exemple :

``` text
customer.name       → name
customer.email      → email
customer.phone      → phone
customer.externalId ← id
```

Le mapping doit être centralisé, versionnable et testable.
Transformations contrôlées : renommage, conversion de type, date, enum,
valeur par défaut et normalisation. Aucun JavaScript arbitraire
provenant du frontend.

# 10. ERP Queries et Commands

Queries : `GET ONE`, `LIST`, `SEARCH`, `FILTER` selon les capacités
réelles.

Commands possibles : création/mise à jour de client, produit, commande,
facture, paiement.

Pipeline Command :

``` text
Authentication
→ Tenant Context
→ Authorization
→ Contract Validation
→ Connector Resolver
→ Mapping
→ Idempotency
→ ERP Request
→ Response Mapping
→ Event / Audit
```

Pipeline Query :

``` text
Authentication
→ Tenant Context
→ Authorization
→ Connector Resolver
→ Query Mapping
→ ERP Request
→ Response Validation
→ Response Mapping
```

# 11. Connector Resolver

Résout le connecteur effectif selon tenant, application, environnement,
connector key, capability requise et configuration. Le frontend ne
choisit jamais arbitrairement une connexion sensible.

# 12. Multi-tenant

Toute configuration spécifique est tenant-scoped. Tenant B ne peut ni
lire, exécuter, tester, modifier ni diagnostiquer le connecteur du
Tenant A.

# 13. Credentials et authentification

Utiliser `credentialRef` / `secretRef`. Aucun mot de passe, token ou API
key en clair dans Manifest, frontend, logs ou diagnostics.

ERP Adapter encapsule l'authentification Dolibarr ; les autres modules
ne connaissent pas ses headers, tokens ou clés.

# 14. Synchronisation

Modes possibles : `ON_DEMAND`, `EVENT_DRIVEN`, `SCHEDULED`.

Directions : `PUSH`, `PULL`, `BIDIRECTIONAL`.

La planification appartient au moteur Automation/Scheduler officiel ;
ERP Adapter exécute l'opération d'intégration.

# 15. External IDs et Sync State

Conserver si nécessaire la relation :

``` text
Techzone Record ID ↔ External ERP ID
```

Ne pas utiliser automatiquement l'ID ERP comme identité interne.

Concept de Sync State :

``` text
localId
externalId
connectorId
resourceType
lastSyncedAt
syncStatus
externalVersion
localVersion
```

# 16. Conflits

Pour sync bidirectionnelle : `LOCAL_CHANGED`, `EXTERNAL_CHANGED`,
`BOTH_CHANGED`.

Stratégies explicites : `LOCAL_WINS`, `EXTERNAL_WINS`, `MANUAL_REVIEW`,
`MERGE_IF_SAFE`. Aucun écrasement silencieux.

# 17. Idempotency

Les commandes rejouables sensibles utilisent une clé d'idempotence
lorsque nécessaire. Un retry de `CreateInvoice` ne doit pas créer deux
factures.

# 18. Retry / Timeout / Resilience

Retry seulement pour erreurs temporaires : timeout, réseau temporaire,
429 et certains 5xx. Pas de retry automatique pour validation,
permission, mapping invalide ou rejet métier.

Politique : `maxAttempts`, `backoff`, `maxDelay`, `retryableErrors`.

Tout appel externe a un timeout. Circuit breaker (`CLOSED`, `OPEN`,
`HALF_OPEN`) seulement si l'infrastructure le justifie. Pas de nouvelle
infrastructure complexe sans audit.

# 19. Rate Limits

Le Hub peut gérer les limites connues du provider : requêtes/minute,
heure, concurrence. Les valeurs proviennent du provider réel.

# 20. Webhooks

``` text
External System
→ Webhook Endpoint
→ Authentication / Signature
→ Payload Validation
→ Deduplication
→ Mapping
→ Business Event
→ Automation
```

Sécurité selon provider : signature, shared secret, token, timestamp
validation, replay protection et éventuellement IP policy.

# 21. Business Events

ERP Adapter peut traduire un événement externe vers un Business Event
Techzone Cloud :

``` text
Dolibarr Invoice Validated
→ ERP Adapter
→ InvoiceValidated
→ Automation
```

Le contrat Business Event reste gouverné par Business Manager.

# 22. Automation Integration

Automation utilise des actions enregistrées, par exemple :

``` text
ERP_CREATE_CUSTOMER
ERP_CREATE_ORDER
ERP_CREATE_INVOICE
ERP_REGISTER_PAYMENT
ERP_SYNC_PRODUCT
```

Les noms finaux suivent le Registry réel. Automation ne contient pas de
logique Dolibarr spécifique.

# 23. Data Runtime Integration

``` text
Data Runtime
→ ERP Data Provider
→ Integration Hub
→ ERP Adapter
→ Dolibarr
```

# 24. Pack Manager Integration

Le Manifest peut déclarer :

``` text
Required Connector
Required Connector Version
Required Capabilities
Optional Connector
```

Exemple :

``` json
{
  "connector": "dolibarr",
  "required": true,
  "capabilities": ["customer.read", "invoice.create"]
}
```

# 25. Pack Runtime Integration

À l'activation, Pack Runtime vérifie les Connector Requirements auprès
du Registry. Une capability obligatoire absente produit une erreur
structurée, par exemple `CONNECTOR_CAPABILITY_MISSING`.

# 26. UI Builder Integration

UI Builder n'appelle jamais Dolibarr directement :

``` text
UI Action
→ Data Runtime / Automation / Backend Contract
→ Integration Hub
→ ERP Adapter
```

# 27. Compatibility Check

Vérifier : existence, enabled/configured, version compatible,
capabilities requises, credentials disponibles et provider joignable.

# 28. Health

Distinguer Configuration Health, Authentication Health, Provider
Reachability et Capability Health.

Exemple :

``` text
Dolibarr

Configuration       VALID
Credentials         VALID
Authentication      PASS
API Reachability    PASS
Customers           AVAILABLE
Invoices            AVAILABLE
Status              AVAILABLE
```

Un service NestJS qui répond ne suffit pas pour déclarer l'ERP
disponible.

# 29. Diagnostics

Cockpit réel :

``` text
Integration Hub

Connectors        3
Available         2
Degraded          1
Unavailable       0

Dolibarr           AVAILABLE
Email              AVAILABLE
Payment            DEGRADED
```

Détail connecteur : status, environment, version, capabilities, dernier
health check, dernière erreur.

Request diagnostics : `traceId`, connector, operation, tenant, duration,
attempts, status, errorCode. Pas de secrets/payloads sensibles par
défaut.

# 30. Error Translation

Exemple :

``` json
{
  "code": "ERP_RESOURCE_NOT_FOUND",
  "message": "ERP resource not found",
  "traceId": "...",
  "connector": "dolibarr"
}
```

Catégories possibles :

``` text
CONNECTOR_NOT_FOUND
CONNECTOR_DISABLED
CONNECTOR_UNAVAILABLE
CONNECTOR_NOT_CONFIGURED
CONNECTOR_AUTH_FAILED
CONNECTOR_TIMEOUT
CONNECTOR_RATE_LIMITED
ERP_VALIDATION_ERROR
ERP_PERMISSION_DENIED
ERP_RESOURCE_NOT_FOUND
ERP_CONFLICT
ERP_OPERATION_FAILED
MAPPING_ERROR
CONTRACT_ERROR
SYNC_ERROR
WEBHOOK_INVALID
```

# 31. Observability

Champs utiles : requestId, traceId, tenantId, userId, applicationId,
packVersionId, connectorId, connectorKey, operation,
externalResourceType, duration, attempt, status, errorCode.

Métriques si l'infrastructure existe :

``` text
integration_requests_total
integration_errors_total
integration_request_duration
integration_retries_total
connector_health
webhook_events_total
webhook_duplicates_total
sync_operations_total
sync_errors_total
```

# 32. Audit

Événements significatifs :

``` text
CONNECTOR_CREATED
CONNECTOR_CONFIGURED
CONNECTOR_ENABLED
CONNECTOR_DISABLED
CONNECTOR_CREDENTIAL_CHANGED
ERP_COMMAND_EXECUTED
SYNC_STARTED
SYNC_COMPLETED
SYNC_FAILED
WEBHOOK_RECEIVED
CONNECTOR_TESTED
```

Aucun secret dans l'audit.

# 33. IAM

Réutiliser IAM existant. Permissions indicatives :

``` text
integration.read
integration.connector.read
integration.connector.create
integration.connector.update
integration.connector.enable
integration.connector.disable
integration.connector.test
integration.diagnostics.read
integration.sync.execute
integration.audit.read
```

Adapter aux permissions réellement présentes.

# 34. Security Pipeline

``` text
Authentication
→ Tenant Context
→ Authorization
→ Integration Contract Validation
→ Connector Resolution
→ Secure Credential Resolution
→ Execution
→ Audit
```

# 35. SSRF et destinations externes

Les appels utilisent des destinations/connecteurs enregistrés. Le
frontend ne peut pas fournir arbitrairement une URL serveur à appeler.

# 36. Payload Validation

Valider types, champs requis, tailles maximales, enums, identifiants et
structures imbriquées.

Masquer password, apiKey, token, authorization header, secret et
credentials dans logs/diagnostics.

# 37. API indicative

Préfixe conceptuel : `/api/integrations`.

``` http
GET    /connectors
GET    /connectors/:id
POST   /connectors
PATCH  /connectors/:id
POST   /connectors/:id/test
POST   /connectors/:id/enable
POST   /connectors/:id/disable
POST   /connectors/:id/execute
```

Un endpoint générique `execute` n'est acceptable qu'avec contrat strict.

Namespace ERP possible : `/api/integrations/erp`, tout en réutilisant
les routes existantes si elles sont stables.

Webhooks conceptuels : `POST /webhooks/:connectorKey/:event`.

Sync conceptuelle :

``` http
POST /connectors/:id/sync
GET  /connectors/:id/sync/status
GET  /connectors/:id/sync/history
```

uniquement si la synchronisation existe réellement.

# 38. Modèle conceptuel

Concepts possibles :

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

Ne pas créer automatiquement toutes ces tables.

# 39. Prisma

Avant migration : lire `schema.prisma`, rechercher
ERP/connectors/integration/external IDs/audit/secrets/configuration,
réutiliser les modèles existants et respecter tenantId, FK, indexes et
uniques.

# 40. Navigation

Proposition :

``` text
API & Intégrations
├── Vue d'ensemble
├── Connecteurs
├── ERP / Dolibarr
├── Synchronisations
├── Webhooks
└── Diagnostics
```

Éviter les écrans dupliqués si ERP / Dolibarr existe déjà ailleurs.

# 41. UI/UX

Design Techzone Cloud partagé : fond slate clair, surfaces blanches,
bleu Techzone, bordures fines, radius 10--12 px, ombres légères, densité
professionnelle, icônes cohérentes.

États UX : Loading, Loaded, Empty, Error, Unauthorized, Forbidden,
Testing, Available, Degraded, Unavailable, Synchronizing, Sync Failed,
Retrying.

Micro-interactions 150--220 ms et `prefers-reduced-motion`.

# 42. Performance

Prévoir connection reuse lorsque sûr, pagination, timeouts, concurrence
contrôlée, cache de métadonnées stables, recherches UI debounced et
diagnostics lazy-loaded.

# 43. Règles de gestion

-   **RG-INT-001** --- Tout connecteur tenant-scoped appartient à un
    tenant.
-   **RG-INT-002** --- Aucun module ne contourne ERP Adapter lorsque
    celui-ci est la couche ERP officielle.
-   **RG-INT-003** --- Les credentials ne sont jamais exposés au
    frontend.
-   **RG-INT-004** --- Les credentials ne sont jamais stockés dans le
    Manifest.
-   **RG-INT-005** --- Toute opération externe respecte un Integration
    Contract.
-   **RG-INT-006** --- Toute entrée externe est validée.
-   **RG-INT-007** --- Toute réponse provider utilisée est normalisée ou
    validée.
-   **RG-INT-008** --- Les mappings sont centralisés et versionnables.
-   **RG-INT-009** --- Le frontend ne choisit pas arbitrairement une
    destination serveur.
-   **RG-INT-010** --- Les erreurs provider sont traduites en erreurs
    structurées.
-   **RG-INT-011** --- Les retries sont limités aux erreurs retryables.
-   **RG-INT-012** --- Les opérations sensibles rejouables sont
    idempotentes lorsque nécessaire.
-   **RG-INT-013** --- Une sync bidirectionnelle définit une stratégie
    de conflit.
-   **RG-INT-014** --- Aucun conflit n'est écrasé silencieusement.
-   **RG-INT-015** --- Les webhooks sont authentifiés lorsque le
    provider le permet.
-   **RG-INT-016** --- Les webhooks sont dédupliqués lorsque nécessaire.
-   **RG-INT-017** --- Les secrets sont masqués dans logs, diagnostics
    et audit.
-   **RG-INT-018** --- IAM reste l'autorité des permissions.
-   **RG-INT-019** --- Tenant Context officiel reste l'autorité du
    tenant.
-   **RG-INT-020** --- Pack Manager déclare les connecteurs/capabilities
    requis.
-   **RG-INT-021** --- Pack Runtime vérifie les capabilities
    obligatoires.
-   **RG-INT-022** --- Data Runtime utilise ERP Adapter pour les
    ressources ERP.
-   **RG-INT-023** --- Automation utilise les actions enregistrées.
-   **RG-INT-024** --- UI Builder ne contient aucun credential ERP.
-   **RG-INT-025** --- AVAILABLE provient d'un contrôle réel.
-   **RG-INT-026** --- Les modifications significatives de credentials
    sont auditées.
-   **RG-INT-027** --- Les external IDs ne remplacent pas
    automatiquement les IDs internes.
-   **RG-INT-028** --- Une capability annoncée est réellement
    implémentée.
-   **RG-INT-029** --- Les opérations externes sont traçables par
    traceId.
-   **RG-INT-030** --- Aucun mock silencieux en mode REAL.

# 44. MVP v2

``` text
1. Audit ERP Adapter existant
2. Audit Integration code
3. Gap Matrix
4. Connector Registry
5. Dolibarr Connector
6. Secure Configuration / Credential References
7. Connector Capabilities
8. Integration Contracts
9. Resource Mapping
10. Field Mapping
11. ERP Query Operations
12. ERP Command Operations
13. Error Translation
14. Timeout
15. Idempotency
16. Retry
17. External Resource Links si nécessaires
18. Automation Integration
19. Data Runtime Integration
20. Pack Manager Requirements
21. Pack Runtime Compatibility
22. Health
23. Diagnostics
24. Audit / Observability
25. Security Tests
26. E2E
```

# 45. Phase 2 et 3

Phase 2 : Scheduled Synchronization, bidirectional sync avancée,
Conflict Management UI, Webhook Registry, Circuit Breaker, rate-limit
avancé, templates, métriques avancées, AI Diagnostics.

Phase 3 : Connector Marketplace, Connector SDK, Partner Connectors,
Event Streaming avancé, distributed workers, multi-region, Integration
Policy Engine.

# 46. Tests

Unitaires : Connector Resolver, Capability Resolver, Contract Validator,
Resource/Field Mapper, Error Translator, Retry Classifier, Idempotency,
Webhook Validator/Deduplication, Sync Conflict Resolver.

Intégration :

``` text
Techzone → ERP Adapter → Dolibarr
Automation → Integration Hub → ERP Adapter
Data Runtime → ERP Provider → ERP Adapter
Pack Manager → Connector Requirements
Pack Runtime → Connector Compatibility
Webhook → Integration Hub → Business Event
```

Sécurité : cross-tenant read/update/execute/diagnostics, unauthorized
configuration/test/sync, credential/token/header leakage, SSRF,
arbitrary URL, malformed payload, webhook replay/signature.

Résilience : ERP unavailable, timeout, auth failure, 429, temporary 5xx,
invalid mapping, duplicate request/webhook, partial sync failure.

# 47. E2E de référence

``` text
LOGIN
  ↓
BUSINESS MANAGER
  ↓
Application / Business Definition
  ↓
AUTOMATION
  ↓
ERP Action
  ↓
PACK MANAGER
  ↓
Connector Requirement
  ↓
Publication
  ↓
PACK RUNTIME
  ↓
Connector Compatibility
  ↓
DATA / AUTOMATION RUNTIME
  ↓
INTEGRATION HUB
  ↓
ERP ADAPTER
  ↓
DOLIBARR
  ↓
Normalized Response
  ↓
Business Event / Audit
  ↓
Techzone Cloud
```

# 48. Gap Matrix obligatoire

  Fonction             Existant    Backend   Frontend   Tests   Décision
  -------------------- ----------- --------- ---------- ------- ----------
  ERP Adapter          À auditer   ---       ---        ---     AUDIT
  Dolibarr Client      À auditer   ---       N/A        ---     AUDIT
  Connector Registry   À auditer   ---       ---        ---     AUDIT
  Capabilities         À auditer   ---       ---        ---     AUDIT
  Contracts            À auditer   ---       ---        ---     AUDIT
  Resource Mapping     À auditer   ---       ---        ---     AUDIT
  Field Mapping        À auditer   ---       ---        ---     AUDIT
  Commands             À auditer   ---       ---        ---     AUDIT
  Queries              À auditer   ---       ---        ---     AUDIT
  Sync                 À auditer   ---       ---        ---     AUDIT
  Webhooks             À auditer   ---       ---        ---     AUDIT
  Idempotency          À auditer   ---       N/A        ---     AUDIT
  Retry                À auditer   ---       N/A        ---     AUDIT
  Health               À auditer   ---       ---        ---     AUDIT
  Diagnostics          À auditer   ---       ---        ---     AUDIT

Ne jamais déclarer `MISSING` avant recherche réelle.

# 49. Instructions Codex / Freebuff

``` text
1. main est la base canonique.
2. Lire tous les CDC ERP Adapter existants.
3. Lire les CDC Integration/API existants.
4. Rechercher tout module ERP Adapter et client Dolibarr.
5. Rechercher routes, mappings, sync, external IDs et webhooks.
6. Rechercher retry, timeout et idempotency.
7. Examiner Business Manager, Automation, Data Platform/Data Runtime,
   Pack Manager, Pack Runtime, IAM, Tenant Context, Audit/Observability.
8. Examiner schema.prisma et les tests.
9. Produire la Gap Matrix.
10. Seulement ensuite coder.
```

Pour le code historique :
`READ → UNDERSTAND → COMPARE → EXTRACT → ADAPT → TEST`. Aucun merge
aveugle d'anciens Guards, IAM, Tenant Context, Prisma, secrets, CORS,
navigation ou architecture incompatible.

# 50. Définition de DONE

``` text
✓ ERP Adapter existant préservé et consolidé
✓ Connector Registry fonctionnel
✓ Dolibarr Connector fonctionnel
✓ Credentials sécurisés
✓ Connector Capabilities réelles
✓ Integration Contracts fonctionnels
✓ Resource et Field Mapping fonctionnels
✓ ERP Queries et Commands fonctionnelles
✓ Error Translation fonctionnelle
✓ Timeouts configurés
✓ Retry contrôlé
✓ Idempotency sur opérations nécessaires
✓ Automation intégré
✓ Data Runtime intégré
✓ Pack Manager intégré
✓ Pack Runtime intégré
✓ Health réel
✓ Diagnostics réels
✓ Tenant Isolation vérifiée
✓ IAM / Audit / Observability vérifiés
✓ Aucun secret exposé
✓ Aucun accès Dolibarr direct non autorisé
✓ Aucun faux statut AVAILABLE
✓ Aucun mock silencieux en REAL mode
✓ Prisma validate/generate PASS
✓ Backend et Frontend build PASS
✓ Tests ERP / Integration / Tenant / Security / Resilience PASS
✓ Recette navigateur PASS
✓ E2E Techzone → ERP Adapter → Dolibarr PASS
```

# 51. Principe produit final

ERP Adapter / Integration Hub est la **frontière d'intégration contrôlée
de Techzone Cloud**.

Chaque intégration doit être :

``` text
contractuelle
sécurisée
tenant-aware
traçable
résiliente
diagnostiquable
```

Le résultat n'est pas seulement un client Dolibarr : c'est une
architecture durable permettant de connecter progressivement d'autres
systèmes sans introduire de dépendances directes dans Business Manager,
UI Builder, Automation, Data Runtime ou Pack Runtime.

------------------------------------------------------------------------

# FIN DU CAHIER DES CHARGES

**Techzone Cloud --- ERP Adapter / Integration Hub v2.0**\
**Consolidation et extension de l'existant**
