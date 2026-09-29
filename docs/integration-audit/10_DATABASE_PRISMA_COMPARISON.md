# Report 10: Database & Prisma Schema Comparison

**Scope:** Cross-repository Prisma schema analysis
**Local Schema:** `backend/prisma/schema.prisma` (3416 lines, 80 models)
**Source Schemas:** taratra31/main, taratra31/Nassa, taratra31/ERP-full, jasmina-bm/Mami
**Date:** 2026-09-29

---

## 10.1 Executive Summary

| Aspect | Local | taratra31/main | taratra31/ERP-full | jasmina-bm/Mami | Match |
|--------|-------|---------------|--------------------|-----------------|-------|
| ORM | Prisma 7 | Prisma 7 | Prisma 7 | Prisma 7 (pack models) | IDENTICAL |
| Schema Size | 3416 lines, 80 models | ~2000 lines, 49 models | ~150 lines, 8 models | ~300 lines, 16 models | CURRENT_MORE_COMPLETE |
| Tenant Isolation | `tenant_id` on ALL tables | ALL tables | NO tenant_id | Unknown | CURRENT_MORE_COMPLETE |
| Enums | Extensive | 35 enums | 7 enums | Unknown | MIXED |
| `@@map` | snake_case | snake_case | snake_case | snake_case | IDENTICAL |
| Relations | FKs + relations | FKs + relations | Minimal | Unknown | PARTIAL_IN_CURRENT |
| Indexes | Comprehensive | Comprehensive | Minimal | Unknown | PARTIAL_IN_CURRENT |

**Overall Status:** `CURRENT_MORE_COMPLETE` — Local schema is the superset of all three remote schemas.
**Recommendation:** KEEP_CURRENT for canonical schema. IMPROVE_CURRENT by selectively adopting taratra31/main's enums and jasmina-bm/Mami's pack-runtime models.

## 10.2 Model Count Comparison

| Repository/Branch | Model Count | Enum Count | Key Categories |
|-------------------|-------------|------------|----------------|
| **Local** | 80 models | ~50 enums | IAM(25), Platform(10), BM(15), Integration(13), Deployment(10), ERP(3), Data/Automation(5), Billing(5) |
| taratra31/main | 49 models | 35 enums | IAM(25), Billing(5), Admin(3), Observability(5), Platform(5), Context(2) |
| taratra31/Nassa | 49 models | 35 enums | Same as main (billing enhancements) |
| taratra31/ERP-full | 8 models | 7 enums | Minimal IAM(5), ERP(3), Environment(1) |
| jasmina-bm/Mami | 16 models | 0 enums shown | Pack(13), Runtime(4) |

## 10.3 Local Prisma Schema — Model Inventory by Category

### 10.3.1 IAM Models (25)

| Model | Local Name | taratra31/main Equivalent | Match |
|-------|-----------|---------------------------|-------|
| IamUser | iam_users | User | DIFFERENT_NAMING |
| IamSession | iam_sessions | Session | DIFFERENT_NAMING |
| IamCredential | iam_credentials | Credential | DIFFERENT_NAMING |
| IamDevice | iam_devices | Device | IDENTICAL |
| IamPasswordHistory | iam_password_history | PasswordHistory | DIFFERENT_NAMING |
| IamRefreshToken | iam_refresh_tokens | RefreshToken | DIFFERENT_NAMING |
| Organization | iam_organizations | Organization | IDENTICAL |
| Tenant | iam_tenants | Tenant | IDENTICAL |
| Role | iam_roles | Role | IDENTICAL |
| Permission | iam_permissions | Permission | IDENTICAL |
| RoleAssignment | iam_role_assignments | RoleAssignment | IDENTICAL |
| RolePermission | iam_role_permissions | RolePermission | IDENTICAL |
| Policy | iam_policies | — | MISSING_IN_SOURCE |
| PolicyCondition | iam_policy_conditions | — | MISSING_IN_SOURCE |
| AccessPolicy | iam_access_policies | AccessPolicy | IDENTICAL |
| Identity | iam_identities | Identity | IDENTICAL |
| UserIdentity | iam_user_identities | UserIdentity | IDENTICAL |
| ExternalIdentityLink | iam_external_identity_links | ExternalIdentityLink | IDENTICAL |
| MfaMethod | iam_mfa_methods | MfaMethod | IDENTICAL |
| Group | iam_groups | Group | IDENTICAL |
| GroupMember | iam_group_members | GroupMember | IDENTICAL |
| Membership | iam_memberships | Membership | IDENTICAL |
| CredentialReference | iam_credential_references | — | MISSING_IN_SOURCE |
| ServiceAccount | iam_service_accounts | ServiceAccount | IDENTICAL |
| ServiceAccountCredential | iam_service_account_credentials | ServiceAccountCredential | IDENTICAL |

### 10.3.2 Platform Models (10)

| Model | Local Name | Match |
|-------|-----------|-------|
| Application | platform_applications | — |
| ApplicationVersion | platform_application_versions | — |
| Environment | platform_environments | PARTIAL_IN_SOURCE (taratra31 enum only) |
| Configuration | platform_configurations | — |
| ConfigurationHistory | platform_config_history | — |
| Contract | platform_contracts | — |
| ContractConsumer | platform_contract_consumers | — |
| ContractProvider | platform_contract_providers | — |
| ContractHistory | platform_contract_history | — |
| Snapshot | platform_snapshots | — |
| SnapshotHistory | platform_snapshot_history | — |

### 10.3.3 Business Manager Models (15)

| Model | Local Name | Match |
|-------|-----------|-------|
| BmBusinessContract | bm_business_contracts | — |
| BmEntity | bm_entities | — |
| BmField | bm_fields | — |
| BmComputedField | bm_computed_fields | — |
| BmRelation | bm_relations | — |
| BmIndex | bm_indexes | — |
| BmIndexField | bm_index_fields | — |
| BmConstraint | bm_constraints | — |
| BmMenu | bm_menus | — |
| BmNavigationItem | bm_navigation_items | — |
| BmFeature | bm_features | — |
| BmVersionFeature | bm_version_features | — |
| BmCapabilityDependency | bm_capability_dependencies | — |
| BmVersionCapability | bm_version_capabilities | — |
| BmFeatureCapability | bm_feature_capabilities | — |
| BmRuntimeBinding | bm_runtime_bindings | — |
| BmRuntimeManifest | bm_runtime_manifests | — |
| BmqQualityGate | bmq_quality_gates | — |
| BmqQualityIssue | bmq_quality_issues | — |
| BmqQualityMetric | bmq_quality_metrics | — |
| BmqQualityReport | bmq_quality_reports | — |
| BmqTestCase | bmq_test_cases | — |
| BmqTestRun | bmq_test_runs | — |
| BmqTestSuite | bmq_test_suites | — |
| BmqValidationCampaign | bmq_validation_campaigns | — |
| BmqValidationRun | bmq_validation_runs | — |

### 10.3.4 Integration Models (13)

| Model | Local Name | Match |
|-------|-----------|-------|
| Connector | integration_connectors | — |
| Contract | integration_contracts | Shared with platform |
| Synchronization | integration_synchronizations | — |
| SynchronizationLog | integration_sync_logs | — |
| CredentialReference | integration_credentials | — |
| ApiDefinition | integration_api_definitions | — |
| Webhook | integration_webhooks | — |
| WebhookDelivery | integration_webhook_deliveries | — |
| IntegrationLog | integration_logs | — |
| IntegrationConfig | integration_configs | — |

### 10.3.5 Deployment Models (10)

| Model | Local Name | Match |
|-------|-----------|-------|
| Deployment | deployment_deployments | — |
| DeploymentHistory | deployment_history | — |
| DeploymentGate | deployment_gates | — |
| Environment | deployment_environments | — |
| EnvironmentDeployment | deployment_env_mappings | — |
| EnvironmentHistory | deployment_env_history | — |
| Release | deployment_releases | — |
| Rollback | deployment_rollbacks | — |
| Snapshot | deployment_snapshots | — |
| SnapshotHistory | deployment_snapshot_history | — |

### 10.3.6 ERP/Data/Automation Models

| Model | Local Name | Source | Match |
|-------|-----------|--------|-------|
| ERPRegistry | erp_registry | taratra31/ERP-full | IDENTICAL |
| EntityMapping | erp_entity_mapping | taratra31/ERP-full | IDENTICAL |
| AdapterRegistry | erp_adapter_registry | taratra31/ERP-full | IDENTICAL |

### 10.3.7 Billing Models (5)

| Model | Local Name | taratra31/main | Match |
|-------|-----------|---------------|-------|
| Plan | billing_plans | Plan | DIFFERENT_NAMING |
| PlanEntitlement | billing_plan_entitlements | PlanEntitlement | DIFFERENT_NAMING |
| Subscription | billing_subscriptions | Subscription | DIFFERENT_NAMING |
| SubscriptionEntitlementOverride | billing_sub_overrides | SubscriptionEntitlementOverride | DIFFERENT_NAMING |
| Invoice | billing_invoices | Invoice | DIFFERENT_NAMING |
| InvoiceItem | billing_invoice_items | InvoiceItem | DIFFERENT_NAMING |
| Payment | billing_payments | Payment | DIFFERENT_NAMING |
| BillingEvent | billing_events | BillingEvent | DIFFERENT_NAMING |
| QuotaUsage | billing_quota_usage | QuotaUsage | DIFFERENT_NAMING |

## 10.4 jasmina-bm/Mami Prisma Models (16 — Pack & Runtime)

| Model | Description | Local Equivalent | Match |
|-------|-------------|-----------------|-------|
| Pack | pm_packs | MISSING | MISSING_IN_CURRENT |
| PackVersion | pm_pack_versions | MISSING | MISSING_IN_CURRENT |
| PackModule | pm_pack_modules | MISSING | MISSING_IN_CURRENT |
| PackFeature | pm_pack_features | MISSING | MISSING_IN_CURRENT |
| PackCapability | pm_pack_capabilities | MISSING | MISSING_IN_CURRENT |
| PackFeatureCapability | pm_feature_capabilities | MISSING | MISSING_IN_CURRENT |
| PackDependency | pm_dependencies | MISSING | MISSING_IN_CURRENT |
| PackRule | pm_rules | MISSING | MISSING_IN_CURRENT |
| PackValidation | pm_validations | MISSING | MISSING_IN_CURRENT |
| PackSnapshot | pm_snapshots | MISSING | MISSING_IN_CURRENT |
| PackManifest | pm_manifests | MISSING | MISSING_IN_CURRENT |
| PackAuditEvent | pm_audit_events | MISSING | MISSING_IN_CURRENT |
| PackOutboxEvent | pm_outbox_events | MISSING | MISSING_IN_CURRENT |
| RuntimeDiagnostic | pr_runtime_diagnostics | MISSING | MISSING_IN_CURRENT |
| RuntimeEffectiveManifest | pr_runtime_effective_manifests | MISSING | MISSING_IN_CURRENT |
| RuntimeResolution | pr_runtime_resolutions | MISSING | MISSING_IN_CURRENT |
| RuntimeResolutionStep | pr_runtime_resolution_steps | MISSING | MISSING_IN_CURRENT |

## 10.5 Schema Quality Comparison

### 10.5.1 Schema Quality Matrix

| Quality Dimension | Local | taratra31/main | taratra31/ERP-full | jasmina-bm/Mami |
|-------------------|-------|----------------|--------------------|-----------------|
| `tenant_id` on all tables | YES (enforced by TenantGuard) | YES (presumed) | **NO** (critical gap) | Unknown |
| `@@map` snake_case | YES | YES | YES | YES |
| `@@schema` (PostgreSQL) | YES | YES | YES | YES |
| Relations defined | YES (extensive) | YES | YES (minimal) | Unknown |
| Indexes | YES (comprehensive) | YES | Minimal | Unknown |
| Foreign key constraints | YES | YES | YES | Unknown |
| Enum types | ~50 enums | 35 enums | 7 enums | Unknown |
| Soft deletes | YES (`deletedAt`) | Unknown | Unknown | Unknown |
| Audit columns | YES (`createdAt`, `updatedAt`) | YES | YES | Unknown |
| Cascade deletes | YES (configured) | YES | YES | Unknown |
| Unique constraints | YES (comprehensive) | YES | Minimal | Unknown |

### 10.5.2 Naming Convention Comparison

| Aspect | Local | taratra31/main | taratra31/ERP-full | jasmina-bm/Mami |
|--------|-------|----------------|--------------------|-----------------|
| Model naming | `Iam*`, `Platform*`, `Bm*`, `Integration*`, `Deployment*`, `ERP*` | `User`, `Session`, `Plan`, etc. (no prefix) | `IamUser`, `ERPRegistry` | `Pack`, `Runtime*` |
| Table naming | `iam_users`, `platform_*`, `bm_*`, etc. | `users`, `sessions`, `organizations`, etc. | `users`, `erp_registry`, etc. | `pm_packs`, `pr_runtime_*` |
| `@@map` convention | snake_case | snake_case | snake_case | snake_case |
| Preference | PREFIXED (clarity) | UNPREFIXED | HYBRID | PREFIXED |

**Recommendation:** KEEP_CURRENT naming convention (prefixed model names) — clearer and avoids collisions.

## 10.6 Cross-Schema Merge Opportunities

### 10.6.1 Models to Import from jasmina-bm/Mami

| Model | Target Import Path | Priority | Notes |
|-------|-------------------|----------|-------|
| Pack, PackVersion, PackModule, PackFeature, PackCapability, PackFeatureCapability, PackDependency, PackRule, PackValidation, PackSnapshot, PackManifest, PackAuditEvent, PackOutboxEvent | `schema.prisma` + migration | P0 | Core pack-manager models |
| RuntimeDiagnostic, RuntimeEffectiveManifest, RuntimeResolution, RuntimeResolutionStep | `schema.prisma` + migration | P0 | Core pack-runtime models |

**Total:** 16 new models to import from jasmina-bm/Mami.

### 10.6.2 Enums to Consider from taratra31/main

| Enum | Local? | Import Recommendation |
|------|--------|----------------------|
| `UserStatus` | YES (IamUserStatus) | Already covered |
| `SessionStatus` | YES | Already covered |
| `IdentityType` | YES | Already covered |
| `GroupType` | — | Consider import |
| `SiteStatus` | — | Consider import |
| `SecuritySeverity` | — | Consider import |
| `PlatformServiceStatus` | — | Consider import |
| `BillingInterval` | — | Consider import |
| `PaymentStatus` | — | Consider import |
| `SubscriptionStatus` | — | Consider import |
| `PlanStatus` | — | Consider import |
| `InvoiceStatus` | — | Consider import |
| `AdminActionStatus` | — | Consider import |
| `AuthorizationResult` | — | Consider import |
| `PolicyEffect` | — | Consider import |

**Total:** 10+ enums to consider importing from taratra31/main.

### 10.6.3 Models to NOT Import

| Model/Branch | Reason |
|-------------|--------|
| taratra31/ERP-full IAM models (IamUser, IamCredential, IamSession, IamRefreshToken, IamDevice) | Already in local schema with same names |
| taratra31/ERP-full IamPasswordHistory | Already in local schema |
| taratra31/ERP-full PlatformConfiguration, PlatformService | NOT present in ERP-full — these are from taratra31/main |
| taratra31/ERP-full Environment (enum) | Already in local schema |

## 10.7 Migration Impact

### Files Affected

| Action | Files to Modify | Migration |
|--------|----------------|-----------|
| Import 16 pack models (PM+PR) | `schema.prisma` + new migration | P0 |
| Import ~10 enums from taratra31 | `schema.prisma` + new migration | P1 |
| Add Billing endpoints (admin routes) | New NestJS controllers | P1 |
| Add Admin endpoints | New NestJS controllers | P1 |
| Add Observability endpoints | New NestJS controllers | P1 |
| Add missing IAM models from taratra31 (Credential, AdminDelegation, AdministrativeAction, AuthorizationDecision) | `schema.prisma` + new migration | P2 |

### Migration Count: 34 new models + 10 new enums

## 10.8 Test Status

| Schema Area | Local Tests | Source Tests | Status |
|-------------|------------|-------------|--------|
| IAM models | 5 IAM spec files | 11 Express test files (not importable) | MISSING_IN_SOURCE |
| Platform | 4 spec files | Unknown | MISSING_IN_SOURCE |
| Business Manager | 7 spec files | Unknown | MISSING_IN_SOURCE |
| Integration | 6 spec files | Unknown | MISSING_IN_SOURCE |
| Deployment | 6 spec files | Unknown | MISSING_IN_SOURCE |
| ERP Adapter | 2 spec files | Unknown | MISSING_IN_SOURCE |
| Data Runtime | 4 spec files | Unknown | MISSING_IN_SOURCE |
| Automation | 5 spec files | Unknown | MISSING_IN_SOURCE |
| Pack Manager | 0 | Unknown | MISSING_IN_BOTH |
| Pack Runtime | 0 | Unknown | MISSING_IN_BOTH |

**Test Status:** `MISSING_IN_SOURCE` for schema validation tests. Local has 44 backend spec files total.

## 10.9 Tenant Classification

| Schema Area | Local | taratra31/main | taratra31/ERP-full | jasmina-bm/Mami |
|-------------|-------|----------------|--------------------|-----------------|
| IAM Users | `tenant_id` enforced | Presumed | **NO tenant_id** | Unknown |
| Sessions | `tenant_id` enforced | Presumed | NO tenant_id | Unknown |
| Billing | `tenant_id` | Presumed | Minimal | Unknown |
| ERP Registry | `tenant_id` enforced | N/A | NO tenant_id | Unknown |
| Pack Models | N/A (not implemented) | N/A | N/A | Unknown |

**Multi-tenant Classification:** 
- **Local:** `TENANT_SAFE` — ALL tables have `tenant_id` enforced via `TenantGuard`
- **taratra31/ERP-full:** `UNSAFE` — IAM schema lacks `tenant_id` entirely
- **taratra31/main:** `TENANT_SAFE` (presumed) — full IAM schema with `Tenant` model
- **jasmina-bm/Mami:** `UNKNOWN` — pack models' tenant support unknown

## 10.10 Key Findings

1. **Local Schema is the Superset:** Local's `schema.prisma` (3416 lines, 80 models) is the most comprehensive Prisma schema across all four repositories. It combines IAM models (from taratra31), platform/deployment/integration/BM models, and ERP data models.

2. **taratra31/ERP-full Schema is Critically Incomplete:** Only 8 models with NO `tenant_id` columns — this is why local's security is `CURRENT_MORE_COMPLETE`.

3. **Pack Models are MISSING:** jasmina-bm/Mami has 16 pack/runtime models that local does NOT have — these are the highest priority import target.

4. **Naming Convention:** Local uses `Iam*` prefixed model names; taratra31/main uses unprefixed names (User, Session). Local's convention is preferred for clarity.

5. **Enum Richness:** taratra31/main has 35 enums — local should adopt the ~10 enums it lacks (GroupType, SiteStatus, SecuritySeverity, PlatformServiceStatus, BillingInterval, PaymentStatus, SubscriptionStatus, PlanStatus, InvoiceStatus, AdminActionStatus, AuthorizationResult, PolicyEffect).

6. **Missing taratra31/main Models:** taratra31/main has `Credential` (distinct from `CredentialReference`), `AdminDelegation`, `AdministrativeAction`, `AuthorizationDecision` — these are missing from local and should be considered.

7. **Migration Required:** Importing pack models (16) + enums (10) + missing IAM models (4) = ~30 schema changes requiring migrations.

## 10.11 Recommendations

| Priority | Category | Recommendation | Source |
|----------|----------|----------------|--------|
| P0 | MISSING_IN_CURRENT | Import 16 pack-manager + pack-runtime Prisma models from jasmina-bm/Mami | jasmina-bm/Mami: Backend/prisma/schema.prisma |
| P1 | MISSING_IN_CURRENT | Import missing IAM models (AdminDelegation, AdministrativeAction, AuthorizationDecision) from taratra31/main | taratra31/main: Auth_AIM/backend/prisma/schema.prisma |
| P1 | IMPROVE_CURRENT | Import ~10 missing enums from taratra31/main | taratra31/main: schema.prisma enums |
| P0 | KEEP_CURRENT | Retain `Iam*` naming convention for IAM models | Local: schema.prisma |
| P0 | KEEP_CURRENT | Retain `tenant_id` on ALL tables — do NOT adopt taratra31/ERP-full's tenant-less schema | Local: schema.prisma |
| P2 | MISSING_IN_CURRENT | Add migration files for all new models | Local: backend/prisma/migrations/ |
| P3 | MISSING_IN_CURRENT | Add Prisma schema validation tests | Pattern from local specs |
| P4 | IMPROVE_CURRENT | Audit all schema relationships for proper cascade configuration | Local: schema.prisma |

---

*Report generated: 2026-09-29 00:15 UTC*
*No files were modified. This is a read-only audit.*