# Data Runtime — persistance des records métier

## Audit et matrice

Les endpoints `/api/data-runtime/query` et `/api/data-runtime/execute` existent,
mais ne constituent pas une persistance BM : `DataRuntimeModule` enregistre en
mémoire trois descripteurs hardcodés (`Product`, `Client`, `Order`) et le seul
provider les délègue à l’ERP Adapter/Dolibarr. UI Builder les appelle donc via
un contrat réel, mais ce contrat ne peut pas exécuter une définition BM.

| Fonction | Existing | Partial | Missing | Réutilisable |
|---|---:|---:|---:|---:|
| Entity/field/schema resolution |  |  | oui | BM Prisma |
| Create/read/update/delete | ERP seulement | oui | BM records | moteurs/contrat |
| List/filter/sort/pagination | oui | oui (ERP liste en mémoire) | JSONB DB | QueryEngine |
| Relations/transactions |  | oui (contrat) | validation/persistence BM | contrat |
| Tenant isolation | oui (IAM/ERP) | oui | records BM | RuntimeContext |
| ApplicationVersion isolation |  |  | oui | BM Prisma |
| Permissions métier |  | oui (`data-runtime:execute`) | capability BM | IAM context |
| Validation/audit | schémas mémoire | oui | contraintes BM/audit persistant | AuditEvent |
| Pack/UI Builder integration | appels déjà présents | oui | résolution BM | UI bindings |

## Choix

Le MVP utilise une table générique `business_records` avec une colonne `JSONB`
et un index GIN, identifiée par tenant, application et code d’entité. Les
données appartiennent à l’**application**, pas à une ApplicationVersion : une
v2 ajoutant un champ ne fait pas disparaître les records v1. Chaque écriture
conserve la version du schéma qui l’a validée.

Approches rejetées : une table physique par entité impose des migrations DDL à
chaque modification BM; un modèle EAV rend filtrage et intégrité difficiles;
un hybride est prématuré. JSONB est cohérent avec Prisma/PostgreSQL, les
modèles BM versionnés et le besoin SaaS multi-tenant. Les index spécialisés
pourront être ajoutés ultérieurement sur les champs BM marqués `indexed`.

## Limites MVP explicites

- types BM pris en charge : TEXT/LONG_TEXT, INTEGER, DECIMAL, BOOLEAN, DATE,
  DATETIME, EMAIL, ENUM et RELATION;
- unicité est contrôlée tenant/application/entity; une contrainte SQL sur une
  clé JSON arbitraire est différée;
- opérations composites transactionnelles ne sont pas encore exposées;
- suppression est une archive logique; les records archivés ne sont pas listés.

## Implémentation et migration

Le provider `BmRecordsProvider` accepte la ressource
`bm:<applicationVersionId>:<entityCode>`. Il résout la version et l’entité avec
le tenant IAM, valide les données avec les champs BM, et écrit dans
`business_records`. Il n’accepte aucun tenant fourni par le client.

La migration `20261004000000_business_records` est fournie mais **non appliquée**
à la base locale : `prisma migrate status` indique que les 22 migrations du
repository ne sont pas enregistrées comme appliquées, alors que les tables
existent. Lancer `migrate deploy` rejouerait l’historique entier. Cette dérive
Prisma/PostgreSQL doit être réconciliée avant une recette PostgreSQL réelle.
