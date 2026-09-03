# Carte de migration des routes

Les routes canoniques sont définies dans `Frontend/src/lib/navigationConfig.js` et pilotent la sidebar, le breadcrumb et `AppShell`. Les anciennes valeurs `currentView` subsistent uniquement comme compatibilité transitoire pour les ouvertures internes d’application.

| Domaine | Racine | Routes contrôlées |
|---|---|---:|
| BM | `/business-manager` | 9/9 |
| PM | `/pack-manager` | 10/10 |
| PR | `/pack-runtime` | 8/8 |

Corrections notables : `/pack-manager/features` utilise la vue PM ; `/pack-manager/validation` et `/pack-manager/publication` ouvrent le bon onglet du workspace PM ; `/pack-runtime/effective-manifest` ouvre le mode manifest et non l’overview.

Les paramètres métier viennent du contexte API/JWT. Aucun paramètre de route n’est persisté comme donnée métier locale.
