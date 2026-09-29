# Dolibarr — diagnostic ciblé

Date : 2026-09-28. Arrêt conformément à la consigne en cas de credential absent.

```text
ROOT_CAUSE = registre ERP vide pour le tenant actif
LOGIN = PASS / HTTP 200 réel
TENANT = PASS / membership ACTIVE / sélection HTTP 200
ERP_CONNECTION = MISSING
ERP_TARGET = NOT_IMPLEMENTED dans les modèles inspectés
DOLIBARR_URL = http://167.86.71.186:8082/
NETWORK = NETWORK_OK / ERP_REACHABLE
AUTH = BLOCKED_MISSING_DOLIBARR_CREDENTIAL
API = endpoint JSON joignable, HTTP 401 sans clé; accès authentifié non validé
EA0_0 = PARTIAL / CRUD présent, registre vide, sélection implicite incorrecte
EA0_1 = BLOCKED / aucune détection exécutée
ERP_CONTEXT = NOT_VALIDATED
PRODUCTS = FAIL / HTTP 503 ERP_INSTANCE_NOT_CONFIGURED reproduit
CLIENTS = BLOCKED / même résolveur
ORDERS = BLOCKED / même résolveur
INVOICES = BLOCKED / même résolveur
STOCK = BLOCKED / même résolveur
FILES_CHANGED = ce rapport uniquement
TESTS = HTTP réel login/tenant/registre/products; lecture DB; réseau Dolibarr
BUILD = NOT_RUN / aucun changement applicatif
REMAINING_BLOCKERS = credential absent; sélection explicite et routage adaptateur à corriger
NEXT_STEP = fournir la clé localement, puis reprendre le correctif ciblé
```

## Cause et chaîne d'appel

Tenant vérifié : `8031055e-14af-4b43-979f-904e820306e9`, code `techzone-test`, ACTIVE.
`techzonetest` est non administrateur et son membership est ACTIVE.
Lecture Prisma du registre complet : **0 ligne**, donc aucune connexion Dolibarr existante, inactive ou associée à un autre tenant.

`GET /api/erp/products` appelle `ErpAdapterController.resolveErpFromTenant`, puis `ErpRegistryService.getActiveForTenant`.
Ce service interroge `prisma.eRPRegistry.findFirst({ where: { tenantId, status: 'ACTIVE' } })`.
L'absence de résultat produit `ErpError`, statut 503, code `ERP_INSTANCE_NOT_CONFIGURED`.
Modèle physique : `ERPRegistry` → `erp_registry` ; champs réels `id`, `tenantId`, `code`, `nom`, `type`, `url`, `status`, `capabilities`, `healthStatus`, `lastConnection`.
La création officielle utilise `ErpRegistryService.create` ; le statut par défaut est `inactive`.

Le modèle `ApplicationVersion` inspecté ne contient aucune relation ERP target/connection.
Aucun modèle distinct ERPConnection/ERPTarget/DetectionSnapshot/ERPContext trouvé dans le schéma actuel.
`AdapterRegistry` et `EntityMapping` existent ; ils ne constituent pas une sélection de connexion.
Le runtime `/api/erp/*` actuel ne reçoit pas de cible applicationVersion/environment : il choisit implicitement le premier ERP actif.
Ce comportement existant ne satisfait pas la consigne de sélection explicite et n'a pas été reproduit comme solution.

Autre défaut latent : le controller utilise le `code` du registre pour sélectionner un adaptateur global, alors que les clés disponibles sont `DOLIBARR` et `MOCK`.
Créer seulement `dolibarr_recette` ne suffirait donc pas : ce code n'est pas une famille d'adaptateur.
Le service `resolveAdapterForTenant` utilisé par Data Runtime crée un adaptateur tenant-scoped, mais conserve aussi la sélection implicite et un cache par tenant.

## Connectivité et secrets

Tests depuis le même poste serveur Node que le backend, sans secret envoyé :

| Requête Dolibarr | Résultat |
|---|---|
| `GET /` | HTTP 200, HTML |
| `GET /api/index.php/status` | HTTP 401, JSON |

Le réseau fonctionne. Le HTTP 401 ne permet pas de certifier les droits API, la version ou les modules.
L'adaptateur implémente API_KEY via l'en-tête `DOLAPIKEY`, chemin `/api/index.php`, timeout configurable (défaut 10 s).
`DOLIBARR_API_KEY` et `DOLIBARR_URL` sont absents de la configuration effective locale.

Emplacement où fournir les valeurs privées : **`backend/.env.local`**, ignoré par Git :

```dotenv
DOLIBARR_URL=http://167.86.71.186:8082
DOLIBARR_API_KEY=<clé API du compte Dolibarr de recette>
```

Ne pas envoyer la clé au frontend ni la copier dans ce rapport.
Ces variables sont reconnues par la configuration de l'adaptateur global ; les renseigner est un prérequis, **pas une correction suffisante** du résolveur tenant actuel.
Celui-ci remplace actuellement la clé par `capabilities.apiKey` : ce JSON est renvoyé tel quel par les endpoints Registry.
Ne pas y enregistrer un secret. La reprise devra utiliser une référence backend au secret et une connexion explicitement sélectionnée, sans fuite ni fallback global inter-tenant.

## Arrêt et portée

Les six fichiers EA0.0–EA0.5 demandés n'ont pas été trouvés par recherche de noms dans le projet, sous `D:\wifi zone\ERP`, ni dans les pièces jointes locales. Leur conformité détaillée n'est donc pas revendiquée.
EA0.0 expose list/create/update/delete ; update accepte status. Pas de mécanisme cible/version ni détection identifié dans les zones examinées.
EA0.2–EA0.5 : continuité non validée faute de connexion/context réel ; aucun développement engagé.

Aucune connexion partiellement configurée activée, aucune table inventée, aucune migration, aucune modification IAM ou UI, aucun accès métier distant effectué.
La recette cross-tenant et les données produits/clients/commandes/factures/stocks restent non exécutées.
Reprendre après fourniture du credential et des spécifications EA0.0/EA0.1 ; si leur cible persistante nécessite une migration, arrêt avant application comme demandé.
