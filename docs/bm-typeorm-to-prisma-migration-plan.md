# Plan de migration BM TypeORM vers Prisma

PM et PR sont persistés avec Prisma ; BM demeure sur TypeORM. La coexistence est temporaire et séparée par agrégat : aucune table BM n’est écrite par deux ORM.

1. figer les contrats HTTP et ajouter des tests de caractérisation BM ;
2. modéliser les entités BM et contraintes tenant/version dans Prisma sans changer l’API ;
3. produire une migration de reprise idempotente, avec comptages et hashes de contrôle ;
4. faire lire Prisma en shadow mode et comparer les résultats TypeORM/Prisma ;
5. basculer les lectures, puis les écritures, agrégat par agrégat ;
6. retirer les repositories TypeORM uniquement après une fenêtre de stabilité et un plan de rollback vérifié.

Gates obligatoires : isolation tenant, invariants de cycle de vie, intégrité des snapshots/hashes, chaîne BM→PM→PR 6/6 et zéro divergence de comptage.
