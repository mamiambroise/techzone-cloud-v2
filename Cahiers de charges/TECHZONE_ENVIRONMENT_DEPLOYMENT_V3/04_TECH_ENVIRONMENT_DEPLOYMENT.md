# TECH — ENVIRONMENT & DEPLOYMENT MANAGER

**Stack :** NestJS + Prisma/PostgreSQL + React/Vite

---

# 1. Priorité technique

P0 :

```text
permissions
tenant scope
cross-tenant protection
server-owned audit fields
```

---

# 2. Fichiers connus à inspecter

```text
backend/src/modules/deployment/
backend/src/modules/environment/
backend/src/iam/
backend/prisma/schema.prisma
backend/src/common/providers/mock-integration.provider.ts
frontend/src/
```

Ne pas créer de doublons avant recherche réelle.

---

# 3. Principal IAM

Injecter/récupérer un principal serveur :

```ts
type Principal = {
  identityId: string
  userId?: string
  tenantId: string
  permissions: string[]
  sessionId?: string
}
```

Les services Deployment reçoivent le tenant effectif côté serveur.

---

# 4. Controller Pattern

Concept :

```ts
@RequirePermission('deployment.read')
@Get(':id')
getOne(@Principal() principal, @Param('id') id: string) {
  return service.getOne(principal.tenantId, id)
}
```

Adapter aux decorators existants.

---

# 5. Service Pattern

Interdit :

```ts
prisma.deployment.findUnique({ where: { id } })
```

si `id` seul ne garantit pas le Tenant.

Cible :

```ts
prisma.deployment.findFirst({
  where: {
    id,
    tenantId
  }
})
```

---

# 6. Lists

Toujours :

```ts
where: {
  tenantId
}
```

avant autres filtres.

---

# 7. Writes

Update/Delete :

- tenant filter ;
- existence check ;
- permission ;
- state transition validation.

---

# 8. Audit Fields

Ne pas accepter depuis DTO :

```text
createdBy
requestedBy
approvedBy
bypassedBy
executedBy
rolledBackBy
```

Utiliser principal.

---

# 9. Environment Model

Vérifier :

- tenantId ;
- applicationId ;
- indexes ;
- unique `[tenantId,key]` si pertinent ;
- secret refs ;
- status ;
- policy.

---

# 10. Deployment Model

Vérifier :

- tenantId ;
- environmentId ;
- packVersionId ;
- previousDeploymentId ;
- runtimeContextId ;
- status ;
- timestamps ;
- actor refs ;
- indexes.

---

# 11. Referential Integrity

Vérifier :

```text
Deployment.tenantId == Environment.tenantId
Deployment.tenantId == Pack/Publication tenant
Deployment.applicationId == target application
```

Ne pas se fier au frontend.

---

# 12. Preflight Service

Créer/réutiliser un service :

```text
validateTenant
validateEnvironment
validatePermission
validatePublishedPack
validateManifest
validateRuntimeCompatibility
validateCapabilities
validateDataRequirements
validateIntegrationRequirements
validateConfiguration
```

Retour structuré.

---

# 13. Runtime Contract

Définir/réutiliser interface stable :

```ts
prepareDeployment(...)
validateDeployment(...)
activatePack(...)
getActivationStatus(...)
rollbackTo(...)
```

Deployment n’accède pas aux détails internes Runtime.

---

# 14. State Machine

Centraliser transitions valides.

Exemple :

```text
DRAFT -> VALIDATING
VALIDATING -> READY | FAILED
READY -> DEPLOYING
DEPLOYING -> ACTIVATING | FAILED
ACTIVATING -> VERIFYING | FAILED
VERIFYING -> SUCCEEDED | FAILED
FAILED -> retry/rollback depending policy
```

---

# 15. Optimistic Concurrency / Locking

Pour éviter Deployments concurrents :

options à évaluer :
- DB advisory lock ;
- unique active constraint ;
- transaction + select for update ;
- distributed lock si nécessaire.

Choisir selon architecture réelle.

---

# 16. Idempotency

Pour execute/retry/rollback :

- idempotency key ;
- request fingerprint ;
- existing operation lookup ;
- deterministic response.

---

# 17. Timeout

Chaque attempt :

```text
startedAt
timeoutAt
completedAt
```

Worker/service doit pouvoir marquer timeout.

---

# 18. Retry

Créer nouvelle `DeploymentAttempt` ou structure existante.

Ne pas écraser l’historique.

---

# 19. Rollback

Référence une release précédente.

Ne modifie jamais PackVersion.

---

# 20. Diagnostics Contract

```ts
type DeploymentDiagnostic = {
  stage: string
  code: string
  severity: 'INFO'|'WARNING'|'ERROR'
  message: string
  resource?: string
  timestamp: string
  correlationId: string
}
```

`details` doit être sanitized.

---

# 21. Secrets

Utiliser :

```text
secretRef
credentialRef
configurationRef
```

Jamais valeur secrète frontend.

---

# 22. Mock Provider

En mode production :

```text
MockIntegrationProvider = disabled
```

Fail startup/config si un connecteur REAL pointe sur mock involontairement.

---

# 23. Pack Manager Integration

Résoudre uniquement PackVersion publiée.

Ne pas modifier Manifest.

---

# 24. Registry Integration

Récupérer disponibilité/capabilities réelles.

---

# 25. Data Integration

Valider requirements via Data contracts.

---

# 26. ERP Integration

Via Integration Hub.

Jamais direct Dolibarr.

---

# 27. Observability

Chaque Deployment porte :

```text
correlationId
traceId
deploymentId
tenantId
environmentId
```

Sans secrets.

---

# 28. Frontend API

Créer/reutiliser client stable.

Toutes les actions gèrent :
- 401 ;
- 403 ;
- 404 ;
- 409 concurrency ;
- 422 preflight ;
- 5xx.

---

# 29. Testing

Unit :
- transitions ;
- preflight ;
- permission ;
- tenant filters ;
- audit fields.

Integration :
- Prisma A/B ;
- Runtime bridge ;
- Pack publication.

E2E :
- full deployment.

---

# 30. CI

Ajouter tests backend Deployment et cross-tenant à CI.

---

# 31. Commit plan

```text
fix(deployment): enforce tenant-scoped access
fix(deployment): enforce IAM permissions
fix(deployment): derive audit actors from IAM principal
feat(deployment): harden pre-deployment checks
feat(deployment): integrate runtime activation and readiness
fix(deployment): secure retry and rollback
test(deployment): add cross-tenant security coverage
feat(deployment-ui): complete deployment workspace
```

---

# 32. Technical DoD

- aucune query non tenant-scoped ;
- permissions backend ;
- audit actors serveur ;
- status machine contrôlée ;
- Runtime réel ;
- cross-tenant tests verts ;
- no mock prod ;
- secrets sanitized ;
- CI verte.
