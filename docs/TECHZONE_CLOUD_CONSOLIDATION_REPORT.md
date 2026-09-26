# TECHZONE CLOUD — CONSOLIDATION REPORT

Audit commencé le 25 septembre 2026, reprise de recette le 26 septembre 2026.

**Résultat : consolidation partielle, sans reconstruction. Les builds des trois applications compilées passent. L’authentification par cookies et les contrats de sécurité corrigés passent leurs tests isolés. La recette métier authentifiée n’est pas validée : le compte du seed est refusé par la base réelle et PostgreSQL présente des timeouts intermittents.**

Aucune nouvelle fonctionnalité BM-CDC-09/10+, Page Builder ou AI Layer développée. Un fichier présent, un build réussi, un mock et une fonctionnalité métier vérifiée ne sont pas assimilés.

**Dernier état du 26 septembre : frontend lancé sur 3000 ; les trois API ne redémarrent pas avec succès, leurs connexions PostgreSQL expirant.** Les réponses HTTP positives du 25 septembre sont des observations historiques, pas une disponibilité actuelle. La recette finale reste PARTIAL/BLOCKED par cette dépendance externe.

## A. BEFORE — architecture et protection

- Branche initiale : `main`, HEAD `eb4ffd1`. Nombreuses modifications utilisateur et sources non suivies déjà présentes, y compris les phases frontend 2.2–2.4.
- Point de récupération des changements **suivis** : `refs/checkpoints/pre-consolidation-20260925`, créé sans toucher à l’index utilisateur. Ce point n’inclut pas les fichiers non suivis. Des copies avant édition sont conservées localement dans `logs/consolidation-backup/` pour les traitements de consolidation.
- Quatre frontends React, trois responsabilités serveur actives et une copie supplémentaire de l’API plateforme ; ERP Dolibarr PHP séparé.
- Le lanceur utilisait les anciennes interfaces Business/ERP aux ports 3007/3100. Le frontend racine déjà consolidé n’était pas lancé.
- Le frontend racine compilait, disposait déjà de lazy loading, mais attendait une authentification cookie absente des serveurs. Plusieurs pages IAM simulaient une réussite après erreur API.
- L’API plateforme ne compilait pas : guards sans `canActivate`, dépendance JWT manquante, accès au logger privé, contrôleur de configuration incomplet et non enregistré.

Inventaire de fichiers : [repository-files.json](consolidation/repository-files.json). Comparaison des copies par chemin et SHA-256 : [duplicate-comparison.json](consolidation/duplicate-comparison.json). Les dépendances installées, `.git`, builds, logs et caches ne sont pas assimilés à des sources applicatives.

## B. CANONICAL ARCHITECTURE / REPOSITORY MAP

| Path | Type / responsabilité | Entrypoint | Port | Dépendances principales | Statut / choix |
|---|---|---|---:|---|---|
| `frontend/` | React/Vite, console unifiée | `src/main.jsx`, `src/App.jsx` | 3000 | React 19, Router 6, Redux, Axios, 3 API | CANONICAL ; build et contrôle TS PASS |
| `Auth_AIM/backend/` | Express, identité/IAM/contexte, tenant/billing/admin | `src/server.js` | 5001 | Prisma 6, PostgreSQL `auth_aim` | ACTIVE_SERVICE, autorité IAM canonique |
| `new erp-adapter-platform/backend/` | Nest, ERP/Data/Query/Execution/Automation | `src/main.ts` → `dist/src/main.js` | 3002 | Prisma 5, PostgreSQL `erp_adapter`, IAM, adaptateur Dolibarr | ACTIVE_SERVICE, canonique pour ces moteurs |
| `backend/` | Nest, Platform/Integration/Deployment | `src/main.ts` → `dist/main.js` | 3003 | Prisma 7/pg, PostgreSQL `business_manager`, contrats IAM | ACTIVE_SERVICE, canonique |
| `techzone/` | ERP Dolibarr PHP indépendant | `htdocs/index.php` | 8080 | PHP, MySQL/MariaDB | ACTIVE_SERVICE externe ; MySQL indisponible |
| `team4-platform-api/frontend/` | Ancienne console plateforme | `src/main.jsx` | ancien 3007 | ancien auth/localStorage/iframe | LEGACY, conservé hors lancement |
| `team4-platform-api/backend/` | Copie API plateforme | `src/main.ts` | selon son `.env` | Prisma 7, PostgreSQL local | DUPLICATE avec différences ; conservé |
| `Auth_AIM/frontend/` | Ancienne console IAM/admin/billing | `src/main.jsx` | Vite, non lancée | React 19/Router 7, Auth/IAM | LEGACY avec fonctions uniques |
| `new erp-adapter-platform/frontend/` | Ancienne console ERP CRA | `src/index.js` | ancien 3100 | React 18/CRA, ERP/IAM | LEGACY avec fonctions uniques |
| `backend/src/platform/` | Brouillon configuration non enregistré | aucun module actif | — | imports/DTO/service manquants | INCOMPLETE ; exclu du build, conservé |
| `scripts/dev-all.mjs` | Orchestration locale | scripts npm racine | — | Node, npm, PHP facultatif | CANONICAL |
| `scripts/dev.mjs` | Compatibilité ancien entrypoint | import du lanceur canonique | — | lanceur canonique | consolidé |

Les trois backends sont des services distincts : pas de fusion artificielle. Le dossier nommé `business_manager` dans PostgreSQL n’est pas une preuve de présence des moteurs Business Manager demandés.

## C. DUPLICATES — comparaison, migration, conservation

| Copie comparée à la racine | Identiques | Différents | Uniques après récupération | Décision |
|---|---:|---:|---:|---|
| `team4-platform-api/frontend` | 17 | 50 | 5 | conservée : revue sémantique complète des différences non terminée ; auth/iframe non repris |
| `team4-platform-api/backend` | 217 | 43 | 3 | conservée : différences de services/configuration/tests à arbitrer avant suppression |
| `Auth_AIM/frontend` | 0 | 12 | 141 | conservée : écrans billing/admin/context/MFA non tous migrés |
| `new erp-adapter-platform/frontend` | 0 | 23 | 26 | conservée : Mapping, Adapters, Settings et parcours IAM notamment |

Les nombres comparent les chemins et contenus, pas les fonctionnalités équivalentes. Le détail est dans le JSON de comparaison. Aucun dossier UNKNOWN ni donnée utilisateur supprimé.

Code utile récupéré de l’ancienne console ERP, avec adaptation des imports vers `services/apiClient.js` et les loaders canoniques :

- `DataRuntime.jsx`, `DataRuntimeHistory.jsx` ;
- `AutomationCockpit.jsx`, `AutomationConditions.jsx`, `AutomationHistory.jsx`, `AutomationRules.jsx`, `AutomationTriggers.jsx`, `AutomationWorkflows.jsx`.

Ces huit pages remplacent les placeholders correspondants dans `frontend/src/App.jsx` et utilisent le lazy loading existant. Les moteurs backend n’ont pas été recréés. La navigation détaillée de toutes les sous-pages reste à enrichir ; les URL sont disponibles.

**Le critère « plus aucun doublon inutile » n’est pas certifié.** Une suppression massive aurait retiré du code unique ou non complètement comparé. Aucun build après suppression de dossier n’est revendiqué.

## D. FUNCTION MATRIX

« API présente » signifie un endpoint et une implémentation inspectés. Le statut ci-dessous est celui du parcours complet, pas seulement du fichier ou du test unitaire.

| Fonction | Implémentation principale | Frontend | Backend / DB / réel-mock | Build / tests / runtime | État |
|---|---|---|---|---|---|
| Auth | `Auth_AIM/backend/src/{controllers,services}/auth*` | login, provider, protected routes | PostgreSQL ; cookies corrigés | HTTP isolé PASS ; login réel seed 401 | PARTIAL |
| IAM | `Auth_AIM/backend/src/routes`, `services` | 6 pages racine | API users/sessions réelle ; plusieurs CRUD absents | rendu d’erreur testé ; métier non validé | PARTIAL |
| Tenant | `adminTenant`, `contextResolver` | TenantsPage | Prisma Tenant/Membership ; contrats existants | SQL IAM accessible par intermittence | PARTIAL |
| Billing / plans / quotas / entitlements | services IAM billing | surtout ancien frontend IAM | modèles/contrats présents ; tables Feature/WebhookEvent ajoutées | pas de parcours commercial authentifié | PARTIAL |
| ERP Registry | `erp-registry/` | liste/création/édition racine | PostgreSQL ; schéma tenant à vérifier | build PASS ; 401 réel PASS | PARTIAL |
| ERP Adapter | `erp-adapter/` | modules/dashboard | Dolibarr réel ou MOCK explicite | tests unitaires PASS ; MySQL Dolibarr indisponible | PARTIAL |
| Data Runtime / binding | `data-runtime/` | pages récupérées | provider ERP, validation, historique ; parties en mémoire | tests unitaires PASS ; API protégée 401 | PARTIAL |
| Query | `data-runtime/query-engine/` | page DataRuntime | moteur existant, provider abstrait | tests unitaires PASS | PARTIAL |
| Execution | `data-runtime/execution-engine/` | via contrats Data Runtime | moteur existant | pas d’exécution métier réelle authentifiée | PARTIAL |
| Rules | `automation/rules/` | page récupérée | moteur réel, règles démo enregistrées | tests unitaires PASS | PARTIAL |
| Formula / Conditions | `automation/conditions/` | page conditions récupérée | évaluateur déclaratif ; pas de moteur Formula séparé établi | tests unitaires PASS | PARTIAL |
| Workflow | `automation/workflow/` | page récupérée | moteur existant, stockage/configuration de démo | tests unitaires PASS | PARTIAL |
| Triggers / Actions / Automation | `automation/{trigger,action,mock}` | pages récupérées | `MockAutomation` actif ; action sans handler = no-op | contrats présents, pas d’effet métier complet démontré | PARTIAL |
| Business Manager | UI plateforme ; `backend/src/modules/platform` | catalogues/configuration/validation | Application/Version/Contract/Snapshot présents ; série BM complète non identifiée | aucune chaîne BM complète testée | PARTIAL |
| Data Model / Feature & Capability Managers BM | aucune implémentation distincte établie | non établie | ne pas confondre Feature billing avec BM | NOT_FOUND dans inventaire applicatif | NOT_TESTED |
| Pack Manager | `PackValidationCockpitView.jsx` et vues démo | présent comme cockpit | service dédié definitions/dependencies/manifest non établi | vue ≠ moteur Pack | MOCK_ONLY |
| Pack Runtime | aucune implémentation dédiée établie | non établie | loader manifest/résolution dépendances non trouvés | NOT_FOUND | NOT_TESTED |
| UI Runtime | shell React/router existant | navigation réelle | runtime de manifest de pack non trouvé | rendu React testé ; Pack→UI non testé | PARTIAL |
| Observability | IAM `observability`, `logsManager`, `auditManager`, `security`, `alertManager` | 6 pages | dashboard synthétique désactivé ; logs/audit/alerts en mémoire ; security Prisma | erreurs visibles ; télémétrie réelle non connectée | PARTIAL |
| Platform Administration | IAM `admin*` | principalement ancien frontend IAM | contrats et modèles présents | couverture frontend canonique incomplète | PARTIAL |
| Publication / Deployment / Rollback | `backend/src/modules/deployment` | vues racine | données Prisma, providers/mécanismes simulés à distinguer | build PASS ; suite initiale dépendante DB en échec partiel | PARTIAL |

## E. REAL VS MOCK / contrats manquants

| Source | Classification | Preuve / limite |
|---|---|---|
| IAM auth/users/sessions/context/tenant/billing | REAL_API | routes Express + services Prisma ; succès métier non validé sans compte |
| ERP Registry et Dolibarr adapter | REAL_API | Prisma et appels Dolibarr ; dépendance MySQL indisponible |
| ERP MockAdapter | MOCK | sélection explicite du provider MOCK ; tests ne prouvent pas Dolibarr |
| Automation mock bootstrap | DEV_MOCK | `automation/mock/mock.automation.ts` initialisé au démarrage |
| Action Engine sans handler | MOCK/no-op | journal `Action ... executed (no-op handler)` |
| IAM dashboard/health/metrics Observability | MOCK_ONLY → erreur 503 explicite | `observability.service.js` contient des constantes ; routes désactivées plutôt que faux état réel |
| IAM logsManager/auditManager/alertManager | REAL_API, mémoire volatile | tableaux `logStore`, `auditStore`, `alertStore` ; pas de persistance ni collecte complète prouvée |
| Security events IAM | REAL_API | service Prisma distinct du dashboard fictif |
| Platform frontend stores | MOCK + REAL_API selon vue | jeux initiaux dans `frontend/src/store/*Slice.js`, appels services sur certaines vues ; pas de certification globale « tout réel » |
| Platform integration provider | MOCK | `backend/src/common/providers/mock-integration.provider.ts` |
| Publication artifacts | PARTIAL | certaines références/digests par défaut générés, pas de preuve de déploiement externe réel |

Contrats frontend IAM absents/incomplets constatés : `POST /users`, `DELETE /users/:id`, CRUD `/identities`, CRUD `/policies`, plusieurs mutations roles/tenants, `/alerts/rules`. Ils ne sont pas recréés dans cette mission. Les erreurs ne produisent plus de faux CRUD local dans les pages IAM.

Correction simple Alert Manager : les instances sont lues via `/alerts`, l’acquittement/résolution passent par les POST existants `/:id/acknowledge` et `/:id/resolve`. Les règles ne sont plus alimentées à tort par la liste des instances. Les actions non supportées échouent explicitement.

Les contrats Data Runtime et Automation versionnés existent dans leurs dossiers `interfaces`. La chaîne Producer→Contract→Consumer n’est pas validée pour les packs, faute de runtime dédié identifié.

## F. FRONTEND

- Build initial : PASS. Lint annoncé = **`tsc --noEmit`**, PASS ; ce n’est pas un lint JS exhaustif (`checkJs` non activé).
- Lazy loading au niveau des routes déjà présent avant intervention ; conservé et étendu aux pages récupérées, pas de réécriture aveugle.
- Bundle initial mesuré : entrée JS **546,12 kB / 157,04 kB gzip**, chunk dashboard ERP **424,31 kB / 115,74 kB gzip**. Le seuil 500 kB produit toujours un avertissement ; ce n’est pas un échec de build.
- Mesure finale : entrée JS **549,82 kB / 158,27 kB gzip**, dashboard ERP **424,02 kB / 115,78 kB gzip** ; détails dans `logs/consolidation-frontend-final-build.log`. Les nouveaux écrans sont des chunks différés. Aucune réduction globale arbitraire revendiquée : huit écrans supplémentaires ont été conservés.
- Port corrigé : script npm et Vite alignés sur 3000, `--strictPort`.
- Login redirige après authentification ; la nécessité MFA est signalée, mais le parcours MFA complet n’est pas encore migré dans la console racine.
- Refresh tenté au démarrage après 401 de `/me`. Une panne de boot ne marque plus l’API CONNECTED.
- Suppression des fallbacks IAM conditionnés à `DEV`, absence de données fictives de remplacement en cas d’erreur. Bannière d’erreur centrale avec traceId.
- [Recette navigateur](consolidation/browser-results.json) : redirection réelle vers login PASS ; 54 routes sans exception JS sous doubles HTTP explicites renvoyant des erreurs. Ce test valide le rendu d’erreur, pas un CRUD réel. [Capture login](consolidation/login.png).

## G. BACKEND / SERVICES / validation

| Application | Build | Lint/typecheck | Tests | Démarrage constaté |
|---|---|---|---|---|
| Frontend racine | PASS | PASS (`tsc --noEmit`) | navigateur : 54 routes, aucun pageerror dans scénario documenté | 3000 HTTP 200 |
| Auth/IAM | JS, pas de script build | pas de script lint existant | 4 tests Node PASS, dont HTTP avec services simulés | 5001 `/health` 200 |
| Platform racine | PASS après corrections | oxlint PASS | initial : 68/88 PASS, 20 échecs dans 6 suites liées DB/fixtures ; 4 tests sécurité ajoutés PASS | 3003 `/health` 200 le 25/09 ; bloqué DB le 26/09 |
| ERP/Data/Automation | PASS | FAIL : script ESLint sans exécutable/configuration installés | suite finale : 177 tests PASS (14 suites) | 3002 `/api/config/public` 200 le 25/09 ; bloqué DB le 26/09 |
| Dolibarr | non compilé dans cette mission | non testé | accès PHP retourne erreur MySQL | non opérationnel |

Les backends ont été relancés lors de la reprise du 26 septembre. Leur disponibilité finale se lit dans [health-results.json](consolidation/health-results.json), et les logs `logs/consolidation-launch-20260926.log`. Un port ouvert ne certifie pas la base ; le lanceur conserve une vérification principalement de processus/port.

Les contrats plateforme refusent aussi un contexte IAM PARTIAL/non résolu, même sur une route sans métadonnée de permission. Tests de refus de session révoquée et de contexte non résolu : PASS. Résumé des validations : [validation-results.json](consolidation/validation-results.json).

ERP `start:prod` pointe désormais sur le véritable fichier compilé `dist/src/main.js` et charge `.env`. Les retries PostgreSQL ERP s’arrêtent après huit tentatives au lieu de boucler indéfiniment en annonçant un redémarrage automatique inexistant.

## H. DATABASE / PRISMA

Voir [le diagnostic complet répondant aux dix points demandés](consolidation/DATABASE_DIAGNOSIS.md).

- Même base distante `techzonecloud`, trois schémas conservés. PostgreSQL 16.15 confirmé par SQL ; connexions intermittentes.
- Migrations IAM additives Feature/WebhookEvent appliquées avec `prisma migrate deploy` après inspection du SQL. Aucune suppression/modification des anciennes données par ces migrations.
- Migrations plateforme inventoriées et appliquées d’après la première lecture ; inventaire des tables conforme aux modèles inspectés.
- Migration tenant ERP non appliquée automatiquement : son backfill `legacy` ne doit pas inventer le rattachement métier des anciennes données.
- PostgreSQL Windows 18 local déjà démarré ; ce n’est pas la cible des services actifs. Docker absent du PATH. Aucun `.env` modifié, aucune base créée, aucun reset/DROP.

## I. CORRECTIONS EFFECTUÉES

| Priorité | Correction | Validation / limite |
|---|---|---|
| P0 | Implémentation `canActivate` des guards Nest | build plateforme + tests de guards PASS |
| P0 | dépendance JWT et types ; accès logger corrigé | build plateforme PASS |
| P0 | brouillon `src/platform` exclu du build, module actif `src/modules/platform` conservé | brouillon non enregistré, non supprimé ; fonctions spécifiques à revoir |
| P0 | entrypoint ERP `start:prod`, arrêt des retries infinis | build et démarrage ERP constatés |
| P1 | émission/lecture/rotation/effacement des cookies HttpOnly | HTTP isolé PASS ; login réel non validé |
| P1 | délégation IAM pour session/contexte/permissions des consommateurs | tests sécurité PASS ; pas de droits ADMIN déduits aveuglément d’un nom de rôle |
| P1 | refus de token MFA/step-up utilisé comme access token ; refresh ROTATED reconnu comme réutilisation | tests token challenge PASS ; concurrence de refresh non auditée complètement |
| P1 | lancement frontend canonique, port aligné, redirection login, refresh après 401 | navigateur PASS |
| P1 | suppression des réussites IAM simulées après erreur ; traceId visible | navigateur sous panne API PASS |
| P1 | dashboard Observability statique déclaré non connecté | 503 explicite, aucune télémétrie inventée |
| P1 | migrations IAM manquantes, additives | migrate deploy PASS |
| P2 | récupération des huit écrans existants Data/Automation | build + rendu d’erreur PASS |
| P2 | tests MockAdapter alignés sur les fixtures existantes de 8 produits/5 commandes | 174 tests existants PASS ; assertions CRUD conservées |
| P2 | correction contrats Alert Manager | build ; API authentifiée non testée |
| P2 | corrections npm compatibles seulement | frontend 5→2 vulnérabilités, IAM 4→3 ; aucune utilisation de `--force` |

## J. FILES REMOVED

**Aucun dossier legacy supprimé, aucune donnée supprimée.** Les suppressions Git de `frontend/src/api/*` et `frontend/src/utils/api.js` étaient présentes avant cette intervention ; ne pas les attribuer à ce nettoyage.

`scripts/dev.mjs` est conservé comme délégation au lanceur canonique : son ancienne orchestration dupliquée a été remplacée. Les scripts temporaires de transformation créés uniquement pendant cette intervention ont été retirés après exécution ; les scripts reproductibles de diagnostic/recette sont conservés.

DEPENDENCY_CHECK/UNIQUE_CODE_MIGRATED/BUILD_BEFORE_DELETE/BUILD_AFTER_DELETE : aucune suppression importante soumise à ces gates. Le nettoyage physique des copies n’est donc pas validé.

## K. SECURITY REGRESSION

| Contrôle | Résultat | Périmètre / réserve |
|---|---|---|
| JWT localStorage/sessionStorage | PASS, aucun JWT ajouté | console canonique ; anciennes consoles conservent leurs anciennes pratiques |
| IFRAME | 0 dans console testée | ancien `ErpEmbedView` conservé hors lancement |
| Cookie Auth | PASS en test HTTP isolé | HttpOnly, SameSite=Strict, Secure en production, chemins /api et /api/iam/auth ; tokens absents du JSON |
| 401 | PASS réel | `/me`, users, plateforme, ERP/Data/Automation sans session |
| 403 | PASS isolé | permission absente, tenant différent, requête cross-site ; pas de preuve métier réelle complète |
| Session révoquée côté ERP | PASS isolé | refus via autorité IAM, pas seulement signature JWT |
| Tenant isolation | PARTIAL | guards testés ; pas de test end-to-end DB inter-tenants, contrôleurs plateforme pas tous couverts |
| Frontend secrets | aucun secret réel injecté identifié dans client/Vite inspectés | fixtures/valeurs d’exemple présentes ; pas de certification exhaustive du dépôt PHP/legacy |
| Hardcoded origins | pas d’origine backend absolue dans le transport navigateur canonique par défaut | URLs d’exemple dans stores/écrans et cibles localhost de proxy subsistent ; critère global littéral ≠ 0 |
| Direct DB frontend | aucun accès identifié dans le frontend canonique | Prisma côté serveur |
| Unsafe eval | aucun appel identifié dans le frontend canonique/moteur de conditions inspectés | pas de certification du code tiers Dolibarr |

Les guards globaux ne suffisent pas à certifier toutes les permissions et tous les scopes des contrôleurs plateforme. Le brouillon de configuration protégée ne constitue pas une implémentation complète de masquage des secrets. Ces points restent à auditer avant production.

## L. END-TO-END — preuves et limite exacte

1. Démarrage du frontend et des trois API constaté ; disponibilité variable de la base.
2. Connexion anonyme à `/cockpit` : redirection vers `/login` dans Edge headless.
3. Requêtes API protégées sans session : 401 réels.
4. Tentative avec les identifiants du compte de développement déjà documentés dans le seed, sans seed ni création de compte : **401 INVALID_CREDENTIALS**.
5. Arrêt du parcours authentifié à cette étape. Tenant→entitlements→application→pack→ERP→workflow→UI→audit **non validé**. Pack Runtime et plusieurs liens sont également non établis.
6. Séparément, tests avec doubles explicites : cookie login/me/refresh/logout, refus 401/403, permissions/tenant, rendu d’erreur de 54 routes. Ils ne sont pas présentés comme une recette PostgreSQL réelle.

Preuves : [live-smoke-results.json](consolidation/live-smoke-results.json), [browser-results.json](consolidation/browser-results.json), [health-results.json](consolidation/health-results.json). Aucun mot de passe, cookie ou token écrit dans ces fichiers.

## M. REMAINING ISSUES

| Priorité | Point restant | Prochaine action nécessaire |
|---|---|---|
| P0 exploitation | timeouts intermittents du PostgreSQL distant | stabiliser accès réseau/serveur ; les tests ne permettent pas d’attribuer précisément la cause |
| P1 recette | compte seed refusé | fournir un compte de recette valide via configuration locale, puis reprendre le parcours réel |
| P1 sécurité | permissions/scopes plateforme incomplets ; isolation DB inter-tenants non certifiée | audit des routes actives et tests avec comptes/tenants de recette |
| P1 ERP | migration/rattachement tenant des anciennes données non validé ; Dolibarr MySQL indisponible | vérifier schéma ERP et correspondances tenant ; démarrer l’instance MySQL prévue si disponible |
| P1 fonctionnel | contrats IAM CRUD manquants, MFA frontend non migré | récupérer/brancher les implémentations existantes après comparaison, sans inventer des réponses |
| P1 visibilité | Observability dashboard/monitoring non connectés | raccorder de véritables mesures ; l’erreur 503 actuelle est intentionnelle et honnête |
| P2 | lint ERP indisponible | installer/configurer l’outil cohérent avec ce service ; le build TS ne le remplace pas |
| P2 | suite plateforme dépendante de DB/fixtures | préparer une base de test isolée ; ne pas exécuter aveuglément des tests de mutation sur la base partagée |
| P2 | copies conservées et fonctions legacy uniques | terminer la comparaison sémantique/migration avant suppression |
| P2 | dépendances vulnérables restantes | [inventaire par package, sévérité, direct/transitif, correction/risque](consolidation/NPM_AUDIT.md) |
| P2 | logs/audit/alerts et moteurs partiellement en mémoire ; actions no-op | distinguer persistance, simulation et effets réels dans la prochaine recette |
| P3 | chunk d’entrée >500 kB, navigation des sous-pages récupérées | optimisation ciblée après stabilisation, sans refaire les écrans |

Npm audit a été exécuté sur huit projets. Restants à la dernière collecte : frontend 2 modérées ; Auth/IAM 3 élevées ; plateforme 7 élevées/3 faibles ; ERP backend 8 élevées/12 modérées/4 faibles. Les anciennes consoles conservent leur propre dette. La correction compatible plateforme a rencontré ERESOLVE ; pas de contournement `--force`/`--legacy-peer-deps`. Les avertissements d’engine de certaines dépendances CLI sont également conservés, Node observé : 22.19.0.

**La préparation d’une production et la consolidation totale ne sont pas certifiées.** Les corrections livrées, les migrations additives, les tests réussis et les blocages sont séparés ci-dessus pour décider de la suite sans faux PASS.
