# CAHIER DES CHARGES --- TECHZONE CLOUD AUTOMATION

**Version :** 1.0\
**Date :** Septembre 2026\
**Projet :** Techzone Cloud\
**Module :** Automation\
**Statut :** Spécification fonctionnelle et technique

------------------------------------------------------------------------

# 1. Présentation

## 1.1 Vision

**Techzone Cloud Automation** est le moteur permettant de créer,
configurer, tester, publier et superviser les processus automatisés des
applications métier.

Il doit permettre de construire des workflows principalement de manière
visuelle, sans écrire directement du code.

Exemple :

``` text
Commande créée
      │
      ▼
Montant > 500 000 Ar ?
      │
   ┌──┴──┐
   │     │
  OUI   NON
   │     │
   ▼     ▼
Valider  Notifier
   │
   ▼
Envoyer vers ERP
```

Automation ne doit pas redéfinir les entités, champs ou fonctionnalités
métier. Il exploite les définitions provenant de **Business Manager**.

------------------------------------------------------------------------

# 2. Position dans Techzone Cloud

``` text
BUSINESS MANAGER
Entités • Champs • Features • Événements
              │
              ▼
UI BUILDER
Pages • Composants • Formulaires • Actions
              │
              ▼
AUTOMATION
Triggers • Conditions • Actions • Workflows
              │
              ▼
PACK MANAGER
Versions • Validation • Manifest • Publication
              │
              ▼
PACK RUNTIME
Chargement • Résolution • Exécution
```

**Business Manager** --- Quelles données et fonctions possède
l'application ?\
**UI Builder** --- Comment l'utilisateur interagit-il avec l'application
?\
**Automation** --- Que doit faire automatiquement le système lorsqu'un
événement survient ?\
**Pack Manager** --- Quelle version est validée et publiée ?\
**Runtime** --- Comment la version publiée est-elle chargée et exécutée
?

------------------------------------------------------------------------

# 3. Objectifs

Automation doit permettre de :

-   créer des workflows ;
-   construire visuellement les workflows ;
-   définir les déclencheurs ;
-   ajouter des conditions ;
-   ajouter des actions ;
-   créer plusieurs branches ;
-   utiliser les données Business Manager ;
-   transmettre des variables entre étapes ;
-   déclencher des workflows depuis UI Builder ;
-   appeler des API ;
-   communiquer avec les intégrations autorisées ;
-   déclencher des opérations ERP ;
-   envoyer des notifications ;
-   programmer des traitements ;
-   tester et simuler un workflow ;
-   valider sa configuration ;
-   activer/désactiver un workflow ;
-   versionner les workflows ;
-   consulter les exécutions ;
-   diagnostiquer les erreurs ;
-   relancer les traitements échoués lorsque permis ;
-   transmettre les définitions validées au Pack Manager ;
-   permettre au Runtime d'exécuter les workflows publiés.

------------------------------------------------------------------------

# 4. Principe architectural

Automation doit être un moteur **déclaratif**. Un workflow ne doit pas
être enregistré comme du JavaScript libre.

``` json
{
  "name": "Validation commande",
  "trigger": {
    "type": "ENTITY_CREATED",
    "entity": "Order"
  },
  "steps": [
    {
      "type": "CONDITION",
      "field": "total",
      "operator": "GREATER_THAN",
      "value": 500000
    }
  ]
}
```

Pipeline :

``` text
Automation Definition
        ↓
Validation
        ↓
Pack Manager
        ↓
Publication
        ↓
Runtime
        ↓
Workflow Engine
```

------------------------------------------------------------------------

# 5. Architecture fonctionnelle

  Domaine            Responsabilité
  ------------------ -----------------------------
  Vue d'ensemble     Supervision globale
  Workflows          Gestion des automatisations
  Workflow Builder   Construction visuelle
  Triggers           Déclencheurs
  Conditions         Logique conditionnelle
  Actions            Opérations exécutées
  Variables          Données temporaires
  Planifications     Automatisations temporelles
  Templates          Modèles réutilisables
  Test               Simulation
  Validation         Vérification
  Exécutions         Historique
  Logs               Diagnostic
  Versions           Historique des définitions

------------------------------------------------------------------------

# 6. Navigation

``` text
Automatisation
├── Vue d'ensemble
├── Workflows
├── Déclencheurs
├── Actions
├── Planifications
├── Exécutions
├── Modèles
└── Diagnostics
```

Déclencheurs, Conditions, Actions et Variables sont surtout des éléments
du Workflow Builder afin d'éviter de multiplier inutilement les écrans.

------------------------------------------------------------------------

# 7. Contexte

``` text
Tenant → Application → Application Version → Automation Project → Workflow
```

Toutes les données doivent respecter le contexte tenant.

------------------------------------------------------------------------

# 8. Vue d'ensemble

Le Dashboard Automation affiche notamment :

``` text
Workflows              18
Actifs                 12
Brouillons              4
En erreur               2

Exécutions aujourd'hui 1284
Réussies               1241
Échouées                 43
```

Ajouter : workflows récemment modifiés, dernières exécutions, erreurs
récentes, workflows nécessitant une intervention, taux de réussite,
durée moyenne et dernières publications.

Les métriques doivent provenir de données réelles.

------------------------------------------------------------------------

# 9. Gestion des workflows

Chaque workflow possède notamment :

``` text
id
tenantId
applicationVersionId
name
key
description
status
version
triggerType
createdBy
createdAt
updatedAt
```

Actions : créer, modifier, dupliquer, tester, valider, activer,
désactiver, archiver, consulter les exécutions.

------------------------------------------------------------------------

# 10. Lifecycle Workflow

``` text
DRAFT → CONFIGURING → VALIDATION → READY → PUBLISHED → ACTIVE
```

Autres états possibles : `INACTIVE`, `ARCHIVED`.

Les valeurs finales doivent être alignées avec les conventions
existantes du projet.

------------------------------------------------------------------------

# 11. Workflow Builder

Le Workflow Builder est le cœur du module.

``` text
┌────────────────────────────────────────────────────────────────┐
│ Validation commande   DRAFT       Test   Validate   Save      │
├─────────────┬────────────────────────────────┬─────────────────┤
│ NODES       │           CANVAS               │ PROPERTIES      │
│ Trigger     │      Commande créée            │ Configuration   │
│ Condition   │             │                  │ Inputs          │
│ Action      │             ▼                  │ Outputs         │
│ Delay       │      Total > 500 000 ?         │ Error handling  │
│ Branch      │          /       \             │ Advanced        │
│             │       OUI         NON          │                 │
│             │        │           │           │                 │
│             │      ERP        Notify         │                 │
└─────────────┴────────────────────────────────┴─────────────────┘
```

Le Canvas doit permettre drag & drop, ajout/suppression/duplication de
nodes, connexions, déplacement, zoom, pan, sélection, branches,
affichage des erreurs et Undo/Redo.

------------------------------------------------------------------------

# 12. Types de nodes

``` text
TRIGGER
ACTION
CONDITION
BRANCH
DELAY
TRANSFORM
SUB_WORKFLOW
END
```

Les types réellement implémentés sont enregistrés dans un **Node
Registry**.

------------------------------------------------------------------------

# 13. Node Registry

``` json
{
  "type": "CONDITION",
  "label": "Condition",
  "category": "logic",
  "inputs": ["data"],
  "outputs": ["true", "false"],
  "configurable": true
}
```

Le Node Registry sert à la validation, l'affichage dans le Builder, la
compatibilité Runtime, l'extension et l'IA.

------------------------------------------------------------------------

# 14. Déclencheurs

## Événements métier

``` text
ENTITY_CREATED
ENTITY_UPDATED
ENTITY_DELETED
STATUS_CHANGED
FIELD_CHANGED
BUSINESS_EVENT
```

## Trigger manuel

Exécution depuis UI Builder, bouton, API, administration ou autre
workflow.

## Trigger planifié

``` text
ONCE
DAILY
WEEKLY
MONTHLY
CRON
```

Le fuseau horaire doit être explicite.

## Trigger Webhook/API

Exiger authentification, validation du payload, audit, rate limiting
selon l'infrastructure et protection contre les doublons lorsque
nécessaire.

## Trigger ERP

Les événements ERP passent par l'ERP Adapter lorsque celui-ci constitue
la couche d'intégration du projet.

``` text
Automation → ERP Adapter → Dolibarr
```

------------------------------------------------------------------------

# 15. Conditions

Opérateurs :

``` text
EQUALS
NOT_EQUALS
GREATER_THAN
GREATER_THAN_OR_EQUAL
LESS_THAN
LESS_THAN_OR_EQUAL
CONTAINS
NOT_CONTAINS
STARTS_WITH
ENDS_WITH
IS_EMPTY
IS_NOT_EMPTY
IN
NOT_IN
```

Supporter `AND` et `OR`.

Exemple visuel :

``` text
SI
[Commande.total] [est supérieur à] [500000]
ET
[Commande.status] [est égal à] [PENDING]
```

Le système génère une définition structurée.

------------------------------------------------------------------------

# 16. Actions

Actions natives proposées :

``` text
CREATE_RECORD
UPDATE_RECORD
DELETE_RECORD
CHANGE_STATUS
SEND_NOTIFICATION
CALL_API
ERP_ACTION
SET_VARIABLE
TRANSFORM_DATA
TRIGGER_WORKFLOW
DELAY
STOP_WORKFLOW
```

Les actions réellement disponibles dépendent des capacités enregistrées.

------------------------------------------------------------------------

# 17. Actions CRUD

Exemple :

``` text
UPDATE_RECORD

Entity: Order
Record: trigger.order.id

Set:
status = VALIDATED
```

Toute opération respecte permissions et règles métier backend.

------------------------------------------------------------------------

# 18. Notifications

Canaux possibles uniquement s'ils sont réellement configurés :

``` text
IN_APP
EMAIL
SMS
PUSH
```

Ne pas afficher un canal comme disponible sans service correspondant.

------------------------------------------------------------------------

# 19. API Action

Configuration : - Method ; - Endpoint / Connector ; - Headers autorisés
; - Payload ; - Timeout ; - Output mapping ; - Error handling.

Ne pas permettre des appels réseau arbitraires non contrôlés. Prévoir
une politique de connecteurs/allowlist.

------------------------------------------------------------------------

# 20. ERP Action

Exemples possibles selon l'ERP Adapter :

``` text
CREATE_CUSTOMER
CREATE_ORDER
VALIDATE_ORDER
CREATE_INVOICE
UPDATE_PRODUCT
```

Automation appelle l'ERP Adapter, pas directement Dolibarr.

------------------------------------------------------------------------

# 21. Variables et Data Mapping

Sources possibles :

``` text
Trigger Data
Workflow Variables
Step Outputs
Context
Secret References
```

Exemples :

``` text
{{trigger.order.id}}
{{trigger.order.total}}
{{steps.customer.id}}
{{variables.discount}}
{{context.tenantId}}
```

Mapping :

``` text
Destination             Source
customerName      ←     trigger.customer.name
amount            ←     trigger.order.total
orderId           ←     trigger.order.id
```

Le mapping doit être validé.

------------------------------------------------------------------------

# 22. Transformations

Prévoir un système contrôlé pour : - concaténation ; - conversion de
type ; - formatage date ; - opérations numériques simples ; - extraction
; - valeurs par défaut.

Éviter JavaScript libre.

------------------------------------------------------------------------

# 23. Branches

``` text
             Condition
            /         \
         TRUE         FALSE
          │             │
       Action A       Action B
          │             │
          └──────┬──────┘
                 ▼
              Action C
```

Le moteur doit connaître clairement tous les chemins possibles.

------------------------------------------------------------------------

# 24. Delay / Wait

Support potentiel :

``` text
WAIT_DURATION
WAIT_UNTIL
```

Les longues attentes ne doivent pas immobiliser un processus serveur.
Elles doivent être persistées et reprises ultérieurement.

------------------------------------------------------------------------

# 25. Sous-workflows

Une automatisation peut appeler une autre automatisation publiée.

Prévoir protection contre récursion infinie, cycles et profondeur
excessive.

------------------------------------------------------------------------

# 26. Secrets

Les secrets ne sont jamais stockés directement dans le JSON du workflow.

Interdit :

``` json
{"apiKey":"secret123"}
```

Autorisé conceptuellement :

``` json
{"secretRef":"payment-api-key"}
```

Le Runtime résout la référence via le système sécurisé approprié.

------------------------------------------------------------------------

# 27. Gestion des erreurs et Retry

Comportements possibles :

``` text
STOP
CONTINUE
RETRY
BRANCH_TO_ERROR
```

Retry configurable : nombre maximal de tentatives, délai, backoff.

Ne pas relancer automatiquement une erreur métier permanente.

------------------------------------------------------------------------

# 28. Idempotence

Les actions sensibles doivent pouvoir utiliser une clé d'idempotence
pour éviter les créations multiples.

Exemples de dimensions :

``` text
workflowId
executionId
stepId
businessObjectId
```

------------------------------------------------------------------------

# 29. Exécutions

Une exécution possède notamment :

``` text
executionId
workflowId
workflowVersion
tenantId
status
triggerType
triggerPayload
startedAt
finishedAt
duration
currentStep
error
```

Statuts :

``` text
QUEUED
RUNNING
WAITING
SUCCESS
FAILED
CANCELLED
RETRYING
```

------------------------------------------------------------------------

# 30. Historique et détail d'exécution

Filtres : Workflow, Status, Date, Trigger, Application, Version.

Détail :

``` text
Execution #EX-12872

Workflow: Validation commande
Status: FAILED
Duration: 1.8 s

✓ Trigger — Order Created
✓ Condition — total > 500000
✓ Update Order
✕ ERP Action — Timeout

Trace ID: ...

[Relancer]
```

------------------------------------------------------------------------

# 31. Visual Execution Trace

``` text
[Order Created] ✓
       │
       ▼
[Total > 500k] ✓
       │ TRUE
       ▼
[Update Order] ✓
       │
       ▼
[ERP Action] ✕
```

Le chemin réellement exécuté doit être visible pour faciliter le
diagnostic.

------------------------------------------------------------------------

# 32. Logs et Diagnostics

Logs :

``` text
timestamp
executionId
workflowId
stepId
level
message
duration
traceId
```

Ne pas enregistrer de secrets ou données sensibles inutilement.

Cockpit Diagnostics :

``` text
Failed executions       12
Retrying                 3
Waiting                  8
Average duration      1.4 s

Top errors:
ERP_TIMEOUT              6
INVALID_DATA             4
API_UNAVAILABLE          2
```

Les données doivent être réelles.

------------------------------------------------------------------------

# 33. Test et Simulation

L'utilisateur peut fournir un payload de test.

``` json
{
  "order": {
    "id": "test-order",
    "total": 750000,
    "status": "PENDING"
  }
}
```

Mode `SIMULATION` lorsque supporté :

``` text
Would execute:
✓ Condition TRUE
✓ Update Order
✓ Send ERP Request
✓ Notification
```

Ne pas prétendre simuler une action si le connecteur ne supporte pas ce
comportement.

------------------------------------------------------------------------

# 34. Validation Engine

Contrôler : - Trigger valide ; - Nodes valides ; - Connections valides
; - Bindings valides ; - Actions supportées ; - Permissions valides ; -
References valides ; - No orphan node ; - No forbidden cycle ; - No
missing configuration.

Niveaux : `ERROR`, `WARNING`, `INFO`.

Erreurs possibles : Trigger absent, Action inconnue, Entity/Field
supprimé, Workflow référencé inexistant, Node non connecté, Secret
manquant, Cycle interdit.

------------------------------------------------------------------------

# 35. Versionnement

Chaque workflow publié possède une version immuable.

``` text
Validation commande
v1
v2
v3 ← ACTIVE
v4 ← DRAFT
```

Règle fondamentale :

``` text
DRAFT AUTOMATION ≠ PUBLISHED AUTOMATION
```

Runtime exécute la version publiée correspondant au Pack actif.

------------------------------------------------------------------------

# 36. Modèle de données conceptuel

``` text
AutomationProject
Workflow
WorkflowVersion
WorkflowNode
WorkflowEdge
WorkflowTrigger
WorkflowVariable
WorkflowSchedule
WorkflowExecution
WorkflowStepExecution
WorkflowValidation
WorkflowRevision
```

Relations :

``` text
ApplicationVersion
       └── AutomationProject
                 └── Workflow
                       ├── WorkflowVersion
                       │      ├── WorkflowNode
                       │      ├── WorkflowEdge
                       │      ├── WorkflowVariable
                       │      └── WorkflowTrigger
                       ├── WorkflowSchedule
                       └── WorkflowExecution
                              └── WorkflowStepExecution
```

------------------------------------------------------------------------

# 37. Modèles principaux

## WorkflowNode

``` text
id
tenantId
workflowVersionId
type
nodeType
name
positionX
positionY
config JSON
createdAt
updatedAt
```

## WorkflowEdge

``` text
id
workflowVersionId
sourceNodeId
targetNodeId
sourceHandle
targetHandle
condition
```

## WorkflowExecution

``` text
id
tenantId
workflowId
workflowVersionId
status
triggerType
triggerPayload
context
startedAt
finishedAt
duration
errorCode
errorMessage
traceId
```

## WorkflowStepExecution

``` text
id
executionId
nodeId
status
input
output
startedAt
finishedAt
duration
error
```

Attention aux données sensibles dans `input/output`.

------------------------------------------------------------------------

# 38. API indicative

Préfixe possible : `/api/automation`

## Workflows

``` http
GET    /workflows
POST   /workflows
GET    /workflows/:id
PATCH  /workflows/:id
DELETE /workflows/:id
POST   /workflows/:id/duplicate
POST   /workflows/:id/archive
```

## Definition

``` http
GET /workflows/:id/definition
PUT /workflows/:id/definition
```

## Validation / Test

``` http
POST /workflows/:id/validate
GET  /workflows/:id/validation
POST /workflows/:id/test
POST /workflows/:id/simulate
```

## Activation

``` http
POST /workflows/:id/activate
POST /workflows/:id/deactivate
```

Si Pack Manager contrôle entièrement la publication, l'activation doit
respecter cette chaîne.

## Exécutions

``` http
GET  /executions
GET  /executions/:id
POST /executions/:id/retry
POST /executions/:id/cancel
```

## Planifications

``` http
GET    /schedules
POST   /schedules
PATCH  /schedules/:id
DELETE /schedules/:id
```

Adapter aux conventions API existantes.

------------------------------------------------------------------------

# 39. Sécurité et permissions

Toutes les routes respectent Authentication, Tenant Context,
Permissions, DTO Validation et Audit.

Permissions indicatives :

``` text
automation.read
automation.create
automation.update
automation.delete
automation.test
automation.validate
automation.activate
automation.deactivate
automation.execution.read
automation.execution.retry
automation.execution.cancel
automation.schedule.manage
```

Réutiliser IAM existant.

------------------------------------------------------------------------

# 40. Multi-tenant

Toutes les ressources sont tenant-scoped : workflow, version, nodes,
executions, logs, schedules et variables.

Tout accès cross-tenant doit être refusé conformément aux conventions du
projet.

------------------------------------------------------------------------

# 41. Intégration Business Manager

Automation consomme :

``` text
Entities
Fields
Relations
Business Events
Features
Permissions
```

Il ne recrée pas ces définitions.

Si un champ référencé est supprimé, la validation produit
`BROKEN_REFERENCE`.

------------------------------------------------------------------------

# 42. Intégration UI Builder

UI Builder peut déclencher :

``` text
TRIGGER_AUTOMATION
```

Exemple :

``` text
Bouton "Valider commande" → validate-order
```

Les inputs sont explicitement mappés.

------------------------------------------------------------------------

# 43. Intégration ERP Adapter

Architecture :

``` text
Automation → ERP Adapter → Dolibarr
```

Automation ne doit pas contourner l'ERP Adapter pour les opérations
prévues par celui-ci.

------------------------------------------------------------------------

# 44. Intégration Pack Manager

Une Application Version peut contenir :

``` text
Business Definition
UI Definition
Automation Definition
Configuration
        ↓
      PACK
```

Pack Manager vérifie notamment Workflow schema version, Required
capabilities, Required connectors, Dependencies et Validation status.

Manifest indicatif :

``` json
{
  "automation": {
    "schemaVersion": "1.0",
    "workflows": [
      {
        "key": "validate-order",
        "version": "1.2.0"
      }
    ]
  }
}
```

------------------------------------------------------------------------

# 45. Runtime Integration

``` text
Published Pack
      ↓
Automation Definition
      ↓
Workflow Registry
      ↓
Trigger Registry
      ↓
Workflow Engine
```

Le Workflow Engine doit pouvoir recevoir l'événement, résoudre le
workflow, créer l'exécution, évaluer le trigger, exécuter les nodes,
résoudre les variables, évaluer les conditions, exécuter les actions,
persister l'état, gérer les erreurs et terminer l'exécution.

------------------------------------------------------------------------

# 46. Event Model

Exemple indicatif :

``` json
{
  "eventId": "...",
  "eventType": "ORDER_CREATED",
  "tenantId": "...",
  "applicationId": "...",
  "timestamp": "...",
  "data": {}
}
```

Prévoir déduplication par `eventId` lorsque nécessaire.

------------------------------------------------------------------------

# 47. Scheduling, Queue, Timeout et Concurrence

Le scheduler crée les exécutions dues et évite les doubles exécutions en
environnement distribué.

Les actions longues ou externes peuvent être asynchrones :

``` text
Trigger → Queue → Worker → Workflow Execution
```

Ne pas introduire une nouvelle technologie de queue sans vérifier
l'infrastructure existante.

Chaque action externe possède un timeout.

Stratégies de concurrence futures possibles :

``` text
ALLOW
SERIALIZE_BY_RESOURCE
SKIP_IF_RUNNING
```

------------------------------------------------------------------------

# 48. Audit et Observabilité

Événements importants :

``` text
WORKFLOW_CREATED
WORKFLOW_UPDATED
WORKFLOW_VALIDATED
WORKFLOW_PUBLISHED
WORKFLOW_ACTIVATED
WORKFLOW_DEACTIVATED
WORKFLOW_ARCHIVED
EXECUTION_RETRIED
EXECUTION_CANCELLED
```

Observabilité :

``` text
traceId
requestId
tenantId
workflowId
workflowVersion
executionId
stepId
duration
status
```

------------------------------------------------------------------------

# 49. UI/UX

Conserver le design system Techzone Cloud.

Le Workflow Builder utilise un Canvas clair, nodes lisibles, lignes de
connexion, panneau Properties, zoom, breadcrumbs, Context Bar et statut
de sauvegarde.

États visuels des nodes :

``` text
NON EXÉCUTÉ
RUNNING
SUCCESS
FAILED
SKIPPED
WAITING
```

Ne pas dépendre uniquement de la couleur.

------------------------------------------------------------------------

# 50. Responsive, Autosave et Undo/Redo

Desktop : `Node Library | Canvas | Properties`.

Laptop : panneaux réductibles.

Tablet : Properties en Drawer.

Mobile : priorité consultation, exécutions et diagnostics.

Autosave : Editing, Saving, Saved, Save Error.

Undo/Redo pour Add Node, Delete Node, Move Node, Connect, Disconnect et
Change Configuration.

------------------------------------------------------------------------

# 51. Templates Automation

Templates initiaux possibles : - Notification après création ; -
Validation automatique ; - Synchronisation ERP ; - Rappel programmé ; -
Changement de statut ; - Appel API ; - Notification d'erreur.

------------------------------------------------------------------------

# 52. IA --- Automation Assistant

Exemple de demande :

> Lorsqu'une commande de plus de 500 000 Ar est créée, valide-la,
> synchronise-la avec l'ERP puis notifie le responsable.

L'IA propose un workflow structuré, jamais du code arbitraire.

``` text
Prompt
  ↓
AI Proposal
  ↓
Structured Operations
  ↓
Validation
  ↓
Preview Diff
  ↓
Accept / Reject
```

Contexte IA : Application, Version, Entities, Fields, Relations, Events,
Available Actions, Available Connectors, Current Workflow, Node
Registry, Permissions.

L'IA ne doit pas inventer un connecteur ou une action inexistante.

------------------------------------------------------------------------

# 53. Workflow Definition

``` json
{
  "schemaVersion": "1.0",
  "workflow": {
    "key": "validate-order",
    "name": "Validation commande",
    "trigger": {
      "type": "ENTITY_CREATED",
      "entity": "Order"
    },
    "nodes": [],
    "edges": [],
    "variables": []
  }
}
```

Runtime vérifie `schemaVersion`, `runtimeVersion`, node compatibility,
action compatibility et connector compatibility.

------------------------------------------------------------------------

# 54. Règles de gestion

-   **RG-AUTO-001** --- Un workflow appartient à une Application
    Version.
-   **RG-AUTO-002** --- Toutes les ressources sont isolées par tenant.
-   **RG-AUTO-003** --- Un workflow doit avoir un trigger valide avant
    READY.
-   **RG-AUTO-004** --- Chaque node doit être supporté par le Node
    Registry.
-   **RG-AUTO-005** --- Chaque référence métier doit exister dans
    Business Manager.
-   **RG-AUTO-006** --- Les actions externes utilisent uniquement les
    connecteurs autorisés.
-   **RG-AUTO-007** --- Automation ne contourne pas IAM.
-   **RG-AUTO-008** --- Automation ne contourne pas l'ERP Adapter pour
    les opérations ERP prévues.
-   **RG-AUTO-009** --- Une définition avec erreur bloquante ne peut pas
    devenir READY.
-   **RG-AUTO-010** --- Une modification DRAFT ne modifie jamais la
    version publiée.
-   **RG-AUTO-011** --- Une version publiée est immuable.
-   **RG-AUTO-012** --- Aucun JavaScript utilisateur arbitraire n'est
    exécuté.
-   **RG-AUTO-013** --- Les secrets ne sont jamais stockés directement
    dans les définitions.
-   **RG-AUTO-014** --- Une action sensible prend en compte
    l'idempotence lorsque nécessaire.
-   **RG-AUTO-015** --- Une erreur d'intégration externe doit être
    traçable.
-   **RG-AUTO-016** --- Une exécution conserve la version exacte du
    workflow utilisée.
-   **RG-AUTO-017** --- Les références supprimées dans Business Manager
    sont détectées.
-   **RG-AUTO-018** --- UI Builder peut déclencher un workflow mais ne
    possède pas sa logique.
-   **RG-AUTO-019** --- Pack Manager reste responsable de la
    composition/publication globale.
-   **RG-AUTO-020** --- Runtime n'exécute en production que les
    définitions publiées applicables.

------------------------------------------------------------------------

# 55. MVP

Priorités :

1.  Workflow CRUD
2.  Workflow Builder
3.  Node Registry
4.  Trigger métier
5.  Trigger manuel
6.  Conditions
7.  Branches
8.  CRUD Actions
9.  Variables
10. Mapping
11. Notification
12. ERP Adapter Action
13. API Action contrôlée
14. Test
15. Validation
16. Execution Engine
17. Execution History
18. Logs
19. Pack Manager Integration
20. Runtime Integration

------------------------------------------------------------------------

# 56. Phase 2

-   Scheduling avancé ;
-   Delay / Wait ;
-   Retry avancé ;
-   Sub-workflows ;
-   Templates avancés ;
-   Execution Replay ;
-   Visual Trace avancé ;
-   AI Workflow Generation.

------------------------------------------------------------------------

# 57. Phase 3

-   Collaborative Workflow Editing ;
-   Marketplace d'actions/connecteurs ;
-   Workflow analytics avancées ;
-   Business Process Templates ;
-   AI Optimization ;
-   AI Error Diagnosis ;
-   Advanced Event Processing.

------------------------------------------------------------------------

# 58. Tests

## Unitaires

Tester Trigger Resolver, Condition Evaluator, Variable Resolver, Data
Mapping, Node Registry, Workflow Validator, Graph Validator, Action
Resolver et Execution State Machine.

## Intégration

``` text
Business Manager → Automation
UI Builder → Automation
Automation → ERP Adapter
Automation → Pack Manager
Pack Manager → Runtime → Automation Engine
```

## Sécurité

Tester Cross-Tenant Workflow Access, Cross-Tenant Execution Access,
Unauthorized Workflow Update, Unauthorized Activation, Unauthorized
Retry, Invalid Secret Reference, Invalid Connector, Malformed Workflow
Definition, Unsupported Node et Invalid Business Binding.

------------------------------------------------------------------------

# 59. Test E2E principal

``` text
Business Manager
→ Créer Order
→ Créer événement OrderCreated
→ Automation
→ Créer Workflow
→ Ajouter Trigger
→ Ajouter Condition
→ Ajouter Actions
→ Mapper les données
→ Tester
→ Valider
→ READY
→ Pack Manager
→ Manifest
→ Publication
→ Runtime
→ Événement OrderCreated
→ Workflow exécuté
→ Historique
→ Logs / Trace
```

------------------------------------------------------------------------

# 60. Organisation technique indicative

L'IA doit d'abord examiner le repository.

Backend possible :

``` text
backend/src/modules/automation/
├── automation.module.ts
├── workflows/
├── triggers/
├── nodes/
├── conditions/
├── actions/
├── variables/
├── schedules/
├── executions/
├── validation/
├── runtime/
└── diagnostics/
```

Frontend possible :

``` text
frontend/src/components/automation/
├── dashboard/
├── workflows/
├── builder/
│   ├── canvas/
│   ├── node-library/
│   ├── node/
│   └── inspector/
├── executions/
├── schedules/
├── templates/
├── validation/
└── diagnostics/
```

Ne pas recréer une architecture parallèle si des modules équivalents
existent déjà.

------------------------------------------------------------------------

# 61. Critères d'acceptation

Automation est fonctionnel lorsqu'un utilisateur peut :

1.  sélectionner une application ;
2.  sélectionner sa version ;
3.  ouvrir Automation ;
4.  créer un workflow ;
5.  sélectionner un trigger ;
6.  utiliser une entité Business Manager ;
7.  ajouter des conditions ;
8.  créer des branches ;
9.  ajouter des actions ;
10. mapper les données ;
11. utiliser une action ERP autorisée ;
12. déclencher une notification ;
13. sauvegarder ;
14. tester ;
15. simuler lorsque supporté ;
16. valider ;
17. corriger les erreurs ;
18. passer le workflow à READY ;
19. l'intégrer au Pack Manager ;
20. publier le Pack ;
21. charger le workflow dans Runtime ;
22. recevoir un événement réel ;
23. exécuter le workflow ;
24. consulter l'historique ;
25. ouvrir une exécution ;
26. identifier l'étape ayant échoué ;
27. consulter le Trace ID ;
28. relancer une exécution lorsque cela est autorisé.

------------------------------------------------------------------------

# 62. Instructions pour l'IA de développement

Avant d'écrire du code :

1.  lire tous les CDC Automation existants ;
2.  rechercher tout code Automation déjà présent ;
3.  examiner Business Manager ;
4.  examiner UI Builder ;
5.  examiner Pack Manager ;
6.  examiner Pack Runtime ;
7.  examiner ERP Adapter ;
8.  examiner IAM ;
9.  examiner Prisma ;
10. examiner navigationConfig et routing ;
11. examiner le design system Techzone Cloud ;
12. identifier les fonctionnalités existantes ;
13. produire une Gap Matrix.

Format :

  Fonction    CDC   Existant   Backend   Frontend   Test   Action
  ----------- ----- ---------- --------- ---------- ------ -----------
  Workflow    Oui   Partiel    Oui       Partiel    Non    Compléter
  Trigger     Oui   ...        ...       ...        ...    ...
  Condition   Oui   ...        ...       ...        ...    ...
  Execution   Oui   ...        ...       ...        ...    ...

Règle :

``` text
EXISTANT + FONCTIONNEL → KEEP
EXISTANT + UI/UX FAIBLE → IMPROVE
PARTIEL → COMPLETE
ANCIEN MAIS RÉUTILISABLE → ADAPT
MANQUANT → IMPLEMENT
```

L'IA ne doit pas reconstruire ce qui fonctionne déjà.

------------------------------------------------------------------------

# 63. Contraintes d'implémentation IA

L'IA doit : - préserver `main` comme architecture canonique ; -
respecter NestJS/React/Prisma/PostgreSQL actuels ; - ne jamais remplacer
aveuglément `schema.prisma` ; - réutiliser IAM ; - respecter tenant
isolation ; - réutiliser les composants UI existants ; - ne pas créer un
deuxième design system ; - ne pas inventer de données en REAL mode ; -
ne pas créer de faux connecteurs ; - ne pas afficher une intégration
comme fonctionnelle si elle ne l'est pas ; - conserver les erreurs
backend réelles ; - produire les migrations nécessaires proprement ; -
ajouter les tests ; - vérifier frontend et backend ; - effectuer une
recette navigateur.

------------------------------------------------------------------------

# 64. Définition de DONE

Automation est DONE lorsque :

``` text
✓ Workflow CRUD réel
✓ Workflow Builder fonctionnel
✓ Canvas fonctionnel
✓ Node Registry fonctionnel
✓ Triggers fonctionnels
✓ Conditions fonctionnelles
✓ Branches fonctionnelles
✓ Actions fonctionnelles
✓ Data Mapping fonctionnel
✓ Variables fonctionnelles
✓ Validation Engine fonctionnel
✓ Test Workflow fonctionnel
✓ Execution Engine fonctionnel
✓ Historique réel
✓ Visual Execution Trace
✓ Logs et diagnostics
✓ Business Manager intégré
✓ UI Builder intégré
✓ ERP Adapter intégré lorsque applicable
✓ Pack Manager intégré
✓ Runtime intégré
✓ Multi-tenant vérifié
✓ IAM vérifié
✓ Tests passants
✓ Backend build passant
✓ Frontend build passant
✓ Recette navigateur passée
```

------------------------------------------------------------------------

# 65. Principe produit final

Le module Automation ne doit pas devenir un ensemble de scripts libres.

Son principe central reste :

``` text
ÉVÉNEMENT
    ↓
DÉCLENCHEUR
    ↓
CONDITIONS
    ↓
ACTIONS
    ↓
RÉSULTAT
    ↓
TRAÇABILITÉ
```

Toute automatisation doit être :

**déclarative, visuelle, versionnée, validée, sécurisée, multi-tenant,
observable et exécutable par Runtime.**

------------------------------------------------------------------------

# FIN DU CAHIER DES CHARGES

**Techzone Cloud --- Automation v1.0**
