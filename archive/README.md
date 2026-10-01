# Sources historiques conservees lors de la fusion du 1 octobre 2026

L'application active reste dans `frontend/` et `backend/`. Ces archives ne font
pas partie du build et ne doivent pas etre executees ou deployees telles quelles.

## Branches externes et anciennes

`historical-sources/manifest.json` indique le commit source, le perimetre et les
fichiers exclus de chaque ZIP. Les quatre instantanes Business Manager couvrent
les pointes independantes `jasmina-bm/develop`, `Mami`, `main` et `Front-End`.
Les autres branches de ce depot sont des ancetres de ces pointes.

`erp-full.zip` conserve l'ancienne application `new erp-adapter-platform` de
`ERP-full`; `back-erp.zip` conserve la variante `taratra31/Back_ERP`.
Les fichiers de configuration contenant des identifiants non verifies et les
instructions locales d'agents sont exclus des ZIP et listes dans le manifeste.
Leurs versions originales restent consultables dans l'historique Git.

`early-circle` / `taratra31/main` ne font que supprimer des fichiers de skills
dans l'ancien dossier Auth_AIM, deja retire de l'application consolidee.
Cette suppression est donc deja satisfaite dans l'arbre courant.

La fusion des historiques anciens utilise la strategie `ours` apres cet
archivage explicite. Elle preserve les commits comme ancetres de `main`, sans
reactiver les anciennes applications. Elle ne constitue pas un report de toutes
leurs fonctionnalites dans l'application active.

`quick-rudbeckia-working-copy.zip` sauvegarde egalement le brouillon non commite
de cet autre worktree : patch des fichiers suivis et copie des fichiers non
suivis, avec le commit de base dans son README. Le worktree original est intact.

## Ancienne implementation Pack Manager / Runtime

`pre-consolidation/` conserve les services, controleurs, schema, tests et migration
de l'implementation precedente. La fusion initiale avait juxtapose deux modeles
incompatibles sur les memes tables SQL. Le code actif utilise les modeles `Pack*`
et `Runtime*`, les guards IAM et le Runtime Bridge de la consolidation du
30 septembre. Les modeles UI Builder sont conserves avec cette implementation.

L'ancienne migration `20260929120000_pack_manager_runtime` a ete archivee car elle
cree les memes tables que la migration canonique du 30 septembre avec un autre
schema. Aucune migration ni modification de base de donnees n'a ete executee
pendant cette resolution. Une base ayant applique l'ancienne migration necessite
une reconciliation specifique avant un futur deploiement.
