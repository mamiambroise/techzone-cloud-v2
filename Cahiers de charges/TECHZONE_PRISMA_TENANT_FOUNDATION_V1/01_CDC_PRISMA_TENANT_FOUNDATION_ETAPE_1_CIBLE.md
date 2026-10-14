# CAHIER DES CHARGES — TECHZONE CLOUD PRISMA / TENANT FOUNDATION
## Étape 1 — Cible fonctionnelle et architecturale

**Projet :** Techzone Cloud  
**Module :** Prisma / Tenant Foundation  
**Version cible :** 1.0  
**Statut :** Spécification cible  
**Principe :** fournir un socle PostgreSQL/Prisma cohérent, migrable et multi-tenant, utilisé par tous les modules Techzone Cloud.

---

# 1. Objet

Prisma / Tenant Foundation répond à quatre questions :

```text
QUEL EST LE SCHÉMA CANONIQUE ?
→ Prisma Schema + PostgreSQL Schema

COMMENT LE FAIRE ÉVOLUER ?
→ Migrations contrôlées

COMMENT ISOLER LES TENANTS ?
→ Application Scope + Service Filters + RLS

COMMENT PROUVER QUE C'EST SÛR ?
→ Tests DB + Cross-Tenant + Migration Preflight
```

---

# 2. Responsabilités

Le socle possède ou coordonne :

- `schema.prisma` canonique ;
- datasource PostgreSQL ;
- Prisma Client ;
- PrismaService ;
- conventions `tenantId` ;
- migrations actives ;
- baseline ;
- index et contraintes ;
- foreign keys ;
- transactions ;
- isolation tenant ;
- stratégie PostgreSQL RLS ;
- rôles DB ;
- preflight de migration ;
- stratégie fresh DB / upgrade DB ;
- diagnostics DB ;
- tests de non-régression tenant.

Il ne possède pas la logique métier des modules.

---

# 3. Architecture cible

```text
TECHZONE CLOUD MODULES
        ↓
IAM / EFFECTIVE TENANT CONTEXT
        ↓
NESTJS SERVICES
        ↓
TENANT-SCOPED PRISMA ACCESS
        ↓
PRISMA CLIENT
        ↓
POSTGRESQL
        ↓
RLS / CONSTRAINTS / FK / INDEXES
```

Isolation en profondeur :

```text
IAM / CONTEXT
+
CONTROLLER / GUARD
+
SERVICE TENANT FILTER
+
DATABASE RLS
+
DATABASE CONSTRAINTS
```

Aucune couche ne remplace les autres.

---

# 4. Schéma PostgreSQL canonique

Le projet doit utiliser un schéma PostgreSQL explicitement défini.

La configuration doit être cohérente entre :

- `DATABASE_URL` ;
- Prisma datasource ;
- PrismaService ;
- baseline migration ;
- migrations suivantes ;
- environnements DEV / TEST / STAGING / PROD.

Il est interdit que la baseline crée les objets dans un schéma tandis que le runtime Prisma en cible silencieusement un autre.

---

# 5. Convention tenantId

Pour toute ressource tenant-scoped :

```text
tenantId
```

doit avoir :

- un type unique et documenté ;
- idéalement UUID si le Tenant canonique est UUID ;
- FK vers Tenant quand applicable ;
- index ;
- contraintes cohérentes ;
- même type dans Prisma et SQL.

Interdit :

```text
Tenant.id UUID
ERPRegistry.tenantId VARCHAR
IamSession.tenantId TEXT
```

si ces champs représentent le même identifiant conceptuel.

---

# 6. Catégorisation des tables

Chaque table est classée :

```text
GLOBAL
PLATFORM_SCOPED
TENANT_SCOPED
TENANT + APPLICATION_SCOPED
TENANT + ENVIRONMENT_SCOPED
SYSTEM_INTERNAL
```

Cette classification devient obligatoire pour les nouveaux modèles.

---

# 7. Conventions de requête

Ressource tenant-scoped :

```text
NE JAMAIS :
findUnique({ where: { id } })

SI id seul ne garantit pas l'isolation.

PRÉFÉRER :
findFirst({
  where: {
    id,
    tenantId: effectiveTenantId
  }
})
```

ou contrainte composite équivalente si appropriée.

Pour les listes :

```text
findMany({
  where: {
    tenantId: effectiveTenantId
  }
})
```

Aucun `tenantId` du body/query/header n’est autorité.

Le tenant effectif vient du contexte IAM serveur.

---

# 8. Composite Keys et Unique Constraints

Lorsque la logique le justifie :

```text
@@unique([tenantId, key])
@@unique([tenantId, applicationId, key])
@@index([tenantId])
@@index([tenantId, status])
```

Éviter les clés globales lorsqu’une unicité tenant-scoped est suffisante.

---

# 9. Foreign Keys

Toute FK doit avoir :

- type identique ;
- comportement de suppression explicite ;
- comportement d’update explicite ;
- relation Prisma cohérente ;
- migration SQL cohérente.

Ne pas utiliser `CASCADE` aveuglément sur les ressources critiques.

---

# 10. Migration Strategy

Flux obligatoire :

```text
CHANGE DESIGN
↓
AUDIT CURRENT SCHEMA
↓
GENERATE/WRITE MIGRATION
↓
STATIC REVIEW
↓
FRESH DB TEST
↓
UPGRADE DB TEST
↓
APPLICATION TESTS
↓
BACKUP/ROLLBACK PLAN
↓
DEPLOY
```

Une migration n’est pas considérée sûre simplement parce que `prisma validate` passe.

---

# 11. Baseline

Une baseline :

- représente un état cohérent ;
- doit fonctionner sur DB vide ;
- ne doit pas dépendre de migrations legacy non actives ;
- doit créer les objets dans le schéma canonique ;
- doit être compatible avec le `DATABASE_URL` documenté.

---

# 12. migrations_legacy

Les migrations historiques peuvent rester archivées.

Règles :

- clairement séparées ;
- jamais rejouées par défaut ;
- README expliquant leur statut ;
- aucun script legacy destructive dans le pipeline standard.

---

# 13. Scripts SQL manuels

Tout script du type :

```sql
DROP SCHEMA ... CASCADE;
```

est classé :

```text
DANGEROUS / MANUAL ONLY
```

Il doit exiger :

- sauvegarde ;
- approbation ;
- environnement explicite ;
- procédure de rollback ;
- interdiction CI/CD standard.

---

# 14. PostgreSQL RLS

Objectif :

ajouter une seconde ligne de défense DB pour les tables tenant-scoped.

Architecture :

```text
Request
↓
IAM Context
↓
Service Filter
↓
Transaction-scoped DB Tenant Context
↓
RLS Policy
↓
Rows Tenant only
```

RLS ne remplace pas :
- Guards ;
- permissions ;
- service filtering.

---

# 15. Propagation du tenant vers PostgreSQL

Le mécanisme exact doit être choisi après test du pool Prisma.

Approche candidate :

```text
BEGIN
SET LOCAL app.current_tenant_id = '...';
queries...
COMMIT
```

Le contexte doit être transaction-scoped afin d’éviter une fuite entre connexions du pool.

Interdit :

```text
SET app.current_tenant_id = ...
```

persistant sur une connexion réutilisée sans stratégie de reset garantie.

---

# 16. Policies RLS

Pour une table tenant-scoped :

- SELECT ;
- INSERT ;
- UPDATE ;
- DELETE.

Principe :

```text
row.tenant_id == effective db tenant context
```

Les opérations plateforme/cross-tenant doivent passer par des chemins explicitement autorisés, séparés et audités.

---

# 17. BYPASSRLS

Le compte applicatif normal :

```text
NE DOIT PAS
```

avoir `BYPASSRLS`.

Les rôles de migration/administration peuvent avoir des droits distincts selon l’architecture.

---

# 18. Database Roles

Séparer si possible :

```text
app_runtime
migration_runner
read_only_diagnostics
platform_admin_db (exceptionnel)
```

Principe du moindre privilège.

---

# 19. Transactions

Transactions requises pour :

- changement multi-table ;
- publication ;
- résolution atomique ;
- consommation de token/challenge ;
- opérations RLS context-scoped si la stratégie `SET LOCAL` est retenue.

---

# 20. Soft Delete / Status

Ne pas imposer un soft delete universel.

Chaque module décide selon son lifecycle.

Mais l’isolation tenant continue à s’appliquer aux objets archivés.

---

# 21. Audit technique DB

Les migrations importantes doivent être traçables :

- version ;
- date ;
- auteur/commit ;
- environnement ;
- résultat ;
- durée ;
- erreur ;
- rollback si appliqué.

---

# 22. Environment Configuration

Exemples requis :

```text
DATABASE_URL
DIRECT_URL si utilisé
DATABASE_SCHEMA / convention retenue
SSL mode
pool configuration
migration role config
```

`.env.example` doit refléter la réalité.

---

# 23. SSL PostgreSQL

En production :

- TLS vers PostgreSQL si infrastructure le permet ;
- vérification certificat selon fournisseur ;
- aucun credential DB frontend ;
- secrets via environment/secret manager.

---

# 24. Backup / Restore

Avant migration risquée :

- backup ;
- restore testé périodiquement ;
- objectif RPO/RTO documenté si nécessaire ;
- copie anonymisée pour recette migration.

---

# 25. Performance

Minimum :

- index `tenantId` ;
- index FK ;
- index des filtres fréquents ;
- éviter N+1 ;
- analyser les requêtes lourdes ;
- pagination.

RLS doit être testée sur performance avec index adéquats.

---

# 26. Modules consommateurs

Tous les modules tenant-scoped doivent respecter ce socle :

- IAM ;
- Business Manager ;
- UI Builder ;
- Automation ;
- Pack Manager ;
- Pack Runtime ;
- Data Runtime ;
- ERP Adapter ;
- Deployment ;
- API Manager ;
- Billing ;
- Administration.

---

# 27. Tests obligatoires

## Prisma
- validate ;
- generate ;
- schema consistency.

## Migration
- fresh DB ;
- upgrade DB ;
- rollback/documented fallback.

## Tenant
- Tenant A cannot read B ;
- cannot create B row ;
- cannot update B ;
- cannot delete B.

## RLS
- direct DB test ;
- concurrent A/B requests ;
- transaction isolation ;
- no pool leakage.

---

# 28. CI

Pipeline minimal :

```text
prisma format --check / equivalent
prisma validate
prisma generate
fresh-db migration test
backend unit/integration tests
tenant security tests
build
```

---

# 29. Definition of Done

Le socle est DONE si :

- schéma PostgreSQL canonique unique ;
- `.env.example` cohérent ;
- baseline cohérente ;
- fresh DB fonctionne ;
- upgrade DB fonctionne ;
- types `tenantId` harmonisés ;
- aucune migration destructive automatique ;
- RLS appliquée aux tables retenues ;
- compte runtime sans BYPASSRLS ;
- aucune fuite pool/RLS ;
- tests cross-tenant verts ;
- Prisma validate/generate verts ;
- backend build vert ;
- documentation de migration à jour.
