# Matrice CDC — Prisma et fondation tenant

Périmètre : schéma Prisma, isolation de la cible de test et contrôles de cloisonnement employés par IAM, Deployment et Business Manager.

| Exigence CDC | État | Preuve finale |
| --- | --- | --- |
| Cible de test distincte | Conforme avec garde-fous | Les wrappers Prisma et Jest exigent `TEST_DATABASE_URL`, refusent une URL non explicitement `test`/`e2e` ou identique à la cible applicative dans l’exécution normale. Sans cible de test, Jest pointe vers une URL inerte. |
| Exception E2E contrôlée | Conforme | Le runner IAM vérifie la cible avant le lancement puis passe temporairement `DATABASE_URL=TEST_DATABASE_URL` uniquement au sous-processus marqué `TECHZONE_E2E_ISOLATED_RUNNER=1`. Toute autre égalité reste bloquée. |
| Schéma de test valide | Conforme | `npm run prisma:test:validate` a réussi le 16 octobre 2026 ; `npm run prisma:test:status` confirme neuf migrations et un schéma à jour sur la base de test. |
| Tenant requis aux frontières sensibles | Conforme dans le périmètre audité | IAM, Deployment et les mutations Business Manager utilisent le tenant du principal et filtrent les lectures/écritures concernées. |
| Hiérarchie tenant / organisation / site | Conforme dans IAM | La création d’adhésion contrôle les appartenances et dérive l’organisation depuis le site lorsque nécessaire. |
| Mutabilité des versions métier | Conforme dans le périmètre audité | Les mutations de contrats, manifestes, bindings, modèles, navigation et fonctionnalités exigent une version éditable. |
| RLS PostgreSQL exhaustive | Non démontré | L’isolation prouvée ici est applicative (Prisma/IAM) ; aucune politique RLS globale n’a été ajoutée ni qualifiée. |

## Limites de la preuve

- Le statut Prisma démontre le schéma et les migrations de la base de test, pas une base CI éphémère ou vide.
- Les fixtures IAM E2E sont nettoyées par leurs tests ; cela ne remplace pas une stratégie de base éphémère en CI.
- `TEST_DATABASE_URL` ne doit jamais viser une base de développement ou de production.
