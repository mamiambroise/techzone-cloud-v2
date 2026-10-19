# Validation finale — Deployment et E2E

Date : 16 octobre 2026. Branche : `mami`.

## Décision

La correction du faux succès Deployment est validée au niveau applicatif : un passage à `SUCCEEDED` est maintenant refusé sans preuve de readiness fraîche, liée au déploiement et vérifiée fail-closed. Le redémarrage local contrôlé et les contrôles techniques sont verts.

La qualification d’un déploiement réellement activé chez un fournisseur n’est pas prononcée. Il n’existe pas encore d’orchestrateur d’apply/activation ni d’E2E avec runtime externe.

## Correctifs vérifiés

- Readiness HTTP limitée aux origines autorisées et à `GET /health/ready`.
- Preuve exigée : deployment, release, environnement, tenant, trace, `activationId`, horodatages frais, runtime `READY`/`HEALTHY` et dépendances critiques `UP`.
- Rejet d’un HTTP 200 seul, d’une preuve synthétique, malformée, périmée, incohérente, indisponible ou en timeout.
- Verrou transactionnel PostgreSQL par tenant/environnement et transitions conditionnelles afin qu’une annulation/erreur concurrente ne soit jamais promue en succès.
- Conservation d’un environnement connu sain lors de l’échec du candidat.
- Cloisonnement tenant des diagnostics, cockpit, releases et rollbacks.

## Matrice de validation

| Module | Backend | Frontend | Sécurité | Intégration | E2E | Statut |
| --- | --- | --- | --- | --- | --- | --- |
| Prisma / cible de test | `prisma:test:validate` et `prisma:test:status` verts | Sans objet | Refus des cibles dangereuses | PostgreSQL `techzone_test`, 9 migrations à jour | Runner IAM isolé | Validé dans le périmètre test |
| IAM / contexte | Tests inclus dans 90 suites backend | Sans changement UI | Compte vivant, session, rôle, permission et tenant contrôlés | Nest + PostgreSQL de test | 16 scénarios IAM/cross-tenant/MFA | Validé dans le périmètre couvert |
| Deployment | Tests de readiness, gates, tenant et concurrence inclus dans la suite backend | Sans changement UI | Fail-closed, CAS, verrou transactionnel, tenant scoping | La sonde est simulée/testée ; aucune activation fournisseur | Aucune E2E runtime fournisseur | Corrigé applicativement ; activation non qualifiée |
| Business Manager | Tests inclus dans la suite backend | Sans changement UI | Mutations tenant/version bornées | Tests de services | Pas d’E2E navigateur/runtime | Validé dans le périmètre audité |
| Frontend | API non modifiée | Lint, build et Vitest verts | Sans changement de contrat | Build Vite réussi | Pas d’E2E UI navigateur | Validé techniquement, E2E UI absent |
| Runtime local | `/health` et `/ready` backend verts | `/` frontend vert | IAM anonyme retourne 401 attendu | Redémarrage contrôlé réussi | Sondes HTTP locales uniquement | Disponible localement |

## Résultats reproductibles

| Vérification | Résultat |
| --- | --- |
| `npx nest build` | Réussi |
| `npx oxlint` backend | 0 erreur, 132 avertissements |
| `npm test -- --runInBand --forceExit --silent` backend | 90 suites, 848 tests réussis |
| `npm run test:e2e -- --runInBand` | 2 suites, 16 tests réussis |
| `npm run lint` frontend | Réussi |
| `npx vite build` frontend | Réussi ; avertissement de taille de bundle uniquement |
| `npm test` frontend | 30 fichiers réussis, 3 ignorés ; 275 tests réussis, 8 ignorés |
| `npm run windows:restart` puis `windows:status` | Frontend 200, backend health/ready 200, IAM anonyme 401 |

## Limites et risques résiduels

- Pas d’orchestrateur ou de fournisseur qui applique réellement l’artefact ; aucune preuve que l’artefact est exécuté chez un tiers.
- La preuve runtime HTTP n’est pas signée/attestée et aucune qualification mTLS n’a été effectuée.
- Les gates `TESTS_PASS` et `SECURITY_CHECK` de STAGING/PRODUCTION restent bloquantes sans fournisseur de preuves immuables.
- Les E2E sont des E2E Nest/PostgreSQL pour IAM ; il n’y a ni E2E Deployment fournisseur ni automatisation navigateur.
- La base de test est isolée par garde-fous d’URL, mais n’est pas une base CI éphémère ; RLS PostgreSQL globale n’est pas démontrée.

## Traçabilité Git

Commits applicatifs locaux : `35d5adba`, `5465caa1`, `05f0c275`, `d7fe2b64`. Aucun push distant n’a été exécuté.
