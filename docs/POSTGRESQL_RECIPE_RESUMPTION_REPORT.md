# POSTGRESQL - Reprise de recette

Serie du 26 septembre 2026 : 17:01:18 a 17:06:00 UTC (20:01:18 a 20:06:00 Asia/Baghdad).

Cible : 167.86.71.186:28417 / techzonecloud. Commande : `node scripts/postgresql-stability.cjs --cycles=10`. Dix secondes de pause apres chaque cycle ; sondes TCP et protocole limitees a 6 s, connexion SQL a 8 s. Aucun delai de service modifie.

Resultat : TCP 1/10 PASS ; handshake PostgreSQL 1/10 PASS ; SQL connection 0/10 PASS ; SELECT 1 non atteint sur les 10 cycles. Les timeouts persistent : arret obligatoire a l'etape 1.

Le handshake mesure une reponse PostgreSQL SSLRequest sur une connexion distincte, pas une authentification complete. La cause infrastructure precise reste non confirmee.

```text
POSTGRES_STABILITY = BLOCKED / NETWORK_TIMEOUT
IAM_DB = BLOCKED
PLATFORM_DB = BLOCKED
ERP_DB = BLOCKED
IAM_API = BLOCKED
ERP_API = BLOCKED
PLATFORM_API = BLOCKED
FRONTEND = BLOCKED
TEST_ACCOUNT = BLOCKED
LOGIN_REAL = BLOCKED
COOKIE_AUTH_REAL = BLOCKED
AUTH_ME_REAL = BLOCKED
TENANT_CONTEXT_REAL = BLOCKED
ENTITLEMENTS_REAL = BLOCKED
APPLICATION_REAL = BLOCKED
BUSINESS_MANAGER_REAL = BLOCKED
PACK_MANAGER_REAL = BLOCKED
PACK_RUNTIME_REAL = BLOCKED
ERP_DATA_REAL = BLOCKED
AUTOMATION_REAL = BLOCKED
UI_RUNTIME_REAL = BLOCKED
OBSERVABILITY_REAL = BLOCKED
E2E_STATUS = BLOCKED
LAST_REAL_PASS = TCP + PostgreSQL SSLRequest, cycle 1 (aucune etape applicative validee)
NEXT_BLOCKER = SQL_CONNECT : NETWORK_TIMEOUT sur 10/10 cycles
```

BLOCKED signifie ici non execute ou non revalide dans cette reprise, en raison du verrou de stabilite. Cela ne signifie pas que chaque service est arrete ou que les schemas sont absents. Aucun test separe des trois schemas, demarrage de service, provisionnement de compte ou test applicatif n'a ete lance apres echec du prerequis. Aucun mock compte comme PASS.

| Cycle | Debut UTC | TCP ms | Handshake ms | SQL ms | SELECT 1 |
|---|---|---|---|---|---|
| 1 | 2026-09-26T17:01:18.604Z | PASS 387 | PASS 3501 | FAIL 8001 | Non atteint |
| 2 | 2026-09-26T17:01:40.502Z | FAIL 6001 | FAIL 6003 | FAIL 8003 | Non atteint |
| 3 | 2026-09-26T17:02:10.516Z | FAIL 6014 | FAIL 6005 | FAIL 8014 | Non atteint |
| 4 | 2026-09-26T17:02:40.556Z | FAIL 6004 | FAIL 6014 | FAIL 8009 | Non atteint |
| 5 | 2026-09-26T17:03:10.585Z | FAIL 6004 | FAIL 6013 | FAIL 8008 | Non atteint |
| 6 | 2026-09-26T17:03:40.614Z | FAIL 6016 | FAIL 6010 | FAIL 8003 | Non atteint |
| 7 | 2026-09-26T17:04:10.644Z | FAIL 6014 | FAIL 6005 | FAIL 8006 | Non atteint |
| 8 | 2026-09-26T17:04:40.686Z | FAIL 6002 | FAIL 6010 | FAIL 8011 | Non atteint |
| 9 | 2026-09-26T17:05:10.723Z | FAIL 6012 | FAIL 6005 | FAIL 8014 | Non atteint |
| 10 | 2026-09-26T17:05:40.767Z | FAIL 6011 | FAIL 6003 | FAIL 8004 | Non atteint |

Toutes les cellules FAIL correspondent a NETWORK_TIMEOUT.

Preuves detaillees : [serie JSON](postgresql-stability/recipe-resumption-20260926T170118Z.json).

Seul le script existant a ete etendu avec --cycles et un archivage des anciennes mesures. Aucun DATABASE_URL, reglage Prisma, migration, compte ou donnee modifie. Aucun secret affiche. Les limites fonctionnelles connues ne sont pas reconstruites ni retestees ; elles restent hors de cette reprise arretee. Pas de Phase 2.5.

## Retest apres confirmation TCP utilisateur

Le 26 septembre 2026, 17:19:41 a 17:24:28 UTC : dix nouveaux cycles. Le test PowerShell fourni par l'utilisateur montre TcpTestSucceeded=True. Dans cette nouvelle serie, TCP direct 0/10, SSLRequest 1/10, SQL_CONNECT 1/10. Les sondes utilisent des connexions distinctes successives : un timeout TCP peut donc etre suivi d'un succes SQL dans le meme cycle.

Cycle 1 : connexion SQL 2755 ms ; SELECT 1 trois fois (392, 417, 425 ms), SELECT version() et presence de 50 tables auth_aim reussis. Cycles 2 a 10 : NETWORK_TIMEOUT sur TCP, protocole et SQL.

POSTGRES_STABILITY = DATABASE_TEMPORARILY_AVAILABLE / BLOCKED
IAM_DB = PARTIAL (succes ponctuel uniquement)
E2E_STATUS = BLOCKED
LAST_REAL_PASS = SQL direct + SELECT 1 + presence auth_aim au cycle 1
NEXT_BLOCKER = NETWORK_TIMEOUT persistant
ROOT_CAUSE = NOT_CONFIRMED

Les autres champs restent BLOCKED, non revalides. Aucun service demarre, aucune mutation ni configuration modifiee. Le succes utilisateur ne permet pas d'attribuer la cause au serveur ou a l'environnement des outils. Pour comparer les deux chemins, le meme script de dix cycles peut etre execute dans la session PowerShell utilisateur ; sa sortie ne contient pas de credentials.

Preuves : [nouvelle serie](postgresql-stability/recipe-retest-20260926T171941Z.json).
