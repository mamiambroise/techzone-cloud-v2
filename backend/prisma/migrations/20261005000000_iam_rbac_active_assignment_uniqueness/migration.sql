-- Phase 8 IAM/RBAC : unicité des affectations de rôle encore actives.
--
-- Le résolveur de permissions (IamAuthorizationService) déduplique les
-- permissions, donc un doublon d'affectation n'est pas un défaut fonctionnel.
-- En revanche, il rend l'idempotence du seed indécidable : sans contrainte,
-- deux exécutions concurrentes du seed peuvent produire deux lignes actives
-- pour le même (userId, roleId, tenantId), et une révocation ultérieure n'en
-- supprime qu'une.
--
-- Index partiel : seules les affectations non révoquées et portant un
-- utilisateur sont concernées. Une affectation de groupe ou de compte de
-- service n'entre pas dans cette invariant, et une affectation historique
-- révoquée n'en bloque pas une nouvelle.
--
-- COALESCE sur "tenantId" : en PostgreSQL, NULLs sont distincts dans un index
-- btree, donc deux affectations globales (tenantId NULL) passeraient
-- l'unicité. La normalisation en chaîne vide les rend réellement uniques.
--
-- Additive uniquement : aucune colonne ni donnée existante n'est modifiée.

CREATE UNIQUE INDEX "role_assignment_active_subject_unique"
  ON business_manager.role_assignment (
    COALESCE("tenantId", ''),
    "userId",
    "roleId"
  )
  WHERE "revokedAt" IS NULL AND "userId" IS NOT NULL;