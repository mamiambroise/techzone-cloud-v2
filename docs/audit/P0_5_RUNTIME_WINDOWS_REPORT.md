# TECHZONE CLOUD — P0.5

Date : 2026-09-28. Verdict : **BLOCKED_DATABASE — phase non complète**.

```text
P0_REGRESSION_CHECK = PASS ciblé, limites documentées ci-dessous
TEST_USER = techzonetest
TEST_USER_STATUS = ACTIVE / NON_ADMIN
TEST_PASSWORD = CONFIGURED
TEST_TENANT = Techzone Test / techzone-test
TENANT_MEMBERSHIP = ACTIVE
TENANT_CONTEXT = REAL_PASS
WINDOWS_START = PASS
WINDOWS_STOP = PASS
WINDOWS_RESTART = PASS (after build completion)
WINDOWS_STATUS = PASS
WINDOWS_TEST = FAIL / BLOCKED_DATABASE
LOCAL_MODE = SERVICES_READY / BUSINESS_SCHEMA_BLOCKED
REMOTE_MODE = SUPPORTED / NOT_EXECUTED
BACKEND_BUILD = PASS
BACKEND_TESTS = FULL_SUITE_FAIL; TARGETED_67_PASS
BACKEND_LINT = PASS_WITH_WARNINGS
FRONTEND_BUILD = PASS (bundle size warning)
FRONTEND_TYPECHECK = PASS
FRONTEND_LINT = PASS_WITH_WARNINGS
FRONTEND_TESTS = PASS / 43 tests / 8 files
HEALTH = REAL_PASS / HTTP 200
READINESS = REAL_PASS / HTTP 200 / SELECT 1
DATABASE = DATABASE_READY for connectivity; SCHEMA_MISMATCH
LOGIN_REAL = REAL_PASS / HTTP 200
COOKIE_REAL = REAL_PASS / access and refresh HttpOnly
AUTH_ME_REAL = REAL_PASS / HTTP 200 / non-admin
TENANT_LIST_REAL = REAL_PASS
TENANT_SWITCH_REAL = REAL_PASS
DASHBOARD_REAL = NOT_EXECUTED_IN_P0_5_BROWSER
APPLICATIONS_REAL = FAIL / HTTP 500 / missing applications.tenantId
BUSINESS_MANAGER_REAL = BLOCKED_DATABASE
CONFIGURATION_REAL = BLOCKED_DATABASE / configurations.tenantId absent
ERP_REAL = NOT_EXECUTED_AFTER_DATABASE_BLOCKER
CROSS_TENANT_UNIT = PASS / GUARD_TEST and SERVICE_TEST only
CROSS_TENANT_INTEGRATION = NOT_EXECUTED / schema migration required
CROSS_TENANT_RUNTIME = NOT_EXECUTED / schema migration required
SIDEBAR = UNIT_AND_STATIC_PASS; P0_5_BROWSER_NOT_EXECUTED
BROWSER_CONSOLE = NOT_CERTIFIED_FOR_P0_5
BLOCKERS = MISSING_TENANT_COLUMNS; MIGRATION_SCHEMA_INCONSISTENCY
P0_REMAINING = reconcile/apply reviewed tenant migrations; rerun DB integration
P1_REMAINING = full browser/ERP recipe after schema correction
NEXT_PHASE = STOP / RESOLVE_P0_5_DATABASE_BLOCKER
```

## Preuves runtime et provisioning

Deux exécutions consécutives de `node scripts/windows/provision.cjs` ont donné les comptes `[1,1,1]` : utilisateur, tenant et membership. Le mot de passe existant a été conservé, vérifié via le credential IAM, configuré uniquement dans le fichier local ignoré par Git. Aucun privilège administrateur ajouté.

Le runner réel `windows:test` a validé `/health`, `/ready`, `/api/iam/health`, `/api/iam/health/ready`, frontend HTTP, login, cookies HttpOnly, `/auth/me`, liste de tenants, sélection et relecture du tenant de session. Il s'est arrêté à `GET /api/business-manager/applications`, HTTP 500. Résultats privés reproductibles : `.runtime/test-results.json`. Aucun cookie, JWT ou mot de passe dans ces résultats.

La requête atteint bien le controller et `ApplicationsService.findAll(tenantId)`. Prisma retourne :

```text
The column `applications.tenantId` does not exist in the current database.
```

Une interrogation **en lecture seule** de `information_schema` confirme l'absence de `tenantId` sur les huit tables examinées : `applications`, `application_versions`, `configurations`, `contracts`, `contract_history`, `deployments`, `environments`, `snapshots` (schéma `business_manager`). La connexion locale est disponible ; ce blocage est structurel, pas un mauvais mot de passe ni un timeout.

## Migration nécessaire : arrêt demandé

Migration existante concernée : `backend/prisma/migrations/20260927010000_add_tenant_id_to_platform_models/migration.sql`. Elle ajoute des `VARCHAR(100) NOT NULL` avec backfill `legacy`, alors que le schéma Prisma courant déclare des `String? @db.Uuid` et une relation Application → Tenant. Elle ne doit pas être appliquée aveuglément. La base locale avait été créée avant ces ajouts P0.

Il faut réconcilier une migration avec le schéma actuel : colonnes UUID, index et unicités tenant-scoped, contraintes de relations et stratégie explicite pour les données préexistantes. L'impact concerne le cloisonnement des lignes et des clés uniques métier. Le backfill `legacy` n'est pas compatible avec une colonne UUID. Vérifier aussi l'historique Prisma de cette base initialisée via db push avant tout déploiement de migration.

**Aucune migration, db push, reset, DROP, TRUNCATE ou suppression massive exécutée pendant P0.5.** Conformément à la consigne d'arrêt, ni données cross-tenant supplémentaires ni recette métier fictive n'ont été créées pour contourner le blocage.

## Vérification P0 ciblée

Les quatre rapports demandés ont été consultés ; leurs anciens constats ne remplacent pas le code. `IamAdminGuard` refuse les routes sans permissions déclarées, ne contient plus le fallback `adminPerms`, et refuse USER sans `iam:admin`. `TenantGuard` conserve le contrôle d'appartenance de ressource. Les exceptions publiques et le contexte optionnel des endpoints d'authentification sont explicites ; les routes métier restent tenant-scoped. `ContractService.getHistory` filtre `tenantId` après contrôle du contrat.

Les readiness global et IAM font réellement `SELECT 1`. Limite conservée : IAM renvoie HTTP 200 avec `success:false/status:not_ready` en panne ; le runner vérifie aussi le corps, et le lanceur utilise le `/ready` global qui renvoie 503.

Les « 10 tests cross-tenant » du P0 sont principalement **GUARD_TEST** : deux comparent propriétaire et principal, les huit autres concernent permissions/rôles/métadonnées. Ce ne sont pas dix opérations métier en base.

| Opération | Couverture ciblée constatée | Nature |
|---|---|---|
| CREATE | applications, versions, contrats : tenant transmis / doublons | SERVICE_TEST, Prisma simulé |
| GET | filtre tenant et refus d'une ressource étrangère | GUARD_TEST + SERVICE_TEST |
| LIST | applications, versions, contrats : filtre tenant | SERVICE_TEST |
| UPDATE | application/version : appartenance et immutabilité | SERVICE_TEST |
| DELETE | pas de preuve DB dans les suites ciblées | NOT_COVERED |
| SEARCH | pas de preuve dans les suites ciblées | NOT_COVERED |
| COUNT | pas de preuve dans les suites ciblées | NOT_COVERED |
| Relations | parent application/version, historique/compatibilité contrat | SERVICE_TEST partiel |

Aucune certification globale d'isolation DB n'est revendiquée.

## Validation et limites

Backend build et lint passent. Suite complète : **309 succès / 21 échecs, 30 suites réussies / 7 échouées**. Six suites Deployment échouent sur le schéma tenant manquant. Le dernier échec venait du test AppController qui n'injectait plus PrismaService après P0 ; son provider de test a été corrigé sans modifier la logique applicative. Vérification ciblée suivante : **67/67, 9 suites**, incluant ce test et les guards/services P0. La suite complète n'est donc pas déclarée verte.

Frontend build, typecheck et lint passent (avertissements existants), **43/43 tests**. Aucun moteur CDC, UI Builder, Billing ou Automation ajouté. `techzone/` non modifié.

Un premier restart a croisé la reconstruction `dist` en cours et a correctement échoué sur le build momentanément absent, sans déclarer READY. Les cycles doivent être exécutés après compilation ; le lanceur vérifie désormais la présence du build. Les journaux de runtime restent locaux.

Mode d'emploi : [WINDOWS_RUNTIME.md](../WINDOWS_RUNTIME.md). Les cinq commandes sont ajoutées à la racine, avec profils local/remote et `test-user:provision`. Le blocage métier demeure même lorsque les processus et `/ready` sont disponibles.
