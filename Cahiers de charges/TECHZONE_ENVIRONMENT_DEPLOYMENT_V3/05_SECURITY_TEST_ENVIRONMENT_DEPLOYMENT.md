# SECURITY TEST — ENVIRONMENT & DEPLOYMENT MANAGER

**Priorité :** P0

---

# 1. Anonymous

## SEC-DEP-001
Appeler liste environments sans auth.

Attendu : 401.

## SEC-DEP-002
Execute deployment sans auth.

Attendu : 401.

---

# 2. Permissions

## SEC-DEP-010
Utilisateur sans `deployment.read`.

Attendu : 403.

## SEC-DEP-011
Utilisateur avec read mais sans execute.

POST execute.

Attendu : 403.

## SEC-DEP-012
Utilisateur sans rollback.

Attendu : 403.

---

# 3. Tenant Isolation

## SEC-DEP-020
Tenant A liste Deployments.

Attendu :
- uniquement A.

## SEC-DEP-021
Tenant A GET Deployment B par ID.

Attendu :
- 403/404 contrôlé ;
- aucune donnée B.

## SEC-DEP-022
Tenant A PATCH Environment B.

Attendu : refus.

## SEC-DEP-023
Tenant A execute Deployment B.

Attendu : refus.

## SEC-DEP-024
Tenant A diagnostics B.

Attendu : refus.

## SEC-DEP-025
Tenant A rollback B.

Attendu : refus.

## SEC-DEP-026
Forged environmentId B lors create Deployment.

Attendu : refus.

## SEC-DEP-027
Forged packVersionId B.

Attendu : refus.

---

# 4. Audit Field Forgery

## SEC-DEP-030
Client envoie :

```json
{
  "approvedBy": "platform-admin",
  "createdBy": "other-user",
  "bypassedBy": "security-admin"
}
```

Attendu :
- champs ignorés/rejetés ;
- principal serveur utilisé.

---

# 5. Pack Publication

## SEC-DEP-040
Pack non publié.

Attendu :
- ERROR ;
- pas d’activation.

## SEC-DEP-041
Manifest invalid.

Attendu : blocage.

---

# 6. Environment Security

## SEC-DEP-050
Environment DISABLED.

Execute deployment.

Attendu : refus.

## SEC-DEP-051
Environment not READY.

Attendu : blocage selon policy.

---

# 7. Capability

## SEC-DEP-060
Capability enregistrée mais provider indisponible.

Attendu :
- ne satisfait pas requirement.

---

# 8. Secrets

## SEC-DEP-070
Inspect responses.

Attendu :
- pas de secretRef resolved value.

## SEC-DEP-071
Inspect logs.

Attendu :
- aucun credential.

## SEC-DEP-072
Inspect diagnostics.

Attendu :
- aucun secret.

---

# 9. Runtime Status Forgery

## SEC-DEP-080
Tenter de marquer Deployment `SUCCEEDED` via frontend/API non autorisée.

Attendu :
- impossible.

`SUCCEEDED` uniquement après Runtime readiness.

---

# 10. Replay / Idempotency

## SEC-DEP-090
Envoyer deux fois execute même idempotency key.

Attendu :
- une activation logique.

## SEC-DEP-091
Double rollback.

Attendu :
- pas deux rollbacks concurrentiels.

---

# 11. Concurrency

## SEC-DEP-100
Deux deployments concurrents même Environment/Application.

Attendu :
- sérialisation/refus contrôlé.

---

# 12. Retry

## SEC-DEP-110
Retry d’un Deployment d’un autre Tenant.

Attendu : refus.

## SEC-DEP-111
Retry conserve historique échec.

Attendu : oui.

---

# 13. Rollback

## SEC-DEP-120
Rollback vers Release incompatible.

Attendu : blocage.

## SEC-DEP-121
Rollback vers Pack non publié.

Attendu : blocage.

---

# 14. Diagnostics Exposure

## SEC-DEP-130
Utilisateur read sans diagnostics permission.

Attendu : 403.

---

# 15. Mock Provider

## SEC-DEP-140
Mode production + MockIntegrationProvider.

Attendu :
- startup/configuration failure ou provider indisponible explicite ;
- jamais fallback silencieux.

---

# 16. Cross-Tenant DB Test

Si RLS active sur tables Deployment/Environment :

- Tenant A direct DB context ne voit pas B ;
- insert forged tenant B refusé ;
- update B refusé.

---

# 17. E2E Security

```text
LOGIN Tenant A
↓
GET Environment A
↓
CREATE Deployment A
↓
PRECHECK
↓
EXECUTE
↓
RUNTIME ACTIVATE
↓
SUCCEEDED

Puis :
GET Deployment B
↓
DENY
```

---

# 18. CI Blocking

Bloquants :

```text
SEC-DEP-010..027
SEC-DEP-030
SEC-DEP-040..041
SEC-DEP-070..072
SEC-DEP-080
SEC-DEP-090
SEC-DEP-100
SEC-DEP-120
SEC-DEP-140
```

---

# 19. Security DoD

- aucune lecture cross-tenant ;
- aucune mutation cross-tenant ;
- rollback sécurisé ;
- audit actors serveur ;
- secrets protégés ;
- permissions partout ;
- mock interdit en REAL ;
- suite P0 verte.
