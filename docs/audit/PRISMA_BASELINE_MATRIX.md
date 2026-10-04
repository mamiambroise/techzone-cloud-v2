# Matrice baseline Prisma — clone phase 5

## Résultat

La comparaison de présence confirme que le clone restauré contient les domaines
attendus (IAM, applications, BM, UI Builder, Pack/Runtime et billing), tandis
que `_prisma_migrations` est absent. Les migrations historiques ne sont donc
pas une séquence Prisma à « rattraper » : elles sont des sources de provenance
pour une base provisionnée autrement.

| Groupe de migrations | SQL source | État clone | Classe | Action sûre |
|---|---|---|---|---|
| 20260830–20260927 (IAM/platform) | disponible | objets mappés présents | COMPATIBLE_DRIFT | conserver comme archive, ne pas resolve |
| 20260929000000 BM | disponible | tables `bm_*` présentes | COMPATIBLE_DRIFT | conserver comme archive, ne pas resolve |
| 20260929120000 Pack Runtime | original retrouvé dans `99203301` | tables Pack/Runtime présentes mais SQL historique antérieur au modèle actuel | PARTIAL | restaurer le fichier exact puis comparer hors production |
| 20260930000000–20261003150000 UI/Pack/billing | disponible sauf source CDC15 non normalisée | objets principaux présents | COMPATIBLE_DRIFT | ne pas resolve |
| 20261003120000 CDC15 | original retrouvé sous `subscription_billing.sql` dans `4d20657e` | tables billing présentes | PARTIAL | restaurer comme `migration.sql`, puis audit |
| 20261004000000 business_records | disponible, additive | table absente | MISSING | appliquer seulement après une baseline validée |

## NO-GO technique

Prisma n’offre pas de commande qui crée une baseline honnête dans un répertoire
où 22 migrations historiques restent présentes et non appliquées. Les seules
actions qui rendraient `migrate status` vert sont précisément interdites :
marquer les 22 migrations applied, ou les rejouer. Une nouvelle baseline exige
un **nouveau lineage de migrations** (archive explicite des anciennes sources,
nouvelle migration initiale issue du clone introspecté), validé dans un
worktree/repository séparé avant toute adoption. Cette décision change la
gouvernance de migration et ne doit pas être implicite.

Conséquence : `business_records` et la recette Data Runtime ne sont pas
appliqués au clone dans cette phase. Base originale : **UNCHANGED**. Clone :
**RESTORED, UNCHANGED AFTER RESTORE**.
