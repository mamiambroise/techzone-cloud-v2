export type DeploymentGateType =
  | 'CONTRACT_COMPATIBILITY'
  | 'SNAPSHOT_VALID'
  | 'CONFIGURATION_VALID'
  | 'BUILD_AVAILABLE'
  | 'TESTS_PASS'
  | 'SECURITY_CHECK'
  | 'ENVIRONMENT_READY'
  | 'HEALTH_PRECHECK'
  | 'MANUAL_APPROVAL'
  | 'CUSTOM_REGISTERED_GATE';

export type DeploymentGateResult =
  | 'PASSED'
  | 'FAILED'
  | 'WARNING'
  | 'SKIPPED'
  | 'NOT_APPLICABLE';

export interface ValidationGateContract {
  readonly type: DeploymentGateType;
  readonly name: string;
  readonly required: boolean;
  readonly message?: string | null;

  evaluate(context: Record<string, unknown>): Promise<{
    result: DeploymentGateResult;
    message?: string;
    evidence?: Record<string, unknown>;
  }>;
}
