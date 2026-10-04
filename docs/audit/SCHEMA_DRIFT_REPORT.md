# Prisma / PostgreSQL — audit de dérive (phase 3)

## Faits établis

- Base : `techzonecloud_local`, PostgreSQL à `127.0.0.1:55432`, schéma
  `business_manager`; Prisma utilise `backend/prisma/schema.prisma`.
- 22 dossiers de migration sont découverts par Prisma.
- `_prisma_migrations` n’existe ni dans `business_manager` ni dans `public`.
  Il y a donc **zéro historique Prisma** à réconcilier, pas 22 lignes absentes.
- Les tables du domaine existent dans `business_manager`, notamment toutes les
  tables BM (`bm_*`), UI Builder, Pack Manager/Runtime et les modèles IAM.
- Deux dossiers inclus dans le statut n’ont pas de `migration.sql` :
  `20260929120000_pack_manager_runtime` et
  `20261003120000_cdc15_subscription_billing`.
- `pg_dump` n’est pas disponible dans l’environnement courant; aucune
  sauvegarde vérifiable n’a donc été créée.

## Matrice migrations

| Migration | Fichier SQL | Historique DB | Objets principaux observés | Classe | Action |
|---|---:|---:|---|---|---|
| 20260830041423_init | oui | non | tables IAM/billing présentes sous noms mappés | EQUIVALENT | ne pas resolve |
| 20260901135605_add_application_models | oui | non | `applications`, `application_versions` | EQUIVALENT | ne pas resolve |
| 20260901185432_add_platform_integration_deployment_models | oui | non | tables plateforme présentes | EQUIVALENT | ne pas resolve |
| 20260902073457 à 20260919000000 | oui | non | objets correspondants présents | EQUIVALENT | audit détaillé futur |
| 20260927000000 à 20260927010000 | oui | non | tables tenant-scopées présentes | EQUIVALENT | audit détaillé futur |
| 20260929000000_business_manager_core | oui | non | tables `bm_*` présentes | EQUIVALENT | ne pas resolve |
| 20260929120000_pack_manager_runtime | non | non | n/a | CONFLICT | restaurer le fichier source |
| 20260930000000 à 20261003150000 | oui | non | UI/Pack/billing majoritairement présents | EQUIVALENT | audit détaillé futur |
| 20261003120000_cdc15_subscription_billing | non | non | n/a | CONFLICT | restaurer le fichier source |
| 20261004000000_business_records | oui | non | absent (attendu) | MISSING | ne pas appliquer avant baseline sûre |

## Risque et décision

`prisma migrate resolve --applied` est sûr seulement lorsque l’historique existe
et que chaque migration est prouvée exacte. Ici, il créerait une histoire
artificielle pour une base sans baseline, et deux migrations sont
matériellement impossibles à vérifier. `migrate deploy` tenterait de rejouer
tout l’historique et peut échouer ou altérer une base existante.

**Décision : aucune mutation de `_prisma_migrations`, aucune migration appliquée,
aucune donnée supprimée.** La voie sûre est de restaurer les migrations sources
manquantes, créer un dump via un environnement disposant de `pg_dump`, puis
produire une baseline contrôlée (ou une base de validation clonée) avant toute
réconciliation. `business_records` reste non appliquée et la recette réelle
Data Runtime demeure bloquée.
