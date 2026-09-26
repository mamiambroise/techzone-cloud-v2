# Matrice avant migration

| Fonction | Implémentations | Canonique / destination | Code unique / décision |
|---|---|---|---|
| Auth, IAM, users, identities, roles, policies, sessions | Auth_AIM Express + ERP Nest IAM + frontends IAM/ERP/root | backend/apps/iam ; frontend auth + pages/iam | Conserver les guards consommateurs ERP/platform. Auth Express reste autorité. Les contrats ERP account divergents sont UNKNOWN, pas fusionnés aveuglément. |
| Tenants | Auth_AIM backend, frontend IAM mock, frontend root live | backend/apps/iam ; frontend/pages/iam | Préserver les variantes de démonstration sous frontend/src/features/iam-demo. |
| Subscriptions, billing, entitlements, quotas | Auth_AIM backend + ancien frontend mock | backend/apps/iam ; frontend/features/iam-demo | Écrans conservés, PLACEHOLDER en production, démos explicites en développement. Pas de faux branchement API. |
| ERP registry, adapter | ERP backend et frontend ; pages déjà copiées root | backend/apps/erp ; frontend/pages | Migrer Adapters, Mapping, Settings absents ; conserver modulesConfig canonique. |
| Data runtime, query | ERP backend/frontend, copie frontend root | backend/apps/erp ; frontend/pages/DataRuntime* | Canonique root utilise apiClient et erreurs explicites. |
| Rules, formula, workflow, automation | ERP backend/frontend, copie root | backend/apps/erp ; frontend/pages/Automation* | Garder moteurs et tests intacts ; pas de nouvel écran Formula/Action. |
| Application manager, Business manager | backend + team4 ; frontend + team4 | backend (platform) ; frontend/components | Comparaison fichier par fichier ; les différences root ajoutent IAM, API live et erreurs. Aucun nouveau module BM. |
| Pack manager, pack/runtime UI | plateforme existante | backend (platform), frontend/components | Garder uniquement l'existant, aucune construction BM-CDC-09. |
| Observability, logs, audit, security events, monitoring, alerts | IAM backend ; frontend IAM mock et root live | backend/apps/iam ; frontend/pages/iam/observability | Root live canonique ; préserver maquettes avec badge démonstration, jamais fallback après erreur API. |
| Platform administration, integrations, publication, deployment | backend/team4 ; frontend/team4 | backend (platform), frontend/components | Même arbre de modules ; garder version protégée IAM. |
| Dolibarr PHP | techzone/ | techzone/ ACTIVE dépendance externe | Application ERP réellement utilisée par le launcher. Ni doublon React ni backend Node concurrent ; ne pas supprimer données/configuration. |

## Frontières

Platform reste à backend/src (Nest 12 / Prisma 7). IAM va dans backend/apps/iam (Express / Prisma 6). ERP va dans backend/apps/erp (Nest 10 / Prisma 5). Chaque app garde package-lock, client Prisma, migrations, .env et port. Les processus ne sont pas fusionnés.

## Protection

HEAD initial eb4ffd1, branche main. Branche backup/pre-consolidation-20260926 pointe au HEAD initial. Le dossier voisin techcloud-pre-consolidation-20260926 contient les fichiers suivis/non suivis et tracked.patch ; les secrets ignorés restent en place ou suivent leur app sans être publiés. Aucun reset/migration SQL autorisé par cette consolidation.
