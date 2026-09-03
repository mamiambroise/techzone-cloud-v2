# Travail restant priorisé

## P1 — conformité fonctionnelle

- implémenter les 29 actions du backlog API, en priorité les CRUD Data Model et PM modules/features/dépendances/règles ;
- raccorder le catalogue des règles qualité BM ;
- terminer l’IAM contractuel (création, reset, sessions) hors logique BM/PM/PR ;
- migrer BM de TypeORM vers Prisma selon le plan dédié.

## P2 — qualité produit

- découper le bundle frontend par route (chunk principal ~831 kB minifié) ;
- ajouter des tests navigateur de création intégralement pilotés par l’UI pour chaque éditeur secondaire ;
- ajouter les références visuelles Playwright une fois la charte figée ;
- étendre les tests d’accessibilité clavier et lecteur d’écran.

## P3 — exploitation

- brancher les providers externes réels et leurs SLO ;
- exporter les métriques cache/résilience vers l’observabilité de production ;
- exécuter les migrations et tests de chaîne dans la CI sur une base éphémère.
