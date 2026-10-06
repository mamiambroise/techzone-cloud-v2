-- Phase 9 — Contraintes FK tenant manquantes (additive only)
--
-- Problèmes adressés :
-- 1. applications.tenantId → tenant.id (manquant)
-- 2. role_assignment.tenantId → tenant.id (manquant)
--
-- Contrainte métier : Application.tenantScope détermine tenantId
--   - GLOBAL / PAYMENTS → tenantId = NULL
--   - TENANT → tenantId NOT NULL
--
-- Sécurité : role_assignment ON DELETE CASCADE (pas SET NULL)
--   pour éviter escalade privilèges (rôle tenant → rôle global)

-- 1. FK : applications.tenantId → tenant.id
-- Type compatible : character varying(100) → text (PostgreSQL OK)
-- Phase 9 adds constraints without rewriting the immutable baseline. tenant.id
-- is TEXT; UUID identifiers in BM/Pack are unrelated and are not converted.
-- Refuse incompatible existing data rather than silently changing or deleting it.
ALTER TABLE ONLY business_manager.applications
    ALTER COLUMN "tenantId" DROP NOT NULL,
    ALTER COLUMN "tenantScope" SET DEFAULT 'TENANT';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM business_manager.applications a
    WHERE (a."tenantScope" IN ('GLOBAL', 'PAYMENTS') AND a."tenantId" IS NOT NULL)
       OR (a."tenantScope" = 'TENANT' AND a."tenantId" IS NULL)
       OR a."tenantScope" NOT IN ('GLOBAL', 'PAYMENTS', 'TENANT')
  ) THEN
    RAISE EXCEPTION 'Phase 9 cannot enforce applications tenant scope: incompatible application rows exist';
  END IF;

  IF EXISTS (
    SELECT 1 FROM business_manager.applications a
    LEFT JOIN business_manager.tenant t ON t.id = a."tenantId"
    WHERE a."tenantId" IS NOT NULL AND t.id IS NULL
  ) THEN
    RAISE EXCEPTION 'Phase 9 cannot add applications tenant FK: orphan tenantId values exist';
  END IF;

  IF EXISTS (
    SELECT 1 FROM business_manager.role_assignment ra
    LEFT JOIN business_manager.tenant t ON t.id = ra."tenantId"
    WHERE ra."tenantId" IS NOT NULL AND t.id IS NULL
  ) THEN
    RAISE EXCEPTION 'Phase 9 cannot add role_assignment tenant FK: orphan tenantId values exist';
  END IF;
END $$;

ALTER TABLE ONLY business_manager.applications
    ADD CONSTRAINT "applications_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES business_manager.tenant(id)
    ON UPDATE CASCADE ON DELETE RESTRICT;

-- 2. CHECK constraint : tenantScope / tenantId invariant
ALTER TABLE ONLY business_manager.applications
    ADD CONSTRAINT "applications_tenant_scope_tenantId_check"
    CHECK (
        ("tenantScope" IN ('GLOBAL', 'PAYMENTS') AND "tenantId" IS NULL)
        OR ("tenantScope" = 'TENANT' AND "tenantId" IS NOT NULL)
    );

-- 3. FK : role_assignment.tenantId → tenant.id
-- Type exact : text → text
-- ON DELETE CASCADE : suppression tenant → suppression affectations
-- (Sécurité : empêche transformation rôle tenant → rôle global)
ALTER TABLE ONLY business_manager.role_assignment
    ADD CONSTRAINT "role_assignment_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES business_manager.tenant(id)
    ON UPDATE CASCADE ON DELETE CASCADE;
