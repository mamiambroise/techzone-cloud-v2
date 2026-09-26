# Reprise automatique de recette ? 26 septembre 2026

Serie : 17:48:58 a 17:53:48 UTC. Dix cycles, dix secondes entre la fin d'un cycle et le debut du suivant. Commandes existantes : `node scripts/postgresql-stability.cjs --cycles=10`, `node scripts/postgresql-stability.cjs --services`.

Resultats : TCP 0/10, handshake PostgreSQL SSLRequest 0/10, SQL connect 0/10. Chaque echec est NETWORK_TIMEOUT. SELECT 1 jamais atteint. Limites inchangees : 6 s TCP/protocole, 8 s connexion SQL. Les connexions TCP, protocole et SQL sont distinctes.

Les sondes des trois configurations IAM/auth_aim, Platform/business_manager et ERP/erp_adapter echouent avant toute requete SQL, apres respectivement 8005, 8011 et 8003 ms. SCHEMA_ACCESS = BLOCKED pour chacune ; ces mesures ne prouvent pas un schema absent.

```text
POSTGRES_STABILITY = FAIL
IAM_READY = BLOCKED
ERP_READY = BLOCKED
PLATFORM_READY = BLOCKED
FRONTEND_READY = BLOCKED
LOGIN = BLOCKED
COOKIE_AUTH = BLOCKED
AUTH_ME = BLOCKED
PROTECTED_ROUTE = BLOCKED
TENANT_CONTEXT = BLOCKED
ENTITLEMENTS = BLOCKED
APPLICATION_MANAGER = BLOCKED
BUSINESS_MANAGER = BLOCKED
PACK_MANAGER = BLOCKED
PACK_RUNTIME = BLOCKED
ERP_ADAPTER = BLOCKED
DATA_RUNTIME = BLOCKED
QUERY_ENGINE = BLOCKED
RULES_ENGINE = BLOCKED
WORKFLOW_ENGINE = BLOCKED
AUTOMATION = BLOCKED
UI_RUNTIME = BLOCKED
OBSERVABILITY = BLOCKED
E2E_STATUS = BLOCKED
LAST_REAL_PASS = aucun nouveau PASS ; dernier succes anterieur : login + cookies HttpOnly + /api/iam/me
FIRST_REAL_BLOCKER = POSTGRESQL_REMOTE / NETWORK_TIMEOUT
REAL_COMPONENTS = aucun revalide dans cette reprise
PARTIAL_COMPONENTS = non reevalues
MOCK_ONLY_COMPONENTS = non reevalues
NOT_IMPLEMENTED_COMPONENTS = non reevalues
```

BLOCKED signifie non revalide pendant cette reprise, arretee au prerequis PostgreSQL ; ce n'est pas une affirmation que tous les processus sont arretes. Le compte ACTIVE et ses succes ponctuels anterieurs restent des constats historiques, sans nouveau test de connexion applicative. Aucune conclusion nouvelle sur les memberships, droits ou moteurs aval.

Aucun code modifie, aucun service demarre ou redemarre, aucun compte recree, aucune permission changee, aucun DATABASE_URL/pool/timeout modifie, aucune migration. Seuls les fichiers de mesures et ce rapport ont ete ecrits. Pas de Phase 2.5.

[Preuves horodatees](postgresql-stability/automatic-resumption-20260926T174858Z.json).
