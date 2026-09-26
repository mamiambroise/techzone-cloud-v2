# Correction des accès IAM — 26 septembre 2026

Résultat partiel : le compte manquant a été créé et son authentification réelle a réussi. L'ensemble de l'application ne fonctionne pas encore durablement : l'accès PostgreSQL reste intermittent.

## Changements réalisés

- Création de `techzonetest` par `identity.service.registerUser`, puis activation par `identity.service.setUserStatus`. Aucun utilisateur existant modifié, aucun rôle administrateur attribué, aucune insertion SQL directe. Identifiants conservés exclusivement dans le fichier privé utilisateur hors dépôt ; aucun secret reproduit ici.
- Les erreurs Prisma de connexion, de pool et de configuration sont distinguées par des réponses HTTP 503. Les erreurs internes ne renvoient plus de stack ou de requête SQL au navigateur et le middleware journalise uniquement le code, le type et le trace ID.
- Ajout de `/ready`, qui exécute réellement `SELECT 1`. `/health` reste un contrôle du processus HTTP.
- IAM reste joignable après un échec SQL au démarrage pour signaler son indisponibilité. Les requêtes Prisma peuvent retenter la connexion ; aucune réussite ni stabilité n'est simulée.
- Ajout de `scripts/iam-live-login.cjs` pour tester le véritable compte sans afficher cookies, tokens, hash ou mot de passe.

## Vérifications

Sept tests automatisés réussissent : cookies, contrat HTTP d'authentification, classification des erreurs, absence de fuite dans le middleware et disponibilité SQL. Ces tests utilisent des doubles explicites et ne constituent pas une recette E2E réelle.

Test réel avant redémarrage : login HTTP 200 en 11345 ms, deux cookies HttpOnly, `/api/iam/me` HTTP 200. Cela confirme la validité du compte et de son mot de passe à cet instant.

Test navigateur ultérieur : login en erreur durant une nouvelle coupure SQL, pas de validation de ProtectedRoute. Cette erreur a révélé un cas Prisma sans errorCode, désormais couvert par un test et classé 503.

Dernier test réel à 17:45:40 UTC : `/health` 200, `/ready` 503 DATABASE_UNAVAILABLE, login 503 DATABASE_UNAVAILABLE, aucun détail technique exposé. [Preuves](postgresql-stability/iam-correction-live.json).

IAM écoute sur 5001, frontend sur 3000. Les démarrages ERP 3002 et Platform 3003 ont échoué au contrôle PostgreSQL ; ces API ne sont pas opérationnelles. Aucun DATABASE_URL, pool ou délai de connexion modifié. Aucune migration ou suppression de données.

## État final

```text
TEST_ACCOUNT = ACTIVE
LOGIN_REAL = REAL_PASS ponctuel ; dernier test BLOCKED
COOKIE_AUTH_REAL = REAL_PASS ponctuel
AUTH_ME_REAL = REAL_PASS ponctuel
PROTECTED_ROUTE = BLOCKED
TENANT_CONTEXT_REAL = BLOCKED / non validé
IAM_API = PARTIAL, HTTP joignable, SQL indisponible au dernier test
ERP_API = BLOCKED
PLATFORM_API = BLOCKED
FRONTEND = HTTP disponible, parcours authentifié non validé
E2E_STATUS = BLOCKED
LAST_REAL_PASS = login + cookies HttpOnly + /api/iam/me
NEXT_BLOCKER = disponibilité PostgreSQL persistante
```

Les étapes tenant, entitlements, applications, Business Manager, Pack Manager, ERP/Data, automation et observability n'ont pas été validées. Aucun droit tenant arbitraire ajouté pour contourner leur contrôle d'accès. Pas de Phase 2.5.
