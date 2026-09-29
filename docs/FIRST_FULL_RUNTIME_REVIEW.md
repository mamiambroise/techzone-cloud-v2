# Techzone Cloud — First Full Runtime Review

Recette du 27 septembre 2026. Référence initiale : `e59c073`. Aucun commit/push, aucune migration appliquée, aucune modification de `techzone/`.

**Verdict : application HTTP démarrable après corrections, mais authentification réelle cassée par la divergence des modèles IAM et de la base existante. E2E métier non validé.** PostgreSQL a alterné succès et timeouts. Ce rapport distingue observations réseau, inspection du code, tests unitaires et tests métier réels. Les anciennes recettes ne servent pas de preuve actuelle.

## Environment

Windows, PowerShell, Node 22.19.0, npm 10.9.3. Versions installées observées : NestJS 12, Prisma 7.10.0, Vite 6.4.3 (la documentation annonce 6.2). Certains outils Angular Devkit transitifs annoncent une version Node minimale supérieure : avertissement d'installation, builds réussis ici.

Un projet frontend (`frontend/`), un arbre backend canonique (`backend/src/`), zéro application Express indépendante. Express reste l'adaptateur HTTP NestJS. `backend/src/platform/` contient du code résiduel exclu du build; le module actif est `backend/src/modules/platform/`. Les dossiers supprimés n'ont pas été recréés. Les anciens projets cités dans les rapports historiques ne sont pas des applications actives.

Configuration initiale : `backend/.env` contient les clés DATABASE_URL et PORT; aucune configuration IAM de signature ni ERP. Deux clés de signature locales aléatoires ont été créées dans `backend/.env.local`, ignoré par Git et chargé par le lanceur. Aucun mot de passe utilisateur généré/modifié. DATABASE_URL inchangée. Le frontend utilise les valeurs relatives par défaut `/api` et `/api/iam`; proxy Vite vers 3003. Le CORS par défaut a été corrigé de 3001 vers 3000.

```text
DATABASE_CONFIG = PRESENT
IAM_CONFIG = PRESENT_LOCAL_AFTER_FIX
ERP_CONFIG = MISSING
FRONTEND_CONFIG = PRESENT_DEFAULTS
FRONTEND_PROJECT_COUNT = 1
BACKEND_SOURCE_TREE_COUNT = 1
ACTIVE_EXPRESS_APPLICATION_COUNT = 0
```

## Git State

```text
GIT_BRANCH = main
GIT_COMMIT = e59c073f8715c8e625877e2d9ccaaadbb34057d9
WORKING_TREE_INITIAL = CLEAN
REMOTE = origin:https://github.com/mamiambroise/techzone-cloud-v2.git
SECONDARY_REMOTE = jasmina:https://github.com/Jasmina123-ask/team4-platform-api-deployment.git
REMOTE_SYNC = main_equals_origin/main_equals_live_remote_main
WORKING_TREE_FINAL = MODIFIED_UNCOMMITTED
```

`git ls-remote origin refs/heads/main` a confirmé le même commit sur le serveur, sans modifier l'historique. Voir `full-runtime-review/git-final.txt` pour l'état final et les statistiques; les fichiers non suivis ne figurent pas dans `git diff --stat`.

## PostgreSQL

Preuve : [database.json](full-runtime-review/database.json). Série initiale : TCP/handshake/SELECT 1 réussis, puis deux timeouts TCP et SQL. Une série de lecture du catalogue a ensuite subi trois timeouts; des lectures ultérieures ont réussi. Il s'agit de `NETWORK_TIMEOUT` intermittent, pas d'une preuve de DATABASE_DOWN. L'accès SQL aux trois schémas a été démontré.

```text
POSTGRES_TCP = INTERMITTENT
POSTGRES_SQL = INTERMITTENT_SELECT_1_PASS_OBSERVED
AUTH_AIM_SCHEMA = PRESENT_READABLE
BUSINESS_MANAGER_SCHEMA = PRESENT_READABLE
ERP_ADAPTER_SCHEMA = PRESENT_READABLE
POSTGRES_STABILITY = INTERMITTENT
```

[catalog.json](full-runtime-review/catalog.json) recense 85 tables et leurs colonnes, sans valeur de credential. [schema-mapping.json](full-runtime-review/schema-mapping.json) distingue les noms Prisma des tables candidates existantes. Ce rapprochement statique ne valide pas les types, contraintes, enums ou une migration.

`prisma generate --config prisma7.config.ts` réussit. `prisma migrate status` trouve 12 migrations locales et quatre non appliquées : `20260830041423_init`, `20260910112326_add_feature_catalog`, `20260911053236_add_webhook_event`, `20260919000000_add_tenant_isolation`. Aucun SQL IAM n'est présent dans les migrations canoniques. Les historiques `auth_aim` et `business_manager` existent en base, mais ne constituent pas une chaîne de migration consolidée validée.

La migration tenant effectue un backfill vers `legacy`, impose NOT NULL et remplace des contraintes : **DATA_MIGRATION_REQUIRED**, pas une opération automatiquement sûre. Les autres SQL sont inventoriés dans `inventory.json`; leur classification lexicale est conservatrice, pas une autorisation d'application. L'état réel de la base et l'historique local divergent. Aucune commande migrate deploy/dev/reset/db push exécutée.

## Backend

Le premier démarrage échouait avant HTTP : Swagger 8 importait `@nestjs/common/interfaces`, inaccessible avec NestJS 12. Mise à niveau vers Swagger 12.0.2, dont les peer dependencies déclarent NestJS 12. Les deux essais suivants ont échoué pendant SELECT 1; un troisième a démarré. Le dernier build utilise un seul identifiant de schéma dans PrismaPg.

Preuve HTTP : [http.json](full-runtime-review/http.json). `/health` répond 200. `/ready` n'existe pas (404). `/api/iam/health` exécute SELECT 1 mais peut répondre HTTP 200 avec `success:false`; lire son contenu. `/api/iam/health/ready` retourne une constante `ready` sans vérifier les dépendances : **NO_OP de readiness**, jamais une preuve de disponibilité PostgreSQL.

Le login a produit une erreur Prisma sur le nom de schéma concaténé; corrigé. La recherche échoue ensuite parce que `business_manager.iam_user` n'existe pas. Il faut réconcilier les modèles avec `auth_aim.User` et les autres tables, sans créer un deuxième compte ou attribuer arbitrairement `isAdmin`.

```text
BACKEND_PROCESS = RUNNING_AFTER_FIX
BACKEND_PORT = 3003
BACKEND_HEALTH = HTTP_200
BACKEND_READY = NO_REAL_READINESS
BACKEND_DATABASE = INTERMITTENT_AND_MODEL_SCHEMA_MISMATCH
```

## Frontend

Vite démarre sur 3000; `/login` et ses ressources sont chargés par Edge headless. Le proxy transmet les 401 du backend. [browser.json](full-runtime-review/browser.json) contient les accès directs aux 92 destinations configurées. Aucun routage API simulé, aucune fausse session navigateur. Le formulaire de connexion a été réellement soumis avec le credential déjà disponible hors dépôt; réponse 500 et absence de cookie authentifié.

```text
FRONTEND_PROCESS = RUNNING
FRONTEND_HTTP = PASS
LOGIN_URL = http://localhost:3000/login
```

## Authentication

`techzonetest` est ACTIVE dans `auth_aim.User`. Il n'existe pas dans `erp_adapter.iam_user`. Aucune membership ni attribution directe de rôle trouvée pour ce compte dans les tables officielles. Les attributions héritées via groupes n'ont pas été validées; ne pas conclure à des permissions effectives nulles sur cette seule lecture. Aucun hash lu ou affiché. Le fichier de connexion privé préexistant a été utilisé en mémoire; aucun nouveau secret utilisateur n'a été écrit.

Le backend dérive actuellement `admin`/`user` depuis `isAdmin` et `ROLE_PERMISSIONS` dans `iam.constants.ts`, alors que la table officielle User ne possède pas `isAdmin`. Le simple changement de nom de table ne suffit pas. Les colonnes de reset et certaines dates de Device diffèrent aussi. **Réconciliation IAM requise, sans inventer de permissions.**

Correction frontend : après un login sans tokens dans le corps, AuthProvider demande maintenant `/api/iam/me`, au lieu d'attendre un objet `user` que le contrôleur ne retourne pas. Le chemin MFA reste partiel et affiche une limitation explicite.

```text
TEST_USER = techzonetest
TEST_ROLE = NOT_VALIDATED_NO_DIRECT_ASSIGNMENT
TEST_TENANT = NO_MEMBERSHIP_FOUND
PERMISSIONS_SOURCE = LOCAL_ROLE_PERMISSIONS_DIFFERS_FROM_DATABASE_ROLE_ASSIGNMENTS
LOGIN_REAL = FAIL_HTTP_500_SCHEMA_ERROR
COOKIE_HTTPONLY = STATIC_CONFIG_AND_UNIT_PASS_LIVE_BLOCKED
AUTH_ME_REAL = ANONYMOUS_401_AUTHENTICATED_BLOCKED
PROTECTED_ROUTE = ANONYMOUS_REDIRECT_PASS_AUTHENTICATED_UNIT_PASS
DASHBOARD_ACCESS = BLOCKED_AUTH
```

## Session

Le frontend envoyait un refresh vide alors que le DTO imposait un token dans le body. Le contrôleur accepte maintenant le cookie HttpOnly, conserve les clients explicites avec body et retourne 401 si aucun token n'est fourni. Trois tests ciblés passent. Les cookies sont déclarés HttpOnly, SameSite=Lax, Secure en production. Aucune session réelle n'a pu être créée : refresh navigateur authentifié, rotation réelle, logout, révocation et rejet post-logout restent **BLOCKED_AUTH**, pas PASS.

ProtectedRoute était monté comme route parente sans children et retournait undefined après authentification. Ajout d'Outlet; le test de rendu isolé [frontend-contract-check.json](full-runtime-review/frontend-contract-check.json) démontre le rendu enfant. Ce test utilise un contexte unitaire explicite et n'est pas une preuve d'authentification réelle.

## Tenant Context

Le contrôleur actif est `iam-context.controller.ts`; `IamContextService` n'est pas injecté dans IamModule. Les capacités présentes dans cette classe ne doivent pas être attribuées au contrôleur actif. Login transmet `tenantId` à createSession sans vérification de membership visible; le guard reprend ensuite le tenant du token. Risque critique statique; pas de tentative sur un tenant métier tiers. Les deux tenants de recette autorisés n'existent pas dans le contexte vérifié.

## Permissions

401 réel sur me, Applications et ERP Registry; 403 réel sur POST cross-site. Ce dernier n'est pas un test de permission IAM. Tests unitaires des guards et révocations : PASS. Les contrôleurs Applications n'ont pas de permission métier explicite; le guard de permissions laisse passer les routes sans métadonnée requise. Sidebar affiche toutes les entrées configurées sans filtrage par droits. Aucun droit supplémentaire accordé pour contourner les blocages.

## Entitlements

Service Prisma billing présent, mais routes Sidebar billing déléguées à DemoPage. Les entitlements commerciaux ne sont pas prouvés dans la décision d'accès aux pages métier. IAM permission et entitlement commercial restent distincts; aucune cohérence frontend/backend certifiée.

## Sidebar

Source centrale : `frontend/src/app/navigationConfig.js`, étendue par `erp/modulesConfig.js`. Le composant Sidebar et App utilisent ce catalogue. 92 entrées après correction de la clé Clients; aucune destination `/erp/undefined` restante. Matrice complète : [SIDEBAR_MATRIX.md](full-runtime-review/SIDEBAR_MATRIX.md).

Les 92 destinations sont ouvertes directement et aboutissent au login. Cela valide le comportement anonyme, pas le rendu connecté, les menus visibles après login ni les permissions. Le classement PARTIAL signifie présence du code avec recette métier bloquée; les placeholders et mocks identifiés statiquement sont séparés. Les totaux sont calculés dans le résumé final.

## Dashboard

PlatformService agrège des listes DB; frontend possède aussi du state initial métier. Chargement authentifié, données réelles, graphiques, refresh, empty/error states du dashboard : BLOCKED_AUTH. La page de connexion fonctionne; cela ne valide pas le Dashboard. Chargement de toutes les listes avant calcul des compteurs : risque performance statique.

## Business Manager

Applications : contrôleur/service Prisma présents, API client corrigé, données initiales hardcodées dans applicationsSlice. CRUD, validation, archivage, conflit et tenant scoping E2E : BLOCKED_AUTH/SCHEMA. Aucun modèle métier créé par la recette. La validation des packs et les métadonnées existent en UI/state sans preuve de moteur complet.

Les documents présents citent PF-CDC-00 à 06, DEP-CDC et WF-CDC; ils ne fournissent pas un découpage BM-CDC complet permettant de certifier toutes ses étapes. [PROJECT_IMPLEMENTATION_MATRIX.md](PROJECT_IMPLEMENTATION_MATRIX.md) indique les références réellement trouvées. BM-CDC-09, builders et AI Layer n'ont pas été développés.

## Pack Manager

Packs, versions, workspace, validation, publication et historique ont des écrans. Pas de moteur autonome Pack certifié. GeneralOverview simule le refresh par setTimeout; PublicationView affiche un toast de réussite sans publication API. Les dépendances et validations métier complètes ne sont pas démontrées.

```text
PACK_MANAGER_UI = PARTIAL
PACK_MANAGER_API = PARTIAL
PACK_MANAGER_ENGINE = NOT_IMPLEMENTED_AS_DEDICATED_ENGINE
PACK_PUBLICATION = NO_OP
PACK_RUNTIME = NOT_IMPLEMENTED_AS_DEDICATED_ENGINE
```

## Pack Runtime

Aucun moteur autonome de runtime Pack identifié. Les routes React et Data Runtime ne sont pas une preuve d'exécution de packs. Pas de développement pour compléter ce manque.

## ERP Registry

API Prisma CRUD présente et contrôles tenant explicites dans getOne/getByCode. Les colonnes tenantId attendues sont absentes d'erp_registry/entity_mapping dans le catalogue lu; migration locale en attente. Les tables sont dans erp_adapter, pas business_manager. Les credentials ERP n'ont pas été lus. CRUD, 409 et isolation réels : BLOCKED_AUTH/SCHEMA.

## ERP Adapter

DolibarrAdapter et MockAdapter sont enregistrés. Choisir MOCK est un chemin simulé, pas un succès Dolibarr. Le PHP local répond 202 à index.php et signale une connexion MySQL refusée; ce n'est pas une santé applicative. `ERP_EXTERNAL_UNAVAILABLE`. Aucune opération externe irréversible, aucun changement legacy.

## Data Runtime

DataAccessManager, provider ERP, QueryEngine, ExecutionEngine et validation existent. Historiques et bindings sont en mémoire. Tests unitaires indépendants passent; lecture/query/exécution intégrées restent bloquées. L'API frontend `GET /api/data-runtime/resources/:resource/:id` n'a pas de route correspondante dans le contrôleur inspecté.

## Query

Filtrage, tri, pagination et validation ont du code et des tests unitaires. Pas de preuve de requête réelle ERP pendant la recette. L'UI ne suffit pas à certifier le backend métier. Aucun stress test.

## Rules

ConditionsEngine et RulesEngine ont des évaluateurs et tests unitaires. Définitions stockées en Map. MockAutomation est chargé sans condition dans AutomationModule. FormulaEngine autonome non trouvé; ConditionsEngine ne prouve pas un moteur Formula complet.

## Workflow

WorkflowEngine stocke définitions/exécutions en mémoire. Tests unitaires réussis, mais les actions par défaut peuvent être sans handler. L'exécution durable, le résultat métier et l'audit persistant ne sont pas prouvés.

## Automation

`ActionEngine.executeAction` retourne SUCCEEDED quand aucun handler n'existe. MockAutomation enregistre `send.notification`, `workflow.start` et `data.update` sans handler. **NO_OP de production atteignable**, jamais REAL_PASS. Historique en mémoire; aucune automatisation réelle exécutée contre ERP.

## IAM Administration

Users, identities, roles, policies, tenants, sessions : écrans et API présents. Les imports de mockData ne signifient pas tous un mock métier : certains servent uniquement aux couleurs/configurations, d'autres sont inutilisés. Administration réelle, changement de statut, archive et erreurs de permission métier : BLOCKED_AUTH/SCHEMA. Aucun compte créé, archivé ou modifié.

## Subscription & Billing

Service backend Prisma présent (plans, subscriptions, invoices, payments, entitlements). Écrans canoniques Sidebar = placeholders. Aucun paiement, abonnement ou transaction financière déclenché. Persistance et règles commerciales non validées; ne pas présenter les maquettes comme moteurs réels.

## Observability

Service mixte : collecte mémoire de logs/audit/alertes et lectures Prisma; UI utilise des services réels mais conserve des événements de sécurité mockés dans Overview. TraceId présent sur les réponses NestJS mesurées. Aucun audit d'une mutation métier réussie démontré. L'historique mémoire n'est pas un audit durable.

## Multi-Tenant Isolation

```text
CROSS_TENANT_READ_LEAK = NOT_EXECUTED_STATIC_RISK
CROSS_TENANT_WRITE_LEAK = NOT_EXECUTED_STATIC_RISK
CROSS_TENANT_DELETE_LEAK = NOT_EXECUTED_STATIC_RISK
```

ApplicationsService.findAll ne filtre pas tenantScope; findOne/update/archive opèrent par ID sans principal. Login accepte un tenant demandé sans validation de membership visible. Ce sont des défauts critiques d'architecture d'accès constatés dans le code. Aucune fuite de données réelles entre deux tenants n'est affirmée sans preuve runtime. Corriger exige les règles officielles de scope et de rôle, sans inventer des permissions. Ne pas ouvrir aux utilisateurs multi-tenant avant cette reprise.

## Frontend ↔ Backend Contracts

98 appels dans 11 services préfixaient `/api` alors que l'instance Axios le faisait déjà : URL effective `/api/api/...`, démontrée avec getUri. Corrigés vers chemins relatifs au baseURL. Le test de contrat vérifie l'absence de ce double préfixe. Le contrat login et refresh a été corrigé séparément.

[CONTRACT_MATRIX.md](full-runtime-review/CONTRACT_MATRIX.md) recense 332 expressions d'appel statiques avec méthode, chemin et contrôleurs candidats. **Ce n'est pas un audit exhaustif de payloads** : bodies, DTO et réponses authentifiées non mesurés sont explicitement marqués non validés. Les query strings sont retirées pour comparer les routes. Le catalogue inclut du code non nécessairement appelé à chaque écran; les contrôleurs résiduels exclus sont signalés. Les appels dynamiques/fetch et imports conditionnels exigent une revue complémentaire.

Cas résiduels : endpoint execute API integration absent; lecture individuelle Data Runtime absente; action d'alerte dynamique non résolue statiquement; healthService essaie `/api/` puis `/api/config/public`. Aucune API créée pour satisfaire des appels historiques.

## Mock / NO-OP Inventory

[MOCK_INVENTORY.md](full-runtime-review/MOCK_INVENTORY.md) contient les occurrences pertinentes classifiées et l'index de recherche. `inventory.json` garde les 164 marqueurs bruts avec chemin/ligne et les éléments nécessitant une analyse de portée. Un marqueur Math.random de traceId/toast n'est pas automatiquement un mock métier. Les suites unitaires utilisant des doubles sont TEST_ONLY.

## UX

Login : formulaire réel, labels associés, bouton en attente et garde contre soumission concurrente. Message après échec réseau/backend visible; aucun crash React mesuré. Les formulaires métier, modales, empty states, 409/503, double clic et refresh après POST restent BLOCKED_AUTH. Pas de mutations de test risquées. Certains boutons de fermeture des formulaires IAM n'ont pas de label accessible (inspection statique).

## Responsive

Login testé en 1440×900, 768×1024 et 390×844 : pas de débordement horizontal, inputs et submit visibles. Pas de validation responsive des tables, modales ou Sidebar connectées. Pas de redesign.

## Security

Cookies configurés HttpOnly/Lax/Secure selon environnement. API anonyme = 401, POST avec Sec-Fetch-Site cross-site = 403, corps login vide = 400. Cette vérification ne constitue pas un audit CSRF complet. CORS d'origine locale contrôlé séparément. Aucune stack/SQL/credential dans les réponses NestJS mesurées. Les logs internes peuvent contenir les détails Prisma : ne pas les publier bruts.

JWT localStorage/sessionStorage : aucune clé détectée dans le navigateur anonyme; aucun stockage JWT actif identifié dans apiClient. Les objets utilisateur et fingerprints stockés ne sont pas des JWT. Le scan statique et son périmètre sont joints; ce n'est pas une garantie exhaustive d'absence de secrets. Une valeur de connexion de développement de secours subsiste dans PrismaService; aucun credential de production validé ou publié.

Le backend utilise des tables historiques dans auth_aim; cela ne signifie pas une dépendance HTTP vers l'ancien projet supprimé. Aucun service sur 5001 relancé. Les documents anciens contenant ce port ne sont pas une référence runtime. [security-scan.json](full-runtime-review/security-scan.json) décrit le scan de signatures des sources : zéro écriture JWT en storage, zéro référence runtime 5001/Auth_AIM et zéro référence frontend VITE secret détectées dans ce périmètre. L'absence universelle de secrets hardcodés n'est pas certifiée. CORS preflight réel : 204, origine autorisée localhost:3000, credentials=true. Un cookie d'accès invalide est réellement refusé en 401.

## Performance

Build frontend final et tailles : `inventory.json`. Entrée JS environ 545 kB non compressés (environ 159 kB gzip dans le build), plus CSS environ 122 kB. Plus gros chunk secondaire : ERPDashboard environ 423 kB; IntegrationsView environ 228 kB. 45 imports lazy dans App. Avertissement Vite au-delà de 500 kB, pas de boucle de requêtes démontrée.

Temps du premier login dev, requêtes et viewport : browser.json. Ce temps inclut Vite/dev et dépendances réseau, pas un benchmark production. Plusieurs ouvertures de pages provoquent naturellement des requêtes /me; ne pas les compter comme duplication applicative. Duplication intra-page et N+1 runtime connecté non mesurés. Static : décorateurs UseGuards répètent le guard global sur plusieurs routes; PlatformService charge des collections complètes pour ses KPIs. P2, pas d'optimisation spéculative.

## Tests

Build backend : PASS. Build frontend : PASS. Typecheck frontend : PASS. Prisma generate : PASS. Lint backend et frontend : sortie 0, respectivement 49 et 435 warnings. Preuve : [validation.json](full-runtime-review/validation.json). `git diff --check` ne signale pas d'erreur de whitespace.

Premier run backend complet : 246 tests découverts, 225 PASS, 21 FAIL; 31 suites, huit en échec. Vingt échecs dépendaient de PostgreSQL dans six suites Deployment; un échec attendait l'ancienne autorité IAM distante. Une suite Automation ne chargeait pas à cause du couple Swagger/Nest/ESM.

Après corrections : 26 suites indépendantes de Deployment, **246/246 tests PASS**, incluant Automation désormais chargée, trois tests refresh et le contrat IAM local corrigé. Six suites Deployment n'ont pas été relancées contre la base métier : leurs tests incluent déploiement/rollback/verrouillage sur des objets préexistants. Leur premier run demeure BLOCKED_DATABASE, pas ignoré ni transformé en PASS. Les six tests de construction de service y étaient PASS. Union des tests identifiés : **272 = 252 PASS + 20 BLOCKED_DATABASE**; cette union n'est pas un unique run final tout vert.

Frontend n'a pas de script npm test ni suite native identifiée. Contrôle isolé du rendu ProtectedRoute, du baseURL et des clés navigation : PASS; navigateur réel non authentifié : PASS dans son périmètre. Les tests unitaires avec doubles ne sont pas des E2E réels. Voir `tests-summary.json`.

## Fixes Applied

| ID | Correction | Preuve de vérification | Limite |
|---|---|---|---|
| F01 | Swagger 8 → 12.0.2 | Build, démarrage NestJS et chargement suite Automation | DB reste intermittente |
| F02 | Refresh depuis cookie HttpOnly | Trois tests unitaires + 401 réel sans cookie | Rotation authentifiée bloquée |
| F03 | Login frontend recharge /me | Contrat contrôleur/service inspecté, build | Login réel 500 |
| F04 | ProtectedRoute rend Outlet | Rendu imbriqué unitaire PASS | Session réelle indisponible |
| F05 | Retrait de 98 doubles préfixes API | getUri avant/après + scan des 332 appels | DTO/réponses métier non certifiés |
| F06 | Clé Clients restaurée | Route /erp/clients unique et visite navigateur | Données Dolibarr indisponibles |
| F07 | PrismaPg reçoit un seul schéma | Nouvelle erreur cible business_manager, plus le schéma concaténé | Modèles IAM à réconcilier |
| F08 | CORS 3000 par défaut, chargement .env.local | Config et HTTP | Clés locales hors Git |
| F09 | Test IAM distant obsolète remplacé par contrat local | Permissions issues DB user, révocation et MFA testées | Membership runtime non corrigée |

## P0 Issues

| ID | Module | Problème / preuve | Impact et cause | Correction recommandée | Statut |
|---|---|---|---|---|---|
| P0-01 | IAM/Prisma | Login 500; tables/mappings/colonnes incompatibles; migrations IAM absentes | Aucun compte utilisable dans l'application canonique | Réconcilier modèles et migrations avec auth_aim, conserver le compte et les droits officiels | OPEN — DATA_MIGRATION_REQUIRED |
| P0-02 | Tenant/Platform | tenantId non validé en création de session; Applications sans filtre tenant | Isolation non assurée par le code; exploit runtime non exécuté | Appliquer membership et scope officiels, tests deux tenants de recette | OPEN — STATIC_SECURITY_FINDING |

Le crash de démarrage Swagger et le parent React vide sont corrigés; ils ne figurent pas dans le nombre de P0 encore ouverts.

## P1 Issues

| ID | Module | Problème / preuve | Impact et cause | Correction recommandée | Statut |
|---|---|---|---|---|---|
| P1-01 | PostgreSQL | SELECT 1 passe puis timeouts | Démarrage et tests instables | Stabiliser réseau/service sans changer DATABASE_URL | OPEN_EXTERNAL |
| P1-02 | ERP Registry | tenantId absent, schéma distinct | CRUD/scoping non opérationnels | Migration revue avec attribution tenant légitime, pas backfill aveugle | OPEN |
| P1-03 | Automation/Pack | SUCCEEDED sans handler; publication toast seule | Faux succès métier | Marquer indisponible ou implémenter lors d'une mission dédiée | OPEN_NO_OP |
| P1-04 | IAM account | Compte ACTIVE sans membership ni rôle direct | Pas de persona de recette tenant vérifié | Attribuer uniquement les rôles/tenants officiels après revue | OPEN |
| P1-05 | Dolibarr | MySQL refusé, HTTP 202 | Parcours ERP indisponible | Rétablir le service externe et sa configuration | OPEN_EXTERNAL |
| P1-06 | Readiness | Réponse ready constante | Supervision trompeuse | Readiness réelle et statut indisponible explicite | OPEN |
| P1-07 | Contracts | Execute integration / lecture individuelle Data Runtime absents | Actions UI incomplètes | Décider du contrat canonique; ne pas recréer les anciennes API aveuglément | OPEN |

## P2 Issues

| ID | Module | Problème / preuve | Impact/cause | Action | Statut |
|---|---|---|---|---|---|
| P2-01 | Frontend | Entrée JS >500 kB | Coût de chargement | Mesurer production puis découper si utile | OPEN |
| P2-02 | UX/A11y | Boutons icon-only, labels de modal incomplets, libellés altérés | Accessibilité et compréhension | Revue connectée ciblée | OPEN |
| P2-03 | Observability | Événements mockés + stores mémoire | Audit non durable | Distinguer données de démo et audit réel | OPEN |
| P2-04 | Backend | Listes complètes pour KPIs, guard potentiellement répété | Requêtes supplémentaires | Mesurer sur parcours authentifié | OPEN |
| P2-05 | Tests | Suites Deployment utilisent des objets DB préexistants | Risque de mutation lors d'une relance | Fixtures isolées et nettoyage officiel avant relance | OPEN |

## P3 Issues

| ID | Module | Problème / preuve | Impact/cause | Action | Statut |
|---|---|---|---|---|---|
| P3-01 | Documentation | Versions, SameSite et architecture auth historiques divergentes | Instructions imprécises | Mettre à jour après décision IAM canonique | OPEN |

## Remaining Work

1. Réconcilier le schéma IAM et les droits existants; restaurer une chaîne de migrations examinée. Ne pas appliquer la liste pending telle quelle.
2. Stabiliser PostgreSQL, puis login réel/cookie/me/refresh/logout et persona tenant officiel. Aucun compte artificiellement administrateur.
3. Vérifier deux tenants de recette et corriger les risques statiques avant toute ouverture multi-tenant.
4. Reprendre CRUD, contrats payload/réponse, toutes les pages connectées, états UX, responsive métier, pagination et double soumission.
5. Rétablir Dolibarr puis parcours Registry → Adapter → Mapping → Query → Audit.

Les parcours complets sont détaillés dans [BUSINESS_JOURNEYS.md](full-runtime-review/BUSINESS_JOURNEYS.md). Les étapes non exécutées sont bloquées, pas en réussite.

```text
TEST_DATA_CREATED = 0_BY_RECIPE_APIS
TEST_DATA_CLEANED = 0
TEST_DATA_REMAINING = 0_KNOWN
ACCOUNT_PASSWORD_CHANGED = NO
DATABASE_MIGRATIONS_APPLIED = 0
```

Les suites Deployment ont été lancées une fois à la demande; leurs accès DB ont expiré. L'absence absolue d'effet tardif n'a pas été prouvée par audit transactionnel, donc le zéro ci-dessus concerne les créations volontaires via les scripts de recette.

## Final Runtime Status

Voir le résumé machine-readable généré ci-dessous et la matrice de vérité. Serveurs frontend/backend laissés disponibles pour inspection; login non fonctionnel. Aucun secret utilisateur dans ce rapport. Le mécanisme officiel de reset est POST `/api/iam/auth/forgot-password`, puis POST `/api/iam/auth/reset-password` avec token reçu et nouveau mot de passe. Il nécessite IAM/SMTP opérationnels; aucune UI reset canonique valide n'a été démontrée. Ne pas envoyer le mot de passe dans la conversation ou une commande conservée dans l'historique.

<!-- MACHINE_SUMMARY -->

```text
APPLICATION_START = PARTIAL_HTTP_RUNNING_AUTH_BROKEN
POSTGRESQL = INTERMITTENT
BACKEND = HTTP_RUNNING_SCHEMA_MISMATCH
FRONTEND = RUNNING
TEST_ACCOUNT = ACTIVE_NO_DIRECT_ROLE_OR_MEMBERSHIP
LOGIN = FAIL_500_SCHEMA_ERROR
COOKIE = LIVE_BLOCKED_STATIC_HTTPONLY
AUTH_ME = ANONYMOUS_401_AUTHENTICATED_BLOCKED
SESSION_REFRESH = BLOCKED_AUTH_UNIT_PASS
LOGOUT = BLOCKED_AUTH
PROTECTED_ROUTE = ANONYMOUS_PASS_AUTHENTICATED_UNIT_ONLY
TENANT_CONTEXT = BROKEN
PERMISSIONS = PARTIAL_AUTHORITY_MISMATCH
ENTITLEMENTS = PARTIAL
DASHBOARD = BLOCKED_AUTH
BUSINESS_MANAGER = PARTIAL
PACK_MANAGER = PARTIAL
PACK_RUNTIME = NOT_IMPLEMENTED
ERP_REGISTRY = BROKEN_SCHEMA
ERP_ADAPTER = BLOCKED_EXTERNAL
DATA_RUNTIME = PARTIAL
QUERY_ENGINE = PARTIAL
RULES_ENGINE = PARTIAL
FORMULA_ENGINE = NOT_IMPLEMENTED
WORKFLOW_ENGINE = PARTIAL
AUTOMATION_ENGINE = PARTIAL_NO_OP_DEFAULT_ACTIONS
IAM_ADMIN = BROKEN_SCHEMA
SUBSCRIPTION = PARTIAL
BILLING = PARTIAL
OBSERVABILITY = PARTIAL_MIXED_DATA
MULTI_TENANT_ISOLATION = NOT_VERIFIED_STATIC_CRITICAL_RISK
SIDEBAR_TOTAL = 92
SIDEBAR_REAL_PASS = 0
SIDEBAR_PARTIAL = 77
SIDEBAR_PLACEHOLDER = 14
SIDEBAR_MOCK = 1
SIDEBAR_BROKEN = 0
REAL_COMPONENTS = 2
PARTIAL_COMPONENTS = 15
MOCK_COMPONENTS = 1
NOT_IMPLEMENTED_COMPONENTS = 2
BROKEN_COMPONENTS = 5
BLOCKED_EXTERNAL_COMPONENTS = 1
P0_COUNT = 2
P1_COUNT = 7
P2_COUNT = 5
P3_COUNT = 1
BACKEND_BUILD = PASS
FRONTEND_BUILD = PASS
TYPECHECK = PASS
LINT = PASS_WITH_WARNINGS
TESTS_TOTAL = 272
TESTS_PASS = 252
TESTS_REAL_FAILURE = 0
TESTS_INFRA_FAILURE = 0
TESTS_BLOCKED_DATABASE = 20
TESTS_BLOCKED_ERP = 0
TEST_RESULTS = 246_FINAL_INDEPENDENT_PASS_PLUS_6_INITIAL_DB_CONSTRUCTION_PASS_AND_20_DB_BLOCKED
E2E_STATUS = BLOCKED_AUTH_SCHEMA_AND_EXTERNAL_ERP
LAST_REAL_PASS = ANONYMOUS_HTTP_GUARDS_AND_LOGIN_PAGE
FIRST_REAL_BLOCKER = IAM_SCHEMA_MAPPING_AND_MISSING_COLUMNS
```

Counts describe matrix rows, not every component file. P counts are open issues. Sidebar BROKEN=0 means no remaining statically broken destination identified; it does not validate connected rendering.
