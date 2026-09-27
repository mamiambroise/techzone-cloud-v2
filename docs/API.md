# 📖 Techzone Cloud — Documentation Complète de l'API

Cette documentation constitue le guide de référence complet pour comprendre l'architecture, le cycle de vie et l'ensemble des endpoints de l'API **Techzone Cloud**, depuis le **Socle Platform Foundation**, en passant par le **Pack Intégration**, jusqu'au moteur de **Publication, Release & Déploiement**.

---

## 📑 Table des Matières

1. [Architecture & Cycle de Vie Global](#1-architecture--cycle-de-vie-global)
2. [Conventions Communes](#2-conventions-communes)
   - [Headers Recommandés](#headers-recommandés)
   - [Formats & Codes d'Erreur](#formats--codes-derreur)
3. [Partie 1 : Platform Foundation](#3-partie-1--platform-foundation)
   - [Dashboard & Activité Platform](#31-dashboard--activité-platform)
   - [Applications](#32-applications)
   - [Versions d'Applications](#33-versions-dapplications)
   - [Environnements Platform](#34-environnements-platform)
   - [Contrats](#35-contrats)
   - [Configurations](#36-configurations)
   - [Snapshots](#37-snapshots)
4. [Partie 2 : Pack Intégration](#4-partie-2--pack-intégration)
   - [Connecteurs](#41-connecteurs)
   - [Définitions d'API](#42-définitions-dapi)
   - [Webhooks](#43-webhooks)
   - [Identifiants & Credentials](#44-identifiants--credentials)
   - [Synchronisation](#45-synchronisation)
   - [Diagnostics d'Intégration](#46-diagnostics-dintégration)
5. [Partie 3 : Publication, Release & Déploiement](#5-partie-3--publication-release--déploiement)
   - [Deployment Cockpit & Supervision](#51-deployment-cockpit--supervision)
   - [Gestionnaire de Releases](#52-gestionnaire-de-releases)
   - [Moteur de Déploiement](#53-moteur-de-déploiement)
   - [Gestion des Environnements & Pipeline de Promotion](#54-gestion-des-environnements--pipeline-de-promotion)
   - [Validation & Portes de Déploiement (Gates)](#55-validation--portes-de-déploiement-gates)
   - [Gestionnaire de Rollback](#56-gestionnaire-de-rollback)
   - [Historique & Diagnostics de Déploiement](#57-historique--diagnostics-de-déploiement)

---

## 1. Architecture & Cycle de Vie Global

Le système est architecturé selon une chaîne de valeur continue assurant l'immuabilité, la traçabilité et la robustesse des opérations :

```
┌─────────────────────────────────────────────────────────────┐
│ 1. PLATFORM FOUNDATION                                      │
│    Applications → Versions → Configurations → Contrats     │
│                             ↓                               │
│                         SNAPSHOTS                           │
└─────────────────────────────┬───────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. PACK INTÉGRATION                                         │
│    Connecteurs → APIs → Webhooks → Identifiants → Sync      │
└─────────────────────────────┬───────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. PUBLICATION / RELEASE / DÉPLOIEMENT                      │
│                                                             │
│    RELEASE                                                  │
│    (DRAFT → ASSEMBLING → VALIDATING → READY → APPROVED)     │
│                             ↓                               │
│    VALIDATION GATES (Contrats, Snapshots, Sécurité, Tests)  │
│                             ↓                               │
│    DEPLOYMENT (STANDARD / ROLLING / BLUE_GREEN / CANARY)    │
│                             ↓                               │
│    PIPELINE DE PROMOTION (TEST → STAGING → PRODUCTION)      │
│                             ↓                               │
│    HEALTH CHECK & SURVEILLANCE DRUM / DRIFT                 │
│                             ↓                               │
│    ROLLBACK AUTOMATIQUE OU MANUEL (si incident détecté)     │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Conventions Communes

### Headers Recommandés
| Header | Type | Description |
|---|---|---|
| `Content-Type` | `application/json` | Obligatoire pour toutes les requêtes avec corps (`POST`, `PATCH`, `PUT`). |
| `x-trace-id` | `string` | Identifiant optionnel de trace distribuée pour corréler les logs et événements. |
| `x-idempotency-key` | `string` | Clé d'idempotence optionnelle (ou passée dans le payload `idempotencyKey`). |

### Formats & Codes d'Erreur
Les réponses d'erreur respectent la structure standard NestJS :

```json
{
  "statusCode": 409,
  "errorCode": "DEP_CONCURRENCY_CONFLICT",
  "message": "An active deployment (status: RUNNING) is already executing on environment \"env-prod-id\"",
  "timestamp": "2026-09-05T08:00:00.000Z",
  "path": "/api/deployments"
}
```

---

## 3. Partie 1 : Platform Foundation

### 3.1 Dashboard & Activité Platform

#### `GET /api/platform/dashboard`
Retourne une vue synthétique des ressources de la plateforme.
- **Réponse type (200 OK)** :
```json
{
  "applicationsCount": 4,
  "versionsCount": 8,
  "environmentsCount": 4,
  "contractsCount": 6,
  "configurationsCount": 12,
  "snapshotsCount": 5
}
```

#### `GET /api/platform/activity`
Journal d'activité récent des modifications d'états (applications, versions, configurations, contrats).
- **Réponse type (200 OK)** :
```json
[
  {
    "id": "act-uuid-1",
    "entity": "APPLICATION",
    "action": "CREATED",
    "timestamp": "2026-09-05T07:30:00.000Z"
  }
]
```

---

### 3.2 Applications

Gère le catalogue applicatif de Techzone Cloud.

#### `GET /api/platform/applications`
Liste toutes les applications enregistrées.
- **Réponse type (200 OK)** :
```json
[
  {
    "id": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    "code": "app-orders",
    "name": "Order Management Service",
    "description": "Handles eCommerce customer orders and payments",
    "status": "ACTIVE",
    "createdAt": "2026-09-05T00:00:00.000Z",
    "updatedAt": "2026-09-05T00:00:00.000Z"
  }
]
```

#### `POST /api/platform/applications`
Crée une nouvelle application.
- **Payload (CreateApplicationDto)** :
```json
{
  "code": "app-inventory",
  "name": "Inventory Management Service",
  "description": "Stock control, reservations and warehouses"
}
```
- **Réponse (201 Created)** : Objet `Application` créé avec statut initial `ACTIVE`.

#### `GET /api/platform/applications/:id`
Récupère les détails d'une application par son identifiant UUID.
- **Paramètre URL** : `:id` (UUID)

#### `PATCH /api/platform/applications/:id`
Met à jour les informations d'une application.
- **Payload (UpdateApplicationDto)** :
```json
{
  "name": "Inventory & Logistics Service",
  "description": "Updated service description",
  "status": "ACTIVE"
}
```

#### `POST /api/platform/applications/:id/archive`
Archive l'application (bascule le statut à `ARCHIVED`).

---

### 3.3 Versions d'Applications

#### `GET /api/platform/applications/:id/versions`
Liste les versions associées à une application spécifique.

#### `GET /api/platform/versions`
Liste l'ensemble des versions applicatives.

#### `POST /api/platform/applications/:id/versions`
Enregistre une nouvelle version pour l'application cible.
- **Payload (CreateApplicationVersionDto)** :
```json
{
  "version": "1.2.0",
  "description": "Sprint 42 feature release",
  "changelog": "- Add support for instant SEPA payments\n- Fix cart expiration bug"
}
```
- **Réponse (201 Created)** : Objet `ApplicationVersion` avec statut `DRAFT`.

#### `GET /api/platform/versions/:id`
Récupère une version d'application par son UUID.

#### `PATCH /api/platform/versions/:id`
Met à jour une version d'application.
- **Payload (UpdateApplicationVersionDto)** :
```json
{
  "description": "Updated notes",
  "changelog": "Revised release changelog notes",
  "status": "ACTIVE"
}
```

#### `POST /api/platform/versions/:id/clone`
Clone une version existante pour préparer une itération mineure.

---

### 3.4 Environnements Platform

#### `GET /api/platform/environments`
Liste les environnements définis (`DEVELOPMENT`, `TEST`, `STAGING`, `PRODUCTION`).

#### `POST /api/platform/environments`
Crée un nouvel environnement.
- **Payload (CreateEnvironmentDto)** :
```json
{
  "code": "env-uat",
  "name": "User Acceptance Testing",
  "type": "STAGING",
  "description": "Customer verification and validation platform"
}
```

#### `GET /api/platform/environments/:id`
Détails d'un environnement.

#### `PATCH /api/platform/environments/:id`
Met à jour un environnement.
- **Payload (UpdateEnvironmentDto)** :
```json
{
  "name": "Pre-Production UAT",
  "status": "ACTIVE"
}
```

#### `GET /api/platform/environments/:id/history`
Historique d'audit des modifications de l'environnement.

---

### 3.5 Contrats

Gère les contrats d'interfaces (API Schemas, règles de compatibilité).

#### `GET /api/platform/contracts`
Liste l'ensemble des contrats enregistrés.

#### `POST /api/platform/contracts`
Crée un contrat d'interface.
- **Payload (CreateContractDto)** :
```json
{
  "code": "contract-order-events",
  "name": "Order Domain Event Specifications",
  "version": "1.0.0",
  "type": "EVENT_SCHEMA",
  "schema": {
    "type": "object",
    "required": ["orderId", "amount", "currency"],
    "properties": {
      "orderId": { "type": "string" },
      "amount": { "type": "number" },
      "currency": { "type": "string", "enum": ["EUR", "USD"] }
    }
  },
  "rules": {
    "backwardCompatible": true
  }
}
```

#### `POST /api/platform/contracts/:id/validate`
Valide la conformité syntaxique et structurelle du contrat (statut passe à `ACTIVE`).

#### `POST /api/platform/contracts/:id/lock`
Verrouille le contrat pour le figer (statut passe à `LOCKED`).

#### `GET /api/platform/contracts/:id/compatibility`
Analyse et vérifie la rétrocompatibilité du contrat face aux versions antérieures.

---

### 3.6 Configurations

Gère les paramètres applicatifs hiérarchiques (`GLOBAL`, `ENVIRONMENT`, `APPLICATION`, `APPLICATION_VERSION`).

#### `GET /api/platform/config`
Liste toutes les configurations.

#### `GET /api/platform/config/effective/:applicationId/:applicationVersionId/:environmentId`
Résout la configuration finale appliquée (cascade d'héritage : Global $\rightarrow$ Environment $\rightarrow$ Application $\rightarrow$ Version).

#### `POST /api/platform/config`
Crée une clé de configuration.
- **Payload (CreateConfigurationDto)** :
```json
{
  "scope": "ENVIRONMENT",
  "scopeId": "550e8400-e29b-41d4-a716-446655440000",
  "key": "DATABASE_MAX_POOL_SIZE",
  "value": 50,
  "isSecret": false
}
```

#### `PATCH /api/platform/config/:id`
Met à jour la valeur d'une configuration.

#### `POST /api/platform/config/:id/activate`
Active la configuration.

---

### 3.7 Snapshots

Capture un état complet cohérent et immuable de l'application (Application + Version + Configuration + Environnement).

#### `POST /api/platform/snapshots`
Prend un snapshot immuable.
- **Payload (CreateSnapshotDto)** :
```json
{
  "applicationId": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
  "applicationVersionId": "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e",
  "configurationVersion": "1.0.0",
  "environmentId": "e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b",
  "metadata": {
    "gitCommit": "8f3ab20",
    "builtBy": "github-actions"
  }
}
```

#### `GET /api/platform/snapshots/compare?left=UUID_1&right=UUID_2`
Compare deux snapshots et retourne la matrice différentielle des configurations et versions.

#### `POST /api/platform/snapshots/:id/validate`
Valide le snapshot pour confirmer sa complétude.

#### `POST /api/platform/snapshots/:id/activate`
Active le snapshot pour le rendre éligible à la release.

---

## 4. Partie 2 : Pack Intégration

### 4.1 Connecteurs

#### `GET /api/integration/connectors`
Liste les connecteurs tiers (REST, GraphQL, DB, Message Brokers).

#### `POST /api/integration/connectors`
Crée un connecteur d'intégration.
- **Payload (CreateConnectorDto)** :
```json
{
  "code": "conn-stripe-billing",
  "name": "Stripe Payment Gateway",
  "type": "REST",
  "category": "PAYMENT",
  "description": "Integration connector for Stripe Checkout and subscriptions",
  "config": {
    "baseUrl": "https://api.stripe.com/v1",
    "timeoutMs": 5000,
    "maxRetries": 3
  }
}
```

#### `POST /api/integration/connectors/:id/test`
Exécute un test de connectivité réel ou simulé.
- **Réponse (200 OK)** :
```json
{
  "status": "HEALTHY",
  "latencyMs": 42,
  "timestamp": "2026-09-05T08:00:00.000Z"
}
```

---

### 4.2 Définitions d'API

#### `POST /api/integration/apis`
Enregistre un contrat OpenAPI ou REST.
- **Payload (CreateApiDefinitionDto)** :
```json
{
  "apiCode": "api-orders-v1",
  "version": "1.0.0",
  "basePath": "/v1/orders",
  "authentication": "BEARER",
  "operations": {
    "createOrder": {
      "method": "POST",
      "path": "/"
    },
    "getOrder": {
      "method": "GET",
      "path": "/:id"
    }
  }
}
```

---

### 4.3 Webhooks

#### `POST /api/integration/webhooks`
Enregistre un webhook entrant ou sortant.
- **Payload (CreateWebhookDto)** :
```json
{
  "code": "wh-payment-succeeded",
  "direction": "INBOUND",
  "event": "payment.succeeded",
  "endpoint": "https://cloud.techzone.internal/api/webhooks/payments",
  "retryPolicy": {
    "maxAttempts": 5,
    "backoffMultiplier": 2
  }
}
```

#### `POST /api/integration/webhooks/:id/deliveries`
Simule ou déclenche une livraison de webhook avec capture des métriques et idempotence.

---

### 4.4 Identifiants & Credentials

#### `POST /api/integration/credentials`
Enregistre des secrets de connexion chiffrés.
- **Payload (CreateCredentialDto)** :
```json
{
  "name": "stripe-live-secret-key",
  "type": "API_KEY",
  "secretValue": "sk_live_994821039481023",
  "scope": "PAYMENTS"
}
```

---

### 4.5 Synchronisation

#### `POST /api/integration/sync`
Planifie une tâche de synchronisation entre deux systèmes.
- **Payload (CreateSyncDto)** :
```json
{
  "connectorId": "conn-uuid-1",
  "direction": "BIDIRECTIONAL",
  "mode": "INCREMENTAL",
  "schedule": "0 */15 * * * *"
}
```

#### `POST /api/integration/sync/:id/run`
Déclenche immédiatement l'exécution d'un job de synchronisation.

---

### 4.6 Diagnostics d'Intégration

#### `GET /api/integration/diagnostics`
Retourne les métriques de résilience, taux de succès des webhooks, circuits breakers et synchronisations en échec.

---

## 5. Partie 3 : Publication, Release & Déploiement

### 5.1 Deployment Cockpit & Supervision

Le Cockpit offre une vue panoramique temps réel de l'état opérationnel des releases, des pipelines de déploiement et de la santé des environnements.

#### `GET /api/deployment/dashboard` (ou `/api/deployment/cockpit`)
Retourne l'agrégation complète pour le tableau de bord des opérations.
- **Réponse (200 OK)** :
```json
{
  "kpis": {
    "releasesReady": 3,
    "deploymentsRunning": 0,
    "deploymentsToday": 4,
    "successRate": 98,
    "failedDeployments": 0,
    "rollbackCount": 1,
    "productionStatus": "HEALTHY",
    "attentionRequired": false
  },
  "recentReleases": [
    {
      "id": "rel-uuid-1",
      "code": "rel-orders-v1.1.0",
      "version": "1.1.0",
      "status": "APPROVED",
      "createdAt": "2026-09-05T06:00:00.000Z"
    }
  ],
  "runningDeployments": [],
  "environments": [
    {
      "environmentId": "env-prod-id",
      "healthStatus": "HEALTHY",
      "status": "ACTIVE"
    }
  ],
  "gatesSummary": {
    "total": 12,
    "passed": 12,
    "failed": 0,
    "skipped": 0
  },
  "productionHealth": {
    "status": "HEALTHY",
    "activeDeployments": 1,
    "lastVerifiedAt": "2026-09-05T08:00:00.000Z"
  },
  "rollbacks": [],
  "activity": [],
  "incidents": []
}
```

#### `GET /api/releases/recent?limit=10`
Liste les releases récemment générées avec leurs applications et snapshots liés.

#### `GET /api/deployments/running`
Liste tous les déploiements en cours d'exécution active (`PENDING`, `RUNNING`, `VERIFYING`).

#### `GET /api/deployments/activity?limit=20`
Flux continu d'événements d'audit des déploiements.

#### `GET /api/deployment/health`
Bilan de santé des environnements et de l'infrastructure de déploiement.

---

### 5.2 Gestionnaire de Releases

Gère le cycle de vie immuable des releases applicatives :
`DRAFT` $\rightarrow$ `ASSEMBLING` $\rightarrow$ `VALIDATING` $\rightarrow$ `READY` $\rightarrow$ `APPROVED` $\rightarrow$ `RELEASED` $\rightarrow$ `ARCHIVED`.

#### `GET /api/releases`
Recherche et liste les releases.
- **Paramètres Query (optionnels)** :
  - `applicationId` : Filtrer par identifiant d'application
  - `status` : Filtrer par statut (`DRAFT`, `READY`, `APPROVED`, `RELEASED`, etc.)
  - `version` : Filtrer par version exacte

#### `POST /api/releases`
Crée une nouvelle release à l'état initial `DRAFT`.
- **Payload (CreateReleaseDto)** :
```json
{
  "code": "rel-app-orders-1.2.0",
  "version": "1.2.0",
  "applicationId": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
  "applicationVersionId": "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e",
  "snapshotId": "c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f",
  "configurationVersion": "1.2.0",
  "createdBy": "release-engineer@techzone.io",
  "artifactRefs": {
    "containerImage": "registry.techzone.internal/app-orders:1.2.0",
    "digest": "sha256:d83921820491823091823019283019283"
  },
  "contractVersions": {
    "contract-order-events": "1.0.0"
  }
}
```
- **Réponse (201 Created)** :
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440001",
  "code": "rel-app-orders-1.2.0",
  "version": "1.2.0",
  "status": "DRAFT",
  "applicationId": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
  "createdAt": "2026-09-05T08:05:00.000Z"
}
```

#### `GET /api/releases/:id`
Récupère les métadonnées complètes d'une release avec ses relations (Application, Version, Snapshot, Déploiements).

#### `POST /api/releases/:id/assemble`
Assemble les artefacts, vérifie les dépendances et résout les contrats d'interface.
- **Transition d'état** : `DRAFT` $\rightarrow$ `ASSEMBLING`
- **Réponse (200 OK)** : Objet `Release` mis à jour.

#### `POST /api/releases/:id/validate`
Valide l'intégrité de la release assemblée (contrôle des digests, conformité des configurations).
- **Transition d'état** : `ASSEMBLING` $\rightarrow$ `READY`
- **Réponse (200 OK)** : Objet `Release` avec statut `READY`.

#### `POST /api/releases/:id/approve`
Approbation formelle requise pour rendre la release déployable en production.
- **Payload (ApproveReleaseDto)** :
```json
{
  "approvedBy": "qa-director@techzone.io",
  "notes": "E2E automated test suites passed with 100% success rate."
}
```
- **Transition d'état** : `READY` $\rightarrow$ `APPROVED`

#### `POST /api/releases/:id/publish`
Déclare officiellement la release comme publiée dans le catalogue.
- **Transition d'état** : `APPROVED` $\rightarrow$ `RELEASED`

#### `POST /api/releases/:id/archive`
Archive une release obsolète.
- **Transition d'état** : $\rightarrow$ `ARCHIVED`

#### `GET /api/releases/compare?release1=:id1&release2=:id2`
Analyse comparative différentielle entre deux releases.
- **Réponse (200 OK)** :
```json
{
  "release1": { "id": "rel-1", "version": "1.1.0" },
  "release2": { "id": "rel-2", "version": "1.2.0" },
  "differences": {
    "version": { "old": "1.1.0", "new": "1.2.0" },
    "snapshotChanged": true,
    "containerImage": {
      "old": "registry.techzone.internal/app-orders:1.1.0",
      "new": "registry.techzone.internal/app-orders:1.2.0"
    },
    "contractsChanged": {
      "contract-order-events": { "old": "0.9.0", "new": "1.0.0" }
    }
  }
}
```

---

### 5.3 Moteur de Déploiement

Exécute le déploiement physique ou virtuel d'une release sur un environnement cible avec vérification des verrous, gestion de l'idempotence et déclenchement automatique des gates.

#### `GET /api/deployments`
Recherche dans les déploiements.
- **Paramètres Query (optionnels)** :
  - `environmentId` : Filtrer par environnement
  - `releaseId` : Filtrer par release
  - `status` : `PENDING`, `RUNNING`, `VERIFYING`, `SUCCEEDED`, `FAILED`, `CANCELLED`
  - `strategy` : `STANDARD`, `ROLLING`, `BLUE_GREEN`, `CANARY`

#### `POST /api/deployments`
Initie l'exécution d'un déploiement.
- **Contrôles préalables automatiques** :
  1. La release doit être en statut `APPROVED` ou `RELEASED`.
  2. L'environnement cible ne doit pas être `LOCKED` (verrouillé).
  3. Aucun déploiement concurrent actif ne doit être en cours sur cet environnement.
  4. Respect de l'idempotence si une clé `idempotencyKey` identique a déjà été traitée.
- **Payload (CreateDeploymentDto)** :
```json
{
  "releaseId": "770e8400-e29b-41d4-a716-446655440001",
  "environmentId": "e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b",
  "strategy": "BLUE_GREEN",
  "idempotencyKey": "deploy-orders-prod-20260905-01",
  "startedBy": "ci-cd-runner@techzone.io"
}
```
- **Réponse (201 Created)** :
```json
{
  "id": "dep-uuid-99",
  "releaseId": "770e8400-e29b-41d4-a716-446655440001",
  "environmentId": "e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b",
  "status": "SUCCEEDED",
  "strategy": "BLUE_GREEN",
  "healthStatus": "HEALTHY",
  "startedBy": "ci-cd-runner@techzone.io",
  "startedAt": "2026-09-05T08:10:00.000Z",
  "finishedAt": "2026-09-05T08:10:05.000Z",
  "gates": [
    {
      "name": "Contract Compatibility Gate",
      "type": "CONTRACT_COMPATIBILITY",
      "result": "PASSED"
    },
    {
      "name": "Snapshot Integrity Gate",
      "type": "SNAPSHOT_VALID",
      "result": "PASSED"
    }
  ]
}
```

#### `GET /api/deployments/:id`
Récupère les détails exhaustifs d'un déploiement avec ses portes de validation (`gates`), les rollbacks éventuels et la trace d'exécution.

#### `POST /api/deployments/:id/verify`
Déclenche une vérification de santé post-déploiement.
- **Payload (VerifyDeploymentDto)** :
```json
{
  "verifiedBy": "health-probe-worker"
}
```
- **Réponse (200 OK)** : Retourne le déploiement mis à jour avec `healthStatus: "HEALTHY"`.

#### `POST /api/deployments/:id/cancel`
Annule un déploiement en cours (`PENDING` ou `RUNNING`).
- **Payload (CancelDeploymentDto)** :
```json
{
  "cancelledBy": "sre-engineer",
  "reason": "Aborted due to network latency degradation during canary ramp-up"
}
```

#### `POST /api/deployments/:id/retry`
Relance un déploiement ayant échoué en générant une nouvelle tentative traçable.
- **Payload (RetryDeploymentDto)** :
```json
{
  "retriedBy": "operator@techzone.io",
  "reason": "Transient cluster timeout resolved"
}
```

---

### 5.4 Gestion des Environnements & Pipeline de Promotion

Gère l'état d'assignation des releases par environnement, la promotion séquentielle et les verrous de sécurité.

#### `GET /api/deployment/environments`
Liste l'état opérationnel de chaque environnement (releases actives, statut de santé, verrou).

#### `POST /api/deployment/environments/promote`
Promeut une release d'un environnement source vers un environnement supérieur selon la règle de gouvernance :
`TEST` $\rightarrow$ `STAGING` $\rightarrow$ `PRODUCTION`.
- **Règles métier strictes** :
  - Pour promouvoir vers `PRODUCTION`, la release **DOIT** avoir été déployée avec succès au préalable sur `STAGING`.
- **Payload (PromoteReleaseDto)** :
```json
{
  "releaseId": "770e8400-e29b-41d4-a716-446655440001",
  "targetEnvironmentId": "env-prod-uuid",
  "strategy": "ROLLING",
  "promotedBy": "lead-release-manager"
}
```
- **Réponse (201 Created)** : Résultat du déploiement exécuté sur l'environnement cible.

#### `GET /api/deployment/environments/:environmentId/status`
État détaillé d'un environnement avec toutes les applications hébergées et leurs versions déployées.

#### `POST /api/deployment/environments/:environmentId/lock`
Verrouille un environnement pour interdire tout déploiement nouveau (ex: gel de fin d'année, maintenance critique).
- **Payload (LockEnvironmentDto)** :
```json
{
  "reason": "Black Friday Production Freeze window",
  "lockedBy": "vp-operations"
}
```

#### `POST /api/deployment/environments/:environmentId/unlock`
Déverrouille l'environnement et rétablit le statut `ACTIVE`.
- **Payload** :
```json
{
  "actor": "vp-operations"
}
```

#### `GET /api/deployment/environments/:environmentId/drift`
Détecte d'éventuels écarts de configuration ou de version (drift) entre l'état attendu et l'état déployé.
- **Réponse (200 OK)** :
```json
{
  "environmentId": "env-prod-uuid",
  "isSynchronized": true,
  "driftDetails": []
}
```

---

### 5.5 Validation & Portes de Déploiement (Gates)

Permet de superviser, réévaluer, approuver manuellement ou déroger (bypass tracé) aux portes de sécurité des déploiements.

#### `GET /api/deployments/:id/gates`
Liste toutes les gates associées au déploiement `:id`.
- **Types de gates supportés** :
  - `CONTRACT_COMPATIBILITY` : Vérifie la compatibilité ascendante des contrats.
  - `SNAPSHOT_VALID` : Valide l'intégrité du snapshot.
  - `CONFIGURATION_VALID` : Valide les variables de configuration.
  - `TESTS_PASS` : Contrôle les résultats de tests.
  - `SECURITY_CHECK` : Scan de vulnérabilités et signatures.
  - `ENVIRONMENT_READY` : Disponibilité de l'infrastructure cible.
  - `HEALTH_PRECHECK` : Télémétrie pré-déploiement.
  - `MANUAL_APPROVAL` : Signature manuelle obligatoire (Production).

#### `POST /api/deployments/:id/gates/evaluate`
Réexécute l'évaluation automatisée de toutes les gates pour le déploiement `:id`.
- **Payload (EvaluateGateDto - optionnel)** :
```json
{
  "actor": "automated-pipeline-worker"
}
```

#### `POST /api/deployments/:id/gates/:gateId/approve`
Approbation manuelle d'une porte de type `MANUAL_APPROVAL`.
- **Payload (ApproveGateDto)** :
```json
{
  "approvedBy": "security-officer@techzone.io",
  "comment": "Security penetration test passed with zero critical CVEs."
}
```

#### `POST /api/deployments/:id/gates/:gateId/bypass`
Dérogation d'urgence pour passer outre une gate bloquante. **Exige obligatoirement une justification d'audit archivée.**
- **Payload (BypassGateDto)** :
```json
{
  "bypassedBy": "on-call-incident-commander",
  "justification": "P0 production incident resolution: Hotfix deployed with approval from Head of Engineering."
}
```
- **Réponse (200 OK)** : Gate mise à jour avec statut `SKIPPED` et trace d'audit enregistrée.

---

### 5.6 Gestionnaire de Rollback

Restaure instantanément un environnement ou un déploiement vers une version saine antérieure connue.

#### `GET /api/rollbacks`
Liste l'ensemble des rollbacks exécutés sur la plateforme.

#### `GET /api/rollbacks/:id`
Récupère les détails d'un rollback spécifique (release d'origine, release de destination, acteur, justification).

#### `POST /api/deployments/:id/rollback`
Déclenche le rollback d'un déploiement donné.
- **Règles de sélection de la cible** :
  - Si `toReleaseId` est fourni : rollback vers cette release spécifique.
  - Sinon : rollback automatique vers la précédente release active enregistrée sur l'environnement.
- **Payload (CreateRollbackDto)** :
```json
{
  "type": "MANUAL_ROLLBACK",
  "reason": "Payment transaction failure spike detected post-release",
  "startedBy": "sre-engineer@techzone.io",
  "toReleaseId": "rel-uuid-previous"
}
```
- **Réponse (201 Created)** :
```json
{
  "id": "rbk-uuid-1",
  "deploymentId": "dep-uuid-99",
  "fromReleaseId": "rel-orders-v1.2.0-id",
  "toReleaseId": "rel-orders-v1.1.0-id",
  "type": "MANUAL_ROLLBACK",
  "status": "SUCCEEDED",
  "reason": "Payment transaction failure spike detected post-release",
  "startedBy": "sre-engineer@techzone.io",
  "startedAt": "2026-09-05T08:15:00.000Z",
  "finishedAt": "2026-09-05T08:15:02.000Z",
  "traceId": "trc-rbk-a1b2c3d4"
}
```

#### `POST /api/deployment/environments/:environmentId/rollback`
Déclenche le rollback direct d'une application sur un environnement ciblé.
- **Payload (EnvironmentRollbackDto)** :
```json
{
  "applicationId": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
  "reason": "Immediate emergency rollback requested by product team",
  "startedBy": "ops-on-call@techzone.io",
  "toReleaseId": "optional-target-release-id"
}
```

---

### 5.7 Historique & Diagnostics de Déploiement

Fournit la traçabilité complète, le caviardage automatique des secrets et l'analyse de cause racine (RCA).

#### `GET /api/deployments/history`
Interroge le journal d'événements d'audit avec caviardage automatique (`***REDACTED***`) des données sensibles (`token`, `password`, `key`, `secret`).
- **Paramètres Query (optionnels)** :
  - `applicationId` : UUID de l'application
  - `releaseId` : UUID de la release
  - `deploymentId` : UUID du déploiement
  - `environmentId` : UUID de l'environnement
  - `status` : Statut de l'événement (`RUNNING`, `SUCCEEDED`, `FAILED`, `SKIPPED`)
  - `actor` : Identifiant ou email de l'opérateur
  - `traceId` : Identifiant de trace distribuée

#### `GET /api/deployments/history/timeline/:deploymentId`
Génère la timeline chronologique complète de bout-en-bout d'un déploiement :
- Métadonnées du déploiement
- Événements d'assemblage et validation de la release
- Déroulement chronologique des gates
- Incidents et rollbacks associés

#### `GET /api/deployments/diagnostics`
Retourne les indicateurs de performance et d'analyse de fiabilité de l'ensemble de la plateforme.
- **Réponse (200 OK)** :
```json
{
  "summary": {
    "totalDeployments": 42,
    "succeeded": 40,
    "failed": 2,
    "running": 0,
    "totalRollbacks": 1,
    "successRate": 95,
    "averageDurationSeconds": 14
  },
  "gatesEvaluation": {
    "totalGates": 168,
    "passed": 165,
    "failed": 2,
    "skippedOrBypassed": 1
  },
  "recentIncidents": []
}
```

#### `GET /api/deployments/diagnostics/:deploymentId`
Analyse de cause racine (Root Cause Analysis - RCA) ciblée sur un déploiement spécifique avec diagnostic et recommandations d'actions de remédiation.
- **Réponse (200 OK)** :
```json
{
  "deploymentId": "dep-uuid-failed",
  "status": "FAILED",
  "healthStatus": "DEGRADED",
  "durationSeconds": 6,
  "diagnosis": "Deployment failed during gate verification stage (Security Vulnerability Scan).",
  "failedGates": [
    {
      "name": "Security Vulnerability Scan",
      "type": "SECURITY_CHECK",
      "result": "FAILED",
      "message": "Critical CVE-2026-1029 detected in container base image"
    }
  ],
  "hasRollback": true,
  "recommendations": [
    "Inspect gate failure details and fix compatibility/validation errors before retrying.",
    "Update base image dependencies in Dockerfile and rebuild release snapshot."
  ]
}
```

---

## 6. Codes d'Erreur Référencés (`DeploymentErrorCode`)

| Code d'Erreur | HTTP Status | Description |
|---|---|---|
| `DEP_RELEASE_NOT_FOUND` | 404 Not Found | La release demandée n'existe pas. |
| `DEP_RELEASE_ALREADY_EXISTS` | 409 Conflict | Une release avec le même code ou version existe déjà pour l'application. |
| `DEP_RELEASE_NOT_APPROVED` | 422 Unprocessable | Tentative de déploiement d'une release non approuvée. |
| `DEP_DEPLOYMENT_NOT_FOUND` | 404 Not Found | Le déploiement demandé n'existe pas. |
| `DEP_ENVIRONMENT_NOT_FOUND` | 404 Not Found | L'environnement spécifié n'existe pas. |
| `DEP_ENVIRONMENT_LOCKED` | 423 Locked | L'environnement est verrouillé pour les déploiements. |
| `DEP_GATE_FAILED` | 422 Unprocessable | Une porte de validation obligatoire a échoué. |
| `DEP_GATE_NOT_FOUND` | 404 Not Found | La gate demandée est introuvable. |
| `DEP_GATE_BYPASS_FORBIDDEN` | 400 Bad Request | Justification d'audit insuffisante pour le bypass. |
| `DEP_PROMOTION_INVALID_SEQUENCE` | 422 Unprocessable | Ordre de promotion non respecté (`TEST` $\rightarrow$ `STAGING` $\rightarrow$ `PRODUCTION`). |
| `DEP_ROLLBACK_NO_TARGET` | 422 Unprocessable | Aucune release antérieure saine disponible pour le rollback. |
| `DEP_CONCURRENCY_CONFLICT` | 409 Conflict | Un autre déploiement est déjà actif sur cet environnement. |
| `DEP_IDEMPOTENCY_CONFLICT` | 409 Conflict | Conflit sur la clé d'idempotence fournie. |
