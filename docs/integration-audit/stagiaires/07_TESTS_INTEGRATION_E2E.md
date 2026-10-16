# Tests d’intégration et E2E

Exécutés le 16 octobre 2026 sur la cible Prisma de test explicitement isolée lorsque la suite utilise PostgreSQL.

| Commande / lot | Résultat final |
| --- | --- |
| `npm run prisma:test:validate` | Réussi : schéma Prisma valide sur la cible de test |
| `npm run prisma:test:status` | Réussi : 9 migrations, schéma à jour sur la cible de test |
| `npx nest build` | Réussi |
| Backend `npx oxlint` | Réussi : 0 erreur, 132 avertissements |
| Backend complet `npm test -- --runInBand --forceExit --silent` | 90 suites, 848 tests réussis |
| Backend E2E `npm run test:e2e -- --runInBand` | 2 suites, 16 tests réussis |
| Frontend `npm run lint` | Réussi (`tsc --noEmit`) |
| Frontend `npx vite build` | Réussi : 2 343 modules ; seul avertissement de bundle supérieur à 500 kB |
| Frontend `npm test` | 30 fichiers réussis, 3 ignorés ; 275 tests réussis, 8 ignorés |
| `git diff --check` | Aucune erreur d’espace ; avertissements LF/CRLF uniquement |

## Couverture E2E réellement obtenue

Les 16 scénarios E2E démarrent Nest avec PostgreSQL de test. Ils couvrent `GET /`, les frontières IAM inter-tenant (lecture, écriture et suppression), jetons/sessions révoqués, permissions, rôles et parcours MFA. Les scénarios de fixture nettoient leurs données.

Ils ne couvrent pas l’activation chez un fournisseur Deployment, la sonde d’un runtime externe ni un navigateur réel. Les contrôles frontend ci-dessus sont du lint, build et Vitest/happy-dom, pas des E2E UI.

## Observations

- La suite backend utilise encore `--forceExit` car des handles asynchrones restent ouverts après les assertions. Les résultats sont verts, mais l’identification de ces handles reste recommandée.
- Les premiers lancements de Vite/Vitest et du moteur Prisma ont rencontré `spawn EPERM` dans le sandbox ; les relances autorisées hors sandbox ont réussi. Ce n’est pas une erreur de code source ou de test.
