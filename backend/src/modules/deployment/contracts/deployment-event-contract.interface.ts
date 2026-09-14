export type DeploymentActionType =
  | 'CREATED'
  | 'VALIDATING'
  | 'GATE_CHECK'
  | 'STARTED'
  | 'HEALTH_CHECK'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'ROLLBACK_STARTED'
  | 'ROLLBACK_COMPLETED'
  | 'CANCELLED';

export interface DeploymentEventContract {
  readonly id: string;
  readonly traceId: string;
  readonly releaseId?: string | null;
  readonly deploymentId?: string | null;
  readonly applicationId?: string | null;
  readonly environmentId?: string | null;
  readonly action: DeploymentActionType;
  readonly status: string;
  readonly startedAt?: Date | null;
  readonly finishedAt?: Date | null;
  readonly duration?: number | null;
  readonly actor?: string | null;
  readonly errorCode?: string | null;
  readonly metadata?: Record<string, unknown> | null;

  sanitize(): Record<string, unknown>;
}
