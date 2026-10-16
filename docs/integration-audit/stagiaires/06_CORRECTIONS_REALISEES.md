# Corrections réalisées

## Sécurité et IAM — `5465caa1`

- Vérification fail-closed de l’état utilisateur à la connexion, au refresh et dans le garde JWT.
- Révocation transactionnelle des sessions et refresh tokens lorsqu’un compte devient inactif.
- Autorisations relues depuis la persistance pour que les révocations soient visibles immédiatement.
- Validation de l’adhésion et de la hiérarchie tenant/organisation/site ; persistance du contexte lors d’un changement de tenant.

## Environment et Deployment — `d7fe2b64`

- Permissions, tenant et acteur serveur imposés aux opérations de deployment, environnement, gates, release, rollback, cockpit et diagnostics.
- Listes, détails, timeline, agrégats et mutations bornés au tenant ; les accès cross-tenant sont refusés.
- Remplacement du succès synthétique par une readiness fail-closed, contrôlée par origine, liée à l’exécution et enregistrée dans l’historique.
- Création concurrente sérialisée par verrou transactionnel PostgreSQL ; transitions protégées par CAS et promotion d’environnement atomique.
- Un échec ou une annulation ne peut pas écraser un déploiement terminal ou l’état d’un environnement déjà sain.

## Business Manager — `05f0c275`

- Permissions de contrats restaurées et mutations bornées au tenant et à une version éditable.
- Vérifications appliquées aux copies, runtime bridge, modèles, features, navigation et contrôles qualité.
- Cohérence des index et computed fields renforcée côté modèle de données.

## Fiabilité des tests — `35d5adba`

- Jest et les commandes Prisma de test utilisent `TEST_DATABASE_URL` avec refus des cibles dangereuses.
- Le runner E2E passe explicitement et uniquement sa cible isolée au sous-processus Jest, avec un marqueur contrôlé.
- Tests de sécurité, frontières tenant, concurrence et readiness ajoutés.

## Limites inchangées

Il n’y a eu ni migration de schéma, ni suppression de données, ni push distant. L’activation réelle par fournisseur/runtime, une attestation signée de readiness et les preuves immuables STAGING/PRODUCTION restent à implémenter avant une qualification production complète.
