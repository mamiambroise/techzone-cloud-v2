# Revue des trois vues d’ensemble BM / PM / PR

## Décision

Les trois pages ont désormais une mission distincte et une source backend unique. Elles ne sont plus trois dashboards génériques.

| Domaine | Question utilisateur | Verbes directeurs | Données visibles | Action principale | À ne pas afficher |
|---|---|---|---|---|---|
| Business Manager | La définition métier est-elle prête ? | DEFINE · CONFIGURE · VALIDATE | applications, versions, modèles, features, menus, configurations, intégrations | ouvrir/créer une application | santé du resolver ou pipeline de publication PM |
| Pack Manager | Le pack est-il constructible et publiable ? | BUILD · VALIDATE · PUBLISH | pack/version, modules, features, capabilities, dépendances, règles, validation, manifest | poursuivre la construction/validation | métriques métier BM ou diagnostics Runtime |
| Pack Runtime | Qu’est-ce qui sera réellement exécuté ? | RESOLVE · EXECUTE · DIAGNOSE | contexte, résolutions, effective manifest, providers, cache, résilience, diagnostics | résoudre ou réexaminer une résolution | édition de définition BM/PM |

## Changements appliqués

- `OverviewView` calcule la préparation BM depuis les collections API et présente le cycle de vie BM.
- `PackOverviewView` expose la composition de la version sélectionnée et les décisions validation/manifest.
- `RuntimeCockpitView` est décliné par route : contexte, resolver, manifest effectif, status, cache et diagnostics.
- les libellés techniques, UUID complets et JSON sont placés dans des détails repliables ; les décisions métier restent lisibles en premier niveau.
- les compteurs décoratifs et les règles simulées ont été supprimés.

## Résultat

La séparation des responsabilités est vérifiée par Playwright sur les routes d’entrée des trois domaines et sur les vues PR critiques.
