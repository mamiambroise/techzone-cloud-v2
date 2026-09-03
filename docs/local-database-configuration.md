# Configuration locale de la base

## Source de vérité vérifiée

| Composant | Host | Port | Database | User | Source config |
|---|---|---:|---|---|---|
| TypeORM BM | `127.0.0.1` | 5433 | `business_manager` | `postgres` | `Backend/.env` via `src/config/data-source.ts` |
| Prisma PM/PR | `127.0.0.1` | 5433 | `business_manager` | `postgres` | `Backend/.env` via `DATABASE_URL` |

Le mot de passe n'est pas requis par l'instance locale : `pg_hba.conf` utilise `trust` pour localhost. Aucun mot de passe réel n'est documenté ici.

## Instance PostgreSQL

- PostgreSQL 18 natif Windows
- Service : `postgresql-x64-18`
- Data directory : `C:/Users/lenovo/AppData/Local/business-manager-postgres-18`
- Port dédié : `5433`
- Base vérifiée : `business_manager`
- Rôle vérifié : `postgres`
- `5432` correspond à une autre instance et n'est pas utilisé par ce projet.

## Backend

- `PORT=3002`
- Swagger : `http://localhost:3002/api/docs`
- Les paramètres sont externalisés dans `Backend/.env`, ignoré par git.
- Aucune base, table ou donnée n'a été supprimée ou réinitialisée.

## Validation réalisée

- Connexion SQL : `current_database=postgres`, `current_user=postgres`, PostgreSQL 18.1 sur 5433
- `prisma migrate status` : schéma à jour, 1 migration détectée
- NestJS : démarrage complet, TypeORM et Prisma initialisés
- Root HTTP et Swagger : `200`
- `npm run test:chain` : 6/6 contrôles passés
- `npm test -- --runInBand` : 28/28 tests passés
