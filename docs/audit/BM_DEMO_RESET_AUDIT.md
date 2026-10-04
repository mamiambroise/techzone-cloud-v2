# Audit préalable — reset des données de démonstration BM

Date : 2026-10-04 (Asia/Baghdad)
Branche : `mami`
HEAD initial : `5fe6fd80699abac415ca97b8db34fafba4134726`

## Git

- La branche locale est `mami`, un commit devant `origin/mami`.
- `origin/mami` et `origin/Mami` pointent actuellement vers le même commit
  (`104890ac0ca52fc4e75797580faac8ce60168bdc`). La cible de publication reste
  strictement `origin/mami`.
- Le répertoire de travail contenait avant cette mission des modifications non
  commitées, notamment `bm-demo-spec.ts`, `bm-demo-seed.ts`, `seed-bm.ts` et
  des changements BM/UI. Elles sont préservées.

## Inventaire en lecture seule de la base

La lecture Prisma du schéma `business_manager` a trouvé : 5 tenants, 19
applications, 19 versions, 73 entités BM, 371 champs, 68 relations, 56
fonctionnalités, 12 menus, 5 packs, 5 PackVersions, 2 PackSnapshots et 3
UiPages.

| Élément | Origine | Tenant | Utilisé par | Demo ? | Action |
|---|---|---|---|---|---|
| `techzone-it-solution` + 5 applications (sales, stock, CRM, WISP, fret) | `bm-demo-spec.ts` / `bm-demo-seed.ts` | tenant seed déterministe | BM | Oui, certain | REPLACE |
| `demo-horizon-sarl` + 5 applications (formation, scolaire, RH, projets, support) | `bm-demo-spec.ts` / `bm-demo-seed.ts` | tenant seed déterministe | BM | Oui, certain | REPLACE |
| `techzone-test` et applications `bm-recette-*`, `ui_app_*`, `uib_*` | recettes/test antérieurs | tenant de test | BM/UI Builder | Partiel | UNKNOWN — ne pas supprimer automatiquement |
| `consolidation-a-*`, `consolidation-b-*`, applications `qa_*` | recette de consolidation | tenants de test | BM | Partiel | UNKNOWN — ne pas supprimer automatiquement |
| Packs, PackVersions, PackSnapshots existants | pipeline Pack Manager | non corrélé de manière certaine aux deux tenants seed | Pack Runtime | Inconnu | KEEP |
| IAM, utilisateurs, memberships, permissions plateforme | plateforme | multi-tenant | IAM | Non établi | KEEP |
| `features/iam-demo`, stores Integration/Deployment mock | code DEV/legacy hors périmètre BM | n/a | autres modules | Oui/partiel | KEEP, documenté hors périmètre |

## Chaîne et schéma

| Chaîne | État observé | Décision |
|---|---|---|
| BM | Réel pour définitions, seed déterministe existant | FIX / REPLACE |
| UI Builder | `UiPage` présent, mais le seed actuel ne crée pas de projet/pages pour les applications seed | MISSING |
| Pack Manager | modèles Pack/PackVersion/Snapshot/Manifest présents, données non rattachées avec certitude | PARTIAL |
| Pack Runtime | modèles et code présents ; pas de preuve de recette des seeds existants | PARTIAL |
| Data Runtime métier | modèles BM décrivent le métier, mais aucune table métier générée par le seed | MISSING |

Contraintes confirmées : `Application` est unique par `[tenantId, code]`,
`ApplicationVersion` par `[applicationId, version]`; les relations BM portent
`applicationVersionId` et `tenantId`; PackVersion référence une
ApplicationVersion et PackSnapshot est unique par PackVersion. Toute purge
doit donc cibler exclusivement les UUID déterministes et ces dépendances.

## Plan de nettoyage approuvé par l’audit

1. Remplacer le seed historique par une fonction de nettoyage explicite,
   transactionnelle, déterministe et uniquement ciblée sur les deux tenants
   historiques et leurs UUID de seed.
2. Ne lancer ce nettoyage que via une commande dédiée, jamais implicitement au
   démarrage ni via `prisma migrate reset`.
3. Supprimer les dépendances dans l’ordre réel (runtime/pack/UI si et seulement
   si elles portent les IDs du seed, puis définition BM, version, application,
   tenant), conserver tout élément non corrélé.
4. Réexécuter la commande et vérifier un second passage à zéro suppression.
5. Créer les deux nouveaux tenants et leurs définitions via un seed idempotent.

## Anomalies à corriger avant recette

- Le seed en cours construit dix applications historiques au lieu des deux
  applications demandées.
- Il crée un compte IAM et affiche potentiellement un mot de passe généré dans
  les logs : cela doit être retiré du seed de démonstration.
- Le seed réécrit une définition READY en purgeant ses éléments, ce qui entre
  en conflit avec l’exigence d’immuabilité.
- Aucun mécanisme audité ne matérialise les données métier dynamiques demandées
  (clients, ventes, stock) dans des tables runtime dédiées.

## Vérifications non destructives

- `backend: npx nest build` — PASS.
- `frontend: npx vite build` — PASS (seul avertissement : chunk principal
  supérieur à 500 kB).
- Tests BM ciblés — PASS : 3 suites / 19 tests
  (`business-definition-copy`, `features`, `navigation`).

## Décision de sécurité

Le nettoyage, la reconstruction et la publication sont **bloqués à ce stade** :
le mécanisme disponible ne peut pas satisfaire la recette demandée sans soit
réécrire des versions déjà READY, soit créer un utilisateur IAM, soit inventer
une persistance métier qui n’existe pas dans le backend. Aucun de ces
contournements n’est acceptable. Aucun nettoyage, seed, commit, push ou PR
n’a donc été exécuté pendant cet audit.
