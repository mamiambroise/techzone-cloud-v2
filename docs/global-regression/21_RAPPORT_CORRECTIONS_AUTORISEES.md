# Rapport des corrections autorisees - 2026-10-19

## A. Synthese

Execution realisee sur `mami`, sans push. Les six taches autorisees ont ete examinees dans l'ordre demande. Quatre sont corrigees et validees; deux restent a faire car PostgreSQL E2E isole ne demarre pas dans cette session Windows.

| Mesure | Resultat |
|---|---:|
| Taches autorisees corrigees et validees | 4 |
| Taches autorisees bloquees | 2 |
| Tests cibles PASS | 219 |
| Tests Deployment PASS | 35 |
| Tests Deployment bloques par DB | 29 |
| Tests ignores (PostgreSQL frontend) | 2 |
| Nouvelle anomalie enregistree, non corrigee | 1 (REG-008) |

Les comptes PASS sont les executions cibles : Cockpit (3), snapshots Pack (9), gate backend associee (146), Runtime publie (13), Runtime/Renderer (37) et UI Builder (11). Ils ne remplacent pas une suite complete.

Builds et controles statiques executes apres correction : `npx vite build`, `npx tsc --noEmit` et `npx oxlint` frontend, ainsi que `npx nest build`, `npx oxlint` cible et `npx prisma validate` backend. Ils ont reussi. Vite conserve l'avertissement deja connu du bundle d'entree a 586.66 kB (REG-005, non modifie).

## B. Tableau de correction

| ID | Responsable | Avant | Correction | Tests | Etat | Commit |
|---|---|---|---|---|---|---|
| REG-004 | Jasmina / Mami | PostgreSQL test indisponible | Infrastructure existante inspectee; aucun contournement non isole | Connexion test refusee; `pg_ctl` erreurs 87/3 | A faire | - |
| REG-007 | Nassa / Jasmina | Risque de connexion implicite | Garde existant verifie : Jest force la cible test ou echoue ferme | Deployment : 35 PASS, 29 bloques sur 55432 | A faire | - |
| REG-006 | Nassa | Spec Cockpit syntaxiquement fusionnee de facon invalide | Test d'isolation restaure avec mock Prisma controle | 3/3 PASS | OK | `1500c82` |
| REG-001 | Jasmina / Ranja | Fixtures Pack incompletes | ApplicationVersion, PackVersion, snapshot et hashes alignes | 9/9 snapshots; 146/146 securite UI/backend PASS | OK | `c33e18d` |
| REG-002 | Nassa | Fixtures Runtime incompatibles avec V3 | Fixtures `resolutionId`/`EXECUTABLE`; gardes tenant, pack/version, hash et schema retablis | 13/13 PublishedApplication; 37 PASS, 2 skips Runtime/Renderer | OK | `173b179` |
| REG-003 | Ranja | Assertion regex ambigue | Assertion exacte sur l'etat vide de recherche | 11/11 PASS | OK | `1e83c5d` |

## C. Details et preuves

### REG-004 - PostgreSQL E2E isole

La configuration distingue bien `DATABASE_URL` de `TEST_DATABASE_URL`; la seconde cible une base au nom explicite `techzone_test` sur le port 55432. Docker n'est pas installe. Le service PostgreSQL 18 existe, mais le cluster local dedie n'est pas demarre. `scripts/local-postgres.ps1 -Action start` echoue car le journal local est inaccessible; un demarrage direct avec un journal temporaire echoue ensuite avec `pg_ctl: could not create restricted token: error code 87` puis `could not start server: error code 3`. La connexion PostgreSQL a `techzone_test` retourne `ECONNREFUSED`.

Aucune migration, aucun `db push`, aucun reset et aucune ecriture de donnees n'ont ete executes. REG-004 reste a faire. Prerequis : corriger le demarrage du cluster Windows sous le compte qui l'administre, puis verifier `current_database() = techzone_test`, executer `prisma:test:validate`, `prisma:test:status`, les migrations non destructives et les E2E.

### REG-007 - Isolation Deployment

`backend/test/jest.setup.ts` est deja un garde fail-closed : il impose `TEST_DATABASE_URL` lorsqu'elle est distincte et cible une base dont le nom contient `test` ou `e2e`; en son absence, il remplace l'URL par un port impossible. Les tests `npm test -- --runInBand deployment` ont atteint uniquement `127.0.0.1:55432`, la cible de test configuree. Ils n'ont donc pas atteint `techzonecloud_local`.

Resultat : 6 suites et 35 tests sans dependance DB ont passe; 5 suites et 29 tests d'integration ont ete bloques par l'indisponibilite de PostgreSQL test. Ce resultat prouve l'orientation isolee mais pas l'execution reproductible complete exigee : REG-007 reste a faire jusqu'au passage des suites sur `techzone_test` operationnelle.

### REG-006 - Cockpit Deployment

`backend/src/modules/deployment/cockpit/cockpit.service.spec.ts` melangeait deux anciennes versions de tests, avec declarations et accolades orphelines. La suite a ete remplacee par un test unitaire isole qui controle les filtres tenant de dashboard, listes et contexte absent sans instancier Prisma reel.

Preuve : `npm test -- --runInBand src/modules/deployment/cockpit/cockpit.service.spec.ts` : 1 suite, 3 tests PASS. Le typecheck global n'est pas vert pour des erreurs hors perimetre (REG-008), mais cette erreur TS1128 a disparu et la suite compile dans Jest.

### REG-001 - Snapshots Pack Manager / UI Builder

`backend/src/modules/pack-manager/ui-snapshot.integration.spec.ts` fournit desormais l'ApplicationVersion et son application tenant, le lien application du pack, ainsi qu'un PackVersion publie avec snapshot et hash coherents. Les cas absence d'ApplicationVersion, autre tenant, autre application et hash de manifest altere sont verifies sans affaiblir les validations metier.

Preuves : 9/9 tests de la suite snapshot PASS; `npm run test:security:ui` : 10 suites, 146 tests PASS.

### REG-002 - Runtime publie

`frontend/src/components/pack-runtime/PublishedApplication.test.jsx` utilise maintenant une resolution explicite et un manifest effectif `EXECUTABLE`. Pendant l'alignement, l'inspection a confirme que Runtime V3 avait supprime les gardes existants de tenant, source pack/version, hash du manifest et structure UI. Ces gardes font partie de REG-002 et ont ete restaures dans `PublishedApplication.jsx` avec un comportement fail-closed.

Les controles verifies sont : resolution absente ou bloquee, tenant et pack/version incoherents, hash source different, UI malformee, schema non supporte, changement de tenant et rendu/naviguation d'une application publiee valide.

Preuves : 13/13 tests PublishedApplication PASS; 6 fichiers Runtime/Renderer, 37 tests PASS, 2 ignores parce qu'ils requierent PostgreSQL.

### REG-003 - UI Builder

`frontend/src/features/ui-builder/components/UiBuilderControls.test.jsx` cible exactement `Aucun resultat` au lieu de la regex ambigue `/Aucun/`.

Preuve : 1 suite, 11 tests PASS. Les avertissements React Router v7 n'etaient pas des echecs.

## D. E2E et simulations

Environnement attendu : PostgreSQL local isole `techzone_test` sur `127.0.0.1:55432`. Il reste indisponible pour la raison Windows documentee dans REG-004. Les E2E, les migrations de statut, les scenarios multi-tenant et les simulations SIM-01 a SIM-32 n'ont donc pas ete declares executes et doivent etre repris apres restauration de cette instance. Aucun resultat BLOCKED n'est presente comme PASS.

## E. Controle global et nouvelle anomalie

Le typecheck de specifications `npx tsc --noEmit -p backend/tsconfig.spec.json` echoue sur de nombreuses erreurs preexistantes hors des six corrections (notamment `backend/src/iam/iam.constants.ts`, `backend/src/iam/iam-throttle.service.ts` et des mocks de tests). Cette anomalie est enregistree comme REG-008, priorite P2, et n'a pas ete corrigee faute d'autorisation.

## F. Git

Branche : `mami`.

Commits locaux crees : `1500c82`, `c33e18d`, `173b179`, `1e83c5d`. Le commit IAM existant `c94186e` est preserve. Les dossiers non suivis preexistants `docs/audit/global/` et `docs/ui-ux/` sont preserves. Aucun push, aucune PR, aucun reset et aucun changement de branche n'ont ete effectues.

## G. Prochaines approbations ou actions requises

1. Restaurer le demarrage du cluster PostgreSQL test sous son compte Windows administrateur, puis autoriser/reprendre REG-004 et REG-007 pour migrations non destructives, E2E et simulations.
2. Autoriser le traitement de REG-008 si le typecheck complet des specifications doit devenir un gate de qualite.
