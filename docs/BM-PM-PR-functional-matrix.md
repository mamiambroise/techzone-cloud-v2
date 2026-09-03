# Matrice fonctionnelle BM / PM / PR

Audit consolidé des 25 CDC (`BM` 00–08, `PM` 00–07, `PR` 00–07). `PARTIAL` signifie que le flux principal est connecté mais que des contrats secondaires documentés restent absents.

| CDC | Capacité | Backend/API | Frontend | Tests | Statut |
|---|---|---|---|---|---|
| BM-CDC-00 | socle, contrats, IAM | JWT serveur et gardes ; IAM fournisseur partiel | session honnête, aucun utilisateur simulé | unit + E2E API | PARTIAL |
| BM-CDC-01 | applications | CRUD/lifecycle principal | connecté ; clone explicite API_MISSING | E2E API/UI | PARTIAL |
| BM-CDC-02 | versions | create/validate/publish/rollback | cycle et confirmations connectés | chaîne | PARTIAL |
| BM-CDC-03 | Data Model | create/read/validate | éditeur partiel, mutations manquantes visibles | unit | PARTIAL |
| BM-CDC-04 | features/capabilities | create/read/association/validation | connecté, mutations secondaires partielles | unit/chaîne | PARTIAL |
| BM-CDC-05 | menus/navigation | menus/items/preview | connecté ; archive item manquante | E2E API | PARTIAL |
| BM-CDC-06 | configuration | définitions/valeurs/reset/validation | connecté ; archive définition manquante | E2E API | PARTIAL |
| BM-CDC-07 | contracts/runtime bridge | snapshot, readiness, composition PR | contracts connectés | unit/chaîne | FUNCTIONAL critique |
| BM-CDC-08 | quality | campagnes/rapport/gate/waivers | campagnes réelles ; catalogue API_MISSING | E2E API | PARTIAL |
| PM-CDC-00 | socle, sécurité, audit | Prisma/JWT/audit/outbox | contexte API | unit/E2E | PARTIAL |
| PM-CDC-01 | cockpit | dashboard/agrégats | overview distinct | UI/chaîne | FUNCTIONAL critique |
| PM-CDC-02 | packs | CRUD/archive/restore | connecté ; duplicate API_MISSING | E2E | PARTIAL |
| PM-CDC-03 | versions/manifest/publication | create/update/validate/manifest/publish | workspace et confirmation | E2E/chaîne | FUNCTIONAL critique |
| PM-CDC-04 | modules | create/list | mutations secondaires API_MISSING | chaîne | PARTIAL |
| PM-CDC-05 | features/capabilities | create/list/attach | vue PM dédiée | chaîne | PARTIAL |
| PM-CDC-06 | dépendances | create/list et gate publication | preview/CRUD API_MISSING | chaîne | PARTIAL |
| PM-CDC-07 | règles | create/list/évaluation sûre | simulation/CRUD API_MISSING | chaîne | PARTIAL |
| PR-CDC-00 | socle runtime | scope JWT, contrats, traces | cockpit distinct | unit/E2E | FUNCTIONAL critique |
| PR-CDC-01 | cockpit | dashboard/historique | connecté | UI | FUNCTIONAL |
| PR-CDC-02 | loader/resolver | manifest PM publié + hash | résolution connectée | chaîne | FUNCTIONAL |
| PR-CDC-03 | modules/features | états effectifs explicables | manifest lisible | chaîne | FUNCTIONAL critique |
| PR-CDC-04 | capabilities/dependencies | consolidation et blocage | détails manifest | chaîne | PARTIAL |
| PR-CDC-05 | rules/context | registre sûr, secrets retirés | contexte lisible | chaîne | FUNCTIONAL critique |
| PR-CDC-06 | effective manifest | hash/persistance/executable | route dédiée connectée | chaîne/UI | FUNCTIONAL |
| PR-CDC-07 | cache/diagnostics/resilience | L1 tenant-safe, intégrité, invalidation, singleflight, providers, re-resolve | vues cache/status/diagnostics | 4 unit + UI | FUNCTIONAL critique |

## Preuve du chemin critique

`npm run test:chain` valide **6/6** décisions : validation, manifest, publication, résolution, effective manifest et composition BM. Dernière exécution : résolution `6408b6b2-15b0-4012-951c-fad52542fe25`, effective manifest `f1a34b77-0b00-40a5-876e-d1cd4f9a8a54`, hash `sha256:5ce491e031d7e7ac881763753ab85a77d28056e7ae6c9462779e5e69f934da5e`.

Les statuts de pages (et non de CDC) sont détaillés dans `bm-pm-pr-page-compliance.md`.
