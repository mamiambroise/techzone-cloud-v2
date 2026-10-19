# Rapport des corrections autorisees - 2026-10-19

## A. Etat synchronise

Execution realisee sur `mami`, sans push, reset, `db push`, suppression ni changement de configuration PostgreSQL. Les commits historiques demandes ont ete verifies : `c94186e`, `1500c82`, `c33e18d`, `173b179`, `1e83c5d` et `6a80c43`.

REG-004 et REG-007 sont maintenant valides par des executions reelles sur la base E2E isolee. Cette validation concerne l'infrastructure et les suites de test : elle ne constitue pas une certification complete du Deployment, ni une recette de production.

| Controle execute | Resultat reel |
|---|---|
| `pg_isready` et `current_database()` | PASS : `127.0.0.1:55432`, `techzone_test` |
| Prisma test (`validate`, `migrate deploy`, `migrate status`) | PASS : 11 migrations, schema a jour |
| `npm run test:e2e` | PASS : 2 suites, 20 tests IAM multi-tenant |
| `npm test -- --runInBand deployment` | PASS : 11 suites, 64 tests |
| Pack Manager / Pack Runtime / Data Runtime cibles | PASS : 12 suites, 91 tests |
| Securite backend UI/Runtime | PASS : 10 suites, 146 tests |
| Securite frontend UI Builder/Runtime | PASS : 13 fichiers, 116 tests; 2 fichiers et 2 tests ignores |
| Suite IAM complete apres correction | PASS : 17 suites, 145 tests |
| `npx tsc --noEmit -p tsconfig.spec.json` | FAIL attendu : 304 diagnostics restants (REG-008) |

Les comptes ci-dessus decrivent des executions distinctes et peuvent se recouvrir. Les simulations SIM-01 a SIM-32 ne sont pas declarees PASS : les documents existants ne definissent pas de correspondance individuelle entre chaque identifiant et un script executable.

## B. Tableau de correction

| ID | Responsable | Etat final | Preuve principale | Commit |
|---|---|---|---|---|
| REG-004 | Jasmina / Mami | OK | Restauration E2E, Prisma et 20 E2E IAM PASS sur `techzone_test` | - |
| REG-007 | Nassa / Jasmina | OK | Garde fail-closed et 64 tests Deployment PASS sur base isolee | - |
| REG-006 | Nassa | OK | Cockpit : 3 tests PASS | `1500c82` |
| REG-001 | Jasmina / Ranja | OK | Snapshots Pack et gate securite PASS | `c33e18d` |
| REG-002 | Nassa | OK | Runtime publie et controles fail-closed PASS | `173b179` |
| REG-003 | Ranja | OK | UI Builder : assertion deterministe, 11 tests PASS | `1e83c5d` |
| IAM-001 | Mami | OK | Throttle sans handle de purge bloquant | `c94186e` |
| REG-008 | Reparti par module | A faire | 312 diagnostics initiaux, 304 restants apres correctifs IAM | `dfc26e1` pour les 8 diagnostics IAM |
| REG-009 | A attribuer | A faire | Avertissement de compatibilite Prisma/pg sous Deployment | - |

## C. REG-004 - PostgreSQL E2E isole

Le service Windows `postgresql-x64-18` sur le port 5432 est distinct du cluster E2E utilisateur PostgreSQL 18 situe sous `%LOCALAPPDATA%\TechzoneLocalPostgres\data`, configure sur `127.0.0.1:55432`. `TEST_DATABASE_URL` est distinct de `DATABASE_URL` et le runner refuse toute cible qui ne contient pas `test` ou `e2e`.

Les fichiers de configuration et `pg_hba.conf` ont ete lus sans etre modifies : ecoute locale uniquement, port 55432 et authentification SCRAM pour loopback. Les ACL NTFS du cluster etaient presentes; aucune permission n'a ete changee. `pg_controldata` ne montrait pas de corruption.

La cause observee est une recuperation du cluster interrompue avant la disponibilite (`0xC000013A`, interruption de processus), et non une corruption, un conflit de port ou un defaut de droits etabli. Les erreurs historiques `pg_ctl` Windows 87 et 3 sont un symptome de lancement/statut peu fiable dans cette session, pas une cause racine prouvee : `pg_ctl status` peut echouer alors que PostgreSQL accepte des connexions.

Le serveur existant a ete demarre sans reinitialisation, puis la recuperation a ete laissee a son terme. Preuves finales : `pg_isready` PASS, `current_database() = techzone_test`, Prisma valide et statut des migrations a jour. Deux migrations deja presentes mais non appliquees ont ete inspectees avant `migrate deploy`; elles n'effectuent ni suppression ni reinitialisation. Voir `22_DIAGNOSTIC_POSTGRESQL_WINDOWS.md` et `23_RESULTATS_E2E_APRES_RESTAURATION.md`.

## D. REG-007 - isolation Deployment

`backend/test/jest.setup.ts` force `DATABASE_URL` vers `TEST_DATABASE_URL` quand la cible est clairement une base test/e2e, et la remplace par un port impossible sinon. `test/iam-e2e-runner.mjs` verifie en plus que les deux URL sont distinctes avant de lancer Jest. Ainsi, les tests purs restent independants de PostgreSQL et les tests d'integration utilisent seulement `techzone_test`.

`npm test -- --runInBand deployment` passe maintenant entierement : 11 suites et 64 tests. Les branches de readiness, echec explicite, annulation et absence de faux statut `SUCCEEDED` sont executees par cette suite. Aucune connexion a `techzonecloud_local` n'a ete utilisee. Cette preuve clot REG-007, mais ne remplace ni une validation de production, ni une certification globale Deployment.

## E. Modules rejoues et simulations

Les tests cibles Pack Manager, Pack Runtime et Data Runtime passent (12 suites, 91 tests). La gate backend de securite UI/Runtime passe (10 suites, 146 tests). La gate frontend UI Builder/Runtime passe (116 tests, 2 tests ignores). Les deux ignores ne sont pas reclassifies en PASS.

`npm run test:e2e` passe avec 20 cas IAM cross-tenant : lectures, mises a jour et suppressions croisees, tenant forge, permissions, session revoquee, MFA et membership. Cette preuve est E2E, mais elle ne definit pas a elle seule les SIM-01 a SIM-32. Tous les SIM restent donc `NOT TESTED` jusqu'a une matrice officielle identifiant preconditions, fixtures, et assertions pour chaque numero.

Les recettes navigateur PH6/PH7, UAT, responsive, charge et concurrence complete n'ont pas ete executees. Les recettes historiques PH6/PH7 visent des fixtures et une base heritee hors `techzone_test`; elles sont laissees `NOT TESTED` pour respecter l'isolation.

## F. REG-008 et nouveau risque

Le typecheck complet des specifications est passe de 312 diagnostics a 304 apres huit corrections IAM limitees au perimetre Mami (`dfc26e1`). Les deux doublons de permissions `src/iam/iam.constants.ts:91-92` restent attribues a Nassa; aucune erreur hors IAM n'a ete corrigee. L'analyse exhaustive par fichier, cause, responsable et priorite est dans `24_ANALYSE_REG_008.md`.

La trace Deployment revele aussi un avertissement deprecation `pg` emis depuis `@prisma/adapter-pg` lors de requetes concurrentes. Les 64 tests restent PASS; il est enregistre comme risque P3 REG-009 et non comme echec fonctionnel.

## G. Git et suites

Branche de travail : `mami`. Nouveau commit local : `dfc26e1` (`fix(iam): resolve owned strict spec diagnostics`). Les dossiers non suivis preexistants `docs/audit/global/` et `docs/ui-ux/` sont preserves. Aucun push, PR, reset ou changement de branche n'a ete effectue.

Actions restant soumises a approbation : traiter REG-008 hors IAM, traiter REG-009 de compatibilite Prisma/pg, definir une campagne SIM numerotee, et traiter REG-005 sans changement dans le cadre de cette execution.
