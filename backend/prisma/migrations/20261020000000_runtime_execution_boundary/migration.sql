BEGIN;

-- Reuse RuntimeResolution.result for the persisted context lifecycle.
CREATE UNIQUE INDEX "pr_one_active_context_per_scope"
  ON business_manager.pr_runtime_resolutions ("tenantId", "applicationId", environment)
  WHERE result->'runtimeContext'->>'status' = 'ACTIVE';

COMMIT;
