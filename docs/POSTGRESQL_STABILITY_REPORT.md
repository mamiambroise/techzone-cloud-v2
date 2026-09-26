# POSTGRESQL_STABILITY_REPORT

Mesures du 26 septembre 2026, 16:52:58–16:56:02 UTC. Mission arrêtée au blocage de stabilité ; aucune Phase 2.5 engagée.

```text
TCP = INTERMITTENT (2/5 connexions réussies)
SQL = INTERMITTENT (1/5 connexions réussies ; puis 0/3 par service)
STABILITY = DATABASE_TEMPORARILY_AVAILABLE ; NOT_STABLE_ENOUGH_FOR_RECIPE
ROOT_CAUSE = NOT_CONFIRMED
IAM_DB = PARTIAL : auth_aim accessible une fois, nouvelles connexions NETWORK_TIMEOUT
PLATFORM_DB = BLOCKED : NETWORK_TIMEOUT
ERP_DB = BLOCKED : NETWORK_TIMEOUT
IAM_API = PARTIAL : /health 200 sur 3 cycles, sans vérification SQL
ERP_API = BLOCKED : port 3002 sans listener
PLATFORM_API = BLOCKED : port 3003 sans listener
TEST_ACCOUNT = BLOCKED : validation/création différée jusqu'à stabilité IAM + DB
LOGIN_REAL = BLOCKED
AUTH_ME_REAL = BLOCKED
COOKIE_AUTH_REAL = BLOCKED
E2E_REAL = BLOCKED
LAST_SUCCESSFUL_STEP = SQL direct : SELECT 1 x3, SELECT version(), présence du schema auth_aim
BLOCKING_STEP = connexions PostgreSQL nouvelles non fiables, avant recette de login
P0_REMAINING = rétablir une connectivité distante durable ; valider les 3 services puis le compte et le login
P1_REMAINING = limites fonctionnelles connues et recette aval non exécutée
```

## Configuration et périmètre

Cible unique : `167.86.71.186:28417`, base `techzonecloud`. DATABASE_URL présente dans les trois fichiers `.env`. Aucun secret reproduit, aucune URL modifiée. Aucun PostgreSQL local/Docker démarré, aucune base créée, aucune migration appliquée, aucune donnée supprimée ou compte modifié pendant cette mission.

| Service | Fichier de configuration | Schéma | Prisma |
|---|---|---|---|
| IAM :5001 | `Auth_AIM/backend/.env`, chargé par dotenv depuis le répertoire du service | auth_aim | `Auth_AIM/backend/prisma/schema.prisma`, DATABASE_URL |
| Platform :3003 | `backend/.env`, import dotenv/config dans main | business_manager | `backend/prisma/schema.prisma`, URL transmise à PrismaPg dans PrismaService |
| ERP :3002 | `new erp-adapter-platform/backend/.env`, commande start:prod avec --env-file=.env | erp_adapter | `new erp-adapter-platform/backend/prisma/schema.prisma`, DATABASE_URL et datasourceUrl |

Les sondes lisent ces fichiers ; elles ne permettent pas d'inspecter rétroactivement l'environnement interne d'un processus déjà lancé.

## Réseau et SQL

Preuves : [tentatives réseau](postgresql-stability/network-attempts.json), [connexions par service](postgresql-stability/service-database-probes.json), [cycles API](postgresql-stability/api-health.json). Reproduction en lecture seule : `node scripts/postgresql-stability.cjs`, puis `node scripts/postgresql-stability.cjs --services`. Ces commandes remplacent leurs propres fichiers de mesures.

| Tentative UTC | TCP | Protocole PostgreSQL | SQL_CONNECT | SELECT 1 | SELECT version() |
|---|---|---|---|---|---|
| 16:52:58 | PASS 455 ms | PASS 542 ms | PASS 1889 ms | PASS 427 / 404 / 459 ms | PASS 400 ms |
| 16:53:16 | PASS 422 ms | TIMEOUT 6014 ms | TIMEOUT 8003 ms | Non atteint | Non atteint |
| 16:53:41 | TIMEOUT 6003 ms | TIMEOUT 6001 ms | TIMEOUT 8002 ms | Non atteint | Non atteint |
| 16:54:11 | TIMEOUT 6002 ms | TIMEOUT 6001 ms | TIMEOUT 8004 ms | Non atteint | Non atteint |
| 16:54:41 | TIMEOUT 6002 ms | TIMEOUT 6002 ms | TIMEOUT 8003 ms | Non atteint | Non atteint |

Les tentatives sont séparées de dix secondes après leur achèvement. TCP et protocole utilisent des sockets distinctes : leurs résultats décrivent des instants différents. POSTGRES_HANDSHAKE désigne ici la réponse SSLRequest PostgreSQL ; l'authentification complète est mesurée par SQL_CONNECT. Limites des sondes : TCP/protocole 6 s, connexion SQL 8 s, requête SQL 6 s ; ce ne sont pas des modifications des services.

La première connexion retourne PostgreSQL 16.15 et 50 tables dans auth_aim. Trois SELECT 1 espacés d'une seconde passent. Cela établit une disponibilité temporaire et une authentification SQL valide à cet instant, pas une stabilité suffisante.

Puis les connexions séparées IAM, Platform, ERP échouent respectivement après 8014, 8012 et 8014 ms, avant toute requête de schéma. Les schémas Platform/ERP ne sont donc pas validés par cette série.

Catégorie observée : NETWORK_TIMEOUT. CONFIG_MISSING et un arrêt permanent de PostgreSQL ne décrivent pas les mesures. Aucune erreur AUTH_ERROR, CONNECTION_POOL, SCHEMA_ERROR ou MIGRATION_ERROR observée ; les timeouts empêchent toutefois d'exclure des problèmes ultérieurs. La cause précise distante (serveur, filtrage, chemin réseau, limites d'admission) reste indéterminée sans télémétrie serveur/réseau corrélée aux timestamps. Un timeout TCP ne justifie pas de modifier un mot de passe ou un pool Prisma.

## Connexions et réglages

| Service | Configuration inspectée | Retry / reconnexion | BEFORE / AFTER |
|---|---|---|---|
| IAM, Prisma 6 | Pas de connection_limit, pool_timeout ou connect_timeout explicite dans la configuration inspectée ; pas d'idle timeout applicatif explicite | $connect au démarrage ; sortie en cas d'échec ; pas de boucle de reconnexion applicative | Inchangé |
| Platform, Prisma 7 + PrismaPg | Pool pg installé : max 10, idleTimeoutMillis 10000, connectionTimeoutMillis non défini explicitement | $connect puis SELECT 1 ; arrêt du démarrage en cas d'échec ; pas de retry applicatif | Inchangé |
| ERP, Prisma 5 | datasourceUrl ; taille et délais non surchargés explicitement | 8 tentatives au démarrage, pause 3000 ms ; échec final propagé | Inchangé |

Les valeurs effectives des moteurs Prisma IAM/ERP ne sont pas déduites de celles de pg. La reconnexion des trois applications après coupure n'est pas validée : les nouvelles connexions de contrôle échouent. La série ne démontre pas un épuisement de pool.

Au premier succès, pg_stat_activity rapporte 1 connexion active et 1 idle dans cette base, sonde comprise ; max_connections vaut 100. C'est un instantané, soumis aux droits de visibilité, pas une mesure globale historique. Côté Windows, après les échecs : une connexion Established appartenant à IAM et une SynSent de sonde ; seuls IAM et le frontend écoutent sur leurs ports canoniques.

Changement antérieur à cette mission conservé et signalé : timeout de transaction d'inscription IAM de 5000 à 15000 ms, après erreur P2028 constatée à 5415 ms. Il concerne une transaction d'inscription, pas la connexion réseau ; son efficacité sur l'inscription n'est pas validée. Aucun nouveau changement de délai ou de pool ici.

## API, compte et recette

Trois cycles locaux espacés de trois secondes : IAM /health 200 (60, 13, 11 ms), ERP et Platform ECONNREFUSED. Le /health IAM est statique : aucune conclusion sur SQL ou le login. ERP et Platform ne sont pas relancés en boucle alors que la condition préalable de stabilité DB échoue.

Constat antérieur, non revalidé pendant cette série : le compte de seed précédemment proposé était absent lors de la lecture SQL, expliquant son rejet ; cela ne prouve pas que tout le seed n'a jamais été appliqué. La tentative officielle d'inscription suivante avait échoué par expiration de transaction. Aucune nouvelle inscription, activation, modification de hash ou attribution de permissions ici. L'état actuel du compte, les liens d'identité et les credentials restent à vérifier une fois la stabilité acquise. Aucun identifiant de test utilisable n'est affirmé.

| Étape E2E réelle | Résultat de cette mission | Limite |
|---|---|---|
| Login | BLOCKED | Prérequis PostgreSQL stable non satisfait |
| HttpOnly Cookie | BLOCKED | Pas de login réel réussi |
| /auth/me (route IAM /api/iam/me) | BLOCKED | Pas de session réelle |
| Tenant Context | BLOCKED | Dépend du login |
| Entitlements | BLOCKED | Dépend du contexte |
| Application | BLOCKED | Parcours authentifié non démarré |
| Business Manager existant | BLOCKED | Recette aval non exécutée |
| Pack Manager existant | BLOCKED | Moteur déjà non établi |
| ERP/Data | BLOCKED | API arrêtée, connexion DB en timeout |
| Automation/Workflow | BLOCKED | Des moteurs mock/no-op connus empêchent une validation générale réelle |
| UI Runtime | BLOCKED | Frontend disponible, mais parcours authentifié non validé |
| Audit/Observability | BLOCKED | Observability réelle déjà incomplète |

Limites P1 connues, non reconstruites : CRUD IAM manquants, MFA frontend incomplet, observability réelle incomplète, moteurs Pack Manager/Pack Runtime non établis, certains moteurs Automation mock/no-op, Dolibarr MySQL indisponible. Elles demeurent des limites même après résolution du réseau. Aucun résultat simulé n'est compté REAL_PASS.

Suite nécessaire hors de cette mission arrêtée : vérifier sur l'hôte distant et le chemin réseau les connexions entrantes et journaux aux heures indiquées, puis répéter les sondes avant de relancer les services et la recette. Le présent rapport ne revendique ni correction de l'infrastructure distante, ni réussite E2E.
