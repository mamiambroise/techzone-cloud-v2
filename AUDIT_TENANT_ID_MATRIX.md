# AUDIT MATRIX — tenantId Types (Phase 9)

## Baseline_v2 (Immutable DB State) vs Schema.prisma

### Critical Finding: tenant.id Type Mismatch
| Source | tenant.id Type |
|--------|----------------|
| **baseline_v2 (DB)** | `text NOT NULL` |
| **schema.prisma** | `String @id @default(uuid()) @db.Uuid` |

**This is a fundamental type mismatch affecting ALL foreign keys to tenant.**

---

### Complete tenantId Column Audit (baseline_v2)

| Table | DB Type | Nullable | Prisma Type | Prisma Nullable | FK in Baseline_v2 |
|-------|---------|----------|-------------|-----------------|-------------------|
| **tenant (PK)** | `text` | NOT NULL | `@db.Uuid` | Required (PK) | — |
| **applications** | `character varying(100)` | NOT NULL | `@db.Uuid` | `String?` | ❌ MISSING |
| **role_assignment** | `text` | NULL | `@db.Uuid` | `String?` | ❌ MISSING |
| **role** | `text` | NULL | `@db.Uuid` | `String?` | ✅ `ON DELETE SET NULL` |
| **organization** | `text` | NOT NULL | `@db.Uuid` | `String` | ✅ `ON DELETE RESTRICT` |
| **membership** | `text` | NOT NULL | `@db.Uuid` | `String` | ✅ `ON DELETE RESTRICT` |
| **groups** | `text` | NOT NULL | `@db.Uuid` | `String` | ✅ `ON DELETE RESTRICT` |
| **service_account** | `text` | NOT NULL | `@db.Uuid` | `String` | ✅ `ON DELETE RESTRICT` |
| **subscription** | `text` | NOT NULL | `@db.Uuid` | `String` | ✅ `ON DELETE RESTRICT` |
| **invoice** | `text` | NOT NULL | `@db.Uuid` | `String?` | ✅ `ON DELETE RESTRICT` |
| **payment** | `text` | NOT NULL | `@db.Uuid` | `String?` | — |
| **billing_account** | `text` | NOT NULL | `@db.Uuid` | `String` | — |
| **billing_adjustment** | `text` | NOT NULL | `@db.Uuid` | `String` | — |
| **billing_credit** | `text` | NOT NULL | `@db.Uuid` | `String` | — |
| **billing_event** | `text` | NOT NULL | `@db.Uuid` | `String` | — |
| **usage_aggregate** | `text` | NOT NULL | `@db.Uuid` | `String` | — |
| **usage_event** | `text` | NOT NULL | `@db.Uuid` | `String` | — |
| **access_policy** | `text` | NULL | `@db.Uuid` | `String?` | ✅ `ON DELETE SET NULL` |
| **admin_delegation** | `text` | NULL | `@db.Uuid` | `String?` | ✅ `ON DELETE SET NULL` |
| **iam_session** | `text` | NULL | `@db.Uuid` | `String?` | — |
| **security_event** | `text` | NULL | `@db.Uuid` | `String?` | — |
| **audit_event** | `text` | NULL | `@db.Uuid` | `String?` | — |
| **authorization_decision** | `text` | NULL | `@db.Uuid` | `String?` | — |
| **context_snapshot** | `text` | NULL | `@db.Uuid` | `String?` | — |
| **context_invalidation** | `text` | NULL | `@db.Uuid` | `String?` | — |
| **administrative_action** | `text` | NULL | `@db.Uuid` | `String?` | — |
| **application_versions** | `character varying(100)` | NULL | `@db.Uuid` | `String?` | — |
| **configurations** | `character varying(100)` | NULL | `@db.Uuid` | `String?` | — |
| **configuration_history** | `character varying(100)` | NULL | `@db.Uuid` | `String?` | — |
| **contracts** | `character varying(100)` | NULL | `@db.Uuid` | `String?` | — |
| **contract_history** | `character varying(100)` | NULL | `@db.Uuid` | `String?` | — |
| **deployments** | `character varying(100)` | NULL | `@db.Uuid` | `String?` | — |
| **deployment_history** | `character varying(100)` | NULL | `@db.Uuid` | `String?` | — |
| **entity_mapping** | `character varying(100)` | NULL | `@db.Uuid` | `String` | — |
| **environment_deployments** | `character varying(100)` | NULL | `@db.Uuid` | `String?` | — |
| **environment_history** | `character varying(100)` | NULL | `@db.Uuid` | `String?` | — |
| **environments** | `character varying(100)` | NULL | `@db.Uuid` | `String?` | — |
| **erp_registry** | `character varying(100)` | NULL | `@db.Uuid` | `String` | — |
| **integration_logs** | `character varying(100)` | NULL | `@db.Uuid` | `String?` | — |
| **releases** | `character varying(100)` | NULL | `@db.Uuid` | `String?` | — |
| **snapshot_history** | `character varying(100)` | NULL | `@db.Uuid` | `String?` | — |
| **snapshots** | `character varying(100)` | NULL | `@db.Uuid` | `String?` | — |
| **bm_entities** | `uuid` | NULL | `@db.Uuid` | `String?` | — |
| **bm_fields** | `uuid` | NULL | `@db.Uuid` | `String?` | — |
| **bm_features** | `uuid` | NULL | `@db.Uuid` | `String?` | — |
| **bm_relations** | `uuid` | NULL | `@db.Uuid` | `String?` | — |
| **bm_contracts** | `uuid` | NULL | `@db.Uuid` | `String?` | — |
| **bm_runtime_manifests** | `uuid` | NULL | `@db.Uuid` | `String?` | — |
| **pm_packs** | `uuid` | NOT NULL | `@db.Uuid` | `String` | — |
| **pm_pack_versions** | `uuid` | NOT NULL | `@db.Uuid` | `String` | — |
| **pm_pack_modules** | `uuid` | NOT NULL | `@db.Uuid` | `String` | — |
| **pm_pack_features** | `uuid` | NOT NULL | `@db.Uuid` | `String` | — |
| **pm_feature_capabilities** | `uuid` | NOT NULL | `@db.Uuid` | `String` | — |
| **pm_capabilities** | `uuid` | NULL | `@db.Uuid` | `String?` | — |
| **pm_dependencies** | `uuid` | NOT NULL | `@db.Uuid` | `String` | — |
| **pm_manifests** | `uuid` | NOT NULL | `@db.Uuid` | `String` | — |
| **pm_rules** | `uuid` | NOT NULL | `@db.Uuid` | `String` | — |
| **pm_snapshots** | `uuid` | NOT NULL | `@db.Uuid` | `String` | — |
| **pm_validations** | `uuid` | NOT NULL | `@db.Uuid` | `String` | — |
| **pr_runtime_resolutions** | `uuid` | NOT NULL | `@db.Uuid` | `String` | — |
| **pr_effective_manifests** | `uuid` | NOT NULL | `@db.Uuid` | `String` | — |
| **pr_runtime_diagnostics** | `uuid` | NOT NULL | `@db.Uuid` | `String` | — |
| **ui_pages** | `uuid` | NULL | `@db.Uuid` | `String?` | — |
| **ui_theme_settings** | `uuid` | NULL | `@db.Uuid` | `String?` | — |

---

### Type Distribution in baseline_v2

| DB Type | Count | Tables |
|---------|-------|--------|
| `text` | ~25 | IAM, billing, core platform tables |
| `character varying(100)` | ~20 | Platform, deployment, config tables |
| `uuid` | ~25 | BM-CDC-03/04/07/08, Pack Manager tables |

---

### Schema.prisma Assumption vs Reality

| Assumption in schema.prisma | Reality in baseline_v2 |
|----------------------------|------------------------|
| All tenantId = `@db.Uuid` | Mixed: text, varchar(100), uuid |
| tenant.id = `@db.Uuid` | tenant.id = `text` |
| All nullable `String?` | Mix of NULL and NOT NULL |

---

## Canonical Contract Determination

### Application.tenantId / tenantScope

**Business Requirement (from seed.ts and service):**
- `tenantScope = 'GLOBAL'` → `tenantId = NULL` (platform-global: techzone-core)
- `tenantScope = 'PAYMENTS'` → `tenantId = NULL` (platform payments: payment-gateway)
- `tenantScope = 'TENANT'` → `tenantId = <tenant_id>` (tenant-scoped apps)

**Invariant (CHECK constraint):**
```sql
(tenantScope IN ('GLOBAL','PAYMENTS') AND tenantId IS NULL)
OR (tenantScope = 'TENANT' AND tenantId IS NOT NULL)
```

### RoleAssignment.tenantId

**Semantics (from iam-tenant-roles.ts and iam-authorization.service.ts):**
- System roles (TENANT_USER, APPLICATION_MANAGER, TENANT_ADMIN) have `role.tenantId = NULL` (global roles)
- RoleAssignment links a user to a system role FOR a specific tenant: `role_assignment.tenantId = <tenant_id>`
- Platform_admin role has `tenantId = NULL`, NOT assignable via role_assignment (uses `iamUser.isAdmin`)

**Security Requirement:**
- `ON DELETE CASCADE` — deleting a tenant must cascade-delete its role assignments
- `ON DELETE SET NULL` would be a privilege escalation (tenant role → global role)

---

## Phase 9 Migration Plan (Additive Only)

### Prerequisites
- baseline_v2 RESTORED to immutable state ✅
- All historical migrations RESTORED ✅

### Changes Required (New Migration Only)

1. **Align Prisma schema with baseline_v2 DB types**
   - `tenant.id` → `@db.Text`
   - All `tenantId` fields matching baseline_v2 types (`@db.Text` or `@db.VarChar(100)`)
   - Keep `@db.Uuid` only for tables that already have uuid in baseline_v2 (BM/Pack)

2. **Add missing FK: applications.tenantId → tenant.id**
   - Type: `character varying(100)` → `text` (PostgreSQL allows this)
   - Add CHECK constraint for tenantScope/tenantId invariant

3. **Add missing FK: role_assignment.tenantId → tenant.id**
   - Type: `text` → `text` (exact match)
   - `ON DELETE CASCADE` (security: prevent privilege escalation)

4. **Add CHECK constraint on applications**
   - Enforce tenantScope/tenantId invariant at DB level

### Data Validation Before Migration
- Capture applications with tenantId NULL vs NOT NULL
- Capture role_assignment with tenantId NULL vs invalid tenantId
- Verify no orphan tenantId values exist

### Testing Strategy
1. Fresh DB: `prisma migrate deploy` (baseline_v2 → ... → Phase 9) → PASS
2. Existing DB copy: Apply Phase 9 only → PASS, no data loss
3. Seed test: Run seed on fresh DB → PASS
4. RBAC regression: Phase 8 tests → PASS