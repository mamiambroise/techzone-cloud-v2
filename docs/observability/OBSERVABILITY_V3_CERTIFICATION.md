# Observability V3 — Certification technique

Date : 2026-10-21  
Périmètre : branche `mami`, environnement PostgreSQL isolé `techzone_test`.

## Verdict

Les lots de persistance et RBAC sont **certifiés sur TEST**. Le module n’est
pas certifié pour un déploiement production et le statut global ne peut pas
être `DONE` tant que les parcours navigateur authentifiés et la validation
responsive demandés ne sont pas exécutés.

## Architecture livrée

- Provider durable : PostgreSQL, sélectionné par
  `OBSERVABILITY_TELEMETRY_PROVIDER=postgres`.
- Stockage : `observability_log` et `observability_metric`, indexés par tenant,
  temps et trace. Les traces sont des résumés de logs persistés, pas des spans
  distribués fictifs.
- Écriture : non bloquante pour les opérations métier. En cas d’indisponibilité,
  l’écriture est isolée et les lectures répondent `OBS_SOURCE_UNAVAILABLE` au
  lieu d’afficher des valeurs inventées.
- Rétention : logs/traces et métriques sont pris en charge par les politiques
  existantes. Une purge requiert `iam:admin`, `IamAdminGuard` et la confirmation
  littérale `PURGE`; elle n’a jamais été lancée hors test.

Pour une volumétrie élevée, PostgreSQL doit être dimensionné ou remplacé par un
provider spécialisé ; aucun tel provider n’est configuré dans ce dépôt.

## RBAC

Le seed IAM synchronise les treize permissions Observability, de façon
idempotente et non destructive.

| Rôle tenant | Attribution Observability |
|---|---|
| `tenant_user` | overview et metrics en lecture |
| `application_manager` | lecture opérationnelle : logs, traces, alertes, incidents, diagnostics |
| `tenant_admin` | gestion alertes/incidents, audit, sécurité, paramètres et export redigé |
| administrateur plateforme | toutes permissions, via `iam:admin` |

Les rôles tenant ne reçoivent jamais `iam:admin`. Les exports sont cloisonnés
par tenant, redigés et journalisés comme `OBSERVABILITY_EXPORT`.

## Preuves exécutées

| Vérification | Résultat |
|---|---|
| `npx prisma validate` / `npx prisma generate` | PASS |
| Migration et statut Prisma sur `techzone_test` | PASS, 15 migrations |
| `npm run test:integration:observability` | PASS : écriture/lecture, pagination, tenant, reconnexion, nettoyage |
| `npm run test:integration:observability-rbac` | PASS : permissions, rôles et idempotence sur `techzone_test` |
| Tests unitaires Observability | PASS : 5 suites, 15 tests |
| Tests IAM/RBAC ciblés | PASS : 2 suites, 26 tests |
| Build Vite | PASS |

## E2E, responsive et maquettes

Edge est installé et un harness navigateur existe pour un autre module, mais
aucun harness Observability authentifié, fixture utilisateur/tenant dédiée ni
captures M01–M46 n’existent. Aucun test E2E ou responsive Observability n’est
donc revendiqué. Les maquettes M01–M46 ne sont pas certifiées par navigateur.

## Prérequis de production

1. Valider la capacité PostgreSQL ou fournir un provider spécialisé.
2. Configurer `OBSERVABILITY_TELEMETRY_PROVIDER=postgres` et les paramètres
   SMTP/scheduler souhaités dans le gestionnaire de secrets.
3. Appliquer les migrations approuvées, puis exécuter le seed IAM/RBAC.
4. Exécuter les E2E navigateur authentifiés aux quatre résolutions demandées.
5. Activer les purges uniquement après validation de sauvegarde et procédure de
   changement approuvée.

## Déploiement et rollback

Déploiement : appliquer les migrations Prisma approuvées, déployer backend puis
frontend, exécuter le seed RBAC idempotent, et surveiller les erreurs provider.

Rollback : désactiver le provider (`OBSERVABILITY_TELEMETRY_PROVIDER=disabled`)
pour arrêter les nouvelles écritures sans toucher aux données ; restaurer le
build précédent si nécessaire. Les migrations créent uniquement des tables et
index ; leur suppression en production exige une procédure de migration
distincte et approuvée, jamais un reset de base.
