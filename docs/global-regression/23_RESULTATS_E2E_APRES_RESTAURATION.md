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
