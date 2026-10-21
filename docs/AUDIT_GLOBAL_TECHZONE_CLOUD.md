# AUDIT GLOBAL - TECHZONE CLOUD


---

## Source : 01_INVENTAIRE_AUDITS_EXISTANTS.md

# Inventaire des audits existants

Sources examinees : `docs/audit/global/00_RAPPORT_EXECUTIF.md`, `docs/audit/global/REGRESSION_POST_PR_2026-10-19.md`, `docs/integration-audit/stagiaires/`, `docs/platform-consolidation/`, `docs/architecture/` et `docs/audit/`.

Les conclusions historiques ne sont pas reprises comme des faits courants sans revalidation. Les anomalies REG-001 a REG-005 sont consolidees dans le registre; REG-006 et REG-007 sont nouvelles et prouvees par l'execution Deployment du 19/10.


---

## Source : 02_MATRICE_CDC_FONCTIONNALITES.md

# Matrice CDC -> implementation -> preuve

| CDC | Module | Fonctionnalite | Backend | Frontend | Test | Resultat | Ecart |
|---|---|---|---|---|---|---|---|
| IAM CDC tenant/membership | IAM | JWT, session, permission, refus tenant | Present | contexte consomme | 145 IAM | PASS | E2E DB bloque |
| PM §10,12,13,29 | Pack Manager | ApplicationVersion, snapshot, hash, tenant | Present | formulaire PM | 53 cibles | PASS | gate snapshot fixture rouge |
| PR §12,13,38 | Pack Runtime | resolutionId, manifest effectif, tenant | Present | PublishedApplication | service cible PASS | PARTIAL | REG-002 |
| UI §34,44 / SEC-UI | UI Builder | renderer partage, registry, isolation | Present | present | 44 PASS, 2 skip | PARTIAL | REG-003 / E2E bloque |
| Data Runtime CDC | Data Runtime | permission et contexte runtime | Present | route existante | controller cible PASS | PARTIAL | pas de DB |
| DEP CDC 02-06 | Deployment | releases, gates, readiness, rollback | Present | ecrans existants | 32 PASS / 29 DB fail | BLOCKED | REG-006, REG-007 |


---

## Source : 03_PLAN_TESTS_GLOBAL.md

# Plan de tests global

1. Statique : build, typecheck, lint, Prisma validate. 2. Unitaires IAM/PM/Runtime/UI. 3. Gate securite UI. 4. E2E sur `TEST_DATABASE_URL` dont le nom contient test/e2e. 5. Recette navigateur responsive. 6. Simulations 01-32 et charge limitee uniquement sur environnement isole.

Interdits sans accord : `db push`, reset, truncate, drop et seed sur base non isolee.


---

## Source : 04_RESULTATS_TESTS_BACKEND.md

# Resultats backend

| Controle | Resultat |
|---|---|
| Nest build, oxlint | PASS |
| PM/Runtime/Data/IAM cible | PASS : 53 tests / 7 suites |
| IAM complet apres correction | PASS : 145 tests / 17 suites, aucun handle detecte |
| Gate securite UI | PARTIAL : 138 pass, 5 fail (REG-001) |
| Deployment | BLOCKED/FAIL : 32 pass, 29 echouent faute de DB; 1 suite TS1128 (REG-006) |
| Prisma validate | PASS |

Les echecs DB ne sont pas des echecs metier confirmes.


---

## Source : 05_RESULTATS_TESTS_FRONTEND.md

# Resultats frontend

Build Vite, TypeScript et oxlint : PASS. Le renderer/registry/modele UI Builder : 44 PASS, 2 SKIPPED. `UiBuilderControls` : 10 PASS / 1 FAIL (REG-003). `PublishedApplication` : 12 FAIL dus aux fixtures non alignees (REG-002). La suite globale n'est donc pas certifiee.


---

## Source : 06_RESULTATS_SECURITE_MULTI_TENANT.md

# Securite multi-tenant

Les tests IAM confirment les refus de token/session incompatibles, membership absent, permission absente et tenant different. Les tests cibles PM/Runtime/Data passent. Les preuves HTTP/PostgreSQL cross-tenant restent BLOCKED par la base indisponible; aucune affirmation E2E n'est faite.


---

## Source : 07_RESULTATS_INTEGRATION_E2E.md

# Integration E2E

`npm run test:e2e` a ete tente. PostgreSQL est inaccessible a `127.0.0.1:55432`; les 20 tests IAM E2E sont **BLOCKED / DATABASE_UNAVAILABLE**. `prisma migrate status` est egalement bloque. Preconditions : service PostgreSQL actif, `TEST_DATABASE_URL` isolee, migrations verifiees sans operation destructive.


---

## Source : 08_RESULTATS_SIMULATIONS_METIER.md

# Simulations metier 01-32

| Simulations | Statut | Motif |
|---|---|---|
| SIM-01 a SIM-10 (parcours et multi-tenant/version) | BLOCKED | CRUD/API reel exige PostgreSQL et backend disponible. |
| SIM-11, 19 a 23, 26 (incidents) | PARTIAL | Indisponibilite DB observee; aucun redemarrage de service partage n'a ete realise. |
| SIM-12, 28, 29, 31, 32 (securite) | PARTIAL | Refus IAM unitaires et hash/manifest cibles verifies; E2E bloque. |
| SIM-13 a SIM-18, 24, 25, 27, 30 (concurrence/integrite) | BLOCKED | Requierent DB et donnees de campagne isolees. |

Les scenarios ne sont pas declares executes lorsqu'ils ne disposent pas de l'environnement requis.


---

## Source : 09_AUDIT_UI_UX.md

# Audit UI/UX

Inspection de code : renderer partage preview/runtime, etats loading/error/bloque, focus visible et responsive sont presents dans les composants modifies. Build frontend passe; bundle entree 586.66 kB (REG-005). Les controles manuels Chrome/Edge/Firefox, mobile/tablette et parcours authentifie sont NOT_TESTED car backend/API et DB sont indisponibles.


---

## Source : 10_ANOMALIES_DETAILLEES.md

# Anomalies detaillees

Voir le registre pour l'etat. REG-001 et REG-002 sont des regressions de fixtures : le code inspecte refuse les contrats incomplets, mais les gates ne certifient plus ce comportement. REG-006 est une erreur TypeScript prouvee a `backend/src/modules/deployment/cockpit/cockpit.service.spec.ts:75`. REG-007 est un risque de test : les specs Deployment ont tente la cible locale au lieu d'un runner DB isole. Aucun P0 n'est demontre.


---

## Source : 11_PLAN_CORRECTION_PRIORISE.md

# Plan de correction priorise

1. REG-004 et REG-007 : isoler la base de test. 2. REG-006 : restaurer la compilation Deployment. 3. REG-001/002 : aligner fixtures sur contrats. 4. REG-003 : selector stable. 5. REG-005 : budget bundle. Les corrections 1-5 exigent votre approbation, hors IAM deja traite.


---

## Source : 12_SYNTHESE_AUDIT_GLOBAL.md

# Synthese audit global

Etat Git : `mami`, commit initial `8de5923f`, puis correction IAM locale `c94186e`. Verdict : **GO SOUS RESERVES** pour les controles unitaires disponibles; **pas de certification E2E ni Deployment**. Aucun P0, cinq P1 ouvertes (REG-001, 002, 004, 006, 007), une P2 et une P3. Le code hors Mami reste inchange.


---

## Source : 13_TESTS_PERFORMANCE.md

# Performance

Aucune charge n'a ete lancee sans environnement adapte. Mesure disponible : build Vite, entree 586.66 kB gzip 171.00 kB. p50/p95/p99, CPU, memoire et PostgreSQL : NOT_TESTED. REG-005 reste a faire.


---

## Source : 14_TESTS_CONCURRENCE_REPRISE.md

# Concurrence et reprise

Les tests de concurrence publication/deploiement et reprise exigent une DB isolee et sont BLOCKED. Le test Deployment contient des cas de readiness indisponible et annulation, mais ne peut etre certifie tant que REG-004, REG-006 et REG-007 restent ouvertes.


---

## Source : 15_TESTS_API_OBSERVABILITE.md

# API et observabilite

Les tests unitaires valident les refus structures IAM et les logs masquent les cles de throttle. API HTTP, correlation, audit trail persiste et diagnostics Deployment : BLOCKED par PostgreSQL. Aucun test intrusif ni integration externe n'a ete execute.


---

## Source : 16_RECETTE_UTILISATEUR_UAT.md

# Recette UAT

Parcours prevu : connexion, tenant, application, feature, page, preview, pack, validation, publication, Runtime, permissions et diagnostics. Statut : NOT_TESTED. Preconditions : backend/API, DB test isolee, comptes de campagne et fixtures reproductibles.


---

## Source : 17_RAPPORT_MAMI_CORRECTIONS.md

# Rapport Mami - corrections IAM

Anomalie confirmee : huit intervalles de purge de `IamThrottleService` restaient references lors des instances directes de test. Correction : `gcTimer.unref?.()` dans `backend/src/iam/iam-throttle.service.ts`; test ajoute dans `iam-throttle.security.spec.ts`. Validation : 145 tests IAM, 17 suites, `--detectOpenHandles` sans handle. Commit local : `c94186e fix(iam): release throttle cleanup timer`. Etat : OK.


---

## Source : 18_DEMANDES_APPROBATION.md

# Demandes d'approbation

| ID | Priorite | Responsable | Module | Probleme | Correction proposee | Resultat attendu | Risque |
|---|---|---|---|---|---|---|---|
| REG-004, REG-007 | P1 | Jasmina / Nassa | DB et tests Deployment | Base/test runner non certifiables | Isoler la DB et les fixtures | E2E sans base applicative | Moyen |
| REG-006 | P1 | Nassa | Deployment | TS1128 dans une spec | Corriger la suite | readiness testable | Faible |
| REG-001 | P1 | Jasmina / Ranja | PM/UI | mocks snapshot obsoletes | Aligner fixtures | gate backend verte | Faible |
| REG-002 | P1 | Nassa | Runtime | mocks Runtime obsoletes | Aligner fixtures | gate frontend verte | Faible |
| REG-003 | P2 | Ranja | UI Builder | selector ambigu | Cibler etat vide | Vitest verte | Faible |

**Approuvez-vous la correction de ces taches ?**


---

## Source : 19_HISTORIQUE_VALIDATIONS.md

# Historique des validations

- 2026-10-19 : audit post-PR `8de5923f`, REG-001 a REG-005 enregistrees.
- 2026-10-19 : audit global, IAM reexecute (145 PASS), Deployment execute (32 PASS, 29 BLOCKED DB, une erreur TS), REG-006 et REG-007 ajoutees.
- 2026-10-19 : IAM-001 corrige et valide dans `c94186e`.


---

## Source : 20_TABLEAU_BORD_QUALITE.md

# Tableau de bord qualite

| Indicateur | Valeur prouvee |
|---|---|
| Taches | 8 |
| OK | 1 (IAM-001) |
| A faire | 7 |
| P0 ouvertes | 0 demontree |
| P1 ouvertes | 5 |
| P2/P3 ouvertes | 1 / 1 |
| Tests backend critiques | 53 PASS; IAM 145 PASS |
| Tests frontend renderer | 44 PASS, 2 SKIPPED |
| Tests FAIL connus | PM snapshot 5; Runtime UI 12; UI selector 1; Deployment TS 1 suite |
| Tests BLOCKED | E2E 20; Deployment DB 29; simulations DB |
| Modules certifies E2E | Aucun |
| Modules sous reserves | IAM, PM, Runtime, UI Builder, Data Runtime |


---

## Source : 21_RAPPORT_CORRECTIONS_AUTORISEES.md

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


---

## Source : 22_DIAGNOSTIC_POSTGRESQL_WINDOWS.md

# Diagnostic PostgreSQL Windows - 2026-10-19

## Conclusion

Le blocage de REG-004 provenait d'une recuperation PostgreSQL locale interrompue avant que le cluster E2E ne devienne disponible. La preuve observee dans le journal est l'arret du processus de demarrage par `0xC000013A` (`STATUS_CONTROL_C_EXIT`). Il ne s'agit pas d'une corruption de cluster, d'un conflit de port, d'une mauvaise configuration `postgresql.conf` ou d'une ACL NTFS insuffisante demontres par les controles realises.

Le cluster E2E a ete retabli sans reinitialisation ni modification de configuration. Il accepte maintenant les connexions sur `127.0.0.1:55432` et la requete de controle retourne `current_database() = techzone_test`.

## Perimetre verifie

| Element | Observation | Resultat |
|---|---|---|
| Version | PostgreSQL 18.1 (`C:\Program Files\PostgreSQL\18\bin`) | Identifiee |
| Service Windows installe | `postgresql-x64-18`, compte `NT AUTHORITY\NetworkService` | Actif, mais utilise son propre cluster sur 5432 |
| Service Windows / E2E | Le service ne pilote pas le cluster E2E | Separation confirmee |
| Cluster E2E | `%LOCALAPPDATA%\TechzoneLocalPostgres\data` | PostgreSQL 18, controle par `pg_controldata` sans signe de corruption |
| Configuration E2E | `listen_addresses = '127.0.0.1'`, `port = 55432` | Conforme a une cible locale isolee |
| `pg_hba.conf` | Loopback IPv4/IPv6 et local en SCRAM | Conforme; aucun changement |
| ACL NTFS | Acces presents pour SYSTEM, Administrators et le compte utilisateur local | Aucun changement |
| Port 55432 | Aucun listener avant restauration, listener apres demarrage | Pas de conflit observe |
| URLs de base | `TEST_DATABASE_URL` distinct de `DATABASE_URL`; la cible test est `techzone_test` | Isolation confirmee sans afficher les secrets |
| Docker | Indisponible | Non utilise |

## Chronologie et cause racine

1. Le service Windows PostgreSQL actif sur le port 5432 a ete exclu : il n'est pas la base E2E et ne doit pas etre utilise comme remplacement.
2. Aucun processus n'ecoutait initialement sur le port 55432. Les journaux du cluster E2E montraient le demarrage et la recuperation, qui peuvent durer environ deux minutes.
3. Une tentative historique a ete arretee pendant cette recuperation : le processus enfant de demarrage a quitte avec `0xC000013A` environ 25 secondes apres son lancement. PostgreSQL n'avait donc pas encore emis son message de readiness.
4. `pg_ctl` a aussi remonte les erreurs Windows 87 (`could not create restricted token`) et 3 (`could not start server`). Ces erreurs proviennent du lanceur/statut Windows; elles n'apparaissent pas comme une erreur de configuration dans le journal PostgreSQL.
5. Une fois le binaire `postgres.exe` existant lance sur le meme repertoire de donnees et la recuperation laissee a son terme, le journal a confirme `database system is ready to accept connections`.

La cause racine retenue est donc une interruption prematuree du processus de demarrage/recovery, probablement liee au lanceur ou a la session Windows, et non une modification a appliquer au cluster. Le code 87/3 reste un symptome a surveiller, pas une cause racine prouvee.

## Fiabilite des outils Windows

`scripts/local-postgres.ps1` utilise `pg_ctl status` avant `pg_ctl ... start`. Dans cette session, ce statut a retourne le code 3 meme lorsqu'un processus PostgreSQL pouvait etre verifie par connexion. Il ne doit donc pas etre utilise seul comme sonde de disponibilite.

Les sondes retenues sont :

1. `pg_isready -h 127.0.0.1 -p 55432` ;
2. une connexion avec `TEST_DATABASE_URL` et `SELECT current_database()` ;
3. `npm run prisma:test:status` execute hors sandbox lorsque le moteur Prisma ne peut pas creer son processus enfant dans le sandbox.

Ces trois controles ont reussi apres restauration. L'erreur `spawn EPERM` rencontree dans le sandbox est une restriction d'execution du sandbox pour `schema-engine-windows.exe`, et non une erreur Prisma ou PostgreSQL : le meme statut a reussi hors sandbox et a confirme les 11 migrations.

## Actions realisees

| Action | Resultat | Impact donnees |
|---|---|---|
| Lecture des services, processus, version, fichiers de configuration, HBA, ACL, journaux et scripts | PASS | Lecture seule |
| Verification `pg_controldata` | PASS | Lecture seule |
| Demarrage du binaire PostgreSQL existant sur le cluster E2E | PASS apres recuperation | Aucun reset ni recreation |
| `pg_isready` et `SELECT current_database()` | PASS : `techzone_test` | Lecture seule |
| `prisma:test:validate`, `prisma:test:migrate`, `prisma:test:status` | PASS | Deux migrations non destructives appliquees apres inspection; aucune suppression ni `db push` |

Ni le service Windows sur 5432, ni `postgresql.conf`, ni `pg_hba.conf`, ni les permissions NTFS n'ont ete modifies. Aucune base applicative ni `techzonecloud_local` n'a ete utilisee.

## Actions non realisees et recommandations

- Aucun cluster n'a ete recree, initialise ou reinitialise.
- Aucun service Windows n'a ete modifie. Le service existant sur 5432 ne doit pas etre detourne vers le cluster E2E sans accord explicite.
- Aucun droit global Windows n'a ete accorde.
- En cas de nouvelle recuperation longue, laisser le processus atteindre la readiness et attendre au moins 300 secondes avant de conclure a un echec. Verifier ensuite les trois sondes ci-dessus, plutot que `pg_ctl status` seul.
- Une installation durable sous forme de service ou de tache planifiee distincte modifierait la configuration Windows et necessiterait un choix explicite de l'utilisateur. Aucune action administrateur n'est requise pour l'etat actuellement retabli.

## Statut

REG-004 est `OK` : la base E2E isolee est disponible, son nom est confirme et les E2E ont ete rejoues. Les details des suites sont dans `23_RESULTATS_E2E_APRES_RESTAURATION.md`.


---

## Source : 23_RESULTATS_E2E_APRES_RESTAURATION.md

# Resultats E2E apres restauration - 2026-10-19

## Perimetre et garde d'isolation

Toutes les executions avec PostgreSQL ont cible `techzone_test` sur `127.0.0.1:55432`. `TEST_DATABASE_URL` est distinct de `DATABASE_URL`. Le runner IAM refuse une URL test absente, egale a la base applicative ou dont le nom ne contient pas `test` ou `e2e`; `test/jest.setup.ts` echoue ferme au lieu d'utiliser une base applicative.

La commande de controle a retourne `current_database() = techzone_test`. `techzonecloud_local` n'a pas ete utilise comme solution de remplacement.

## Matrice des controles executes

| Commande / controle | Cible | Resultat | Preuve ou limite |
|---|---|---|---|
| `pg_isready -h 127.0.0.1 -p 55432` | Serveur E2E | PASS | Listener PostgreSQL pret |
| `SELECT current_database()` via `TEST_DATABASE_URL` | Base E2E | PASS | `techzone_test` |
| `npm run prisma:test:validate` | Schema Prisma | PASS | Schema valide |
| `npm run prisma:test:migrate` | Base E2E | PASS | Deux migrations inspectees puis deployees sans suppression |
| `npm run prisma:test:status` | Base E2E | PASS | 11 migrations; schema a jour |
| `npm run test:e2e` | IAM / HTTP / PostgreSQL E2E | PASS | 2 suites, 20 tests |
| `npm test -- --runInBand deployment` | Deployment / PostgreSQL E2E | PASS | 11 suites, 64 tests; voir reserve REG-009 |
| `npm test -- --runInBand pack-manager pack-runtime data-runtime` | Pack Manager, Runtime, Data Runtime | PASS | 12 suites, 91 tests |
| `npm run test:security:ui` (backend) | UI Builder, Pack Runtime, Data Runtime, IAM | PASS | 10 suites, 146 tests |
| `npm run test:security:ui` (frontend) | UI Builder et Runtime publie | PASS | 13 fichiers, 116 tests; 2 fichiers / 2 tests ignores |
| `npm test -- --runInBand iam` | IAM | PASS | 17 suites, 145 tests |
| `npx nest build` | Backend | PASS | Compilation terminee |
| `npx tsc --noEmit -p tsconfig.spec.json` | Types des specifications backend | FAIL | 304 diagnostics recenses dans REG-008 |

Le premier essai frontend et le premier statut Prisma dans le sandbox ont ete bloques par `spawn EPERM` avant les tests. Les memes commandes executees hors sandbox ont abouti; ce blocage est donc classe environnement de sandbox, pas PASS fictif ni regression applicative.

## Couverture fonctionnelle obtenue

| Module | Controles executes | Resultat |
|---|---|---|
| IAM | Sessions, MFA, membership, permission, throttle, isolation tenant et E2E cross-tenant | PASS pour les suites executees |
| Deployment | Readiness, echec explicite, annulation, diagnostics et absence de faux `SUCCEEDED` dans la suite | PASS pour 64 tests; pas certification production |
| Pack Manager | Services, snapshots et controles de contrat cibles | PASS dans les 91 tests cibles |
| Pack Runtime | Resolution publiee, cache, manifest, isolation et composant frontend | PASS dans les suites ciblees; 2 tests frontend ignores |
| Data Runtime | Controleur et acces BM cibles | PASS dans les suites ciblees |
| UI Builder | Garde de securite et composants frontend cibles | PASS dans les suites executees |

Ces resultats sont des controles automatises. Ils ne prouvent pas une recette manuelle de chaque CRUD, du responsive, de la navigation complete ou de tous les parcours metier.

## SIM-01 a SIM-32

Les documents `03_PLAN_TESTS_GLOBAL.md`, `08_RESULTATS_SIMULATIONS_METIER.md`, `14_TESTS_CONCURRENCE_REPRISE.md` et `16_RECETTE_UTILISATEUR_UAT.md` regroupent les simulations, mais ne donnent pas une definition executable individuelle pour chaque numero. Aucun test existant ne porte un identifiant `SIM-xx`. Marquer l'un de ces identifiants PASS a partir d'une suite unitaire serait inventer une tracabilite inexistante.

| Simulations | Famille documentee | Statut | Preuve partielle disponible |
|---|---|---|---|
| SIM-01 a SIM-10 | Parcours, multi-tenant et versions | NOT TESTED | Tests Pack/Runtime/Data et IAM partiels, sans scenario numerote de bout en bout |
| SIM-11 | Incident | NOT TESTED | Deployment couvre des echecs/readiness, sans lien officiel avec SIM-11 |
| SIM-12 | Securite | NOT TESTED | IAM E2E et securite UI sont des preuves fortes, sans mappage SIM officiel |
| SIM-13 a SIM-18 | Concurrence et integrite | NOT TESTED | Sous-controles Deployment/Runtime/UI seulement |
| SIM-19 a SIM-23 | Incidents | NOT TESTED | Sous-controles Deployment seulement |
| SIM-24 a SIM-27 | Concurrence et incidents | NOT TESTED | Sous-controles, aucune campagne numerotee |
| SIM-28 a SIM-29 | Securite | NOT TESTED | IAM E2E / securite UI, sans identifiant correspondant |
| SIM-30 | Concurrence / integrite | NOT TESTED | Sous-controles seulement |
| SIM-31 a SIM-32 | Securite | NOT TESTED | IAM E2E / securite UI, sans identifiant correspondant |

Les recettes frontend historiques PH6/PH7 restent `NOT TESTED`. Elles sont opt-in, demandent des fixtures/cookies externes et des scripts herites autour de `techzonecloud_phase7_recipe` ou `techzonecloud_local`, incompatibles avec la contrainte d'isolation actuelle.

## Resultat REG-007

REG-007 est `OK` pour l'infrastructure de test : la garde ne permet pas l'acces implicite a la base applicative, la cible E2E est confirme, la suite Deployment s'execute sans faux succes et les echecs attendus sont explicites. Cette conclusion ne vaut pas certification Deployment globale, recette UAT, test de charge ou validation de production.

## Elements non testes / bloquees

| Element | Statut | Justification |
|---|---|---|
| CRUD et parcours metier manuels complets | NOT TESTED | Pas de campagne navigateur/API numerotee et executee |
| Responsive / UAT | NOT TESTED | Aucune session manuelle lancee |
| Charge, reprise complete et concurrence de production | NOT TESTED | Aucune campagne definie/executee |
| PH6/PH7 PostgreSQL frontend | NOT TESTED | Fixtures et cibles heritees hors `techzone_test` |
| Typecheck specs backend | FAIL | REG-008 reste ouvert; ce n'est pas masque |


---

## Source : 24_ANALYSE_REG_008.md

# Analyse REG-008 - TypeScript specifications backend - 2026-10-19

## Resultat

Commande executee :

```powershell
npx tsc --noEmit -p backend/tsconfig.spec.json
```

Le premier audit a trouve 312 diagnostics dans 27 fichiers. Huit diagnostics IAM relevant du perimetre Mami ont ete corriges et valides dans `dfc26e1`. Le rerun reel echoue encore avec 304 diagnostics : REG-008 reste donc `A faire`.

| Code | Initial | Apres `dfc26e1` | Evolution | Cause dominante |
|---|---:|---:|---:|---|
| TS2345 | 285 | 281 | -4 | Mocks Jest non types, inferes en `never` |
| TS2571 | 6 | 6 | 0 | Valeur de mock/retour `unknown` |
| TS18046 | 6 | 6 | 0 | Valeur `unknown` utilisee sans affinage |
| TS2339 | 4 | 3 | -1 | Contrat ou client Prisma obsolete |
| TS2554 | 3 | 3 | 0 | Signature de constructeur/guard obsolescent |
| TS1117 | 2 | 2 | 0 | Cles d'objet dupliquees |
| TS2698 | 2 | 0 | -2 | Spread d'un type non objet dans une fixture IAM |
| TS2741 | 1 | 1 | 0 | Propriete obligatoire manquante |
| TS2531 | 1 | 0 | -1 | Acces potentiellement nul |
| TS2353 | 1 | 1 | 0 | Fixture avec propriete absente du contrat |
| TS7053 | 1 | 1 | 0 | Indexation dynamique hors contrat |
| **Total** | **312** | **304** | **-8** | |

## Corrections IAM autorisees et validees

| Fichier | Localisation | Diagnostic traite | Correction | Validation |
|---|---:|---|---|---|
| `src/iam/iam-throttle.service.ts` | 56 | TS2531 | Chaine optionnelle sur le timer de purge | Suite IAM PASS |
| `src/iam/jwt.util.ts` | 43 | TS2339 | `aud?: string` aligne le payload avec le jeton signe | Suite IAM PASS |
| `src/iam/iam-jwt.security.spec.ts` | 160 | TS2698 x2 | Contexte Nest explicite au lieu d'un spread de `never` | Suite IAM PASS |
| `src/iam/iam-admin-isolation.spec.ts` | 63, 96 | TS2345 x2 | `findUnique` type et double cast vers `PrismaService` | Suite IAM PASS |
| `src/iam/iam-permission.guard.spec.ts` | 30, 84 | TS2345 x2 | Mocks Prisma types | Suite IAM PASS |

Validation complementaire : `npm test -- --runInBand iam` passe avec 17 suites et 145 tests; `npx nest build` passe. Aucun `any`, `@ts-ignore` ou desactivation de TypeScript n'a ete ajoute par ce commit.

## Repartition exhaustive apres correction

Chaque ligne ci-dessous correspond aux erreurs encore emises par la commande. Les responsables marques `a confirmer` ne sont pas attribues sans preuve de propriete de module.

| Module / fichier | Diagnostics | Cause | Responsable | Priorite | Correction proposee |
|---|---:|---|---|---|---|
| Automation - `automation.controller.spec.ts` | 1 TS2554 | Signature de guard/constructeur stale | A confirmer - Automation | P2 | Aligner le mock et l'appel sur les quatre arguments actuels |
| Data Runtime - `bm-records.provider.spec.ts` | 4 TS2345 | `jest.fn()` inferes en `never` | A confirmer - Data Runtime | P2 | Typer les fonctions mockees selon le contrat provider |
| ERP Adapter - `erp-resource-runtime.service.spec.ts` | 1 TS2353 | `resourceKey` absent de `TenantContext` | A confirmer - ERP Adapter | P2 | Aligner la fixture sur le contrat actuel |
| IAM - `iam.constants.ts` | 2 TS1117 | `BM_CONTRACT_READ` et `BM_CONTRACT_WRITE` dupliques (91-92) | Nassa | P2 | Revoir la semantique puis supprimer/fusionner les doublons |
| Business Manager - `contracts.service.spec.ts` | 14 TS2345 | Mocks inferes en `never` | A confirmer - Business Manager | P2 | Typer les retours Prisma et services |
| Business Manager - `data-model.service.spec.ts` | 35 TS2345 | Mocks inferes en `never` | A confirmer - Business Manager | P2 | Typer les retours Prisma et services |
| Business Manager - `features.service.spec.ts` | 19 TS2345 | Mocks inferes en `never` | A confirmer - Business Manager | P2 | Typer les retours Prisma et services |
| Business Manager - `navigation.service.spec.ts` | 12 TS2345 | Mocks inferes en `never` | A confirmer - Business Manager | P2 | Typer les retours Prisma et services |
| Business Manager - `quality-engine.service.spec.ts` | 14 TS2345, 2 TS2571 | Mocks `never` et resultats `unknown` | A confirmer - Business Manager | P2 | Typer les retours puis affiner les valeurs inconnues |
| Business Manager - `runtime-bridge.service.spec.ts` | 8 TS2345 | Mocks inferes en `never` | A confirmer - Business Manager | P2 | Typer les retours Prisma et services |
| Deployment - `cockpit.service.spec.ts` | 6 TS2345 | Mocks inferes en `never` | Nassa | P2 | Typer les mocks du Cockpit |
| Integration - `integration-authorization.spec.ts` | 6 TS2345, 1 TS7053 | Mocks `never` et indexation dynamique | A confirmer - Integration | P2 | Typer les mocks et remplacer l'index non borne par une cle contractuelle |
| Pack Manager - `pack-manager.service.spec.ts` | 33 TS2345, 4 TS2571 | Mocks `never` et retours inconnus | Jasmina | P2 | Typer les mocks Prisma/services et affiner les retours |
| Pack Manager - `ui-snapshot.integration.spec.ts` | 9 TS2345 | Mocks inferes en `never` | Jasmina | P2 | Typer les fixtures snapshot |
| Pack Manager - `pack-manager.service.ts` | 3 TS2339 | Client Prisma genere sans `Pack.applicationId` attendu par le code | Jasmina | P1 | Verifier schema/migration et regenerer le client dans un changement approuve |
| Pack Runtime - `pack-runtime.service.spec.ts` | 5 TS2345 | Mocks inferes en `never` | Nassa | P2 | Typer les mocks de runtime |
| Platform - `applications.service.spec.ts` | 14 TS2345, 1 TS2554 | Mocks `never` et signature obsolete | A confirmer - Platform | P2 | Typer les mocks et aligner le constructeur |
| Platform - `application-versions.service.spec.ts` | 14 TS2345, 1 TS2554 | Mocks `never` et signature obsolete | A confirmer - Platform | P2 | Typer les mocks et aligner le constructeur |
| Platform - `contract.service.spec.ts` | 9 TS2345 | Mocks inferes en `never` | A confirmer - Platform | P2 | Typer les mocks |
| Platform - `dashboard.service.spec.ts` | 6 TS18046, 4 TS2345, 1 TS2741 | Valeurs inconnues, mocks et champ requis absent | A confirmer - Platform | P2 | Affiner les types, typer les mocks et completer la fixture |
| UI Builder - `ui-builder.controller.spec.ts` | 1 TS2345 | Mock infere en `never` | Ranja | P2 | Typer le mock controller |
| UI Builder - `ui-builder.security.spec.ts` | 2 TS2345 | Mocks inferes en `never` | Ranja | P2 | Typer les mocks de securite |
| UI Builder - `ui-builder.service.spec.ts` | 72 TS2345 | Mocks inferes en `never` | Ranja | P2 | Introduire des factories de mocks types |

Les 23 lignes totalisent 304 diagnostics. Elles couvrent donc tous les diagnostics actuels, sans masquer les erreurs derriere un type global `any`.

## Charge par responsable

| Responsable | Diagnostics restants | Perimetre |
|---|---:|---|
| Nassa | 13 | IAM 2, Cockpit Deployment 6, Pack Runtime 5 |
| Jasmina | 49 | Pack Manager, dont 3 erreurs source Prisma P1 |
| Ranja | 75 | UI Builder |
| A confirmer - Business Manager | 104 | Six specifications Business Manager |
| A confirmer - Platform | 50 | Applications, versions, contrats, dashboard |
| A confirmer - Data Runtime | 4 | Provider d'acces BM |
| A confirmer - Integration | 7 | Autorisation integration |
| A confirmer - Automation | 1 | Controleur |
| A confirmer - ERP Adapter | 1 | Runtime resource |
| **Total** | **304** | |

## Priorisation et suite

1. **P1 - Jasmina / Pack Manager :** verifier l'ecart entre `Pack.applicationId`, le schema et le client Prisma genere. Ne pas lancer une regeneration ou modifier les migrations sans approbation dediee.
2. **P2 - Nassa / IAM :** traiter les deux permissions dupliquees seulement apres validation de leur semantique; elles sont hors perimetre Mami et restent intactes.
3. **P2 - autres modules :** remplacer progressivement les mocks non types par des factories typees et mettre a jour les fixtures/signatures selon leurs contrats reels.
4. Rejouer la commande complete apres chaque lot. REG-008 ne passe a `OK` qu'a zero diagnostic.

Aucune correction hors IAM n'a ete appliquee dans cette execution.


---

## Source : REGISTRE_TACHES.md

# Registre unique des taches

Etats autorises : `A faire` et `OK`. Une preuve manquante conserve la tache a faire.

| ID | Ordre | Priorite | Module | Responsable | Description du probleme | Tache a faire | Resultat attendu | Etat | Preuve / reference |
|---|---:|---|---|---|---|---|---|---|---|
| REG-001 | 2 | P1 | Pack Manager / UI Builder | Jasmina (Ranja collab.) | Les mocks snapshot ne fournissent plus ApplicationVersion/PackVersion apres le contrat #19. | Adapter les fixtures et rejouer la gate backend. | 146 tests securite backend verts. | OK | Commit `c33e18d`; 9 tests snapshot et 146 tests de securite PASS, 19/10. |
| REG-002 | 3 | P1 | Pack Runtime | Nassa | Les mocks PublishedApplication n'ont ni `resolutionId` ni manifest `EXECUTABLE`. | Adapter les mocks puis rejouer la gate frontend. | Runtime publie et gardes fail-closed verts. | OK | Commit `173b179`; 13 tests PublishedApplication et 37 Runtime/Renderer PASS (2 skips PostgreSQL), 19/10. |
| REG-004 | 1 | P1 | Prisma / E2E | Jasmina (Mami collab.) | PostgreSQL 127.0.0.1:55432 etait inaccessible apres une recuperation Windows interrompue. | Retablir sans reinitialisation puis verifier l'isolation, Prisma et les E2E. | E2E multi-tenant executables sur une base isolee. | OK | `pg_isready` PASS; `current_database() = techzone_test`; Prisma validate/migrate/status PASS; IAM E2E 2 suites, 20 tests PASS, 19/10. Voir `22` et `23`. |
| REG-006 | 4 | P1 | Deployment | Nassa | `cockpit.service.spec.ts:75` ne compile pas (TS1128) ; la readiness n'est pas certifiable. | Corriger la syntaxe de la suite et rejouer les tests sur DB isolee. | Test Cockpit unitaire vert; gate DB a reprendre. | OK | Commit `1500c82`; 3 tests Cockpit PASS, 19/10. |
| REG-007 | 5 | P1 | Deployment / test infra | Nassa (Jasmina collab.) | Les specs Deployment risquaient une connexion locale implicite hors runner E2E isole. | Prouver la garde fail-closed et rejouer les tests sur la base E2E. | Aucun test n'atteint une base applicative; echecs explicites. | OK | Garde `test/jest.setup.ts` et runner E2E verifies; Deployment 11 suites, 64 tests PASS sur `techzone_test`, 19/10. Ceci ne certifie pas le Deployment en production. |
| REG-003 | 6 | P2 | UI Builder | Ranja | `findByText(/Aucun/)` est ambigu. | Cibler l'etat vide de recherche. | Suite Vitest deterministe. | OK | Commit `1e83c5d`; 11 tests UI Builder PASS, 19/10. |
| REG-005 | 7 | P3 | Frontend | A attribuer | Bundle entree Vite 586.66 kB. | Mesurer et envisager le decoupage. | Budget performance documente. | A faire | `vite build`, audit 19/10. |
| IAM-001 | 0 | P3 | IAM | Mami | L'intervalle de purge du throttle retenait les processus de test. | Corrige et revalide. | Aucune handle ouverte IAM. | OK | Commit `c94186e`; 145 tests IAM avec `--detectOpenHandles`. |
| REG-008 | 8 | P2 | TypeScript / qualite | Reparti par module; plusieurs responsables a confirmer | Le typecheck complet des specs echoue sur 312 diagnostics initiaux dans 27 fichiers. | Trier puis corriger les contrats, mocks et client Prisma par responsable. | `tsc -p tsconfig.spec.json` sans erreur. | A faire | 8 diagnostics IAM/Mami resolus par `dfc26e1`; rerun reel : 304 restants. Les doublons `src/iam/iam.constants.ts:91-92` restent a Nassa. Voir `24`. |
| REG-009 | 9 | P3 | Deployment / dependances Prisma | A attribuer (Platform / dependances) | `@prisma/adapter-pg` emet une requete concurrente depreciee par `pg`, retiree en v9. | Qualifier la compatibilite puis mettre a jour ou sequencer les requetes apres approbation. | Avertissement elimine ou risque accepte avec version compatible. | A faire | Trace pendant Deployment : `pg/lib/client.js:762` <- `@prisma/adapter-pg/dist/index.mjs:645`; 11 suites, 64 tests restent PASS, 19/10. |


---

## Source : audit/global/00_RAPPORT_EXECUTIF.md

# RAPPORT EXECUTIF — AUDIT GLOBAL TECHZONE CLOUD

**Mission** : AUDIT-GLOBAL-001
**Date** : 2026-10-10
**Branche audité** : `mami`
**Commit HEAD** : `f36b79aa1ee0cb6109f0b494c27bb53ff304f4dd`
**Auteur** : Kilo Code

---

## 1. ÉTAT GLOBAL DU PROJET

### 1.1 Résumé quantitatif

| Métrique | Valeur |
|---|---|
| **Fichiers source inventoriés** | ~1 200+ |
| **Modules backend identifiés** | 14 modules principaux |
| **Pages/frontend écrans** | 60+ routes déclarées |
| **Modèles Prisma** | 120+ modèles |
| **Endpoints API** | 200+ endpoints |
| **Tests unitaires** | ~50 fichiers de test |
| **Anomalies P0 (Critiques)** | 12 identifiées |
| **Anomalies P1 (Élevées)** | 28 identifiées |
| **Anomalies P2 (Moyennes)** | 45+ identifiées |
| **Anomalies P3 (Faibles)** | 30+ identifiées |
| **Risques de sécurité** | 15 vulnérabilités présumées |
| **Fonctionnalités confirmées (IMPLÉMENTÉ ET TESTÉ)** | ~35% |
| **Fonctionnalités partielles (PARTIEL)** | ~40% |
| **Fonctionnalités non implémentées (NON IMPLÉMENTÉ)** | ~25% |

### 1.2 Niveau de maturité global

**Techzone Cloud est une plateforme multi-tenant SaaS en cours de construction**, avec une architecture modulaire NestJS/React/Prisma/PostgreSQL. Le socle technique (IAM, tenant isolation, Prisma schema, routing, design system) est **solide et opérationnel**. Cependant, **de nombreux modules métier sont à des stades de maturité très inégaux** : certains sont complets et testés (IAM, Platform, Business Manager core), d'autres sont des squelettes avec routes déclarées mais logique manquante (Billing, Deployment, Automation), d'autres encore sont des maquettes frontend sans backend (UI Builder avancé, ERP Adapter ressources).

---

## 2. RISQUES MAJEURS (P0 — CRITIQUE)

| ID | Risque | Module | Fichier/Ligne | Impact |
|---|---|---|---|---|
| SEC-001 | **Absence de validation tenantId sur certains endpoints ERP Adapter** | erp-adapter | `erp-adapter.controller.ts:56-68` | Fuite inter-tenant possible si `principal.tenantId` absent |
| SEC-002 | **Guards IAM en fail-open sur routes publiques mal marquées** | iam | `iam-jwt.guard.ts:25-31` | Routes sensibles accessibles sans auth si `@Public()` oublié |
| SEC-003 | **Secrets en dur dans `.env` committés** | config | `.env`, `.env.local` | Exposition credentials DB, JWT, Dolibarr |
| SEC-004 | **Absence de rate limiting global** | main.ts | `main.ts:41-55` | DoS, brute-force login |
| SEC-005 | **CORS trop permissif en dev** | main.ts | `main.ts:28-39` | CSRF potentiel si origine non validée |
| SEC-006 | **Injection possible via `Json` Prisma non validé** | data-runtime | `data-access-manager.ts` | Injection NoSQL-like si input non sanitizé |
| SEC-007 | **IDOR sur ressources ERP (pas de vérification ownership)** | erp-adapter | `erp-adapter.controller.ts:95-98` | Accès données autres tenants |
| SEC-008 | **Tokens JWT sans rotation automatique forcée** | iam | `iam-auth.service.ts` | Replay attacks si token volé |
| SEC-009 | **Absence de Content-Security-Policy** | main.ts | `main.ts:43` | XSS facilité |
| SEC-010 | **Logs d'audit incomplets (actions sensibles non tracées)** | iam | `iam-observability.service.ts` | Non-détection intrusions |
| SEC-011 | **Password reset sans expiration courte / rate limit** | iam | `iam-mfa.service.ts` | Prise de contrôle compte |
| SEC-012 | **ExternalResourceLink sans validation tenant à la création** | erp-registry | `external-resource-link.service.ts` | Corruption données inter-tenant |

---

## 3. FONCTIONNALITÉS CLÉS — ÉTAT RÉEL

### 3.1 Modules OPÉRATIONNELS (IMPLÉMENTÉ ET TESTÉ)

| Module | Fonctionnalités confirmées | Couverture test |
|---|---|---|
| **IAM Core** | Login, JWT, sessions, MFA, rôles, permissions, tenants, audit logs | 85% |
| **Platform (Applications, Versions, Environments, Contracts, Snapshots)** | CRUD complet, publication, déploiement, rollback | 70% |
| **Business Manager (Core)** | Applications, Data Models, Features, Navigation, Contracts, Quality gates | 75% |
| **Pack Manager** | Packs, versions, dépendances, publication, validation contrat | 80% |
| **Pack Runtime** | Résolution manifeste, cache, règles, capabilities, diagnostics | 70% |
| **ERP Registry** | Enregistrement ERP, credentials, entity mapping, external links | 65% |

### 3.2 Modules PARTIELS (Fonctionnel mais incomplet)

| Module | Manquants principaux |
|---|---|
| **ERP Adapter** | 29 ressources cataloguées mais < 40% ont handlers réels; DolibarrAdapter incomplet; runtime enforcement partiel |
| **Data Runtime** | Contract déclaré, QueryEngine/ExecutionEngine squelettes; binding/history/validation non reliés |
| **Integration** | Connectors, sync, webhooks, api-manager: routes déclarées, services vides |
| **Deployment** | Modules cockpit/gates/rollback/environments: routes uniquement, pas de logique |
| **Billing** | Catalog/Plans/Subscriptions/Invoices/Payments: controllers + DTOs, services partiels |
| **Automation** | Rules/Workflow/Trigger/Action/Conditions: engines déclarés, logique mock |
| **UI Builder** | Pages/Components/Forms/Theme/Navigation/Preview: 8 écrans, services backend partiels |

### 3.3 Modules QUASI ABSENTS (Squelettes uniquement)

| Module | État |
|---|---|
| **Catalog/Vente/Clients (Billing domain)** | DTOs + controllers uniquement, pas de persistance réelle |
| **Marketplace** | Non implémenté |
| **AI Layer** | Non implémenté (explicitement exclu du scope) |

---

## 4. PROBLÈMES D'ARCHITECTURE MAJEURS

| Problème | Localisation | Gravité |
|---|---|---|
| **Couplage circulaire PackManager ↔ UIBuilder ↔ PackRuntime ↔ BusinessManager** | `pack-manager.service.ts:12`, `ui-builder.service.ts`, `runtime-bridge.service.ts` | P1 |
| **Duplication modèles Prisma (ERP Registry vs ERP Adapter Platform models)** | `schema.prisma:1092-1177` vs `erp-adapter` models | P1 |
| **Services "Mock" en production (MockAutomation, MockERPAdapter)** | `automation/mock/`, `erp-adapter/mock/` | P1 |
| **TenantId optionnel sur modèles critiques (Application, Environment)** | `schema.prisma:71, 130` | P0 |
| **Absence de transaction boundary explicite sur opérations multi-modules** | `pack-manager.service.ts:36-38` | P2 |
| **Frontend: routes déclarées sans composants (ComingSoon pour 30% des routes)** | `App.jsx:159`, `navigationConfig.js` | P2 |
| **Design System BM dupliqué dans UI Builder (bm/ui.jsx vs propres composants)** | `components/business-manager/bm/ui.jsx` vs `features/ui-builder` | P3 |

---

## 5. RECOMMANDATIONS PRIORITAIRES (TOP 20)

| Priorité | Action | Module | Effort | Dépendances |
|---|---|---|---|---|
| 1 | Corriger validation tenantId obligatoire sur TOUS endpoints | erp-adapter, data-runtime, integration | S | — |
| 2 | Supprimer `.env`/`.env.local` du git, rotation secrets | config | S | — |
| 3 | Implémenter rate limiting global (nestjs-throttler) | main.ts | S | — |
| 4 | Ajouter CSP strict + helmet config complète | main.ts | S | — |
| 5 | Finaliser DolibarrAdapter (29 ressources) | erp-adapter/dolibarr | L | ERP Registry |
| 6 | Implémenter DataAccessManager réel (query/execute/bindings) | data-runtime | L | Prisma |
| 7 | Compléter Billing services (subscription/invoice/payment) | billing | L | Prisma, IAM |
| 8 | Implémenter Deployment engines (cockpit, gates, rollback) | deployment | L | Platform, Pack Runtime |
| 9 | Remplacer MockAutomation par vrais engines | automation | L | — |
| 10 | Unifier modèles ERP Registry / ERP Adapter | prisma/schema.prisma | M | Migration requise |
| 11 | Casser couplage circulaire Pack/UIBuilder/Runtime/BM | modules/* | M | Refactor interfaces |
| 12 | TenantId NOT NULL sur Application, Environment, Contract | prisma/schema.prisma | M | Migration + backfill |
| 13 | Tests d'intégration critiques (IAM, Pack, BM, ERP) | test/ | M | Testcontainers |
| 14 | Finaliser UI Builder (validation, preview, theme, forms) | ui-builder | L | BM Runtime Bridge |
| 15 | Compléter Integration (connectors, sync, webhooks, api-manager) | integration | L | ERP Registry |
| 16 | Audit logs complets sur toutes mutations sensibles | iam, platform, billing | M | — |
| 17 | Password reset : expiration 15min + rate limit 3/h | iam | S | — |
| 18 | ExternalResourceLink : validation tenant à l'écriture | erp-registry | S | — |
| 19 | Supprimer fichiers inutilisés / dead code | global | S | — |
| 20 | Documentation API (Swagger) complète + exemples | tous modules | M | — |

---

## 6. PLAN DE CORRECTION — VAGUES

### Vague 0 — Sécurité critique (Semaines 1-2)
- SEC-001 à SEC-012
- Rotation secrets, rate limiting, CSP, tenantId validation

### Vague 1 — Stabilisation socle (Semaines 3-5)
- Finaliser IAM (password reset, audit logs)
- TenantId NOT NULL + migration
- Tests d'intégration IAM/Platform/BM/Pack
- Nettoyage mocks en production

### Vague 2 — Compléter MVP métier (Semaines 6-10)
- ERP Adapter : 29 ressources Dolibarr opérationnelles
- Data Runtime : Query/Execution/Binding/History/Validation
- Billing : Subscription/Invoice/Payment/Usage/Webhooks
- UI Builder : 8 écrans fonctionnels + validation

### Vague 3 — Intégration modules (Semaines 11-15)
- Deployment : Cockpit, Gates, Rollback, Environments
- Automation : Rules, Workflow, Trigger, Action, Conditions
- Integration : Connectors, Sync, Webhooks, API Manager
- Unification modèles ERP

### Vague 4 — UX & Performance (Semaines 16-20)
- Design system unifié
- Performance frontend (lazy loading, bundle size)
- Accessibilité (WCAG 2.1 AA)
- Observabilité (metrics, tracing, alerting)

### Vague 5 — Avancé (Post-MVP)
- Marketplace, AI Layer, Multi-region, Advanced analytics

---

## 7. CONCLUSION

**AUDIT GLOBAL TERMINÉ — CORRECTIONS PRIORITAIRES REQUISES**

Le projet Techzone Cloud dispose d'une **architecture fondatrice robuste** (IAM, multi-tenant, Prisma, NestJS, React, design system) mais **présente des lacunes critiques de sécurité** et **de nombreux modules métier incomplets**. La priorité absolue est la **Vague 0 (Sécurité)** avant toute mise en production. Le socle MVP peut être stabilisé en ~5 semaines (Vagues 0-1), puis complété module par module.

**Fichiers d'audit créés** : 15 rapports dans `docs/audit/global/`
**Fichiers applicatifs modifiés** : 0
**Migrations** : Aucune
**Core/Dolibarr externe modifié** : Non

---

## Source : audit/global/REGRESSION_POST_PR_2026-10-19.md

# Audit de regression post-PR - 19 octobre 2026

## Verdict

**GO SOUS RESERVES.** Les builds, le typage, le lint et les tests unitaires cibles des contrats critiques passent. Aucun defaut produit P0 n'a ete demontre. En revanche, deux suites de regression de securite/runtime sont cassees par des fixtures qui ne suivent plus les contrats renforces, et les E2E PostgreSQL sont indisponibles (`DATABASE_UNAVAILABLE`). La release ne doit pas etre declaree entierement certifiee tant que ces suites ne sont pas corrigees et rejouees sur une base E2E isolee.

## 1. Perimetre, methode et etat Git

- Depot verifie : `origin = https://github.com/mamiambroise/techzone-cloud-v2.git`.
- Branche active : `mami`.
- Reference : `origin/main`.
- Etat de synchronisation : `mami`, `origin/mami` et `origin/main` pointent tous vers `8de5923fd40be0db487fb80c7fc1367ac8f382da` ; `origin/main...mami = 0 / 0`.
- Dernier commit : `8de5923f` - *Merge pull request #17 from mamiambroise/Nassa*, 2026-10-19 06:05:02 +03:00.
- Aucun commit, push, PR, reset, nettoyage ou modification applicative n'a ete realise.
- Des elements non suivis existaient avant l'audit : `docs/audit/global/` et `docs/ui-ux/`. Ils ont ete preserves. Ce rapport est le seul fichier ajoute par l'audit.

Les changements ont ete analyses par diff Git, inspection de code et executions automatisees. Les tests E2E et les controles de migration qui exigent PostgreSQL sont explicitement marques `BLOCKED`, et non `PASS`.

## 2. PR et commits analyses

La fenetre recente fusionnee dans `main` couvre les PR #12 a #19 (14--19 octobre). L'analyse detaillee a priorise les quatre fusions qui modifient directement les modules cibles.

| PR / merge | Date de merge (+03) | Fichiers / modules impactes | Observation d'audit |
|---|---:|---|---|
| #12 / `63989f6` | 15/10 04:41 | branche `jasmina`, socle Pack Manager | Inclus dans le diff de synchronisation ; confirme par #19. |
| #13 / `9d6a608` | 15/10 04:42 | Business Manager V3 | Applications, versions et contrats BM, dependances des modules PM/Runtime. |
| #14 / `3605ff5` | 15/10 04:44 | Nassa / integration | Integration interbranche avant les fusions suivantes. |
| #15 / `98bde79` | 15/10 04:45 | Mami / seed et environnement | Infrastructure de recette ; pas de recette DB possible dans cet environnement. |
| #16 / `59698c2` | 16/10 14:20 | IAM, Business Manager, deployment, Prisma, diagnostics | 69 fichiers ; tenant/membership, authorisation, Runtime Bridge et deployment. |
| #18 / `7ba1d9b` | 19/10 06:02 | UI Builder, Shared Renderer, Pack Runtime, IAM, CI | 50 fichiers dans le diff de merge : registre de composants, validation, securite UI, renderer, responsive et tests. |
| #19 / `e3ef68c` | 19/10 06:03 | Pack Manager, schema/migration Prisma, BM Resource Editor, UI PM | 15 fichiers, 972 ajouts / 50 suppressions : liaison Pack/ApplicationVersion, validation et formulaire PM. |
| #17 / `8de5923` | 19/10 06:05 | Data Runtime, Pack Runtime, Prisma, IAM constants, UI Runtime | 14 fichiers, 1 291 ajouts / 444 suppressions ; garde de resolution executable et contrats runtime. |

## 3. References officielles utilisees

Les exigences ci-dessous sont celles effectivement rapprochees du code et des tests ; aucune exigence supplementaire n'a ete inferee.

- `Cahiers de charges/TECHZONE_PACK_MANAGER_V3/01_CDC_PACK_MANAGER_ETAPE_1_CIBLE.md` : sections 10 (lien ApplicationVersion), 12--13 (snapshot/UI snapshot), 29 (isolation tenant), 42 (integration Runtime).
- `Cahiers de charges/TECHZONE_PACK_MANAGER_V3/05_SECURITY_TEST_PACK_MANAGER.md` : cas ApplicationVersion cross-tenant, snapshot UI incoherent et tampering.
- `Cahiers de charges/TECHZONE_PACK_RUNTIME_V3/01_CDC_PACK_RUNTIME_ETAPE_1_CIBLE.md` : sections 12--13 (resolutionId et effective manifest), 30 (contrat Data Runtime), 38 (isolation tenant), 47--48 (UX et lancement Runtime).
- `Cahiers de charges/TECHZONE_UI_BUILDER_V3/01_CDC_UI_BUILDER_ETAPE_1_CIBLE.md` : sections 34 (meme ApplicationVersion au Runtime), 44 (isolation tenant) et renderer partage preview/runtime.
- `Cahiers de charges/TECHZONE_UI_BUILDER_V3/05_SECURITY_TEST_UI_BUILDER.md` : SEC-UI-001/002/010/011/020/021/030/031/040/041/050/051/060/061/080/090/091/100/101.
- `Cahiers de charges/TECHZONE_AUTH_IAM_DOCUMENTATION_V3/01_CDC_AUTH_IAM_ETAPE_1_CIBLE.md` : tenant issu du contexte IAM, membership, refus cross-tenant et permissions serveur.
- `Cahiers de charges/TECHZONE_DATA_PLATFORM_DATA_RUNTIME_V3/01_CDC_DATA_PLATFORM_DATA_RUNTIME_ETAPE_1_CIBLE.md` : contexte Runtime Data, tenant serveur, permission metier et resolution `EXECUTABLE` obligatoire.
- `Cahiers de charges/TECHZONE_BUSINESS_MANAGER_V3/01_CDC_BUSINESS_MANAGER_ETAPE_1_CIBLE.md` : ApplicationVersion tenant-scoped et PM proprietaire de la publication.
- Documents d'implementation controles : `docs/UI_BUILDER_SECURITY_TESTS.md`, `docs/UI_BUILDER_SPEC_IMPLEMENTATION.md`, `docs/UI_BUILDER_TECH_IMPLEMENTATION.md`, `docs/platform-consolidation/BUSINESS_PACK_RUNTIME_2026_IMPLEMENTATION_REPORT.md`, `docs/architecture/DATA_RUNTIME_BUSINESS_RECORDS.md`.

## 4. Matrice de tracabilite

| Exigence officielle | Fonctionnalite / fichiers observes | Controle realise | Resultat |
|---|---|---|---|
| PM CDC §10, §29 : PackVersion liee a une ApplicationVersion du meme tenant et de la meme application | `backend/src/modules/pack-manager/pack-manager.service.ts` (creation, validation) ; `frontend/src/components/pack-manager/PackManagerPage.jsx` | Tests cibles `pack-manager.service.spec`, `pack-manager.controller.spec`, `pack-contract.spec` | **PASS** - 53/53 tests cibles backend. |
| PM CDC §12--13 : snapshot deterministic, meme ApplicationVersion, immutabilite/integrite | `pack-manager.service.ts:621-646`, `:785-810`, `:961-978` ; `ui-snapshot.integration.spec.ts` | Suite securite backend et suite snapshot | **FAIL** - code fail-closed, mais 5 tests snapshot echouent car leurs mocks omettent `applicationVersion` et `packVersion`. |
| PR CDC §12--13 : `resolutionId` serveur et manifest effectif `EXECUTABLE` | `frontend/src/components/pack-runtime/PublishedApplication.jsx:12-29` ; `backend/src/modules/pack-runtime/pack-runtime.service.ts` | Inspection + `pack-runtime.service.spec` | **PASS (code/tests cibles)** - garde fail-closed presente ; 53/53 backend cible. |
| UI CDC §34 et SEC-UI-111/121 : renderer partage et refus de manifest/runtime non executable | `PublishedApplication.jsx`; `frontend/src/features/ui-builder/renderer/*` | Tests renderer/registry/model ; `PublishedApplication.test.jsx` | **PARTIAL** - 44/44 passes (2 skips) sur renderer/registry/model ; 12/12 echouent dans le test PublishedApplication car le helper ne fournit plus le contrat requis. |
| UI SEC-UI-001/002/010/011/020/021/030/031/040/041/050/051/060/061/080/090/091 | `backend/src/modules/ui-builder/*`, guards IAM, registry frontend | `npm run test:security:ui` backend | **PARTIAL** - 138/143 passent ; les 5 echecs sont exclusivement la suite snapshot ci-dessus. |
| UI SEC-UI-100/101 : callbacks BmSelect et recherche de pages | `frontend/src/features/ui-builder/components/UiPagesManager.jsx`; `UiBuilderControls.test.jsx` | Rejeu cible | **FAIL (test)** - 10/11 passent ; le select fonctionne, mais l'assertion de recherche est ambigue. |
| Data Runtime CDC : tenant/permission/runtime resolution | `backend/src/data-runtime/data-runtime.controller.ts` | `data-runtime.controller.spec` dans les 53 tests cibles | **PASS** |
| IAM CDC : tenant/membership et refus de permission/cross-tenant | `backend/src/iam/iam-jwt.guard.ts`, `iam-authorization.service.ts` | `iam-jwt.guard.spec`, `iam-authorization.service.spec`, IAM guards de la suite securite | **PASS (unitaire)** ; E2E DB **BLOCKED**. |
| Prisma : schema et migration coherents | `backend/prisma/schema.prisma`, migration #19 | `npx prisma validate`, `npx prisma migrate status` | **PASS** pour le schema ; **BLOCKED** pour le status, moteur Prisma sans PostgreSQL. |

## 5. Tests executes

| Controle | Commande / perimetre | Resultat | Preuve / remarque |
|---|---|---|---|
| Build backend | `backend: npx nest build` | **PASS** | Compilation Nest reussie. |
| Lint backend | `backend: npx oxlint src/ test/` | **PASS** | Pas d'erreur bloquante. |
| Build frontend | `frontend: npx vite build` | **PASS** | 2 345 modules transformes ; avertissement de chunk entree a 586,66 kB. |
| TypeScript + lint frontend | `npx tsc --noEmit; npx oxlint` | **PASS** | Aucun diagnostic retourne. |
| Tests backend cibles PM/Runtime/Data/IAM | 7 suites explicites | **PASS** | 7 suites, 53 tests passes. |
| Tests securite UI backend | `npm run test:security:ui` | **FAIL** | 9 suites / 138 passes ; `ui-snapshot.integration.spec.ts` = 5 echecs. |
| Tests UI Builder renderer/registry/model | Vitest cible | **PASS** | 7 suites pass, 2 ignorees ; 44 passes, 2 ignores. |
| Test callback UI Builder | `UiBuilderControls.test.jsx` | **FAIL** | 10 passes / 1 echec, selecteur ambigu. |
| Tests Runtime publie frontend | `PublishedApplication.test.jsx` | **FAIL** | 12/12 echecs, fixtures non adaptees au nouveau contrat executable. |
| Suite frontend complete | `npm test -- --maxWorkers=2 --testTimeout=15000` | **FAIL** | Echec observe dans `UiBuilderControls.test.jsx`; les rejoues cibles ont etabli les causes restantes. |
| Prisma schema | `npx prisma validate` | **PASS** | Schema valide. |
| Prisma migration status | `npx prisma migrate status` | **BLOCKED** | Schema engine sans connexion DB. |
| E2E IAM/API | `backend: npm run test:e2e` | **BLOCKED** | PostgreSQL `127.0.0.1:55432` inaccessible ; 20 e2e non executes fonctionnellement. |
| Tests manuels UI/responsive/API reelle | Non lances | **NOT TESTED** | Frontend 3000 actif, backend 3003 arrete ; absence de PostgreSQL. |
| Verification worktree | `git diff --check` et statut | **PASS** | Aucun diff suivi cree par l'audit ; fichiers non suivis preexistants preserves. |

## 6. Anomalies et risques

| ID | Priorite | Module | Fichier / localisation | Preuve | Exigence / impact | Recommandation |
|---|---|---|---|---|---|---|
| REG-001 | **P1** | Pack Manager / UI Builder | `backend/src/modules/pack-manager/ui-snapshot.integration.spec.ts:8-20, 26-70` | 5 echecs : `APPLICATION_VERSION_NOT_FOUND` a `pack-manager.service.ts:621-626`; puis mock sans `packVersion` provoquant `snapshotHash` undefined a `:972`. | PM CDC §10, §12--13 et security tests PM : le parcours snapshot ne peut plus certifier son contrat. Le code renforce correctement la liaison, mais la couverture regression est invalide. | Mettre a jour `version()` avec `applicationVersion` (tenant, applicationId, application tenant) et le mock de manifest avec `packVersion.snapshot`; rejouer la suite securite backend. |
| REG-002 | **P1** | Pack Runtime / UI Runtime | `frontend/src/components/pack-runtime/PublishedApplication.test.jsx:15-18, 20-70` | 12/12 echecs : composant retourne *Runtime bloque* car `resolutionId` est absent et le mock n'a ni `status: EXECUTABLE` ni `content` conforme a `PublishedApplication.jsx:12-29`. | PR CDC §12--13, UI SEC-UI-111/121 : les tests ne prouvent plus le renderer publie, le refus des manifests et l'isolation tenant. L'implementation semble fail-closed, mais le garde-fou doit etre recertifie. | Adapter `gate()`/`renderPublished()` au contrat actuel (`resolutionId`, effective manifest executable et contenu attendu), puis rejouer les 12 cas et le parcours preview -> publication -> runtime. |
| REG-003 | **P2** | UI Builder | `frontend/src/features/ui-builder/components/UiBuilderControls.test.jsx:253` | `findByText(/Aucun/)` correspond a trois elements : *Aucune page selectionnee*, *Aucune modification*, *Aucun resultat*. 10 autres cas de la suite passent et *Aucun resultat* est rendu. | SEC-UI-101 : la recherche est couverte par une assertion non deterministe ; la suite frontend globale est rouge. | Cibler l'etat vide avec role, libelle exact ou conteneur de `UiPagesManager`, puis rejouer la suite complete. |
| REG-004 | **P1** (blocage environnement) | E2E / Prisma / IAM / BM | `backend/test/iam-e2e-runner.mjs`; PostgreSQL local | `npm run test:e2e` et `prisma migrate status` : `Can't reach database server at 127.0.0.1:55432`; 20 cas E2E ne sont pas valides. | CDC IAM, PM, PR et Data Runtime demandent des preuves cross-tenant et E2E UI -> Runtime -> Data. Aucune conclusion fonctionnelle ou securite E2E n'est possible. | Demarrer PostgreSQL et fournir une `TEST_DATABASE_URL` isolee et accessible ; valider cible/migrations sans `db push`, puis rejouer E2E et recette API/UI. |
| REG-005 | **P3** | Performance frontend | sortie `vite build` | Chunk `index-*.js` = 586,66 kB (> 500 kB), build reussi. | Risque de performance, pas de regression fonctionnelle demontree. | Analyser le code splitting apres retablissement des gates P1. |

**Aucun P0 n'a ete observe.** REG-001 a REG-003 sont des regressions de tests/fixtures et non une preuve d'execution produit incorrecte ; elles restent P1/P2 car elles empechent la certification des protections qu'elles sont censees verifier.

## 7. Conformite par module et controles intermodules

| Module | Etat | Elements verifies | Limites |
|---|---|---|---|
| Pack Manager | Sous reserve | Validation ApplicationVersion/tenant, permissions, contrat et tests cibles verts. | Suite snapshot/regression rouge (REG-001), pas de DB reelle. |
| Pack Runtime | Sous reserve | Test service cible vert ; code frontend exige resolution executable et bloque par defaut. | Tests PublishedApplication obsoletes (REG-002), pas de parcours E2E. |
| UI Builder | Sous reserve | Renderer, registry, modele et securite backend majoritairement verts. | Callback/search test rouge (REG-003), tests navigateur non executes. |
| IAM / securite | Sous reserve | Guards/services unitaires et refus de permission observes. | Cross-tenant PostgreSQL E2E bloque (REG-004). |
| Data Runtime | Conforme au perimetre unitaire | Controller cible vert ; contrat runtime/documentation inspectes. | Verification Runtime -> Data avec DB absente. |
| Business Manager | Sous reserve | Dependances ApplicationVersion et impacts des PR inspectes. | CRUD/API reelle et isolation DB non executes. |
| Deployment / Automation | Non recertifie | Seuls impacts indirects de #16 ont ete inventories. | Hors priorite des diffs recents et E2E indisponible. |

Flux intermodules controles :

1. **BM -> Pack Manager** : la PackVersion exige une ApplicationVersion, controle tenant/application et statut ; tests cibles verts.
2. **UI Builder -> Pack Manager** : le snapshot est construit apres validation UI et identite d'ApplicationVersion ; code present, mais sa suite de contrat est rouge (REG-001).
3. **Pack Manager -> Pack Runtime** : manifest publie et verification de hash inspectes ; service Runtime cible vert.
4. **Pack Runtime -> UI / Data Runtime** : le frontend exige maintenant une resolution serveur executable et fail-closed ; renderer unitaire vert, mais pas de certification API/DB (REG-002, REG-004).
5. **IAM transversal** : le tenant provient du principal et les permissions sont verifiees dans les tests unitaires ; l'absence de DB empeche la preuve HTTP complete.

## 8. Controle UI/UX et parcours metier

- **Inspection de code realisee** : navigation du renderer publie, route/page selectionnee, etats bloque/chargement/erreur, renderer partage preview/runtime, controles focus visibles dans les composants modifies.
- **Automatise realise** : renderer responsive/parity/security, registry et modele UI Builder (44 tests passes, 2 ignores), ainsi que les composants/UI Runtime concernes par les echecs consignes.
- **Non execute manuellement** : CRUD Pack/BM, sidebar/routage authentifie, formulaires sur API reelle, responsive navigateur multi-largeurs et parcours complet Login -> BM -> UI Builder -> Pack -> Runtime -> Data. Le backend est arrete et PostgreSQL est indisponible ; les marquer PASS aurait ete incorrect.

## 9. Plan de correction priorise

1. **P1 - REG-001 et REG-002 :** aligner les fixtures de tests sur les contrats post-PR, puis rendre a nouveau vertes les suites `test:security:ui` backend et frontend.
2. **P1 - REG-004 :** restaurer PostgreSQL et une base `TEST_DATABASE_URL` distincte ; ne pas utiliser la base applicative. Rejouer migrations status, E2E IAM et les recettes API/Runtime.
3. **P2 - REG-003 :** rendre l'assertion de recherche UI Builder non ambigue et relancer toute la suite Vitest.
4. **P2 :** apres DB disponible, executer une recette reelle tenant A/B couvrant ApplicationVersion, snapshot UI, publication, resolution executable et Data Runtime ; verifier les 403/404 et le non-reemploi de donnees apres changement de tenant.
5. **P3 - REG-005 :** mesurer le bundle et decouper l'entree principale si le budget performance le requiert.

## 10. Conditions de levee des reserves

Le verdict pourra devenir **GO** lorsque les conditions suivantes seront prouvees par execution :

- `backend npm run test:security:ui` vert (143 tests attendus apres mise a jour des fixtures) ;
- `frontend npm run test:security:ui` vert, dont les 12 cas `PublishedApplication` ;
- suite frontend complete verte ;
- PostgreSQL disponible, `prisma migrate status` verifie sur cible isolee sans migration destructive ;
- E2E IAM/cross-tenant et parcours UI -> Pack Runtime -> Data Runtime verts ;
- recette manuelle responsive et parcours CRUD principaux documentee.


---

## Source : ui-ux/BM_UIBUILDER_UX_VALIDATION.md

# Validation UI/UX — Business Manager et UI Builder

Date : 7 octobre 2026  
Portée : interface `frontend/` et recette navigateur ; aucun contrat backend, donnée métier ou fichier Dolibarr n'a été modifié.

## Audit avant intervention

| Composant | Implémentation constatée | BM | UI Builder | Décision |
|---|---|---:|---:|---|
| `bm/ui.jsx` | primitives compactes (cartes, badges, tables, états, boutons) | Oui | Oui | conserver comme socle commun |
| `PageHeader.jsx` | en-tête historique générique | Oui | indirect | conserver, éviter un second shell |
| `BMApplicationForm.jsx` | champs et boutons stylés localement | Oui | Non | consolider sur les primitives BM |
| `BMWorkspaceRoute.jsx` | contexte tenant/application/version, tables et éditeurs réels | Oui | source de contexte | conserver, aucun changement de contrat |
| `UiBuilderLayout.jsx` | shell contextualisé et navigation locale | Non | Oui | rendre les onglets défilables horizontalement sur petit écran |
| `UiVisualEditor.jsx` | palette, canvas, inspector, mais sélection URL absente ; état mobile non déclenché | Non | Oui | synchroniser `:pageId`, rendre palette/inspecteur activables sur mobile |
| `UiPagesManager.jsx` | création, recherche, réordonnancement et suppression réels | Non | Oui | conserver les flux API et IAM |
| `index.css` | tokens BM, focus, mouvement réduit et skeleton | Oui | Oui | conserver ; pas de design system parallèle |

Constats principaux : la base visuelle existante est déjà cohérente et doit être étendue, non remplacée. Les écarts utiles à corriger étaient la duplication du formulaire de création d'application, l'accessibilité de la navigation UI Builder compacte, et l'ouverture directe d'une page dans l'éditeur.

## Après

### Design system consolidé

- `BmField` fournit libellé, aide et message d'erreur accessibles ; les contraintes obligatoires restent portées par les contrôles natifs.
- `BmFormSection` donne une hiérarchie sémantique aux formulaires longs.
- `BMApplicationForm` réemploie boutons, focus, champs et section BM ; aucune donnée n'est mockée.
- UI Builder conserve les cartes, badges, boutons, états d'erreur et de chargement de `bm/ui.jsx`.
- Les onglets UI Builder sont compacts, focalisables et défilables horizontalement : aucun overflow global n'est requis à 320 px.

### Business Manager validé

- Vue d'ensemble : KPI, activité, santé et états réels conservés.
- Applications : recherche, filtres, tri, états vide/erreur et actions conservés.
- Modèles de données : contexte Tenant → Application → Version, tables et CRUD inchangés.
- Fonctionnalités, navigation, configuration, validation/publication : navigation locale et données API inchangées.
- Formulaire d'application : sections, libellés associés et actions explicites.

### UI Builder validé

- Vue d'ensemble, pages, composants, formulaires, navigation, thème et aperçu restent dans le shell tenant-scoped existant.
- L'éditeur synchronise désormais `/ui/builder/:pageId` avec la page chargée : l'URL ouvre son canvas réel au lieu d'un état vide.
- Sur mobile, les commandes « Composants » et « Propriétés » rendent respectivement la palette et l'inspecteur disponibles sans afficher trois colonnes simultanément.
- Palette, tree/canvas et inspecteur restent dérivés du registry et du store Redux existants ; aucun faux composant ni action Runtime n'est ajouté.

## Responsive et accessibilité

| Largeur | Vérification attendue |
|---:|---|
| 320 / 390 | navigation UI Builder défilable, palette ou inspecteur activable, canvas sans grille trois-colonnes |
| 768 | outils et contexte en retour à la ligne contrôlé |
| 1024 / 1440 | palette, canvas et inspecteur visibles en grille, tables avec conteneur de défilement horizontal local |

- Focus visible commun (`bm-focus`) et contrôles natifs clavier.
- Libellés explicites sur champs, boutons icône et sélecteurs.
- Les statuts gardent un texte et/ou une icône, pas uniquement une couleur.
- Les transitions existantes respectent `prefers-reduced-motion`.
- Les actions et les contrôles restent soumis aux permissions et au backend ; aucune règle IAM n'a été modifiée.

## Tests et recette

- Tests ciblés : 4 suites, 17 tests réussis (formulaire BM, workspace BM, vue d'ensemble UI Builder, éditeur visuel et synchronisation de page).
- Suite frontend complète : 27 suites réussies, 3 ignorées ; 267 tests réussis, 8 ignorés.
- Build production Vite : réussi. Seul l'avertissement existant sur la taille du bundle initial demeure (556 kB après minification).
- Recette navigateur locale réelle : réussie avec authentification, sélection du tenant `Techzone WiFi Services`, cookies HttpOnly, contrôle IAM non-admin (403 attendu), puis rendu des routes Dashboard, Applications, Business Manager, Configuration, ERP, Data Runtime et Formulaires UI.
- Le script de recette navigue désormais dans la SPA après la sélection du tenant afin de conserver le contexte tenant réel ; il ne contourne ni IAM ni les API.
- Les données de test utilisent les deux contextes métier existants et aucun tenant fictif n'est introduit dans le code de production.
- Les tests de store et de contexte conservent la purge tenant-scoped existante ; le changement de tenant reste piloté par `TenantProvider` et les clés de contexte par tenant.

---

## Revalidation de regression - 19 octobre 2026 (execution courante)

### Integrite Git

- Branche : `mami`, commit `ed9336da`; les references locales `origin/mami` et `origin/main` sont identiques (0 avance, 0 retard).
- `git fetch origin` execute sans merge ni checkout : `origin/mami` et `origin/main` sont confirmes au commit `ed9336da` (0 avance, 0 retard).
- Les elements non suivis deja presents ont ete preserves; aucun code, migration, seed, reset, merge ou commit n'a ete realise.

### Matrice de preuve executee

| Module | Commande executee | Resultat reel | Statut |
|---|---|---|---|
| Environment / Deployment | `frontend: npm run build`; `backend: npm test -- --runInBand deployment` | Build Vite PASS; 11 suites / 64 tests Deployment PASS; chunk initial 586.66 kB (170.99 kB gzip) | PARTIAL |
| Prisma / Tenant Foundation | `npm run prisma:test:validate`; `npm run prisma:test:status` | Schema valide; 11 migrations, `techzone_test` isolee, schema a jour | PASS pour les controles executes |
| Auth / IAM / Context | `iam-throttle.security.spec.ts --detectOpenHandles`; `npm run test:e2e` | 11/11 unitaires PASS; 2 suites / 20 tests IAM E2E PASS, y compris refus attendus | PASS pour les controles executes |
| Business Manager V3 | tests backend BM/PM et frontend BM/PM/contexte | Backend : 13 suites / 103 tests PASS; frontend : 50 PASS, 6 SKIPPED | PARTIAL |
| UI Builder V3 | gates backend/frontend ciblees | Backend UI/Runtime/Data : 13 suites / 169 tests PASS; frontend securite UI/Runtime : 116 PASS, 2 SKIPPED | PARTIAL |
| Pack Manager V3 | gate securite backend et suite BM/PM | Snapshot, permissions et contrats couverts par 146/146 puis 103/103 tests PASS | PARTIAL |
| Pack Runtime V3 | gates backend/frontend ciblees | Backend Runtime/Data/UI : 169/169; frontend : 116 PASS, 2 SKIPPED | PARTIAL |

Commandes additionnelles : `backend npm run test:security:ui` = 10 suites / 146 tests PASS; `frontend npm run test:security:ui` = 13 fichiers PASS, 2 SKIPPED, 116 tests PASS, 2 SKIPPED; `backend npm test -- --runInBand iam` = 17 suites / 145 tests PASS. Le dry-run de seed standard cible explicitement `techzone_test`, selectionne 10 modules et confirme `writes: false`. Les refus IAM/token/session/MFA observes etaient les branches negatives attendues.

### Simulation boutique reelle - 19 octobre 2026

La simulation est executee uniquement sur `techzone_test` (`127.0.0.1:55432`, schema `business_manager`). Le profil local standard pointe vers une autre base; backend et frontend ont donc ete lances avec une surcharge en memoire de `DATABASE_URL` vers `TEST_DATABASE_URL`. Les services ont repondu : backend health/ready 200, frontend 200, endpoint anonyme IAM 401 attendu.

| Scenario | Operations reelles | Preuve | Statut |
|---|---|---|---|
| SIM-BOUTIQUE-01 | Creation tenant, administrateur Boutique et membership; connexion et bascule de contexte | Tenant `TENANT_BOUTIQUE_A` id `96ab05db-dfaa-466a-b948-29a5e4576cee`; membership id `042f98e8-900d-4f60-81f3-89166d08ef33`; HTTP 201/200/200/200 et relecture Prisma | PASS |
| SIM-BOUTIQUE-02 | Creation Application et ApplicationVersion par API BM | `TECHZONE_BOUTIQUE` id `49db887a-7f63-4f00-b259-88ef23af3689`; version `1.0.0` id `c2eb68ca-7535-4d24-8148-0f1dfb1720c9`; HTTP 201/201, persistance confirmee | PASS |
| SIM-BOUTIQUE-03 | Modele BM : 7 entites, 26 champs, 6 relations | HTTP 201 sur chaque creation; compteurs Prisma 7 / 26 / 6 | PASS |
| SIM-BOUTIQUE-04 | Diagnostic puis revalidation BM | Rapport initial HTTP 200 : score `52`, gate `BLOCKED`, `NO_FEATURE` ERROR, `NO_MENU` WARNING, `NO_CONFIGURATION` WARNING, `NO_PUBLISHABLE_CONTRACT` BLOCKER. Apres creation API de 6 features/6 capabilities, 1 menu/6 items, config `boutique.sales.currency=MGA` ACTIVE et contrat `boutique_vente_contract` LOCKED : HTTP 201, score `100`, gate `PASS`, aucune issue | PASS |
| SIM-BOUTIQUE-05 | UI Builder et navigation resolue | 7 pages creees HTTP 201 : `/boutique/dashboard`, produits, categories, clients, ventes, stock, nouvelle vente. Les 6 routes de menu ont ete patchées HTTP 200 vers ces pages; UI validate HTTP 201 `VALID` (0 erreur, 0 warning), definition HTTP 200 (`schemaVersion 1.1`) | PASS |
| SIM-BOUTIQUE-06 | Correction REG-011 et Pack `PACK_BOUTIQUE_VENTE` version `1.0.0` | Cause confirmee : migration/colonne deja presentes mais client Prisma genere stale. `prisma migrate status` (11 migrations) OK; `prisma generate` 7.10.0, build et restart backend OK. Le script `backend npm run build` execute maintenant `prisma generate && nest build` et a ete execute avec succes. La colonne `pm_packs.applicationId` est presente; le pack `6d54207e-798f-45c7-9a91-e02a2d75501f` reste DRAFT avec 0 PackVersion, donc aucune persistance partielle du HTTP 500. La remediation REG-012 a ete precontrolee puis arretee avant toute ecriture : le catalogue IAM est vide (REG-013), donc `application_manager` est introuvable. | BLOCKED (REG-013; REG-011 artefact corrige, preuve HTTP restante) |
| SIM-BOUTIQUE-07 a 10 | Pack Runtime, Data Runtime et ventes VENTE-001 a VENTE-006 | Non executes : le rejet IAM empeche la creation reelle de PackVersion. Aucun snapshot/manifest/publish, activation Runtime ou application publiee n'existe. Aucune vente n'est simulee. | BLOCKED (dependance REG-012) |

Le bootstrap IAM a ete necessaire car `techzone_test` etait vide : un administrateur de campagne a ete cree par le vrai service IAM, puis les objets Boutique ont ete crees par les API HTTP protegees. Les secrets ont ete generes seulement en memoire et ne sont pas rapportes. Le diagnostic REG-012 confirme que ce compte, son credential PASSWORD, son membership `TENANT_BOUTIQUE_A` et le tenant sont ACTIFS; seul le mot de passe de test disponible au rejeu ne correspond pas. Il n'a par ailleurs aucune `RoleAssignment` : le fallback IAM `tenant_user` est lecture seule et ne permettrait pas Pack Manager. La remediation autorisee a controle le role avant toute ecriture et a constate que le catalogue RBAC est vide (0 role, 0 permission active) : `application_manager` est introuvable (REG-013). Aucun mot de passe, credential, session, role ou permission n'a donc ete modifie. La creation de membership avec `metadata` objet retourne reellement HTTP 400 (`metadata must be a string`) : la cause est le decorateur `@IsString()` conserve dans le DTO source et compile, malgre le type TypeScript `Record<string, unknown>` (REG-010). Aucun correctif applicatif n'a ete applique.

Preuve PostgreSQL via relecture Prisma sur `techzone_test` : 6 `BmFeature`, 6 `BmFeatureCapability`, 1 `BmMenu`, 6 `BmNavigationItem`, configuration `dbab264a-95d2-4a5e-8611-a57502aec185` ACTIVE, contrat `4654df3c-eab3-42a4-9ca4-f4ff7f48c8ea` LOCKED et 7 `UiPage`. Pour REG-011, `business_manager.pm_packs.applicationId` est bien presente, le client Prisma regenere 7.10.0 expose ce champ, le pack est encore DRAFT/non lie et `pm_pack_versions` retourne 0 ligne pour ce pack. Cela exclut une migration manquante et toute PackVersion partielle.

### Ecarts et limites verifies

- `npx tsc --noEmit -p tsconfig.spec.json --pretty false` : FAIL, **304 diagnostics** (`REG-008` reste ouvert).
- `REG-005` reste ouvert : build reussi mais avertissement Vite pour le chunk principal superieur a 500 kB.
- Les 39 fichiers reellement decouverts par Vitest ont ete rejoues par lots : UI/Runtime, BM/Pack/contexte et navigation/composants. L'invocation globale n'a pas restitue son recapitulatif final, aussi aucun total agrege n'est declare. Deux recettes PostgreSQL opt-in (`Phase7.postgres.test.jsx`, `Renderer.postgres.test.jsx`) sont exclues volontairement par la configuration et restent **NOT TESTED** faute des variables et du backend reel requis. Le typecheck frontend reste **NON CERTIFIE** car son recapitulatif final n'a pas ete restitue.
- La fondation Boutique, le modele BM, la gate BM et les pages UI ont ete executes et persistes. La correction d'artefact REG-011 est appliquee et son test PM cible est vert (14/14), mais le rejeu HTTP est bloque par le compte de campagne (`REG-012`). Les ventes VENTE-001 a VENTE-006, Pack Runtime et Data Runtime restent **NOT TESTED** : aucun parcours publie UI -> Pack -> Runtime -> Data ne peut etre execute honestement.
- Les CDC existent pour les sept modules, mais SIM-01 a SIM-32 ne sont pas relies dans le depot a des scripts/scenarios executables individuels; ils restent **NOT TESTED**.

### Decision de recette

**GO SOUS RESERVES pour les regressions automatisees executees; NO-GO pour une certification complete ou une recette metier boutique.** La gate BM et les pages UI de la boutique sont maintenant prouvees; REG-011 est corrige au niveau du client Prisma genere, mais la chaine publication/Runtime/vente reste bloquee par l'acces IAM de campagne (`REG-012`). Les ventes reelles ne sont donc pas declarees. Les reserves `REG-005`, `REG-008`, `REG-009` et `REG-010` restent egalement ouvertes.

## Limites connues

- La recette navigateur automatisée a été réalisée à 1440 px. Les comportements 320/390/768/1024 sont couverts par les breakpoints et tests de composants ; une revue visuelle manuelle complémentaire à ces largeurs reste recommandée avant livraison externe.
- Le serveur Dolibarr local peut signaler son indisponibilité MySQL ; cette mission ne modifie pas Dolibarr ni son infrastructure.

