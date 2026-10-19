# Registre unique des taches

Etats autorises : `A faire` et `OK`. Une preuve manquante conserve la tache a faire.

| ID | Ordre | Priorite | Module | Responsable | Description du probleme | Tache a faire | Resultat attendu | Etat | Preuve / reference |
|---|---:|---|---|---|---|---|---|---|---|
| REG-001 | 2 | P1 | Pack Manager / UI Builder | Jasmina (Ranja collab.) | Les mocks snapshot ne fournissent plus ApplicationVersion/PackVersion apres le contrat #19. | Adapter les fixtures et rejouer la gate backend. | 146 tests securite backend verts. | OK | Commit `c33e18d`; 9 tests snapshot et 146 tests de securite PASS, 19/10. |
| REG-002 | 3 | P1 | Pack Runtime | Nassa | Les mocks PublishedApplication n'ont ni `resolutionId` ni manifest `EXECUTABLE`. | Adapter les mocks puis rejouer la gate frontend. | Runtime publie et gardes fail-closed verts. | OK | Commit `173b179`; 13 tests PublishedApplication et 37 Runtime/Renderer PASS (2 skips PostgreSQL), 19/10. |
| REG-004 | 1 | P1 | Prisma / E2E | Jasmina (Mami collab.) | PostgreSQL 127.0.0.1:55432 est inaccessible. | Fournir une base test/e2e isolee et rejouer migrations/E2E. | E2E multi-tenant executables. | A faire | Instance test non demarree : `pg_ctl` erreurs Windows 87/3; connexion `techzone_test` refusee, 19/10. |
| REG-006 | 4 | P1 | Deployment | Nassa | `cockpit.service.spec.ts:75` ne compile pas (TS1128) ; la readiness n'est pas certifiable. | Corriger la syntaxe de la suite et rejouer les tests sur DB isolee. | Test Cockpit unitaire vert; gate DB a reprendre. | OK | Commit `1500c82`; 3 tests Cockpit PASS, 19/10. |
| REG-007 | 5 | P1 | Deployment / test infra | Nassa (Jasmina collab.) | Les specs Deployment tentent la base locale hors runner E2E isole. | Isoler explicitement DATABASE_URL/fixtures pour les specs DB. | Aucun test n'atteint une base applicative. | A faire | Garde existant valide : les 29 echecs visent 127.0.0.1:55432 (test), mais DB indisponible; 35 tests passent, 19/10. |
| REG-003 | 6 | P2 | UI Builder | Ranja | `findByText(/Aucun/)` est ambigu. | Cibler l'etat vide de recherche. | Suite Vitest deterministe. | OK | Commit `1e83c5d`; 11 tests UI Builder PASS, 19/10. |
| REG-005 | 7 | P3 | Frontend | A attribuer | Bundle entree Vite 586.66 kB. | Mesurer et envisager le decoupage. | Budget performance documente. | A faire | `vite build`, audit 19/10. |
| IAM-001 | 0 | P3 | IAM | Mami | L'intervalle de purge du throttle retenait les processus de test. | Corrige et revalide. | Aucune handle ouverte IAM. | OK | Commit `c94186e`; 145 tests IAM avec `--detectOpenHandles`. |
| REG-008 | 8 | P2 | TypeScript / qualite | A attribuer | Le typecheck complet des specs echoue sur des erreurs preexistantes hors des six corrections autorisees. | Trier puis corriger les contrats et mocks TypeScript hors perimetre. | `tsc -p tsconfig.spec.json` sans erreur. | A faire | Echecs notamment `iam.constants.ts`, `iam-throttle.service.ts` et mocks de specs, 19/10. |
