# Baseline Prisma d’une base existante — Phase 4

## Preuves de sécurité

- Dump hors Git créé avec PostgreSQL 18.1 : archive custom valide, 723131
  octets, 1090 entrées, vérifiée par `pg_restore --list`.
- Clone créé : `techzonecloud_baseline_phase4`.
- Le dump du schéma `business_manager` a été restauré dans ce clone avec succès.
- La base source `techzonecloud_local` est **UNCHANGED**.

## Migrations historiques retrouvées

| Migration | Statut | Source |
|---|---|---|
| `20260929120000_pack_manager_runtime` | ORIGINAL retrouvé | commit `99203301917e709002c12c121e225415646f4695`, 373 lignes |
| `20261003120000_cdc15_subscription_billing` | ORIGINAL retrouvé sous nom non standard | commit `4d20657ec2ecb4728717b71144f898a10e13f921`, `subscription_billing.sql`, 401 lignes |

Les deux fichiers doivent être restaurés/revus comme migrations historiques
avant toute baseline. Aucun SQL n’a été rejoué sur le clone à ce stade.

## Stratégie retenue

Ne pas marquer les 22 migrations historiques comme appliquées. La base a été
provisionnée hors Prisma et certaines migrations historiques ne correspondent
plus textuellement aux tables Prisma mappées. La baseline sûre est une nouvelle
migration *baseline* générée depuis le clone introspecté, adoptée sur le clone
seulement, puis suivie des migrations réellement nouvelles (`business_records`).

Avant cela, il faut comparer sur le clone tables, colonnes, types, nullability,
PK, FK et indexes, et préserver les migrations originales retrouvées. L’état
actuel est donc : **CLONE RESTORED; BASELINE NOT YET APPLIED; ORIGINAL UNCHANGED**.
