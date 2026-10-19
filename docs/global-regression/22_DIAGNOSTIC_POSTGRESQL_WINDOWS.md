# Diagnostic PostgreSQL Windows - 2026-10-19

## Conclusion

Le blocage de REG-004 provenait d'une recuperation PostgreSQL locale interrompue avant que le cluster E2E ne devienne disponible. La preuve observee dans le journal est l'arret du processus de demarrage par `0xC000013A` (`STATUS_CONTROL_C_EXIT`). Il ne s'agit pas d'une corruption de cluster, d'un conflit de port, d'une mauvaise configuration `postgresql.conf` ou d'une ACL NTFS insuffisante demontres par les controles realises.

Le cluster E2E a ete retabli sans reinitialisation ni modification de configuration. Il accepte maintenant les connexions sur `127.0.0.1:55432` et la requete de controle retourne `current_database() = techzone_test`.

## Perimetre verifie

| Element | Observation | Resultat |
|---|---|---|
| Version | PostgreSQL 18.1 (`C:\Program Files\PostgreSQL\18\bin`) | Identifiee |
| Service Windows installe | `postgresql-x64-18`, compte `NT AUTHORITY\NetworkService` | Actif, mais utilise son propre cluster sur 5432 |
| Service Windows / E2E | Le service ne pilote pas le cluster E2E | Separation confirmee |
| Cluster E2E | `%LOCALAPPDATA%\TechzoneLocalPostgres\data` | PostgreSQL 18, controle par `pg_controldata` sans signe de corruption |
| Configuration E2E | `listen_addresses = '127.0.0.1'`, `port = 55432` | Conforme a une cible locale isolee |
| `pg_hba.conf` | Loopback IPv4/IPv6 et local en SCRAM | Conforme; aucun changement |
| ACL NTFS | Acces presents pour SYSTEM, Administrators et le compte utilisateur local | Aucun changement |
| Port 55432 | Aucun listener avant restauration, listener apres demarrage | Pas de conflit observe |
| URLs de base | `TEST_DATABASE_URL` distinct de `DATABASE_URL`; la cible test est `techzone_test` | Isolation confirmee sans afficher les secrets |
| Docker | Indisponible | Non utilise |

## Chronologie et cause racine

1. Le service Windows PostgreSQL actif sur le port 5432 a ete exclu : il n'est pas la base E2E et ne doit pas etre utilise comme remplacement.
2. Aucun processus n'ecoutait initialement sur le port 55432. Les journaux du cluster E2E montraient le demarrage et la recuperation, qui peuvent durer environ deux minutes.
3. Une tentative historique a ete arretee pendant cette recuperation : le processus enfant de demarrage a quitte avec `0xC000013A` environ 25 secondes apres son lancement. PostgreSQL n'avait donc pas encore emis son message de readiness.
4. `pg_ctl` a aussi remonte les erreurs Windows 87 (`could not create restricted token`) et 3 (`could not start server`). Ces erreurs proviennent du lanceur/statut Windows; elles n'apparaissent pas comme une erreur de configuration dans le journal PostgreSQL.
5. Une fois le binaire `postgres.exe` existant lance sur le meme repertoire de donnees et la recuperation laissee a son terme, le journal a confirme `database system is ready to accept connections`.

La cause racine retenue est donc une interruption prematuree du processus de demarrage/recovery, probablement liee au lanceur ou a la session Windows, et non une modification a appliquer au cluster. Le code 87/3 reste un symptome a surveiller, pas une cause racine prouvee.

## Fiabilite des outils Windows

`scripts/local-postgres.ps1` utilise `pg_ctl status` avant `pg_ctl ... start`. Dans cette session, ce statut a retourne le code 3 meme lorsqu'un processus PostgreSQL pouvait etre verifie par connexion. Il ne doit donc pas etre utilise seul comme sonde de disponibilite.

Les sondes retenues sont :

1. `pg_isready -h 127.0.0.1 -p 55432` ;
2. une connexion avec `TEST_DATABASE_URL` et `SELECT current_database()` ;
3. `npm run prisma:test:status` execute hors sandbox lorsque le moteur Prisma ne peut pas creer son processus enfant dans le sandbox.

Ces trois controles ont reussi apres restauration. L'erreur `spawn EPERM` rencontree dans le sandbox est une restriction d'execution du sandbox pour `schema-engine-windows.exe`, et non une erreur Prisma ou PostgreSQL : le meme statut a reussi hors sandbox et a confirme les 11 migrations.

## Actions realisees

| Action | Resultat | Impact donnees |
|---|---|---|
| Lecture des services, processus, version, fichiers de configuration, HBA, ACL, journaux et scripts | PASS | Lecture seule |
| Verification `pg_controldata` | PASS | Lecture seule |
| Demarrage du binaire PostgreSQL existant sur le cluster E2E | PASS apres recuperation | Aucun reset ni recreation |
| `pg_isready` et `SELECT current_database()` | PASS : `techzone_test` | Lecture seule |
| `prisma:test:validate`, `prisma:test:migrate`, `prisma:test:status` | PASS | Deux migrations non destructives appliquees apres inspection; aucune suppression ni `db push` |

Ni le service Windows sur 5432, ni `postgresql.conf`, ni `pg_hba.conf`, ni les permissions NTFS n'ont ete modifies. Aucune base applicative ni `techzonecloud_local` n'a ete utilisee.

## Actions non realisees et recommandations

- Aucun cluster n'a ete recree, initialise ou reinitialise.
- Aucun service Windows n'a ete modifie. Le service existant sur 5432 ne doit pas etre detourne vers le cluster E2E sans accord explicite.
- Aucun droit global Windows n'a ete accorde.
- En cas de nouvelle recuperation longue, laisser le processus atteindre la readiness et attendre au moins 300 secondes avant de conclure a un echec. Verifier ensuite les trois sondes ci-dessus, plutot que `pg_ctl status` seul.
- Une installation durable sous forme de service ou de tache planifiee distincte modifierait la configuration Windows et necessiterait un choix explicite de l'utilisateur. Aucune action administrateur n'est requise pour l'etat actuellement retabli.

## Statut

REG-004 est `OK` : la base E2E isolee est disponible, son nom est confirme et les E2E ont ete rejoues. Les details des suites sont dans `23_RESULTATS_E2E_APRES_RESTAURATION.md`.
