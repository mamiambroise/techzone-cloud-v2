# Diagnostic PostgreSQL — 25–26 septembre 2026

**Configuration présente ; instance distante joignable par intermittence. Diagnostic principal : TIMEOUT, et non CONFIG_MISSING.** Des connexions SQL et le démarrage des trois services ont réussi. D’autres connexions au même serveur expirent. Cela ne permet pas de conclure que PostgreSQL est arrêté.

**Retest du 26 septembre : les trois connexions SQL actives échouent en TIMEOUT ; les API ne terminent pas leur redémarrage.** Les succès SQL et les migrations décrits ci-dessous datent du 25 septembre. Le port IAM peut répondre au handshake TCP sans qu’une connexion SQL complète aboutisse.

## Configuration réellement chargée

Chemins relatifs à la racine. Aucune surcharge `DATABASE_URL` dans le processus de diagnostic. Aucun `.env` modifié.

| Service | Fichier chargé | DATABASE_URL | Hôte | Port | Base | Schéma | Prisma |
|---|---|---|---|---|---|---|---|
| Auth/IAM actif | `Auth_AIM/backend/.env` via `src/config/env.js`/dotenv | PRESENT | 167.86.71.186 | 28417 | techzonecloud | auth_aim | `Auth_AIM/backend/prisma/schema.prisma` |
| Platform actif | `backend/.env` via `--env-file` et `dotenv/config` | PRESENT | 167.86.71.186 | 28417 | techzonecloud | business_manager | `backend/prisma/schema.prisma` |
| ERP/Data/Automation actif | `new erp-adapter-platform/backend/.env` via `--env-file` et ConfigModule | PRESENT | 167.86.71.186 | 28417 | techzonecloud | erp_adapter | `new erp-adapter-platform/backend/prisma/schema.prisma` |
| Copie plateforme inactive | `team4-platform-api/backend/.env` | PRESENT | localhost | 5432 | techzonecloud | business_manager | `team4-platform-api/backend/prisma/schema.prisma` |

URL distante masquée : `postgresql://***:***@167.86.71.186:28417/techzonecloud?schema=<schema>`.

IAM et ERP déclarent `env("DATABASE_URL")` dans leur schéma. Platform utilise Prisma 7 : URL fournie par `src/prisma/prisma.service.ts` à `PrismaPg`, et par `prisma7.config.ts` pour la CLI. Ce nom de fichier requiert un `--config prisma7.config.ts` explicite pour les commandes Prisma concernées.

## Écoute et connexion SQL

- Port distant : tests TCP réussis et expirations selon les tentatives. `SELECT version()` confirme **PostgreSQL 16.15 Ubuntu**.
- IAM : connexion SQL confirmée, initialement 48 tables ; deux tables supplémentaires créées par les migrations existantes.
- Platform : connexion SQL confirmée, 26 tables ; aucune table de modèle manquante dans cette lecture. Toutes les colonnes/index n’ont pas été vérifiés.
- ERP : démarrage Prisma réussi, API en écoute sur 3002 ; sondes SQL indépendantes expirées. Inventaire complet du schéma non validé.
- Aucune preuve de `AUTHENTICATION_FAILED` ou `DATABASE_NOT_FOUND` pour les configurations actives.
- Copie inactive localhost : port ouvert, mais configuration d’authentification rejetée côté pilote (`client password must be a string`). Classification `AUTHENTICATION_CONFIG_INVALID`.

Le service Windows `postgresql-x64-18` est **Running**. Il ne correspond pas au PostgreSQL 16 distant configuré par les services actifs. Aucun démarrage local supplémentaire effectué.

## Docker/Compose

| Fichier | Instance déclarée | Port | Base par défaut |
|---|---|---|---|
| `backend/docker-compose.yml` | postgres:16, techzone-postgres | 5432:5432 | techzone_cloud |
| `team4-platform-api/backend/docker-compose.yml` | copie de la précédente | 5432:5432 | techzone_cloud |
| `new erp-adapter-platform/docker-compose.yml` | postgres:15-alpine, erp_postgres | 5432:5432 | erp_adapter_db |
| `new erp-adapter-platform/docker-compose.prod.yml` | postgres:15-alpine | 127.0.0.1:5432:5432 | erp_adapter_db |

Aucun fichier Compose ne définit le serveur distant sur 28417. Docker est absent du PATH. Aucune commande de gestion de cette instance distante n’est fournie ici. Les instances locales différentes n’ont pas été lancées et aucune nouvelle base n’a été créée.

## Migrations

Les migrations IAM `20260910112326_add_feature_catalog` et `20260911053236_add_webhook_event` ont été relues : uniquement `CREATE TABLE`/`CREATE INDEX`. Première tentative : erreur moteur Prisma. Seconde tentative après retour du service : **migrate deploy réussi**, les deux migrations appliquées.

Une sonde intermédiaire avait observé `WebhookEvent.finished_at` null pendant son application. La preuve de fin est le message CLI « All migrations have been successfully applied » dans `logs/consolidation-iam-migrations-retry.log`. `database-results.json` contient maintenant le retest du 26 septembre, qui échoue avant la lecture des migrations.

La migration ERP de tenant contient un backfill `tenantId = 'legacy'` et un remplacement de contrainte. Elle n’a pas été appliquée automatiquement : le rattachement des anciennes données exige une correspondance métier.

Pas de reset, DROP, nouvelle base, suppression de données, changement d’identifiants ou de `.env`.

Preuves : [sonde initiale](database-results-initial.json), [sonde suivante](database-results.json), [HTTP](health-results.json). Retest en lecture seule : `node scripts/consolidation-database.cjs`.
